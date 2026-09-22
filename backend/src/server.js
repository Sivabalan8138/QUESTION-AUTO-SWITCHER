const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initDB, getDB } = require('./database');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

let currentTimerInterval = null;

async function broadcastState() {
  const db = getDB();
  const activity = await db.get('SELECT * FROM activity WHERE id = 1');
  let currentQuestion = null;
  
  if (activity.current_question_id) {
    currentQuestion = await db.get('SELECT * FROM questions WHERE id = ?', activity.current_question_id);
  }

  const totalQuestions = (await db.get('SELECT COUNT(*) as count FROM questions')).count;
  const currentQuestionNumber = currentQuestion ? (await db.get('SELECT COUNT(*) as count FROM questions WHERE question_order <= ?', currentQuestion.question_order)).count : 0;

  io.emit('display:state_update', {
    activity,
    currentQuestion,
    currentQuestionNumber,
    totalQuestions
  });
}

async function startTimer() {
  if (currentTimerInterval) clearInterval(currentTimerInterval);
  
  const db = getDB();
  const activity = await db.get('SELECT * FROM activity WHERE id = 1');
  let timeLeft = activity.timer_state;

  currentTimerInterval = setInterval(async () => {
    if (timeLeft > 0) {
      timeLeft--;
      await db.run('UPDATE activity SET timer_state = ? WHERE id = 1', timeLeft);
      io.emit('timer:tick', timeLeft);
    } else {
      clearInterval(currentTimerInterval);
      await nextQuestion();
    }
  }, 1000);
}

function pauseTimer() {
  if (currentTimerInterval) {
    clearInterval(currentTimerInterval);
    currentTimerInterval = null;
  }
}

async function nextQuestion() {
  pauseTimer();
  const db = getDB();
  const activity = await db.get('SELECT * FROM activity WHERE id = 1');
  
  if (!activity.current_question_id) return;
  
  const currentQuestion = await db.get('SELECT * FROM questions WHERE id = ?', activity.current_question_id);
  const nextQ = await db.get('SELECT * FROM questions WHERE question_order > ? ORDER BY question_order ASC LIMIT 1', currentQuestion.question_order);
  
  if (nextQ) {
    await db.run('UPDATE activity SET current_question_id = ?, timer_state = ? WHERE id = 1', nextQ.id, nextQ.time_limit);
    await broadcastState();
    if (activity.status === 'running') {
      startTimer();
    }
  } else {
    // Finished
    await db.run('UPDATE activity SET status = "finished" WHERE id = 1');
    await broadcastState();
  }
}

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  broadcastState(); // Send initial state

  socket.on('admin:start', async () => {
    const db = getDB();
    const activity = await db.get('SELECT * FROM activity WHERE id = 1');
    
    if (activity.status === 'idle') {
      const firstQ = await db.get('SELECT * FROM questions ORDER BY question_order ASC LIMIT 1');
      if (firstQ) {
        await db.run('UPDATE activity SET status = "running", current_question_id = ?, timer_state = ? WHERE id = 1', firstQ.id, firstQ.time_limit);
      }
    } else if (activity.status === 'paused') {
      await db.run('UPDATE activity SET status = "running" WHERE id = 1');
    }
    await broadcastState();
    startTimer();
  });

  socket.on('admin:pause', async () => {
    pauseTimer();
    const db = getDB();
    await db.run('UPDATE activity SET status = "paused" WHERE id = 1');
    await broadcastState();
  });

  socket.on('admin:next', async () => {
    await nextQuestion();
  });

  socket.on('admin:prev', async () => {
    pauseTimer();
    const db = getDB();
    const activity = await db.get('SELECT * FROM activity WHERE id = 1');
    if (!activity.current_question_id) return;

    const currentQuestion = await db.get('SELECT * FROM questions WHERE id = ?', activity.current_question_id);
    const prevQ = await db.get('SELECT * FROM questions WHERE question_order < ? ORDER BY question_order DESC LIMIT 1', currentQuestion.question_order);
    
    if (prevQ) {
      await db.run('UPDATE activity SET current_question_id = ?, timer_state = ? WHERE id = 1', prevQ.id, prevQ.time_limit);
      await broadcastState();
      if (activity.status === 'running') {
        startTimer();
      }
    }
  });

  socket.on('admin:restart_question', async () => {
    pauseTimer();
    const db = getDB();
    const activity = await db.get('SELECT * FROM activity WHERE id = 1');
    if (activity.current_question_id) {
      const currentQuestion = await db.get('SELECT * FROM questions WHERE id = ?', activity.current_question_id);
      await db.run('UPDATE activity SET timer_state = ? WHERE id = 1', currentQuestion.time_limit);
      await broadcastState();
      if (activity.status === 'running') {
        startTimer();
      }
    }
  });

  socket.on('admin:restart_activity', async () => {
    pauseTimer();
    const db = getDB();
    await db.run('UPDATE activity SET status = "idle", current_question_id = NULL, timer_state = 0 WHERE id = 1');
    await broadcastState();
  });
  
  socket.on('admin:finish', async () => {
    pauseTimer();
    const db = getDB();
    await db.run('UPDATE activity SET status = "finished" WHERE id = 1');
    await broadcastState();
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// REST API for Questions
app.get('/api/questions', async (req, res) => {
  const db = getDB();
  const questions = await db.all('SELECT * FROM questions ORDER BY question_order ASC');
  res.json(questions);
});

app.post('/api/questions', async (req, res) => {
  const { question, option_a, option_b, option_c, option_d, time_limit, question_order } = req.body;
  const db = getDB();
  const result = await db.run(
    'INSERT INTO questions (question, option_a, option_b, option_c, option_d, time_limit, question_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [question, option_a, option_b, option_c, option_d, time_limit, question_order]
  );
  res.json({ id: result.lastID });
});

app.put('/api/questions/:id', async (req, res) => {
  const { question, option_a, option_b, option_c, option_d, time_limit, question_order } = req.body;
  const db = getDB();
  await db.run(
    'UPDATE questions SET question = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, time_limit = ?, question_order = ? WHERE id = ?',
    [question, option_a, option_b, option_c, option_d, time_limit, question_order, req.params.id]
  );
  res.json({ success: true });
});

app.delete('/api/questions/:id', async (req, res) => {
  const db = getDB();
  await db.run('DELETE FROM questions WHERE id = ?', req.params.id);
  res.json({ success: true });
});

app.delete('/api/questions', async (req, res) => {
  const db = getDB();
  await db.run('DELETE FROM questions');
  await db.run('UPDATE activity SET status = "idle", current_question_id = NULL, timer_state = 0 WHERE id = 1');
  await broadcastState();
  res.json({ success: true });
});

app.post('/api/questions/reorder', async (req, res) => {
  const { reorderedQuestions } = req.body; // Array of { id, question_order }
  const db = getDB();
  for (const q of reorderedQuestions) {
    await db.run('UPDATE questions SET question_order = ? WHERE id = ?', [q.question_order, q.id]);
  }
  res.json({ success: true });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // Simple check for MVP. In prod use env vars.
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, token: 'fake-jwt-token' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

const PORT = process.env.PORT || 3001;

// Serve frontend build
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Catch-all route to serve index.html for React Router
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database', err);
});

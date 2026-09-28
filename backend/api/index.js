const express = require('express');
const cors = require('cors');
const { initDB, sql } = require('./database');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure multer for image uploads
// WARNING: On Vercel, the local filesystem is read-only and ephemeral except for /tmp.
// Uploaded images will disappear when the function sleeps. In production, use Vercel Blob or AWS S3.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = '/tmp/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

const app = express();
app.use(cors());
app.use(express.json());

// Initialize DB on first request (Serverless paradigm)
let dbInitialized = false;
async function ensureDB() {
  if (!dbInitialized) {
    try {
      await initDB();
      dbInitialized = true;
    } catch (e) {
      console.error("DB Init Error:", e);
    }
  }
}

// -----------------------------------------------------
// STATE & COMMANDS (Replaces Socket.io)
// -----------------------------------------------------

app.get('/api/state', async (req, res) => {
  await ensureDB();
  try {
    const activityRes = await sql`SELECT * FROM activity WHERE id = 1`;
    const activity = activityRes.rows[0];
    let currentQuestion = null;
    let currentQuestionNumber = 0;
    
    // Disable caching completely
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    // Format started_at to guarantee UTC parsing
    if (activity.started_at && typeof activity.started_at === 'string' && !activity.started_at.includes('T')) {
      activity.started_at = activity.started_at.replace(' ', 'T') + 'Z';
    }

    // Auto-switch logic
    if (activity.status === 'running' && activity.started_at) {
      const startedAt = new Date(activity.started_at).getTime();
      const serverNow = Date.now();
      const elapsed = Math.floor((serverNow - startedAt) / 1000);
      
      if (elapsed >= activity.time_limit) {
        const currRes = await sql`SELECT * FROM questions WHERE id = ${activity.current_question_id}`;
        if (currRes.rows.length > 0) {
          const curr = currRes.rows[0];
          const nextRes = await sql`SELECT * FROM questions WHERE question_order > ${curr.question_order} ORDER BY question_order ASC LIMIT 1`;
          if (nextRes.rows.length > 0) {
            const nextQ = nextRes.rows[0];
            await sql`UPDATE activity SET status = 'running', current_question_id = ${nextQ.id}, time_limit = ${nextQ.time_limit}, started_at = CURRENT_TIMESTAMP, paused_time_left = ${nextQ.time_limit}`;
            const newActivityRes = await sql`SELECT * FROM activity WHERE id = 1`;
            Object.assign(activity, newActivityRes.rows[0]);
            if (activity.started_at && typeof activity.started_at === 'string' && !activity.started_at.includes('T')) {
              activity.started_at = activity.started_at.replace(' ', 'T') + 'Z';
            }
          } else {
            await sql`UPDATE activity SET status = 'finished'`;
            activity.status = 'finished';
          }
        }
      }
    }
    
    if (activity.current_question_id) {
      const qRes = await sql`SELECT * FROM questions WHERE id = ${activity.current_question_id}`;
      currentQuestion = qRes.rows[0];
      
      const numRes = await sql`SELECT COUNT(*) as count FROM questions WHERE question_order <= ${currentQuestion.question_order}`;
      currentQuestionNumber = parseInt(numRes.rows[0].count);
    }

    const totalRes = await sql`SELECT COUNT(*) as count FROM questions`;
    const totalQuestions = parseInt(totalRes.rows[0].count);

    res.json({
      activity: {
        ...activity,
        // Send server time so client can calculate elapsed time accurately
        server_now: Date.now()
      },
      currentQuestion,
      currentQuestionNumber,
      totalQuestions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/command', async (req, res) => {
  await ensureDB();
  const { command } = req.body;
  
  try {
    const activityRes = await sql`SELECT * FROM activity WHERE id = 1`;
    const activity = activityRes.rows[0];
    
    switch (command) {
      case 'admin:start': {
        if (activity.status === 'idle' || activity.status === 'finished') {
          const firstQRes = await sql`SELECT * FROM questions ORDER BY question_order ASC LIMIT 1`;
          const firstQ = firstQRes.rows[0];
          if (firstQ) {
            await sql`UPDATE activity SET status = 'running', current_question_id = ${firstQ.id}, time_limit = ${firstQ.time_limit}, started_at = CURRENT_TIMESTAMP`;
          }
        } else if (activity.status === 'paused') {
          // Adjust started_at to account for time spent paused
          await sql`UPDATE activity SET status = 'running', started_at = CURRENT_TIMESTAMP - interval '1 second' * (time_limit - paused_time_left)`;
        }
        break;
      }
      case 'admin:pause': {
        // Calculate remaining time and save it
        if (activity.status === 'running') {
          const dbNow = await sql`SELECT CURRENT_TIMESTAMP as now, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at)) as elapsed FROM activity WHERE id = 1`;
          const elapsed = dbNow.rows[0].elapsed || 0;
          const timeLeft = Math.max(0, activity.time_limit - elapsed);
          await sql`UPDATE activity SET status = 'paused', paused_time_left = ${timeLeft}`;
        }
        break;
      }
      case 'admin:next': {
        if (!activity.current_question_id) break;
        const currRes = await sql`SELECT * FROM questions WHERE id = ${activity.current_question_id}`;
        const curr = currRes.rows[0];
        
        const nextRes = await sql`SELECT * FROM questions WHERE question_order > ${curr.question_order} ORDER BY question_order ASC LIMIT 1`;
        const nextQ = nextRes.rows[0];
        
        if (nextQ) {
          await sql`UPDATE activity SET current_question_id = ${nextQ.id}, time_limit = ${nextQ.time_limit}, started_at = CURRENT_TIMESTAMP`;
        } else {
          await sql`UPDATE activity SET status = 'finished'`;
        }
        break;
      }
      case 'admin:prev': {
        if (!activity.current_question_id) break;
        const currRes = await sql`SELECT * FROM questions WHERE id = ${activity.current_question_id}`;
        const curr = currRes.rows[0];
        
        const prevRes = await sql`SELECT * FROM questions WHERE question_order < ${curr.question_order} ORDER BY question_order DESC LIMIT 1`;
        const prevQ = prevRes.rows[0];
        
        if (prevQ) {
          await sql`UPDATE activity SET current_question_id = ${prevQ.id}, time_limit = ${prevQ.time_limit}, started_at = CURRENT_TIMESTAMP`;
        }
        break;
      }
      case 'admin:restart_question': {
        if (activity.current_question_id) {
          const currRes = await sql`SELECT * FROM questions WHERE id = ${activity.current_question_id}`;
          const curr = currRes.rows[0];
          await sql`UPDATE activity SET started_at = CURRENT_TIMESTAMP, time_limit = ${curr.time_limit}, paused_time_left = ${curr.time_limit}`;
        }
        break;
      }
      case 'admin:restart_activity': {
        await sql`UPDATE activity SET status = 'idle', current_question_id = NULL, time_limit = 0, started_at = NULL`;
        break;
      }
      case 'admin:finish': {
        await sql`UPDATE activity SET status = 'finished'`;
        break;
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------
// REST API for Questions
// -----------------------------------------------------

app.get('/api/questions', async (req, res) => {
  await ensureDB();
  const questions = await sql`SELECT * FROM questions ORDER BY question_order ASC`;
  res.json(questions.rows);
});

app.post('/api/questions', async (req, res) => {
  await ensureDB();
  const { question, option_a, option_b, option_c, option_d, time_limit, question_order, image_url } = req.body;
  const result = await sql`
    INSERT INTO questions (question, option_a, option_b, option_c, option_d, time_limit, question_order, image_url) 
    VALUES (${question}, ${option_a}, ${option_b}, ${option_c}, ${option_d}, ${time_limit}, ${question_order}, ${image_url})
    RETURNING id
  `;
  res.json({ id: result.rows[0].id });
});

app.put('/api/questions/:id', async (req, res) => {
  await ensureDB();
  const { question, option_a, option_b, option_c, option_d, time_limit, question_order, image_url } = req.body;
  await sql`
    UPDATE questions 
    SET question = ${question}, option_a = ${option_a}, option_b = ${option_b}, option_c = ${option_c}, option_d = ${option_d}, time_limit = ${time_limit}, question_order = ${question_order}, image_url = ${image_url} 
    WHERE id = ${req.params.id}
  `;
  res.json({ success: true });
});

app.delete('/api/questions/:id', async (req, res) => {
  await ensureDB();
  await sql`DELETE FROM questions WHERE id = ${req.params.id}`;
  res.json({ success: true });
});

app.delete('/api/questions', async (req, res) => {
  await ensureDB();
  await sql`DELETE FROM questions`;
  await sql`UPDATE activity SET status = 'idle', current_question_id = NULL, time_limit = 0`;
  res.json({ success: true });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, token: 'fake-jwt-token' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.json({ success: true, url: '/uploads/' + req.file.filename });
});

// Serve uploads
app.use('/uploads', express.static('/tmp/uploads'));

// Serve frontend build (For local dev only; Vercel handles static routing directly)
const frontendPath = path.join(__dirname, '../dist');
app.use(express.static(frontendPath));

// Catch-all route to serve index.html for React Router (For local dev only)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// For Vercel Serverless Function, export the app
module.exports = app;

// For local testing:
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

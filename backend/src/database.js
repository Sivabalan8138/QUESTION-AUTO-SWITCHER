const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');

let db;

async function initDB() {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      time_limit INTEGER NOT NULL,
      question_order INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'idle',
      current_question_id INTEGER,
      timer_state INTEGER
    );
  `);

  // Insert default activity state if not exists
  const activity = await db.get('SELECT * FROM activity WHERE id = 1');
  if (!activity) {
    await db.run('INSERT INTO activity (id, name, status, current_question_id, timer_state) VALUES (1, "TECHNICAL QUESTION CHALLENGE", "idle", NULL, 0)');
  }

  // Insert sample questions if table is empty
  const count = await db.get('SELECT COUNT(*) as count FROM questions');
  if (count.count === 0) {
    const samples = [
      ['Which device is used to protect a circuit from excessive current?', 'Capacitor', 'Transformer', 'Fuse', 'Resistor', 10, 1],
      ['What is the SI unit of resistance?', 'Volt', 'Ohm', 'Ampere', 'Watt', 10, 2],
      ['Which law relates voltage, current and resistance?', "Faraday's Law", "Ohm's Law", "Kirchhoff's Law", "Lenz's Law", 15, 3],
      ['What is the function of a transformer?', 'Convert AC to DC', 'Step up/down voltage', 'Store charge', 'Generate power', 10, 4],
      ['Which component stores electrical energy in an electric field?', 'Inductor', 'Resistor', 'Capacitor', 'Diode', 10, 5],
      ['What is the unit of electrical power?', 'Joule', 'Watt', 'Volt', 'Ampere', 10, 6],
      ['Which device converts electrical energy into mechanical energy?', 'Generator', 'Motor', 'Transformer', 'Battery', 10, 7],
      ['What is the purpose of a circuit breaker?', 'Increase voltage', 'Protect circuit from overload', 'Convert AC to DC', 'Store energy', 15, 8],
      ['Which semiconductor device is commonly used for switching?', 'Resistor', 'Capacitor', 'Transistor', 'Inductor', 10, 9],
      ['What is the frequency of standard AC supply in India?', '50 Hz', '60 Hz', '100 Hz', '120 Hz', 10, 10]
    ];

    for (const sample of samples) {
      await db.run(
        'INSERT INTO questions (question, option_a, option_b, option_c, option_d, time_limit, question_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        sample
      );
    }
  }

  return db;
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

module.exports = { initDB, getDB };

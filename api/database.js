const { sql } = require('@vercel/postgres');

async function initDB() {
  // Create Questions Table
  await sql`
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      time_limit INTEGER NOT NULL,
      question_order INTEGER NOT NULL,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Create Activity Table
  await sql`
    CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'idle',
      current_question_id INTEGER,
      time_limit INTEGER DEFAULT 0,
      paused_time_left INTEGER DEFAULT 0,
      started_at TIMESTAMP
    );
  `;

  // Insert default activity state if not exists
  const activityCountRes = await sql`SELECT COUNT(*) FROM activity WHERE id = 1`;
  if (parseInt(activityCountRes.rows[0].count) === 0) {
    await sql`INSERT INTO activity (id, name, status, current_question_id, time_limit, paused_time_left, started_at) 
              VALUES (1, 'TECHNICAL QUESTION CHALLENGE', 'idle', NULL, 0, 0, NULL)`;
  }

  // Insert sample questions if table is empty
  const countRes = await sql`SELECT COUNT(*) FROM questions`;
  if (parseInt(countRes.rows[0].count) === 0) {
    const samples = [
      ['Which device is used to protect a circuit from excessive current?', 'Capacitor', 'Transformer', 'Fuse', 'Resistor', 10, 1, null],
      ['What is the SI unit of resistance?', 'Volt', 'Ohm', 'Ampere', 'Watt', 10, 2, null],
      ['Which law relates voltage, current and resistance?', "Faraday's Law", "Ohm's Law", "Kirchhoff's Law", "Lenz's Law", 15, 3, null],
      ['What is the function of a transformer?', 'Convert AC to DC', 'Step up/down voltage', 'Store charge', 'Generate power', 10, 4, null],
      ['Which component stores electrical energy in an electric field?', 'Inductor', 'Resistor', 'Capacitor', 'Diode', 10, 5, null],
      ['What is the unit of electrical power?', 'Joule', 'Watt', 'Volt', 'Ampere', 10, 6, null],
      ['Which device converts electrical energy into mechanical energy?', 'Generator', 'Motor', 'Transformer', 'Battery', 10, 7, null],
      ['What is the purpose of a circuit breaker?', 'Increase voltage', 'Protect circuit from overload', 'Convert AC to DC', 'Store energy', 15, 8, null],
      ['Which semiconductor device is commonly used for switching?', 'Resistor', 'Capacitor', 'Transistor', 'Inductor', 10, 9, null],
      ['What is the frequency of standard AC supply in India?', '50 Hz', '60 Hz', '100 Hz', '120 Hz', 10, 10, null]
    ];

    for (const sample of samples) {
      await sql`
        INSERT INTO questions (question, option_a, option_b, option_c, option_d, time_limit, question_order, image_url) 
        VALUES (${sample[0]}, ${sample[1]}, ${sample[2]}, ${sample[3]}, ${sample[4]}, ${sample[5]}, ${sample[6]}, ${sample[7]})
      `;
    }
  }
}

module.exports = { initDB };

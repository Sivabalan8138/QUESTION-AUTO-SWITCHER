if (process.env.POSTGRES_DATABASE_URL && !process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = process.env.POSTGRES_DATABASE_URL;
}
const isVercel = !!(process.env.POSTGRES_URL || process.env.VERCEL);

let sqlWrapper;
let initDBWrapper;

if (isVercel) {
  const { sql } = require('@vercel/postgres');
  sqlWrapper = sql;

  initDBWrapper = async function() {
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

    const activityCountRes = await sql`SELECT COUNT(*) as count FROM activity WHERE id = 1`;
    if (parseInt(activityCountRes.rows[0].count) === 0) {
      await sql`INSERT INTO activity (id, name, status, current_question_id, time_limit, paused_time_left, started_at) 
                VALUES (1, 'TECHNICAL QUESTION CHALLENGE', 'idle', NULL, 0, 0, NULL)`;
    }
  };
} else {
  let Database;
  try {
    Database = require('better-sqlite3');
  } catch (e) {
    console.warn("better-sqlite3 not found, this is fine if running on Vercel.");
  }
  
  if (Database) {
    const path = require('path');
    const dbPath = path.join(__dirname, '../local.db');
    const db = new Database(dbPath);

    sqlWrapper = function(strings, ...values) {
      try {
        let query = '';
        const params = [];
        for (let i = 0; i < strings.length; i++) {
          query += strings[i];
          if (i < values.length) {
            query += '?';
            params.push(values[i]);
          }
        }
        
        if (query.includes("CURRENT_TIMESTAMP - interval '1 second' * (time_limit - paused_time_left)")) {
           query = query.replace("CURRENT_TIMESTAMP - interval '1 second' * (time_limit - paused_time_left)", "datetime('now', '-' || (time_limit - paused_time_left) || ' seconds')");
        }
        if (query.includes("EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))")) {
           query = query.replace("EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))", "CAST((julianday('now') - julianday(started_at)) * 86400 AS INTEGER)");
        }
        if (query.includes("SERIAL PRIMARY KEY")) {
           query = query.replace("SERIAL PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT");
        }

        const stmt = db.prepare(query);
        if (query.trim().toUpperCase().startsWith('SELECT') || query.trim().toUpperCase().startsWith('WITH') || query.includes('RETURNING')) {
          const rows = stmt.all(...params);
          return Promise.resolve({ rows });
        } else {
          const info = stmt.run(...params);
          return Promise.resolve({ rows: [], rowCount: info.changes });
        }
      } catch (err) {
        console.error("SQL Error: ", err);
        return Promise.reject(err);
      }
    };

    initDBWrapper = async function() {
      await sqlWrapper`
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

      await sqlWrapper`
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

      const activityCountRes = await sqlWrapper`SELECT COUNT(*) as count FROM activity WHERE id = 1`;
      if (parseInt(activityCountRes.rows[0].count) === 0) {
        await sqlWrapper`INSERT INTO activity (id, name, status, current_question_id, time_limit, paused_time_left, started_at) 
                  VALUES (1, 'TECHNICAL QUESTION CHALLENGE', 'idle', NULL, 0, 0, NULL)`;
      }
    };
  }
}

module.exports = { initDB: initDBWrapper, sql: sqlWrapper };

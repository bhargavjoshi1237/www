import express from 'express';
import sqlite3 from 'sqlite3';
import { join } from 'path';

const app = express();

// SQLite file path inside the Vercel temp folder
const dbFile = join('/tmp', 'data.db');
const db = new sqlite3.Database(dbFile);

db.run(`
  CREATE TABLE IF NOT EXISTS key_value_store (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

// Set up your routes as before
app.get('/set/:key/:value', (req, res) => {
  const { key, value } = req.params;
  const startTime = Date.now();
  
  const query = `INSERT INTO key_value_store (key, value) VALUES (?, ?)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value`;

  db.run(query, [key, value], function (err) {
    const responseTime = Date.now() - startTime;
    if (err) {
      res.status(500).send("Error setting data.");
    } else {
      res.send(`Key '${key}' set to '${value}'. Response time: ${responseTime} ms`);
    }
  });
});

app.get('/get/:key', (req, res) => {
  const { key } = req.params;
  const startTime = Date.now();
  
  db.get("SELECT value FROM key_value_store WHERE key = ?", [key], (err, row) => {
    const responseTime = Date.now() - startTime;
    if (err) {
      res.status(500).send("Error retrieving data.");
    } else if (row) {
      res.send(`Value for '${key}': '${row.value}'. Response time: ${responseTime} ms`);
    } else {
      res.status(404).send(`Key '${key}' not found. Response time: ${responseTime} ms`);
    }
  });
});

// Export the app as a serverless function
export default app;

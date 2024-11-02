import express from 'express';
import sqlite3 from 'sqlite3';

const app = express();
const port = parseInt(process.env.PORT) || 3000;

// Initialize SQLite database (creates a new database file if it doesn't exist)
const db = new sqlite3.Database('./data.db', (err) => {
  if (err) {
    console.error("Could not connect to database", err);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// Create a table for storing key-value pairs if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS key_value_store (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`, (err) => {
  if (err) {
    console.error("Could not create table", err);
  }
});

// Route to set a key-value pair using URL parameters
app.get('/set/:key/:value', (req, res) => {
  const { key, value } = req.params;

  const startTime = Date.now();

  const query = `INSERT INTO key_value_store (key, value) VALUES (?, ?)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value`;

  db.run(query, [key, value], function (err) {
    const responseTime = Date.now() - startTime;

    if (err) {
      console.error("Error inserting data", err);
      res.status(500).send("Error setting data.");
    } else {
      res.send(`Key '${key}' set to '${value}'. Response time: ${responseTime} ms`);
    }
  });
});

// Route to get a value by key (still using query parameter)
app.get('/get/:key', (req, res) => {
  const { key } = req.params;

  const startTime = Date.now();

  db.get("SELECT value FROM key_value_store WHERE key = ?", [key], (err, row) => {
    const responseTime = Date.now() - startTime;

    if (err) {
      console.error("Error fetching data", err);
      res.status(500).send("Error retrieving data.");
    } else if (row) {
      res.send(`Value for '${key}': '${row.value}'. Response time: ${responseTime} ms`);
    } else {
      res.status(404).send(`Key '${key}' not found. Response time: ${responseTime} ms`);
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

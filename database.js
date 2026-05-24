// database.js — initializes the SQLite database and creates tables if they don't exist

const Database = require('better-sqlite3');
const path = require('path');

// The DB file lives in the project folder.
// better-sqlite3 creates it automatically if it doesn't exist.
const db = new Database(path.join(__dirname, 'homeserver.db'));

// Enable WAL mode: Write-Ahead Logging makes reads and writes faster
// and prevents the database from locking up on concurrent access.
db.pragma('journal_mode = WAL');

// Create all tables on startup.
// "IF NOT EXISTS" means this is safe to run every time the server starts —
// it won't erase your data if the tables are already there.

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    done INTEGER DEFAULT 0,   -- 0 = not done, 1 = done (SQLite has no boolean type)
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS shopping (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    checked INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS timers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    ingredients TEXT NOT NULL,  -- stored as plain text (one per line)
    steps TEXT NOT NULL,        -- stored as plain text
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Export the db instance so other files can use it
module.exports = db;

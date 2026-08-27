const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'tracker.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    photo_url TEXT,
    lat REAL,
    lng REAL,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    upvote_count INTEGER NOT NULL DEFAULT 0,
    resolve_confirmations INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_id INTEGER NOT NULL,
    author_name TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    is_resolution_confirmation INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (issue_id) REFERENCES issues(id)
  );

  CREATE TABLE IF NOT EXISTS pins (
    issue_id INTEGER NOT NULL UNIQUE
  );
`);

module.exports = db;
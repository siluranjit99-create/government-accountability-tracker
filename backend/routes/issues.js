const express = require('express');
const router = express.Router();
const db = require('../db');

const RESOLVE_THRESHOLD = 3; // confirmations needed to auto-mark solved

// GET /api/issues?category=roads&sort=trending
router.get('/', (req, res) => {
  const { category, sort } = req.query;
  let query = 'SELECT * FROM issues';
  const params = [];

  if (category) {
    query += ' WHERE category = ?';
    params.push(category);
  }

  if (sort === 'newest') query += ' ORDER BY created_at DESC';
  else if (sort === 'oldest') query += ' ORDER BY created_at ASC';
  else query += ' ORDER BY upvote_count DESC'; // trending default

  res.json(db.prepare(query).all(...params));
});

// POST /api/issues
router.post('/', (req, res) => {
  const { title, description, category, photo_url, lat, lng } = req.body;
  const created_at = new Date().toISOString();

  const result = db.prepare(`
    INSERT INTO issues (title, description, category, photo_url, lat, lng, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title, description, category, photo_url, lat, lng, created_at);

  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(issue);
});

// POST /api/issues/:id/upvote
router.post('/:id/upvote', (req, res) => {
  db.prepare('UPDATE issues SET upvote_count = upvote_count + 1 WHERE id = ?').run(req.params.id);
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  res.json(issue);
});

// POST /api/issues/:id/resolve  (called when a comment is a resolution confirmation)
router.post('/:id/resolve', (req, res) => {
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  const newCount = issue.resolve_confirmations + 1;
  const newStatus = newCount >= RESOLVE_THRESHOLD ? 'resolved' : issue.status;

  db.prepare('UPDATE issues SET resolve_confirmations = ?, status = ? WHERE id = ?')
    .run(newCount, newStatus, req.params.id);

  res.json(db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id));
});

// GET /api/issues/:id/comments
router.get('/:id/comments', (req, res) => {
  res.json(db.prepare('SELECT * FROM comments WHERE issue_id = ? ORDER BY created_at ASC').all(req.params.id));
});

// POST /api/issues/:id/comments
router.post('/:id/comments', (req, res) => {
  const { author_name, text, is_resolution_confirmation } = req.body;
  const created_at = new Date().toISOString();

  const result = db.prepare(`
    INSERT INTO comments (issue_id, author_name, text, created_at, is_resolution_confirmation)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, author_name, text, created_at, is_resolution_confirmation ? 1 : 0);

  res.status(201).json(db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid));
});

module.exports = router;
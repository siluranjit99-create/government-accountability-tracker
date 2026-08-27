const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/pins
router.get('/', (req, res) => {
  const pins = db.prepare('SELECT issue_id FROM pins').all();
  const ids = pins.map(p => p.issue_id);
  if (ids.length === 0) return res.json([]);

  const placeholders = ids.map(() => '?').join(',');
  const issues = db.prepare(`SELECT * FROM issues WHERE id IN (${placeholders})`).all(...ids);
  res.json(issues);
});

// POST /api/pins/:id
router.post('/:id', (req, res) => {
  db.prepare('INSERT OR IGNORE INTO pins (issue_id) VALUES (?)').run(req.params.id);
  res.status(201).json({ pinned: true });
});

// DELETE /api/pins/:id   <-- NEW: needed so the frontend can unpin an issue
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM pins WHERE issue_id = ?').run(req.params.id);
  res.json({ pinned: false });
});

module.exports = router;
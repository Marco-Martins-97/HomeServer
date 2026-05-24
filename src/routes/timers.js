const express = require('express');
const router = express.Router();
const db = require('../../database');

router.get('/', (req, res) => {
  const timers = db.prepare('SELECT * FROM timers ORDER BY label ASC').all();
  res.json(timers);
});

router.post('/', (req, res) => {
  const { label, duration_seconds } = req.body;
  if (!label || !duration_seconds || duration_seconds < 1) {
    return res.status(400).json({ error: 'Label and valid duration required' });
  }
  const result = db.prepare(
    'INSERT INTO timers (label, duration_seconds) VALUES (?, ?)'
  ).run(label.trim(), parseInt(duration_seconds));
  res.json({ id: result.lastInsertRowid, label, duration_seconds });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM timers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;

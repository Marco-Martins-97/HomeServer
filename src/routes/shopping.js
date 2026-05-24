const express = require('express');
const router = express.Router();
const db = require('../../database');

router.get('/', (req, res) => {
  const items = db.prepare('SELECT * FROM shopping ORDER BY created_at DESC').all();
  res.json(items);
});

router.post('/', (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Text is required' });
  }
  const result = db.prepare('INSERT INTO shopping (text) VALUES (?)').run(text.trim());
  res.json({ id: result.lastInsertRowid, text: text.trim(), checked: 0 });
});

router.patch('/:id/toggle', (req, res) => {
  db.prepare('UPDATE shopping SET checked = 1 - checked WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM shopping WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Delete all checked items — useful "clear cart" action
router.delete('/checked/all', (req, res) => {
  db.prepare('DELETE FROM shopping WHERE checked = 1').run();
  res.json({ success: true });
});

module.exports = router;

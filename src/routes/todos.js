// todos.js — all HTTP routes for the todo list feature

const express = require('express');
const router = express.Router();
const db = require('../../database');

// GET /api/todos — return all todos, newest first
router.get('/', (req, res) => {
  const todos = db.prepare('SELECT * FROM todos ORDER BY created_at DESC').all();
  res.json(todos);
});

// POST /api/todos — add a new todo
// req.body.text is the todo text sent from the browser
router.post('/', (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Text is required' });
  }
  const result = db.prepare('INSERT INTO todos (text) VALUES (?)').run(text.trim());
  res.json({ id: result.lastInsertRowid, text: text.trim(), done: 0 });
});

// PATCH /api/todos/:id/toggle — flip done/not-done
router.patch('/:id/toggle', (req, res) => {
  db.prepare('UPDATE todos SET done = 1 - done WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// DELETE /api/todos/:id — remove a todo
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM todos WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;

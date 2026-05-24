const express = require('express');
const router = express.Router();
const db = require('../../database');

// GET all recipes (summary only — no full text, for the list view)
router.get('/', (req, res) => {
  const recipes = db.prepare('SELECT id, title, created_at FROM recipes ORDER BY title ASC').all();
  res.json(recipes);
});

// GET single recipe by ID (full detail view)
router.get('/:id', (req, res) => {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Not found' });
  res.json(recipe);
});

router.post('/', (req, res) => {
  const { title, ingredients, steps } = req.body;
  if (!title || !ingredients || !steps) {
    return res.status(400).json({ error: 'All fields required' });
  }
  const result = db.prepare(
    'INSERT INTO recipes (title, ingredients, steps) VALUES (?, ?, ?)'
  ).run(title.trim(), ingredients.trim(), steps.trim());
  res.json({ id: result.lastInsertRowid, title });
});

router.put('/:id', (req, res) => {
  const { title, ingredients, steps } = req.body;
  db.prepare(
    'UPDATE recipes SET title = ?, ingredients = ?, steps = ? WHERE id = ?'
  ).run(title.trim(), ingredients.trim(), steps.trim(), req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;

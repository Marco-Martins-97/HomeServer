const express = require('express');
const router = express.Router();
const db = require('../../database');

// GET /api/calendar/tasks?view=daily&date=YYYY-MM-DD
// view: daily | weekly | monthly
router.get('/tasks', (req, res) => {
    const { view, date } = req.query;
    const base = date || new Date().toISOString().split('T')[0]; // default today

    let tasks;

    if (view === 'daily') {
        // All tasks for a specific day, including recurring ones that fall on that day
        tasks = db.prepare(`
      SELECT * FROM calendar_tasks
      WHERE date = ?
         OR recurrence = 'daily'
         OR (recurrence = 'weekly'  AND strftime('%w', date) = strftime('%w', ?))
         OR (recurrence = 'monthly' AND strftime('%d', date) = strftime('%d', ?))
      ORDER BY date ASC
    `).all(base, base, base);

    } else if (view === 'weekly') {
        // Tasks for the whole week containing the given date
        tasks = db.prepare(`
      SELECT * FROM calendar_tasks
      WHERE (date >= date(?, 'weekday 0', '-6 days') AND date <= date(?, 'weekday 0'))
         OR recurrence = 'daily'
         OR recurrence = 'weekly'
      ORDER BY date ASC
    `).all(base, base);

    } else if (view === 'monthly') {
        // Tasks for the whole month of the given date
        tasks = db.prepare(`
      SELECT * FROM calendar_tasks
      WHERE strftime('%Y-%m', date) = strftime('%Y-%m', ?)
         OR recurrence = 'daily'
         OR recurrence = 'weekly'
         OR recurrence = 'monthly'
      ORDER BY date ASC
    `).all(base);

    } else {
        return res.status(400).json({ error: 'Invalid view' });
    }

    res.json(tasks);
});

// GET /api/calendar/today — used by service worker for morning notification
router.get('/today', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const dow = new Date().getDay().toString(); // 0=Sunday

    const tasks = db.prepare(`
    SELECT * FROM calendar_tasks
    WHERE done = 0
      AND (
        date = ?
        OR recurrence = 'daily'
        OR (recurrence = 'weekly'  AND strftime('%w', date) = ?)
        OR (recurrence = 'monthly' AND strftime('%d', date) = strftime('%d', ?))
      )
    ORDER BY date ASC
  `).all(today, dow, today);

    res.json(tasks);
});

// POST /api/calendar/tasks — create a task
router.post('/tasks', (req, res) => {
    const { title, date, recurrence } = req.body;
    if (!title || !date) {
        return res.status(400).json({ error: 'Title and date are required' });
    }
    const result = db.prepare(
        'INSERT INTO calendar_tasks (title, date, recurrence) VALUES (?, ?, ?)'
    ).run(title.trim(), date, recurrence || 'none');
    res.json({ id: result.lastInsertRowid, title, date, recurrence, done: 0 });
});

// PATCH /api/calendar/tasks/:id/toggle — mark done/undone
router.patch('/tasks/:id/toggle', (req, res) => {
    db.prepare('UPDATE calendar_tasks SET done = 1 - done WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// DELETE /api/calendar/tasks/:id
router.delete('/tasks/:id', (req, res) => {
    db.prepare('DELETE FROM calendar_tasks WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

module.exports = router;
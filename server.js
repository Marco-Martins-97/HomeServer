// server.js — the entry point. Wires everything together.

const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware: parse incoming JSON request bodies
// Without this, req.body would be undefined in POST/PUT routes
app.use(express.json());

// Serve the frontend (HTML, CSS, JS) as static files from the /public directory
// Any file in /public is accessible directly: e.g. /css/style.css
app.use(express.static(path.join(__dirname, 'public')));

// Mount each feature's routes under its own URL prefix
// e.g. /api/todos maps to src/routes/todos.js
app.use('/api/todos',    require('./src/routes/todos'));
app.use('/api/shopping', require('./src/routes/shopping'));
app.use('/api/timers',   require('./src/routes/timers'));
app.use('/api/recipes',  require('./src/routes/recipes'));

// Catch-all: any URL not matched above serves index.html
// This allows the frontend to handle its own navigation
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Home server running on http://homeserver.local:${PORT}`);
});

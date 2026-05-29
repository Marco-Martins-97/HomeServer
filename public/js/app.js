// app.js — all frontend logic. Talks to the server API, updates the UI.

// ─── Tab Navigation ───────────────────────────────────────────────
function showTab(name) {
  document.querySelectorAll('#content section').forEach(s => s.style.display = 'none');
  document.getElementById('tab-' + name).style.display = 'block';

  // Update active nav button
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  event.currentTarget.classList.add('active');

  if (name === 'todos') loadTodos();
  if (name === 'shopping') loadShopping();
  if (name === 'timers') loadTimers();
  if (name === 'recipes') loadRecipes();
  if (name === 'calendar') loadCalendar();
  if (name === 'system') loadSystem();
}

// ─── Helper: simple fetch wrapper ────────────────────────────────
async function api(method, url, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

// ─── TODOS ────────────────────────────────────────────────────────
async function loadTodos() {
  const todos = await api('GET', '/api/todos');
  const list = document.getElementById('todo-list');
  list.innerHTML = todos.map(t => `
    <li class="${t.done ? 'done' : ''}">
      <span onclick="toggleTodo(${t.id})" style="cursor:pointer;flex:1">${t.text}</span>
      <button onclick="deleteTodo(${t.id})">✕</button>
    </li>
  `).join('');
}

async function addTodo() {
  const input = document.getElementById('todo-input');
  if (!input.value.trim()) return;
  await api('POST', '/api/todos', { text: input.value });
  input.value = '';
  loadTodos();
}

async function toggleTodo(id) {
  await api('PATCH', `/api/todos/${id}/toggle`);
  loadTodos();
}

async function deleteTodo(id) {
  await api('DELETE', `/api/todos/${id}`);
  loadTodos();
}

// Allow pressing Enter to add a todo
document.getElementById('todo-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTodo();
});

// ─── SHOPPING ─────────────────────────────────────────────────────
async function loadShopping() {
  const items = await api('GET', '/api/shopping');
  const list = document.getElementById('shopping-list');
  list.innerHTML = items.map(i => `
    <li class="${i.checked ? 'done' : ''}">
      <span onclick="toggleShopping(${i.id})" style="cursor:pointer;flex:1">${i.text}</span>
      <button onclick="deleteShopping(${i.id})">✕</button>
    </li>
  `).join('');
}

async function addShoppingItem() {
  const input = document.getElementById('shopping-input');
  if (!input.value.trim()) return;
  await api('POST', '/api/shopping', { text: input.value });
  input.value = '';
  loadShopping();
}

async function toggleShopping(id) {
  await api('PATCH', `/api/shopping/${id}/toggle`);
  loadShopping();
}

async function deleteShopping(id) {
  await api('DELETE', `/api/shopping/${id}`);
  loadShopping();
}

async function clearChecked() {
  await api('DELETE', '/api/shopping/checked/all');
  loadShopping();
}

document.getElementById('shopping-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addShoppingItem();
});

// ─── TIMERS ───────────────────────────────────────────────────────
let timerInterval = null;
let currentRecipeId = null; // reused below for recipe delete

async function loadTimers() {
  const timers = await api('GET', '/api/timers');
  const list = document.getElementById('timer-list');
  list.innerHTML = timers.map(t => `
    <li>
      <span style="flex:1">${t.label} (${formatTime(t.duration_seconds)})</span>
      <button onclick="startTimer('${t.label}', ${t.duration_seconds})">Start</button>
      <button onclick="deleteTimer(${t.id})">✕</button>
    </li>
  `).join('');
}

async function addTimer() {
  const label = document.getElementById('timer-label').value.trim();
  const duration = parseInt(document.getElementById('timer-duration').value);
  if (!label || isNaN(duration) || duration < 1) return;
  await api('POST', '/api/timers', { label, duration_seconds: duration });
  document.getElementById('timer-label').value = '';
  document.getElementById('timer-duration').value = '';
  loadTimers();
}

async function deleteTimer(id) {
  await api('DELETE', `/api/timers/${id}`);
  loadTimers();
}

function startTimer(label, seconds) {
  // Clear any existing countdown
  if (timerInterval) clearInterval(timerInterval);

  let remaining = seconds;
  document.getElementById('timer-name').textContent = label;
  document.getElementById('active-timer').style.display = 'block';
  document.getElementById('timer-display').textContent = formatTime(remaining);

  timerInterval = setInterval(() => {
    remaining--;
    document.getElementById('timer-display').textContent = formatTime(remaining);
    if (remaining <= 0) {
      clearInterval(timerInterval);
      alert(`Timer "${label}" finished!`);
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  document.getElementById('active-timer').style.display = 'none';
}

// Converts seconds to MM:SS display format
function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

// ─── RECIPES ──────────────────────────────────────────────────────
async function loadRecipes() {
  const recipes = await api('GET', '/api/recipes');
  document.getElementById('recipe-list').innerHTML = recipes.map(r => `
    <li>
      <span onclick="viewRecipe(${r.id})" style="cursor:pointer;flex:1">${r.title}</span>
    </li>
  `).join('');
  document.getElementById('recipe-detail').style.display = 'none';
  document.getElementById('recipe-list').style.display = 'block';
}

async function viewRecipe(id) {
  const r = await api('GET', `/api/recipes/${id}`);
  currentRecipeId = id;
  document.getElementById('recipe-detail-title').textContent = r.title;
  document.getElementById('recipe-detail-ingredients').textContent = r.ingredients;
  document.getElementById('recipe-detail-steps').textContent = r.steps;
  document.getElementById('recipe-list').style.display = 'none';
  document.getElementById('recipe-form').style.display = 'none';
  document.getElementById('recipe-detail').style.display = 'block';
}

function closeRecipe() {
  document.getElementById('recipe-detail').style.display = 'none';
  document.getElementById('recipe-list').style.display = 'block';
}

function showRecipeForm() {
  document.getElementById('recipe-title').value = '';
  document.getElementById('recipe-ingredients').value = '';
  document.getElementById('recipe-steps').value = '';
  document.getElementById('recipe-form').style.display = 'block';
}

function hideRecipeForm() {
  document.getElementById('recipe-form').style.display = 'none';
}

async function saveRecipe() {
  const title = document.getElementById('recipe-title').value.trim();
  const ingredients = document.getElementById('recipe-ingredients').value.trim();
  const steps = document.getElementById('recipe-steps').value.trim();
  if (!title || !ingredients || !steps) return;
  await api('POST', '/api/recipes', { title, ingredients, steps });
  hideRecipeForm();
  loadRecipes();
}

async function deleteRecipe() {
  if (!confirm('Delete this recipe?')) return;
  await api('DELETE', `/api/recipes/${currentRecipeId}`);
  loadRecipes();
}

// ─── CALENDAR ─────────────────────────────────────────────────────
let calView = 'weekly';
let calDate = new Date();

function setView(view) {
  calView = view;
  loadCalendar();
}

function navigateDate(dir) {
  if (calView === 'daily') calDate.setDate(calDate.getDate() + dir);
  if (calView === 'weekly') calDate.setDate(calDate.getDate() + (dir * 7));
  if (calView === 'monthly') calDate.setMonth(calDate.getMonth() + dir);
  loadCalendar();
}

function formatDateLabel() {
  const opts = { year: 'numeric', month: 'long', day: 'numeric' };
  if (calView === 'daily') {
    return calDate.toLocaleDateString(undefined, opts);
  } else if (calView === 'weekly') {
    const start = new Date(calDate);
    start.setDate(start.getDate() - start.getDay() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, opts)}`;
  } else {
    return calDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
  }
}

async function loadCalendar() {
  const dateStr = calDate.toISOString().split('T')[0];
  document.getElementById('calendar-range').textContent = formatDateLabel();

  const tasks = await api('GET', `/api/calendar/tasks?view=${calView}&date=${dateStr}`);
  const list = document.getElementById('calendar-task-list');

  if (!tasks.length) {
    list.innerHTML = '<li style="border:none; background:none">No tasks for this period.</li>';
    return;
  }

  list.innerHTML = tasks.map(t => `
    <li class="${t.done ? 'done' : ''}">
      <span style="flex:1; cursor:pointer" onclick="toggleCalendarTask(${t.id})">
        ${t.title}
        ${t.recurrence !== 'none' ? `<small style="color:#777"> · ${t.recurrence}</small>` : ''}
        <br><small style="color:#777">${t.date}</small>
      </span>
      <button onclick="deleteCalendarTask(${t.id})">✕</button>
    </li>
  `).join('');
}

async function addCalendarTask() {
  const title = document.getElementById('task-title').value.trim();
  const date = document.getElementById('task-date').value;
  const recurrence = document.getElementById('task-recurrence').value;

  if (!title || !date) return;

  await api('POST', '/api/calendar/tasks', { title, date, recurrence });

  document.getElementById('task-title').value = '';
  document.getElementById('task-date').value = '';
  document.getElementById('task-recurrence').value = 'none';

  loadCalendar();
}

async function toggleCalendarTask(id) {
  await api('PATCH', `/api/calendar/tasks/${id}/toggle`);
  loadCalendar();
}

async function deleteCalendarTask(id) {
  await api('DELETE', `/api/calendar/tasks/${id}`);
  loadCalendar();
}

// ─── SYSTEM STATUS ────────────────────────────────────────────────
async function loadSystem() {
  const s = await api('GET', '/api/system');
  document.getElementById('system-info').innerHTML = `
    <table style="width:100%; border-collapse:collapse">
      <tr><td><b>Uptime</b></td><td>${s.uptime}</td></tr>
      <tr><td><b>CPU</b></td><td>${s.cpu}</td></tr>
      <tr><td><b>Temperature</b></td><td>${s.temp}</td></tr>
      <tr><td><b>RAM Used</b></td><td>${s.ram.used} / ${s.ram.total}</td></tr>
      <tr><td><b>RAM Free</b></td><td>${s.ram.free}</td></tr>
      <tr><td><b>Disk Used</b></td><td>${s.disk.used} / ${s.disk.total} (${s.disk.percent})</td></tr>
      <tr><td><b>Disk Free</b></td><td>${s.disk.free}</td></tr>
      <tr><td><b>IP</b></td><td>${s.network.ip}</td></tr>
      <tr><td><b>Hostname</b></td><td>${s.network.hostname}</td></tr>
      <tr><td><b>Wi-Fi</b></td><td>${s.network.ssid}</td></tr>
      <tr><td><b>Network RX</b></td><td>${s.network.rx}</td></tr>
      <tr><td><b>Network TX</b></td><td>${s.network.tx}</td></tr>
    </table>
  `;
}

function confirmAction(action) {
  const msg = action === 'restart'
    ? 'Are you sure you want to restart the server?'
    : 'Are you sure you want to shut down the server?';
  if (!confirm(msg)) return;
  api('POST', `/api/system/${action}`);
  if (action === 'restart') {
    alert('Restarting... the page will be unavailable for about 30 seconds.');
  } else {
    alert('Shutting down... the server will go offline.');
  }
}

// ─── Load initial tab on page open ───────────────────────────────
loadTodos();

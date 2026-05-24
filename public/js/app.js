// app.js — all frontend logic. Talks to the server API, updates the UI.

// ─── Tab Navigation ───────────────────────────────────────────────
function showTab(name) {
  // Hide all sections
  document.querySelectorAll('main section').forEach(s => s.style.display = 'none');
  // Show the requested one
  document.getElementById('tab-' + name).style.display = 'block';
  // Load fresh data for the active tab
  if (name === 'todos')    loadTodos();
  if (name === 'shopping') loadShopping();
  if (name === 'timers')   loadTimers();
  if (name === 'recipes')  loadRecipes();
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
  const title       = document.getElementById('recipe-title').value.trim();
  const ingredients = document.getElementById('recipe-ingredients').value.trim();
  const steps       = document.getElementById('recipe-steps').value.trim();
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

// ─── Load initial tab on page open ───────────────────────────────
loadTodos();

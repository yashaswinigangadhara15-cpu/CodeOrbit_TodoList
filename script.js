// ===== Constants =====
const STORAGE_KEY = 'todo-app-tasks';

const EDIT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>`;
const DELETE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

// ===== State =====
let tasks = [];
let currentFilter = 'all';

// ===== DOM references =====
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const inputError = document.getElementById('input-error');
const taskList = document.getElementById('task-list');
const taskCounter = document.getElementById('task-counter');
const emptyState = document.getElementById('empty-state');
const filterButtons = document.querySelectorAll('.filter-btn');

// ===== Storage helpers =====
function loadTasks() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Could not parse saved tasks, starting fresh.', error);
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ===== ID generator =====
function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ===== Task operations =====
function addTask(text) {
  const trimmed = text.trim();
  if (trimmed === '') {
    showInputError();
    return;
  }

  tasks.push({
    id: createId(),
    text: trimmed,
    completed: false
  });

  saveTasks();
  render();
}

function deleteTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const confirmed = window.confirm(`Delete "${task.text}"?`);
  if (!confirmed) return;

  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  render();
}

function toggleComplete(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  saveTasks();
  render();
}

function editTask(id, newText) {
  const trimmed = newText.trim();
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  if (trimmed === '') {
    // Ignore empty edits and keep the original text.
    render();
    return;
  }

  task.text = trimmed;
  saveTasks();
  render();
}

// ===== Input validation feedback =====
function showInputError() {
  inputError.hidden = false;
  taskInput.focus();
  setTimeout(() => {
    inputError.hidden = true;
  }, 2500);
}

// ===== Filtering =====
function getFilteredTasks() {
  if (currentFilter === 'active') {
    return tasks.filter((t) => !t.completed);
  }
  if (currentFilter === 'completed') {
    return tasks.filter((t) => t.completed);
  }
  return tasks;
}

function setFilter(filter) {
  currentFilter = filter;
  filterButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  render();
}

// ===== Rendering =====
function render() {
  const filteredTasks = getFilteredTasks();

  taskList.innerHTML = '';

  if (filteredTasks.length === 0) {
    emptyState.hidden = false;
    emptyState.textContent =
      tasks.length === 0
        ? 'Nothing here yet. Add your first task above.'
        : `No ${currentFilter} tasks to show.`;
  } else {
    emptyState.hidden = true;
    filteredTasks.forEach((task) => {
      taskList.appendChild(buildTaskElement(task));
    });
  }

  updateCounter();
}

function buildTaskElement(task) {
  const item = document.createElement('li');
  item.className = 'task-item' + (task.completed ? ' completed' : '');
  item.dataset.id = task.id;

  // Checkbox
  const checkbox = document.createElement('button');
  checkbox.type = 'button';
  checkbox.className = 'task-checkbox' + (task.completed ? ' checked' : '');
  checkbox.setAttribute('aria-label', task.completed ? 'Mark as incomplete' : 'Mark as complete');
  checkbox.addEventListener('click', () => toggleComplete(task.id));

  // Task text
  const text = document.createElement('span');
  text.className = 'task-text';
  text.textContent = task.text;

  // Edit button
  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'icon-btn edit-btn';
  editBtn.innerHTML = EDIT_ICON;
  editBtn.setAttribute('aria-label', 'Edit task');
  editBtn.addEventListener('click', () => startEditing(item, task));

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'icon-btn delete-btn';
  deleteBtn.innerHTML = DELETE_ICON;
  deleteBtn.setAttribute('aria-label', 'Delete task');
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  const actions = document.createElement('div');
  actions.className = 'task-actions';
  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  item.appendChild(checkbox);
  item.appendChild(text);
  item.appendChild(actions);

  return item;
}

function startEditing(item, task) {
  const textEl = item.querySelector('.task-text');

  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'task-edit-input';
  editInput.value = task.text;

  item.replaceChild(editInput, textEl);
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);

  const commit = () => editTask(task.id, editInput.value);

  editInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      render();
    }
  });

  editInput.addEventListener('blur', commit);
}

function updateCounter() {
  const remaining = tasks.filter((t) => !t.completed).length;
  const label = remaining === 1 ? 'task remaining' : 'tasks remaining';
  taskCounter.textContent = `${remaining} ${label}`;
}

// ===== Event listeners =====
taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addTask(taskInput.value);
  taskInput.value = '';
  taskInput.focus();
});

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

// ===== Init =====
function init() {
  tasks = loadTasks();
  render();
}

init();

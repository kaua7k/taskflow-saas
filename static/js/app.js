const STORAGE_KEY = 'taskflow_tasks';

const tasks = loadTasks();

let currentFilter = 'all';
let currentSearch = '';
let sortByPriority = false;
let currentTheme = 'light';
let nextId = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

const taskList = document.getElementById('taskList');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const taskModal = document.getElementById('taskModal');
const taskTitle = document.getElementById('taskTitle');
const taskStatus = document.getElementById('taskStatus');
const taskPriority = document.getElementById('taskPriority');
const titleError = document.getElementById('titleError');
const openModalBtn = document.getElementById('openModal');
const closeModalBtn = document.getElementById('closeModal');
const quickAddBtn = document.getElementById('quickAddBtn');
const saveTaskBtn = document.getElementById('saveTask');
const themeToggle = document.getElementById('themeToggle');
const clearDoneBtn = document.getElementById('clearDoneBtn');
const sortPriorityBtn = document.getElementById('sortPriorityBtn');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const emptyState = document.getElementById('emptyState');
const activityList = document.getElementById('activityList');
const weeklyBar = document.getElementById('weeklyBar');
const weeklyProgress = document.getElementById('weeklyProgress');
const focusText = document.getElementById('focusText');
const navItems = document.querySelectorAll('.nav-item');

const priorityOrder = { high: 1, medium: 2, low: 3 };

function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [
      { id: 1, title: 'Revisar proposta comercial', status: 'doing', priority: 'high', completed: false },
      { id: 2, title: 'Responder tickets do suporte', status: 'todo', priority: 'medium', completed: false },
      { id: 3, title: 'Atualizar documentação interna', status: 'done', priority: 'low', completed: true },
      { id: 4, title: 'Planejar deploy da nova versão', status: 'doing', priority: 'high', completed: false }
    ];
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getStatusLabel(status) {
  return { todo: 'A fazer', doing: 'Em andamento', done: 'Concluída' }[status] || status;
}

function getPriorityLabel(priority) {
  return { high: 'Alta', medium: 'Média', low: 'Baixa' }[priority] || priority;
}

function addActivity(text) {
  const li = document.createElement('li');
  li.textContent = text;
  activityList.prepend(li);
  while (activityList.children.length > 5) {
    activityList.removeChild(activityList.lastChild);
  }
}

function openModal() {
  clearValidation();
  taskModal.classList.remove('hidden');
  taskTitle.focus();
}

function closeModal() {
  taskModal.classList.add('hidden');
}

function clearValidation() {
  titleError.classList.add('hidden');
  taskTitle.classList.remove('invalid');
}

function setActiveNav(section) {
  navItems.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === section);
  });

  if (section === 'dashboard') {
    currentFilter = 'all';
    currentSearch = '';
  } else if (section === 'tasks') {
    currentFilter = 'all';
  } else if (section === 'today') {
    currentFilter = 'doing';
  } else if (section === 'completed') {
    currentFilter = 'done';
  }

  statusFilter.value = currentFilter === 'all' ? 'all' : currentFilter;
  searchInput.value = currentSearch;
  renderTasks();
}

function getFilteredTasks() {
  let filtered = tasks.filter(task => {
    const matchStatus = currentFilter === 'all' ? true : task.status === currentFilter;
    const q = currentSearch.toLowerCase();
    const matchSearch =
      task.title.toLowerCase().includes(q) ||
      getPriorityLabel(task.priority).toLowerCase().includes(q) ||
      getStatusLabel(task.status).toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  if (sortByPriority) {
    filtered = [...filtered].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  return filtered;
}

function updateSummary() {
  const total = tasks.length;
  const doing = tasks.filter(t => t.status === 'doing').length;
  const done = tasks.filter(t => t.status === 'done').length;
  const high = tasks.filter(t => t.priority === 'high').length;

  document.getElementById('totalTasks').textContent = total;
  document.getElementById('doingTasks').textContent = doing;
  document.getElementById('doneTasks').textContent = done;
  document.getElementById('highPriorityTasks').textContent = high;

  const progress = total ? Math.round((done / total) * 100) : 0;
  weeklyProgress.textContent = `${progress}%`;
  weeklyBar.style.width = `${progress}%`;

  if (doing > 0) {
    focusText.textContent = 'Você tem itens em andamento. Finalize o que já começou antes de abrir novas tarefas.';
  } else if (high > 0) {
    focusText.textContent = 'Existem prioridades altas aguardando atenção. Vale organizar a próxima entrega agora.';
  } else {
    focusText.textContent = 'Fluxo limpo. Este é um bom momento para planejar a próxima semana.';
  }
}

function renderTasks() {
  const filtered = getFilteredTasks();
  taskList.innerHTML = '';
  emptyState.classList.toggle('hidden', filtered.length !== 0);

  filtered.forEach(task => {
    const card = document.createElement('article');
    card.className = 'task-card';
    card.innerHTML = `
      <input class="task-check" type="checkbox" ${task.completed ? 'checked' : ''} data-action="toggle" data-id="${task.id}">
      <div class="task-main">
        <h4>${task.title}</h4>
        <div class="task-meta">
          <span class="chip ${task.status}">${getStatusLabel(task.status)}</span>
          <span class="chip ${task.priority}">${getPriorityLabel(task.priority)}</span>
        </div>
      </div>
      <button class="small-btn" data-action="advance" data-id="${task.id}">Avançar</button>
      <div class="task-actions">
        <button class="small-btn danger" data-action="delete" data-id="${task.id}">Excluir</button>
      </div>
    `;
    taskList.appendChild(card);
  });

  updateSummary();
}

function saveTask() {
  clearValidation();

  const title = taskTitle.value.trim();
  const status = taskStatus.value;
  const priority = taskPriority.value;

  if (!title) {
    titleError.classList.remove('hidden');
    taskTitle.classList.add('invalid');
    return;
  }

  const completed = status === 'done';
  tasks.unshift({ id: nextId++, title, status, priority, completed });
  saveTasks();
  addActivity(`Nova tarefa criada: ${title}`);
  taskTitle.value = '';
  taskStatus.value = 'todo';
  taskPriority.value = 'high';
  closeModal();
  renderTasks();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  task.status = task.completed ? 'done' : 'todo';
  saveTasks();
  addActivity(`${task.completed ? 'Concluída' : 'Reaberta'}: ${task.title}`);
  renderTasks();
}

function advanceTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  if (task.status === 'todo') task.status = 'doing';
  else if (task.status === 'doing') {
    task.status = 'done';
    task.completed = true;
  } else {
    task.status = 'todo';
    task.completed = false;
  }

  saveTasks();
  addActivity(`Status alterado: ${task.title}`);
  renderTasks();
}

function deleteTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const confirmed = confirm(`Remover a tarefa "${task.title}"? Esta ação não pode ser desfeita.`);
  if (!confirmed) return;

  const index = tasks.findIndex(t => t.id === id);
  tasks.splice(index, 1);
  saveTasks();
  addActivity(`Tarefa removida: ${task.title}`);
  renderTasks();
}

function clearDoneTasks() {
  const doneCount = tasks.filter(t => t.status === 'done').length;
  if (!doneCount) return;

  const confirmed = confirm(`Remover ${doneCount} tarefa(s) concluída(s)? Esta ação não pode ser desfeita.`);
  if (!confirmed) return;

  for (let i = tasks.length - 1; i >= 0; i--) {
    if (tasks[i].status === 'done') tasks.splice(i, 1);
  }
  saveTasks();
  addActivity('Tarefas concluídas removidas');
  renderTasks();
}

openModalBtn.addEventListener('click', openModal);
quickAddBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
saveTaskBtn.addEventListener('click', saveTask);

statusFilter.addEventListener('change', (e) => {
  currentFilter = e.target.value;
  renderTasks();
});

searchInput.addEventListener('input', (e) => {
  currentSearch = e.target.value;
  renderTasks();
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
  themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  addActivity(`Tema alterado para ${currentTheme === 'dark' ? 'escuro' : 'claro'}`);
});

sortPriorityBtn.addEventListener('click', () => {
  sortByPriority = !sortByPriority;
  sortPriorityBtn.textContent = sortByPriority ? 'Ordem normal' : 'Ordenar prioridade';
  renderTasks();
});

resetFiltersBtn.addEventListener('click', () => {
  currentFilter = 'all';
  currentSearch = '';
  sortByPriority = false;
  statusFilter.value = 'all';
  searchInput.value = '';
  sortPriorityBtn.textContent = 'Ordenar prioridade';
  renderTasks();
});

clearDoneBtn.addEventListener('click', clearDoneTasks);

taskModal.addEventListener('click', (e) => {
  if (e.target === taskModal) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

taskList.addEventListener('click', (e) => {
  const button = e.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  const id = Number(button.dataset.id);

  if (action === 'advance') advanceTask(id);
  if (action === 'delete') deleteTask(id);
});

taskList.addEventListener('change', (e) => {
  const checkbox = e.target.closest('[data-action="toggle"]');
  if (!checkbox) return;
  toggleTask(Number(checkbox.dataset.id));
});

navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.dataset.section;
    setActiveNav(section);
  });
});

addActivity('Workspace carregado');
addActivity('Filtros, confirmações, navegação e persistência prontos para uso');

setActiveNav('dashboard');
renderTasks();
closeModal();
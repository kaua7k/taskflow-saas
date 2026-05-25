const STORE_KEY = 'taskflow_hub_v1';
const NOTES_KEY = 'taskflow_notes';

let tasks = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
let editingId = null;
let activeFilter = 'all';

// ── FOCUS TIMER ──
let timerInterval;
let timeLeft = 25 * 60;

function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  document.getElementById('timer-display').textContent = 
    `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

document.getElementById('timer-start').addEventListener('click', function() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    this.textContent = 'Iniciar';
  } else {
    timerInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        alert('Tempo esgotado! Hora de uma pausa.');
      }
    }, 1000);
    this.textContent = 'Pausar';
  }
});

document.getElementById('timer-reset').addEventListener('click', () => {
  clearInterval(timerInterval);
  timerInterval = null;
  timeLeft = 25 * 60;
  updateTimerDisplay();
  document.getElementById('timer-start').textContent = 'Iniciar';
});

// ── QUICK NOTES ──
const notesArea = document.getElementById('quick-notes');
notesArea.value = localStorage.getItem(NOTES_KEY) || '';
notesArea.addEventListener('input', () => {
  localStorage.setItem(NOTES_KEY, notesArea.value);
});

// ── CORE LOGIC ──
function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(tasks));
}

function render() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const prio = document.getElementById('priority-filter').value;

  let visible = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search) || (t.desc || '').toLowerCase().includes(search);
    const matchPrio = prio === 'all' || t.priority === prio;
    const matchFilter =
      activeFilter === 'all' ? true :
      activeFilter === 'hoje' ? isToday(t.createdAt) :
      t.status === activeFilter;
    return matchSearch && matchPrio && matchFilter;
  });

  const list = document.getElementById('task-list');
  const empty = document.getElementById('empty-state');

  list.innerHTML = '';

  if (visible.length === 0) {
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    visible.forEach(t => {
      const el = document.createElement('div');
      el.className = 'task-item' + (t.status === 'concluida' ? ' done' : '');
      el.innerHTML = `
        <div class="task-check" data-id="${t.id}" title="Alternar status">${t.status === 'concluida' ? '✓' : ''}</div>
        <div class="task-info">
          <div class="task-title">${escHtml(t.title)}</div>
          ${t.date ? `<div class="task-date">📅 Entrega: ${formatDate(t.date)}</div>` : ''}
        </div>
        <div class="task-meta">
          <span class="badge badge-${t.priority}">${t.priority}</span>
          <span class="badge badge-${t.status}">${labelStatus(t.status)}</span>
        </div>
        <div class="task-actions">
          <button class="task-btn" data-edit="${t.id}" title="Editar">✎</button>
          <button class="task-btn del" data-del="${t.id}" title="Excluir">✕</button>
        </div>
      `;
      list.appendChild(el);
    });
  }

  updateStats();
  updateCounts();
}

function labelStatus(s) {
  return { pendente: 'Pendente', andamento: 'Em andamento', concluida: 'Concluída' }[s] || s;
}

function escHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function isToday(ts) {
  const d = new Date(ts), n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

function formatDate(d) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function updateStats() {
  document.getElementById('stat-total').textContent = tasks.length;
  document.getElementById('stat-andamento').textContent = tasks.filter(t => t.status !== 'concluida').length;
  document.getElementById('stat-concluidas').textContent = tasks.filter(t => t.status === 'concluida').length;
  document.getElementById('stat-alta').textContent = tasks.filter(t => t.priority === 'alta').length;

  const pct = tasks.length ? Math.round(tasks.filter(t => t.status === 'concluida').length / tasks.length * 100) : 0;
  document.getElementById('progress-pct').textContent = pct + '%';
  document.getElementById('progress-fill').style.width = pct + '%';
}

function updateCounts() {
  document.getElementById('count-all').textContent = tasks.length;
  document.getElementById('count-hoje').textContent = tasks.filter(t => isToday(t.createdAt)).length;
  document.getElementById('count-andamento').textContent = tasks.filter(t => t.status === 'andamento').length;
  document.getElementById('count-concluida').textContent = tasks.filter(t => t.status === 'concluida').length;
}

function openModal(id = null) {
  editingId = id;
  const t = id ? tasks.find(x => x.id === id) : null;
  document.getElementById('modal-title').textContent = id ? 'Editar Tarefa' : 'Nova Tarefa';
  document.getElementById('task-title').value = t ? t.title : '';
  document.getElementById('task-desc').value = t ? (t.desc || '') : '';
  document.getElementById('task-priority').value = t ? t.priority : 'media';
  document.getElementById('task-status').value = t ? t.status : 'pendente';
  document.getElementById('task-date').value = t ? (t.date || '') : '';
  document.getElementById('modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('task-title').focus(), 50);
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  editingId = null;
}

function saveModal() {
  const title = document.getElementById('task-title').value.trim();
  if (!title) { document.getElementById('task-title').focus(); return; }

  const data = {
    title,
    desc: document.getElementById('task-desc').value.trim(),
    priority: document.getElementById('task-priority').value,
    status: document.getElementById('task-status').value,
    date: document.getElementById('task-date').value
  };

  if (editingId) {
    const t = tasks.find(x => x.id === editingId);
    Object.assign(t, data);
  } else {
    tasks.unshift({
      id: Date.now().toString(),
      ...data,
      createdAt: Date.now()
    });
  }

  save(); closeModal(); render();
}

// ── EVENTS ──
document.getElementById('btn-new').addEventListener('click', () => openModal());
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-save').addEventListener('click', saveModal);
document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

document.getElementById('search-input').addEventListener('input', render);
document.getElementById('priority-filter').addEventListener('change', render);

document.getElementById('task-list').addEventListener('click', e => {
  const checkId = e.target.closest('[data-id]')?.dataset.id;
  const editId = e.target.closest('[data-edit]')?.dataset.edit;
  const delId = e.target.closest('[data-del]')?.dataset.del;

  if (checkId) {
    const t = tasks.find(x => x.id === checkId);
    t.status = t.status === 'concluida' ? 'pendente' : 'concluida';
    save(); render();
  }
  if (editId) openModal(editId);
  if (delId) {
    if (confirm('Deseja realmente excluir esta tarefa?')) {
      tasks = tasks.filter(x => x.id !== delId);
      save(); render();
    }
  }
});

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    activeFilter = item.dataset.filter;
    render();
  });
});

// ── INIT ──
render();
updateTimerDisplay();
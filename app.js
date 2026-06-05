// ===== Supabase холболт =====
// anon/publishable key браузерт орохдоо аюулгүй — RLS-ээр хамгаалагдсан.
const SUPABASE_URL = 'https://vxkkjzligcvhutfzjpii.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xObTJJiaRusXc8PH9LfhQg_foFrvoWK';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Сэдэв (dark/light) =====
function applyTheme(theme) {
  if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
  else document.documentElement.removeAttribute('data-theme');
}
function getTheme() {
  try { return localStorage.getItem('theme') || 'dark'; } catch (e) { return 'dark'; }
}
function toggleTheme() {
  const next = getTheme() === 'light' ? 'dark' : 'light';
  try { localStorage.setItem('theme', next); } catch (e) {}
  applyTheme(next);
  updateThemeBtn();
}
function updateThemeBtn() {
  const btn = document.getElementById('theme-btn');
  if (btn) btn.innerText = getTheme() === 'light' ? '🌙' : '☀️';
}
// Хуудас ачаалагдмагц шууд хэрэглэх (анивчихаас сэргийлж эртхэн)
applyTheme(getTheme());

// ===== Навигаци зурах (зүүн талын sidebar) =====
async function renderNav(active) {
  // Мобайл нээх товч
  const burger = document.createElement('button');
  burger.className = 'nav-burger';
  burger.innerHTML = '☰';
  burger.setAttribute('aria-label', 'Menu');
  document.body.prepend(burger);

  // Бүрхүүл (мобайлд цэс нээгдэхэд арын бараан давхарга)
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  document.body.prepend(overlay);

  const nav = document.createElement('div');
  nav.className = 'nav';
  nav.innerHTML = `
    <span class="brand">✦ Planner</span>
    <nav class="nav-links">
      <a href="index.html" data-page="home">🏠 Home</a>
      <a href="add.html" data-page="add">➕ Add Task</a>
      <a href="personal.html" data-page="personal">👤 Personal</a>
      <div class="nav-sub" id="sub-personal"></div>
      <a href="work.html" data-page="work">💼 Work</a>
      <div class="nav-sub" id="sub-work"></div>
      <a href="calendar.html" data-page="calendar">📅 Schedule</a>
      <a href="done.html" data-page="done">✓ Done</a>
      <a href="trash.html" data-page="trash">🗑 Trash</a>
    </nav>
    <div class="nav-footer">
      <span class="user" id="nav-user"></span>
      <div class="nav-footer-row">
        <button class="theme-btn" id="theme-btn" title="Toggle theme">☀️</button>
        <button id="nav-logout">Sign out</button>
      </div>
    </div>
  `;
  document.body.prepend(nav);
  const link = nav.querySelector(`a[data-page="${active}"]`);
  if (link) link.classList.add('active');
  nav.querySelector('#nav-logout').addEventListener('click', () => db.auth.signOut());
  nav.querySelector('#theme-btn').addEventListener('click', toggleTheme);
  updateThemeBtn();

  // Мобайл нээх/хаах
  burger.addEventListener('click', () => {
    nav.classList.toggle('open');
    overlay.classList.toggle('show');
  });
  overlay.addEventListener('click', () => {
    nav.classList.remove('open');
    overlay.classList.remove('show');
  });

  // Фолдеруудыг ачаалж дэд цэст харуулах
  await renderNavFolders(active);
}

// Sidebar доторх фолдер дэд цэс
async function renderNavFolders(active) {
  const { data } = await db.from('folders').select('*').order('id', { ascending: true });
  const folders = data || [];
  const params = new URLSearchParams(window.location.search);
  const activeFolder = params.get('folder');

  ['personal', 'work'].forEach(cat => {
    const container = document.getElementById('sub-' + cat);
    if (!container) return;
    const catFolders = folders.filter(f => (f.category || 'work') === cat);
    container.innerHTML = '';
    catFolders.forEach(f => {
      const a = document.createElement('a');
      a.className = 'nav-folder';
      a.href = cat + '.html?folder=' + f.id;
      a.innerText = '📁 ' + f.name;
      if (active === cat && String(activeFolder) === String(f.id)) a.classList.add('active');
      container.appendChild(a);
    });
  });
}

// ===== Нэвтрэлт шалгах. Нэвтрээгүй бол auth дэлгэц рүү шилжүүлнэ =====
// onReady(user) — нэвтэрсэн үед дуудагдана.
async function requireAuth(activePage, onReady) {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    // Нэвтрэх дэлгэц рүү (бүх хуудас auth-г index дээр харуулна)
    if (activePage !== 'auth') {
      sessionStorage.setItem('redirectTo', activePage);
      window.location.href = 'login.html';
    }
    return;
  }
  renderNav(activePage);
  document.getElementById('nav-user').innerText = session.user.email;
  onReady(session.user);
}

// ===== Огнооны туслах функцууд =====
function formatDate(d) {
  if (!d) return '';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function formatTime(t) {
  if (!t) return '';
  return t.slice(0, 5); // 'HH:MM:SS' -> 'HH:MM'
}
function isOverdue(d, completed) {
  if (!d || completed) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(d + 'T00:00:00') < today;
}

// ===== Чухал зэргийн нэр =====
const PRIORITY_LABELS = { 0: '', 1: 'Medium', 2: 'High' };

// ===== Status =====
const STATUS_LABELS = { todo: 'Not started', doing: 'In progress', done: 'Done' };

// Нэгдсэн status dropdown — хаа сайгүй ижил харагдана.
// task: даалгавар, onChange: солигдсоны дараа дуудах callback
function buildStatusSelect(task, onChange) {
  const sel = document.createElement('select');
  sel.className = 'status-select';
  sel.innerHTML = `
    <option value="todo">○ Not started</option>
    <option value="doing">◐ In progress</option>
    <option value="done">● Done</option>`;
  sel.value = task.status || (task.is_completed ? 'done' : 'todo');
  sel.setAttribute('data-status', sel.value);
  sel.onclick = (e) => e.stopPropagation();
  sel.onchange = async (e) => {
    e.stopPropagation();
    const next = sel.value;
    sel.setAttribute('data-status', next);
    await db.from('todos').update({ status: next, is_completed: next === 'done' }).eq('id', task.id);
    task.status = next; task.is_completed = (next === 'done');
    if (onChange) onChange();
  };
  return sel;
}

// ===== Flatpickr огноо сонгогч холбох (цаг заавал биш) =====
// el — input элемент. Flatpickr ачаалагдсан бол гоё календарь, үгүй бол уугуул input.
function attachDatePicker(el, withTime) {
  if (typeof flatpickr === 'undefined') return; // CDN ачаалагдаагүй бол уугуул input хэвээр
  flatpickr(el, {
    dateFormat: withTime ? 'Y-m-d H:i' : 'Y-m-d',
    enableTime: !!withTime,
    time_24hr: true,
    allowInput: true
  });
}

// ===== Нэг даалгаврын <li> элемент үүсгэх =====
// onChange — toggle/delete/edit хийсний дараа жагсаалтыг дахин ачаалах callback
function buildTaskLi(task, onChange) {
  const li = document.createElement('li');
  li.className = 'task';

  // ---- Энгийн (харах) горим ----
  function renderView() {
    li.innerHTML = '';
    li.className = 'task';

    // Check (дарахад дууссан/буцаах)
    const check = document.createElement('div');
    check.className = 'check' + (task.is_completed ? ' done' : '');
    check.innerText = '✓';
    check.onclick = async () => {
      const nowDone = !task.is_completed;
      await db.from('todos').update({
        is_completed: nowDone,
        status: nowDone ? 'done' : 'todo'
      }).eq('id', task.id);
      onChange();
    };

    const main = document.createElement('div');
    main.className = 'task-main';
    main.style.cursor = 'pointer';
    main.onclick = (e) => {
      if (e.target.closest('.status-select')) return;
      window.location.href = 'task.html?id=' + task.id;
    };

    // Гарчгийн мөр (priority цэг + текст)
    const titleRow = document.createElement('div');
    titleRow.style.display = 'flex';
    titleRow.style.alignItems = 'center';
    titleRow.style.gap = '8px';
    if (task.priority > 0) {
      const dot = document.createElement('div');
      dot.className = 'prio-dot p' + task.priority;
      titleRow.appendChild(dot);
    }
    const title = document.createElement('div');
    title.className = 'task-title' + (task.is_completed ? ' completed' : '');
    title.innerText = (task.kind === 'meeting' ? '👥 ' : '') + task.title;
    titleRow.appendChild(title);
    main.appendChild(titleRow);

    // Тайлбар (байвал)
    if (task.description) {
      const desc = document.createElement('div');
      desc.className = 'task-desc';
      desc.innerText = task.description;
      main.appendChild(desc);
    }

    // Шошгууд
    const meta = document.createElement('div');
    meta.className = 'task-meta';

    // Төлөв — нэгдсэн dropdown
    meta.appendChild(buildStatusSelect(task, onChange));

    const catTag = document.createElement('span');
    catTag.className = 'tag ' + (task.category === 'work' ? 'work' : 'personal');
    catTag.innerText = task.category === 'work' ? 'Work' : 'Personal';
    meta.appendChild(catTag);
    if (task.priority > 0) {
      const pTag = document.createElement('span');
      pTag.className = 'tag prio-' + task.priority;
      pTag.innerText = '⚑ ' + PRIORITY_LABELS[task.priority];
      meta.appendChild(pTag);
    }
    if (task.due_date) {
      const dueTag = document.createElement('span');
      dueTag.className = 'tag due' + (isOverdue(task.due_date, task.is_completed) ? ' overdue' : '');
      let dueText = '📅 ' + formatDate(task.due_date);
      if (task.due_time) dueText += ' ' + formatTime(task.due_time);
      dueTag.innerText = dueText;
      meta.appendChild(dueTag);
    }
    if (task.assignee) {
      const aTag = document.createElement('span');
      aTag.className = 'tag';
      aTag.style.cssText = 'background:var(--bg);color:var(--muted);border:1px solid var(--border);';
      aTag.innerText = '👤 ' + task.assignee;
      meta.appendChild(aTag);
    }
    main.appendChild(meta);

    const edit = document.createElement('button');
    edit.className = 'edit-btn';
    edit.innerText = '✎';
    edit.title = 'Edit';
    edit.onclick = renderEdit;

    const del = document.createElement('button');
    del.className = 'del-btn';
    del.innerText = '✕';
    del.title = 'Move to trash';
    del.onclick = async () => {
      await db.from('todos').update({ is_deleted: true }).eq('id', task.id);
      onChange();
    };

    li.append(check, main, edit, del);
  }

  // ---- Засах горим ----
  function renderEdit() {
    li.innerHTML = '';
    const form = document.createElement('div');
    form.className = 'edit-form';

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = task.title;
    titleInput.placeholder = 'Title';

    const descInput = document.createElement('textarea');
    descInput.value = task.description || '';
    descInput.placeholder = 'Description (optional)';
    descInput.rows = 3;
    descInput.style.cssText = 'width:100%;padding:11px 13px;background:var(--bg);border:1px solid var(--border);border-radius:9px;color:var(--text);font-size:14px;font-family:inherit;margin-bottom:8px;resize:vertical;';

    const row = document.createElement('div');
    row.className = 'edit-row';

    const dueInput = document.createElement('input');
    dueInput.type = 'text';
    dueInput.placeholder = 'Date';
    dueInput.style.width = '130px';
    if (task.due_date) dueInput.value = task.due_date;

    const timeInput = document.createElement('input');
    timeInput.type = 'time';
    timeInput.title = 'Time (optional)';
    if (task.due_time) timeInput.value = formatTime(task.due_time);

    const catSelect = document.createElement('select');
    catSelect.innerHTML = `
      <option value="personal">Personal</option>
      <option value="work">Work</option>`;
    catSelect.value = task.category === 'work' ? 'work' : 'personal';

    const prioSelect = document.createElement('select');
    prioSelect.innerHTML = `
      <option value="0">Normal</option>
      <option value="1">Medium ⚑</option>
      <option value="2">High ⚑</option>`;
    prioSelect.value = String(task.priority || 0);

    const statusSelect = document.createElement('select');
    statusSelect.innerHTML = `
      <option value="todo">Not started</option>
      <option value="doing">In progress</option>
      <option value="done">Done</option>`;
    statusSelect.value = task.status || (task.is_completed ? 'done' : 'todo');

    const kindSelect = document.createElement('select');
    kindSelect.innerHTML = `
      <option value="task">Task</option>
      <option value="meeting">Meeting 👥</option>`;
    kindSelect.value = task.kind === 'meeting' ? 'meeting' : 'task';

    const assigneeInput = document.createElement('input');
    assigneeInput.type = 'text';
    assigneeInput.placeholder = 'Assigned to (optional)';
    assigneeInput.value = task.assignee || '';
    assigneeInput.style.cssText = 'margin-bottom:8px;';

    const actions = document.createElement('div');
    actions.className = 'edit-actions';
    const save = document.createElement('button');
    save.className = 'btn-save';
    save.innerText = 'Save';
    save.onclick = async () => {
      const newTitle = titleInput.value.trim();
      if (!newTitle) { titleInput.focus(); return; }
      const st = statusSelect.value;
      // Ангилал өөрчлөгдвөл фолдероос салгах (фолдер нь ангилалд хамаардаг)
      const categoryChanged = catSelect.value !== task.category;
      const upd = {
        title: newTitle,
        description: descInput.value.trim() || null,
        due_date: dueInput.value || null,
        due_time: timeInput.value || null,
        category: catSelect.value,
        priority: parseInt(prioSelect.value, 10),
        status: st,
        is_completed: st === 'done',
        kind: kindSelect.value,
        assignee: assigneeInput.value.trim() || null
      };
      if (categoryChanged) upd.folder_id = null;
      await db.from('todos').update(upd).eq('id', task.id);
      onChange();
    };
    const cancel = document.createElement('button');
    cancel.className = 'btn-cancel';
    cancel.innerText = 'Cancel';
    cancel.onclick = renderView;
    actions.append(save, cancel);

    row.append(dueInput, timeInput, catSelect, prioSelect, statusSelect, kindSelect, actions);
    form.append(titleInput, descInput, assigneeInput, row);
    li.append(form);
    attachDatePicker(dueInput, false); // огнооны гоё календарь
    titleInput.focus();
  }

  renderView();
  return li;
}

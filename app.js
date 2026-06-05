// ===== Supabase холболт =====
// anon/publishable key браузерт орохдоо аюулгүй — RLS-ээр хамгаалагдсан.
const SUPABASE_URL = 'https://vxkkjzligcvhutfzjpii.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xObTJJiaRusXc8PH9LfhQg_foFrvoWK';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Minimal stroke-based SVG icons for sidebar nav
const IC = {
  home:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M9 21v-9h6v9"/></svg>`,
  add:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
  user:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
  work:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`,
  cal:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  done:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></svg>`,
  trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>`,
  fold:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>`,
  search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>`,
  pencil: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`,
  meet:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
};

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
    <span class="brand">Planner</span>
    <nav class="nav-links">
      <a href="index.html" data-page="home"><span class="nav-icon">${IC.home}</span>Home</a>
      <a href="search.html" data-page="search"><span class="nav-icon">${IC.search}</span>Search</a>
      <a href="add.html" data-page="add"><span class="nav-icon">${IC.add}</span>Add Task</a>
      <span class="nav-section-label">Tasks</span>
      <div class="nav-sub-group">
        <a href="personal.html" data-page="personal"><span class="nav-icon">${IC.user}</span>Personal</a>
        <a href="work.html" data-page="work"><span class="nav-icon">${IC.work}</span>Work</a>
      </div>
      <a href="calendar.html" data-page="calendar"><span class="nav-icon">${IC.cal}</span>Schedule</a>
      <a href="done.html" data-page="done"><span class="nav-icon">${IC.done}</span>Done</a>
      <a href="trash.html" data-page="trash"><span class="nav-icon">${IC.trash}</span>Trash</a>
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

function renderNavFolders() {}

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
function buildTaskLi(task, onChange, opts) {
  opts = opts || {};
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
    if (task.kind === 'meeting') {
      const mi = document.createElement('span');
      mi.className = 'meet-icon';
      mi.innerHTML = IC.meet;
      title.appendChild(mi);
    }
    title.appendChild(document.createTextNode(task.title));
    titleRow.appendChild(title);
    main.appendChild(titleRow);

    // Тайлбар (байвал)
    if (task.description && !opts.hideDesc) {
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

    if (!opts.hideCatTag) {
      const catTag = document.createElement('span');
      catTag.className = 'tag ' + (task.category === 'work' ? 'work' : 'personal');
      catTag.innerText = task.category === 'work' ? 'Work' : 'Personal';
      meta.appendChild(catTag);
    }
    if (task.priority > 0) {
      const pTag = document.createElement('span');
      pTag.className = 'tag prio-' + task.priority;
      pTag.innerText = '⚑ ' + PRIORITY_LABELS[task.priority];
      meta.appendChild(pTag);
    }
    if (task.due_date) {
      const dueTag = document.createElement('span');
      dueTag.className = 'tag due' + (isOverdue(task.due_date, task.is_completed) ? ' overdue' : '');
      let dueText = formatDate(task.due_date);
      if (task.due_time) dueText += ' · ' + formatTime(task.due_time);
      dueTag.innerText = dueText;
      meta.appendChild(dueTag);
    }
    if (task.assignee) {
      const aTag = document.createElement('span');
      aTag.className = 'tag';
      aTag.style.cssText = 'background:var(--bg);color:var(--muted);border:1px solid var(--border);';
      aTag.innerText = task.assignee;
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

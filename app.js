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
function renderNav(active) {
  // Мобайл нээх товч
  const burger = document.createElement('button');
  burger.className = 'nav-burger';
  burger.innerHTML = '☰';
  burger.setAttribute('aria-label', 'Цэс');
  document.body.prepend(burger);

  // Бүрхүүл (мобайлд цэс нээгдэхэд арын бараан давхарга)
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  document.body.prepend(overlay);

  const nav = document.createElement('div');
  nav.className = 'nav';
  nav.innerHTML = `
    <span class="brand">✦ Төлөвлөгөө</span>
    <nav class="nav-links">
      <a href="index.html" data-page="home">🏠 Нүүр</a>
      <a href="personal.html" data-page="personal">👤 Хувийн</a>
      <a href="work.html" data-page="work">💼 Ажил</a>
      <a href="calendar.html" data-page="calendar">📅 Хуваарь</a>
      <a href="done.html" data-page="done">✓ Дууссан</a>
    </nav>
    <div class="nav-footer">
      <span class="user" id="nav-user"></span>
      <div class="nav-footer-row">
        <button class="theme-btn" id="theme-btn" title="Сэдэв солих">☀️</button>
        <button id="nav-logout">Гарах</button>
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
  return date.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' });
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
const PRIORITY_LABELS = { 0: '', 1: 'Дунд', 2: 'Өндөр' };

// ===== Явцын төлөв =====
const STATUS_LABELS = { todo: 'Эхлээгүй', doing: 'Явц дээр', done: 'Дууссан' };

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

    // Төлөв (дарахад эхлээгүй -> явц дээр -> дууссан -> эхлээгүй)
    const statusTag = document.createElement('span');
    const st = task.status || (task.is_completed ? 'done' : 'todo');
    statusTag.className = 'tag status status-' + st;
    statusTag.innerText = STATUS_LABELS[st];
    statusTag.title = 'Дарж төлөв солих';
    statusTag.style.cursor = 'pointer';
    statusTag.onclick = async () => {
      const order = ['todo', 'doing', 'done'];
      const next = order[(order.indexOf(st) + 1) % 3];
      await db.from('todos').update({
        status: next,
        is_completed: next === 'done'
      }).eq('id', task.id);
      onChange();
    };
    meta.appendChild(statusTag);

    const catTag = document.createElement('span');
    catTag.className = 'tag ' + (task.category === 'work' ? 'work' : 'personal');
    catTag.innerText = task.category === 'work' ? 'Ажил' : 'Хувийн';
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
    edit.title = 'Засах';
    edit.onclick = renderEdit;

    const del = document.createElement('button');
    del.className = 'del-btn';
    del.innerText = '✕';
    del.title = 'Устгах';
    del.onclick = async () => {
      await db.from('todos').delete().eq('id', task.id);
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
    titleInput.placeholder = 'Гарчиг';

    const descInput = document.createElement('textarea');
    descInput.value = task.description || '';
    descInput.placeholder = 'Тайлбар (заавал биш)';
    descInput.rows = 3;
    descInput.style.cssText = 'width:100%;padding:11px 13px;background:var(--bg);border:1px solid var(--border);border-radius:9px;color:var(--text);font-size:14px;font-family:inherit;margin-bottom:8px;resize:vertical;';

    const row = document.createElement('div');
    row.className = 'edit-row';

    const dueInput = document.createElement('input');
    dueInput.type = 'text';
    dueInput.placeholder = 'Огноо';
    dueInput.style.width = '130px';
    if (task.due_date) dueInput.value = task.due_date;

    const timeInput = document.createElement('input');
    timeInput.type = 'time';
    timeInput.title = 'Цаг (заавал биш)';
    if (task.due_time) timeInput.value = formatTime(task.due_time);

    const catSelect = document.createElement('select');
    catSelect.innerHTML = `
      <option value="personal">Хувийн</option>
      <option value="work">Ажил</option>`;
    catSelect.value = task.category === 'work' ? 'work' : 'personal';

    const prioSelect = document.createElement('select');
    prioSelect.innerHTML = `
      <option value="0">Энгийн</option>
      <option value="1">Дунд ⚑</option>
      <option value="2">Өндөр ⚑</option>`;
    prioSelect.value = String(task.priority || 0);

    const statusSelect = document.createElement('select');
    statusSelect.innerHTML = `
      <option value="todo">Эхлээгүй</option>
      <option value="doing">Явц дээр</option>
      <option value="done">Дууссан</option>`;
    statusSelect.value = task.status || (task.is_completed ? 'done' : 'todo');

    const kindSelect = document.createElement('select');
    kindSelect.innerHTML = `
      <option value="task">Даалгавар</option>
      <option value="meeting">Уулзалт 👥</option>`;
    kindSelect.value = task.kind === 'meeting' ? 'meeting' : 'task';

    const assigneeInput = document.createElement('input');
    assigneeInput.type = 'text';
    assigneeInput.placeholder = 'Хариуцах хүн (заавал биш)';
    assigneeInput.value = task.assignee || '';
    assigneeInput.style.cssText = 'margin-bottom:8px;';

    const actions = document.createElement('div');
    actions.className = 'edit-actions';
    const save = document.createElement('button');
    save.className = 'btn-save';
    save.innerText = 'Хадгалах';
    save.onclick = async () => {
      const newTitle = titleInput.value.trim();
      if (!newTitle) { titleInput.focus(); return; }
      const st = statusSelect.value;
      await db.from('todos').update({
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
      }).eq('id', task.id);
      onChange();
    };
    const cancel = document.createElement('button');
    cancel.className = 'btn-cancel';
    cancel.innerText = 'Болих';
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

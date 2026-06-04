// ===== Supabase холболт =====
// anon/publishable key браузерт орохдоо аюулгүй — RLS-ээр хамгаалагдсан.
const SUPABASE_URL = 'https://vxkkjzligcvhutfzjpii.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xObTJJiaRusXc8PH9LfhQg_foFrvoWK';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Навигаци зурах =====
function renderNav(active) {
  const nav = document.createElement('div');
  nav.className = 'nav';
  nav.innerHTML = `
    <span class="brand">✦ Төлөвлөгөө</span>
    <a href="index.html" data-page="home">Нүүр</a>
    <a href="personal.html" data-page="personal">Хувийн</a>
    <a href="work.html" data-page="work">Ажил</a>
    <span class="spacer"></span>
    <span class="user" id="nav-user"></span>
    <button id="nav-logout">Гарах</button>
  `;
  document.body.prepend(nav);
  const link = nav.querySelector(`a[data-page="${active}"]`);
  if (link) link.classList.add('active');
  nav.querySelector('#nav-logout').addEventListener('click', () => db.auth.signOut());
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
function isOverdue(d, completed) {
  if (!d || completed) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(d + 'T00:00:00') < today;
}

// ===== Чухал зэргийн нэр =====
const PRIORITY_LABELS = { 0: '', 1: 'Дунд', 2: 'Өндөр' };

// ===== Нэг даалгаврын <li> элемент үүсгэх =====
// onChange — toggle/delete/edit хийсний дараа жагсаалтыг дахин ачаалах callback
function buildTaskLi(task, onChange) {
  const li = document.createElement('li');
  li.className = 'task';

  // ---- Энгийн (харах) горим ----
  function renderView() {
    li.innerHTML = '';
    li.className = 'task';

    const check = document.createElement('div');
    check.className = 'check' + (task.is_completed ? ' done' : '');
    check.innerText = '✓';
    check.onclick = async () => {
      await db.from('todos').update({ is_completed: !task.is_completed }).eq('id', task.id);
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
    title.innerText = task.title;
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
      dueTag.innerText = '📅 ' + formatDate(task.due_date);
      meta.appendChild(dueTag);
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
    dueInput.type = 'date';
    if (task.due_date) dueInput.value = task.due_date;

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

    const actions = document.createElement('div');
    actions.className = 'edit-actions';
    const save = document.createElement('button');
    save.className = 'btn-save';
    save.innerText = 'Хадгалах';
    save.onclick = async () => {
      const newTitle = titleInput.value.trim();
      if (!newTitle) { titleInput.focus(); return; }
      await db.from('todos').update({
        title: newTitle,
        description: descInput.value.trim() || null,
        due_date: dueInput.value || null,
        category: catSelect.value,
        priority: parseInt(prioSelect.value, 10)
      }).eq('id', task.id);
      onChange();
    };
    const cancel = document.createElement('button');
    cancel.className = 'btn-cancel';
    cancel.innerText = 'Болих';
    cancel.onclick = renderView;
    actions.append(save, cancel);

    row.append(dueInput, catSelect, prioSelect, actions);
    form.append(titleInput, descInput, row);
    li.append(form);
    titleInput.focus();
  }

  renderView();
  return li;
}
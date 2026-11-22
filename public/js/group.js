// Group detail page. Everything here edits the in-memory MOCK data only;
// refreshing the page resets it. Later, each handler becomes an API call.

const me = MOCK.currentUser._id;
const groupId = new URLSearchParams(location.search).get('id') || MOCK.groups[0]._id;
const group = MOCK.groups.find((g) => g._id === groupId) || MOCK.groups[0];
const myRole = (group.members.find((m) => m.user === me) || {}).role || 'member';
const canOrganize = myRole === 'owner' || myRole === 'organizer';

// ---------- Header ----------
document.title = `${group.name} · Hangout Planner`;
document.getElementById('group-name').textContent = group.name;
document.getElementById('group-desc').textContent = group.description || '';
document.getElementById('group-code').textContent = group.inviteCode;
document.getElementById('copy-code').addEventListener('click', () => {
  navigator.clipboard?.writeText(group.inviteCode);
  showToast('Invite code copied');
});
document.querySelectorAll('.organizer-only').forEach((el) => (el.hidden = !canOrganize));

// ---------- Tabs ----------
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
    document.querySelectorAll('.tab-panel').forEach((p) => (p.hidden = p.id !== tab.dataset.tab));
    history.replaceState(null, '', '#tab=' + tab.dataset.tab);
  });
});
// Open the tab named in the URL, e.g. group.html?id=g1#tab=tasks
// ("tab=" prefix so the browser doesn't also scroll to the panel's id)
document.querySelector(`.tab[data-tab="${location.hash.replace('#tab=', '')}"]`)?.click();

// ---------- Hangouts ----------
function voteOptionsHtml(hangout, kind) {
  const options = hangout[kind];
  const total = Math.max(1, ...options.map((o) => o.votes.length));
  return options
    .map((o) => {
      const voted = o.votes.includes(me);
      const pct = Math.round((o.votes.length / total) * 100);
      return `
        <button class="vote-option ${voted ? 'voted' : ''}" data-hangout="${hangout._id}" data-kind="${kind}" data-option="${o._id}">
          <span class="bar" style="width:${pct}%"></span>
          <span class="label">${escapeHtml(o.label)}</span>
          <span class="muted small">${o.votes.length} vote${o.votes.length === 1 ? '' : 's'}</span>
        </button>`;
    })
    .join('');
}

function topOption(options) {
  return options.reduce((best, o) => (o.votes.length > best.votes.length ? o : best), options[0]);
}

function renderHangouts() {
  const list = document.getElementById('hangout-list');
  if (!group.hangouts.length) {
    list.innerHTML = '<div class="card empty">No hangouts yet.</div>';
    return;
  }
  list.innerHTML = group.hangouts
    .map((h) => {
      if (h.status === 'finalized') {
        return `
          <div class="card">
            <div class="card-header"><h3>${escapeHtml(h.title)}</h3><span class="badge badge-finalized">Finalized</span></div>
            <p style="margin:0">📅 ${escapeHtml(h.finalDate)}</p>
            <p style="margin:0">📍 ${escapeHtml(h.finalPlace)}</p>
          </div>`;
      }
      return `
        <div class="card">
          <div class="card-header"><h3>${escapeHtml(h.title)}</h3><span class="badge badge-voting">Voting</span></div>
          <div class="vote-grid">
            <div><div class="muted small">When?</div>${voteOptionsHtml(h, 'dateOptions')}</div>
            <div><div class="muted small">Where?</div>${voteOptionsHtml(h, 'placeOptions')}</div>
          </div>
          ${canOrganize ? `<button class="btn btn-sm" style="margin-top:12px" data-finalize="${h._id}">Finalize with top votes</button>` : ''}
        </div>`;
    })
    .join('');
}

document.getElementById('hangout-list').addEventListener('click', (e) => {
  const option = e.target.closest('.vote-option');
  if (option) {
    const h = group.hangouts.find((x) => x._id === option.dataset.hangout);
    const o = h[option.dataset.kind].find((x) => x._id === option.dataset.option);
    o.votes = o.votes.includes(me) ? o.votes.filter((v) => v !== me) : [...o.votes, me];
    renderHangouts();
    return;
  }
  const finalize = e.target.closest('[data-finalize]');
  if (finalize) {
    const h = group.hangouts.find((x) => x._id === finalize.dataset.finalize);
    h.status = 'finalized';
    h.finalDate = topOption(h.dateOptions).label;
    h.finalPlace = topOption(h.placeOptions).label;
    renderHangouts();
    showToast('Hangout finalized');
  }
});

document.getElementById('hangout-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const toOptions = (id, prefix) =>
    document
      .getElementById(id)
      .value.split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((label, i) => ({ _id: `${prefix}${Date.now()}${i}`, label, votes: [] }));
  group.hangouts.unshift({
    _id: 'h' + Date.now(),
    title: document.getElementById('hangout-title').value,
    status: 'voting',
    dateOptions: toOptions('hangout-dates', 'd'),
    placeOptions: toOptions('hangout-places', 'p'),
  });
  e.target.reset();
  closeModal('hangout-modal');
  renderHangouts();
});

// ---------- Tasks ----------
// Owners/organizers assign tasks to anyone and set their order;
// members can only claim or unclaim tasks for themselves.
document.getElementById('task-hint').textContent = canOrganize
  ? 'Drag ⠿ to reorder, and pick who does each task'
  : 'Claim a task to let everyone know you’ve got it';

function assignSelectHtml(task) {
  const options = group.members
    .map(
      (m) =>
        `<option value="${m.user}" ${m.user === task.claimedBy ? 'selected' : ''}>${escapeHtml(m.user === me ? 'You' : userName(m.user))}</option>`
    )
    .join('');
  return `<select data-assign="${task._id}" style="width:auto"><option value="">Unassigned</option>${options}</select>`;
}

function claimHtml(task) {
  if (!task.claimedBy) return `<button class="btn btn-sm" data-claim="${task._id}">Claim</button>`;
  if (task.claimedBy === me) {
    return `<span class="small">You · <button class="btn-link small" data-unclaim="${task._id}">unclaim</button></span>`;
  }
  return `<span class="small muted">${escapeHtml(userName(task.claimedBy))}</span>`;
}

function renderTasks() {
  const list = document.getElementById('task-list');
  if (!group.tasks.length) {
    list.innerHTML = '<li class="empty">No tasks yet.</li>';
    return;
  }
  list.innerHTML = group.tasks
    .map((t, i) => {
      // Only the handle is draggable, so the assign dropdown still works normally
      const handle = canOrganize
        ? `<span class="drag-handle" draggable="true" title="Drag to reorder">⠿</span>`
        : '';
      return `
        <li data-task="${t._id}">
          <span class="task-title">${handle}<span class="muted small">${i + 1}.</span> ${escapeHtml(t.title)}</span>
          ${canOrganize ? assignSelectHtml(t) : claimHtml(t)}
        </li>`;
    })
    .join('');
}

document.getElementById('task-list').addEventListener('click', (e) => {
  const claim = e.target.closest('[data-claim]');
  const unclaim = e.target.closest('[data-unclaim]');
  if (claim) {
    group.tasks.find((t) => t._id === claim.dataset.claim).claimedBy = me;
  } else if (unclaim) {
    group.tasks.find((t) => t._id === unclaim.dataset.unclaim).claimedBy = null;
  } else {
    return; // e.g. a click on an assign dropdown; re-rendering would close it
  }
  renderTasks();
});

document.getElementById('task-list').addEventListener('change', (e) => {
  const select = e.target.closest('[data-assign]');
  if (!select) return;
  const task = group.tasks.find((t) => t._id === select.dataset.assign);
  task.claimedBy = select.value || null;
  showToast(task.claimedBy ? `“${task.title}” assigned to ${userName(task.claimedBy)}` : `“${task.title}” is unassigned`);
});

// Drag-and-drop reordering (owners/organizers only)
const taskList = document.getElementById('task-list');
let draggingId = null;

function clearDropMarkers() {
  taskList.querySelectorAll('.drop-before, .drop-after').forEach((li) => li.classList.remove('drop-before', 'drop-after'));
}

// Drop above the hovered task if the pointer is in its top half, otherwise below
function dropsAfter(li, e) {
  const rect = li.getBoundingClientRect();
  return e.clientY > rect.top + rect.height / 2;
}

taskList.addEventListener('dragstart', (e) => {
  const li = e.target.closest('li[data-task]');
  if (!li) return;
  draggingId = li.dataset.task;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', draggingId); // Firefox won't drag without data
  e.dataTransfer.setDragImage(li, 20, li.offsetHeight / 2);
  li.classList.add('dragging');
});

taskList.addEventListener('dragover', (e) => {
  const li = e.target.closest('li[data-task]');
  if (!draggingId || !li) return;
  e.preventDefault(); // allow dropping here
  clearDropMarkers();
  if (li.dataset.task !== draggingId) li.classList.add(dropsAfter(li, e) ? 'drop-after' : 'drop-before');
});

taskList.addEventListener('drop', (e) => {
  const li = e.target.closest('li[data-task]');
  if (!draggingId || !li) return;
  e.preventDefault();
  if (li.dataset.task !== draggingId) {
    const [moved] = group.tasks.splice(group.tasks.findIndex((t) => t._id === draggingId), 1);
    const target = group.tasks.findIndex((t) => t._id === li.dataset.task);
    group.tasks.splice(dropsAfter(li, e) ? target + 1 : target, 0, moved);
  }
  renderTasks();
});

taskList.addEventListener('dragend', () => {
  draggingId = null;
  clearDropMarkers();
  taskList.querySelector('.dragging')?.classList.remove('dragging');
});

document.getElementById('task-form').addEventListener('submit', (e) => {
  e.preventDefault();
  group.tasks.push({ _id: 't' + Date.now(), title: document.getElementById('task-title').value, claimedBy: null });
  e.target.reset();
  renderTasks();
});

// ---------- Expenses ----------
// Positive balance = the group owes this person; negative = they owe the group.
function computeBalances() {
  const balances = Object.fromEntries(group.members.map((m) => [m.user, 0]));
  group.expenses.forEach((exp) => {
    const share = exp.amount / exp.splitAmong.length;
    balances[exp.paidBy] = (balances[exp.paidBy] || 0) + exp.amount;
    exp.splitAmong.forEach((id) => (balances[id] = (balances[id] || 0) - share));
  });
  return balances;
}

function renderExpenses() {
  const list = document.getElementById('expense-list');
  list.innerHTML = group.expenses.length
    ? group.expenses
        .map(
          (exp) => `
          <li>
            <span>${escapeHtml(exp.description)}<br><span class="muted small">Paid by ${escapeHtml(userName(exp.paidBy))}</span></span>
            <strong>${money(exp.amount)}</strong>
          </li>`
        )
        .join('')
    : '<li class="empty">No expenses yet.</li>';

  const balances = computeBalances();
  document.getElementById('balance-list').innerHTML = Object.entries(balances)
    .map(([id, amt]) => {
      const cls = amt > 0.005 ? 'balance-pos' : amt < -0.005 ? 'balance-neg' : 'muted';
      const text = amt > 0.005 ? `gets ${money(amt)}` : amt < -0.005 ? `owes ${money(-amt)}` : 'settled';
      return `<li>${personHtml(id)}<span class="small ${cls}">${text}</span></li>`;
    })
    .join('');
}

document.getElementById('expense-payer').innerHTML = group.members
  .map((m) => `<option value="${m.user}" ${m.user === me ? 'selected' : ''}>Paid by ${escapeHtml(userName(m.user))}</option>`)
  .join('');

document.getElementById('expense-form').addEventListener('submit', (e) => {
  e.preventDefault();
  group.expenses.push({
    _id: 'e' + Date.now(),
    description: document.getElementById('expense-desc').value,
    amount: parseFloat(document.getElementById('expense-amount').value),
    paidBy: document.getElementById('expense-payer').value,
    splitAmong: group.members.map((m) => m.user),
  });
  e.target.reset();
  document.getElementById('expense-payer').value = me;
  renderExpenses();
});

// ---------- Members ----------
function renderMembers() {
  document.getElementById('member-count').textContent = `${group.members.length} members`;
  document.getElementById('member-list').innerHTML = group.members
    .map((m) => {
      // Owners can change other people's roles; everyone else just sees a badge
      const control =
        myRole === 'owner' && m.user !== me
          ? `<select data-member="${m.user}" style="width:auto">
               ${['organizer', 'member'].map((r) => `<option ${r === m.role ? 'selected' : ''}>${r}</option>`).join('')}
             </select>`
          : roleBadge(m.role);
      return `<li>${personHtml(m.user)}${control}</li>`;
    })
    .join('');
}

document.getElementById('member-list').addEventListener('change', (e) => {
  const member = group.members.find((m) => m.user === e.target.dataset.member);
  member.role = e.target.value;
  showToast(`${userName(member.user)} is now ${member.role}`);
});

renderHangouts();
renderTasks();
renderExpenses();
renderMembers();

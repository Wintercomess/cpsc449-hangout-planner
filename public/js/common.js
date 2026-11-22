// Small helpers shared by every page of the mockup.

function userName(id) {
  const user = MOCK.users[id];
  return user ? user.name : 'Unknown';
}

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function roleBadge(role) {
  return `<span class="badge badge-${role}">${role}</span>`;
}

function personHtml(id) {
  const name = userName(id);
  return `<span class="person"><span class="avatar">${initials(name)}</span>${escapeHtml(name)}</span>`;
}

function money(amount) {
  return '$' + amount.toFixed(2);
}

let toastTimer;
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 2200);
}

function openModal(id) {
  document.getElementById(id).hidden = false;
}

function closeModal(id) {
  document.getElementById(id).hidden = true;
}

// Close a modal when clicking the dark backdrop or any [data-close] button
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) e.target.hidden = true;
  const closer = e.target.closest('[data-close]');
  if (closer) closeModal(closer.dataset.close);
});

// Fill in the navbar user chip on pages that have one
document.addEventListener('DOMContentLoaded', () => {
  const slot = document.getElementById('nav-user-name');
  if (slot) slot.innerHTML = personHtml(MOCK.currentUser._id);
});

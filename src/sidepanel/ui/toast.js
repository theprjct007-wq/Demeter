const toastEl = document.getElementById('toast');
let timer = null;

export function showToast(message, kind) {
  toastEl.textContent = message;
  toastEl.className = 'toast visible ' + (kind || 'info');
  clearTimeout(timer);
  timer = setTimeout(() => {
    toastEl.className = 'toast';
  }, 3200);
}

// Theme management: supports Light Mode, Dark Mode, and System Default preference.
// Persists the user's choice in localStorage with zero-flash rehydration.

const STORAGE_KEY = 'demeter_theme';

export function getSystemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function getCurrentTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return getSystemTheme();
}

export function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  if (document.body) {
    document.body.setAttribute('data-theme', theme);
    document.body.classList.toggle('dark-theme', isDark);
    document.body.classList.toggle('light-theme', !isDark);
  }

  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    const nextMode = isDark ? 'Light' : 'Dark';
    const isCustom = Boolean(localStorage.getItem(STORAGE_KEY));
    btn.setAttribute('aria-label', `Switch to ${nextMode} mode`);
    btn.title = `Switch to ${nextMode} mode (Currently ${isDark ? 'Dark' : 'Light'}${isCustom ? '' : ' - System'}. Right-click to match System)`;
    btn.setAttribute('data-current-theme', theme);
  }
}

export function setTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export function resetToSystemTheme() {
  localStorage.removeItem(STORAGE_KEY);
  applyTheme(getSystemTheme());
}

export function toggleTheme() {
  const current = getCurrentTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function initTheme() {
  // Apply the effective theme right away
  applyTheme(getCurrentTheme());

  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      toggleTheme();
    });

    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      resetToSystemTheme();
    });
  }

  // React to OS changes if the user hasn't chosen an explicit override
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}

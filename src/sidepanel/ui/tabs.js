const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('[data-tab-panel]');

export function switchTab(tab) {
  tabButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === tab));
  tabPanels.forEach((panel) => {
    panel.hidden = panel.dataset.tabPanel !== tab;
  });
}

export function initTabs() {
  tabButtons.forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
}

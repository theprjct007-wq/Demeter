// Side panel composition root: wires views together. Views never import
// each other; cross-view behavior goes through the hooks below.
import { api, onLogsChanged } from './api.js';
import { state, applyServerState } from './state.js';
import { run } from './ui/run.js';
import { showToast } from './ui/toast.js';
import { initTabs, switchTab } from './ui/tabs.js';
import { initTheme } from './ui/theme.js';
import { initRulesView, renderRules } from './ui/rules-view.js';
import { initPresetsView, renderPresetOptions } from './ui/presets-view.js';
import { initLogsView, renderLogs } from './ui/logs-view.js';

const masterToggle = document.getElementById('masterToggle');

initTheme();
initTabs();

initRulesView({
  onViewLogs: (ruleId) => {
    state.logFilterRuleId = ruleId;
    switchTab('logs');
    renderLogs();
  }
});

initPresetsView({
  onChange: () => {
    renderRules();
    renderLogs();
  }
});

initLogsView({
  onConvert: async (rule) => {
    const ok = await run(
      () => api.addRule(rule),
      'Rule created from log \u2014 review the pattern before relying on it'
    );
    if (ok) {
      switchTab('mocks');
      renderRules(true);
    }
  }
});

masterToggle.addEventListener('change', () => {
  run(
    () => api.setEnabled(masterToggle.checked),
    masterToggle.checked ? 'Mocking enabled' : 'Mocking disabled \u2014 real requests will pass through'
  );
});

onLogsChanged((logs) => {
  state.logs = logs;
  renderLogs();
});

(async function boot() {
  try {
    applyServerState(await api.getState());
    masterToggle.checked = state.enabled;
    renderPresetOptions();
    renderRules();
    renderLogs();
  } catch (e) {
    showToast('Could not load saved data: ' + e.message, 'error');
  }
})();

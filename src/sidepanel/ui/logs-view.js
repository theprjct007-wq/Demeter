import { api } from '../api.js';
import { state } from '../state.js';
import { defaultRule } from '../../shared/schema.js';
import { run } from './run.js';

const logListEl = document.getElementById('logList');
const emptyLogStateEl = document.getElementById('emptyLogState');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const logTemplate = document.getElementById('logEntryTemplate');
const logContextEl = document.getElementById('logContext');
const logFilterChipEl = document.getElementById('logFilterChip');
const logFilterRuleNameEl = document.getElementById('logFilterRuleName');
const clearLogFilterBtn = document.getElementById('clearLogFilterBtn');

let hooks = { onConvert: () => {} };

function visibleLogs() {
  if (!state.logFilterRuleId) return state.logs;
  return state.logs.filter((e) => e.ruleId === state.logFilterRuleId);
}

export function initLogsView(h) {
  hooks = h;
  clearLogFilterBtn.addEventListener('click', () => {
    state.logFilterRuleId = null;
    renderLogs();
  });
  clearLogsBtn.addEventListener('click', async () => {
    if (await run(() => api.clearLogs(), 'Logs cleared')) renderLogs();
  });
}

export function renderLogs() {
  const visible = visibleLogs();
  logContextEl.textContent = state.activePresetId
    ? 'Showing logs for preset: ' + ((state.presets.find((p) => p.id === state.activePresetId) || {}).name || '(unknown)')
    : 'Showing logs for: Custom (unsaved) context';

  if (state.logFilterRuleId) {
    const r = state.rules.find((x) => x.id === state.logFilterRuleId);
    logFilterChipEl.hidden = false;
    logFilterRuleNameEl.textContent = r ? r.name : '(deleted rule)';
  } else {
    logFilterChipEl.hidden = true;
  }

  logListEl.innerHTML = '';
  emptyLogStateEl.style.display = visible.length ? 'none' : 'block';

  visible.forEach((entry) => {
    const node = logTemplate.content.cloneNode(true);
    const statusEl = node.querySelector('.log-status');
    const urlEl = node.querySelector('.log-url');
    const convertBtn = node.querySelector('.btn-convert');

    node.querySelector('.log-dot').classList.add(entry.mocked ? 'mocked' : 'real');
    const logMethodEl = node.querySelector('.log-method');
    logMethodEl.textContent = entry.method || 'GET';
    logMethodEl.dataset.method = entry.method || 'GET';
    statusEl.textContent = entry.status || '?';
    statusEl.classList.add(entry.status && entry.status < 400 ? 'status-ok' : 'status-err');
    urlEl.textContent = entry.url;
    urlEl.title = entry.url;
    convertBtn.textContent = entry.mocked ? 'Already mocked' : 'Convert to Mock';
    convertBtn.disabled = !!entry.mocked;

    convertBtn.addEventListener('click', () => {
      const rule = defaultRule();
      rule.name = 'From log: ' + entry.method + ' ' + entry.url.split('/').pop();
      rule.urlPattern = entry.url;
      rule.method = entry.method || 'GET';
      rule.statusCode = entry.status || 200;
      rule.body = entry.body && entry.body.trim() ? entry.body : '{}';
      hooks.onConvert(rule);
    });

    logListEl.appendChild(node);
  });
}

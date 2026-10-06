import { api } from '../api.js';
import { state } from '../state.js';
import { defaultRule } from '../../shared/schema.js';
import { run } from './run.js';

const ruleListEl = document.getElementById('ruleList');
const emptyStateEl = document.getElementById('emptyState');
const newRuleBtn = document.getElementById('newRuleBtn');
const presetContextEl = document.getElementById('presetContext');
const template = document.getElementById('ruleCardTemplate');

let hooks = { onViewLogs: () => {} };

export function initRulesView(h) {
  hooks = h;
  newRuleBtn.addEventListener('click', async () => {
    if (await run(() => api.addRule(defaultRule()))) renderRules(true);
  });
}

function setError(el, msg) {
  if (!msg) {
    el.hidden = true;
    el.textContent = '';
    return false;
  }
  el.hidden = false;
  el.textContent = msg;
  return true;
}

export function renderRules(expandFirst) {
  const rules = state.rules;
  ruleListEl.innerHTML = '';
  emptyStateEl.style.display = rules.length ? 'none' : 'block';
  presetContextEl.textContent = state.activePresetId
    ? 'Editing preset: ' + (state.presets.find((p) => p.id === state.activePresetId) || {}).name
    : 'Custom rules (not saved as a preset)';

  rules.forEach((rule, index) => {
    const node = template.content.cloneNode(true);
    node.querySelector('.rule-card').dataset.id = rule.id;

    const summary = node.querySelector('.rule-summary');
    const enabledToggleWrap = node.querySelector('.switch-sm');
    const enabledToggle = node.querySelector('.rule-enabled-toggle');
    const methodEl = node.querySelector('.rule-method');
    const pathEl = node.querySelector('.rule-path');
    const editor = node.querySelector('.rule-editor');

    // Capture refs NOW: once the fragment is appended its children move out
    // and node.querySelector() in a later handler would return null.
    const fName = node.querySelector('.f-name');
    const fUrl = node.querySelector('.f-url');
    const fMethod = node.querySelector('.f-method');
    const fStatus = node.querySelector('.f-status');
    const fDelay = node.querySelector('.f-delay');
    const fHeaders = node.querySelector('.f-headers');
    const fBody = node.querySelector('.f-body');
    const urlErrorEl = node.querySelector('.f-url-error');
    const delayErrorEl = node.querySelector('.f-delay-error');
    const headersErrorEl = node.querySelector('.f-headers-error');
    const bodyErrorEl = node.querySelector('.f-body-error');

    methodEl.textContent = rule.method || '*';
    methodEl.dataset.method = rule.method || '*';
    pathEl.textContent = rule.name || 'Untitled rule';
    pathEl.title = rule.urlPattern || '(no URL pattern set)';
    pathEl.classList.toggle('warn', !rule.urlPattern);

    enabledToggle.checked = rule.enabled !== false;
    enabledToggleWrap.addEventListener('click', (e) => e.stopPropagation());
    enabledToggle.addEventListener('change', () => {
      // No re-render: it would collapse whatever card is expanded.
      run(
        () => api.updateRule({ ...rule, enabled: enabledToggle.checked }),
        enabledToggle.checked ? 'Rule enabled' : 'Rule disabled'
      );
    });

    fName.value = rule.name || '';
    fUrl.value = rule.urlPattern || '';
    fMethod.value = rule.method || '*';
    fStatus.value = String(rule.statusCode || 200);
    fDelay.value = rule.delayMs || 0;
    fHeaders.value = JSON.stringify(rule.headers || {}, null, 0);
    fBody.value = rule.body || '{}';

    summary.addEventListener('click', () => editor.classList.toggle('expanded'));

    node.querySelector('.btn-save').addEventListener('click', async () => {
      let hasError = false;

      const urlPattern = fUrl.value.trim();
      hasError = setError(urlErrorEl, urlPattern ? '' : 'URL pattern can\u2019t be empty \u2014 this rule would never match anything.') || hasError;

      const delayRaw = fDelay.value.trim();
      const delayNum = Number(delayRaw);
      let delayError = '';
      if (delayRaw === '') delayError = 'Delay is required (use 0 for no delay).';
      else if (!Number.isFinite(delayNum)) delayError = 'Delay must be a number.';
      else if (delayNum < 0) delayError = 'Delay can\u2019t be negative.';
      hasError = setError(delayErrorEl, delayError) || hasError;

      let headers;
      let headersError = '';
      try {
        headers = JSON.parse(fHeaders.value || '{}');
        if (typeof headers !== 'object' || headers === null || Array.isArray(headers)) {
          headersError = 'Headers must be a JSON object, e.g. {"Content-Type": "application/json"}.';
        }
      } catch (e) {
        headersError = 'Headers field isn\u2019t valid JSON: ' + e.message;
      }
      hasError = setError(headersErrorEl, headersError) || hasError;

      const body = fBody.value;
      let bodyError = '';
      try {
        JSON.parse(body);
      } catch (e) {
        bodyError = 'Response body isn\u2019t valid JSON: ' + e.message;
      }
      hasError = setError(bodyErrorEl, bodyError) || hasError;

      if (hasError) return;

      const updated = {
        ...rule,
        name: fName.value.trim() || 'Untitled rule',
        urlPattern,
        method: fMethod.value,
        statusCode: parseInt(fStatus.value, 10) || 200,
        delayMs: delayNum,
        enabled: enabledToggle.checked,
        headers,
        body
      };
      if (await run(() => api.updateRule(updated), 'Rule saved')) renderRules();
    });

    node.querySelector('.btn-delete').addEventListener('click', async () => {
      if (!confirm('Delete this rule?')) return;
      if (await run(() => api.removeRule(rule.id), 'Rule deleted')) renderRules();
    });

    node.querySelector('.btn-duplicate').addEventListener('click', async () => {
      if (await run(() => api.duplicateRule(rule.id), 'Rule duplicated')) renderRules();
    });

    node.querySelector('.btn-view-logs').addEventListener('click', () => hooks.onViewLogs(rule.id));

    ruleListEl.appendChild(node);
    if (expandFirst && index === 0) editor.classList.add('expanded');
  });
}

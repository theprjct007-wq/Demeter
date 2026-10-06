import { CMD } from '../shared/messages.js';
import * as rules from './services/rules.service.js';
import * as presets from './services/presets.service.js';
import * as logs from './services/logs.service.js';
import * as settings from './services/settings.service.js';
import { getState } from './services/state.service.js';

// Commands that change state return the fresh state so the UI never has to
// guess what happened. Read-only/fire-and-forget commands return null.
const after = (fn) => async (p) => {
  await fn(p || {});
  return getState();
};

export const handlers = {
  [CMD.STATE_GET]: () => getState(),
  [CMD.SETTINGS_SET_ENABLED]: after((p) => settings.setEnabled(p.enabled)),
  [CMD.RULES_ADD]: after((p) => rules.addRule(p.rule)),
  [CMD.RULES_UPDATE]: after((p) => rules.updateRule(p.rule)),
  [CMD.RULES_REMOVE]: after((p) => rules.removeRule(p.id)),
  [CMD.RULES_DUPLICATE]: after((p) => rules.duplicateRule(p.id)),
  [CMD.PRESETS_SAVE]: after((p) => presets.savePreset(p.name)),
  [CMD.PRESETS_ACTIVATE]: after((p) => presets.activatePreset(p.id)),
  [CMD.PRESETS_DELETE]: after(() => presets.deleteActivePreset()),
  [CMD.LOGS_APPEND]: async (p) => {
    await logs.appendLog(p && p.entry);
    return null;
  },
  [CMD.LOGS_CLEAR]: after(() => logs.clearLogs())
};

export function attachRouter() {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    const handler = msg && handlers[msg.type];
    if (!handler) return false;
    handler(msg.payload).then(
      (data) => sendResponse({ ok: true, data }),
      (err) => sendResponse({ ok: false, error: (err && err.message) || String(err) })
    );
    return true; // keep the channel open for the async response
  });
}

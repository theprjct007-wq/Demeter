// The side panel's ONLY door to extension state. It never touches
// chrome.storage for writes. Every command resolves to the fresh state.
import { CMD, send } from '../shared/messages.js';
import { KEYS } from '../shared/schema.js';

export const api = {
  getState: () => send(CMD.STATE_GET),
  setEnabled: (enabled) => send(CMD.SETTINGS_SET_ENABLED, { enabled }),
  addRule: (rule) => send(CMD.RULES_ADD, { rule }),
  updateRule: (rule) => send(CMD.RULES_UPDATE, { rule }),
  removeRule: (id) => send(CMD.RULES_REMOVE, { id }),
  duplicateRule: (id) => send(CMD.RULES_DUPLICATE, { id }),
  savePreset: (name) => send(CMD.PRESETS_SAVE, { name }),
  activatePreset: (id) => send(CMD.PRESETS_ACTIVATE, { id }),
  deletePreset: () => send(CMD.PRESETS_DELETE),
  clearLogs: () => send(CMD.LOGS_CLEAR)
};

// Read-only live feed: logs arrive from other tabs while the panel is open.
export function onLogsChanged(cb) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[KEYS.LOGS]) {
      cb(Array.isArray(changes[KEYS.LOGS].newValue) ? changes[KEYS.LOGS].newValue : []);
    }
  });
}

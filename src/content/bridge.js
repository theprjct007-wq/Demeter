// ISOLATED world. Two jobs, both thin:
//   1. push rules from storage -> page (MAIN world) via postMessage
//   2. forward page log events -> background (which owns log storage)
// It never writes to storage itself.
import { KEYS } from '../shared/schema.js';
import { CMD, send } from '../shared/messages.js';
import { PAGE } from '../shared/page-protocol.js';

// After an extension reload, old tabs throw "Extension context invalidated".
// Degrade to "mocking just stops" instead of spamming errors.
function pushRulesToPage() {
  try {
    chrome.storage.local.get([KEYS.RULES, KEYS.ENABLED, KEYS.ACTIVE_PRESET], (data) => {
      if (chrome.runtime.lastError) {
        console.warn('[Demeter] storage.get failed:', chrome.runtime.lastError.message);
        return;
      }
      data = data || {};
      window.postMessage(
        {
          source: PAGE.BRIDGE,
          type: PAGE.RULES_UPDATE,
          rules: Array.isArray(data[KEYS.RULES]) ? data[KEYS.RULES] : [],
          enabled: data[KEYS.ENABLED] !== false,
          presetId: data[KEYS.ACTIVE_PRESET] || ''
        },
        '*'
      );
    });
  } catch (e) {
    console.warn('[Demeter] storage unavailable (extension likely reloaded):', e.message);
  }
}

pushRulesToPage();

try {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes[KEYS.RULES] || changes[KEYS.ENABLED] || changes[KEYS.ACTIVE_PRESET])) {
      pushRulesToPage();
    }
  });
} catch (e) {
  console.warn('[Demeter] could not attach storage listener:', e.message);
}

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || data.source !== PAGE.INJECT || data.type !== PAGE.LOG_REQUEST) return;
  if (!data.entry || typeof data.entry !== 'object') return;
  try {
    send(CMD.LOGS_APPEND, { entry: data.entry }).catch(() => {});
  } catch (e) {
    // context invalidated — drop silently
  }
});

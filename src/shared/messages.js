// The extension's internal "API". Every context (side panel, content bridge)
// talks to the background ONLY through these commands.
export const CMD = {
  STATE_GET: 'state/get',
  SETTINGS_SET_ENABLED: 'settings/setEnabled',
  RULES_ADD: 'rules/add',
  RULES_UPDATE: 'rules/update',
  RULES_REMOVE: 'rules/remove',
  RULES_DUPLICATE: 'rules/duplicate',
  PRESETS_SAVE: 'presets/save',
  PRESETS_ACTIVATE: 'presets/activate',
  PRESETS_DELETE: 'presets/delete',
  LOGS_APPEND: 'logs/append',
  LOGS_CLEAR: 'logs/clear'
};

// Response envelope: { ok: true, data } | { ok: false, error }
export async function send(type, payload) {
  const res = await chrome.runtime.sendMessage({ type, payload });
  if (!res) throw new Error('No response from background service.');
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

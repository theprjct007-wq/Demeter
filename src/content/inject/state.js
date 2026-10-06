import { PAGE } from '../../shared/page-protocol.js';

// Live config pushed in by the bridge.
export const state = { rules: [], enabled: true, presetId: '' };

export function listenForRules() {
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (data && data.source === PAGE.BRIDGE && data.type === PAGE.RULES_UPDATE) {
      state.rules = Array.isArray(data.rules) ? data.rules : [];
      state.enabled = data.enabled !== false;
      state.presetId = data.presetId || '';
    }
  });
}

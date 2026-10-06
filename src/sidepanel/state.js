// Local mirror of background state + purely UI state (log filter).
export const state = {
  rules: [],
  enabled: true,
  presets: [],
  activePresetId: '',
  logs: [],
  logFilterRuleId: null // UI-only: when set, Logs tab shows just this rule's entries
};

export function applyServerState(s) {
  state.rules = s.rules;
  state.enabled = s.enabled;
  state.presets = s.presets;
  state.activePresetId = s.activePresetId;
  state.logs = s.logs;
}

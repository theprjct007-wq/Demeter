// Single source of truth for storage keys and the Rule shape.
export const KEYS = {
  RULES: 'demeterRules',
  ENABLED: 'demeterEnabled',
  PRESETS: 'demeterPresets',
  ACTIVE_PRESET: 'demeterActivePresetId',
  LOGS: 'demeterLogs'
};

export const MAX_LOGS = 40;

export function uid() {
  return 'r_' + Math.random().toString(36).slice(2, 10);
}

export function defaultRule() {
  return {
    id: uid(),
    name: 'New rule',
    urlPattern: '',
    method: '*',
    statusCode: 200,
    delayMs: 0,
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    enabled: true
  };
}

// Defensive: fills in anything missing/malformed so no consumer ever crashes
// on a bad field (corrupted data, or a rule saved by another version).
export function normalizeRule(rule) {
  const base = defaultRule();
  if (!rule || typeof rule !== 'object') return base;
  return {
    id: typeof rule.id === 'string' ? rule.id : base.id,
    name: typeof rule.name === 'string' ? rule.name : base.name,
    urlPattern: typeof rule.urlPattern === 'string' ? rule.urlPattern : '',
    method: typeof rule.method === 'string' ? rule.method : '*',
    statusCode: Number.isFinite(rule.statusCode) ? rule.statusCode : 200,
    delayMs: Number.isFinite(rule.delayMs) ? rule.delayMs : 0,
    headers: rule.headers && typeof rule.headers === 'object' ? rule.headers : base.headers,
    body: typeof rule.body === 'string' ? rule.body : '{}',
    enabled: rule.enabled !== false
  };
}

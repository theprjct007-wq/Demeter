import { KEYS } from '../../shared/schema.js';
import { get, set, readRules } from '../storage.js';

// Read-model returned to the side panel after every command.
export async function getState() {
  const d = await get([KEYS.ENABLED, KEYS.PRESETS, KEYS.ACTIVE_PRESET, KEYS.LOGS]);
  const presets = Array.isArray(d[KEYS.PRESETS]) ? d[KEYS.PRESETS] : [];
  const activeId = d[KEYS.ACTIVE_PRESET] || '';
  return {
    rules: await readRules(),
    enabled: d[KEYS.ENABLED] !== false,
    presets,
    // A dangling active id (preset deleted elsewhere) falls back to Custom.
    activePresetId: presets.some((p) => p.id === activeId) ? activeId : '',
    logs: Array.isArray(d[KEYS.LOGS]) ? d[KEYS.LOGS] : []
  };
}

export async function seedDefaults() {
  const d = await get([KEYS.RULES, KEYS.ENABLED]);
  const seed = {};
  if (d[KEYS.RULES] === undefined) seed[KEYS.RULES] = [];
  if (d[KEYS.ENABLED] === undefined) seed[KEYS.ENABLED] = true;
  if (Object.keys(seed).length) await set(seed);
}

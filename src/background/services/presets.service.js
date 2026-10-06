import { KEYS, normalizeRule, uid } from '../../shared/schema.js';
import { get, set, serialize, readRules, readPresets } from '../storage.js';

const clone = (v) => JSON.parse(JSON.stringify(v));

// Storage patch that syncs the active preset's snapshot with `rules`.
// Returns {} when no preset is active. Call inside serialize().
export async function snapshotPatch(rules) {
  const d = await get([KEYS.ACTIVE_PRESET]);
  const activeId = d[KEYS.ACTIVE_PRESET];
  if (!activeId) return {};
  const presets = await readPresets();
  const idx = presets.findIndex((p) => p.id === activeId);
  if (idx === -1) return {};
  const next = presets.slice();
  next[idx] = { ...presets[idx], rules: clone(rules) };
  return { [KEYS.PRESETS]: next };
}

export const savePreset = (name) =>
  serialize(async () => {
    const trimmed = String(name || '').trim();
    if (!trimmed) throw new Error('Preset name can\u2019t be empty.');
    const presets = await readPresets();
    const preset = { id: uid(), name: trimmed, rules: clone(await readRules()) };
    await set({ [KEYS.PRESETS]: [...presets, preset], [KEYS.ACTIVE_PRESET]: preset.id });
    return preset.name;
  });

// id '' = "Custom": detach the label but KEEP the working rules.
// Either way, logs are wiped so old traffic never lingers under a new context.
export const activatePreset = (id) =>
  serialize(async () => {
    if (!id) {
      await set({ [KEYS.ACTIVE_PRESET]: '', [KEYS.LOGS]: [] });
      return null;
    }
    const preset = (await readPresets()).find((p) => p.id === id);
    if (!preset) throw new Error('That preset no longer exists.');
    const rules = (Array.isArray(preset.rules) ? preset.rules : []).map(normalizeRule);
    await set({ [KEYS.RULES]: rules, [KEYS.ACTIVE_PRESET]: id, [KEYS.LOGS]: [] });
    return preset.name;
  });

// Deletes the active preset; the loaded rules stay as-is.
export const deleteActivePreset = () =>
  serialize(async () => {
    const d = await get([KEYS.ACTIVE_PRESET]);
    const activeId = d[KEYS.ACTIVE_PRESET];
    if (!activeId) return;
    const presets = (await readPresets()).filter((p) => p.id !== activeId);
    await set({ [KEYS.PRESETS]: presets, [KEYS.ACTIVE_PRESET]: '' });
  });

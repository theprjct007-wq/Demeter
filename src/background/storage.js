// Data-access layer. Only the background imports this.
import { KEYS, normalizeRule } from '../shared/schema.js';

export const get = (keys) => chrome.storage.local.get(keys);
export const set = (values) => chrome.storage.local.set(values);

// Serializes read-modify-write sequences so concurrent messages (many tabs /
// frames logging at once) can't clobber each other.
let chain = Promise.resolve();
export function serialize(fn) {
  const run = chain.then(() => fn());
  chain = run.catch(() => {});
  return run;
}

export async function readRules() {
  const d = await get([KEYS.RULES]);
  return Array.isArray(d[KEYS.RULES]) ? d[KEYS.RULES].map(normalizeRule) : [];
}

export async function readPresets() {
  const d = await get([KEYS.PRESETS]);
  return Array.isArray(d[KEYS.PRESETS]) ? d[KEYS.PRESETS] : [];
}

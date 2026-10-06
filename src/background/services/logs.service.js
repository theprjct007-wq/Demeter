import { KEYS, MAX_LOGS } from '../../shared/schema.js';
import { get, set, serialize } from '../storage.js';

// Log entries originate from the PAGE (MAIN world), which any site script can
// spoof via postMessage — so treat them as untrusted: whitelist + clamp.
export function sanitizeEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const clean = {
    url: String(entry.url ?? '').slice(0, 500),
    method: String(entry.method ?? 'GET').toUpperCase().slice(0, 16),
    status: Number.isFinite(entry.status) ? entry.status : 0,
    mocked: entry.mocked === true,
    body: typeof entry.body === 'string' ? entry.body.slice(0, 2000) : '',
    presetId: typeof entry.presetId === 'string' ? entry.presetId.slice(0, 64) : '',
    time: Number.isFinite(entry.time) ? entry.time : Date.now()
  };
  if (typeof entry.ruleId === 'string') clean.ruleId = entry.ruleId.slice(0, 64);
  return clean;
}

export const appendLog = (rawEntry) =>
  serialize(async () => {
    const entry = sanitizeEntry(rawEntry);
    if (!entry) return;
    const d = await get([KEYS.LOGS]);
    const logs = Array.isArray(d[KEYS.LOGS]) ? d[KEYS.LOGS] : [];
    logs.unshift(entry);
    if (logs.length > MAX_LOGS) logs.length = MAX_LOGS;
    await set({ [KEYS.LOGS]: logs });
  });

export const clearLogs = () => serialize(() => set({ [KEYS.LOGS]: [] }));

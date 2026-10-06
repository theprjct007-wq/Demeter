import { KEYS, normalizeRule, uid } from '../../shared/schema.js';
import { set, serialize, readRules } from '../storage.js';
import { snapshotPatch } from './presets.service.js';

// Every rule change goes through here, so the active preset's saved snapshot
// is always updated in the SAME write as the working rules (no drift).
function mutate(fn) {
  return serialize(async () => {
    const rules = fn(await readRules());
    await set({ [KEYS.RULES]: rules, ...(await snapshotPatch(rules)) });
  });
}

function requireId(rule) {
  if (!rule || typeof rule.id !== 'string') throw new Error('Rule is missing an id.');
}

export const addRule = (rule) => mutate((rs) => [normalizeRule(rule), ...rs]);

export const updateRule = (rule) => {
  requireId(rule);
  return mutate((rs) => rs.map((r) => (r.id === rule.id ? normalizeRule(rule) : r)));
};

export const removeRule = (id) => mutate((rs) => rs.filter((r) => r.id !== id));

export const duplicateRule = (id) =>
  mutate((rs) => {
    const index = rs.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Rule not found.');
    const copy = { ...JSON.parse(JSON.stringify(rs[index])), id: uid(), name: rs[index].name + ' (copy)' };
    return [...rs.slice(0, index + 1), copy, ...rs.slice(index + 1)];
  });

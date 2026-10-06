import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Fake chrome.storage with random latency so races actually show up.
const store = {};
const sleep = () => new Promise((r) => setTimeout(r, Math.random() * 5));
globalThis.chrome = {
  storage: {
    local: {
      async get(keys) {
        await sleep();
        const out = {};
        for (const k of [].concat(keys)) if (k in store) out[k] = structuredClone(store[k]);
        return out;
      },
      async set(v) {
        await sleep();
        Object.assign(store, structuredClone(v));
      }
    }
  }
};

const { KEYS, defaultRule } = await import('../src/shared/schema.js');
const rules = await import('../src/background/services/rules.service.js');
const presets = await import('../src/background/services/presets.service.js');
const logs = await import('../src/background/services/logs.service.js');
const { getState } = await import('../src/background/services/state.service.js');
const { matchRule } = await import('../src/shared/matcher.js');

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
});

test('concurrent log appends are not lost (the old read-modify-write race)', async () => {
  await Promise.all(Array.from({ length: 25 }, (_, i) => logs.appendLog({ url: '/x' + i, method: 'get', status: 200 })));
  assert.equal(store[KEYS.LOGS].length, 25);
});

test('log entries are capped and sanitized', async () => {
  await logs.appendLog({ url: 'u'.repeat(900), method: 'get', evil: '<script>', status: 'NaN' });
  const e = store[KEYS.LOGS][0];
  assert.equal(e.url.length, 500);
  assert.equal(e.method, 'GET');
  assert.equal('evil' in e, false);
  for (let i = 0; i < 60; i++) await logs.appendLog({ url: '/' + i });
  assert.equal(store[KEYS.LOGS].length, 40);
});

test('editing a rule while a preset is active updates the preset snapshot', async () => {
  const r = defaultRule();
  r.urlPattern = '*/a';
  await rules.addRule(r);
  await presets.savePreset('Happy');
  await rules.updateRule({ ...r, name: 'renamed' });
  await rules.addRule({ ...defaultRule(), urlPattern: '*/b' });
  const preset = store[KEYS.PRESETS][0];
  assert.equal(preset.rules.length, 2);
  assert.ok(preset.rules.some((x) => x.name === 'renamed'));
});

test('Custom keeps working rules but wipes logs; preset switch loads rules', async () => {
  await rules.addRule({ ...defaultRule(), urlPattern: '*/a' });
  await presets.savePreset('P1');
  const p1 = store[KEYS.ACTIVE_PRESET];
  await logs.appendLog({ url: '/x' });
  await presets.activatePreset('');
  assert.equal((await getState()).rules.length, 1);
  assert.equal(store[KEYS.LOGS].length, 0);
  await rules.addRule({ ...defaultRule(), urlPattern: '*/c' });
  await presets.activatePreset(p1);
  assert.equal((await getState()).rules.length, 1);
  await assert.rejects(() => presets.activatePreset('nope'), /no longer exists/);
});

test('dangling active preset id falls back to Custom', async () => {
  store[KEYS.ACTIVE_PRESET] = 'ghost';
  assert.equal((await getState()).activePresetId, '');
});

test('matcher: glob, method, disabled, empty pattern', () => {
  const cfg = {
    enabled: true,
    rules: [
      { urlPattern: '', method: '*' },
      { urlPattern: 'https://x.dev/api/*', method: 'GET' },
      { urlPattern: 'https://x.dev/off', method: '*', enabled: false }
    ]
  };
  assert.equal(matchRule(cfg, 'https://x.dev/api/users/1', 'get'), cfg.rules[1]);
  assert.equal(matchRule(cfg, 'https://x.dev/api/users/1', 'POST'), null);
  assert.equal(matchRule(cfg, 'https://x.dev/off', 'GET'), null);
  assert.equal(matchRule({ ...cfg, enabled: false }, 'https://x.dev/api/a', 'GET'), null);
});

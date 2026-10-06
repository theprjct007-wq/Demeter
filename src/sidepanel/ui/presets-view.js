import { api } from '../api.js';
import { state } from '../state.js';
import { run } from './run.js';
import { showToast } from './toast.js';

const presetSelect = document.getElementById('presetSelect');
const savePresetBtn = document.getElementById('savePresetBtn');
const deletePresetBtn = document.getElementById('deletePresetBtn');

let hooks = { onChange: () => {} };

export function renderPresetOptions() {
  presetSelect.innerHTML = '<option value="">Custom (unsaved)</option>';
  state.presets.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    presetSelect.appendChild(opt);
  });
  presetSelect.value = state.activePresetId;
  deletePresetBtn.hidden = !state.activePresetId;
}

export function initPresetsView(h) {
  hooks = h;

  presetSelect.addEventListener('change', async () => {
    const id = presetSelect.value;
    state.logFilterRuleId = null; // a filter pointing at another context is meaningless
    const ok = await run(() => api.activatePreset(id));
    if (!ok) {
      renderPresetOptions();
      return;
    }
    if (id) {
      const p = state.presets.find((x) => x.id === id);
      showToast('Loaded preset: ' + (p ? p.name : ''), 'success');
    }
    renderPresetOptions();
    hooks.onChange();
  });

  savePresetBtn.addEventListener('click', async () => {
    const name = prompt('Name this preset (e.g. "Happy Path", "Slow 3G", "Error States"):');
    if (!name || !name.trim()) return;
    if (await run(() => api.savePreset(name), 'Preset "' + name.trim() + '" saved')) {
      renderPresetOptions();
      hooks.onChange();
    }
  });

  deletePresetBtn.addEventListener('click', async () => {
    if (!state.activePresetId) return;
    if (!confirm('Delete this preset? (Your currently loaded rules stay as-is.)')) return;
    if (await run(() => api.deletePreset(), 'Preset deleted')) {
      renderPresetOptions();
      hooks.onChange();
    }
  });
}

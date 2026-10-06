import { applyServerState } from '../state.js';
import { showToast } from './toast.js';

// Runs a command, syncs local state from the response, toasts the outcome.
// Resolves true on success so callers can decide whether to re-render.
export async function run(call, successMessage) {
  try {
    applyServerState(await call());
    if (successMessage) showToast(successMessage, 'success');
    return true;
  } catch (e) {
    showToast('Save failed: ' + e.message, 'error');
    return false;
  }
}

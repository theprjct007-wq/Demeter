import { PAGE } from '../../shared/page-protocol.js';
import { state } from './state.js';

// Fire-and-forget: logging must never break (or slow) a real request.
export function logRequest(entry) {
  try {
    window.postMessage(
      {
        source: PAGE.INJECT,
        type: PAGE.LOG_REQUEST,
        entry: { ...entry, url: String(entry.url).slice(0, 500), presetId: state.presetId, time: Date.now() }
      },
      '*'
    );
  } catch (e) {
    // ignore
  }
}

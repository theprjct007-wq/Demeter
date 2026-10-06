// Entry point: register listeners only. No logic here.
// MV3 service workers are killed when idle — all state lives in chrome.storage.
import { attachRouter } from './router.js';
import { seedDefaults } from './services/state.service.js';

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  seedDefaults();
});

attachRouter();

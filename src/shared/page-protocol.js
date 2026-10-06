// postMessage protocol between the ISOLATED-world bridge and the MAIN-world
// injector (the only channel between them). Kept separate from messages.js
// because the MAIN world has no chrome.* APIs.
export const PAGE = {
  BRIDGE: 'demeter-bridge',
  INJECT: 'demeter-inject',
  RULES_UPDATE: 'RULES_UPDATE',
  LOG_REQUEST: 'LOG_REQUEST'
};

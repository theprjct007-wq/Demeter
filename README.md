# Demeter

    Demeter is a Chrome extension that lets you slow down, break, 
    or replace API responses right in your browser, with no proxy 
    and no backend changes.

    ![Demeter demo](dracula-vampire.gif)
 
## Layout
    src/
      shared/        contracts: schema.js (keys + Rule), messages.js (commands),
                     page-protocol.js (bridge<->inject), matcher.js (pure)
      background/    the ONLY owner of state
        index.js       listeners only
        router.js      command -> service dispatch
        storage.js     data access + write mutex
        services/      rules | presets | logs | settings | state
      content/
        bridge.js      ISOLATED world: storage -> page, page logs -> background
        inject/        MAIN world: state, fetch-patch, xhr-patch, logger
      sidepanel/     api.js (only door to background), state.js, ui/* views, main.js (wiring)

## Rules
1. Only `background/` writes to chrome.storage. Everyone else sends a command from `shared/messages.js`.
2. Views never import each other; `sidepanel/main.js` wires them via hooks.
3. Service worker is stateless (MV3 kills it when idle) — state lives in storage.
4. Page-originated data is untrusted; `logs.service` sanitizes it.

Old prototype notes: docs/PROTOTYPE_NOTES.md

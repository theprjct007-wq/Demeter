# Demeter

    Demeter is a Chrome extension that lets you slow down, break, 
    or replace API responses right in your browser, with no proxy 
    and no backend changes.

![Demeter demo](https://github.com/theprjct007-wq/Demeter/raw/186269e2617545a46c7fed3dcbdd242f475a636b/dracula-vampire.gif)
 
## Why Demeter 
   
    Most apps look fine when the API works. But what does your UI do when
    a request takes 5 seconds, returns a 500, or comes back empty or
    broken? Those cases are hard to test, because you usually have to wait
    for the backend to fail, change server code, or set up a proxy.
    
    Demeter lets you cause those situations on demand, right from a Chrome
    side panel. Pick a request, then delay it, fail it, or replace the
    response with your own JSON.
    
    - **No backend changes.** The real server is never touched.
    - **No extra software.** Everything runs in your browser.
    - **Safe.** Changes only affect your own tab.
    - **Works before the API exists.** Build and test loading and error states early.
    ## Rules
    1. Only `background/` writes to chrome.storage. Everyone else sends a command from `shared/messages.js`.
    2. Views never import each other; `sidepanel/main.js` wires them via hooks.
    3. Service worker is stateless (MV3 kills it when idle) — state lives in storage.
    4. Page-originated data is untrusted; `logs.service` sanitizes it.

## Features 
    - **Match requests with URL patterns.** Use exact addresses or `*` wildcards
      (for example `*/api/users*`), and filter by HTTP method.
    - **Add delays.** Hold a response for a few seconds to check that spinners
      and loading skeletons work.
    - **Fake errors.** Return 400, 401, 403, 404, 500, or 503 to see whether your
      app shows a helpful message instead of a blank screen.
    - **Replace responses.** Return your own JSON body and headers, including
      empty data, to test how your app copes.
    - **Save presets.** Store rule sets like "Happy Path" or "Error States" and
      switch between them in one click.
    - **See every request.** The Logs tab shows each `fetch` and XHR call,
      marked as mocked or real, and turns a real one into a mock with one click.
    - **Pause with one switch.** Turn Demeter off to compare behavior with and
      without it, without deleting your rules.
    - **Local and safe.** Everything runs in your own browser tab. The real
      server is never touched and other users are never affected.

## Features 

    **Option 1: Download the release (easiest)**
    
    1. Go to [Releases](../../releases) and download `demeter-v0.2.0.zip`.
    2. Unzip it.
    3. Open `chrome://extensions` in Chrome and turn on **Developer mode** (top right).
    4. Click **Load unpacked** and select the unzipped folder (the one containing `manifest.json`).
    5. Click the Demeter icon in the toolbar to open the side panel.
    
    **Option 2: Build from source**
    
    Requires Node.js and Chrome 114 or later.
    
        npm install
        npm run build
    
    Then follow steps 3 to 5 above, selecting the **`dist`** folder.
    
    > **Tip:** Select `dist`, not the project root. If Chrome says "Manifest file is missing or unreadable," you picked the wrong folder.

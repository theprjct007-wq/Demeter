# Demeter — System Documentation & Operational Guide

> Version 0.2 (modular architecture). This document describes what Demeter does **today**. Planned work is listed separately in [Roadmap](#11-roadmap).

---

## 1. Overview

Demeter is a Chrome extension (Manifest V3) that lets you mock API responses directly in the browser. You define rules in a side panel, and Demeter answers matching `fetch` and `XMLHttpRequest` calls with a response you control: custom status code, headers, body, and artificial delay.

Everything runs locally in the browser tab. There is no proxy to configure and no backend change to make, and the real server never sees a mocked request.

**Typical uses**

| Scenario | Example |
| --- | --- |
| Build the UI before the API exists | Return a fake `/api/products` payload while the backend is unfinished |
| Test loading states | Delay a response by 3000 ms to check spinners and skeletons |
| Test error handling | Force a `500` or `503` and confirm the app shows a sensible message |
| Test bad data | Return malformed or empty JSON and confirm the app doesn't crash |
| Reproduce a bug | Capture a real request in Logs, convert it to a mock, then edit the body |

Because interception happens in your own tab, mocks affect only you. Other users of a live site are not impacted.

---

## 2. Installation

Demeter is loaded as an unpacked extension from the **`dist/`** folder. The `dist/` folder, not the project root, is the one that contains `manifest.json`.

```bash
npm install
npm run build        # bundles src/ into dist/  (or: npm run dev to watch)
```

Then in Chrome:

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the **`dist`** folder.
4. Click the Demeter toolbar icon (or find it under the puzzle-piece menu) to open the side panel.

> If Chrome says *"Manifest file is missing or unreadable"*, you selected the wrong folder. Select `dist`.

After changing source code, run `npm run build`, then click the reload icon on the Demeter card in `chrome://extensions`. Reload any open tabs you want to test, because tabs opened before the reload keep running the old scripts.

---

## 3. Quick Start

1. Open the side panel and click **+ New Rule**.
2. Set **URL pattern** to the endpoint you want to mock, for example `*/api/users*`.
3. Choose a **Status** (for example `500`) and/or a **Delay** (for example `2000`).
4. Edit the **Response body** if needed, then click **Save**.
5. Reload the page and trigger the request.
6. Open the **Logs** tab. Your request should appear with a "mocked" indicator.

---

## 4. Core Concepts

### 4.1 Rules

A rule says "when a request matches this URL and method, answer with this response instead."

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| Name | text | `New rule` | Label shown on the rule card |
| URL pattern | glob | *(empty)* | What to match (see 4.2). An empty pattern is rejected on save and never matches |
| Method | select | `*` | `*` (any), `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |
| Status | select | `200` | One of 200, 201, 400, 401, 403, 404, 500, 503 |
| Delay (ms) | number | `0` | Wait before responding. Must be a number, 0 or greater |
| Headers | JSON object | `{"Content-Type": "application/json"}` | Sent with the mocked response. Must be a plain object, not an array or string |
| Response body | text | `{}` | Returned as-is |
| Enabled | toggle | on | Per-rule switch, saved instantly |

### 4.2 URL matching

- Patterns are **globs**, not regular expressions. `*` matches any run of characters. All other special characters are treated literally.
- The pattern must match the **entire URL**, including the query string. A pattern that ends without `*` will miss URLs with extra query parameters.
- **First match wins.** Rules are checked from the top of the list down, and new rules are added at the top.
- Method `*` matches every HTTP method.

| Pattern | Matches | Doesn't match |
| --- | --- | --- |
| `*` | every request | — |
| `*/api/users*` | `/api/users`, `/api/users/42?x=1` | `/api/orders` |
| `https://localhost:3000/api/v1/products/*` | any product path on that host | other hosts |
| `*/rest.php/v1/search/title?q=cat*` | queries **starting with** `cat` | `?q=c`, `?q=ca` |

The last row is a common trap for search boxes. The app sends a request per keystroke (`q=c`, `q=ca`, `q=cat`), so a pattern pinned to one query only catches the last one. Use `*/rest.php/v1/search/title*` to catch them all.

### 4.3 Presets

A preset is a named snapshot of your rule set (for example "Happy Path", "Slow 3G", "Error States").

- **Save as Preset** stores the current rules under a name and makes it the active preset.
- Selecting a preset **replaces** your working rules with that snapshot and clears the logs.
- While a preset is active, every rule edit also updates that preset's snapshot, so switching away and back never loses changes.
- Selecting **Custom (unsaved)** detaches the preset label but **keeps** your current rules. It also clears the logs.
- **Delete** removes the active preset. Your loaded rules stay in place.

### 4.4 Logs

The Logs tab shows every `fetch`/XHR request the page makes, mocked or real.

- Each entry shows method, status, URL, and whether it was mocked or real.
- Only the **latest 40** entries are kept. Older ones drop off.
- Bodies are truncated to 2,000 characters in the log.
- **View Logs** on a rule card filters the list to that rule's mocked traffic. Real requests belong to no rule, so they only appear in the unfiltered view.
- **Convert to Mock** turns a real request into a new rule, pre-filled with its URL, method, status, and captured body. The URL is copied **exactly** (no wildcard), so loosen it with `*` for dynamic IDs before relying on it.
- **Clear Logs** empties the list. Switching presets also clears it.

### 4.5 Master toggle

The switch in the header disables all interception without deleting any rules. While off, every request goes to the real network.

---

## 5. Side Panel Guide

| Area | Purpose |
| --- | --- |
| Header toggle | Master on/off for all mocking |
| Preset bar | Switch, save, or delete presets |
| **Mocks** tab | Create, edit, duplicate, delete, and toggle rules |
| **Logs** tab | Live request list, per-rule filter, Convert to Mock, Clear Logs |
| Toasts | Confirm saves and deletes, and report storage errors |

**Validation:** invalid JSON in Headers or Body, a bad Delay value, or an empty URL pattern shows an inline error under that field, and your typed text is kept. If two fields are wrong, both errors show.

---

## 6. Architecture

### 6.1 Execution contexts

Chrome extensions run code in separate, isolated contexts. Demeter uses four:

| Context | File (in `dist/`) | Role |
| --- | --- | --- |
| **Background service worker** | `background.js` | The only owner of state. Reads and writes `chrome.storage` |
| **Side panel** | `sidepanel.js` | The UI. Sends commands to the background, never writes storage directly |
| **Content bridge** (isolated world) | `content-bridge.js` | Relays rules from storage to the page and forwards page logs to the background |
| **Content inject** (MAIN world) | `content-inject.js` | Patches `fetch` and `XMLHttpRequest` inside the page. Has no `chrome.*` access |

Both content scripts run at `document_start` in all frames, so they patch the network APIs before the page's own code runs. This includes iframes.

### 6.2 Data flow

```
 Side panel ──command──▶ Background ──writes──▶ chrome.storage.local
                                                    │
                                        storage.onChanged
                                                    ▼
 Page (MAIN world)  ◀──postMessage──  Content bridge (isolated world)
   fetch / XHR patch                          │
        │  matched? → mocked response         │
        └── log entry ──postMessage──▶ bridge ──▶ Background ──▶ storage (logs)
```

1. You save a rule in the side panel, which sends a command to the background.
2. The background writes to `chrome.storage.local`.
3. The bridge sees the storage change and posts the new rules to the page.
4. The patched `fetch`/XHR checks each outgoing request against the rules.
5. On a match it waits for the delay, then returns the mocked response. Otherwise the real request proceeds.
6. Either way, a log entry is posted back through the bridge to the background.

### 6.3 Design rules

1. Only `background/` writes to `chrome.storage`. Everyone else sends a command defined in `shared/messages.js`.
2. UI views never import each other. `sidepanel/main.js` wires them together through hooks.
3. The service worker is stateless (MV3 may stop it when idle), so all state lives in storage.
4. Page-originated data is untrusted. Any script on a page can post messages, so `logs.service` whitelists and clamps every log entry.
5. Writes are serialized through a mutex so simultaneous messages from many tabs can't overwrite each other.

### 6.4 Storage keys

| Key | Contents |
| --- | --- |
| `demeterRules` | The active working rule set |
| `demeterEnabled` | Master toggle state |
| `demeterPresets` | Saved preset snapshots |
| `demeterActivePresetId` | Currently selected preset (empty = Custom) |
| `demeterLogs` | Captured requests (max 40) |

### 6.5 Internal commands

The side panel and bridge talk to the background only through these: `state/get`, `settings/setEnabled`, `rules/add`, `rules/update`, `rules/remove`, `rules/duplicate`, `presets/save`, `presets/activate`, `presets/delete`, `logs/append`, `logs/clear`. Each returns `{ ok: true, data }` or `{ ok: false, error }`.

---

## 7. Project Layout

```
demeter/
├─ src/
│  ├─ manifest.json
│  ├─ shared/        schema.js · messages.js · page-protocol.js · matcher.js
│  ├─ background/    index.js · router.js · storage.js · services/
│  │                 (rules · presets · logs · settings · state)
│  ├─ content/       bridge.js · inject/ (state · fetch-patch · xhr-patch · logger · utils)
│  └─ sidepanel/     sidepanel.html/css · main.js · api.js · state.js · ui/
├─ dist/             build output — load this folder in Chrome
├─ tests/            services.test.mjs
├─ docs/             this file · PROTOTYPE_NOTES.md (historical)
├─ build.mjs         esbuild bundler
└─ package.json
```

---

## 8. Development

| Command | What it does |
| --- | --- |
| `npm run build` | Bundle each context into `dist/` (one self-contained script per entry, since MV3 content scripts can't use ES imports) |
| `npm run dev` | Rebuild on file changes. You still need to reload the extension in Chrome |
| `npm test` | Run the unit tests with Node's built-in test runner |

The tests cover concurrent log writes, log capping and sanitizing, preset snapshot syncing, Custom/preset switching, dangling preset IDs, and the URL matcher.

---

## 9. Known Limitations

- **Only `fetch` and `XMLHttpRequest` are intercepted.** WebSockets, Server-Sent Events, and requests made by service workers are not. A PWA that routes API calls through a service worker won't be mocked.
- **Mocked responses only.** Real (passthrough) requests are never modified: no header changes and no URL redirects.
- **Fixed response codes.** The status dropdown offers a fixed list, and there is no random or percentage-based failure.
- **XHR mocking is partial.** Status, ready state, `response`, and `responseText` are set. Other properties such as `getAllResponseHeaders` are not emulated.
- **Rules are global.** They apply to every site and tab, not per site. Use narrow URL patterns.
- **Logs are shared and short.** They hold the latest 40 entries across all tabs, not per tab.
- **Regex is not supported.** Matching is glob-only by design.
- **Presets don't track unsaved edits.** While a preset is active, edits sync to it automatically, so there is no separate "modified" state.
- **No import/export** of rules yet.
- **No custom icon.** Chrome shows its default placeholder.

---

## 10. Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| "Manifest file is missing or unreadable" | You loaded the project root. Load `dist/` |
| Mock isn't applied | Check the master toggle and the rule toggle, confirm the method matches, and reload the tab (old tabs keep old scripts) |
| Rule matches some requests but not others | Pattern too narrow. Add a trailing `*` and check the query string (see 4.2) |
| Real data still appears | The request may not use `fetch`/XHR (service worker, WebSocket), or the UI may be showing browser autofill or the site's own saved history |
| Rules are gone after installing Demeter | A new unpacked extension gets fresh storage, so rules from a previous extension don't carry over. Recreate them (a one-time migration can be added if you need the old ones) |
| Two similar extensions interfering | Remove the old one in `chrome://extensions` |
| Mocking stopped in an open tab after reloading the extension | Expected. Refresh the tab |
| Nothing in Logs | Reload the page and check that the panel is showing the right context (Custom vs a preset) |

To see errors, open `chrome://extensions`, click **Errors** on the Demeter card, or inspect the side panel with DevTools. Warnings from the page-side scripts are prefixed `[Demeter]` in the page console.

---

## 11. Roadmap

Ideas, not commitments. None of these are implemented yet.

- **Failure simulation:** random failure rates (for example fail 25% of requests) and network-drop behavior.
- **Import / export:** save rules to a portable file so teammates can run identical scenarios.
- **Built-in profiles:** ready-made presets such as "Slow Mobile 3G" or "Database Down".
- **Richer recording:** capture full responses (headers included) and convert them to rules in one click. Today's Convert to Mock is a first step.
- **Chrome DevTools Protocol integration:** network-layer throttling and fault injection beyond in-page `fetch`/XHR patching.
- **Custom icon**, and a one-time migration for rules saved under the old prototype name.

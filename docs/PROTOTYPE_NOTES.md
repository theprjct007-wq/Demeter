# Demeter API Sandbox — v1 prototype

## Load it
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → select this `demeter` folder
4. Click the Demeter icon in your toolbar to open the side panel

## What's in this prototype
- Side panel UI: master toggle, + New Rule, expandable rule cards
- Full CRUD: create, edit, duplicate, delete, enable/disable per rule
- Glob-based URL matching (`*` wildcard — not full regex, on purpose, see below)
- Delay, status code, headers, and JSON body mocking
- Works via `fetch()` and `XMLHttpRequest` override injected at `document_start`,
  catching requests before your app's own JS fires them — including inside
  **iframes** (`all_frames: true`)
- **Environments/Presets** — save the current rule set as a named preset
  (e.g. "Happy Path", "Slow 3G", "Error States"), switch between them from
  a dropdown. Switching loads that preset's full rule set as your active
  working rules.
- **Logs tab** — every `fetch`/XHR request the page makes (mocked or real)
  shows up live, with method/status/URL. Click **Convert to Mock** on a real
  request to pre-fill a new rule with that exact URL, method, and captured
  response body — then tweak and save.

## How Presets work (data model, so it's not a black box)
- `demeterRules` in storage is always the **currently active working set** —
  what's actually being used to intercept requests right now.
- A preset is a **named snapshot** of that rule set, stored separately in
  `demeterPresets`.
- Selecting a preset **replaces** your active rules with that snapshot.
- Editing a rule after loading a preset does NOT auto-update the saved
  preset — it just edits your current working rules. Save as Preset again
  (under a new or same name) if you want the changes to persist as a preset.
  This is a deliberate v1 simplification; "dirty state" detection (flagging
  when your working rules have drifted from the selected preset) is a
  reasonable next add but isn't built yet.

## Bug fixes (this round)
- **"Rules disappearing when switching presets" — fixed.** Two compounding
  bugs caused this:
  1. Editing a rule while a preset was active only updated the *working*
     rules in storage — the preset's own saved snapshot never changed.
     Switch away and back, and your edits silently reverted to whatever the
     preset looked like when it was first saved. **Fixed:** every edit
     while a preset is active now also updates that preset's saved
     snapshot, so round-tripping through presets never loses changes.
  2. Switching to "Custom (unsaved)" was wiping the working rule list to
     empty instead of just detaching the preset label. **Fixed:** Custom
     now preserves whatever rules you currently have loaded — it only
     stops treating them as tied to a saved preset.
- **"Logs not separated/filtered per rule" — fixed.** The per-rule log
  filter (View Logs) was gated behind a preset-id check as well as the
  rule-id check, and the preset-id tag on a log entry is set asynchronously
  in the content script — right after switching presets there was a window
  where a freshly captured entry's preset tag could momentarily lag behind
  the panel's own state, making the filter appear broken. Since logs are
  already fully wiped on every preset switch (no coexistence to guard
  against), the redundant preset-id check has been removed — the filter
  now keys on rule id alone, which is simpler and removes that race
  entirely.

## UI/UX improvements (latest round)
- **Rule cards now show the rule's Name as the primary label**, not the URL
  pattern — the pattern is still there on hover (tooltip) so it's not lost,
  just not competing for space with the name you actually gave it.
- **Enable/disable is now a real toggle switch, visible whether the card is
  expanded or collapsed** — it lives in the summary row itself, not buried
  inside the editor. Flipping it saves instantly; you don't need to open
  the card or hit Save.
- **Per-rule log filtering.** Every rule card has a **View Logs** button
  that jumps to the Logs tab filtered to just that rule's captured traffic
  (matched via the rule's id, tagged on the entry at the moment it was
  mocked). A chip at the top of the Logs tab shows which rule you're
  filtered to, with a **Show all rules** button to clear it. Real
  (non-mocked) requests aren't tied to any rule, so they only show up in
  the unfiltered "all rules" view.
- The filter automatically clears whenever you switch presets (since the
  rules — and logs — get wiped then anyway; see below).

## UI/UX improvements (earlier round)
- **Rule editor now expands/collapses smoothly** instead of snapping open —
  clicking a rule card's summary row grows the editor into view with a
  transition, and creating/saving a new rule does the same.
- **Per-field error messages.** URL pattern, Delay, Headers, and Body each
  get their own inline error slot — if two fields are wrong at once, you see
  both, not just the first one caught. Delay now specifically rejects empty,
  non-numeric, or negative values instead of silently coercing them to 0.
  Headers now also rejects a valid-but-wrong JSON shape (e.g. an array or a
  string) since headers have to be a plain object.
- **Switching presets now fully resets the Mocks list.** Previously,
  switching to "Custom (unsaved)" left whatever preset's rules were loaded
  still sitting there under the Custom label. Now it's a clean blank slate —
  switching *away* from any preset (to Custom or to a different preset)
  clears the working rule list first, so a previous preset's rules never
  linger where they don't belong.
- **Logs are now automatically cleared on every preset switch** — not just
  filtered by context. Selecting a different preset (or Custom) wipes
  captured request logs immediately, so you're never looking at
  traffic from whatever you were testing a moment ago. The manual "Clear
  Logs" button still exists for clearing mid-session without switching.

## Error handling improvements (earlier round)
- **No more blocking `alert()` popups** for validation — invalid JSON in
  Headers/Body now shows an inline red message right under the field, and
  doesn't wipe out what you typed.
- **Toast notifications** (top of panel) confirm saves/deletes/preset
  switches, and surface storage failures instead of failing silently.
- **Empty URL pattern is now rejected at Save**, with an explanation —
  previously it would silently save a rule that could never match anything.
- **Corrupted/malformed rule data is normalized on load** — if a rule from
  storage is missing fields or has the wrong type, it's patched with safe
  defaults instead of crashing the panel.
- **A single bad rule can no longer break real requests.** If a mock rule's
  own data causes an error while it's being applied (e.g. something odd
  slipped into headers), the content script logs a warning to the console
  and — for `fetch` — falls back to letting the real request through, or —
  for XHR — surfaces it as a request error, rather than leaving the page
  hung or crashing your own JS.
- **Extension-context-invalidated is handled.** If you reload the extension
  while an old tab is still open, that tab's content scripts now degrade
  gracefully (mocking just stops there) instead of spamming console errors.
- **Deleted-preset safety**: if the preset currently selected somehow no
  longer exists (e.g. deleted from another angle), the panel falls back to
  "Custom" instead of showing a broken selection.

## Logs are now scoped per preset
- Every captured log entry is tagged with whichever preset was active at
  the moment it was captured (or blank, for "Custom").
- The Logs tab **only shows entries matching your currently selected
  preset** — switch presets and the Logs tab's contents change with it.
  The label above the log list always says which context you're viewing.
- **Clear Logs only clears the currently viewed context** — other presets'
  captured traffic is left untouched.
- This means testing multiple sites/scenarios via presets no longer mixes
  all their request history into one long undifferentiated list.

## How Logs work
- The content script logs **every** `fetch`/XHR call the page makes, mocked
  or not, capped at the last 40 entries (oldest drop off).
- For real (non-mocked) requests, it clones the response to read the body
  for the log **without blocking or consuming** what the page itself needs —
  logging never adds latency to real traffic.
- "Convert to Mock" copies the exact URL as the pattern (not a wildcard) —
  you'll likely want to loosen it (e.g. add `*` for dynamic IDs) before
  relying on it broadly.

## Deliberate v1 cuts (per our earlier scoping)
- **No header modification on real (non-mocked) requests** — only mocked
  responses get custom headers; passthrough requests are untouched.
- **No redirect rules** (rewrite URL A → URL B) — out of scope for now.
- **Glob matching, not full regex** — `*` matches anything; special regex
  chars in your pattern are escaped automatically. Simpler to reason about,
  fewer silent-misfire bugs. Upgrade to real regex later if you need it.
- **No Settings/Import-Export yet** — easy add, deprioritized on purpose.
- **Service workers, WebSockets, SSE are not intercepted** — only
  `fetch`/XHR are patched. A PWA relying on a service worker for API calls
  won't be mocked.

## Try it fast
1. Open the panel, click **+ New Rule**
2. URL pattern: `*` (matches everything) — narrow it once you confirm it fires
3. Set Delay to `2000`, Status `200`, Save
4. Reload any page hitting `fetch()` — you should see the artificial delay,
   and the request show up (marked "mocked") in the Logs tab

## Known rough edges (prototype, not production)
- XHR override doesn't cover every property (e.g. `getAllResponseHeaders`)
- No validation that a glob pattern is non-empty before matching (empty
  pattern won't match anything, which is safe, just not obvious)
- No storage size guardrails beyond the 40-entry log cap
- Presets don't track "dirty" (edited-since-loaded) state — see above


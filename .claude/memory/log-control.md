---
name: log-control
description: "All renderer console logging routes through one file, 1. App/5. Dev Only/LogControl.js, which defines globalThis.Log + a FLAGS switchboard; backend Java logging is controlled separately via -Dcom.fribbels.level; other processes via E7_* env vars in start-dev.bat."
metadata: 
  node_type: memory
  type: reference
  originSessionId: ae12964a-a779-473a-b06c-7e3b2491cb82
  modified: 2026-08-28T11:14:08.027Z
---

# Central logging (LogControl.js) — verified present 2026-08-28

**All renderer console logging routes through `1. App/5. Dev Only/LogControl.js`.** It is the one
place to turn logging on/off — edit the `FLAGS` block at the top (confirmed present: `debug`, `info`,
`warn`, `error`, `apiCalls`, `backendStderr`, `liveGrid`, `backendJavaLevel`, all defaulting on).
Loaded first by `app.html` and included in electron-builder's packaged `files`.

**It defines `globalThis.Log`** — the utility every renderer file uses instead of `console.*`:
- Levels: `Log.debug` (+ `trace/table/group/groupCollapsed/groupEnd`), `Log.info`, `Log.warn`,
  `Log.error`; channels: `Log.api`, `Log.backendStderr`, `Log.liveGrid`.
- Flags map to globals re-read at call time (so they flip live in DevTools without a reload):
  `debug`→`window.__optDebug`, `info`→`__logInfo`, `warn`→`__logWarn`, `error`→`__logError`,
  `apiCalls`→`API_DEBUG`, `backendStderr`→`__backendStderrLog`, `liveGrid`→`__liveGridLog`,
  `backendJavaLevel`→`__backendJavaLevel`.
- `Log.error`: console echo is gated by `__logError`, but the `Notifier.error` popup for a real error
  always fires (folded in the old `inputHandler.js` `console.error` monkey-patch, since removed).
- LogControl captures the native `console` up front and is the **only file allowed to use
  `console.*`** directly — everything else uses `Log.*`. The old per-file `_optDbg` helpers were
  deleted when this was built out; see [[js-file-hygiene]] for the historical `_optDbg` replace-all
  trap this replaced.

**Backend Java (separate process):** `backendJavaLevel` (INFO|FINE|WARNING|SEVERE|OFF) →
`subprocess.js` passes `-Dcom.fribbels.level=<LEVEL>` → `Main.java` sets the `com.fribbels` logger
level and lowers the root `ConsoleHandler` so `FINE` actually emits (a JUL gotcha — setting the
logger level alone isn't enough). FINE reveals GPU/result-row traces. Needs an app restart (the
backend is spawned once). This wiring lives in `0. Main/Main.java`; until 2026-08-28 the jar was
built from a stale duplicate that lacked it, so backend log-level control silently did nothing —
fixed the same day (pom compiles `0. Main` directly, jar verified to contain `com.fribbels.level`);
see [[java-dual-source-tree]].

**Other processes** (can't read renderer flags — set as env vars in
`1. Master/1. BAT/start-dev.bat`, documented in LogControl's own header): `E7_MAIN_LOG_LEVEL`
(main.dev.js electron-log), `E7_BUILD_QUIET` (build-script/webpack routine chatter; errors still
show), `E7_SCANNER_DEBUG` (scanner.py `_dbg()` → stderr only; stdout is the data protocol).

**How to apply:** when adding a logger anywhere, use `Log.*` (renderer) or the matching env var
(other processes) — don't invent a new scattered toggle.

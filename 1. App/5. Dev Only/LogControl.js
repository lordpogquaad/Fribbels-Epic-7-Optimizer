//
// ===========================================================================
//  CENTRAL LOGGING CONTROL + Log utility   (the one switchboard for devs)
// ===========================================================================
//  Loaded FIRST by app.html (before any other script). This is the SINGLE place
//  to turn the app's console logging on/off: flip a value in FLAGS below to true
//  (show) or false (silence). It defines `globalThis.Log`, which EVERY renderer
//  file uses instead of `console.*`. Each method re-reads its flag at call time,
//  so you can also flip switches live in DevTools, e.g.
//      __optDebug = false     -> silences Log.debug(...) traces
//      __logError = false     -> silences error console echo (popups stay on)
//
//  RENDERER surfaces (flag -> global -> Log method -> what it is):
//    debug         -> window.__optDebug          -> Log.debug (+ table/group/trace)
//                                                   diagnostic traces
//    info          -> window.__logInfo           -> Log.info   informational
//    warn          -> window.__logWarn           -> Log.warn   warnings
//    error         -> window.__logError          -> Log.error  error console echo
//                                                   + trace (Notifier popup for a
//                                                   REAL error ALWAYS fires)
//    apiCalls      -> globalThis.API_DEBUG       -> Log.api    backend call + resp
//    backendStderr -> globalThis.__backendStderrLog -> Log.backendStderr  Java stderr
//    liveGrid      -> window.__liveGridLog       -> Log.liveGrid "[getRows LIVE]"
//
//  BACKEND Java (separate process): `backendJavaLevel` is passed by subprocess.js
//  as -Dcom.fribbels.level=<LEVEL> to the `java -jar` spawn; Main.java applies it.
//  INFO | FINE | WARNING | SEVERE | OFF. FINE reveals [getResultRows]/GPU traces.
//  Changing it needs an app restart (the backend is spawned once at startup).
//
//  OTHER PROCESSES (cannot read these renderer globals -- controlled by env vars
//  set in 1. Master/1. BAT/start-dev.bat, NOT here):
//    - Electron main process (electron-log level): E7_MAIN_LOG_LEVEL
//    - Build scripts / webpack (Node, build-time):  E7_BUILD_QUIET
//    - Python scanner (child process; debug to stderr only): E7_SCANNER_DEBUG
//  This header is the one-stop reference for where each surface is controlled.
// ===========================================================================
//
(function devLogControl() {
  // ---- DEV-EDITABLE SWITCHES ----------------------------------------------
  const FLAGS = {
    // renderer log levels
    debug: true,
    info: true,
    warn: true,
    error: true,
    // specialized renderer channels
    apiCalls: true,
    backendStderr: true,
    liveGrid: true,
    // backend Java verbosity (INFO | FINE | WARNING | SEVERE | OFF)
    backendJavaLevel: 'INFO',
  };
  // -------------------------------------------------------------------------

  const g = typeof globalThis !== 'undefined' ? globalThis : window;

  // Capture the NATIVE console methods up front, before anything (e.g. an older
  // console.error monkey-patch) can reassign them. Log.* calls these directly,
  // so this file is the ONLY one that may reference `console.*` -- every other
  // file uses globalThis.Log, which prevents any logger-recursion.
  const _c = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    trace: console.trace.bind(console),
    table: console.table.bind(console),
    group: console.group.bind(console),
    groupCollapsed: console.groupCollapsed.bind(console),
    groupEnd: console.groupEnd.bind(console),
  };

  // Publish the flags as globals the renderer reads at call time.
  g.__optDebug = FLAGS.debug;
  g.__logInfo = FLAGS.info;
  g.__logWarn = FLAGS.warn;
  g.__logError = FLAGS.error;
  g.API_DEBUG = FLAGS.apiCalls;
  g.__backendStderrLog = FLAGS.backendStderr;
  g.__liveGridLog = FLAGS.liveGrid;
  g.__backendJavaLevel = FLAGS.backendJavaLevel;
  g.__LOG_CONTROL = FLAGS; // inspect the resolved switches in DevTools

  // Benign first-launch noise: kill-port checks port 8130 before the backend is
  // up. Echo it (when error logging is on) but never trace/popup for it.
  const BENIGN_ERROR = 'Failed to get pid of port';

  g.Log = {
    debug: (...a) => {
      if (g.__optDebug) _c.log(...a);
    },
    info: (...a) => {
      if (g.__logInfo) _c.info(...a);
    },
    warn: (...a) => {
      if (g.__logWarn) _c.warn(...a);
    },
    // Error console output is gated by __logError, but the user-facing Notifier
    // popup for a REAL error always fires (folds in the old inputHandler
    // console.error override -- that is error handling, not log verbosity).
    error: (...a) => {
      const first = a[0];
      const benign = typeof first === 'string' && first.includes(BENIGN_ERROR);
      if (g.__logError) _c.error(...a);
      if (benign) return;
      if (g.__logError) _c.trace();
      if (g.Notifier && typeof g.Notifier.error === 'function') {
        g.Notifier.error(first);
      }
    },
    // debug-gated structured helpers
    trace: (...a) => {
      if (g.__optDebug) _c.trace(...a);
    },
    table: (...a) => {
      if (g.__optDebug) _c.table(...a);
    },
    group: (...a) => {
      if (g.__optDebug) _c.group(...a);
    },
    groupCollapsed: (...a) => {
      if (g.__optDebug) _c.groupCollapsed(...a);
    },
    groupEnd: (...a) => {
      if (g.__optDebug) _c.groupEnd(...a);
    },
    // specialized channels
    api: (...a) => {
      if (g.API_DEBUG) _c.log(...a);
    },
    backendStderr: (...a) => {
      if (g.__backendStderrLog) _c.log(...a);
    },
    liveGrid: (...a) => {
      if (g.__liveGridLog) _c.log(...a);
    },
  };
})();

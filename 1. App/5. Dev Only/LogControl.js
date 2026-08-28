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
//    - Build scripts / webpack (Node, build-time):  E7_BUILD_QUIET
//    - Python scanner (child process; debug to stderr only): E7_SCANNER_DEBUG
//  This header is the one-stop reference for where each surface is controlled.
//
//  FILE LOG: every launch also writes 5. Dev Only/logs/latest.log (5 rotated
//  backups, see 5. Dev Only/FileLog.js). Renderer switch: FLAGS.fileLog below.
//  Main process switch (can't read these FLAGS): E7_FILE_LOG=0 env var, set
//  in 1. Master/1. BAT/start-dev.bat.
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
    // write everything the console shows to 5. Dev Only/logs/latest.log too
    // (see 5. Dev Only/FileLog.js). Main process mirrors this via E7_FILE_LOG=0.
    fileLog: true,
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

  // ---- FILE LOG -------------------------------------------------------------
  // Ties everything that reaches the real console (Log.* + the raw console.*
  // patch further below) into 5. Dev Only/logs/latest.log. `writeToFile` is a
  // hoisted no-op until the try/catch below (after g.Log is built) sets
  // `fileLogPath`/`FileLog` -- gated on FLAGS.fileLog so the whole feature is
  // inert (no directory, no requires) when the switch is off.
  let fileLogPath = null;
  let FileLog = null;
  function writeToFile(level, args) {
    if (!fileLogPath || !FileLog) return;
    const ok = FileLog.appendLine(fileLogPath, FileLog.formatLine(level, args));
    if (!ok) {
      fileLogPath = null; // disable after first write failure
      _c.warn('[FileLog] disabled -- write failed');
    }
  }
  // -------------------------------------------------------------------------

  g.Log = {
    debug: (...a) => {
      if (g.__optDebug) {
        _c.log(...a);
        writeToFile('DEBUG', a);
      }
    },
    info: (...a) => {
      if (g.__logInfo) {
        _c.info(...a);
        writeToFile('INFO', a);
      }
    },
    warn: (...a) => {
      if (g.__logWarn) {
        _c.warn(...a);
        writeToFile('WARN', a);
      }
    },
    // Error console output is gated by __logError, but the user-facing Notifier
    // popup for a REAL error always fires (folds in the old inputHandler
    // console.error override -- that is error handling, not log verbosity).
    error: (...a) => {
      const first = a[0];
      if (g.__logError) {
        _c.error(...a);
        _c.trace();
        writeToFile('ERROR', a);
      }
      if (g.Notifier && typeof g.Notifier.error === 'function') {
        g.Notifier.error(first);
      }
    },
    // debug-gated structured helpers
    trace: (...a) => {
      if (g.__optDebug) _c.trace(...a);
    },
    table: (...a) => {
      if (g.__optDebug) {
        _c.table(...a);
        writeToFile('TABLE', a);
      }
    },
    group: (...a) => {
      if (g.__optDebug) {
        _c.group(...a);
        writeToFile('GROUP', a);
      }
    },
    groupCollapsed: (...a) => {
      if (g.__optDebug) {
        _c.groupCollapsed(...a);
        writeToFile('GROUP', a);
      }
    },
    groupEnd: (...a) => {
      if (g.__optDebug) _c.groupEnd(...a);
    },
    // specialized channels
    api: (...a) => {
      if (g.API_DEBUG) {
        _c.log(...a);
        writeToFile('API', a);
      }
    },
    backendStderr: (...a) => {
      if (g.__backendStderrLog) {
        _c.log(...a);
        writeToFile('JAVA', a);
      }
    },
    liveGrid: (...a) => {
      if (g.__liveGridLog) {
        _c.log(...a);
        writeToFile('GRID', a);
      }
    },
  };

  // ---- FILE LOG init ---------------------------------------------------
  // Deliberately requires @electron/remote by absolute path resolved off
  // remote.app.getAppPath() rather than a relative require: this file is
  // loaded as a raw <script src> (see app.html), NOT bundled by webpack, so
  // __dirname here would be the HTML document's directory, not this file's
  // disk location -- getAppPath() already handles the dev/packaged/mac/win
  // split correctly (mirrors the pattern in 4. JS/6. Shared/1. Core/files.js).
  if (FLAGS.fileLog) {
    try {
      const remote = require('@electron/remote');
      const path = require('node:path');
      FileLog = require(
        path.join(remote.app.getAppPath(), '5. Dev Only', 'FileLog.js'),
      );
      const dir = FileLog.resolveLogDir({
        appPath: remote.app.getAppPath(),
        userDataPath: remote.app.getPath('userData'),
        isPackaged: remote.app.isPackaged,
      });
      FileLog.ensureDir(dir);
      fileLogPath = path.join(dir, FileLog.LOG_FILE_NAME);
      FileLog.writeHeader(fileLogPath, {
        timestamp: new Date().toISOString(),
        appVersion: remote.app.getVersion(),
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node,
        platform: process.platform,
        logDir: dir,
        flagsJson: JSON.stringify(FLAGS),
      });

      // Tee raw console.* calls too (code that logs via console.* directly
      // instead of Log.*) -- always calls the real console first via `_c`.
      ['log', 'info', 'warn', 'error'].forEach((method) => {
        const original = _c[method];
        console[method] = (...a) => {
          original(...a);
          writeToFile(method.toUpperCase(), a);
        };
      });

      g.Log.info(`[FileLog] writing to ${fileLogPath}`);
    } catch (e) {
      fileLogPath = null;
      FileLog = null;
      _c.warn('[FileLog] disabled -- failed to initialize:', e);
    }
  }
})();

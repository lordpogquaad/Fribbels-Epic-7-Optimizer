//
// ===========================================================================
//  FILE LOG — shared primitives for the on-disk log sink
// ===========================================================================
//  Used by BOTH the main process (main.dev.js) and the renderer switchboard
//  (LogControl.js). Plain CommonJS, node:fs/node:path only -- no Electron
//  imports here, so these functions work outside Electron too (see the
//  scratch harness noted in LogControl.js's header).
//
//  Everything lands in <app root>/5. Dev Only/logs/latest.log in dev (packaged
//  builds: <userData>/logs, see resolveLogDir). Rotation policy:
//  latest.log -> prev-1.log -> ... -> prev-5.log, oldest dropped. The MAIN
//  process performs the rotation once per launch, at app.whenReady() BEFORE
//  the renderer window loads (see main.dev.js) -- this guarantees the
//  renderer's later appends land in a fresh file instead of racing the
//  rotation. The renderer (and the rest of main, after that point) only
//  appends via appendLine/writeHeader.
//
//  Toggle: LogControl.js FLAGS.fileLog (renderer) / E7_FILE_LOG=0 env var
//  (main process, which cannot read the renderer's FLAGS -- see
//  1. Master/1. BAT/start-dev.bat). When off, nothing is written and the
//  logs directory is never created.
// ===========================================================================
//

const fs = require('node:fs');
const path = require('node:path');

const LOG_FILE_NAME = 'latest.log';
const MAX_BACKUPS = 5;
const MAX_LINE_LENGTH = 1000;
const NEWLINE = String.fromCharCode(10);

// Dev / unpacked: <app root>/5. Dev Only/logs (inside the repo, gitignored via
// the root `logs` pattern) so logs sit next to the code. Packaged: that folder
// lives inside the read-only asar, so fall back to <userData>/logs.
function resolveLogDir({ appPath, userDataPath, isPackaged }) {
  if (!isPackaged && appPath) {
    return path.join(appPath, '5. Dev Only', 'logs');
  }
  return path.join(userDataPath, 'logs');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

// Rotates latest.log -> prev-1.log -> ... -> prev-5.log (oldest dropped),
// leaving no latest.log behind -- the caller creates a fresh one via
// writeHeader/appendLine. Best-effort: a failure on any single rename/unlink
// is swallowed so one locked file can't break the whole rotation or app
// startup.
function rotateLogs(dir) {
  ensureDir(dir);
  const latest = path.join(dir, LOG_FILE_NAME);
  for (let i = MAX_BACKUPS; i >= 1; i -= 1) {
    const src = i === 1 ? latest : path.join(dir, `prev-${i - 1}.log`);
    const dest = path.join(dir, `prev-${i}.log`);
    try {
      if (i === MAX_BACKUPS && fs.existsSync(dest)) {
        fs.unlinkSync(dest);
      }
      if (fs.existsSync(src)) {
        fs.renameSync(src, dest);
      }
    } catch {
      // best-effort -- leave whatever state exists rather than throwing
    }
  }
  return latest;
}

// File-only truncation (console output is never touched by this module).
function truncate(str, max = MAX_LINE_LENGTH) {
  if (str.length <= max) return str;
  const dropped = str.length - max;
  return `${str.slice(0, max)} …[+${dropped} chars]`;
}

// Circular-safe JSON.stringify; falls back to String(value) if stringify
// itself throws (e.g. a BigInt somewhere in the graph).
function safeStringify(value) {
  const seen = new WeakSet();
  try {
    return JSON.stringify(value, (_key, val) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);
      }
      return val;
    });
  } catch {
    try {
      return String(value);
    } catch {
      return '[Unserializable]';
    }
  }
}

// One console.log(...)-style argument -> its textual form for the file.
function formatValue(x) {
  if (x instanceof Error) {
    return `${x.message}\n${x.stack || ''}`;
  }
  if (typeof x === 'object' && x !== null) {
    return safeStringify(x);
  }
  return String(x);
}

// Builds one FILE-only line: "HH:MM:SS.mmm LEVEL message". `args` mirrors a
// console.log(...)-style argument list.
function formatLine(level, args) {
  const now = new Date();
  const time = `${now.toTimeString().slice(0, 8)}.${String(
    now.getMilliseconds(),
  ).padStart(3, '0')}`;
  // Continuation lines (Java's two-line records, Error stacks) are indented so
  // the timestamp+level prefix stays unique to a record's first line.
  const message = truncate(args.map(formatValue).join(' '))
    .split(NEWLINE)
    .join(`${NEWLINE}    `);
  return `${time} ${level} ${message}`;
}

// Appends one already-formatted line + newline. Never throws -- returns
// false on any fs failure so the caller can disable the sink and warn once
// instead of letting logging crash the app.
function appendLine(filePath, line) {
  try {
    fs.appendFileSync(filePath, `${line}\n`);
    return true;
  } catch {
    return false;
  }
}

// Writes the per-launch header block: ISO timestamp, app version, Electron/
// Chrome/Node versions, platform, resolved log directory, and the resolved
// LogControl FLAGS as one JSON line.
function writeHeader(filePath, meta) {
  const lines = [
    `=== ${meta.timestamp} ===`,
    `app: ${meta.appVersion}`,
    `electron: ${meta.electron}  chrome: ${meta.chrome}  node: ${meta.node}`,
    `platform: ${meta.platform}`,
    `logDir: ${meta.logDir}`,
    `flags: ${meta.flagsJson}`,
    '',
  ];
  return appendLine(filePath, lines.join('\n'));
}

module.exports = {
  LOG_FILE_NAME,
  MAX_BACKUPS,
  MAX_LINE_LENGTH,
  resolveLogDir,
  ensureDir,
  rotateLogs,
  truncate,
  safeStringify,
  formatValue,
  formatLine,
  appendLine,
  writeHeader,
};

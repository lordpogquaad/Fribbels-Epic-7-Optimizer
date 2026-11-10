#!/usr/bin/env node
// Agent driver for the Pog E7 Optimizer (Electron). Stateless CLI: each call reaches the running
// app over the Chrome DevTools Protocol on a fixed port, so no REPL or tmux is needed.
//
//   node driver.mjs launch            start the renderer dev server (if :1212 is free) + Electron
//   node driver.mjs status            what is running (dev server, Electron, CDP page)
//   node driver.mjs ss <out.png>      screenshot the app window
//   node driver.mjs eval '<js>'       evaluate in the renderer (Node integration is on), print JSON
//   node driver.mjs click '<css>'     click the first element matching the selector
//   node driver.mjs wait '<css>' [ms] wait until the selector exists (default 30000 ms)
//   node driver.mjs logs [n]          last n lines of 1. App/5. Dev Only/logs/latest.log (default 40)
//   node driver.mjs quit              close the window the app's own way, then stop the dev server
//
// Zero dependencies: Node 22+ (global WebSocket + fetch). State lives in <os tmp>/pog-e7-driver.json.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// The skill folder is <repo>/.claude/skills/run-pog-e7-optimizer/; the app is <repo>/1. App/.
const APP = process.env.POG_APP_DIR || path.resolve(HERE, '..', '..', '..', '1. App');
const CDP_PORT = Number(process.env.POG_CDP_PORT || 9223);
const DEV_PORT = Number(process.env.PORT || 1212);
const STATE = path.join(os.tmpdir(), 'pog-e7-driver.json');
const LOG_DIR = path.join(APP, '5. Dev Only', 'logs');
const DEV_CONFIG = path.join('4. Both', '1. Webpack', 'webpack.config.renderer.dev.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readState = () => {
  try {
    return JSON.parse(fs.readFileSync(STATE, 'utf8'));
  } catch {
    return {};
  }
};
const writeState = (s) => fs.writeFileSync(STATE, JSON.stringify(s, null, 2));
const alive = (pid) => {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
const die = (msg, code = 1) => {
  console.error(msg);
  process.exit(code);
};

async function httpOk(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch {
    return false;
  }
}

async function waitFor(what, fn, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const v = await fn();
    if (v) return v;
    await sleep(500);
  }
  die(`timed out after ${ms} ms waiting for ${what}`);
}

// Env for Electron: Claude Code's shell exports ELECTRON_RUN_AS_NODE=1, which makes electron.exe
// run as plain Node (prints a version, opens no window). Drop it.
function appEnv(extra) {
  const env = { ...process.env, ...extra };
  delete env.ELECTRON_RUN_AS_NODE;
  return env;
}

async function pageTarget() {
  try {
    const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`, {
      signal: AbortSignal.timeout(2000),
    });
    const list = await r.json();
    // Dev mode also opens an undocked DevTools window whose URL is devtools://…/devtools_app.html,
    // so match the file:// scheme too, not just the file name.
    return (
      list.find(
        (t) => t.type === 'page' && t.url.startsWith('file://') && t.url.endsWith('/app.html'),
      ) || null
    );
  } catch {
    return null;
  }
}

async function cdp(method, params = {}) {
  const t = await pageTarget();
  if (!t) die(`no app page on CDP port ${CDP_PORT}; run: node driver.mjs launch`);
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = () => rej(new Error('CDP websocket failed to open'));
  });
  const result = await new Promise((res, rej) => {
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== 1) return;
      if (msg.error) rej(new Error(`${method}: ${msg.error.message}`));
      else res(msg.result);
    };
    ws.send(JSON.stringify({ id: 1, method, params }));
  });
  ws.close();
  return result;
}

async function evaluate(expression) {
  const r = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) {
    const d = r.exceptionDetails;
    throw new Error(d.exception?.description || d.text);
  }
  return r.result.value;
}

async function launch() {
  if (!fs.existsSync(path.join(APP, 'package.json'))) die(`app folder not found: ${APP}`);
  if (await pageTarget()) die('already running (CDP page found); run quit first');
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const state = {};

  // 1. Renderer dev server. Without START_HOT it only compiles and serves; it does not spawn
  //    Electron itself (webpack.config.renderer.dev.js setupMiddlewares).
  if (await httpOk(`http://localhost:${DEV_PORT}/dist/renderer.dev.js`)) {
    console.log(`dev server already up on :${DEV_PORT}; reusing it`);
  } else {
    const out = fs.openSync(path.join(LOG_DIR, 'driver-devserver.log'), 'w');
    const webpackCli = path.join(APP, 'node_modules', 'webpack', 'bin', 'webpack.js');
    const dev = spawn(process.execPath, [webpackCli, 'serve', '--config', DEV_CONFIG], {
      cwd: APP,
      env: appEnv({ NODE_ENV: 'development' }),
      detached: true,
      windowsHide: true,
      stdio: ['ignore', out, out],
    });
    dev.unref();
    state.devServerPid = dev.pid;
    writeState(state);
    console.log(`dev server pid ${dev.pid}; compiling (first build can take a minute)...`);
    await waitFor(
      `the dev server on :${DEV_PORT} (see 5. Dev Only/logs/driver-devserver.log)`,
      () => httpOk(`http://localhost:${DEV_PORT}/dist/renderer.dev.js`),
      480000,
    );
  }

  // 2. Electron. require('electron') returns the exe path, downloading the binary on first use.
  const electronExe = createRequire(path.join(APP, 'package.json'))('electron');
  const out = fs.openSync(path.join(LOG_DIR, 'driver-electron.log'), 'w');
  const el = spawn(electronExe, ['.', `--remote-debugging-port=${CDP_PORT}`], {
    cwd: APP,
    env: appEnv({ NODE_ENV: 'development', START_HOT: '1' }),
    detached: true,
    stdio: ['ignore', out, out],
  });
  el.unref();
  state.electronPid = el.pid;
  writeState(state);
  console.log(`electron pid ${el.pid}; waiting for the app page...`);

  // Electron took 60+ s from spawn to 'ready' once on a loaded machine (2026-11-10).
  await waitFor('the app page on the CDP port', pageTarget, 180000);
  await waitFor(
    'document.readyState complete',
    async () => {
      try {
        return (await evaluate('document.readyState')) === 'complete';
      } catch {
        return false;
      }
    },
    60000,
  );
  console.log(`ready: CDP http://127.0.0.1:${CDP_PORT}  state ${STATE}`);
}

async function quit() {
  const s = readState();
  if (await pageTarget()) {
    // The app's own close path: BrowserWindow 'close' -> renderer 'app-close' -> tree-kill the Java
    // backend -> 'closed' -> app.quit(). Killing electron.exe directly would orphan java.exe.
    try {
      await evaluate('window.close(); true');
    } catch {
      /* the page may go away mid-call */
    }
  }
  if (s.electronPid) {
    const end = Date.now() + 20000;
    while (alive(s.electronPid) && Date.now() < end) await sleep(500);
    if (alive(s.electronPid)) {
      process.kill(s.electronPid);
      console.log(
        `electron ${s.electronPid} did not exit in 20 s; killed it (check for a leftover java.exe)`,
      );
    } else console.log('electron exited');
  }
  if (s.devServerPid && alive(s.devServerPid)) {
    process.kill(s.devServerPid);
    console.log(`dev server ${s.devServerPid} stopped`);
  }
  fs.rmSync(STATE, { force: true });
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  switch (cmd) {
    case 'launch':
      return launch();
    case 'quit':
      return quit();
    case 'status': {
      const s = readState();
      const t = await pageTarget();
      console.log(
        JSON.stringify(
          {
            devServer: {
              pid: s.devServerPid ?? null,
              alive: alive(s.devServerPid),
              up: await httpOk(`http://localhost:${DEV_PORT}/dist/renderer.dev.js`),
            },
            electron: { pid: s.electronPid ?? null, alive: alive(s.electronPid) },
            page: t ? { title: t.title, url: t.url } : null,
          },
          null,
          2,
        ),
      );
      return;
    }
    case 'ss': {
      if (!args[0]) die('usage: ss <out.png>', 2);
      const r = await cdp('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(args[0], Buffer.from(r.data, 'base64'));
      console.log(path.resolve(args[0]));
      return;
    }
    case 'eval': {
      if (!args[0]) die("usage: eval '<js>'", 2);
      console.log(JSON.stringify(await evaluate(args[0]), null, 2));
      return;
    }
    case 'click': {
      if (!args[0]) die("usage: click '<css selector>'", 2);
      const sel = JSON.stringify(args[0]);
      const ok = await evaluate(
        `(() => { const e = document.querySelector(${sel}); if (!e) return false; e.scrollIntoView({block:'center'}); e.click(); return true; })()`,
      );
      if (!ok) die(`no element matches ${args[0]}`);
      console.log(`clicked ${args[0]}`);
      return;
    }
    case 'wait': {
      if (!args[0]) die("usage: wait '<css selector>' [ms]", 2);
      const sel = JSON.stringify(args[0]);
      await waitFor(
        args[0],
        () => evaluate(`!!document.querySelector(${sel})`),
        Number(args[1] || 30000),
      );
      console.log(`found ${args[0]}`);
      return;
    }
    case 'logs': {
      const n = Number(args[0] || 40);
      const lines = fs.readFileSync(path.join(LOG_DIR, 'latest.log'), 'utf8').split(/\r?\n/);
      console.log(lines.slice(-n).join('\n'));
      return;
    }
    default:
      die(
        'usage: node driver.mjs launch|status|ss <png>|eval <js>|click <css>|wait <css> [ms]|logs [n]|quit',
        2,
      );
  }
}

main().catch((e) => die(e.message));

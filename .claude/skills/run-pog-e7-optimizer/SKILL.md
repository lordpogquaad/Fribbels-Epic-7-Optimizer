---
name: run-pog-e7-optimizer
description: Build, launch and drive the Pog E7 Optimizer Electron app (renderer dev server, Electron window, Java backend), click through its tabs, evaluate JS in the renderer and take screenshots. Use when asked to run, start, launch, rebuild or screenshot the app, or to check that a change works in the real running app rather than only in tests.
---

# Run the Pog E7 Optimizer

The agent path is `.claude/skills/run-pog-e7-optimizer/driver.mjs`: a zero-dependency Node CLI that
starts the renderer dev server and Electron with `--remote-debugging-port=9223`, then drives the
window over the Chrome DevTools Protocol, one stateless call per command. The window opens on
Marcus's desktop, so he can watch and report what he sees while you drive it.

All paths are relative to the repo root; open Claude Code there (`.claude/CLAUDE.md`).

## Prerequisites

Windows, Node 22+ (the driver uses the global `WebSocket` and `fetch`), `JAVA_HOME` pointing at JDK 27
(`.claude/rules/machine.md`), the outer deps installed (`yarn install` in `1. App/`) and the renderer
deps installed (`install_frontend.ps1`).

## Build

Rebuild after a Java change, or when told to; the renderer needs no build step, because `launch`
compiles it from source every time.

```bash
cd "1. App" && pwsh -NoProfile -NonInteractive -File "1. Master/2. PS1/build_backend.ps1"
cd "1. App" && yarn build
```

`build_backend.ps1` must print its `SUCCESS` line and leave a fresh `1. Master/3. Jar/backend.jar`.
`yarn build` is the acceptance-gate compile (prod bundles); the dev launch does not use its output.

## Run (agent path)

```bash
D=".claude/skills/run-pog-e7-optimizer/driver.mjs"
node "$D" launch                                   # dev server + Electron; about 1 min cold
node "$D" click '#tab4label'                       # the Heroes tab
node "$D" wait '#heroes-table .ag-row' 60000
node "$D" eval 'document.querySelector("#heroes-table .ag-paging-row-summary-panel").textContent.trim()'
node "$D" eval 'Promise.all([...document.querySelectorAll("#heroes-table img")].map(i => i.complete || new Promise(r => { i.onload = i.onerror = r; }))).then(a => a.length)'
node "$D" ss "$TEMP/pog-heroes.png"                # then Read the PNG and look at it
node "$D" quit                                     # the app's own close path, then the dev server
```

| Command             | What it does                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `launch`            | Starts the dev server on :1212 (reused if already up) and Electron; waits for the page to load     |
| `status`            | JSON: dev server, Electron PID, the CDP page                                                       |
| `ss <png>`          | Screenshot of the app window                                                                       |
| `eval '<js>'`       | Evaluates in the renderer (Node integration is on) and prints the JSON result                      |
| `click '<css>'`     | Clicks the first match                                                                             |
| `wait '<css>' [ms]` | Waits until the selector exists (default 30000 ms)                                                 |
| `logs [n]`          | The last n lines of `1. App/5. Dev Only/logs/latest.log` (both processes and the Java backend)     |
| `quit`              | Closes the window the way the app does, which also stops `java.exe`; stops a dev server it started |

Tab labels are `#tab1label` (Optimizer) to `#tab5label` (Enhancing); the later tabs have no id, so
click them by text through `eval`. Grids: `#myGrid` (Optimizer), `#gear-grid`, `#heroes-table`,
`#builds-table`. Launch output goes to `1. App/5. Dev Only/logs/driver-devserver.log` and
`driver-electron.log`; the state file is `<os tmp>/pog-e7-driver.json`.

## Run (human path)

`1. App/1. Master/1. BAT/start-dev.bat` (or `yarn dev` in `1. App/`): the dev server compiles, then
opens Electron itself; close the window to stop. It has no debugging port, so the driver cannot
attach to it.

## Gotchas

- **`ELECTRON_RUN_AS_NODE=1`** is exported by Claude Code's shell; with it `electron.exe` runs as
  plain Node and opens no window. The driver deletes it from Electron's env.
- **Electron 45 has no install script.** `node_modules/electron/dist/` stays empty after
  `yarn install`; the binary downloads the first time `require('electron')` runs, so the first
  `launch` prints `Downloading Electron binary...` and takes longer.
- **Two pages on the CDP port.** Dev mode opens an undocked DevTools window whose URL is
  `devtools://…/devtools_app.html`; the driver matches `file://…/app.html` exactly, or it would
  drive DevTools.
- **The dev server prints nothing until the first compile ends**, so a silent log for a minute is
  normal. One cold launch on 2026-11-10 stayed silent for more than 4 minutes while two test-heavy
  agents ran; the identical rerun took 67 s. `launch` waits up to 8 minutes.
- **Electron can take over a minute to reach `ready`** on a busy machine: `driver-electron.log` stays
  empty and `latest.log` is not rotated until then. That is slow, not hung; `launch` waits 3 minutes
  for the page.
- **Never kill `electron.exe` directly.** The Java backend is a child of the renderer, and only the
  app's close path (`app-close` → tree-kill) stops it; `quit` uses that path and kills Electron only
  after 20 s.
- **AG Grid renders only the visible rows.** Count rows from the paging summary
  (`.ag-paging-row-summary-panel`), not from `.ag-row` elements.
- **Screenshot text is small.** Read numbers through `eval`, not from the PNG.
- **Images load after the rows.** A screenshot taken straight after `wait` showed an empty hero
  portrait column; the second `eval` above waits for the grid's images first.

## Troubleshooting

- **`timed out … waiting for the dev server on :1212`**: read `driver-devserver.log`; if it is empty
  and the PID is alive, the compile is still running. A `yarn start-renderer-dev` run in the
  background, then `launch` (it reuses the server), got past it.
- **`already running (CDP page found)`**: a previous launch is still up; run `quit`.
- **After `TaskStop` on a background `yarn start-renderer-dev`**, its `node.exe` keeps :1212. Find it
  with `netstat -ano | grep ':1212 .*LISTEN'` and stop that one PID.

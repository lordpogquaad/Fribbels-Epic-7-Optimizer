---
name: frontend-dev-server
description: "The app runs from source via a hot-reload dev server, not a prod build — start-dev.bat → yarn dev → webpack-dev-server writes renderer.dev.js to disk then auto-launches Electron; a plain source .js edit just needs a relaunch, no rebuild step."
metadata:
  type: reference
---

# How the frontend actually runs (chain verified 2026-08-28)

The running app loads the renderer **from source** via a hot-reload dev server, not a production
build. To pick up an edit to a frontend source `.js` (e.g. under `4. JS/...`), **just relaunch the
app — no manual build.**

**Chain:** `1. Master\1. BAT\start-dev.bat` → `yarn dev` (in `1. App/package.json`) →
`start-renderer-dev` → `webpack serve --config "4. Both/1. Webpack/webpack.config.renderer.dev.js"`
(confirmed current script; the CLI itself changed to `webpack serve` on the 2026-08-28
webpack-dev-server 5→6 migration — see [[overhaul-plan-2026-08]]). That dev config sets
`output.filename: 'renderer.dev.js'`, `devServer.writeToDisk: f => f.endsWith('renderer.dev.js')`,
and a `compiler.hooks.done.tap('StartMainProcess', …)` hook — all confirmed present 2026-08-28. So on
launch it compiles the renderer from current source, writes
`2. Frontend\1. Source\renderer.dev.js` to disk, then auto-launches Electron. HMR stays active while
running, so live edits hot-reload too.

`2. Frontend\1. Source\1. HTML\app.html` loads libs via `<script src="../node_modules/…">`, some
source JS via `<script src="../4. JS/…">`, `5. Dev Only/LogControl.js` first (see
[[log-control]]), and finally `require('../renderer.dev.js')` (Electron nodeIntegration).

**What you do NOT need for a source edit:** `install_frontend.ps1` — only syncs the renderer's
`node_modules` from its manifest; run it only when dependencies change (see
[[two-manifests-two-package-managers]]), not for plain `.js` edits.

**`yarn build` is now a real acceptance-gate command** (`.claude/CLAUDE.md`: `yarn lint` →
`yarn typecheck` → `yarn build`) — an earlier note calling the prod webpack build "vestigial/
unmaintained" is stale; the prod path was fixed up during the 2026-08 overhaul. Prefer relaunching
the dev server to verify a source edit works at runtime; use `yarn build` as the acceptance-gate
compile check, not as the way to deploy a change for manual testing.

Quick syntax sanity-check before relaunch: `node --check <file>`.

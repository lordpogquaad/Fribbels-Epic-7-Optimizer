---
name: packaging-model
description: "electron-builder packaging config: asar stays enabled (files.js branches on the asar path at runtime), a files-vs-extraFiles split (asar-bundled vs install-dir-adjacent), main.dev.js serves as both the dev and packaged entry, and the app currently has no custom icon."
metadata:
  type: reference
---

# electron-builder packaging model (config verified against 1. App/package.json 2026-08-28)

Packaging config lives in `1. App/package.json`'s `build` object. Packaging is unused day-to-day —
the app runs in dev via [[frontend-dev-server]] — but the config is internally consistent:

- **asar stays enabled (default).** `files.js` branches on `__dirname.includes('app.asar')` for
  jar/locales/scanner/cache paths — flipping `asar:false` would break those (they'd fall into the dev
  branch). Don't set `asar:false`.
- **`files` (→ inside app.asar):** root `package.json` + `node_modules/**`,
  `5. Dev Only/main.dev.js` + `LogControl.js`, and the `2. Frontend/1. Source` runtime tree
  (`package.json`, `main.prod.js`, `renderer.dev.js`, `1. HTML/**`, `2. CSS/**`, `3. ASSETS/**`,
  `4. JS/**`, `8. DIST/**`, `node_modules/**`) — confirmed matching the current `build.files` array.
  The nested renderer `node_modules` must be globbed **explicitly**: electron-builder's prod-dep
  pruner is keyed off the root package.json and won't walk the renderer's separate manifest on its
  own.
- **`extraFiles` (→ next to the exe / install dir, not in the asar):** `1. Master/3. Jar/**`,
  `2. Frontend/1. Source/6. JSON/**` (locales+cache), `2. Frontend/1. Source/7. PY/**` (scanner) —
  confirmed matching current config. Read at runtime via `path.dirname(getPath('exe'))`, not from the
  asar.
- **`main` = `./5. Dev Only/main.dev.js`** — works as both the dev `electron .` entry and the
  packaged entry (`NODE_ENV` unset → `appRoot` resolves to the asar root). Don't repoint it to
  `main.prod.js` or the dev launch breaks.
- **electron-builder strict-validates the `build` object** — no comments/unknown keys allowed (plain
  JSON only; an unrecognized key like a `_filesComment` errors the build out).
- **No app/window icon** — `directories.buildResources` points at `2. Frontend/2. Icons`, which does
  not exist (confirmed absent 2026-08-28); no `.ico`/`icon.png` anywhere → default Electron icon.
  `extraResources` is repointed at the real `1. HTML/assets` dimension-named PNGs instead.
- **Publish/identity fields** (`build.publish.owner: RexQian`, `appId: poge7optimizer`) are
  inherited from upstream, not this fork — see [[repo-lineage]] for why that matters before ever
  running a packaged build.

**Residual, can't verify headless:** launching the packaged GUI + a GPU optimization run, and the
full NSIS installer click-through.

---
name: renderer-no-react
description: "The renderer is 100% jQuery, not React — the app descends from electron-react-boilerplate but the React/Redux/router stack was dead boilerplate and was fully removed 2026-06-16 (confirmed no react/redux deps remain 2026-08-28). Do not reintroduce React."
metadata:
  type: reference
---

# Renderer is jQuery, not React (removal verified still in effect 2026-08-28)

The Fribbels renderer UI is **100% jQuery-driven**. The app descends from
electron-react-boilerplate, but the React/Redux/react-router stack was never actually used in this
fork's UI — `index.tsx` was a CSS-only stub, and the real bootstrap is `init.js` → `inputHandler.js`,
which wires the whole UI via jQuery globals (`$`) + ag-grid (see [[ag-grid-setup]]). There were zero
real JSX components and zero test files (no jest/enzyme/testcafe usage).

**Removed 2026-06-16** (each verified unused by grep at the time): the entire React/Redux/router
runtime (`react`, `react-dom`, `react-redux`, `react-router-dom`, `redux`, `redux-thunk`,
`@reduxjs/toolkit`, `connected-react-router`, `history`); the dead test stack (`jest`, `babel-jest`,
`enzyme*`, `testcafe*`, `react-test-renderer`, `identity-obj-proxy` + their `@types`); unused runtime
libs (`jimp`, `node-fetch`, `express`, `server`, `python-shell`, `chokidar`, `find-process`,
`network`, `kill-port`, `i18nextify`, `i18next-electron-language-detector`); `@babel/preset-react` +
3 react-optimize Babel plugins. The ESLint stack was migrated to flat config the same day, dropping
`eslint-config-erb`/airbnb/react/jest/testcafe plugins too.

**Confirmed 2026-08-28:** no `react`, `redux`, `react-*` dependency of any kind remains in either
`1. App/package.json` or the renderer's `2. Frontend/1. Source/package.json`. **Do not reintroduce
React or these deps.**

`kill-port-process` was kept (used in `subprocess.js` — distinct from the removed `kill-port`).
Flagged-but-kept as possibly-dead at the time (not re-verified 2026-08-28 — check before removing):
`body-parser`, `node-abi`, `watchpack`. Note: `node-abi` and `watchpack` are still present in
`1. App/package.json` `dependencies` as of 2026-08-28, so if they were ever going to be pruned as
dead weight that hasn't happened yet. See [[frontend-dev-server]] and [[ag-grid-setup]].

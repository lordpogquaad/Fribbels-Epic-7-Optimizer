---
name: overhaul-plan-2026-08
description: "The 2026-08 modernization order for this repo (deps → .claude scaffold → settings audit → GitHub push), decisions taken per step, and items deliberately deferred to follow-up units."
metadata: 
  node_type: memory
  type: project
  originSessionId: ae12964a-a779-473a-b06c-7e3b2491cb82
  modified: 2026-08-28T11:44:31.324Z
---

# Overhaul plan (started 2026-08-28)

**Why:** the repo was last worked on months earlier with GitHub Copilot (Sonnet) before Marcus had a
working Claude Code setup; Copilot-era scaffolding (`COPILOT.md`, `Copilot-Processing.md`,
`.github/chatmodes/*.agent.md`, `.qodo/`, `memory-bank/`, `*-copilot-customizations.ps1`) and
stale dependencies are the debt. Marcus's words: "stuff is not what it should be (I know way more now)".

**Order Marcus set (2026-08-28):**

1. `package.json` dependency refresh (both manifests) — see below.
2. Proper `.claude/` in the repo root: `rules/ memory/ agents/ skills/ plans/ hooks/` + `settings.json`
   (`plansDirectory`, `autoMemoryDirectory`, hooks) + `.claude/CLAUDE.md` (Marcus wants everything
   inside `.claude/`; `./CLAUDE.md` and `./.claude/CLAUDE.md` are the same scope, so only one exists).
   Done 2026-08-28; agents/skills are placeholder READMEs until the reorg says which specialists are
   warranted. ⚠️ None of it loads while the session's primary cwd is `f:/VSCode-Data/Projects` — the
   repo must be Claude Code's working directory (additional directories load only skills/agents/commands).
3. Audit every setting. Done 2026-08-28: the 40 Copilot-era one-off allow entries were replaced by the
   repo command surface (yarn lint/typecheck/build/copy-assets, read-only git, version probes);
   `ask` on `git push`, `deny` on force-push; `$schema` added. User-scope owns `effortLevel`,
   `defaultMode`, `disableBypassPermissionsMode` — do not pin them here. `guard-package-root.mjs`
   verified live (denies `npm install` in `1. App`). Decisions: `.claude/memory/` IS committed (the
   GitHub remote `lordpogquaad/...` is private); no `additionalDirectories` — the other E7 folders in
   Marcus's workspace are personal and unrelated.
4. GitHub sync and push. Before it: a checkpoint commit of the uncommitted numbered-folder reorg
   (~1.9k renames + dep refresh + `.claude/` scaffold sit on top of Copilot-era `2a6011d`); needs
   `git rm -r --cached` of the now-ignored `3. Backend/1. Source/target/` + `.settings/`, and Marcus's
   calls on `.github/_archive/` and the root Copilot leftovers.

Then the larger reorganization (numbered-folder layout, whether to collapse the two-manifest split).

**Step-1 decisions (2026-08-28):**

- Applied: all within-major bumps on both manifests; `chalk` 6; `electron-rebuild` → `@electron/rebuild`
  (bin name unchanged); dropped dead `i18next` pair from the outer manifest; `@types/node` → `^24.x`
  (runtime is Node 24 per `.nvmrc`); dropped redundant `overrides.form-data` in the inner manifest;
  added `tsc7` alias (`npm:typescript@^7`) + `typecheck` script so TS 7 compiles while `typescript`
  stays 6.x for `typescript-eslint` (peer `<6.1.0`).
- Quarantine pins (2026-08-28): `webpack` pinned exact `5.109.2` and `lint-staged` exact `17.3.0`
  because the approved `^5.110.1` / `^17.4.1` were published 2026-08-27 and Yarn's own age gate
  (`npmMinimalAgeGate` = 1440 min, a Yarn 4 default — not in `.yarnrc.yml`) refuses versions under
  24 h old with `YN0016 … are quarantined`. It is client-side, not a registry hold: `npm view` still
  lists them. Restore the carets with `yarn up "webpack@^5.110.1" "lint-staged@^17.4.1"` once both
  are >24 h old (webpack 5.110.1 eligible from 2026-08-28 20:04 UTC), then `yarn lint && yarn build`.
  Do not lower the gate or use `npmPreapprovedPackages` just to save the wait.
- `4. Both/2. Build/1. Scripts/CheckNativeDep.js` had a latent bug (empty native-dep list → unfiltered
  `npm ls` → every root dep flagged → `postinstall` exit 1, so `electron-builder install-app-deps`
  never ran). Fixed 2026-08-28 with an early exit when no `binding.gyp` package is installed.
- Security patches within current majors (2026-08-28, from VersionLens/OSV): `webpack-dev-server`
  → ^5.2.6 (GHSA-f5vj-f2hx-8m93 CSRF + GHSA-m28w-2pqf-7qgj DoS, both fixed in 5.2.6 — no v6
  migration needed for these); `electron` → ^42.10.1 (GHSA-r4w5-6pfg-jxp5, fixed in 42.5.1; same
  major, ABI unchanged). Yarn pin also moved to 4.18.0 via `corepack use`.
- `webpack-dev-server` 5→6 DONE 2026-08-28: only two of v6's breaking changes touched this repo —
  the wds CLI was removed (`start-renderer-dev` now runs `webpack serve --config …` via webpack-cli 7.2.2)
  and chokidar 5 rejects `devServer.watchFiles` given `options` without `paths` ("Non-string provided as
  watch path"); those keys were webpack `watchOptions` all along and now live at the top level of
  `webpack.config.renderer.dev.js`. Smoke-tested: `PORT=1213 yarn start-renderer-dev` boots, serves
  `/dist/renderer.dev.js` (200, ~7 MB), `writeToDisk` rewrites `renderer.dev.js`. Kill a stray dev
  server with `taskkill //PID <listening pid> //T //F` (MSYS eats a single `/PID`).
- `ag-grid-community` 35.3.1→36.1.0 DONE 2026-08-28 (own unit): v36 removed no deprecated APIs
  (changelog states it explicitly), `theme:'legacy'` + the CSS-file themes linked from `app.html` are
  deprecated-but-supported (removal slated for a later major — re-theme becomes its own unit then),
  `ValidationModule` left `AllCommunityModule` (dev-only diagnostics, unused here). Only the inner
  manifest pin and a comment in `inputHandler.js` changed; gate green. Runtime check of every grid
  tab + dark mode is Marcus's to do — a legacy-theme regression shows as unstyled/misaligned grids
  or an `Invalid Grid Option`/`Module` console error, not a crash.
- Still deferred to their own units, each with its own gate: `electron` 42→44 (native rebuild +
  packaging — and the outer manifest's `browserslist: ["electron 42.0"]` must move to the new major,
  with `yarn up -R caniuse-lite electron-to-chromium` so Babel's target DB knows the new Electron;
  the 2026-06 bump to 42 failed silently until that refresh), replacing deprecated `string-similarity`.

**Units landed 2026-08-28 (uncommitted, gates green first-hand):**

- **Rex data pull** — `heroData.js` now fetches both JSONs from Rex's raw `main` first (S3 → CN
  fallbacks in `_cacheUrlReady`); `localizeHeroAssets()` uses `./assets/<file>` when present locally
  else Rex's raw `cachedimages` URL (one `readdir` per launch via new `Files.getAssetsPath()`).
  Canonical hero-PNG source is `2. Frontend/1. Source/3. ASSETS/1. PNG/2. Hero/5. Hero/<code>/`;
  `1. HTML/assets/` is build output flattened by `CopyAssets.js` (made content-aware the same day so
  revised PNGs propagate). New `1. Master/2. PS1/sync-upstream-data.ps1`: fetch upstream, sync
  JSONs + PNGs by blob hash, record commits in `1. Master/upstream-sync.json`, print the non-data
  `feat/offline` diff since last sync as the code-to-review list. Run it after every Rex patch.
- **Fervor damage + PVE 400% crit cap** — ported from `upstream/feat/offline` with local indices
  (`sets[22]` / GPU bit 34): `StatCalculator.SETTING_FERVOR_SET` (toggle `settingFervorSet`,
  default ON, "Use Fervor set bonus for damage optimization"), both GPU kernels, handler/system
  plumbing, local-only `fribbelsPriorityFilter.js` term; `inputUsePvECritDamageCap` per-optimization
  checkbox "400% CDmg cap" (damage cap 400, CP stays 350; composes with local `hero.cdCapBonus`,
  which Rex lacks); `1. Java/10. Tests/StatCalculatorTest.java` (4 tests, run by
  `build_backend.ps1` via surefire). Caveat (pre-existing, same for Rage): `getOrCreateKernel`
  bakes `SETTING_*` at kernel construction, so toggling mid-session can reuse a stale cached GPU
  kernel for the same hero/setFormat — switch hero or restart when testing. Not wired:
  `captureFilterState`/`restoreFilterState` undo snapshots don't include the crit-cap checkbox.
- **Auto-update removed, publish config dropped** 2026-08-28: `main.dev.js` no longer runs
  `electron-updater` or `update-electron-app` (both pointed at Rex's releases and would have replaced
  this fork's build with upstream's); `check`/`restart_app` IPC + the "Check for updates" button are
  gone, `updater.js` keeps only version display/changelog (`displayVersion()`); `build.publish` and
  `package-ci` deleted; `build.appId` → `com.lordpogquaad.poge7optimizer` (matched in
  `setAppUserModelId`/`setAsDefaultProtocolClient`) so an NSIS install no longer collides with
  upstream's — an existing install under the old id is a separate app now. Update story for this
  fork = pull Rex's data (`sync-upstream-data.ps1`) and rebuild; there is no self-update. Verified
  with `electron-builder --dir` (no `app-update.yml` emitted). ⚠️ `install_frontend.ps1` reported
  "up to date" without pruning a removed dep; a targeted `rm -rf node_modules/<pkg>` + rerun fixed it.
- **Memory consolidated in-repo** 2026-08-28: the 21 orphaned Claude memories from
  `~/.claude/projects/f--Epic-Seven-…/memory/` (stranded by the `autoMemoryDirectory` override) and
  the Copilot `memory-bank/` were audited; 16 verified/corrected memories now live in `.claude/memory/`
  (see `MEMORY.md`), the rest were stale, derivable, or historical. Source stores untouched pending
  Marcus's delete approval. Side-finding fixed the same day: the `com/fribbels/Main.java` hardlink
  had broken, so the shipped jar lacked the `-Dcom.fribbels.level` log-level block — pom now compiles
  `0. Main/Main.java` directly, stale copy deleted, jar verified ([[java-dual-source-tree]]).
- **Plan history moved in-repo** 2026-08-28: the Copilot/early-Claude-era `Bugs/` (`New Bugs.md`,
  `Existing Bugs.md`, `Change Logs.md` — the big one, all applied fixes through 2026-06-21) and
  `Improvements/` (`New Improvements.md`, `Change Logs.md`) folders came from `~/.claude/plans/` into
  `.claude/plans/`. They are the project's fix/decision history — read `Existing Bugs.md` before
  re-proposing the contextIsolation refactor or CPU partial-sum pruning (both deliberately deferred).
- **Marcus's runtime checks still pending** for: ag-grid 36 grids, new heroes/icons from Rex,
  Fervor ×1.2 on CPU + GPU + Hero Library, 400% cap.

**How to apply:** don't re-derive these decisions; resume from the step that is open.
`autoMemoryDirectory` in checked-in project settings IS honored — verified 2026-08-28 in a fresh
session with the repo as primary cwd (harness memory line named `<repo>/.claude/memory`); the running
client's schema hint that the key is ignored there was wrong. `plansDirectory` must stay a
project-relative path (`./.claude/plans`) — docs specify relative-only and fall back to the default
if it resolves outside the project root; do not "fix" it to an absolute string.
[[two-manifests-two-package-managers]].

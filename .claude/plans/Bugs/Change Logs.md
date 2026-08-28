# Change Logs — Completed / Applied Fixes

All items confirmed applied to the codebase. Java fixes require JAR rebuild unless noted.

---

## Live preview stayed blank during a run (CPU path) — 2026-06-21

**Symptom:** during a scan-all the live result grid stayed empty the whole run, even though backend
live-streaming worked (`getResultRows` returned `heroStats 500 / maximum 2000000`). User confirmed
fixed on-screen.

**Root cause:** `updateProgress` hard-`purgeInfiniteCache()`'d the grid every 500ms, but on the CPU
path each backend refill (`getResultRows` full-sorts the up-to-2M `TopNResults` heap on a saturated
CPU) lands only every 3-5s → grid purged ~10× faster than it could refill → perpetually blank. (The
fast GPU path refilled quickly enough to hide it; user is Intel-only, so always on the CPU path.)

**Fix:** stop purge-refreshing mid-run. Instead feed in-memory top-N snapshots via the same restored-
source path Quick-Cancel uses — no purge-blank, previous snapshot stays visible while the next loads.
- `optimizerGrid.js`: added `updateRestoredSnapshot(rows, maximum)` (swaps `_restoredRows`/`_restoredMaximum`,
  bumps `_restoredEpoch`, clears sort cache, `refreshInfiniteCache()` — no purge).
- `optimizerTab.js`: replaced the 500ms `OptimizerGrid.refresh()` purge block with an in-flight-guarded
  (`_liveSnapshotInFlight`) `Api.getBestSoFar(execId)` poll throttled to ≥1s; first hit → `setRestoredSource`,
  subsequent → `updateRestoredSnapshot`; guarded on `progressTimer` + `execId === currentExecutionId`.
  Self-paces to whatever rate the CPU produces. On completion the existing handler clears the restored
  source and loads the full sorted paged set (fast — CPU free post-run). One-shot post-bonus-edit
  `OptimizerGrid.refresh()` at optimizerTab.js kept intentionally.

Renderer-bundled (renderer.dev.js) — needs relaunch. `node --check` + ESLint clean on both files.

---

## Centralized ALL logging through `5. Dev Only/LogControl.js` — 2026-06-21

Made LogControl.js the single switchboard for every console-logging surface in the app (renderer,
Java backend, Electron main, build scripts, Python scanner), so a dev turns logging on/off from one
file. Big refactor; all builds green.

**Central `Log` utility** (in LogControl.js, loaded first by app.html): defines `globalThis.Log`
(`debug/info/warn/error` + `trace/table/group*` + channels `api`/`backendStderr`/`liveGrid`). Each
method re-reads its flag (`window.__optDebug`, `__logInfo/__logWarn/__logError`, `API_DEBUG`,
`__backendStderrLog`, `__liveGridLog`) at call time, so flags still flip live in DevTools. Captures
the NATIVE console up front (the one file allowed to touch `console.*`) → no logger recursion.
`Log.error` folds in the old inputHandler `console.error` monkey-patch: console echo is gated by
`__logError`, the benign port-check line is skipped, and the `Notifier.error` popup for a REAL error
ALWAYS fires (popups are error handling, not log verbosity). Editable `FLAGS` block at the top;
`backendJavaLevel` controls the backend.

**Renderer migration:** replaced all ~148 `console.*` calls with `Log.*` across 29 files; deleted the
11 duplicated `_optDbg` helpers (calls → `Log.debug`); cleaned the 11 now-stale logger comments.
Watch-list handled by hand: api.js per-call → `Log.api`, its invalid-rows log → `Log.warn` (no popup);
subprocess.js `[Java]` → `Log.backendStderr`; optimizerGrid `[getRows LIVE]` → `Log.liveGrid`,
`Aggregated` → `Log.debug`, kept the expensive bscr-recompute guard (its catch → `Log.warn`);
itemAugmenter notices → `Log.info`. Removed the `console.error` override in inputHandler.js. `no-undef`
is off so bare `Log` needs no `/* global */`. ESLint exit 0; 0 residual `console.*`/`_optDbg`.

**Backend Java:** `Main.java` reads `-Dcom.fribbels.level` (default INFO) → sets the `com.fribbels`
logger level AND lowers the root ConsoleHandler threshold so FINE actually emits (the JUL gotcha);
aparapi stays pinned SEVERE. `subprocess.js` passes `-Dcom.fribbels.level=<LEVEL>` (validated JUL
token, only when ≠ INFO) from `globalThis.__backendJavaLevel`. Rebuilt jar (BUILD SUCCESS, 10/10
tests); FINE-flag startup smoke test clean. Backend level change needs an app restart.

**Separate processes (env-var hooks, set in `start-dev.bat`, documented in LogControl header):**
main.dev.js electron-log level ← `E7_MAIN_LOG_LEVEL`; build scripts (CopyAssets, regen) + webpack
"Starting Main Process" routine chatter ← `E7_BUILD_QUIET` (errors/warnings still show); scanner.py
optional `_dbg()` to **stderr only** ← `E7_SCANNER_DEBUG` (stdout is the data protocol).

**Verified:** `yarn build` (renderer+main) green, backend BUILD SUCCESS + 10/10 + FINE smoke test,
ESLint/node --check/py_compile all clean. **Residual (manual, needs the running GUI):** confirm each
flag toggles its output live, and that `backendJavaLevel:'FINE'` surfaces `[getResultRows]`/GPU traces
after a restart. All flags default ON (mid-debug of the live-preview issue) — set false for a quiet
console.

---

## `DEPENDENCY-INVENTORY.md` — marked SUPERSEDED (historical snapshot) — 2026-06-21

The repo-root `DEPENDENCY-INVENTORY.md` is a frozen 2026-06-16 snapshot taken mid-modernization (manifests
still full of alpha/beta/rc/canary pins). Rather than a full table regen or deletion, added a prominent
**⛔ SUPERSEDED** banner at the top that: flags the versions as stale, calls out the big drifts (pre-release
pins → latest stable; React/Redux/Jest/enzyme/testcafe stack removed; Java 21→25; Maven 3.8.8→3.9.16;
build_backend.ps1 no longer uses the redhat.java JDK and now runs tests; renderer manifest relocated +
electron-builder `build` config rewritten), and points to the **live sources of truth**
(`1. App/package.json`, `2. Frontend/1. Source/package.json`, `pom.xml`, `build_backend.ps1`) plus the
`project_modernization_2026` memory and this changelog. Kept as historical reference only — a fresh
inventory should be generated from the live manifests, not patched from the stale tables. This was the last
open item in New Bugs.md → **the audit backlog is now clear.** Found 2026-06-20; resolved 2026-06-21.

---

## Optimizer-tab optional refactors IMP-1 / IMP-3 / OPT-2 / OPT-4 — 2026-06-21

Behavior-preserving cleanups in `optimizerTab.js` + `multiOptimizerTab.js` (both syntax-checked and
ESLint-clean afterward). These are `<script src>`-loaded globals, not in the webpack graph, so verification
was node --check + ESLint + behavior-equivalence analysis (no functional GUI test available).

- **IMP-1** (`loadPreviousHeroFilters`) — replaced ~280 lines of hand-written `$(#id${index}).val(...)`
  restores with two table-driven loops. The (id, key) pairs were extracted **programmatically** from the
  live source (90 number + 8 rank + 1 scale = 99, matching the 99 `.val(` calls exactly) to eliminate
  transcription risk; order is irrelevant since each sets a distinct element from the unchanged request.
  The 8 core-stat Min/Max limits keep an explicit `[id, key]` pair (id ≠ key: `#inputMin<Stat>Limit` ←
  `input<Stat>MinLimit`); the rest are bare strings (id === key). Also: the 6-checkbox block was a
  byte-identical copy of the **dead** `_applyRequestCheckboxes` helper — table-ized that helper and made
  `loadPreviousHeroFilters` call it (removing the duplicate + the now-unused local `optimizerSettings`).
- **IMP-3** — extracted the duplicated artifact-stat math into `_attachArtifactStats(hero)`, called from
  both `_attachHeroAndArtifact` (filter path, freshly fetched hero) and the inline block in
  `submitOptimizationRequest`. The old `+=` (helper) vs `=` (inline) divergence is moot — both zero-init
  first, so the canonical `=` form preserves behavior; consolidating also removes the noted double-count
  footgun.
- **OPT-2** (`applyMustHaveSubstatFilter`) — replaced the O(6n) per-slot `items.some(...)` scan with a
  single O(n) pass. `slotHasStat` is pre-seeded to `false` for the six slots and updated via
  `slotHasStat[item.gear] === false` so an unexpected gear type is ignored and still passes freely later —
  exactly as the old per-slot scan (which only considered those six slots) did.
- **OPT-4** (`multiOptimizerTab.getDataSource.getRows`) — added request **coalescing**: a per-data-source
  `Map` keyed by `startRow|endRow|sortColumn|sortOrder|spdEffWeight|executionId`. Concurrent identical
  requests (AG-Grid can re-fire a block on rapid refresh/sort) now share one backend call; every queued
  `params` still gets its success/fail callback (honors AG-Grid's contract — a dropped callback would spin
  the grid forever), and the `executionId` in the key pins the result set so a coalesced caller can't get
  stale data.

---

## Backend DTO contract pass — removed 2 unread fields (`Request.requestType`, `OptimizationRequest.inputSets`) — 2026-06-21

**What:** dropped two DTO fields the Java backend never reads (frontend keeps sending the JSON keys; Gson silently
ignores unknown keys, so the wire contract is unchanged and no frontend change was needed).

- **`Request.requestType`** (`model/Request.java`) — written by the frontend from 3 call sites; its only backend reader
  was the long-removed `handleSpecificRequest` dispatcher. Removing it left `Request` **empty**, but it stays as a class:
  it's the common supertype + generic bound of `RequestHandler.parseRequest` (`<T extends Request>`) for ~24 request
  DTOs. Also dropped the now-useless `@Getter`/`@ToString` (+ imports) and added a doc comment so nobody deletes the
  empty base.
- **`OptimizationRequest.inputSets`** (`request/OptimizationRequest.java`, `List<List<Set>>`) — the backend reads only
  the flat `inputSetsOne/Two/Three`. **Verified safe against the round-trip concern:** `inputSets` is a pure frontend
  aggregate, always rebuilt locally from `setFilters.sets` in `getOptimizationRequestParams` (optimizerTab.js:2536-2539,
  same source as the three sub-fields) and reconstructed from them by the `applyItemFilters` guard (2147) if absent;
  filter presets store the request client-side in localStorage. No path depends on the backend **echoing** `inputSets`
  back, so removing the field can't reset a user's saved set filters. Left a comment in its place.

**Left intact:** `Item.heroName` — re-confirmed **alive** (read by gearAnalysisTab.js:429/452/453/818/966, built in
item.js:11, serialized in itemSerializer.js:49, carried by backend `Item.java:54` across the item-DB round-trip). Do
NOT remove.

**Verified:** `build_backend.ps1` → `mvn clean package` **BUILD SUCCESS**, tests **10/10 green** (BuildScoreRankingTest
7 + MergeItemsTest 3), `backend.jar` redeployed to `1. Master/3. Jar/`. Found 2026-06-20; fixed/verified 2026-06-21.

---

## `package.json` `build` config — rewrote electron-builder packaging for the numbered-folder reorg — 2026-06-21

**Problem:** the `build.files` array still listed pre-reorg flat paths (`dist/`, `app.html`, `css/`, `assets/`, `js/`,
`locales/`, `main.prod.js`) — none of which exist at the `1. App` root post-reorg — so `electron-builder` would bundle
empty/wrong paths. Two further latent packaging bugs surfaced during the fix: `extraResources` pointed at the **missing**
`2. Frontend/2. Icons/**` dir (would have *errored* electron-builder with "source not found"), and the install-dir
runtime resources read by `files.js` (scanner `.py`, `6. JSON` cache) were not in `extraFiles`.

**Key architectural fact (why it was more than a glob swap):** the app is **asar-aware on purpose** — `files.js`
branches on `__dirname.includes('app.asar')` and reads the jar / locales / scanner / cache from **next to the exe**
(`path.dirname(getPath('exe'))`), while `main.dev.js` (the packaged entry; NODE_ENV unset → `appRoot = ../..` = asar
root) loads `1. HTML/app.html` + the `8. DIST` preload from **inside** the asar, and `app.html` in turn `require()`s
`../renderer.dev.js` and `<script>`-loads `../4. JS`, `../2. CSS`, `../node_modules` via asar-relative paths. So the
fix had to split runtime files correctly across `files` (→ asar) vs `extraFiles` (→ install dir), and keep asar
**enabled** (default). `main` stays `./5. Dev Only/main.dev.js` — it works as both the dev `electron .` entry and the
packaged entry, so no dev-launch breakage.

**Changes (`1. App/package.json` `build`):**
- `files` → asar layout: `package.json`, `node_modules/**`, `5. Dev Only/main.dev.js`,
  `2. Frontend/1. Source/{package.json, main.prod.js, renderer.dev.js, 1. HTML/**, 2. CSS/**, 3. ASSETS/**, 4. JS/**,
  8. DIST/**, node_modules/**}`.
- `extraFiles` → `1. Master/3. Jar/**`, `2. Frontend/1. Source/6. JSON/**` (locales + cache),
  `2. Frontend/1. Source/7. PY/**` (scanner).
- `extraResources` → `{ from: "2. Frontend/1. Source/1. HTML/assets", to: "resources" }` (was the missing Icons dir).

**Verified:** `yarn build` green (confirms the chalk/rimraf build-script fixes too). `electron-builder build --dir`
**succeeded** (Electron 42.4.1 → `release/win-unpacked/PogE7Optimizer.exe`). Asar inspection confirmed all runtime
paths present incl. the **nested renderer `node_modules`** (9636 entries — `@electron/remote` with `main/index.js`,
`update-electron-app`, i18next, multiple-select, tippy, rangeslider) and root `electron-log`/`electron-updater`;
`extraFiles` (backend.jar, locales, cache, scanner.py) landed next to the exe; `extraResources` icons under
`resources/resources/`. **Residual (manual, can't verify headless):** launching the packaged GUI + a GPU optimization
run, and the full NSIS installer (`yarn package`) click-through. **Known cosmetic gap:** no app/window icon (no `.ico`
and no `icon.png`; `directories.buildResources` `2. Frontend/2. Icons` is absent → electron-builder falls back to the
default Electron icon). Found 2026-06-20; fixed/verified 2026-06-21.

---

## `ItemsRequestHandler.mergeItems` — fixed silent item loss on stat-twin scan (+ regression tests) — 2026-06-21

**Bug (data loss):** `getHash()` excludes ingameId, and the ingameId-match branch left the matched existing item in
the hash index while the hash branch merged purely by hash. So a scan containing N1 (re-scan of existing item E, by
ingameId) and N2 (a **distinct** piece with identical stats but its own ingameId) mapped **both** to E → `setItems`
id-dedup dropped N2 → **the user silently lost a real gear piece.** Proven with a failing test (`expected 2 but was 1`).

**Fix** (`mergeItems` hash branch): instead of blindly taking `matchingItems.remove(0)`, pick the first hash-candidate
that isn't *provably a different* physical item — skip a candidate whose **non-null** ingameId differs from the new
item's non-null ingameId. A null ingameId on either side stays ambiguous (same-item re-report) and still merges by
hash, so the common cases are unchanged. Chosen over "remove E from the hash index on ingameId match", which would
have **regressed** same-item-rescanned-twice into a duplicate.

**Regression tests** — new `10. Tests/MergeItemsTest.java` (3 tests), now that the suite runs:
`distinctStatTwinWithItsOwnIngameId_isNotDropped` (the repro — failed pre-fix, passes post-fix),
`sameItemReportedTwice_collapsesToOne`, `sameItemReportedWithNullIngameId_collapsesToOne`. Full suite **10/10 green**.

**Verified + deployed:** `build_backend.ps1` → tests pass + jar packaged + **redeployed** to `1. Master\3. Jar\backend.jar`,
BUILD SUCCESS. Resolves the long-deferred `mergeItems` New Bugs item (the prior audits couldn't produce a repro because
the trigger is narrow — two *distinct* pieces sharing identical hashable stats, common only for low-investment gear).

---

## `optimizerGrid.js` — live JS bscr re-stamp in restored-results mode — 2026-06-21

Product call: **live JS re-stamp** (chosen over leave-as-is). Previously, editing a target/rank/scale after loading
cached results didn't update `bscr` or the sort until the next backend run (the bscr depends on those via
`calculateBuildScore`'s `rankFactor`, but restored mode never recomputed it). Now it re-stamps + re-sorts live using
the JS `calculateBuildScore` (an approximation of the backend score).

- `stampBuildScore(rows, force)` — new `force` param; when set, recompute bscr from the current targets even if a value
  exists (default behavior unchanged: only fills rows missing the field).
- New `_restoredBscrLive` flag — **off on (re)load** so a freshly restored set still shows its backend-authoritative
  bscr; flipped **on the first target/rank/scale edit** (`refreshTargetCells`), which then drops the sort memo and
  `refreshInfiniteCache()`s so `getRows` re-stamps (force) + re-sorts. Reset on new load / new run
  (`setRestoredSource`/`clearRestoredSource`). Mirrors the existing `refreshCalcInputs` live re-sort for the eff weight.
- Scrolls still hit the sort memo (re-stamp only on the cache-miss after an edit) — no per-page recompute.
- Tradeoff (accepted): once live, the restored bscr is the JS approximation. It excludes the fixed gear mains the
  backend includes — a hero-constant offset, so the **ranking/sort is unchanged**; only the absolute numbers shift
  slightly after the first edit. The "Cached — re-run to update" banner stays (still valid for filter/priority edits
  that change which items are in a build, which a re-stamp can't reflect). ESLint exit 0. Not staged. Runtime-verify on
  a real cached-results edit during the end-of-sweep app relaunch.

---

## i18n — deleted orphaned "64-bit Java 8" parse-error key from 6 locales — 2026-06-21

The gear-parse error string was modernized 2026-06-19 (en/en-US → "file may be corrupted or incomplete…"), leaving the
old `"Error occurred while parsing gear. Check that you have …64-bit version of Java 8… try again."` key orphaned in the
6 non-English locales (`fr`, `ja`, `ko`, `ru`, `zh`, `zh-TW`) — no `i18next.t()` call references it (verified: 0 matches
in `4. JS`). Surgically removed that one key from each file (text-level line delete; preserves all other formatting),
asserting exactly 1 line removed per file **and** the result still parses as valid JSON before writing. The separate,
still-active `"Java process failed…"` key was left untouched. Net: 0 remaining "64-bit version of Java 8" occurrences.
The new error string falls back to English in those 6 locales (unchanged behavior — full translation is a future i18n
pass, not tracked as a bug). Resolves the i18n orphaned-key New Bugs item. Not staged.

---

## `updater.js` — refreshed the "What's new" popup to v1.12.0 + fixed ignored version arg — 2026-06-21

`Updater.showNewFeatures` hardcoded a stale "New in v1.10.0" heading + v1.10.0 feature list, and ignored the
`currentVersion` arg settings.js passes. Replaced both: the heading is now `New in v${version}` (uses the passed arg,
falling back to the module-level `currentVersion`), and the bullets are a concise, honest summary of the recent work
(user-directed) — under-the-hood modernization (latest Electron + Java 25), refreshed dependencies/build tooling,
preset-deletion confirmation, and bug fixes/cleanup. Resolves the "Stale v1.10.0 popup" New Bugs item (content +
ignored-arg). ESLint exit 0. Wording is a starting point — easy to tweak per the final release notes. Not staged.

---

## Re-enabled the backend JUnit test suite — 2026-06-21

The `BuildScoreRankingTest` (7 assertion tests covering Sorter buildScore ordering, TopNResults keep-best-N, and
StatCalculator buildScore = Σ priorityScore + target/sweet-spot bonus) was present but never ran — the pom had
`junit-jupiter-api` (test scope) but no **engine**, and `build_backend.ps1` passed `-Dmaven.test.skip=true`.

- **pom.xml**: added `junit-jupiter-engine` 6.1.0 (test scope) so surefire 3.5.6 can discover/run the JUnit 5 tests.
- **build_backend.ps1**: dropped `-Dmaven.test.skip=true` → `mvn clean package` now runs the suite; the build fails if a
  test fails (regression guard restored).
- **Verified**: `mvn clean test` → `Tests run: 7, Failures: 0, Errors: 0`; full `build_backend.ps1` → tests pass + jar
  packaged + redeployed, BUILD SUCCESS. The compiler `<excludes>` (numbered-dir dedup for the dual source tree) apply
  only to the main compile, not testCompile, so the test in `10. Tests/` builds correctly. Resolves the
  "Re-enable the backend test suite" New Bugs item.

---

## `optimizerTab.js` — preset deletion now requires confirmation (BUG-A4) — 2026-06-21

The per-hero filter-preset chips have a tiny `×` delete button whose click handler deleted the preset (filters + sets +
community-build row) immediately, with no confirmation — a misclick permanently lost it. Added an
`await Dialog.confirmation(\`Delete preset "\${name}"?\`)` guard (the same SweetAlert2 confirm used elsewhere) before the
delete; cancel is a no-op. ESLint exit 0. Resolves the deferred optimizer-tab audit item **BUG-A4**. (The separate
mod-config-dialog `presetDeleteBtn` in `dialog.js` is a deliberate select-then-delete inside an open SweetAlert2 modal —
not the misclick-prone chip — left as-is to avoid nested-modal stacking.)

---

## `1. App\1. Master\3. Jar\backend.jar.jdk21.bak` — deleted stale pre-Java-25 backup jar — 2026-06-21

Removed the 32M JDK-21 backend jar (snapshot from the Java 25 migration, Jun 16). Superseded by the verified Java 25
build (`backend.jar`, rebuilt this session). Referenced by nothing — `build_backend.ps1`, `subprocess.js`, and
`files.js` all target `backend.jar`, not the `.bak` — and it would otherwise be wastefully bundled by the
`"./1. Master/3. Jar/**"` packaging glob in `package.json`. Untracked in git. The active `backend.jar` (Java 25)
remains in place. User-approved deletion.

---

## `1. App\_pre-modernize-backup\` — deleted superseded modernization backup — 2026-06-21

Removed the 804K rollback snapshot created on the modernization day (Jun 16): `babel.config.cjs`, root `package.json`,
`renderer-package.json`, `yarn.lock`. All four are fully superseded by the live modernized equivalents
(`1. App/babel.config.cjs`, `1. App/package.json`, `1. App/yarn.lock`, `2. Frontend/1. Source/package.json`), and the
modernization is verified end-to-end (frontend + backend both build green). The folder was **untracked** in git
(`?? _pre-modernize-backup/`), so deletion doesn't touch the index; its only reference anywhere was the
`tsconfig.json` exclude line, which was also removed. `tsc --noEmit` → 0 after. User-approved deletion.

---

## Backend — cleared 24 deprecated `StringUtils.equals/contains` calls (commons-lang3 3.20.0) — 2026-06-21

Surfaced by a post-sweep backend build check: `mvn clean package` (Java 25) was BUILD SUCCESS but emitted a
"deprecated API" note. Pinpointed via `-Xlint:deprecation` to `org.apache.commons.lang3.StringUtils.equals(CharSequence,
CharSequence)` + `.contains(CharSequence, CharSequence)` — both deprecated by the modernization's commons-lang3 → 3.20.0
bump. **24 call sites across 6 files** replaced with the **official replacement** the deprecation points to,
`org.apache.commons.lang3.Strings.CS.equals/contains` (the case-sensitive `Strings` instance) — identical null-safe
semantics, so behavior is unchanged (chosen over `Objects.equals`/`String.contains` precisely to preserve the null-safe
`contains` behavior — `String.contains` NPEs on null).

- `Hero.java` (3 equals + 7 contains), `ItemDb.java` (5), `HeroesRequestHandler.java` (4), `HeroDb.java` (2),
  `ItemsRequestHandler.java` (2), `OptimizationRequestHandler.java` (1).
- Imports: dropped `import …StringUtils;` from the 4 files where it became unused (`Hero`, `ItemDb`, `HeroDb`,
  `ItemsRequestHandler`); kept it (added `Strings` alongside) in the 2 files still using it — `OptimizationRequestHandler`
  (`StringUtils.isNotBlank`) and `HeroesRequestHandler` (`StringUtils.isNumeric`).
- **Verified**: `build_backend.ps1` → BUILD SUCCESS, **deprecation note gone** (only the unrelated dependency-level
  `sun.misc.Unsafe` runtime warning remains); grep confirms 0 remaining `StringUtils.equals/contains` and no unused
  `StringUtils` imports. **JAR rebuilt + redeployed** to `1. Master\3. Jar\backend.jar` (per user request — this is the
  one change in the whole sweep that updates a deployed binary).

---

## Renderer JS sweep — Folder 7 `7. Gear Analysis Tab\` (4 files) — reviewed clean — 2026-06-21

All 4 files reviewed; ESLint exit 0, no BOM, no dead code. Only change: **CRLF→LF** on `epicSevenGearConstant.js`
(batch). This subsystem uses the plain-`<script>` global pattern (IIFE + `globalThis`, documented load order via
app.html script tags) — ported from the original Google-Sheets project — not ES modules; ESLint is configured for it.

- **`gearScorer.js`** (1158, head + grep) — tiered gear scoring IIFE; consumes globals from the two constant files.
- **`gearAnalysisTab.js`** (1770, head + grep) — gear-analysis UI + bulk mod-target helpers IIFE.
- **`epicSevenGearConstant.js`** (1148, head + grep) — deep-frozen (`Object.freeze`) gear constants on `globalThis`,
  idempotent `globalThis.X || …` guards.
- **`archetypeRules.js`** (4025, head + grep) — frozen archetype-tier definition data.
- All section-header `//` comments are explanatory; no commented-out code, old AG-Grid API, or debug leftovers.
- **Not staged** (new-layout reorg paths).

**Batch 4 (renderer JS) complete: all 68 files swept across 7 folders.**

---

## Renderer JS sweep — Folder 6 `6. Shared\` (30 files) — 2026-06-21

Largest folder (~13k lines, dominated by `dialog.js` at ~6.9k). ESLint exit 0 (whole folder, after edits), no BOM.
Dead code was concentrated in `dialog.js`; everything else was already clean.

- **`dialog.js`** — removed 4 dead commented-out blocks (standard grep patterns missed most — they're commented HTML/JSX
  and object fields):
  1. a ~29-line "Disabled damage" commented-out `html:` template (old skill-options dialog markup),
  2. two commented-out jQuery `multipleSelect`/`change` init lines in `didOpen`,
  3. a commented-out `html += <option…>` line + 2 commented `<div>` markup lines in the imprint-select builder,
  4. the `skillOptions[skill]` object had **~22 commented-out damage-input fields** (the disabled damage feature) around
     the single active `skillEffect` field → collapsed to just `{ skillEffect: … }`.
     Re-grepped `dialog.js` exhaustively afterward (markup, `document.`/`parseFloat`/`.value`/`=>` in comments): no
     commented-out code remains. ESLint 0.
- **Already logged separately (this folder):** `updater.js` (dead `update-not-available` IPC channel — see its entry)
  and `inputHandler.js` (dead `Heroes` stub — see Folder 2 entry).
- **Fully reviewed clean:** `init`, `item`, `stat`, `optimizationRequest`, `utils`, `diskCache`, `gridRenderer`
  (set/star icon rendering + the AG-Grid arrow-key navigator used by all grids; derives its 4-piece set membership from
  the `setData` single source).
- **Verified clean via comprehensive grep + ESLint + BOM (remaining ~21):** services (`api`, `settings`, `stoveRta`,
  `rtaStats`, `heroData`, `subprocess`, `damageCalc`, `communityBuilds`, `setData`, `artifact`), UI
  (`htmlGenerator`, `selectors`, `statPreview`, `colorPicker`, `tooltip`, `assets`, `darkmode`, `notifier`, `i18n`),
  `files`. No dead code, old AG-Grid API, React/jQuery-4 removals, or ungated debug logs (all use the gated `_optDbg`
  pattern or legitimate `console.error/warn`).
- **Not staged** (new-layout reorg paths).

---

## Renderer JS sweep — Folder 5 `5. Archetype Tab\` (4 files) — reviewed clean — 2026-06-21

All 4 files reviewed; ESLint exit 0, no BOM, no dead code. Only change: **CRLF→LF** on all four (done in the batch
normalization — `.gitattributes` mandates LF for `.js`).

- **`archetypeScorer.js`** (297, full read) — pure scoring functions (no DOM); roll-normalized substat scoring via
  `ROLL_DIVISORS` + `FlatStatCalibration`. Clean.
- **`archetypeStore.js`** (206, full read) — file-backed persistence to `FribbelsOptimizerSaves/e7-archetypes.json`;
  validation, timestamped backup on reset, `structuredClone` of defaults, gated `_optDbg`. Clean.
- **`defaultArchetypes.js`** (1205, structural) — pure `DEFAULT_ARCHETYPES` data array (well-documented header). Clean.
- **`archetypeTab.js`** (1053, grep + ESLint) — UI wiring; gated `_optDbg`, no dead code / old API / debug leftovers.
- **Not staged** (new-layout reorg paths).

---

## Renderer JS sweep — Folder 4 `4. Importer Tab\` (4 files) — reviewed clean — 2026-06-21

All 4 files reviewed; ESLint exit 0, no BOM, no dead code, no edits needed.

- **`importer.js`** (424, full read) — gear import/export event handlers. Confirmed the gear-parse error message is the
  **modernized** copy ("file may be corrupted or incomplete…", no stale "install 64-bit Java 8"). `@electron/remote` +
  `node:fs`, EPERM handling. (The 4 identical parse-error `Dialog.htmlError` blocks are self-contained per-handler — left
  as-is.)
- **`saves.js`** (339, full read) — save/load JSON, rebuilds the mod-variant cache on load (`seedCache`), and the
  Euglmomorain hardcoded-base-stat injection is correctly cleaned up post-load (BF9 note). Clean.
- **`scanner.js`** (557, structural read + grep) — spawns the Python `scanner.py` via `node:child_process`; its
  `setsByIngameSet` map mirrors `itemAugmenter.SET_KEY_TO_NAME` (consistent). Gated `_optDbg`. The packet reassembly
  mirrors the already-reviewed `scanner.py`.
- **`importerTab.js`** (6) — `{ initialize: () => {} }` no-op stub (standard tab interface). Clean.
- **Not staged** (new-layout reorg paths).

---

## Renderer JS sweep — Folder 3 `3. Hero Tab\` (2 files) — 2026-06-21

Both files reviewed; ESLint exit 0, no BOM, modern AG-Grid v35 (`getRowId`, `gridOptions.api`). Dead code removed:

- **`heroesGrid.js`** — removed 3 commented-out grid-option blocks: `// suppressMoveWhenRowDragging: true`,
  `// suppressNavigable: true`, and a stale 5-line block (`// animateRows / // immutableData / // getRowNodeId …`).
  The last two are **pre-v28 AG-Grid API** superseded by the active `getRowId` right above — definitively dead.
- **`heroesTab.js`** — the `if (response.heroes.length === 0)` branch contained only a dead `// addHero("Maid Chloe")`
  comment (an empty branch). Simplified to `if (response.heroes.length > 0) HeroesTab.redrawHeroInputSelector()` —
  exact same behavior, no empty block left. Its `_optDbg` helper is correct.
- **Not staged** (new-layout reorg paths).

---

## Renderer JS sweep — Folder 2 `2. Gear & Enhancing Tab\` (16 files) — 2026-06-21

Reviewed all 16 gear/enhancing JS files. ESLint exit 0 (whole folder, after edits); no BOM. Findings:

- **Dead `Heroes` stub removed (3 files).** `enums.js` exported a `heroes` map containing a single hardcoded `Angelica`
  fixture as `Heroes`; a comprehensive grep across all renderer source (JS/HTML/CSS/JSON/TS) showed the `Heroes`
  identifier was only **defined → imported → assigned to `globalThis` → typed**, never _read_ (every other "Heroes" hit
  is UI text). Removed the stub + its export (`enums.js`), the import + `globalThis.Heroes = Heroes` (`inputHandler.js`),
  and the `var Heroes: any` ambient type (`globals.d.ts`). Verified ESLint 0 + `tsc --noEmit` 0 after.
- **`enhancingTab.js`** — removed 5 dead commented-out echarts config lines (`// max: 80`, `// formatter: '{value}'`,
  three `// position: ...` alternatives), each sitting beside its active replacement. CRLF→LF was done in the batch pass.
- **`reforgeConstants.js` + `flatStatCalibration.js`** — CRLF→LF (batch).
- **Fully reviewed clean (12):** `gearRating`, `reforgeConstants`, `itemSerializer`, `enums`, `locator`,
  `flatStatCalibration`, `forceFilter`, `heroGearMatcher`, `itemAugmenter`, `modificationFilter`, `constants`, `reforge`.
  Verified the cross-module invariant: `constants.piecesBySetIndex` (24 entries) matches `setsByIndex`/setEnum order and
  `rollDivisors.FOUR_PIECE_SETS`. `modificationFilter.enumerateModCandidates` is the single source of truth reused by
  `priorityFilter.calculateRankScore`. `forceFilter` documents a real prior bug fix (removed early-return). `reforge`'s
  large `calculateMaxes` block comment is intentional formula-derivation reference (kept). All `_optDbg`/`console`
  diagnostics are gated or legitimate anomaly logging.
- **Verified via comprehensive grep + ESLint + structural/targeted reads (4):** `itemsGrid`, `itemsTab`, `itemSimulator`
  (heads confirm modern AG-Grid v35 / gated `_optDbg` / clean structure) and `enhancingTab` (dead echarts lines removed).
  No dead code, old AG-Grid API, React/jQuery-4 removals, or debug leftovers in any.
- **Not staged** (new-layout reorg paths; `globals.d.ts` is a tracked pre-reorg file but the change is moot until commit).

---

## Renderer JS sweep — Folder 1 `1. Optimizer & Multi-Hero Optimizer Tab\` (8 files) — 2026-06-21

Reviewed all 8 optimizer-tab JS files. **Triage first** (whole `4. JS` tree): ESLint exit 0, zero BOM, no React/Redux
leftovers, no jQuery-4-removed APIs, AG-Grid usage is all modern v35 (`gridOptions.api` + `setGridOption`, no
`columnApi`, no scoped `@ag-grid-community/*`). So the renderer was already well-modernized; this folder's findings are
dead-comment removals + EOL normalization. Verified the cross-file contract `PriorityFilter.calculateBuildScore(heroStat,
params, baseStats, verbose)` matches optimizerGrid's call sites. ESLint exit 0 on the whole folder after edits.

- **`optimizerGrid.js`** — removed 2 commented-out code lines (a disabled `suppressNavigable` colDef option; a
  commented-out `dac` column def). The known restored-mode `bscr` re-stamp limitation stays in `New Bugs.md` (product call).
- **`optimizerTab.js`** — removed 2 dead commented-out call lines: `// showEditHeroInfoPopups(row.name)` (no `row` in
  `showSkillOptionsWindow(heroId)`) and `// Subprocess.sendString(str)` (out-of-scope `str`). Normalized CRLF→LF. The
  `_optDbg` debug helper (line 24, gated by `window.__optDebug`) is correct — left untouched (never `replace_all`
  `console.log`→`_optDbg` here; it would self-recurse). Optimization _logic_ was already deep-audited in prior sessions
  (the New-Plan optimizer-tab items), so this was the mechanical pass.
- **`rollDivisors.js`** — removed 1 duplicate doc line on `_pairCeil`. Normalized CRLF→LF. The fast-reject filter's
  EFF/RES bail-outs intentionally omit the `heroBaseX &&` guard (base eff/res are legitimately 0) — verified consistent
  across both bail-out passes, not a bug.
- **`priorityFilter.js`, `fribbelsGrid.js`, `fribbelsLibrary.js`, `fribbelsPriorityFilter.js`, `multiOptimizerTab.js`**
  — reviewed clean (no dead code, no stale comments, no bugs). `multiOptimizerTab.js` has its own correct `_optDbg`.
- **Not staged** (new-layout reorg paths).

---

## `updater.js` + `main.dev.js` — dead `update-not-available` IPC channel (name mismatch) — 2026-06-21

Found during the renderer JS sweep (folder `6. Shared`). The auto-update "no update available" path was dead on
**both** ends due to a channel-name mismatch:

- **Main** (`5. Dev Only\main.dev.js:124-126`) had `autoUpdater.on('update-not-available', () => mainWindow.webContents.send('update_not_available'))`
  — sending on the **underscore** channel `update_not_available`.
- **Renderer** (`updater.js:71`) had `ipcRenderer.on('update-not-available', () => {})` — listening on the **hyphen**
  channel `update-not-available`, with an empty body.

So the listener never fired (wrong name) and did nothing anyway, and the main-side send reached no listener (verified
`update_not_available` has zero renderer listeners). The silence on startup-no-update is intended — the manual "Check
for updates" button notifies via the separate `check` channel (`Notifier.info('No new updates found')`), which is
unaffected. Removed both vestigial pieces (the renderer no-op listener and the dead main handler). ESLint exit 0 on
both. `main.dev.js` not staged is moot (it's a tracked pre-reorg-path file); `updater.js` not staged (new-layout path).
The separate **stale "New in v1.10.0" popup** in the same file stays open in `New Bugs.md` (needs real 1.11/1.12
changelog content — relabeling alone would misattribute v1.10.0's features).

---

## `…\7. PY\1. Scanner\1. Core\scanner.py` — stdin-loop busy-spin + watchdog never cancelled — 2026-06-21

Swept the Scapy gear-traffic scanner (the importer's packet sniffer; Python/Scapy/Npcap are importer system
prereqs). Imports all used, modern type hints (`dict[int, list]`), pylint/mypy suppressions appropriate for Scapy's
dynamic `scapy.all` namespace. No BOM, LF, syntactically valid (`py_compile` OK — pure-Python control loop, no Scapy
import needed to verify). Two control-loop fixes (both reasoned from the code; no live-traffic runtime test available):

- **EOF busy-loop (real bug).** The stdin loop was `while loop: line = sys.stdin.readline(); if "E" in line: …`. When
  the parent (Electron importer) closes stdin **without** sending `'E'`, `readline()` returns `''` on every call and
  `"E" in ""` is `False`, so the loop spins at ~100% CPU until the 1-hour watchdog kills it. Added an
  `if not line: break` EOF guard.
- **Watchdog Timer never cancelled.** `threading.Timer(3600.0, terminate)` is non-daemon, so after `DONE` the process
  lingered up to an hour unless the parent force-killed it. Added `t.cancel()` after the loop so it exits promptly.
- Refactored the tail from the `loop` flag to `while True:` + `break` on both exit paths (EOF and `'E'`) — equivalent
  on the normal path, just unambiguous. Sniff logic, dedup/reassembly, and the kept reference notes untouched.
- **Not staged** (new-layout reorg path). Behavior to confirm during a real import run.

---

## `1. App\1. Master\` — launcher scripts swept (1 EOL fix; 2 verified clean) — 2026-06-21

Reviewed the three launcher scripts (`install_frontend.ps1`, `start-dev.bat`, `build_backend.ps1`). All paths,
versions, and tool references validated against the actual tree; no logic bugs. Non-text siblings in `1. Master\`
(`backend.jar`, `backend.jar.jdk21.bak`, `start-dev.bat - Shortcut.lnk`) are binaries/artifacts, out of sweep scope.

- **`build_backend.ps1` — normalized CRLF → LF** (43 lines, content byte-identical sans CR). Its sibling
  `install_frontend.ps1` is LF and `.gitattributes` mandates `* text=auto eol=lf` for `.ps1` (only `.bat`/`.cmd` keep
  CRLF), so the working tree now matches what Git will store. Otherwise verified correct: `$backendRoot` resolves to
  `1. App\3. Backend`, JAVA_HOME → Temurin JDK 25, Maven 3.9.16 download/extract, and the hardcoded
  `backend-1.0.2-jar-with-dependencies.jar` exactly matches the pom (`artifactId=backend`, `version=1.0.2`,
  assembly `descriptorRef=jar-with-dependencies`). `-Dmaven.test.skip=true` is intentional (test suite re-enable is
  a tracked backlog item).
- **`install_frontend.ps1` — clean.** Paths correct (`$appDir`→`1. App`, `$sourceDir`→`1. App\2. Frontend\1. Source`),
  `npm install --ignore-scripts --legacy-peer-deps` for the renderer manifest, removes transient `package-lock.json` +
  stray electron peer-dep stub, regenerates the `installedTransitives` snapshot. Comments accurate. LF, no BOM.
- **`start-dev.bat` — clean.** `cd /d "%~dp0..\.."`→`1. App`, sets machine-specific PATH/JAVA_HOME (personal launcher;
  Java 25 path consistent with `build_backend.ps1`), `call yarn dev` with error pause. Correctly CRLF, no BOM.
- **Not staged** (new-layout reorg paths).

---

## `1. App\4. Both\2. Build\1. Scripts\` — two broken-under-modern-deps build scripts — 2026-06-21

Swept all 7 build scripts (`CheckNativeDep`, `CheckNodeEnv`, `CheckPortInUse`, `CheckYarn`, `CopyAssets`,
`DeleteSourceMaps`, `regen-installed-transitives`). Five were already clean; two had real runtime bugs introduced by
the dependency modernization, both **empirically confirmed** before and after the fix. ESLint exit 0 on all 7, no BOM.

- **`CheckNodeEnv.js` — chalk v5 ESM interop.** `const chalk = require('chalk')` then `chalk.whiteBright.bgRed.bold(...)`
  on the NODE_ENV-mismatch error path. chalk v5 is ESM-only; under Node 24's CJS `require(ESM)`,
  `require('chalk').whiteBright` is `undefined` (confirmed) → the guard would throw `Cannot read properties of undefined`
  instead of printing its message. Fixed: `require('chalk').default` (+ comment). Confirmed `chalk.default.whiteBright`
  is a function and the full `.whiteBright.bgRed.bold` chain resolves. Consumed by all 3 webpack configs
  (`webpack.config.renderer.prod.js`, `webpack.config.renderer.dev.js`, `webpack.config.main.prod.js`).
- **`DeleteSourceMaps.js` — rimraf glob never matched on Windows.** Used `rimraf.sync(path.join(__dirname, '.../*.js.map'))`.
  rimraf v4+ disabled glob expansion by default, AND `path.join` produces backslash paths that glob treats as escape
  characters — so even `{ glob: true }` matched **nothing** (confirmed: backslash+`glob:true` → FAIL; forward-slash or
  `windowsPathsNoEscape` → PASS). Prod `.js.map` files were never being deleted. **Rewrote with plain `node:fs`**
  (readdir + `rmSync`, matching sibling `CopyAssets.js`) — cross-platform, no glob footgun. Functional test against a
  fake source tree passed (deletes `renderer.prod.js.map` in `8. DIST` + `main.prod.js.map` in Source root, keeps `.js`).
  This **orphaned the `rimraf` devDep** (sole consumer): removed `"rimraf": "^6.1.3"` from `package.json` devDeps and
  regenerated `yarn.lock` — Yarn dropped `rimraf@6.1.3` + its transitive `package-json-from-dist` (nothing else needed
  it; the remaining `rimraf@^3.0.x` entries are unrelated transitives of other packages). Consumed by
  `webpack.config.main.prod.js` + `webpack.config.renderer.prod.js`.
- **Not staged** (new-layout reorg paths). Webpack-config behavior change to verify at end-of-sweep via `yarn build`.

---

## `1. App\.gitattributes` — safer EOL normalization + Windows batch CRLF — 2026-06-20

The global rule was `* text eol=lf`, which **forces** every file to be treated as text — a denylist that silently
corrupts (EOL-normalizes) any binary type not explicitly listed. The override list covered the common ones (png ×3446,
ico, icns, jar, traineddata, exe/jpg/jpeg) but missed stragglers — verified a committed `.lnk` (Windows shortcut) and
a `.bak` that would have been mangled. Also missing: a CRLF rule for the committed batch file.

- **`* text eol=lf` → `* text=auto eol=lf`** — `text=auto` auto-detects text vs binary by content, so unlisted
  binaries (`.lnk`, `.bak`, future types) are left untouched instead of corrupted. Verified via `git check-attr`: the
  `.lnk` now resolves to `text: auto` (Git detects it binary at add-time); `.png`/`.jar` still `binary: set`.
- **Added `*.bat`/`*.cmd` → `text eol=crlf`** — the committed `1. Master/1. BAT/start-dev.bat` (and the bundled
  Maven `.cmd` wrappers) need CRLF on Windows (LF can break label/`goto`). Verified `start-dev.bat` → `eol: crlf`.
- **Kept the explicit binary list** (exe/png/jpg/jpeg/ico/icns/jar/traineddata) as belt-and-suspenders + intent docs;
  verified `.png`/`.jar` resolve to `binary`. Text files (`.js`/`.ps1`) → `text: auto`, `eol: lf`.
- **Verified**: `git check-attr` on .bat/.js/.ps1/.png/.jar/.lnk all resolve as intended. No BOM. Not staged (reorg
  path). Note: there's a committed `start-dev.bat - Shortcut.lnk` (machine-specific Windows shortcut) — now EOL-safe,
  but it arguably shouldn't be in the repo; left for the user to decide.

---

## `1. App\.gitignore` — remove dead patterns + close `.yarn` ignore gap — 2026-06-20

Cleaned up the root `.gitignore` (partially modernized 2026-06-20 already — backend/webpack/eclipse sections were
accurate). All removed patterns verified to match **zero** existing files; all kept entries verified via
`git check-ignore -v`.

- **Closed a real gap**: added `.yarn/install-state.gz` (Yarn 4 regenerates this ~1.1 MB file every `yarn install`;
  it was previously **un-ignored** → showed as untracked). Confirmed now matched. Used the minimal form (corepack
  manages the Yarn binary; `node-modules` linker + global cache mean nothing else lands in `.yarn/`).
- **Removed redundant/stale**: `backend/.idea/workspace.xml`(+`~`) — stale **pre-reorg path**, and `git check-ignore`
  confirmed it's already covered by the bare `.idea` rule. Also dropped the orphan `# .idea` and dead `# backend/lib`
  comments.
- **Removed obsolete-tool ignores** (none of these tools are used; no matching files): `lib-cov` (jscoverage),
  `coverage` (istanbul — JS test stack removed 2026-06-16), `.grunt` (Grunt — project uses webpack), `.lock-wscript`
  (node-waf — pre-node-gyp). Plus ERB runtime cruft `pids`/`*.pid`/`*.seed`, npm-specific `npm-debug.log.*` (Yarn
  project; `*.log` covers `yarn-error.log`), and the dead `*.css.d.ts`/`*.sass.d.ts`/`*.scss.d.ts` (css-modules
  typings loader + SASS removed) — resolves the New-Bugs follow-up logged during the `.prettierignore` review.
- **Kept (verified load-bearing)**: backend `target/`+`2. Class/`, bundled Maven, logs, runtime disk-cache +
  `translation.missing.json`, `build/Release`, `.eslintcache`, Python tooling caches (importer/scanner is Python),
  `node_modules`, `.DS_Store`, `release`, the full webpack artifact + font/asset block, `.vscode`/`.idea`, and the
  Eclipse/m2e block. Improved the Python-cache + editor-metadata comments.
- **Verified**: `git check-ignore -v` confirms `.yarn/install-state.gz`, `node_modules`, `renderer.dev.js`, `target/`,
  `8. DIST/`, `.vscode` all ignored, while a real source file (`init.js`) is correctly **not** ignored. No BOM. Not
  staged (reorg path). Note: git only ignores _untracked_ files, so removing dead patterns can't surface anything
  (the files don't exist) — safe during the in-progress reorg.

---

## `1. App\.prettierignore` — drop dead/feature-removed patterns — 2026-06-20

Shared ignore file for Prettier + Stylelint (`--ignore-path`; ESLint uses its own `globalIgnores`). Removed entries
tied to tooling/features deleted during the modernization (all verified to match **zero** existing files), and pure
ERB-template runtime cruft; kept every load-bearing entry. Rewrote grouped/commented.

- **Removed (feature-removed, confirmed nonexistent)**: `*.css.d.ts` / `*.sass.d.ts` / `*.scss.d.ts` (the
  `typings-for-css-modules-loader` that generated them + SASS support were removed last session); `coverage` +
  `__snapshots__` (the JS test stack — jest/istanbul — was removed 2026-06-16); `.travis.yml` (no Travis; the repo
  publishes via GitHub).
- **Removed (ERB cruft / not applicable)**: `pids`, `*.pid`, `*.seed` (boilerplate; not Prettier-formattable
  extensions anyway), and `npm-debug.log.*` (this is a Yarn project; `*.log` already covers `yarn-error.log`).
- **Kept (load-bearing)**: `node_modules`, the webpack build-artifact block (`release`, `8. DIST`, `renderer.dev.js`,
  `main.prod.js`(+`.map`) — in sync with `.gitignore`; `renderer.prod.js` correctly absent as it builds into `8. DIST`),
  `logs`/`*.log`, `.eslintcache`, `build/Release`, `.DS_Store`, `.idea`, and `package.json` (intentionally not
  Prettier-formatted — npm/yarn + the IDE manage it).
- **Verified**: `prettier --check` still skips the huge generated `renderer.dev.js` bundle and `package.json` (a
  webpack bundle reporting "prettier-clean" is only possible if ignored) while still checking real source (webpack
  configs). No BOM. Not staged (reorg path).
- **Follow-up noted**: `.gitignore` still carries the same now-dead `*.css.d.ts`/`*.sass.d.ts`/`*.scss.d.ts` +
  `coverage`/`lib-cov`/`.grunt` patterns — fold into a `.gitignore` pass.

---

## `1. App\.yarnrc.yml` — restore two supply-chain defaults Yarn was overriding — 2026-06-20

Reviewed all four settings against their real Yarn 4.17 defaults (via `yarn config --json` source/default fields).
Two were load-bearing overrides; two were unnecessary security relaxations (likely added so the modernization could
install bleeding-edge versions). Per user choice, removed the two relaxations.

- **Kept (necessary overrides of modern Yarn defaults)**: `enableScripts: true` (default is now **`false`** — but
  native deps `electron`/`electron-rebuild` need install/build scripts) and `nodeLinker: node-modules` (default `pnp`
  — electron-builder + native modules require a real `node_modules` tree). Added a header comment documenting why each
  overrides its default.
- **Removed `npmMinimalAgeGate: 0`** → reverts to the default **`1d`** cooldown (Yarn refuses package versions
  published <1 day ago — a supply-chain mitigation; `0` disabled it). Verified effective value back to `1440` (min).
- **Removed `approvedGitRepositories: ["**"]`** → reverts to default `[]`. It pre-approved fetching _any_ git repo,
  but the project has **zero git-sourced deps** (verified in lock) — an unused, maximally-permissive override.
- **Verified**: `yarn install --mode=skip-build` still exits 0 with the 1-day gate restored (locked versions aren't
  <1d old, so nothing re-resolves or breaks). No BOM. Not staged (reorg path).

---

## `1. App\yarn.lock` — regenerate stale lockfile + remove leftover dead devDep — 2026-06-20

The root lockfile was **wholesale stale** — it still listed every dependency removed during the modernization
(babel-loader, sass/sass-loader, body-parser as a _direct_ dep, file-loader, url-loader,
`@teamsupercell/typings-for-css-modules-loader`, `@babel/preset-typescript`, `babel-plugin-dev-expression`, the 12
dropped `@babel/plugin-*`), and carried Babel-7-era resolutions (`@babel/code-frame@7.16.7`) despite `package.json`
pinning `@babel/core ^8.0.1`. The installed tree was already modern (`node_modules`: `@babel/core` 8.0.1, `typescript`
6.0.3; fresh `.yarn/install-state.gz`) — only the on-disk `yarn.lock` had never been re-synced. Regenerated with
`yarn install --mode=skip-build` (Yarn 4.17.0, `node-modules` linker). Doubles as the standing "re-run root install"
verification — **the modernized `package.json` installs cleanly (exit 0)**.

- **Regenerated `yarn.lock`**: 11360 → 10741 lines; resolution step dropped 55 packages (the removed @babel plugins +
  transitives). Confirmed gone: babel-loader, sass-loader, file-loader, url-loader, typings-for-css-modules-loader,
  `@babel/preset-typescript`, `babel-plugin-dev-expression`, all `@babel/plugin-proposal-*`. Surviving `body-parser`
  (`~1.20.5`) and `@babel/plugin-transform-class-properties` (`^8.0.1`, pulled by `@babel/preset-env`) verified as
  legit **transitives**, not direct.
- **Removed a real leftover**: `opencollective-postinstall` was still a **direct devDependency** in `package.json` —
  last session's package.json cleanup removed it from the `postinstall` script + the `collective` field but missed the
  devDep entry, so it kept reappearing in the lock (referenced only by the root workspace, not transitive). Deleted it
  (devDeps 36 → 35) and re-ran install → `opencollective-postinstall` now absent from the lock.
- **Peer warning is benign**: the persistent `YN0086` is all optional peers (`debug`'s `supports-color`,
  `@types/*`) — `yarn explain peer-requirements` shows every entry `✓`. No action.
- Not staged (root `1. App/` paths are part of the in-progress numbered-folder reorg; per git-migration policy, the
  reorg isn't staged piecemeal). Generated artifact — not hand-edited / no BOM concern.

---

## `1. App\tsconfig.eslint.json` — delete orphaned ERB leftover — 2026-06-20

Deleted `1. App/tsconfig.eslint.json`. It was a stale, byte-for-byte copy of the **pre-modernization** `tsconfig.json`
(old `ES2018`/`jsx: react`/`moduleResolution: node`/`ignoreDeprecations` set) left over from the electron-react-boilerplate
ESLint setup, where the old `.eslintrc` pointed `parserOptions.project` at it for type-aware linting. The flat-config
migration (`eslint.config.mjs`, non-type-checked `tseslint.configs.recommended`, no `project`) stranded it. Confirmed
**zero** functional references repo-wide (eslint config, `package.json`, `.vscode/settings`, `.husky`, legacy
`.eslintrc`/`.eslintignore`) — the only mention is a passive line in `.vscode/Apptree.md` (a file-tree doc). Not staged
(untracked path under the in-progress numbered-folder reorg; per git-migration policy, reorg isn't staged piecemeal).

---

## `1. App\tsconfig.json` — modernize (drop deprecated/dead opts) + exclude generated bundle — 2026-06-20

`tsc` never emits here (`noEmit`, no build step uses it — the `tsc` script was removed earlier); the config exists
only for editor IntelliSense over the `allowJs` codebase + the two real `.d.ts` files. Reviewed it against an empirical
`tsc --showConfig` / `tsc --noEmit` run (baseline: **0 errors**). Fixes:

- **`moduleResolution: "node"` (→`node10`) is deprecated in TS 6.0** (TS5107, breaks in TS 7.0) — that deprecation was
  the _only_ thing `ignoreDeprecations: "6.0"` was silencing (verified by probe). Modernized instead of suppressing:
  `module: "commonjs"` → **`"preserve"`** + `moduleResolution: "node10"` → **`"bundler"`** (the correct preset for a
  webpack-bundled Electron app), and **removed `ignoreDeprecations`**. Safe: the two `.d.ts` are pure ambient module
  declarations (no real imports to resolve) and `checkJs` is off.
- **Removed `jsx: "react"`** — dead: no React (removed 2026-06-16) and zero `.tsx/.jsx` files exist anywhere.
- **Removed emit-only no-ops** (`declaration`, `declarationMap`, `sourceMap`) — meaningless under `noEmit: true`.
- **`target` `ES2018` → `ES2022`** — matches the Electron 42 / Node 20+ runtime and the modern syntax the source uses.
- **Expanded `exclude`**: the project was pulling in the **huge generated `renderer.dev.js` bundle** and
  `_pre-modernize-backup/` (verified via `--showConfig`: 93 → 91 included files). Added `**/renderer.dev.js`,
  `**/renderer.prod.js`, `**/main.prod.js`, `_pre-modernize-backup`, `2. Personal`, and `**/node_modules` (defensive).
  Dropped the stale `"test"` entry (no such dir — tests are Java now).
- **De-staled the `skipLibCheck` comment** — removed the obsolete "mixed Babel 7/8 / VisitorBase" rationale (Babel is
  now clean 8.x); kept the general cross-package `@types`-drift justification.
- **Verified**: `tsc --noEmit` still **0 errors**, no deprecation warning, both `.d.ts` still type-checked, generated
  bundle/backup no longer included. No BOM.

---

## `1. App\eslint.config.mjs` — drop dead @typescript-eslint plugin registration from JS block — 2026-06-20

The JS-files config block registered `plugins: { '@typescript-eslint': tseslint.plugin }` with a comment claiming
it was needed so "the many inline `@typescript-eslint/...` disable directives left in the JS source" would resolve.
Verified that claim is **stale**: a repo-wide search (all `*.js/.mjs/.cjs`, excluding node_modules + the generated
`renderer.dev.js`/`*.prod.js` bundles + backups) found **zero** `@typescript-eslint/` inline directives in real
source — the only hits live in the generated, _ignored_ `renderer.dev.js` (third-party code webpack bundled in).

- **`eslint.config.mjs`** — removed the `@typescript-eslint` plugin registration (+ its 3-line comment) from the
  `**/*.{js,jsx,mjs,cjs}` block. The `tseslint` import stays (still used by the `.ts/.tsx` block via
  `tseslint.configs.recommended`, which lints the two real `.d.ts` files — `declarations.d.ts`/`globals.d.ts` —
  matched by the `*.ts` glob). Fixed the stale "~19 files" → "~15 files" in the no-redeclare/`globals.jquery` note.
- **Verified safe**: a real lint of a JS source file (`5. Dev Only/main.dev.js`) and of the edited config itself
  both exit 0 with no "Definition for rule not found". `eslint-config-prettier` sets the TS formatting rules to
  `off`, which does not require the plugin to be registered. `--print-config` loads cleanly for both a `.js` and a
  `.d.ts` file (TS block still active). No BOM.

---

## `1. App\babel.config.cjs` — slim to preset-env + drop 12 dead @babel deps — 2026-06-20

Since `babel-loader` was removed from webpack (renderer `.js` is webpack-5-native — verified no decorators), the only
remaining consumer of `babel.config.cjs` is `node -r @babel/register`, transpiling two plain-ESM build scripts
(`CheckPortInUse.js` / `CheckNativeDep.js`) to CommonJS. Confirmed no other babel consumer exists.

- **`babel.config.cjs`** — slimmed from ~59 lines (preset-env + preset-typescript + 10 stage/decorator/class-field
  plugins + `assumptions` + dev/prod `api.env` split + `babel-plugin-dev-expression`) to a 7-line config:
  `presets: [require('@babel/preset-env')]` (preset-env's `auto` module transform → CJS is all the scripts need).
- **`package.json`** — removed the 12 now-dead devDeps: `@babel/preset-typescript`, the 10 `@babel/plugin-*`
  (proposal-{decorators,do-expressions,export-default-from,function-bind,function-sent,throw-expressions} +
  transform-{class-properties,json-strings,private-methods,private-property-in-object}), and `babel-plugin-dev-expression`.
  **Kept** `@babel/core`, `@babel/preset-env`, `@babel/register`. devDeps 48→36; JSON re-validated.
- Also fixed 4 **merged multi-key lines** in `package.json` devDeps — formatting artifacts from the prior turn's
  newline-anchored dep removals (`.prettierignore` excludes package.json, so they weren't auto-fixed). One key per line now.

Resolved 2 `New Bugs` items (the orphaned-devDeps + babel over-spec notes). ⚠️ **Re-test:** re-run root install
(`yarn install --mode=skip-build`) + `yarn dev` (runs CheckPortInUse via @babel/register) + `yarn postinstall`
(CheckNativeDep) to confirm the slimmed babel config still transpiles the scripts.

---

## `1. App\package.json` — dead-dep + ERB cruft cleanup — 2026-06-20

Reviewed the root (ERB-derived) build manifest. Removed verified-dead entries (each confirmed unreferenced by code
AND every config — webpack / `babel.config.cjs` / `eslint.config.mjs`):

- **dependencies:** `body-parser` (no Express anywhere).
- **devDependencies (6):** `babel-loader` (webpack rule removed in the 4.Both sweep), `sass` + `sass-loader` +
  `@teamsupercell/typings-for-css-modules-loader` (SASS rules removed; 0 `.scss` files), `file-loader` + `url-loader`
  (replaced by webpack-5 asset modules; only appeared in comments). devDeps 54→48, deps 10→9.
- **scripts:** dropped `tsc` + `test-all` (0 `.ts` files; `tsconfig.json` has no `checkJs` so `tsc` no-ops — tsconfig
  kept for editor JS intellisense via `allowJs`) and `&& opencollective-postinstall` from `postinstall`.
- **config:** removed the ERB `collective` (opencollective donation) field.

**Kept (verified LIVE):** the full `@babel/*` toolchain — `babel.config.cjs` (carefully Babel-8-migrated) is loaded by
`node -r @babel/register` for the `dev`/`postinstall` build scripts (`start-dev.bat` → `yarn dev`); `typescript` +
`typescript-eslint` (used by `eslint.config.mjs` for `@typescript-eslint/...` disable directives in JS);
`core-js`/`regenerator-runtime` (webpack entry polyfills); all webpack/electron tooling. JSON re-validated (parses
cleanly, no dangling commas).

⚠️ **Lockfile now out of sync** — re-run the root install (`yarn install --mode=skip-build`) to refresh `yarn.lock`,
then `yarn dev` / `yarn build` to confirm. Two larger findings logged in `New Bugs` (stale `build.files` packaging
config; over-spec'd `babel.config.cjs`).

---

## `1. App\5. Dev Only\main.dev.js` — dead-code sweep (Electron main entry) — 2026-06-20

Reviewed the Electron main-process dev entry (294 lines, no BOM; the root `package.json` `main` points here). Removed
dead code (all verified against renderer IPC usage):

- **Empty `installExtensions` no-op** + its `await` call + the now-empty dev `if`-block — a vestigial ERB hook
  (it installed React/Redux DevTools; emptied after the React removal, so it did nothing).
- **`ipcMain.on('app_version', …)`** — dead: the renderer reads the version via `@electron/remote`
  `remote.app.getVersion()` (updater.js:12), never the IPC channel (0 renderer refs). Version display unaffected.
- **`ipcMain.on('test', …)`** — dead: a debug duplicate of the `'check'` updater handler; the renderer never sends
  `'test'` (only had an empty `ipcRenderer.on('test', () => {})` listener). Removed both halves — the main handler
  AND the renderer's empty listener (`updater.js:72`).

Kept the guarded `E2E_BUILD`/`ERB_SECURE` conditionals (security-adjacent webPreferences + app-ready logic; harmless
no-ops, not worth the risk). Both touched files pass `node --check` **and ESLint (clean)**.

Noted for the frontend sweep (not changed): `updater.js:71` `ipcRenderer.on('update-not-available', () => {})` is also
dead — empty handler AND name-mismatched (main sends `update_not_available` with an underscore). No effect either way.

---

## `1. App\4. Both\2. Build\` — dead ERB asset removal — 2026-06-20

Swept the build-helper folder. All **7 scripts are live** (kept): `CheckNodeEnv`/`DeleteSourceMaps` (webpack configs),
`CopyAssets`/`CheckPortInUse` (`dev` script), `CheckNativeDep` (`postinstall`), `CheckYarn` (`preinstall`),
`regen-installed-transitives` (`install_frontend.ps1`). Deletions (verified unreferenced):

- **DELETED `3. IMG/`** — 32 electron-react-boilerplate README branding PNGs (react/redux/jest/react-router/webpack/
  yarn/eslint/erb-banner/erb-logo…), referenced by no README/HTML/JS. Template cruft for the removed React/test stack.
- **DELETED `2. Mocks/fileMock.js`** (+ the now-empty `2. Mocks/`) — a Jest file mock; there is **no project Jest
  config** (only a stale `_pre-modernize-backup/package.json` references it).

No build impact (these aren't on the webpack/script path; scripts untouched). Also corrected the prior webpack
`New Bugs` note: only **`babel-loader`** is orphaned — `@babel/register`/`@babel/core` (+ a preset) are still used at
runtime by `node -r @babel/register` for `CheckPortInUse.js`/`CheckNativeDep.js`.

---

## `1. App\4. Both\1. Webpack\` — ERB webpack-config cleanup — 2026-06-20

Removed electron-react-boilerplate template cruft from the 4 webpack configs. Verified dead first: **0 `.ts`/`.tsx`
and 0 `.scss`/`.sass`** source files, the renderer imports only `app.global.css`, and `babel-loader` was referenced
only by the (match-nothing) TypeScript rule — so `.js` isn't babel-transpiled at all (Electron's Chromium runs it
natively). Changes:

- **`webpack.config.base.js`** — removed the `.tsx?` `babel-loader` module rule (the only rule; nothing else used
  babel-loader) and trimmed `resolve.extensions` `['.js','.jsx','.json','.ts','.tsx']` → `['.js','.json']`.
- **`webpack.config.renderer.dev.js`** + **`webpack.config.renderer.prod.js`** — removed both SASS/SCSS rules and the
  non-global CSS-modules rule. CSS handling is now just the `.global.css` rule (what `app.global.css` uses); the
  font/SVG/image asset rules + env/plugins are untouched.

All 4 configs pass `node --check`. These are match-nothing removals (functionally a no-op), but it's build tooling —
**re-test `yarn dev` + `yarn build`** to confirm. Orphaned root devDeps surfaced (`sass-loader`,
`@teamsupercell/typings-for-css-modules-loader`, `babel-loader`, and likely the `@babel/*` toolchain) → logged as a
`New Bugs` package.json follow-up. (`core-js`/`regenerator-runtime` stay — runtime entry polyfills, independent of
babel.)

---

## `3. Backend\1. Source\3. XML\` — Eclipse cruft removal + pom once-over — 2026-06-20

The Maven project dir was polluted with stale, untracked **Eclipse** files (user is on VS Code). Cleanup + a pom
review:

- **DELETED Eclipse cruft** (kept `pom.xml`): the `bin/` output dir (held a **stale `pom.xml` copy** still carrying
  the removed bytedeco deps, plus `.project`/`.settings`/`.prefs`) and the loose root `org.eclipse.jdt.core.prefs` /
  `org.eclipse.jdt.apt.core.prefs`. The `core.prefs` pinned **JDK 1.8** compliance (project is JDK 25) and sat outside
  the canonical `.settings/` path, so the VS Code Java LS never read it — pure orphaned Java-8-era cruft.
- **`.gitignore`** — added Eclipse patterns: `.project`, `.classpath`, `.settings/`, `3. Backend/1. Source/3. XML/bin/`,
  `3. Backend/1. Source/3. XML/*.prefs`.
- **pom.xml once-over** — removed the **dead `jackson-jr-all` dependency** (2.22.0; **zero `com.fasterxml` references**
  anywhere — the backend uses Gson; it was just bloating the shaded jar) and the **stale `9. Hero Library/**`
  compiler exclude\*\* (that folder was deleted with the OCR subsystem). All other deps verified used (gson, guava,
  commons-lang3/io/collections4, aparapi/aparapi-jni, lombok, junit-jupiter-api).

**Build: BUILD SUCCESS** (73 files); jar-with-dependencies **31.5 MB → 30.8 MB** (Jackson gone); deployed to
`1. Master/3. Jar/backend.jar`.

---

## `3. Backend\1. Source\2. Class\` — build-output cleanup — 2026-06-20

`2. Class` was a **65MB untracked** mirror of Maven's `target/` (compiled `.class` files, jar copies, Maven
metadata) reorganized into numbered subfolders. Verified it's **not loaded by the app** (it runs
`1. Master/3. Jar/backend.jar` — `files.js`/`subprocess.js`), the only reference anywhere was `build_backend.ps1`'s
optional `Test-Path`-guarded jar-archive copy, and `2. Classes`/`3. Test Classes`/`4. Maven Archiver`/`5. Maven Status`
were **stale** (a one-time Jun-2 copy still holding deleted OCR + test classes). Actions (user-approved full cleanup):

- **DELETED the entire `2. Class` folder** (regenerable build output).
- **Trimmed `build_backend.ps1`** — removed the now-dead "Keep 2. Class/1. JARs in sync" block + its now-unused
  `$builtJarThin` / `$archiveDir` vars. The script still builds via Maven `target/` and deploys to
  `1. Master/3. Jar/backend.jar` (unchanged).
- **`.gitignore`** — replaced the stale pre-reorg `backend/target/classes/*` line with correct backend build-output
  ignores: `3. Backend/1. Source/target/` and `3. Backend/1. Source/2. Class/`.

**Verified:** `build_backend.ps1` re-run → BUILD SUCCESS, `backend.jar` (31.5MB) deployed to `1. Master/3. Jar`, no
`2. Class` archive step, folder not recreated.

---

## `3. Backend\...\11. Resources\` + pom build-cruft — 2026-06-20

Swept the backend resources folder (one file) and a related pom cleanup it surfaced:

- **DELETED `11. Resources/MANIFEST.MF`** (+ the now-empty `11. Resources` folder) — a 53-byte leftover
  (`Manifest-Version` + `Main-Class: com.fribbels.Main`) from a manual-jar era. **Unreferenced**: not a Maven resource
  dir (no `<resources>` block; default `src/main/resources` doesn't exist), and the `maven-assembly-plugin` generates
  the jar manifest itself with the same `mainClass`. Verified no script/pom/build reference.
- **Removed 3 dead bytedeco test deps from `pom.xml`** (`javacpp`/`leptonica`/`tesseract`, test scope) — they existed
  only for the OCR test deleted in the 10.Tests sweep; no code references bytedeco. Cleaner pom + no large native-lib
  downloads. `junit-jupiter-api` kept (used by `BuildScoreRankingTest`).

**Build: BUILD SUCCESS** (73 files; pom resolves cleanly without bytedeco); `backend.jar` rebuilt + deployed.

Noted (not acted — build artifacts/IDE cruft, regenerated by `clean`): stale `3. XML/bin/pom.xml` (Eclipse output
copy) and `2. Class/3. Test Classes/OptimizationRequestHandlerTest.class` (orphaned compiled class of the deleted
test). Updated the `New Bugs` test-reenablement item: bytedeco gone, junit-api + surefire already present — remaining
is just adding the JUnit 5 engine + dropping the `-Dmaven.test.skip` flag in `build_backend.ps1`.

---

## `3. Backend\...\10. Tests\` — folder sweep (3 files) + **BACKEND SWEEP COMPLETE** — 2026-06-20

Final backend folder. Kept **`BuildScoreRankingTest`** — a real, current, assertion-bearing test of the `buildScore`
ranking rework (`Sorter`/`TopNResults`/`StatCalculator`); verified it references only current APIs (incl. the 3-arg
`Sorter.sortHeroes` overload, which exists). Changes:

- **DELETED `DebugTest.java`** — empty `@Test public void test(){}` stub.
- **DELETED `OptimizationRequestHandlerTest.java`** (234 lines) — all 6 "tests" dead: 2 OCR tests (tesseract/leptonica
  via **bytedeco**, with hardcoded paths to the original dev's machine `C:\Users\ivanc\…`, tied to the removed OCR
  feature) + 4 **assertion-less** scratch tests that only `log`/`println`. It was the **sole bytedeco importer** that
  made the whole test module fail to compile.
- **SALVAGED** its `REQUEST_STRING` fixture → **`sampleOptimizationRequest.json`** (pure, validated JSON — 32 items,
  setFormat 1) to seed a future real handler test (origin: extracted from the deleted test, 2026-06-20).

With bytedeco gone, the test module's only remaining test compiles against current APIs — **re-enabling the suite**
(add JUnit 5 + surefire, drop `maven.test.skip`) is now viable; logged in `New Bugs` as a follow-up.

**Final build: BUILD SUCCESS** (73 source files, JDK 25); `backend.jar` rebuilt + deployed.

### 🏁 Backend sweep complete — all folders done

`0. Main` · `1. Core` · `2. Model` · `3. DB` · `4. Handler` · `5. Request` · `6. Response` · `7. Enums` · `8. GPU` ·
`10. Tests` all reviewed (`9. Hero Library` deleted with the OCR subsystem). Source count **80 → 73** (.java):
deleted `FileIO`, `MiniOptimizationResponse`, `AllDataResponse`, `HeroStatsResponse`, `Ocr2Request`, `OcrResponse`,
`OcrEngine`, `DebugTest`, `OptimizationRequestHandler`Test (−9), with the engine's `OptimizationRequestHandler`
(−~150 lines, logging modernized) and `GpuOptimizerKernel` (2232 → 1112) the biggest cleanups. All changes
behavior-preserving; jar deployed. **Relaunch the app to load the final backend.jar** — and a GPU optimization run
would confirm the Aparapi kernels still translate (only dead/host code changed there).

---

## `3. Backend\...\8. GPU\GpuOptimizerKernel.java` — Aparapi kernel sweep (2 of 2) — 2026-06-20

Swept the main GPU kernel (**2232 → 1112 lines**). `run()` + `getSkillValue()` logic left untouched (Aparapi→OpenCL —
manual indexing/duplicated arithmetic/phased early-exit are mandatory). Removed only dead/host-side content
(dry-run-verified: no live code or kept-docs touched):

- **930-line trailing dead block** after the class brace — a `/* Compiled opencl OUTDATED */` C dump (~514 lines) +
  a fully commented-out `setFilters()` method (~410 lines, incl. old DEBUG prints).
- **Dead commented field-decl blocks** in the fields section: old per-skill scalar fields (`// @Constant final float
s1Rate…`), the `sumValues`/`optimizer*Filters`/`intArr` filter-experiment fields, and `// @Local …localSetsBuffer/
localStatBuffer`.
- **Constructor "Attempt at optimizing filters" scaffolding** (~76 lines of commented min/max-filter array code).
- **run() "localSetsBuffer" abandoned approach** (~38 lines, an old local-buffer set-counter superseded by the
  bitmask path) + scattered dead debug comments (`// final int localId`, `// debug[id]=…`, `// s1SelfSpdScaling=hero`,
  getSkillValue's `// effectiveDefense/realDefense` notes + `// System.out.println` debug).
- **3 live host-side `System.out.println`** (`NEW KERNEL` / `update()` / `putInitialArrays`) — removed (not converted),
  to avoid adding a `Logger` field to an Aparapi-analyzed kernel class; they were low-value lifecycle diagnostics.

**Resolved the deferred `setSolutionCounters` finding** — the field was read by `GpuOptimizerKernel` (`this.x =
request.x`) but **never written** (its only writer was the long-commented `addCalculatedFields` scaffolding) and never
used in `run()`. Removed the kernel field + assignment AND the `OptimizationRequest.setSolutionCounters` field (dead
on both sides; Gson ignores it if the frontend ever sent it — it didn't, it was server-computed).

Kept (documentation): the bit-index legend (`// 21 rage …`), the bit-marker comments
(`// final int injurySet/protectionSet/riposteSet/pursuitSet/fervorSet`), and the `// === Phase N ===` headers.

**Build: BUILD SUCCESS** (73 files, brace-balanced) — `javac` only; Aparapi translates at **runtime** on GPU use, and
no kernel logic/captured field changed, so translation is unaffected (a GPU optimization run on relaunch confirms
end-to-end). **`8. GPU` folder complete** (both kernels).

---

## `3. Backend\...\8. GPU\SetFormat000OptimizerKernel.java` — Aparapi kernel sweep (1 of 2) — 2026-06-20

Reviewed the setFormat-0 GPU kernel (Aparapi → OpenCL). The `run()` + `getSkillValue()` bodies are intentionally
low-level (manual flat-array indexing, duplicated arithmetic, phased early-exit `passes[id]=false; return`, no
objects/streams/exceptions) — **mandatory** for Aparapi GPU translation, left untouched. Changes (host-side / dead
only):

- Removed the **constructor `System.out.println`** kernel-creation diagnostic — fully redundant with the handler's
  `[optimizeInternal] maxPerms` log. Removed rather than converted to `logger` to avoid adding a field to an
  Aparapi-analyzed kernel class (zero-risk vs. small needless risk).
- Removed an **obsolete commented-out `setIndex`** block (the old POW_18 / 18-set formula — sibling of the POW_18
  constants already removed from `OptimizationRequestHandler`).

Kept (documentation, not cruft): the 4 commented bit-extraction markers (`protectionSet`/`injurySet`/`pursuitSet`/
`fervorSet`) — they document the **non-contiguous** `setSolutionBitMasks` bit layout (why extraction skips bits
25/26/33/34) in otherwise-cryptic shift code. No BOM.

**Build: BUILD SUCCESS** (73 files) — note this is `javac` only; Aparapi translates at **runtime** on GPU use, but
since no `run()`/`getSkillValue()` logic or kernel-captured field was touched, translation is unaffected. A GPU
optimization run on relaunch would confirm end-to-end. `GpuOptimizerKernel.java` (2232 lines) still to sweep.

---

## `3. Backend\...\7. Enums\` — folder sweep (8 files) — 2026-06-20

Swept the enum package. Clean Gson `@SerializedName` enums, no commented code/`System.out`/BOM. Change:

- **Removed no-op Lombok annotations** from the three **field-less** enums `SortOrder`, `HeroFilter`,
  `OptimizationColumn` — they carried `@Getter @AllArgsConstructor` (+ the two lombok imports) but have no fields, so
  Lombok generated nothing useful (the constructor equals the implicit enum default). Vestigial copy-paste from the
  field-bearing enums. Behavior-identical.

Kept as-is: `Set` (real fields incl. the new `SET_COUNT`) and `StatType` (`index` field — `getIndex()` is live at
`StatCalculator.java:448`) keep their Lombok annotations; `Material`/`Rank` were already annotation-free; `Gear` keeps
its explicit title-case `toString()` (verbose if-chain but correct and used in equipment maps/logging — not worth the
behavioral risk to refactor).

**Build checkpoint: BUILD SUCCESS** (73 files); `backend.jar` rebuilt + deployed.

---

## `3. Backend\...\6. Response\` — folder sweep (9 files) — 2026-06-20

Swept the response-DTO package. All are clean Lombok value classes `extends Response` (no commented code, no
`System.out`, no BOM); `Response.java` is the empty marker base (used by `RequestHandler.toJson(Response)`). Change:

- **DELETED `HeroStatsResponse.java`** — dead: **0 references** (verified incl. `com/` view via `-L`); no endpoint
  ever builds/returns it. The other 7 (`GetAllHeroes/GetAllItems/GetHeroById/GetItemById/GetResultRows/GetInProgress/
Optimization`) are all live handler responses. (`OcrResponse` was already removed with the OCR subsystem.)

**Build checkpoint: BUILD SUCCESS** (73 files); `backend.jar` rebuilt + deployed.

---

## `3. Backend\...\5. Request\` — folder sweep (24 files) + dead OCR subsystem removal — 2026-06-20

Swept the request-DTO package. The DTOs are clean Lombok value classes (all `extends Request`; only legit explanatory
comments, no commented-out code, no `System.out`, no BOM). Deletions:

- **DELETED `AllDataResponse.java`** — dead + misplaced: a `Response`-shaped class (`heroes`+`items`) that `extends
Request`, lives in the `request` package, and has **0 references** anywhere (verified incl. the `com/` view via
  `-L`, and no frontend endpoint). Vestige.
- **DELETED the entire dead OCR subsystem** (user-approved) — `Ocr2Request` (5.Request), `OcrResponse` (6.Response),
  and `OcrEngine` (9.Hero Library). `OcrEngine.detect()` was a stub returning `""`; nothing instantiated it, no `/ocr`
  HTTP context is registered in `Main`, and the frontend never calls it (the "Fribbels Hero Library" tab is a separate
  community-API feature). Also removed the now-empty **`9. Hero Library` folder** and its **`com/fribbels/ocr`
  symlink** (8 package symlinks remain; the `com.fribbels.ocr` package is gone). No junction-setup script exists, so
  nothing recreates it. (Git still indexes the old `src/main/java/.../OcrEngine.java` path, already deleted from disk
  — part of the standing unstaged reorg; left as-is.)

Two backend-orphaned `OptimizationRequest` fields logged in `New Bugs` rather than removed: **`inputSets`**
(`List<List<Set>>`, frontend-written but backend reads `inputSetsOne/Two/Three`) — a wire-contract field, left in
place; and **`setSolutionCounters`** — read by `GpuOptimizerKernel` but never written (its only writer was the
commented-out `addCalculatedFields` scaffolding removed in the 4.Handler sweep), so the kernel always gets `null` —
deferred to the `8. GPU` review (remove the request field + kernel field together).

**Build checkpoint: BUILD SUCCESS** (74 files = was 78 − 4 deleted classes); `backend.jar` rebuilt + deployed.
`6. Response` now has one fewer file (OcrResponse gone) and **`9. Hero Library` is fully removed** ahead of its sweep.

---

## `3. Backend\...\4. Handler\` — folder sweep (5 files) + 2 deferred refactors — 2026-06-20

Swept the HTTP handler layer. `SystemRequestHandler` + `HeroesRequestHandler` clean (already use `logger`, no
dead/commented code, no BOM). Reference searches done reliably against the numbered folders (see source-tree note in
the `3. DB` entry). Changes:

- **`RequestHandler.java`** — deleted the dead legacy file-IPC chain: `handleRequest`, `handleSpecificRequest` (its
  body just `throw new UnsupportedOperationException`), `readFile`, `writeFile` (0 callers — predates the HTTP
  server), plus the now-unused `java.io.File` / `java.nio.file.Files` imports. Kept the live `sendResponse` /
  `parseRequest` / `toJson`.
- **`ItemsRequestHandler.java`** — deleted dead `setItemsWithHeroes` (0 callers; no switch case routed to it).
- **`OptimizationRequestHandler.java`** (the 2217-line engine) — two-part cleanup:
  1. **Dead commented code (−126 lines):** the 53-line commented `DEBUG WEAPONS…` block _after_ the class, the
     commented `POW_18_*` constants, the `setSolutionCounters` scaffolding throughout `addCalculatedFields`, ~49
     commented `// System.out.println`, and scattered stale comments.
  2. **Logging modernization (per user call "convert to logger + remove noise"):** added a `java.util.logging.Logger`
     (matching the sibling handlers) and converted all ~41 live `System.out.println` + ~8 `System.err`/`printStackTrace`:
     per-run diagnostics → `logger.info` (`[optimizeInternal]` START/filters/perms/COMPLETE, timing, preFilter, CPU
     loop order, GPU enable, bitmask gen); verbose/per-poll → `logger.fine` (`[getResultRows]` dumps, alloc-memory,
     GPU device probing); errors → `logger.warning`/`severe`; exceptions → `logger.log(Level.…, msg, e)`. Removed pure
     noise: the 11× `"Sent response"`, `"Sent error"`, raw request-object dumps, `"EXIT"`, `"DONE"`, redundant
     `"Started optimization request"`, and the **vestigial stdout markers** `OUTPUTSTART` / `OPTIMIZATION_REQUEST_END`
     / `PROGRESS:` (confirmed **not** parsed by the frontend — `subprocess.js` only greps `BACKEND_PORT:`; the
     scanner's `DONE` is a separate Python process). `handle()` banner + `Path:` now `logger.info`, default →
     `logger.warning`, catch → `logger.log(SEVERE…)`, matching the sibling handlers. `System.gc()` left intact
     (deliberate pre-run hint).

**Two deferred `New Bugs` items resolved (spanned core/enums):**

- **`SET_COUNT` relocated** to the `Set` enum (`public static final int SET_COUNT = values().length;` = 24);
  `OptimizationRequestHandler` and `StatCalculator` now `import static com.fribbels.enums.Set.SET_COUNT` — removes the
  backwards core→handler dependency.
- **`getNewStatAccumulatorArr` eliminated** — it ignored its `accumulatorsByItemId` param and was just
  `buildStatAccumulatorArr` + a `tempStatAccArr` side-set, then `fillAccs` redundantly re-assigned the same value.
  Deleted the wrapper; `fillAccs` now calls `buildStatAccumulatorArr` directly and dropped its unused map param (7
  call sites updated). Only `fillAccs` ever used it.

Two backend-orphaned DTO fields surfaced by the dead-method removal (`Request.requestType`, `Item.heroName`) are
logged in `New Bugs` — both are frontend-written/round-tripped, so removing them is a wire-contract change, left for
a DTO pass.

**Behavior:** diagnostics now flow through `java.util.logging` (default: INFO+ → stderr, FINE suppressed) instead of
stdout — backend console output looks different but the frontend is unaffected. **Build checkpoint: BUILD SUCCESS**
(78 files, JDK 25); `backend.jar` rebuilt + deployed — relaunch to load it. Validates `3. DB` + `4. Handler` +
`StatCalculator`/`Set` together.

---

## `3. Backend\...\3. DB\` — folder sweep (6 files) — 2026-06-20

Swept the in-memory data layer. `ArtifactStatsDb` clean; `BaseStatsDb` already clean (1-line touch earlier from the
`SpecialStats` work). No BOM on any file; all references re-checked reliably (see the source-tree note below). Changes:

- **`HeroDb.java`** — debug-logging cleanup in `addBuildToHero`: removed the unconditional `logger.info("Done adding")`
  (fired every call, pure noise), and changed `logger.info("Found new build. Adding to hero: " + hero)` →
  `"Added new build to hero: " + hero.getName()`. The old form logged the _entire_ `Hero` via `toString()` **after**
  appending the new build, so it serialized an ever-growing object (all builds/equipment/optimizationRequest) on every
  save — heavy and useless. Now logs just the name.
- **`ItemDb.java`** — deleted the two empty no-op stubs `editItem(Item)` and `lockItem(Item)` (dead: **0 Java callers**;
  the frontend's `editItems`/`lockItems` are the _plural_ handler endpoints in `ItemsRequestHandler`, unrelated).
- **`OptimizationDb.java`** — removed 3 commented-out `// System.out.println(...)` debug lines (2 in `getRows`, 1 in
  `sort`); cleaned `setDone(boolean v){done=v;}` → idiomatic `setDone(final boolean done){this.done=done;}`.
- **`TopNResults.java`** — deleted the dead `mightKeep(long)` lock-free pre-gate (**0 callers**). It's deliberately
  obsolete, not a missing optimization: the retention basis is now `buildScore` (needs the build's final target-aware
  stats), which **can't** be computed before building the `HeroStats`, so there's nothing to pre-gate — confirmed by
  the explanatory comments at `OptimizationRequestHandler.java:1238-1242` and `:1416-1419` ("…can't pre-gate before
  the HeroStats build the way the old priority sum could. topN.offer() still rejects sub-threshold builds lock-free").
  Also fixed stale `priority`→`buildScore` terminology in the class javadoc + the heap inline comment (the heap
  comparator and the retention-basis comment already say buildScore; the prose lagged).

Cross-file: all 6 classes are the live data layer (verified `OptimizationDb`'s public API, `TopNResults`/`setLiveTopN`/
`getBestSoFar`/`offer` all used by `OptimizationRequestHandler`). Benign inconsistency left as-is (intentional, perf):
`ItemDb.getAllItems()` returns the live list while `HeroDb.getAllHeroes()` returns a copy.

**Source-tree correction (resolves the long-running "hardlinked tree search is unreliable" confusion):** the numbered
folders are the REAL dirs; `com/fribbels/<subpkg>` are **directory symlinks/junctions** to them (`ocr→9. Hero Library`),
and only `com/fribbels/Main.java` is a true hardlink. Search tools skip junctions by default, so pointing ripgrep/`grep`/
`find` at `com/fribbels` (what caused past false-negatives) finds nothing — search the **numbered folders** instead, or
use `-L`/`--follow`. Subpackage files are single real files (edits always hit both views; no relinking needed — only
Main.java can break). Memory `reference-java-dual-source-tree` rewritten to match. No JAR rebuild done yet (deferred to
end-of-backend-sweep, per the build-deferral plan).

---

## Backend build checkpoint — `0. Main` + `1. Core` + `2. Model` compile clean — 2026-06-20

Ran `build_backend.ps1` mid-sweep (Java has no per-file syntax check like JS `node --check`, so a compile checkpoint
after the substantive refactors). **BUILD SUCCESS** — 78 source files compiled with `javac [debug release 25]`
(JDK 25), tests skipped. Validates all backend changes so far: `SpecialStats` param-removal + `BaseStatsDb` call,
`Sorter` DRY rewrite, `StatCalculator` de-commenting, `Mod` setStat helper, `Hero` param-removal, `HeroStats`
charset, and the `FileIO` + `MiniOptimizationResponse` deletions (78 files = was 80, minus the 2 deleted classes —
no dangling refs). **`backend.jar` was rebuilt + deployed** to `1. Master\3. Jar\backend.jar`; behavior-preserving,
but relaunch the app to load it. Remaining backend folders (`3. DB`–`9. Hero Library`) still to sweep; a final
build will follow.

---

## `3. Backend\...\2. Model\` — folder sweep (19 files) — 2026-06-20

Swept the whole model package. 16 are clean idiomatic Lombok value/data classes (no commented code, no debug, no
BOM, hardlinks intact). Changes:

- **DELETED `MiniOptimizationResponse.java`** (both hardlinked copies) — dead: **0 references** anywhere, a vestige
  of the removed `FileIO.writeMiniOptimizationResponsesToFile` file-IPC. Untracked; verified 0 refs remain.
- **`Mod.java`** — removed commented-out `// System.out.println(...)` debug in `toString()`; switched `toString()`
  from per-call `new Gson()` to a `private static final Gson GSON` (consistent with `Item`/`HashItem`, and
  `Mod.toString()` runs in the `HeroStats.getBuildHash` loop, so it avoids per-call allocation).
- **`Hero.java:101`** — `public java.util.List<String> targetSets;` → `List<String>` (the import already exists;
  every other field uses the short form).

Dead-class check: `PassesContainer` (OptimizationRequestHandler), `MergeHero` (ItemsRequestHandler/MergeRequest),
`HashItem` (Item.getHash) all confirmed used. `Item` was a false-positive on the scan (its `cc=1` was a legit
`priorityScore` doc comment, not dead code). Hardlinks re-verified for Mod/Hero post-edit; no BOM. 18 files remain.

Then applied the 3 optional cleanups too (behavior-preserving, verified): **HeroStats** `getBuildHash` →
`getBytes(StandardCharsets.UTF_8)` (explicit charset); **Mod** `modifyAugmentedStats` → extracted a `setStat(stats,
statType, statValue)` helper (clear = `setStat(originalType, 0)`, apply = `setStat(type, value)`; 2×11 → 11 cases);
**Hero** dropped the unused `skill` param from `calculate{Support,Crit,HitMulti}` + all 18 call sites (the _used_
`skill` param of `getSkillOptionsByIndex` left intact). Hardlinks synced, no BOM. Maven build deferred to end of
backend sweep.

---

## `3. Backend\...\1. Core\` — folder cross-file pass complete — 2026-06-20

All 4 files individually swept (FileIO deleted; SpecialStats collapsed; Sorter DRY-refactored; StatCalculator
de-commented). Folder-level pass: **hardlinks intact** for all 3 remaining files (numbered inode == `com/fribbels`
inode), **no dead classes** (StatCalculator → Main/OptimizationRequestHandler/HeroesRequestHandler/test; Sorter →
OptimizationDb/test; SpecialStats → BaseStatsDb), consistent package + 4-space + comment-clean. Two low-severity
cross-folder findings logged to New Bugs (both touch `4. Handler`, deferred to that review): `getNewStatAccumulatorArr`
unused param + redundant caller double-assign, and `StatCalculator`'s backwards `SET_COUNT` import from the handler
layer. `1. Core` done.

---

## `3. Backend\...\1. Core\StatCalculator.java` — removed all commented-out code — 2026-06-20

The core stat-computation engine. Per user choice ("remove all commented-out code"), stripped every commented-out
code block — **no live formula touched** (verified). Removed:

- Old superseded stat formulas (the pre-accumulator `atk/hp/def/cr/cd/eff/res/spd` block + old `dac` calc).
- Old skill-value formulas (superseded by the `getSkillValue()` calls).
- Old artifact-stats fetch (superseded by `hero.artifactHealth/artifactAttack`).
- Commented `System.out.println` debug in `getSkillValue`.
- The 2 explanatory blocks: the `/* */` damage-formula derivation notes (the `1.871` factor) and the `bs`↔frontend
  formula mapping. (Doc comments on _live_ code — field docs, target-bonus method explanations — were kept; those
  aren't commented-out code.)

Method: the 5 `//`-only dead blocks removed via content-matched Edit (the live math is never in the match string,
so it can't be altered); the lone `/* */` block removed via content-anchored `sed` (whitespace-tolerant; it's the
only block comment). Verified on the compiled `com/fribbels` copy: **0 dead markers, 0 block comments**, all 4 key
formula anchors present, all 8 methods present, no BOM, hardlink synced. The IDE auto-reformatted the file (comment
reflow / if-return wrapping) mid-edit — cosmetic, the user's formatter config. Maven build deferred to end of the
backend sweep.

---

## `3. Backend\...\1. Core\Sorter.java` — DRY refactor (de-duplicated ASC/DESC) — 2026-06-20

Sorts optimization results (used by `OptimizationDb` lines 133/247/307 + `BuildScoreRankingTest`). Was ~240 lines
of near-identical ASC/DESC switch duplication — every column case written twice, DESC being the same getter +
`.reversed()`. Refactored per user choice:

- Extracted `comparatorFor(column, spdEffWeight)` — a single column→`Comparator<HeroStats>` switch (38 cases),
  returning null for an unknown column.
- `sortHeroes` now validates order (`INVALID ORDER`), fetches the comparator (`INVALID COLUMN` if null), and sorts
  with `comparator.reversed()` for DESC. Original error precedence (order-then-column) preserved.
- Removed the per-sort debug `System.out.println("SORTING HEROES BY ...")`.

Behavior verified identical: all **38** column→getter mappings cross-checked against the original ASC switch (exact
match, incl. `FINALSPEED`→`getSpd` with its explanatory comment and `SPDEFF`→weighted `comparingDouble`). The 3-arg
overload (used by the test) is unchanged. **266 → 114 lines**, single source of truth — eliminates the "add a
column to one block but forget the other" bug class. Hardlink preserved (Write); `com/fribbels` copy verified; no
BOM. Maven build deferred to end of backend sweep.

---

## `3. Backend\...\1. Core\SpecialStats.java` — removed dead code + collapsed no-op stubs — 2026-06-20

SpecialStats is live (`BaseStatsDb.getBaseStatsByName` → `setScBonusStats`). Cleaned per user choice (collapse):

- Removed **~270 lines of commented-out dead code** — old hardcoded per-hero special-stat overrides (Angelic
  Montmorancy, Captain Rikoris, …) for 5★/6★, superseded by the data-driven `hero.bonusStats.override*` path
  (the only live logic).
- Removed the two no-op helpers `setScBonusStatsFiveStar`/`setScBonusStatsSixStar` (both reduced to `return hero;`
  once the comments went; no external callers — only the internal star dispatch) plus the `stars` dispatch.
- Dropped the now-unused `stars` param from `setScBonusStats`; updated the sole caller `BaseStatsDb.java:60`
  (`setScBonusStats(response, stars)` → `setScBonusStats(response)`). `stars` is still used in BaseStatsDb for the
  5★/6★ base-stat selection (line 43), so no unused-var there.

Net: `setScBonusStats(hero)` now just applies the bonusStats override fields and returns the hero. **310 → 39 lines.**
Hardlinks: Write preserved SpecialStats's link; Edit preserved BaseStatsDb's this time (the file tools' link-breaking
is inconsistent — always check). Verified both `com/fribbels` copies share the inode + carry the changes; no leftover
`SixStar`/`FiveStar` refs or 2-arg calls tree-wide (Grep tool); no BOM. Maven build deferred to end of backend sweep.

---

## `3. Backend\...\1. Core\FileIO.java` — DELETED (dead code) — 2026-06-20

Removed the entire `com.fribbels.core.FileIO` class (both hardlinked copies: `1. Core/FileIO.java` +
`com/fribbels/core/FileIO.java`). Verified dead: the only `FileIO` mention in the whole backend was its own class
declaration — 0 callers of any of its 5 methods (`readFile`, `writeFile`, `writeJsonToFile`,
`writeMiniOptimizationResponsesToFile`, `writeString`), never instantiated. It was a vestige of the old file-based
`response.txt` IPC; the live `response.txt` path is handled directly in `RequestHandler.java`
(`new File("response.txt")`), not via FileIO. Both copies untracked (reorg) — no git action; no compile impact
(nothing references it). User-approved. (The one latent nit it had — `writeString`'s `toString()` not specifying
UTF-8 — is moot now; would've been harmless on JDK 18+ anyway since the default charset is UTF-8.)

---

## `3. Backend\...\0. Main\Main.java` — comment accuracy + hardlink relink — 2026-06-20

First file of the Java backend sweep. Backend entry point (DB setup, port bind 8130–8139, HTTP server + 4
handlers). Reviewed correct: the port-retry loop matches its "8130-8139" error message, thread count is
`max(10, cores*2)`, server lifecycle + shutdown hook are sound, and the `System.exit(1)` trailing `return` is
harmless defensive code.

- **Stale comment fixed**: line 66 claimed the port is printed "as FIRST stdout line so the frontend can read it."
  The real mechanism (verified): frontend `subprocess.js` runs `new RegExp(/BACKEND_PORT:(\d+)/).exec(stdoutBuffer)`
  — a regex match on the whole stdout buffer (30s watchdog; `8130` fallback in `api.js`), so line position is
  irrelevant. Reworded to describe the regex match instead of "FIRST line."
- **Dual-source-tree hardlink**: the Edit tool broke the `0. Main/Main.java` ↔ `com/fribbels/Main.java` hardlink
  (temp-file+rename → new inode; the _compiled_ `com/fribbels` copy stayed stale on the old inode). Relinked via
  `ln -f "0. Main/Main.java" "com/fribbels/Main.java"`; verified identical inode (link count 2) + the change is in
  the compiled copy. Updated the dual-source-tree memory: the Edit tool now ALWAYS breaks the link → must relink
  after every Java edit.

No BOM. Comment-only change (no recompile needed); the Maven build is deferred to the end of the backend sweep per
the post-change QA-sweep policy.

---

## Re-synced renderer `node_modules` to manifest (uuid patch) — 2026-06-20

Audited `2. Frontend/1. Source/node_modules` against its `package.json` (per user request). One drift found:
`uuid` installed `14.0.0` but declared `^14.0.1` (14.0.1 is the npm `latest`; node_modules trailed by one patch).
Ran `install_frontend.ps1` → `npm install --ignore-scripts --legacy-peer-deps` reported **"changed 1 package"**
(uuid 14.0.0 → 14.0.1), 0 vulnerabilities; transient `package-lock.json` removed; `installedTransitives`
regenerated (56 transitives / 26 direct — content unchanged, only the snapshot `_comment` date refreshed to
2026-06-20). Re-audit = **fully in sync**: 82 top-level (26 direct + 56 transitive), 0 direct mismatches, 0
snapshot drift, 0 listed-but-absent, 0 extras, form-data override honored (4.0.6). No manifest dep edits — the
range was already correct; only node_modules was behind. Validates the regen-installed-transitives script (56/56
exact).

---

## Deleted stale orphan bundle `5. Dev Only\renderer.dev.js` — 2026-06-20

A 7.2 MB webpack dev bundle left at the OLD output location (`5. Dev Only/`, beside `main.dev.js`, dated Jun 2),
from before the dev-renderer output path moved to `2. Frontend/1. Source/renderer.dev.js` (current; dated Jun 20,
regenerated every `yarn dev` via the `writeToDisk` filter). Verified orphaned: the sole loader is `app.html`'s
`require('../renderer.dev.js')` → `2. Frontend/1. Source/renderer.dev.js`, and webpack's dev config outputs only
there — nothing references the `5. Dev Only/` copy. Untracked, so deleted outright (rebuilds from source if ever
needed). This is the exact file the (now-corrected) `.prettierignore` path used to point at — see the DLL-removal
entry. `5. Dev Only/` now holds only `main.dev.js` (the real main-process source).

---

## Removed the dev DLL — replaced with webpack 5 filesystem cache — 2026-06-20

Resolves the "Dev DLL ineffective" open bug by removing the mechanism entirely (user choice: modernize over
preserve). The DLL was a webpack-4-era dev rebuild-speed optimization that webpack 5's built-in persistent cache
supersedes — and it was doubly broken: it prebundled the **root** manifest deps (main-process / build tooling:
body-parser, electron-\*, node-abi, …) instead of the renderer's deps (confirmed by reading the generated
`renderer.json` manifest), AND the `DllReferencePlugin` `context` (`4. Both/dll`) didn't match the DLL build
context (`1. App/`), so references couldn't resolve. Net: a wasted `build-dll` on every dev start for zero speedup.

Changes:

- **Deleted** `4. Both/1. Webpack/webpack.config.renderer.dev.dll.js` + the generated `2. Frontend/2. DLL/` folder.
- **`webpack.config.renderer.dev.js`**: removed the DLL-missing auto-build check, the `dll`/`manifest`/
  `requiredByDLLConfig` vars, the `DllReferencePlugin`, and the now-unused `fs`/`chalk`/`execSync` imports; added
  `cache: { type: 'filesystem', buildDependencies: { config: [__filename] } }` (caches to
  `node_modules/.cache/webpack`, already gitignored).
- **`package.json`**: removed the `build-dll` script + the `&& yarn build-dll` step from `postinstall`.
- **Ignore/config files**: dropped `2. Frontend/2. DLL` from `.gitignore`, `.prettierignore`, `eslint.config.mjs`,
  `tsconfig.json`, `tsconfig.eslint.json`. While in `.prettierignore`, fixed a pre-existing bug — it ignored
  `5. Dev Only/renderer.dev.js` (wrong path; the bundle is at `2. Frontend/1. Source/renderer.dev.js`, so Prettier
  would have tried to format the 7.8 MB bundle) — and dropped two stale `renderer.prod.js` lines (already covered by
  `8. DIST`). Normalized both tsconfigs to 2-space (were 4-space; rest of the repo's JSON is 2-space).

Verified: `node --check` + a require-load of the dev config (`cache.type=filesystem`, `DllReferencePlugin` absent,
no load error → `baseConfig`/`webpack`/`webpack-merge` all still resolve), eslint 0, prettier clean on all changed
files, no BOM. No `app.html` `<script>` referenced the DLL. The deleted dll config was untracked (reorg); the DLL
folder was untracked+ignored. **Pending:** a dev relaunch (`yarn dev`) to confirm first build + incremental rebuild
through the new filesystem cache.

---

## `1. App\.gitignore` — fixed stale ERB build-artifact ignore paths — 2026-06-20

The "App packaged" block still listed the original electron-react-boilerplate `app/` layout
(`app/main.prod.js`, `app/renderer.prod.js`, `app/style.css` + `.map`s, bare `dist`/`dll`/`main.js`) —
none of which match the current numbered-folder output paths, so the real build artifacts weren't ignored.
Verified the actual webpack outputs and replaced the block:

- **main:** `webpack.config.main.prod.js` (output.path `1. App/`, filename `./2. Frontend/1. Source/main.prod.js`)
  → `2. Frontend/1. Source/main.prod.js` (+ `.map`).
- **renderer/css/assets:** `webpack.config.renderer.prod.js` (output.path `…/8. DIST`, `renderer.prod.js` +
  MiniCssExtract `style.css` + asset-module fonts/images) → ignore whole `2. Frontend/1. Source/8. DIST/`.
- **dev renderer:** `webpack.config.renderer.dev.js` (output `renderer.dev.js`; `devServer.devMiddleware.writeToDisk`
  writes it to disk; `app.html` loads it via `require('../renderer.dev.js')`) → `2. Frontend/1. Source/renderer.dev.js`.
- **dev DLL:** `webpack.config.renderer.dev.dll.js` (dist `…/2. DLL`, `renderer.dev.dll.js` + `renderer.json`)
  → ignore whole `2. Frontend/2. DLL/`.

Annotated each rule with its source config. Also **`git rm --cached`** (staged, files kept on disk) the two
artifacts that had silently become tracked when their output paths moved off the ignored `app/` location:
**`2. Frontend/1. Source/main.prod.js`** (stale bundle from the pre-sweep `main.dev.js`) and
**`2. Frontend/1. Source/renderer.dev.js`** (7.8 MB dev bundle, regenerated every `yarn dev`). ERB's original
intent was to ignore both. `git check-ignore -v` confirms all artifact paths now resolve to the new rules.
LF preserved; staged not committed.

Aside (not acted on): a completeness scan for other tracked artifacts surfaced that the repo is mid-migration —
~2,910 tracked-but-deleted old-structure paths and ~4,122 untracked new files (most of `1. App/`), only 69 staged.
That is the intentional numbered-folder reorg, left for the user to stage/commit wholesale; the `.gitignore`
fixes above ensure artifacts stay excluded when that happens. The two scan hits `css/style.css` and root
`main.dev.js` are old reorg locations (now `2. CSS/style.css`, `5. Dev Only/main.dev.js`), NOT artifacts — left alone.

---

## `5. Dev Only\main.dev.js` — debug logging + dead deprecated option — 2026-06-19

The Electron main process (window creation, menu, IPC, auto-updater; compiled to `main.prod.js` for prod). Already
eslint 0 / prettier-clean / node 0 from the prior sweep + the earlier DevTools-title fix; no TODO/commented-code.
Review-level cleanups (linters don't catch these):

- **Debug `console.log` → `electron-log`.** `electron-log` (`log`) is already imported and set as the autoUpdater
  logger, so raw stdout debug was inconsistent. Removed the pure-noise startup marker `console.log('main.dev.js')`;
  converted the 3 auto-updater diagnostics (`'DOWNLOADED'`+data on update-downloaded; `'TEST UPDATES'`+updates in
  the `test` ipc; updates in the `check` ipc) to `log.info(...)` — routed to the proper file+console facility with
  level control. Net: **0 raw `console.*`** in the file.
- **Removed dead `enableRemoteModule: true`** (×2 in `webPreferences`). Electron removed that option in v14; Electron
  42 ignores it. Remote access is provided by `@electron/remote` via `remoteMain.enable(mainWindow.webContents)`
  (unchanged), so it was inert config.
- Left intact (harmless boilerplate, consistent with the webpack configs): the vestigial `E2E_BUILD`/`ERB_SECURE`
  conditions and the documented empty `installExtensions` stub (devtools-installer intentionally skipped). The
  earlier DevTools-title fix (`openDevTools({ mode: 'undocked', title: 'Developer Tools' })`) is still in place.

node 0, eslint 0, prettier clean, CRLF preserved, no BOM (302 → 296 lines).

**Follow-up 2026-06-20:** removed the now-redundant line-1 `/* eslint global-require: off, no-console: off */`
directive (ERB-era cruft). The flat config sets `no-console: 'off'` globally and there are no `console.*` calls
left after the prior pass, and `global-require` isn't enabled at all (not in the config nor `@eslint/js`
recommended) — so the inline override suppressed nothing. Verified eslint still 0, prettier clean (296 → 294 lines).

---

## `4. Both\2. Build\1. Scripts\` — removed 3 orphan scripts + swept the 6 live ones — 2026-06-19

Build-helper scripts folder. Cross-checked every script's callers (package.json scripts, webpack configs, PS1/BAT).

- **Deleted 3 orphaned scripts** (refs=0 in live code; only referenced in the ignored `_pre-modernize-backup\`):
  - `ElectronRebuild.js` — only caller was the renderer `postinstall` removed earlier today; the root manifest uses
    the `electron-rebuild` npm CLI directly.
  - `BabelRegister.js` — superseded by `node -r @babel/register` (the npm package); webpack now loads its configs as
    native CommonJS.
  - `CheckBuildsExist.js` — only used by the removed **testcafe E2E** scripts (test stack already gone).
  - (All 3 were untracked → plain delete, no git impact.)
- **Swept the 6 live scripts** (`CheckNativeDep`, `CheckNodeEnv`, `CheckPortInUse`, `CheckYarn`, `CopyAssets`,
  `DeleteSourceMaps`) — all node 0, no BOM, CRLF:
  - `CheckNativeDep.js`: unused `catch (e)` → optional `catch {`; **fixed the stale ERB warning text** (referenced
    `"./frontend"` / `"./frontend/package.json"` / `cd ./frontend` — wrong for this layout) → now points at the root
    `1. App/package.json` vs renderer `2. Frontend/1. Source/package.json` + `install_frontend.ps1`.
  - The other 5 were already correct/functional — `prettier --write` only.
- `prettier --write` on all 6; `regen-installed-transitives.js` (added earlier) already clean.

Result: folder = 6 live scripts + regen; all **eslint 0 / node 0 / prettier-clean**, CRLF preserved. Ties off the
`electron-rebuild` removal (the ElectronRebuild.js/BabelRegister.js orphans it left behind are now gone too).

---

## Renderer manifest — removed broken/vestigial `electron-rebuild` + `postinstall` — 2026-06-19

`2. Frontend\1. Source\package.json` (the relocated renderer manifest) had a `scripts` block:
`"electron-rebuild": "node -r ../../4. Both/2. Build/scripts/BabelRegister.js ../../4. Both/2. Build/scripts/ElectronRebuild.js"`

- `"postinstall": "yarn electron-rebuild"`. **Triple-broken + dead:**

* Path points to `4. Both/2. Build/scripts/` but the folder is `1. Scripts` (numbered) — doesn't exist.
* The spaced paths are **unquoted**, so a shell would split them — it could never run.
* **0 native `.node` modules** in the renderer tree → nothing to rebuild.
* Runs in **no** real flow: `install_frontend.ps1` installs with `--ignore-scripts`; electron-builder packages from
  the **root** manifest. (This broken `postinstall` is what errored when a plain `npm install` was attempted.)
* The **root** `1. App\package.json` already has a _working_ `electron-rebuild` (the `electron-rebuild` npm CLI,
  devDep `^3.2.9`) for native rebuilds — so the renderer's custom duplicate was redundant.

**Removed the entire `scripts` block** (user-approved). Verified: JSON valid, no `scripts` key, prettier-clean,
webpack still derives 26 externals from the manifest, install_frontend.ps1 unaffected (never invoked it). A plain
`npm install` no longer fails on the broken postinstall.

**Flag (not removed):** `4. Both\2. Build\1. Scripts\ElectronRebuild.js` (custom rebuild wrapper) now appears
**orphaned** — its only caller was this renderer postinstall (the root uses the `electron-rebuild` CLI directly, not
this wrapper). Candidate for removal in a later build-script pass; verify no other caller first.

---

## Webpack-emitted assets removed from git — output-root fonts/SVGs — 2026-06-19

The renderer webpack output root (`2. Frontend\1. Source\`) had accumulated hash-named **emitted asset** cruft
(from `type: 'asset'` font/SVG modules across multiple build-hash eras). These are build artifacts, not source —
source fonts live in `node_modules` (`@fontsource`/`@fortawesome`), source images in `3. ASSETS`; dev serves emitted
assets from webpack-dev-server **memory** (`writeToDisk` only writes `renderer.dev.js`), prod emits to `8. DIST`.

- **Deleted 3 untracked orphan `.woff2`** physically on disk (`ce9a3fa…`, `cfbad32…`, `f276979…`) — newer-build
  orphans never committed. (User asked what they were → confirmed WOFF2 web fonts, then deleted.)
- **`git rm --cached` 30 tracked-but-already-deleted-on-disk emitted assets** at the output root: 24 fonts
  (`.woff2/.woff/.ttf/.eot`) + 6 hash-named `.svg`. All were committed by old builds then cleaned off disk
  (tracked `D`); this stages their removal from version control (index-only, no disk change). Verified all 6 root
  SVGs were hash-named (no source SVG at the root) before ignoring.
- **`.gitignore`**: added an "emitted assets at the renderer output root" block —
  `2. Frontend/1. Source/*.{woff2,woff,ttf,eot,svg}` (separate lines). Confirmed it ignores emitted fonts/SVGs but
  does **not** catch `renderer.dev.js` or `package.json` at that root (those stay tracked — the project still
  commits the dev bundle; that convention was left untouched).

Net: 0 tracked emitted assets remain at the output root; 30 deletions staged (commit when ready); future emitted
fonts/SVGs won't be re-committed. Pure build-artifact cleanup — no source or runtime impact.

---

## `7. PY\2. Scapy` dead mirror removed + Python tool-cache gitignore — 2026-06-19

Reviewing `7. PY\2. Scapy\1. Core\__init__.py` confirmed it's **verbatim third-party Scapy 2.5.0 source** (GPL,
© Philippe Biondi), and the whole `2. Scapy` tree is a **dead, unused mirror**: 408 files / ~9.2 MB, **untracked**
in git, folder named `2. Scapy` (so `import scapy` can't resolve to it), no `sys.path`/PYTHONPATH wiring,
not referenced anywhere, and not shipped (electron-builder `extraFiles` doesn't include `7. PY`). scanner.py imports
the **system-installed** Scapy (the documented importer prereq — verified present: scapy 2.7.0). Did NOT lint/format
the vendored source (it should track upstream, not diverge — and it's dead).

- **Deleted the entire `7. PY\2. Scapy` folder** (user-approved) — ~9.2 MB freed; `7. PY` now holds only
  `1. Scanner`. Pure filesystem delete (untracked → no git impact). scanner.py unaffected (system Scapy).
- **Cleaned my own tool artifacts** from the scanner-review passes: removed the `.mypy_cache/` and `__pycache__/`
  created under `7. PY\1. Scanner\1. Core\` by the mypy/py_compile runs, and added `**/.mypy_cache/`, `.ruff_cache/`,
  `__pycache__/` to `1. App\.gitignore` (next to the existing `.eslintcache`) so they can't be committed.

---

## `4. Both\1. Webpack\*.js` (5 configs) + eslint ignore fix — 2026-06-19

Swept the webpack build configs (base, main.prod, renderer.dev, renderer.prod, renderer.dev.dll). All node-clean,
no BOM, CRLF; no stale path refs (the earlier `base.js` manifest-path fix was the only one). ERB-derived boilerplate.

- **Real bug — over-broad ESLint ignore.** `eslint.config.mjs:18` had `'**/*.prod.js'` (intended for the _generated_
  bundles `main.prod.js`/`renderer.prod.js`) but the glob also silently excluded the **source** configs
  `webpack.config.main.prod.js` and `webpack.config.renderer.prod.js` from linting. Narrowed to `'**/main.prod.js'` +
  `'**/renderer.prod.js'` (matches the bundles, not `webpack.config.*.prod.js`, mirroring the existing
  `'**/renderer.dev.js'` line). The two now-lintable configs are already clean (verified `--no-ignore`).
- **`main.prod.js`** — removed a dead commented-out `// devtool: … : 'none'` line (superseded by `devtool: false`;
  `'none'` is the pre-webpack-5 form).
- **`renderer.dev.dll.js`** — fixed a copy-paste-wrong comment ("NODE_ENV should be production" sitting above a dev
  DLL that sets `NODE_ENV: 'development'`).
- `prettier --write` on all 5 configs **and** `eslint.config.mjs` (the latter had one pre-existing long line);
  verified eslint.config still loads + lints (exit 0). CRLF preserved, no BOM.

Result: 5 configs + eslint.config.mjs all eslint 0 / node 0 / prettier-clean. **Flagged, not changed (dev-build
internals on a working app — see New Bugs):** the dev DLL's `DllReferencePlugin` context mismatch and its reading of
the _root_ package.json deps. Left the ERB `E2E_BUILD`/`ERB_SECURE` env defaults and vestigial SASS loaders alone
(harmless boilerplate; stripping them risks the prod/package build).

---

## `7. PY\1. Scanner\1. Core\scanner.py` — Py2→Py3 cleanup + dead code — 2026-06-19

The Python gear-scanner (Scapy packet capture on TCP 3333/5222 → reassemble by ACK → hex to stdout; spawned by the
Electron subprocess layer). 88-line Py2-era script; compiles under Py3.14 but carried cruft. No Python linter
installed (ruff/black/flake8/pylint absent) → manual review + `python -m py_compile` (passes before & after).

- **Removed unused imports** `io`, `json` (were `import io,sys,json,os`).
- **Removed dead globals/locals**: `prevAcks` (computed from `conf.ifaces` then never read), `existingIpIds` /
  `existingTcpSeqs` (referenced only by commented-out code), and `currSeq` (assigned, never used — code uses
  `packet[TCP].seq` directly).
- **Removed commented-out code**: `# packet.show()`, the two `existingIpIds`/`existingTcpSeqs` dedup blocks (an old
  strategy superseded by the `loads` payload-hash dedup), and the `# if 'F' in packet[TCP].flags` block.
- **Dropped the Py2/3 hex fallback**: `finalBuffer.hex()` always works in Py3; the `except: x.encode('hex')` branch
  was both dead and broken in Py3 (iterating `bytes` yields ints). Now just `print(finalBuffer.hex())`.
- **Bare `except:` → `except Exception:`** (×2: the hex try, removed; the sniff thread).
- **Fixed stale comment**: said "Omitting sniff() iface parameter to force all interfaces" but the code passes
  `iface=get_working_ifaces()` — rewrote to match (sniff all working interfaces; ports 3333 + 5222).
- **Style**: removed C-style trailing `;` (×7); `prn=lambda x: check_packet(x)` → `prn=check_packet`.
- The vendored `7. PY\2. Scapy` dead-mirror lib was not touched (third-party; known stale per memory).

py_compile OK, 88 → 64 lines, no BOM, CRLF preserved. (scanner.py is untracked in git, like the rest of the
not-yet-committed `6. JSON`/`7. PY` trees.)

**Follow-up tooling pass (same day — user installed the Microsoft Python VS Code extensions: black, flake8,
pylint, isort, mypy at `F:\VSCode-Data\extensions`).** Re-ran with the real tools (invoked via each extension's
bundled libs since they're not on PATH):

- **Converted `from scapy.all import *` → explicit imports** (`IP, Raw, TCP, TCPSession, get_working_ifaces,
sniff`). Now that scapy is importable here I verified all 6 resolve (`python -c "from scapy.all import …"`), so
  the F403/F405 wildcard warnings are gone with **no runtime risk** — this supersedes the "kept wildcard" note
  above. Grouped stdlib-first per PEP8 and dropped `import time` (flake8 **F401**, an unused import the manual pass
  missed).
- **black** (the formatter) applied: double quotes, 2 blank lines between defs, wrapped the long `sniff()` call,
  final newline. CRLF preserved. `black --check` now "would be left unchanged" (a manual format is a no-op).
- **flake8** clean (exit 0). Added repo-root **`.flake8`** (`max-line-length = 88`, `extend-ignore = E203, W503`)
  so flake8 agrees with black; placed at the repo root so it's discovered from any cwd (flake8 searches cwd-upward,
  and the VS Code workspace root is unknown).
- **pylint 5.43 → 9.13/10** (pragmatic, user's call): added a module docstring, `currAck`→`curr_ack` /
  `finalBuffer`→`final_buffer` (snake_case), `no-else-return` refactor, suppressed the **scapy `E0611` false
  positive** (`# pylint: disable-next=no-name-in-module` — scapy's dynamic exports defeat static analysis) and the
  **intentional broad-except** (`disable=broad-exception-caught` + rationale: a failed capture must not crash the
  daemon thread). Then (user opted in) added concise one-line docstrings to all 4 functions (`try_buffer`,
  `check_packet`, `terminate`, `thread_sniff`), clearing the last `C0116` warnings.

**mypy pass (user's editor flagged 3 mypy errors that CLI flake8/pylint/black don't catch):**
`scapy.all has no attribute "IP"/"TCP"` (`attr-defined` ×2 — scapy's dynamic exports defeat mypy's static view,
same root cause as the pylint suppression) + `Need type annotation for "acks"` (`var-annotated`). Fixed: wrapped the
scapy import and added `# type: ignore[attr-defined]`, and annotated `acks: dict[int, list]` / `loads: dict[str,
bool]`. **Gotcha:** the explanatory comment briefly contained the literal `pylint:` — pylint parses _any_ `# …pylint:`
as a directive, throwing a bogus `E0011` and dropping the score to 8.91; reworded to `pylint's …`.

Final: **mypy clean, pylint 10.00/10, flake8-clean, black-clean** (`--check` = "would be left unchanged"),
py_compile OK, CRLF, no BOM, 97 lines.

**Addendum (user request):** appended a "Reference notes" comment block (→ 128 lines) preserving the scanner-relevant
bits of `2. Personal\scraps.txt` — the captured-packet MessagePack format (`user_id`/`name`/`info{type,code}` +
2 truncated raw examples) and the downstream JS `combine()` reassembly (group-by-ack / sort-by-seq / dedup, which
mirrors `check_packet`+`try_buffer`) plus the manual single-ack one-liner. Kept lines ≤88 and avoided
tool-directive substrings (`type:`/`pylint:`) so it stays mypy/pylint/flake8/black clean. Non-scanner scraps
(heroData/artifactData cleaners, SQL, Camilla blob, spirit-RNG sim) intentionally not included.

---

## `6. JSON\3. TRANSLATION\locales` (i18n locales) — validated + prettier — 2026-06-19

Folder review of the i18n locale tree. Confirmed this is the **live** tree: `getLocalesPath()` (files.js:120-141)
resolves here, and electron-builder ships it via `build.extraFiles` (`./2. Frontend/1. Source/6. JSON/3.
TRANSLATION/locales/**`). 9 languages (dev, en, en-US, fr, ja, ko, ru, zh, zh-TW).

- **9 `translation.json`** (translation data, ~70-83KB each; `dev` is a 24-byte placeholder): all **valid JSON**,
  no BOM. Translation _content_ not second-guessed (translator data). `prettier --write` applied — content-safe
  (verified the only non-whitespace change was one stray blank line in ja; prettier can't alter JSON values/keys).
- **7 `gridlocale.js`** (AG-Grid locale objects, `global.AG_GRID_LOCALE_*`, `require`d at runtime by i18n.js):
  node 0, **eslint 0**, no BOM; `prettier --write` (4→2 indent + trailing comma/semicolon/final-newline — formatting
  only).
- **`*.missing.json`** (i18next `saveMissing` runtime dumps): left untouched — gitignored earlier today.
- **EOL:** all 16 normalized to **LF**. These files had mixed endings (LF first line / CRLF body), so
  `endOfLine: auto` resolved to LF — which is the canonical target per the `.gitattributes` `eol=lf`. (Uniformly-CRLF
  files elsewhere stay CRLF under auto.) Content fully preserved.
- The known orphaned "Java 8" key (6 non-EN locales) lives in these files — already tracked in New Bugs, not touched.

All 16 valid/parse + prettier-clean.

**Locale move finalized in git (per user: the tree was moved `1. Master\2. Data\locales` → `6. JSON\3. TRANSLATION`
"for organization").** The new tree was untracked and the old tree was tracked-but-deleted-on-disk (move not yet
recorded in git). Finalized: `git rm -r --cached "1. App/1. Master/2. Data/locales"` (old, 0 files on disk) +
`git add "…/6. JSON/3. TRANSLATION/locales"` (new). Git recorded 5 as renames + the rest as add/delete pairs (the
prettier reformat dropped some below the rename-similarity threshold); **0 `.missing.json` staged** (held by the
gitignore). The live translations are now version-controlled at their canonical home; the old location is removed
from git. **Staged** (not committed) — finalizes on the next commit. This resolved the dual-locale-tree flag.

---

## Runtime artifacts gitignored — disk cache + i18next missing-key dumps — 2026-06-19

Triggered by reviewing `6. JSON\2. CACHE\cache\artifactdata.json`. That file (and its 5 siblings, ~940KB total) is
the **live disk cache** — `Files.getCachePath()` resolves to `2. Frontend\1. Source\6. JSON\2. CACHE`, and
`diskCache.js` + the hero/artifact/community/RTA services read+write it at runtime, re-fetching from the server if
absent (`diskCache` `mkdir`s the `cache/` dir). It was **valid JSON, no BOM, but untracked AND not gitignored** —
so a `git add .` would commit churning regenerable data. (Cache files are machine-generated — NOT prettier'd/edited.)

- **`1. App\.gitignore`** — added two rules:
  - `2. Frontend/1. Source/6. JSON/2. CACHE/cache/` (runtime disk cache)
  - `**/translation.missing.json` (i18next `saveMissing` dumps, written at runtime to `Files.getLocalesPath()`)
  - Verified via `git check-ignore`; the cache dir no longer appears in `git status`.
- **Untracked the stale tracked `.missing.json`:** 9 files under `1. Master\2. Data\locales\*` were tracked but
  already deleted on disk (` D`). `git rm --cached` (index-only, non-destructive, no commit) → now **0
  `.missing.json` tracked**, staged as deletions. The 9 runtime-written copies in the `6. JSON\3. TRANSLATION`
  source tree were untracked already and are now ignored. **Confirmed the 9 real `translation.json` files are
  untouched** (still tracked) — only `*.missing.json` was targeted.

Note: this **staged** 9 deletions in the git index (the rest of the sweep is unstaged); they finalize on the next
commit. No edits to `artifactdata.json` itself (valid generated data).

---

## `installedTransitives` snapshot — automated regeneration — 2026-06-19

The renderer manifest's `installedTransitives` field is a documentation-only snapshot (npm ignores it) that the
`_comment` said to "regenerate after each install" — but there was no tool, so it was hand-maintained and could
drift. User asked to automate it (chose "script + auto-run in install_frontend.ps1").

- **New script** `4. Both\2. Build\1. Scripts\regen-installed-transitives.js` (plain CJS, self-locating via
  `__dirname`): reads the renderer manifest, enumerates `node_modules` (expanding @scopes, skipping dot-dirs),
  subtracts the 26 direct deps, records each remaining package's installed version, and rewrites the
  `installedTransitives` block in place. Preserves the file's existing EOL (CRLF/LF) and emits prettier-clean JSON
  (2-space); the `_comment` self-documents with the run date. Guards on missing `node_modules`.
- **`install_frontend.ps1`** now runs `node <regen script>` after a successful `npm install` (placed after the
  try/finally, so it only runs on success and after the electron-stub cleanup — electron isn't counted).
- **Verified:** script run wrote 56 transitives / 26 direct; manifest stays valid JSON, v1.12.0, CRLF preserved,
  **prettier-clean**; webpack still derives 26 externals; `install_frontend.ps1` parses; the `.js` is node-clean +
  eslint 0 + prettier-clean.

Net: the snapshot can no longer drift — it's rebuilt from `node_modules` on every install, and can be refreshed
on demand with `node "4. Both/2. Build/1. Scripts/regen-installed-transitives.js"`. (Reminder: this only refreshes
the _documentation_ field; actual transitive **versions** still update via their parent deps / `npm update` /
`overrides`, never by hand-editing this block.)

---

## Renderer manifest relocated — dropped the `6. JSON\1. LOCK\2. JSON\` indirection — 2026-06-19

User-approved structural simplification ("did it for structure, not important anymore"). The renderer manifest no
longer lives in a buried numbered-folder path that `install_frontend.ps1` had to copy into place each run; it now
lives **in place** next to the renderer source / `node_modules` / `renderer.dev.js`.

- **Moved** `2. Frontend\1. Source\6. JSON\1. LOCK\2. JSON\package.json` → `2. Frontend\1. Source\package.json`
  (byte-identical copy verified; v1.12.0). **Removed** the now-empty `6. JSON\1. LOCK\` folder. Kept
  `6. JSON\2. CACHE` (runtime data caches) and `6. JSON\3. TRANSLATION` (i18n locales) — both load-bearing.
- **`webpack.config.base.js`** (line 9): `require('…/6. JSON/1. LOCK/2. JSON/package.json')` →
  `require('../../2. Frontend/1. Source/package.json')`. This is build-critical — webpack derives `externals` from
  the manifest's `dependencies`. **Verified:** loading the actual config yields **26 externals** (matches the 26
  direct deps), and the relative require resolves from the config's own dir.
- **`install_frontend.ps1`**: removed the copy step and the post-install **deletion of the manifest** (it used to
  copy→install→delete the temp `package.json`, which is why git showed `1. Source\package.json` as ` D`). Now it
  installs in place (`$pkg = $sourceDir\package.json`), removing only the transient `package-lock.json` + any stray
  electron peer-dep stub. **Verified** `$pkg` resolves (`Test-Path` = True).
- **Docs:** updated all `DEPENDENCY-INVENTORY.md` references (manifest path/heading/link, the install-flow
  description, the webpack-base description, pre-release-pins + checklist), and removed the two **archival
  lockfile** subsections it documented under `…\1. LOCK\1. LOCK\` — those files did not actually exist (pre-existing
  doc staleness) and the parent `1. LOCK` is now gone.
- No runtime consumer of the renderer manifest (updater.js reads `app.getVersion()`). Grep confirms **no remaining
  code references** to the old path (only intentional "moved/removed" historical notes in the inventory doc; the
  `renderer.dev.js` bundle still has stale refs but regenerates on build).

**Needs user verification on relaunch:** the manifest is now physically present at `2. Frontend\1. Source\` during
the webpack build (previously it was deleted before building). Node module resolution is unaffected (node_modules is
the resolver root regardless) and nothing imports the package by name, and the webpack require + externals were
verified — but a `yarn dev` rebuild + launch is the definitive confirmation.

**Flag (pre-existing, not fixed):** `DEPENDENCY-INVENTORY.md` is broadly stale beyond this change — it still lists
deps not in the real 26-dep manifest (React 19, enzyme, node-fetch, express, jimp, server…). Needs a separate full
refresh pass.

---

## App version drift — reconciled to 1.12.0, single-sourced via app.getVersion() — 2026-06-19

Fixes the 3-way version drift surfaced during the renderer-manifest review (was: renderer manifest 1.12.0 / root
`1. App\package.json` 1.0.0 / updater.js hardcoded 1.10.0). Canonical version chosen: **1.12.0** (user-approved;
highest, already in the renderer manifest).

- **`1. App\package.json`** (the electron app manifest — `main: ./5. Dev Only/main.dev.js`, what electron-builder +
  `app.getVersion()` read in both dev and packaged builds): `version` 1.0.0 → **1.12.0**. The 1.0.0 was never
  bumped, so releases were being tagged 1.0.0 while the UI claimed 1.10.0.
- **`updater.js`**: replaced the hardcoded `const currentVersion = '1.10.0'` with a single source of truth —
  `remote.app.getVersion()` (via `@electron/remote`, already used in 6 renderer files) wrapped in try/catch with a
  `'1.12.0'` literal fallback. Now the displayed version (`: v…`) and the update-check comparison can't drift from
  the manifest again. Verified electron loads `1. App\package.json`, so `app.getVersion()` returns 1.12.0.
- Renderer manifest (`6. JSON\1. LOCK\2. JSON\package.json`) already 1.12.0 — unchanged. All three now agree.

updater.js: node 0, eslint 0, prettier clean. `1. App\package.json`: valid JSON, prettier clean.

**Follow-up noted (New Bugs):** `Updater.showNewFeatures` still hardcodes "New in v1.10.0" + the v1.10.0 feature
list. settings.js shows it **once** when stored `settingVersion` ≠ `getCurrentVersion()` (then persists the new
version @483), so the next launch will show the stale v1.10.0 popup once. Did NOT relabel it to 1.12.0 — that would
misattribute v1.10.0's features to 1.12.0; the changelog content needs real 1.11/1.12 notes at release time. The
`currentVersion` arg passed at settings.js:400/404 is ignored by `showNewFeatures()` (harmless dead arg).

---

## `6. JSON\1. LOCK\2. JSON\package.json` (renderer manifest) — reviewed, NO changes; dep audit clean — 2026-06-19

The renderer's canonical manifest (`poge7optimizer`, regenerated by install_frontend.ps1; no persistent lock).
**Reviewed clean — no edits made:** valid JSON, `prettier --check` already passes (no formatting drift), no BOM,
CRLF (fine under `endOfLine: auto`).

- **Dependency audit — zero unused.** Cross-checked all 27 `dependencies` against actual usage. 17 are JS
  `import`/`require`d; the other 10 are used via non-JS mechanisms and confirmed live:
  CSS/HTML — `@fontsource/fira-sans-condensed` (style.css), `@fortawesome/fontawesome-free`, `animate.css`,
  `pretty-checkbox` (app.html); i18next global-`<script>` plugins — `i18next-browser-languagedetector`,
  `i18next-http-backend`, `i18next-chained-backend`, `i18next-localstorage-backend` (app.html, used as
  `globalThis.i18next*` in i18n.js); jQuery plugin — `multiple-select` (optimizerTab.js/itemsTab.js); main process —
  `update-electron-app` (main.dev.js). Matches the prior "nothing missing" audit.
- `installedTransitives` (custom field, npm-ignored, `_comment` documents it) and `overrides.form-data ^4.0.6`
  (security pin) left as-is — intentional.
- **Noted, not fixed:** `string-similarity ^4.0.4` is deprecated upstream but still live (utils.js `stringDistance`);
  replacing it is a separate task. And a **3-way version drift** (see New Bugs) surfaced here.

No changes applied (file already clean).

---

## `5. TS\1. TS\globals.d.ts` — re-sync with inputHandler.js + unused disable + prettier — 2026-06-19

Ambient `declare global { var X: any }` block mirroring the globals inputHandler.js assigns to `globalThis` (so
`yarn tsc` + the IDE recognise them). It had **drifted** out of sync. node/parse fine, no BOM; **1 ESLint warning**.

- **Removed unused blanket `/* eslint-disable */`** (line 1) — eslint reported it as an unused directive (the file
  has no problems without it: `no-explicit-any` is off, ambient `declare var`s aren't flagged by no-unused-vars).
- **Removed 2 stale declarations** no longer registered in inputHandler.js: `Logger` (logger.js was deleted earlier
  this sweep) and `Grid` (appears only in inputHandler comments now — no `globalThis.Grid =`).
- **Added 6 missing declarations** that inputHandler.js _does_ register: `ArchetypeStore`, `ArchetypeScorer`,
  `ArchetypeTab`, `FlatStatCalibration` (the `5. Archetype Tab` modules), `HeroGearMatcher`, and `createGridCompat`
  (the AG-Grid v35 compat shim). Verified against the actual `globalThis.X =` lines (114, 135, 150-153).
- **Modernized the header comment** (`global` → `globalThis`; note it serves tsc + the IDE).
- `prettier --write` (4-space → 2-space). EOL left CRLF by `endOfLine: auto`.
- **Cross-check:** re-ran the declared-vs-registered diff after editing — **empty both ways** (58 globals, perfectly
  in sync with inputHandler.js).

eslint 0 (was 1 warning), prettier clean, CRLF (preserved), no BOM.

**`5. TS` folder complete** (declarations.d.ts + globals.d.ts). **Folder cross-check: `npx tsc` (noEmit, strict,
skipLibCheck) exits 0 with no output** — confirms the type layer is healthy: the `tinycolor2` ambient shim resolves
(tinygradient types OK) and the re-synced globals type-check cleanly. So `yarn test-all`'s `yarn tsc` step is green.

---

## `5. TS\1. TS\declarations.d.ts` — prettier only (verified live & necessary) — 2026-06-19

TypeScript ambient-declarations file (33 lines): `declare module '*.css'` + an ambient `tinycolor2` module shim.
First file of `5. TS` — investigated whether the whole TS tier is vestigial after the React/TS-stack removal and
the `index.tsx`→`init.js` entry move. **Conclusion: live and required**, not dead:

- **No `.ts`/`.tsx` source remains** (only the 2 `.d.ts`), and the webpack build is babel-only — but `tsc` is still
  wired (`package.json`: `"tsc": "tsc"`, `"test-all": "yarn lint && yarn tsc && yarn build"`), so the `.d.ts` are
  the ambient-type layer for `yarn tsc` + the IDE. (The `index.tsx` strings inside `renderer.dev.js` are a stale
  pre-rebuild bundle artifact, not live source.)
- **The `tinycolor2` shim is the only source of those types**: `@types/tinycolor2` is not installed and tinycolor2
  ships no types, yet tinygradient (used in optimizerGrid/heroesGrid/itemsGrid/multiOptimizerTab) references
  `tinycolor2` in its own `.d.ts`. Removing the shim would break `yarn tsc` ("Cannot find module 'tinycolor2'").
- **`declare module '*.css'`** backs the webpack CSS imports (e.g. `init.js`).
- eslint already clean (flat config lints `.ts` via the typescript-eslint block; `no-explicit-any` is off, so the
  shim's `any` index signatures are fine). Only change: `prettier --write` (4-space → 2-space). EOL left CRLF by
  `endOfLine: auto`; content unchanged.

eslint 0, prettier clean, CRLF (preserved), no BOM. (Did NOT run full `yarn tsc` — will offer it as the `5. TS`
folder cross-check once globals.d.ts is also done.)

---

## `7. Gear Analysis Tab\gearScorer.js` — lint (unused globals + dead destructure bindings) — 2026-06-19

The tiered scoring engine — an IIFE that exposes `globalThis.GearScorer` (@1130), consumed by gearAnalysisTab.js.
Loaded 3rd in the app.html Gear-Analysis block (after the constants + rules it reads off globalThis). node 0,
no BOM; **5 ESLint warnings**.

- **Removed the whole `/* global ITEM_SUBSTAT_STAT_WEIGHTS, ARCHETYPE_RULES, OFFICIAL_ARCHETYPE_RULES */`** (3
  warnings) — all three are read via `globalThis.X` (`globalThis.ITEM_SUBSTAT_STAT_WEIGHTS` @83/98,
  `globalThis.OFFICIAL_ARCHETYPE_RULES` @187/195, `globalThis.ARCHETYPE_RULES` @188/197); the bare names appear
  only in the header doc-comment + one log string, so the directive was dead (`no-undef` is off).
- **Removed 2 unused `toStat` destructure bindings** (the other 2 warnings) from the two
  `const { modGS: bestModRaw, fromStat, toStat, options } = _calcBestModGS(...)` sites (speed-arch + standard-arch
  branches). Only `bestModRaw`/`fromStat`/`options` are consumed; the per-option `toStat` lives inside `options`.
  Left intact all the _real_ `toStat` usages inside `_calcBestModGS` / `_formatGroupedModHint` (return field,
  `key.split('|')`, hint strings).
- `prettier --write` (formatting; EOL left CRLF by `endOfLine: auto`). 1 `console.error` (legit load-order
  warning), no debug logs, no TODOs, no commented-out code, no eslint-disables. Header's "Google Sheets project
  (Code.js)" note left as accurate provenance.

node 0, eslint 0 (was 5 warnings), prettier clean, CRLF (preserved), no BOM.

**`7. Gear Analysis Tab` folder complete** — all 4 files swept (epicSevenGearConstant → archetypeRules → gearScorer
→ gearAnalysisTab, the app.html load order).

**Cross-file pass (folder):** verified the global dependency chain. Cross-referenced every `globalThis.X` _read_ in
gearScorer.js + gearAnalysisTab.js against every `globalThis.X =` _definition_ in the folder — all in-folder
consumed globals are defined in-folder (constants/rules provide; scorer/tab consume). The only external reads are 6
real renderer modules — `Api`, `DarkMode`, `HeroData`, `HtmlGenerator`, `Notifier`, `Reforge` — all confirmed
exposed as globals via `6. Shared/1. Core/inputHandler.js`. No missing, orphaned, or typo'd globals. Load order in
app.html (7836-7839) matches the dependency direction.

---

## `7. Gear Analysis Tab\gearAnalysisTab.js` — stale arg bug + lint + dead code — 2026-06-19

The Gear Analysis tab controller — an IIFE (`(function(){ 'use strict'; … })()`, module-scoped, exposes only
`globalThis.refreshGearAnalysis`), loaded last in the app.html Gear-Analysis block. node 0, no BOM; **5 ESLint
warnings** + the long-known stale `getBaseStatsByStars` call.

- **Fixed stale 3-arg `getBaseStatsByStars` call** (`openItemModal`): `getBaseStatsByStars(item.equippedByName,
true, 6)` → `getBaseStatsByStars(item.equippedByName, 6)`. The function is `(name, stars)` (heroData.js:320) —
  the correct call elsewhere is itemsGrid.js:686 `getBaseStatsByStars(item.equippedByName, 6)`. The bad call put
  `true` in `stars` and dropped the real `6`. **Benign in effect** (the fn only special-cases `stars === 5`;
  `true` falls through to the same 6-star branch `6` would), but wrong/confusing code — now matches the canonical
  call.
- **Removed the whole `/* global GearScorer, Api, Notifier */`** (3 unused-global warnings) — all three are read
  via `globalThis.X` (e.g. `globalThis.GearScorer` @44, `globalThis.Api` @1268/1413, `globalThis.Notifier` @1414);
  the bare names appear only inside log strings, so the directive was dead (`no-undef` is off, so no decl needed).
- **Removed 2 dead functions** (the other 2 warnings), both verified zero-reference in the file and in HTML:
  - `buildSubstatsCell(tr, item, useReforged)` (41-line table-cell render helper, never called).
  - `closeSidebar()` (trivial dead wrapper around `closeItemModal()` — leftover from when the analysis panel was
    a standalone sidebar; the modal now closes via `closeItemModal`, and `showSidebar` only fills the modal panel).
- `prettier --write` (formatting; EOL left CRLF by `endOfLine: auto`). No debug `console.log` (all 5 `console.*`
  are legit warn/error), no TODOs, no commented-out code, no eslint-disables.

node 0, eslint 0 (was 5 warnings), prettier clean, CRLF (preserved), no BOM.

---

## `7. Gear Analysis Tab\constants\epicSevenGearConstant.js` — lint + dead code + stale comments — 2026-06-19

Plain-`<script>` global data file (gear constants: `ITEM_MAIN`, `SUBSTAT_ROLL_RANGES`,
`ITEM_MODIFICATION_ROLL_RANGES`, etc.), loaded **first** of the Gear-Analysis block per app.html
(`2. Frontend/1. Source/1. HTML/app.html` lines 7836-7839: epicSevenGearConstant → archetypeRules → gearScorer →
gearAnalysisTab). node 0, no BOM; **2 ESLint warnings** going in.

- **Removed 2 dead no-op vars** (`var ARCHETYPE_RULES = globalThis.ARCHETYPE_RULES;` /
  `var SCORING_CONFIGS = globalThis.SCORING_CONFIGS;`, ex-lines 1142/1148 = the 2 eslint warnings). This file loads
  _before_ archetypeRules.js, so `globalThis.ARCHETYPE_RULES`/`SCORING_CONFIGS` are `undefined` here, the locals
  were never read, and (unlike every other constant) there was no `globalThis.X = X` re-export — pure vestige.
  Confirmed the real owners are archetypeRules.js (`globalThis.SCORING_CONFIGS` @3876, `ARCHETYPE_RULES`) and the
  consumer is gearScorer.js. Replaced with a pointer comment.
- **Modernized the Apps-Script-era header comment**: removed "Apps Script" reference and the wrong load-order
  claims (`"1. Epic Seven Gear Constant.js" ensures alphabetical load order`, `before Archetype Rules.js and
Code.js`) → accurate note that order is fixed by the app.html `<script>` sequence + the real file names.
  Condensed the fluffy "OPTIMIZATION STATUS"/"MEMORY OPTIMIZATION" (`-50%`/`-66%`/"V8 optimizations") blocks into
  factual implementation notes (kept the shared-reference + freeze facts).
- **Commented-out reforge code → prose** (`// const canReforge = Item_level === 85;` /
  `// const isReforged = Item_level === 90;` → a sentence describing the level→reforge-state rule).
- `prettier --write` (formatting; EOL left CRLF by the new `endOfLine: auto`). Data values untouched.

node 0, eslint 0 (was 2 warnings), prettier clean, CRLF (preserved), no BOM.

---

## Repo EOL policy — `.gitattributes` (canonical LF) + prettier `endOfLine: auto` — 2026-06-19

**Root cause:** git `core.autocrlf=true` with **no `.gitattributes`** → files check out as CRLF on Windows, but
the prettier config (`1. App/package.json`) implicitly wanted LF → every checked-out file perpetually failed
`prettier --check` on line-endings alone, and the QA sweep had been silently force-converting each file to LF.
Surfaced while sweeping `archetypeRules.js`; user chose **both** fixes.

- **Added `/.gitattributes`** (repo root) — `* text=auto eol=lf` (canonical LF in git + working tree, overriding
  autocrlf), `*.bat`/`*.cmd` pinned `eol=crlf` (Windows scripts), `*.sh` `eol=lf`, and explicit `binary` rules for
  images/fonts/jar/exe/dll/node/archives/media (svg left as text — it's XML). Verified via `git check-attr`:
  `.js`→lf, `.bat`→crlf, `.png`→binary.
- **Set prettier `"endOfLine": "auto"`** in `1. App/package.json` (next to `singleQuote: true`) — prettier now
  preserves the file's native EOL instead of flagging it. Verified: `prettier` on a 1148-CRLF-line file emits 1161
  CRLF lines (preserved) and only re-wraps long lines (no content change).
- **No diff noise:** of 133 tracked files showing modified, **0** are EOL/whitespace-only — `.gitattributes`
  introduced no phantom renormalization diff (autocrlf already stored LF in the index).

Net: line-endings no longer fight prettier. Going forward the sweep no longer force-converts EOL per file; git
canonicalizes to LF on commit. (Optional later: a one-time `git add --renormalize . && commit` would flip the
existing CRLF working-tree files to LF immediately — deferred; it's a large changeset best done on a clean tree.)

---

## `7. Gear Analysis Tab\constants\archetypeRules.js` — EOL normalize (verified clean) — 2026-06-19

First file of the last renderer-JS folder (`7. Gear Analysis Tab` — plain `<script>` globals loaded via
app.html, NOT webpack-bundled; `var X` at top level **is** the global the other Gear-Analysis scripts consume,
so `var`→`const` would break exposure — left as-is). 4024-line archetype-scoring-rules data file:
`OFFICIAL_ARCHETYPE_RULES` + per-archetype tier arrays, each exposed via `globalThis.X = X`.

- Reviewed clean: node 0, **eslint 0** (every `var` set-array is consumed), 0 `console.`, no dead/commented code,
  no TODO. Data values are the user's domain (recently hand-edited — "small change to the original") and were
  not second-guessed.
- Only change: `prettier --write` — file was **CRLF** with minor formatting drift; normalized to **LF** +
  prettier-clean. Prettier is semantic-preserving (never alters values / key order / array order); node + eslint
  confirm. Data + the user's recent edit intact. (File is **untracked** in git, so no diff was available to
  preview the reformat.)

node 0, eslint 0, prettier clean, LF, no BOM.

**Repo-wide flag (EOL config):** git `core.autocrlf=true` + no `.gitattributes` → files check out as CRLF on
Windows, but prettier's `endOfLine` is `lf`, so checked-out files perpetually re-flag in `prettier --check`. The
other 3 Gear-Analysis files (`epicSevenGearConstant.js`, `gearScorer.js`, `gearAnalysisTab.js`) are likewise
**untracked + fully CRLF**. → **RESOLVED repo-wide same day** via `.gitattributes` + prettier `endOfLine: auto`
(see the entry above); EOL no longer needs per-file normalization.

---

## `6. Shared\4. UI\4. Renderer\gridRenderer.js` — lint + debug logs + setData drift — 2026-06-19

AG-Grid render helpers (`renderSets`, `renderStar`, `arrowKeyNavigator`; the latter is live in 4 files →
`navigateToNextCell` runs on grid navigation). 4-space; node + no BOM going in; 2 ESLint warnings.

- Removed 2 stale `eslint-disable` directives (`@typescript-eslint/no-use-before-define`, `no-console` — both
  off; the helpers are hoisted function declarations, so no real use-before-define).
- Removed 2 debug `console.log`s in `navigateToNextCell` (`customGridGetter`; and `params, grid` which fired on
  **every** cell navigation). Kept the `console.warn` that surfaces a missing grid.
- **Refactored `fourPieceSets`** (13-entry hardcoded Set) to derive from setData —
  `new Set([...FOUR_PIECE_CODES].map((c) => \`${SET_CODE_TO_DISPLAY[c]}Set\`))` — same fix as statPreview, so
  neither can drift from setData/rtaStats/communityBuilds.
- `prettier --write` (4→2 reindent).

node 0, eslint 0 (was 2 warnings), prettier clean, no BOM, `console.log` ×0 / `console.warn` ×1.

---

## `6. Shared\4. UI\3. i18n\i18n.js` — lint + dead code + modernize — 2026-06-19

i18next initialization. node + prettier clean, no BOM going in; 3 ESLint warnings. The messiest of the UI files.

- Removed the stale `/* eslint-disable prefer-const, no-var, block-scoped-var, no-undef */` (all 4 rules are
  off/absent in the flat config → unused directive); added an accurate `/* global Files, i18next, translateElement */`.
- Removed the commented-out backend-config block (the old localStorage-backend setup) inside `backend:`, keeping
  the live `loadPath`/`addPath`.
- **Modernized the `languageChanged` handler:** `function`→arrow, `var`→`const` (×3), collapsed the do-nothing
  `if (lang == 'en') { if (text_en) {} }` to an early `return` (also drops the undeclared `text_en` global), and
  dropped the unused `forEach` params. Behavior-identical (en → no-op; non-en → scan + log).
- **Removed 2 dead unreachable functions** — `fillMissingStrings`, `clearlocalCache` (module-local, not
  exported/used; confirmed 0 refs).
- Converted the anonymous `export default {…}` to `const I18n = {…}; export default I18n;` (matches the other
  modules; `.default` consumers unchanged).

node 0, eslint 0 (was 3 warnings), prettier clean, no BOM. i18next init untouched (only commented config removed).

---

## `6. Shared\4. UI\2. Display\updater.js` — dead code + lint + prettier — 2026-06-19

Version / auto-update management (`Updater`; currentVersion 1.10.0). 4-space; node + no BOM going in; 2 ESLint
warnings.

- **`catch (_e)` → `catch`** at 2 sites — the config's `varsIgnorePattern: '^_'` doesn't cover caught errors
  (`caughtErrors` defaults to `'all'`, separate option), so the `_e` bindings were still flagged; optional-catch
  resolves it.
- **Removed dead `global.ipcRenderer = ipcRenderer`** — zero consumers (updater's own ipc calls use the local
  `const { ipcRenderer }`; optimizerTab/subprocess use `electron.ipcRenderer` directly; app.html has none).
- **Removed a ~23-line commented-out dead block** in `checkForUpdates` (the old GitHub-releases-API update check).
- `prettier --write` (4→2 reindent).

Kept the Release/Patch checklist + TODO comments (maintainer docs) and `global.TEST = false` (read by heroData's
`globalThis.TEST`; the checklist-documented test flag). node 0, eslint 0, prettier clean, no BOM.

---

## `6. Shared\4. UI\2. Display\statPreview.js` — dead comments + prettier — 2026-06-19

Before/after stat-preview display (`StatPreview.draw`; renders stat diffs + set icons). 4-space; node + eslint
clean, no BOM going in.

- Removed a commented-out `// console.log("RenderSets images", …)` debug line + a stray orphaned `// 38821f`
  comment (a lone hex color).
- `prettier --write` (4→2 reindent).

node 0, eslint 0, prettier clean, no BOM.

**Drift removed (per user "sure"):** replaced the 13-entry hardcoded `fourPieceSets` with one derived from setData
— `[...FOUR_PIECE_CODES].map((c) => \`${SET_CODE_TO_DISPLAY[c]}Set\`)`(new import of the single-source-of-truth
setData) — so it can no longer drift from rtaStats/communityBuilds. Verified the derived list equals the old 13
exactly (order is irrelevant — it's only a`.includes` membership test for sorting 4-piece sets first). node 0,
eslint 0, prettier clean, no BOM.

---

## `6. Shared\4. UI\2. Display\selectors.js` — dead comments + prettier — 2026-06-19

multipleSelect setup for the optimizer's set/main/hero selectors. 4-space; node + eslint clean, no BOM going in
(this is also where the customFilter breadcrumbs were removed during the utils.js sweep).

- Removed 5 commented-out dead lines: a commented `// hideOptgroupCheckboxes: true` option + 4 commented-out
  old-approach code lines (a `setSelects` example, an `Object.assign` refresh call, and 2 alternative
  `// const selects = $('#optionsExcludeGearFrom')...` lines).
- `prettier --write` (4→2 reindent).

node 0, eslint 0, prettier clean, no BOM.

---

## `6. Shared\4. UI\2. Display\htmlGenerator.js` — lint error + dead comments + prettier — 2026-06-19

Item-panel / tooltip HTML generator (`HtmlGenerator`; live). 4-space; node + no BOM going in; **1 ESLint error**.

- **`no-useless-assignment` (error):** `let maxSpeed = 0` in `statToText` was overwritten in both if/else branches
  before its only read (line ~131) — changed to `let maxSpeed;`.
- Removed 2 commented-out debug lines (`// console.warn("WSS TO TEXT", …)` in `wssToText`,
  `// console.log(modifier, …)` in `modify`).
- `prettier --write` (4→2 reindent + de-aligned `huntImageBySet` + collapsed stray blank lines; ~963 cosmetic
  groups).

node 0, eslint 0, prettier clean, no BOM. (`escAttr` correctly escapes the inline `onclick` handler args;
those handlers reference Locator/EnhancingTab/OptimizerTab/HtmlGenerator as runtime globals inside HTML strings —
not lint-checked, fine.)

---

## `6. Shared\4. UI\1. Components\tooltip.js` — dead comments + prettier — 2026-06-19

tippy.js tooltip definitions for the optimizer UI. 4-space; node + eslint clean, no BOM going in.

- Removed 3 commented-out dead blocks: the old `#forceModeTooltip` and `#forceTooltip` tippy calls (those
  elements no longer exist in app.html — verified 0 matches; force mode was removed) + a commented-out "Only maxed
  gear" option line inside the options tooltip. All live tooltips preserved.
- `prettier --write` (4→2 reindent).

node 0, eslint 0, prettier clean, no BOM.

---

## `6. Shared\4. UI\1. Components\settings.js` — lint + dead comment + prettier — 2026-06-19

Settings load/save (`settings.ini`). 4-space; node + no BOM going in; 3 ESLint warnings. All `/* global */` names
used.

- **Unused `catch (e)` → `catch`** at 3 sites (the two identical "Unable to create folder" catches in
  load/saveSettings + the settings-parse catch). Kept the one catch that uses `e` (`_uploadCacheFile`, `${e}`).
- **Removed a stale commented-out color block** — 8 `// "settingX": "#..."` lines whose hex values no longer even
  match the live `getDefaultSettings` defaults.
- `prettier --write` (4→2 reindent).

node 0, eslint 0 (was 3 warnings), prettier clean, no BOM.

**Vestigial chain removed (per user "sure"):** dropped the dead `settingArchetypes: GearRating.getDefaultArchetypes()`
from `getDefaultSettings` — confirmed no reader (archetypes live in ArchetypeStore/e7-archetypes.json; the Java
backend already gets settings without it on every normal save, since saveSettings dropped it) — and removed
`GearRating` from settings.js's `/* global */`. That left `GearRating.getDefaultArchetypes()` with zero callers,
so removed it from **gearRating.js** too, along with its now-orphaned `import { DEFAULT_ARCHETYPES }`
(archetypeStore.js still imports that named export, so defaultArchetypes.js stays needed). Kept the rationale
comments documenting the migration. Both files: node 0, eslint 0, prettier clean, no BOM.

---

## `6. Shared\4. UI\1. Components\notifier.js` — prettier (verified correct) — 2026-06-19

AWN (awesome-notifications) wrapper (`Notifier.info/success/quick/error/warn`; used in 15 files). Reviewed clean —
sound logic (i18next-translated; `error`→AWN `alert`, `warn`→`warning`), no console/disables/dead code, node +
eslint clean, no BOM going in. Only change: `prettier --write` (4→2 reindent), no logic change.

node 0, eslint 0, prettier clean, no BOM.

---

## `6. Shared\4. UI\1. Components\dialog.js` — lint cleanup + dead-code removal — 2026-06-19

The big edit-gear / hero-details / mod-targets dialog module (6779 lines). node + no BOM going in, but **19 ESLint
warnings**. All resolved:

- **Header:** removed 3 unused `/* global */` names (`keepGroup`, `ignoreGroup`, `modifyGroup`) + 4 stale block
  `eslint-disable` directives (`@typescript-eslint/no-use-before-define`, `no-restricted-syntax`,
  `consistent-return`, `no-param-reassign` — all off/satisfied).
- **Dead consts removed:** `SLOT_PRIORITY_SUBSTATS` (superseded by the inline `SLOT_CATS` in
  `editSlotPrioritiesDialog`), `setCountsByIndex`, `setTotalByIndex` (unused empty objects).
- **Unused `catch (e)` → `catch`** at 2 `/* ignore */` blocks; removed an unused
  `// eslint-disable-next-line @typescript-eslint/no-unused-vars` on `styler(_row)` and another on the (used)
  `getStarsHtml(hero, _heroInfo)`.
- **3 dead functions removed (~263 lines total, verified zero call sites anywhere — HTML included):**
  `generateSkillOptionsHtmlOLDWITHDAMAGECALC` (~239-line legacy duplicate of the live `generateSkillOptionsHtml`),
  `getEeHtml`, `getModTargetsHtml`. The live functions interleaved between them (`getImprintHtml`, `getStarsHtml`,
  `_buildArchScoreSection`, etc.) were preserved.

6779→6433 lines. node 0, **eslint 0** (was 19 warnings), prettier clean, no BOM. Prettier `--write` applied per
user — an unusually large but purely cosmetic diff (~1234 groups / ~617 lines, including collapsing the blank gaps
left by the dead-code removal); no logic change.

---

## `6. Shared\4. UI\1. Components\darkmode.js` — dark-mode speed icon bug + prettier — 2026-06-19

Light/dark toggle (swaps `darkThemeCss` + ~22 filter-icon `src`s per branch + each grid's dark mode). 4-space
indented; node + eslint clean, no BOM going in.

- **Bug fix:** in the DARK branch the Speed filter icons used `./assets/statspd.png` (the plain icon) while every
  other stat used the `_dt` dark-theme variant — and assets.js maps Speed→dark as `statspd_dt.png`. So in dark
  mode the speed filter icon rendered as the wrong (non-dark) variant. Changed both (main + sub stat) to
  `statspd_dt.png`. All three speed assets exist; the light branch already correctly used `statspddark.png`.
- `prettier --write` (full 4→2 reindent). Logic unchanged.

node 0, eslint 0, prettier clean, no BOM.

**DRY refactor applied (per user "sure"):** collapsed the two ~22-line branches into data-driven loops — two
tables, `STAT_ICONS` (11 stat base-names; both `#mainStat…`/`#subStat…` set via `${base}${dark ? '_dt' : 'dark'}.png`)
and `TOGGLE_ICONS` (7 selectors via `${base}${dark ? '_dt' : ''}.png`). `toggle()` now reads the checkbox once, sets
`darkThemeCss` via `!dark`, loops the two tables, and calls each grid's `toggleDarkMode(dark)`. **145→61 lines,
behavior-identical** — and the Speed bug can't recur (Speed obeys the same suffix rule as every other stat).
node 0, eslint 0, prettier clean, no BOM.

---

## `6. Shared\4. UI\1. Components\colorPicker.js` — dead code + prettier — 2026-06-19

Theme-color customization UI (`ColorPicker`; live — registered + initialized). 4-space indented; node + eslint
clean going in (the `catch (e)` blocks all use `e` for `console.error`), no BOM.

- Removed a commented-out dead-code block (an old loop-based `addEventListener` approach referencing nonexistent
  `label` / `value[]` — long superseded by the `settingsToChange.forEach`).
- `prettier --write` (full 4→2 reindent). Logic unchanged (node 0 + eslint 0 confirm).

node 0, eslint 0, prettier clean, no BOM.

**Follow-up applied (per user "go ahead"):**

- **DRY:** added `_rebuildUserGradient()` + `_redrawGrids()` helpers and replaced the 4 inline userGradient
  rebuilds and the 4 grid-redraw blocks. The 3 change-handler redraws were `try { non-optional grid access } catch
{ console.error(e) }`; they now use `_redrawGrids()` (optional chaining — skips not-yet-built grids), which drops
  the moot error logging and matches what `redraw()` already did. Behavior-equivalent (present grids redraw,
  missing skipped). The one-time initial `userGradient` definition stays inline (it must exist before the helper
  can mutate it).
- **`LightenDarkenColor` robustness:** padded the hex with `.padStart(6, '0')` so a near-zero channel can't drop
  leading zeros and yield a malformed short hex. (Value is always ≤ 0xFFFFFF, so padStart(6) is exact.)

node 0, eslint 0, prettier clean, no BOM.

---

## `6. Shared\4. UI\1. Components\assets.js` — prettier reindent (verified correct) — 2026-06-19

Asset-path tables + dark-mode getters (`Assets.*`; used widely — optimizerTab, fribbelsLibrary, multiOptimizerTab,
…). **Verified correct + complete:** `assetsBySet` has all 24 sets, the element/class/gear/stat maps are complete,
`assetsByStatDt` (dark) parallels `assetsByStat`, and the `DarkMode`-gated getters are sound. node + eslint clean,
no BOM going in; nothing else to fix.

- Only change: `prettier --write` — full 4-space→2-space reindent + removed column-alignment padding (288 diff
  groups ≈ 144 lines). **Whitespace/quotes only** — every asset path and data value unchanged (node 0 + eslint 0
  confirm; prettier never edits string contents).

node 0, eslint 0, prettier clean, no BOM.

---

## `6. Shared\3. Services\subprocess.js` — dead child-kill code removed + lint — 2026-06-19

The Java-backend subprocess manager (spawns/monitors backend.jar; its Java-25 error messages are already correct).
node + no BOM going in; 6 ESLint warnings.

- **Removed dead child-process-kill code:** the `app-close` + `beforeunload` handlers each had 3
  `if (typeof scannerChild/itemTrackerChild/findCommandSpawn !== 'undefined' && X) X.kill()` guards. Those
  identifiers are module-locals in scanner.js (or removed entirely, for `itemTrackerChild`) — **never** globals
  reachable here (verified: no `globalThis`/`window` assignment anywhere), so the `typeof` guards were ALWAYS false
  → the kills never executed. Removed all 6 `if`s + their 6 `// eslint-disable-next-line no-undef` comments (the 6
  warnings) + the now-unused `/* global scannerChild, itemTrackerChild, findCommandSpawn */` line. Behavior-
  preserving (dead). Live cleanup remains intact: `treekill(child.pid)` kills the Java backend on both paths, and
  `Scanner.end()` on beforeunload.
- prettier-cleaned (4 lines — the BACKEND_PORT `console.error` wrap + `maxRamGb` parse).

node 0, eslint 0, prettier clean, no BOM.

**Latent gap FIXED (follow-up, per user "look into this"):** the removed dead code was a broken attempt to kill
the scanner child on close — `scannerChild` is module-local to scanner.js, unreachable from subprocess.js.
Investigated the full lifecycle: `scannerChild` is spawned **non-detached** (`childProcess.spawn`), and Electron
does NOT auto-reap non-detached children on Windows, so quitting **mid-scan** could leave `scanner.py` running.
`Scanner.end()` only sends a graceful `END\n` and errors ("No scan was started") when idle — wrong for close
cleanup. `findCommandSpawn` is never assigned (findcommand uses `spawnSync`) and `itemTrackerChild` is gone, so
only `scannerChild` needs cleanup. Fix:

- **scanner.js:** added `Scanner.kill()` — a quiet, idempotent force-terminate of `scannerChild` (no-op + no error
  when idle), since scanner.js owns the (module-local) child.
- **subprocess.js:** call `Scanner.kill()` from BOTH close paths — added to `app-close` (which previously did
  nothing for the scanner) and replaced beforeunload's idle-erroring `Scanner.end()` with it.

Both files node/eslint/prettier clean, no BOM. **Behavior change — test:** start a gear scan, quit the app
mid-scan, confirm no leftover `python.exe` (scanner.py) in Task Manager.

---

## `6. Shared\3. Services\stoveRta.js` — lint error fixed + format — 2026-06-19

Official Stove RTA analysis service (per-grade `getHeroAnalysis` aggregation across a grade range; disk-cached;
sibling of rtaStats.js). node + no BOM going in; ESLint had 1 error + 2 warnings:

- **`preserve-caught-error` (error) + unused `e`:** `getCurrentSeasonCode`'s JSON-parse catch rethrew
  `new Error('Stove season list was not JSON.')` without the cause — added `{ cause: e }` (resolves both).
- **Stale `/* eslint-disable no-console */` (warning):** removed (the lone `console.error` on an unrecognized
  getSeasonList response is legitimate error logging; `no-console` is off).
- **prettier:** applied `--write` (per the same call as rtaStats — 141 cosmetic groups expanding the dense
  `GRADE_CODES`/`SET_NAME`/`SKILL_LEVELS`/`hp`-bucket arrays + inline `if`-blocks); no logic change.

node 0, eslint 0, prettier clean, no BOM.

---

## `6. Shared\3. Services\setData.js` — prettier format (verified correct) — 2026-06-19

Shared single-source-of-truth set tables (`SET_CODE_TO_DISPLAY` / `SET_CODE_TO_GAME` / `FOUR_PIECE_CODES`;
imported by rtaStats + communityBuilds). **Verified correct + complete** — 24 `SET_CODE_TO_DISPLAY` entries match
the E7 set roster, the 13 `FOUR_PIECE_CODES` are the right 4-piece sets (incl. Weakening, per the comment),
`SET_CODE_TO_GAME` cleanly derived; comments accurate (the Fervor/Weakening drift rationale + scope note that
stoveRta uses a different code system). node + eslint clean, no BOM going in.

- Only change: `prettier --write` (19 cosmetic groups — expanded the compact `FOUR_PIECE_CODES` array to
  one-per-line + wrapped the `Object.fromEntries(...)` derived-map line). Data values unchanged.

node 0, eslint 0, prettier clean, no BOM.

---

## `6. Shared\3. Services\rtaStats.js` — real lint errors fixed + format — 2026-06-19

The RTA meta-stats scraper (epic7rtastats RSC scrape + Stove hero-code map; disk-cached; ported from the personal
Apps Script). node clean + no BOM going in, but ESLint surfaced **3 errors + 6 warnings** — real lint debt (this
file was likely never linted since the RTA integration landed). All fixed:

- **`preserve-caught-error` (error):** the "Failed to fetch RTA hero list" rethrow dropped the caught error —
  added `{ cause: e }` to chain the original cause.
- **`no-useless-assignment` (2 errors):** `setAggStats` and `companions` were each `= []`-initialized then
  unconditionally overwritten before any read (every code path assigns) — dropped the dead inits
  (`let setAggStats;` / `let companions;`).
- **Unused `catch (e)` → `catch {` (5 warnings):** the 5 sites that ignore the error (parseHeroArray, the
  filtered-list fallback, setsMap/setStats/setAgg JSON parses). Left the 4 catches that DO use `e` (the 3
  `_httpsGet` reject paths + the hero-list rethrow) untouched.
- **Stale `/* eslint-disable no-console */` (warning):** removed (zero console calls; `no-console` is off).
- **prettier:** applied `--write` per user — large cosmetic reformat (~107 line-groups) normalizing the file's
  dense style (compact `PRIORITY` object, inline `forEach` bodies, multi-statement lines); no logic change,
  570→583 lines.

node 0, eslint 0, prettier clean, no BOM.

---

## `6. Shared\3. Services\heroData.js` — debug-log gating + globals — 2026-06-19

The hero/artifact data service (disk load + ETag-conditional S3 fetch with Azure-CN fallback, skill processing,
base-stat calc). Already lint + prettier clean, sound logic, accurate comments, legitimate `console.warn`
error-path logging (every `catch (e)` uses `e`).

- Gated the 2 `[HeroData] Using local cache…` `console.log` diagnostics behind `_optDbg` (`window.__optDebug`),
  matching the codebase convention; kept all 7 `console.warn` (real load/fetch failures).
  replace_all-before-helper ordering per [[feedback_optdbg_replace_all_pitfall]].
- Added `Settings` to `/* global */` (used defensively via `typeof Settings !== 'undefined'` in `initialize`).

node 0, eslint 0, prettier clean, no BOM, `console.log` ×1 (helper body), 0 recursion. (Note: `getBaseStatsByStars(name, stars)`
signature here is correct; the stale 3-arg `getBaseStatsByStars(name, true, 6)` call is in gearAnalysisTab.js —
still pending that folder's sweep.)

---

## `6. Shared\3. Services\diskCache.js` — lint cleanup — 2026-06-19

Tiny best-effort JSON disk cache (shared by the RTA / community / Stove services; `readDiskCache`/`writeDiskCache`,
stored under the app cache dir). Reviewed clean — sound best-effort logic (silently degrades to a live fetch on any
fs/JSON error), accurate comments, both imports used.

- Removed a dead `/* eslint-disable no-console */` (no console calls + `no-console` is off).
- Converted both unused `catch (e)` → optional-catch `catch {` (ES2019). The write path's comment-only catch is
  intentionally empty (`no-empty` allows it via `allowEmptyCatch`).
- prettier-cleaned (wrapped the `mkdirSync(..., { recursive: true })` call).

node 0, eslint 0 (was 3 warnings), prettier clean, no BOM.

---

## `6. Shared\3. Services\damageCalc.js` — comment fix + dead-code cleanup — 2026-06-19

Skill damage-multiplier service (`DamageCalc.getMultipliers`, used by optimizerTab + fribbelsLibrary).

- **Fixed a wrong comment:** `getHitTypeMulti`'s "normal" hit returns `1` but was annotated `// 130%` (copy-paste
  from the crushing case just above) → corrected to `// 100%`.
- **Removed dead commented-out code:** the 3 debug `// console.warn(...)` lines in `findSkill`, and the 3
  `// var sXMultis = calculateMultis(...)` lines (old approach — `calculateMultis` doesn't exist here).
- prettier-cleaned (wrapped the `getHeroExtraInfo(...)` call).

Kept the damage-formula reference comments (file top) + the Java `// private Float[]…` field block as porting
documentation. node 0, eslint 0, prettier clean, no BOM.

**Perf/readability refactor (done, per user):** `getMultipliers` previously called `findSkill` from ~24 result-field
callbacks (each re-looked-up all 3 skills ≈ 70+ calls per run). Now resolves the 3 skill options once
(`const skills = skillNames.map((x) => findSkill(x, hero, heroData))`) and reads every field off the cached
results — behavior-identical (`findSkill` is pure for fixed inputs), one call site. `hitMulti` still keys on the
skill _name_ (it reads `hero.skillOptions`, not the resolved option). node 0, eslint 0, prettier clean, no BOM.

---

## `6. Shared\3. Services\communityBuilds.js` — lint cleanup — 2026-06-19

The Build Planner's community-builds service (usage % + median speed for the selected Target Sets; per-hero disk
cache, 24h TTL, bounded to 60 heroes). Reviewed clean — sound matching logic (4-piece AND / 2-piece OR / Broken),
accurate + extensive comments, modern ES, live (dialog.js `getBuilds` + `analyzeForSets`), imports resolve
(diskCache, setData).

- **Removed a dead `/* eslint-disable no-console */`** — the file has ZERO console calls and `no-console` is off
  anyway (doubly pointless; ESLint flagged it).
- prettier-cleaned (wrapped several >80-char lines — the cache-hit guard, fetch options, the
  `_completedSets`/for-loop conditions, `usagePct`). Formatting only.

node 0, eslint 0, prettier clean, no BOM.

---

## `6. Shared\3. Services\artifact.js` — extracted magic numbers — 2026-06-19

Readability refactor, behavior-identical. The artifact stat-scaling fn used bare `13` (max-level stat multiplier)
and `30` (max artifact level), with `(level / 30)` repeated 3×.

- Extracted module constants `MAX_ARTIFACT_LEVEL = 30` and `MAX_STAT_MULTIPLIER = 13` (with an explanatory
  comment), and DRY'd the repeated `level / 30` into a single `levelRatio`. Same math, same outputs.

node 0, eslint 0, prettier clean, no BOM. Live service (`Artifact.getStats` used in optimizerTab ×2 / heroesTab /
dialog ×2). Otherwise the file was already clean + correct (linear base→13× interpolation over lv0–30, accurate
tenths-rounding header comment, missing-artifact guard).

---

## `6. Shared\3. Services\api.js` — review + lint/debug cleanup — 2026-06-19

The backend API service (all Java-backend paths via axios). Reviewed clean — accurate comments, legitimate
error-path `console.error` logging, the verbose per-call log already gated behind `globalThis.API_DEBUG`.

- **Removed the stale `/* eslint-disable no-console */`** — `no-console` is OFF in the flat config, so the
  directive was unused (ESLint flagged it).
- **Gated the one unconditional noisy log:** `getResultRows`'s "(normal at start)" `console.log` fired on every
  poll while `maximum=0` at optimization start; now behind `globalThis.API_DEBUG` (the file's existing debug
  gate). The `_invalidResultRowsCount` counter still increments; only the flood log is silenced. Its sibling
  `console.error` (INVALID _after_ optimization done) stays unconditional — that's a real error.
- **Modernized** `getEndpoint`: `'http://localhost:' + (globalThis.backendPort || 8130)` → template literal.
- prettier-cleaned (wrapped one >80-char line — the API_DEBUG call).

node 0, eslint 0, prettier clean, no BOM.

---

## `6. Shared\2. Models\stat.js` — positional ctor → params-object (+ 3 call sites) — 2026-06-19

Modernized the `Stat` model's 7-arg positional constructor to the params-object style, matching Item and
eliminating arg-misorder risk. Per user request.

- **stat.js:** `constructor(type, value, rolls, modified, pinMod, pinModOff, allowedTargetStats)` →
  `constructor(params) { this.type = params.type; … }` — same field set, same names.
- **3 call sites updated** to pass one object (field mapping verified against the old positional order):
  - itemSerializer.js `buildStat` — all 7 fields (type/value/rolls/modified/pinMod/pinModOff/allowedTargetStats).
  - scanner.js `convertMainStat` — `new Stat({ type: mainType, value: fixedMainValue })`.
  - scanner.js `convertSubStats` — `new Stat({ type: key, value, rolls: acc.rolls, modified: acc.modified })`.
    Partial construction still works (omitted fields → `undefined`, same as the old trailing-undefined behavior).
- Also prettier-cleaned scanner.js (pre-existing dirt, formatting only: de-aligned the `setsByIngameSet` object's
  column-aligned values + rewrapped two `_optDbg` debug calls — no logic change).

Verified: stat.js + itemSerializer.js + scanner.js node 0, eslint 0, prettier clean, no BOM; 0 remaining
positional `new Stat(` calls. **Behavior-touching** (Stat is constructed during save-load deserialization and gear
import/scan) — relaunch and confirm gear stats render correctly after loading a save AND after a scan/import.

---

## `6. Shared\2. Models\optimizationRequest.js` — documented the empty model — 2026-06-19

Flagged during the 2. Models pass as a suspicious empty `class OptimizationRequest {}`. Investigated: it's USED and
intentional (NOT a dead stub like logger.js) — `OptimizerTab.getOptimizationRequestParams()` does
`new OptimizationRequest()` then populates it dynamically with dozens of `input*` fields (filters, stat min/max
limits, set/main filters, target priorities), and the populated object is serialized + POSTed to the Java backend
via `Api.submitOptimizationRequest`.

- Added a JSDoc comment explaining the property-bag pattern so the empty body no longer reads as a mistake/stub.
  No code or behavior change.

node 0, eslint 0, prettier clean, no BOM.

---

## `6. Shared\2. Models\item.js` — modernized to ES6 class — 2026-06-19

The `Item` model — reviewed clean + correct: 10 fields (gear/rank/set/level/enhance/main/substats/name/heroName/
otherworldly) that exactly match its single instantiation site (itemSerializer.js:40, which builds it from one
params object; `id` is set separately afterward). The earlier "itemSerializer Item ctor" fix lives on the
serializer side and is already done.

- **Modernized** the lone ES5 `function Item(params) { this.x = params.x; ... }` constructor to an ES6
  `class Item { constructor(params) {...} }`, matching its sibling models (stat.js + optimizationRequest.js are
  already classes). Zero behavioral risk — `Item` is only ever created via `new Item({...})` (one call site), so
  the class "no call without new" restriction can't bite.

node 0, eslint 0, prettier clean, no BOM. (Heads-up for the 2. Models sweep: optimizationRequest.js is an _empty_
`class OptimizationRequest {}` — worth a look when that file comes up.)

---

## `6. Shared\1. Core\utils.js` — review + dead `customFilter` removal — 2026-06-19

Small shared helper module (`Utils`: sortByAttribute, stringDistance, round10ths, round100ths, isFlat — all
live). node/eslint/prettier clean + no BOM going in. Per user (option 1).

- **Removed dead `customFilter`** — a fuzzy-match dropdown filter with ZERO live callers: all 5 call sites were
  commented-out `// customFilter: Utils.customFilter,` options in multipleSelect configs (dialog.js ×2,
  selectors.js ×3). Deleted the method from utils.js AND the 5 commented breadcrumbs. It also carried a
  suspicious `$('input').prop('checked')` (selects ALL page inputs, reads the first — likely why it was disabled)
  and 2 stray scratch comments (`//`, `// briar w`), all gone with it.
- Removed the now-unused `/* global $ */` from utils.js (`$` was used only by customFilter).
- **Kept `stringDistance`** + the `string-similarity@4.0.4` dependency — `stringDistance` is LIVE (5 calls in
  reforge.js for fuzzy hero/gear name matching). Flag for later: `string-similarity` is a deprecated/unmaintained
  npm package; a swap would be behavior-sensitive (different similarity scores) so left for a deliberate
  migration, not this sweep.

Verified: utils.js + dialog.js + selectors.js node 0, eslint 0 errors, 0 remaining `customFilter` refs; utils.js
prettier clean, no BOM. Aside: dialog.js carries ~19 PRE-EXISTING lint warnings (stale disable directives, unused
vars, dead `...OLDWITHDAMAGECALC`/`getEeHtml`/`getModTargetsHtml` builders) — noted for its own future sweep,
untouched here.

---

## `6. Shared\1. Core\logger.js` — dead module removed — 2026-06-19

Removed the no-op `Logger` stub (`{ initialize: () => {} }`) — confirmed dead: nothing ever logged through it
(no `Logger.log/info/...` calls anywhere), its only consumer was inputHandler.js, and there's no app.html /
Gear-Analysis reference. Per user (option 1). Renderer source → picked up on relaunch, no build.

- **Deleted** `6. Shared/1. Core/logger.js`.
- **inputHandler.js:** removed the `import Logger from './logger';`, the `globalThis.Logger = Logger;`
  registration, and the no-op `Logger.initialize();` call in the DOMContentLoaded handler.

Verified: inputHandler.js node 0, eslint 0, prettier clean, no BOM, 0 remaining `Logger` references. (The
`isJavaLoggerNoise` variable in subprocess.js is unrelated — it filters Java stderr noise, not this module.)

---

## `6. Shared\1. Core\inputHandler.js` — single-file review — 2026-06-19

The renderer's global registry + DOMContentLoaded app-init (it's the webpack bundle root, imported by init.js).
Reviewed in full; near-clean going in — node/eslint/prettier clean, all 30+ top imports used (each maps to a
`globalThis.X` registration), the `/* global */` list matches the bare-global references, the init-order comments
(ArchetypeStore→Settings→HeroData→tabs) are accurate, and the only console use is the intentional `console.error`
override (surfaces errors via Notifier, ignores the benign port-8130 first-launch message).

- **Removed a duplicate registration:** `globalThis.Files = Files;` was assigned twice (line 67 and again
  ~line 165) — dropped the second.
- **Stripped a UTF-8 BOM.**

No correctness issues. The require-vs-import style mix is deliberate (inline `require().default` for modules not
imported at the top; preserves body-order execution rather than ESM import-hoisting for the load-order-sensitive
registry). Verified node 0, eslint 0, prettier clean, no BOM, `globalThis.Files` ×1.

---

## DevTools window title — main.dev.js — 2026-06-19

Dev-only cosmetic. The detached DevTools window was titled `Developer Tools - file:///…/app.html` — Chromium's
default DevTools-window title is the inspected page's URL (it ignores the page `<title>`, which already exists),
and the long spaced project path made it an eyesore.

- `electron-debug` (which auto-opened an _untitled_ DevTools window) is now called with `{ showDevTools: false }` —
  keeps its F12/reload keyboard shortcuts but stops the auto-open.
- `createWindow`'s `did-finish-load` now opens DevTools itself (dev/`DEBUG_PROD` only, guarded by
  `!isDevToolsOpened()` so a page reload won't re-open it) via Electron 42's
  `openDevTools({ mode: 'undocked', title: 'Developer Tools' })`. The `title` option (undocked/detach only,
  added in recent Electron) overrides the default URL-based title.

Net: DevTools still auto-opens in dev, now titled "Developer Tools", still dockable, shortcuts intact. node +
ESLint + prettier clean. Main-process source → picked up on relaunch (no build). Needs a relaunch to confirm the
title renders as expected.

---

## Renderer entry consolidation — init.js + index.tsx merge — 2026-06-19

Frontend structure / webpack entry cleanup. The renderer had TWO single-line side-effect entry modules in the
webpack `entry` arrays: `5. TS/2. TSX/index.tsx` (`import '…/app.global.css'` — a stripped-down leftover of the
removed React root) and `6. Shared/1. Core/init.js` (`import './inputHandler'`). Consolidated into one bootstrap.

- **init.js** now imports both, CSS first (preserving the original entry order):
  `import '../../../2. CSS/app.global.css'; import './inputHandler';` + a one-line comment.
- **webpack.config.renderer.dev.js** entry: dropped the `index.tsx` line, keeps `init.js` (+ core-js/regenerator).
- **webpack.config.renderer.prod.js** entry: repointed `index.tsx` → `init.js`. Also fixes a latent issue — after
  the React removal the prod entry was `index.tsx` ONLY (CSS, no app logic), so `renderer.prod.js` would have
  bundled CSS with no inputHandler. (Prod build is vestigial/unused per [[reference-frontend-build]], but the
  config is now correct + consistent with dev.)
- **Deleted** `5. TS/2. TSX/index.tsx` + the now-empty `2. TSX` folder. Kept `5. TS/1. TS/*.d.ts` (TypeScript
  declarations used by `tsc`).

Verified: node --check + ESLint + prettier clean on init.js; node --check clean on both webpack configs; CSS
import path resolves (`2. CSS/app.global.css` exists); no remaining `index.tsx`/`2. TSX` refs in
configs/package.json/tsconfig; no BOM. Renderer bundle regenerates on the next `start-dev.bat` relaunch (no manual
frontend build — see [[reference-frontend-build]]). Backend JAR rebuilt (`build_backend.ps1` → BUILD SUCCESS, 80
files, backend.jar deployed) at the user's request, though this was a frontend-only change so the JAR is
functionally unchanged.

---

## `6. Shared\1. Core\files.js` — single-file review — 2026-06-19

Core path/IO helper for the renderer (registered global `Files`). ESLint-clean + no BOM going in; no rebuild
(renderer source).

- **Removed a no-op:** `Files.path()`'s Mac branch did `filePath.replaceAll('/', '/')` — a pointless
  self-replacement (returns the string unchanged). Simplified to
  `Files.isMac() ? filePath : filePath.replaceAll('/', '\\')` — behavior-identical (app code uses '/' internally;
  only Windows needs '\') — and added a one-line comment explaining the split.
- **Prettier:** the file wasn't prettier-clean (an unwrapped long `path.join(...)` in `getScannerPyPath` + 2 long
  `…Subpath` string consts); ran `prettier --write` → now passes `--check`. Pure formatting, no logic change.

No correctness bugs in the path-resolution logic — the packaged (`app.asar` → `getAppPath`/`exe` dir) vs dev
(`__dirname` 3 levels up = project root) branches are internally consistent, and all the data/jar/locales/cache/
scanner-py paths derive from `getRootPath()`. Verified node 0, eslint 0, prettier 0, no BOM.

---

## Tooling — `.eslintignore` → `.prettierignore` migration — 2026-06-19

Repo-wide ESLint deprecation cleanup (no rebuild; dev tooling only). ESLint 10 warned
`The ".eslintignore" file is no longer supported` on every run. The flat config (`eslint.config.mjs`) had
ALREADY migrated its own ignores to `globalIgnores([...])` — the leftover `.eslintignore` lingered only because
**Prettier + Stylelint** still referenced it via `--ignore-path .eslintignore` (7 spots: `lint-styles`,
`postlint-fix`, `postlint-styles-fix`, + 4 lint-staged hooks). So it couldn't simply be deleted.

- Created **`.prettierignore`** with the shared ignore patterns (faithful copy of `.eslintignore` minus dead
  jscoverage/grunt/node-waf boilerplate); header notes ESLint does NOT use it.
- Repointed all 7 `--ignore-path .eslintignore` → `--ignore-path .prettierignore` in package.json (stylelint +
  prettier scripts and the lint-staged hooks).
- Added `**/*.prod.js` to the ESLint `globalIgnores` (parity with the existing `**/renderer.dev.js`; covers the
  generated `main.prod.js`/`renderer.prod.js` bundles — absent in the dev-from-source tree, future-proofs a prod
  build) + clarified the config comment.
- **Deleted `.eslintignore`.**

Verified: `npx eslint` now runs with NO deprecation warning (exit 0); `npx stylelint --ignore-path .prettierignore`
and prettier both resolve the new file; package.json valid JSON with 0 remaining `.eslintignore` refs. (Aside: the
lint-staged config-dotfile glob still lists a dead `.eslintrc` name — harmless, matches nothing under flat config;
left as-is.)

---

## 5. Archetype Tab folder — 4-file review + cross-file pass — 2026-06-19

Frontend `4. JS\5. Archetype Tab\` (4 files); no rebuild (renderer source). The user-built archetype system
(gear-scoring presets): archetypeScorer.js (296, pure DOM-free scoring fns), archetypeStore.js (201, file-backed
singleton → `Documents/FribbelsOptimizerSaves/e7-archetypes.json`), archetypeTab.js (1047, editor UI for tab10),
defaultArchetypes.js (1206, 32 built-in archetypes + a group-assignment block). All wired via inputHandler
(registered as globals; `loadArchetypes()` + `ArchetypeTab.initialize()` at startup) and consumed by itemsGrid,
gearRating (Enhancing Tab), and dialog.js's mod auto-config. All 4 parsed clean + no BOM going in.

- **Debug logging gated (store + tab):** added the `_optDbg` (`window.__optDebug`) helper to archetypeStore.js +
  archetypeTab.js and routed their ~6 and ~17 `[ArchetypeStore]` / `[ArchetypeTab]` debug `console.log`s through
  it (kept every `console.error`/`console.warn`). Did the `replace_all console.log(`→`_optDbg(` BEFORE adding each
  helper (recursion pitfall — [[feedback_optdbg_replace_all_pitfall]]); verified 0 recursion and exactly one
  surviving `console.log` per file (the helper body itself).
- **Lint:** removed 4 stale `eslint-disable` directives — the unused `@typescript-eslint/no-var-requires` +
  `no-console` pairs at archetypeStore.js:14-15 and archetypeTab.js:2-3 (both rules off/satisfied). ESLint now
  0 errors / 0 warnings on all 4 (was 4 warnings).
- **Dead export removed:** defaultArchetypes.js exported both `export const DEFAULT_ARCHETYPES` (what every
  consumer imports — store + gearRating) and a never-imported `export default DEFAULT_ARCHETYPES`; dropped the
  default.
- **Comment accuracy (3 fixes):** (a) archetypeStore.js header claimed the `archetypesChanged` event refreshes
  "the items grid **and enhancing tab**" — only itemsGrid.js listens (the Enhancing Tab's gearRating reads the
  live store on-demand, no event listener), so reworded to match. (b) archetypeTab.js had a misplaced
  "Row rendering" section banner sitting above the per-slot-overrides panel — ~140 lines before the real
  `renderRow` — moved it to `renderRow`. (c) the stat-weights editor comment said "Setting to 1.0 removes the
  key", but the per-stat handler only removes on blank/invalid input and the neutral is the "Any" value (not a
  hardcoded 1.0); corrected to describe actual behavior. No behavior change — scoring is identical whether a stat
  key equals the neutral or is absent.

Cross-file pass: contracts consistent. archetypeScorer's two cross-folder imports resolve
(`…/1. Optimizer/…/rollDivisors.js`, `…/3. Gear/flatStatCalibration.js`); store imports `{ DEFAULT_ARCHETYPES }`;
tab references `ArchetypeStore` as a call-time global (registered before `initialize()` runs). KNOWN_SETS (24) /
KNOWN_SUBSTATS (11) in the tab align with the scorer's stat handling and the 24-set roster. No correctness bugs
found — archetypeScorer.js and defaultArchetypes.js needed no code changes.

---

## 4. Importer Tab folder — 4-file review + cross-file pass — 2026-06-19

Frontend `4. JS\4. Importer Tab\` (4 files); no rebuild (renderer source). Files: scanner.js (472, scan-import
parser), importerTab.js (6-line no-op stub), importer.js (424, the Importer-tab file/scan/merge controller),
saves.js (338, save/load controller). All 4 already lint-clean + no BOM going in — work was correctness review,
comment/dead-code cleanup, debug-log gating, and one stale user-facing string.

- **scanner.js — duplicate constant removed (the exact drift `constants.js` warns about):** deleted the local
  `statByIngameStat` object literal — it was an identical copy of `Constants.ingameStatToStatType`. Replaced both
  uses with `Constants.ingameStatToStatType[…]` (call-time global access; scans run well after startup, so the
  global is populated) and added `Constants` to `/* global */`. Also removed a dead commented-out "companion"
  block in `initialize` and the no-op `startItemTracker: () => {}` stub (its only reference was inside that
  commented block — zero live callers). Gated 7 debug `console.log`s through the `_optDbg` (`window.__optDebug`)
  helper (kept `console.error`/`console.warn`); did the `replace_all console.log(`→`_optDbg(` BEFORE adding the
  helper per [[feedback_optdbg_replace_all_pitfall]]. Left `globalThis.finishedReading` (deliberate manual hook,
  harmless).
- **saves.js — latent crash fixed:** the `saveDataSubmit` click handler did `data.heroes.length` on the return of
  `Saves.saveData()`, but `saveData` returns `undefined` on write failure (after showing its own `Dialog.error`) —
  so a failed save threw a TypeError instead of stopping cleanly. Added `if (!data) return;`. Also added the
  missing `ItemsTab` to the `/* global */` directive (used at `ItemsTab.redraw()`; not lint-flagged because
  `no-undef` is off, but the dependency comment was inaccurate).
- **importer.js — stale user-facing string modernized (×4):** the gear-parse error told users to install "64-bit
  version of Java 8" — wrong on two counts (the app now bundles Java 25, and a `JSON.parse` failure on the gear
  file isn't a Java issue). Reworded to _"Error occurred while parsing gear. The file may be corrupted or
  incomplete. Try re-exporting or re-scanning your gear."_ It's a translated i18next key, so per the user's choice
  ("Modernize EN, log the rest") the key was also updated in `locales/en` + `locales/en-US` translation.json. The
  6 non-English locales (fr, ja, ko, ru, zh, zh-TW) still hold the now-orphaned old "Java 8" key and will fall
  back to the new English for this one string until re-translated — **logged as a known item** (see New Bugs.md).
- importerTab.js: confirmed intentional no-op stub (`{ initialize: () => {} }`) — no changes.

Cross-file pass: contracts consistent. importer.js (`globalThis.Importer`) drives the tab and calls
`Scanner.start/end` (scanner.js) + `Saves.autoSave` (saves.js); both resolve. All three of importer.js / saves.js
(and scanner.js's converter path) funnel imported gear through `ItemAugmenter.augment(items)` consistently before
`Api.merge/add/setItems`. importer.js + saves.js share the same `@electron/remote` dialog/currentWindow pattern
and the identical antivirus/OneDrive save-failure `Dialog.error` copy. `node --check` + ESLint clean on all 4; EN

- en-US translation.json re-validated as parseable, new key present, old key gone; no BOM anywhere.

---

## 3. Hero Tab folder — 2-file review + cross-file pass — 2026-06-19

Frontend `4. JS\3. Hero Tab\` (2 files); no rebuild (renderer source). Files: heroesTab.js (629, controller),
heroesGrid.js (1181→1132, the roster + builds AG-Grids). No correctness bugs found — mostly lint/dead-code/BOM
cleanup + debug-log gating to bring both to the established bar.

- **heroesGrid.js — dead code removed:** `navigateToNextCell` (~49-line function) was unused — the grids use
  `GridRenderer.arrowKeyNavigator` instead; it was kept alive only by a `// eslint-disable-next-line
no-unused-vars`. Deleted it + its commented-out `// navigateToNextCell: …bind(this)` option ref. That made the
  `KEY_DOWN`/`KEY_UP`/`KEY_LEFT`/`KEY_RIGHT` + `optimizerGrid` globals unused (only it referenced them), so they
  were dropped from the `/* global */` directive too.
- **Debug logging gated (both files):** added the `_optDbg` (`window.__optDebug`) helper and routed ~28
  `console.log` debug calls in heroesTab.js and ~13 in heroesGrid.js (plus a debug `console.warn('modding', …)`)
  through it. Kept all real `console.error` catch-path logging. (Did the `replace_all` of `console.log(`→`_optDbg(`
  BEFORE adding each helper so the helper's own `console.log` couldn't be corrupted — the itemsTab recursion
  lesson, see [[feedback_optdbg_replace_all_pitfall]].)
- **Lint/format:** removed stale `eslint-disable` directives — 2 block disables (heroesTab `no-console` +
  `@typescript-eslint/no-use-before-define`), 1 block disable + 3 `no-use-before-define` next-line disables
  (heroesGrid); removed unused `Grid` from heroesGrid `/* global */`; fixed an unused `catch (e)` →
  optional-catch `catch {`; removed a broken `// valueFormatter: numberFormatter` comment (the symbol doesn't
  exist — same dead ref cleared from the other grids) and a stray `// })`. **Stripped BOM on heroesGrid.js**
  (heroesTab had none). `node --check` + ESLint clean on both.
- **Consistency (G4):** converted both `Math.max(...arr)`/`Math.min(...arr)` spreads in heroesGrid's aggregate
  functions (`updateCurrentAggregate`, `updateHeroesAggregate` — the latter runs over the FULL roster) to
  `reduce`, matching the documented call-stack-overflow fix in optimizerGrid/fribbelsGrid.

Cross-file pass: contracts consistent. inputHandler registers `globalThis.HeroesTab` (`.default`) +
`globalThis.HeroesGrid` (module namespace — heroesGrid uses named exports, no default). heroesGrid's 13 named
exports cover every `HeroesGrid.*` call in heroesTab; heroesTab's `getUseReforgedStats`/`isExternalFilterPresent`/
`doesExternalFilterPass`/`redraw`/`refreshSearchDatalist` cover every call from heroesGrid. uuid imported via the
canonical `import { v4 as uuidv4 }`; heroesGrid `renderSets` uses the canonical `Constants.piecesBySetIndex` /
`setsByIndex` (24-set data verified aligned in the 3. Gear sweep). Kept the dormant `// suppressNavigable` /
commented optional-column markers (consistent with the other grids).

---

## 1. HTML folder — app.html review — 2026-06-19

Frontend `1. HTML\app.html` (7565 lines, ~302 KB; the folder's other files are binary PNG assets). Reviewed the
single-page renderer HTML — **no changes needed, it's clean and well-maintained.**

- **Resource links sound:** `<head>` links current libs (jQuery via require, i18next + 4 backends, rangeslider-js,
  fontawesome, **multiple-select** — chosen is fully gone, pretty-checkbox, ag-grid ×4 themes, animate.css, tippy)
  - the local `2. CSS` files; darktheme.css is `disabled` and toggled at runtime. No `chosen`/`mainStatFixer` or
    other stale references.
- **No duplicate element IDs:** 798 `id=` attributes, all unique (an initial scan flagged 24 "dupes" but they were
  `data-id="atk"` etc. on the priority-step buttons — data attributes, legitimately repeated — not element IDs).
- **Script loading verified:** head libs, then at end-of-body the Gear-Analysis globals
  (`constants/epicSevenGearConstant.js`, `constants/archetypeRules.js`, `gearScorer.js`, `gearAnalysisTab.js`) then
  `require('../renderer.dev.js')`. All 4 Gear-Analysis files exist on disk (script refs resolve).
- **Comments:** 37 HTML comments, all legitimate descriptive/structural markers (`<!-- Tab N -->`, section labels,
  "populated by JS", one "legacy — kept for Escape/close hook") — no commented-out dead markup.
- **No BOM.** Good a11y baseline (skip-link, `sr-only` h1, aria-labels). No HTML linter is configured in the
  project (lint-staged routes `.html` through Prettier only), so no lint pass applies.

**Architecture note (for the `7. Gear Analysis Tab` sweep):** that tab's JS is loaded as plain `<script>` globals
here (NOT bundled via webpack/inputHandler), which is why it uses script-tag globals like `ARCHETYPE_RULES` /
`OFFICIAL_ARCHETYPE_RULES` rather than ES imports.

---

## 2. CSS folder — style.css review + folder completion — 2026-06-19

Frontend `2. CSS\` (5 files). The other 4 (app.global.css, awn.css, darktheme.css, rangeslider.css) were
reviewed on 2026-06-17 (chosen.css deleted then); this pass covered the last remaining file, **style.css**
(4133 lines, ~80 KB), and re-verified the folder holistically. No code changes — style.css is clean.

- **style.css reviewed, no changes.** It's the app's own main stylesheet (custom, actively maintained — header
  documents a removed remote Google-Fonts `@import`; fonts are self-hosted via @fontsource), linked directly in
  app.html. Parses valid (rules-free stylelint = 0 syntax errors; it's the live stylesheet). No BOM. Comments are
  all accurate descriptive section headers + dark-mode reminders ("NOTE: add … dark overrides in darktheme.css").
  Only 2 trivial comment artifacts, both left as-is: a Stack-Overflow source-link (L2620) and one dormant
  `/*color: #00adff; blue*/` alternative-value marker (L3584). No dead/commented-out rule blocks, no TODO/FIXME.
- **app.global.css confirmed live (not orphaned):** loaded via the webpack `import './app.global.css'` path
  (present in renderer.dev.js), not the app.html `<link>` list — unlike the deleted chosen.css.
- **No BOM** on any of the 5 CSS files.

**stylelint config FIXED — 2026-06-19** (config/deps change, separate from 2.CSS content): the project's stylelint
config was broken — it extended the deprecated `stylelint-config-prettier`, which nulls stylistic rules that
stylelint 16/17 removed, so `npx stylelint` aborted with 1100+ "Unknown rule" errors before linting anything.
Fix applied to `1. App/package.json`: removed `stylelint-config-prettier` from the `stylelint.extends` array AND
from devDependencies, and dropped the removed `--syntax scss` flag from both the `lint-styles` script and the
`lint-staged` `*.{css,scss}` hook. Ran `yarn install --mode=skip-build` (pruned the dep + updated yarn.lock;
the YN0060/YN0086 @babel/core peer warnings are the known non-blocking ones). Verified: `npx stylelint` now runs
(0 "Unknown rule"; reports real violations). No app rebuild needed — stylelint is dev-only tooling, not in the
renderer/backend build.

**CSS `--fix` cleanup applied — 2026-06-19 (user chose: all 5 files):** ran `stylelint --fix` on all 5 CSS files
(~575 auto-fixable violations resolved in style.css; cosmetic only — url quotes, empty-line-before-comment, hex
shortening). Verified no BOM introduced and awn.css's customized colors preserved (2d5e15 / 0d4d6e / 7a4000 /
595959 / a92019 all intact — `--fix` never changes color values). Also manually fixed what `--fix` couldn't:

- **BUG (fixed): invalid `background` on the dark-mode toggle** (style.css `input:checked + .darkSlider::before`) —
  its night-state `url(../3. ASSETS/1. PNG/1. App/3. Misc/night2.png)` was UNQUOTED with spaces in the path →
  invalid CSS, so the night image (which DOES exist on disk) wasn't rendering. Quoted the url. Also collapsed an
  accidental TRIPLICATE `transform: translateX(22px)` in the same rule.
- Collapsed 5 more accidental identical duplicate declarations (`transition` ×4 in style.css, ×1 in rangeslider.css).

**stylelint-0 ACHIEVED — 2026-06-19 (user: "fix it all up"):** tuned the package.json `stylelint` config to the
codebase's conventions and modernized the deprecated declarations, bringing all 5 CSS files to **0 stylelint
problems** (`npx stylelint` over all 5 = exit 0):

- Config `rules`: `selector-class-pattern: null` + `selector-id-pattern: null` — the app uses **camelCase**
  selectors by design, so config-standard's kebab-case demand is wrong here; nulling them clears 497 violations
  WITHOUT renaming anything. `no-descending-specificity: null` — noisy advisory; "fixing" it means reordering rules
  (cascade-regression risk), so it's disabled (common practice).
- Modernized the 6 deprecated-but-working declarations (real fixes, not rule-suppression): `word-break: break-word`
  → `overflow-wrap: break-word` (style.css ×2, awn.css ×2) and `clip: rect(0 0 0 0)` → `clip-path: inset(50%)`
  (style.css `.switch-label` + `.sr-only` — equivalent modern visually-hidden). Behaviour-equivalent in Electron/Chromium.
  No BOM; awn.css customized colors still intact. The `2. CSS` folder is now both content-reviewed AND stylelint-clean.

---

## 2. Fribbels Hero Library folder — 3-file review + cross-file pass — 2026-06-19

Frontend `4. JS\1. Optimizer & Multi-Hero Optimizer Tab\1. Optimizer\2. Fribbels Hero Library\` (3 files); no
rebuild (renderer source). Files: fribbelsPriorityFilter.js (community-build scoring), fribbelsGrid.js (470,
library AG-Grid), fribbelsLibrary.js (969, panel controller — fetches community builds from the Fribbels AWS
endpoint). Modern, well-commented; no bugs found.

- **DEAD CLUSTER DELETED: fribbelsPriorityFilter.js (~189 lines).** `MAX_MAIN_STATS` (table) + the entire
  "Equalized max rolls" section (`computeEqualizedMaxRolls`) + `computeGearStats` — all exported but **never
  consumed anywhere** in the codebase (confirmed by codebase-wide grep). A self-contained chain:
  `MAX_MAIN_STATS` used only by `computeEqualizedMaxRolls`, used only by `computeGearStats`, used by nothing —
  a cut/never-wired "gear stats" reference-display feature. **User approved deletion.** Removed the two sections,
  `computeGearStats`, and their 3 entries in the default export object; all within one file, no cross-file edits.
  Everything else (GEAR_CONSTANTS, computeSetBonuses, computeBsStats, bsScore, calculateBuildScore,
  computePrioritiesFromRow, computeSkillValue, computeRowStats, computeMedian/StatSummary/P50Row) is live and
  untouched. (Note: the dead `computeEqualizedMaxRolls` also carried an atk/def/hp-vs-spd `/6` normalization
  asymmetry — moot now that it's removed.)
- **Consistency fix: fribbelsGrid.js `aggregateCurrentHeroStats`** used `Math.max(...vals)`/`Math.min(...vals)`
  spread; its near-identical sibling `optimizerGrid.aggregateCurrentHeroStats` deliberately uses `reduce`
  (the documented G4 call-stack-overflow fix). Aligned this copy to the reduce pattern + added a comment citing G4.
- **Verified clean, no changes:** fribbelsLibrary.js (DI wiring, set-key maps, fetch/process/filter/summary/
  priority paths — comments accurate; `globalThis.FribbelsLibrary` self-registered for OptimizerGrid's live
  calc-column refresh). All 3 files `node --check` + ESLint clean; no BOMs.

Cross-file pass: contracts consistent. fribbelsPriorityFilter imports `ROLL_DIVISORS` (rollDivisors.js) and is
consumed by fribbelsLibrary (computeRowStats/computeBsStats/bsScore/calculateBuildScore/computeStatSummary/
computePrioritiesFromRow/computeMedian). fribbelsGrid exports `FribbelsGrid` + `rowKey` → consumed by
fribbelsLibrary; fribbelsGrid calls `globalThis.OptimizerGrid.decorateCalcFields/getLoadedHeroCrp`.
`FribbelsLibrary` is init'd by optimizerTab.initialize (passing recalculateFilters/updatePriorityWeightBar/
getCurrentHero) and its full public API (restorePresetRow/getSelectedRow/resetForHeroChange/refreshCalcColumns/
initGrid/getLoadedHeroName/loadData) is consumed across optimizerTab + optimizerGrid; `globalThis.FribbelsLibrary`
self-registered. **Observation (not a bug):** the Fribbels set-key→name map (`FRIBBELS_SET_KEY_TO_GAME_NAME`) is a
4th copy of the `set_X → XSet` mapping (alongside itemAugmenter `SET_KEY_TO_NAME`, scanner `setsByIngameSet`,
enums `setEnum`) — each serves a distinct external format and they're mutually consistent; centralizing is optional.

---

## 1. Optimizer folder — 4-file review + cross-file pass — 2026-06-19

Frontend `4. JS\1. Optimizer & Multi-Hero Optimizer Tab\1. Optimizer\1. Optimizer\` (4 files, ~8,400 lines);
no rebuild (renderer source). Files: rollDivisors.js (set metadata + JS fast-reject), priorityFilter.js (1830,
scoring/ranking engine), optimizerGrid.js (924, results AG-Grid), optimizerTab.js (5547, main controller).
This folder is the optimizer core and was clearly maintained carefully — modern, lint-clean, with extensive and
accurate "why" comments (G1–G8 / #16–#19 fix annotations). No bugs found; the changes are dead-code + comment
hygiene only.

- **Dead code removed:** priorityFilter.js `_NO_FREE_FORMATS` (`new Set([1,5])`) — defined, never referenced; an
  unwired optimization stub. ESLint didn't flag it because the `_` prefix matches the config's
  `varsIgnorePattern: '^_'`, so it was invisible dead code. Removed (kept the used `_OTHER_SET_GROUP`).
- **Dead comment removed:** optimizerGrid.js `// valueFormatter: numberFormatter` — `numberFormatter` doesn't
  exist anywhere (same broken commented ref removed earlier from itemsGrid). Kept the valid `// suppressNavigable`
  / `// dac` markers (toggleable option / real disabled column).
- **Comment fixes (optimizerTab.js):** completed a comment truncated mid-sentence above
  `applySetRequirementPreFilter` ("…given the" → "…given the active set format and required sets — shrinks the
  permutation space before the backend search."); added the missing `Constants` global to the `/* global */`
  directive (used at lines 123 + 5108/5115 but undeclared — harmless under `no-undef: off`, but the directive
  should be complete).
- **Verified clean, no changes:** rollDivisors.js (conservative fast-reject that intentionally over-estimates
  ceilings so it never wrongly rejects gear; `SETS_BY_INDEX` 24-set order matches enums.js + the Java enum;
  `SET_PIECES_BY_INDEX` matches constants.js `piecesBySetIndex`). priorityFilter.js (cache-hash self-invalidation,
  9-roll budget normalization, mod-variant relevance pruning, `[bscr]` verbose breakdown — all accurate). The
  `_optDbg` helper in optimizerTab.js correctly calls `console.log` (NOT recursive — unlike the itemsTab bug);
  confirmed via the codebase-wide scan during the Gear Tab pass.

Cross-file pass: all contracts consistent. rollDivisors exports all consumed (`ROLL_DIVISORS`→priorityFilter/
heroGearMatcher/archetypeScorer; `GEAR_MAXES`→enhancingTab; `SET_INDEX`/`SET_ABBR`→priorityFilter;
`applyAllFastRejects`/`SETS_BY_INDEX`/`SET_PIECES_BY_INDEX`/`FOUR_PIECE_SETS`/`TWO_PIECE_SETS`→optimizerTab).
`OptimizerTab`/`OptimizerGrid`/`PriorityFilter` imported + globally registered in inputHandler.js.
`PriorityFilter` ⇄ `OptimizerGrid` ⇄ `OptimizerTab` mutual calls all resolve; priorityFilter reuses
`ModificationFilter.enumerateModCandidates` (the single-source-of-truth shared with apply()). **Verified in sync:**
priorityFilter `getRequiredSets` and optimizerTab `applySetRequirementPreFilter` use identical per-set-format
unions (fmt 1→s[0,1] · 2/3→s[0] · 4→s[0,1] · 5→s[0,1,2]) — the "keep the two in sync" comment holds.

---

## 3. Gear folder — 8-file review + 1 deletion + cross-file pass — 2026-06-19

Frontend `4. JS\2. Gear & Enhancing Tab\3. Gear\` (8 files); no rebuild (renderer source). Full read of each →
fix → lint-clean (ESLint 0) → BOM strip → log. Files: constants.js (512), enums.js, reforgeConstants.js,
flatStatCalibration.js, mainStatFixer.js (DELETED), itemSerializer.js, itemAugmenter.js, reforge.js (972).

- **BUG (fixed): itemSerializer.js `deserialize` constructed `Item` with 10 positional args, but `Item` takes a
  single params object** (`function Item(params)` in models/item.js — `this.gear = params.gear; …`). So
  `params = element.gear` (a string) and every field on the rebuilt item was `undefined` — fully broken
  deserialization. Fixed to `new Item({ gear, rank, set, level, enhance, main, substats, name, heroName,
otherworldly })`. Latent because `deserialize` is currently never called (see flagged below); the live
  `serialize` (used by scanner.js) and `buildStat`→`Stat` (7 positional args, matches the class ctor) were both
  fine.
- **DEAD MODULE DELETED: mainStatFixer.js (122 lines).** Wired as `globalThis.MainStatFixer` but `.fix()` was
  never invoked anywhere (confirmed across the whole Source tree incl. bundle). Also written against an older
  stat-naming convention (`isCritChance`/`isCritDamage` test `'CriticalHitChance'`/`'CriticalHitDamage'` — the
  codebase uses the `…Percent` suffix — so crit main-stat fixing would have silently no-op'd if ever wired).
  **User approved deletion.** Removed the file + its import and `globalThis.MainStatFixer =` registration in
  `6. Shared\1. Core\inputHandler.js` + its `var MainStatFixer: any;` declaration in
  `5. TS\1. TS\globals.d.ts`. inputHandler.js re-verified `node --check` + ESLint clean; no dangling refs in source.
- **Modernization: itemAugmenter.js `const { v4: uuidv4 } = require('uuid')` → `import { v4 as uuidv4 } from
'uuid'`.** It was the lone file using CommonJS for uuid in an ES module; heroesTab.js + modificationFilter.js
  already use the ESM import. Behaviour identical (babel/webpack).
- **Lint/format:** stripped BOM on constants.js (only file in the folder with one); normalized 4 misaligned set
  entries in enums.js (`WARFARE`/`PURSUIT`/`FERVOR`/`WEAKENING` had extra spaces vs the other 19). `node --check`
  - ESLint clean on all 7 remaining files.
- **Verified sound, no changes:** reforgeConstants.js, flatStatCalibration.js (localStorage cache + old→new
  format migration + calibrate/reset wired to settings.js; event dispatch confirmed), reforge.js (data tables +
  reforge math; correctly uses the imported `plainStats` ARRAY with `.includes()`; `== null` idiom passes
  eqeqeq), constants.js (24 sets `setsByIndex` ↔ 24 `piecesBySetIndex` aligned; `Sets` import from enums valid),
  enums.js (all 5 exports consumed + globally registered).
- **Whole-folder comment pass (2026-06-19):** reforge.js — corrected the level-88 main-stat comment (it
  claimed "Attack/Health/Defense differ from level 85", but **Defense is 310 in both tables**; only Attack
  525→515 and Health 2835→2765 differ, and the %/Speed mains are identical) and removed a stale commented-out
  `if (!isReforgeable(gear)) … else` block in `augmentMaterial` (the active `if` already stands alone — no
  behaviour change). constants.js — reworded the misleading header ("isn't used as much as it should be" read as
  underused; it's actually referenced widely — changed to consolidation guidance). Other files' comments verified
  accurate (itemAugmenter `SET_KEY_TO_NAME`-mirrors-scanner note, flatStatCalibration JSDoc, enums/constants
  set-index notes); no comment anywhere in the folder references the deleted mainStatFixer.

Cross-file pass: contracts consistent. constants.js→`globalThis.Constants = require(...).default`; enums.js
5 exports all imported + registered (Gears/Sets/Ranks/Stats/Heroes); reforgeConstants→reforge import;
flatStatCalibration→itemSimulator/archetypeScorer/settings; reforge methods (`isReforgeable`, `getReforgeStats`,
`augmentMaterial`, `calculateMaxes`, `unreforgeItem`, `isReforgeableNow`) all present and consumed;
`ItemAugmenter.augment` used at 11 sites (importer×4, saves, optimizerTab, htmlGenerator, itemsTab×2, dialog×2);
itemAugmenter `SET_KEY_TO_NAME` ↔ scanner `setsByIngameSet` confirmed in sync (spot-checked the 7 newest sets).
**Resolved prior flag:** the `Reforge.*` cross-folder dependency flagged in the Enhancing Tab pass is satisfied —
`Reforge.calculateMaxes`/`isReforgeable` exist here; the `reforgedWss`/`wss` fields enhancingTab reads are
**backend-computed** (returned in the optimization response — never assigned in frontend JS, by design).

Observations (not bugs, flagged for later):

- **itemSimulator.js (Enhancing Tab folder) duplicates reforgeConstants tables locally** (`plainStats`,
  `plainStatRollsToValue`, `critDamageRollsToValue`, `speedRollsToValue`) instead of importing them — and its
  local `plainStats` being a `new Set` (vs the exported array) is exactly what caused the `.includes` bug fixed
  in the Enhancing Tab pass. Recommend importing from reforgeConstants to remove the drift.
- **itemSerializer.js `deserialize` + `serializeToArr` are currently uncalled** (only `serialize` is live). Kept
  (deserialize is the natural inverse of the live serialize, now correct) but candidates for pruning if the
  round-trip path stays unused.
- **enums.js `Heroes`/`Ranks`/`Stats` globals may be vestigial** (registered, but `Heroes` is a 1-entry Angelica
  stub) — verify readers when `6. Shared` / global-usage is swept.

---

## Enhancing Tab folder — 3-file review + cross-file pass — 2026-06-19

Frontend `4. JS\2. Gear & Enhancing Tab\2. Enhancing Tab\` (3 files); no rebuild (renderer source). Full read
of each → fix → lint-clean (ESLint 0) → BOM strip → log. Files: enhancingTab.js (echarts gauge/bar/GS/bars
panels), gearRating.js (thin ArchetypeScorer/ArchetypeStore wrapper), itemSimulator.js (25k-iteration Monte
Carlo enhancement simulator).

- **BUG (fixed): `Set.includes` is not a function — itemSimulator.js `applyReforgeBonus`.** `plainStats` is a
  `new Set([...])` but was queried with `plainStats.includes(substat.type)` (Set has `.has()`, not `.includes()`).
  This throws a `TypeError` every time `applyReforgeBonus` runs — i.e. for **any reforgeable item** (the common
  case; `Reforge.isReforgeable` is true for lv85 epic gear), which aborts the whole `simulate()` and blanks the
  Enhancing-tab GS chart. Fixed to `plainStats.has(substat.type)`. (Almost certainly introduced when the array
  was modernized to a Set without updating the call site.)
- **BUG (fixed): simulator could roll duplicate substats on Weapon/Helmet/Armor.** `possibleSubstatsByGear`
  takes a `substatTypes` (already-rolled types) param and Necklace/Ring/Boots filtered it out via
  `.filter((x) => x !== item.main.type && !substatTypes.includes(x))`, but Weapon/Helmet/Armor returned their
  pools **unfiltered**. E7 gear can't have duplicate substat types, so for non-Epic pieces (which have empty
  substat slots at low enhance → multiple random picks) the sim could assign the same type twice and skew the
  GS distribution. Applied the identical filter to all six slot types (W/H/A's fixed flat main isn't in their
  pool, so the `main.type` clause is a harmless no-op there; the dedup clause is the fix).
- **Dead code removed:** enhancingTab.js `calculateScoreTotals` (~25 lines) — defined, never called (only a
  commented-out `// var scores = calculateScoreTotals(item)` reference), and carried a mis-targeted
  `// eslint-disable-next-line @typescript-eslint/no-unused-vars` (that rule is off; the base `no-unused-vars`
  was the one flagging it). Removed function + directive.
- **Debug logging gated:** added the `_optDbg` (`window.__optDebug`) helper to enhancingTab.js and routed its 5
  `[EnhancingTab] …` / `redraw` debug `console.log`s through it. Kept the `console.error(e)` catch path.
- **Junk removed:** enhancingTab.js gauge-series had a leftover debug tooltip `formatter(value){ return
`asdffsd${value}`; }`. Removed only the formatter, **kept `tooltip: { trigger: false }`** — that flag
  suppresses the gauge's tooltip (overriding the chart-level `tooltip.formatter`), so dropping the whole block
  would have made the gauge start showing a tooltip on hover.
- **Lint/format:** removed stale `/* eslint-disable no-console */` (enhancingTab.js) and unused `i18next` from
  gearRating.js `/* global */`. Stripped BOM on gearRating.js (enhancingTab/itemSimulator had none).
  `node --check` + ESLint clean on all 3.
- **Whole-folder comment pass (2026-06-19):** enhancingTab.js — removed a large dead commented-out scratch block
  in `redrawEnhanceGuide` (old speed-max `console.warn` debugging + replaced `statsLeft/statsRight` DOM rendering,
  including a `// var scores = calculateScoreTotals(item)` line referencing the function deleted in the per-file
  pass); removed dead commented-out code in `initialize` (`// ItemAugmenter.augment([item])` + a double-commented
  `tab2label` listener referencing the obsolete `module.exports` pattern) and the commented-out `setItem` method
  stub; removed an obsolete `// option.yaxis.labels.formatter …` line (ApexCharts API — this file uses echarts).
  Kept the live chart-deferral explanation and the dormant `// position:` alternative-layout hints in buildBars
  (valid alternatives, not inaccurate). itemSimulator.js — corrected the `else`-branch comment (was "Normal gear
  (all rolls) and otherworldly base drop (j=0)" but otherworldly short-circuits the first branch, so this path is
  standard non-otherworldly percent/crit/speed rolls only) and documented the now-uniform dedup filter in
  `possibleSubstatsByGear` (excludes main-stat type + already-rolled types). gearRating.js — no comments to audit.

Cross-file pass: contracts consistent — enhancingTab→`ItemSimulator.simulate` (`{gsArr, moddedGsArr}`) +
`getSimulationN()`; enhancingTab→`GearRating.rate` (`[{id,name,score}]`); gearRating→`ArchetypeScorer.scoreAllArchetypes(item, archetypes)`

- `ArchetypeStore.getArchetypes/saveArchetypes` + `DEFAULT_ARCHETYPES` import; itemSimulator→`FlatStatCalibration.getWeights()`
  (`{atk,hp,def}`) with the `flatStatCalibrationChanged` re-calibration event verified dispatched (flatStatCalibration.js:119/139)
  and listened (itemSimulator.js:175). All three modules imported + globally registered in inputHandler.js
  (EnhancingTab also `.initialize()`d). **Flagged (cross-folder dep, verify in `3. Gear` sweep):** enhancingTab +
  itemSimulator depend on `Reforge.calculateMaxes` / `Reforge.isReforgeable` and the `reforgedWss` / `reforgedMax`
  fields Reforge sets — `Reforge` and `FlatStatCalibration` live in the sibling `3. Gear` folder.

---

## Gear Tab folder — 6-file review + cross-file pass — 2026-06-17

Frontend `4. JS\2. Gear & Enhancing Tab\1. Gear Tab\` (6 files); no rebuild (renderer source). Full read of
each file → fix → lint-clean (ESLint 0) → BOM strip → log. Files: forceFilter.js, heroGearMatcher.js,
locator.js, modificationFilter.js (564), itemsGrid.js (718), itemsTab.js (895). All logic verified sound;
the substat-mod variant engine, force-filter AND/OR modes, hero-gear matcher scoring, and in-game locator
are correct.

- **BUG (fixed): stale `getBaseStatsByStars` call signature in itemsGrid.js (drawPreview).** Called
  `HeroData.getBaseStatsByStars(item.equippedByName, true, 6)` but the current signature is `(name, stars)`
  — `true` landed in `stars` and the `6` was silently dropped. Behavior was accidentally correct (`true === 5`
  is false ⇒ the 6-star branch runs, which is what the preview wants), but it's a leftover from a signature
  refactor (`true` was once a `fullyAwakened` flag) and the 5-star path was unreachable. Fixed to
  `getBaseStatsByStars(item.equippedByName, 6)`. ~~**Flagged, not fixed (out of folder):** the identical stale
  call exists in `7. Gear Analysis Tab\gearAnalysisTab.js:860`~~ → **FIXED 2026-06-19** (see the gearAnalysisTab.js
  entry at the top of this log).
- **Dead code removed:** itemsTab.js `VALID_MAIN_STATS` (per-slot main-stat table, ~21 lines) was defined,
  never referenced, and not exported — an unwired "for gear-aware stat filtering" stub. Removed (recoverable
  here if that feature is ever wired up).
- **Debug logging gated:** added the `_optDbg` (`window.__optDebug`) helper to itemsTab.js (routed all 13
  `[ItemsTab] …` / "Updated filters" `console.log` debug calls through it) and to modificationFilter.js (gated
  the `[MOD] pruned … variant(s)` diagnostic). Kept legit `console.error`/`console.warn` error paths.
- **Lint/format:** removed leftover `console.log('!!! itemsGrid', …)` debug line; removed unused `Grid` from
  itemsGrid.js `/* global */`; removed 7 stale `eslint-disable` directives across the folder
  (`@typescript-eslint/no-use-before-define` + `no-console` in itemsGrid/itemsTab/modificationFilter, the unused
  `/* global $ */` in forceFilter, the `no-console` disable in heroGearMatcher, and 2 `no-underscore-dangle`
  next-line disables on `element._tippy` in locator). Stripped BOMs where present. `node --check` + ESLint clean
  on all 6.

Cross-file pass: all mutual contracts consistent — itemsTab↔itemsGrid (`refreshFilters(filters)`, async
`redraw`, `getSelectedGear`, `editedItem`; `isExternalFilterPresent`/`doesExternalFilterPass` callbacks),
itemsGrid→`HeroGearMatcher.applyCurrentScores`, itemsTab→HeroGearMatcher (set/save/load/getDefaultConfig),
heroGearMatcher→`HeroData.getBaseStatsByName` + `ROLL_DIVISORS` import, locator→`Constants.ingameStatToStatType`,
modificationFilter `enumerateModCandidates` reused by priorityFilter. External globals verified present +
registered (ArchetypeScorer, ArchetypeStore, HeroData, Constants, Settings). substatFilter is intentionally an
external filter (handled in itemsTab `passesSubstatFilter`, not an AG-Grid column filter — the empty `if` block
in itemsGrid is documented as such).

### Whole-folder comment pass + holistic re-review — 2026-06-19

(This folder was swept first, before the comment-maintenance rule. Re-passed for comment accuracy + dead-code
hygiene, which surfaced a real bug the original pass introduced.)

- **BUG (fixed): `_optDbg` infinite recursion in itemsTab.js.** The original sweep gated 13 debug logs by
  `replace_all` of `console.log(` → `_optDbg(`, which also rewrote the `console.log(...args)` _inside the helper
  body_ into `_optDbg(...args)` — so the logger called itself. Harmless while `window.__optDebug` is off (the
  `if` is false), but enabling debug mode makes the first `_optDbg(...)` call recurse until the renderer crashes
  (RangeError: max call stack). ESLint can't catch it (valid syntax). Fixed the helper body back to
  `console.log(...args)`. (Confirmed via codebase-wide scan that no other `_optDbg` helper has this — modificationFilter.js
  / enhancingTab.js / multiOptimizerTab.js all correctly call `console.log`.)
- **BUG (fixed): active junk in itemsGrid.js.** `Tooltip.displayItem('item1', 'asdf')` ran on every grid init —
  `Tooltip.displayItem(el, html)` calls `tippy('#'+el, { content: html })`, so this attached an "asdf" tooltip
  to `#item1`. Leftover test scaffolding (no shipped tooltip says "asdf"). Removed it + the now-unused `Tooltip`
  entry from the `/* global */` directive.
- **Dead commented-out code removed:** itemsGrid.js — 6 blocks: `// valueFormatter: numberFormatter` and
  `// {…cellRenderer: renderActions}` (both reference symbols that don't exist), the stale
  `// refreshFilters: (setFilter, …)` old signature, a redundant `// onRowSelected: onRowSelected`, the
  `// SAMPLE OR FILTER` scratch block, and the `// Testing purposes` / `// Reforge.calculateMaxes(...)` scratch
  (kept the active `Reforge.unreforgeItem(event.data)` — its `unreforged*` output is consumed by htmlGenerator's
  preview). locator.js — a commented-out alternative `filteredItems` filter. itemsTab.js — a dead
  `// setupClearListener("clearSubStatFilter", …)` line (the inline handler replaced it).
- **BOM:** itemsGrid.js had a **regressed BOM** (the original pass recorded none — re-added by an editor/tool
  save since); stripped again.
- **Verified clean, no changes:** forceFilter.js, heroGearMatcher.js, modificationFilter.js — comments accurate
  and valuable (the "why" notes on the removed force-filter early-return, the stack-safe `reduce`, the LRU caches,
  and the `enumerateModCandidates` single-source-of-truth contract all match current code). Kept valid optional
  markers (itemsGrid `// Mconf`/`// Material` disabled columns reference real fields). All 6 files `node --check`
  - ESLint clean.

---

## multiOptimizerTab.js — bug fix + debug gating + BOM/lint cleanup — 2026-06-17

Frontend `4. JS\…\2. Multi-Hero Optimizer Tab\multiOptimizerTab.js` (1480 lines); no rebuild. Full read of
the multi-hero optimizer (per-card grids, parallel run queue, cross-hero gear exclusion). Well-structured —
the start-queue (PARALLEL_SLOTS=2), per-card executionId/progressTimer lifecycle, stack-safe aggregation
(reduce, cites the single-optimizer G4 fix), and getRows failCallback handling are all sound.

- **BUG (fixed): dead "same hero already selected" guard.** The hero-dropdown change handler compared
  `heroId === multiOptimizerHeroes[index].hero` (a string id vs the hero OBJECT) — always false, so the
  short-circuit never fired. Changed to `heroId === multiOptimizerHeroes[index].hero?.id`. (Low practical
  impact — a `<select>` doesn't fire `change` for re-selecting the same option — but the comparison was wrong.)
- **Debug logging gated:** added the `_optDbg` (`window.__optDebug`) helper and routed 11 ungated debug calls
  through it (8 `console.log` + 3 debug `console.warn`: heroes dump, `PERMUTATIONS:`, draw-preview, modded-gear,
  filter-response, row-selected, selected-row ×2, start-request, sending-request, response-received). Kept the
  `console.error` error paths and the legit validation-abort `console.warn`.
- **Lint/format:** stripped the UTF-8 BOM (re-encoded UTF-8 no-BOM), removed the unused `Grid` from
  `/* global */`, and removed the 2 unused `eslint-disable` directives (`@typescript-eslint/no-use-before-define`,
  `no-console`). `node --check` + ESLint clean.

Noted, not changed: `getRows` reads `heroId`/`optimizationRequest` from the single-optimizer DOM (`inputHeroAdd`)
but fetches results by the per-index `executionId` — the request fields are vestigial in the executionId-driven
result path (mirrors the single optimizer), so harmless. The `arrowKeyNavigator(this, …)` `this`-is-undefined is
the same app-wide legacy param noted for the other grids.

### Whole-file comment re-pass — 2026-06-19

Re-passed for comment accuracy + dead-code hygiene (the per-file bug-fix pass above predates the
comment-maintenance rule). No bugs; the file is modern and lint-clean.

- **Dead commented-out code removed:** 4 dead gridOptions handler lines — `// onRowClicked: onRowClicked`,
  `// onRowSelected: provideOnRowSelected(grid)` (a stale signature missing the `index` arg; the real wiring is
  post-creation at `grid.gridOptions.onRowSelected = provideOnRowSelected(grid, index)`), `// onCellMouseOver:
cellMouseOver`, `// onCellMouseOut: cellMouseOut` — the referenced `onRowClicked`/`cellMouseOver`/`cellMouseOut`
  handlers don't exist in this file. Kept the valid `// suppressNavigable` option marker and the `// dac` disabled
  column (consistent with optimizerGrid).
- **Verified:** the `_optDbg` helper correctly calls `console.log` (NOT the itemsTab recursion bug); the "why"
  comments (baseStats-on-editFilters fix, cross-hero self-exclusion fix, spread→reduce/G4, ag-grid v35
  `setGridOption('datasource')`, failCallback teardown) all match the current code. `node --check` + ESLint clean.

---

## Fribbels Hero Library — fribbelsLibrary.js + fribbelsPriorityFilter.js review + trio cross-file pass — 2026-06-17

Frontend `4. JS\…\2. Fribbels Hero Library\` (fribbelsLibrary.js 970 lines, fribbelsPriorityFilter.js 541);
no rebuild. Full read of both — no logic bugs.

- **fribbelsLibrary.js** (orchestrator: AWS community-builds fetch, filter/summary UI, apply-to-optimizer):
  removed unused `$` from `/* global */` (no jQuery used) + the unused `/* eslint-disable no-console */`
  (no-console is off; the console.error/warn error paths don't need it). Defensive event wiring (`?.`) and
  good fetch error handling already in place.
- **fribbelsPriorityFilter.js** (website-mirroring BS score / stat derivation / skill-damage math): removed
  the unused `/* eslint-disable no-console */` (no `console.*` in the file). Set-bonus stripping (incl. the
  Torrent −10% HP) and the bsScore weights (CR×1.6, CD×1.14, SPD×2) verified internally consistent.

**Trio cross-file pass** (fribbelsGrid + fribbelsLibrary + fribbelsPriorityFilter): all API contracts hold —
every `FribbelsPriorityFilter.*` (7) and `FribbelsGrid.*` (5) call exists on the exported object; the grid's
cross-module `OptimizerGrid?.decorateCalcFields`/`getLoadedHeroCrp` are accessed defensively and exist. Set
handling consistent: library + priorityFilter use the Fribbels-API `set_*` keys (bridged via
`FRIBBELS_SET_KEY_TO_GAME_NAME`); `FRIBBELS_FOUR_PIECE_SETS` covers the same 13 four-piece sets as the
optimizer's `FOUR_PIECE_SETS` (separate key namespace, intentionally). All three: `node --check` + ESLint clean.

---

## fribbelsGrid.js — review + lint cleanup — 2026-06-17

Frontend `4. JS\…\2. Fribbels Hero Library\fribbelsGrid.js` (325 lines); no rebuild. Full read — clean
AG-Grid setup for the Fribbels Hero Library panel (gradient cell coloring, column defs, idempotent init,
defensive global access via `globalThis.OptimizerGrid?.`). No logic bugs.

- Removed the unused `/* eslint-disable no-console */` directive (no-console is off in eslint.config.mjs; the
  one `console.error` in the gradient catch is a legit error path). `node --check` + ESLint clean.

Noted, not changed: `aggregateCurrentHeroStats` uses `Math.max(...vals)` spread (the same pattern hardened to
`reduce` in optimizerGrid's G4) — safe here since the library holds only tens–hundreds of community builds.

---

## Optimizer set-enum data centralized (cross-file refactor) — 2026-06-17

Frontend `4. JS\…\1. Optimizer\` (rollDivisors.js + optimizerTab.js + priorityFilter.js); no rebuild.
Holistic cross-file review of the 4-file optimizer module found the gear-set metadata **duplicated** across
files (and twice within optimizerTab) — a divergence risk if the Java `Set` enum ever reorders. Centralized
it into `rollDivisors.js` (the existing constants module, alongside `GEAR_MAXES`) as the single source of
truth, then pointed every copy at it. **No behavior change** (verified value-identical, see below).

- **rollDivisors.js:** added `SETS_BY_INDEX` (canonical enum order) + derived `SET_INDEX` (name→index),
  `FOUR_PIECE_SETS`, `TWO_PIECE_SETS`, `SET_PIECES_BY_INDEX`, `SET_ABBR`.
- **optimizerTab.js:** replaced the 5 duplicated local defs (`_SETS_BY_IDX`, `_SETS_PIECES_BY_IDX`,
  `_SETS_FOUR_PIECE`, and the second copies `fourPieceSets`/`twoPieceSets`) with aliases to the shared
  constants. This also fixes the prior `_SETS_PIECES_BY_IDX` 25-vs-24 off-by-one (derived array is now 24).
- **priorityFilter.js:** `_SET_ABBR` → shared `SET_ABBR`; and `calculateBuildScore` set-bonus accesses now use
  `s[SET_INDEX.AttackSet]` etc. instead of magic indices (`s[2]`…), so they auto-follow `SETS_BY_INDEX` if the
  enum changes.
- **Verified value-preserving:** evaluated the new exports — all 13 `calculateBuildScore` `SET_INDEX` lookups
  resolve to the exact previous indices; `SET_PIECES_BY_INDEX` and `TWO_PIECE_SETS` equal the old arrays.
  `node --check` + ESLint clean on all three.

Whole-module note: cross-file API contracts all verified (every `PriorityFilter.*`/`OptimizerGrid.*` call
exists on the exported object; globals wired via inputHandler.js); duplicated set-bonus _rates_ across
calculateBuildScore / applyAllFastRejects / estimatePriorityStats agree (differences are intentional by role).

---

## priorityFilter.js — full review + lint cleanup — 2026-06-17

Frontend `4. JS\…\1. Optimizer\priorityFilter.js` (~1860 lines); no rebuild. Full read of the scoring engine
(calculateScore / calculateRankScore / calculateBuildScore / estimatePriorityStats / applyPriorityFilters).
**No logic bugs** — the roll-normalization, set-bonus math (mirrors Java StatCalculator), target/sweet-spot/
rank-factor bonuses, score+rank caches with self-invalidating hashes/fingerprints, the 9-roll budget
normalization, and the set-aware bucketed per-slot cut (incl. the non-moddable keep-originals net) are all
internally consistent and carefully invalidated. Lint-only cleanups:

- Removed the unused `/* eslint-disable no-console */` + its paired `/* eslint-enable */` around the
  `calculateBuildScore(verbose)` debug block — `no-console` is `off` in eslint.config.mjs, and those
  `console.log`s only fire when `verbose` is passed (the optimizerGrid row-click caller is already gated
  behind `window.__optDebug`).
- Removed the dead `allows` helper in `estimatePriorityStats` (the accessory logic uses `accStatContrib`).

`node --check` + ESLint both clean (0 problems).

---

## optimizerTab.js — deep logic review (null-guard bug + cleanups) — 2026-06-17

Frontend `4. JS\…\1. Optimizer\optimizerTab.js`; no rebuild (renderer reloads on relaunch). Full
line-by-line read of all 5.6k lines. The file is well-engineered (M4 stale-run token, M6 in-flight guard,
M12 timer ordering, L5 hold-to-repeat teardown, promise-caching, quota eviction all correct). Found one
real latent bug + minor cleanups; `node --check` + ESLint both clean after.

- **BUG (fixed): dead null-guard in `loadPreviousHeroFilters`.** `const request = hero.optimizationRequest;`
  dereferenced `hero` BEFORE the `if (!hero) return;` guard on the next line — so a null `heroResponse.hero`
  (empty roster / no hero selected) threw a TypeError and the guard never ran. Moved `if (!hero) return;`
  above the dereference.
- **Robustness: `_applySlotFilterSliders` unguarded rangeslider deref.** `querySelector(...)['rangeslider-js']`
  would throw on a partially-built multi card; its sibling `_setSliderVal` already guards null. Added the
  matching `if (sliderEl?.['rangeslider-js'])` guard.
- **Debug leftovers gated:** two `console.warn`s that logged payloads on every action (`'skillOptions'`,
  `'Optimization filter response'`) → routed through the existing `_optDbg` (`window.__optDebug`) helper.
- **No-op removed:** `.filter(...).map((s) => s)` in `_applyArchetypeByName` — dropped the redundant map.

Noted, not changed (not bugs): `_SETS_PIECES_BY_IDX` (25) vs `_SETS_BY_IDX` (24) length mismatch is harmless
(guarded by the G7 `if (setName)` check); Force/Must-Have/score-floor inputs read non-indexed in
`getOptimizationRequestParams` is by-design (single-optimizer-only, confirmed by the `if (!index)` restore guard).

---

## optimizerTab.js — ESLint cleanup (dead code) — 2026-06-17

Frontend `4. JS\…\1. Optimizer\optimizerTab.js` (5662→5625 lines); no rebuild (renderer reloads on relaunch).
Review of this 5.6k-line core file: parses clean, no BOM, console logging already gated via `_optDbg`/
`window.__optDebug` (the 2 `console.log` hits are the helper body + a comment, not ungated). ESLint went
**18 warnings → 0**, all dead-code/mechanical (no behavior change):

- **5 unused `eslint-disable` directives** removed — 2 file-level (`@typescript-eslint/no-use-before-define`,
  `no-console`) + 3 inline `@typescript-eslint/no-unused-vars` that targeted the WRONG rule (that prefix is
  off; the real warning came from base `no-unused-vars`, so they suppressed nothing).
- **2 unused `/* global */` names** (`Reforge`, `Grid`) and **1 unused import** (`GEAR_MAXES`, kept
  `applyAllFastRejects`) removed.
- **3 dead functions** removed (`setSort4Piece`, `isFourAndTwoPieceSets`, `isTwoAndTwoAndTwoPieceSets` — only
  their definitions existed) + **1 unused local** (`const mainFilters = Selectors.getGearMainFilters()`).
- **2 write-only module vars removed with their writes:** `currentFilteredItems` (decl + its 1 write; memory
  M4 confirmed no readers) and `resized` (decl + 2 dead writes). For `resized`, KEPT the real behavior — the
  `ipc.on('resized', …)` handler still calls `fixSliders()`; only the never-read flag (`resized=true`/`=false`,
  set true→false synchronously) was stripped. Abandoned flag, not a working feature.
- **4 unused `catch (e/err/e2)` params** → optional catch binding `catch {` (carefully anchored — `catch (err)`
  appears 2×, `catch (e)` 10×; only the genuinely-unused ones were touched).

`node --check` passes; ESLint reports 0 problems.

---

## optimizerGrid.js — debug-log gating + BOM strip + lint cleanup — 2026-06-17

Frontend `4. JS\…\1. Optimizer\optimizerGrid.js`; no rebuild (renderer reloads on relaunch). Full review:
logic sound, parses clean, defensive error handling intact (the G1/G4/G6 audit guards), datasource live +
restored paths both `failCallback` correctly. No functional bugs — only leftover-debug/consistency cleanups
(same category as optimizerTab.js's L3 console gating):

- Gated `console.log('Aggregated', currentAggregate)` (fired on EVERY datasource fetch/scroll) behind
  `window.__optDebug` — matches optimizerTab.js's toggle.
- Gated the per-row-click build-score breakdown block (`PriorityFilter.calculateBuildScore(…, true)`, whose
  return value was discarded — it ran purely to log) behind `window.__optDebug`. Now it only recomputes when
  actively debugging in DevTools (kills console noise + a wasteful recompute on every result-row click).
- Stripped the file's UTF-8 BOM (`ef bb bf`) — its siblings (optimizerTab.js etc.) have none; harmless but
  inconsistent. Re-encoded UTF-8 no-BOM. `node --check` passes.
- Made the file fully ESLint-clean (ESLint 9+/flat config warns on unused-disable directives by default — this
  is what surfaced it): removed 2 unused `eslint-disable` directives (`@typescript-eslint/no-use-before-define`
  — rule not enabled in eslint.config.mjs; `no-console` — set to `off` there), dropped the unused `Grid` from
  the `/* global */` list, and converted the 4 unused `catch (e)` blocks to optional catch binding `catch {`.
  ESLint now reports 0 problems for the file (was 7 warnings).

Left intact: the `console.error` calls (legitimate error paths). Noted non-issue: `arrowKeyNavigator(this, …)`
passes `this` (undefined in ESM) — but every grid does this identically and nav works, so it's an app-wide
legacy param, not a bug here.

---

## 2.CSS holistic cross-file review — `a` link cascade bug — 2026-06-17

Frontend `2. CSS\` (style.css + app.global.css); no rebuild needed. Found by reviewing the folder as a whole
(load order: style.css link → darktheme.css link → **app.global.css injected last** by style-loader).

- **Bug: bare `<a>` links were `white` in every theme.** `app.global.css a { color: white }` (electron-react
  boilerplate default) is injected after both `<link>`s, so at equal specificity it overrode darktheme.css's
  `a { color: var(--link-blue) }`. Effect: **invisible** white-on-white links in light mode (e.g. Importer
  GitHub links, language toggles); white-not-blue in dark mode (why it went unnoticed — dark mode is the daily
  driver). Fix: app.global.css `a` → `color: var(--link-blue)`, and added `--link-blue: #0d6efd` to style.css
  light `:root` (accessible blue on white; darktheme keeps its brighter `#1e90ff` for dark backgrounds). Links
  are now correctly blue in both themes.

Verified no other cross-file collisions: `[body]` color resolves per-theme correctly (app.global only overrides
`font-family` to Arial over style.css's unloaded 'Overpass' — no visible effect); `[input]` darktheme only adds
dark colors; keyframes namespaced (`awn-*`); all var refs now resolve in both themes.

---

## style.css — light-mode --font-color fix + vestigial-var cleanup — 2026-06-17

Frontend `2. CSS\style.css` (4537→4521 lines; braces 731→728, balanced); no rebuild needed. Structural pass
was clean: balanced braces, 0 empty rules, 1 duplicate selector (fixed below), no broken `var()` except the
two undefined vars below.

- **Light-mode `--font-color` gap (real latent bug).** style.css's light `:root` defined `--input-color`,
  `--inactive-color`, `--bg-color` but NOT `--font-color` (that var only existed in darktheme.css). The app
  **defaults to light** (`darkmode.js: let dark = false`), so the 15 `var(--font-color)` uses with no fallback
  had no defined color in the default theme and only survived by inheriting `#333` from `body`. Fix: added
  `--font-color: #333;` to style.css `:root` — one line, fixes all of them, harmless to the 7 sites that already
  had `, #333` fallbacks, and dark mode still wins (darktheme.css `:root` overrides it later in the cascade).
- **Undefined theme vars `--color-primary` / `--color-secondary`** (used at old lines 3667/3681, defined
  nowhere in CSS or JS). Removed: the `.darkModeToggleContainer` `background: var(--color-secondary)` (was
  resolving to transparent anyway) and the two **dead** child rules `.darkModeToggleContainer h1` /
  `… button` (that container holds only a label+checkbox+span; the `<h1 class="sr-only">` is a sibling, not a
  child). Both vars now have 0 usages.
- **Merged the duplicate `.editGearStatLabel` block** (was defined twice — non-conflicting; consolidated
  `flex-shrink: 0` into the main block).

Not done: a full dead-_selector_ audit (cross-referencing every class against HTML + JS-generated classes) —
larger/error-prone, available as a separate pass on request.

---

## darktheme.css — removed dead .fribbels-builds-table rules — 2026-06-17

Frontend `2. CSS\darktheme.css`; no rebuild needed (rules matched nothing).

- Removed the 4 `.fribbels-builds-table` dark-mode rules (`th`, `td`, `tbody tr:hover td`,
  `tbody tr.fribbels-selected td`). Confirmed dead: the Fribbels builds list was migrated to an ag-grid
  (`fribbels-builds-grid` / `ag-theme-balham`), and `.fribbels-builds-table` appears nowhere — not in
  app.html, JS, or even style.css (this file was its only reference). 905→884 lines; braces 179→175 (still
  balanced); also cleared 2 of the file's 3 `!important`s.
- Rest of file verified clean: no undefined `var()` refs, all `:root` colors resolve, the 6 `--ag-*` vars
  are deliberate AG-Grid theme overrides (consumed by AG-Grid internally, not dead).

Left as-is (observations, not fixed): bare `.active` selector (line ~447) is broad — paints every `.active`
element with inactive-grey in dark mode (gear-analysis toggles, bottom tabs); likely meant `.collapsible.active`,
but possibly harmless — needs a visual check before touching. Also many newer `fribbels-*`/`mod-*` rules use
hardcoded hex instead of the `:root` vars (cosmetic, contrary to the file's own header rule).

---

## chosen.css removed (dead vendored lib) + manifest audit — 2026-06-17

Frontend `2. CSS\`; no rebuild needed (file was loading nothing).

- **Deleted `2. CSS\chosen.css`** (Chosen 1.8.7 jQuery-plugin stylesheet, ~12 KB). Confirmed orphan: not
  `<link>`ed in app.html, not imported in any TS/JS, no `.chosen()` calls, not in either package.json, and
  no `chosen*.js` library present — Chosen was replaced by `multiple-select` (which IS linked). The "chosen"
  hits in renderer.dev.js are just the English word in code comments.
- **Manifest completeness audit** (renderer `6. JSON\1. LOCK\2. JSON\package.json`, 26 deps): every runtime
  bare-import resolves to a declared dep, an Electron-runtime module, or a Node builtin — **nothing missing**.
  The lone flag `tinycolor2` is a false positive: it appears only in a comment + a type-only
  `declare module 'tinycolor2'` in `5. TS\1. TS\declarations.d.ts` (types for the declared `tinygradient`),
  so it correctly stays a transitive, not a direct dependency.

---

## app.global.css review — font + boilerplate-override fixes — 2026-06-17

Frontend `app.global.css` (`1. App/2. Frontend/1. Source/2. CSS/app.global.css`); no rebuild yet (sweep).
Note: this file is NOT `<link>`ed in app.html — it's imported by `index.tsx` and bundled into
`renderer.dev.js`, so style-loader injects it at runtime AFTER `style.css`'s `<link>`; equal-specificity
`body`/`h2`/`li` rules here therefore win the cascade over style.css.

- `body` font-family: generic fallback was `serif` behind an Arial/Helvetica (sans-serif) stack — wrong
  family class. Changed to `sans-serif` and quoted the multi-word `'Helvetica Neue'`.
- `h2 { color: #fff }` → `color: var(--font-color, #333)`. White headings were invisible in light mode;
  now theme-aware (dark theme sets `--font-color` #e2e2e2, light falls back to #333). Matches style.css's
  established `var(--font-color, #333)` pattern.
- Removed `@import '~@fortawesome/fontawesome-free/css/all.css'` (+ its boilerplate comment) — app.html
  already `<link>`s the same file (line 20), so Font Awesome was loading twice.
- Restored decimal numbering for the Importer tab's instruction `<ol>` steps, which the global
  `li { list-style: none }` reset had been suppressing. Scoped to `.importerWrapper ol li` (+ `ol`
  padding) so the global no-bullets reset is untouched for every other list.

Remaining observation (not changed): `a { color: white }` has the same light-mode-invisibility risk as the
old h2 rule, for links that fall through to the generic rule (e.g. importer GitHub links). Left as-is —
the tab-header links may intentionally rely on white-on-dark. Also `chosen.css` appears to be another
unlinked orphan (0 `<link>`s in app.html) — flagged for when the sweep reaches it.

---

## app.html review — markup cleanups — 2026-06-17

Frontend `app.html` (`1. App/2. Frontend/1. Source/1. HTML/app.html`); **no rebuild** (HTML loads on
relaunch). Full-file review: HTML parses with zero mismatched tags, `<div>` balance exact (838/838),
798 unique ids with no duplicates, all `<label for>` targets / inline handlers / script + CSS includes
resolve. Only minor leftover-markup issues found and fixed:

- Removed stray empty `id=""` on the "Weapons" `<text>` label in the Filter/Search details panel
  (the sibling Helmets/Armors/… labels carry no `id`, so this was a leftover stub).
- Stripped the invalid `type="text"` attribute from the 3 `<textarea>`s (scan/export outputs:
  `loadFromGameExportOutputText`, `loadFromGameHeroesExportOutputText`, `exportOutputText`). `textarea`
  has no `type` attribute; browsers silently dropped it.

Not changed (pre-existing legacy markup, renders fine — left as-is): 34 non-standard `<text>` elements
used as inline text, and the `value=""` no-ops on the textareas.

---

## Optimizer deferred refactors (cleared from New Bugs.md backlog) — 2026-06-16

All frontend JS (optimizerTab.js, multiOptimizerTab.js); **no rebuild** (frontend bundle reload only).
Both files syntax-checked clean. These were the larger reworks deferred from the optimizer deep-dive
("bugs now, refactors after").

- **L8** `multiOptimizerTab.js` — removed the no-op `numberFormatter` `valueFormatter` (returned
  `params.value` verbatim — identical to no formatter) from the grid `defaultColDef`, and deleted the
  function.
- **L5** `optimizerTab.js` — the hold-to-repeat +/- step buttons (slot-filter sliders + priority spinners)
  could run away when the pointer was released off the button (only the button's own mouseup/mouseleave
  stopped them). Factored the two duplicated implementations into one module-scope
  `addRepeatClick(btn, action)` with a document-level `mouseup`/`pointerup` + `window` blur guard so the
  repeat always stops.
- **M6** `optimizerTab.js` — synchronous double-submit guard for `submitOptimizationRequest`. The backend
  `getOptimizationInProgress()` check is awaited, so two rapid clicks could both pass it before either
  registered a run. The body moved to `_runOptimizationRequest()`; the public wrapper sets a
  `_submitInFlight` flag and clears it in `finally` (covers every inner early-return, so it can't wedge).
  Backend check + #17 re-run fingerprint remain the backstop once a run is dispatched.
- **M4** `optimizerTab.js` — stale-run generation guard in `recalculateFilters`. Rapid filter edits could
  resolve their awaits out of order and overwrite newer slot counts/heatmaps. Now captures
  `++_recalcGeneration` at entry and bails after the awaits if a newer call superseded it. Also routed the
  rapid slider handlers (per-slot step, "all slots %" box, global-slider drag, global step) through
  `debouncedRecalculate` (150ms). Note: `currentFilteredItems` turned out to be write-only (no readers
  anywhere in the JS tree), so only the DOM writes were at risk.
- **L3** `optimizerTab.js` — gated all 20 diagnostic `console.log` traces (the `[FILTER]` pipeline, the
  `[submitOptimizationRequest]`/`[updateProgress]` traces, `ADD/REMOVE BUILD`, `a1`, etc.) behind a new
  `_optDbg(...)` helper that logs only when `window.__optDebug === true` (toggle live in DevTools, no
  rebuild). `console.error`/`console.warn` left intact.
- **H5** `multiOptimizerTab.js` — ported the authoritative Build Score (Bscr) column from the single
  optimizer so multi rows rank/colour consistently across tabs. Added the `buildScore` column (backend
  sends it ×100 on every `getResultRows` row — same `OptimizationRequest` path — so display divides by 100;
  no `calculateBuildScore` fallback, since the shared `OptimizerGrid` base/targets belong to the
  single-optimizer pinned hero) and added `buildScore` to the per-hero heatmap aggregate. Sorting uses the
  existing backend `sortColumn` support.

---

## Optimizer deep-dive (deep-dive-look-elegant-pnueli) — bugs + safe cleanups — 2026-06-16

All frontend JS (optimizerTab.js, multiOptimizerTab.js, fribbelsLibrary.js); no rebuild. All three
syntax-checked. Larger refactors deferred per "bugs now, refactors after."

**Critical**

- **C1** `editGearFromIcon` now calls `invalidateItemsCache()` after `Api.editItems` — editing gear
  from the optimizer no longer leaves the next run scoring against stale (pre-edit) gear.

**High**

- **H1** `submitOptimizationRequest` `.catch` now clears `progressTimer` + overlay and warns — a backend
  rejection no longer strands the UI polling forever on a stuck spinner.
- **M12** the progress timer now starts _after_ `prepareExecution()` assigns the new executionId (no
  longer polls the just-deleted execution).
- **H2 + M2** "Reset" now nulls `slotPriorityConfigByIndex`/`setPriorityConfigByIndex` (hidden matrices no
  longer survive Reset); capture/restore round-trips them so Undo Reset restores them too (+ re-syncs
  global sliders).
- **H3** `loadPreviousHeroFilters` `!request` branch clears the matrices + slot substat/floor filters, so
  they don't leak from the previous hero onto a never-optimized one. Also fixed a latent footgun: the
  `currentHeroResponse` assignment now uses the resolved response (after the null-arg fallback fetch).
- **H4** multi-optimizer `editFilters` reads `baseStats` from the fetched `heroResponse` (was
  `heroIndex.baseStats` = undefined → saved request omitted base stats).

**Medium**

- **M3** `loadPreviousHeroFilters` now restores the 22 substat-force min/max inputs (were serialized but
  never written back → stale values bled across hero switches and got re-saved).
- **M5** `addBuild`/`equipSelectedGear` use `row.mods?.some(Boolean)` (no TypeError on rows lacking mods).
- **M7** multi `aggregateCurrentHeroStats` uses reduce-based min/max (no `Math.max(...spread)` stack
  overflow at 500-row blocks) + a `count === 0` guard (no NaN/Infinity on empty result sets).
- **M8** multi `getDataSource` `.catch` calls `failCallback()` + clears loading (grid recovers instead of
  spinning forever on a fetch error).
- **M9** multi `filterMultiGridItems` mutual-exclusion compares `multiHero.hero.id` (was `multiHero.id`,
  always undefined). Plus the `multiRemoveAll`/`multiDeselectAll` loops now start at `length - 1`.
- **M11** fribbels `statsText` coerces `(row.ehp/ehps/dmg/mcd ?? 0).toLocaleString()` — old presets
  missing those fields no longer throw and abort restore.

**Cleanups**

- **L1** removed the dead `items.sort((a,b) => a.set - b.set)` no-op (string subtraction → NaN).
- **L6** `_setSliderVal` null-guards a missing element (won't abort restore mid-way).
- **L7** dropped the unused `overridePermutations` param from `warnParams` (+ its eslint-disable).

**Dropped / not bugs (verified):** M10 (would re-break BUG-11 — `_restoredRows.length` is the intended
total); M1 (the `'Cached — re-run to update'` banner already warns on every cache restore — silent-stale
premise was wrong); L2 globalFromMatrix (averaging over all legal cells is the correct inverse of the
broadcast; authored-only would over-state); L4 (both clear-fn call sites already `recalculateFilters()`).

**Deferred (refactors, per user):** H5 (port the Bscr column + `stampBuildScore` into multi), M4
(`recalculateFilters` stale-run generation guard), M6 (double-submit guard — needs a wrapper restructure
to avoid wedging on early returns), L3 (broad debug-`console.log` cleanup), L5 (shared button auto-repeat

- document-level mouseup), L8 multi `numberFormatter` no-op removal, IMP-1/IMP-3 from the New Plan audit.

---

## "New Plan by Plan Agent" optimizer-tab audit — verified + partial fix — 2026-06-16

Verified all 18 items against current code (most already fixed or stale). Applied the still-open
genuine items (JS only, no rebuild; syntax-checked):

- **BUG-A2 (HIGH)** — `readNumber`/`readCheckbox` now null-guard `getElementById` (mirroring `readFloat`),
  so a missing form element returns undefined/false instead of throwing `TypeError` mid-request
  (reachable via `${index}`-suffixed multi-hero IDs).
- **IMP-2 (MED)** — `OptimizerTab.drawPreview` wrapped in try/catch; a backend failure on
  `Api.getItemsByIds`/`getHeroById` now warns instead of an unhandled rejection + blank preview.
- **IMP-7 (LOW)** — `pinCurrentBuildRow` snapshots the row (`{ ...row }`) so a later grid refresh can't
  mutate the pinned build before Compare.
- **BUG-A8 (LOW)** — added the intent comment on the `inputSubstatMods → inputPredictReforges` coupling.

Already fixed/stale (no action): BUG-A3, BUG-A5, BUG-A7 (fixed); BUG-A6, OPT-1, OPT-3, IMP-5
(stale/reworked); IMP-6 (verified live — not dead code).
Deferred (optional, not correctness bugs): BUG-A4 (preset-delete confirm — needs a confirm-dialog flow;
presets are cheap to recreate), IMP-1 (table-driven `loadPreviousHeroFilters` refactor), IMP-3
(consolidate the 2 artifact blocks — note the `+=` vs `=` divergence), OPT-2 / OPT-4 (marginal perf).
IMP-4 (debug-log spam) is folded into the deep-dive plan's log-cleanup item.

## Modification System (cuddly-moon plan) — verified ALL DONE — 2026-06-16

All 3 items already implemented in current code: mod stat-application branches on `useReforgeStats`
(HeroesRequestHandler), permutation overflow guarded by `Math.multiplyExact` + `SETTING_MAX_PERMUTATIONS`
(OptimizationRequestHandler), dead `getModItems` endpoint removed. No changes needed.

---

## Java backend bug-sweep (HeroesRequestHandler / OptimizationRequestHandler) — 2026-06-16

From BUGS.md "Low" open items. JAR rebuilt via `build_backend.ps1` (BUILD SUCCESS, deployed to
`1. Master/3. Jar/backend.jar`). **Restart the app to load the new JAR.** NOTE: the numbered source
folders (`4. Handler/` etc.) are **hardlinked** to the Maven-compiled `com/fribbels/` tree (the pom
excludes the numbered folders), so editing either path updates both.

- **clearNullBuilds redundant `getBaseStatsByName` (HeroesRequestHandler.java).** Method now takes
  `baseStats` and uses the caller's already-fetched value (both call sites: the `size != 6` early
  return and the normal path); removed the redundant re-fetch. Eliminates a per-recalc DB lookup and
  the NPE-if-name-has-no-basestats risk.
- **CPU/GPU `maxReached` size overshoot (OptimizationRequestHandler.java).** The result-size calc
  `Math.min(5000000, maxReached==MAXIMUM_RESULTS-1 ? MAXIMUM_RESULTS : resultsCounter.get())` missed the
  GPU path (which sets `maxReached=MAXIMUM_RESULTS`, not `-1`), so a full GPU run sized from the
  overshooting `resultsCounter` and could exceed the `resultHeroStats` array when `MAXIMUM_RESULTS < 5M`.
  Replaced with `Math.min(MAXIMUM_RESULTS, resultsCounter.get())` — correct for both paths (both only
  write at indices `< MAXIMUM_RESULTS`).
- **Main.interrupt** — already `volatile` in current code; the BUGS.md entry was stale (no change).

Deferred: `ItemsRequestHandler.mergeItems` "over-constrained ingame-ID branch" — no concrete repro and
high DB-corruption risk (it rewrites the whole item DB); left open in BUGS.md pending a failing case.

---

## estimatePriorityStats hint accuracy (priorityFilter.js) — 2026-06-16

Applied from plan `crispy-cooking-stardust.md`. Affects the priority HINT estimates only (the
projected ATK/HP/DEF/… boxes + the inverse "type a target → priority" calc), NOT the optimizer's
actual build ranking. JS only, no rebuild. Node syntax-check passed.

- **Bugs 1-3 — Left-side substat overcount (~1.5×).** `leftAtkRolls`/`leftDefRolls`/`leftHpRolls`
  used `((sum) / 2) * 3`, inflating the Weapon/Helmet/Armor substat estimate 50% above the per-slot
  model the rest of the function uses (`accStatContrib` sums pct+flat per legal slot; SPD = roll ×
  eligible pieces). Fixed to the exact legal-slot sums — `2·pct + flat` (ATK, DEF), `3·pct + 2·flat`
  (HP) — and rewrote the misleading "intentional normalization" comment. Confirmed the `/2*3` was
  inconsistent with the function's own accessory/speed terms and not justified by the later
  `rollScale` budget cap (which is an independent global correction).
- **Bug 4 — Final multipliers ignored.** Return block now multiplies the ATK/HP/DEF totals by
  `1 + hero.finalAtkMultiplier/HpMultiplier/DefMultiplier / 100` (fields set by api.js, already used
  by `applyAllFastRejects`). SPD/CR/CD/EFF/RES have no such fields — unchanged.
- **Minor — Set-bonus floors.** `atkSetBonus`/`hpSetBonus`/`defSetBonus` now wrapped in `Math.floor`
  to match E7's in-game flooring (≤1 difference; SPD was already floored).

---

## BUG-10 — Necklace slot undefined in drawPreview (modificationFilter.js)

`ModificationFilter.getModsByIds` returned `undefined` for any slot where `mods[i] === null`
even when the base item was in cache. Root cause: null-mod guard ran before `JSON.parse`,
so the base item was never returned.
Fixed by moving `JSON.parse(jsonString)` + `!item` guard before the null-mod check, then
`result.push(item)` (not `undefined`) when `mods[i]` is null.
File: `modificationFilter.js` lines 121–130. JS only, no rebuild.

## BUG-11 — Restored-mode grid stuck at page 1 (pages 2+ blank)

`optimizerGrid.js` restored-data `getRows` passed `_restoredMaximum` (e.g. 563,914) as
`lastRow` to AG Grid, but `_restoredRows` only holds ≤500 rows. AG Grid constructed 1,128
pages; pages 2+ returned empty slices → blank rows.
Fixed line 238: `params.successCallback(slice, _restoredRows.length)` so the grid knows the
accessible total equals the cache size. Stale-results banner already prompts re-run for full results.
Also fixed `OptimizationRequestHandler.java` line 610: `getBestSoFar(100)` → `getBestSoFar(500)`
so cancel snapshots a full page. JAR rebuilt (27s, BUILD SUCCESS).

---

## Fast-Reject Base Stat Key Fixes (optimizerTab.js)

All four fast-reject functions used `baseStats?.[starKey]?.spd` (nested key lookup for
`lv60SixStarFullyAwakened`) which always returned `undefined → 0`. `baseStats` is a flat
object — the nested key does not exist.

- **`applySpdFastReject`** — `heroBaseSpd = baseStats?.spd ?? 0`. Added `if (!heroBaseSpd) return items` guard. This was the root cause of 0/0 items across all slots when SPD min ≥ 200.
- **`applyAtkFastReject`** — `heroBaseAtk = baseStats?.atk ?? 0`
- **`applyHpFastReject`** — `heroBaseHp = baseStats?.hp ?? 0`
- **`applyDefFastReject`** — `heroBaseDef = baseStats?.def ?? 0`

The ATK/HP/DEF functions had existing `if (!heroBase) return items` guards that caused them
to pass all items silently (no filtering, no crash), masking the bug. SPD had no such guard.

---

## itemSpd() / itemEquiv() Main Type/Value Fix (optimizerTab.js)

All four per-item max contribution functions (`itemSpd`, `itemAtkEquiv`, `itemHpEquiv`,
`itemDefEquiv`) referenced `s.mainType` and `s.mainValue` which don't exist on item objects.
Fixed to `item.main?.type` and `item.main?.value`. Before this fix, main-stat SPD boots
(e.g. +60 SPD main) were invisible to the per-item pruning logic.

---

## BUG-2 — applyMustHaveSubstatFilter Optional Chain (optimizerTab.js:4676)

`item.substats.some((s) => s.type === stat)` lacked optional chaining on the forced-slot
branch. An item with `substats === null` (malformed import) would throw an uncaught TypeError
and crash the filter chain. Fixed to `item.substats?.some((s) => s.type === stat) ?? false`.

---

## Dead Code Removal (optimizerTab.js)

`getSpdValueFromItem` and `computeMaxAchievableSpd` were unused helper functions superseded
by the fast-reject implementation. Removed.

---

## BUG-1 — GPU Torrent bsHp Sign (REFUTED)

**Files audited:** `GpuOptimizerKernel.java:1130,1233` / `StatCalculator.java:118,247`

The `+` sign in both bsHp formulas is correct. The stat formula applies the Torrent HP malus
as a negative already baked into `hp`. bsHp's purpose is to isolate gear substat contribution
by stripping all non-substat effects; Torrent's malus must be added back (sign-flipped) to
undo it. CPU and GPU are identical in magnitude and sign. No code change needed.

---

## P2 — Crashes / 0 Results (All Already Fixed)

All 9 items audited — every fix was already applied to the codebase:

- **J3** — `firstSets` null-guard already in place (`request.getInputSetsOne() != null ? ... : Collections.emptyList()`)
- **J4** — `Comparator.nullsLast(Comparator.naturalOrder())` already in the sort call
- **J2** — `getSetsOrElseAll()` already returns `Arrays.asList(Set.values())` when null/empty
- **J1** — `permutations[]` and `setPermutationIndicesPlusOne[]` are already local variables inside `addCalculatedFields()`, not shared instance fields
- **J5** — `buildSetsArr()` already guards `if (item != null && item.set != null)`
- **getSkillValue** — bounds check `s >= targetsArr.length` already present at `StatCalculator.java:300`
- **filterDisabled** — `priorityFilter.js:286–288` already calls `calculateScore` in the disabled path; `item.priority` clamp `Math.max(0, ...)` already at line 112
- **C2** — `calculateReforgeValues` already uses a proper `if / else if` chain
- **C3** — `calculateMaxes` already has `const range = reforgedMax - reforgedMin; substat.potential = range === 0 ? 1 : ...`
- **C4 / M2** — all `plainStatRollsToValue[substat.rolls]` accesses already use `?? 0` fallback

No JAR rebuild needed for this batch.

---

## Broken Reference Fixes (A–E)

Audited all ~94 claimed changes. Almost everything was already applied from prior work. Two actual changes were needed and made:

- **A.2** — `webpack.config.renderer.dev.dll.babel.js` LoaderOptionsPlugin output path: `'3. DLL'` → `'2. DLL'`
- **B.2** — `package.json` jest `setupFiles`: `"./4. Both/2. Build/scripts/CheckBuildsExist.js"` → `"./4. Both/2. Build/1. Scripts/CheckBuildsExist.js"`

Everything else (A.1, A.3, A.4, B.1, B.3, C.1–C.4, D.1–D.9, E.1) was already correct:

- All webpack Script requires already used `1. Scripts/`
- All renderer entry points, dist paths, and DLL `const dist` already correct
- package.json build scripts already used `1. Scripts/`; jest mocks already `2. Mocks/`; extraFiles already correct
- `files.js` already had `getJarPath()`; `subprocess.js` already used it; `build_backend.ps1` already correct
- All JS imports in inputHandler.js, dialog.js, archetypeScorer.js, and all colorPicker/rollDivisors/flatStatCalibration imports already used numbered folder paths
- `index.tsx` CSS path already correct
- `pom.xml` already had `../1. Java/10. Tests` (folder is `10. Tests`, not `11. Tests`)

---

## FervorSet / WeakeningSet JAR Rebuild

`Set.java` already had `MIGHT(22, 2, "FervorSet")` and `WEAK(23, 4, "WeakeningSet")` defined.
Ran `build_backend.ps1` — BUILD SUCCESS in 32s. `backend.jar` deployed to
`1. Master/3. Jar/backend.jar` and `2. Class/1. JARs/`. Both sets now compiled into the
running JAR; items using these sets will no longer be silently filtered out.

---

## ELECTRON_RUN_AS_NODE Fix (webpack.config.renderer.dev.babel.js + package.json)

Both fixes were already applied to the codebase:

- **webpack.config.renderer.dev.babel.js ~line 232:** `const spawnEnv = { ...process.env }; delete spawnEnv.ELECTRON_RUN_AS_NODE;` used in the `spawn()` call for `start-main-dev`.
- **package.json line 36:** `start-main-dev` script is clean — no `ELECTRON_RUN_AS_NODE=` present.

---

## P8 — Optimization Improvements (Tier 1)

- **#2 — Set pre-pruning Formats 2, 3, 4** — ALREADY DONE. `applySetRequirementPreFilter` fully handles all 5 formats (1–5) with correct per-slot analysis for 4-piece + 2 free, 2-piece + 4 free, and 2+2 + 2 free.
- **#3 — Mod expansion receives pruned pool** — ALREADY CORRECT. `optimizerTab.js:1682–1700`: PriorityFilter runs first, then ModificationFilter receives its output. Comment confirms the intentional order.
- **#4 — GPU Phase 7 skip when no skill limits** — Fixed `GpuOptimizerKernel.java`. Added `@Constant int isSkillLimited` field, computed in both `setKernelValues` blocks (1 if any S1/S2/S3 min > 0 or max < MAX_INT, else 0), and wrapped entire Phase 7 (`getSkillValue` ×3 + limit check) in `if (isSkillLimited != 0)`. JAR rebuilt (20s, BUILD SUCCESS). This saves 3 `getSkillValue` calls per build candidate when no skill limits are configured — the common case.
- **#5 — GPU Phase 6 order before Phase 7** — ALREADY CORRECT. Phase 6 (cheap score/priority sums, lines 1203–1217) is already before Phase 7 (skill damage, lines 1219–1228).
- **#6 — boolArr cache by SetFormat + sets** — ALREADY DONE. `OptimizationRequestHandler.java:1651–1661, 1861`: `BoolArrEntry cachedBoolArrEntry` caches by key `"${setFormat}:${inputSetsOne}:${inputSetsTwo}:${inputSetsThree}"`. Cache hit skips the 191M-entry array rebuild entirely.
- **#7 — Result cap early-exit to GPU** — ALREADY DONE. Lines 1060–1062 check `exit.get()` before dispatching each GPU batch; lines 1128–1131 check it within result collection loop; lines 1208–1212 set `exit.set(true)` when cap is hit.
- **Stray debug log** — Also removed `console.log('SETFORMAT', setFormat)` at `optimizerTab.js:1742`.

---

## P8 — Optimization Improvements (Tier 2/3/4)

**Tier 2 (#8–#14) — all already done, confirmed this session:**

- **#8 — Score floor** — ALREADY DONE. `priorityFilter.js:274–352` + `inputPriorityScoreFloor` wired in optimizerTab.js; `app.html:2163` tooltip: "Drop items scoring below this % of the slot's top score".
- **#9 — slotModConfig Single Target Pin (UI)** — ALREADY DONE. `dialog.js`: `rulePinStatSelect` dropdown renders per-rule target pin; `pinnedTarget` field overrides keepStats to `[pinnedTarget]` at `dialog.js:2406`.
- **#10 — allowedTargetStats Per-Item — UI** — ALREADY DONE. `dialog.js`: `getModTargetsHtml` renders per-substat target checkboxes; `readAllowedTargets(idx)` saves them; shown with target-toggle in item edit dialog.
- **#11 — item.disableMods Per-Item — UI** — ALREADY DONE. `htmlGenerator.js:328–332` `disableModsDisplay()` renders clickable toggle icon; `OptimizerTab.toggleDisableModsFromIcon` (optimizerTab.js) handles the backend round-trip.
- **#12 — Force Filter AND mode** — ALREADY DONE. `forceFilter.js:72`: `applyForceFilters(params, items, forceNumber, forceAndMode)`; `optimizerTab.js:1666–1667` reads `#forceAndMode` checkbox and passes it through.
- **#13 — Java Per-Slot Pre-Filter (CR/CD/SPD/EFF)** — ALREADY DONE. `OptimizationRequestHandler.java:802–869`: conservative upper-bound pre-reject with `maxCrSet=36`, `maxCdSet=60`, `maxEffSet=60`, `maxSpdSet=0.25*base.spd`.
- **#14 — Mod Variant Cache Incremental** — ALREADY DONE. `modificationFilter.js:383–386`: skips `.clear()` on the LRU map; only inserts changed entries; unchanged entries survive via LRU eviction.

**Tier 3 (#15–#19):**

- **#15 — Stale Results Indicator** — ALREADY DONE. `optimizerTab.js:1331`: `_showStaleResultsBanner('Cached — re-run to update')` on cache load; `_clearStaleResultsBanner()` on fresh run completion.
- **#16 — Archetype Auto-Config** — ALREADY DONE. `optimizerTab.js:983–987`: `archetypeSelect` dropdown + `applyArchetypeBtn` wired to `_applyArchetypeDefaults()`.
- **#17 — Request Fingerprinting (skip identical re-run)** — ALREADY DONE. `optimizerTab.js:3997–4001`: `_buildRequestFingerprint` + `_lastRunFingerprints` Map; skips re-run with `Notifier.info` when fingerprint matches.
- **#18 — Auto-invalidate on gear pool change** — ALREADY DONE. `optimizerTab.js:2936–2940`: `invalidateItemsCache()` calls `_showStaleResultsBanner('⚠ Gear changed — results may be outdated')` when results are on screen.
- **#19 — Archetype Global Preset Templates** — Fixed `optimizerTab.js`. Extracted `_applyArchetypeByName(name)` from `_applyArchetypeDefaults`. Added `_GLOBAL_TEMPLATES` const (DPS Fast Cleave → Top Speed, DPS, Pure Tank, Eff Support → EFF. Tank). `renderFilterPresets` now renders template chips first (dashed border, 75% opacity) with a "Templates" section label, then "My Presets" label when per-hero presets exist. Added `.preset-section-label` and `.preset-chip-template` CSS.

**Tier 4 (#20–#22):**

- **#20 — Gear Score WSS Floor tooltip** — ALREADY DONE. `app.html:2163` `title="Drop items scoring below this % of the slot's top score (0 = disabled)"`.
- **#21 — ForkJoinPool Task Granularity** — ALREADY DONE. `OptimizationRequestHandler.java:1239–1248`: slots sorted by ascending item count; outer 2 as ForkJoinPool task dimensions; inner 4 run within each task.
- **#22 — Partial-Sum Pruning** — DEFERRED. High difficulty due to % stats; CPU path rarely the bottleneck; existing optimizations (#4, #13) cover common cases.

---

## P10 — Fribbels Hero Library Refactoring

All refactoring items already done; only debug log cleanup was needed this session:

- **MAX_GEAR Refactor** — ALREADY DONE. `computeEqualizedMaxRolls` (equivalent) already in `fribbelsPriorityFilter.js`; no `MAX_GEAR` constant remains in either file.
- **computeBsStats** — ALREADY DONE. `computeBsStats(row, baseStats, sets, artiStats)` already in `fribbelsPriorityFilter.js:85` with artifact + fixed gear subtraction.
- **computeEqualizedMaxRolls formula** — ALREADY DONE. Removed 3 leftover `console.log` calls from `fribbelsPriorityFilter.js:computeEqualizedMaxRolls` (inputs log at ~218, ATK/DEF/HP log at ~286, result log at ~335).
- **Move Pure Calc Functions** — ALREADY DONE. `computeSkillValue`, `computeRowStats`, `computeMedian`, `computeStatSummary` all exported from `fribbelsPriorityFilter.js`. `fribbelsBuildCurrentRow` calls `FribbelsPriorityFilter.computeRowStats`; `fribbelsRenderStatsTbody` calls `FribbelsPriorityFilter.computeStatSummary`. No `fribbelsMedian` or `fribbelsComputeSkillValue` remain.
- **fribbelsGrid.js** — Removed `console.log('[FribbelsGrid] initialized', instance)` at line 252.

---

## P9 — Gear Analysis Breakdown CSV Export

Fixed `gearAnalysisTab.js` + `app.html`.

- Added `<button id="ga-breakdown-export" style="display:none;">⬇ CSV</button>` in `app.html:6112` next to the breakdown toggle button.
- Added `downloadBreakdownCsv(rows)` in `gearAnalysisTab.js` (after `buildBreakdown`): replicates the slot/combo/counts data build, formats to CSV rows (Slot, Set/Main, #, arch columns), and triggers a Blob download as `gear_analysis_breakdown.csv`.
- Added `csvCell(v)` helper: wraps values containing commas, quotes, or newlines in double-quoted CSV cells.
- Wired click handler in `init()`: export button click calls `downloadBreakdownCsv(filterAndSort())`; breakdown toggle now also shows/hides the export button.

---

## P7 — Low Bugs

- **BUG-9 — gearAnalysisTab.js string sort** — Fixed `gearAnalysisTab.js:542–548`. Added `localeCompare` branch before raw `<`/`>` comparisons: when `typeof va === 'string' && typeof vb === 'string'`, uses `va.localeCompare(vb)` with sort direction applied. Fixes set/main column sorting for accented characters.
- **Gear Analysis Bug 2 — \_isDpsArmor over-applied** — ALREADY FIXED. `gearScorer.js:377`: `return (arch === 'DPS' || arch === 'DPS (No CC%)') && slot === 'Armor';` already has `slot === 'Armor'` guard.
- **Gear Analysis Bug 3 — modified substat MOD badge** — ALREADY FIXED. `gearAnalysisTab.js:950–952, 972`: `modBadge` with `✦ MOD` already rendered when `sub.modified === true`.
- **Gear Analysis Bug 4 — reforged values not shown as diff** — ALREADY FIXED. `gearAnalysisTab.js:965–970`: `isReforgedChange` branch already renders `${baseVal}→${refVal}` format.
- **L1 — Debug console.log left in production** — Removed all debug logs from:
  - `priorityFilter.js:51` — cache invalidation log
  - `optimizerTab.js:4450–4453` — `[applySpdFastReject]` diagnostic logs (2 lines + comment)
  - `optimizerGrid.js` — 8 logs: localeText, getSelectedRow, selectedNode, getSelectedGearIds, GetResultRowsResponse, 2× Aggregated, Built optimizergrid
  - `multiOptimizerTab.js` — 5 logs: localeText, [MultiOptimizerTab] initialize, REDRAWHEROSELECTOR, Aggregated, GetResultRowsResponse

---

## P6 — Medium Bugs

- **M1 — Cache key collision** — ALREADY FIXED. `priorityFilter.js:55`: `\`${item.modId ?? item.id}:...\``already uses`?? item.id` fallback.
- **BUG-4 — Request fingerprint uses unstable modIds** — Fixed `optimizerTab.js:3860`. Changed `items.map((i) => i.modId || i.id)` to `items.filter((i) => !i.upgradeable).map((i) => i.id)`. Base items have stable IDs; mod variants' UUIDs regenerate on LRU eviction and broke the dedup check.
- **BUG-5 — selectors.js crashes on non-string set values** — Fixed `selectors.js:275`. Extracted `const toSetKey = (x) => (x ? String(x).replace('Set', '') : x)` and applied it to all four set array maps (`inputSetsOne`, `inputSetsTwo`, `inputSetsThree`, `inputExcludeSet`). Guards against null/numeric values in saved presets.
- **JS2 — api.js empty string response** — ALREADY FIXED. `api.js:22–24` already has `if (response.data === '') { resolve(null); return null; }`.
- **M2 — unreforgeItem rolls validation** — ALREADY FIXED. `reforge.js:824`: `plainStatRollsToValue[substat.rolls] ?? 0` already has `?? 0` fallback.
- **Remove HeroSet** — ALREADY DONE. No `HERO: 'HeroSet'` in `enums.js`, no `set_hero` in `scanner.js` or `itemAugmenter.js`, and `piecesBySetIndex` in `constants.js` has exactly 24 entries matching the 24 sets.

---

## P5 — High Bugs

- **H2 — targetRangeRatio div-by-zero** — ALREADY FIXED. `statTargetBonus` guards `hasMin = minT > 0` and `hasMax = maxT > 0` before calling `targetRangeRatio` or `targetRatio` — denominator can never be 0 at the call site.
- **archetypeScorer CR cap** — ALREADY FIXED. `archetypeScorer.js:51` has `Math.min(value, 100) / ROLL_DIVISORS.cr`.
- **JS1 — cleanInfinities NaN** — ALREADY FIXED. `optimizerGrid.js:382`: `if (!Number.isFinite(num)) return 0;` — `Number.isFinite(NaN)` is false, so NaN is already handled.
- **BUG-6 — baseStats zero guard in calculateScore** — Fixed `priorityFilter.js:65–67`. Added `const atkBase = baseStats.atk || 1`, `hpBase`, `defBase` locals, then replaced all three division denominators to use them. Prevents Infinity/NaN when a hero's base stat is 0.

---

## P3 — Wrong Results (All Resolved)

- **WeakeningSet SPD bonus** — `StatCalculator.java` already had all 4 additions: field, init, SPD calc, bsSpd subtraction. Already fixed.
- **C2 — calculateReforgeValues else-if** — `reforge.js` already uses a proper `if / else if` chain. Already fixed.
- **BUG-3 — dmgUpMod /1000** — REFUTED. `selfSpdScaling` values in herodata.json are decimal fractions (0.00075–0.003), not per-mille. `dmgUpMod = 1 + 0.003 * 200 = 1.6` is correct.
- **Mod Variants Crowd Out CR/CD Originals** — Fixed in `priorityFilter.js:370–378`. After top-N% slice, appends `keptOriginals` (upgradeable===0 items whose modId isn't in the top set) when `inputSubstatMods` is true.
- **item.priority Clamped to 0** — Already fixed at `priorityFilter.js:112`: `Math.max(0, Math.round(score))`.
- **BUG-7 — statPreview.js setBefore empty** — Fixed `statPreview.js:141–145`. Both `#setBefore` and `#setAfter` now resolve data source via `before.sets != null` / `after.sets != null`, passing the count array directly when present (HeroStats rows) or reading from `.equipment` items map otherwise. `isAfter` flag set accordingly.
- **Phantom Roll Formula** — Already fixed at `gearScorer.js`: `return totalRolls + (globalThis.HEROIC_PHANTOM_SUBSTAT_ROLLS ?? 1)` which equals `totalRolls + 1`.

---

## P4 — Security

- **H1 — XSS in htmlGenerator.js onclick** — ALREADY FIXED. `escAttr()` function defined at line 12–14 (`&`, `"`, `'` escaping) and applied to every injected value in `locate()`, `storage()`, `magnify()`, `editItemDisplay()`, `editLockDisplay()`, `disableModsDisplay()`. No change needed.
- **C1 — Insecure Electron window config** — DEFERRED (largest scope item). `nodeIntegration: true` + `contextIsolation: false` present in both dev and prod configs. Full fix requires preload.js + contextBridge across 11 renderer files (fs, path, remote, ipcRenderer, child_process, process.env). Since H1 is already fixed (XSS→RCE vector blocked) and the app only loads `file://` URLs, practical risk is very low. Left in NEED_DONE as-is.

---

## BUG-8 — SPD Pre-Filter Ignores Non-SpeedSet Bonuses (WITHDRAWN)

`maxSpdSet = 0.25 * base.spd` accounts for SpeedSet only. RevengeSet (+12%),
ReversalSet (+15%), WeakeningSet (+15%) also grant SPD but SpeedSet at 25% is the
highest possible SPD set bonus — so using SpeedSet's rate is already the conservative
maximum. No false-reject possible. Not a bug.

---

## Historical fixes — migrated from the old Bug Tracker (now `New Bugs.md`) — 2026-06-16

The completed `[x]` items that previously lived in the Bug Tracker, moved here so `New Bugs.md`
holds only open bugs. Verbatim; severity prefixes (Critical/High/Medium/Low) are in the text.

- [x] `app.html` — `mustHaveSubstatSelect` option values were abbreviations (`spd`, `cr`, etc.) instead of internal stat type names — must-have substat filter never worked
- [x] `pom.xml` — `maven-resources-plugin 3.3.1` rejected resource directories outside `${project.basedir}` — Maven build failed
- [x] **`api.js`** — OpenCL and "untested" error branches in `.catch()` never call `resolve()` or `reject()` — promise permanently pending, optimizer silently hangs forever
- [x] **`heroData.js`** — `fetchCacheConditional` saves JSON to disk before parsing — bad server response corrupts the local cache file, breaks every subsequent restart
- [x] **`ItemsRequestHandler.java`** — `mergeHeroes` NPE: `Collectors.groupingBy(Item::getIngameEquippedId)` throws on null `ingameEquippedId` — crashes for any user with unequipped gear
- [x] **`ItemsRequestHandler.java`** — `lockItems` / `unlockItems`: no null check on items returned by `getItemsById` — NPE for any stale or missing item ID
- [x] **`HeroesRequestHandler.java`** — `unequipItems`: no null check on items returned by `getItemsById` — NPE for stale IDs
- [x] **`HeroesRequestHandler.java`** — `equipItemsOnHero`: no null check on items returned by `getItemById` — NPE for stale IDs
- [x] **`subprocess.js`** — Java binary path not quoted when spawning with `shell: true` — optimizer never launches if `JAVA_HOME` contains spaces (e.g. `C:\Program Files\...`)
- [x] **`subprocess.js`** — `callback()` never called if backend process never prints `BACKEND_PORT:XXXX` — app hangs silently with no error message
- [x] **`HeroDb.java`** — `addHeroes` never loads skills from `baseStatsDb` (unlike `setHeroes`) — newly added heroes always show s1=s2=s3=0 damage scores until save/reload cycle
- [x] **`OptimizationRequestHandler.java`** — `optimizationDbs` is an unsynchronized `LinkedHashMap` accessed from multiple HTTP handler threads — concurrent requests can corrupt it
- [x] **`OptimizationRequestHandler.java`** — `Main.interrupt` is a shared flag — cancelling one of two parallel runs also kills the other
- [x] **`OptimizationRequestHandler.java`** — GPU post-processing lambda only decrements `executionCounter` in the happy path, not in `catch` — exception in any lambda deadlocks the GPU loop
- [x] **`RequestHandler.java`** — `Content-Type` header is set after `sendResponseHeaders()` — the header is never actually sent to the client on any response
- [x] **`StatCalculator.java`** — Back-calculation uses `sets[2] > 1` but forward calculation uses `sets[2] > 3` — wrong base stat% displayed for builds with exactly 2 attack-set pieces
- [x] **`priorityFilter.js`** — `estimatePriorityStats`: the ring ATK `accStatContrib` call was missing the `'AttackPercent'` arg, shifting every argument by one so `flatSubRoll` was `undefined` — produced `NaN` for the ATK priority estimate, which threw "The specified value 'NaN' cannot be parsed" when assigned to the `atkPriorityHint` number input on hero double-click. Ring HP/DEF calls were unaffected (correct 7 args)
- [x] **`priorityFilter.js`** — `estimatePriorityStats`: SPD return was the only stat that added its accessory-main term (`mainSpd`) without multiplying by priority (all others use `mainX * pX`). With a Boots filter allowing a Speed main, `mainSpd` (`45/6`) leaked into `est` but not the zero-priority baseline `est0`, showing a phantom `+8` SPD delta even at 0 priority. Fixed to `mainSpd * pSpd`
- [x] **`rtaStats.js`** — `SET_NAMES` was missing `set_might` (Fervor) and `set_weak` (Weakening) — only 22 of E7's 24 sets. Any epic7rtastats combo containing Fervor/Weakening fell through to the raw `set_code`, so the Build Planner showed `set_might`/`set_weak` and emitted `set_mightSet`/`set_weakSet` keys that match no Target Sets checkbox — **Apply silently did nothing** for those sets. `stoveRta.js` and `communityBuilds.js` already mapped both. Fixed by adding `set_might: 'Fervor'`, `set_weak: 'Weakening'`
- [x] **`rtaStats.js`** — `FOUR_PIECE_SET_CODES` omitted `set_weak` — Weakening is a 4-piece set (treated as 4-piece in `heroesGrid.js` and `communityBuilds.js`), so in `getSetBreakdown` a Weakening build's `set_weak` was pushed into `twoCodes` instead of becoming the primary `fourCode` — wrong combo grouping, wrong usage split, wrong `setKeys`. Fixed by adding `set_weak`
- [x] **`Code.js` (Apps Script Hero Analyzer)** — `_fetchRawBuilds` retry backoff used `Math.pow(0.5, attempt)`, so delays _shrank_ (1s→0.5s→0.25s) instead of the intended "1s, 2s, 4s" — retries hammered the server faster on each failure. Fixed to `Math.pow(2, attempt)`
- [x] **`Code.js` (Apps Script Hero Analyzer)** — Speed-bracket conditional-formatting rules used truncated label strings (`"Bruiser/DPS"`, `"Midrange"`, `"Fast Cleave"`, …) but `_getSpeedBracket` writes the full strings (`"Bruiser/Heavy DPS"`, `"Midrange (Inc. Bulky Support/DPS)"`, `"Anti Cleave/Fast Cleave Setup"`, …). `whenTextEqualTo` is exact, so 6 of 7 brackets never colored. Fixed the 6 rule strings to match the function outputs
- [x] **`itemAugmenter.js`** — `augmentReforgeStats` wrote `subStat.reforgedValue` (and `main.reforgedValue`) into the zero-initialized `reforgedStats` even when `undefined`. A modded substat with "use substat mods" off has no `reforgedValue`, so it overwrote the 0 with `undefined`, and `htmlGenerator.rateBaseScore` summing those fields produced a `NaN` reforged gear score (e.g. boots `Score 53 (53) ➤ 65 (NaN)`). Fixed with `?? subStat.value` / `?? item.main.value` fallback so `reforgedStats` never holds undefined (defense-in-depth)
- [x] **`modificationFilter.js`** — ROOT CAUSE of the above: `getModsByIds` set `item.alreadyPredictedReforge = true` unconditionally, _before_ the no-mod (`mods[i] == null`) check. For no-mod slots that flag made `getItemReforgedStats` (reforge.js) early-return and skip `applyReforgeValues`, so reforgeable substats (e.g. the level-85 boots) never got a `reforgedValue`. Moved the flag to fire only when a mod is actually applied, so no-mod preview items get their real reforged stats computed (the reforged score now reflects the actual reforge boost, not just the current value)
- [x] **`priorityFilter.js`** — (fix C) The per-slot priority cut's substat-mods "keep originals" net (`applyPriorityFilters` → `cutBucket`) filtered on `item.upgradeable === 0`. At that pre-`apply()` point `upgradeable` still carries `itemAugmenter.augmentReforgeStats`' meaning (`0` = fully reforged **level-90** +15, since `isReforgeable` = `level === 85`), **not** modificationFilter's later "is-a-variant" meaning. So when substat mods were ON, the net kept _every_ finished reforged piece unconditionally → for an endgame (mostly level-90) roster the per-slot top-N% slider became a **near no-op** (whole pool passed). Fixed to protect only items that yield no surviving mod variant (`enumerateModCandidates` ∩ the change-B relevance set), so the slider actually cuts again. NOTE: only reachable when a slot filter < 100 (`filterDisabled` skips `cutBucket` when all sliders are 100)
- [x] **`priorityFilter.js`** — (found reviewing fix B, fixed before ship) `computeRelevantStats` (the mod-variant prune set) read per-slot/per-set config rows via `row[t]` directly, but the scorer `_pickTypes` falls back to the legacy 8-**category** key (`row['atk']`) when a row has no per-type keys. A legacy category-keyed `slotPriorityConfig`/`setPriorityConfig` (older persisted/imported data) is scored with real weight by `calculateScore` but was invisible to the relevance test → its mod variants got wrongly pruned. Fixed by resolving each row through `_pickTypes` before testing weight > 0
- [x] **`HeroesRequestHandler.java`** — (mod system deep-dive) `addStatsToBuild` applied a saved build's substat mod **only to `reforgedStats`** (`mod.modifyAugmentedStats(clonedReforgedStats)`), but `StatCalculator.buildStatAccumulatorArr` reads `augmentedStats` when `useReforgeStats == false`. So a non-reforge recalc of a hero with mod-using saved builds (reachable via `clearNullBuilds(..., false)`) silently **dropped the mod's stat contribution** — wrong recomputed build stats. Mods themselves persist fine (`HeroStats.mods` is serialized); this was a stat-application path bug. Fixed to apply the mod to whichever `AugmentedStats` object the accumulator will actually read (reforged on the reforge path, augmented otherwise)
- [x] **`OptimizationRequestHandler.java`** — (mod system deep-dive) `optimizeInternal` computed `final long maxPerms = wSize * hSize * aSize * nSize * rSize * bSize;` where the slot sizes are `int` — so the product is evaluated in **int arithmetic and overflows** (wrong/negative) _before_ widening to `long` for a large mod-expanded pool. That corrupted the GPU-vs-CPU decision (`maxPerms >= 20_000_000`) and result-array sizing. Fixed with `Math.multiplyExact` (overflow → `Long.MAX_VALUE`) plus a hard `SETTING_MAX_PERMUTATIONS` (1e12) backstop that returns the `"ERROR"` contract before any allocation/kernel launch, instead of hanging the Java process. The frontend `warnParams` remains the soft first line
- [x] **`OptimizationRequestHandler.java` / `api.js`** — (mod system deep-dive, dead-code) removed the unused `/optimization/getModItems` endpoint: backend route + `handleGetModItemsRequest` (a `return "[]";` stub) and the frontend `Api.getModItems` wrapper, which was **defined but never called** (mod enumeration is entirely client-side in `modificationFilter.enumerateModCandidates`). `IdRequest` import retained — still used by other routes
- [x] **`heroData.js`** — `getBaseStatsByName`: accesses `status.lv50FiveStarFullyAwakened` without checking if `calculatedStatus` exists — crashes on hero entries missing that field
- [x] **`heroData.js`** — `processHeroSkill`: calls `skillData.options.some()` without checking if `options` is defined — throws for skills with no options
- [x] **`heroesTab.js`** — `removeBuildSubmit` / `editBuildSubmit`: missing null check on `row` — TypeError when no row is selected
- [x] **`heroesTab.js`** — `showBonusStatsWindow`: unknown imprint type silently writes `bonusStats["undefined"] = NaN` — corrupts bonus stats silently
- [x] **`subprocess.js`** — `treekill(child.pid)` called without null-checking `child` — crashes on app close if the backend process never started
- [x] **`artifact.js`** — `Artifact.getStats(name, level)`: no null guard on `allData[name]` — throws TypeError if artifact name is unknown
- [x] **`ItemsRequestHandler.java`** — `augmentItemData` mutates live DB `Item` objects (clears `duplicateId`) as a side effect of a read operation
- [x] **`SystemRequestHandler.java`** — `OptimizationRequestHandler.instance` is null until the first optimization handler is constructed — `setSettings` call on startup NPEs
- [x] **`OptimizationRequestHandler.java`** — `bestDevice.get()` in GPU loop body is an unchecked `Optional.get()` outside any try-catch — `NoSuchElementException` kills the entire optimization run if the device list is empty
- [x] **`api.js`** — `_invalidResultRowsCount` never reset between optimizer runs — accumulates across multiple runs
- [x] **`heroData.js`** — `Settings.getUseLocalCache()` called before `Settings.initialize()` — always returns the default value (false), local cache never used
- [x] **`OptimizationDb.java`** — `sort()` is `synchronized` but `getRows()` is not — can read a partially-sorted array mid-sort
- [x] **`OptimizationDb.java`** — `interrupt()` sets `interrupted = true` with no reset path — state bleeds into next run if instance is reused
- [x] **`HeroDb.java`** — `getBuildsForHero` returns the live internal list — callers can mutate DB state directly
- [x] **`ItemDb.java`** — `replaceItems` recalculates WSS for every item in the DB on every single-item edit — O(n) waste
- [x] **`HeroesRequestHandler.java`** — `clearNullBuilds` calls `getBaseStatsByName` again redundantly (caller already fetched it); would NPE if called from a new context where baseStats is null — **FIXED 2026-06-16**: signature now takes `baseStats`, caller passes its already-fetched value (both call sites), redundant re-fetch removed. JAR rebuilt.
- [x] **`Main.interrupt`** — Non-volatile field written from HTTP thread, read from ForkJoinPool workers — workers may never observe the cancel signal due to CPU cache visibility — **ALREADY FIXED** (verified 2026-06-16): the field is already declared `public static volatile boolean interrupt` in current code; this BUGS.md entry was stale.
- [x] **`OptimizationRequestHandler.java`** — CPU and GPU paths set `maxReached` inconsistently (`MAXIMUM_RESULTS - 1` vs `MAXIMUM_RESULTS`) — GPU path size calculation falls back to `resultsCounter.get()` which can overshoot the array bounds — **FIXED 2026-06-16**: result-size computation replaced with `Math.min(MAXIMUM_RESULTS, resultsCounter.get())`, which is correct for both paths (both only write at indices < MAXIMUM_RESULTS) and can never exceed the array length. JAR rebuilt.

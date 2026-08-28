# Project Memory Index — Fribbels-Epic-7-Optimizer (Pog E7 Optimizer)

Auto memory for this repo. Set by `autoMemoryDirectory` in `.claude/settings.json`; without it the
user-scope setting would send this project's memory to `F:/VSCode-Data/claude/memory` (which is
what happened before 2026-08-28). One line per memory; bodies live in the sibling files.

## Project

- [Overhaul plan 2026-08](overhaul-plan-2026-08.md) — the four-step modernization order (deps → .claude → settings audit → GitHub push), what was decided at each step, and what was deliberately deferred.
- [Repo lineage](repo-lineage.md) — Fribbels (abandoned) → RexQian (`upstream`, active public fork) → lordpogquaad (`origin`, Marcus's PRIVATE fork); upstream's publish/updater/identity fields are not this fork's.
- [Fervor / Weakening set effects](set-effects-fervor-weakening.md) — official 2026-06-04 effect text, what is/isn't modeled, and the three damage-model implementations (CPU Java, GPU kernel, JS) that must change together.
- [GPU backend successor](gpu-backend-successor.md) — Aparapi is frozen; TornadoVM vs JOCL+OpenCL C vs JCuda weighed 2026-08-28, JOCL recommended, trigger = JDK/driver break or perf need.
- [Two manifests, two package managers](two-manifests-two-package-managers.md) — `1. App` is Yarn 4; `2. Frontend/1. Source` is npm via `install_frontend.ps1` with no lockfile; backend is Java/Maven, not a package.json at all.
- [E7 mod permanence](e7-mod-permanence.md) — Epic Seven gear mods are permanent/irreversible, which is why the optimizer's auto-config archetype logic must be conservative about suggesting mods.

## Feedback

- [JS/TS file hygiene](js-file-hygiene.md) — lint-clean + BOM-strip every touched JS/TS file; never blanket-replace a pattern a helper's own body also contains; never remove debug logs unless asked.
- [Java LS non-fatal warning](java-ls-nonfatal-warning.md) — the JDT LS "non-project file" severity-4 warning on backend `.java` files is expected (pom dirs outside basedir); don't chase it unless severity-8 errors also appear.
- [Modernize over preserve](modernize-over-preserve.md) — Marcus wants this inherited legacy codebase actively modernized; prefer upgrading over preserving old patterns, breaking changes are acceptable.
- [QA sweep workflow](qa-sweep-workflow.md) — for a large deliberate review pass: verify → fix → update comments → log per file, deferred rebuild for source edits but immediate rebuild when a dependency changes mid-sweep.

## Reference

- [JDK 25 migration fixes](jdk25-migration-fixes.md) — the three code-level fixes the Java 21→25 migration needed (Lombok annotation-processor path, aparapi native-access flag, aparapi-stderr false-positive matcher), all verified still in place.
- [Java build](java-build.md) — exact command/fallback to rebuild the backend jar, where it's actually deployed, and the `-Dmaven.test.skip` vs `-DskipTests` gotcha.
- [Java dual source tree](java-dual-source-tree.md) — numbered folders are real, `com/fribbels/*` subpackages are directory symlinks to them; `Main.java` lives only in `0. Main` and is compiled from there (the hardlink that shipped a stale Main was retired 2026-08-28).
- [Log control](log-control.md) — all renderer logging routes through `LogControl.js` / `globalThis.Log`; backend via `-Dcom.fribbels.level`; other processes via `E7_*` env vars.
- [AG-Grid setup](ag-grid-setup.md) — single integration point in `inputHandler.js`; v33+ dropped `node.selected` for `isSelected()`; never reintroduce the discontinued scoped `@ag-grid-community/*` packages.
- [Frontend dev server](frontend-dev-server.md) — the app runs from source via a hot-reload dev server (`start-dev.bat` → `yarn dev` → webpack-dev-server writes `renderer.dev.js` and auto-launches Electron); a source edit just needs a relaunch.
- [Python toolchain](python-toolchain.md) — the gear-scanner's Python/scapy stack is a system prerequisite, not repo-bundled; the bundled MS Python extension lint tools need an explicit `PYTHONPATH` to run standalone.
- [Packaging model](packaging-model.md) — electron-builder `files` vs `extraFiles` split, asar-aware path branching, `main.dev.js` as both dev and packaged entry, no custom icon yet.
- [Renderer is jQuery, not React](renderer-no-react.md) — the inherited React/Redux/router/test stack was dead boilerplate, fully removed 2026-06-16, confirmed still absent — never reintroduce it.
- [Vendored CSS customizations](vendored-css-customizations.md) — `2. CSS` holds vendored third-party stylesheets; `awn.css` is intentionally color-customized — diff before overwriting from npm.

## User

- [User plays Epic Seven](user-game-epic-seven.md) — Marcus plays Epic Seven; this repo is a gear optimizer tool for that game — archetypes, substats, mods, reforge, GS all refer to its mechanics.

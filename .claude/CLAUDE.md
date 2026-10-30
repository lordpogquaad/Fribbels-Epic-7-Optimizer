# Pog E7 Optimizer — project instructions

Electron desktop gear optimizer for Epic Seven. jQuery renderer bundled by webpack 5, Java/Maven
optimizer backend shipped as a jar, Python scanner/importer helpers. Fork of Fribbels' optimizer.

Global working preferences apply (`~/.claude/CLAUDE.md`, `~/.claude/rules/`). This file holds only
what is specific to this repo.

## Memory

Project memory lives outside this repo, in the folder `autoMemoryDirectory` in
`.claude/settings.json` names (the config dir's `Project-Memory/Fribbels Epic 7 Optimizer/`). Claude
Code loads its `MEMORY.md` index as auto memory; read the relevant body on demand.

## Layout (numbered folders — quote every path; they contain spaces and dots)

```text
1. App/                       Electron app root — open Claude Code at the REPO root, not here
  package.json                build/tooling manifest — Yarn 4
  1. Master/1. BAT/start-dev.bat        dev launcher
  1. Master/2. PS1/install_frontend.ps1 installs the renderer manifest with npm (only way)
  1. Master/2. PS1/build_backend.ps1    Maven build → 1. Master/3. Jar/backend.jar
  2. Frontend/1. Source/      renderer: 1. HTML  2. CSS  3. ASSETS  4. JS  5. TS  6. JSON  7. PY  8. DIST
    package.json              runtime manifest — npm, no lockfile by design
  3. Backend/1. Source/       Java sources + pom.xml
  4. Both/1. Webpack/         four webpack configs (main/renderer × dev/prod)
  4. Both/2. Build/1. Scripts/  CopyAssets, CheckPortInUse, CheckNativeDep, CheckYarn, regen-installed-transitives
  5. Dev Only/                main.dev.js entry
2. Personal/                  gitignored
```

Two manifests, two package managers — why and how: project memory `two-manifests-two-package-managers`.
A PreToolUse hook (`hooks/guard-package-root.mjs`) denies npm package changes in this repo, except npm with both installer flags in the renderer tree, and denies yarn package changes in the renderer tree.

## Commands (run from `1. App/` unless noted)

```text
yarn install            outer deps; postinstall also runs electron-builder install-app-deps on the inner tree
yarn test:hooks         the project hooks' test mirrors in .claude/hooks-test/
yarn lint               eslint (flat config, eslint.config.mjs)
yarn lint:strict        report-only strict eslint (eslint.strict.config.mjs); always exits 0, not a gate
yarn typecheck          tsc7 (TypeScript 7 alias) -p ./ --noEmit; checkJs is off, so JS types are not checked
yarn typecheck:strict:report   report-only: checkJs on, writes .claude/plans/TYPECHECK-REPORT.md
yarn build              copy-assets + webpack main/renderer prod bundles
yarn dev                hot renderer dev server
yarn package-win        electron-builder NSIS + zip → release/
pwsh -File "1. Master/2. PS1/install_frontend.ps1"   inner (renderer) deps — never bare npm install
pwsh -File "1. Master/2. PS1/build_backend.ps1"      backend jar
```

Acceptance gate before claiming a JS/config change works: `yarn lint` → `yarn typecheck` → `yarn build`.
Backend changes: `build_backend.ps1` must produce a fresh `backend.jar`. Check the `SUCCESS` line and the
jar's timestamp: until `B7` is fixed, the script exits 0 when the built jar is missing.

## Windows/session traps

- Open the repo at its root: on Windows `.claude/settings.json` and `settings.local.json` are read from
  the session cwd with no parent fallback.
- `.claude/` is a protected path — its writes always prompt (or hit the auto-mode classifier). Expected.
- Claude Code's shell exports `ELECTRON_RUN_AS_NODE=1`, so `electron --version` / `yarn start` run from the
  Bash tool execute Electron as plain Node (prints the Node version, no window). To probe or launch the
  real app from a tool call, prefix `env -u ELECTRON_RUN_AS_NODE`; otherwise launch from a normal terminal.
- `node -e` with backslashes and MSYS `/f/...` paths to native binaries are machine-wide traps:
  `~/.claude/rules/shell-escapes.md`.

## Current state

Open work is in `.claude/plans/FIX LIST.md`, and finished work is in `.claude/plans/LEDGER.md`. There
is one of each, grouped by area (Repo, Backend, Frontend, Scanner, UI), because work crosses areas.
Check the fix list when starting work, and move a finished row to the ledger with its evidence.
Copilot-era files in `.github/` stay until `R8` removes them; do not build on them.

Commit and push only when Marcus says so. This repo is not covered by the standing commit grant.

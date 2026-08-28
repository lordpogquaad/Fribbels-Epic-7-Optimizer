# Pog E7 Optimizer — project instructions

Electron desktop gear optimizer for Epic Seven. jQuery renderer bundled by webpack 5, Java/Maven
optimizer backend shipped as a jar, Python scanner/importer helpers. Fork of Fribbels' optimizer.

Global working preferences apply (`~/.claude/CLAUDE.md`, `~/.claude/rules/`). This file holds only
what is specific to this repo.

## Memory

Project memory index:

```text
@./memory/MEMORY.md
```

Bodies are under `.claude/memory/`; read the relevant one on demand. `autoMemoryDirectory` in
`.claude/settings.json` points here so this project no longer writes into the user-scope store.

## Layout (numbered folders — quote every path; they contain spaces and dots)

```text
1. App/                       Electron app root — open Claude Code at the REPO root, not here
  package.json                build/tooling manifest — Yarn 4
  1. Master/1. BAT/start-dev.bat        dev launcher
  1. Master/2. PS1/install_frontend.ps1 installs the renderer manifest with npm (only way)
  1. Master/2. PS1/build_backend.ps1    Maven build → 1. Master/3. Jar/backend.jar
  2. Frontend/1. Source/      renderer: 1. HTML  2. CSS  3. ASSETS  4. JS  5. TS  6. JSON  7. PY  8. DIST
    package.json              runtime manifest — npm, no lockfile by design
  3. Backend/1. Source/       Java sources + 3. XML/pom.xml
  4. Both/1. Webpack/         four webpack configs (main/renderer × dev/prod)
  4. Both/2. Build/1. Scripts/  CopyAssets, CheckPortInUse, CheckNativeDep, CheckYarn, regen-installed-transitives
  5. Dev Only/                main.dev.js entry
2. Personal/                  gitignored
```

Two manifests, two package managers — why and how: `memory/two-manifests-two-package-managers.md`.
A PreToolUse hook (`hooks/guard-package-root.mjs`) denies npm in the Yarn root and yarn in the npm tree.

## Commands (run from `1. App/` unless noted)

```text
yarn install            outer deps; postinstall also runs electron-builder install-app-deps on the inner tree
yarn lint               eslint (flat config, eslint.config.mjs)
yarn typecheck          tsc7 (TypeScript 7 alias) -p ./ --noEmit — added 2026-08-28
yarn build              copy-assets + webpack main/renderer prod bundles
yarn dev                hot renderer dev server
yarn package-win        electron-builder NSIS + zip → release/
pwsh -File "1. Master/2. PS1/install_frontend.ps1"   inner (renderer) deps — never bare npm install
pwsh -File "1. Master/2. PS1/build_backend.ps1"      backend jar
```

Acceptance gate before claiming a JS/config change works: `yarn lint` → `yarn typecheck` → `yarn build`.
Backend changes: `build_backend.ps1` must produce a fresh `backend.jar`.

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

The 2026-08 overhaul is in progress; order and per-step decisions are in
`memory/overhaul-plan-2026-08.md`. Copilot-era files at the repo root (`COPILOT.md`,
`.github/chatmodes/`, `.qodo/`, `memory-bank/`, `*-copilot-customizations.ps1`, the `*.csv` /
`diff-report.txt` analysis dumps) are slated for removal in the reorganization step — do not build on them.

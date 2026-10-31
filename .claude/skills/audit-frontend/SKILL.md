---
name: audit-frontend
description: Audit the renderer JavaScript, TypeScript, webpack and package setup of the Pog E7 Optimizer for real defects and hidden problems. Runs the lint, type, build and dead-code tools, then dispatches frontend-sonnet in shards, or frontend-opus with deep, and files every finding. Read-only apart from the fix list and ledger.
disable-model-invocation: true
argument-hint: '[drift|deep [paths]]'
---

# /audit-frontend

Arguments: `$ARGUMENTS`

Read `.claude/skills/section-audit.md` now: it owns the modes, flow, agent contract and report.
This file supplies the frontend's values. The agents are `frontend-sonnet` and `frontend-opus`.

## Scope

Under `1. App/`: `2. Frontend/1. Source/4. JS/`, `5. TS/`, `6. JSON/`, `4. Both/`, `5. Dev Only/`, both
`package.json` files, and the tool configs at its root (`eslint.config.mjs`,
`eslint.strict.config.mjs`, `tsconfig.json`, `knip.jsonc`, `.dependency-cruiser.cjs`, `.jscpd.json`,
`babel.config.cjs`, `.yarnrc.yml`).

Exclude `4. JS/4. Importer Tab/1. Scanner/` (it belongs to `/audit-scanner`), every
`locales/*/translation.json` (`/audit-ui` owns them), the `dev/` locale and generated output. Shard by
tab folder inside `4. JS/`, with `6. Shared` as its own shard, and everything else as one more.

## Tool pass

These write only ignored output.

- Gates, exit 0 means clean: `yarn lint`, `yarn typecheck`, `yarn build`.
- `yarn lint:strict`: exit 0 includes findings, so count them.
- `yarn lint:dead` and `yarn lint:deps-graph`: exit 1 means findings; read the output to confirm the
  tool finished.
- `yarn lint:dupes`: exit 0 includes clones, so read its `Found N clones` line.
- `node "$CLAUDE_CONFIG_DIR/tools/tools/diag-scan.mjs" <files>`: the local Sonar engine, JS and TS
  only, when a file needs a second opinion. Exit 1 means findings, and exit 2 means not scanned.

## What the agents check

- **Silent failures:** a caught or ignored error, a rejected promise nobody handles, a failed backend
  call shown as success, a fallback that hides missing data.
- **Stale state:** grids or tabs showing old data after an import or an edit, and listeners registered
  twice.
- **Damage model parity:** the JS calculator against CPU `StatCalculator` and the GPU kernel. Report a
  gap as a finding.
- **Electron boundaries:** `contextIsolation`, IPC handlers and what reaches the renderer. The
  contextBridge refactor is a deliberate deferral, so report only what is new.
- **Config that hides problems:** an ESLint rule off, an ignore list, or a typecheck scope that leaves
  live code unchecked.
- **Packages:** a dependency nothing uses or one used but not declared, in either manifest. Report it;
  an audit changes no package.

## Not run in an audit

`yarn scan`, `yarn lint:strict:report`, `yarn sonar:report` and `yarn typecheck:strict:report` rewrite
tracked reports, so read the existing report and its date instead. Running the app stays in the
report's `Not run` line.

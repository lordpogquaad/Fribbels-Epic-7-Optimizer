---
name: eslint-strict-lane
description: How the report-only `yarn lint:strict` lane is built in 1. App and the traps hit building it
metadata:
  type: project
---

`1. App/eslint.strict.config.mjs` + `lint:strict` script mirror the config repo's strict lane (verified 2026-10-30).

- Report-only here = every rule demoted to 'warn' in the config's export (the recommended presets of promise/regexp ship 'error'); no --max-warnings. The config repo instead relies on 'warn' rules only.
- Type info comes from `1. App/tsconfig.json` (allowJs, strict), no separate jsconfig.strict.json was needed.
- eslint-plugin-n is scoped to Node/Electron files (nodeFiles list); the renderer is bundler-resolved.
- Bash hook `guard-command-traps` blocks `node <<EOF` inside compound commands and heredocs carrying JS: use the Write tool for scripts (scratchpad) and Edit for package.json.
- `yarn add -D` of the three plugins was not refused by the 24h age gate.

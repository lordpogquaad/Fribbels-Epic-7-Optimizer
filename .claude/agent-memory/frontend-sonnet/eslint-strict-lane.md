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

## Report-tool configs (R3, verified 2026-10-30)

Root: `.editorconfig`, `.markdownlint-cli2.jsonc`. `1. App/`: `knip.json`, `.dependency-cruiser.cjs`, `.jscpd.json`, `sonar-project.properties`.

- Run md lint from `1. App/` with `"../**/*.md"`; the root config is found by walking up and `extends: markdownlint/style/prettier` resolves via the hoisted package.
- knip's webpack plugin executes the webpack configs, which throw without NODE_ENV=production: use `"webpack": false` and list configs as entries. Renderer packages are in the inner manifest, so `exclude: ["unlisted"]`.
- depcruise `enhancedResolveOptions` rejects `modules`; inner node_modules resolves by walking up, except from `5. Dev Only/`.
- jscpd with `reporters: ["console"]` writes nothing into the repo.
- Prettier reads `.editorconfig`: keep indent_size 2 for Prettier-formatted types (its default) so `prettier --check` is unchanged.
- The Yarn age gate gave knip 6.43.0 (6.44 refused).

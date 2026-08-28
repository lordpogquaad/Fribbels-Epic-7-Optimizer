---
name: js-file-hygiene
description: "When touching a JS/TS file — run ESLint and make it lint-clean, strip BOM, never blanket-replace a pattern a helper's own body also contains, and never remove debug console/Log calls unless explicitly asked."
metadata:
  type: feedback
---

# JS/TS file hygiene (Marcus, established 2026-06 sweep; durable habit)

When editing any `.js`/`.ts`/`.tsx` file in this repo, beyond the manual bug/cleanup review:

- **Make it ESLint-clean (0 problems).** Confirmed 2026-08-28: `1. App/eslint.config.mjs` is still
  the flat config (`yarn lint` = `eslint . --cache`, resolves from cwd `1. App`). Run one file:
  ```powershell
  Push-Location "F:\Epic Seven Screenshots Only\New folder\Gear simulator files\Fribbels-Epic-7-Optimizer\1. App"
  & "node_modules\.bin\eslint.cmd" "2. Frontend\1. Source\4. JS\...\file.js"
  Pop-Location
  ```
  `yarn lint-fix` auto-fixes the unused-directive class tree-wide (`no-unused-vars` items are not
  auto-fixable). Common leftover-directive classes: unused `eslint-disable` comments (ESLint 9+'s
  `reportUnusedDisableDirectives` defaults to warn), unused `/* global */` names, unused `catch (e)`
  params (use `catch {` — ecmaVersion 2024 optional catch binding).
- **Strip any UTF-8 BOM** (`ef bb bf`); re-encode UTF-8 no-BOM; verify parse with `node --check`.
- **Line endings are handled repo-wide already** — root `/.gitattributes` (confirmed present,
  `* text=auto eol=lf`, `.bat`/`.cmd` stay crlf) + `endOfLine: "auto"` in `1. App/package.json`
  prettier config (confirmed present). Just run `prettier --write`; don't hand-convert CRLF/LF.
- **Never `replace_all` a text pattern inside a file whose own helper body contains that same
  pattern.** Concrete historical example: gating debug logs behind a per-file `_optDbg` helper via
  blanket `console.log(` → `_optDbg(` rewrote the helper's own `console.log(...args)` body into
  `_optDbg(...args)`, making it recurse infinitely — invisible to ESLint (valid syntax), silent
  until debug mode was enabled, and it shipped once (itemsTab.js, caught only in a later full-file
  pass). The `_optDbg` per-file helpers are gone now — replaced 2026-06-21 by the central
  `globalThis.Log` in [[log-control]] — but the trap generalizes to **any** find/replace across a
  file defining the very function being substituted in: convert call sites individually, and after
  editing a logging/wrapper helper, re-read its own body to confirm it didn't rewrite itself.
- **Keep debug `console.log`/`Log.debug` statements — the user actively uses them.** Never remove a
  log statement unless explicitly asked; gate noisy ones behind the `Log` flags in
  [[log-control]] instead of deleting them.

**Why:** these are recurring, easy-to-miss classes of bug/friction in this specific codebase, not
one-off review notes.

**How to apply:** treat this as part of "did I finish editing this file," not an optional extra
pass — run lint + BOM check + the replace_all sanity check whenever a JS/TS file is touched.
[[log-control]]

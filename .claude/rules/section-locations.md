# Section locations

Where each section of the app lives, and who owns it. Paths are relative to `1. App/` and every one
needs quoting. The full tree and the commands are in `.claude/CLAUDE.md`.

| Section  | Lives in                                                                                              | Skill             |
| -------- | ----------------------------------------------------------------------------------------------------- | ----------------- |
| Backend  | `3. Backend/1. Source/` (`1. Java/`, `3. XML/pom.xml`), `3. Backend/2. Apache Maven/`, `1. Master/3. Jar/` | `/audit-backend`  |
| Frontend | `2. Frontend/1. Source/4. JS/`, `5. TS/`, `6. JSON/`, `4. Both/`, `5. Dev Only/`, both `package.json`  | `/audit-frontend` |
| Scanner  | `2. Frontend/1. Source/7. PY/`, and its caller `2. Frontend/1. Source/4. JS/4. Importer Tab/1. Scanner/` | `/audit-scanner`  |
| UI       | `2. Frontend/1. Source/1. HTML/app.html`, `2. CSS/`, `3. ASSETS/`, under the same source root          | `/audit-ui`       |

The skills are planned, not built yet (`R6` in `.claude/plans/FIX LIST.md`).

## Inside `4. JS/`

Each tab has its own numbered folder: `1. Optimizer & Multi-Hero Optimizer Tab`, `2. Gear & Enhancing Tab`,
`3. Hero Tab`, `4. Importer Tab`, `5. Archetype Tab`, `7. Gear Analysis Tab`. Code used by several tabs
goes in `6. Shared`.

## Inside `1. Java/`

`0. Main`, `1. Core`, `2. Model`, `3. DB`, `4. Handler`, `5. Request`, `6. Response`, `7. Enums`,
`8. GPU`, `10. Tests`. The `com/` tree is symlinks to these folders: edit the numbered path, and expect
git to list a change under both.

## Do not edit by hand

- `2. Frontend/1. Source/1. HTML/assets/` is build output from `3. ASSETS/` (`yarn copy-assets`).
- `2. Frontend/1. Source/8. DIST/`, `main.prod.js` and `renderer.dev.js` are webpack output.
- `1. Master/3. Jar/backend.jar` comes from `build_backend.ps1`.
- `2. CSS/` holds vendored stylesheets: diff before replacing one from npm.

## Tracking

Open work: `.claude/plans/FIX LIST.md`. Findings and finished work: `.claude/plans/LEDGER.md`.

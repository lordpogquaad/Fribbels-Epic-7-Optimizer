# Section locations

Where each section of the app lives, and who owns it. Paths are relative to `1. App/` and every one
needs quoting. The full tree and the commands are in `.claude/CLAUDE.md`.

| Section  | Lives in                                                                                                                                  | Skill             |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Backend  | `3. Backend/1. Source/` (`1. Java/`, `pom.xml`), `3. Backend/2. Apache Maven/`, `1. Master/3. Jar/`, `1. Master/2. PS1/build_backend.ps1` | `/audit-backend`  |
| Frontend | `2. Frontend/1. Source/4. JS/`, `5. TS/`, `6. JSON/`, `4. Both/`, `5. Dev Only/`, both `package.json`                                     | `/audit-frontend` |
| Scanner  | `2. Frontend/1. Source/7. PY/`, and its caller `2. Frontend/1. Source/4. JS/4. Importer Tab/1. Scanner/`                                  | `/audit-scanner`  |
| UI       | `2. Frontend/1. Source/1. HTML/app.html`, `2. CSS/`, `3. ASSETS/`, under the same source root                                             | `/audit-ui`       |

Each section has a Sonnet and an Opus agent in `.claude/agents/`: `<section>-sonnet` for routine
units and `<section>-opus` for trap-dense or high-stakes ones, where `<section>` is `backend`,
`frontend`, `scanner` or `ui`. `section-haiku` does mechanical work in any section. Each agent's
effort is set in its own file. A subagent gets no automatic model fallback, so after a cyber
refusal the lead re-dispatches the unit to `opus-worker-opus48`. The skills are hidden from the model, so Marcus runs them by name; their shared
flow and the agents' audit contract are in `.claude/skills/section-audit.md`. In `6. JSON/`, the UI
section owns the `translation.json` locales and the frontend owns the rest.

The scanner is a Scapy packet sniffer (`7. PY/1. Scanner/1. Core/scanner.py`). The app has no OCR.

## Inside `4. JS/`

Each tab has its own numbered folder: `1. Optimizer & Multi-Hero Optimizer Tab`, `2. Gear & Enhancing Tab`,
`3. Hero Tab`, `4. Importer Tab`, `5. Archetype Tab`, `7. Gear Analysis Tab`. Code used by several tabs
goes in `6. Shared`.

## Inside `1. Java/`

`com/`, `1. Core`, `2. Model`, `3. DB`, `4. Handler`, `5. Request`, `6. Response`, `7. Enums`,
`8. GPU`, `10. Tests`. `1. Core` to `8. GPU` are directory junctions to the real folders in
`com/fribbels/`: edit and search under `com/fribbels/`, where `Main.java` also lives. Git lists each
package file under both its numbered path and `com/fribbels/`, so a commit stages both paths of
every changed file there. `Main.java` and `10. Tests` have one path.

## Conventions

- A new UI string is an `i18next` key, added to every `translation.json` under
  `2. Frontend/1. Source/6. JSON/3. TRANSLATION/locales/` except `dev/`.
- Check gear stat formulas and numeric constants against in-game values before changing them.

## Do not edit by hand

- `2. Frontend/1. Source/1. HTML/assets/` is build output from `3. ASSETS/` (`yarn copy-assets`).
- `2. Frontend/1. Source/8. DIST/`, `main.prod.js` and `renderer.dev.js` are webpack output.
- `1. Master/3. Jar/backend.jar` comes from `build_backend.ps1`.
- `2. CSS/` holds vendored stylesheets: diff before replacing one from npm.

## Tracking

Open work: `.claude/plans/FIX LIST.md`. Findings and finished work: `.claude/plans/LEDGER.md`.

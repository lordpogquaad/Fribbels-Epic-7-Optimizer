# COPILOT.md — Fribbels Epic Seven Gear Optimizer

Architectural conventions and patterns for GitHub Copilot context.

---

## Project Summary

Electron desktop app for gear optimization in the mobile game _Epic Seven_. Scans in-game gear through packet sniffing through ncap, scores gear pieces against archetypes, and finds optimal builds using a Java search backend.

---

## Directory Layout

```
app/
  app.html            — Single-page HTML shell (~7050 lines); all UI panels live here
  main.dev.js         — Electron main process; IPC handlers, BrowserWindow setup
  index.tsx           — React renderer root
  css/style.css       — Main stylesheet
  js/
    init.js           — App initialization, IPC bridge to Java backend
    lib/
      gear/           — Reforge constants, scoring engine adapter
      scoring/        — GAS archetype scoring (CommonJS layer)
      *.js            — Feature modules (importer, scanner, reforge, damageCalc, etc.)
backend/src/          — Java 8 Maven project (optimizer search engine)
data/
  jar/                — Compiled Java JAR (must be rebuilt when backend/* changes)
  locales/            — i18next locale files (8 languages: en, en-US, fr, ja, ko, ru, zh, zh-TW)
  tessdata/           — Tesseract OCR training data
configs/              — Webpack config files
memory-bank/          — Project documentation (architecture, tasks, audit records)
.github/
  instructions/       — Copilot instruction files
  chatmodes/          — Copilot agent mode definitions (103 files)
```

---

## Frontend Stack

| Technology        | Role              |
| ----------------- | ----------------- |
| Electron 42       | Desktop shell     |
| React 19          | UI framework      |
| Redux Toolkit 2   | State management  |
| React Router 7    | Tab routing       |
| TypeScript 6      | Type checking     |
| Webpack 5         | Bundler           |
| i18next 26        | Localization      |
| ag-Grid Community | Results data grid |

## Backend Stack

| Technology | Role                                     |
| ---------- | ---------------------------------------- |
| Java 21    | Optimizer search engine (spawned as JAR) |
| Maven 3.8  | Build tool                               |
| Gson       | JSON serialization                       |

---

## Key Architectural Patterns

### 1. ESM / CJS Module Split

- All UI and gear code: **ES Modules** (webpack-bundled)
- Scoring engine (`e7Scorer.js`, `archetypeScorer.js`, `e7ArchetypeRules.js`): **CommonJS**
- Bridge: `itemAugmenter.js` (ESM) calls `require('archetypeScorer')` — webpack resolves this at build time

### 2. Global Scope Bridge

`inputHandler.js` populates `global.Gears`, `global.Sets`, `global.Ranks`, `global.Stats` at startup from `enums.js`. React components read gear constants from `global.*` to avoid import cycles.

### 3. Single Source of Truth — `reforgeConstants.js`

All reforge roll tables, flat ranges, rank maximums, GS weights → `js/lib/gear/reforgeConstants.js`. Both `reforge.js` and `itemSimulator.js` import from it.

### 4. Scoring Engine Layers

```
archetypeScorer.js     — Entry point: scoreAllItems(items)
  └─ e7Scorer.js       — Core GAS functions; two scoring tracks (Off. vs UOff.)
       └─ e7Constants.js
       └─ e7ArchetypeRules.js  — loaded via vm.createContext
```

Two scoring tracks:

- `OFFICIAL_*` → archetype columns prefixed `Off.`
- `ARCHETYPE_RULES` / `SCORING_CONFIGS` → columns prefixed `UOff.`

### 5. Java Backend IPC

`init.js` spawns the Java JAR as a child process and communicates via stdin/stdout JSON. **If `backend/src/**`changes, rebuild the JAR and commit`data/jar/\*.jar`.\*\*

---

## Coding Conventions

- **Vanilla JS modules** (not TypeScript) in `app/js/lib/` — JSDoc comments for public functions
- **No `console.log` in production paths** — use `Logger.log()` or `_logProcessing()` for debug
- **Locale keys** must exist in all 8 locale files (`data/locales/`) when new UI strings are added
- **Gear stat formulas** — always verify against in-game values before changing numeric constants
- **Reforge constants** — single source of truth; do not hardcode tier values elsewhere
- **Magic numbers** → named constants in `constants.js` or `reforgeConstants.js`

---

## File Relationships

| Change in...            | Also update...                        |
| ----------------------- | ------------------------------------- |
| `backend/src/**/*.java` | Rebuild JAR → commit `data/jar/*.jar` |
| `enums.js`              | `inputHandler.js` (global bridge)     |
| `reforgeConstants.js`   | `reforge.js`, `itemSimulator.js`      |
| `e7ArchetypeRules.js`   | `archetypeScorer.js`, `e7Scorer.js`   |
| Any new UI string       | All 8 locale files in `data/locales/` |
| `app/app.html` panels   | `style.css` (matching selectors)      |

---

## What NOT to Do

- Do not add `NEXT_PUBLIC_*` env vars or browser-only APIs — this is Electron, not a web app
- Do not use Java 9+ APIs — backend must compile with `maven.compiler.source=1.8` (updated to java 21 as well as maven needs testing tho)
- Do not change Electron security flags (`nodeIntegration`, `contextIsolation`) without discussion
- Do not edit `data/jar/*.jar` directly — always rebuild from `backend/src/`
- Do not hardcode locale strings — always use i18next keys

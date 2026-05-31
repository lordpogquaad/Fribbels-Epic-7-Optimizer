# Tech Context — Fribbels Epic Seven Gear Optimizer

## Directory Structure

```
Fribbels-Epic-7-Optimizer/
├── 1. App/
│   ├── 1. Master/2. Data/          — Locales (8 langs), OCR tessdata, Java JAR, Python scanner
│   ├── 2. Frontend/1. Source/      — SOURCE ROOT: main.dev.js, index.tsx, js/lib/**
│   ├── 3. Backend/1. Source/       — Java Maven source (optimizer engine)
│   └── 4. Both/1. Webpack/         — Webpack configs (base, dev, prod, dll, eslint)
├── memory-bank/                    — This documentation
├── .github/
│   ├── chatmodes/                  — Copilot agent mode files
│   └── instructions/               — Copilot instruction files (memory-bank, code-review, etc.)
├── MASTERPLAN.md                   — Living audit log of all development phases
└── package.json                    — Root package (dev tooling only)
```

## Frontend Stack

| Technology       | Version | Role                              |
| ---------------- | ------- | --------------------------------- |
| Electron         | 42.3.0  | Desktop shell                     |
| React            | 19.2.6  | UI framework                      |
| Redux Toolkit    | 2.12.0  | State management                  |
| React Router DOM | 7.16.0  | Tab routing                       |
| TypeScript       | 6.0.3   | Type checking                     |
| Webpack          | 5.107.2 | Bundler                           |
| Babel 7          | —       | JS transpilation                  |
| i18next          | 26.3.0  | Localization (8 languages)        |
| @electron/remote | —       | Main process access from renderer |

### Electron Security Notes

- `nodeIntegration: true`, `contextIsolation: false` — intentional for this app (direct Node.js access needed)
- `enableRemoteModule: true` — allows renderer to call main process objects
- These settings are a known trade-off for Electron desktop apps with full local file access

## Backend Stack

| Technology                  | Version          | Role                                  |
| --------------------------- | ---------------- | ------------------------------------- |
| Java                        | 21 (`maven.compiler.release=21`) | Runtime requirement          |
| Maven                       | 3.8.8            | Build tool                            |
| Gson                        | 2.14.0           | JSON serialization                    |
| Jackson Jr                  | 2.21.4           | Lightweight JSON                      |
| Guava                       | 33.6.0-jre       | Collections utilities                 |
| Apache Commons Collections4 | 4.5.0            | Extra collection types                |
| Apache Commons IO           | 2.22.0           | File I/O utilities                    |
| Apache Commons Lang3        | 3.20.0           | String/array utilities                |
| JUnit Jupiter               | 6.1.0            | Unit testing                          |
| Lombok                      | 1.18.46          | Boilerplate reduction (`@Data`, etc.) |
| aparapi                     | 3.0.2            | GPU/OpenCL acceleration               |
| aparapi-jni                 | 1.4.3            | JNI bridge for aparapi (see TASK004)  |

## Build & Testing

### Commands

```bash
# Frontend development
yarn dev                    # Start renderer dev server + Electron
yarn start-main-dev         # Start just the Electron main process (needs dev server on port 1212)
yarn build                  # Production build

# Backend (Java)
cd "1. App/3. Backend/1. Source"
mvn package                 # Build JAR → data/jar/

# Tests
yarn test                   # Jest unit tests
```

### Test Frameworks

- **Jest 30** — Frontend unit tests
- **JUnit Jupiter 6.1** — Java backend tests (in `backend/tst/`)
- **TestCafe** — E2E tests

### Key Build Artifacts

- `1. App/2. Frontend/1. Source/main.prod.js` — compiled Electron main process (minified bundle, DO NOT READ)
- `dll/renderer.dev.dll.js` — pre-compiled vendor DLL for faster dev builds
- `data/jar/` — compiled Java JAR

## Linting / Formatting

- **ESLint** with Airbnb config + TypeScript rules (`configs/webpack.config.eslint.js`)
- **Prettier** — code formatting
- **Stylelint** — CSS/SASS linting

## Source Root Key Files

All relative to `1. App/2. Frontend/1. Source/`:

```
main.dev.js                    — Electron main process entry point
index.tsx                      — React renderer entry point
js/lib/
├── inputHandler.js            — Global scope bridge (assigns to global.*)
├── constants.js               — UI constants; setsByIndex derived from setEnum
├── enums.js                   — rankEnum (Title Case), setEnum (22 sets, *Set suffix)
├── gear/
│   ├── reforgeConstants.js    — ★ Single source of truth: roll tables, rank data (CJS)
│   ├── reforge.js             — Reforge prediction engine (ESM)
│   ├── itemSimulator.js       — Monte Carlo gear simulator (ESM)
│   ├── itemAugmenter.js       — ★ ESM→CJS bridge; calls archetypeScorer (ESM)
│   ├── itemSerializer.js      — JSON serialization (ESM)
│   ├── gearRating.js          — Score/dScore/sScore/cScore formulas
│   └── mainStatFixer.js       — Main stat normalization
└── scoring/
    ├── e7Constants.js         — Game constants; imports from reforgeConstants (CJS)
    ├── e7ArchetypeRules.js    — GAS archetype rules; path via E7_ARCHETYPE_RULES_PATH env var (CJS)
    ├── e7Scorer.js            — ★ Core scoring engine, ~1175 lines (CJS)
    └── archetypeScorer.js     — Fribbels adapter; exports scoreAllItems() (CJS)
```

## Localization

8 language folders under `1. App/1. Master/2. Data/locales/`:
`en/`, `en-US/`, `fr/`, `ja/`, `ko/`, `ru/`, `zh/`, `zh-TW/`

When adding new user-facing strings, translation keys must be added to ALL 8 locale files.

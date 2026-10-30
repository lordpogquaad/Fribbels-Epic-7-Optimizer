# Fix list

Open work only, grouped by area. Finished items leave this list and get a dated entry in
[LEDGER.md](LEDGER.md), which also holds the evidence. Older history: `Bugs/` and `Improvements/`.

Status: `doing` = in progress, `next` = ready to start, `later` = not scheduled, `blocked` = waiting
on something named in the row.

## Repo-wide

| ID  | Status | Item                                                                                                                                                                                                                                                                                                       |
| --- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R3  | next   | Adapt config-repo files: `.prettierrc.json`, `.prettierignore`, `.gitattributes`, `.gitignore`, `.editorconfig`, `.markdownlint-cli2.jsonc`, `.remarkrc.mjs`, `jsconfig.json`, `jsconfig.strict.json`, `knip.json`, `.dependency-cruiser.cjs`, `.jscpd.json`, `sonar-project.properties`, plus the packages they need. Merge with existing files; paths must fit the numbered layout |
| R4  | next   | Move the `prettier` block from `1. App/package.json` into the rc file (part of R3)                                                                                                                                                                                                                         |
| R6  | next   | Build the agents and skills: Sonnet + Opus pair each for Java/Maven, JS/TS, Python and UI, one shared Haiku agent, and `/audit-backend`, `/audit-frontend`, `/audit-scanner`, `/audit-ui`. Opus, Sonnet and Haiku 5.5; Fable 5.1 as advisor if it can be set; lead chooses effort                           |
| R7  | later  | Review the numbered layout problems one at a time; no blanket restructure                                                                                                                                                                                                                                  |
| R8  | later  | Remove the Copilot leftovers at the repo root, including `archive-copilot-customizations.ps1` and `restore-copilot-customizations.ps1`                                                                                                                                                                     |
| R9  | later  | Decide on `compare-files.ps1` (hardcoded paths, depends on `2. Personal`)                                                                                                                                                                                                                                  |
| R10 | later  | Make `sync-constants.ps1` a hook that runs after its two source files in `2. Personal` change                                                                                                                                                                                                              |
| R11 | later  | `start-dev.bat` is LF in the working tree although `.gitattributes` says CRLF                                                                                                                                                                                                                              |
| R13 | next   | TypeScript language server fails: global `typescript` 7.0.2 has no `tsserver`, and the repo root has no `node_modules`. Needs a TypeScript 6 install it can find |
| R14 | next   | Match the config repo's TypeScript and ESLint setup: add the `//typescript` note, `eslint.strict.config.mjs`, a report-only `lint:strict`, and `eslint-plugin-regexp`, `-promise` and `-n`. Keep `typescript` 6 because `typescript-eslint` needs below 6.1 |
| R15 | next   | `yarn up "@babel/core@^8.0.10"` after 2026-10-30 16:35 UTC, when it passes Yarn's 24-hour age gate. Skip if `F4` removes Babel first |
| R12 | later  | `guard-package-root.mjs` also blocks `npm install -g`, a false positive                                                                                                                                                                                                                                    |

## Backend (Java / Maven)

| ID | Status  | Item                                                                                                                                         |
| -- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| B3 | next    | Find what creates the stray folders in `3. Backend/1. Source/3. XML/`, fix it, then remove them once. Likely `<directory>../target</directory>` |
| B4 | blocked | GPU: both kernels fail aparapi translation on JDK 25 and 27. Needs a real GPU run to confirm; this machine has no OpenCL                     |
| B5 | later   | Keep the GPU path ready for a future GPU: low priority, never deleted. Keep kernels in step with CPU damage changes, keep a CPU-vs-kernel parity test, and prepare a JOCL replacement for aparapi in small steps (project memory `gpu-backend-successor`)                                                              |
| B6 | later   | Make the GPU setting show when a run fell back to CPU                                                                                        |

## Frontend (JS / TS / ESLint / JSON)

| ID | Status | Item                                                                    |
| -- | ------ | ----------------------------------------------------------------------- |
| F1 | later  | Replace deprecated `string-similarity`                                  |
| F2 | later  | Review findings from knip, dependency-cruiser and jscpd after R3 lands  |
| F3 | next   | Run the Sonar review on code changed by the update work                 |
| F5 | next   | When the backend aborts for exceeding 1,000,000,000,000 permutations, the popup still blames the hero, a gear set or GPU. Show the real reason. The log line also garbles its dash (encoding) |
| F4 | next   | Drop Babel: rename `CheckPortInUse.js` and `CheckNativeDep.js` to `.mjs`, remove `@babel/register` from the scripts, then remove the three `@babel` packages and `babel.config.cjs` after checking nothing else uses them |
| F6 | later  | Artifact icons load from Smilegate's site, which returns 403 for four new artifacts (`efk26`, `efw42`, `efa34`, `efr35`). Add a fallback for a missing icon. Stats are unaffected |

## Scanner (Python)

Python, scapy and Npcap were current and running on 2026-10-30.

| ID | Status | Item                                                                                                       |
| -- | ------ | ---------------------------------------------------------------------------------------------------------- |
| S4 | next   | Show skipped heroes after an import: the merge skips heroes silently, and the UI gives no sign that any were left out |
| S5 | next   | Rex publishes patches on `e7-data-<id>` branches before `main`. Check for a newer branch each patch, and go back to the default sync once `main` catches up |
| S1 | later  | Declare scapy in a `requirements.txt`; nothing in the repo records it or the Python version                 |
| S2 | later  | Check whether `2. Tessdata/eng.traineddata` is still needed: no JS or manifest reference to Tesseract found |

## UI

| ID | Status | Item                                                                                                                                      |
| -- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| U1 | next   | Marcus's runtime checks: ag-grid tabs and dark mode, new heroes and icons, Fervor ×1.2 on CPU and Hero Library, 400% cap, one optimization |
| U2 | next   | Test `launch.json` with `yarn start-renderer-dev` and **Electron: Full App**                                                              |

# System Patterns — Fribbels Epic Seven Gear Optimizer

## Architecture Overview

```
Electron Main Process (main.dev.js)
├── BrowserWindow → loads app.html
├── IPC handlers (autoUpdater, version, test/check)
└── @electron/remote bridge

Webpack Renderer Process (React SPA)
├── index.tsx → React root
├── Redux store (RTK)
├── React Router (tabs)
└── JS lib layer
    ├── inputHandler.js (global scope bridge)
    ├── constants.js / enums.js
    ├── gear/ (scoring, simulation, reforge)
    └── scoring/ (GAS archetype engine — CJS)

Java Backend (JAR)
└── Spawned as child process via IPC
    └── Runs optimizer search, returns results
```

## Key Architectural Decisions

### 1. ESM / CJS Module Split

The frontend uses **ES Modules** (webpack bundled) for all UI and gear code. The scoring engine (`e7Scorer.js`, `archetypeScorer.js`, `e7ArchetypeRules.js`) uses **CommonJS** because it was originally ported from a non-module environment.

**Bridge pattern:** `itemAugmenter.js` is an ES Module that calls `require('archetypeScorer')` at runtime — webpack handles the ESM→CJS boundary correctly at build time.

| Module                                                                       | System                             |
| ---------------------------------------------------------------------------- | ---------------------------------- |
| `e7Constants.js`, `e7Scorer.js`, `archetypeScorer.js`, `e7ArchetypeRules.js` | CommonJS                           |
| `reforge.js`, `itemSimulator.js`, `itemAugmenter.js`, `itemSerializer.js`    | ES Module                          |
| `enums.js`, `inputHandler.js`, `constants.js`                                | ES Module (assigned to `global.*`) |

### 2. Global Scope Bridge (`inputHandler.js`)

React components access gear constants via `global.Gears`, `global.Sets`, `global.Ranks`, `global.Stats`. These are populated by `inputHandler.js` at startup from `enums.js`. This avoids import cycles in deeply nested UI components.

### 3. Single Source of Truth — `reforgeConstants.js`

All reforge roll tables, flat roll ranges, rank maximums, and GS weights live in `js/lib/gear/reforgeConstants.js`. Both `reforge.js` and `itemSimulator.js` import from it. `e7Constants.js` also imports `ITEM_RANK` from it.

### 4. Scoring Engine Architecture (CJS layer)

```
archetypeScorer.js     — Fribbels adapter; main entry: scoreAllItems(items)
  └─ e7Scorer.js       — Core GAS functions (1175 lines); two scoring tracks
       └─ e7Constants.js — Game constants + derived tables
       └─ e7ArchetypeRules.js — Archetype rule definitions loaded via vm.createContext
```

**Two scoring tracks:**

- `OFFICIAL_ARCHETYPE_RULES` + `OFFICIAL_SCORING_CONFIGS` → columns prefixed `Off.`
- `ARCHETYPE_RULES` + `SCORING_CONFIGS` → columns prefixed `UOff.`

### 5. Archetype Score Columns in UI

`itemsGrid.js` renders gear columns including:

- `Top Off.` — best official archetype score
- `Top Arch.` — best personal archetype score
- `Top UOff.` — alias for Top Arch. (shown as UOff.)
- `Off. C.Power` / `Off. A.Power` / `UOff. C.Pwr` / `UOff. A.Pwr`

Breakdown tooltips show all non-zero scores for that item, sorted descending, Off. and UOff. separated by a divider line.

### 6. Set Name Convention

Fribbels items store set names WITH `"Set"` suffix (`"SpeedSet"`).  
Archetype rules store set names WITHOUT suffix (`"Speed"`).  
The scoring adapter handles stripping on lookup via `endsWith('Set')` check.

### 7. C.Power / A.Power Aggregate Formula

Post-processing after all per-archetype scores are computed:

```
C.Power = TopSpeed (if >0) + Speed (with qualifier) + best priority group score
```

Priority groups: DPS(1) > Tank(2) > EFF.ER(3) > Bruiser(4) > Future(5)  
A.Power = same but excludes Future from groups.  
`UOff. C.Power` borrows `Off. Future` (no personal Future archetype exists).

### 8. Heroic Phantom Substat

Before scoring a Heroic item, a fake "Phantom" substat (0 value, 1 roll) is injected at scoring time. This normalizes Heroic gear against Epic so both score on the same roll-count scale. The phantom is NOT written to item data.

### 9. DPS Armor Special Case

DPS Armor subtracts 1 from both `totalRolls` and `maxRolls` because Defense (the Armor main stat) overlaps with DPS scoring substats and would double-count.

## Design Patterns Used

- **RTK slices** for all Redux state mutations (never direct mutation)
- **Guard clauses** over nested if-else in scoring functions
- **Pre-built lookup Map** (`_archetypeSetMainCache`) for O(1) applicability checks in hot scoring loop
- **Derived constants** — `setsByIndex` in `constants.js` is derived from `Object.values(setEnum)` (not maintained separately)
- **Environment variable override** for external file paths (`E7_ARCHETYPE_RULES_PATH`)

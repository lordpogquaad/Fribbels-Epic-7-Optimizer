# Active Context — Fribbels Epic Seven Gear Optimizer

**Last updated:** May 2026

## Current Focus

All code phases (5–9) are complete. The app is ready for **end-to-end integration testing** to validate that all changes work together in the running Electron app.

## Recent Changes (Phases 5–9)

### Phase 9 — Scoring Engine UI Integration ✅

- `archetypeScorer.js` changes compiled with 0 errors
- `itemsGrid.js` — archetype columns added: `Top Off.`, `Top Arch.`, `Top UOff.`, `Off. C.Power`, `Off. A.Power`, `UOff. C.Pwr`, `UOff. A.Pwr` (hidden by default)
- Comparison panel updated with `buildComparisonScoreTable`
- `itemsTab.js` — archetype filter dropdown + min score input + quick-filter buttons added

### Phase 8 — Configurable Path + Enum/Constant Unification ✅

- `e7ArchetypeRules.js`: `GAS_RULES_PATH` reads `E7_ARCHETYPE_RULES_PATH` env var first
- `constants.js setsByIndex`: now derived from `Object.values(setEnum)` (not hard-coded)
- `ITEM_RANK` centralized in `reforgeConstants.js`; `e7Constants.js` imports it

### Phases 5–7 — Constants Deduplication + Enum Fixes ✅

- `reforgeConstants.js` created as single source of truth
- `reforge.js`, `itemSimulator.js`, `e7Constants.js` all import from it
- `rankEnum` values fixed to Title Case (`'Epic'` not `'epic'`)
- `setEnum` expanded from 17 → 22 sets with `*Set` suffix convention
- `itemSimulator.js` GS weights fixed: Speed `9/4`, CC% `9/5`, CD% `9/8`
- `archetypeScorer.js` GEAR_SLOTS now derived from `Object.values(GEAR_SLOT)`

## Next Steps — Bug Testing Checklist

These items are **UNCHECKED** in MASTERPLAN.md and must be validated:

- [ ] Run `yarn dev` — confirm app loads in Electron window
- [ ] Load a saved gear set — verify items display correctly
- [ ] Run optimizer on 1 hero — verify results appear
- [ ] Open Item Simulator tab — verify simulation runs (tests `itemSimulator.js` import of `reforgeConstants`)
- [ ] Open Reforge tab — verify reforge values show correctly (tests `reforge.js` import of `reforgeConstants`)
- [ ] Confirm archetype scores appear on gear items (tests full `archetypeScorer.js` pipeline)

## Active Decisions

### `constants.js speedRollsToValue` is intentionally different from `reforgeConstants.js`

`constants.js` has an extra `0: 0` key (for "no rolls yet" UI display state). Do NOT merge this into `reforgeConstants.js`. See MASTERPLAN.md §3.

### No personal `UOff. Future` archetype

Future archetype is official-only. `UOff. C.Power` borrows `Off. Future` for its group calculation. Do not add a personal Future unless explicitly requested, and it would require entries in `ARCHETYPE_RULES` for all 6 slots plus new `SCORING_CONFIGS` tiers.

### Java 8 compatibility

Do not use any Java 9+ APIs. The backend must compile with `maven.compiler.source=1.8`.

## Known Issues / Watch Points

- None confirmed post-Phase 9, but integration testing may surface runtime issues
- `DeleteSourceMaps.js` was fixed for rimraf v4+ (glob expansion via `glob.sync`)
- Webpack dev server must be running on port 1212 before starting Electron main process separately

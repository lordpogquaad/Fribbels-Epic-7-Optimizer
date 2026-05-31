# TASK001 — Scoring Engine Integration

**Status:** Completed  
**Added:** May 2026  
**Updated:** May 2026

## Original Request
Integrate the GAS (Gear Archetype Scoring) engine from a personal Google Sheets project into the Fribbels Epic Seven Gear Optimizer Electron app. The scoring engine should analyze gear items, assign archetype scores (offensive/utility-offensive), and display the results in the existing gear management UI.

## Thought Process
The GAS scoring engine is a sophisticated multi-archetype system that needed to be ported from a Google Apps Script context to a Node.js/Electron environment. The key challenges were:
1. Module system mismatch (GAS/CJS vs Electron's mixed ESM+CJS environment)
2. Constant deduplication (roll tables existed in multiple files with subtle inconsistencies)
3. Enum alignment (rank/set names used different casing conventions)
4. UI integration (adding archetype columns without breaking existing gear display)

The architecture decision was to keep the scoring engine as CJS modules under `js/lib/scoring/` and bridge to the ESM world via `itemAugmenter.js`.

## Implementation Plan
- [x] Phase 5: Create `reforgeConstants.js` as single source of truth
- [x] Phase 6: Port `e7Constants.js` + `e7Scorer.js` to use `reforgeConstants`
- [x] Phase 7: Fix enum values (rankEnum Title Case, setEnum 22 sets)
- [x] Phase 8: Configure path via env var; unify `setsByIndex` derivation; centralize `ITEM_RANK`
- [x] Phase 9: Add archetype columns to items grid + comparison panel + filter UI

## Progress Tracking

**Overall Status:** Completed — 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Create reforgeConstants.js | Complete | May 2026 | Roll tables, rank data |
| 1.2 | Port e7Constants.js | Complete | May 2026 | Imports from reforgeConstants |
| 1.3 | Port e7Scorer.js | Complete | May 2026 | ~1175 lines, all special cases |
| 1.4 | Create archetypeScorer.js | Complete | May 2026 | scoreAllItems() entry point |
| 1.5 | Fix rankEnum/setEnum | Complete | May 2026 | Title Case, 22 sets |
| 1.6 | Fix itemSimulator.js GS weights | Complete | May 2026 | Speed 9/4, CC% 9/5, CD% 9/8 |
| 1.7 | Configurable GAS rules path | Complete | May 2026 | E7_ARCHETYPE_RULES_PATH env var |
| 1.8 | Unify constants derivation | Complete | May 2026 | setsByIndex from Object.values(setEnum) |
| 1.9 | Add archetype UI columns | Complete | May 2026 | 7 new columns, hidden by default |
| 1.10 | Add archetype filter UI | Complete | May 2026 | Dropdown + min score + quick buttons |
| 1.11 | Update comparison panel | Complete | May 2026 | buildComparisonScoreTable |

## Progress Log

### May 2026
- Completed all phases 5–9
- Webpack rebuild confirmed 0 errors after each phase
- Node.js smoke test confirmed `scoreAllItems()` returns correct results for test items
- Special cases verified: Heroic phantom injection, DPS Armor -1 roll, set name suffix stripping
- `yarn start-main-dev` confirmed exits without JS errors
- Integration testing deferred to TASK002

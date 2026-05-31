# Active Context — Fribbels Epic Seven Gear Optimizer

**Last updated:** July 2026

## Current Focus

All code phases (5–9) are complete. The app is ready for **end-to-end integration testing** to validate that all changes work together in the running Electron app.

## Recent Changes

### TASK007 — Object Calisthenics Audit (Java Backend) ✅

- Full 9-rule OC audit complete for Java backend domain classes and handlers
- IMPORTANT violations: Rules 3, 6, 7, 8 (primitive wrapping, abbreviations, entity size, instance variable count)
- SUGGESTION violations: Rules 1, 2, 4, 5, 9 (indentation, else keyword, collections, dot chains, getters/setters)
- All findings documented in `tasks/TASK007-oc-audit.md` and `# Code Citations.md`
- 4 high-priority advisory items deferred: `GLOSSARY.md` (S effort), Sorter comparator extraction (M), StatContext parameter object (M), StatCalculator split (L)
- No source code changes made

### TASK005 — Korean README Localization ✅

- `localization/ko-kr/1. App/README.md` created (2026-06-01)
- Full 428-line README translated to Korean; all code blocks, image URLs, and external links preserved verbatim
- TOC anchors updated to GitHub-compatible Korean slugs

### TASK003 — A11y Audit Logged ✅

- WCAG 2.2 AA audit completed for `app/app.html` and `app/css/style.css`
- 16 open items (5 CRITICAL, 9 IMPORTANT, 2 SUGGESTION) recorded in `tasks/Task List and Fixes.md` and `tasks/TASK003-a11y-fixes.md`
- Fix code snippets written for all items; no fixes applied yet

### TASK004 — Java 25 Advisories Logged ✅

- Java 21→25 audit complete; 2 advisory items in `tasks/TASK004-java25-readiness.md`
- No mandatory changes on current Java 21 target

## Recent Changes (Phases 5–9)

### Phase 9 — Scoring Engine UI Integration ✅

- `archetypeScorer.js` changes compiled with 0 errors
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

## Known Issues / Watch Points

- None confirmed post-Phase 9, but integration testing may surface runtime issues
- `DeleteSourceMaps.js` was fixed for rimraf v4+ (glob expansion via `glob.sync`)
- Webpack dev server must be running on port 1212 before starting Electron main process separately

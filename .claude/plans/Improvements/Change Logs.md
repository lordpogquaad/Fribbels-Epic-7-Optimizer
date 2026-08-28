# Change Logs — Completed / Applied Improvements

Improvements verified applied to the codebase.

---

## FSpd / SpdEff optimizer-grid columns — verified DONE 2026-06-16

_(plan: `plan-for-improvements-to-gleaming-sundae.md`)_

Two calculated results-grid columns, fully implemented (frontend + Java sort):

- **Frontend** (`optimizerGrid.js`): `decorateCalcFields` stamps `row.finalSpeed = round(spd/(1-crp))`
  and `row.spdEff = round(spd + eff*w)`; columns `FSpd`/`SpdEff` (after `upg`); both in the heatmap
  `statsToAggregate`; live `Eff wt` box (`#inputSpdEffWeight`, default 0.5) → `refreshCalcInputs()`.
  Mirrored into the multi-hero grid and the hero-library grid.
- **CRP source**: redesigned from the plan's global box to a per-hero `hero.crPush` Bonus stat
  (`getLoadedHeroCrp()` / `_loadedHeroCrp`); the HTML tooltip documents this. Functional intent unchanged.
- **Java sort**: `OptimizationColumn.FINALSPEED`/`SPDEFF`, `GetResultRowsRequest.spdEffWeight`, `Sorter`
  ASC/DESC cases, `OptimizationDb` weighted-sort overload + `lastSortWeight` re-sort; handler passes
  `request.getSpdEffWeight()`. Deployed jar is current (rebuilt 2026-06-16).

No open work.

---

## Priority Filter Rework — Mod-Potential + Per-Slot Priorities — verified DONE 2026-06-16

_(plan: `you-are-helping-me-shimmying-thacker.md`)_

Implemented beyond the written plan. All deliverables present:

- **A1** shared `enumerateModCandidates(item, hero)` in `modificationFilter.js` (single source of truth;
  `apply()` consumes it). **A2** mod-potential delta in `calculateRankScore` (enhanced with a target-rank
  breakpoint boost). **A3** wired into `applyPriorityFilters(...,hero,enableMods)` with `rankKey`; latent
  keep-originals bug fixed (`_willProduceKeptVariant` + dedupe on `item.id`).
- **B1** Java `OptimizationRequest` fields `slotPriorityConfig`/`setPriorityConfig`/`inputPriorityRankBasis`
  - `HeroDb` GSON round-trip; JS write + `_applySlotPriorityConfig`/`_applySetPriorityConfig` restore.
    Deployed jar contains the fields (rebuilt 2026-06-16).
- **B2** `resolveSlotPriorities` / `resolveEffectivePriorities` (precedence set > slot > global, 9-roll
  budget normalization) + a separate `calculateRankScore`. **B3** legality tables (`_TYPE_LEGAL` /
  dialog `SLOT_PRIORITY_ALLOWED`). **B4** tabbed `editSlotPrioritiesDialog` (+ bonus
  `editSetPrioritiesDialog`) with toolbar buttons. **B5** `inputPriorityRankBasis` select + the
  `★cur→pot` heatmap display.
- **Shared**: `statRolls()` helper; cache correctness via `_modConfigFingerprint` /
  `_slotPriorityFingerprint` / `_setPriorityFingerprint` / `_targetRankFingerprint`, pin-aware keys,
  split `_scoreCache` / `_rankCache`.

Deviation (intentional, documented in the Java POJO): per-slot/per-set weights now also influence build
**ranking** via per-item `priorityScore`, where the plan originally scoped them filtering-only.

Open remainder: **A4 mod-candidate memoization** — a marginal perf micro-opt, intentionally not done;
see `New Improvements.md` for the rationale.

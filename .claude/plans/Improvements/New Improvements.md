# New Improvements

Open improvement ideas not yet implemented. When one ships, record it in `Change Logs.md` and remove
it here. (No "Existing Improvements" bucket by design.)

**Status 2026-06-16:** both source feature plans were verified **already implemented** in current code
(see `Change Logs.md`) — FSpd/SpdEff columns and the full Priority Filter Rework. The only remaining
item is a marginal performance micro-opt:

---

## Open

- [ ] **A4 — mod-candidate memoization** (perf, frontend-only; from the Priority Filter Rework plan).
      `ModificationFilter.enumerateModCandidates(item, hero)` is currently called 2–3× per surviving item
      per run — in `priorityFilter.calculateRankScore`, the keep-originals net `_willProduceKeptVariant`,
      and `modificationFilter.apply`. The plan wanted the result memoized on the item to avoid the
      re-enumeration.

  **Deferred — and why (read before implementing):** the candidate list depends on the hero's mod-config
  (`limitRolls`, `rollQuality`, `keepStats`/`ignoreStats`/`discardStats`, `modGrade`, `modSlots`,
  `keepStatOptions`, and the per-slot `slotModConfig` via `getEffectiveConfig`), which changes between
  runs/heroes **without** invalidating the cached item pool (`getAllItemsCached`). So a naive
  `item._modCandidates` field would go stale and silently return the wrong candidates — a **correctness**
  bug, worse than the perf it saves. A safe version needs a fingerprint-guarded memo
  (`WeakMap<item, {fp, candidates}>`), but the fingerprint would have to be **duplicated** into
  `modificationFilter.js` (it cannot import `priorityFilter` — circular dependency), a drift/maintenance
  hazard. Meanwhile `enumerateModCandidates` only iterates ~4–6 substats and the expensive scoring is
  already cached (`_scoreCache` / `_rankCache`), so the win is marginal.

  **Recommendation:** implement only if profiling shows mod-expansion enumeration is a real hotspot, and
  do it with a fingerprint-guarded `WeakMap` (never a bare `item.` field).

---

## Copilot-era backlog (moved here 2026-08-28 from `memory-bank/tasks/`, unreviewed since 2026-05-31)

Kept "just in case" when `memory-bank/` was retired. Paths inside cite the old flat layout
(`app/app.html`, `app/js/lib/...`); re-verify against the numbered-folder tree before acting.

- [ ] `TASK003-a11y-fixes.md` — 16 open WCAG items with ready fix snippets; none applied.
- [ ] `TASK004-java25-readiness.md` — 2 advisories; probably moot since the JDK 25 migration landed 2026-06.
- [ ] `TASK007-oc-audit.md` — 9 Object-Calisthenics style findings; advisory only, no code changed.

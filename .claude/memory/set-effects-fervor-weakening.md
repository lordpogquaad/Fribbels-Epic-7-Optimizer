---
name: set-effects-fervor-weakening
description: "Official in-game effect text for the 2026-06-04 Fervor (2pc) and Weakening (4pc) gear sets, which parts the optimizer models, and the three parallel damage-model implementations that must stay in sync when a set effect is added."
metadata: 
  node_type: memory
  type: project
  originSessionId: ae12964a-a779-473a-b06c-7e3b2491cb82
  modified: 2026-08-28T10:02:56.489Z
---

# Fervor / Weakening set effects (game update 2026-06-04)

Source: epic7db patch notes, https://epic7db.com/news/64-thu-update-content (fetched 2026-08-28).

- **Fervor Set — 2 pieces:** "At the start of an extra turn, increases the damage of the next attack
  by 20%. Does not stack with other sets of the same name."
- **Weakening Set — 4 pieces:** "Increases Speed by 15%. Increases the chance to inflict debuffs by 15%."

**Modeling status (2026-08-28):** Weakening speed (+15%) is modeled in all three damage/stat paths as
`weakeningSetBonus`; the debuff-chance half is not modeled anywhere (neither is it upstream). Fervor is
only *counted* (set filter / bitmask) — no damage term anywhere; `fribbelsPriorityFilter.js` says
`bonusSetMight: 0 // Fervor 2pc — bonus TBD`. Rex's `main` never added a Fervor damage term, but his
real dev branch **`upstream/feat/offline`** did (contributor Dominik Lampl, 2026-07-04, commits
`d7414b8`, `28c1bc9`, `b5e5681`, `d643927`): CPU `fervorMultiplier = SETTING_FERVOR_SET && sets[23] > 1 ? 0.2f : 0`
added to `pctDmgMultiplier`; GPU `fervorSetOn = min(fervorSet, 1)` from mask bit 35, `max(0, fervorSetOn *
SETTING_FERVOR_SET * 0.2f)` (the `min` is the "does not stack" clause); toggle `settingFervorSet`
default TRUE ("Use Fervor set bonus for damage optimization") plumbed through `SetSettingsRequest` →
`SystemRequestHandler` → `StatCalculator.SETTING_FERVOR_SET`. Port that, remapped to local indices
(Fervor = `sets[22]`, mask bit 34), rather than designing from scratch. The frontend Hero Library path
(`fribbelsPriorityFilter.js`) is local-only — Rex has no equivalent — so it needs the matching term too.

**Why it matters:** damage is computed in THREE places that must agree, and a mismatch is silent:

1. backend CPU — `StatCalculator.java`: `rageMultiplier = SETTING_RAGE_SET && sets[11] > 3 ? 0.3f : 0`,
   `pctDmgMultiplier = 1 + rageMultiplier + torrentMultiplier`;
2. backend GPU — `GpuOptimizerKernel.java` (+ `SetFormat000OptimizerKernel`) via set bitmask bits
   (local layout: bit 34 = fervor, commented out; bit 35 = weakening) and `SETTING_RAGE_SET` passed in;
3. frontend — `fribbelsPriorityFilter.js#computeSkillValue`: `rageOn = rageSetEnabled && set_rage>=4 ? 0.3 : 0`,
   `pctDmgMultiplier = 1 + rageOn + torrentBonus`, toggle `settingRageSet` in `settings.js`/`app.html`
   ("Use rage set bonus for damage optimization").

Local set indices differ from upstream (Fervor = `sets[22]` 2pc, Weakening = `sets[23]` 4pc).

**How to apply:** model Fervor the way Rage is modeled — an additive term in `pctDmgMultiplier`
behind a user toggle (the extra-turn condition is an assumption the user opts into) — in all three
paths at once, never one. [[repo-lineage]] [[overhaul-plan-2026-08]]

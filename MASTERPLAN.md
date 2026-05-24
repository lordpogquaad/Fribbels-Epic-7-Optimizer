# Gear Optimizer — Masterplan & Audit Log

**Last audited:** May 24, 2026  
**Source root:** `1. App/2. Frontend/1. Source/`

---

## ✅ COMPLETED WORK

### Phase 5 — Potential-Based Archetype Bug Fix (prior session) ✅

- ~~Fixed potential-based archetype scoring logic in `archetypeScorer.js` / `e7Scorer.js`~~ ✅
- ~~Confirmed via Node.js smoke tests~~ ✅

### Phase 6 — Constants Deduplication & Cleanup

All items below were implemented and Node.js verified:

| # | Change | Files Touched |
|---|--------|--------------|
| ~~1~~ | ~~Created **`js/lib/gear/reforgeConstants.js`** — single source of truth for reforge data~~ | ~~NEW FILE~~ |
| ~~2~~ | ~~Removed 3-way copy-paste of `plainStatRollsToValue`, `critDamageRollsToValue`, `speedRollsToValue`, `plainStats`~~ | ~~`reforge.js`, `itemSimulator.js`, `e7Constants.js`~~ |
| ~~3~~ | ~~Removed copy-paste of `flatRollsByTier` (flat substat roll ranges)~~ | ~~`itemSimulator.js` (now imports from reforgeConstants)~~ |
| ~~4~~ | ~~Renamed `maxRolls15` → `maxRollsByRank`, centralized in reforgeConstants~~ | ~~`reforge.js`, `e7Constants.js`~~ |
| ~~5~~ | ~~`ITEM_MAX_ENHANCE_TOTAL_ROLLS` now derived from `maxRollsByRank`~~ | ~~`e7Constants.js`~~ |
| ~~6~~ | ~~`ITEM_REFORGE_TABLES` `%_Rolls`, `CD%_Rolls`, `Speed_Rolls` now derived via `Object.values()`~~ | ~~`e7Constants.js`~~ |
| ~~7~~ | ~~Fixed `rankEnum` values — lowercase → **Title Case** (`'epic'` → `'Epic'`)~~ | ~~`enums.js`~~ |
| ~~8~~ | ~~Fixed `setEnum` values — bare lowercase → **`*Set` suffix** (`'speed'` → `'SpeedSet'`)~~ | ~~`enums.js`~~ |
| ~~9~~ | ~~Removed `ITEM_MAIN_STAT_MAPPING` / `ITEM_SUBSTAT_MAPPING` alias declarations~~ | ~~`e7Constants.js`~~ |
| ~~10~~ | ~~Removed dead imports of `ITEM_MAIN_STAT_MAPPING` / `ITEM_SUBSTAT_MAPPING`~~ | ~~`e7Scorer.js`~~ |

### Phase 8 — Configurable Path + Enum/Constant Unification (May 24, 2026)

| # | Change | Files Touched |
|---|--------|---------------|
| ~~1~~ | ~~**P2-C**: `e7ArchetypeRules.js` `GAS_RULES_PATH` now reads `E7_ARCHETYPE_RULES_PATH` env var first, falls back to relative path~~ | ~~`e7ArchetypeRules.js`~~ |
| ~~2~~ | ~~**P3-A**: `constants.js setsByIndex` now derived via `Object.values(setEnum)` — `enums.js setEnum` is the single ordered source~~ | ~~`constants.js`, `enums.js`~~ |
| ~~3~~ | ~~**P3-B**: `ITEM_RANK` moved to `reforgeConstants.js`; `e7Constants.js` imports it instead of redeclaring~~ | ~~`reforgeConstants.js`, `e7Constants.js`~~ |

All confirmed: Node.js CJS smoke tests pass; webpack dev build compiled successfully (0 errors).

---

| # | Change | Files Touched |
|---|--------|---------------|
| ~~1~~ | ~~**Fixed GS weight divergence**: `Speed 8/4→9/4`, `CC% 8/5→9/5`, `CD% 8/7→9/8` in `itemSimulator.js` — now consistent with `potentialGsByRolls` and `e7Constants` baseline~~ | ~~`itemSimulator.js`~~ |
| ~~2~~ | ~~**Added 5 missing sets** to `setEnum`: `PenetrationSet`, `RevengeSet`, `InjurySet`, `WarfareSet`, `PursuitSet` — now matches `constants.js setsByIndex` (22 sets)~~ | ~~`enums.js`~~ |
| ~~3~~ | ~~**Removed hardcoded `GEAR_SLOTS`** in `archetypeScorer.js` — now derives from `Object.values(GEAR_SLOT)` imported from `e7Constants`~~ | ~~`archetypeScorer.js`~~ |

--- — May 24, 2026

### 1. Module & Import System (confirmed clean)

| File | System | Notes |
|------|--------|-------|
| `e7Constants.js` | CommonJS (`require`/`module.exports`) | ✅ Imports from reforgeConstants |
| `reforgeConstants.js` | CommonJS | ✅ Single source of truth |
| `e7Scorer.js` | CommonJS | ✅ Imports from e7Constants + e7ArchetypeRules |
| `archetypeScorer.js` | CommonJS | ✅ Imports from e7Scorer |
| `e7ArchetypeRules.js` | CommonJS (`vm.createContext`) | ✅ `GAS_RULES_PATH` now env-var configurable |
| `reforge.js` | ES Module | ✅ Imports reforgeConstants via default import |
| `itemSimulator.js` | ES Module | ✅ Imports reforgeConstants via default import |
| `itemAugmenter.js` | ES Module (`export default`) + CJS `require()` internally | ✅ Works in webpack; `require(archetypeScorer)` bridges to CJS scoring layer |
| `itemSerializer.js` | ES Module | No imports from constants — clean |
| `enums.js` | ES Module | ✅ Values now match game format |
| `inputHandler.js` | ES Module | ✅ Imports enums, assigns to `global.*` |

**Key bridge:** `itemAugmenter.js` is the critical ESM→CJS bridge. It calls `ArchetypeScorer.scoreAllItems(items)` (CJS) from within an ES Module. Webpack handles this correctly at build time.

---

### 2. `enums.js` — current state (✅ clean after Phase 6)

```js
rankEnum: { NORMAL: 'Normal', GOOD: 'Good', RARE: 'Rare', HEROIC: 'Heroic', EPIC: 'Epic' }
setEnum:  { HEALTH: 'HealthSet', SPEED: 'SpeedSet', ... (22 entries) }
```

### 2. ✅ RESOLVED: `setEnum` missing 5 newer sets

~~**Fixed in Phase 7.** `setEnum` now has all 22 sets, matching `constants.js setsByIndex`.~~ ✅

---

### 3. `constants.js` — standalone `speedRollsToValue`

`constants.js` defines its own `speedRollsToValue` with keys `0–6` (one extra `0: 0` key vs `reforgeConstants.js` keys `1–6`). This is used by:

- `htmlGenerator.js` (line 111–122): UI display of potential speed rolls delta
- Referenced (commented out) in `enhancingTab.js`

**This is intentionally different** from the reforge calculation table — the `0` key is needed for "no rolls yet" UI display. Do NOT merge this into `reforgeConstants.js`.

---

### 4. ✅ RESOLVED: Speed / CC% / CD% GS Weight Divergence

~~**Fixed in Phase 7.** `itemSimulator.js substatWeights` now uses `9/4`, `9/5`, `9/8` — consistent with `potentialGsByRolls[0] = 9` (all stats yield max GS = 9 at one roll, matching the GAS scoring baseline).~~ ✅

| Stat | Old value | New value | e7Constants baseline |
|------|-----------|-----------|---------------------|
| Speed | `8/4 = 2.00` | `9/4 = 2.25` | `9/4` at 1 roll |
| CC% | `8/5 = 1.60` | `9/5 = 1.80` | `9/5` at 1 roll |
| CD% | `8/7 ≈ 1.14` | `9/8 = 1.125` | `9/8` at 1 roll |

---

### 5. ✅ RESOLVED: `archetypeScorer.js` hardcoded `GEAR_SLOTS`

~~**Fixed in Phase 7.** Replaced with `Object.values(GEAR_SLOT)` imported from `e7Constants`.~~ ✅

---

### 6. ✅ RESOLVED: `e7ArchetypeRules.js` external file dependency

~~**Fixed in Phase 8.** Set `E7_ARCHETYPE_RULES_PATH` env var to override the default relative path.~~ ✅

---

## 🐛 PRE-BUG-TESTING CHECKLIST

Before running the optimizer:

- [x] `reforgeConstants.js` loads in Node.js (`node -e "require('./js/lib/gear/reforgeConstants')"`)
- [x] `e7Constants.js` loads in Node.js with correct derived values
- [x] `e7Scorer.js` loads in Node.js without errors
- [x] `archetypeScorer.js` loads in Node.js without errors (`GEAR_SLOT` import validated)
- [x] `DeleteSourceMaps.js` fixed for rimraf v4+ (glob expansion via `glob.sync` before `rimrafSync`)
- [x] **Webpack dev renderer build compiles successfully** — `renderer.dev.js` rebuilt (5.89 MiB, 74 source modules, 0 errors)
- [x] **Phase 8 webpack rebuild** — Phase 8 changes (P2-C, P3-A, P3-B) compiled with 0 errors
- [x] **Phase 9 webpack rebuild** — `archetypeScorer.js` + `itemsGrid.js` changes compiled with 0 errors (`webpack 5.107.1 compiled successfully in 7128 ms`, 74 modules)
- [x] **Electron main process boots** — `yarn start-main-dev` exits cleanly, no JS errors (`main.dev.ts` + update-check msgs only); requires webpack dev server for renderer (port 1212)
- [x] **Full archetype pipeline smoke test** — `scoreAllItems()` tested on Epic Boots (DPS), Epic Weapon (speed), Heroic Ring (tank); all `offCPower`/`uoffCPower`/`offAPower`/`uoffAPower` computed correctly; correct null for under-threshold Heroic item
- [ ] Run `yarn dev` (both renderer dev server + Electron) and confirm app loads in window
- [ ] Load a saved gear set — verify items display correctly
- [ ] Run optimizer on 1 hero — verify results appear
- [ ] Open Item Simulator tab — verify simulation runs (tests `itemSimulator.js` import of reforgeConstants)
- [ ] Open Reforge tab — verify reforge values show correctly (tests `reforge.js` import of reforgeConstants)
- [ ] Confirm archetype scores appear on gear items (tests `archetypeScorer.js` pipeline)

---

## 📋 REMAINING WORK BACKLOG

### Priority 1 — ✅ All Done

All P1 items resolved.

### Priority 2 — ✅ All Done

| ID | Item | Status |
|----|------|--------|
| ~~P2-A~~ | ~~Extract shared `gsWeights` into `reforgeConstants.js`~~ — superseded | ✅ Closed |
| ~~P2-B~~ | ~~`archetypeScorer.js`: replace hardcoded `GEAR_SLOTS`~~ | ✅ Phase 7 |
| ~~P2-C~~ | ~~`e7ArchetypeRules.js`: make external GAS file path configurable~~ | ✅ Phase 8 |

### Priority 3 — ✅ All Done

| ID | Item | Status |
|----|------|--------|
| ~~P3-A~~ | ~~Unify `constants.js setsByIndex` with `setEnum`~~ — `setsByIndex` now derived from `Object.values(setEnum)` | ✅ Phase 8 |
| ~~P3-B~~ | ~~`ITEM_RANK` redeclared in both `e7Constants.js` and `reforgeConstants.js`~~ — now single definition in `reforgeConstants.js` | ✅ Phase 8 |

---

## 📁 KEY FILE MAP

```
js/lib/
├── constants.js              — Global UI constants (setsByIndex, piecesBySetIndex, speedRollsToValue)
├── enums.js                  — Frontend enum objects (exported to global.Gears/Sets/Ranks/Stats)
├── inputHandler.js           — Entry point; assigns everything to global scope
│
├── gear/
│   ├── reforgeConstants.js   — ✅ NEW: Single source of truth for roll tables + rank maximums
│   ├── reforge.js            — Reforge calculation engine (ES Module, uses reforgeConstants)
│   ├── itemSimulator.js      — Monte Carlo gear simulator (ES Module, uses reforgeConstants)
│   ├── itemAugmenter.js      — Augments item objects; calls archetypeScorer (ESM+CJS bridge)
│   ├── itemSerializer.js     — JSON serialization helpers
│   ├── heroGearMatcher.js    — Set preference matching
│   ├── gearRating.js         — Gear quality rating
│   └── mainStatFixer.js      — Main stat normalization
│
├── scoring/
│   ├── reforgeConstants.js   — (referenced via ../gear/reforgeConstants)
│   ├── e7Constants.js        — Game constants (CJS; imports reforgeConstants)
│   ├── e7ArchetypeRules.js   — Loads GAS archetype rules file via vm.createContext
│   ├── e7Scorer.js           — Core GS/archetype scoring functions (CJS)
│   └── archetypeScorer.js    — Fribbels adapter for scoring (CJS)
│
└── [tabs/ui/grids/...other UI files]
```

---

## 🔮 FUTURE WORK — Phase 9: Google Sheets Scoring Engine Integration

The Google Sheets project (`2. Personal/Json Gear Project/`) is a production-ready gear scoring engine that needs to be ported into Fribbels. The math and data are solid; the only work is replacing the Google Apps Script shell with proper module exports.

### Source Files

| File | Purpose |
|------|---------|
| `1. Epic Seven Gear Constant.js` | Pure data layer — all game constants (`ITEM_RANK`, `GEAR_SLOT`, `ITEM_SUBSTAT_STAT_WEIGHTS`, `SUBSTAT_ROLL_RANGES`, `ITEM_REFORGE_TABLES`, `ITEM_MODIFICATION_ROLL_RANGES`, etc.) |
| `2. Archetype Rules.js` | Archetype rule definitions — Official (`Off.`) + Personal (`UOff.`) tracks |
| `3. Code.js` | Scoring engine — pure JS functions wrapped in Google Apps Script UI code (the UI wrapper is throwaway) |

#### `2. Archetype Rules.js` — Three Sections

**Section 1 — Set arrays (lines 1–73)**
Named frozen arrays shared by reference across ARCHETYPE_RULES and SCORING_CONFIGS. Two tracks:

- *Personal* — `ALL_SETS`, `SPEED_SETS`, `DPS_SETS`, `DPS_NO_CC_SETS`, `RES_TANK_SETS`, `PURE_TANK_SETS`, `EFF_TANK_SETS`, `ATK_ER_SETS`, `ATK_EFF_SETS`, `EFF_ER_SETS`, `BRUISER_HP_DEF_SETS`, `BRUISER_SETS`, `BRUISER_B_DMG_SETS`
- *Personal Focus sets* — `BOOT_EFF_SETS`, `BOOT_ER_SETS`, `BOOT_CC_SETS`, `BOOT_ATK_SETS`, `BOOT_HP_FOCUS_SETS`, `EFF_FOCUS_WEAPON_HELM_ARMOR_SETS`, `ARMOR_ER_SETS`, `ATK_FOCUS_HELM_WEAPON_SETS`, `EFF_FOCUS_ATTACK_SETS`, `ER_FOCUS_ATTACK_SETS`, `ATK_FOCUS_NECK_RING_SETS`, `BOOT_EFF_FOCUS_ALL_SETS`, `BOOT_ER_FOCUS_ALL_SETS`, `BOOT_ATK_FOCUS_ALL_SETS`, `BOOT_HP_FOCUS_ALL_SETS`, `HP_FOCUS_SETS`
- *Official* — `OFFICIAL_*` mirrors of all the above (independently modifiable)

When porting: these become `const` declarations at the top of `e7ArchetypeRules.js` (or the adapter module). The `Object.freeze()` wrappers can be dropped — they exist only to guard against accidental mutation in GAS.

**Section 2 — ARCHETYPE_RULES (lines 75–1242)**
`OFFICIAL_ARCHETYPE_RULES` (lines 75–594) + `ARCHETYPE_RULES` (lines 600–1242). Both are frozen objects keyed by gear slot (`"Weapon"`, `"Helmet"`, `"Armor"`, `"Necklace"`, `"Ring"`, `"Boots"`). Each slot holds an array of archetype definitions:

```js
{
  archetype: "DPS",           // name (no prefix — prefix added by getCombinedSlotRules)
  sets: DPS_SETS,             // ref to set array above
  Item_Main: ITEM_MAIN[slot].main_stats,  // allowed main stats
  Item_Substats: [...],       // weighted substats for GS calc
  requiredSubstats: [...]     // optional — item must have all of these (e.g. ["Speed"])
}
```

Personal `ARCHETYPE_RULES` adds Focus archetypes after `Bruiser (B. Dmg)` — `HP Focus`, `Attack Focus`, `Effectiveness Focus`, `Effect Resist Focus`, `Crit Chance Focus`, `Boot HP Focus` (slot-dependent). No personal `Future` archetype (see note below).

**Section 3 — Tier data + SCORING_CONFIGS (lines 1243–2068)**
Three subsections:

- *Tier constant objects* (lines 1243–1716) — `TopSpeedTiers`, `SpeedTiers`, `SpeedSets`, `CUSTOM_PLACEHOLDER`, then per-archetype tier arrays grouped by archetype (`DPS_WEAPON_HELMET_TIERS`, `RES_TANK_WEAPON_TIERS`, `OFFICIAL_*_TIERS`, etc.). Focus archetypes all reference `CUSTOM_PLACEHOLDER` (scored separately in Code.js).
- `OFFICIAL_SCORING_CONFIGS` (lines 1717–1817) — `{slot: {archetypeName: tierArray}}` for official track; 14 archetypes per slot including `Future`
- `SCORING_CONFIGS` (lines 1818–1931) — same shape for personal track; no `Future`; adds Focus archetypes (`HP Focus`, `Attack Focus`, `Effectiveness Focus`, `Effect Resist Focus`, `Crit Chance Focus`, `Boot HP Focus`) referencing `CUSTOM_PLACEHOLDER`

### Key Technical Notes

**Stat weights are roll-indexed (convex scaling):**
Speed/CC%/CD% weights vary by how many rolls are concentrated on that stat. All `%` stats are flat `1.0`. Example:
```js
Speed: [(9/4), (19/9), (28/14), (38/19), (48/24), (56/28)]  // index 0 = 1 roll
```

**Heroic phantom substat:** Before +12, a fake Phantom substat (0 value, 1 roll) is injected at scoring time so Heroic gear scores fairly against Epic. It is NOT written to data — purely a scoring artifact.

**DPS Armor special case:** Removes 1 from both `totalRolls` and `maxRolls` because Armor's Defense main stat overlaps with DPS scoring substats.

**Set name convention:** Archetype rules store set names WITHOUT `"Set"` suffix (`"Speed"` not `"SpeedSet"`). The scoring code handles this with an `endsWith('Set')` check. Fribbels items use `"SpeedSet"` — the adapter must strip the suffix on lookup.

**Two scoring tracks:**
- `OFFICIAL_ARCHETYPE_RULES` + `OFFICIAL_SCORING_CONFIGS` → prefixed `Off. DPS`, `Off. Speed`, etc.
- `ARCHETYPE_RULES` + `SCORING_CONFIGS` → prefixed `UOff. DPS`, `UOff. Speed`, etc.

**Focus archetypes** (Personal only — `HP Focus`, `Attack Focus`, `Effectiveness Focus`, `Effect Resist Focus`, `Crit Chance Focus`): Use potential-based scoring (raw stat sum → tier thresholds), not GS-based. Scored separately from standard archetypes.

**Speed archetype qualifier rule:** Speed archetype only scores if at least 1 of the 11 standard archetypes (DPS through Bruiser B.Dmg) also scores on the same item.

**Score formula types:**
- `type1`: `score = multiplier × (GS - base)`
- `type2`: `score = multiplier × GS - offset`
- `custom` / `CUSTOM_PLACEHOLDER`: returns 0 — archetype is scored separately (Top Speed, Speed, all Focus archetypes)

**`globalThis` pattern — 3 options for Fribbels:**
- **Option A**: Replace `globalThis.X = X` with `export const X = ...` (cleanest — recommended)
- **Option B**: Keep `globalThis` as-is — in Electron renderer `globalThis === window`, works if files load in order
- **Option C**: Single namespace object: `const E7GearData = { ITEM_RANK, ARCHETYPE_RULES, ... }`

**Translation layer** — Fribbels item format already matches scoring engine expectations (stat names are identical). Only adaptation needed:
```
item.gear    → matches GEAR_SLOT directly
item.set     → strip "Set" suffix for archetype rule lookups
item.rank    → matches ITEM_RANK values directly
item.substats[].stat/value/rolls → already compatible
```

### Integration Work Plan (Priority Order)

| # | Task | Files | Notes |
|---|------|-------|-------|
| ~~1~~ | ~~**Adapter module** — `js/lib/scoring/gearScorer.js`~~ | ~~NEW FILE~~ | ✅ **Done** — implemented as `e7Scorer.js` (engine) + `archetypeScorer.js` (Fribbels adapter). Exports `scoreAllItems(items)`. |
| ~~2~~ | ~~**Port scoring functions** from `3. Code.js`~~ | ~~`gearScorer.js`~~ | ✅ **Done** — all functions listed below are implemented in `e7Scorer.js` (1175 lines). Smoke test passes. |
| ~~3~~ | ~~**UI integration** — archetype score columns in gear table~~ | ~~`htmlGenerator.js`, gear list renderer~~ | ✅ **Done** — `Top Off.`, `Top Arch.`, `Top UOff.` score columns with `scoreColumnGradient` color coding; full breakdown tooltip on all three showing every non-zero archetype score (Off./UOff. separated by line, sorted by score desc); comparison panel (`buildComparisonScoreTable`) shows side-by-side breakdown. |
| ~~3a~~ | ~~**C.Power / A.Power aggregate columns**~~ | ~~`gearScorer.js`, gear list renderer~~ | ✅ **Done** — `calculateCombatPower()` in `archetypeScorer.js`; 4 columns in `itemsGrid.js`: `Off.C.Power`, `Off.A.Power` (hidden), `UOff.C.Pwr`, `UOff.A.Pwr` (hidden). Smoke test passes. |
| ~~4~~ | ~~**Filter integration** — filter gear by archetype score threshold~~ | ~~`forceFilter.js` or filter layer~~ | ✅ **Done** — implemented in `itemsTab.js` with archetype dropdown + min score input + quick-filter buttons. |

#### Task 2 — Full Function Port List

**Constants & config helpers** (Section 4 of Code.js):
- `getEnhancementConfig(rank, isDpsArmor)` — returns base substats, maxRolls, unlockLevels per rank; applies DPS Armor -1 adjustment
- `getAdjustedRolls(totalRolls, maxPossibleRolls, isDpsArmor, enhance, addSubstatLevel, rank)` — corrects rolls for DPS Armor and Heroic phantom injection

**Archetype routing helpers** (Section 4/7):
- `getArchetypeSource(archetypeName)` — splits `"Off. DPS"` → `{type: 'official', baseName: 'DPS'}`
- `getArchetypeRules(archetypeName)` — returns `OFFICIAL_ARCHETYPE_RULES` or `ARCHETYPE_RULES` based on prefix
- `getScoringConfig(archetypeName)` — returns `OFFICIAL_SCORING_CONFIGS` or `SCORING_CONFIGS` based on prefix
- `getArchetypeNames()` — builds ordered archetype list respecting `ARCHETYPE_PRIORITY`; C.Power/A.Power are placeholders inserted here
- `getCombinedSlotRules(gearSlot)` — merges prefixed Off. + UOff. rules for one slot into a single array
- `isPotentialBasedArchetype(archetypeName)` — returns true for Top Speed, Focus archetypes

**Core GS scoring** (Section 6):
- `getStatWeight(statType, rolls)` — roll-indexed stat weight lookup from `ITEM_SUBSTAT_STAT_WEIGHTS`
- `calculateGS(substats, archetypeSubstats, gearSlot, level, rank, enhance, isDpsArmor)` — main GS calculator; filters substats, applies Speed Boots penalty, normalizes to `(gsSum / maxPossibleRolls) × 100`
- `isArchetypeApplicable()` — O(1) pre-check via `_archetypeSetMainCache` (pre-built Map); key format `"Off. DPS-Weapon-SpeedSet-FIXED"` or `"Off. DPS-Ring-SpeedSet-AttackPercent"`
- `calculateCustomArchetypeScore(item, slotRules, scoringConfigs)` — runs all archetypes for one item; returns `{nonModScore, modScore, modStat}` per archetype

**Tier scoring helpers** (Section 6/7):
- `applyTierFormula(tier, value)` — executes type1 (`multiplier × (value - base)`) or type2 (`multiplier × value - offset`) formula; falls back to uppercase legacy property names (`Multiplier`, `Base`)
- `applyTieredScoring(value, tiers, rowNum)` — evaluates Tier4→Tier3→Tier2→Tier1→Tier0 in order; returns score from first matching tier
- `getTier1Minimum(archetype, gearSlot, rank, totalRolls, enhance, rowNum)` — computes the Tier 1 minimum score threshold scaled to current roll count: `(tier1.min / maxRolls) × adjustedTotalRolls`

**Potential-based (speed/focus) scoring** (Section 7):
- `calculateSpeedPotential(substats, rank, level, enhance)` — returns `{hasSpeed, maxPotentialSpeed}` (current speed + max remaining enhance rolls × 4)
- `calculateTopSpeedScore(substats, reforgedStats, rank, level, enhance, cachedSpeedPotential, sourceType)` — uses `TopSpeedTiers` (personal) or `OFFICIAL_TopSpeedTiers` (official); potential-based, immune to modifications
- `calculateSpeedScore(substats, reforgedStats, rank, level, enhance, ...)` — uses `SpeedTiers` / `OFFICIAL_SpeedTiers`; subject to Speed qualifier rule
- `calculateEffectivenessPotential(substats, rank, level, enhance, gearSlot, mainStat, setName)` — Eff% potential for Armor/Necklace/Ring/Boots; Ring+Eff% main special case checks Atk% instead; validates against `EFF_FOCUS_ATTACK_SETS` / `BOOT_EFF_SETS`
- `calculateEffectResistPotential(substats, rank, level, enhance, gearSlot, mainStat, setName)` — ER% potential for Armor/Necklace/Ring/Boots; Ring+ER% main special case checks Atk%; validates against `ER_FOCUS_ATTACK_SETS` / `BOOT_ER_SETS`
- `calculateArmorEffectResistPotential(substats, rank, level, enhance, gearSlot, setName)` — ER% for Armor-only archetype; validates `Counter/Resist/Immunity/Penetration/Pursuit/Torrent` sets
- `calculateFixedSlotEffectivenessPotential(substats, rank, level, enhance, gearSlot, setName)` — Eff% for Weapon/Helmet/Armor fixed-slot archetype; validates `EFF_FOCUS_WEAPON_HELM_ARMOR_SETS`
- `calculateHPPercentPotential(substats, rank, level, enhance, gearSlot, mainStat, setName)` — HP% potential for Weapon/Helmet/Armor/Boots(Speed main); validates `HP_FOCUS_SETS` / `BOOT_HP_FOCUS_ALL_SETS`
- `calculateFlatHPPotential(substats, rank, level, enhance, gearSlot, mainStat, setName)` — flat HP for Necklace/Ring/Boots with HP% main; max roll = 202; validates `HP_FOCUS_SETS`
- `calculateFlatAttackPotential(substats, rank, level, enhance, gearSlot, mainStat, setName)` — flat Atk for Necklace/Ring/Boots with Atk% main; max roll = 46; validates `ATK_FOCUS_NECK_RING_SETS`
- `calculateCritChancePotential(substats, rank, level, enhance, gearSlot, mainStat, setName)` — CC% for Boots+Speed main only; max roll = 5%; validates `Speed/Critical/Immunity/Torrent/Penetration` sets
- `calculateAttackPotential(substats, rank, level, enhance, gearSlot, mainStat, setName)` — Atk% for two paths: Boots+Speed main (`BOOT_ATK_SETS`) or Helmet/Weapon any main (`ATK_FOCUS_HELM_WEAPON_SETS`)
- Focus archetype scoring — sums raw target stat across all substats → tier lookup (thresholds defined in `SCORING_CONFIGS`)

**Item processing** (Section 8):
- `processGearItem(item, rowNum)` — adapted to return scored data object (not write to sheet); injects Heroic phantom, calculates total rolls / GS / GS-per-roll / speed value, runs `calculateCustomArchetypeScore()`, then `calculateCombatPower()` for C.Power and A.Power placeholders
- `calculateCombatPower(archetypeScores, sourceType, rowNum, item, archetypeData, excludeFuture)` — post-processing aggregate (see C.Power/A.Power section below)

### C.Power and A.Power — Aggregate Metric Details

Both are **calculated metrics, not archetype rules** — they're computed after all individual archetype scores are ready and inserted as placeholder columns at the start of the archetype section.

**C.Power (Combat Power)** — `Off. C.Power` / `UOff. C.Power`

Combines scores using this priority formula:
```
C.Power = Top Speed (if > 0) + Speed (if > 0, with qualifier) + Best 1 priority group
```

Priority groups (only highest group is taken):

| Priority | Group name | Archetypes included |
|----------|-----------|---------------------|
| 1 | DPS | DPS, DPS (No CC%) |
| 2 | Tank | Res Tank, Pure Tank |
| 3 | EFF.ER | EFF. Tank, Atk + EFF, Atk + ER, EFF + ER |
| 4 | Bruiser | Bruiser(Hp/Def), Bruiser, Bruiser (B. Dmg) |
| 5 | Future | Future |

Speed qualifier applies: Speed only counts toward C.Power if ≥ 1 of the 11 qualifying archetypes (DPS through Bruiser B.Dmg) also scores > 0.

Tie-breaking within groups: higher score wins → lower priority number wins (DPS=1 beats Bruiser=4).

**A.Power (Archetype Power)** — `Off. A.Power` / `UOff. A.Power`

Identical to C.Power but **excludes Future** from priority groups. Represents gear with a concrete archetype match (not catch-all flexible gear).

**Modified score calculation:**

For each modification option collected from all individual archetypes, C.Power re-evaluates the full formula using that modification's impact on each archetype (via `modificationCache`). It selects the modification that maximizes total C.Power and stores it in the Mod column. Fallback: if no single modification benefits all top archetypes, uses `max(custom, modified)` per archetype.

**Column layout:**

Each C.Power / A.Power entry occupies **4 columns**: `[Mod text | Current score | Modified score | Gain+]`

`UOff. C.Power` reuses `Off. Future` since Future is official-only and universal across both tracks.
> **Future archetype is intentionally absent from personal `ARCHETYPE_RULES`.** After `Bruiser (B. Dmg)`, the personal rules go straight to Focus archetypes — there is no personal `UOff. Future`. Future is defined only in `OFFICIAL_ARCHETYPE_RULES` and uses `OFFICIAL_FUTURE_COMMON_TIERS` (no separate personal scoring config). `UOff. C.Power` deliberately borrows `Off. Future` for its group calculation. If a personal Future variant is ever needed, it must be added to `ARCHETYPE_RULES` for all 6 slots in `2. Archetype Rules.js` and given its own scoring tiers in `SCORING_CONFIGS`.
### Performance Note

Scoring runs ~1ms per item in pure JS — safe to run on full gear collection at import time with no perceptible delay.

---

*Masterplan created May 24, 2026. Update this file after each bug-testing session.*

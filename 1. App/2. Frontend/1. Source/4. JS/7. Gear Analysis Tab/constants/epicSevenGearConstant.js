/**
 * Epic Seven Gear Constants
 * Core data & constants for Epic Seven gear mechanics.
 * Assigns each constant to globalThis so the other plain-<script> gear-analysis
 * files can read it without an import.
 *
 * LOAD ORDER REQUIREMENT:
 * Must load FIRST, before archetypeRules.js, gearScorer.js and gearAnalysisTab.js
 * (they consume the globals defined here). Order is fixed by the <script> tag
 * sequence in app.html (the "Gear Analysis Tab" block).
 *
 * Implementation notes:
 * - All constants are deep-frozen with Object.freeze() (immutable).
 * - Necklace & Ring share one modification-range object (NECKLACE_RING_SHARED_MODS).
 * - The three stat-name mappings alias one object (STAT_DISPLAY_MAPPING).
 * - The `globalThis.X || ...` guard makes re-execution idempotent.
 */

// ============================================================================
// ITEM RANK
// ============================================================================
var ITEM_RANK =
  globalThis.ITEM_RANK ||
  Object.freeze({
    NORMAL: 'Normal',
    GOOD: 'Good',
    RARE: 'Rare',
    HEROIC: 'Heroic',
    EPIC: 'Epic',
  });
globalThis.ITEM_RANK = ITEM_RANK;

// ============================================================================
// BASE ITEM RANK SUBSTATS
// Rolls that Equal less than or Equal to 1
// ============================================================================
var BASE_ITEM_RANK_SUBSTATS =
  globalThis.BASE_ITEM_RANK_SUBSTATS ||
  Object.freeze({
    NORMAL: 0,
    GOOD: 1,
    RARE: 2,
    HEROIC: 3,
    EPIC: 4,
  });
globalThis.BASE_ITEM_RANK_SUBSTATS = BASE_ITEM_RANK_SUBSTATS;

// ============================================================================
// BASIC INFORMATION - ITEM LEVEL
// ============================================================================
var ITEM_LEVEL =
  globalThis.ITEM_LEVEL ||
  Object.freeze({
    LEVEL_90: { value: 90, status: 'Reforged' },
    LEVEL_88: { value: 88, status: 'Not Reforgeable' },
    LEVEL_85: { value: 85, status: 'Reforgeable' },
    LEVEL_RANGE_72_84: { min: 72, max: 84, status: 'Not Reforgeable' },
    LEVEL_RANGE_1_71: { min: 1, max: 71, status: 'Not Reforgeable' },
  });
globalThis.ITEM_LEVEL = ITEM_LEVEL;

// ============================================================================
// ITEM GEAR
// ============================================================================
var GEAR_SLOT =
  globalThis.GEAR_SLOT ||
  Object.freeze({
    WEAPON: 'Weapon',
    HELMET: 'Helmet',
    ARMOR: 'Armor',
    NECKLACE: 'Necklace',
    RING: 'Ring',
    BOOTS: 'Boots',
  });
globalThis.GEAR_SLOT = GEAR_SLOT;

// ============================================================================
// ITEM MAIN
// ============================================================================
var ITEM_MAIN =
  globalThis.ITEM_MAIN ||
  Object.freeze({
    WEAPON: Object.freeze({
      main_stats: ['Attack'],
      is_fixed: true,
    }),
    HELMET: Object.freeze({
      main_stats: ['Health'],
      is_fixed: true,
    }),
    ARMOR: Object.freeze({
      main_stats: ['Defense'],
      is_fixed: true,
    }),
    NECKLACE: Object.freeze({
      main_stats: [
        'AttackPercent',
        'Attack',
        'DefensePercent',
        'Defense',
        'HealthPercent',
        'Health',
        'CriticalHitChancePercent',
        'CriticalHitDamagePercent',
      ],
      is_fixed: false,
    }),
    RING: Object.freeze({
      main_stats: [
        'AttackPercent',
        'Attack',
        'DefensePercent',
        'Defense',
        'HealthPercent',
        'Health',
        'EffectivenessPercent',
        'EffectResistancePercent',
      ],
      is_fixed: false,
    }),
    BOOTS: Object.freeze({
      main_stats: [
        'AttackPercent',
        'Attack',
        'DefensePercent',
        'Defense',
        'HealthPercent',
        'Health',
        'Speed',
      ],
      is_fixed: false,
    }),
  });
globalThis.ITEM_MAIN = ITEM_MAIN;

// ============================================================================
// ITEM ALLOWED SUBSTATS
// Cannot be the same if Item_Main is that substat
// ============================================================================
var ITEM_ALLOWED_SUBSTATS =
  globalThis.ITEM_ALLOWED_SUBSTATS ||
  Object.freeze({
    WEAPON: Object.freeze([
      'AttackPercent',
      'Health',
      'HealthPercent',
      'Speed',
      'CriticalHitChancePercent',
      'CriticalHitDamagePercent',
      'EffectivenessPercent',
      'EffectResistancePercent',
    ]),
    HELMET: Object.freeze([
      'Attack',
      'AttackPercent',
      'Defense',
      'DefensePercent',
      'HealthPercent',
      'Speed',
      'CriticalHitChancePercent',
      'CriticalHitDamagePercent',
      'EffectivenessPercent',
      'EffectResistancePercent',
    ]),
    ARMOR: Object.freeze([
      'DefensePercent',
      'Health',
      'HealthPercent',
      'Speed',
      'CriticalHitChancePercent',
      'CriticalHitDamagePercent',
      'EffectivenessPercent',
      'EffectResistancePercent',
    ]),
    NECKLACE: Object.freeze([
      'Attack',
      'AttackPercent',
      'Defense',
      'DefensePercent',
      'Health',
      'HealthPercent',
      'Speed',
      'CriticalHitChancePercent',
      'CriticalHitDamagePercent',
      'EffectivenessPercent',
      'EffectResistancePercent',
    ]),
    RING: Object.freeze([
      'Attack',
      'AttackPercent',
      'Defense',
      'DefensePercent',
      'Health',
      'HealthPercent',
      'Speed',
      'CriticalHitChancePercent',
      'CriticalHitDamagePercent',
      'EffectivenessPercent',
      'EffectResistancePercent',
    ]),
    BOOTS: Object.freeze([
      'Attack',
      'AttackPercent',
      'Defense',
      'DefensePercent',
      'Health',
      'HealthPercent',
      'Speed',
      'CriticalHitChancePercent',
      'CriticalHitDamagePercent',
      'EffectivenessPercent',
      'EffectResistancePercent',
    ]),
  });
globalThis.ITEM_ALLOWED_SUBSTATS = ITEM_ALLOWED_SUBSTATS;

// ============================================================================
// ITEM ENHANCE LEVELS
// ============================================================================
var ITEM_ENHANCE_LEVELS =
  globalThis.ITEM_ENHANCE_LEVELS ||
  Object.freeze({
    ENHANCE_0: 0,
    ENHANCE_3: 3,
    ENHANCE_6: 6,
    ENHANCE_9: 9,
    ENHANCE_12: 12,
    ENHANCE_15: 15,
  });
globalThis.ITEM_ENHANCE_LEVELS = ITEM_ENHANCE_LEVELS;

// ============================================================================
// COMBINED ENHANCEMENT CONFIGURATION (single source of truth)
// ============================================================================
// All per-rank enhancement data lives here. The three flat constants below
// (UNLOCKED, ENHANCED, MAX_ROLLS) are derived from this object — update here
// and they propagate automatically, eliminating silent drift.
// DPS Armor archetypes score only 3 substats; their adjusted values are in dpsArmor.
var ITEM_ENHANCEMENT_CONFIG =
  globalThis.ITEM_ENHANCEMENT_CONFIG ||
  Object.freeze({
    NORMAL: Object.freeze({
      rank: 'Normal',
      baseSubstats: 0,
      maxRolls: 5,
      unlockLevels: Object.freeze([3, 6, 9, 12]),
      enhanceLevels: Object.freeze([15]),
      dpsArmor: Object.freeze({
        baseSubstats: 0,
        maxRolls: 4,
        unlockLevels: Object.freeze([3, 6, 9]),
      }),
    }),
    GOOD: Object.freeze({
      rank: 'Good',
      baseSubstats: 1,
      maxRolls: 6,
      unlockLevels: Object.freeze([6, 9, 12]),
      enhanceLevels: Object.freeze([3, 15]),
      dpsArmor: Object.freeze({
        baseSubstats: 1,
        maxRolls: 5,
        unlockLevels: Object.freeze([6, 9]),
      }),
    }),
    RARE: Object.freeze({
      rank: 'Rare',
      baseSubstats: 2,
      maxRolls: 7,
      unlockLevels: Object.freeze([9, 12]),
      enhanceLevels: Object.freeze([3, 6, 15]),
      dpsArmor: Object.freeze({
        baseSubstats: 2,
        maxRolls: 6,
        unlockLevels: Object.freeze([9]),
      }),
    }),
    HEROIC: Object.freeze({
      rank: 'Heroic',
      baseSubstats: 3,
      maxRolls: 8,
      unlockLevels: Object.freeze([12]),
      enhanceLevels: Object.freeze([3, 6, 9, 15]),
      dpsArmor: Object.freeze({
        baseSubstats: 3,
        maxRolls: 7,
        unlockLevels: Object.freeze([]),
      }),
    }),
    EPIC: Object.freeze({
      rank: 'Epic',
      baseSubstats: 4,
      maxRolls: 9,
      unlockLevels: Object.freeze([]),
      enhanceLevels: Object.freeze([3, 6, 9, 12, 15]),
      dpsArmor: Object.freeze({
        baseSubstats: 3,
        maxRolls: 8,
        unlockLevels: Object.freeze([]),
      }),
    }),
  });
globalThis.ITEM_ENHANCEMENT_CONFIG = ITEM_ENHANCEMENT_CONFIG;

// ============================================================================
// ITEM ENHANCE LEVELS SUBSTATS UNLOCKED (derived from ITEM_ENHANCEMENT_CONFIG)
// ============================================================================
var ITEM_ENHANCE_LEVELS_SUBSTATS_UNLOCKED =
  globalThis.ITEM_ENHANCE_LEVELS_SUBSTATS_UNLOCKED ||
  Object.freeze(
    Object.fromEntries(
      Object.entries(ITEM_ENHANCEMENT_CONFIG).map(([rank, cfg]) => [
        rank,
        cfg.unlockLevels,
      ]),
    ),
  );
globalThis.ITEM_ENHANCE_LEVELS_SUBSTATS_UNLOCKED =
  ITEM_ENHANCE_LEVELS_SUBSTATS_UNLOCKED;

// ============================================================================
// HEROIC GEAR PHANTOM SUBSTAT CONFIGURATION
// ============================================================================
// Heroic gear starts with 3 substats and unlocks 4th at +12.
// gearScorer adds a flat +1 phantom roll below +12 so the unknown future substat
// always counts as one full roll — prevents low-enhance Heroic gear from being
// discarded too early when mods could replace a bad existing substat.
var HEROIC_PHANTOM_SUBSTAT_ROLLS = globalThis.HEROIC_PHANTOM_SUBSTAT_ROLLS || 1;
globalThis.HEROIC_PHANTOM_SUBSTAT_ROLLS = HEROIC_PHANTOM_SUBSTAT_ROLLS;

// ============================================================================
// ITEM ENHANCE LEVELS SUBSTATS ENHANCED (derived from ITEM_ENHANCEMENT_CONFIG)
// ============================================================================
var ITEM_ENHANCE_LEVELS_SUBSTATS_ENHANCED =
  globalThis.ITEM_ENHANCE_LEVELS_SUBSTATS_ENHANCED ||
  Object.freeze(
    Object.fromEntries(
      Object.entries(ITEM_ENHANCEMENT_CONFIG).map(([rank, cfg]) => [
        rank,
        cfg.enhanceLevels,
      ]),
    ),
  );
globalThis.ITEM_ENHANCE_LEVELS_SUBSTATS_ENHANCED =
  ITEM_ENHANCE_LEVELS_SUBSTATS_ENHANCED;

// ============================================================================
// ITEM MAX ENHANCE TOTAL ROLLS (derived from ITEM_ENHANCEMENT_CONFIG)
// ============================================================================
var ITEM_MAX_ENHANCE_TOTAL_ROLLS =
  globalThis.ITEM_MAX_ENHANCE_TOTAL_ROLLS ||
  Object.freeze(
    Object.fromEntries(
      Object.entries(ITEM_ENHANCEMENT_CONFIG).map(([rank, cfg]) => [
        rank,
        cfg.maxRolls,
      ]),
    ),
  );
globalThis.ITEM_MAX_ENHANCE_TOTAL_ROLLS = ITEM_MAX_ENHANCE_TOTAL_ROLLS;

// ============================================================================
// ITEM SUBSTAT STAT WEIGHTS
// ============================================================================
// Each stat weight is now an array indexed by rolls-1 (index 0 = 1 roll, index 5 = 6 rolls).
// Stats with no roll-based scaling keep the same value at every index.
// Speed, CHC, and CHD scale upward with more rolls (concentrated rolls are more valuable).
var ITEM_SUBSTAT_STAT_WEIGHTS =
  globalThis.ITEM_SUBSTAT_STAT_WEIGHTS ||
  Object.freeze({
    AttackPercent: Object.freeze([1, 1, 1, 1, 1, 1]),
    Attack: Object.freeze([
      3.46 / 39,
      3.46 / 39,
      3.46 / 39,
      3.46 / 39,
      3.46 / 39,
      3.46 / 39,
    ]),
    DefensePercent: Object.freeze([1, 1, 1, 1, 1, 1]),
    Defense: Object.freeze([
      4.99 / 31,
      4.99 / 31,
      4.99 / 31,
      4.99 / 31,
      4.99 / 31,
      4.99 / 31,
    ]),
    HealthPercent: Object.freeze([1, 1, 1, 1, 1, 1]),
    Health: Object.freeze([
      3.09 / 174,
      3.09 / 174,
      3.09 / 174,
      3.09 / 174,
      3.09 / 174,
      3.09 / 174,
    ]),
    Speed: Object.freeze([9 / 4, 19 / 9, 28 / 14, 38 / 19, 48 / 24, 56 / 28]),
    CriticalHitChancePercent: Object.freeze([
      9 / 5,
      19 / 12,
      28 / 18,
      37 / 24,
      47 / 30,
      56 / 36,
    ]),
    CriticalHitDamagePercent: Object.freeze([
      9 / 8,
      19 / 16,
      28 / 24,
      37 / 32,
      47 / 41,
      56 / 49,
    ]),
    EffectivenessPercent: Object.freeze([1, 1, 1, 1, 1, 1]),
    EffectResistancePercent: Object.freeze([1, 1, 1, 1, 1, 1]),
    // Speed on Boots penalty: weight * (defense-equivalent ratio) — scales with rolls like Speed
    SPEED_BOOTS_PENALTY: Object.freeze([
      (9 / 4) * ((48 * 4.99) / 279), // Tier 1 (Matches Def: 7.73)
      (19 / 9) * ((96 * 4.99) / 589), // Tier 2 (Matches Def: 15.45)
      (28 / 14) * ((144 * 4.99) / 868), // Tier 3 (Matches Def: 23.18)
      (38 / 19) * ((192 * 4.99) / 1178), // Tier 4 [ADJUSTED from 1147 to 1178] (Matches Def: 30.91)
      (48 / 24) * ((240 * 4.99) / 1488), // Tier 5 [ADJUSTED from 1457 to 1488] (Matches Def: 38.63)
      (56 / 28) * ((288 * 4.99) / 1736), // Tier 6 (Matches Def: 46.36)
    ]),
  });
globalThis.ITEM_SUBSTAT_STAT_WEIGHTS = ITEM_SUBSTAT_STAT_WEIGHTS;

// ============================================================================
// ITEM SUBSTAT GS
// ============================================================================
// GS (Gear Score) Formula:
// GS = AttackPercent * ITEM_SUBSTAT_STAT_WEIGHTS.AttackPercent
//    + Attack * ITEM_SUBSTAT_STAT_WEIGHTS.Attack
//    + DefensePercent * ITEM_SUBSTAT_STAT_WEIGHTS.DefensePercent
//    + Defense * ITEM_SUBSTAT_STAT_WEIGHTS.Defense
//    + HealthPercent * ITEM_SUBSTAT_STAT_WEIGHTS.HealthPercent
//    + Health * ITEM_SUBSTAT_STAT_WEIGHTS.Health
//    + Speed * ITEM_SUBSTAT_STAT_WEIGHTS.Speed
//    + CriticalHitChancePercent * ITEM_SUBSTAT_STAT_WEIGHTS.CriticalHitChancePercent
//    + CriticalHitDamagePercent * ITEM_SUBSTAT_STAT_WEIGHTS.CriticalHitDamagePercent
//    + EffectivenessPercent * ITEM_SUBSTAT_STAT_WEIGHTS.EffectivenessPercent
//    + EffectResistancePercent * ITEM_SUBSTAT_STAT_WEIGHTS.EffectResistancePercent

// ============================================================================
// SUBSTAT ROLL RANGES
// ============================================================================
// Min and max roll values for substats based on gear level and rank
// Used to validate and evaluate substat quality
var SUBSTAT_ROLL_RANGES =
  globalThis.SUBSTAT_ROLL_RANGES ||
  Object.freeze({
    LEVEL_88: Object.freeze({
      Percent: Object.freeze({
        Epic: Object.freeze([5, 9]),
        Heroic: Object.freeze([5, 9]),
      }),
      Attack: Object.freeze({
        Epic: Object.freeze([37, 53]),
        Heroic: Object.freeze([36, 50]),
      }),
      Defense: Object.freeze({
        Epic: Object.freeze([32, 40]),
        Heroic: Object.freeze([30, 36]),
      }),
      Health: Object.freeze({
        Epic: Object.freeze([178, 229]),
        Heroic: Object.freeze([169, 218]),
      }),
      Speed: Object.freeze({
        Epic: Object.freeze([3, 5]),
        Heroic: Object.freeze([2, 4]),
      }),
      CriticalHitDamagePercent: Object.freeze({
        Epic: Object.freeze([4, 8]),
        Heroic: Object.freeze([4, 8]),
      }),
      CriticalHitChancePercent: Object.freeze({
        Epic: Object.freeze([3, 6]),
        Heroic: Object.freeze([3, 6]),
      }),
    }),
    LEVEL_RANGE_72_85: Object.freeze({
      Percent: Object.freeze({
        Epic: Object.freeze([4, 8]),
        Heroic: Object.freeze([4, 8]),
      }),
      Attack: Object.freeze({
        Epic: Object.freeze([33, 46]),
        Heroic: Object.freeze([31, 44]),
      }),
      Defense: Object.freeze({
        Epic: Object.freeze([28, 35]),
        Heroic: Object.freeze([26, 33]),
      }),
      Health: Object.freeze({
        Epic: Object.freeze([157, 202]),
        Heroic: Object.freeze([149, 192]),
      }),
      Speed: Object.freeze({
        Epic: Object.freeze([2, 5]),
        Heroic: Object.freeze([1, 4]),
      }),
      CriticalHitDamagePercent: Object.freeze({
        Epic: Object.freeze([4, 7]),
        Heroic: Object.freeze([4, 7]),
      }),
      CriticalHitChancePercent: Object.freeze({
        Epic: Object.freeze([3, 5]),
        Heroic: Object.freeze([3, 5]),
      }),
    }),
    LEVEL_RANGE_1_71: Object.freeze({
      Percent: Object.freeze({
        Epic: Object.freeze([4, 7]),
        Heroic: Object.freeze([4, 7]),
      }),
      Attack: Object.freeze({
        Epic: Object.freeze([28, 40]),
        Heroic: Object.freeze([27, 38]),
      }),
      Defense: Object.freeze({
        Epic: Object.freeze([24, 30]),
        Heroic: Object.freeze([22, 28]),
      }),
      Health: Object.freeze({
        Epic: Object.freeze([136, 175]),
        Heroic: Object.freeze([129, 166]),
      }),
      Speed: Object.freeze({
        Epic: Object.freeze([2, 4]),
        Heroic: Object.freeze([1, 3]),
      }),
      CriticalHitDamagePercent: Object.freeze({
        Epic: Object.freeze([3, 6]),
        Heroic: Object.freeze([3, 6]),
      }),
      CriticalHitChancePercent: Object.freeze({
        Epic: Object.freeze([2, 4]),
        Heroic: Object.freeze([2, 4]),
      }),
    }),
  });
globalThis.SUBSTAT_ROLL_RANGES = SUBSTAT_ROLL_RANGES;

// ============================================================================
// SUBSTAT ROLL RANGE CATEGORY MAP
// ============================================================================
// Maps a stat type string to its top-level category key inside SUBSTAT_ROLL_RANGES.
// Flat stats (Attack/Defense/Health) and the two named percent stats
// (CriticalHitDamagePercent, CriticalHitChancePercent) have their own keys.
// Every other percent substat (Atk%, Def%, HP%, EFF%, ER%…) falls under 'Percent'.
var SUBSTAT_ROLL_RANGE_CATEGORY =
  globalThis.SUBSTAT_ROLL_RANGE_CATEGORY ||
  Object.freeze({
    Attack: 'Attack',
    Defense: 'Defense',
    Health: 'Health',
    Speed: 'Speed',
    CriticalHitDamagePercent: 'CriticalHitDamagePercent',
    CriticalHitChancePercent: 'CriticalHitChancePercent',
  });
globalThis.SUBSTAT_ROLL_RANGE_CATEGORY = SUBSTAT_ROLL_RANGE_CATEGORY;

// Returns the SUBSTAT_ROLL_RANGES tier key for a given gear level.
// L88+ = reforged; L72-87 = reforgeable range; L1-71 = low-level gear.
function getGearLevelTier(level) {
  if (level >= 88) return 'LEVEL_88';
  if (level >= 72) return 'LEVEL_RANGE_72_85';
  return 'LEVEL_RANGE_1_71';
}
globalThis.getGearLevelTier = globalThis.getGearLevelTier || getGearLevelTier;

// ============================================================================
// REFORGE CONSTANTS
// ============================================================================
// Reforge state is derived from item level: level 85 = can be reforged,
// level 90 = already reforged.

var ITEM_REFORGE_TABLES =
  globalThis.ITEM_REFORGE_TABLES ||
  Object.freeze({
    '%_Rolls': Object.freeze([1, 3, 4, 5, 7, 8]),
    'CC%_Rolls': Object.freeze([1, 2, 3, 4, 5, 6]),
    'CD%_Rolls': Object.freeze([1, 2, 3, 4, 6, 7]),
    Speed_Rolls: Object.freeze([0, 1, 2, 3, 4, 4]),
    Attack_Rolls: Object.freeze([11, 22, 33, 44, 55, 66]),
    Defense_Rolls: Object.freeze([9, 18, 27, 36, 45, 54]),
    Health_Rolls: Object.freeze([56, 112, 168, 224, 280, 336]),
  });
globalThis.ITEM_REFORGE_TABLES = ITEM_REFORGE_TABLES;

var ITEM_REFORGE_STAT_MAP =
  globalThis.ITEM_REFORGE_STAT_MAP ||
  Object.freeze({
    AttackPercent: '%_Rolls',
    DefensePercent: '%_Rolls',
    HealthPercent: '%_Rolls',
    EffectivenessPercent: '%_Rolls',
    EffectResistancePercent: '%_Rolls',
    CriticalHitChancePercent: 'CC%_Rolls',
    CriticalHitDamagePercent: 'CD%_Rolls',
    Speed: 'Speed_Rolls',
    Attack: 'Attack_Rolls',
    Defense: 'Defense_Rolls',
    Health: 'Health_Rolls',
  });
globalThis.ITEM_REFORGE_STAT_MAP = ITEM_REFORGE_STAT_MAP;

// ============================================================================
// ITEM MODIFICATION ROLL RANGES
// ============================================================================
// Pre-calculated modification values organized by slot, then substat, then reforge status
// Direct lookup: ITEM_MODIFICATION_ROLL_RANGES[slot][substat][isReforged ? 'reforged' : 'non_reforged'][rollIndex]
// Roll index is 0-based (0-5 for rolls 1-6)

// Shared modification ranges for Necklace and Ring (identical values)
var NECKLACE_RING_SHARED_MODS = Object.freeze({
  Attack: Object.freeze({
    non_reforged_value: Object.freeze([47, 77, 101, 109, 129, 151]),
    non_reforged_min_value: Object.freeze([28, 42, 58, 67, 80, 109]),
    non_reforged_score: Object.freeze([
      4.17, 6.831, 8.961, 9.67, 11.445, 13.396,
    ]),
    reforged_value: Object.freeze([58, 99, 134, 153, 184, 217]),
    reforged_min_value: Object.freeze([39, 64, 91, 111, 135, 175]),
    reforged_score: Object.freeze([
      5.146, 8.783, 11.888, 13.574, 16.324, 19.252,
    ]),
  }),
  AttackPercent: Object.freeze({
    non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
    non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
    non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
    reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
    reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
    reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
  }),
  Defense: Object.freeze({
    non_reforged_value: Object.freeze([35, 61, 76, 80, 97, 111]),
    non_reforged_min_value: Object.freeze([24, 28, 43, 51, 62, 80]),
    non_reforged_score: Object.freeze([
      5.634, 9.819, 12.234, 12.877, 15.614, 17.867,
    ]),
    reforged_value: Object.freeze([44, 79, 103, 116, 142, 165]),
    reforged_min_value: Object.freeze([33, 45, 70, 87, 107, 134]),
    reforged_score: Object.freeze([
      7.083, 12.716, 16.58, 18.672, 22.857, 26.56,
    ]),
  }),
  DefensePercent: Object.freeze({
    non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
    non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
    non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
    reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
    reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
    reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
  }),
  Health: Object.freeze({
    non_reforged_value: Object.freeze([203, 336, 422, 461, 578, 659]),
    non_reforged_min_value: Object.freeze([134, 200, 274, 321, 370, 477]),
    non_reforged_score: Object.freeze([
      3.605, 5.967, 7.494, 8.187, 10.264, 11.703,
    ]),
    reforged_value: Object.freeze([259, 448, 590, 685, 858, 995]),
    reforged_min_value: Object.freeze([190, 312, 442, 545, 650, 813]),
    reforged_score: Object.freeze([
      4.599, 7.956, 10.478, 12.165, 15.237, 17.67,
    ]),
  }),
  HealthPercent: Object.freeze({
    non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
    non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
    non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
    reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
    reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
    reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
  }),
  Speed: Object.freeze({
    non_reforged_value: Object.freeze([4, 5, 6, 8, 9, 10]),
    non_reforged_min_value: Object.freeze([2, 2, 3, 4, 5, 6]),
    non_reforged_score: Object.freeze([9.0, 10.556, 12.0, 16.0, 18.0, 20.0]),
    reforged_value: Object.freeze([4, 6, 8, 11, 13, 14]),
    reforged_min_value: Object.freeze([2, 3, 5, 7, 9, 10]),
    reforged_score: Object.freeze([9.0, 12.667, 16.0, 22.0, 26.0, 28.0]),
  }),
  CriticalHitChancePercent: Object.freeze({
    non_reforged_value: Object.freeze([4, 6, 8, 10, 11, 12]),
    non_reforged_min_value: Object.freeze([2, 2, 3, 4, 6, 7]),
    non_reforged_score: Object.freeze([
      7.2, 9.5, 12.444, 15.417, 17.233, 18.667,
    ]),
    reforged_value: Object.freeze([5, 8, 11, 14, 16, 18]),
    reforged_min_value: Object.freeze([3, 4, 6, 8, 11, 13]),
    reforged_score: Object.freeze([9.0, 12.667, 17.111, 21.583, 25.067, 28.0]),
  }),
  CriticalHitDamagePercent: Object.freeze({
    non_reforged_value: Object.freeze([7, 9, 12, 15, 16, 17]),
    non_reforged_min_value: Object.freeze([3, 4, 6, 9, 11, 12]),
    non_reforged_score: Object.freeze([
      7.875, 10.688, 14.0, 17.344, 18.341, 19.429,
    ]),
    reforged_value: Object.freeze([8, 11, 15, 19, 22, 24]),
    reforged_min_value: Object.freeze([4, 6, 9, 13, 17, 19]),
    reforged_score: Object.freeze([9.0, 13.063, 17.5, 21.969, 25.22, 27.429]),
  }),
  EffectivenessPercent: Object.freeze({
    non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
    non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
    non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
    reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
    reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
    reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
  }),
  EffectResistancePercent: Object.freeze({
    non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
    non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
    non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
    reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
    reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
    reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
  }),
});

var ITEM_MODIFICATION_ROLL_RANGES =
  globalThis.ITEM_MODIFICATION_ROLL_RANGES ||
  Object.freeze({
    Weapon: Object.freeze({
      AttackPercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
      }),
      Health: Object.freeze({
        non_reforged_value: Object.freeze([203, 336, 422, 461, 578, 659]),
        non_reforged_min_value: Object.freeze([134, 200, 274, 321, 370, 477]),
        non_reforged_score: Object.freeze([
          3.605, 5.967, 7.494, 8.187, 10.264, 11.703,
        ]),
        reforged_value: Object.freeze([259, 448, 590, 685, 858, 995]),
        reforged_min_value: Object.freeze([190, 312, 442, 545, 650, 813]),
        reforged_score: Object.freeze([
          4.599, 7.956, 10.478, 12.165, 15.237, 17.67,
        ]),
      }),
      HealthPercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
      }),
      Speed: Object.freeze({
        non_reforged_value: Object.freeze([4, 5, 6, 8, 9, 10]),
        non_reforged_min_value: Object.freeze([2, 2, 3, 4, 5, 6]),
        non_reforged_score: Object.freeze([
          9.0, 10.556, 12.0, 16.0, 18.0, 20.0,
        ]),
        reforged_value: Object.freeze([4, 6, 8, 11, 13, 14]),
        reforged_min_value: Object.freeze([2, 3, 5, 7, 9, 10]),
        reforged_score: Object.freeze([9.0, 12.667, 16.0, 22.0, 26.0, 28.0]),
      }),
      CriticalHitChancePercent: Object.freeze({
        non_reforged_value: Object.freeze([4, 6, 8, 10, 11, 12]),
        non_reforged_min_value: Object.freeze([2, 2, 3, 4, 6, 7]),
        non_reforged_score: Object.freeze([
          7.2, 9.5, 12.444, 15.417, 17.233, 18.667,
        ]),
        reforged_value: Object.freeze([5, 8, 11, 14, 16, 18]),
        reforged_min_value: Object.freeze([3, 4, 6, 8, 11, 13]),
        reforged_score: Object.freeze([
          9.0, 12.667, 17.111, 21.583, 25.067, 28.0,
        ]),
      }),
      CriticalHitDamagePercent: Object.freeze({
        non_reforged_value: Object.freeze([7, 9, 12, 15, 16, 17]),
        non_reforged_min_value: Object.freeze([3, 4, 6, 9, 11, 12]),
        non_reforged_score: Object.freeze([
          7.875, 10.688, 14.0, 17.344, 18.341, 19.429,
        ]),
        reforged_value: Object.freeze([8, 11, 15, 19, 22, 24]),
        reforged_min_value: Object.freeze([4, 6, 9, 13, 17, 19]),
        reforged_score: Object.freeze([
          9.0, 13.063, 17.5, 21.969, 25.22, 27.429,
        ]),
      }),
      EffectivenessPercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
      }),
      EffectResistancePercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
      }),
    }),
    Helmet: Object.freeze({
      Attack: Object.freeze({
        non_reforged_value: Object.freeze([47, 77, 101, 109, 129, 151]),
        non_reforged_min_value: Object.freeze([28, 42, 58, 67, 80, 109]),
        non_reforged_score: Object.freeze([
          4.17, 6.831, 8.961, 9.67, 11.445, 13.396,
        ]),
        reforged_value: Object.freeze([58, 99, 134, 153, 184, 217]),
        reforged_min_value: Object.freeze([39, 64, 91, 111, 135, 175]),
        reforged_score: Object.freeze([
          5.146, 8.783, 11.888, 13.574, 16.324, 19.252,
        ]),
      }),
      AttackPercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
      }),
      Defense: Object.freeze({
        non_reforged_value: Object.freeze([35, 61, 76, 80, 97, 111]),
        non_reforged_min_value: Object.freeze([24, 28, 43, 51, 62, 80]),
        non_reforged_score: Object.freeze([
          5.634, 9.819, 12.234, 12.877, 15.614, 17.867,
        ]),
        reforged_value: Object.freeze([44, 79, 103, 116, 142, 165]),
        reforged_min_value: Object.freeze([33, 45, 70, 87, 107, 134]),
        reforged_score: Object.freeze([
          7.083, 12.716, 16.58, 18.672, 22.857, 26.56,
        ]),
      }),
      DefensePercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
      }),
      HealthPercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
      }),
      Speed: Object.freeze({
        non_reforged_value: Object.freeze([4, 5, 6, 8, 9, 10]),
        non_reforged_min_value: Object.freeze([2, 2, 3, 4, 5, 6]),
        non_reforged_score: Object.freeze([
          9.0, 10.556, 12.0, 16.0, 18.0, 20.0,
        ]),
        reforged_value: Object.freeze([4, 6, 8, 11, 13, 14]),
        reforged_min_value: Object.freeze([2, 3, 5, 7, 9, 10]),
        reforged_score: Object.freeze([9.0, 12.667, 16.0, 22.0, 26.0, 28.0]),
      }),
      CriticalHitChancePercent: Object.freeze({
        non_reforged_value: Object.freeze([4, 6, 8, 10, 11, 12]),
        non_reforged_min_value: Object.freeze([2, 2, 3, 4, 6, 7]),
        non_reforged_score: Object.freeze([
          7.2, 9.5, 12.444, 15.417, 17.233, 18.667,
        ]),
        reforged_value: Object.freeze([5, 8, 11, 14, 16, 18]),
        reforged_min_value: Object.freeze([3, 4, 6, 8, 11, 13]),
        reforged_score: Object.freeze([
          9.0, 12.667, 17.111, 21.583, 25.067, 28.0,
        ]),
      }),
      CriticalHitDamagePercent: Object.freeze({
        non_reforged_value: Object.freeze([7, 9, 12, 15, 16, 17]),
        non_reforged_min_value: Object.freeze([3, 4, 6, 9, 11, 12]),
        non_reforged_score: Object.freeze([
          7.875, 10.688, 14.0, 17.344, 18.341, 19.429,
        ]),
        reforged_value: Object.freeze([8, 11, 15, 19, 22, 24]),
        reforged_min_value: Object.freeze([4, 6, 9, 13, 17, 19]),
        reforged_score: Object.freeze([
          9.0, 13.063, 17.5, 21.969, 25.22, 27.429,
        ]),
      }),
      EffectivenessPercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
      }),
      EffectResistancePercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
      }),
    }),
    Armor: Object.freeze({
      DefensePercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
      }),
      Health: Object.freeze({
        non_reforged_value: Object.freeze([203, 336, 422, 461, 578, 659]),
        non_reforged_min_value: Object.freeze([134, 200, 274, 321, 370, 477]),
        non_reforged_score: Object.freeze([
          3.605, 5.967, 7.494, 8.187, 10.264, 11.703,
        ]),
        reforged_value: Object.freeze([259, 448, 590, 685, 858, 995]),
        reforged_min_value: Object.freeze([190, 312, 442, 545, 650, 813]),
        reforged_score: Object.freeze([
          4.599, 7.956, 10.478, 12.165, 15.237, 17.67,
        ]),
      }),
      HealthPercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
      }),
      Speed: Object.freeze({
        non_reforged_value: Object.freeze([4, 5, 6, 8, 9, 10]),
        non_reforged_min_value: Object.freeze([2, 2, 3, 4, 5, 6]),
        non_reforged_score: Object.freeze([
          9.0, 10.556, 12.0, 16.0, 18.0, 20.0,
        ]),
        reforged_value: Object.freeze([4, 6, 8, 11, 13, 14]),
        reforged_min_value: Object.freeze([2, 3, 5, 7, 9, 10]),
        reforged_score: Object.freeze([9.0, 12.667, 16.0, 22.0, 26.0, 28.0]),
      }),
      CriticalHitChancePercent: Object.freeze({
        non_reforged_value: Object.freeze([4, 6, 8, 10, 11, 12]),
        non_reforged_min_value: Object.freeze([2, 2, 3, 4, 6, 7]),
        non_reforged_score: Object.freeze([
          7.2, 9.5, 12.444, 15.417, 17.233, 18.667,
        ]),
        reforged_value: Object.freeze([5, 8, 11, 14, 16, 18]),
        reforged_min_value: Object.freeze([3, 4, 6, 8, 11, 13]),
        reforged_score: Object.freeze([
          9.0, 12.667, 17.111, 21.583, 25.067, 28.0,
        ]),
      }),
      CriticalHitDamagePercent: Object.freeze({
        non_reforged_value: Object.freeze([7, 9, 12, 15, 16, 17]),
        non_reforged_min_value: Object.freeze([3, 4, 6, 9, 11, 12]),
        non_reforged_score: Object.freeze([
          7.875, 10.688, 14.0, 17.344, 18.341, 19.429,
        ]),
        reforged_value: Object.freeze([8, 11, 15, 19, 22, 24]),
        reforged_min_value: Object.freeze([4, 6, 9, 13, 17, 19]),
        reforged_score: Object.freeze([
          9.0, 13.063, 17.5, 21.969, 25.22, 27.429,
        ]),
      }),
      EffectivenessPercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
      }),
      EffectResistancePercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
      }),
    }),
    Necklace: NECKLACE_RING_SHARED_MODS,
    Ring: NECKLACE_RING_SHARED_MODS,
    Boots: Object.freeze({
      Attack: Object.freeze({
        non_reforged_value: Object.freeze([47, 77, 101, 109, 129, 151]),
        non_reforged_min_value: Object.freeze([28, 42, 58, 67, 80, 109]),
        non_reforged_score: Object.freeze([
          4.17, 6.831, 8.961, 9.67, 11.445, 13.396,
        ]),
        reforged_value: Object.freeze([58, 99, 134, 153, 184, 217]),
        reforged_min_value: Object.freeze([39, 64, 91, 111, 135, 175]),
        reforged_score: Object.freeze([
          5.146, 8.783, 11.888, 13.574, 16.324, 19.252,
        ]),
      }),
      AttackPercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
      }),
      Defense: Object.freeze({
        non_reforged_value: Object.freeze([35, 61, 76, 80, 97, 111]),
        non_reforged_min_value: Object.freeze([24, 28, 43, 51, 62, 80]),
        non_reforged_score: Object.freeze([
          5.634, 9.819, 12.234, 12.877, 15.614, 17.867,
        ]),
        reforged_value: Object.freeze([44, 79, 103, 116, 142, 165]),
        reforged_min_value: Object.freeze([33, 45, 70, 87, 107, 134]),
        reforged_score: Object.freeze([
          7.083, 12.716, 16.58, 18.672, 22.857, 26.56,
        ]),
      }),
      DefensePercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
      }),
      Health: Object.freeze({
        non_reforged_value: Object.freeze([203, 336, 422, 461, 578, 659]),
        non_reforged_min_value: Object.freeze([134, 200, 274, 321, 370, 477]),
        non_reforged_score: Object.freeze([
          3.605, 5.967, 7.494, 8.187, 10.264, 11.703,
        ]),
        reforged_value: Object.freeze([259, 448, 590, 685, 858, 995]),
        reforged_min_value: Object.freeze([190, 312, 442, 545, 650, 813]),
        reforged_score: Object.freeze([
          4.599, 7.956, 10.478, 12.165, 15.237, 17.67,
        ]),
      }),
      HealthPercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
      }),
      Speed: Object.freeze({
        non_reforged_value: Object.freeze([4, 5, 6, 8, 9, 10]),
        non_reforged_min_value: Object.freeze([2, 2, 3, 4, 5, 6]),
        non_reforged_score: Object.freeze([
          7.726, 8.585, 9.934, 13.013, 14.487, 16.557,
        ]),
        reforged_value: Object.freeze([4, 6, 8, 11, 13, 14]),
        reforged_min_value: Object.freeze([2, 3, 5, 7, 9, 10]),
        reforged_score: Object.freeze([
          7.726, 10.302, 13.245, 17.893, 20.926, 23.179,
        ]),
      }),
      CriticalHitChancePercent: Object.freeze({
        non_reforged_value: Object.freeze([4, 6, 8, 10, 11, 12]),
        non_reforged_min_value: Object.freeze([2, 2, 3, 4, 6, 7]),
        non_reforged_score: Object.freeze([
          7.2, 9.5, 12.444, 15.417, 17.233, 18.667,
        ]),
        reforged_value: Object.freeze([5, 8, 11, 14, 16, 18]),
        reforged_min_value: Object.freeze([3, 4, 6, 8, 11, 13]),
        reforged_score: Object.freeze([
          9.0, 12.667, 17.111, 21.583, 25.067, 28.0,
        ]),
      }),
      CriticalHitDamagePercent: Object.freeze({
        non_reforged_value: Object.freeze([7, 9, 12, 15, 16, 17]),
        non_reforged_min_value: Object.freeze([3, 4, 6, 9, 11, 12]),
        non_reforged_score: Object.freeze([
          7.875, 10.688, 14.0, 17.344, 18.341, 19.429,
        ]),
        reforged_value: Object.freeze([8, 11, 15, 19, 22, 24]),
        reforged_min_value: Object.freeze([4, 6, 9, 13, 17, 19]),
        reforged_score: Object.freeze([
          9.0, 13.063, 17.5, 21.969, 25.22, 27.429,
        ]),
      }),
      EffectivenessPercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
      }),
      EffectResistancePercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.0, 11.0, 14.0, 17.0, 18.0, 19.0]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.0, 14.0, 18.0, 22.0, 25.0, 27.0]),
      }),
    }),
  });
globalThis.ITEM_MODIFICATION_ROLL_RANGES = ITEM_MODIFICATION_ROLL_RANGES;

// ============================================================================
// ITEM MAPPINGS
// ============================================================================
var ITEM_GEAR_MAPPING =
  globalThis.ITEM_GEAR_MAPPING ||
  Object.freeze({
    Necklace: 'Neck',
    Helmet: 'Helm',
    Boots: 'Boot',
  });
globalThis.ITEM_GEAR_MAPPING = ITEM_GEAR_MAPPING;

var STAT_DISPLAY_MAPPING =
  globalThis.STAT_DISPLAY_MAPPING ||
  Object.freeze({
    Attack: 'Atk',
    AttackPercent: 'Atk %',
    CriticalHitChancePercent: 'CC %',
    CriticalHitDamagePercent: 'CD %',
    Defense: 'Def',
    DefensePercent: 'Def %',
    EffectivenessPercent: 'EFF %',
    EffectResistancePercent: 'ER %',
    Health: 'Hp',
    HealthPercent: 'Hp %',
    Speed: 'Speed',
  });
globalThis.STAT_DISPLAY_MAPPING = STAT_DISPLAY_MAPPING;

var ITEM_MAIN_STAT_MAPPING = STAT_DISPLAY_MAPPING;
globalThis.ITEM_MAIN_STAT_MAPPING = ITEM_MAIN_STAT_MAPPING;

var ITEM_SUBSTAT_MAPPING = STAT_DISPLAY_MAPPING;
globalThis.ITEM_SUBSTAT_MAPPING = ITEM_SUBSTAT_MAPPING;

// ============================================================================
// ARCHETYPE RULES & SCORING CONFIGS
// ============================================================================
// Defined in archetypeRules.js (loaded next) and read off globalThis by
// gearScorer.js as globalThis.ARCHETYPE_RULES / globalThis.SCORING_CONFIGS.
// Not re-declared here — this file only owns the gear constants above.

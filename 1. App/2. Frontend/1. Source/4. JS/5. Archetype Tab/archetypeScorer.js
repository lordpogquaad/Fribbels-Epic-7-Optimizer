/**
 * ArchetypeScorer — pure scoring functions for evaluating gear items against
 * archetype definitions. No DOM access; safe to call from any context.
 *
 * Scoring algorithm (scoreItemGeneric):
 *  1. Build a weightMap from archetype.substats positions [6,5,4,3,2,1].
 *     null/"Any" positions contribute 0 (no weight assigned).
 *  2. For each weighted stat type, convert the item's raw substat value to a
 *     normalised roll-count (using ROLL_DIVISORS + flat stat normalisation).
 *  3. score = Σ(rolls × weight) across all stat types.
 *  4. Multiply by archetype.setBonus  if item.set matches a preferred set.
 *  5. Multiply by archetype.mainBonus if item.main.type matches preferred main
 *     (Weapon/Helmet/Armor always match since their main is fixed).
 */

import ROLL_DIVISORS from '../1. Optimizer & Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/rollDivisors.js';
import FlatStatCalibration from '../2. Gear & Enhancing Tab/3. Gear/flatStatCalibration.js';

// Substat position → weight (S1 is most valuable at position 0 → weight 6)
const SUBSTAT_WEIGHTS = [6, 5, 4, 3, 2, 1];

// Gear slots that have a fixed main stat — always eligible for mainBonus.
const FIXED_MAIN_SLOTS = new Set(['Weapon', 'Helmet', 'Armor']);

/**
 * Convert a raw substat value to a normalised roll-count for scoring purposes.
 * Flat Attack/HP/Defense use calibrated roll scores so they compare on the same
 * scale as percent substats (1 average flat roll ≈ 3–5 scoring units).
 */
function toRolls(statType, value) {
  switch (statType) {
    case 'AttackPercent':
      return value / ROLL_DIVISORS.AttackPercent;
    case 'HealthPercent':
      return value / ROLL_DIVISORS.HealthPercent;
    case 'DefensePercent':
      return value / ROLL_DIVISORS.DefensePercent;
    case 'EffectivenessPercent':
      return value / ROLL_DIVISORS.EffectivenessPercent;
    case 'EffectResistancePercent':
      return value / ROLL_DIVISORS.EffectResistancePercent;
    case 'Attack':
      return (value * FlatStatCalibration.getWeights().atk) / 39;
    case 'Health':
      return (value * FlatStatCalibration.getWeights().hp) / 174;
    case 'Defense':
      return (value * FlatStatCalibration.getWeights().def) / 31;
    case 'Speed':
      return value / ROLL_DIVISORS.Speed;
    case 'CriticalHitChancePercent':
      return Math.min(value, 100) / ROLL_DIVISORS.CriticalHitChancePercent;
    case 'CriticalHitDamagePercent':
      return value / ROLL_DIVISORS.CriticalHitDamagePercent;
    default:
      return 0;
  }
}

/**
 * Score a single item against a single archetype definition.
 * Returns a numeric score (rounded to 1 decimal place).
 *
 * @param {object} item      - Gear item with .augmentedStats, .set, .gear, .main.type
 * @param {object} archetype - Archetype definition (see defaultArchetypes.js)
 * @returns {number}
 */
function scoreItemGeneric(item, archetype) {
  const stats = item && item.augmentedStats;
  if (!stats) return 0;

  const weightMap = buildWeightMap(item, archetype);
  let score = calculateSubstatScore(stats, weightMap, archetype);
  score = applySetBonus(score, item, archetype);
  score = applyMainBonus(score, item, archetype);

  return Math.round(score * 10) / 10;
}

/**
 * Build weighted map: statType → cumulative weight from substats ordering.
 * Use per-slot override (slotSubstats[gear]) when available, else global substats.
 */
function buildWeightMap(item, archetype) {
  const substatsToUse =
    archetype.slotSubstats?.[item.gear] ?? archetype.substats ?? [];
  const weightMap = {};
  substatsToUse.forEach((statType, i) => {
    if (i >= SUBSTAT_WEIGHTS.length) return;
    if (statType !== null && statType !== undefined) {
      weightMap[statType] = (weightMap[statType] || 0) + SUBSTAT_WEIGHTS[i];
    }
  });
  return weightMap;
}

/**
 * Accumulate weighted roll scores with optional per-archetype multipliers.
 */
function calculateSubstatScore(stats, weightMap, archetype) {
  let score = 0;
  for (const [statType, weight] of Object.entries(weightMap)) {
    const sw = getStatWeight(archetype, statType);
    score += toRolls(statType, stats[statType] || 0) * weight * sw;
  }
  return score;
}

/**
 * Get stat weight multiplier for a given stat type.
 */
function getStatWeight(archetype, statType) {
  if (archetype.statWeights?.[statType] != null) {
    return archetype.statWeights[statType];
  }
  if (archetype.statWeights?._any != null) {
    return archetype.statWeights._any;
  }
  return 1;
}

/**
 * Apply set bonus multiplier if item set matches archetype preferences.
 */
function applySetBonus(score, item, archetype) {
  const setMatch = isSetMatch(item.set, archetype);
  return setMatch ? score * (archetype.setBonus || 1) : score;
}

/**
 * Check if item set matches archetype's four-piece or two-piece sets.
 */
function isSetMatch(itemSet, archetype) {
  const fourMatch = isSetListMatch(itemSet, archetype.fourPieceSets);
  const twoMatch = isSetListMatch(itemSet, archetype.twoPieceSets);
  return fourMatch || twoMatch;
}

/**
 * Check if item set matches a set list (null = any, array may contain null).
 */
function isSetListMatch(itemSet, setList) {
  if (setList === null) return true;
  if (Array.isArray(setList)) {
    return setList.includes(null) || setList.includes(itemSet);
  }
  return false;
}

/**
 * Apply main stat bonus multiplier if item main stat matches archetype preferences.
 */
function applyMainBonus(score, item, archetype) {
  const mainMatch = isMainMatch(item, archetype);
  return mainMatch ? score * (archetype.mainBonus || 1) : score;
}

/**
 * Check if item main stat matches archetype preferences.
 */
function isMainMatch(item, archetype) {
  const gear = item.gear;
  if (FIXED_MAIN_SLOTS.has(gear)) return true;
  if (!archetype.mainStats) return false;

  const slotPref = archetype.mainStats[gear];
  if (slotPref === null || slotPref === undefined) return true;
  return (
    slotPref.includes(null) || (item.main && slotPref.includes(item.main.type))
  );
}

/**
 * Score an item against all archetypes.
 * Returns array sorted descending by score: [{id, name, score}, ...]
 *
 * @param {object}   item       - Gear item
 * @param {object[]} archetypes - Array of archetype definitions
 * @returns {{id: string, name: string, score: number}[]}
 */
function scoreAllArchetypes(item, archetypes) {
  if (!item || !archetypes?.length) return [];
  return archetypes
    .map((a) => ({
      id: a.id,
      name: a.name,
      score: scoreItemGeneric(item, a),
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Get the best (maximum) score across all archetypes for an item.
 * Used for the generic "Score" / Wss column.
 *
 * @param {object}   item       - Gear item
 * @param {object[]} archetypes - Array of archetype definitions
 * @returns {number}
 */
function getBestScore(item, archetypes) {
  if (!item || !archetypes?.length) return 0;
  let best = 0;
  for (const a of archetypes) {
    const s = scoreItemGeneric(item, a);
    if (s > best) best = s;
  }
  return best;
}

/**
 * Get the score for a specific archetype by id.
 * Used for the named score columns (dScore, sScore, cScore).
 *
 * @param {object}   item        - Gear item
 * @param {object[]} archetypes  - Array of archetype definitions
 * @param {string}   archetypeId - Target archetype id (e.g. 'dps', 'er-tank')
 * @returns {number}
 */
function getArchetypeScore(item, archetypes, archetypeId) {
  if (!item || !archetypes) return null;
  const archetype = archetypes.find((a) => a.id === archetypeId);
  if (!archetype) return null; // archetype deleted by user — show blank, not red 0
  return scoreItemGeneric(item, archetype);
}

/**
 * Get the best score across all archetypes belonging to a specific group.
 * Returns null if group is empty/falsy or no archetypes match.
 *
 * @param {object}   item       - Gear item
 * @param {object[]} archetypes - Array of archetype definitions
 * @param {string}   group      - Group name to filter by (e.g. 'DPS')
 * @returns {number|null}
 */
function getBestGroupScore(item, archetypes, group) {
  if (!item || !archetypes?.length || !group) return null;
  const groupArchetypes = archetypes.filter((a) => a.group === group);
  if (!groupArchetypes.length) return null;
  let best = 0;
  for (const a of groupArchetypes) {
    const s = scoreItemGeneric(item, a);
    if (s > best) best = s;
  }
  return best;
}

/**
 * Compute raw Gear Score (GS) for an item using the standard substat formula.
 * This is purely substat-based — no set or main-stat bonuses.
 *
 * Formula:
 *   %Stats (Atk%, Def%, HP%, Eff%, Res%) × 1
 *   Speed × (9/4) if base roll only (rolls === 0), else × (8/4)
 *   CD% × (9/8)  |  CC% × (9/6)
 *   Flat Atk/Def/HP × (7 / calibrated_max)  (uses FlatStatCalibration)
 *
 * @param {object} item - Gear item with .reforgedStats / .augmentedStats and .substats
 * @returns {number} GS rounded to 1 decimal place
 */
function computeGearScore(item) {
  if (!item) return 0;
  const stats = item.reforgedStats || item.augmentedStats || {};
  const w = FlatStatCalibration.getWeights();

  // Speed multiplier: use 9/4 for base-only rolls (no enhancement roll received),
  // 8/4 once the substat has been enhanced at least once.
  const speedSub = item.substats
    ? item.substats.find((s) => s.type === 'Speed')
    : null;
  const speedMult = speedSub && (speedSub.rolls || 0) > 0 ? 8 / 4 : 9 / 4;

  const score =
    (stats.AttackPercent || 0) * 1 +
    (stats.DefensePercent || 0) * 1 +
    (stats.HealthPercent || 0) * 1 +
    (stats.EffectivenessPercent || 0) * 1 +
    (stats.EffectResistancePercent || 0) * 1 +
    (stats.Speed || 0) * speedMult +
    (stats.CriticalHitDamagePercent || 0) * (9 / 8) +
    (stats.CriticalHitChancePercent || 0) * (9 / 6) +
    (stats.Attack || 0) * (w.atk / 39) +
    (stats.Defense || 0) * (w.def / 31) +
    (stats.Health || 0) * (w.hp / 174);

  return Math.round(score * 10) / 10;
}

const ArchetypeScorer = {
  scoreItemGeneric,
  scoreAllArchetypes,
  getBestScore,
  getArchetypeScore,
  getBestGroupScore,
  computeGearScore,
};

export default ArchetypeScorer;

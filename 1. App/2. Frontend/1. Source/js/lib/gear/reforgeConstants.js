/**
 * Shared reforge constants — single source of truth for data that was
 * previously copy-pasted across reforge.js, itemSimulator.js, and
 * e7Constants.js.
 *
 * CommonJS so that:
 *   • e7Constants.js (scoring layer, CJS) can require() it directly
 *   • reforge.js / itemSimulator.js (ES module, webpack) can import it via
 *     default import + destructure  (webpack handles CJS→ESM interop)
 */

/** Stat types whose reforge bonus uses the plain-percentage table. */
const plainStats = Object.freeze([
    'AttackPercent',
    'DefensePercent',
    'HealthPercent',
    'EffectivenessPercent',
    'EffectResistancePercent',
]);

/**
 * Maps roll count (1–6) → bonus added to a plain-percentage substat on reforge.
 * e.g. roll count 1 → +1%, roll count 6 → +8%.
 */
const plainStatRollsToValue = Object.freeze({ 1: 1, 2: 3, 3: 4, 4: 5, 5: 7, 6: 8 });

/**
 * Maps roll count (1–6) → bonus added to CriticalHitDamagePercent on reforge.
 */
const critDamageRollsToValue = Object.freeze({ 1: 1, 2: 2, 3: 3, 4: 4, 5: 6, 6: 7 });

/**
 * Maps roll count (1–6) → bonus added to Speed on reforge.
 * Note: 1 roll adds 0 speed (intentional game value).
 */
const speedRollsToValue = Object.freeze({ 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 4 });

/**
 * Maximum total substat rolls for a fully enhanced (+15) gear piece, by rank.
 * Keys use Title Case to match item.rank values in gear data.
 */
const maxRollsByRank = Object.freeze({
    Epic: 9,
    Heroic: 8,
    Rare: 7,
    Good: 6,
    Normal: 5,
});

/**
 * Flat substat single-roll [min, max] ranges by level tier × stat × rank.
 * Used by itemSimulator.js for Monte-Carlo simulation and by e7Constants.js
 * for SUBSTAT_ROLL_RANGES.
 */
const flatRollsByTier = Object.freeze({
    88: Object.freeze({
        Attack:  Object.freeze({ Epic: Object.freeze([37, 53]), Heroic: Object.freeze([36, 50]), Rare: Object.freeze([34, 48]) }),
        Defense: Object.freeze({ Epic: Object.freeze([32, 40]), Heroic: Object.freeze([30, 38]), Rare: Object.freeze([28, 36]) }),
        Health:  Object.freeze({ Epic: Object.freeze([178, 229]), Heroic: Object.freeze([169, 218]), Rare: Object.freeze([160, 206]) }),
    }),
    85: Object.freeze({
        Attack:  Object.freeze({ Epic: Object.freeze([33, 46]), Heroic: Object.freeze([31, 44]), Rare: Object.freeze([29, 42]) }),
        Defense: Object.freeze({ Epic: Object.freeze([28, 35]), Heroic: Object.freeze([26, 33]), Rare: Object.freeze([25, 31]) }),
        Health:  Object.freeze({ Epic: Object.freeze([157, 202]), Heroic: Object.freeze([149, 192]), Rare: Object.freeze([141, 182]) }),
    }),
    71: Object.freeze({
        Attack:  Object.freeze({ Epic: Object.freeze([28, 40]), Heroic: Object.freeze([27, 38]), Rare: Object.freeze([25, 36]) }),
        Defense: Object.freeze({ Epic: Object.freeze([24, 30]), Heroic: Object.freeze([22, 28]), Rare: Object.freeze([21, 27]) }),
        Health:  Object.freeze({ Epic: Object.freeze([136, 175]), Heroic: Object.freeze([129, 166]), Rare: Object.freeze([122, 157]) }),
    }),
});

/**
 * Gear rank names — single CJS source of truth shared by e7Constants.js.
 * ESM consumers (enums.js) redeclare the same values as `rankEnum` for use
 * in the browser bundle; the values must be kept identical.
 */
const ITEM_RANK = Object.freeze({
    NORMAL: 'Normal',
    GOOD:   'Good',
    RARE:   'Rare',
    HEROIC: 'Heroic',
    EPIC:   'Epic',
});

module.exports = {
    plainStats,
    plainStatRollsToValue,
    critDamageRollsToValue,
    speedRollsToValue,
    maxRollsByRank,
    flatRollsByTier,
    ITEM_RANK,
};

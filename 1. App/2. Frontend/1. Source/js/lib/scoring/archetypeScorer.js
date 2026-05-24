/**
 * archetypeScorer.js
 * Fribbels adapter: scores items using the GAS-ported archetype system.
 *
 * Called from itemAugmenter.js after the standard augment loop.
 * Writes `item.archetypeScores` as:
 * {
 *   allScores:             { 'Off. DPS': { score: 184 }, 'UOff. Bruiser': { score: 8 }, ... },
 *   bestOfficialArchetype: 'Off. DPS',
 *   bestOfficialScore:     184,
 *   bestPersonalArchetype: 'UOff. DPS',
 *   bestPersonalScore:     184,
 *   offCPower:             34,   // Off. C.Power aggregate
 *   offAPower:             34,   // Off. A.Power aggregate (no Future)
 *   uoffCPower:            34,   // UOff. C.Power (borrows Off. Future)
 *   uoffAPower:            34,   // UOff. A.Power (no Future)
 * }
 */
'use strict';

const E7Scorer = require('./e7Scorer');
const { GEAR_SLOT } = require('./e7Constants');

const GEAR_SLOTS = Object.values(GEAR_SLOT);

/**
 * Extracts the main stat type string from a Fribbels item.
 * Fribbels items store main stat as either item.main.type (object) or item.main (string).
 */
function getMainStatType(item) {
    if (!item) return null;
    if (item.main && typeof item.main === 'object') return item.main.type ?? null;
    return item.main ?? null;
}

/**
 * Scores all items and writes archetypeScores onto each item.
 * @param {Array<Object>} items - Fribbels gear items (already augmented)
 */
function scoreAllItems(items) {
    if (!Array.isArray(items)) return;

    items.forEach(item => {
        if (!item || !item.gear) return;

        const flatScores = {}; // temp: { 'Off. DPS': 184, ... }

        const gearSlot     = item.gear;       // e.g. 'Ring', 'Boots'
        const setName      = item.set;        // e.g. 'SpeedSet' (with suffix)
        const mainStatType = getMainStatType(item);
        const rank         = item.rank   ?? 'Epic';
        const enhance      = item.enhance ?? 0;
        const substats     = item.substats ?? [];

        // Total rolls across all substats
        const totalRolls = substats.reduce(
            (sum, s) => sum + (s && typeof s.rolls === 'number' ? s.rolls : 0),
            0
        );

        const isFixedSlot = ['Weapon', 'Helmet', 'Armor'].includes(gearSlot);
        const slotRules   = E7Scorer.getCombinedSlotRules(gearSlot);
        if (!slotRules || slotRules.length === 0) {
            item.archetypeScores = buildStructuredScores({});
            return;
        }

        const applicableRules = E7Scorer.findApplicableArchetypes(
            slotRules,
            substats,
            setName,   // findApplicableArchetypes normalizes 'SpeedSet' → 'Speed' internally
            mainStatType,
            isFixedSlot,
            {},        // no custom display mapping needed
            gearSlot
        );

        applicableRules.forEach(rule => {
            if (E7Scorer.isPotentialBasedArchetype(rule.archetype)) {
                const { baseName, type: sourceType } = E7Scorer.getArchetypeSource(rule.archetype);
                let score = 0;

                if (baseName === 'Top Speed') {
                    score = E7Scorer.calculateTopSpeedScore(substats, item.reforgedStats ?? {}, rank, item.level ?? 85, enhance, null, sourceType);
                } else if (baseName === 'Speed') {
                    const { matching } = E7Scorer.categorizeSubstats(substats, rule, setName, mainStatType);
                    const { totalGS: matchingGS } = E7Scorer.calculateGearScore(matching, item.reforgedStats ?? {}, gearSlot, setName);
                    score = E7Scorer.calculateSpeedScore(substats, item.reforgedStats ?? {}, rank, item.level ?? 85, enhance, setName, matchingGS, totalRolls, null, sourceType);
                } else if (baseName === 'Effectiveness Focus') {
                    score = ['Weapon', 'Helmet', 'Armor'].includes(gearSlot)
                        ? E7Scorer.calculateFixedSlotEffectivenessFocusScore(substats, item.reforgedStats ?? {}, rank, item.level ?? 85, enhance, gearSlot, setName)
                        : E7Scorer.calculateEffectivenessFocusScore(substats, item.reforgedStats ?? {}, rank, item.level ?? 85, enhance, gearSlot, mainStatType, setName);
                } else if (baseName === 'Effect Resist Focus') {
                    score = gearSlot === 'Armor'
                        ? E7Scorer.calculateArmorEffectResistFocusScore(substats, item.reforgedStats ?? {}, rank, item.level ?? 85, enhance, gearSlot, setName)
                        : E7Scorer.calculateEffectResistFocusScore(substats, item.reforgedStats ?? {}, rank, item.level ?? 85, enhance, gearSlot, mainStatType, setName);
                } else if (baseName === 'Crit Chance Focus') {
                    score = E7Scorer.calculateCritChanceFocusScore(substats, item.reforgedStats ?? {}, rank, item.level ?? 85, enhance, gearSlot, mainStatType, setName);
                } else if (baseName === 'Attack Focus') {
                    score = E7Scorer.calculateAttackFocusScore(substats, item.reforgedStats ?? {}, rank, item.level ?? 85, enhance, gearSlot, mainStatType, setName);
                } else if (baseName === 'HP Focus') {
                    score = E7Scorer.calculateHPFocusScore(substats, item.reforgedStats ?? {}, rank, item.level ?? 85, enhance, gearSlot, mainStatType, setName);
                }

                if (score > 0) flatScores[rule.archetype] = score;
                return;
            }

            const { matching } = E7Scorer.categorizeSubstats(
                substats,
                rule,
                setName,
                mainStatType
            );

            const { totalGS: matchingGS, totalRolls: matchingRolls } =
                E7Scorer.calculateGearScore(matching, item.reforgedStats ?? {}, gearSlot, setName);

            const matchingSubstatCount = matching.filter(s => (s?.rolls ?? 0) >= 1).length;

            const score = E7Scorer.calculateCustomArchetypeScore({
                archetype:            rule.archetype,
                gearSlot,
                rank,
                enhance,
                matchingSubstatRolls: matchingRolls,
                actualScore:          matchingGS,
                setName,
                mainStat:             mainStatType,
                matchingSubstatCount,
                totalRolls,
            });

            if (score > 0) {
                flatScores[rule.archetype] = score;
            }
        });

        item.archetypeScores = buildStructuredScores(flatScores);
    });
}

// ── C.Power / A.Power ────────────────────────────────────────────────────────
// Priority groups (highest priority = index 0). Only the highest group that has
// any score > 0 contributes to the aggregate.
const C_POWER_GROUPS = [
    { name: 'DPS',     archetypes: ['DPS', 'DPS (No CC%)'] },
    { name: 'Tank',    archetypes: ['Res Tank', 'Pure Tank'] },
    { name: 'EFF.ER',  archetypes: ['EFF. Tank', 'Atk + EFF', 'Atk + ER', 'EFF + ER'] },
    { name: 'Bruiser', archetypes: ['Bruiser(Hp/Def)', 'Bruiser', 'Bruiser (B. Dmg)'] },
    { name: 'Future',  archetypes: ['Future'] },
];

// Speed only counts toward C/A.Power if ≥1 of these 11 archetypes also scores > 0
const SPEED_QUALIFIER_BASE_NAMES = [
    'DPS', 'DPS (No CC%)', 'Res Tank', 'Pure Tank',
    'EFF. Tank', 'Atk + EFF', 'Atk + ER', 'EFF + ER',
    'Bruiser(Hp/Def)', 'Bruiser', 'Bruiser (B. Dmg)',
];

/**
 * Computes the C.Power or A.Power aggregate score from a completed allScores map.
 *
 * @param {Object} allScores - { 'Off. DPS': { score: N }, ... }
 * @param {string} prefix    - 'Off. ' or 'UOff. '
 * @param {boolean} excludeFuture - true for A.Power (skips Future group)
 * @returns {number} aggregate score (0 if no archetypes match)
 */
function calculateCombatPower(allScores, prefix, excludeFuture) {
    const sc = (name) => (allScores[name] && allScores[name].score) || 0;

    // Top Speed
    const topSpeedScore = sc(`${prefix}Top Speed`);

    // Speed (with qualifier check)
    const speedScore = sc(`${prefix}Speed`);
    const speedQualifies = speedScore > 0 &&
        SPEED_QUALIFIER_BASE_NAMES.some(a => sc(`${prefix}${a}`) > 0);
    const effectiveSpeed = speedQualifies ? speedScore : 0;

    // Best priority group (highest priority that has score > 0)
    const groups = excludeFuture
        ? C_POWER_GROUPS.filter(g => g.name !== 'Future')
        : C_POWER_GROUPS;

    let bestGroupScore = 0;
    for (const group of groups) {
        let groupMax = 0;
        for (const a of group.archetypes) {
            // UOff. C.Power borrows Off. Future (UOff. Future does not exist)
            const lookupPrefix = (group.name === 'Future' && prefix === 'UOff. ')
                ? 'Off. '
                : prefix;
            const s = sc(`${lookupPrefix}${a}`);
            if (s > groupMax) groupMax = s;
        }
        if (groupMax > 0) {
            bestGroupScore = groupMax;
            break; // take highest-priority group only
        }
    }

    return topSpeedScore + effectiveSpeed + bestGroupScore;
}

/**
 * Converts a flat { archetype: score } map to the structured archetypeScores object.
 */
function buildStructuredScores(flatScores) {
    const allScores = {};
    let bestOfficialArchetype = null;
    let bestOfficialScore = 0;
    let bestPersonalArchetype = null;
    let bestPersonalScore = 0;

    Object.entries(flatScores).forEach(([name, score]) => {
        allScores[name] = { score };
        if (name.startsWith('Off. ') && score > bestOfficialScore) {
            bestOfficialScore = score;
            bestOfficialArchetype = name;
        }
        if (name.startsWith('UOff. ') && score > bestPersonalScore) {
            bestPersonalScore = score;
            bestPersonalArchetype = name;
        }
    });

    return {
        allScores,
        bestOfficialArchetype,
        bestOfficialScore: bestOfficialScore || null,
        bestPersonalArchetype,
        bestPersonalScore: bestPersonalScore || null,
        offCPower:   calculateCombatPower(allScores, 'Off. ',   false),
        offAPower:   calculateCombatPower(allScores, 'Off. ',   true),
        uoffCPower:  calculateCombatPower(allScores, 'UOff. ',  false),
        uoffAPower:  calculateCombatPower(allScores, 'UOff. ',  true),
    };
}

/**
 * Returns a sorted list of all unique archetype names across all gear slots.
 * Used to populate the archetype filter dropdown.
 */
function getAllArchetypeNames() {
    const names = new Set();
    GEAR_SLOTS.forEach(slot => {
        const rules = E7Scorer.getCombinedSlotRules(slot);
        if (rules) rules.forEach(rule => {
            names.add(rule.archetype);
        });
    });
    return [...names].sort();
}

/**
 * Clears all scorer caches. Call when items are reloaded.
 */
function resetCaches() {
    E7Scorer.resetCaches();
}

module.exports = {
    scoreAllItems,
    resetCaches,
    getAllArchetypeNames,
};

/**
 * e7Scorer.js
 * Pure scoring functions ported from the GAS Code.js (3. Code.js).
 * All globalThis references have been replaced with direct imports.
 * All addDetailedLog / GAS-specific calls have been removed.
 */
'use strict';

// ── Constants ────────────────────────────────────────────────────────────────
const {
    ITEM_RANK,
    BASE_ITEM_RANK_SUBSTATS,
    ITEM_LEVEL,
    GEAR_SLOT,
    ITEM_MAIN,
    ITEM_ALLOWED_SUBSTATS,
    ITEM_ENHANCE_LEVELS,
    ITEM_ENHANCE_LEVELS_SUBSTATS_UNLOCKED,
    ITEM_ENHANCE_LEVELS_SUBSTATS_ENHANCED,
    ITEM_MAX_ENHANCE_TOTAL_ROLLS,
    ITEM_ENHANCEMENT_CONFIG,
    ITEM_SUBSTAT_STAT_WEIGHTS,
    SUBSTAT_ROLL_RANGES,
    ITEM_REFORGE_TABLES,
    ITEM_REFORGE_STAT_MAP,
    NECKLACE_RING_SHARED_MODS,
    ITEM_MODIFICATION_ROLL_RANGES,
    ITEM_GEAR_MAPPING,
} = require('./e7Constants');

// ── Archetype rules & scoring configs ────────────────────────────────────────
const {
    ARCHETYPE_RULES,
    OFFICIAL_ARCHETYPE_RULES,
    SCORING_CONFIGS,
    OFFICIAL_SCORING_CONFIGS,
    // Speed tiers
    TopSpeedTiers,
    OFFICIAL_TopSpeedTiers,
    SpeedTiers,
    OFFICIAL_SpeedTiers,
    SpeedSets,
    OFFICIAL_SpeedSets,
    // Focus tiers
    BOOT_EFF_FOCUS_TIERS,
    BOOT_ER_FOCUS_TIERS,
    BOOT_CC_FOCUS_TIERS,
    BOOT_ATK_FOCUS_TIERS,
    HP_FOCUS_TIERS,
    FLAT_HP_FOCUS_TIERS,
    FLAT_ATK_FOCUS_TIERS,
    // Focus set arrays
    BOOT_EFF_SETS,
    BOOT_ER_SETS,
    BOOT_CC_SETS,
    BOOT_ATK_SETS,
    BOOT_HP_FOCUS_SETS,
    BOOT_EFF_FOCUS_ALL_SETS,
    BOOT_ER_FOCUS_ALL_SETS,
    BOOT_ATK_FOCUS_ALL_SETS,
    BOOT_HP_FOCUS_ALL_SETS,
    ARMOR_ER_SETS,
    EFF_FOCUS_WEAPON_HELM_ARMOR_SETS,
    ATK_FOCUS_HELM_WEAPON_SETS,
    ATK_FOCUS_NECK_RING_SETS,
    EFF_FOCUS_ATTACK_SETS,
    ER_FOCUS_ATTACK_SETS,
    HP_FOCUS_SETS,
} = require('./e7ArchetypeRules');

// ── Local constant aliases (mirrors Code.js) ─────────────────────────────────
const Custom_Item_Gs     = ITEM_SUBSTAT_STAT_WEIGHTS;
const SPEED_BOOTS_PENALTY = Custom_Item_Gs.SPEED_BOOTS_PENALTY != null
    ? Custom_Item_Gs.SPEED_BOOTS_PENALTY
    : (9 / 4) * 0.78695;

const RANK = ITEM_RANK;
const LEVELS = ITEM_LEVEL;
const LEVEL_90           = LEVELS.LEVEL_90           || { value: 90 };
const LEVEL_85           = LEVELS.LEVEL_85           || { value: 85 };
const LEVEL_88           = LEVELS.LEVEL_88           || { value: 88 };
const LEVEL_RANGE_72_84  = LEVELS.LEVEL_RANGE_72_84  || { min: 72, max: 84 };
const LEVEL_RANGE_1_71   = LEVELS.LEVEL_RANGE_1_71   || { min: 1, max: 71 };
const ENHANCE_LEVELS     = ITEM_ENHANCE_LEVELS;

// Fixed-main-stat gear slots (no variable main stat)
const FIXED_MAIN_SLOTS = (() => {
    try {
        return Object.keys(ITEM_MAIN)
            .filter(k => ITEM_MAIN[k] && ITEM_MAIN[k].is_fixed)
            .map(k => (GEAR_SLOT[k] || k));
    } catch (e) {
        return ['Weapon', 'Helmet', 'Armor'];
    }
})();

// ── Module-level caches (cleared by resetCaches) ─────────────────────────────
let _statWeightsCache          = null;
let _archetypeSubstatsCache    = null;
let _ruleValidationCache       = null;
let _archetypeSetMainCache     = null;
let _archetypeCombosPrebuilt   = false;
let _reforgeBonusCache         = null;
let _categorizedSubstatsCache  = null;

// ============================================================================
// ENHANCEMENT CONFIGURATION
// ============================================================================

/**
 * Gets enhancement configuration by rank with optional DPS Armor adjustments.
 * @param {string} rank - Gear rank ('Epic', 'Heroic', etc.)
 * @param {boolean} isDpsArmor - True for DPS Armor (only 3 scoreable substats)
 * @returns {Object} {rank, baseSubstats, maxRolls, unlockLevels, enhanceLevels}
 */
const getEnhancementConfig = (rank, isDpsArmor = false) => {
    const config = ITEM_ENHANCEMENT_CONFIG?.[rank.toUpperCase()]
                || ITEM_ENHANCEMENT_CONFIG?.EPIC
                || {};
    if (isDpsArmor && config.dpsArmor) {
        return {
            rank: config.rank,
            baseSubstats: config.dpsArmor.baseSubstats,
            maxRolls:     config.dpsArmor.maxRolls,
            unlockLevels: config.dpsArmor.unlockLevels,
            enhanceLevels: config.enhanceLevels,
        };
    }
    return config;
};

/**
 * Adjusts roll counts for DPS Armor and Heroic phantom substats.
 */
const getAdjustedRolls = (
    totalRolls,
    maxPossibleRolls,
    isDpsArmor = false,
    enhance = 0,
    addSubstatLevel = null,
    rank = 'Epic'
) => {
    let adjustedTotalRolls     = totalRolls;
    let adjustedMaxPossibleRolls = maxPossibleRolls;
    const ENHANCE_12 = ITEM_ENHANCE_LEVELS?.ENHANCE_12 ?? 12;
    const isHeroicWithPhantom =
        (rank === 'Heroic' || rank === ITEM_RANK?.HEROIC) && enhance < ENHANCE_12;

    if (isDpsArmor) {
        adjustedMaxPossibleRolls = maxPossibleRolls - 1;
        const has4Substats =
            addSubstatLevel == null || enhance >= addSubstatLevel;
        if (has4Substats) adjustedTotalRolls = totalRolls - 1;
    }
    if (isHeroicWithPhantom && !isDpsArmor) adjustedTotalRolls += 1;

    return { adjustedTotalRolls, adjustedMaxPossibleRolls };
};

// ============================================================================
// ARCHETYPE SOURCE / RULES HELPERS
// ============================================================================

/**
 * Determines whether an archetype name is Official or Personal and extracts base name.
 */
function getArchetypeSource(archetypeName) {
    if (archetypeName.startsWith('Off. '))
        return { type: 'official', baseName: archetypeName.substring(5) };
    if (archetypeName.startsWith('UOff. '))
        return { type: 'personal', baseName: archetypeName.substring(6) };
    return { type: 'personal', baseName: archetypeName };
}

/**
 * Returns the archetype rules object (official or personal) for the given archetype.
 */
function getArchetypeRules(archetypeName) {
    const { type } = getArchetypeSource(archetypeName);
    return type === 'official' ? OFFICIAL_ARCHETYPE_RULES : ARCHETYPE_RULES;
}

/**
 * Returns the scoring configs object (official or personal) for the given archetype.
 */
function getScoringConfig(archetypeName) {
    const { type } = getArchetypeSource(archetypeName);
    return type === 'official' ? OFFICIAL_SCORING_CONFIGS : SCORING_CONFIGS;
}

/**
 * Combines official (Off. prefix) and personal (UOff. prefix) slot rules.
 */
function getCombinedSlotRules(gearSlot) {
    const officialRules  = (OFFICIAL_ARCHETYPE_RULES[gearSlot] || [])
        .map(r => ({ ...r, archetype: 'Off. ' + r.archetype }));
    const personalRules  = (ARCHETYPE_RULES[gearSlot] || [])
        .map(r => ({ ...r, archetype: 'UOff. ' + r.archetype }));
    return [...officialRules, ...personalRules];
}

/**
 * Returns true if the archetype uses stat-potential scoring (not GS-based).
 */
function isPotentialBasedArchetype(archetypeName) {
    const POTENTIAL_BASED = [
        'Top Speed', 'Speed', 'Effectiveness Focus', 'Effect Resist Focus',
        'Crit Chance Focus', 'Attack Focus', 'HP Focus',
    ];
    const { baseName } = getArchetypeSource(archetypeName);
    return POTENTIAL_BASED.includes(baseName);
}

// ============================================================================
// GEAR LEVEL / REFORGE HELPERS
// ============================================================================

function isGearReforged(level) {
    return level === LEVEL_90.value;
}

function canGearReforge(level) {
    return level === LEVEL_85.value;
}

/**
 * Returns the projected reforged value for a stat (level 85 gear only).
 */
function calculateReforgedValue(statType, originalValue, rolls = 1) {
    if (!ITEM_REFORGE_TABLES || !ITEM_REFORGE_STAT_MAP) return originalValue;
    const tableKey = ITEM_REFORGE_STAT_MAP[statType];
    if (!tableKey) return originalValue;
    const bonusTable = ITEM_REFORGE_TABLES[tableKey];
    if (!bonusTable || !Array.isArray(bonusTable)) return originalValue;
    const idx = Math.max(0, Math.min(5, rolls - 1));
    return originalValue + (bonusTable[idx] ?? 0);
}

// ============================================================================
// STAT WEIGHT / GS CALCULATIONS
// ============================================================================

/**
 * Returns the GS weight for a given stat type and roll count.
 * Handles both scalar and array-indexed weights.
 */
function getStatWeight(statType, rolls = 1) {
    if (!_statWeightsCache) {
        _statWeightsCache = {};
        Object.keys(Custom_Item_Gs).forEach(key => {
            const val = Custom_Item_Gs[key];
            if (typeof val === 'number' || Array.isArray(val))
                _statWeightsCache[key] = val;
        });
    }
    const w = _statWeightsCache[statType];
    if (w == null) return 0;
    if (Array.isArray(w)) {
        const idx = Math.min(Math.max((rolls ?? 1) - 1, 0), 5);
        return w[idx] ?? 0;
    }
    return w;
}

/**
 * Calculates GS for a single stat value (applies speed-boots penalty if applicable).
 */
function calculateStatGS(statType, statValue, gearSlot, setName = null, rolls = 1) {
    if (typeof statValue !== 'number' || isNaN(statValue)) return 0;
    if (statType === 'Speed' && gearSlot === 'Boots') {
        const idx = Math.min(Math.max((rolls ?? 1) - 1, 0), 5);
        const penalty = Array.isArray(SPEED_BOOTS_PENALTY)
            ? (SPEED_BOOTS_PENALTY[idx] ?? 0)
            : SPEED_BOOTS_PENALTY;
        return statValue * penalty;
    }
    const multiplier = getStatWeight(statType, rolls);
    if (!multiplier || statValue <= 0) return 0;
    return statValue * multiplier;
}

/**
 * Returns the reforge bonus for a stat + roll count from ITEM_REFORGE_TABLES.
 */
function getReforgeBonus(statType, rolls) {
    if (typeof rolls !== 'number' || isNaN(rolls) || rolls < 1) return 0;
    if (!_reforgeBonusCache) _reforgeBonusCache = new Map();
    const cacheKey = `${statType}-${rolls}`;
    if (_reforgeBonusCache.has(cacheKey)) return _reforgeBonusCache.get(cacheKey);
    if (!ITEM_REFORGE_STAT_MAP || !ITEM_REFORGE_TABLES) {
        _reforgeBonusCache.set(cacheKey, 0);
        return 0;
    }
    const reforgeType = ITEM_REFORGE_STAT_MAP[statType];
    if (!reforgeType || !ITEM_REFORGE_TABLES[reforgeType]) {
        _reforgeBonusCache.set(cacheKey, 0);
        return 0;
    }
    const rollIndex = Math.min(Math.max(1, rolls), 6) - 1;
    const bonus = ITEM_REFORGE_TABLES[reforgeType][rollIndex] ?? 0;
    _reforgeBonusCache.set(cacheKey, bonus);
    return bonus;
}

/**
 * Calculates GS for a single substat object, incorporating reforge bonus if needed.
 */
function calculateSubstatGS(sub, reforgedStats, gearSlot, setName = null) {
    if (!sub || !sub.type) return 0;
    const statType  = sub.type;
    const statValue = reforgedStats?.[statType] ?? sub.value ?? 0;
    if (statValue <= 0) return 0;

    let totalValue = statValue;
    // If reforgedStats doesn't have this stat, project the reforged value
    if (!reforgedStats || typeof reforgedStats[statType] === 'undefined') {
        const rolls       = sub.rolls ?? 0;
        const reforgeBonus = getReforgeBonus(statType, rolls);
        totalValue = statValue + reforgeBonus;
    }
    return calculateStatGS(statType, totalValue, gearSlot, setName, sub.rolls ?? 1);
}

/**
 * Calculates total GS for an array of substats, rounding per stat category.
 * @returns {{ totalGS: number, totalRolls: number }}
 */
function calculateGearScore(substats, reforgedStats, gearSlot, setName = null) {
    if (!Array.isArray(substats)) return { totalGS: 0, totalRolls: 0 };

    let attackGS          = 0;
    let defenseHealthGS   = 0;
    let speedGS           = 0;
    let effectResistanceGS = 0;
    let effectivenessGS   = 0;
    let totalRolls        = 0;

    substats.forEach(sub => {
        if (!sub || !sub.type) return;
        if (sub.isPhantom || sub.type === 'Phantom') return;

        const statType = sub.originalType || sub.type;
        totalRolls += sub.rolls ?? 0;

        let contribution;
        if (sub.modified === true) {
            // Modified substat: value already includes reforge; use directly
            contribution = calculateStatGS(statType, sub.value ?? 0, gearSlot, setName, sub.rolls ?? 1);
        } else {
            contribution = calculateSubstatGS(sub, reforgedStats, gearSlot, setName);
        }

        switch (statType) {
            case 'AttackPercent':
            case 'CriticalHitDamagePercent':
            case 'CriticalHitChancePercent':
            case 'Attack':
                attackGS += contribution; break;
            case 'DefensePercent':
            case 'HealthPercent':
            case 'Defense':
            case 'Health':
                defenseHealthGS += contribution; break;
            case 'Speed':
                speedGS += contribution; break;
            case 'EffectResistancePercent':
                effectResistanceGS += contribution; break;
            case 'EffectivenessPercent':
                effectivenessGS += contribution; break;
            default: break;
        }
    });

    const totalGS =
        Math.round(parseFloat(attackGS.toFixed(3)))          +
        Math.round(parseFloat(defenseHealthGS.toFixed(3)))   +
        Math.round(parseFloat(speedGS.toFixed(3)))           +
        Math.round(parseFloat(effectResistanceGS.toFixed(3))) +
        Math.round(parseFloat(effectivenessGS.toFixed(3)));

    return { totalGS, totalRolls };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function validateGearItem(item) {
    return !!(item && typeof item === 'object');
}

function validateArray(arr) {
    return !!(arr && Array.isArray(arr) && arr.length > 0);
}

function validateArchetypeRule(rule) {
    if (!rule || typeof rule !== 'object') return false;
    if (!rule.Item_Substats || !Array.isArray(rule.Item_Substats)) return false;
    if (!rule.sets || !Array.isArray(rule.sets)) return false;
    return true;
}

function validateMainStat(gearSlot, mainStatType) {
    if (!gearSlot || !mainStatType) return false;
    if (!ITEM_MAIN) return true;
    const slotKey   = gearSlot.toUpperCase();
    const slotConfig = ITEM_MAIN[slotKey];
    if (!slotConfig || !slotConfig.main_stats) return true;
    return slotConfig.main_stats.includes(mainStatType);
}

// ── Cached wrappers ──────────────────────────────────────────────────────────

function getCachedRuleValidation(rule) {
    if (!_ruleValidationCache) _ruleValidationCache = new Map();
    const key = rule?.archetype || JSON.stringify(rule);
    if (_ruleValidationCache.has(key)) return _ruleValidationCache.get(key);
    const result = validateArchetypeRule(rule);
    _ruleValidationCache.set(key, result);
    return result;
}

/**
 * Returns the appropriate substat list for a rule/set/main combination.
 * Priority: setSpecificSubstats → mainSpecificSubstats → Item_Substats
 */
function getArchetypeSubstats(rule, setName, mainStatType) {
    if (!rule || typeof rule !== 'object') return [];
    if (rule.setSpecificSubstats) {
        const ss = rule.setSpecificSubstats[setName];
        if (ss && Array.isArray(ss)) return ss;
    }
    if (mainStatType && rule.mainSpecificSubstats) {
        const ms = rule.mainSpecificSubstats[mainStatType];
        if (ms && Array.isArray(ms)) return ms;
    }
    return Array.isArray(rule.Item_Substats) ? rule.Item_Substats : [];
}

function getCachedArchetypeSubstats(rule, setName, mainStatType) {
    if (!_archetypeSubstatsCache) _archetypeSubstatsCache = new Map();
    const key = `${rule?.archetype || ''}-${setName || 'none'}-${mainStatType || 'none'}`;
    if (_archetypeSubstatsCache.has(key)) return _archetypeSubstatsCache.get(key);
    const result = getArchetypeSubstats(rule, setName, mainStatType);
    _archetypeSubstatsCache.set(key, result);
    return result;
}

/**
 * Splits substats into matching / nonMatching arrays for a given archetype rule.
 */
function categorizeSubstats(substats, rule, setName = null, mainStatType = null) {
    if (!_categorizedSubstatsCache) _categorizedSubstatsCache = new Map();
    const substatKey = substats.map(s => s ? `${s.type}:${s.rolls}` : 'null').join('|');
    const cacheKey   = `${rule?.archetype || ''}-${setName || 'none'}-${mainStatType || 'none'}-${substatKey}`;
    if (_categorizedSubstatsCache.has(cacheKey)) return _categorizedSubstatsCache.get(cacheKey);

    const matching    = [];
    const nonMatching = [];

    if (!substats || !Array.isArray(substats) || !getCachedRuleValidation(rule)) {
        return { matching, nonMatching };
    }

    const wantedSubstats = getCachedArchetypeSubstats(rule, setName, mainStatType);
    substats.forEach(sub => {
        if (sub && sub.type && !sub.isPhantom && sub.type !== 'Phantom') {
            if (wantedSubstats.includes(sub.type)) {
                matching.push({ ...sub, originalType: sub.type });
            } else {
                nonMatching.push({ ...sub, originalType: sub.type });
            }
        }
    });

    const result = { matching, nonMatching };
    _categorizedSubstatsCache.set(cacheKey, result);
    return result;
}

// ============================================================================
// ARCHETYPE APPLICABILITY CACHE
// ============================================================================

/**
 * Builds a Set of cache keys for valid archetype+slot+set+mainStat combinations.
 * Key format:
 *   Fixed slots:    `${archetype}-${slot}-${setName}-FIXED`
 *   Variable slots: `${archetype}-${slot}-${setName}-${mainStat}`
 */
function buildArchetypeCombinationsCache() {
    const cache = new Set();

    const addRules = (rulesObj, prefix) => {
        Object.entries(rulesObj).forEach(([slot, rules]) => {
            if (!Array.isArray(rules)) return;
            const isFixed = FIXED_MAIN_SLOTS.includes(slot);
            rules.forEach(rule => {
                if (!validateArchetypeRule(rule)) return;
                const archDisplay = prefix + rule.archetype;
                (rule.sets || []).forEach(setDisplay => {
                    // sets stored without 'Set' suffix; convert to Fribbels format
                    const setKey = setDisplay.endsWith('Set') ? setDisplay : setDisplay + 'Set';
                    if (isFixed) {
                        cache.add(`${archDisplay}-${slot}-${setKey}-FIXED`);
                    } else {
                        (rule.Item_Main || []).forEach(mainStat => {
                            cache.add(`${archDisplay}-${slot}-${setKey}-${mainStat}`);
                        });
                    }
                });
            });
        });
    };

    addRules(OFFICIAL_ARCHETYPE_RULES, 'Off. ');
    addRules(ARCHETYPE_RULES,          'UOff. ');

    return cache;
}

/**
 * Returns true if the archetype applies to the given item's slot/set/main combination.
 */
function isArchetypeApplicable(archetype, gearSlot, setName, mainStatType) {
    if (!_archetypeCombosPrebuilt) {
        _archetypeSetMainCache   = buildArchetypeCombinationsCache();
        _archetypeCombosPrebuilt = true;
    }
    const isFixedSlot = FIXED_MAIN_SLOTS.includes(gearSlot);
    const cacheKey    = isFixedSlot
        ? `${archetype}-${gearSlot}-${setName}-FIXED`
        : `${archetype}-${gearSlot}-${setName}-${mainStatType}`;
    return _archetypeSetMainCache.has(cacheKey);
}

/**
 * Finds all archetype rules applicable to the given item.
 * Checks: 1) rule validity, 2) set match, 3) main stat match (non-fixed slots),
 *         4) optional requiredSubstats.
 *
 * @param {Object} customMapping - Display name mappings (pass {} if none)
 */
function findApplicableArchetypes(
    slotRules,
    substats,
    cleanSetName,
    mainStatType,
    isFixedSlot,
    customMapping = {},
    gearSlot      = null
) {
    if (!validateArray(slotRules) || !Array.isArray(substats) || !cleanSetName) return [];

    // Normalize set name — rules store names without 'Set' suffix
    const normalizedSetName = cleanSetName.endsWith('Set')
        ? cleanSetName.slice(0, -3)
        : cleanSetName;

    const applicable = [];

    slotRules.forEach(rule => {
        if (!getCachedRuleValidation(rule)) return;
        if (!rule.sets.includes(normalizedSetName)) return;

        if (!isFixedSlot) {
            if (!Array.isArray(rule.Item_Main) || !rule.Item_Main.includes(mainStatType)) return;
        }

        // Check required substats
        if (rule.requiredSubstats && rule.requiredSubstats.length > 0) {
            if (rule.requiredSubstats.length > 1 && rule.requiredSubstats.includes(mainStatType)) {
                const others = rule.requiredSubstats.filter(s => s !== mainStatType);
                const ok     = others.some(rs => substats.some(sub => sub && sub.type === rs));
                if (!ok) return;
            } else {
                const ok = rule.requiredSubstats.some(rs => substats.some(sub => sub && sub.type === rs));
                if (!ok) return;
            }
        }

        applicable.push(rule);
    });

    return applicable;
}

// ============================================================================
// ARCHETYPE SCORE CALCULATION
// ============================================================================

/**
 * Calculates the tier-based archetype score for a gear piece.
 * Returns 0 if the item does not qualify for any tier.
 *
 * @param {Object} params
 * @param {string} params.archetype          - Full archetype name (e.g., 'Off. DPS')
 * @param {string} params.gearSlot           - Gear slot (e.g., 'Ring')
 * @param {string} params.rank               - Gear rank ('Epic' | 'Heroic')
 * @param {number} params.enhance            - Current enhancement level (0-15)
 * @param {number} params.matchingSubstatRolls - Total rolls among matching substats
 * @param {number} params.actualScore        - Matching GS value
 * @param {string} params.setName            - Set name (e.g., 'SpeedSet')
 * @param {string} params.mainStat           - Main stat type
 * @param {number} params.matchingSubstatCount - Number of matching substats
 * @param {number} params.totalRolls         - Total rolls on the piece
 */
function calculateCustomArchetypeScore(params) {
    const {
        archetype,
        gearSlot,
        rank,
        enhance,
        matchingSubstatRolls,
        actualScore,
        setName,
        mainStat,
        matchingSubstatCount,
        totalRolls,
    } = params;

    if (rank !== 'Epic' && rank !== 'Heroic') return 0;

    const archetypeSource  = getArchetypeSource(archetype);
    const baseArchetypeName = archetypeSource.baseName;
    if (baseArchetypeName === 'Speed') return 0; // Speed uses a different scorer

    const rulesSource   = getArchetypeRules(archetype);
    const archetypeRule = (rulesSource[gearSlot] || []).find(r => r.archetype === baseArchetypeName);
    if (!archetypeRule) return 0;

    const isDpsArmor = (
        (baseArchetypeName === 'DPS' && gearSlot === 'Armor') ||
        (baseArchetypeName === 'DPS (No CC%)' && ['Weapon', 'Armor', 'Necklace', 'Ring'].includes(gearSlot))
    );

    const rawConfig         = getEnhancementConfig(rank, false);
    const rollLevels        = ITEM_ENHANCE_LEVELS_SUBSTATS_ENHANCED[rank.toUpperCase()] ?? [];
    const unlockLevels      = rawConfig.unlockLevels ?? [];
    const addSubstatLevel   = unlockLevels.length > 0 ? unlockLevels[0] : null;
    const maxPossibleRolls  = rawConfig.maxRolls;

    const { adjustedTotalRolls, adjustedMaxPossibleRolls } = getAdjustedRolls(
        totalRolls,
        maxPossibleRolls,
        isDpsArmor,
        enhance,
        addSubstatLevel,
        rank
    );

    const scoringConfigsSource = getScoringConfig(archetype);
    const slotConfig           = scoringConfigsSource[gearSlot];
    if (!slotConfig) return 0;
    const archetypeConfig = slotConfig[baseArchetypeName];
    if (!archetypeConfig) return 0;

    for (const tier of archetypeConfig) {
        const minScore = Math.round(
            parseFloat(((tier.min / adjustedMaxPossibleRolls) * adjustedTotalRolls).toFixed(3))
        );
        const maxScore = tier.max != null
            ? Math.round(parseFloat(((tier.max / adjustedMaxPossibleRolls) * adjustedTotalRolls).toFixed(3)))
            : Infinity;

        if (actualScore >= minScore && actualScore < maxScore) {
            if (tier.formula === 'type1') {
                const baseScore = Math.round(
                    parseFloat(((tier.base / adjustedMaxPossibleRolls) * adjustedTotalRolls).toFixed(3))
                );
                return Math.round((tier.multiplier ?? (4 / 3)) * (actualScore - baseScore));
            }
            if (tier.formula === 'type2') {
                const offsetScaled = Math.round(
                    parseFloat(((tier.offset / adjustedMaxPossibleRolls) * adjustedTotalRolls).toFixed(3))
                );
                return Math.round(tier.multiplier * actualScore - offsetScaled);
            }
            if (tier.formula === 'custom') {
                return Math.round(actualScore);
            }
            return 0;
        }
    }
    return 0;
}

// ============================================================================
// POTENTIAL-BASED ARCHETYPE SCORING
// ============================================================================

/**
 * Calculate remaining rolls available for a gear item.
 * Enhancement rolls can go to existing substats; unlock rolls must go to new substats.
 */
function calculateRemainingRolls(rank, enhance, totalRolls, currentSubstats = 4) {
    const rankKey = (rank || 'Epic').toUpperCase();
    const maxRolls = ITEM_MAX_ENHANCE_TOTAL_ROLLS[rankKey] || 9;
    const unlockLevels  = ITEM_ENHANCE_LEVELS_SUBSTATS_UNLOCKED[rankKey]  || [];
    const enhanceLevels = ITEM_ENHANCE_LEVELS_SUBSTATS_ENHANCED[rankKey] || [];

    const remainingUnlockRolls      = unlockLevels.filter(l => l > enhance).length;
    const remainingEnhancementRolls = enhanceLevels.filter(l => l > enhance).length;
    const remainingTotalRolls = Math.max(0, Math.min(
        remainingUnlockRolls + remainingEnhancementRolls,
        maxRolls - totalRolls
    ));

    return { maxRolls, currentRolls: totalRolls, remainingEnhancementRolls, remainingUnlockRolls, remainingTotalRolls };
}

/** Apply a single tier formula (type1 or type2) to a value. */
function applyTierFormula(tier, value) {
    if (tier.formula === 'type2') {
        const multiplier = tier.multiplier ?? tier.Multiplier ?? 1;
        const offset     = tier.offset    ?? tier.Offset    ?? 0;
        return multiplier * value - offset;
    }
    // type1 (default)
    const multiplier = tier.multiplier ?? tier.Multiplier ?? 1;
    const base       = tier.base       ?? tier.Base       ?? 0;
    return multiplier * (value - base);
}

/** Check tiers from highest (Tier4) to lowest (Tier0); return score or 0. */
function applyTieredScoring(value, tiers) {
    if (!tiers) return 0;
    for (const key of ['Tier4', 'Tier3', 'Tier2', 'Tier1', 'Tier0']) {
        const t = tiers[key];
        if (!t) continue;
        const max = (t.Max !== undefined && t.Max !== null) ? t.Max : Infinity;
        if (value >= t.Min && value <= max) return applyTierFormula(t, value);
    }
    return 0;
}

// ── Speed potential helpers ──────────────────────────────────────────────────

function calculateSpeedPotential(substats, rank, level, enhance) {
    const speedSub = substats.find(s => s.type === 'Speed');
    const currentSpeed = speedSub?.value || 0;
    if (currentSpeed === 0) return { currentSpeed: 0, maxPotentialSpeed: 0, hasSpeed: false };

    const validSubs = substats.filter(s => s.type && s.type !== '' && s.type !== 'Select Stat');
    const totalRolls = validSubs.reduce((sum, s) => sum + (s.rolls || 0), 0);

    const rollInfo = calculateRemainingRolls(rank, enhance, totalRolls, validSubs.length);
    const maxPotentialFromRolls = rollInfo.remainingEnhancementRolls * 4;

    const maxPossibleSpeedRolls = speedSub.rolls + rollInfo.remainingEnhancementRolls;
    const reforgeBonus = level === 85 ? getReforgeBonus('Speed', maxPossibleSpeedRolls) : 0;
    const maxPotentialSpeed = currentSpeed + maxPotentialFromRolls + reforgeBonus;

    return { currentSpeed, maxPotentialSpeed, hasSpeed: true };
}

// ── Top Speed scoring ────────────────────────────────────────────────────────

function calculateTopSpeedScore(substats, reforgedStats, rank, level, enhance = 0, cachedSpeedPotential = null, sourceType = 'personal') {
    const speedData = cachedSpeedPotential || calculateSpeedPotential(substats, rank, level, enhance);
    if (!speedData.hasSpeed) return 0;
    const tiers = sourceType === 'official' ? OFFICIAL_TopSpeedTiers : TopSpeedTiers;
    if (!tiers) return 0;
    return Math.max(0, applyTieredScoring(speedData.maxPotentialSpeed, tiers));
}

// ── Speed (non-Top) scoring ──────────────────────────────────────────────────

function calculateSpeedScore(substats, reforgedStats, rank, level, enhance, setName, matchingGS, totalRolls, cachedSpeedPotential = null, sourceType = 'personal') {
    const speedData = cachedSpeedPotential || calculateSpeedPotential(substats, rank, level, enhance);
    if (!speedData.hasSpeed || speedData.maxPotentialSpeed < 18) return 0;

    const MAX_EPIC_ROLLS    = 9;
    const MAX_HEROIC_ROLLS  = 8;
    const equipmentRank = rank === 'Heroic' ? MAX_HEROIC_ROLLS : MAX_EPIC_ROLLS;

    const { adjustedTotalRolls } = getAdjustedRolls(totalRolls, equipmentRank, false, enhance, 12, rank);

    const displaySetName = setName?.endsWith('Set') ? setName.slice(0, -3) : setName;
    const tiers = sourceType === 'official' ? OFFICIAL_SpeedTiers : SpeedTiers;
    const sets  = sourceType === 'official' ? OFFICIAL_SpeedSets  : SpeedSets;
    if (!tiers || !sets) return 0;

    const scaleTier = (tier) => {
        const scaled = {
            Min: (tier.Min / equipmentRank) * adjustedTotalRolls,
            Max: tier.Max !== undefined ? (tier.Max / equipmentRank) * adjustedTotalRolls : Infinity,
            formula:    tier.formula,
            multiplier: tier.multiplier ?? tier.Multiplier ?? 1,
        };
        if (tier.formula === 'type1') {
            scaled.base = ((tier.base ?? tier.Base ?? 0) / equipmentRank) * adjustedTotalRolls;
        } else if (tier.formula === 'type2') {
            scaled.offset = ((tier.offset ?? tier.Offset ?? 0) / equipmentRank) * adjustedTotalRolls;
        }
        return scaled;
    };

    let score = 0;
    if (displaySetName === sets.SpeedSet && tiers.SpeedSet) {
        const scaledTiers = { Tier3: scaleTier(tiers.SpeedSet.Tier3), Tier2: scaleTier(tiers.SpeedSet.Tier2), Tier1: scaleTier(tiers.SpeedSet.Tier1) };
        score = applyTieredScoring(matchingGS, scaledTiers);
    } else if (sets.OtherSets?.includes(displaySetName) && tiers.OtherSets) {
        const scaledTiers = { Tier2: scaleTier(tiers.OtherSets.Tier2), Tier1: scaleTier(tiers.OtherSets.Tier1) };
        score = applyTieredScoring(matchingGS, scaledTiers);
    }
    return Math.round(score);
}

function calculateSpeedScoreFromGS(matchingGS, setName, sourceType = 'personal', totalRolls = 9, rank = 'Epic', enhance = 15) {
    const MAX_EPIC_ROLLS   = 9;
    const MAX_HEROIC_ROLLS = 8;
    const equipmentRank = rank === 'Heroic' ? MAX_HEROIC_ROLLS : MAX_EPIC_ROLLS;

    const { adjustedTotalRolls } = getAdjustedRolls(totalRolls, equipmentRank, false, enhance, 12, rank);

    const displaySetName = setName?.endsWith('Set') ? setName.slice(0, -3) : setName;
    const tiers = sourceType === 'official' ? OFFICIAL_SpeedTiers : SpeedTiers;
    const sets  = sourceType === 'official' ? OFFICIAL_SpeedSets  : SpeedSets;
    if (!tiers || !sets) return 0;

    const scaleTier = (tier) => {
        const scaled = {
            Min: (tier.Min / equipmentRank) * adjustedTotalRolls,
            Max: tier.Max !== undefined ? (tier.Max / equipmentRank) * adjustedTotalRolls : Infinity,
            formula:    tier.formula,
            multiplier: tier.multiplier ?? tier.Multiplier ?? 1,
        };
        if (tier.formula === 'type1') {
            scaled.base = ((tier.base ?? tier.Base ?? 0) / equipmentRank) * adjustedTotalRolls;
        } else if (tier.formula === 'type2') {
            scaled.offset = ((tier.offset ?? tier.Offset ?? 0) / equipmentRank) * adjustedTotalRolls;
        }
        return scaled;
    };

    let score = 0;
    if (displaySetName === sets.SpeedSet && tiers.SpeedSet) {
        const scaledTiers = { Tier3: scaleTier(tiers.SpeedSet.Tier3), Tier2: scaleTier(tiers.SpeedSet.Tier2), Tier1: scaleTier(tiers.SpeedSet.Tier1) };
        score = applyTieredScoring(matchingGS, scaledTiers);
    } else if (sets.OtherSets?.includes(displaySetName) && tiers.OtherSets) {
        const scaledTiers = { Tier2: scaleTier(tiers.OtherSets.Tier2), Tier1: scaleTier(tiers.OtherSets.Tier1) };
        score = applyTieredScoring(matchingGS, scaledTiers);
    }
    return Math.round(parseFloat(score.toFixed(3)));
}

// ── Effectiveness Focus ──────────────────────────────────────────────────────

function _calcEffPotential(substats, rank, level, enhance, gearSlot, mainStat, setName) {
    const validSlots = ['Armor', 'Necklace', 'Ring', 'Boots'];
    if (!validSlots.includes(gearSlot)) return { currentEff: 0, maxPotentialEff: 0, hasEff: false };

    const validMainStats = ['Speed', 'AttackPercent', 'EffectivenessPercent'];
    if (!validMainStats.includes(mainStat)) return { currentEff: 0, maxPotentialEff: 0, hasEff: false };

    const displaySetName = setName?.endsWith('Set') ? setName.slice(0, -3) : setName;
    let validSets;
    if (mainStat === 'Speed') {
        validSets = BOOT_EFF_SETS?.length ? BOOT_EFF_SETS : ['Speed', 'Hit', 'Immunity', 'Torrent', 'Pursuit'];
    } else {
        validSets = EFF_FOCUS_ATTACK_SETS?.length ? EFF_FOCUS_ATTACK_SETS : ['Torrent', 'Attack', 'Hit', 'Immunity', 'Pursuit'];
    }
    if (!validSets.includes(displaySetName)) return { currentEff: 0, maxPotentialEff: 0, hasEff: false };

    // Ring + Eff% main → check Atk% potential
    if (gearSlot === 'Ring' && mainStat === 'EffectivenessPercent') {
        const atkSub = substats.find(s => s.type === 'AttackPercent');
        if (!atkSub?.value) return { currentEff: 0, maxPotentialEff: 0, hasEff: false };
        const validSubs = substats.filter(s => s.type && s.type !== '' && s.type !== 'Select Stat');
        const totalRolls = validSubs.reduce((sum, s) => sum + (s.rolls || 0), 0);
        const rollInfo = calculateRemainingRolls(rank, enhance, totalRolls, validSubs.length);
        const maxPossibleRolls = atkSub.rolls + rollInfo.remainingEnhancementRolls;
        const reforgeBonus = level === 85 ? getReforgeBonus('AttackPercent', maxPossibleRolls) : 0;
        const maxPotentialEff = atkSub.value + rollInfo.remainingEnhancementRolls * 8 + reforgeBonus;
        return { currentEff: maxPotentialEff, maxPotentialEff, hasEff: true };
    }

    const effSub = substats.find(s => s.type === 'EffectivenessPercent');
    if (!effSub?.value) return { currentEff: 0, maxPotentialEff: 0, hasEff: false };
    const validSubs = substats.filter(s => s.type && s.type !== '' && s.type !== 'Select Stat');
    const totalRolls = validSubs.reduce((sum, s) => sum + (s.rolls || 0), 0);
    const rollInfo = calculateRemainingRolls(rank, enhance, totalRolls, validSubs.length);
    const maxPossibleRolls = effSub.rolls + rollInfo.remainingEnhancementRolls;
    const reforgeBonus = level === 85 ? getReforgeBonus('EffectivenessPercent', maxPossibleRolls) : 0;
    const maxPotentialEff = effSub.value + rollInfo.remainingEnhancementRolls * 8 + reforgeBonus;
    return { currentEff: effSub.value, maxPotentialEff, hasEff: true };
}

function _calcFixedSlotEffPotential(substats, rank, level, enhance, gearSlot, setName) {
    const validSlots = ['Weapon', 'Helmet', 'Armor'];
    if (!validSlots.includes(gearSlot)) return { currentEff: 0, maxPotentialEff: 0, hasEff: false };
    const displaySetName = setName?.endsWith('Set') ? setName.slice(0, -3) : setName;
    const validSets = EFF_FOCUS_WEAPON_HELM_ARMOR_SETS?.length ? EFF_FOCUS_WEAPON_HELM_ARMOR_SETS : ['Torrent', 'Attack', 'Hit', 'Immunity', 'Pursuit'];
    if (!validSets.includes(displaySetName)) return { currentEff: 0, maxPotentialEff: 0, hasEff: false };
    const effSub = substats.find(s => s.type === 'EffectivenessPercent');
    if (!effSub?.value) return { currentEff: 0, maxPotentialEff: 0, hasEff: false };
    const validSubs = substats.filter(s => s.type && s.type !== '' && s.type !== 'Select Stat');
    const totalRolls = validSubs.reduce((sum, s) => sum + (s.rolls || 0), 0);
    const rollInfo = calculateRemainingRolls(rank, enhance, totalRolls, validSubs.length);
    const maxPossibleRolls = effSub.rolls + rollInfo.remainingEnhancementRolls;
    const reforgeBonus = level === 85 ? getReforgeBonus('EffectivenessPercent', maxPossibleRolls) : 0;
    const maxPotentialEff = effSub.value + rollInfo.remainingEnhancementRolls * 8 + reforgeBonus;
    return { currentEff: effSub.value, maxPotentialEff, hasEff: true };
}

function calculateEffectivenessFocusScore(substats, reforgedStats, rank, level, enhance = 0, gearSlot, mainStat, setName) {
    const effData = _calcEffPotential(substats, rank, level, enhance, gearSlot, mainStat, setName);
    if (!effData.hasEff) return 0;
    const tiers = BOOT_EFF_FOCUS_TIERS;
    if (!tiers) return 0;
    return Math.max(0, applyTieredScoring(effData.maxPotentialEff, tiers));
}

function calculateFixedSlotEffectivenessFocusScore(substats, reforgedStats, rank, level, enhance = 0, gearSlot, setName) {
    const effData = _calcFixedSlotEffPotential(substats, rank, level, enhance, gearSlot, setName);
    if (!effData.hasEff) return 0;
    const tiers = BOOT_EFF_FOCUS_TIERS;
    if (!tiers) return 0;
    return Math.max(0, applyTieredScoring(effData.maxPotentialEff, tiers));
}

// ── Effect Resist Focus ──────────────────────────────────────────────────────

function _calcERPotential(substats, rank, level, enhance, gearSlot, mainStat, setName) {
    const validSlots = ['Armor', 'Necklace', 'Ring', 'Boots'];
    if (!validSlots.includes(gearSlot)) return { currentER: 0, maxPotentialER: 0, hasER: false };
    const validMainStats = ['Speed', 'AttackPercent', 'EffectResistancePercent'];
    if (!validMainStats.includes(mainStat)) return { currentER: 0, maxPotentialER: 0, hasER: false };
    const displaySetName = setName?.endsWith('Set') ? setName.slice(0, -3) : setName;
    let validSets;
    if (mainStat === 'Speed') {
        validSets = BOOT_ER_SETS?.length ? BOOT_ER_SETS : ['Speed', 'Resist', 'Immunity', 'Defense', 'Health'];
    } else {
        validSets = ER_FOCUS_ATTACK_SETS?.length ? ER_FOCUS_ATTACK_SETS : ['Counter', 'Resist', 'Immunity', 'Penetration', 'Pursuit', 'Torrent'];
    }
    if (!validSets.includes(displaySetName)) return { currentER: 0, maxPotentialER: 0, hasER: false };

    // Ring + ER% main → check Atk% potential
    if (gearSlot === 'Ring' && mainStat === 'EffectResistancePercent') {
        const atkSub = substats.find(s => s.type === 'AttackPercent');
        if (!atkSub?.value) return { currentER: 0, maxPotentialER: 0, hasER: false };
        const validSubs = substats.filter(s => s.type && s.type !== '' && s.type !== 'Select Stat');
        const totalRolls = validSubs.reduce((sum, s) => sum + (s.rolls || 0), 0);
        const rollInfo = calculateRemainingRolls(rank, enhance, totalRolls, validSubs.length);
        const maxPossibleRolls = atkSub.rolls + rollInfo.remainingEnhancementRolls;
        const reforgeBonus = level === 85 ? getReforgeBonus('AttackPercent', maxPossibleRolls) : 0;
        const maxPotentialER = atkSub.value + rollInfo.remainingEnhancementRolls * 8 + reforgeBonus;
        return { currentER: maxPotentialER, maxPotentialER, hasER: true };
    }

    const erSub = substats.find(s => s.type === 'EffectResistancePercent');
    if (!erSub?.value) return { currentER: 0, maxPotentialER: 0, hasER: false };
    const validSubs = substats.filter(s => s.type && s.type !== '' && s.type !== 'Select Stat');
    const totalRolls = validSubs.reduce((sum, s) => sum + (s.rolls || 0), 0);
    const rollInfo = calculateRemainingRolls(rank, enhance, totalRolls, validSubs.length);
    const maxPossibleRolls = erSub.rolls + rollInfo.remainingEnhancementRolls;
    const reforgeBonus = level === 85 ? getReforgeBonus('EffectResistancePercent', maxPossibleRolls) : 0;
    const maxPotentialER = erSub.value + rollInfo.remainingEnhancementRolls * 8 + reforgeBonus;
    return { currentER: erSub.value, maxPotentialER, hasER: true };
}

function _calcArmorERPotential(substats, rank, level, enhance, gearSlot, setName) {
    if (gearSlot !== 'Armor') return { currentER: 0, maxPotentialER: 0, hasER: false };
    const displaySetName = setName?.endsWith('Set') ? setName.slice(0, -3) : setName;
    const validSets = ARMOR_ER_SETS?.length ? ARMOR_ER_SETS : ['Counter', 'Resist', 'Immunity', 'Penetration', 'Pursuit', 'Torrent'];
    if (!validSets.includes(displaySetName)) return { currentER: 0, maxPotentialER: 0, hasER: false };
    const erSub = substats.find(s => s.type === 'EffectResistancePercent');
    if (!erSub?.value) return { currentER: 0, maxPotentialER: 0, hasER: false };
    const validSubs = substats.filter(s => s.type && s.type !== '' && s.type !== 'Select Stat');
    const totalRolls = validSubs.reduce((sum, s) => sum + (s.rolls || 0), 0);
    const rollInfo = calculateRemainingRolls(rank, enhance, totalRolls, validSubs.length);
    const maxPossibleRolls = erSub.rolls + rollInfo.remainingEnhancementRolls;
    const reforgeBonus = level === 85 ? getReforgeBonus('EffectResistancePercent', maxPossibleRolls) : 0;
    const maxPotentialER = erSub.value + rollInfo.remainingEnhancementRolls * 8 + reforgeBonus;
    return { currentER: erSub.value, maxPotentialER, hasER: true };
}

function calculateEffectResistFocusScore(substats, reforgedStats, rank, level, enhance = 0, gearSlot, mainStat, setName) {
    const erData = _calcERPotential(substats, rank, level, enhance, gearSlot, mainStat, setName);
    if (!erData.hasER) return 0;
    const tiers = BOOT_ER_FOCUS_TIERS;
    if (!tiers) return 0;
    return Math.max(0, applyTieredScoring(erData.maxPotentialER, tiers));
}

function calculateArmorEffectResistFocusScore(substats, reforgedStats, rank, level, enhance = 0, gearSlot, setName) {
    const erData = _calcArmorERPotential(substats, rank, level, enhance, gearSlot, setName);
    if (!erData.hasER) return 0;
    const tiers = BOOT_ER_FOCUS_TIERS;
    if (!tiers) return 0;
    return Math.max(0, applyTieredScoring(erData.maxPotentialER, tiers));
}

// ── Crit Chance Focus ────────────────────────────────────────────────────────

function calculateCritChanceFocusScore(substats, reforgedStats, rank, level, enhance = 0, gearSlot, mainStat, setName) {
    if (gearSlot !== 'Boots' || mainStat !== 'Speed') return 0;
    const displaySetName = setName?.endsWith('Set') ? setName.slice(0, -3) : setName;
    const validSets = BOOT_CC_SETS?.length ? BOOT_CC_SETS : ['Speed', 'Critical', 'Immunity', 'Torrent', 'Penetration'];
    if (!validSets.includes(displaySetName)) return 0;
    const ccSub = substats.find(s => s.type === 'CriticalHitChancePercent');
    if (!ccSub?.value) return 0;
    const validSubs = substats.filter(s => s.type && s.type !== '' && s.type !== 'Select Stat');
    const totalRolls = validSubs.reduce((sum, s) => sum + (s.rolls || 0), 0);
    const rollInfo = calculateRemainingRolls(rank, enhance, totalRolls, validSubs.length);
    const maxPossibleRolls = ccSub.rolls + rollInfo.remainingEnhancementRolls;
    const reforgeBonus = level === 85 ? getReforgeBonus('CriticalHitChancePercent', maxPossibleRolls) : 0;
    const maxPotentialCC = ccSub.value + rollInfo.remainingEnhancementRolls * 5 + reforgeBonus;
    const tiers = BOOT_CC_FOCUS_TIERS;
    if (!tiers) return 0;
    return Math.max(0, applyTieredScoring(maxPotentialCC, tiers));
}

// ── Attack Focus ─────────────────────────────────────────────────────────────

function calculateAttackFocusScore(substats, reforgedStats, rank, level, enhance = 0, gearSlot, mainStat, setName) {
    const displaySetName = setName?.endsWith('Set') ? setName.slice(0, -3) : setName;

    // Path 1 & 2: Atk% potential (Boots+Speed main, or Helmet/Weapon)
    if ((gearSlot === 'Boots' && mainStat === 'Speed') || gearSlot === 'Helmet' || gearSlot === 'Weapon') {
        let validSets;
        if (gearSlot === 'Boots' && mainStat === 'Speed') {
            validSets = BOOT_ATK_SETS?.length ? BOOT_ATK_SETS : ['Pursuit', 'Speed', 'Immunity', 'Torrent', 'Attack'];
        } else {
            validSets = ATK_FOCUS_HELM_WEAPON_SETS?.length ? ATK_FOCUS_HELM_WEAPON_SETS : ['Pursuit', 'Immunity', 'Torrent', 'Attack', 'Hit', 'Penetration', 'Counter', 'Resist'];
        }
        if (!validSets.includes(displaySetName)) return 0;
        const atkSub = substats.find(s => s.type === 'AttackPercent');
        if (!atkSub?.value) return 0;
        const validSubs = substats.filter(s => s.type && s.type !== '' && s.type !== 'Select Stat');
        const totalRolls = validSubs.reduce((sum, s) => sum + (s.rolls || 0), 0);
        const rollInfo = calculateRemainingRolls(rank, enhance, totalRolls, validSubs.length);
        const maxPossibleRolls = atkSub.rolls + rollInfo.remainingEnhancementRolls;
        const reforgeBonus = level === 85 ? getReforgeBonus('AttackPercent', maxPossibleRolls) : 0;
        const maxPotentialAtk = atkSub.value + rollInfo.remainingEnhancementRolls * 8 + reforgeBonus;
        const tiers = BOOT_ATK_FOCUS_TIERS;
        if (!tiers) return 0;
        return Math.max(0, applyTieredScoring(maxPotentialAtk, tiers));
    }

    // Path 3: Flat Atk potential (Necklace/Ring/Boots with Atk% main)
    if ((gearSlot === 'Necklace' || gearSlot === 'Ring' || gearSlot === 'Boots') && mainStat === 'AttackPercent') {
        const validSets = ATK_FOCUS_NECK_RING_SETS?.length ? ATK_FOCUS_NECK_RING_SETS : ['Pursuit', 'Immunity', 'Torrent', 'Attack', 'Hit', 'Penetration', 'Counter', 'Resist'];
        if (!validSets.includes(displaySetName)) return 0;
        const flatAtkSub = substats.find(s => s.type === 'Attack');
        if (!flatAtkSub?.value) return 0;
        const validSubs = substats.filter(s => s.type && s.type !== '' && s.type !== 'Select Stat');
        const totalRolls = validSubs.reduce((sum, s) => sum + (s.rolls || 0), 0);
        const rollInfo = calculateRemainingRolls(rank, enhance, totalRolls, validSubs.length);
        const maxPossibleRolls = flatAtkSub.rolls + rollInfo.remainingEnhancementRolls;
        const reforgeBonus = level === 85 ? getReforgeBonus('Attack', maxPossibleRolls) : 0;
        const maxPotentialFlatAtk = flatAtkSub.value + rollInfo.remainingEnhancementRolls * 46 + reforgeBonus;
        const tiers = FLAT_ATK_FOCUS_TIERS;
        if (!tiers) return 0;
        return Math.max(0, applyTieredScoring(maxPotentialFlatAtk, tiers));
    }

    return 0;
}

// ── HP Focus ─────────────────────────────────────────────────────────────────

function calculateHPFocusScore(substats, reforgedStats, rank, level, enhance = 0, gearSlot, mainStat, setName) {
    const displaySetName = setName?.endsWith('Set') ? setName.slice(0, -3) : setName;

    const _scoreHP = (sub, maxRollPerEnhance, reforgeStat, tierConfig) => {
        if (!sub?.value) return 0;
        const validSubs = substats.filter(s => s.type && s.type !== '' && s.type !== 'Select Stat');
        const totalRolls = validSubs.reduce((sum, s) => sum + (s.rolls || 0), 0);
        const rollInfo = calculateRemainingRolls(rank, enhance, totalRolls, validSubs.length);
        const maxPossibleRolls = sub.rolls + rollInfo.remainingEnhancementRolls;
        const reforgeBonus = level === 85 ? getReforgeBonus(reforgeStat, maxPossibleRolls) : 0;
        const maxPotential = sub.value + rollInfo.remainingEnhancementRolls * maxRollPerEnhance + reforgeBonus;
        if (!tierConfig) return 0;
        return Math.max(0, applyTieredScoring(maxPotential, tierConfig));
    };

    // HP% path: Weapon, Helmet, Armor, Boots(Speed main)
    if (['Weapon', 'Helmet', 'Armor'].includes(gearSlot) ||
        (gearSlot === 'Boots' && mainStat === 'Speed')) {
        const validSets = BOOT_HP_FOCUS_ALL_SETS?.length
            ? BOOT_HP_FOCUS_ALL_SETS
            : ['Protection', 'Health', 'Counter', 'Immunity', 'Speed', 'Pursuit', 'Defense', 'Resist'];
        if (!validSets.includes(displaySetName)) return 0;
        const hpSub = substats.find(s => s.type === 'HealthPercent');
        return _scoreHP(hpSub, 8, 'HealthPercent', HP_FOCUS_TIERS);
    }

    // Flat HP path: Necklace, Ring, Boots(HP% main)
    if (['Necklace', 'Ring'].includes(gearSlot) ||
        (gearSlot === 'Boots' && mainStat === 'HealthPercent')) {
        const validSets = HP_FOCUS_SETS?.length
            ? HP_FOCUS_SETS
            : ['Protection', 'Health', 'Counter', 'Immunity', 'Pursuit'];
        if (!validSets.includes(displaySetName)) return 0;
        if (mainStat !== 'HealthPercent') return 0;
        const flatHPSub = substats.find(s => s.type === 'Health');
        return _scoreHP(flatHPSub, 202, 'Health', FLAT_HP_FOCUS_TIERS);
    }

    return 0;
}

// ============================================================================
// CACHE RESET
// ============================================================================

/**
 * Clears all module-level caches. Call this when gear data changes.
 */
function resetCaches() {
    _statWeightsCache         = null;
    _archetypeSubstatsCache   = null;
    _ruleValidationCache      = null;
    _archetypeSetMainCache    = null;
    _archetypeCombosPrebuilt  = false;
    _reforgeBonusCache        = null;
    _categorizedSubstatsCache = null;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Enhancement
    getEnhancementConfig,
    getAdjustedRolls,
    // Archetype helpers
    getArchetypeSource,
    getArchetypeRules,
    getScoringConfig,
    getCombinedSlotRules,
    isPotentialBasedArchetype,
    // Level helpers
    isGearReforged,
    canGearReforge,
    calculateReforgedValue,
    // GS / scoring
    getStatWeight,
    calculateStatGS,
    getReforgeBonus,
    calculateSubstatGS,
    calculateGearScore,
    // Validation
    validateGearItem,
    validateArray,
    validateArchetypeRule,
    validateMainStat,
    getCachedRuleValidation,
    // Substat categorization
    getArchetypeSubstats,
    getCachedArchetypeSubstats,
    categorizeSubstats,
    // Applicability
    buildArchetypeCombinationsCache,
    isArchetypeApplicable,
    findApplicableArchetypes,
    // Scoring
    calculateCustomArchetypeScore,
    // Potential-based archetype scoring
    calculateTopSpeedScore,
    calculateSpeedScore,
    calculateSpeedScoreFromGS,
    calculateEffectivenessFocusScore,
    calculateFixedSlotEffectivenessFocusScore,
    calculateEffectResistFocusScore,
    calculateArmorEffectResistFocusScore,
    calculateCritChanceFocusScore,
    calculateAttackFocusScore,
    calculateHPFocusScore,
    // Cache management
    resetCaches,
};

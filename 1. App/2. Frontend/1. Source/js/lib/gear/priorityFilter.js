import ROLL_DIVISORS from './rollDivisors.js';

function groupBy(xs, key) {
    return xs.reduce((rv, x) => {
        rv[x[key]] = rv[x[key]] || [];
        rv[x[key]].push(x);
        return rv;
    }, {});
}

function mainTypeValue(stats, statType) {
    if (statType === stats.mainType) {
        return stats.mainValue;
    }
    return 0;
}

// ---------------------------------------------------------------------------
// Item-score cache
// Cache maps `${item.modId}:${reforgeFlag}` → {score, priority}.
// Valid only while `_scoreCacheHash` matches the current priority + base-stats
// combination.  When any of the 8 priority sliders or base stats change the
// hash mismatches → cache is cleared automatically on the next calculateScore
// call — no external invalidation needed for priority changes.
// `PriorityFilter.clearScoreCache()` is still called from `invalidateItemsCache`
// in optimizerTab.js to evict stale mod-UUID entries after a hero change.
// ---------------------------------------------------------------------------
const _scoreCache = new Map();
let _scoreCacheHash = null;

/**
 * Builds a compact string key encoding the 8 priority values plus the three
 * hero base stats that appear in the flat-substat → % normalization.
 * Including base stats means a hero switch automatically produces a different
 * hash, so the cache self-invalidates without needing an external clear.
 */
function buildPriorityHash(params, baseStats) {
    return (
        `${params.inputAtkPriority || 0}:${params.inputHpPriority || 0}:` +
        `${params.inputDefPriority || 0}:${params.inputSpdPriority || 0}:` +
        `${params.inputCrPriority || 0}:${params.inputCdPriority || 0}:` +
        `${params.inputEffPriority || 0}:${params.inputResPriority || 0}:` +
        `${Math.round(baseStats.atk || 0)}:${Math.round(baseStats.hp || 0)}:${Math.round(baseStats.def || 0)}`
    );
}

function calculateScore(item, params, baseStats, reforge) {
    // --- Cache lookup ---
    const hash = buildPriorityHash(params, baseStats);
    if (hash !== _scoreCacheHash) {
        _scoreCache.clear();
        _scoreCacheHash = hash;
    }
    const cacheKey = `${item.modId}:${reforge ? 1 : 0}`;
    const cached = _scoreCache.get(cacheKey);
    if (cached !== undefined) {
        item.score = cached.score;
        item.priority = cached.priority;
        return;
    }
    // --- End cache lookup ---

    const stats = reforge ? item.reforgedStats : item.augmentedStats;

    const atkRolls =
        (stats.AttackPercent +
            mainTypeValue(stats, 'AttackPercent') +
            ((stats.Attack + mainTypeValue(stats, 'Attack')) / baseStats.atk) *
                100) /
        ROLL_DIVISORS.pct;
    const hpRolls =
        (stats.HealthPercent +
            mainTypeValue(stats, 'HealthPercent') +
            ((stats.Health + mainTypeValue(stats, 'Health')) / baseStats.hp) *
                100) /
        ROLL_DIVISORS.pct;
    const defRolls =
        (stats.DefensePercent +
            mainTypeValue(stats, 'DefensePercent') +
            ((stats.Defense + mainTypeValue(stats, 'Defense')) /
                baseStats.def) *
                100) /
        ROLL_DIVISORS.pct;
    const spdRolls = (stats.Speed + mainTypeValue(stats, 'Speed')) / ROLL_DIVISORS.spd;
    const crRolls =
        (stats.CriticalHitChancePercent +
            mainTypeValue(stats, 'CriticalHitChancePercent')) /
        ROLL_DIVISORS.cr;
    const cdRolls =
        (stats.CriticalHitDamagePercent +
            mainTypeValue(stats, 'CriticalHitDamagePercent')) /
        ROLL_DIVISORS.cd;
    const effRolls =
        (stats.EffectivenessPercent +
            mainTypeValue(stats, 'EffectivenessPercent')) /
        ROLL_DIVISORS.pct;
    const resRolls =
        (stats.EffectResistancePercent +
            mainTypeValue(stats, 'EffectResistancePercent')) /
        ROLL_DIVISORS.pct;

    const score =
        atkRolls * params.inputAtkPriority +
        hpRolls * params.inputHpPriority +
        defRolls * params.inputDefPriority +
        spdRolls * params.inputSpdPriority +
        crRolls * params.inputCrPriority +
        cdRolls * params.inputCdPriority +
        effRolls * params.inputEffPriority +
        resRolls * params.inputResPriority;

    item.score = Number.isNaN(score) ? 0 : score;
    item.priority = Number.isNaN(score) ? 0 : Math.round(score);
    _scoreCache.set(cacheKey, { score: item.score, priority: item.priority });
}

// Scores a complete build (backend result row) using the same roll-normalization
// as calculateScore, but against the build's combined stats minus hero base stats.
function calculateBuildScore(heroStat, params, baseStats) {
    if (!baseStats || !baseStats.atk) return 0;

    const atkRolls =
        (((heroStat.atk - baseStats.atk) / baseStats.atk) * 100) / ROLL_DIVISORS.pct;
    const hpRolls = (((heroStat.hp - baseStats.hp) / baseStats.hp) * 100) / ROLL_DIVISORS.pct;
    const defRolls =
        (((heroStat.def - baseStats.def) / baseStats.def) * 100) / ROLL_DIVISORS.pct;
    const spdRolls = (heroStat.spd - baseStats.spd) / ROLL_DIVISORS.spd;
    const crRolls = (heroStat.cr - baseStats.cr) / ROLL_DIVISORS.cr;
    const cdRolls = (heroStat.cd - baseStats.cd) / ROLL_DIVISORS.cd;
    const effRolls = (heroStat.eff - baseStats.eff) / ROLL_DIVISORS.pct;
    const resRolls = (heroStat.res - baseStats.res) / ROLL_DIVISORS.pct;

    const score =
        atkRolls * (params.inputAtkPriority || 0) +
        hpRolls * (params.inputHpPriority || 0) +
        defRolls * (params.inputDefPriority || 0) +
        spdRolls * (params.inputSpdPriority || 0) +
        crRolls * (params.inputCrPriority || 0) +
        cdRolls * (params.inputCdPriority || 0) +
        effRolls * (params.inputEffPriority || 0) +
        resRolls * (params.inputResPriority || 0);

    // Target bonus — supports single target or min/max target range.
    //
    // Single target (only inputXxxTarget set — backward compat):
    //   Below target: linear 0→1. At target: 1. Above: 1 + (ratio-1)*0.1
    //
    // Range targets (both inputXxxMinTarget + inputXxxTarget set):
    //   Below minTarget: linear 0→1 (partial credit).
    //   Between minTarget and maxTarget: full credit = 1.
    //   Above maxTarget: 1 + (stat/maxTarget - 1)*0.1 (slight bonus — not wasteful).
    //
    // Only minTarget set: treated as current single-target behavior.
    // Only maxTarget set: full credit at or below maxTarget, slight bonus above.
    //
    // Targets only apply when the stat's priority is > 0.  A 0-priority stat
    // with a target set must NOT silently influence build ranking — the user
    // explicitly set priority to 0 meaning "I don't care about this stat."
    const targetRatio = (stat, target) => {
        const r = stat / target;
        return r >= 1 ? 1.0 + (r - 1) * 0.1 : r;
    };
    const targetRangeRatio = (stat, minT, maxT) => {
        if (stat >= minT && stat <= maxT) return 1.0;
        if (stat < minT) return stat / minT;
        // stat > maxT — slight bonus for exceeding the ceiling
        return 1.0 + (stat / maxT - 1) * 0.1;
    };

    const statTargetBonus = (stat, minT, maxT, priority) => {
        const hasMin = minT > 0;
        const hasMax = maxT > 0;
        if (!hasMin && !hasMax) return 0;
        if (!priority) return 0; // 0-priority stats don't influence ranking even with a target
        const p = priority;
        if (hasMin && hasMax) return targetRangeRatio(stat, minT, maxT) * p;
        if (hasMin) return targetRatio(stat, minT) * p;
        return targetRatio(stat, maxT) * p;
    };

    const targetBonus =
        statTargetBonus(heroStat.atk, params.inputAtkMinTarget, params.inputAtkTarget, params.inputAtkPriority) +
        statTargetBonus(heroStat.hp,  params.inputHpMinTarget,  params.inputHpTarget,  params.inputHpPriority)  +
        statTargetBonus(heroStat.def, params.inputDefMinTarget, params.inputDefTarget, params.inputDefPriority) +
        statTargetBonus(heroStat.spd, params.inputSpdMinTarget, params.inputSpdTarget, params.inputSpdPriority) +
        statTargetBonus(heroStat.cr,  params.inputCrMinTarget,  params.inputCrTarget,  params.inputCrPriority)  +
        statTargetBonus(heroStat.cd,  params.inputCdMinTarget,  params.inputCdTarget,  params.inputCdPriority)  +
        statTargetBonus(heroStat.eff, params.inputEffMinTarget, params.inputEffTarget, params.inputEffPriority) +
        statTargetBonus(heroStat.res, params.inputResMinTarget, params.inputResTarget, params.inputResPriority);

    const total = score + targetBonus;
    return Number.isNaN(total) ? 0 : Math.round(total * 10) / 10;
}

function filterDisabled(params) {
    return (
        (params.inputWeaponFilterPriority ?? 100) >= 100 &&
        (params.inputHelmetFilterPriority ?? 100) >= 100 &&
        (params.inputArmorFilterPriority ?? 100) >= 100 &&
        (params.inputNecklaceFilterPriority ?? 100) >= 100 &&
        (params.inputRingFilterPriority ?? 100) >= 100 &&
        (params.inputBootsFilterPriority ?? 100) >= 100
    );
}

function isSlotFilterDisabled(slotFilter) {
    return slotFilter >= 100;
}

const PriorityFilter = {
    /** Evict all cached item scores (call after hero change or item import). */
    clearScoreCache: () => {
        _scoreCache.clear();
        _scoreCacheHash = null;
    },

    calculateBuildScore,

    /**
     * Score a single item (sets item.score and item.priority in place) using
     * the given params and base stats. Exposed so callers outside this module
     * (e.g., auto-config slot filters) can re-use the same scoring logic.
     */
    scoreItem: (item, params, baseStats, reforge) => {
        calculateScore(item, params, baseStats, reforge);
    },

    applyPriorityFilters: (
        params,
        items,
        baseStats,
        allItems,
        reforge,
        inputSubstatMods,
    ) => {
        let passed = [];

        if (filterDisabled(params)) {
            return items;
        }

        const slotFilterMap = {
            Weapon: params.inputWeaponFilterPriority ?? 100,
            Helmet: params.inputHelmetFilterPriority ?? 100,
            Armor: params.inputArmorFilterPriority ?? 100,
            Necklace: params.inputNecklaceFilterPriority ?? 100,
            Ring: params.inputRingFilterPriority ?? 100,
            Boots: params.inputBootsFilterPriority ?? 100,
        };

        const groups = groupBy(items, 'gear');
        const allItemsGroups = groupBy(allItems, 'gear');

        Object.keys(groups).forEach((key) => {
            const gearArr = groups[key];
            const slotFilter = slotFilterMap[key] ?? 100;

            if (isSlotFilterDisabled(slotFilter)) {
                passed = passed.concat(gearArr);
                return;
            }

            gearArr.forEach((gear) => {
                calculateScore(gear, params, baseStats, reforge);
            });

            gearArr.sort((a, b) => b.score - a.score);

            let groupLength = (allItemsGroups[key] || []).length;
            if (inputSubstatMods) {
                groupLength = Math.max(
                    groups[key].length,
                    (allItemsGroups[key] || []).length,
                );
            }

            const index = Math.ceil((slotFilter / 100) * groupLength);
            passed = passed.concat(gearArr.slice(0, index));
        });

        return passed;
    },
};

export default PriorityFilter;

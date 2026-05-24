/**
 * Epic Seven Gear Constants — CommonJS module port
 * Ported from "1. Epic Seven Gear Constant.js" (Google Apps Script)
 * Changes: removed globalThis patterns, added module.exports
 */

// ITEM_RANK is defined once in reforgeConstants.js and imported here.
const { plainStatRollsToValue, critDamageRollsToValue, speedRollsToValue, maxRollsByRank, ITEM_RANK } = require('../gear/reforgeConstants');

const BASE_ITEM_RANK_SUBSTATS = Object.freeze({
    NORMAL: 0,
    GOOD: 1,
    RARE: 2,
    HEROIC: 3,
    EPIC: 4
});

const ITEM_LEVEL = Object.freeze({
    LEVEL_90: { value: 90, status: 'Reforged' },
    LEVEL_88: { value: 88, status: 'Not Reforgeable' },
    LEVEL_85: { value: 85, status: 'Reforgeable' },
    LEVEL_RANGE_72_84: { min: 72, max: 84, status: 'Not Reforgeable' },
    LEVEL_RANGE_1_71: { min: 1, max: 71, status: 'Not Reforgeable' }
});

const GEAR_SLOT = Object.freeze({
    WEAPON: 'Weapon',
    HELMET: 'Helmet',
    ARMOR: 'Armor',
    NECKLACE: 'Necklace',
    RING: 'Ring',
    BOOTS: 'Boots'
});

const ITEM_MAIN = Object.freeze({
    WEAPON: Object.freeze({ main_stats: ['Attack'], is_fixed: true }),
    HELMET: Object.freeze({ main_stats: ['Health'], is_fixed: true }),
    ARMOR: Object.freeze({ main_stats: ['Defense'], is_fixed: true }),
    NECKLACE: Object.freeze({
        main_stats: ['AttackPercent', 'Attack', 'DefensePercent', 'Defense', 'HealthPercent', 'Health', 'CriticalHitChancePercent', 'CriticalHitDamagePercent'],
        is_fixed: false
    }),
    RING: Object.freeze({
        main_stats: ['AttackPercent', 'Attack', 'DefensePercent', 'Defense', 'HealthPercent', 'Health', 'EffectivenessPercent', 'EffectResistancePercent'],
        is_fixed: false
    }),
    BOOTS: Object.freeze({
        main_stats: ['AttackPercent', 'Attack', 'DefensePercent', 'Defense', 'HealthPercent', 'Health', 'Speed'],
        is_fixed: false
    })
});

const ITEM_ALLOWED_SUBSTATS = Object.freeze({
    WEAPON: Object.freeze(['AttackPercent', 'Health', 'HealthPercent', 'Speed', 'CriticalHitChancePercent', 'CriticalHitDamagePercent', 'EffectivenessPercent', 'EffectResistancePercent']),
    HELMET: Object.freeze(['Attack', 'AttackPercent', 'Defense', 'DefensePercent', 'HealthPercent', 'Speed', 'CriticalHitChancePercent', 'CriticalHitDamagePercent', 'EffectivenessPercent', 'EffectResistancePercent']),
    ARMOR: Object.freeze(['DefensePercent', 'Health', 'HealthPercent', 'Speed', 'CriticalHitChancePercent', 'CriticalHitDamagePercent', 'EffectivenessPercent', 'EffectResistancePercent']),
    NECKLACE: Object.freeze(['Attack', 'AttackPercent', 'Defense', 'DefensePercent', 'Health', 'HealthPercent', 'Speed', 'CriticalHitChancePercent', 'CriticalHitDamagePercent', 'EffectivenessPercent', 'EffectResistancePercent']),
    RING: Object.freeze(['Attack', 'AttackPercent', 'Defense', 'DefensePercent', 'Health', 'HealthPercent', 'Speed', 'CriticalHitChancePercent', 'CriticalHitDamagePercent', 'EffectivenessPercent', 'EffectResistancePercent']),
    BOOTS: Object.freeze(['Attack', 'AttackPercent', 'Defense', 'DefensePercent', 'Health', 'HealthPercent', 'Speed', 'CriticalHitChancePercent', 'CriticalHitDamagePercent', 'EffectivenessPercent', 'EffectResistancePercent'])
});

const ITEM_ENHANCE_LEVELS = Object.freeze({
    ENHANCE_0: 0, ENHANCE_3: 3, ENHANCE_6: 6,
    ENHANCE_9: 9, ENHANCE_12: 12, ENHANCE_15: 15
});

const ITEM_ENHANCE_LEVELS_SUBSTATS_UNLOCKED = Object.freeze({
    NORMAL: Object.freeze([3, 6, 9, 12]),
    GOOD: Object.freeze([6, 9, 12]),
    RARE: Object.freeze([9, 12]),
    HEROIC: Object.freeze([12]),
    EPIC: Object.freeze([])
});

const ITEM_ENHANCE_LEVELS_SUBSTATS_ENHANCED = Object.freeze({
    NORMAL: Object.freeze([15]),
    GOOD: Object.freeze([3, 15]),
    RARE: Object.freeze([3, 6, 15]),
    HEROIC: Object.freeze([3, 6, 9, 15]),
    EPIC: Object.freeze([3, 6, 9, 12, 15])
});

const ITEM_MAX_ENHANCE_TOTAL_ROLLS = Object.freeze({
    NORMAL: maxRollsByRank.Normal,
    GOOD:   maxRollsByRank.Good,
    RARE:   maxRollsByRank.Rare,
    HEROIC: maxRollsByRank.Heroic,
    EPIC:   maxRollsByRank.Epic,
});

const ITEM_ENHANCEMENT_CONFIG = Object.freeze({
    NORMAL: Object.freeze({
        rank: 'Normal', baseSubstats: 0, maxRolls: 5,
        unlockLevels: Object.freeze([3, 6, 9, 12]), enhanceLevels: Object.freeze([15]),
        dpsArmor: Object.freeze({ baseSubstats: 0, maxRolls: 4, unlockLevels: Object.freeze([3, 6, 9]) })
    }),
    GOOD: Object.freeze({
        rank: 'Good', baseSubstats: 1, maxRolls: 6,
        unlockLevels: Object.freeze([6, 9, 12]), enhanceLevels: Object.freeze([3, 15]),
        dpsArmor: Object.freeze({ baseSubstats: 1, maxRolls: 5, unlockLevels: Object.freeze([6, 9]) })
    }),
    RARE: Object.freeze({
        rank: 'Rare', baseSubstats: 2, maxRolls: 7,
        unlockLevels: Object.freeze([9, 12]), enhanceLevels: Object.freeze([3, 6, 15]),
        dpsArmor: Object.freeze({ baseSubstats: 2, maxRolls: 6, unlockLevels: Object.freeze([9]) })
    }),
    HEROIC: Object.freeze({
        rank: 'Heroic', baseSubstats: 3, maxRolls: 8,
        unlockLevels: Object.freeze([12]), enhanceLevels: Object.freeze([3, 6, 9, 15]),
        dpsArmor: Object.freeze({ baseSubstats: 3, maxRolls: 7, unlockLevels: Object.freeze([]) })
    }),
    EPIC: Object.freeze({
        rank: 'Epic', baseSubstats: 4, maxRolls: 9,
        unlockLevels: Object.freeze([]), enhanceLevels: Object.freeze([3, 6, 9, 12, 15]),
        dpsArmor: Object.freeze({ baseSubstats: 3, maxRolls: 8, unlockLevels: Object.freeze([]) })
    })
});

const HEROIC_PHANTOM_SUBSTAT_ROLLS = 1;

const ITEM_SUBSTAT_STAT_WEIGHTS = Object.freeze({
    AttackPercent: Object.freeze([1, 1, 1, 1, 1, 1]),
    Attack: Object.freeze([(3.46 / 39), (3.46 / 39), (3.46 / 39), (3.46 / 39), (3.46 / 39), (3.46 / 39)]),
    DefensePercent: Object.freeze([1, 1, 1, 1, 1, 1]),
    Defense: Object.freeze([(4.99 / 31), (4.99 / 31), (4.99 / 31), (4.99 / 31), (4.99 / 31), (4.99 / 31)]),
    HealthPercent: Object.freeze([1, 1, 1, 1, 1, 1]),
    Health: Object.freeze([(3.09 / 174), (3.09 / 174), (3.09 / 174), (3.09 / 174), (3.09 / 174), (3.09 / 174)]),
    Speed: Object.freeze([(9 / 4), (19 / 9), (28 / 14), (38 / 19), (48 / 24), (56 / 28)]),
    CriticalHitChancePercent: Object.freeze([(9 / 5), (19 / 12), (28 / 18), (37 / 24), (47 / 30), (56 / 36)]),
    CriticalHitDamagePercent: Object.freeze([(9 / 8), (19 / 16), (28 / 24), (37 / 32), (47 / 41), (56 / 49)]),
    EffectivenessPercent: Object.freeze([1, 1, 1, 1, 1, 1]),
    EffectResistancePercent: Object.freeze([1, 1, 1, 1, 1, 1]),
    SPEED_BOOTS_PENALTY: Object.freeze([
        (9 / 4) * ((48 * 4.99) / 279),
        (19 / 9) * ((96 * 4.99) / 589),
        (28 / 14) * ((144 * 4.99) / 868),
        (38 / 19) * ((192 * 4.99) / 1178),
        (48 / 24) * ((240 * 4.99) / 1488),
        (56 / 28) * ((288 * 4.99) / 1736)
    ])
});

const SUBSTAT_ROLL_RANGES = Object.freeze({
    LEVEL_88: Object.freeze({
        Percent: Object.freeze({ Epic: Object.freeze([5, 9]), Heroic: Object.freeze([5, 9]) }),
        Attack: Object.freeze({ Epic: Object.freeze([37, 53]), Heroic: Object.freeze([36, 50]) }),
        Defense: Object.freeze({ Epic: Object.freeze([32, 40]), Heroic: Object.freeze([30, 36]) }),
        Health: Object.freeze({ Epic: Object.freeze([178, 229]), Heroic: Object.freeze([169, 218]) }),
        Speed: Object.freeze({ Epic: Object.freeze([3, 5]), Heroic: Object.freeze([2, 4]) }),
        CriticalHitDamagePercent: Object.freeze({ Epic: Object.freeze([4, 8]), Heroic: Object.freeze([4, 8]) }),
        CriticalHitChancePercent: Object.freeze({ Epic: Object.freeze([3, 6]), Heroic: Object.freeze([3, 6]) })
    }),
    LEVEL_RANGE_72_85: Object.freeze({
        Percent: Object.freeze({ Epic: Object.freeze([4, 8]), Heroic: Object.freeze([4, 8]) }),
        Attack: Object.freeze({ Epic: Object.freeze([33, 46]), Heroic: Object.freeze([31, 44]) }),
        Defense: Object.freeze({ Epic: Object.freeze([28, 35]), Heroic: Object.freeze([26, 33]) }),
        Health: Object.freeze({ Epic: Object.freeze([157, 202]), Heroic: Object.freeze([149, 192]) }),
        Speed: Object.freeze({ Epic: Object.freeze([2, 5]), Heroic: Object.freeze([1, 4]) }),
        CriticalHitDamagePercent: Object.freeze({ Epic: Object.freeze([4, 7]), Heroic: Object.freeze([4, 7]) }),
        CriticalHitChancePercent: Object.freeze({ Epic: Object.freeze([3, 5]), Heroic: Object.freeze([3, 5]) })
    }),
    LEVEL_RANGE_1_71: Object.freeze({
        Percent: Object.freeze({ Epic: Object.freeze([4, 7]), Heroic: Object.freeze([4, 7]) }),
        Attack: Object.freeze({ Epic: Object.freeze([28, 40]), Heroic: Object.freeze([27, 38]) }),
        Defense: Object.freeze({ Epic: Object.freeze([24, 30]), Heroic: Object.freeze([22, 28]) }),
        Health: Object.freeze({ Epic: Object.freeze([136, 175]), Heroic: Object.freeze([129, 166]) }),
        Speed: Object.freeze({ Epic: Object.freeze([2, 4]), Heroic: Object.freeze([1, 3]) }),
        CriticalHitDamagePercent: Object.freeze({ Epic: Object.freeze([3, 6]), Heroic: Object.freeze([3, 6]) }),
        CriticalHitChancePercent: Object.freeze({ Epic: Object.freeze([2, 4]), Heroic: Object.freeze([2, 4]) })
    })
});

const ITEM_REFORGE_TABLES = Object.freeze({
    '%_Rolls': Object.freeze(Object.values(plainStatRollsToValue)),
    'CC%_Rolls': Object.freeze([1, 2, 3, 4, 5, 6]),
    'CD%_Rolls': Object.freeze(Object.values(critDamageRollsToValue)),
    'Speed_Rolls': Object.freeze(Object.values(speedRollsToValue)),
    'Attack_Rolls': Object.freeze([11, 22, 33, 44, 55, 66]),
    'Defense_Rolls': Object.freeze([9, 18, 27, 36, 45, 54]),
    'Health_Rolls': Object.freeze([56, 112, 168, 224, 280, 336])
});

const ITEM_REFORGE_STAT_MAP = Object.freeze({
    'AttackPercent': '%_Rolls',
    'DefensePercent': '%_Rolls',
    'HealthPercent': '%_Rolls',
    'EffectivenessPercent': '%_Rolls',
    'EffectResistancePercent': '%_Rolls',
    'CriticalHitChancePercent': 'CC%_Rolls',
    'CriticalHitDamagePercent': 'CD%_Rolls',
    'Speed': 'Speed_Rolls',
    'Attack': 'Attack_Rolls',
    'Defense': 'Defense_Rolls',
    'Health': 'Health_Rolls'
});

// Shared modification ranges for Necklace and Ring (identical values)
const NECKLACE_RING_SHARED_MODS = Object.freeze({
    Attack: Object.freeze({
        non_reforged_value: Object.freeze([47, 77, 101, 109, 129, 151]),
        non_reforged_min_value: Object.freeze([28, 42, 58, 67, 80, 109]),
        non_reforged_score: Object.freeze([4.170, 6.831, 8.961, 9.670, 11.445, 13.396]),
        reforged_value: Object.freeze([58, 99, 134, 153, 184, 217]),
        reforged_min_value: Object.freeze([39, 64, 91, 111, 135, 175]),
        reforged_score: Object.freeze([5.146, 8.783, 11.888, 13.574, 16.324, 19.252])
    }),
    AttackPercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
    }),
    Defense: Object.freeze({
        non_reforged_value: Object.freeze([35, 61, 76, 80, 97, 111]),
        non_reforged_min_value: Object.freeze([24, 28, 43, 51, 62, 80]),
        non_reforged_score: Object.freeze([5.634, 9.819, 12.234, 12.877, 15.614, 17.867]),
        reforged_value: Object.freeze([44, 79, 103, 116, 142, 165]),
        reforged_min_value: Object.freeze([33, 45, 70, 87, 107, 134]),
        reforged_score: Object.freeze([7.083, 12.716, 16.580, 18.672, 22.857, 26.560])
    }),
    DefensePercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
    }),
    Health: Object.freeze({
        non_reforged_value: Object.freeze([203, 336, 422, 461, 578, 659]),
        non_reforged_min_value: Object.freeze([134, 200, 274, 321, 370, 477]),
        non_reforged_score: Object.freeze([3.605, 5.967, 7.494, 8.187, 10.264, 11.703]),
        reforged_value: Object.freeze([259, 448, 590, 685, 858, 995]),
        reforged_min_value: Object.freeze([190, 312, 442, 545, 650, 813]),
        reforged_score: Object.freeze([4.599, 7.956, 10.478, 12.165, 15.237, 17.670])
    }),
    HealthPercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
    }),
    Speed: Object.freeze({
        non_reforged_value: Object.freeze([4, 5, 6, 8, 9, 10]),
        non_reforged_min_value: Object.freeze([2, 2, 3, 4, 5, 6]),
        non_reforged_score: Object.freeze([9.000, 10.556, 12.000, 16.000, 18.000, 20.000]),
        reforged_value: Object.freeze([4, 6, 8, 11, 13, 14]),
        reforged_min_value: Object.freeze([2, 3, 5, 7, 9, 10]),
        reforged_score: Object.freeze([9.000, 12.667, 16.000, 22.000, 26.000, 28.000])
    }),
    CriticalHitChancePercent: Object.freeze({
        non_reforged_value: Object.freeze([4, 6, 8, 10, 11, 12]),
        non_reforged_min_value: Object.freeze([2, 2, 3, 4, 6, 7]),
        non_reforged_score: Object.freeze([7.200, 9.500, 12.444, 15.417, 17.233, 18.667]),
        reforged_value: Object.freeze([5, 8, 11, 14, 16, 18]),
        reforged_min_value: Object.freeze([3, 4, 6, 8, 11, 13]),
        reforged_score: Object.freeze([9.000, 12.667, 17.111, 21.583, 25.067, 28.000])
    }),
    CriticalHitDamagePercent: Object.freeze({
        non_reforged_value: Object.freeze([7, 9, 12, 15, 16, 17]),
        non_reforged_min_value: Object.freeze([3, 4, 6, 9, 11, 12]),
        non_reforged_score: Object.freeze([7.875, 10.688, 14.000, 17.344, 18.341, 19.429]),
        reforged_value: Object.freeze([8, 11, 15, 19, 22, 24]),
        reforged_min_value: Object.freeze([4, 6, 9, 13, 17, 19]),
        reforged_score: Object.freeze([9.000, 13.063, 17.500, 21.969, 25.220, 27.429])
    }),
    EffectivenessPercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
    }),
    EffectResistancePercent: Object.freeze({
        non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
        non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
        non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
        reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
        reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
        reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
    })
});

const ITEM_MODIFICATION_ROLL_RANGES = Object.freeze({
    Weapon: Object.freeze({
        AttackPercent: Object.freeze({
            non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
            non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
            non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
            reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
            reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
            reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
        }),
        Health: Object.freeze({
            non_reforged_value: Object.freeze([203, 336, 422, 461, 578, 659]),
            non_reforged_min_value: Object.freeze([134, 200, 274, 321, 370, 477]),
            non_reforged_score: Object.freeze([3.605, 5.967, 7.494, 8.187, 10.264, 11.703]),
            reforged_value: Object.freeze([259, 448, 590, 685, 858, 995]),
            reforged_min_value: Object.freeze([190, 312, 442, 545, 650, 813]),
            reforged_score: Object.freeze([4.599, 7.956, 10.478, 12.165, 15.237, 17.670])
        }),
        HealthPercent: Object.freeze({
            non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
            non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
            non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
            reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
            reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
            reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
        }),
        Speed: Object.freeze({
            non_reforged_value: Object.freeze([4, 5, 6, 8, 9, 10]),
            non_reforged_min_value: Object.freeze([2, 2, 3, 4, 5, 6]),
            non_reforged_score: Object.freeze([9.000, 10.556, 12.000, 16.000, 18.000, 20.000]),
            reforged_value: Object.freeze([4, 6, 8, 11, 13, 14]),
            reforged_min_value: Object.freeze([2, 3, 5, 7, 9, 10]),
            reforged_score: Object.freeze([9.000, 12.667, 16.000, 22.000, 26.000, 28.000])
        }),
        CriticalHitChancePercent: Object.freeze({
            non_reforged_value: Object.freeze([4, 6, 8, 10, 11, 12]),
            non_reforged_min_value: Object.freeze([2, 2, 3, 4, 6, 7]),
            non_reforged_score: Object.freeze([7.200, 9.500, 12.444, 15.417, 17.233, 18.667]),
            reforged_value: Object.freeze([5, 8, 11, 14, 16, 18]),
            reforged_min_value: Object.freeze([3, 4, 6, 8, 11, 13]),
            reforged_score: Object.freeze([9.000, 12.667, 17.111, 21.583, 25.067, 28.000])
        }),
        CriticalHitDamagePercent: Object.freeze({
            non_reforged_value: Object.freeze([7, 9, 12, 15, 16, 17]),
            non_reforged_min_value: Object.freeze([3, 4, 6, 9, 11, 12]),
            non_reforged_score: Object.freeze([7.875, 10.688, 14.000, 17.344, 18.341, 19.429]),
            reforged_value: Object.freeze([8, 11, 15, 19, 22, 24]),
            reforged_min_value: Object.freeze([4, 6, 9, 13, 17, 19]),
            reforged_score: Object.freeze([9.000, 13.063, 17.500, 21.969, 25.220, 27.429])
        }),
        EffectivenessPercent: Object.freeze({
            non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
            non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
            non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
            reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
            reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
            reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
        }),
        EffectResistancePercent: Object.freeze({
            non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
            non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
            non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
            reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
            reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
            reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
        })
    }),
    Helmet: Object.freeze({
        Attack: Object.freeze({
            non_reforged_value: Object.freeze([47, 77, 101, 109, 129, 151]),
            non_reforged_min_value: Object.freeze([28, 42, 58, 67, 80, 109]),
            non_reforged_score: Object.freeze([4.170, 6.831, 8.961, 9.670, 11.445, 13.396]),
            reforged_value: Object.freeze([58, 99, 134, 153, 184, 217]),
            reforged_min_value: Object.freeze([39, 64, 91, 111, 135, 175]),
            reforged_score: Object.freeze([5.146, 8.783, 11.888, 13.574, 16.324, 19.252])
        }),
        AttackPercent: Object.freeze({
            non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
            non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
            non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
            reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
            reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
            reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
        }),
        Defense: Object.freeze({
            non_reforged_value: Object.freeze([35, 61, 76, 80, 97, 111]),
            non_reforged_min_value: Object.freeze([24, 28, 43, 51, 62, 80]),
            non_reforged_score: Object.freeze([5.634, 9.819, 12.234, 12.877, 15.614, 17.867]),
            reforged_value: Object.freeze([44, 79, 103, 116, 142, 165]),
            reforged_min_value: Object.freeze([33, 45, 70, 87, 107, 134]),
            reforged_score: Object.freeze([7.083, 12.716, 16.580, 18.672, 22.857, 26.560])
        }),
        DefensePercent: Object.freeze({
            non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
            non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
            non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
            reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
            reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
            reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
        }),
        HealthPercent: Object.freeze({
            non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
            non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
            non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
            reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
            reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
            reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
        }),
        Speed: Object.freeze({
            non_reforged_value: Object.freeze([4, 5, 6, 8, 9, 10]),
            non_reforged_min_value: Object.freeze([2, 2, 3, 4, 5, 6]),
            non_reforged_score: Object.freeze([9.000, 10.556, 12.000, 16.000, 18.000, 20.000]),
            reforged_value: Object.freeze([4, 6, 8, 11, 13, 14]),
            reforged_min_value: Object.freeze([2, 3, 5, 7, 9, 10]),
            reforged_score: Object.freeze([9.000, 12.667, 16.000, 22.000, 26.000, 28.000])
        }),
        CriticalHitChancePercent: Object.freeze({
            non_reforged_value: Object.freeze([4, 6, 8, 10, 11, 12]),
            non_reforged_min_value: Object.freeze([2, 2, 3, 4, 6, 7]),
            non_reforged_score: Object.freeze([7.200, 9.500, 12.444, 15.417, 17.233, 18.667]),
            reforged_value: Object.freeze([5, 8, 11, 14, 16, 18]),
            reforged_min_value: Object.freeze([3, 4, 6, 8, 11, 13]),
            reforged_score: Object.freeze([9.000, 12.667, 17.111, 21.583, 25.067, 28.000])
        }),
        CriticalHitDamagePercent: Object.freeze({
            non_reforged_value: Object.freeze([7, 9, 12, 15, 16, 17]),
            non_reforged_min_value: Object.freeze([3, 4, 6, 9, 11, 12]),
            non_reforged_score: Object.freeze([7.875, 10.688, 14.000, 17.344, 18.341, 19.429]),
            reforged_value: Object.freeze([8, 11, 15, 19, 22, 24]),
            reforged_min_value: Object.freeze([4, 6, 9, 13, 17, 19]),
            reforged_score: Object.freeze([9.000, 13.063, 17.500, 21.969, 25.220, 27.429])
        }),
        EffectivenessPercent: Object.freeze({
            non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
            non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
            non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
            reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
            reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
            reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
        }),
        EffectResistancePercent: Object.freeze({
            non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
            non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
            non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
            reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
            reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
            reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
        })
    }),
    Armor: Object.freeze({
        DefensePercent: Object.freeze({
            non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
            non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
            non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
            reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
            reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
            reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
        }),
        Health: Object.freeze({
            non_reforged_value: Object.freeze([203, 336, 422, 461, 578, 659]),
            non_reforged_min_value: Object.freeze([134, 200, 274, 321, 370, 477]),
            non_reforged_score: Object.freeze([3.605, 5.967, 7.494, 8.187, 10.264, 11.703]),
            reforged_value: Object.freeze([259, 448, 590, 685, 858, 995]),
            reforged_min_value: Object.freeze([190, 312, 442, 545, 650, 813]),
            reforged_score: Object.freeze([4.599, 7.956, 10.478, 12.165, 15.237, 17.670])
        }),
        HealthPercent: Object.freeze({
            non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
            non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
            non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
            reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
            reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
            reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
        }),
        Speed: Object.freeze({
            non_reforged_value: Object.freeze([4, 5, 6, 8, 9, 10]),
            non_reforged_min_value: Object.freeze([2, 2, 3, 4, 5, 6]),
            non_reforged_score: Object.freeze([9.000, 10.556, 12.000, 16.000, 18.000, 20.000]),
            reforged_value: Object.freeze([4, 6, 8, 11, 13, 14]),
            reforged_min_value: Object.freeze([2, 3, 5, 7, 9, 10]),
            reforged_score: Object.freeze([9.000, 12.667, 16.000, 22.000, 26.000, 28.000])
        }),
        CriticalHitChancePercent: Object.freeze({
            non_reforged_value: Object.freeze([4, 6, 8, 10, 11, 12]),
            non_reforged_min_value: Object.freeze([2, 2, 3, 4, 6, 7]),
            non_reforged_score: Object.freeze([7.200, 9.500, 12.444, 15.417, 17.233, 18.667]),
            reforged_value: Object.freeze([5, 8, 11, 14, 16, 18]),
            reforged_min_value: Object.freeze([3, 4, 6, 8, 11, 13]),
            reforged_score: Object.freeze([9.000, 12.667, 17.111, 21.583, 25.067, 28.000])
        }),
        CriticalHitDamagePercent: Object.freeze({
            non_reforged_value: Object.freeze([7, 9, 12, 15, 16, 17]),
            non_reforged_min_value: Object.freeze([3, 4, 6, 9, 11, 12]),
            non_reforged_score: Object.freeze([7.875, 10.688, 14.000, 17.344, 18.341, 19.429]),
            reforged_value: Object.freeze([8, 11, 15, 19, 22, 24]),
            reforged_min_value: Object.freeze([4, 6, 9, 13, 17, 19]),
            reforged_score: Object.freeze([9.000, 13.063, 17.500, 21.969, 25.220, 27.429])
        }),
        EffectivenessPercent: Object.freeze({
            non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
            non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
            non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
            reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
            reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
            reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
        }),
        EffectResistancePercent: Object.freeze({
            non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
            non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
            non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
            reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
            reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
            reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
        })
    }),
    Necklace: NECKLACE_RING_SHARED_MODS,
    Ring: NECKLACE_RING_SHARED_MODS,
    Boots: Object.freeze({
        Attack: Object.freeze({
            non_reforged_value: Object.freeze([47, 77, 101, 109, 129, 151]),
            non_reforged_min_value: Object.freeze([28, 42, 58, 67, 80, 109]),
            non_reforged_score: Object.freeze([4.170, 6.831, 8.961, 9.670, 11.445, 13.396]),
            reforged_value: Object.freeze([58, 99, 134, 153, 184, 217]),
            reforged_min_value: Object.freeze([39, 64, 91, 111, 135, 175]),
            reforged_score: Object.freeze([5.146, 8.783, 11.888, 13.574, 16.324, 19.252])
        }),
        AttackPercent: Object.freeze({
            non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
            non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
            non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
            reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
            reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
            reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
        }),
        Defense: Object.freeze({
            non_reforged_value: Object.freeze([35, 61, 76, 80, 97, 111]),
            non_reforged_min_value: Object.freeze([24, 28, 43, 51, 62, 80]),
            non_reforged_score: Object.freeze([5.634, 9.819, 12.234, 12.877, 15.614, 17.867]),
            reforged_value: Object.freeze([44, 79, 103, 116, 142, 165]),
            reforged_min_value: Object.freeze([33, 45, 70, 87, 107, 134]),
            reforged_score: Object.freeze([7.083, 12.716, 16.580, 18.672, 22.857, 26.560])
        }),
        DefensePercent: Object.freeze({
            non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
            non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
            non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
            reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
            reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
            reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
        }),
        Health: Object.freeze({
            non_reforged_value: Object.freeze([203, 336, 422, 461, 578, 659]),
            non_reforged_min_value: Object.freeze([134, 200, 274, 321, 370, 477]),
            non_reforged_score: Object.freeze([3.605, 5.967, 7.494, 8.187, 10.264, 11.703]),
            reforged_value: Object.freeze([259, 448, 590, 685, 858, 995]),
            reforged_min_value: Object.freeze([190, 312, 442, 545, 650, 813]),
            reforged_score: Object.freeze([4.599, 7.956, 10.478, 12.165, 15.237, 17.670])
        }),
        HealthPercent: Object.freeze({
            non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
            non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
            non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
            reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
            reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
            reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
        }),
        Speed: Object.freeze({
            non_reforged_value: Object.freeze([4, 5, 6, 8, 9, 10]),
            non_reforged_min_value: Object.freeze([2, 2, 3, 4, 5, 6]),
            non_reforged_score: Object.freeze([7.726, 8.585, 9.934, 13.013, 14.487, 16.557]),
            reforged_value: Object.freeze([4, 6, 8, 11, 13, 14]),
            reforged_min_value: Object.freeze([2, 3, 5, 7, 9, 10]),
            reforged_score: Object.freeze([7.726, 10.302, 13.245, 17.893, 20.926, 23.179])
        }),
        CriticalHitChancePercent: Object.freeze({
            non_reforged_value: Object.freeze([4, 6, 8, 10, 11, 12]),
            non_reforged_min_value: Object.freeze([2, 2, 3, 4, 6, 7]),
            non_reforged_score: Object.freeze([7.200, 9.500, 12.444, 15.417, 17.233, 18.667]),
            reforged_value: Object.freeze([5, 8, 11, 14, 16, 18]),
            reforged_min_value: Object.freeze([3, 4, 6, 8, 11, 13]),
            reforged_score: Object.freeze([9.000, 12.667, 17.111, 21.583, 25.067, 28.000])
        }),
        CriticalHitDamagePercent: Object.freeze({
            non_reforged_value: Object.freeze([7, 9, 12, 15, 16, 17]),
            non_reforged_min_value: Object.freeze([3, 4, 6, 9, 11, 12]),
            non_reforged_score: Object.freeze([7.875, 10.688, 14.000, 17.344, 18.341, 19.429]),
            reforged_value: Object.freeze([8, 11, 15, 19, 22, 24]),
            reforged_min_value: Object.freeze([4, 6, 9, 13, 17, 19]),
            reforged_score: Object.freeze([9.000, 13.063, 17.500, 21.969, 25.220, 27.429])
        }),
        EffectivenessPercent: Object.freeze({
            non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
            non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
            non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
            reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
            reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
            reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
        }),
        EffectResistancePercent: Object.freeze({
            non_reforged_value: Object.freeze([8, 11, 14, 17, 18, 19]),
            non_reforged_min_value: Object.freeze([3, 5, 8, 11, 13, 14]),
            non_reforged_score: Object.freeze([8.000, 11.000, 14.000, 17.000, 18.000, 19.000]),
            reforged_value: Object.freeze([9, 14, 18, 22, 25, 27]),
            reforged_min_value: Object.freeze([4, 8, 12, 16, 20, 22]),
            reforged_score: Object.freeze([9.000, 14.000, 18.000, 22.000, 25.000, 27.000])
        })
    })
});

const ITEM_GEAR_MAPPING = Object.freeze({ 'Necklace': 'Neck', 'Helmet': 'Helm', 'Boots': 'Boot' });

const STAT_DISPLAY_MAPPING = Object.freeze({
    'Attack': 'Atk', 'AttackPercent': 'Atk %',
    'CriticalHitChancePercent': 'CC %', 'CriticalHitDamagePercent': 'CD %',
    'Defense': 'Def', 'DefensePercent': 'Def %',
    'EffectivenessPercent': 'EFF %', 'EffectResistancePercent': 'ER %',
    'Health': 'Hp', 'HealthPercent': 'Hp %', 'Speed': 'Speed'
});

module.exports = {
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
    HEROIC_PHANTOM_SUBSTAT_ROLLS,
    ITEM_SUBSTAT_STAT_WEIGHTS,
    SUBSTAT_ROLL_RANGES,
    ITEM_REFORGE_TABLES,
    ITEM_REFORGE_STAT_MAP,
    NECKLACE_RING_SHARED_MODS,
    ITEM_MODIFICATION_ROLL_RANGES,
    ITEM_GEAR_MAPPING,
    STAT_DISPLAY_MAPPING,
};

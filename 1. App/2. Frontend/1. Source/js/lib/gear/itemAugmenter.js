/* global Reforge */

const { v4: uuidv4 } = require('uuid');
const ArchetypeScorer = require('../scoring/archetypeScorer');

function fixProblemItem(item) {
    let fixNeeded = false;

    if (item.enhance >= 12 && item.substats.length < 4) {
        fixNeeded = true;
    } else if (item.enhance >= 9 && item.substats.length < 3) {
        fixNeeded = true;
    } else if (item.enhance >= 6 && item.substats.length < 2) {
        fixNeeded = true;
    } else if (item.enhance >= 3 && item.substats.length < 1) {
        fixNeeded = true;
    } else if (
        item.enhance === 0 &&
        item.rank !== 'Normal' &&
        item.substats.length === 0
    ) {
        fixNeeded = true;
    }

    if (fixNeeded) {
        item.level = 0;
    }
}

function augmentStats(item) {
    item.augmentedStats = {
        AttackPercent: 0,
        HealthPercent: 0,
        DefensePercent: 0,
        Attack: 0,
        Health: 0,
        Defense: 0,
        Speed: 0,
        CriticalHitChancePercent: 0,
        CriticalHitDamagePercent: 0,
        EffectivenessPercent: 0,
        EffectResistancePercent: 0,
    };
    item.augmentedStats.mainType = item.main.type;
    item.augmentedStats.mainValue = item.main.value;
    item.allowedMods = [
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
    ];

    item.allowedMods.splice(item.allowedMods.indexOf(item.main.type), 1);

    item.substats.forEach((subStat) => {
        item.augmentedStats[subStat.type] = subStat.value;

        if (!subStat.modified) {
            item.allowedMods.splice(item.allowedMods.indexOf(subStat.type), 1);
        }
    });

    if (item.gear === 'Weapon') {
        item.allowedMods.splice(item.allowedMods.indexOf('Defense'), 1);
        item.allowedMods.splice(item.allowedMods.indexOf('DefensePercent'), 1);
    }

    if (item.gear === 'Armor') {
        item.allowedMods.splice(item.allowedMods.indexOf('Attack'), 1);
        item.allowedMods.splice(item.allowedMods.indexOf('AttackPercent'), 1);
    }

    item.allowedMods = `|${item.allowedMods.join('|')}|`;
}

function augmentReforgeStats(item) {
    item.upgradeable = 0;
    item.reforgeable = 0;
    item.reforgedStats = {
        AttackPercent: 0,
        HealthPercent: 0,
        DefensePercent: 0,
        Attack: 0,
        Health: 0,
        Defense: 0,
        Speed: 0,
        CriticalHitChancePercent: 0,
        CriticalHitDamagePercent: 0,
        EffectivenessPercent: 0,
        EffectResistancePercent: 0,
    };

    if (Reforge.isReforgeable(item)) {
        item.reforgedStats.mainType = item.main.type;
        item.reforgedStats.mainValue = item.main.reforgedValue;

        item.substats.forEach((subStat) => {
            item.reforgedStats[subStat.type] = subStat.reforgedValue;
        });
        item.reforgeable = 1;
    } else {
        item.reforgedStats.mainType = item.main.type;
        item.reforgedStats.mainValue = item.main.value;

        item.substats.forEach((subStat) => {
            item.reforgedStats[subStat.type] = subStat.value;
        });

        item.reforgeable = 0;
    }

    if (item.reforgeable || item.enhance < 15) {
        item.upgradeable = 1;
    }
}

const ItemAugmenter = {
    // final
    augment: (items) => {
        items.forEach((item) => {
            if (!item) return;

            // Detect otherworldly from raw scan fields (present in scan .txt exports)
            if (!item.otherworldly) {
                if ((item.code && item.code.includes('_chaos')) ||
                    (item.mainStatId && item.mainStatId.startsWith('chaos_'))) {
                    item.otherworldly = true;
                }
            }

            fixProblemItem(item);
            Reforge.getReforgeStats(item);
            Reforge.augmentMaterial(item);
            augmentStats(item);
            augmentReforgeStats(item);

            if (!item.id) {
                item.id = uuidv4();
            }
        });

        // Score each item against all applicable archetypes
        ArchetypeScorer.scoreAllItems(items);
    },
};

export default ItemAugmenter;

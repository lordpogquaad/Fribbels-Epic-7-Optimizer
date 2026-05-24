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

function calculateScore(item, params, baseStats, reforge) {
    const stats = reforge ? item.reforgedStats : item.augmentedStats;

    const atkRolls =
        (stats.AttackPercent +
            mainTypeValue(stats, 'AttackPercent') +
            ((stats.Attack + mainTypeValue(stats, 'Attack')) / baseStats.atk) *
                100) /
        8;
    const hpRolls =
        (stats.HealthPercent +
            mainTypeValue(stats, 'HealthPercent') +
            ((stats.Health + mainTypeValue(stats, 'Health')) / baseStats.hp) *
                100) /
        8;
    const defRolls =
        (stats.DefensePercent +
            mainTypeValue(stats, 'DefensePercent') +
            ((stats.Defense + mainTypeValue(stats, 'Defense')) /
                baseStats.def) *
                100) /
        8;
    const spdRolls = (stats.Speed + mainTypeValue(stats, 'Speed')) / 4;
    const crRolls =
        (stats.CriticalHitChancePercent +
            mainTypeValue(stats, 'CriticalHitChancePercent')) /
        5;
    const cdRolls =
        (stats.CriticalHitDamagePercent +
            mainTypeValue(stats, 'CriticalHitDamagePercent')) /
        7;
    const effRolls =
        (stats.EffectivenessPercent +
            mainTypeValue(stats, 'EffectivenessPercent')) /
        8;
    const resRolls =
        (stats.EffectResistancePercent +
            mainTypeValue(stats, 'EffectResistancePercent')) /
        8;

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
}

function filterDisabled(params) {
    return params.inputFilterPriority === 100;
}

const PriorityFilter = {
    applyPriorityFilters: (
        params,
        items,
        baseStats,
        allItems,
        reforge,
        inputSubstatMods
    ) => {
        let passed = [];

        if (filterDisabled(params)) {
            return items;
        }

        const groups = groupBy(items, 'gear');
        const allItemsGroups = groupBy(allItems, 'gear');

        Object.keys(groups).forEach((key) => {
            const gearArr = groups[key];
            gearArr.forEach((gear) => {
                calculateScore(gear, params, baseStats, reforge);
            });

            gearArr.sort((a, b) => b.score - a.score);

            let groupLength = allItemsGroups[key].length;
            if (inputSubstatMods) {
                groupLength = Math.max(
                    groups[key].length,
                    allItemsGroups[key].length
                );
            }

            const index = Math.ceil(
                (params.inputFilterPriority / 100) * groupLength
            );
            passed = passed.concat(gearArr.slice(0, index));
        });

        return passed;
    },
};

export default PriorityFilter;

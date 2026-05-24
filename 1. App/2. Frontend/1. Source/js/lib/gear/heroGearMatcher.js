/* global HeroData */
/* eslint-disable no-console */

const HERO_MATCHER_STORAGE_KEY = 'heroMatcherConfigs';

let currentConfig = null;

function mainTypeValue(stats, statType) {
    if (statType === stats.mainType) {
        return stats.mainValue;
    }
    return 0;
}

function rawScoreItem(item, config, baseStats) {
    const stats = item.augmentedStats;
    if (!stats) return 0;

    const { priorities } = config;

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

    const rawScore =
        atkRolls * priorities.atk +
        hpRolls * priorities.hp +
        defRolls * priorities.def +
        spdRolls * priorities.spd +
        crRolls * priorities.cr +
        cdRolls * priorities.cd +
        effRolls * priorities.eff +
        resRolls * priorities.res;

    // Preferred main stat: 1.5x when item's main type is in the preferred list
    const prefMains = config.mainStatPreference[item.gear] || [];
    const mainBonus =
        prefMains.length > 0 && item.main && prefMains.includes(item.main.type)
            ? 1.5
            : 1.0;

    // Preferred set: 1.25x when item's set is in the preferred list
    const prefSets = config.setPreference || [];
    const setBonus =
        prefSets.length > 0 && prefSets.includes(item.set) ? 1.25 : 1.0;

    return (Number.isNaN(rawScore) ? 0 : rawScore) * mainBonus * setBonus;
}

const HeroGearMatcher = {
    setCurrentConfig(config) {
        currentConfig = config;
    },

    getCurrentConfig() {
        return currentConfig;
    },

    /**
     * Score all items relative to each other (highest = 100%).
     * Sets item.heroMatchPercent on each item, or deletes it if no config.
     */
    applyCurrentScores(items) {
        if (!currentConfig || !currentConfig.heroName) {
            items.forEach((item) => {
                delete item.heroMatchPercent;
            });
            return;
        }

        try {
            const heroBaseStatsObj = HeroData.getBaseStatsByName(
                currentConfig.heroName,
            );
            if (!heroBaseStatsObj) {
                items.forEach((item) => {
                    delete item.heroMatchPercent;
                });
                return;
            }

            const baseStats = heroBaseStatsObj.lv60SixStarFullyAwakened;
            const scores = items.map((item) =>
                rawScoreItem(item, currentConfig, baseStats),
            );
            const maxScore = Math.max(...scores, 0.001); // avoid div-by-zero

            items.forEach((item, i) => {
                item.heroMatchPercent = Math.round(
                    (scores[i] / maxScore) * 100,
                );
            });
        } catch (e) {
            console.error('HeroGearMatcher scoring error', e);
        }
    },

    loadConfig(heroName) {
        try {
            const all = JSON.parse(
                localStorage.getItem(HERO_MATCHER_STORAGE_KEY) || '{}',
            );
            return all[heroName] || null;
        } catch (e) {
            return null;
        }
    },

    saveConfig(heroName, config) {
        try {
            const all = JSON.parse(
                localStorage.getItem(HERO_MATCHER_STORAGE_KEY) || '{}',
            );
            all[heroName] = config;
            localStorage.setItem(
                HERO_MATCHER_STORAGE_KEY,
                JSON.stringify(all),
            );
        } catch (e) {
            // ignore storage errors
        }
    },

    getDefaultConfig() {
        return {
            heroName: '',
            priorities: {
                atk: 0,
                hp: 0,
                def: 0,
                spd: 0,
                cr: 0,
                cd: 0,
                eff: 0,
                res: 0,
            },
            mainStatPreference: {
                necklace: [],
                ring: [],
                boots: [],
            },
            setPreference: [],
        };
    },
};

export default HeroGearMatcher;

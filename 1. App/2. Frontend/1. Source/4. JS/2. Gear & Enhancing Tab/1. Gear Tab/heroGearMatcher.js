/* global HeroData, Notifier */

import ROLL_DIVISORS from '../../1. Optimizer & Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/rollDivisors.js';

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
      ((stats.Attack + mainTypeValue(stats, 'Attack')) / baseStats.atk) * 100) /
    ROLL_DIVISORS.AttackPercent;
  const hpRolls =
    (stats.HealthPercent +
      mainTypeValue(stats, 'HealthPercent') +
      ((stats.Health + mainTypeValue(stats, 'Health')) / baseStats.hp) * 100) /
    ROLL_DIVISORS.HealthPercent;
  const defRolls =
    (stats.DefensePercent +
      mainTypeValue(stats, 'DefensePercent') +
      ((stats.Defense + mainTypeValue(stats, 'Defense')) / baseStats.def) *
        100) /
    ROLL_DIVISORS.DefensePercent;
  const spdRolls =
    (stats.Speed + mainTypeValue(stats, 'Speed')) / ROLL_DIVISORS.Speed;
  const crRolls =
    (stats.CriticalHitChancePercent +
      mainTypeValue(stats, 'CriticalHitChancePercent')) /
    ROLL_DIVISORS.CriticalHitChancePercent;
  const cdRolls =
    (stats.CriticalHitDamagePercent +
      mainTypeValue(stats, 'CriticalHitDamagePercent')) /
    ROLL_DIVISORS.CriticalHitDamagePercent;
  const effRolls =
    (stats.EffectivenessPercent +
      mainTypeValue(stats, 'EffectivenessPercent')) /
    ROLL_DIVISORS.EffectivenessPercent;
  const resRolls =
    (stats.EffectResistancePercent +
      mainTypeValue(stats, 'EffectResistancePercent')) /
    ROLL_DIVISORS.EffectResistancePercent;

  const rawScore =
    atkRolls * priorities.atk +
    hpRolls * priorities.hp +
    defRolls * priorities.def +
    spdRolls * priorities.spd +
    crRolls * priorities.cr +
    cdRolls * priorities.cd +
    effRolls * priorities.eff +
    resRolls * priorities.res;

  // Preferred main stat: 1.5x when item's main type is in the preferred list.
  // Config keys are lowercase (necklace/ring/boots); item.gear is PascalCase — normalize.
  const prefMains = config.mainStatPreference[item.gear?.toLowerCase()] || [];
  const mainBonus =
    prefMains.length > 0 && item.main && prefMains.includes(item.main.type)
      ? 1.5
      : 1;

  // Preferred set: 1.25x when item's set is in the preferred list
  const prefSets = config.setPreference || [];
  const setBonus =
    prefSets.length > 0 && prefSets.includes(item.set) ? 1.25 : 1;

  return (!Number.isFinite(rawScore) ? 0 : rawScore) * mainBonus * setBonus;
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
    if (!currentConfig?.heroName) {
      items.forEach((item) => {
        delete item.heroMatchPercent;
      });
      return;
    }

    try {
      const heroBaseStatsObj = HeroData.getBaseStatsByName(
        currentConfig.heroName.replace(/\s#\d+$/, ''),
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
      const maxScore = scores.reduce((m, v) => (v > m ? v : m), 0.001); // reduce avoids stack overflow on large inventories

      items.forEach((item, i) => {
        item.heroMatchPercent = Math.round((scores[i] / maxScore) * 100);
      });
    } catch (e) {
      Log.error('HeroGearMatcher scoring error', e);
    }
  },

  loadConfig(heroName) {
    try {
      const all = JSON.parse(
        localStorage.getItem(HERO_MATCHER_STORAGE_KEY) || '{}',
      );
      return all[heroName] || null;
    } catch (e) {
      Log.error('HeroGearMatcher loadConfig error', e);
      return null;
    }
  },

  saveConfig(heroName, config) {
    try {
      const all = JSON.parse(
        localStorage.getItem(HERO_MATCHER_STORAGE_KEY) || '{}',
      );
      all[heroName] = config;
      localStorage.setItem(HERO_MATCHER_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      Log.error('HeroGearMatcher saveConfig error', e);
      if (e.name === 'QuotaExceededError' && typeof Notifier !== 'undefined') {
        Notifier.warn(
          'Hero matcher config could not be saved — browser storage is full.',
        );
      }
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

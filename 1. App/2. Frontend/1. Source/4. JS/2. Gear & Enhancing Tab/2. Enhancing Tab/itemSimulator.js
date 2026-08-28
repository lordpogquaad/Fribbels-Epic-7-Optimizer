/* global Reforge */

import FlatStatCalibration from '../3. Gear/flatStatCalibration.js';

const n = 25000;

function possibleSubstatsByGear(item, substatTypes) {
  const { gear } = item;
  // Each pool excludes the slot's main-stat type and any already-rolled substat
  // types (substatTypes) — E7 gear can't have duplicate substats, nor a substat
  // matching the main stat.
  return {
    Weapon: [
      'AttackPercent',
      'Health',
      'HealthPercent',
      'Speed',
      'CriticalHitChancePercent',
      'CriticalHitDamagePercent',
      'EffectivenessPercent',
      'EffectResistancePercent',
    ].filter((x) => x !== item.main.type && !substatTypes.includes(x)),
    Helmet: [
      'Attack',
      'AttackPercent',
      'Defense',
      'DefensePercent',
      'HealthPercent',
      'Speed',
      'CriticalHitChancePercent',
      'CriticalHitDamagePercent',
      'EffectivenessPercent',
      'EffectResistancePercent',
    ].filter((x) => x !== item.main.type && !substatTypes.includes(x)),
    Armor: [
      'DefensePercent',
      'Health',
      'HealthPercent',
      'Speed',
      'CriticalHitChancePercent',
      'CriticalHitDamagePercent',
      'EffectivenessPercent',
      'EffectResistancePercent',
    ].filter((x) => x !== item.main.type && !substatTypes.includes(x)),
    Necklace: [
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
    ].filter((x) => x !== item.main.type && !substatTypes.includes(x)),
    Ring: [
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
    ].filter((x) => x !== item.main.type && !substatTypes.includes(x)),
    Boots: [
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
    ].filter((x) => x !== item.main.type && !substatTypes.includes(x)),
  }[gear];
}

function getUnlockIndex(grade, j) {
  // Returns the substat index unlocked at enhancement level j, or -1 if none
  const unlockMap = {
    Heroic: { 12: 3 },
    Rare: { 9: 2, 12: 3 },
    Good: { 6: 1, 9: 2, 12: 3 },
    Normal: { 3: 0, 6: 1, 9: 2, 12: 3 },
  };
  const map = unlockMap[grade];
  return map ? (map[j] ?? -1) : -1;
}

function getUnlockedCount(grade, j) {
  if (grade === 'Heroic') return 3;
  if (grade === 'Rare') return j < 9 ? 2 : 3;
  if (grade === 'Good') {
    if (j < 6) return 1;
    if (j < 9) return 2;
    return 3;
  }
  return 4; // Normal (unlock steps handled separately)
}

function pickSubstat(substats, grade, j) {
  const unlockIndex = getUnlockIndex(grade, j);
  if (unlockIndex !== -1) return substats[unlockIndex];

  // Enhancement roll: only select from already-unlocked substats
  return substats[Math.floor(Math.random() * getUnlockedCount(grade, j))];
}

const potentialGsByRolls = {
  0: 9,
  1: 14,
  2: 18,
  3: 22,
  4: 25,
  5: 27,
};

const substatGroupByType = {
  Attack: 'Flat',
  AttackPercent: 'Default',
  Defense: 'Flat',
  DefensePercent: 'Default',
  Health: 'Flat',
  HealthPercent: 'Default',
  Speed: 'Speed',
  CriticalHitChancePercent: 'CriticalHitChancePercent',
  CriticalHitDamagePercent: 'CriticalHitDamagePercent',
  EffectivenessPercent: 'Default',
  EffectResistancePercent: 'Default',
};
const plainStats = new Set([
  'AttackPercent',
  'DefensePercent',
  'HealthPercent',
  'EffectivenessPercent',
  'EffectResistancePercent',
]);
function valueFromProbabilities(probs) {
  const sum = Object.values(probs).reduce((acc, x) => acc + x, 0);
  const rand = Math.random() * sum;
  let value = Object.keys(probs)[0];
  let cumulative = 0;

  Object.entries(probs).some(([key, val]) => {
    if (rand >= cumulative) {
      cumulative += val;
      value = key;
      return false;
    }
    return true;
  });
  return Number.parseInt(value, 10);
}

let substatWeights = {
  AttackPercent: 1,
  DefensePercent: 1,
  HealthPercent: 1,
  EffectivenessPercent: 1,
  EffectResistancePercent: 1,
  Attack: 7 / FlatStatCalibration.getWeights().atk,
  Health: 7 / FlatStatCalibration.getWeights().hp,
  Defense: 7 / FlatStatCalibration.getWeights().def,
  CriticalHitDamagePercent: 9 / 8, // 7 base max + 1 reforge → 8; normalize to % max (9): 9/8
  CriticalHitChancePercent: 9 / 6, // 5 base max + 1 reforge → 6; normalize to % max (9): 9/6
  Speed: 8 / 4, // fallback for ≥1 reforge roll; rolls===0 uses 2.5 dynamically
};

globalThis.addEventListener('flatStatCalibrationChanged', () => {
  const w = FlatStatCalibration.getWeights();
  substatWeights.Attack = 7 / w.atk;
  substatWeights.Health = 7 / w.hp;
  substatWeights.Defense = 7 / w.def;
});

const plainStatRollsToValue = {
  1: 1,
  2: 3,
  3: 4,
  4: 5,
  5: 7,
  6: 8,
};

const critDamageRollsToValue = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 6,
  6: 7,
};

const speedRollsToValue = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 4,
};

const flatRollsByTier = {
  88: {
    Attack: {
      Epic: [37, 53],
      Heroic: [36, 50],
      Rare: [34, 48],
    },
    Defense: {
      Epic: [32, 40],
      Heroic: [30, 38],
      Rare: [28, 36],
    },
    Health: {
      Epic: [178, 229],
      Heroic: [169, 218],
      Rare: [160, 206],
    },
  },
  85: {
    Attack: {
      Epic: [33, 46],
      Heroic: [31, 44],
      Rare: [29, 42],
    },
    Defense: {
      Epic: [28, 35],
      Heroic: [26, 33],
      Rare: [25, 31],
    },
    Health: {
      Epic: [157, 202],
      Heroic: [149, 192],
      Rare: [141, 182],
    },
  },
  71: {
    Attack: {
      Epic: [28, 40],
      Heroic: [27, 38],
      Rare: [25, 36],
    },
    Defense: {
      Epic: [24, 30],
      Heroic: [22, 28],
      Rare: [21, 27],
    },
    Health: {
      Epic: [136, 175],
      Heroic: [129, 166],
      Rare: [122, 157],
    },
  },
};

const percentProbabilitiesByTier = {
  88: {
    Default: {
      Epic: {
        5: 0.2,
        6: 0.2,
        7: 0.2,
        8: 0.2,
        9: 0.2,
      },
      Heroic: {
        5: 0.2,
        6: 0.2,
        7: 0.2,
        8: 0.2,
        9: 0.2,
      },
      Rare: {
        5: 0.4,
        6: 0.2,
        7: 0.2,
        8: 0.2,
      },
    },
    Speed: {
      Epic: {
        3: 0.49751,
        4: 0.49751,
        5: 0.00498,
      },
      Heroic: {
        2: 0.08333,
        3: 0.52083,
        4: 0.39583,
      },
      Rare: {
        3: 0.17033,
        4: 0.54945,
        5: 0.28022,
      },
    },
    CriticalHitDamagePercent: {
      Epic: {
        4: 0.2,
        5: 0.2,
        6: 0.2,
        7: 0.2,
        8: 0.2,
      },
      Heroic: {
        4: 0.2,
        5: 0.2,
        6: 0.2,
        7: 0.2,
        8: 0.2,
      },
      Rare: {
        4: 0.2,
        5: 0.4,
        6: 0.2,
        7: 0.2,
      },
    },
    CriticalHitChancePercent: {
      Epic: {
        3: 0.25,
        4: 0.25,
        5: 0.25,
        6: 0.25,
      },
      Heroic: {
        3: 0.25,
        4: 0.25,
        5: 0.25,
        6: 0.25,
      },
      Rare: {
        3: 0.25,
        4: 0.25,
        5: 0.5,
      },
    },
  },
  85: {
    Default: {
      Epic: {
        4: 0.2,
        5: 0.2,
        6: 0.2,
        7: 0.2,
        8: 0.2,
      },
      Heroic: {
        4: 0.2,
        5: 0.2,
        6: 0.2,
        7: 0.2,
        8: 0.2,
      },
      Rare: {
        4: 0.2,
        5: 0.4,
        6: 0.2,
        7: 0.2,
      },
    },
    Speed: {
      Epic: {
        2: 0.33223,
        3: 0.33223,
        4: 0.33223,
        5: 0.00332,
      },
      Heroic: {
        1: 0.03833,
        2: 0.34843,
        3: 0.34843,
        4: 0.26481,
      },
      Rare: {
        1: 0.07721,
        2: 0.36765,
        3: 0.36765,
        4: 0.1875,
      },
    },
    CriticalHitDamagePercent: {
      Epic: {
        4: 0.25,
        5: 0.25,
        6: 0.25,
        7: 0.25,
      },
      Heroic: {
        4: 0.25,
        5: 0.25,
        6: 0.25,
        7: 0.25,
      },
      Rare: {
        4: 0.25,
        5: 0.5,
        6: 0.25,
      },
    },
    CriticalHitChancePercent: {
      Epic: {
        3: 0.33333,
        4: 0.33333,
        5: 0.33333,
      },
      Heroic: {
        3: 0.33333,
        4: 0.33333,
        5: 0.33333,
      },
      Rare: {
        3: 0.33333,
        4: 0.33333,
        5: 0.33333,
      },
    },
  },
  71: {
    Default: {
      Epic: {
        4: 0.25,
        5: 0.25,
        6: 0.25,
        7: 0.25,
      },
      Heroic: {
        4: 0.25,
        5: 0.25,
        6: 0.25,
        7: 0.25,
      },
      Rare: {
        4: 0.25,
        5: 0.5,
        6: 0.25,
      },
    },
    Speed: {
      Epic: {
        2: 0.49751,
        3: 0.49751,
        4: 0.00498,
      },
      Heroic: {
        1: 0.05729,
        2: 0.52083,
        3: 0.42188,
      },
      Rare: {
        1: 0.11538,
        2: 0.54945,
        3: 0.33516,
      },
    },
    CriticalHitDamagePercent: {
      Epic: {
        3: 0.25,
        4: 0.25,
        5: 0.25,
        6: 0.25,
      },
      Heroic: {
        3: 0.25,
        4: 0.25,
        5: 0.25,
        6: 0.25,
      },
      Rare: {
        3: 0.25,
        4: 0.25,
        5: 0.5,
      },
    },
    CriticalHitChancePercent: {
      Epic: {
        2: 0.33333,
        3: 0.33333,
        4: 0.33333,
      },
      Heroic: {
        2: 0.33333,
        3: 0.33333,
        4: 0.33333,
      },
      Rare: {
        2: 0.33333,
        3: 0.33333,
        4: 0.33333,
      },
    },
  },
};

// Otherworldly gear enhancement probabilities (+3 through +15).
// Enhance 0 (base drop) uses normal tier-85 Epic probabilities above.
const otherworldlyEnhanceProbabilities = {
  Default: {
    7: 0.5,
    8: 0.5,
  },
  Speed: {
    3: 0.4925,
    4: 0.5025,
    5: 0.005,
  },
  CriticalHitDamagePercent: {
    6: 0.5,
    7: 0.5,
  },
  CriticalHitChancePercent: {
    4: 0.5,
    5: 0.5,
  },
};

const ItemSimulator = {
  initialize: () => {},

  getSimulationN: () => {
    return n;
  },

  simulate: (item) => {
    const reforgeable = Reforge.isReforgeable(item);
    const isOtherworldly = !!item.otherworldly;

    let tier = 85;
    if (item.level === 88) {
      tier = 88;
    }
    if (item.level < 72) {
      tier = 71;
    }
    if (isOtherworldly) {
      tier = 85;
    }

    let grade = 'Rare';
    if (item.rank === 'Epic') {
      grade = 'Epic';
    }
    if (item.rank === 'Heroic') {
      grade = 'Heroic';
    }

    const baseSubstats = item.substats;
    const gsArr = [];
    const moddedGsArr = [];

    Array.from({ length: n }).forEach(() => {
      const substatTypeArr = []; // reset each iteration so rolled types don't bleed across simulations
      const substats = [];
      Array.from({ length: 4 }).forEach((_, j) => {
        if (baseSubstats[j]) {
          substats[j] = {
            type: baseSubstats[j].type,
            rolls: baseSubstats[j].rolls,
            value: baseSubstats[j].value,
          };
          substatTypeArr[j] = baseSubstats[j].type;
        } else {
          const possibleSubstats = possibleSubstatsByGear(item, substatTypeArr);
          // Otherworldly gear has no flat substats (Attack, Defense, Health)
          const availableSubstats = isOtherworldly
            ? possibleSubstats.filter((s) => substatGroupByType[s] !== 'Flat')
            : possibleSubstats;
          const randomSubstat =
            availableSubstats[
              Math.floor(Math.random() * availableSubstats.length)
            ];
          substats[j] = {
            type: randomSubstat,
            rolls: 0,
            value: 0,
          };
          substatTypeArr[j] = randomSubstat;
        }
      });

      let j = Math.floor(item.enhance / 3) * 3;
      while (j < 15) {
        const substat = pickSubstat(substats, grade, j);
        const group = substatGroupByType[substat.type];

        if (isOtherworldly) {
          // All 5 enhancement rolls use otherworldly-specific probabilities
          const probs = otherworldlyEnhanceProbabilities[group];
          const value = valueFromProbabilities(probs);
          substat.value += value;
          substat.rolls += 1;
        } else if (group === 'Flat') {
          const range = flatRollsByTier[tier][substat.type][grade];
          const value =
            Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
          substat.value += value;
          substat.rolls += 1;
        } else {
          // Standard (non-otherworldly) gear: percent / crit / speed substats
          // roll from the per-tier probability tables.
          const probs = percentProbabilitiesByTier[tier][group][grade];
          const value = valueFromProbabilities(probs);
          substat.value += value;
          substat.rolls += 1;
        }

        j += 3;
      }

      let gs = 0;
      const applyReforgeBonus = (substat) => {
        const plain = plainStats.has(substat.type);
        if (plain) substat.value += plainStatRollsToValue[substat.rolls];

        const reforgeMap = {
          CriticalHitChancePercent: substat.rolls,
          CriticalHitDamagePercent: critDamageRollsToValue[substat.rolls],
          Attack: 11 * substat.rolls,
          Defense: 9 * substat.rolls,
          Health: 56 * substat.rolls,
          Speed: speedRollsToValue[substat.rolls],
        };
        if (reforgeMap[substat.type] !== undefined) {
          substat.value += reforgeMap[substat.type];
        }
      };

      substats.forEach((substat) => {
        if (reforgeable) {
          applyReforgeBonus(substat);
        }

        substat.gs =
          (substat.type === 'Speed' && substat.rolls === 0
            ? 2.5
            : substatWeights[substat.type]) * substat.value;
        substat.potentialGs = potentialGsByRolls[substat.rolls - 1];

        gs += substat.gs;
      });

      let maxGsDiff = 0;
      let maxGsDiffIndex = 0;
      substats.forEach((substat, substatIndex) => {
        const diff =
          substat.potentialGs - substatWeights[substat.type] * substat.value;
        if (diff > maxGsDiff) {
          maxGsDiff = diff;
          maxGsDiffIndex = substatIndex;
        }
      });

      let moddedGs = 0;
      if (maxGsDiff > 0) {
        substats.forEach((substat, substatIndex) => {
          if (substatIndex === maxGsDiffIndex) {
            moddedGs += substat.potentialGs;
          } else {
            moddedGs += substat.gs;
          }
        });
      } else {
        moddedGs = gs;
      }

      gsArr.push(Math.round(gs));
      moddedGsArr.push(Math.round(moddedGs));
    });

    return {
      gsArr,
      moddedGsArr,
    };
  },
};

export default ItemSimulator;

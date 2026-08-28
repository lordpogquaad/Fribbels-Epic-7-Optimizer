const plainStats = [
  'AttackPercent',
  'DefensePercent',
  'HealthPercent',
  'EffectivenessPercent',
  'EffectResistancePercent',
];

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

const maxRollsByRank = {
  Epic: 9,
  Heroic: 8,
  Rare: 7,
  Good: 6,
  Normal: 5,
};

export default {
  plainStats,
  plainStatRollsToValue,
  critDamageRollsToValue,
  speedRollsToValue,
  maxRollsByRank,
};

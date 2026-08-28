const gearEnum = {
  Weapon: 'Weapon',
  Helmet: 'Helmet',
  Armor: 'Armor',
  Necklace: 'Necklace',
  Ring: 'Ring',
  Boots: 'Boots',
};

// Declaration order = game set index (0-based).
// constants.js derives setsByIndex via Object.values(setEnum) — keep in sync
// with piecesBySetIndex there when adding new sets.
const setEnum = {
  HEALTH: 'HealthSet',
  DEFENSE: 'DefenseSet',
  ATTACK: 'AttackSet',
  SPEED: 'SpeedSet',
  CRIT: 'CriticalSet',
  HIT: 'HitSet',
  DESTRUCTION: 'DestructionSet',
  LIFESTEAL: 'LifestealSet',
  COUNTER: 'CounterSet',
  RESIST: 'ResistSet',
  UNITY: 'UnitySet',
  RAGE: 'RageSet',
  IMMUNITY: 'ImmunitySet',
  PENETRATION: 'PenetrationSet',
  REVENGE: 'RevengeSet',
  INJURY: 'InjurySet',
  PROTECTION: 'ProtectionSet',
  TORRENT: 'TorrentSet',
  REVERSAL: 'ReversalSet',
  RIPOSTE: 'RiposteSet',
  WARFARE: 'WarfareSet',
  PURSUIT: 'PursuitSet',
  FERVOR: 'FervorSet',
  WEAKENING: 'WeakeningSet',
};

const rankEnum = {
  NORMAL: 'Normal',
  GOOD: 'Good',
  RARE: 'Rare',
  HEROIC: 'Heroic',
  EPIC: 'Epic',
};

const statEnum = {
  FLATATK: 'flatatk',
  FLATHP: 'flathp',
  FLATDEF: 'flatdef',
  ATK: 'atk',
  HP: 'hp',
  DEF: 'def',
  CR: 'cr',
  CD: 'cd',
  EFF: 'eff',
  RES: 'res',
  SPD: 'spd',
};

export {
  gearEnum as Gears,
  setEnum as Sets,
  rankEnum as Ranks,
  statEnum as Stats,
};

/* global Utils, Notifier, i18next */
import reforgeConstants from './reforgeConstants';
const {
  plainStats,
  plainStatRollsToValue,
  critDamageRollsToValue,
  speedRollsToValue,
  maxRollsByRank,
} = reforgeConstants;

const mainStatValuesByStatType = {
  Attack: 525,
  Health: 2835,
  Defense: 310,
  CriticalHitDamagePercent: 70,
  CriticalHitChancePercent: 60,
  HealthPercent: 65,
  DefensePercent: 65,
  AttackPercent: 65,
  EffectivenessPercent: 65,
  EffectResistancePercent: 65,
  Speed: 45,
};

// Level 88 Epic +15 main stat values. Only Attack (525→515) and Health
// (2835→2765) differ from the level-85 table above; Defense (310) and the
// %/Speed mains are identical at both levels.
const mainStatValuesByStatTypeLevel88 = {
  Attack: 515,
  Health: 2765,
  Defense: 310,
  CriticalHitDamagePercent: 70,
  CriticalHitChancePercent: 60,
  HealthPercent: 65,
  DefensePercent: 65,
  AttackPercent: 65,
  EffectivenessPercent: 65,
  EffectResistancePercent: 65,
  Speed: 45,
};

const powers = {
  Normal: 0.8,
  Good: 0.85,
  Rare: 0.9,
  Heroic: 0.95,
  Epic: 1,
};

const modifiers = {
  Health: {
    min: 3.5,
    max: 2.25,
  },
  Attack: {
    min: 2.37,
    max: 1.67,
  },
  Defense: {
    min: 4,
    max: 2.5,
  },
};

const flatsByLevel = {
  88: {
    Health: {
      min: 51,
      max: 102,
    },
    Attack: {
      min: 16,
      max: 32,
    },
    Defense: {
      min: 8,
      max: 16,
    },
  },
  85: {
    Health: {
      min: 45,
      max: 90,
    },
    Attack: {
      min: 14,
      max: 28,
    },
    Defense: {
      min: 7,
      max: 14,
    },
  },
};

const plainStatsByLevel = {
  88: {
    Plain: {
      min: 5,
      max: 9,
    },
    CriticalHitChancePercent: {
      min: 3,
      max: 6,
    },
    CriticalHitDamagePercent: {
      min: 4,
      max: 8,
    },
    Speed: {
      min: 3,
      max: 5,
    },
  },
  85: {
    Plain: {
      min: 4,
      max: 8,
    },
    CriticalHitChancePercent: {
      min: 3,
      max: 5,
    },
    CriticalHitDamagePercent: {
      min: 4,
      max: 7,
    },
    Speed: {
      min: 1,
      max: 4,
    },
  },
};

const conversionNameByGear = {
  Weapon: 'Corinoa',
  Helmet: 'Elsquare',
  Armor: 'Corimescent',
  Necklace: 'Corselium',
  Ring: 'Seekers Ring',
  Boots: 'Practical Boots',
};

const nameBySetByGear = {
  Weapon: {
    HealthSet: 'Dark Steel Saber',
    DefenseSet: 'Dark Steel Saber',
    AttackSet: 'Dark Steel Saber',
    ProtectionSet: 'Dark Steel Saber',
    SpeedSet: 'Abyss Drake Bonesword',
    CriticalSet: 'Abyss Drake Bonesword',
    HitSet: 'Abyss Drake Bonesword',
    DestructionSet: 'Hellish Essence Orb',
    LifestealSet: 'Hellish Essence Orb',
    CounterSet: 'Hellish Essence Orb',
    ResistSet: 'Hellish Essence Orb',
    UnitySet: 'Indomitable Spider Mace',
    RageSet: 'Indomitable Spider Mace',
    ImmunitySet: 'Indomitable Spider Mace',
    RevengeSet: 'Demons Cursed Double Edged Sword',
    InjurySet: 'Demons Cursed Double Edged Sword',
    PenetrationSet: 'Demons Cursed Double Edged Sword',
    TorrentSet: 'Demons Cursed Double Edged Sword',
    ReversalSet:  'Bow of Agony',
    RiposteSet:   'Bow of Agony',
    WarfareSet:   'Bow of Agony',
    PursuitSet:   'Bow of Agony',
    FervorSet:    'Bow of Agony',
    WeakeningSet: 'Bow of Agony',
  },
  Helmet: {
    HealthSet: 'Dark Steel Helm',
    DefenseSet: 'Dark Steel Helm',
    AttackSet: 'Dark Steel Helm',
    ProtectionSet: 'Dark Steel Helm',
    SpeedSet: 'Abyss Drake Mask',
    CriticalSet: 'Abyss Drake Mask',
    HitSet: 'Abyss Drake Mask',
    DestructionSet: 'Hellish Essence Crown',
    LifestealSet: 'Hellish Essence Crown',
    CounterSet: 'Hellish Essence Crown',
    ResistSet: 'Hellish Essence Crown',
    UnitySet: 'Indomitable Spider Helm',
    RageSet: 'Indomitable Spider Helm',
    ImmunitySet: 'Indomitable Spider Helm',
    RevengeSet: "Demon's Cursed Horned Helm",
    InjurySet: "Demon's Cursed Horned Helm",
    PenetrationSet: "Demon's Cursed Horned Helm",
    TorrentSet: "Demon's Cursed Horned Helm",
    ReversalSet:  'Helmet of Agony',
    RiposteSet:   'Helmet of Agony',
    WarfareSet:   'Helmet of Agony',
    PursuitSet:   'Helmet of Agony',
    FervorSet:    'Helmet of Agony',
    WeakeningSet: 'Helmet of Agony',
  },
  Armor: {
    HealthSet: 'Dark Steel Armor',
    DefenseSet: 'Dark Steel Armor',
    AttackSet: 'Dark Steel Armor',
    ProtectionSet: 'Dark Steel Armor',
    SpeedSet: 'Abyss Drake Hide Tunic',
    CriticalSet: 'Abyss Drake Hide Tunic',
    HitSet: 'Abyss Drake Hide Tunic',
    DestructionSet: 'Hellish Essence Robe',
    LifestealSet: 'Hellish Essence Robe',
    CounterSet: 'Hellish Essence Robe',
    ResistSet: 'Hellish Essence Robe',
    UnitySet: 'Indomitable Spider Breastplate',
    RageSet: 'Indomitable Spider Breastplate',
    ImmunitySet: 'Indomitable Spider Breastplate',
    RevengeSet: 'Demons Cursed Heavy Armor',
    InjurySet: 'Demons Cursed Heavy Armor',
    PenetrationSet: 'Demons Cursed Heavy Armor',
    TorrentSet: 'Demons Cursed Heavy Armor',
    ReversalSet:  'Armor of Agony',
    RiposteSet:   'Armor of Agony',
    WarfareSet:   'Armor of Agony',
    PursuitSet:   'Armor of Agony',
    FervorSet:    'Armor of Agony',
    WeakeningSet: 'Armor of Agony',
  },
  Necklace: {
    HealthSet: 'Dark Steel Warmer',
    DefenseSet: 'Dark Steel Warmer',
    AttackSet: 'Dark Steel Warmer',
    ProtectionSet: 'Dark Steel Warmer',
    SpeedSet: 'Abyss Blade Necklace',
    CriticalSet: 'Abyss Blade Necklace',
    HitSet: 'Abyss Blade Necklace',
    DestructionSet: 'Obsidian Amulet',
    LifestealSet: 'Obsidian Amulet',
    CounterSet: 'Obsidian Amulet',
    ResistSet: 'Obsidian Amulet',
    UnitySet: 'Indomitable Spider Pendant',
    RageSet: 'Indomitable Spider Pendant',
    ImmunitySet: 'Indomitable Spider Pendant',
    RevengeSet: 'Demons Cursed Necklace',
    InjurySet: 'Demons Cursed Necklace',
    PenetrationSet: 'Demons Cursed Necklace',
    TorrentSet: 'Demons Cursed Necklace',
    ReversalSet:  'Shackles of Agony',
    RiposteSet:   'Shackles of Agony',
    WarfareSet:   'Restraints of Agony',
    PursuitSet:   'Restraints of Agony',
    FervorSet:    'Restraints of Agony',
    WeakeningSet: 'Restraints of Agony',
  },
  Ring: {
    HealthSet: 'Dark Steel Gauntlet',
    DefenseSet: 'Dark Steel Gauntlet',
    AttackSet: 'Dark Steel Gauntlet',
    ProtectionSet: 'Dark Steel Gauntlet',
    SpeedSet: 'Awakened Dragon Gem',
    CriticalSet: 'Awakened Dragon Gem',
    HitSet: 'Awakened Dragon Gem',
    DestructionSet: 'Obsidian Ring',
    LifestealSet: 'Obsidian Ring',
    CounterSet: 'Obsidian Ring',
    ResistSet: 'Obsidian Ring',
    UnitySet: 'Indomitable Spider Ring',
    RageSet: 'Indomitable Spider Ring',
    ImmunitySet: 'Indomitable Spider Ring',
    RevengeSet: 'Demons Cursed Ring',
    InjurySet: 'Demons Cursed Ring',
    PenetrationSet: 'Demons Cursed Ring',
    TorrentSet: 'Demons Cursed Ring',
    ReversalSet:  'Ring of Agony',
    RiposteSet:   'Ring of Agony',
    WarfareSet:   'Ring of Agony',
    PursuitSet:   'Ring of Agony',
    FervorSet:    'Ring of Agony',
    WeakeningSet: 'Ring of Agony',
  },
  Boots: {
    HealthSet: 'Dark Steel Boots',
    DefenseSet: 'Dark Steel Boots',
    AttackSet: 'Dark Steel Boots',
    ProtectionSet: 'Dark Steel Boots',
    SpeedSet: 'Abyss Drake Boots',
    CriticalSet: 'Abyss Drake Boots',
    HitSet: 'Abyss Drake Boots',
    DestructionSet: 'Hellish Essence Treads',
    LifestealSet: 'Hellish Essence Treads',
    CounterSet: 'Hellish Essence Treads',
    ResistSet: 'Hellish Essence Treads',
    UnitySet: 'Indomitable Spider Boots',
    RageSet: 'Indomitable Spider Boots',
    ImmunitySet: 'Indomitable Spider Boots',
    RevengeSet: 'Demons Cursed Fine Boots',
    InjurySet: 'Demons Cursed Fine Boots',
    PenetrationSet: 'Demons Cursed Fine Boots',
    TorrentSet: 'Demons Cursed Fine Boots',
    ReversalSet:  'Boots of Agony',
    RiposteSet:   'Boots of Agony',
    WarfareSet:   'Boots of Agony',
    PursuitSet:   'Boots of Agony',
    FervorSet:    'Boots of Agony',
    WeakeningSet: 'Boots of Agony',
  },
};

const reforgedNameBySetByGear = {
  Weapon: {
    HealthSet: 'Dark Saber',
    DefenseSet: 'Dark Saber',
    AttackSet: 'Dark Saber',
    ProtectionSet: 'Dark Saber',
    SpeedSet: 'Ancient Drake Bonesword',
    CriticalSet: 'Ancient Drake Bonesword',
    HitSet: 'Ancient Drake Bonesword',
    DestructionSet: 'Twilight Essence Orb',
    LifestealSet: 'Twilight Essence Orb',
    CounterSet: 'Twilight Essence Orb',
    ResistSet: 'Twilight Essence Orb',
    UnitySet: "Origin Spider Queen's Mace",
    RageSet: "Origin Spider Queen's Mace",
    ImmunitySet: "Origin Spider Queen's Mace",
    RevengeSet: "Dark Soul's Double-Edged Sword",
    InjurySet: "Dark Soul's Double-Edged Sword",
    PenetrationSet: "Dark Soul's Double-Edged Sword",
    TorrentSet: "Dark Soul's Double-Edged Sword",
    ReversalSet:  'Bow of Grudges',
    RiposteSet:   'Bow of Grudges',
    WarfareSet:   'Bow of Grudges',
    PursuitSet:   'Bow of Grudges',
    FervorSet:    'Bow of Grudges',
    WeakeningSet: 'Bow of Grudges',
  },
  Helmet: {
    HealthSet: 'Dark Helm',
    DefenseSet: 'Dark Helm',
    AttackSet: 'Dark Helm',
    ProtectionSet: 'Dark Helm',
    SpeedSet: 'Ancient Drake Mask',
    CriticalSet: 'Ancient Drake Mask',
    HitSet: 'Ancient Drake Mask',
    DestructionSet: 'Twilight Essence Crown',
    LifestealSet: 'Twilight Essence Crown',
    CounterSet: 'Twilight Essence Crown',
    ResistSet: 'Twilight Essence Crown',
    UnitySet: "Queen Origin Spider's Helm",
    RageSet: "Queen Origin Spider's Helm",
    ImmunitySet: "Queen Origin Spider's Helm",
    RevengeSet: "Dark Soul's Horned Helm",
    InjurySet: "Dark Soul's Horned Helm",
    PenetrationSet: "Dark Soul's Horned Helm",
    TorrentSet: "Dark Soul's Horned Helm",
    ReversalSet:  'Helmet of Grudges',
    RiposteSet:   'Helmet of Grudges',
    WarfareSet:   'Helmet of Grudges',
    PursuitSet:   'Helmet of Grudges',
    FervorSet:    'Helmet of Grudges',
    WeakeningSet: 'Helmet of Grudges',
  },
  Armor: {
    HealthSet: 'Dark Armor',
    DefenseSet: 'Dark Armor',
    AttackSet: 'Dark Armor',
    ProtectionSet: 'Dark Armor',
    SpeedSet: 'Ancient Drake Leather Tunic',
    CriticalSet: 'Ancient Drake Leather Tunic',
    HitSet: 'Ancient Drake Leather Tunic',
    DestructionSet: 'Twilight Essence Robe',
    LifestealSet: 'Twilight Essence Robe',
    CounterSet: 'Twilight Essence Robe',
    ResistSet: 'Twilight Essence Robe',
    UnitySet: "Origin Spider Queen's Breastplate",
    RageSet: "Origin Spider Queen's Breastplate",
    ImmunitySet: "Origin Spider Queen's Breastplate",
    RevengeSet: "Dark Soul's Heavy Armor",
    InjurySet: "Dark Soul's Heavy Armor",
    PenetrationSet: "Dark Soul's Heavy Armor",
    TorrentSet: "Dark Soul's Heavy Armor",
    ReversalSet:  'Armor of Grudges',
    RiposteSet:   'Armor of Grudges',
    WarfareSet:   'Armor of Grudges',
    PursuitSet:   'Armor of Grudges',
    FervorSet:    'Armor of Grudges',
    WeakeningSet: 'Armor of Grudges',
  },
  Necklace: {
    HealthSet: 'Dark Warmer',
    DefenseSet: 'Dark Warmer',
    AttackSet: 'Dark Warmer',
    ProtectionSet: 'Dark Warmer',
    SpeedSet: 'Dark Abyss Necklace',
    CriticalSet: 'Dark Abyss Necklace',
    HitSet: 'Dark Abyss Necklace',
    DestructionSet: 'Bloodstone Amulet',
    LifestealSet: 'Bloodstone Amulet',
    CounterSet: 'Bloodstone Amulet',
    ResistSet: 'Bloodstone Amulet',
    UnitySet: "Origin Spider Queen's Pendant",
    RageSet: "Origin Spider Queen's Pendant",
    ImmunitySet: "Origin Spider Queen's Pendant",
    RevengeSet: "Dark Soul's Necklace",
    InjurySet: "Dark Soul's Necklace",
    PenetrationSet: "Dark Soul's Necklace",
    TorrentSet: "Dark Soul's Necklace",
    ReversalSet:  'Shackles of Grudges',
    RiposteSet:   'Shackles of Grudges',
    WarfareSet:   'Cross of Grudges',
    PursuitSet:   'Cross of Grudges',
    FervorSet:    'Cross of Grudges',
    WeakeningSet: 'Cross of Grudges',
  },
  Ring: {
    HealthSet: 'Dark Gauntlet',
    DefenseSet: 'Dark Gauntlet',
    AttackSet: 'Dark Gauntlet',
    ProtectionSet: 'Dark Gauntlet',
    SpeedSet: 'Dark Red Dragon Gem',
    CriticalSet: 'Dark Red Dragon Gem',
    HitSet: 'Dark Red Dragon Gem',
    DestructionSet: 'Bloodstone Ring',
    LifestealSet: 'Bloodstone Ring',
    CounterSet: 'Bloodstone Ring',
    ResistSet: 'Bloodstone Ring',
    UnitySet: "Origin Spider Queen's Ring",
    RageSet: "Origin Spider Queen's Ring",
    ImmunitySet: "Origin Spider Queen's Ring",
    RevengeSet: "Dark Soul's Ring",
    InjurySet: "Dark Soul's Ring",
    PenetrationSet: "Dark Soul's Ring",
    TorrentSet: "Dark Soul's Ring",
    ReversalSet:  'Ring of Grudges',
    RiposteSet:   'Ring of Grudges',
    WarfareSet:   'Curse of Grudges',
    PursuitSet:   'Curse of Grudges',
    FervorSet:    'Curse of Grudges',
    WeakeningSet: 'Curse of Grudges',
  },
  Boots: {
    HealthSet: 'Dark Boots',
    DefenseSet: 'Dark Boots',
    AttackSet: 'Dark Boots',
    ProtectionSet: 'Dark Boots',
    SpeedSet: 'Ancient Drake Boots',
    CriticalSet: 'Ancient Drake Boots',
    HitSet: 'Ancient Drake Boots',
    DestructionSet: 'Twilight Essence Treads',
    LifestealSet: 'Twilight Essence Treads',
    CounterSet: 'Twilight Essence Treads',
    ResistSet: 'Twilight Essence Treads',
    UnitySet: "Origin Spider Queen's Boots",
    RageSet: "Origin Spider Queen's Boots",
    ImmunitySet: "Origin Spider Queen's Boots",
    RevengeSet: "Dark Soul's Fine Boots",
    InjurySet: "Dark Soul's Fine Boots",
    PenetrationSet: "Dark Soul's Fine Boots",
    TorrentSet: "Dark Soul's Fine Boots",
    ReversalSet:  'Boots of Grudges',
    RiposteSet:   'Boots of Grudges',
    WarfareSet:   'Boots of Grudges',
    PursuitSet:   'Boots of Grudges',
    FervorSet:    'Boots of Grudges',
    WeakeningSet: 'Boots of Grudges',
  },
};

function isGaveleets(gear) {
  if (!gear?.name) {
    return false;
  }

  return (
    Utils.stringDistance("Gaveleet's", gear.name) > 0.45 && gear.level === 85
  );
}

function isReforgeable(gear) {
  return gear.level === 85 && !isGaveleets(gear);
}

function isReforgeableNow(gear) {
  return gear.level === 85 && gear.enhance === 15 && !isGaveleets(gear);
}

function getMaxRolls(rank, enhance) {
  if (enhance === 15) {
    return maxRollsByRank[rank];
  }
  if (enhance >= 12) {
    return maxRollsByRank[rank] - 1;
  }
  if (enhance >= 9) {
    return maxRollsByRank[rank] - 2;
  }
  if (enhance >= 6) {
    return maxRollsByRank[rank] - 3;
  }
  if (enhance >= 3) {
    return maxRollsByRank[rank] - 4;
  }
  return maxRollsByRank[rank] - 5;
}

function calculateReforgeValues(substat) {
  if (plainStats.includes(substat.type)) {
    substat.reforgedValue =
      substat.value + (plainStatRollsToValue[substat.rolls] ?? 0);
  } else if (substat.type === 'CriticalHitChancePercent') {
    substat.reforgedValue = substat.value + (substat.rolls ?? 0);
  } else if (substat.type === 'CriticalHitDamagePercent') {
    substat.reforgedValue =
      substat.value + (critDamageRollsToValue[substat.rolls] ?? 0);
  } else if (substat.type === 'Attack') {
    substat.reforgedValue = substat.value + 11 * (substat.rolls ?? 0);
  } else if (substat.type === 'Defense') {
    substat.reforgedValue = substat.value + 9 * (substat.rolls ?? 0);
  } else if (substat.type === 'Health') {
    substat.reforgedValue = substat.value + 56 * (substat.rolls ?? 0);
  } else if (substat.type === 'Speed') {
    substat.reforgedValue = substat.value + (speedRollsToValue[substat.rolls] ?? 0);
  }
}

function calculateReforgeValuesTypeValueAndRolls(
  gaveleets,
  type,
  value,
  rolls,
  level,
) {
  if (level !== 85 && level !== 90) {
    return value;
  }

  if (gaveleets) {
    return value;
  }

  if (plainStats.includes(type)) {
    return value + (plainStatRollsToValue[rolls] ?? 0);
  } else if (type === 'CriticalHitChancePercent') {
    return value + (rolls ?? 0);
  } else if (type === 'CriticalHitDamagePercent') {
    return value + (critDamageRollsToValue[rolls] ?? 0);
  } else if (type === 'Attack') {
    return value + 11 * (rolls ?? 0);
  } else if (type === 'Defense') {
    return value + 9 * (rolls ?? 0);
  } else if (type === 'Health') {
    return value + 56 * (rolls ?? 0);
  } else if (type === 'Speed') {
    return value + (speedRollsToValue[rolls] ?? 0);
  }
  return value; // unknown type: return original value unchanged
}

// We can get reforged stats of non +15 gear however
function getItemReforgedStats(gear) {
  let mainValue = gear.main.value;
  if (isReforgeable(gear)) {
    mainValue = mainStatValuesByStatType[gear.main.type];
  } else if (gear.level === 88) {
    mainValue = mainStatValuesByStatTypeLevel88[gear.main.type] ?? gear.main.value;
  }

  if (gear.alreadyPredictedReforge) {
    return;
  }

  if (!gear.substats) {
    Notifier.error(
      i18next.t('Cannot calculate reforged stats. Find the item and fix it: ') +
        JSON.stringify(gear),
    );
    return;
  }

  gear.main.reforgedValue = mainValue;

  calculateSubstatRollBounds(gear);
  applyEnhanceRollCaps(gear);
  calculateMissingRolls(gear);
  applyReforgeValues(gear);
}

function calculateSubstatRollBounds(gear) {
  gear.substats.forEach((substat) => {
    calculateSingleSubstatRollBounds(substat, gear.level);
  });
}

function calculateSingleSubstatRollBounds(substat, gearLevel) {
  const { value, type } = substat;
  const is88 = gearLevel === 88;

  if (plainStats.includes(type)) {
    applyPlainStatRollBounds(substat, value, is88);
    return;
  }

  const statCalculators = {
    CriticalHitChancePercent: () =>
      applyCritChanceRollBounds(substat, value, is88),
    CriticalHitDamagePercent: () =>
      applyCritDamageRollBounds(substat, value, is88),
    Attack: () => applyFlatStatRollBounds(substat, value, is88 ? 45 : 39),
    Defense: () => applyFlatStatRollBounds(substat, value, is88 ? 36 : 31),
    Health: () => applyFlatStatRollBounds(substat, value, is88 ? 203 : 174),
    Speed: () => applySpeedRollBounds(substat, value, is88),
  };

  const calculator = statCalculators[type];
  if (calculator) {
    calculator();
  }
}

function applyPlainStatRollBounds(substat, value, is88) {
  substat.max = Math.floor(value / (is88 ? 5 : 4));
  substat.min = Math.ceil(value / (is88 ? 9 : 8));
  substat.multi = is88 ? 7 : 6;
}

function applyCritChanceRollBounds(substat, value, is88) {
  substat.max = Math.floor(value / 3);
  substat.min = Math.ceil(value / (is88 ? 6 : 5));
  substat.multi = is88 ? 4.5 : 4;
}

function applyCritDamageRollBounds(substat, value, is88) {
  substat.max = Math.floor(value / 4);
  substat.min = Math.ceil(value / (is88 ? 8 : 7));
  substat.multi = is88 ? 6 : 5.5;
}

function applyFlatStatRollBounds(substat, value, multi) {
  substat.max = Math.round(value / multi);
  substat.min = substat.max;
  substat.multi = multi;
}

function applySpeedRollBounds(substat, value, is88) {
  substat.max = Math.round(value / 2);
  substat.min = Math.ceil(value / (is88 ? 5 : 4));
  substat.multi = is88 ? 3.5 : 3;
}

function applyEnhanceRollCaps(gear) {
  const capsConfig = getEnhanceRollCapsConfig(gear.enhance);
  if (!capsConfig) return;

  const { maxRollValue, substatsToCapByRank } = capsConfig;
  const substatsToCapIndexes = substatsToCapByRank[gear.rank] || [];

  substatsToCapIndexes.forEach((index) => {
    if (gear.substats[index]) {
      gear.substats[index].max = Math.min(
        maxRollValue,
        gear.substats[index].max,
      );
    }
  });
}

function getEnhanceRollCapsConfig(enhance) {
  if (enhance === 15) {
    return {
      maxRollValue: 2,
      substatsToCapByRank: {
        Heroic: [3],
        Rare: [2, 3],
        Good: [1, 2, 3],
        Normal: [0, 1, 2, 3],
      },
    };
  }
  if (enhance >= 12) {
    return {
      maxRollValue: 1,
      substatsToCapByRank: {
        Heroic: [3],
        Rare: [2, 3],
        Good: [1, 2, 3],
        Normal: [0, 1, 2, 3],
      },
    };
  }
  if (enhance >= 9) {
    return {
      maxRollValue: 1,
      substatsToCapByRank: {
        Rare: [2],
        Good: [1, 2],
        Normal: [0, 1, 2],
      },
    };
  }
  if (enhance >= 6) {
    return {
      maxRollValue: 1,
      substatsToCapByRank: {
        Good: [1],
        Normal: [0, 1],
      },
    };
  }
  if (enhance >= 3) {
    return {
      maxRollValue: 1,
      substatsToCapByRank: {
        Normal: [0],
      },
    };
  }
  return null;
}

function calculateMissingRolls(gear) {
  let rolls = 0;
  gear.substats.forEach((substat) => {
    substat.scaledDiff = 0;
    if (substat.rolls == null) {
      substat.rolls = substat.min;
    }
    rolls += substat.rolls;
  });

  const maxRolls = getMaxRolls(gear.rank, gear.enhance);

  if (rolls !== maxRolls) {
    const missingRolls = maxRolls - rolls;

    Array.from({ length: missingRolls }).forEach(() => {
      gear.substats.forEach((substat) => {
        if (substat.rolls + 1 > substat.max) {
          substat.minExpectedValue = 0;
          substat.scaledDiff = 0;
          return;
        }

        const { value } = substat;
        substat.minExpectedValue = substat.rolls * substat.multi;
        substat.scaledDiff = (value - substat.minExpectedValue) / substat.multi;
      });

      const maxSubstat = gear.substats.reduce((prev, curr) =>
        prev.scaledDiff > curr.scaledDiff ? prev : curr,
      );
      maxSubstat.rolls += 1;
      maxSubstat.bonus = true;
    });
  }
}

function applyReforgeValues(gear) {
  if (isReforgeable(gear)) {
    gear.substats.forEach((substat) => {
      calculateReforgeValues(substat);
    });
  } else {
    gear.substats.forEach((substat) => {
      substat.reforgedValue = substat.value;
    });
  }
}

const Reforge = {
  initialize: () => {},

  getReforgeStats: (gear) => {
    getItemReforgedStats(gear);
  },

  isGaveleets,
  isReforgeable,
  isReforgeableNow,

  augmentMaterial: (gear) => {
    gear.convertable = 0;
    if (!gear?.gear || !gear.set) return;
    const { name } = gear;

    if (!name || name.length < 2) {
      return;
    }

    const huntNameBySet =
      gear.level === 90
        ? reforgedNameBySetByGear[gear.gear]
        : nameBySetByGear[gear.gear];

    const huntName = huntNameBySet[gear.set];
    if (!huntName) {
      gear.material = 'Unknown';
      return;
    }
    const conversionName = conversionNameByGear[gear.gear];

    const huntDistance = Utils.stringDistance(name, huntName);
    const conversionDistance = Utils.stringDistance(name, conversionName);

    if (conversionDistance > huntDistance && conversionDistance > 0.85) {
      gear.material = 'Conversion';
      gear.mconfidence = `${Math.round(
        100 * Utils.stringDistance(name, conversionName),
      )}`;
      gear.convertable = 1;
    } else if (huntDistance > conversionDistance && huntDistance > 0.85) {
      gear.material = 'Hunt';
      gear.mconfidence = `${Math.round(
        100 * Utils.stringDistance(name, huntName),
      )}`;
    } else {
      gear.material = 'Unknown';
    }
  },

  unreforgeItem: (gear) => {
    const { substats } = gear;

    if (gear.level === 90) {
      substats.forEach((substat) => {
        const statTypeChanged = plainStats.includes(substat.type)
          ? 'Plain'
          : substat.type;

        if (statTypeChanged === 'Plain') {
          const added = plainStatRollsToValue[substat.rolls] ?? 0;
          substat.unreforgedValue = substat.value - added;
        } else if (substat.type === 'CriticalHitChancePercent') {
          const added = substat.rolls ?? 0;
          substat.unreforgedValue = substat.value - added;
        } else if (substat.type === 'CriticalHitDamagePercent') {
          const added = critDamageRollsToValue[substat.rolls] ?? 0;
          substat.unreforgedValue = substat.value - added;
        } else if (substat.type === 'Attack') {
          const added = 11 * (substat.rolls ?? 0);
          substat.unreforgedValue = substat.value - added;
        } else if (substat.type === 'Defense') {
          const added = 9 * (substat.rolls ?? 0);
          substat.unreforgedValue = substat.value - added;
        } else if (substat.type === 'Health') {
          const added = 56 * (substat.rolls ?? 0);
          substat.unreforgedValue = substat.value - added;
        } else if (substat.type === 'Speed') {
          const added = speedRollsToValue[substat.rolls] ?? 0;
          substat.unreforgedValue = substat.value - added;
        }
      });
    }

    const power = powers[gear.rank];
    const flats = flatsByLevel[gear.level === 88 ? 88 : 85];
    const statRanges = plainStatsByLevel[gear.level === 88 ? 88 : 85];

    substats.forEach((substat) => {
      const statTypeChanged = plainStats.includes(substat.type)
        ? 'Plain'
        : substat.type;

      if (gear.level !== 90) {
        substat.unreforgedValue = substat.value;
      }

      if (statTypeChanged === 'Plain') {
        substat.unreforgedMin = substat.rolls * statRanges.Plain.min;
        substat.unreforgedMax = substat.rolls * statRanges.Plain.max;
      }
      if (substat.type === 'CriticalHitChancePercent') {
        substat.unreforgedMin =
          substat.rolls * statRanges.CriticalHitChancePercent.min;
        substat.unreforgedMax =
          substat.rolls * statRanges.CriticalHitChancePercent.max;
      }
      if (substat.type === 'CriticalHitDamagePercent') {
        substat.unreforgedMin =
          substat.rolls * statRanges.CriticalHitDamagePercent.min;
        substat.unreforgedMax =
          substat.rolls * statRanges.CriticalHitDamagePercent.max;
      }
      if (substat.type === 'Attack') {
        substat.unreforgedMin =
          substat.rolls * flats.Attack.min * modifiers.Attack.min * power;
        substat.unreforgedMax =
          substat.rolls * flats.Attack.max * modifiers.Attack.max * power;
      }
      if (substat.type === 'Defense') {
        substat.unreforgedMin =
          substat.rolls * flats.Defense.min * modifiers.Defense.min * power;
        substat.unreforgedMax =
          substat.rolls * flats.Defense.max * modifiers.Defense.max * power;
      }
      if (substat.type === 'Health') {
        substat.unreforgedMin =
          substat.rolls * flats.Health.min * modifiers.Health.min * power;
        substat.unreforgedMax =
          substat.rolls * flats.Health.max * modifiers.Health.max * power;
      }
      if (substat.type === 'Speed') {
        substat.unreforgedMin = substat.rolls * statRanges.Speed.min;
        substat.unreforgedMax = substat.rolls * statRanges.Speed.max;
      }
    });
  },
  calculateMaxes: (gear) => {
    getItemReforgedStats(gear);

    /*
            min   max   t1   t2   t3   t4   t5  t6  t7
max_hp      3.5   2.25  0.6  0.7  0.8  0.9  1   1   1
att         2.37  1.67  0.6  0.7  0.8  0.9  1   1   1
def         4     2.5   0.6  0.7  0.8  0.9  1   1   1

grade  power
1      0.8
2      0.85
3      0.9
4      0.95
5      1.0
6      9.99

// 88 FLAT
// HP 51 - 102
// ATT 16 - 32
// DEF 8 - 16

// 85 FLAT
// HP 45 - 90
// DEF 7 - 14
// ATT 14 - 28

Reforge
hp + 56
def + 9
atk + 11

min atk = 2.37 * 14 * 1 = 33.18
min hp = 3.5 * 45 * 1 = 157.5
min def = 4 * 7 * 1 = 28

max atk = 1.67 * 28 * 1 = 46.76
max hp = 2.25 * 90 * 1 = 202.5
max def = 2.5 * 14 * 1 = 35

11/9/56
346.56
1551
264

prereforge 85
atk range: 33 - 46
def range: 28 - 35
hp range: 157 - 202

postreforge 90
atk range: 44 - 57
def range: 37 - 44
hp range: 213 - 258

90s

min atk = 2.37 * 16 * 1 = 37.92
min hp = 3.5 * 51 * 1 = 178.5
min def = 4 * 8 * 1 = 32

max atk = 1.67 * 32 * 1 = 53.44
max hp = 2.25 * 102 * 1 = 229.5
max def = 2.5 * 16 * 1 = 40

90s
atk range: 37 - 53 (45)
def range: 32 - 40 (36)
hp range: 178 - 229 (203.5)

*/

    const { substats } = gear;
    const power = powers[gear.rank];
    const flats = flatsByLevel[gear.level === 88 ? 88 : 85];
    const statRanges = plainStatsByLevel[gear.level === 88 ? 88 : 85];

    substats.forEach((substat) => {
      const statTypeChanged = plainStats.includes(substat.type)
        ? 'Plain'
        : substat.type;

      if (statTypeChanged === 'Plain') {
        substat.min = substat.rolls * statRanges.Plain.min;
        substat.max = substat.rolls * statRanges.Plain.max;
      }
      if (substat.type === 'CriticalHitChancePercent') {
        substat.min = substat.rolls * statRanges.CriticalHitChancePercent.min;
        substat.max = substat.rolls * statRanges.CriticalHitChancePercent.max;
      }
      if (substat.type === 'CriticalHitDamagePercent') {
        substat.min = substat.rolls * statRanges.CriticalHitDamagePercent.min;
        substat.max = substat.rolls * statRanges.CriticalHitDamagePercent.max;
      }
      if (substat.type === 'Attack') {
        substat.min =
          substat.rolls * flats.Attack.min * modifiers.Attack.min * power;
        substat.max =
          substat.rolls * flats.Attack.max * modifiers.Attack.max * power;
      }
      if (substat.type === 'Defense') {
        substat.min =
          substat.rolls * flats.Defense.min * modifiers.Defense.min * power;
        substat.max =
          substat.rolls * flats.Defense.max * modifiers.Defense.max * power;
      }
      if (substat.type === 'Health') {
        substat.min =
          substat.rolls * flats.Health.min * modifiers.Health.min * power;
        substat.max =
          substat.rolls * flats.Health.max * modifiers.Health.max * power;
      }
      if (substat.type === 'Speed') {
        substat.min = substat.rolls * statRanges.Speed.min;
        substat.max = substat.rolls * statRanges.Speed.max;

        if (substat.min === 1 && gear.rank === 'Epic') {
          substat.min = 2;
        }
      }

      const gaveleets = isGaveleets(gear);
      const reforgedMin = calculateReforgeValuesTypeValueAndRolls(
        gaveleets,
        substat.type,
        substat.min,
        substat.rolls,
        gear.level,
      );
      const reforgedMax = calculateReforgeValuesTypeValueAndRolls(
        gaveleets,
        substat.type,
        substat.max,
        substat.rolls,
        gear.level,
      );
      const reforgedValue = calculateReforgeValuesTypeValueAndRolls(
        gaveleets,
        substat.type,
        substat.value,
        substat.rolls,
        gear.level,
      );

      substat.reforgedMin = reforgedMin;
      substat.reforgedMax = reforgedMax;
      substat.reforgedValue = reforgedValue;

      const range = reforgedMax - reforgedMin;
      substat.potential = range === 0 ? 1 : (reforgedValue - reforgedMin) / range;
    });
  },
};

export default Reforge;

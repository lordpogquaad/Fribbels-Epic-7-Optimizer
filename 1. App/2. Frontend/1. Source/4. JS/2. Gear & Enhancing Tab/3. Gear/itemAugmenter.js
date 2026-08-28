/* global Reforge */

import { v4 as uuidv4 } from 'uuid';

// Maps raw game set keys (item.f) → internal set names.
// Mirrors setsByIngameSet in scanner.js — kept in sync so items scanned before
// a new set was added can have their set recovered on next augment/import.
const SET_KEY_TO_NAME = {
  set_acc:      'HitSet',
  set_att:      'AttackSet',
  set_coop:     'UnitySet',
  set_counter:  'CounterSet',
  set_cri_dmg:  'DestructionSet',
  set_cri:      'CriticalSet',
  set_def:      'DefenseSet',
  set_immune:   'ImmunitySet',
  set_max_hp:   'HealthSet',
  set_penetrate:'PenetrationSet',
  set_rage:     'RageSet',
  set_res:      'ResistSet',
  set_revenge:  'RevengeSet',
  set_scar:     'InjurySet',
  set_speed:    'SpeedSet',
  set_vampire:  'LifestealSet',
  set_shield:   'ProtectionSet',
  set_torrent:  'TorrentSet',
  set_revenant: 'ReversalSet',
  set_riposte:  'RiposteSet',
  set_chase:    'PursuitSet',
  set_opener:   'WarfareSet',
  set_might:    'FervorSet',
  set_weak:     'WeakeningSet',
};

const FLAT_OP_TYPES = new Set(['att', 'max_hp', 'def', 'speed']);

// For any unknown item where main.value === 0, recover it from op[0] × g.
// op[0][1] is the base unit; × g (grade, 5 = Epic) gives the +15 main stat.
// e.g. def_rate 0.12 × 5 × 100 = 60%  |  att 103 × 5 = 515  |  max_hp 540 × 5 = 2700
function tryFixMainStatFromOp(item) {
  if (!item.main || item.main.value !== 0) return;
  if (!Array.isArray(item.op?.[0])) return;

  const [opType, opBase] = item.op[0];
  const g = item.g || 1;
  const scaled = opBase * g;
  item.main.value = FLAT_OP_TYPES.has(opType)
    ? scaled
    : Math.round(scaled * 1000) / 10; // fraction → percent, e.g. 0.65 → 65
}

// Level 88 items with unknown IDs come from the Lambda with level=0.
// mg=311111 and level=0 identifies them — fix level and recover main stat.
function tryFixUnknownLevel88(item) {
  if (item.level !== 0 || item.name !== 'Unknown') return;
  if (!item.gear || !item.set || !item.rank) return;
  if (item.mg !== 311111) return;

  item.level = 88;
  Log.info('[ItemAugmenter] auto-fixed level=88 for unknown item', item.ingameId ?? item.id);
}

function fixProblemItem(item) {
  let fixNeeded = false;

  if (
    (item.enhance >= 12 && item.substats.length < 4) ||
    (item.enhance >= 9 && item.substats.length < 3) ||
    (item.enhance >= 6 && item.substats.length < 2) ||
    (item.enhance >= 3 && item.substats.length < 1) ||
    (item.enhance === 0 && item.rank !== 'Normal' && item.substats.length === 0)
  ) {
    fixNeeded = true;
  }

  if (fixNeeded) {
    Log.warn('[ItemAugmenter] fixProblemItem: zeroing level on item',
      item.id ?? item.ingameId,
      'gear:', item.gear, 'enhance:+', item.enhance,
      'substats:', item.substats?.length, 'rank:', item.rank,
    );
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

  const mainIdx = item.allowedMods.indexOf(item.main.type);
  if (mainIdx !== -1) item.allowedMods.splice(mainIdx, 1);

  item.substats.forEach((subStat) => {
    item.augmentedStats[subStat.type] = subStat.value;

    if (!subStat.modified) {
      const idx = item.allowedMods.indexOf(subStat.type);
      if (idx !== -1) item.allowedMods.splice(idx, 1);
    }
  });

  if (item.gear === 'Weapon') {
    const dIdx = item.allowedMods.indexOf('Defense');
    if (dIdx !== -1) item.allowedMods.splice(dIdx, 1);
    const dpIdx = item.allowedMods.indexOf('DefensePercent');
    if (dpIdx !== -1) item.allowedMods.splice(dpIdx, 1);
  }

  if (item.gear === 'Armor') {
    const aIdx = item.allowedMods.indexOf('Attack');
    if (aIdx !== -1) item.allowedMods.splice(aIdx, 1);
    const apIdx = item.allowedMods.indexOf('AttackPercent');
    if (apIdx !== -1) item.allowedMods.splice(apIdx, 1);
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
    // Fall back to the current value when a reforge prediction is missing.  A modded
    // substat with "use substat mods" off can have no reforgedValue, and writing
    // undefined into reforgedStats makes the reforged score render as NaN
    // (htmlGenerator.rateBaseScore sums these fields).
    item.reforgedStats.mainValue = item.main.reforgedValue ?? item.main.value;

    item.substats.forEach((subStat) => {
      item.reforgedStats[subStat.type] = subStat.reforgedValue ?? subStat.value;
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
    let fixedCount = 0;
    let otherworldlyCount = 0;
    let reforgeableCount = 0;
    let upgradeableCount = 0;

    items.forEach((item) => {
      if (!item) return;

      // Recover set name from raw game key (item.f) if set was missing when scanned
      if (!item.set && item.f && SET_KEY_TO_NAME[item.f]) {
        item.set = SET_KEY_TO_NAME[item.f];
      }

      // Detect otherworldly from raw scan fields (present in scan .txt exports)
      if (!item.otherworldly) {
        if (
          item.code?.includes('_chaos') ||
          item.mainStatId?.startsWith('chaos_')
        ) {
          item.otherworldly = true;
          otherworldlyCount++;
        }
      }

      tryFixUnknownLevel88(item);   // level=0 → 88 for unknown mg=311111 items
      tryFixMainStatFromOp(item);   // main.value=0 → op[0][1] × g for any item

      const levelBefore = item.level;
      fixProblemItem(item);
      if (item.level !== levelBefore) fixedCount++;

      Reforge.getReforgeStats(item);
      Reforge.augmentMaterial(item);
      augmentStats(item);
      augmentReforgeStats(item);

      if (item.reforgeable) reforgeableCount++;
      if (item.upgradeable) upgradeableCount++;

      if (!item.id) {
        item.id = uuidv4();
      }
    });

    const hasAugmentAnomaly = fixedCount > 0 || otherworldlyCount > 0;
    const logArgs = [
      '[ItemAugmenter] augment complete',
      'total:', items.length,
      'fixed(level→0):', fixedCount,
      'otherworldly:', otherworldlyCount,
      'reforgeable:', reforgeableCount,
      'upgradeable:', upgradeableCount,
    ];

    if (hasAugmentAnomaly) {
      Log.warn(...logArgs);
    } else if (items.length > 1) {
      Log.info(...logArgs);
    }
  },
};

export default ItemAugmenter;

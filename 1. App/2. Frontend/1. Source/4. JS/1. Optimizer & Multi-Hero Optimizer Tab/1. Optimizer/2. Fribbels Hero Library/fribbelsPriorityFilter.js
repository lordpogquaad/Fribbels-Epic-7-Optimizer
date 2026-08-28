import ROLL_DIVISORS from '../1. Optimizer/rollDivisors.js';

// ── Fixed left-side gear mains (Level 90 Epic +15) ───────────────────────────
export const GEAR_CONSTANTS = {
  WEAPON_ATK: 525,
  ARMOR_DEF: 310,
  HELM_HP: 2835,
};

// ── Set bonuses ───────────────────────────────────────────────────────────────

/**
 * Converts raw set piece counts into bonus values used to strip set contributions
 * from total stats. Speed/Revenge/Revenant bonuses are % of baseSpd (flat result).
 */
export function computeSetBonuses(sets, baseSpd) {
  const spd = baseSpd || 0;
  return {
    bonusSetMaxHp: 20 * Math.floor((sets.set_max_hp || 0) / 2), // +20% HP per 2pc
    bonusSetTorrent: -10 * Math.floor((sets.set_torrent || 0) / 2), // -10% HP per 2pc
    bonusSetAtt: (sets.set_att || 0) >= 4 ? 45 : 0, // +45% ATK 4pc
    bonusSetDef: 20 * Math.floor((sets.set_def || 0) / 2), // +20% DEF per 2pc
    bonusSetCri: 12 * Math.floor((sets.set_cri || 0) / 2), // +12 CR per 2pc
    bonusSetCriDmg: (sets.set_cri_dmg || 0) >= 4 ? 60 : 0, // +60 CD 4pc
    bonusSetAcc: 20 * Math.floor((sets.set_acc || 0) / 2), // +20 EFF per 2pc
    bonusSetRes: 20 * Math.floor((sets.set_res || 0) / 2), // +20 RES per 2pc
    bonusSetSpeed: (sets.set_speed || 0) >= 4 ? Math.floor(0.25 * spd) : 0,
    bonusSetRevenge: (sets.set_revenge || 0) >= 4 ? Math.floor(0.12 * spd) : 0,
    bonusSetRevenant:
      (sets.set_revenant || 0) >= 4 ? Math.floor(0.15 * spd) : 0,
    bonusSetWeak: (sets.set_weak || 0) >= 4 ? Math.floor(0.15 * spd) : 0, // +15% SPD 4pc
    // Fervor 2pc grants +20% damage, not a stat bonus — that term lives in
    // computeSkillValue's pctDmgMultiplier (fervorOn), not here.
    bonusSetMight: 0,
    bonusSetHero: 0, // Hero 2pc  — bonus TBD (unreleased)
    bonusSetOpener: (sets.set_opener || 0) >= 4 ? 20 : 0, // +20% HP 4pc
  };
}

// ── BS stats — pure gear contribution ────────────────────────────────────────

/**
 * Strips base stats, artifact stats, fixed left-side gear mains, and set bonuses
 * from raw build stats to isolate what substats + variable mains contributed.
 *
 * ATK/DEF/HP returned as % of base. SPD/CR/CD/EFF/RES returned as flat values.
 *
 * @param {object} row        - { hp, atk, def, chc, chd, eff, efr|res, spd }
 * @param {object} baseStats  - hero base stats (may include override fields)
 * @param {object} sets       - raw set piece counts
 * @param {object} [artiStats] - artifact contribution { atk, hp, def } (stat * 13)
 */
export function computeBsStats(row, baseStats, sets, artiStats) {
  const bonusStats = baseStats.bonusStats || {};

  const baseHp = baseStats.overrideHp || baseStats.hp || 0;
  const baseAtk = baseStats.overrideAtk || baseStats.atk || 0;
  const baseDef = baseStats.overrideDef || baseStats.def || 0;
  const baseSpd = (baseStats.spd || 0) + (baseStats.overrideAdditionalSpd || 0);

  const artiAtk = artiStats?.atk || 0;
  const artiHp = artiStats?.hp || 0;
  const artiDef = artiStats?.def || 0;

  const {
    bonusSetMaxHp,
    bonusSetTorrent,
    bonusSetAtt,
    bonusSetDef,
    bonusSetCri,
    bonusSetCriDmg,
    bonusSetAcc,
    bonusSetRes,
    bonusSetSpeed,
    bonusSetRevenge,
    bonusSetRevenant,
    bonusSetWeak,
    bonusSetOpener,
  } = computeSetBonuses(sets, baseSpd);

  const efr = row.efr !== undefined ? row.efr : row.res || 0;

  return {
    atk:
      ((row.atk -
        baseAtk -
        artiAtk -
        GEAR_CONSTANTS.WEAPON_ATK -
        (bonusSetAtt / 100) * baseAtk) /
        baseAtk) *
      100,
    def:
      ((row.def -
        baseDef -
        artiDef -
        GEAR_CONSTANTS.ARMOR_DEF -
        (bonusSetDef / 100) * baseDef) /
        baseDef) *
      100,
    hp:
      ((row.hp -
        baseHp -
        artiHp -
        GEAR_CONSTANTS.HELM_HP -
        (bonusSetMaxHp / 100) * baseHp -
        (bonusSetTorrent / 100) * baseHp -
        (bonusSetOpener / 100) * baseHp) /
        baseHp) *
      100,
    chc:
      Math.min(100, row.chc) -
      (baseStats.cr || 0) -
      (bonusStats.overrideAdditionalCr || 0) -
      bonusSetCri,
    chd:
      Math.min(350 + (row.cdCapBonus || 0), row.chd) -
      (baseStats.cd || 0) -
      (bonusStats.overrideAdditionalCd || 0) -
      bonusSetCriDmg,
    eff:
      row.eff -
      (baseStats.eff || 0) -
      (bonusStats.overrideAdditionalEff || 0) -
      bonusSetAcc,
    res:
      efr -
      (baseStats.res || 0) -
      (bonusStats.overrideAdditionalRes || 0) -
      bonusSetRes,
    spd:
      row.spd -
      baseSpd -
      bonusSetSpeed -
      bonusSetRevenge -
      bonusSetRevenant -
      bonusSetWeak,
  };
}

// ── BS score ──────────────────────────────────────────────────────────────────

/**
 * Weights match the Fribbels website: HP/ATK/DEF/EFF/RES×1, CR×1.6, CD×1.14, SPD×2.
 */
export function bsScore(bsStats) {
  return Math.floor(
    bsStats.hp +
      bsStats.atk +
      bsStats.def +
      bsStats.eff +
      bsStats.res +
      bsStats.chc * 1.6 +
      bsStats.chd * 1.14 +
      bsStats.spd * 2,
  );
}

// ── Build roll-count scoring ──────────────────────────────────────────────────

/**
 * Annotates a row with per-slot roll counts for each stat.
 *
 * gearStats (from computeBsStats) already holds the full variable gear contribution —
 * substats + whatever mains were on Neck/Ring/Boots — all converted to % or flat.
 * We don't know which main stats were on each piece, so we treat the total as-is
 * and divide by ROLL_DIVISORS (same divisors the optimizer uses per-piece).
 *
 * rolls = gearStat / ROLL_DIVISORS  →  per-slot = rolls / 6  →  priority = Math.round(per-slot)
 */
export function calculateBuildScore(row, baseStats, artiStats) {
  if (!baseStats) return;

  const gearStats = computeBsStats(row, baseStats, row.sets || {}, artiStats);

  row['atk (Rolls)'] = parseFloat(
    (gearStats.atk / ROLL_DIVISORS.AttackPercent / 6).toFixed(3),
  );
  row['def (Rolls)'] = parseFloat(
    (gearStats.def / ROLL_DIVISORS.DefensePercent / 6).toFixed(3),
  );
  row['hp (Rolls)'] = parseFloat(
    (gearStats.hp / ROLL_DIVISORS.HealthPercent / 6).toFixed(3),
  );
  row['spd (Rolls)'] = parseFloat(
    (gearStats.spd / ROLL_DIVISORS.Speed / 6).toFixed(3),
  );
  row['chc (Rolls)'] = parseFloat(
    (gearStats.chc / ROLL_DIVISORS.CriticalHitChancePercent / 6).toFixed(3),
  );
  row['chd (Rolls)'] = parseFloat(
    (gearStats.chd / ROLL_DIVISORS.CriticalHitDamagePercent / 6).toFixed(3),
  );
  row['eff (Rolls)'] = parseFloat(
    (gearStats.eff / ROLL_DIVISORS.EffectivenessPercent / 6).toFixed(3),
  );
  row['efr (Rolls)'] = parseFloat(
    (gearStats.res / ROLL_DIVISORS.EffectResistancePercent / 6).toFixed(3),
  );

  row.totalRolls = {
    atk: gearStats.atk / ROLL_DIVISORS.AttackPercent,
    def: gearStats.def / ROLL_DIVISORS.DefensePercent,
    hp: gearStats.hp / ROLL_DIVISORS.HealthPercent,
    spd: gearStats.spd / ROLL_DIVISORS.Speed,
    chc: gearStats.chc / ROLL_DIVISORS.CriticalHitChancePercent,
    chd: gearStats.chd / ROLL_DIVISORS.CriticalHitDamagePercent,
    eff: gearStats.eff / ROLL_DIVISORS.EffectivenessPercent,
    res: gearStats.res / ROLL_DIVISORS.EffectResistancePercent,
  };
}

// ── Priority mapping ──────────────────────────────────────────────────────────

export function computePrioritiesFromRow(row, baseStats, sets, artiStats) {
  const rowSets = sets || row.sets || {};
  const gearStats = computeBsStats(row, baseStats, rowSets, artiStats);

  const toPriority = (stat, divisor) =>
    Math.round(Math.min(6, Math.max(0, stat / divisor / 6)));

  return {
    atk: toPriority(gearStats.atk, ROLL_DIVISORS.AttackPercent),
    def: toPriority(gearStats.def, ROLL_DIVISORS.DefensePercent),
    hp: toPriority(gearStats.hp, ROLL_DIVISORS.HealthPercent),
    spd: toPriority(gearStats.spd, ROLL_DIVISORS.Speed),
    cr: toPriority(gearStats.chc, ROLL_DIVISORS.CriticalHitChancePercent),
    cd: toPriority(gearStats.chd, ROLL_DIVISORS.CriticalHitDamagePercent),
    eff: toPriority(gearStats.eff, ROLL_DIVISORS.EffectivenessPercent),
    res: toPriority(gearStats.res, ROLL_DIVISORS.EffectResistancePercent),
  };
}

// ── Skill damage ──────────────────────────────────────────────────────────────

export function computeSkillValue(
  mults,
  s,
  row,
  targetDef,
  rageSetEnabled,
  fervorSetEnabled,
) {
  if (mults?.targets[s] == null) return 0;

  const penSetOn = (row.sets?.set_penetrate || 0) >= 2 ? 1 : 0;
  const targets = mults.targets[s] === 1 ? 1 : 0;
  const critDamage = Math.min(row.chd, 350 + (row.cdCapBonus || 0)) / 100;
  const rageOn = rageSetEnabled && (row.sets?.set_rage || 0) >= 4 ? 0.3 : 0;
  const torrentBonus =
    (row.sets?.set_torrent || 0) >= 2
      ? Math.floor(row.sets.set_torrent / 2) * 0.1
      : 0;
  // Fervor 2pc: +20% damage on the next attack after an extra turn. Does not stack
  // (set_might is 0/1/2, never counted twice — matches the backend's sets[22] > 1).
  const fervorOn = fervorSetEnabled && (row.sets?.set_might || 0) >= 2 ? 0.2 : 0;
  const pctDmgMultiplier = 1 + rageOn + torrentBonus + fervorOn;

  const realPenetration =
    (1 - mults.penetration[s]) * (1 - penSetOn * 0.15 * targets);
  const statScalings =
    mults.selfHpScaling[s] * row.hp +
    mults.selfAtkScaling[s] * row.atk +
    mults.selfDefScaling[s] * row.def +
    mults.selfSpdScaling[s] * row.spd;
  const hitTypeMultis =
    mults.crit[s] * (critDamage + mults.cdmgIncrease[s]) + mults.hitMulti[s];
  const increasedValue = 1 + mults.increasedValue[s];
  const dmgUpMod = 1 + mults.selfSpdScaling[s] * row.spd;
  const extraDamage =
    ((mults.extraSelfHpScaling[s] * row.hp +
      mults.extraSelfAtkScaling[s] * row.atk +
      mults.extraSelfDefScaling[s] * row.def) *
      1.871) /
    ((targetDef * 0.3) / 300 + 1);
  const offensive =
    (row.atk * mults.rate[s] + statScalings) *
    1.871 *
    mults.pow[s] *
    increasedValue *
    hitTypeMultis *
    dmgUpMod *
    pctDmgMultiplier;
  const support =
    mults.selfHpScaling[s] * row.hp * mults.support[s] +
    mults.selfAtkScaling[s] * row.atk * mults.support[s] +
    mults.selfDefScaling[s] * row.def * mults.support[s];
  const defensive = 1 / ((targetDef * Math.max(0, realPenetration)) / 300 + 1);
  return Math.floor(offensive * defensive + support + extraDamage);
}

// ── Row stat derivation ───────────────────────────────────────────────────────

/**
 * Fills all derived combat columns on a row in-place.
 * Requires row.atk, def, hp, spd, chc, chd, sets to already be set.
 */
export function computeRowStats(
  row,
  mults,
  targetDef,
  rageSetEnabled,
  fervorSetEnabled,
) {
  const penMult = (row.sets?.set_penetrate || 0) >= 2 ? 1.14 : 1;
  const torrentMult = 1 + Math.floor((row.sets?.set_torrent || 0) / 2) * 0.1;
  const cr = Math.min(row.chc, 100) / 100;
  const cd = Math.min(row.chd, 350 + (row.cdCapBonus || 0)) / 100;

  row.ehp = Math.floor(row.hp * (row.def / 300 + 1));
  row.hps = Math.floor((row.hp * row.spd) / 1000);
  row.ehps = Math.floor((row.ehp * row.spd) / 1000);
  row.dmg = Math.floor(
    (cr * row.atk * cd + (1 - cr) * row.atk) * penMult * torrentMult,
  );
  row.dmgs = Math.floor((row.dmg * row.spd) / 1000);
  row.mcd = Math.floor(row.atk * cd) * penMult * torrentMult;
  row.mcds = Math.floor((row.mcd * row.spd) / 1000);
  row.dmgh = Math.floor(((cd * row.hp) / 10) * penMult * torrentMult); // max crit HP dmg
  row.dmgd = Math.floor(cd * row.def * penMult * torrentMult); // max crit DEF dmg
  row.hmcdmgs = Math.floor((row.dmgh * row.spd) / 1000); // dmgh per speed
  row.dmcdmgs = Math.floor((row.dmgd * row.spd) / 1000); // dmgd per speed
  row.hdmg = Math.floor(
    (((cr * row.hp) / 10) * cd + ((1 - cr) * row.hp) / 10) *
      penMult *
      torrentMult,
  ); // avg HP dmg
  row.hdmgs = Math.floor((row.hdmg * row.spd) / 1000);
  row.ddmg = Math.floor(
    (cr * row.def * cd + (1 - cr) * row.def) * penMult * torrentMult,
  ); // avg DEF dmg
  row.ddmgs = Math.floor((row.ddmg * row.spd) / 1000);
  row.s1 = computeSkillValue(
    mults,
    0,
    row,
    targetDef,
    rageSetEnabled,
    fervorSetEnabled,
  );
  row.s2 = computeSkillValue(
    mults,
    1,
    row,
    targetDef,
    rageSetEnabled,
    fervorSetEnabled,
  );
  row.s3 = computeSkillValue(
    mults,
    2,
    row,
    targetDef,
    rageSetEnabled,
    fervorSetEnabled,
  );
  return row;
}

// ── Summary statistics ────────────────────────────────────────────────────────

export function computeMedian(sorted) {
  if (!sorted.length) return 0;
  if (sorted.length % 2 === 1) return sorted[Math.floor(sorted.length / 2)];
  return Math.round(
    (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2,
  );
}

/**
 * @param {object[]} rows
 * @param {Array<[string, function]>} statDefs - [label, rowFn] pairs
 * @returns {Array<{label, avg, p50, min, max}>}
 */
export function computeStatSummary(rows, statDefs) {
  return statDefs.map(([label, fn]) => {
    const vals = rows.map(fn);
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const sorted = [...vals].sort((a, b) => a - b);
    return {
      label,
      avg,
      p50: computeMedian(sorted),
      min: sorted[0],
      max: sorted.at(-1),
    };
  });
}

// ── P50 row ───────────────────────────────────────────────────────────────────

export function computeP50Row(builds) {
  if (!builds || !builds.length) return null;
  const medRow = {};
  ['atk', 'def', 'hp', 'spd', 'chc', 'chd', 'eff', 'efr'].forEach((k) => {
    const vals = builds.map((r) => r[k] || 0).sort((a, b) => a - b);
    medRow[k] = computeMedian(vals);
  });
  return medRow;
}

// ── Default export ────────────────────────────────────────────────────────────

const FribbelsPriorityFilter = {
  GEAR_CONSTANTS,
  computeSetBonuses,
  computeBsStats,
  bsScore,
  calculateBuildScore,
  computePrioritiesFromRow,
  computeSkillValue,
  computeRowStats,
  computeMedian,
  computeStatSummary,
  computeP50Row,
};

export default FribbelsPriorityFilter;

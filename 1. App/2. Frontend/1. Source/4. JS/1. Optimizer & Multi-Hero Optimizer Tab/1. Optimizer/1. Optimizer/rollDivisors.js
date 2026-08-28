/**
 * Maximum possible substat value for each stat type on a single piece of
 * tier-90 Epic gear at +15 fully reforged.
 *
 * Used by:
 *   - optimizerTab.js  fast-reject ceiling checks (theoretical upper bound
 *                      per slot before scanning actual items)
 *   - enhancingTab.js  gear-score chart scaling
 *
 * Update these after any balance patch that changes substat roll ranges
 * or flat-stat reforge multipliers.
 */
export const GEAR_MAXES = {
  Attack: 342,
  AttackPercent: 56,
  Defense: 264,
  DefensePercent: 56,
  Health: 1548,
  HealthPercent: 56,
  Speed: 28,
  CriticalHitChancePercent: 36,
  CriticalHitDamagePercent: 49,
  EffectivenessPercent: 56,
  EffectResistancePercent: 56,
};

/**
 * Maximum main-stat value per variable slot at Level 90 Epic +15.
 * Weapon / Helmet / Armor have fixed mains and are absent here — those slots
 * contribute via substats only (capped by GEAR_MAXES).
 *
 * Values are always >= the corresponding GEAR_MAXES substat cap, so they serve
 * as the per-slot theoretical ceiling in fast-reject checks.
 *
 * Stat keys match GEAR_MAXES exactly so lookup is uniform:
 *   MAX_MAIN_BY_SLOT.Necklace?.CriticalHitChancePercent ?? GEAR_MAXES.CriticalHitChancePercent
 */
export const MAX_MAIN_BY_SLOT = {
  Necklace: {
    CriticalHitDamagePercent: 70,
    CriticalHitChancePercent: 60,
    AttackPercent: 65,
    DefensePercent: 65,
    HealthPercent: 65,
    Attack: 525,
    Defense: 310,
    Health: 2835,
  },
  Ring: {
    EffectivenessPercent: 65,
    EffectResistancePercent: 65,
    AttackPercent: 65,
    DefensePercent: 65,
    HealthPercent: 65,
    Attack: 525,
    Defense: 310,
    Health: 2835,
  },
  Boots: {
    Speed: 45,
    AttackPercent: 65,
    DefensePercent: 65,
    HealthPercent: 65,
    Attack: 525,
    Defense: 310,
    Health: 2835,
  },
};

/**
 * Canonical Epic Seven gear-set metadata — the SINGLE source of truth for set
 * order, piece-count, 4pc/2pc membership, and abbreviation, shared by the
 * optimizer scoring (priorityFilter.js) and display/grouping (optimizerTab.js).
 *
 * SETS_BY_INDEX order MUST match the Java `Set` enum: heroStat.sets is an int[]
 * indexed by it (priorityFilter.calculateBuildScore reads SET_INDEX.<SetName>).
 * Add any new set at the END so existing indices stay stable.
 */
export const SETS_BY_INDEX = [
  'HealthSet',
  'DefenseSet',
  'AttackSet',
  'SpeedSet',
  'CriticalSet',
  'HitSet',
  'DestructionSet',
  'LifestealSet',
  'CounterSet',
  'ResistSet',
  'UnitySet',
  'RageSet',
  'ImmunitySet',
  'PenetrationSet',
  'RevengeSet',
  'InjurySet',
  'ProtectionSet',
  'TorrentSet',
  'ReversalSet',
  'RiposteSet',
  'WarfareSet',
  'PursuitSet',
  'FervorSet',
  'WeakeningSet',
];

// name → enum index (reverse of SETS_BY_INDEX).
export const SET_INDEX = Object.fromEntries(
  SETS_BY_INDEX.map((name, i) => [name, i]),
);

// The 4-piece sets; every set not listed here is 2-piece.
export const FOUR_PIECE_SETS = new Set([
  'AttackSet',
  'SpeedSet',
  'DestructionSet',
  'LifestealSet',
  'ProtectionSet',
  'CounterSet',
  'RageSet',
  'RevengeSet',
  'InjurySet',
  'ReversalSet',
  'RiposteSet',
  'WarfareSet',
  'WeakeningSet',
]);
export const TWO_PIECE_SETS = new Set(
  SETS_BY_INDEX.filter((name) => !FOUR_PIECE_SETS.has(name)),
);

// Pieces needed to complete each set, parallel to SETS_BY_INDEX.
export const SET_PIECES_BY_INDEX = SETS_BY_INDEX.map((name) =>
  FOUR_PIECE_SETS.has(name) ? 4 : 2,
);

// Compact 2-char labels for the slot-heatmap set groups.
export const SET_ABBR = {
  HealthSet: 'HP',
  DefenseSet: 'Df',
  AttackSet: 'At',
  SpeedSet: 'Sp',
  CriticalSet: 'Cr',
  HitSet: 'Hi',
  DestructionSet: 'De',
  LifestealSet: 'LS',
  CounterSet: 'Co',
  ResistSet: 'Re',
  UnitySet: 'Un',
  RageSet: 'Ra',
  ImmunitySet: 'Im',
  PenetrationSet: 'Pe',
  RevengeSet: 'Rv',
  InjurySet: 'In',
  ProtectionSet: 'Pr',
  TorrentSet: 'To',
  ReversalSet: 'Rl',
  RiposteSet: 'Rp',
  WarfareSet: 'Wf',
  PursuitSet: 'Pu',
  FervorSet: 'Fv',
  WeakeningSet: 'Wk',
};

/**
 * Shared roll-normalization divisors used across priorityFilter.js,
 * heroGearMatcher.js, and archetypeScorer.js.
 *
 * Each value represents the "worth" of one roll for that stat type — e.g.
 * one ATK% roll ≈ 9 percentage points at max roll (tier-90 Epic).
 * Dividing a substat's raw value by its divisor converts it to a
 * dimensionless "roll-count" that can be weighted against other stats.
 *
 * Update these when new gear tiers change substat roll ranges.
 * Last verified: Epic Seven v2.0.x (circa 2024). Re-verify after each balance patch.
 */
const ROLL_DIVISORS = {
  AttackPercent: GEAR_MAXES.AttackPercent / 6,
  HealthPercent: GEAR_MAXES.HealthPercent / 6,
  DefensePercent: GEAR_MAXES.DefensePercent / 6,
  Speed: GEAR_MAXES.Speed / 6,
  CriticalHitChancePercent: GEAR_MAXES.CriticalHitChancePercent / 6,
  CriticalHitDamagePercent: GEAR_MAXES.CriticalHitDamagePercent / 6,
  EffectivenessPercent: GEAR_MAXES.EffectivenessPercent / 6,
  EffectResistancePercent: GEAR_MAXES.EffectResistancePercent / 6,
  Attack: GEAR_MAXES.Attack / 6,
  Health: GEAR_MAXES.Health / 6,
  Defense: GEAR_MAXES.Defense / 6,
};

export default ROLL_DIVISORS;

// ---------------------------------------------------------------------------
// Fast-reject filters — JS-side pre-screening before Java receives items.
// Each function drops items that cannot possibly appear in a build meeting
// the user's min-stat limit, no matter what the other 5 slots contain.
// ---------------------------------------------------------------------------

const SLOTS = ['Weapon', 'Helmet', 'Armor', 'Necklace', 'Ring', 'Boots'];

// SPD set bonuses: 4-piece only; only the best one applies.
const SPD_SET_RATES = {
  SpeedSet: 0.25,
  RevengeSet: 0.12,
  ReversalSet: 0.15,
  WeakeningSet: 0.15,
};

/**
 * Single-pass scan: for each gear slot find the maximum contribution across
 * all items in that slot, for every stat group at once.
 *
 * heroBaseAtk/Hp/Def convert flat+% gear values to the flat-equivalent units
 * Java uses (mirrors OptimizationRequestHandler itemEquiv / StatCalculator).
 *
 * Returns:
 *   bySlot   — { Weapon, Helmet, Armor, Necklace, Ring, Boots }
 *              each slot: { atk, hp, def, spd, cr, cd, eff, res }
 *   setCount — { setName: totalItemCount } across all items
 */
function _buildAllSlotMaxes(items, heroBaseAtk, heroBaseHp, heroBaseDef) {
  const zero = () => ({
    atk: 0,
    hp: 0,
    def: 0,
    spd: 0,
    cr: 0,
    cd: 0,
    eff: 0,
    res: 0,
  });
  const bySlot = {
    Weapon: zero(),
    Helmet: zero(),
    Armor: zero(),
    Necklace: zero(),
    Ring: zero(),
    Boots: zero(),
  };
  const setCount = {};

  for (const item of items) {
    const s = item.augmentedStats;
    if (!s) continue;
    const slot = bySlot[item.gear];
    if (!slot) continue;
    const mType = item.main?.type;
    const mVal = item.main?.value || 0;

    // ATK% + flat ATK → flat-equivalent
    const atk =
      (((s.AttackPercent || 0) + (mType === 'AttackPercent' ? mVal : 0)) /
        100) *
        heroBaseAtk +
      (s.Attack || 0) +
      (mType === 'Attack' ? mVal : 0);
    if (atk > slot.atk) slot.atk = atk;

    // HP% + flat HP → flat-equivalent
    const hp =
      (((s.HealthPercent || 0) + (mType === 'HealthPercent' ? mVal : 0)) /
        100) *
        heroBaseHp +
      (s.Health || 0) +
      (mType === 'Health' ? mVal : 0);
    if (hp > slot.hp) slot.hp = hp;

    // DEF% + flat DEF → flat-equivalent
    const def =
      (((s.DefensePercent || 0) + (mType === 'DefensePercent' ? mVal : 0)) /
        100) *
        heroBaseDef +
      (s.Defense || 0) +
      (mType === 'Defense' ? mVal : 0);
    if (def > slot.def) slot.def = def;

    const spd = (s.Speed || 0) + (mType === 'Speed' ? mVal : 0);
    if (spd > slot.spd) slot.spd = spd;

    const cr =
      (s.CriticalHitChancePercent || 0) +
      (mType === 'CriticalHitChancePercent' ? mVal : 0);
    if (cr > slot.cr) slot.cr = cr;

    const cd =
      (s.CriticalHitDamagePercent || 0) +
      (mType === 'CriticalHitDamagePercent' ? mVal : 0);
    if (cd > slot.cd) slot.cd = cd;

    const eff =
      (s.EffectivenessPercent || 0) +
      (mType === 'EffectivenessPercent' ? mVal : 0);
    if (eff > slot.eff) slot.eff = eff;

    const res =
      (s.EffectResistancePercent || 0) +
      (mType === 'EffectResistancePercent' ? mVal : 0);
    if (res > slot.res) slot.res = res;

    setCount[item.set] = (setCount[item.set] || 0) + 1;
  }

  return { bySlot, setCount };
}

/**
 * Unified fast-reject: one item scan + one filter pass covering all 8 stats.
 * Replaces eight sequential apply*FastReject calls with a single O(n) scan.
 *
 * Mirrors Java's bonusBase / bonusMax / statAccumulator formulas.
 * Set bonuses matched to StatCalculator.java.
 */
export function applyAllFastRejects(items, params, baseStats, hero) {
  // ── Active limits ──────────────────────────────────────────────────────
  const minSpd = params.inputSpdMinLimit || 0;
  const minAtk = params.inputAtkMinLimit || 0;
  const minHp = params.inputHpMinLimit || 0;
  const minDef = params.inputDefMinLimit || 0;
  const minCr = params.inputCrMinLimit || 0;
  const minCd = params.inputCdMinLimit || 0;
  const minEff = params.inputEffMinLimit || 0;
  const minRes = params.inputResMinLimit || 0;

  if (
    !minSpd &&
    !minAtk &&
    !minHp &&
    !minDef &&
    !minCr &&
    !minCd &&
    !minEff &&
    !minRes
  ) {
    return items;
  }

  // ── Hero base values ───────────────────────────────────────────────────
  const heroRawSpd = baseStats?.spd ?? 0;
  const heroBaseAtk = baseStats?.atk ?? 0;
  const heroBaseHp = baseStats?.hp ?? 0;
  const heroBaseDef = baseStats?.def ?? 0;

  // SPD: base + bonus speed (imprint / passive)
  const heroSpd = heroRawSpd + (hero?.bonusSpeed ?? 0);

  // CR / CD: base + imprint bonus + AEI bonus
  const heroBaseCr =
    (baseStats?.cr ?? 0) + (hero?.bonusCr ?? 0) + (hero?.aeiCr ?? 0);
  const heroBaseCd =
    (baseStats?.cd ?? 0) + (hero?.bonusCd ?? 0) + (hero?.aeiCd ?? 0);

  // EFF / RES: normalize decimal fraction (0–1) → integer % if needed
  const rawEff = baseStats?.eff ?? 0;
  const heroBaseEff =
    (rawEff > 0 && rawEff < 1 ? rawEff * 100 : rawEff) +
    (hero?.bonusEff ?? 0) +
    (hero?.aeiEff ?? 0);
  const rawRes = baseStats?.res ?? 0;
  const heroBaseRes =
    (rawRes > 0 && rawRes < 1 ? rawRes * 100 : rawRes) +
    (hero?.bonusRes ?? 0) +
    (hero?.aeiRes ?? 0);

  // ATK / HP / DEF: bonus base (passive %, flat bonus) + final multiplier
  const bonusBaseAtk =
    heroBaseAtk +
    (heroBaseAtk *
      ((hero?.bonusAtkPercent ?? 0) + (hero?.aeiAtkPercent ?? 0))) /
      100 +
    (hero?.bonusAtk ?? 0) +
    (hero?.aeiAtk ?? 0);
  const bonusMaxAtk = 1 + (hero?.finalAtkMultiplier ?? 0) / 100;

  const bonusBaseHp =
    heroBaseHp +
    (heroBaseHp * ((hero?.bonusHpPercent ?? 0) + (hero?.aeiHpPercent ?? 0))) /
      100 +
    (hero?.bonusHp ?? 0) +
    (hero?.aeiHp ?? 0);
  const bonusMaxHp = 1 + (hero?.finalHpMultiplier ?? 0) / 100;

  const bonusBaseDef =
    heroBaseDef +
    (heroBaseDef *
      ((hero?.bonusDefPercent ?? 0) + (hero?.aeiDefPercent ?? 0))) /
      100 +
    (hero?.bonusDef ?? 0) +
    (hero?.aeiDef ?? 0);
  const bonusMaxDef = 1 + (hero?.finalDefMultiplier ?? 0) / 100;

  // ── Theoretical ceiling (pre-scan bail-out) ────────────────────────────
  // Ceilings account for which main stats the user actually selected on each
  // variable-main slot.  Empty selection = unconstrained (any main allowed).
  // When multiple mains are allowed, take the max across all valid scenarios.
  const necklaceMains = params.inputNecklaceStat || [];
  const ringMains = params.inputRingStat || [];
  const bootsMains = params.inputBootsStat || [];

  // Max contribution of a flat/% stat pair from one variable-main slot.
  // When one of the pair can be main it contributes its full main-stat value;
  // the other is a substat and can reach its GEAR_MAXES value.
  // When neither can be main both are substats and we sum both GEAR_MAXES —
  // this intentionally overestimates (can't actually reach both maxes simultaneously
  // due to shared enhancement rolls) but keeps the ceiling conservative so no
  // gear is incorrectly rejected by the fast-reject filter.
  const _pairCeil = (
    allowedMains,
    flatKey,
    pctKey,
    flatMainMax,
    pctMainMax,
    flatSubMax,
    pctSubMax,
    base,
  ) => {
    const any = allowedMains.length === 0;
    const canFlat = any || allowedMains.includes(flatKey);
    const canPct = any || allowedMains.includes(pctKey);
    if (canFlat && canPct)
      return Math.max(
        (flatMainMax || 0) + (pctSubMax / 100) * base,
        (pctMainMax / 100) * base + (flatSubMax || 0),
      );
    if (canFlat) return (flatMainMax || 0) + (pctSubMax / 100) * base;
    if (canPct) return (pctMainMax / 100) * base + (flatSubMax || 0);
    return (flatSubMax || 0) + (pctSubMax / 100) * base; // neither → both substats (conservative overestimate)
  };

  // Single-stat ceiling for a slot that can have a high main (e.g. SPD on Boots).
  // If that main is not in allowedMains, fall back to the substat max.
  const _singleCeil = (allowedMains, key, mainMax, subMax) =>
    allowedMains.length === 0 || allowedMains.includes(key) ? mainMax : subMax;

  // SPD: main only on Boots (45); all other slots contribute substat max only.
  const spdCeil =
    GEAR_MAXES.Speed * 5 +
    _singleCeil(
      bootsMains,
      'Speed',
      MAX_MAIN_BY_SLOT.Boots.Speed,
      GEAR_MAXES.Speed,
    );

  // ATK: Weapon→ATK% sub only; Helmet→ATK+ATK% subs; Armor→no ATK/ATK% subs.
  const atkCeil =
    (GEAR_MAXES.AttackPercent / 100) * heroBaseAtk +
    GEAR_MAXES.Attack +
    (GEAR_MAXES.AttackPercent / 100) * heroBaseAtk +
    _pairCeil(
      necklaceMains,
      'Attack',
      'AttackPercent',
      MAX_MAIN_BY_SLOT.Necklace.Attack,
      MAX_MAIN_BY_SLOT.Necklace.AttackPercent,
      GEAR_MAXES.Attack,
      GEAR_MAXES.AttackPercent,
      heroBaseAtk,
    ) +
    _pairCeil(
      ringMains,
      'Attack',
      'AttackPercent',
      MAX_MAIN_BY_SLOT.Ring.Attack,
      MAX_MAIN_BY_SLOT.Ring.AttackPercent,
      GEAR_MAXES.Attack,
      GEAR_MAXES.AttackPercent,
      heroBaseAtk,
    ) +
    _pairCeil(
      bootsMains,
      'Attack',
      'AttackPercent',
      MAX_MAIN_BY_SLOT.Boots.Attack,
      MAX_MAIN_BY_SLOT.Boots.AttackPercent,
      GEAR_MAXES.Attack,
      GEAR_MAXES.AttackPercent,
      heroBaseAtk,
    );

  // HP: Weapon→HP+HP% subs; Helmet→HP% sub only; Armor→HP+HP% subs.
  const hpCeil =
    GEAR_MAXES.Health +
    (GEAR_MAXES.HealthPercent / 100) * heroBaseHp +
    (GEAR_MAXES.HealthPercent / 100) * heroBaseHp +
    GEAR_MAXES.Health +
    (GEAR_MAXES.HealthPercent / 100) * heroBaseHp +
    _pairCeil(
      necklaceMains,
      'Health',
      'HealthPercent',
      MAX_MAIN_BY_SLOT.Necklace.Health,
      MAX_MAIN_BY_SLOT.Necklace.HealthPercent,
      GEAR_MAXES.Health,
      GEAR_MAXES.HealthPercent,
      heroBaseHp,
    ) +
    _pairCeil(
      ringMains,
      'Health',
      'HealthPercent',
      MAX_MAIN_BY_SLOT.Ring.Health,
      MAX_MAIN_BY_SLOT.Ring.HealthPercent,
      GEAR_MAXES.Health,
      GEAR_MAXES.HealthPercent,
      heroBaseHp,
    ) +
    _pairCeil(
      bootsMains,
      'Health',
      'HealthPercent',
      MAX_MAIN_BY_SLOT.Boots.Health,
      MAX_MAIN_BY_SLOT.Boots.HealthPercent,
      GEAR_MAXES.Health,
      GEAR_MAXES.HealthPercent,
      heroBaseHp,
    );

  // DEF: Weapon→no DEF/DEF% subs; Helmet→DEF+DEF% subs; Armor→DEF% sub only.
  const defCeil =
    GEAR_MAXES.Defense +
    (GEAR_MAXES.DefensePercent / 100) * heroBaseDef +
    (GEAR_MAXES.DefensePercent / 100) * heroBaseDef +
    _pairCeil(
      necklaceMains,
      'Defense',
      'DefensePercent',
      MAX_MAIN_BY_SLOT.Necklace.Defense,
      MAX_MAIN_BY_SLOT.Necklace.DefensePercent,
      GEAR_MAXES.Defense,
      GEAR_MAXES.DefensePercent,
      heroBaseDef,
    ) +
    _pairCeil(
      ringMains,
      'Defense',
      'DefensePercent',
      MAX_MAIN_BY_SLOT.Ring.Defense,
      MAX_MAIN_BY_SLOT.Ring.DefensePercent,
      GEAR_MAXES.Defense,
      GEAR_MAXES.DefensePercent,
      heroBaseDef,
    ) +
    _pairCeil(
      bootsMains,
      'Defense',
      'DefensePercent',
      MAX_MAIN_BY_SLOT.Boots.Defense,
      MAX_MAIN_BY_SLOT.Boots.DefensePercent,
      GEAR_MAXES.Defense,
      GEAR_MAXES.DefensePercent,
      heroBaseDef,
    );

  // CR%: main only on Necklace (60); CD%: main only on Necklace (70).
  const crCeil =
    GEAR_MAXES.CriticalHitChancePercent * 5 +
    _singleCeil(
      necklaceMains,
      'CriticalHitChancePercent',
      MAX_MAIN_BY_SLOT.Necklace.CriticalHitChancePercent,
      GEAR_MAXES.CriticalHitChancePercent,
    );
  const cdCeil =
    GEAR_MAXES.CriticalHitDamagePercent * 5 +
    _singleCeil(
      necklaceMains,
      'CriticalHitDamagePercent',
      MAX_MAIN_BY_SLOT.Necklace.CriticalHitDamagePercent,
      GEAR_MAXES.CriticalHitDamagePercent,
    );

  // EFF%: main only on Ring (65); RES%: main only on Ring (65).
  const effCeil =
    GEAR_MAXES.EffectivenessPercent * 5 +
    _singleCeil(
      ringMains,
      'EffectivenessPercent',
      MAX_MAIN_BY_SLOT.Ring.EffectivenessPercent,
      GEAR_MAXES.EffectivenessPercent,
    );
  const resCeil =
    GEAR_MAXES.EffectResistancePercent * 5 +
    _singleCeil(
      ringMains,
      'EffectResistancePercent',
      MAX_MAIN_BY_SLOT.Ring.EffectResistancePercent,
      GEAR_MAXES.EffectResistancePercent,
    );

  if (
    (minSpd &&
      heroSpd &&
      heroSpd + spdCeil + Math.floor(0.25 * heroRawSpd) < minSpd) ||
    (minAtk &&
      heroBaseAtk &&
      (bonusBaseAtk + atkCeil + 0.45 * heroBaseAtk) * bonusMaxAtk < minAtk) ||
    (minHp &&
      heroBaseHp &&
      (bonusBaseHp + hpCeil + 0.6 * heroBaseHp) * bonusMaxHp < minHp) ||
    (minDef &&
      heroBaseDef &&
      (bonusBaseDef + defCeil + 0.6 * heroBaseDef) * bonusMaxDef < minDef) ||
    (minCr && heroBaseCr && heroBaseCr + crCeil + 3 * 12 < minCr) ||
    (minCd && heroBaseCd && heroBaseCd + cdCeil + 60 < minCd) ||
    (minEff && heroBaseEff + effCeil + 3 * 20 < minEff) ||
    (minRes && heroBaseRes + resCeil + 3 * 20 < minRes)
  )
    return [];

  // ── Single-pass scan: per-slot max for every stat group ────────────────
  const { bySlot, setCount } = _buildAllSlotMaxes(
    items,
    heroBaseAtk,
    heroBaseHp,
    heroBaseDef,
  );

  // ── Set bonuses ────────────────────────────────────────────────────────
  // SPD: pick the single best qualifying 4-piece speed set
  let spdSetBonus = 0;
  for (const [name, rate] of Object.entries(SPD_SET_RATES)) {
    if ((setCount[name] || 0) >= 4) {
      const b = Math.floor(rate * heroRawSpd);
      if (b > spdSetBonus) spdSetBonus = b;
    }
  }
  // ATK: 4-piece AttackSet +45%
  const atkSetBonus =
    (setCount['AttackSet'] || 0) >= 4 ? Math.floor(0.45 * heroBaseAtk) : 0;
  // HP: HealthSet 2pc pairs × 20%, WarfareSet 4pc +20%.
  // In a 6-slot build, WarfareSet 4pc takes 4 slots → at most 1 HealthSet pair in the
  // remaining 2.  Can't stack 3 HealthSet pairs AND WarfareSet simultaneously.
  // Take the best achievable combination rather than naively summing both.
  const _hpBonus = Math.floor(0.2 * heroBaseHp);
  const _healthPairs = Math.floor(Math.min(setCount['HealthSet'] || 0, 6) / 2);
  const _hasWarfare = (setCount['WarfareSet'] || 0) >= 4;
  const hpSetBonus =
    Math.max(
      _healthPairs, // option A: all HealthSet
      _hasWarfare
        ? Math.floor(Math.min(setCount['HealthSet'] || 0, 2) / 2) + 1
        : 0, // option B: WarfareSet 4pc + up to 1 HealthSet pair
    ) * _hpBonus;
  const defSetBonus =
    Math.floor(Math.min(setCount['DefenseSet'] || 0, 6) / 2) *
    Math.floor(0.2 * heroBaseDef);
  // CR: 2-piece pairs × 12
  const crSetBonus =
    Math.floor(Math.min(setCount['CriticalSet'] || 0, 6) / 2) * 12;
  // CD: 4-piece DestructionSet +60
  const cdSetBonus = (setCount['DestructionSet'] || 0) >= 4 ? 60 : 0;
  // EFF: 2-piece HitSet pairs × 20
  const effSetBonus = Math.floor(Math.min(setCount['HitSet'] || 0, 6) / 2) * 20;
  // RES: 2-piece ResistSet pairs × 20
  const resSetBonus =
    Math.floor(Math.min(setCount['ResistSet'] || 0, 6) / 2) * 20;

  // ── Pool-level bail-out (real items can't hit the limit) ───────────────
  const totSpd = SLOTS.reduce((s, sl) => s + bySlot[sl].spd, 0);
  const totAtk = SLOTS.reduce((s, sl) => s + bySlot[sl].atk, 0);
  const totHp = SLOTS.reduce((s, sl) => s + bySlot[sl].hp, 0);
  const totDef = SLOTS.reduce((s, sl) => s + bySlot[sl].def, 0);
  const totCr = SLOTS.reduce((s, sl) => s + bySlot[sl].cr, 0);
  const totCd = SLOTS.reduce((s, sl) => s + bySlot[sl].cd, 0);
  const totEff = SLOTS.reduce((s, sl) => s + bySlot[sl].eff, 0);
  const totRes = SLOTS.reduce((s, sl) => s + bySlot[sl].res, 0);

  if (
    (minSpd && heroSpd && heroSpd + totSpd + spdSetBonus < minSpd) ||
    (minAtk &&
      heroBaseAtk &&
      (bonusBaseAtk + totAtk + atkSetBonus) * bonusMaxAtk < minAtk) ||
    (minHp &&
      heroBaseHp &&
      (bonusBaseHp + totHp + hpSetBonus) * bonusMaxHp < minHp) ||
    (minDef &&
      heroBaseDef &&
      (bonusBaseDef + totDef + defSetBonus) * bonusMaxDef < minDef) ||
    (minCr && heroBaseCr && heroBaseCr + totCr + crSetBonus < minCr) ||
    (minCd && heroBaseCd && heroBaseCd + totCd + cdSetBonus < minCd) ||
    (minEff && heroBaseEff + totEff + effSetBonus < minEff) ||
    (minRes && heroBaseRes + totRes + resSetBonus < minRes)
  )
    return [];

  // ── Per-item filter ────────────────────────────────────────────────────
  return items.filter((item) => {
    const s = item.augmentedStats;
    if (!s) return true;
    const sl = bySlot[item.gear];
    const mType = item.main?.type;
    const mVal = item.main?.value || 0;

    // ATK% + flat ATK
    if (minAtk && heroBaseAtk) {
      const itemAtk =
        (((s.AttackPercent || 0) + (mType === 'AttackPercent' ? mVal : 0)) /
          100) *
          heroBaseAtk +
        (s.Attack || 0) +
        (mType === 'Attack' ? mVal : 0);
      if (
        (bonusBaseAtk + itemAtk + (totAtk - sl.atk) + atkSetBonus) *
          bonusMaxAtk <
        minAtk
      )
        return false;
    }

    // HP% + flat HP
    if (minHp && heroBaseHp) {
      const itemHp =
        (((s.HealthPercent || 0) + (mType === 'HealthPercent' ? mVal : 0)) /
          100) *
          heroBaseHp +
        (s.Health || 0) +
        (mType === 'Health' ? mVal : 0);
      if (
        (bonusBaseHp + itemHp + (totHp - sl.hp) + hpSetBonus) * bonusMaxHp <
        minHp
      )
        return false;
    }

    // DEF% + flat DEF
    if (minDef && heroBaseDef) {
      const itemDef =
        (((s.DefensePercent || 0) + (mType === 'DefensePercent' ? mVal : 0)) /
          100) *
          heroBaseDef +
        (s.Defense || 0) +
        (mType === 'Defense' ? mVal : 0);
      if (
        (bonusBaseDef + itemDef + (totDef - sl.def) + defSetBonus) *
          bonusMaxDef <
        minDef
      )
        return false;
    }

    // SPD
    if (minSpd && heroSpd) {
      const itemSpd = (s.Speed || 0) + (mType === 'Speed' ? mVal : 0);
      if (heroSpd + itemSpd + (totSpd - sl.spd) + spdSetBonus < minSpd)
        return false;
    }

    // CR
    if (minCr && heroBaseCr) {
      const itemCr =
        (s.CriticalHitChancePercent || 0) +
        (mType === 'CriticalHitChancePercent' ? mVal : 0);
      if (heroBaseCr + itemCr + (totCr - sl.cr) + crSetBonus < minCr)
        return false;
    }

    // CD
    if (minCd && heroBaseCd) {
      const itemCd =
        (s.CriticalHitDamagePercent || 0) +
        (mType === 'CriticalHitDamagePercent' ? mVal : 0);
      if (heroBaseCd + itemCd + (totCd - sl.cd) + cdSetBonus < minCd)
        return false;
    }

    // EFF
    if (minEff) {
      const itemEff =
        (s.EffectivenessPercent || 0) +
        (mType === 'EffectivenessPercent' ? mVal : 0);
      if (heroBaseEff + itemEff + (totEff - sl.eff) + effSetBonus < minEff)
        return false;
    }

    // RES
    if (minRes) {
      const itemRes =
        (s.EffectResistancePercent || 0) +
        (mType === 'EffectResistancePercent' ? mVal : 0);
      if (heroBaseRes + itemRes + (totRes - sl.res) + resSetBonus < minRes)
        return false;
    }

    return true;
  });
}

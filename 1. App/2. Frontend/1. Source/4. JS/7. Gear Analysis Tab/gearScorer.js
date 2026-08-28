/**
 * Gear Analysis Scorer — tiered scoring edition.
 * Mirrors the scoring logic from the original Google Sheets project (Code.js):
 *   - Standard archetypes: roll-normalized GS → SCORING_CONFIGS tier tables → integer score
 *   - Top Speed: speed potential → TopSpeedTiers → integer score
 *   - Speed: speed potential ≥18 gate, matching GS → SpeedTiers → integer score
 *   - Focus archetypes: stat potential → focus tier tables → integer score
 *
 * Depends on constants exposed via globalThis by:
 *   - epicSevenGearConstant.js  (ITEM_SUBSTAT_STAT_WEIGHTS, ITEM_REFORGE_TABLES, etc.)
 *   - archetypeRules.js         (ARCHETYPE_RULES, OFFICIAL_ARCHETYPE_RULES, SCORING_CONFIGS,
 *                                TopSpeedTiers, SpeedTiers, HP_FOCUS_TIERS, etc.)
 */

(function () {
  'use strict';

  // ── Archetype key lists ───────────────────────────────────────────────────

  const FIXED_MAIN_SLOTS = ['Weapon', 'Helmet', 'Armor'];

  const OFFICIAL_ARCHETYPE_KEYS = [
    'Top Speed',
    'Speed',
    'DPS',
    'DPS (No CC%)',
    'Res Tank',
    'Pure Tank',
    'EFF. Tank',
    'Atk + ER',
    'Atk + EFF',
    'EFF + ER',
    'Bruiser(Hp/Def)',
    'Bruiser',
    'Bruiser (B. Dmg)',
    'Future',
  ];

  const UNOFFICIAL_ARCHETYPE_KEYS = [
    'Top Speed',
    'Speed',
    'DPS',
    'DPS (No CC%)',
    'Res Tank',
    'Pure Tank',
    'EFF. Tank',
    'Atk + ER',
    'Atk + EFF',
    'EFF + ER',
    'Bruiser(Hp/Def)',
    'Bruiser',
    'Bruiser (B. Dmg)',
    'HP Focus',
    'Attack Focus',
    'Effectiveness Focus',
    'Effect Resist Focus',
    'Crit Chance Focus',
  ];

  const ALL_ARCHETYPE_KEYS = [
    ...OFFICIAL_ARCHETYPE_KEYS,
    ...UNOFFICIAL_ARCHETYPE_KEYS.filter(
      (k) => !OFFICIAL_ARCHETYPE_KEYS.includes(k),
    ),
  ];

  /** Archetypes that use potential-based scoring (no NM/Mod split, no GS tier lookup). */
  const POTENTIAL_ARCHETYPES = new Set([
    'Top Speed',
    'HP Focus',
    'Attack Focus',
    'Effectiveness Focus',
    'Effect Resist Focus',
    'Crit Chance Focus',
  ]);

  // ── Stat weight helpers ───────────────────────────────────────────────────

  let _weightCache = null;

  function getStatWeight(statType, rolls) {
    if (!_weightCache) {
      const src = globalThis.ITEM_SUBSTAT_STAT_WEIGHTS ?? {};
      _weightCache = {};
      Object.keys(src).forEach((k) => {
        const v = src[k];
        if (typeof v === 'number' || Array.isArray(v)) _weightCache[k] = v;
      });
    }
    const w = _weightCache[statType];
    if (w === undefined || w === null) return 0;
    if (Array.isArray(w))
      return w[Math.min(Math.max((rolls ?? 1) - 1, 0), 5)] ?? 0;
    return w;
  }

  function getSpeedBootsPenalty(rolls) {
    const src = globalThis.ITEM_SUBSTAT_STAT_WEIGHTS ?? {};
    const penalty = src.SPEED_BOOTS_PENALTY ?? (9 / 4) * 0.78695;
    if (Array.isArray(penalty))
      return penalty[Math.min(Math.max((rolls ?? 1) - 1, 0), 5)] ?? 0;
    return penalty;
  }

  function calcStatGS(statType, statValue, gearSlot, rolls) {
    if (typeof statValue !== 'number' || isNaN(statValue) || statValue <= 0)
      return 0;
    if (statType === 'Speed' && gearSlot === 'Boots')
      return statValue * getSpeedBootsPenalty(rolls);
    const multiplier = getStatWeight(statType, rolls);
    if (!multiplier) return 0;
    return statValue * multiplier;
  }

  function getSubstatValue(item, sub, useReforged) {
    const baseValue = sub?.value ?? 0;
    if (!useReforged) return baseValue;
    if (sub?.reforgedValue !== undefined) return sub.reforgedValue;
    if (
      globalThis.Reforge?.isReforgeable
        ? globalThis.Reforge.isReforgeable(item)
        : (item?.level ?? 0) === 85
    ) {
      return baseValue + getReforgeBonus(sub?.type, sub?.rolls ?? 1);
    }
    return baseValue;
  }

  // ── Raw GS calculation ────────────────────────────────────────────────────

  function accumulateGS(item, gearSlot, useReforged, wanted) {
    let attackGS = 0,
      defHpGS = 0,
      speedGS = 0,
      effResGS = 0,
      effGS = 0;
    const substats = item?.substats ?? [];
    substats.forEach((sub) => {
      if (!sub || !sub.type) return;
      if (wanted && !wanted.has(sub.type)) return;
      const val = getSubstatValue(item, sub, useReforged);
      if (val <= 0) return;
      const rolls = sub.rolls ?? 1;
      const gs = calcStatGS(sub.type, val, gearSlot, rolls);
      const t = sub.type;
      if (
        t === 'AttackPercent' ||
        t === 'CriticalHitDamagePercent' ||
        t === 'CriticalHitChancePercent' ||
        t === 'Attack'
      )
        attackGS += gs;
      else if (
        t === 'DefensePercent' ||
        t === 'HealthPercent' ||
        t === 'Defense' ||
        t === 'Health'
      )
        defHpGS += gs;
      else if (t === 'Speed') speedGS += gs;
      else if (t === 'EffectResistancePercent') effResGS += gs;
      else if (t === 'EffectivenessPercent') effGS += gs;
    });
    return (
      Math.round(parseFloat(attackGS.toFixed(3))) +
      Math.round(parseFloat(defHpGS.toFixed(3))) +
      Math.round(parseFloat(speedGS.toFixed(3))) +
      Math.round(parseFloat(effResGS.toFixed(3))) +
      Math.round(parseFloat(effGS.toFixed(3)))
    );
  }

  function calculateItemGS(item, useReforged) {
    return accumulateGS(item, item.gear ?? '', useReforged, null);
  }

  // ── Dual-rules caching ────────────────────────────────────────────────────

  const _caches = {
    official: { applicable: null, substats: null },
    unofficial: { applicable: null, substats: null },
  };

  let _unofficialFallbackWarned = false;
  function _getRules(rulesId) {
    if (rulesId === 'official')
      return globalThis.OFFICIAL_ARCHETYPE_RULES ?? {};
    if (!globalThis.ARCHETYPE_RULES) {
      if (!_unofficialFallbackWarned) {
        Log.error(
          '[gearScorer] ARCHETYPE_RULES not loaded — unofficial scoring is falling back to official rules. Check script load order.',
        );
        _unofficialFallbackWarned = true;
      }
      return globalThis.OFFICIAL_ARCHETYPE_RULES ?? {};
    }
    return globalThis.ARCHETYPE_RULES;
  }

  function _buildApplicableCache(rules) {
    const cache = new Map();
    Object.keys(rules).forEach((slot) => {
      const isFixed = FIXED_MAIN_SLOTS.includes(slot);
      (rules[slot] ?? []).forEach((rule) => {
        const arch = rule.archetype;
        (rule.sets ?? []).forEach((setName) => {
          if (isFixed) {
            cache.set(`${arch}|${slot}|${setName}|FIXED`, true);
          } else {
            (rule.Item_Main ?? []).forEach((main) => {
              cache.set(`${arch}|${slot}|${setName}|${main}`, true);
            });
          }
        });
      });
    });
    return cache;
  }

  function _getApplicableCache(rulesId) {
    if (!_caches[rulesId].applicable)
      _caches[rulesId].applicable = _buildApplicableCache(_getRules(rulesId));
    return _caches[rulesId].applicable;
  }

  function _isApplicable(arch, slot, setName, mainStat, rulesId) {
    const cache = _getApplicableCache(rulesId);
    const isFixed = FIXED_MAIN_SLOTS.includes(slot);
    return cache.has(
      isFixed
        ? `${arch}|${slot}|${setName}|FIXED`
        : `${arch}|${slot}|${setName}|${mainStat}`,
    );
  }

  function _getWantedSubstats(arch, slot, rulesId) {
    if (!_caches[rulesId].substats) _caches[rulesId].substats = new Map();
    const cache = _caches[rulesId].substats;
    const key = `${arch}|${slot}`;
    if (cache.has(key)) return cache.get(key);
    const rule = (_getRules(rulesId)[slot] ?? []).find(
      (r) => r.archetype === arch,
    );
    const wanted = new Set();
    if (rule) {
      (rule.Item_Substats ?? []).forEach((entry) => {
        if (Array.isArray(entry))
          entry.forEach((s) => {
            if (s && s !== 'Any') wanted.add(s);
          });
        else if (entry && entry !== 'Any') wanted.add(entry);
      });
    }
    cache.set(key, wanted);
    return wanted;
  }

  function _getRule(arch, slot, rulesId) {
    return (
      (_getRules(rulesId)[slot] ?? []).find((r) => r.archetype === arch) ?? null
    );
  }

  // ── Tier scoring helpers ──────────────────────────────────────────────────

  function applyTierFormula(tier, value) {
    if (tier.formula === 'type1')
      return (
        (tier.multiplier ?? tier.Multiplier ?? 1) *
        (value - (tier.base ?? tier.Base ?? 0))
      );
    if (tier.formula === 'type2')
      return (
        (tier.multiplier ?? tier.Multiplier ?? 1) * value -
        (tier.offset ?? tier.Offset ?? 0)
      );
    // Legacy uppercase format (Focus tiers have no formula field)
    return (
      (tier.Multiplier ?? tier.multiplier ?? 1) *
      (value - (tier.Base ?? tier.base ?? 0))
    );
  }

  // Inclusive upper bound (value <= hi) is intentional here: tiers are checked
  // high→low so a value exactly at a shared boundary goes to the higher tier.
  // Inputs are continuous floats (stat potential), not integers.
  /** Used for Top Speed and Focus tiers (Tier4→Tier0 priority, legacy Min/Max keys). */
  function applyTieredScoring(value, tiers) {
    for (const key of ['Tier4', 'Tier3', 'Tier2', 'Tier1', 'Tier0']) {
      const t = tiers[key];
      if (!t) continue;
      const lo = t.Min ?? t.min ?? 0;
      const hi = t.Max ?? t.max ?? Infinity;
      if (value >= lo && value <= hi)
        return Math.max(0, Math.round(applyTierFormula(t, value)));
    }
    return 0;
  }

  // ── Shared constant aliases (sourced from epicSevenGearConstant.js) ──────────
  // Local names keep call-sites short; fallbacks guard against load-order issues.

  const _gearLevelTier =
    globalThis.getGearLevelTier ??
    ((level) => {
      if (level >= 88) return 'LEVEL_88';
      if (level >= 72) return 'LEVEL_RANGE_72_85';
      return 'LEVEL_RANGE_1_71';
    });

  const _STAT_RANGE_CATEGORY = globalThis.SUBSTAT_ROLL_RANGE_CATEGORY ?? {};

  // ── Enhancement helpers ───────────────────────────────────────────────────

  // Returns remaining enhancement rolls that can go to existing substats.
  // Validated against maxRolls - totalRolls so we never over-count on low-enhance gear.
  function _remainingEnhanceRolls(rank, enhance, totalRolls) {
    const levels =
      (globalThis.ITEM_ENHANCE_LEVELS_SUBSTATS_ENHANCED ?? {})[
        rank.toUpperCase()
      ] ?? [];
    const maxRolls =
      (globalThis.ITEM_MAX_ENHANCE_TOTAL_ROLLS ?? {})[rank.toUpperCase()] ?? 9;
    const raw = levels.filter((l) => l > enhance).length;
    return typeof totalRolls === 'number'
      ? Math.max(0, Math.min(raw, maxRolls - totalRolls))
      : raw;
  }

  function getReforgeBonus(statType, rolls) {
    const table = (globalThis.ITEM_REFORGE_TABLES ?? {})[
      (globalThis.ITEM_REFORGE_STAT_MAP ?? {})[statType]
    ];
    if (!table || rolls <= 0) return 0;
    return table[Math.min(rolls - 1, table.length - 1)] ?? 0;
  }

  // ── Speed potential ───────────────────────────────────────────────────────

  function getSpeedPotential(item) {
    if ((item.gear ?? '') === 'Boots')
      return { maxPotentialSpeed: 0, hasSpeed: false };
    const speedSub = (item.substats ?? []).find((s) => s && s.type === 'Speed');
    if (!speedSub || !speedSub.value)
      return { maxPotentialSpeed: 0, hasSpeed: false };

    const rank = item.rank ?? 'Epic';
    const enhance = item.enhance ?? 0;
    const totalRolls = (item.substats ?? []).reduce(
      (s, sub) => s + (sub?.rolls ?? 0),
      0,
    );
    const remainingRolls = _remainingEnhanceRolls(rank, enhance, totalRolls);
    const levelTier = _gearLevelTier(item.level ?? 88);
    const rawMaxSpeed =
      globalThis.SUBSTAT_ROLL_RANGES?.[levelTier]?.['Speed']?.[rank]?.[1] ?? 4;
    // Cap Epic at 4 — 5-speed rolls exist on L88/L72-85 but are too rare to use as planning ceiling
    const maxRollValue =
      rank === 'Epic' ? Math.min(rawMaxSpeed, 4) : rawMaxSpeed;
    const maxPossibleRolls = (speedSub.rolls ?? 1) + remainingRolls;
    const reforgeBonus =
      item.level === 85 ? getReforgeBonus('Speed', maxPossibleRolls) : 0;

    return {
      maxPotentialSpeed:
        (speedSub.value ?? 0) + remainingRolls * maxRollValue + reforgeBonus,
      hasSpeed: true,
    };
  }

  // ── Standard archetype tier scoring ──────────────────────────────────────

  function _isDpsArmor(arch, slot) {
    return (arch === 'DPS' || arch === 'DPS (No CC%)') && slot === 'Armor';
  }

  // Heroic gear below its 4th-substat unlock level gets a flat +1 phantom roll so the
  // unknown future substat always counts as one full roll. This prevents low-enhance Heroic
  // gear from being discarded too early — a bad substat at +0 can be modded away, and the
  // +1 keeps its score comparable to higher-enhance gear where that slot is already filled.
  function _phantomAdjustedRolls(rank, enhance, totalRolls) {
    if (rank.toUpperCase() !== 'HEROIC') return totalRolls;
    const unlockLevels =
      (globalThis.ITEM_ENHANCE_LEVELS_SUBSTATS_UNLOCKED ?? {})['HEROIC'] ?? [];
    const firstUnlock = unlockLevels[0] ?? 12;
    if (enhance >= firstUnlock) return totalRolls;
    return totalRolls + (globalThis.HEROIC_PHANTOM_SUBSTAT_ROLLS ?? 1);
  }

  // Exclusive upper bound (matchingGS >= scaledMax → skip) is intentional here.
  // Tier max values use .9999 suffixes (e.g. max: 77.9999) so that after
  // Math.round scaling on integer GS, exact boundary hits are impossible.
  // Do NOT change to inclusive — it would break the .9999 tier boundary design.
  /**
   * Score matching GS against SCORING_CONFIGS tier tables (standard archetypes).
   * Returns 0 for special archetypes which use CUSTOM_PLACEHOLDER.
   */
  function _scoreByTiers(
    matchingGS,
    totalRolls,
    rank,
    arch,
    slot,
    rulesId,
    enhance,
  ) {
    const configs =
      rulesId === 'official'
        ? (globalThis.OFFICIAL_SCORING_CONFIGS ?? {})
        : (globalThis.SCORING_CONFIGS ?? {});
    const tiers = (configs[slot] ?? {})[arch];
    if (!tiers || !tiers.length) return 0;
    if (tiers[0].formula === 'custom') return 0; // CUSTOM_PLACEHOLDER

    const maxRolls =
      (globalThis.ITEM_MAX_ENHANCE_TOTAL_ROLLS ?? {})[rank.toUpperCase()] ?? 9;
    const phantomTotal = _phantomAdjustedRolls(rank, enhance ?? 0, totalRolls);
    const isDpa = _isDpsArmor(arch, slot);
    const adjMax = isDpa ? maxRolls - 1 : maxRolls;
    const adjTotal =
      isDpa && phantomTotal >= 4 ? phantomTotal - 1 : phantomTotal;

    for (const tier of tiers) {
      const scaledMin = Math.round(
        parseFloat(((tier.min / adjMax) * adjTotal).toFixed(3)),
      );
      const scaledMax = tier.max
        ? Math.round(parseFloat(((tier.max / adjMax) * adjTotal).toFixed(3)))
        : Infinity;
      if (matchingGS < scaledMin || matchingGS >= scaledMax) continue;

      let result;
      if (tier.formula === 'type1') {
        const scaledBase = Math.round(
          parseFloat(((tier.base / adjMax) * adjTotal).toFixed(3)),
        );
        result = (tier.multiplier ?? 1) * (matchingGS - scaledBase);
      } else {
        const scaledOffset = Math.round(
          parseFloat(((tier.offset / adjMax) * adjTotal).toFixed(3)),
        );
        result = (tier.multiplier ?? 1) * matchingGS - scaledOffset;
      }
      return Math.round(result);
    }
    return 0;
  }

  // ── Speed archetype tier scoring ──────────────────────────────────────────

  function _scoreSpeedArch(
    matchingGS,
    totalRolls,
    rank,
    rawSetName,
    rulesId,
    enhance,
  ) {
    const tiers =
      rulesId === 'official'
        ? (globalThis.OFFICIAL_SpeedTiers ?? null)
        : (globalThis.SpeedTiers ?? null);
    const sets =
      rulesId === 'official'
        ? (globalThis.OFFICIAL_SpeedSets ?? {})
        : (globalThis.SpeedSets ?? {});
    if (!tiers) return 0;

    const displaySet = (rawSetName ?? '').endsWith('Set')
      ? rawSetName.slice(0, -3)
      : (rawSetName ?? '');
    const equipRank = rank === 'Heroic' ? 8 : 9;

    // Apply phantom roll adjustment for Heroic gear below +12 (Speed is never DPS Armor)
    const adjustedRolls = _phantomAdjustedRolls(rank, enhance ?? 0, totalRolls);

    let tierGroup;
    if (displaySet === sets.SpeedSet) {
      tierGroup = tiers.SpeedSet;
    } else if (
      Array.isArray(sets.OtherSets) &&
      sets.OtherSets.includes(displaySet)
    ) {
      tierGroup = tiers.OtherSets;
    } else {
      return 0;
    }
    if (!tierGroup) return 0;

    for (const key of ['Tier3', 'Tier2', 'Tier1', 'Tier0']) {
      const t = tierGroup[key];
      if (!t) continue;
      const scaledMin = (t.Min / equipRank) * adjustedRolls;
      const scaledMax =
        t.Max !== undefined ? (t.Max / equipRank) * adjustedRolls : Infinity;
      if (matchingGS < scaledMin || matchingGS > scaledMax) continue;

      let result;
      if (t.formula === 'type1') {
        result =
          (t.multiplier ?? 1) *
          (matchingGS - ((t.base ?? 0) / equipRank) * adjustedRolls);
      } else {
        result =
          (t.multiplier ?? 1) * matchingGS -
          ((t.offset ?? 0) / equipRank) * adjustedRolls;
      }
      return Math.round(result);
    }
    return 0;
  }

  // ── Focus archetype potential + scoring ───────────────────────────────────

  function _getStatPotential(item, statType) {
    const sub = (item.substats ?? []).find((s) => s && s.type === statType);
    if (!sub || !sub.value) return 0;
    const rank = item.rank ?? 'Epic';
    const enhance = item.enhance ?? 0;
    const totalRolls = (item.substats ?? []).reduce(
      (s, ss) => s + (ss?.rolls ?? 0),
      0,
    );
    const remainingRolls = _remainingEnhanceRolls(rank, enhance, totalRolls);
    const levelTier = _gearLevelTier(item.level ?? 88);
    const rangeCategory = _STAT_RANGE_CATEGORY[statType] ?? 'Percent';
    const maxRollValue =
      globalThis.SUBSTAT_ROLL_RANGES?.[levelTier]?.[rangeCategory]?.[
        rank
      ]?.[1] ?? 0;
    const maxPossibleRolls = (sub.rolls ?? 1) + remainingRolls;
    const reforgeBonus =
      item.level === 85 ? getReforgeBonus(statType, maxPossibleRolls) : 0;
    return (sub.value ?? 0) + remainingRolls * maxRollValue + reforgeBonus;
  }

  function _scoreFocusArch(item, arch, slot, mainStat) {
    const g = globalThis;
    if (arch === 'Effectiveness Focus') {
      // Ring + EFF% main: check Atk% potential (can't roll EFF% as sub when it's main)
      if (slot === 'Ring' && mainStat === 'EffectivenessPercent') {
        const pot = _getStatPotential(item, 'AttackPercent');
        return pot > 0
          ? applyTieredScoring(pot, g.BOOT_ATK_FOCUS_TIERS ?? {})
          : 0;
      }
      const pot = _getStatPotential(item, 'EffectivenessPercent');
      return pot > 0
        ? applyTieredScoring(pot, g.BOOT_EFF_FOCUS_TIERS ?? {})
        : 0;
    }
    if (arch === 'Effect Resist Focus') {
      // Ring + ER% main: check Atk% potential (can't roll ER% as sub when it's main)
      if (slot === 'Ring' && mainStat === 'EffectResistancePercent') {
        const pot = _getStatPotential(item, 'AttackPercent');
        return pot > 0
          ? applyTieredScoring(pot, g.BOOT_ATK_FOCUS_TIERS ?? {})
          : 0;
      }
      const pot = _getStatPotential(item, 'EffectResistancePercent');
      return pot > 0 ? applyTieredScoring(pot, g.BOOT_ER_FOCUS_TIERS ?? {}) : 0;
    }
    if (arch === 'Crit Chance Focus') {
      const pot = _getStatPotential(item, 'CriticalHitChancePercent');
      return pot > 0 ? applyTieredScoring(pot, g.BOOT_CC_FOCUS_TIERS ?? {}) : 0;
    }
    if (arch === 'Attack Focus') {
      const usePercent =
        FIXED_MAIN_SLOTS.includes(slot) ||
        (slot === 'Boots' && mainStat === 'Speed');
      if (usePercent) {
        const pot = _getStatPotential(item, 'AttackPercent');
        return pot > 0
          ? applyTieredScoring(pot, g.BOOT_ATK_FOCUS_TIERS ?? {})
          : 0;
      }
      const pot = _getStatPotential(item, 'Attack');
      return pot > 0
        ? applyTieredScoring(pot, g.FLAT_ATK_FOCUS_TIERS ?? {})
        : 0;
    }
    if (arch === 'HP Focus') {
      const usePercent =
        FIXED_MAIN_SLOTS.includes(slot) ||
        (slot === 'Boots' && mainStat === 'Speed');
      if (usePercent) {
        const pot = _getStatPotential(item, 'HealthPercent');
        return pot > 0 ? applyTieredScoring(pot, g.HP_FOCUS_TIERS ?? {}) : 0;
      }
      const pot = _getStatPotential(item, 'Health');
      return pot > 0 ? applyTieredScoring(pot, g.FLAT_HP_FOCUS_TIERS ?? {}) : 0;
    }
    return 0;
  }

  // ── Combat Power (C.Power / A.Power) ─────────────────────────────────────

  const SPEED_QUALIFIER_SET = new Set([
    'DPS',
    'DPS (No CC%)',
    'Res Tank',
    'Pure Tank',
    'EFF. Tank',
    'Atk + EFF',
    'Atk + ER',
    'EFF + ER',
    'Bruiser(Hp/Def)',
    'Bruiser',
    'Bruiser (B. Dmg)',
  ]);

  const PRIORITY_GROUPS_DEF = [
    { name: 'DPS', archetypes: ['DPS', 'DPS (No CC%)'], priority: 1 },
    { name: 'Tank', archetypes: ['Res Tank', 'Pure Tank'], priority: 2 },
    {
      name: 'EFF.ER',
      archetypes: ['EFF. Tank', 'Atk + EFF', 'Atk + ER', 'EFF + ER'],
      priority: 3,
    },
    {
      name: 'Bruiser',
      archetypes: ['Bruiser(Hp/Def)', 'Bruiser', 'Bruiser (B. Dmg)'],
      priority: 4,
    },
    { name: 'Future', archetypes: ['Future'], priority: 5 },
  ];

  function _calcCombatPower(archResult, excludeFuture) {
    const nm = archResult.nonModGS;
    const mod = archResult.modGS;

    const groups = excludeFuture
      ? PRIORITY_GROUPS_DEF.filter((g) => g.name !== 'Future')
      : PRIORITY_GROUPS_DEF;

    // Non-mod
    const topSpeedNm = nm['Top Speed'] ?? 0;
    let speedNm = nm['Speed'] ?? 0;
    if (speedNm > 0 && ![...SPEED_QUALIFIER_SET].some((a) => (nm[a] ?? 0) > 0))
      speedNm = 0;

    const groupResultsNm = groups
      .map((g) => ({
        priority: g.priority,
        score: Math.max(0, ...g.archetypes.map((a) => nm[a] ?? 0)),
      }))
      .filter((g) => g.score > 0)
      .sort((a, b) =>
        b.score !== a.score ? b.score - a.score : a.priority - b.priority,
      );
    const scoreNm = topSpeedNm + speedNm + (groupResultsNm[0]?.score ?? 0);

    // Mod (best of nm/mod per arch independently — approximation since we lack the full mod cache)
    const best = (a) => Math.max(nm[a] ?? 0, mod[a] ?? 0);
    const topSpeedMod = best('Top Speed');
    let speedMod = best('Speed');
    if (speedMod > 0 && ![...SPEED_QUALIFIER_SET].some((a) => best(a) > 0))
      speedMod = 0;

    const groupResultsMod = groups
      .map((g) => ({
        priority: g.priority,
        score: Math.max(0, ...g.archetypes.map(best)),
      }))
      .filter((g) => g.score > 0)
      .sort((a, b) =>
        b.score !== a.score ? b.score - a.score : a.priority - b.priority,
      );
    const scoreMod = topSpeedMod + speedMod + (groupResultsMod[0]?.score ?? 0);

    return {
      score: scoreNm,
      modScore: scoreMod,
      gain: scoreMod - scoreNm,
      hasMod: scoreMod > scoreNm,
    };
  }

  // ── Per-archetype helpers ─────────────────────────────────────────────────

  const STAT_SHORT = {
    AttackPercent: 'Atk%',
    Attack: 'Atk',
    DefensePercent: 'Def%',
    Defense: 'Def',
    HealthPercent: 'HP%',
    Health: 'HP',
    CriticalHitChancePercent: 'CC%',
    CriticalHitDamagePercent: 'CD%',
    EffectivenessPercent: 'EFF%',
    EffectResistancePercent: 'ER%',
    Speed: 'Spd',
  };
  function statShort(t) {
    return STAT_SHORT[t] ?? t;
  }

  function _countMatching(item, arch, rulesId) {
    const wanted = _getWantedSubstats(arch, item.gear ?? '', rulesId);
    if (!wanted.size) return 0;
    return (item.substats ?? []).filter(
      (s) => s && s.type && wanted.has(s.type),
    ).length;
  }

  function _calcMatchingGS(item, arch, useReforged, rulesId) {
    const slot = item.gear ?? '';
    const wanted = _getWantedSubstats(arch, slot, rulesId);
    if (!wanted.size) return 0;
    return accumulateGS(item, slot, useReforged, wanted);
  }

  function _calcBestModGS(item, arch, useReforged, rulesId) {
    const slot = item.gear ?? '';
    const rule = _getRule(arch, slot, rulesId);
    if (!rule) return { modGS: 0, fromStat: '', toStat: '', options: [] };
    const wanted = _getWantedSubstats(arch, slot, rulesId);
    if (!wanted.size)
      return { modGS: 0, fromStat: '', toStat: '', options: [] };

    const substats = item.substats ?? [];
    const isReforged = item.level === 90 || item.level === 85;
    const valueKey = isReforged ? 'reforged_value' : 'non_reforged_value';
    const scoreKey = isReforged ? 'reforged_score' : 'non_reforged_score';
    const MOD_RANGES = globalThis.ITEM_MODIFICATION_ROLL_RANGES ?? {};
    const slotMods = MOD_RANGES[slot] ?? {};
    const mainStatType =
      typeof item.main === 'object' && item.main
        ? (item.main.type ?? '')
        : (item.main ?? '');

    const isSpeedArch = arch === 'Speed' || arch === 'Top Speed';
    const required = isSpeedArch
      ? new Set(['Speed'])
      : new Set(rule.requiredSubstats ?? []);

    const alreadyModified = substats.find((s) => s && s.modified === true);
    const candidates = alreadyModified
      ? [alreadyModified]
      : substats.filter((s) => s && s.type && !required.has(s.type));

    const existingTypes = new Set(
      substats.filter((s) => s && s.type).map((s) => s.type),
    );
    let bestMatchGS = 0,
      bestFrom = '',
      bestTo = '';
    const optionMap = new Map(); // "from|to" -> best raw matching GS

    const registerOption = (fromType, toType, rawGS) => {
      if (!fromType || !toType || !Number.isFinite(rawGS) || rawGS <= 0) return;
      const key = `${fromType}|${toType}`;
      const prev = optionMap.get(key);
      if (prev === undefined || rawGS > prev) optionMap.set(key, rawGS);
    };

    for (const sub of candidates) {
      const rolls = Math.min(Math.max(sub.rolls ?? 1, 1), 6);
      const rollIdx = rolls - 1;

      if (wanted.has(sub.type) && slotMods[sub.type]) {
        const modMaxScore = slotMods[sub.type]?.[scoreKey]?.[rollIdx];
        const modMaxValue = slotMods[sub.type]?.[valueKey]?.[rollIdx];
        if (modMaxScore !== undefined && modMaxValue !== undefined) {
          const currentVal = getSubstatValue(item, sub, useReforged);
          const currentGS = calcStatGS(sub.type, currentVal, slot, rolls);
          const modGS = Math.round(parseFloat(modMaxScore.toFixed(3)));
          if (modGS > currentGS) {
            const vgs = _calcVirtualMatchGS(
              item.level ?? 0,
              substats,
              sub,
              sub.type,
              modMaxValue,
              rolls,
              wanted,
              slot,
              useReforged,
            );
            registerOption(sub.type, sub.type, vgs);
            if (vgs > bestMatchGS) {
              bestMatchGS = vgs;
              bestFrom = sub.type;
              bestTo = sub.type;
            }
          }
        }
      }

      let bestAltGS = 0,
        bestAltType = '',
        bestAltValue = 0;
      for (const wantedStat of wanted) {
        if (existingTypes.has(wantedStat) && wantedStat !== sub.type) continue;
        if (wantedStat === mainStatType) continue;
        if (!slotMods[wantedStat]) continue;
        const altScore = slotMods[wantedStat]?.[scoreKey]?.[rollIdx];
        const altValue = slotMods[wantedStat]?.[valueKey]?.[rollIdx];
        if (altScore === undefined || altValue === undefined) continue;
        const rounded = Math.round(parseFloat(altScore.toFixed(3)));
        if (rounded > bestAltGS) {
          bestAltGS = rounded;
          bestAltType = wantedStat;
          bestAltValue = altValue;
        }
      }
      if (bestAltType && bestAltType !== sub.type) {
        const vgs = _calcVirtualMatchGS(
          item.level ?? 0,
          substats,
          sub,
          bestAltType,
          bestAltValue,
          rolls,
          wanted,
          slot,
          useReforged,
        );
        registerOption(sub.type, bestAltType, vgs);
        if (vgs > bestMatchGS) {
          bestMatchGS = vgs;
          bestFrom = sub.type;
          bestTo = bestAltType;
        }
      }
    }

    const options = Array.from(optionMap.entries()).map(([key, rawGS]) => {
      const [fromStat, toStat] = key.split('|');
      return { fromStat, toStat, rawGS };
    });

    return { modGS: bestMatchGS, fromStat: bestFrom, toStat: bestTo, options };
  }

  function _formatGroupedModHint(options, primaryFrom, scoreFromRaw) {
    if (!Array.isArray(options) || !options.length) return '';

    const scored = options
      .map((opt) => ({
        ...opt,
        score: Math.round(Number(scoreFromRaw(opt.rawGS) || 0)),
      }))
      .filter((opt) => opt.score > 0);

    if (!scored.length) return '';

    // ── Primary source block (existing format, unchanged) ─────────────────────
    const primaryEntries = scored
      .filter((opt) => opt.fromStat === primaryFrom)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return statShort(a.toStat).localeCompare(statShort(b.toStat));
      });

    const primaryBlock = primaryEntries
      .map(
        (e) => `${statShort(e.fromStat)} → ${statShort(e.toStat)} | ${e.score}`,
      )
      .join('\n');

    if (!primaryBlock) return '';

    // ── Additional scoring mods (non-primary sources) ─────────────────────────
    // primaryCacheKeys covers all "oldDisplay → newDisplay" pairs already shown
    // in the primary block, so we don't re-list them below.
    const primaryCacheKeys = new Set(
      primaryEntries.map(
        (e) => `${statShort(e.fromStat)} → ${statShort(e.toStat)}`,
      ),
    );

    const additionalLines = scored
      .filter(
        (opt) =>
          !primaryCacheKeys.has(
            `${statShort(opt.fromStat)} → ${statShort(opt.toStat)}`,
          ),
      )
      .sort((a, b) => b.score - a.score)
      .map(
        (e) => `${statShort(e.fromStat)} → ${statShort(e.toStat)} | ${e.score}`,
      );

    return additionalLines.length
      ? primaryBlock + '\n' + additionalLines.join('\n')
      : primaryBlock;
  }

  function _calcVirtualMatchGS(
    itemLevel,
    substats,
    subToReplace,
    newType,
    newValue,
    newRolls,
    wanted,
    slot,
    useReforged,
  ) {
    const virtual = substats
      .map((sub) => {
        if (!sub || !sub.type) return null;
        if (sub.type === subToReplace.type)
          return { type: newType, value: newValue, rolls: newRolls };
        return sub;
      })
      .filter(Boolean);
    return accumulateGS(
      { substats: virtual, level: itemLevel },
      slot,
      useReforged,
      wanted,
    );
  }

  // ── Score against one rule set ────────────────────────────────────────────

  function _scoreForRules(item, useReforged, archetypeKeys, rulesId) {
    const slot = item.gear ?? '';
    const rawSet = item.set ?? '';
    const setName = rawSet.endsWith('Set') ? rawSet.slice(0, -3) : rawSet;
    const mainStatType =
      typeof item.main === 'object' && item.main
        ? (item.main.type ?? '')
        : (item.main ?? '');
    const rank = item.rank ?? 'Epic';
    const enhance = item.enhance ?? 0;
    const totalRolls = (item.substats ?? []).reduce(
      (s, sub) => s + (sub?.rolls ?? 0),
      0,
    );

    const speedData = getSpeedPotential(item);

    const valid = {},
      matchCount = {},
      nonModGS = {},
      modGS = {},
      modHint = {};

    archetypeKeys.forEach((arch) => {
      const applicable = _isApplicable(
        arch,
        slot,
        setName,
        mainStatType,
        rulesId,
      );
      if (!applicable) {
        valid[arch] = false;
        matchCount[arch] = 0;
        nonModGS[arch] = 0;
        modGS[arch] = 0;
        modHint[arch] = '';
        return;
      }

      // ── Top Speed ──────────────────────────────────────────────────
      if (arch === 'Top Speed') {
        valid[arch] = speedData.hasSpeed;
        matchCount[arch] = speedData.hasSpeed ? 1 : 0;
        const tiers =
          rulesId === 'official'
            ? (globalThis.OFFICIAL_TopSpeedTiers ?? {})
            : (globalThis.TopSpeedTiers ?? {});
        nonModGS[arch] = speedData.hasSpeed
          ? applyTieredScoring(speedData.maxPotentialSpeed, tiers)
          : 0;
        modGS[arch] = 0;
        modHint[arch] = '';
        return;
      }

      // ── Speed ──────────────────────────────────────────────────────
      if (arch === 'Speed') {
        const viable = speedData.hasSpeed && speedData.maxPotentialSpeed >= 18;
        valid[arch] = viable;
        if (!viable) {
          matchCount[arch] = 0;
          nonModGS[arch] = 0;
          modGS[arch] = 0;
          modHint[arch] = '';
          return;
        }
        matchCount[arch] = _countMatching(item, arch, rulesId);
        const mgs = _calcMatchingGS(item, arch, useReforged, rulesId);
        nonModGS[arch] = _scoreSpeedArch(
          mgs,
          totalRolls,
          rank,
          item.set ?? '',
          rulesId,
          enhance,
        );
        const {
          modGS: bestModRaw,
          fromStat,
          options,
        } = _calcBestModGS(item, arch, useReforged, rulesId);
        modGS[arch] =
          bestModRaw > mgs
            ? _scoreSpeedArch(
                bestModRaw,
                totalRolls,
                rank,
                item.set ?? '',
                rulesId,
                enhance,
              )
            : nonModGS[arch];
        modHint[arch] =
          bestModRaw > mgs
            ? _formatGroupedModHint(options, fromStat, (raw) =>
                _scoreSpeedArch(
                  raw,
                  totalRolls,
                  rank,
                  item.set ?? '',
                  rulesId,
                  enhance,
                ),
              )
            : '';
        return;
      }

      // ── Focus archetypes ───────────────────────────────────────────
      if (POTENTIAL_ARCHETYPES.has(arch)) {
        const score = _scoreFocusArch(item, arch, slot, mainStatType);
        valid[arch] = score > 0;
        matchCount[arch] = score > 0 ? 1 : 0;
        nonModGS[arch] = score;
        modGS[arch] = 0;
        modHint[arch] = '';
        return;
      }

      // ── Standard GS-based archetypes ───────────────────────────────
      valid[arch] = true;
      matchCount[arch] = _countMatching(item, arch, rulesId);
      const mgs = _calcMatchingGS(item, arch, useReforged, rulesId);
      nonModGS[arch] = _scoreByTiers(
        mgs,
        totalRolls,
        rank,
        arch,
        slot,
        rulesId,
        enhance,
      );
      const {
        modGS: bestModRaw,
        fromStat,
        options,
      } = _calcBestModGS(item, arch, useReforged, rulesId);
      modGS[arch] =
        bestModRaw > mgs
          ? _scoreByTiers(
              bestModRaw,
              totalRolls,
              rank,
              arch,
              slot,
              rulesId,
              enhance,
            )
          : nonModGS[arch];
      modHint[arch] =
        bestModRaw > mgs
          ? _formatGroupedModHint(options, fromStat, (raw) =>
              _scoreByTiers(
                raw,
                totalRolls,
                rank,
                arch,
                slot,
                rulesId,
                enhance,
              ),
            )
          : '';
    });

    return { valid, matchCount, nonModGS, modGS, modHint };
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function scoreItem(item, useReforged) {
    const gs = calculateItemGS(item, useReforged);
    const totalRolls = (item.substats ?? []).reduce(
      (s, sub) => s + (sub?.rolls ?? 0),
      0,
    );
    const gsPerRoll =
      totalRolls > 0 ? parseFloat((gs / totalRolls).toFixed(2)) : 0;
    const maxRolls =
      (globalThis.ITEM_MAX_ENHANCE_TOTAL_ROLLS ?? {})[
        (item.rank ?? 'Epic').toUpperCase()
      ] ?? 9;
    const gs15 = Math.round(parseFloat((gsPerRoll * maxRolls).toFixed(3)));

    const officialResult = _scoreForRules(
      item,
      useReforged,
      OFFICIAL_ARCHETYPE_KEYS,
      'official',
    );
    const unofficialResult = _scoreForRules(
      item,
      useReforged,
      UNOFFICIAL_ARCHETYPE_KEYS,
      'unofficial',
    );

    return {
      gs,
      gsPerRoll,
      gs15,
      speedPotential: getSpeedPotential(item).maxPotentialSpeed,
      official: {
        ...officialResult,
        cPower: _calcCombatPower(officialResult, false),
        aPower: _calcCombatPower(officialResult, true),
      },
      unofficial: {
        ...unofficialResult,
        cPower: _calcCombatPower(unofficialResult, false),
        aPower: _calcCombatPower(unofficialResult, true),
      },
    };
  }

  function scoreAllItems(items, useReforged) {
    if (!Array.isArray(items)) return [];
    return items.map((item) => ({ item, score: scoreItem(item, useReforged) }));
  }

  function resetCaches() {
    _weightCache = null;
    _caches.official.applicable = null;
    _caches.official.substats = null;
    _caches.unofficial.applicable = null;
    _caches.unofficial.substats = null;
  }

  globalThis.GearScorer = {
    OFFICIAL_ARCHETYPE_KEYS,
    UNOFFICIAL_ARCHETYPE_KEYS,
    ALL_ARCHETYPE_KEYS,
    POTENTIAL_ARCHETYPES,
    scoreItem,
    scoreAllItems,
    resetCaches,
  };
})();

import ROLL_DIVISORS, { SET_INDEX, SET_ABBR } from './rollDivisors.js';
import ModificationFilter from '../../../2. Gear & Enhancing Tab/1. Gear Tab/modificationFilter.js';

function groupBy(xs, key) {
  return xs.reduce((rv, x) => {
    rv[x[key]] = rv[x[key]] || [];
    rv[x[key]].push(x);
    return rv;
  }, {});
}

function mainTypeValue(stats, statType) {
  if (statType === stats.mainType) {
    return stats.mainValue;
  }
  return 0;
}

// Flat ATK/HP/DEF substats are normalized through the hero base into the
// equivalent percent-roll units, then divided by the percent divisor.
const _FLAT_BASE_KEY = { Attack: 'atk', Health: 'hp', Defense: 'def' };
const _FLAT_PCT_DIVISOR = {
  Attack: 'AttackPercent',
  Health: 'HealthPercent',
  Defense: 'DefensePercent',
};

/**
 * Roll-normalized contribution of a single stat value (the dimensionless
 * "roll count" used throughout scoring).  Flat ATK/HP/DEF convert through the
 * hero base into percent-equivalent rolls; every other stat divides directly
 * by its ROLL_DIVISORS entry.  Shared by calculateScore (global) and
 * calculateRankScore (per-slot + mod-potential) so there is one formula.
 */
function statRolls(statType, value, baseStats) {
  if (!value) return 0;
  const baseKey = _FLAT_BASE_KEY[statType];
  if (baseKey) {
    const base = baseStats[baseKey] || 1;
    return ((value / base) * 100) / ROLL_DIVISORS[_FLAT_PCT_DIVISOR[statType]];
  }
  const div = ROLL_DIVISORS[statType];
  return div ? value / div : 0;
}

// Maps a raw stat type to its priority category (the 8 sliders aggregate
// flat + percent for ATK/HP/DEF).  Used by the mod-potential delta.
const _STAT_CATEGORY = {
  Attack: 'atk',
  AttackPercent: 'atk',
  Health: 'hp',
  HealthPercent: 'hp',
  Defense: 'def',
  DefensePercent: 'def',
  Speed: 'spd',
  CriticalHitChancePercent: 'cr',
  CriticalHitDamagePercent: 'cd',
  EffectivenessPercent: 'eff',
  EffectResistancePercent: 'res',
};

// The 11 real substat types, in a stable order (keys of _STAT_CATEGORY).
const _ALL_SUBSTAT_TYPES = Object.keys(_STAT_CATEGORY);

/** The 8 global priority weights from params, as a category→weight object. */
function globalPriorities(params) {
  return {
    atk: params.inputAtkPriority || 0,
    hp: params.inputHpPriority || 0,
    def: params.inputDefPriority || 0,
    spd: params.inputSpdPriority || 0,
    cr: params.inputCrPriority || 0,
    cd: params.inputCdPriority || 0,
    eff: params.inputEffPriority || 0,
    res: params.inputResPriority || 0,
  };
}

// The 8 user-facing priority categories (one per global slider).  Per-slot /
// per-set configs are authored at the 11 real substat TYPE level (flat & % split,
// e.g. flat ATK vs ATK%) — the globals are the per-category average of those rows.
const _PRIORITY_CATEGORIES = [
  'atk',
  'hp',
  'def',
  'spd',
  'cr',
  'cd',
  'eff',
  'res',
];
const _ALL_SLOTS = ['Weapon', 'Helmet', 'Armor', 'Necklace', 'Ring', 'Boots'];

// Per-slot legal substat TYPES (ITEM_ALLOWED_SUBSTATS).  Fixed-main slots exclude
// their flat main (Weapon=flat ATK, Helmet=flat HP, Armor=flat DEF) plus the hard
// slot bans (Weapon: no DEF at all; Armor: no ATK at all).  null = all 11.
const _TYPE_LEGAL = {
  Weapon: new Set([
    'AttackPercent',
    'Health',
    'HealthPercent',
    'Speed',
    'CriticalHitChancePercent',
    'CriticalHitDamagePercent',
    'EffectivenessPercent',
    'EffectResistancePercent',
  ]),
  Helmet: new Set([
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
  ]),
  Armor: new Set([
    'DefensePercent',
    'Health',
    'HealthPercent',
    'Speed',
    'CriticalHitChancePercent',
    'CriticalHitDamagePercent',
    'EffectivenessPercent',
    'EffectResistancePercent',
  ]),
  Necklace: null,
  Ring: null,
  Boots: null,
};
function _isLegalType(gear, type) {
  const a = _TYPE_LEGAL[gear];
  return !a || a.has(type);
}

// Extract the 11 type weights from a config row (slot or set entry).  Missing → 0.
// Back-compat: a legacy 8-category row ({atk,hp,…}) expands to its flat & % types.
function _pickTypes(row) {
  const o = {};
  const hasType = !!row && _ALL_SUBSTAT_TYPES.some((t) => row[t] != null);
  for (let i = 0; i < _ALL_SUBSTAT_TYPES.length; i += 1) {
    const t = _ALL_SUBSTAT_TYPES[i];
    if (!row) o[t] = 0;
    else o[t] = hasType ? row[t] || 0 : row[_STAT_CATEGORY[t]] || 0;
  }
  return o;
}

// The global sliders expanded to 11 type weights (flat & % both inherit their
// category's global weight) — the no-override / non-budget default.
function globalTypeWeights(params) {
  const g = globalPriorities(params);
  const out = {};
  for (let i = 0; i < _ALL_SUBSTAT_TYPES.length; i += 1) {
    const t = _ALL_SUBSTAT_TYPES[i];
    out[t] = g[_STAT_CATEGORY[t]] || 0;
  }
  return out;
}

// Materialize a 6×11 slot row from 8 category weights: legal types take their
// category weight, illegal types → 0.  Used to broadcast a global edit to a slot.
function materializeSlotRow(cats, gear) {
  const out = {};
  for (let i = 0; i < _ALL_SUBSTAT_TYPES.length; i += 1) {
    const t = _ALL_SUBSTAT_TYPES[i];
    out[t] = _isLegalType(gear, t) ? cats[_STAT_CATEGORY[t]] || 0 : 0;
  }
  return out;
}

// Each gear piece is a 9-roll budget (4 base substats + 5 enhance rolls).
// Normalizing a slot's type weights to sum to 9 over its LEGAL types makes every
// slot contribute its equal 9-roll share to the build total, so no slot dominates
// merely by carrying larger raw weights.  Soft: within-slot ratios are preserved,
// only the cross-slot scale is fixed.  Σ≤0 → passthrough (rare).
const _SLOT_ROLL_BUDGET = 9;
function normalizeSlotRow(typeW, gear) {
  let sum = 0;
  for (let i = 0; i < _ALL_SUBSTAT_TYPES.length; i += 1) {
    const t = _ALL_SUBSTAT_TYPES[i];
    if (_isLegalType(gear, t)) sum += typeW[t] || 0;
  }
  const f = sum > 0 ? _SLOT_ROLL_BUDGET / sum : 1;
  const out = {};
  for (let i = 0; i < _ALL_SUBSTAT_TYPES.length; i += 1) {
    const t = _ALL_SUBSTAT_TYPES[i];
    out[t] = _isLegalType(gear, t) ? (typeW[t] || 0) * f : 0;
  }
  return out;
}

/** True once the user has materialized a per-slot matrix (per-slot/budget mode). */
function hasAnySlotOverride(params) {
  return !!params.slotPriorityConfig;
}

/** True if any forced set carries an enabled per-set priority override. */
function hasAnySetOverride(params) {
  const c = params.setPriorityConfig;
  return !!c && Object.keys(c).some((k) => c[k] && c[k].enabled);
}

// "Budget mode" — per-slot or per-set weights are in play, so every slot's row is
// normalized to the 9-roll budget.  With neither present we stay on the raw global
// sliders (byte-identical to the pre-feature behavior; no magnitude shift).
function _inBudgetMode(params) {
  return hasAnySlotOverride(params) || hasAnySetOverride(params);
}

// Effective 11-type weights for an item, applying precedence set > slot > global
// and the 9-roll normalization (in budget mode).  `set` is item.set.  Used by
// both calculateScore and calculateRankScore.
function resolveEffectivePriorities(params, gear, set) {
  let row;
  const sc = set && params.setPriorityConfig && params.setPriorityConfig[set];
  if (sc && sc.enabled) {
    row = _pickTypes(sc);
  } else {
    const slc = params.slotPriorityConfig && params.slotPriorityConfig[gear];
    row = slc ? _pickTypes(slc) : globalTypeWeights(params);
  }
  return _inBudgetMode(params) ? normalizeSlotRow(row, gear) : row;
}

// Back-compat thin wrapper (no set context) — kept for external callers.
function resolveSlotPriorities(params, gear) {
  return resolveEffectivePriorities(params, gear, null);
}

// ---------------------------------------------------------------------------
// B (mod-variant pruning) — the set of real substat TYPES whose presence can
// affect THIS run's build ranking or feasibility.  ModificationFilter.apply
// skips cloning a mod variant whose NEW stat is not in this set: such a variant
// can't raise buildScore (priority 0), can't earn a target bonus (no target),
// and can't help pass a min-limit or force requirement — so it is dominated by
// the base item or by a relevant-stat variant and only bloats the search.
//
// A category counts as relevant if ANY of: a positive priority (global slider,
// per-slot row, or enabled per-set row), a stat target (min or max), a min-limit,
// or a force requirement.  Max-limits are intentionally excluded — a mod can only
// ADD a stat, which can never help satisfy a ceiling.  An EMPTY result tells the
// caller nothing is configured, so it can't distinguish useful from useless mods
// and must keep every variant (no pruning).
// ---------------------------------------------------------------------------
const _RELEVANCE_CAP = {
  atk: 'Atk',
  hp: 'Hp',
  def: 'Def',
  spd: 'Spd',
  cr: 'Cr',
  cd: 'Cd',
  eff: 'Eff',
  res: 'Res',
};
const _RELEVANCE_FORCE = {
  atk: [
    'inputAtkMinForce',
    'inputAtkMaxForce',
    'inputAtkPercentMinForce',
    'inputAtkPercentMaxForce',
  ],
  hp: [
    'inputHpMinForce',
    'inputHpMaxForce',
    'inputHpPercentMinForce',
    'inputHpPercentMaxForce',
  ],
  def: [
    'inputDefMinForce',
    'inputDefMaxForce',
    'inputDefPercentMinForce',
    'inputDefPercentMaxForce',
  ],
  spd: ['inputSpdMinForce', 'inputSpdMaxForce'],
  cr: ['inputCrMinForce', 'inputCrMaxForce'],
  cd: ['inputCdMinForce', 'inputCdMaxForce'],
  eff: ['inputEffMinForce', 'inputEffMaxForce'],
  res: ['inputResMinForce', 'inputResMaxForce'],
};
function computeRelevantStats(params) {
  const g = globalPriorities(params);
  const slotCfg = params.slotPriorityConfig || {};
  const setCfg = params.setPriorityConfig || {};
  // Resolve every slot/set row through the SAME _pickTypes the scorer uses, then
  // collect each TYPE that carries a positive override weight.  Reading row[t]
  // directly would miss a legacy 8-category row (e.g. { atk: 8 }) that _pickTypes
  // expands onto Attack/AttackPercent and calculateScore credits — which would
  // wrongly prune that category's mod variants.  Resolving once per row keeps the
  // relevance gate in lockstep with the authoritative weights.
  const overriddenTypes = new Set();
  const scanRow = (row, enabledOnly) => {
    if (!row || (enabledOnly && !row.enabled)) return;
    const resolved = _pickTypes(row);
    for (let i = 0; i < _ALL_SUBSTAT_TYPES.length; i += 1) {
      const t = _ALL_SUBSTAT_TYPES[i];
      if ((resolved[t] || 0) > 0) overriddenTypes.add(t);
    }
  };
  Object.keys(slotCfg).forEach((k) => scanRow(slotCfg[k], false));
  Object.keys(setCfg).forEach((k) => scanRow(setCfg[k], true));
  const catRelevant = (c) => {
    if ((g[c] || 0) > 0) return true;
    const cap = _RELEVANCE_CAP[c];
    if ((params[`input${cap}MinTarget`] || 0) > 0) return true;
    if ((params[`input${cap}Target`] || 0) > 0) return true;
    if ((params[`input${cap}MinLimit`] || 0) > 0) return true;
    if ((_RELEVANCE_FORCE[c] || []).some((f) => params[f] != null)) return true;
    for (let i = 0; i < _ALL_SUBSTAT_TYPES.length; i += 1) {
      const t = _ALL_SUBSTAT_TYPES[i];
      if (_STAT_CATEGORY[t] === c && overriddenTypes.has(t)) return true;
    }
    return false;
  };
  const out = new Set();
  for (let i = 0; i < _ALL_SUBSTAT_TYPES.length; i += 1) {
    const t = _ALL_SUBSTAT_TYPES[i];
    if (catRelevant(_STAT_CATEGORY[t])) out.add(t);
  }
  return out;
}

// Per-category legal-slot average of the materialized matrix → the 8 global slider
// values, so the globals stay a live summary of the per-slot rows (two-way bind).
// For each category, mean over (slot, legal type in that category) of the raw row
// weight — flat & % collapse into one summary number.
function globalFromMatrix(slotPriorityConfig) {
  const out = {};
  for (let i = 0; i < _PRIORITY_CATEGORIES.length; i += 1) {
    const c = _PRIORITY_CATEGORIES[i];
    const types = _ALL_SUBSTAT_TYPES.filter((t) => _STAT_CATEGORY[t] === c);
    let sum = 0;
    let n = 0;
    for (let j = 0; j < _ALL_SLOTS.length; j += 1) {
      const g = _ALL_SLOTS[j];
      for (let k = 0; k < types.length; k += 1) {
        const t = types[k];
        if (!_isLegalType(g, t)) continue;
        const row = slotPriorityConfig && slotPriorityConfig[g];
        sum += row && row[t] ? row[t] : 0;
        n += 1;
      }
    }
    out[c] = n > 0 ? Math.round((sum / n) * 10) / 10 : 0;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Set-aware filtering helpers (active only when a set is forced, setFormat≠0).
// ---------------------------------------------------------------------------
// Required-set NAMEs for the active format.  Mirrors the unions in
// applySetRequirementPreFilter (optimizerTab.js) — keep the two in sync.
function getRequiredSets(params) {
  const fmt = params.setFormat || 0;
  const s = params.inputSets || [];
  const u = (...arrs) => {
    const o = new Set();
    arrs.forEach((a) => (a || []).forEach((v) => o.add(v)));
    return o;
  };
  switch (fmt) {
    case 1:
      return u(s[0], s[1]);
    case 2:
    case 3:
      return u(s[0]);
    case 4:
      return u(s[0], s[1]);
    case 5:
      return u(s[0], s[1], s[2]);
    default:
      return new Set();
  }
}
function setForced(params) {
  return (params.setFormat || 0) !== 0 && getRequiredSets(params).size > 0;
}
const _OTHER_SET_GROUP = '__other__';
function _setAbbr(set) {
  if (set === _OTHER_SET_GROUP) return '·';
  return SET_ABBR[set] || (set ? set.replace('Set', '').slice(0, 2) : '?');
}

// ---------------------------------------------------------------------------
// Item-score cache
// Cache maps `${item.modId}:${reforgeFlag}` → {score, priority}.
// Valid only while `_scoreCacheHash` matches the current priority + base-stats
// combination.  When any of the 8 priority sliders or base stats change the
// hash mismatches → cache is cleared automatically on the next calculateScore
// call — no external invalidation needed for priority changes.
// `PriorityFilter.clearScoreCache()` is still called from `invalidateItemsCache`
// in optimizerTab.js to evict stale mod-UUID entries after a hero change.
// ---------------------------------------------------------------------------
const _scoreCache = new Map();
let _scoreCacheHash = null;

// Separate cache for the per-slot RANK score (calculateRankScore).  Kept apart
// from _scoreCache so calculateScore stays global-only and never thrashes when
// the mod config / per-slot config changes (which only the rank score depends
// on).  Keyed `${modId??id}:${reforge}:${pinSig}`.
const _rankCache = new Map();
let _rankCacheHash = null;

/**
 * Builds a compact string key encoding the 8 priority values plus the three
 * hero base stats that appear in the flat-substat → % normalization.
 * Including base stats means a hero switch automatically produces a different
 * hash, so the cache self-invalidates without needing an external clear.
 */
function buildPriorityHash(params, baseStats) {
  return (
    `${params.inputAtkPriority || 0}:${params.inputHpPriority || 0}:` +
    `${params.inputDefPriority || 0}:${params.inputSpdPriority || 0}:` +
    `${params.inputCrPriority || 0}:${params.inputCdPriority || 0}:` +
    `${params.inputEffPriority || 0}:${params.inputResPriority || 0}:` +
    `${Math.round(baseStats.atk || 0)}:${Math.round(baseStats.hp || 0)}:${Math.round(baseStats.def || 0)}`
  );
}

// Compact fingerprint of the hero mod config — everything that changes which
// mod candidates exist or what value they produce.  Folded into the rank hash
// so a mod-config edit invalidates the rank cache.
function _modConfigFingerprint(hero) {
  if (!hero) return '';
  const join = (a) => (Array.isArray(a) ? [...a].sort().join(',') : '');
  return [
    join(hero.keepStats),
    join(hero.ignoreStats),
    join(hero.discardStats),
    hero.limitRolls ?? '',
    hero.rollQuality ?? '',
    hero.modGrade ?? '',
    join(hero.modSlots),
    hero.keepStatOptions ?? '',
    hero.slotModConfig ? JSON.stringify(hero.slotModConfig) : '',
  ].join('|');
}

// Compact fingerprint of the materialized per-slot matrix (11 type weights per
// slot).  Folded into the score/rank hashes so editing a slot row invalidates
// both caches.
function _slotPriorityFingerprint(params) {
  const c = params.slotPriorityConfig;
  if (!c) return '';
  return Object.keys(c)
    .sort()
    .map((k) => {
      const s = c[k] || {};
      return `${k}:${_ALL_SUBSTAT_TYPES.map((t) => s[t] || 0).join(',')}`;
    })
    .join(';');
}

// Compact fingerprint of the per-set priority overrides (enabled sets + weights).
function _setPriorityFingerprint(params) {
  const c = params.setPriorityConfig;
  if (!c) return '';
  return Object.keys(c)
    .sort()
    .map((k) => {
      const s = c[k];
      if (!s || !s.enabled) return `${k}:0`;
      return `${k}:1:${_ALL_SUBSTAT_TYPES.map((t) => s[t] || 0).join(',')}`;
    })
    .join(';');
}

// Score hash = global+base hash + per-slot + per-set fingerprints.  item.score /
// item.priority now depend on the per-slot/per-set weights (they drive the build
// ranking), so the score cache must invalidate when those change.
function buildScoreHash(params, baseStats) {
  return `${buildPriorityHash(params, baseStats)}::${_slotPriorityFingerprint(params)}::${_setPriorityFingerprint(params)}`;
}

// Compact fingerprint of the target-priority ranks + scale.  calculateRankScore's
// mod-potential delta (A) is boosted by these, so a rank/scale edit must invalidate
// the rank cache (they are NOT in buildScoreHash, which stays target-rank-free).
function _targetRankFingerprint(params) {
  return [
    params.inputTargetRankScale || 0,
    params.inputAtkTargetRank || 0,
    params.inputHpTargetRank || 0,
    params.inputDefTargetRank || 0,
    params.inputSpdTargetRank || 0,
    params.inputCrTargetRank || 0,
    params.inputCdTargetRank || 0,
    params.inputEffTargetRank || 0,
    params.inputResTargetRank || 0,
  ].join(',');
}

// Rank hash = score hash + mod-config fingerprint (the mod-potential delta) +
// target-rank fingerprint (the breakpoint-aware boost).
function buildRankHash(params, baseStats, hero) {
  return `${buildScoreHash(params, baseStats)}::${_modConfigFingerprint(hero)}::${_targetRankFingerprint(params)}`;
}

// Per-item pin signature — pins/allowed-target restrictions are per-item (not
// in the global hash), so they go in the cache key instead.  Empty for the
// common no-pin case so those keys keep their compact shape.
function _pinSig(item) {
  const subs = item.substats || [];
  let has = false;
  for (let i = 0; i < subs.length; i += 1) {
    const s = subs[i];
    if (
      s.pinMod ||
      s.pinModOff ||
      (s.allowedTargetStats && s.allowedTargetStats.length)
    ) {
      has = true;
      break;
    }
  }
  if (!has) return '';
  return subs
    .map(
      (s) =>
        `${s.pinMod ? 1 : 0}${s.pinModOff ? 1 : 0}${(s.allowedTargetStats || []).join('/')}`,
    )
    .join('|');
}

function calculateScore(item, params, baseStats, reforge) {
  // --- Cache lookup ---
  const hash = buildScoreHash(params, baseStats);
  if (hash !== _scoreCacheHash) {
    _scoreCache.clear();
    _scoreCacheHash = hash;
  }
  const cacheKey = `${item.modId ?? item.id}:${reforge ? 1 : 0}`;
  const cached = _scoreCache.get(cacheKey);
  if (cached !== undefined) {
    item.score = cached.score;
    item.priority = cached.priority;
    item.priorityScore = cached.priorityScore;
    return;
  }
  // --- End cache lookup ---

  const stats = reforge ? item.reforgedStats : item.augmentedStats;

  // Per-slot / per-set effective weights, keyed by the 11 real substat TYPES (flat
  // & % distinct), with precedence set > slot > global and the 9-roll budget
  // normalization (budget mode).  Each type's roll-normalized value (substat +
  // matching main) is weighted by its own weight.  item.score / item.priority are
  // summed by Java into the build priority and drive the headline ranking.  In the
  // non-budget global default, flat & % share their category weight, so this
  // reproduces the prior per-category score exactly.
  const w = resolveEffectivePriorities(params, item.gear, item.set);
  let score = 0;
  for (let i = 0; i < _ALL_SUBSTAT_TYPES.length; i += 1) {
    const t = _ALL_SUBSTAT_TYPES[i];
    const wt = w[t] || 0;
    if (!wt) continue;
    const val = (stats[t] || 0) + mainTypeValue(stats, t);
    score += statRolls(t, val, baseStats) * wt;
  }

  item.score = !Number.isFinite(score) ? 0 : score;
  item.priority = !Number.isFinite(score) ? 0 : Math.max(0, Math.round(score));
  // Higher-precision per-item weighted score (×100) sent to the backend, which sums it
  // into the build-level `buildScore` ranking (avoids the per-item rounding the integer
  // `priority` loses).  `priority` itself is unchanged (legacy `prio` column + filters).
  item.priorityScore = !Number.isFinite(score)
    ? 0
    : Math.max(0, Math.round(score * 100));
  _scoreCache.set(cacheKey, {
    score: item.score,
    priority: item.priority,
    priorityScore: item.priorityScore,
  });
}

// ---------------------------------------------------------------------------
// Per-slot-weighted RANK score — used ONLY to rank the per-slot filter cut.
// It is deliberately separate from calculateScore / item.score / item.priority
// (those stay GLOBAL so Java's per-build `priority` sum + `inputMinPriorityLimit`
// and the grid 'prio'/'score' columns are unaffected).  Two ingredients:
//   1. current score using the slot's effective weights (per-slot override or
//      global), and
//   2. the best achievable single-substat-mod potential delta (same mod rules
//      as ModificationFilter, computed as a cheap stat-swap — no cloning).
// Sets item.rankScore and item.potentialScore.
// ---------------------------------------------------------------------------
function calculateRankScore(item, params, baseStats, reforge, hero) {
  // --- Cache lookup ---
  const hash = buildRankHash(params, baseStats, hero);
  if (hash !== _rankCacheHash) {
    _rankCache.clear();
    _rankCacheHash = hash;
  }
  const cacheKey = `${item.modId ?? item.id}:${reforge ? 1 : 0}:${_pinSig(item)}`;
  const cached = _rankCache.get(cacheKey);
  if (cached !== undefined) {
    item.rankScore = cached.rankScore;
    item.potentialScore = cached.potentialScore;
    return item.rankScore;
  }
  // --- End cache lookup ---

  // weights is keyed by the 11 real substat TYPES (flat & % distinct), expanded
  // from the item's effective category weights (set > slot > global, normalized).
  const weights = resolveEffectivePriorities(params, item.gear, item.set);
  const stats = reforge ? item.reforgedStats : item.augmentedStats;

  let baseRank = 0;
  for (let i = 0; i < _ALL_SUBSTAT_TYPES.length; i += 1) {
    const t = _ALL_SUBSTAT_TYPES[i];
    const w = weights[t] || 0;
    if (!w) continue;
    const val = (stats[t] || 0) + mainTypeValue(stats, t);
    baseRank += statRolls(t, val, baseStats) * w;
  }

  // Best single-mod potential: swapping one substat changes exactly two substat
  // contributions, so each candidate's delta is a cheap stat-swap weighted by
  // the per-substat weights.  `stats[originalType]` is what apply() zeroes;
  // `cand.value` is what it writes to both augmented & reforged stats — so this
  // delta matches the real variant.
  //
  // A (breakpoint-aware gate): bias each candidate's positive delta by the
  // replacement stat's target-priority rank, so a mod that's critical to hitting
  // a target (e.g. the +SPD that reaches 310 on an opener) survives the per-slot
  // cut even when its raw priority weight is modest.  Mirrors the rankFactor the
  // final build-score target bonus uses; ×1 (no change) when ranks/scale are
  // unset, so a run without Target Priority ranks ranks exactly as before.
  const _rankScale = params.inputTargetRankScale || 0;
  const _rankByCat = {
    atk: params.inputAtkTargetRank,
    hp: params.inputHpTargetRank,
    def: params.inputDefTargetRank,
    spd: params.inputSpdTargetRank,
    cr: params.inputCrTargetRank,
    cd: params.inputCdTargetRank,
    eff: params.inputEffTargetRank,
    res: params.inputResTargetRank,
  };
  const _rankFactorOf = (type) => {
    if (_rankScale <= 0) return 1;
    const rank = _rankByCat[_STAT_CATEGORY[type]] || 0;
    return rank > 0 ? 1 + (8 - rank) * _rankScale : 1;
  };

  let bestDelta = 0;
  const candidates = ModificationFilter.enumerateModCandidates(
    item,
    hero || {},
  );
  for (let k = 0; k < candidates.length; k += 1) {
    const cand = candidates[k];
    const remRoll =
      statRolls(cand.originalType, stats[cand.originalType] || 0, baseStats) *
      (weights[cand.originalType] || 0);
    const addRoll =
      statRolls(cand.replacementStat, cand.value, baseStats) *
      (weights[cand.replacementStat] || 0);
    const delta = addRoll - remRoll;
    const boosted =
      delta > 0 ? delta * _rankFactorOf(cand.replacementStat) : delta;
    if (boosted > bestDelta) bestDelta = boosted;
  }

  const rank = baseRank + Math.max(0, bestDelta);
  item.rankScore = !Number.isFinite(rank) ? 0 : rank;
  item.potentialScore = item.rankScore;
  _rankCache.set(cacheKey, {
    rankScore: item.rankScore,
    potentialScore: item.potentialScore,
  });
  return item.rankScore;
}

// Scores a complete build (backend result row) using the same roll-normalization
// as calculateScore, isolating only gear substat/main contribution by stripping:
//   • fixed gear mains (weapon ATK, helm HP, armor DEF)
//   • artifact stats
//   • imprint (bonus*) and Exclusive Equipment (aei*) bonuses
//   • set bonuses for this specific build (heroStat.sets is the Java int[] by enum index)
function calculateBuildScore(heroStat, params, baseStats, verbose = false) {
  if (!baseStats?.atk) return 0;

  const hero = params.hero || {};
  const s = heroStat.sets || [];

  // ── Fixed gear mains (constant for +15 lvl-85 gear) ─────────────────────
  const WEAPON_ATK = 525;
  const HELM_HP = 2835;
  const ARMOR_DEF = 310;

  // ── Artifact contributions ────────────────────────────────────────────────
  const artiAtk = hero.artifactAttack || 0;
  const artiHp = hero.artifactHealth || 0;
  const artiDef = hero.artifactDefense || 0;

  // ── Effective base = raw base + imprint (bonus*) + EE (aei*) ─────────────
  // Mirrors Java StatCalculator.setBaseValues() bonusBaseAtk/Hp/Def formulas.
  const rawAtk = baseStats.atk;
  const rawHp = baseStats.hp;
  const rawDef = baseStats.def;
  const rawSpd = baseStats.spd || 0;

  const effBaseAtk =
    rawAtk *
      (1 + ((hero.bonusAtkPercent || 0) + (hero.aeiAtkPercent || 0)) / 100) +
    (hero.bonusAtk || 0) +
    (hero.aeiAtk || 0);
  const effBaseHp =
    rawHp *
      (1 + ((hero.bonusHpPercent || 0) + (hero.aeiHpPercent || 0)) / 100) +
    (hero.bonusHp || 0) +
    (hero.aeiHp || 0);
  const effBaseDef =
    rawDef *
      (1 + ((hero.bonusDefPercent || 0) + (hero.aeiDefPercent || 0)) / 100) +
    (hero.bonusDef || 0) +
    (hero.aeiDef || 0);
  const effBaseSpd = rawSpd + (hero.bonusSpeed || 0) + (hero.aeiSpeed || 0);
  const effBaseCr =
    (baseStats.cr || 0) + (hero.bonusCr || 0) + (hero.aeiCr || 0);
  const effBaseCd =
    (baseStats.cd || 0) + (hero.bonusCd || 0) + (hero.aeiCd || 0);
  // Some hero data sources store eff/res as decimal 0-1 rather than integer %. Normalize.
  const rawEff =
    (baseStats.eff ?? 0) < 1
      ? (baseStats.eff ?? 0) * 100
      : (baseStats.eff ?? 0);
  const rawRes =
    (baseStats.res ?? 0) < 1
      ? (baseStats.res ?? 0) * 100
      : (baseStats.res ?? 0);
  const effBaseEff = rawEff + (hero.bonusEff || 0) + (hero.aeiEff || 0);
  const effBaseRes = rawRes + (hero.bonusRes || 0) + (hero.aeiRes || 0);

  // ── Set bonuses for this build (heroStat.sets int[] indexed by Set.java enum)
  // Set bonus constants use raw base, matching Java StatCalculator.setBaseValues().
  const atkSetBonus = (s[SET_INDEX.AttackSet] || 0) >= 4 ? 0.45 * rawAtk : 0;
  const hpSetBonus =
    Math.floor((s[SET_INDEX.HealthSet] || 0) / 2) * 0.2 * rawHp +
    ((s[SET_INDEX.WarfareSet] || 0) >= 4 ? 0.2 * rawHp : 0) -
    Math.floor((s[SET_INDEX.TorrentSet] || 0) / 2) * 0.1 * rawHp; // TorrentSet subtracts HP
  const defSetBonus =
    Math.floor((s[SET_INDEX.DefenseSet] || 0) / 2) * 0.2 * rawDef;
  const crSetBonus = Math.floor((s[SET_INDEX.CriticalSet] || 0) / 2) * 12;
  const cdSetBonus = (s[SET_INDEX.DestructionSet] || 0) >= 4 ? 60 : 0;
  const effSetBonus = Math.floor((s[SET_INDEX.HitSet] || 0) / 2) * 20;
  const resSetBonus = Math.floor((s[SET_INDEX.ResistSet] || 0) / 2) * 20;
  const spdSetBonus =
    ((s[SET_INDEX.SpeedSet] || 0) >= 4 ? Math.floor(0.25 * rawSpd) : 0) +
    ((s[SET_INDEX.RevengeSet] || 0) >= 4 ? Math.floor(0.12 * rawSpd) : 0) +
    ((s[SET_INDEX.ReversalSet] || 0) >= 4 ? Math.floor(0.15 * rawSpd) : 0) +
    ((s[SET_INDEX.WeakeningSet] || 0) >= 4 ? Math.floor(0.15 * rawSpd) : 0);

  // ── Roll counts (pure gear substat + variable-main contribution only) ─────
  const atkRolls =
    (((heroStat.atk - effBaseAtk - WEAPON_ATK - artiAtk - atkSetBonus) /
      rawAtk) *
      100) /
    ROLL_DIVISORS.AttackPercent;
  const hpRolls =
    (((heroStat.hp - effBaseHp - HELM_HP - artiHp - hpSetBonus) / rawHp) *
      100) /
    ROLL_DIVISORS.HealthPercent;
  const defRolls =
    (((heroStat.def - effBaseDef - ARMOR_DEF - artiDef - defSetBonus) /
      rawDef) *
      100) /
    ROLL_DIVISORS.DefensePercent;
  const spdRolls =
    (heroStat.spd - effBaseSpd - spdSetBonus) / ROLL_DIVISORS.Speed;
  // Cap CR at 100 — matches grid display; over-cap CR provides no additional column value.
  const crRolls =
    (Math.min(100, heroStat.cr) - effBaseCr - crSetBonus) /
    ROLL_DIVISORS.CriticalHitChancePercent;
  // Cap CD at 350 + hero.cdCapBonus — some heroes raise the effective CD cap above 350.
  const cdCap = 350 + (hero.cdCapBonus || 0);
  const cdRolls =
    (Math.min(cdCap, heroStat.cd) - effBaseCd - cdSetBonus) /
    ROLL_DIVISORS.CriticalHitDamagePercent;
  const effRolls =
    (heroStat.eff - effBaseEff - effSetBonus) /
    ROLL_DIVISORS.EffectivenessPercent;
  const resRolls =
    (heroStat.res - effBaseRes - resSetBonus) /
    ROLL_DIVISORS.EffectResistancePercent;

  const score =
    atkRolls * (params.inputAtkPriority || 0) +
    hpRolls * (params.inputHpPriority || 0) +
    defRolls * (params.inputDefPriority || 0) +
    spdRolls * (params.inputSpdPriority || 0) +
    crRolls * (params.inputCrPriority || 0) +
    cdRolls * (params.inputCdPriority || 0) +
    effRolls * (params.inputEffPriority || 0) +
    resRolls * (params.inputResPriority || 0);

  // Target bonus — supports single target or min/max target range.
  //
  // Single target (only inputXxxTarget set — backward compat):
  //   Below target: linear 0→1. At target: 1. Above: 1 + (ratio-1)*0.1
  //
  // Range targets (both inputXxxMinTarget + inputXxxTarget set):
  //   Below minTarget: linear 0→1 (partial credit).
  //   Between minTarget and maxTarget: full credit = 1.
  //   Above maxTarget: 1 + (stat/maxTarget - 1)*0.1 (slight bonus — not wasteful).
  //
  // Only minTarget set: treated as current single-target behavior.
  // Only maxTarget set: full credit at or below maxTarget, slight bonus above.
  //
  // A target/sweet-spot counts even when the stat's priority is 0: setting a target
  // is itself the "I care about this value" signal.  The target bonus then uses an
  // implicit weight of 1 (positive priorities scale it up); the per-roll `score`
  // above stays unweighted at priority 0, so "hit this value" is decoupled from
  // "maximize rolls in this stat."
  const targetRatio = (stat, target) => {
    const r = stat / target;
    return r >= 1 ? 1 + (r - 1) * 0.1 : r;
  };
  // Sweet-spot ("median target") gentle nudge: an ADDITIVE bonus layered on top of
  // the in-range plateau — largest at the median (medT) and tapering linearly to 0
  // at the min/max edges.  Backward-compatible: medT unset (≤0) or not strictly
  // inside (minT, maxT) contributes nothing, so the curve is identical to before.
  // SWEET_PEAK is in priority units (like the plateau's 1.0), so a build sitting on
  // the median earns up to +SWEET_PEAK × priority extra.  Mirrors Java StatCalculator.
  const SWEET_PEAK = 0.5;
  const sweetSpotBonus = (stat, minT, medT, maxT) => {
    if (!(medT > minT && medT < maxT)) return 0; // need a valid median strictly inside the range
    if (stat <= minT || stat >= maxT) return 0; // no bonus at or outside the edges
    const t =
      stat <= medT
        ? (stat - minT) / (medT - minT) // rising edge: 0 at min → 1 at median
        : (maxT - stat) / (maxT - medT); // falling edge: 1 at median → 0 at max
    return SWEET_PEAK * t;
  };
  const targetRangeRatio = (stat, minT, maxT, medT) => {
    const base =
      stat >= minT && stat <= maxT
        ? 1
        : stat < minT
          ? stat / minT
          : // stat > maxT — slight bonus for exceeding the ceiling
            1 + (stat / maxT - 1) * 0.1;
    return base + sweetSpotBonus(stat, minT, medT, maxT);
  };

  const statTargetBonus = (stat, minT, maxT, medT, priority) => {
    const hasMin = minT > 0;
    const hasMax = maxT > 0;
    if (!hasMin && !hasMax) return 0;
    // A target counts even at priority 0 — use an implicit weight of 1 for the bonus
    // (rolls stay unweighted via `score`); positive priorities scale it as before.
    const p = priority > 0 ? priority : 1;
    // Median sweet-spot only applies within a full [min,max] range.
    if (hasMin && hasMax) return targetRangeRatio(stat, minT, maxT, medT) * p;
    if (hasMin) return targetRatio(stat, minT) * p;
    return targetRatio(stat, maxT) * p;
  };

  // Per-hero target-priority rank multiplier (mirrors StatCalculator.rankFactor): rank 1
  // (highest) gets the biggest boost; unranked (0) or scale 0 → ×1.
  const rankScale = params.inputTargetRankScale || 0;
  const rankFactor = (rank) => (rank > 0 ? 1 + (8 - rank) * rankScale : 1);

  const targetBonus =
    statTargetBonus(
      heroStat.atk,
      params.inputAtkMinTarget,
      params.inputAtkTarget,
      params.inputAtkSweetTarget,
      params.inputAtkPriority,
    ) *
      rankFactor(params.inputAtkTargetRank) +
    statTargetBonus(
      heroStat.hp,
      params.inputHpMinTarget,
      params.inputHpTarget,
      params.inputHpSweetTarget,
      params.inputHpPriority,
    ) *
      rankFactor(params.inputHpTargetRank) +
    statTargetBonus(
      heroStat.def,
      params.inputDefMinTarget,
      params.inputDefTarget,
      params.inputDefSweetTarget,
      params.inputDefPriority,
    ) *
      rankFactor(params.inputDefTargetRank) +
    statTargetBonus(
      heroStat.spd,
      params.inputSpdMinTarget,
      params.inputSpdTarget,
      params.inputSpdSweetTarget,
      params.inputSpdPriority,
    ) *
      rankFactor(params.inputSpdTargetRank) +
    statTargetBonus(
      heroStat.cr,
      params.inputCrMinTarget,
      params.inputCrTarget,
      params.inputCrSweetTarget,
      params.inputCrPriority,
    ) *
      rankFactor(params.inputCrTargetRank) +
    statTargetBonus(
      heroStat.cd,
      params.inputCdMinTarget,
      params.inputCdTarget,
      params.inputCdSweetTarget,
      params.inputCdPriority,
    ) *
      rankFactor(params.inputCdTargetRank) +
    statTargetBonus(
      heroStat.eff,
      params.inputEffMinTarget,
      params.inputEffTarget,
      params.inputEffSweetTarget,
      params.inputEffPriority,
    ) *
      rankFactor(params.inputEffTargetRank) +
    statTargetBonus(
      heroStat.res,
      params.inputResMinTarget,
      params.inputResTarget,
      params.inputResSweetTarget,
      params.inputResPriority,
    ) *
      rankFactor(params.inputResTargetRank);

  const total = score + targetBonus;

  if (verbose) {
    const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
    const P = params;
    // Per-stat target bonus (recompute individually for display; same statTargetBonus
    // used in the sum above).  Arg order = (stat, minT, maxT, medT, priority).
    const tb = (stat, minId, maxId, sweetId, prio) =>
      statTargetBonus(
        stat,
        P[minId] || 0,
        P[maxId] || 0,
        P[sweetId] || 0,
        prio || 0,
      );
    // Fixed left-side gear mains (Weapon flat ATK, Helmet flat HP, Armor flat DEF) are
    // excluded from the roll math above, but the BACKEND scores them.  They're identical
    // on every build (ranking-neutral); adding them back just reconciles this total with
    // the backend bscr so the two numbers line up.
    const fmRolls = (mainVal, base, div) =>
      base > 0 ? ((mainVal / base) * 100) / div : 0;
    const fmAtk =
      fmRolls(WEAPON_ATK, rawAtk, ROLL_DIVISORS.AttackPercent) *
      (P.inputAtkPriority || 0);
    const fmHp =
      fmRolls(HELM_HP, rawHp, ROLL_DIVISORS.HealthPercent) *
      (P.inputHpPriority || 0);
    const fmDef =
      fmRolls(ARMOR_DEF, rawDef, ROLL_DIVISORS.DefensePercent) *
      (P.inputDefPriority || 0);
    const fixedMainScore = fmAtk + fmHp + fmDef;

    const STATS = [
      [
        'ATK',
        heroStat.atk,
        effBaseAtk,
        atkSetBonus,
        WEAPON_ATK,
        atkRolls,
        P.inputAtkPriority,
        tb(
          heroStat.atk,
          'inputAtkMinTarget',
          'inputAtkTarget',
          'inputAtkSweetTarget',
          P.inputAtkPriority,
        ),
      ],
      [
        'HP',
        heroStat.hp,
        effBaseHp,
        hpSetBonus,
        HELM_HP,
        hpRolls,
        P.inputHpPriority,
        tb(
          heroStat.hp,
          'inputHpMinTarget',
          'inputHpTarget',
          'inputHpSweetTarget',
          P.inputHpPriority,
        ),
      ],
      [
        'DEF',
        heroStat.def,
        effBaseDef,
        defSetBonus,
        ARMOR_DEF,
        defRolls,
        P.inputDefPriority,
        tb(
          heroStat.def,
          'inputDefMinTarget',
          'inputDefTarget',
          'inputDefSweetTarget',
          P.inputDefPriority,
        ),
      ],
      [
        'SPD',
        heroStat.spd,
        effBaseSpd,
        spdSetBonus,
        0,
        spdRolls,
        P.inputSpdPriority,
        tb(
          heroStat.spd,
          'inputSpdMinTarget',
          'inputSpdTarget',
          'inputSpdSweetTarget',
          P.inputSpdPriority,
        ),
      ],
      [
        'CR',
        heroStat.cr,
        effBaseCr,
        crSetBonus,
        0,
        crRolls,
        P.inputCrPriority,
        tb(
          heroStat.cr,
          'inputCrMinTarget',
          'inputCrTarget',
          'inputCrSweetTarget',
          P.inputCrPriority,
        ),
      ],
      [
        'CD',
        heroStat.cd,
        effBaseCd,
        cdSetBonus,
        0,
        cdRolls,
        P.inputCdPriority,
        tb(
          heroStat.cd,
          'inputCdMinTarget',
          'inputCdTarget',
          'inputCdSweetTarget',
          P.inputCdPriority,
        ),
      ],
      [
        'EFF',
        heroStat.eff,
        effBaseEff,
        effSetBonus,
        0,
        effRolls,
        P.inputEffPriority,
        tb(
          heroStat.eff,
          'inputEffMinTarget',
          'inputEffTarget',
          'inputEffSweetTarget',
          P.inputEffPriority,
        ),
      ],
      [
        'RES',
        heroStat.res,
        effBaseRes,
        resSetBonus,
        0,
        resRolls,
        P.inputResPriority,
        tb(
          heroStat.res,
          'inputResMinTarget',
          'inputResTarget',
          'inputResSweetTarget',
          P.inputResPriority,
        ),
      ],
    ];
    const rankByStat = {
      ATK: P.inputAtkTargetRank,
      HP: P.inputHpTargetRank,
      DEF: P.inputDefTargetRank,
      SPD: P.inputSpdTargetRank,
      CR: P.inputCrTargetRank,
      CD: P.inputCdTargetRank,
      EFF: P.inputEffTargetRank,
      RES: P.inputResTargetRank,
    };
    const table = STATS.map(
      ([s, final, base, set, fixed, rolls, prio, tgt]) => {
        const rank = rankByStat[s] || 0;
        return {
          stat: s,
          final: Math.round(final),
          heroBase: Math.round(base),
          setBonus: Math.round(set),
          fixedMain: Math.round(fixed),
          'scored rolls': r2(rolls),
          priority: r2(prio || 0),
          'roll contrib': r2((rolls || 0) * (prio || 0)),
          'tgt rank': rank || '',
          'rank ×': r2(rankFactor(rank)),
          'target bonus': r2(tgt * rankFactor(rank)),
        };
      },
    );

    Log.groupCollapsed(
      `%c[bscr] spd=${Math.round(heroStat.spd)} cr=${Math.round(heroStat.cr)} | backend bscr=${
        heroStat.buildScore != null
          ? (heroStat.buildScore / 100).toFixed(1)
          : 'n/a'
      }`,
      'color:#59c9c9;font-weight:bold',
    );
    Log.debug(
      `hero base: atk ${Math.round(rawAtk)}  hp ${Math.round(rawHp)}  def ${Math.round(rawDef)}  spd ${Math.round(rawSpd)}   (effBase spd ${Math.round(effBaseSpd)} incl. imprint/EE)`,
    );
    Log.table(table);
    if (rankScale > 0) {
      Log.debug(
        `target-priority scale = ${rankScale} (rank 1 = strongest; bonus ×[1 + (8 − rank) × scale])`,
      );
    }
    Log.debug(
      `SPD ${Math.round(heroStat.spd)} = heroBase ${Math.round(effBaseSpd)} + set ${Math.round(
        spdSetBonus,
      )} + gear(main+subs) ${Math.round(heroStat.spd - effBaseSpd - spdSetBonus)}  →  scored ${r2(
        spdRolls,
      )} rolls × prio ${r2(P.inputSpdPriority)} = ${r2(
        spdRolls * (P.inputSpdPriority || 0),
      )}   ⚠ the +${Math.round(spdSetBonus)} Speed-SET bonus is NOT scored (only rolls+main are)`,
    );
    Log.debug(
      `TOTALS:  roll contrib (gear) ${r2(score)}  +  fixed mains W/H/A ${r2(fixedMainScore)}  +  target bonus ${r2(
        targetBonus,
      )}  =  ${r2(score + fixedMainScore + targetBonus)}   ≈ backend bscr ${
        heroStat.buildScore != null
          ? (heroStat.buildScore / 100).toFixed(2)
          : 'n/a'
      }`,
    );
    Log.debug(
      `(JS-fallback total, fixed mains excluded = ${r2(total)} — what an old cached row would show)`,
    );
    Log.groupEnd();
  }

  return Number.isNaN(total) ? 0 : Math.round(total * 100) / 100;
}

// Estimates the approximate total stat value for each stat given the current
// priority sliders, hero base stats, selected sets, and accessory main stats.
// Formula per stat: effBase + fixedGear + setBonus + bestMainStat + rollDivisor * priority
// Not precise — gives the user a reference point while adjusting priorities.
// The per-stat roll terms compete for one SHARED substat-roll budget (~54 roll-units
// per build): when the priorities collectively ask for more than that, the substat
// portion of every stat is scaled down proportionally so the projected totals stay
// jointly achievable (you can't max four stats at once on 24 substat lines).
function estimatePriorityStats(params, baseStats) {
  if (!baseStats?.atk) return null;

  const hero = params.hero || {};
  const rawAtk = baseStats.atk || 0;
  const rawHp = baseStats.hp || 0;
  const rawDef = baseStats.def || 0;
  const rawSpd = baseStats.spd || 0;
  const rawCr = 15; // E7 floor — same for every hero
  const rawCd = 150; // E7 floor — same for every hero
  const rawEff = 0; // E7 floor — same for every hero
  const rawRes = 0; // E7 floor — same for every hero

  const effBaseAtk =
    rawAtk *
      (1 + ((hero.bonusAtkPercent || 0) + (hero.aeiAtkPercent || 0)) / 100) +
    (hero.bonusAtk || 0) +
    (hero.aeiAtk || 0);
  const effBaseHp =
    rawHp *
      (1 + ((hero.bonusHpPercent || 0) + (hero.aeiHpPercent || 0)) / 100) +
    (hero.bonusHp || 0) +
    (hero.aeiHp || 0);
  const effBaseDef =
    rawDef *
      (1 + ((hero.bonusDefPercent || 0) + (hero.aeiDefPercent || 0)) / 100) +
    (hero.bonusDef || 0) +
    (hero.aeiDef || 0);
  const effBaseSpd = rawSpd + (hero.bonusSpeed || 0) + (hero.aeiSpeed || 0);
  const effBaseCr = rawCr + (hero.bonusCr || 0) + (hero.aeiCr || 0);
  const effBaseCd = rawCd + (hero.bonusCd || 0) + (hero.aeiCd || 0);
  const effBaseEff = rawEff + (hero.bonusEff || 0) + (hero.aeiEff || 0);
  const effBaseRes = rawRes + (hero.bonusRes || 0) + (hero.aeiRes || 0);

  const allSets = [
    ...(params.inputSetsOne || []),
    ...(params.inputSetsTwo || []),
    ...(params.inputSetsThree || []),
  ];
  const hasSet = (name) => allSets.includes(name);
  const countSet = (name) => allSets.filter((s) => s === name).length;

  // Bug fix: 2-piece sets (HealthSet, DefenseSet, CriticalSet, HitSet, ResistSet) must count
  // all selected pairs — if the user picks HealthSet in two filter slots that's 2 pairs (+40% HP).
  const atkSetBonus = hasSet('AttackSet') ? Math.floor(0.45 * rawAtk) : 0;
  const hpSetBonus =
    Math.floor(countSet('HealthSet') * 0.2 * rawHp) +
    (hasSet('WarfareSet') ? Math.floor(0.2 * rawHp) : 0);
  const defSetBonus = Math.floor(countSet('DefenseSet') * 0.2 * rawDef);
  const crSetBonus = countSet('CriticalSet') * 12;
  const cdSetBonus = hasSet('DestructionSet') ? 60 : 0;
  const effSetBonus = countSet('HitSet') * 20;
  const resSetBonus = countSet('ResistSet') * 20;
  const spdSetBonus = hasSet('SpeedSet')
    ? Math.floor(0.25 * rawSpd)
    : hasSet('RevengeSet')
      ? Math.floor(0.12 * rawSpd)
      : hasSet('ReversalSet')
        ? Math.floor(0.15 * rawSpd)
        : hasSet('WeakeningSet')
          ? Math.floor(0.15 * rawSpd)
          : 0;

  const neck = params.inputNecklaceStat || [];
  const ring = params.inputRingStat || [];
  const boots = params.inputBootsStat || [];

  // Returns [mainContrib, subRollPerPriorityUnit] for one accessory slot.
  // main/sub depends on which of %, flat, both, or neither are in the filter:
  //   % only  → main = pctMainVal × (1/arr.length),            sub = flatSubRoll
  //   flat only → main = flatMainVal × (1/arr.length),          sub = pctSubRoll
  //   both    → main = avg(pct,flat) × (2/arr.length),          sub = avg(pctSubRoll, flatSubRoll)
  //   neither / open → main = 0, sub = pctSubRoll + flatSubRoll
  const accStatContrib = (
    arr,
    pctStat,
    flatStat,
    pctMainVal,
    flatMainVal,
    pctSubRoll,
    flatSubRoll,
  ) => {
    const hasPct = arr.includes(pctStat);
    const hasFlat = arr.includes(flatStat);
    if (arr.length === 0 || (!hasPct && !hasFlat)) {
      return [0, pctSubRoll + flatSubRoll];
    }
    const matchCount = (hasPct ? 1 : 0) + (hasFlat ? 1 : 0);
    const frac = matchCount / arr.length;
    if (hasPct && hasFlat) {
      return [
        ((pctMainVal + flatMainVal) / 2) * frac,
        (pctSubRoll + flatSubRoll) / 2,
      ];
    }
    if (hasPct) {
      return [pctMainVal * frac, flatSubRoll];
    }
    return [flatMainVal * frac, pctSubRoll];
  };

  const pctAtkSub = (ROLL_DIVISORS.AttackPercent / 100) * rawAtk;
  const pctHpSub = (ROLL_DIVISORS.HealthPercent / 100) * rawHp;
  const pctDefSub = (ROLL_DIVISORS.DefensePercent / 100) * rawDef;
  const flatAtkSub = ROLL_DIVISORS.Attack;
  const flatHpSub = ROLL_DIVISORS.Health;
  const flatDefSub = ROLL_DIVISORS.Defense;

  const [neckAtkMain, neckAtkSub] = accStatContrib(
    neck,
    'AttackPercent',
    'Attack',
    (0.65 * rawAtk) / 6,
    525 / 6,
    pctAtkSub,
    flatAtkSub,
  );
  const [ringAtkMain, ringAtkSub] = accStatContrib(
    ring,
    'AttackPercent',
    'Attack',
    (0.65 * rawAtk) / 6,
    525 / 6,
    pctAtkSub,
    flatAtkSub,
  );
  const [bootsAtkMain, bootsAtkSub] = accStatContrib(
    boots,
    'AttackPercent',
    'Attack',
    (0.65 * rawAtk) / 6,
    525 / 6,
    pctAtkSub,
    flatAtkSub,
  );
  const mainAtk = neckAtkMain + ringAtkMain + bootsAtkMain;
  const rightSubAtk = neckAtkSub + ringAtkSub + bootsAtkSub;

  const [neckHpMain, neckHpSub] = accStatContrib(
    neck,
    'HealthPercent',
    'Health',
    (0.65 * rawHp) / 6,
    2835 / 6,
    pctHpSub,
    flatHpSub,
  );
  const [ringHpMain, ringHpSub] = accStatContrib(
    ring,
    'HealthPercent',
    'Health',
    (0.65 * rawHp) / 6,
    2835 / 6,
    pctHpSub,
    flatHpSub,
  );
  const [bootsHpMain, bootsHpSub] = accStatContrib(
    boots,
    'HealthPercent',
    'Health',
    (0.65 * rawHp) / 6,
    2835 / 6,
    pctHpSub,
    flatHpSub,
  );
  const mainHp = neckHpMain + ringHpMain + bootsHpMain;
  const rightSubHp = neckHpSub + ringHpSub + bootsHpSub;

  const [neckDefMain, neckDefSub] = accStatContrib(
    neck,
    'DefensePercent',
    'Defense',
    (0.65 * rawDef) / 6,
    310 / 6,
    pctDefSub,
    flatDefSub,
  );
  const [ringDefMain, ringDefSub] = accStatContrib(
    ring,
    'DefensePercent',
    'Defense',
    (0.65 * rawDef) / 6,
    310 / 6,
    pctDefSub,
    flatDefSub,
  );
  const [bootsDefMain, bootsDefSub] = accStatContrib(
    boots,
    'DefensePercent',
    'Defense',
    (0.65 * rawDef) / 6,
    310 / 6,
    pctDefSub,
    flatDefSub,
  );
  const mainDef = neckDefMain + ringDefMain + bootsDefMain;
  const rightSubDef = neckDefSub + ringDefSub + bootsDefSub;

  const mainSpd = boots.includes('Speed') ? 45 / 6 : 0;
  const mainCr = neck.includes('CriticalHitChancePercent') ? 60 / 6 : 0;
  const mainCd = neck.includes('CriticalHitDamagePercent') ? 70 / 6 : 0;
  const mainEff = ring.includes('EffectivenessPercent') ? 65 / 6 : 0;
  const mainRes = ring.includes('EffectResistancePercent') ? 65 / 6 : 0;

  const p = (key) => Math.max(0, params[key] || 0);

  const spdMainSlots = mainSpd > 0 ? 1 : 0;
  const crMainSlots = mainCr > 0 ? 1 : 0;
  const cdMainSlots = mainCd > 0 ? 1 : 0;
  const effMainSlots = mainEff > 0 ? 1 : 0;
  const resMainSlots = mainRes > 0 ? 1 : 0;

  const pAtk = p('inputAtkPriority');
  const pHp = p('inputHpPriority');
  const pDef = p('inputDefPriority');
  const pSpd = p('inputSpdPriority');
  const pCr = p('inputCrPriority');
  const pCd = p('inputCdPriority');
  const pEff = p('inputEffPriority');
  const pRes = p('inputResPriority');

  const weaponMain = 525;
  const helmMain = 2835;
  const armorMain = 310;

  // Left-side substat roll base (no priority yet) — sum of the legal substat-type
  // rolls across the 3 left slots (Weapon/Helmet/Armor), matching the per-slot model
  // used by accStatContrib (accessories, each open slot = pct + flat) and the SPD term.
  // E7 substat legality per left slot:
  //   ATK: Weapon=ATK%, Helmet=ATK%+flatATK, Armor=none        → 2·pct + flat
  //   DEF: Weapon=none, Helmet=DEF%+flatDEF, Armor=DEF%         → 2·pct + flat
  //   HP : Weapon=HP%+flatHP, Helmet=HP%, Armor=HP%+flatHP      → 3·pct + 2·flat
  const leftAtkRolls = pctAtkSub * 2 + flatAtkSub;
  const leftDefRolls = pctDefSub * 2 + flatDefSub;
  const leftHpRolls = pctHpSub * 3 + flatHpSub * 2;

  const cdCap = 350 + (hero.cdCapBonus || 0);

  // ── Shared substat-roll budget ──────────────────────────────────────────────
  // Each stat below is projected INDEPENDENTLY — roughly 6 substat rolls per priority
  // point (one roll on each of the 6 pieces it can land on; spd/cr/cd/eff/res lose the
  // piece where they're the main).  But a full build holds only ~54 substat roll-units
  // (6 pieces × ~9), and the stats compete for them.  So when the priorities together
  // demand more than the budget, scale every stat's SUBSTAT term down proportionally —
  // the headline numbers then stay jointly achievable (e.g. spd/atk/hp/def all at 6
  // split the budget instead of each pretending to its own full max).  Accessory mains
  // are separate (a forced Speed boots main always lands) so they're left unscaled.
  // Under budget → rollScale 1 → identical to before, so the per-stat "Apply" target-
  // hint (which solves one stat near priority 0) is unaffected.
  const rollsRequested =
    6 * pAtk +
    6 * pHp +
    6 * pDef +
    (6 - spdMainSlots) * pSpd +
    (6 - crMainSlots) * pCr +
    (6 - cdMainSlots) * pCd +
    (6 - effMainSlots) * pEff +
    (6 - resMainSlots) * pRes;
  const SUBSTAT_ROLL_BUDGET = 54; // 6 pieces × (4 base + 5 enhance) roll-units
  const rollScale =
    rollsRequested > SUBSTAT_ROLL_BUDGET
      ? SUBSTAT_ROLL_BUDGET / rollsRequested
      : 1;

  // Final-phase multipliers (certain artifacts / Exclusive Equipment, e.g. "Final ATK +X%")
  // — stored on the hero by api.js and applied by applyAllFastRejects; mirror them here so the
  // hint matches the real projected stat. Only ATK/HP/DEF have these fields.
  const finalAtkMult = 1 + (hero.finalAtkMultiplier || 0) / 100;
  const finalHpMult = 1 + (hero.finalHpMultiplier || 0) / 100;
  const finalDefMult = 1 + (hero.finalDefMultiplier || 0) / 100;

  return {
    atk: Math.round(
      (effBaseAtk +
        atkSetBonus +
        weaponMain +
        mainAtk * pAtk +
        (leftAtkRolls + rightSubAtk) * pAtk * rollScale) *
        finalAtkMult,
    ),
    hp: Math.round(
      (effBaseHp +
        hpSetBonus +
        helmMain +
        mainHp * pHp +
        (leftHpRolls + rightSubHp) * pHp * rollScale) *
        finalHpMult,
    ),
    def: Math.round(
      (effBaseDef +
        defSetBonus +
        armorMain +
        mainDef * pDef +
        (leftDefRolls + rightSubDef) * pDef * rollScale) *
        finalDefMult,
    ),
    spd: Math.round(
      effBaseSpd +
        spdSetBonus +
        mainSpd * pSpd +
        ROLL_DIVISORS.Speed * (6 - spdMainSlots) * pSpd * rollScale,
    ),
    cr: Math.min(
      100,
      Math.round(
        effBaseCr +
          crSetBonus +
          mainCr * pCr +
          ROLL_DIVISORS.CriticalHitChancePercent *
            (6 - crMainSlots) *
            pCr *
            rollScale,
      ),
    ),
    cd: Math.min(
      cdCap,
      Math.round(
        effBaseCd +
          cdSetBonus +
          mainCd * pCd +
          ROLL_DIVISORS.CriticalHitDamagePercent *
            (6 - cdMainSlots) *
            pCd *
            rollScale,
      ),
    ),
    eff: Math.round(
      effBaseEff +
        effSetBonus +
        mainEff * pEff +
        ROLL_DIVISORS.EffectivenessPercent *
          (6 - effMainSlots) *
          pEff *
          rollScale,
    ),
    res: Math.round(
      effBaseRes +
        resSetBonus +
        mainRes * pRes +
        ROLL_DIVISORS.EffectResistancePercent *
          (6 - resMainSlots) *
          pRes *
          rollScale,
    ),
  };
}

function filterDisabled(params) {
  return (
    (params.inputWeaponFilterPriority ?? 100) >= 100 &&
    (params.inputHelmetFilterPriority ?? 100) >= 100 &&
    (params.inputArmorFilterPriority ?? 100) >= 100 &&
    (params.inputNecklaceFilterPriority ?? 100) >= 100 &&
    (params.inputRingFilterPriority ?? 100) >= 100 &&
    (params.inputBootsFilterPriority ?? 100) >= 100
  );
}

function isSlotFilterDisabled(slotFilter) {
  return slotFilter >= 100;
}

const PriorityFilter = {
  /** Evict all cached item scores (call after hero change or item import). */
  clearScoreCache: () => {
    _scoreCache.clear();
    _scoreCacheHash = null;
    _rankCache.clear();
    _rankCacheHash = null;
  },

  estimatePriorityStats,
  calculateBuildScore,
  computeRelevantStats,
  resolveSlotPriorities,
  resolveEffectivePriorities,
  normalizeSlotRow,
  materializeSlotRow,
  globalFromMatrix,
  hasAnySlotOverride,
  hasAnySetOverride,
  getRequiredSets,
  setForced,

  /**
   * Score a single item (sets item.score and item.priority in place) using
   * the given params and base stats. Exposed so callers outside this module
   * (e.g., auto-config slot filters) can re-use the same scoring logic.
   */
  scoreItem: (item, params, baseStats, reforge) => {
    calculateScore(item, params, baseStats, reforge);
  },

  applyPriorityFilters: (
    params,
    items,
    baseStats,
    allItems,
    reforge,
    inputSubstatMods,
    hero,
    enableMods,
  ) => {
    let passed = [];

    const scoreFloor = params.inputPriorityScoreFloor || 0;

    // Ranking basis for the cut.  item.score now already carries the per-slot /
    // per-set effective weights (they drive the build ranking), so the cut only
    // needs item.rankScore for the mod-potential basis — when substat mods are on
    // and the user hasn't picked the 'current' basis.
    const rankBasis = params.inputPriorityRankBasis;
    const modRank = !!hero && !!enableMods && rankBasis !== 'current';
    const useRank = modRank;

    // Relevance set for the keep-originals net below — must match the one
    // ModificationFilter.apply uses to prune variants (B), so the cut protects
    // exactly the items that will yield no surviving variant.
    const _relevantStats = inputSubstatMods
      ? computeRelevantStats(params)
      : null;
    const _pruneActive = !!(_relevantStats && _relevantStats.size > 0);
    // True if this base item will produce at least one mod variant that B keeps
    // (i.e. a candidate whose replacement stat is relevant this run).  Such items
    // get a mod-potential boost in rankScore and compete fairly; items for which
    // this is false get no boost AND no variant, so the cut must not drop them.
    const _willProduceKeptVariant = (item) => {
      const cands = ModificationFilter.enumerateModCandidates(item, hero || {});
      for (let i = 0; i < cands.length; i += 1) {
        if (!_pruneActive || _relevantStats.has(cands[i].replacementStat)) {
          return true;
        }
      }
      return false;
    };

    // Always set item.score/item.priority (per-slot/per-set — summed by Java into
    // the build priority + shown in the grid).  Add item.rankScore for modRank.
    const scoreOne = (item) => {
      calculateScore(item, params, baseStats, reforge);
      if (useRank) calculateRankScore(item, params, baseStats, reforge, hero);
    };
    const rankKey = (item) =>
      useRank ? (item.rankScore ?? 0) : (item.score ?? 0);

    if (filterDisabled(params) && scoreFloor <= 0) {
      items.forEach(scoreOne);
      return items;
    }

    if (filterDisabled(params) && scoreFloor > 0) {
      items.forEach(scoreOne);
      const groups = groupBy(items, 'gear');
      Object.keys(groups).forEach((key) => {
        const gearArr = groups[key];
        gearArr.sort((a, b) => rankKey(b) - rankKey(a));
        const slotMaxScore = gearArr[0] ? rankKey(gearArr[0]) : 0;
        const minScore = slotMaxScore * (scoreFloor / 100);
        passed = passed.concat(
          gearArr.filter((item) => rankKey(item) >= minScore),
        );
      });
      return passed;
    }

    const slotFilterMap = {
      Weapon: params.inputWeaponFilterPriority ?? 100,
      Helmet: params.inputHelmetFilterPriority ?? 100,
      Armor: params.inputArmorFilterPriority ?? 100,
      Necklace: params.inputNecklaceFilterPriority ?? 100,
      Ring: params.inputRingFilterPriority ?? 100,
      Boots: params.inputBootsFilterPriority ?? 100,
    };

    const countElIds = {
      Weapon: 'weaponSliderHeatmap',
      Helmet: 'helmetSliderHeatmap',
      Armor: 'armorSliderHeatmap',
      Necklace: 'necklaceSliderHeatmap',
      Ring: 'ringSliderHeatmap',
      Boots: 'bootsSliderHeatmap',
    };

    const summaryTopIds = {
      Weapon: 'slotTopWeapon',
      Helmet: 'slotTopHelmet',
      Armor: 'slotTopArmor',
      Necklace: 'slotTopNecklace',
      Ring: 'slotTopRing',
      Boots: 'slotTopBoots',
    };

    // When a set is forced, partition each slot by required-set so the cut keeps
    // the top-N% of EACH required set (and of the free/"other" bucket) — required
    // sets are never starved by higher-scoring off-set pieces.  Not forced ⇒ a
    // single bucket per slot (byte-identical to the prior behavior).
    const _SLOTS = ['Weapon', 'Helmet', 'Armor', 'Necklace', 'Ring', 'Boots'];
    const forced = setForced(params);
    const requiredSets = forced ? getRequiredSets(params) : null;
    const setGroupOf = (item) =>
      requiredSets.has(item.set) ? item.set : _OTHER_SET_GROUP;

    // Cut one (slot × set-group) bucket; pushes a per-slot heatmap entry into agg
    // and returns the kept items (plus the non-moddable keptOriginals net).
    const cutBucket = (gearArr, slotFilter, setGroup, agg) => {
      gearArr.forEach(scoreOne);
      gearArr.sort((a, b) => rankKey(b) - rankKey(a));
      const idx = Math.ceil((slotFilter / 100) * gearArr.length);
      let topItems = gearArr.slice(0, idx);
      if (scoreFloor > 0) {
        const groupMax = gearArr[0] ? rankKey(gearArr[0]) : 0;
        const minScore = groupMax * (scoreFloor / 100);
        topItems = topItems.filter((item) => rankKey(item) >= minScore);
      }
      const topVal = gearArr[0] ? rankKey(gearArr[0]) : 0;
      let curTop = 0;
      if (modRank) {
        for (let i = 0; i < gearArr.length; i += 1) {
          const s = gearArr[i].score ?? 0;
          if (s > curTop) curTop = s;
        }
      }
      agg.groups.push({
        setGroup,
        kept: topItems.length,
        total: gearArr.length,
        topVal,
        curTop,
      });
      if (inputSubstatMods) {
        // Runs on the un-expanded BASE pool (ModificationFilter.apply runs after),
        // so items have no modId yet — dedupe on item.id within this bucket.
        // Protect items that will yield NO surviving mod variant: their rankScore
        // gets no mod-potential boost, so they'd be unfairly out-ranked by
        // mod-inflated items and then lost with no variant to recover them.  This
        // is the exact set apply() won't expand (zero candidates, or all candidates
        // pruned by B).  (Was `item.upgradeable === 0`, but at this pre-apply point
        // `upgradeable` still carries itemAugmenter's "reforged level-90" meaning —
        // not "non-moddable" — so it kept every finished piece and made the slot cut
        // a near no-op for endgame rosters.)
        const topIds = new Set(topItems.map((item) => item.id));
        const keptOriginals = gearArr.filter(
          (item) => !topIds.has(item.id) && !_willProduceKeptVariant(item),
        );
        return topItems.concat(keptOriginals);
      }
      return topItems;
    };

    const _setGroupLabel = (g) => (g === _OTHER_SET_GROUP ? 'other' : g);
    const writeHeatmap = (slot, agg) => {
      const el = document.getElementById(countElIds[slot]);
      const st = document.getElementById(summaryTopIds[slot]);
      if (agg.disabled) {
        if (el) {
          el.textContent = '';
          el.title = '';
        }
        if (st) {
          st.textContent = '';
          st.title = '';
        }
        return;
      }
      if (!forced) {
        const g = agg.groups[0] || { kept: 0, total: 0, topVal: 0, curTop: 0 };
        if (el) {
          el.textContent = `${g.kept} / ${g.total}`;
          el.title = '';
        }
        if (st) {
          st.textContent = modRank
            ? `★${g.curTop.toFixed(1)}→${g.topVal.toFixed(1)}`
            : `★${g.topVal.toFixed(1)}`;
          st.title = '';
        }
        return;
      }
      // Forced: compact per-set breakdown, full detail always in the title.
      const compact = agg.groups
        .map((g) => `${_setAbbr(g.setGroup)} ${g.kept}/${g.total}`)
        .join(' ');
      const totalKept = agg.groups.reduce((a, g) => a + g.kept, 0);
      const totalAll = agg.groups.reduce((a, g) => a + g.total, 0);
      if (el) {
        el.textContent =
          compact.length <= 22 ? compact : `Σ${totalKept}/${totalAll}`;
        el.title = agg.groups
          .map((g) => `${_setGroupLabel(g.setGroup)}: ${g.kept}/${g.total}`)
          .join('\n');
      }
      if (st) {
        st.textContent = `★${agg.groups
          .map((g) => `${_setAbbr(g.setGroup)}${g.topVal.toFixed(1)}`)
          .join(' ')}`;
        st.title = agg.groups
          .map((g) =>
            modRank
              ? `${_setGroupLabel(g.setGroup)}: ${g.curTop.toFixed(1)}→${g.topVal.toFixed(1)}`
              : `${_setGroupLabel(g.setGroup)}: ${g.topVal.toFixed(1)}`,
          )
          .join('\n');
      }
    };

    const bySlot = groupBy(items, 'gear');

    _SLOTS.forEach((slot) => {
      const gearArr = bySlot[slot];
      if (!gearArr || gearArr.length === 0) return;
      const slotFilter = slotFilterMap[slot] ?? 100;
      const agg = { groups: [], disabled: false };

      if (isSlotFilterDisabled(slotFilter) && scoreFloor <= 0) {
        // Slot cut disabled — still score (sets item.score for Java/grid), keep all.
        gearArr.forEach(scoreOne);
        agg.disabled = true;
        writeHeatmap(slot, agg);
        passed = passed.concat(gearArr);
        return;
      }

      if (!forced) {
        passed = passed.concat(cutBucket(gearArr, slotFilter, '_', agg));
      } else {
        const buckets = {};
        for (let i = 0; i < gearArr.length; i += 1) {
          const it = gearArr[i];
          const g = setGroupOf(it);
          (buckets[g] = buckets[g] || []).push(it);
        }
        const order = [...requiredSets].sort().filter((g) => buckets[g]);
        if (buckets[_OTHER_SET_GROUP]) order.push(_OTHER_SET_GROUP);
        order.forEach((g) => {
          passed = passed.concat(cutBucket(buckets[g], slotFilter, g, agg));
        });
      }
      writeHeatmap(slot, agg);
    });

    // Defensive: pass through any items in unexpected slots untouched.
    Object.keys(bySlot).forEach((slot) => {
      if (!_SLOTS.includes(slot)) passed = passed.concat(bySlot[slot]);
    });

    return passed;
  },
};

export default PriorityFilter;

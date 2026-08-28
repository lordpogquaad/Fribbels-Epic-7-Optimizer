import { v4 as uuidv4 } from 'uuid';

/* global Dialog, Reforge, Constants */

// Diagnostic logging uses the central Log utility (Log.debug, gated by window.__optDebug; see 5. Dev Only/LogControl.js).

// ---------------------------------------------------------------------------
// Least-Recently-Used map — O(1) get/set/evict using Map insertion order.
// When size reaches `maxSize` the least-recently-accessed entry is evicted.
// ---------------------------------------------------------------------------
const LRU_MAX_SIZE = 5000;

class LruMap {
  constructor(maxSize) {
    this._max = maxSize;
    this._map = new Map();
  }

  get(key) {
    if (!this._map.has(key)) return undefined;
    // Promote to most-recently-used by moving to end of Map
    const val = this._map.get(key);
    this._map.delete(key);
    this._map.set(key, val);
    return val;
  }

  set(key, val) {
    if (this._map.has(key)) {
      this._map.delete(key);
    } else if (this._map.size >= this._max) {
      // Evict least-recently-used (first entry in Map)
      this._map.delete(this._map.keys().next().value);
    }
    this._map.set(key, val);
  }

  clear() {
    this._map.clear();
  }

  get size() {
    return this._map.size;
  }
}

// Main single-optimizer mod cache (bounded LRU, never re-assigned).
const moddedItems = new LruMap(LRU_MAX_SIZE);
// Per-slot multi-optimizer caches (each slot holds an LruMap or null).
const multiModdedItems = [];
// Variant caches: keyed by item+config fingerprint.  Avoids re-running
// structuredClone and stat recalculation when items and mod config haven't
// changed between recalculations (e.g. user tweaks a priority slider).
const variantCache = new LruMap(LRU_MAX_SIZE);
const multiVariantCaches = [];

function _variantCacheKey(
  item,
  keepList,
  ignoreList,
  discardList,
  limitRolls,
  rollQualityRaw,
  grade,
  keepStatOptions,
  relevantFp,
) {
  const subFp = (item.substats || [])
    .map(
      (s) =>
        `${s.type}:${s.value}:${s.modified ? 1 : 0}:${s.pinMod ? 1 : 0}:${s.pinModOff ? 1 : 0}:${(s.allowedTargetStats || []).join('/')}`,
    )
    .join(';');
  // relevantFp folds in the run's variant-prune set (B): the cached variant list
  // depends on which replacement stats are relevant this run, so two runs that
  // differ only in priorities/targets must not share a cache entry.
  return `${item.id}|${subFp}|${keepList.join(',')}|${ignoreList.join(',')}|${discardList.join(',')}|${limitRolls}|${rollQualityRaw}|${grade}|${keepStatOptions}|${relevantFp || ''}`;
}

function createMultiOptimizerSlotIfNotExistsAndReturnsMultiOrNot(index) {
  if (index === null || index === undefined) {
    return false;
  }

  if (
    multiModdedItems[index] === undefined ||
    multiModdedItems[index] === null
  ) {
    multiModdedItems[index] = new LruMap(LRU_MAX_SIZE);
  }
  return true;
}

/**
 * Returns the effective mod config for a specific item based on per-slot rules,
 * or null if no matching slot rule exists (caller should fall back to global hero config).
 */
function getEffectiveConfig(hero, item) {
  if (!hero.slotModConfig) return null;
  const slotCfg = hero.slotModConfig[item.gear];
  if (!slotCfg) return null;
  const rules = slotCfg.rules;
  if (!rules || rules.length === 0) return null;
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const mainOk = !rule.mainStat || rule.mainStat === item.main.type;
    const setOk = !rule.set || rule.set === item.set;
    if (mainOk && setOk) {
      return {
        keepStats: rule.keepStats || [],
        ignoreStats: rule.ignoreStats || [],
        discardStats: rule.discardStats || [],
        limitRolls:
          slotCfg.limitRolls == null ? hero.limitRolls : slotCfg.limitRolls,
        rollQuality:
          slotCfg.rollQuality == null ? hero.rollQuality : slotCfg.rollQuality,
        modGrade: slotCfg.modGrade || hero.modGrade,
        keepStatOptions: slotCfg.keepStatOptions || hero.keepStatOptions,
      };
    }
  }
  return null;
}

/**
 * Single source of truth for "which substat modifications are legal for this
 * item under this hero's mod config, and what value does each produce".
 *
 * Returns an array of plain candidate descriptors WITHOUT cloning the item:
 *   [{ index, originalType, originalValue, replacementStat, value }]
 *
 * `apply()` consumes this to materialize variant items; priorityFilter's
 * mod-potential scorer consumes it to compute the best post-mod score delta
 * (no cloning).  Every eligibility guard here mirrors apply()'s former inner
 * loops 1:1 — any change must stay in lockstep so the two callers never drift.
 *
 * Returns [] when mods aren't configured for the hero, the item can't be
 * modded (<+15, disabled, slot excluded), or no legal candidate exists.
 */
function enumerateModCandidates(item, hero) {
  // Global guard — mirrors apply()'s early return when mods aren't configured.
  if (
    !hero ||
    !hero.limitRolls ||
    hero.rollQuality === undefined ||
    hero.rollQuality === null
  ) {
    return [];
  }
  if (item.disableMods) return [];
  if (item.enhance !== 15) return [];

  // Per-item effective config: slot rule override when one matches, else global.
  const _cfg = getEffectiveConfig(hero, item);
  const keepList = (_cfg ? _cfg.keepStats : hero.keepStats) || [];
  const ignoreList = (_cfg ? _cfg.ignoreStats : hero.ignoreStats) || [];
  const discardList = (_cfg ? _cfg.discardStats : hero.discardStats) || [];
  const limitRolls =
    _cfg?.limitRolls == null ? hero.limitRolls : _cfg.limitRolls;
  const rollQualityRaw =
    _cfg?.rollQuality == null ? hero.rollQuality : _cfg.rollQuality;
  const rollQuality = rollQualityRaw / 100;
  const grade = _cfg?.modGrade || hero.modGrade;
  const keepStatOptions = _cfg?.keepStatOptions || hero.keepStatOptions;

  if (
    hero.modSlots &&
    hero.modSlots.length > 0 &&
    !hero.modSlots.includes(item.gear)
  ) {
    return [];
  }

  const existingSubstats = new Set(item.substats.map((x) => x.type));

  let moddedIndex = -1;
  item.substats.forEach((substat, i) => {
    if (substat.modified) {
      moddedIndex = i;
    }
  });

  const hasPinnedSubstats = item.substats.some((s) => s.pinMod);

  const isInvalidWeaponStat = (gear, stat) =>
    gear === 'Weapon' && stat.includes('Defense');
  const isInvalidArmorStat = (gear, stat) =>
    gear === 'Armor' && stat.includes('Attack');

  // Reforged branch + grade table are constant per item — hoist out of the loops.
  const reforged =
    Reforge.isReforgeable(item) || item.level === 90
      ? 'reforged'
      : 'unreforged';
  const modTable = Constants.modValues[reforged]?.[grade];

  const candidates = [];

  item.substats.forEach((substat, i) => {
    if (ignoreList.includes(substat.type)) {
      return;
    }

    if (hasPinnedSubstats && !substat.pinMod) {
      return;
    }

    if (moddedIndex > -1 && moddedIndex !== i) {
      return;
    }

    if (
      !substat.modified &&
      !discardList.includes(substat.type) &&
      !keepList.includes(substat.type)
    ) {
      return;
    }

    if (substat.rolls > limitRolls) {
      return;
    }

    const rollIndex = substat.rolls ? substat.rolls - 1 : 0;

    keepList.forEach((replacementStat) => {
      if (replacementStat === item.main.type) {
        return;
      }

      if (
        isInvalidWeaponStat(item.gear, replacementStat) ||
        isInvalidArmorStat(item.gear, replacementStat)
      ) {
        return;
      }

      // Per-substat allowed target restriction: if set, only allow listed stats
      const allowedTargets = substat.allowedTargetStats;
      if (
        allowedTargets &&
        allowedTargets.length > 0 &&
        !allowedTargets.includes(replacementStat)
      ) {
        return;
      }

      let substatPass = false;

      if (substat.modified && substat.type === replacementStat) {
        substatPass = true;
      }

      if (
        !existingSubstats.has(replacementStat) ||
        substat.type === replacementStat
      ) {
        substatPass = true;
      }

      if (!substatPass) {
        return;
      }

      if (ignoreList.includes(replacementStat)) {
        return;
      }

      if (
        keepList.includes(substat.type) &&
        keepStatOptions === 'neverReplace'
      ) {
        return;
      }

      const valueRange = modTable?.[replacementStat]?.[rollIndex];
      if (!valueRange) {
        return;
      }
      const valueQuality = Math.round(
        valueRange[0] + (valueRange[1] - valueRange[0]) * rollQuality,
      );

      if (substat.type === replacementStat && substat.value >= valueQuality) {
        return;
      }

      candidates.push({
        index: i,
        originalType: substat.type,
        originalValue: substat.value,
        replacementStat,
        value: valueQuality,
      });
    });
  });

  return candidates;
}

const ModificationFilter = {
  // Exposed so priorityFilter's mod-potential scorer reuses the exact same mod
  // rules (single source of truth) without duplicating eligibility logic.  The
  // priority cut's keep-originals net also calls this and treats a [] result as
  // "produces no variant" (so the item is protected from the cut).
  enumerateModCandidates,

  getModsByIds: (gearIds, mods, index) => {
    let modCollection;
    const isMulti =
      createMultiOptimizerSlotIfNotExistsAndReturnsMultiOrNot(index);

    if (isMulti) {
      modCollection = multiModdedItems[index];
    } else {
      modCollection = moddedItems;
    }

    const result = [];
    Array.from({ length: mods.length }).forEach((_, i) => {
      const jsonString = JSON.stringify(modCollection.get(gearIds[i]));
      if (!jsonString) {
        result.push(undefined);
        return;
      }

      const item = JSON.parse(jsonString);
      if (!item) {
        result.push(undefined);
        return;
      }

      if (mods[i] === null || mods[i] === undefined) {
        // No mod on this slot: leave it a normal item so ItemAugmenter computes its
        // real reforged stats.  Flagging it alreadyPredictedReforge here would make
        // getItemReforgedStats skip reforge computation, leaving reforgeable substats
        // with no reforgedValue → a NaN reforged gear score in the preview when
        // "use substat mods" is off.
        result.push(item);
        return;
      }

      // A mod's value is already the (pre-)reforged value, so flag the item to stop
      // ItemAugmenter from recomputing/overwriting it.
      item.alreadyPredictedReforge = true;
      const mod = mods[i];
      item.substats.forEach((substat, j) => {
        if (j === mod.index) {
          substat.type = mod.type;
          substat.value = mod.value;
          substat.reforgedValue = mod.value;
          substat.originalType = mod.originalType;
          substat.originalValue = mod.originalValue;
          substat.modified = true;
        }
      });
      result.push(item);
    });
    return result;
  },

  apply: (items, enableMods, hero, submit, index, relevantStats) => {
    const isMulti =
      createMultiOptimizerSlotIfNotExistsAndReturnsMultiOrNot(index);
    const activeVariantCache = isMulti
      ? (multiVariantCaches[index] =
          multiVariantCaches[index] || new LruMap(LRU_MAX_SIZE))
      : variantCache;

    // B (variant pruning): drop mod variants whose NEW stat can't affect this
    // run's ranking/feasibility (not in relevantStats).  Empty/absent set ⇒ we
    // can't tell what matters (nothing configured) ⇒ keep every variant.
    const pruneActive = !!(relevantStats && relevantStats.size > 0);
    const relevantFp = relevantStats ? [...relevantStats].sort().join(',') : '';
    let prunedCount = 0;

    if (enableMods && (!hero.keepStats || hero.keepStats.length === 0)) {
      if (submit) {
        Dialog.error(
          "Substat mods are enabled, but the hero's 'Keep' substat list is empty. Please use 'Add Substat Mods' button on the Heroes tab to adjust your mod preferences",
        );
        throw new Error('Substat mods must be set before optimizing');
      }
    }

    if (
      !enableMods ||
      !hero.limitRolls ||
      hero.rollQuality === undefined ||
      hero.rollQuality === null
    ) {
      items.forEach((item) => {
        item.modId = item.id;
        if (isMulti) {
          multiModdedItems[index].set(item.id, item);
        } else {
          moddedItems.set(item.id, item);
        }
      });
      return items;
    }

    const newModdedItems = {};

    const newItems = [];

    items.forEach((item) => {
      item.modId = item.id;
      newModdedItems[item.id] = item; // plain object — transferred into LruMap below
      item.upgradeable = 0;
      newItems.push(item);

      // Per-item effective config: use slot rule override when one matches, else global hero config
      const _cfg = getEffectiveConfig(hero, item);
      const keepList = (_cfg ? _cfg.keepStats : hero.keepStats) || [];
      const ignoreList = (_cfg ? _cfg.ignoreStats : hero.ignoreStats) || [];
      const discardList = (_cfg ? _cfg.discardStats : hero.discardStats) || [];
      const limitRolls =
        _cfg?.limitRolls == null ? hero.limitRolls : _cfg.limitRolls;
      const rollQualityRaw =
        _cfg?.rollQuality == null ? hero.rollQuality : _cfg.rollQuality;
      const grade = _cfg?.modGrade || hero.modGrade;
      const keepStatOptions = _cfg?.keepStatOptions || hero.keepStatOptions;

      if (item.disableMods) {
        return;
      }

      if (item.enhance !== 15) {
        return;
      }

      if (
        hero.modSlots &&
        hero.modSlots.length > 0 &&
        !hero.modSlots.includes(item.gear)
      ) {
        return;
      }

      const vKey = _variantCacheKey(
        item,
        keepList,
        ignoreList,
        discardList,
        limitRolls,
        rollQualityRaw,
        grade,
        keepStatOptions || '',
        relevantFp,
      );
      const cachedVariants = activeVariantCache.get(vKey);
      if (cachedVariants) {
        cachedVariants.forEach((v) => {
          newModdedItems[v.modId] = v;
          newItems.push(v);
        });
        return;
      }
      const itemVariants = [];
      // Drop variants whose resulting augmentedStats are byte-identical to one
      // already produced for this item — they're redundant to the optimizer
      // (same final gear), and Java only dedupes by id.  Always safe.
      const seenSigs = new Set();

      // Candidate eligibility + modded-value logic lives in the shared
      // enumerateModCandidates (single source of truth).  apply() only clones
      // and materializes each candidate into a variant item.
      enumerateModCandidates(item, hero).forEach((cand) => {
        // B: skip cloning a variant whose new stat is irrelevant this run — it
        // can't raise buildScore, the target bonus, or pass any min-limit/force,
        // so it's dominated by the base item or a relevant-stat variant.
        if (pruneActive && !relevantStats.has(cand.replacementStat)) {
          prunedCount += 1;
          return;
        }
        const itemCopy = structuredClone(item);
        const substatCopy = itemCopy.substats[cand.index];

        substatCopy.originalType = cand.originalType;
        substatCopy.originalValue = cand.originalValue;
        substatCopy.type = cand.replacementStat;

        itemCopy.augmentedStats[cand.originalType] = 0;
        itemCopy.augmentedStats[cand.replacementStat] = cand.value;

        itemCopy.reforgedStats[cand.originalType] = 0;
        itemCopy.reforgedStats[cand.replacementStat] = cand.value;

        const sig = JSON.stringify(itemCopy.augmentedStats);
        if (seenSigs.has(sig)) {
          return;
        }
        seenSigs.add(sig);

        substatCopy.value = cand.value;
        substatCopy.reforgedValue = cand.value;
        substatCopy.modified = true;

        itemCopy.upgradeable = 1;

        itemCopy.modId = uuidv4();
        itemCopy.mod = {
          originalType: cand.originalType,
          originalValue: cand.originalValue,
          type: cand.replacementStat,
          value: cand.value,
          index: cand.index,
        };
        newModdedItems[itemCopy.modId] = itemCopy;
        itemVariants.push(itemCopy);
        newItems.push(itemCopy);
      });

      activeVariantCache.set(vKey, itemVariants);
    });

    // Merge newModdedItems into the bounded LruMap.  We deliberately skip
    // .clear() so unchanged entries from previous calls remain valid — stale
    // entries are naturally evicted by the LRU once the map fills.  This makes
    // the lookup incremental: only items that are new or changed touch the map.
    if (isMulti) {
      Object.entries(newModdedItems).forEach(([k, v]) =>
        multiModdedItems[index].set(k, v),
      );
    } else {
      Object.entries(newModdedItems).forEach(([k, v]) => moddedItems.set(k, v));
    }

    if (prunedCount > 0) {
      Log.debug(
        `[MOD] pruned ${prunedCount} irrelevant mod variant(s); kept stats: ${relevantFp || '(all)'}`,
      );
    }

    return newItems;
  },

  clear: (index) => {
    if (index === null || index === undefined) {
      moddedItems.clear();
      variantCache.clear();
    } else {
      // Set to null so the create-helper re-initialises with a fresh LruMap
      multiModdedItems[index] = null;
      multiVariantCaches[index] = null;
    }
  },

  // Seed an item into the mod cache under the given modId.  Used when
  // restoring saved builds on import so that equip/preview works without
  // needing to re-run the optimizer first.
  seedCache: (modId, item, index) => {
    if (!modId || !item) return;
    const isMulti =
      createMultiOptimizerSlotIfNotExistsAndReturnsMultiOrNot(index);
    if (isMulti) {
      multiModdedItems[index].set(modId, item);
    } else {
      moddedItems.set(modId, item);
    }
  },
};

export default ModificationFilter;

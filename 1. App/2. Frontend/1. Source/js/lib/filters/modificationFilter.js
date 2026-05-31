import { v4 as uuidv4 } from 'uuid';

/* global Dialog, Reforge, Constants */

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
                keepStats:       rule.keepStats      || [],
                ignoreStats:     rule.ignoreStats    || [],
                discardStats:    rule.discardStats   || [],
                limitRolls:      slotCfg.limitRolls  != null ? slotCfg.limitRolls  : hero.limitRolls,
                rollQuality:     slotCfg.rollQuality != null ? slotCfg.rollQuality : hero.rollQuality,
                modGrade:        slotCfg.modGrade    || hero.modGrade,
                keepStatOptions: slotCfg.keepStatOptions || hero.keepStatOptions,
            };
        }
    }
    return null;
}

const ModificationFilter = {
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

            if (mods[i] === null || mods[i] === undefined) {
                result.push(undefined);
                return;
            }

            const item = JSON.parse(jsonString);
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

    apply: (items, enableMods, hero, submit, index) => {
        const isMulti =
            createMultiOptimizerSlotIfNotExistsAndReturnsMultiOrNot(index);

        if (enableMods && (!hero.keepStats || hero.keepStats.length === 0)) {
            if (submit) {
                Dialog.error(
                    "Substat mods are enabled, but the hero's 'Keep' substat list is empty. Please use 'Add Substat Mods' button on the Heroes tab to adjust your mod preferences"
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
            const keepList    = (_cfg ? _cfg.keepStats    : hero.keepStats)    || [];
            const ignoreList  = (_cfg ? _cfg.ignoreStats  : hero.ignoreStats)  || [];
            const discardList = (_cfg ? _cfg.discardStats : hero.discardStats) || [];
            const limitRolls  = _cfg?.limitRolls  != null ? _cfg.limitRolls  : hero.limitRolls;
            const rollQuality = (_cfg?.rollQuality != null ? _cfg.rollQuality : hero.rollQuality) / 100;
            const grade       = _cfg?.modGrade    || hero.modGrade;
            const keepStatOptions = _cfg?.keepStatOptions || hero.keepStatOptions;

            if (item.disableMods) {
                return;
            }

            const existingSubstats = item.substats.map((x) => x.type);

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

            let moddedIndex = -1;
            item.substats.forEach((substat, i) => {
                if (substat.modified) {
                    moddedIndex = i;
                }
            });

            const hasPinnedSubstats = item.substats.some((s) => s.pinMod);

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

                keepList.forEach((replacementStat) => {
                    if (replacementStat === item.main.type) {
                        return;
                    }

                    if (
                        item.gear === 'Weapon' &&
                        replacementStat.includes('Defense')
                    ) {
                        return;
                    }

                    if (
                        item.gear === 'Armor' &&
                        replacementStat.includes('Attack')
                    ) {
                        return;
                    }

                    let substatPass = false;

                    if (substat.modified && substat.type === replacementStat) {
                        substatPass = true;
                    }

                    if (
                        !existingSubstats.includes(replacementStat) ||
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

                    const itemCopy = structuredClone(item);
                    const substatCopy = itemCopy.substats[i];

                    substatCopy.originalType = substatCopy.type;
                    substatCopy.originalValue = substatCopy.value;
                    substatCopy.type = replacementStat;

                    const reforged =
                        Reforge.isReforgeable(item) || item.level === 90
                            ? 'reforged'
                            : 'unreforged';
                    const rollIndex = substat.rolls ? substat.rolls - 1 : 0;
                    const valueRange =
                        Constants.modValues[reforged][grade][replacementStat][
                            rollIndex
                        ];
                    const valueQuality = Math.round(
                        valueRange[0] +
                            (valueRange[1] - valueRange[0]) * rollQuality
                    );

                    if (
                        substat.type === replacementStat &&
                        substat.value >= valueQuality
                    ) {
                        return;
                    }

                    itemCopy.augmentedStats[substatCopy.originalType] = 0;
                    itemCopy.augmentedStats[replacementStat] = valueQuality;

                    itemCopy.reforgedStats[substatCopy.originalType] = 0;
                    itemCopy.reforgedStats[replacementStat] = valueQuality;

                    substatCopy.value = valueQuality;
                    substatCopy.reforgedValue = valueQuality;
                    substatCopy.modified = true;

                    itemCopy.upgradeable = 1;

                    itemCopy.modId = uuidv4();
                    itemCopy.mod = {
                        originalType: substatCopy.originalType,
                        originalValue: substatCopy.originalValue,
                        type: substatCopy.type,
                        value: substatCopy.value,
                        index: i,
                    };
                    newModdedItems[itemCopy.modId] = itemCopy;

                    newItems.push(itemCopy);
                });
            });
        });

        // Transfer newModdedItems into the bounded LruMap (replaces previous contents).
        if (isMulti) {
            multiModdedItems[index].clear();
            Object.entries(newModdedItems).forEach(([k, v]) => multiModdedItems[index].set(k, v));
        } else {
            moddedItems.clear();
            Object.entries(newModdedItems).forEach(([k, v]) => moddedItems.set(k, v));
        }

        return newItems;
    },

    clear: (index) => {
        if (index === null || index === undefined) {
            moddedItems.clear();
        } else {
            // Set to null so the create-helper re-initialises with a fresh LruMap
            multiModdedItems[index] = null;
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

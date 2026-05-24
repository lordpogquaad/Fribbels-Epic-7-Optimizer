import { v4 as uuidv4 } from 'uuid';

/* global Dialog, Reforge, Constants */

let moddedItems = {};
const multiModdedItems = [];

function createMultiOptimizerSlotIfNotExistsAndReturnsMultiOrNot(index) {
    if (index === null || index === undefined) {
        return false;
    }

    if (
        multiModdedItems[index] === undefined ||
        multiModdedItems[index] === null
    ) {
        multiModdedItems[index] = {};
    }
    return true;
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
            const jsonString = JSON.stringify(modCollection[gearIds[i]]);
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
                    multiModdedItems[index][item.id] = item;
                } else {
                    moddedItems[item.id] = item;
                }
            });
            return items;
        }

        const newModdedItems = {};

        const keepList = hero.keepStats || [];
        const ignoreList = hero.ignoreStats || [];
        const discardList = hero.discardStats || [];

        const { limitRolls } = hero;
        const rollQuality = hero.rollQuality / 100;
        const grade = hero.modGrade;
        const { keepStatOptions } = hero;

        const newItems = [];

        items.forEach((item) => {
            item.modId = item.id;
            newModdedItems[item.id] = item;
            item.upgradeable = 0;
            newItems.push(item);

            if (item.disableMods) {
                return;
            }

            const existingSubstats = item.substats.map((x) => x.type);

            if (item.enhance !== 15) {
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

                    const itemCopy = JSON.parse(JSON.stringify(item));
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

        if (isMulti) {
            multiModdedItems[index] = newModdedItems;
        } else {
            moddedItems = newModdedItems;
        }

        return newItems;
    },
};

export default ModificationFilter;

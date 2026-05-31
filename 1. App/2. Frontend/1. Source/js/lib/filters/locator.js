import tippy from 'tippy.js';
import Constants from '../constants';

/* global Api, Settings */

const readableSubstatByName = {
    Attack: 'Flat atk',
    AttackPercent: 'Attack %',
    Defense: 'Flat def',
    DefensePercent: 'Defense %',
    Health: 'Flat hp',
    HealthPercent: 'Health %',
    Speed: 'Speed',
    CriticalHitChancePercent: 'Crit chance',
    CriticalHitDamagePercent: 'Crit dmg',
    EffectivenessPercent: 'Eff',
    EffectResistancePercent: 'Eff res',
};

// Ingame stat key → optimizer stat type name. Canonical definition lives in
// Constants.ingameStatToStatType (constants.js).
const opStatToSubstat = Constants.ingameStatToStatType;

function locateSingleItem(itemId, items) {
    if (!itemId) {
        return {
            unscannedItem: true,
        };
    }

    const item = items.find((x) => x.ingameId === itemId);

    if (!item) {
        return {
            unscannedItem: true,
        };
    }

    const filteredItems = items.filter(
        (x) => x.gear === item.gear && !x.storage
    );
    // const filteredItems = items.filter(x => x.set == item.set && x.gear == item.gear)

    let minIndex = filteredItems.length;
    let minIndexSubstat = '';

    item.substats.forEach((substat) => {
        if (!item.op) {
            // naive

            filteredItems.sort((x, y) => {
                const difference =
                    y.augmentedStats[substat.type] -
                    x.augmentedStats[substat.type];
                if (difference === 0) {
                    return y.ingameId - x.ingameId;
                }
                return difference;
            });
        } else {
            // floating point sort

            filteredItems.sort((x, y) => {
                if (!y.op) {
                    return 1;
                }
                if (!x.op) {
                    return -1;
                }
                const yOpValues = y.op
                    .slice(1)
                    .filter(
                        (entry) => opStatToSubstat[entry[0]] === substat.type
                    )
                    .map((entry) => parseFloat(entry[1]));
                const ySum = yOpValues.reduce((a, b) => a + b, 0);

                const xOpValues = x.op
                    .slice(1)
                    .filter(
                        (entry) => opStatToSubstat[entry[0]] === substat.type
                    )
                    .map((entry) => parseFloat(entry[1]));
                const xSum = xOpValues.reduce((a, b) => a + b, 0);

                const difference = ySum - xSum;
                if (difference === 0) {
                    return y.ingameId - x.ingameId;
                }
                return difference;
            });
        }

        const currentIndex = filteredItems.findIndex(
            (x) => x.ingameId === item.ingameId
        );
        if (currentIndex < minIndex) {
            minIndex = currentIndex;
            minIndexSubstat = substat.type;
        }
    });

    return {
        substat: minIndexSubstat,
        index: minIndex,
        storage: item.storage || false,
    };
}

const Locator = {
    locate: async (ingameId, selectorClass) => {
        const getAllItemsResponse = await Api.getAllItems();
        const { items } = getAllItemsResponse;

        const elements = document.querySelectorAll(`.${selectorClass}`);

        Array.from(elements).forEach((element) => {
            const result = locateSingleItem(element.dataset.itemid, items);
            const width = parseInt(
                Settings.parseNumberValue('settingLocatorWidth') || 5,
                10
            );

            if (result) {
                let content = '';

                if (result.unscannedItem) {
                    content = 'Rescan items to locate';
                }

                if (result.storage) {
                    content = 'Item in storage';
                } else {
                    content = `<div class="locatorTip">Substat: ${
                        readableSubstatByName[result.substat]
                    }</br>
                    Row: ${Math.floor(result.index / width) + 1} Column: ${
                        (result.index % width) + 1
                    }</br>
                    Sort: Acquisition</br>
                    Width setting: ${width}</div>`;
                }

                let tippyInstance;
                // eslint-disable-next-line no-underscore-dangle
                if (element._tippy) {
                    // eslint-disable-next-line no-underscore-dangle
                    tippyInstance = element._tippy;
                } else {
                    tippyInstance = tippy(element, {
                        allowHTML: true,
                        trigger: 'focus',
                        placement: 'right',
                        content,
                        arrow: false,

                        onHidden(instance) {
                            instance.destroy();
                            return true;
                        },
                    });
                }

                tippyInstance.show();
            }
        });
    },
};

export default Locator;

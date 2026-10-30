import tippy from 'tippy.js';

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

  const filteredItems = items.filter((x) => x.gear === item.gear && !x.storage);

  let minIndex = filteredItems.length;
  let minIndexSubstat = '';

  item.substats.forEach((substat) => {
    filteredItems.sort((x, y) => {
      const yValue = y.augmentedStats[substat.type] || 0;
      const xValue = x.augmentedStats[substat.type] || 0;
      const difference = yValue - xValue;
      if (difference === 0) {
        return y.ingameId - x.ingameId;
      }
      return difference;
    });

    const currentIndex = filteredItems.findIndex(
      (x) => x.ingameId === item.ingameId,
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
      const width = Number.parseInt(
        Settings.parseNumberValue('settingLocatorWidth') || 5,
        10,
      );

      if (result) {
        let content;

        if (result.unscannedItem) {
          content = 'Rescan items to locate';
        } else if (result.storage) {
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
        if (element._tippy) {
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

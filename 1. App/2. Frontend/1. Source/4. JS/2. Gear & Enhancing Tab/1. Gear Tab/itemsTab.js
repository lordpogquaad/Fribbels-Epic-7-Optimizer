/* global ItemsGrid, Notifier, Dialog, ItemAugmenter, Api, Reforge, Saves, i18next, $, itemsGrid */
/* global HeroGearMatcher, HeroData */

// Diagnostic logging uses the central Log utility (Log.debug, gated by window.__optDebug; see 5. Dev Only/LogControl.js).

let modifyGreater = true;

// Filters that support multiple selections (toggle in/out of array)
const MULTI_SELECT_FILTERS = new Set([
  'gearFilter',
  'setFilter',
  'levelFilter',
  'enhanceFilter',
  'statFilter',
  'substatFilter',
  'rankFilter',
]);

function passesGearFilter(item) {
  if (filters.gearFilter.length === 0) return true;
  return filters.gearFilter.includes(item.gear);
}

function passesSetFilter(item) {
  if (filters.setFilter.length === 0) return true;
  return filters.setFilter.includes(item.set);
}

function passesLevelFilter(item) {
  if (filters.levelFilter.length === 0) return true;
  return filters.levelFilter.some((f) => {
    if (f === '90') return item.level >= 90;
    if (f === '88') return item.level >= 88 && item.level < 90;
    if (f === '85') return item.level >= 85 && item.level < 88;
    if (f === 'under85') return item.level > 0 && item.level < 85;
    if (f === '0') return item.level === 0;
    return false;
  });
}

function passesEnhanceFilter(item) {
  if (filters.enhanceFilter.length === 0) return true;
  return filters.enhanceFilter.some((f) => {
    if (f === 'plus15') return item.enhance >= 15;
    if (f === 'plus12') return item.enhance >= 12 && item.enhance < 15;
    if (f === 'plus9') return item.enhance >= 9 && item.enhance < 12;
    if (f === 'plus6') return item.enhance >= 6 && item.enhance < 9;
    if (f === 'plus3') return item.enhance >= 3 && item.enhance < 6;
    if (f === 'plus0') return item.enhance === 0;
    return false;
  });
}

function passesStatFilter(item) {
  if (filters.statFilter.length === 0) return true;
  return filters.statFilter.includes(item.main?.type);
}

function passesSubstatFilter(item) {
  if (filters.substatFilter.length === 0) return true;
  return filters.substatFilter.some((stat) =>
    item.substats?.some((sub) => sub.type === stat),
  );
}

function passesRankFilter(item) {
  if (filters.rankFilter.length === 0) return true;
  return filters.rankFilter.some((f) => {
    if (f === 'otherworldly') return !!item.otherworldly;
    return item.rank === f;
  });
}

const filters = {
  setFilter: [],
  gearFilter: [],
  levelFilter: [],
  enhanceFilter: [],
  statFilter: [],
  substatFilter: [],
  rankFilter: [],
  duplicateFilter: null,
  equippedOrNotFilter: null,
  modifyFilter: null,
};

const ItemsTab = {
  isExternalFilterPresent: () => {
    return (
      filters.gearFilter.length > 0 ||
      filters.setFilter.length > 0 ||
      filters.levelFilter.length > 0 ||
      filters.enhanceFilter.length > 0 ||
      filters.statFilter.length > 0 ||
      filters.substatFilter.length > 0 ||
      filters.rankFilter.length > 0
    );
  },

  doesExternalFilterPass: (rowData) => {
    const item = rowData.data;
    return (
      passesGearFilter(item) &&
      passesSetFilter(item) &&
      passesLevelFilter(item) &&
      passesEnhanceFilter(item) &&
      passesStatFilter(item) &&
      passesSubstatFilter(item) &&
      passesRankFilter(item)
    );
  },

  getCurrentModifier: () => {
    return {
      grade: modifyGreater ? 'greater' : 'lesser',
      stat: filters.modifyFilter,
    };
  },

  initialize: () => {
    Log.debug('[ItemsTab] initialize');
    setupEventListeners();

    document.getElementById('editGear').addEventListener('click', () => {
      editGear();
    });
    document.getElementById('reforgeGear').addEventListener('click', () => {
      reforgeGear();
    });
    document.getElementById('addGear').addEventListener('click', () => {
      addGear();
    });
    document.getElementById('duplicateGear').addEventListener('click', () => {
      duplicateGear();
    });
    document.getElementById('removeGear').addEventListener('click', () => {
      removeGear();
    });
    document.getElementById('unequipGear').addEventListener('click', () => {
      unequipGear();
    });
    document.getElementById('lockGear').addEventListener('click', () => {
      lockGear();
    });
    document.getElementById('unlockGear').addEventListener('click', () => {
      unlockGear();
    });

    document.getElementById('tab3label').addEventListener('click', () => {
      try {
        itemsGrid.gridOptions.api.redrawRows();
      } catch (e) {
        if (!(e instanceof TypeError)) {
          Log.error(e);
        }
      }
      ItemsTab.redraw();
    });

    setupHeroMatcher();
  },

  redraw: (newItem) => {
    ItemsGrid.redraw(newItem)
      .then(() => {
        return ItemsGrid.refreshFilters(filters);
      })
      .catch(Log.error);
  },
};

export default ItemsTab;

async function editGear() {
  const items = ItemsGrid.getSelectedGear();
  if (items?.length !== 1) {
    Notifier.warn('Select one item to edit.');
    return;
  }

  const item = items[0];
  Log.debug('[ItemsTab] editGear', item.id);

  const editedItem = await Dialog.editGearDialog(item, true, false);
  Log.debug('[ItemsTab] editGear result', editedItem);

  if (!editedItem) return;

  ItemAugmenter.augment([editedItem]);
  await Api.editItems([editedItem]);

  await ItemsGrid.editedItem();

  Notifier.success('Edited item');
  ItemsTab.redraw(editedItem);
  Saves.autoSave();
}

async function reforgeGear() {
  const items = ItemsGrid.getSelectedGear();
  if (items?.length !== 1) {
    Notifier.warn('Select one item to reforge.');
    return;
  }

  const item = items[0];

  if (item.level !== 85 || item.enhance !== 15) {
    Notifier.warn('Only +15 level 85 gear can be reforged.');
    return;
  }

  if (Reforge.isGaveleets(item)) {
    Notifier.warn("Abyss lifesteal set (Gaveleet's) cannot be reforged");
    return;
  }

  ItemAugmenter.augment([item]);
  const editedItem = await Dialog.editGearDialog(item, true, true);
  Log.debug('[ItemsTab] reforgeGear result', editedItem);

  if (!editedItem) return;
  await Api.editItems([editedItem]);

  Notifier.quick('Reforged item');
  await ItemsGrid.editedItem();
  ItemsTab.redraw(editedItem);
  Saves.autoSave();
}

async function addGear() {
  Log.debug('[ItemsTab] addGear');
  const newItem = await Dialog.editGearDialog(null, false, false);
  Log.debug('[ItemsTab] addGear result', newItem);

  if (!newItem) return;
  await Api.editItems([newItem]);

  Notifier.quick('Added item');
  await ItemsGrid.editedItem();
  ItemsTab.redraw(newItem);
  Saves.autoSave();
}

async function duplicateGear() {
  const items = ItemsGrid.getSelectedGear();
  if (items?.length !== 1) {
    Notifier.warn('Select one item to duplicate.');
    return;
  }

  const item = items[0];

  const editedItem = await Dialog.editGearDialog(item, false, false);
  Log.debug('[ItemsTab] duplicateGear result', editedItem);

  if (!editedItem) return;
  await Api.editItems([editedItem]);

  Notifier.quick('Added item');
  await ItemsGrid.editedItem();
  ItemsTab.redraw(editedItem);
  Saves.autoSave();
}

async function removeGear() {
  const items = ItemsGrid.getSelectedGear();
  Log.debug('[ItemsTab] removeGear', items.length, 'items');

  await Api.deleteItems(items.map((x) => x.id));

  Notifier.quick(
    `${i18next.t('Removed ')}${items.length}${i18next.t(' item(s).')}`,
  );

  ItemsTab.redraw();
  Saves.autoSave();
}

async function unequipGear() {
  const items = ItemsGrid.getSelectedGear();
  Log.debug('[ItemsTab] unequipGear', items.length, 'items');

  await Api.unequipItems(items.map((x) => x.id));

  Notifier.quick(
    `${i18next.t('Unequipped ')}${items.length}${i18next.t(' item(s).')}`,
  );

  ItemsTab.redraw();
  Saves.autoSave();
}

async function lockGear() {
  const items = ItemsGrid.getSelectedGear();
  Log.debug('[ItemsTab] lockGear', items.length, 'items');

  await Api.lockItems(items.map((x) => x.id));

  Notifier.quick(
    `${i18next.t('Locked ')}${items.length}${i18next.t(' item(s).')}`,
  );

  ItemsTab.redraw();
  Saves.autoSave();
}

async function unlockGear() {
  const items = ItemsGrid.getSelectedGear();
  Log.debug('[ItemsTab] unlockGear', items.length, 'items');

  await Api.unlockItems(items.map((x) => x.id));
  const hintString = `${i18next.t('Unlocked ')}${items.length}${i18next.t(
    ' item(s).',
  )}`;
  Log.debug('[ItemsTab] unlockGear hint:', hintString);
  Notifier.quick(
    `${i18next.t('Unlocked ')}${items.length}${i18next.t(' item(s).')}`,
  );

  ItemsTab.redraw();
  Saves.autoSave();
}

function setupFilterListener(elementId, filter, filterContent) {
  document.getElementById(elementId).addEventListener('click', () => {
    const element = $(`#${elementId}`);
    element.toggleClass('gearTabButtonSelected');

    if (MULTI_SELECT_FILTERS.has(filter)) {
      // Multi-select: toggle the value in the array; don't deselect siblings
      if (element.hasClass('gearTabButtonSelected')) {
        if (!filters[filter].includes(filterContent)) {
          filters[filter].push(filterContent);
        }
      } else {
        filters[filter] = filters[filter].filter((x) => x !== filterContent);
      }
    } else {
      // Single-select: deselect other buttons in the group
      elementsByFilter[filter].forEach((x) => {
        if (x !== elementId) $(`#${x}`).removeClass('gearTabButtonSelected');
      });
      filters[filter] = element.hasClass('gearTabButtonSelected')
        ? filterContent
        : null;
    }
    Log.debug('Updated filters', filters);
    ItemsGrid.refreshFilters(filters);
  });
}

function setupClearListener(elementId, filter) {
  document.getElementById(elementId).addEventListener('click', () => {
    elementsByFilter[filter].forEach((x) => {
      $(`#${x}`).removeClass('gearTabButtonSelected');
    });
    filters[filter] = MULTI_SELECT_FILTERS.has(filter) ? [] : null;
    ItemsGrid.refreshFilters(filters);
  });
}

const elementsByFilter = {
  gearFilter: [
    'weaponFilter',
    'helmetFilter',
    'armorFilter',
    'necklaceFilter',
    'ringFilter',
    'bootsFilter',
  ],
  setFilter: [
    'speedSetFilter',
    'attackSetFilter',
    'destructionSetFilter',
    'lifestealSetFilter',
    'protectionSetFilter',
    'counterSetFilter',
    'rageSetFilter',
    'revengeSetFilter',
    'injurySetFilter',
    'reversalSetFilter',
    'riposteSetFilter',
    'criticalSetFilter',
    'hitSetFilter',
    'healthSetFilter',
    'defenseSetFilter',
    'resistSetFilter',
    'immunitySetFilter',
    'unitySetFilter',
    'penetrationSetFilter',
    'torrentSetFilter',
    'warfareSetFilter',
    'pursuitSetFilter',
    'fervorSetFilter',
    'weakeningSetFilter',
  ],
  statFilter: [
    'mainStatAttackFilter',
    'mainStatAttackPercentFilter',
    'mainStatDefensePercentFilter',
    'mainStatDefenseFilter',
    'mainStatHealthPercentFilter',
    'mainStatHealthFilter',
    'mainStatCrFilter',
    'mainStatCdFilter',
    'mainStatEffFilter',
    'mainStatEffResFilter',
    'mainStatSpeedFilter',
  ],
  substatFilter: [
    'subStatAttackFilter',
    'subStatAttackPercentFilter',
    'subStatDefensePercentFilter',
    'subStatDefenseFilter',
    'subStatHealthPercentFilter',
    'subStatHealthFilter',
    'subStatCrFilter',
    'subStatCdFilter',
    'subStatEffFilter',
    'subStatEffResFilter',
    'subStatSpeedFilter',
  ],
  levelFilter: [
    'level90Filter',
    'level88Filter',
    'level85Filter',
    'levelUnder85Filter',
    'level0Filter',
  ],
  enhanceFilter: [
    'plus15Filter',
    'plus12Filter',
    'plus9Filter',
    'plus6Filter',
    'plus3Filter',
    'plus0Filter',
  ],
  rankFilter: [
    'rankEpicFilter',
    'rankHeroicFilter',
    'rankRareFilter',
    'rankGoodFilter',
    'rankNormalFilter',
    'otherworldlyFilter',
  ],
  duplicateFilter: ['duplicateFilter'],
  equippedOrNotFilter: ['equippedFilter', 'unequippedFilter'],
  modifyFilter: [
    'modifyAtkFilter',
    'modifyAtkPercentFilter',
    'modifyDefFilter',
    'modifyDefPercentFilter',
    'modifyHpFilter',
    'modifyHpPercentFilter',
    'modifyCrFilter',
    'modifyCdFilter',
    'modifyEffFilter',
    'modifyResFilter',
    'modifySpeedFilter',
  ],
};

function setupEventListeners() {
  // Gears
  setupFilterListener('weaponFilter', 'gearFilter', 'Weapon');
  setupFilterListener('helmetFilter', 'gearFilter', 'Helmet');
  setupFilterListener('armorFilter', 'gearFilter', 'Armor');
  setupFilterListener('necklaceFilter', 'gearFilter', 'Necklace');
  setupFilterListener('ringFilter', 'gearFilter', 'Ring');
  setupFilterListener('bootsFilter', 'gearFilter', 'Boots');

  setupClearListener('clearGearFilter', 'gearFilter');

  // Sets
  setupFilterListener('speedSetFilter', 'setFilter', 'SpeedSet');
  setupFilterListener('attackSetFilter', 'setFilter', 'AttackSet');
  setupFilterListener('destructionSetFilter', 'setFilter', 'DestructionSet');
  setupFilterListener('lifestealSetFilter', 'setFilter', 'LifestealSet');
  setupFilterListener('protectionSetFilter', 'setFilter', 'ProtectionSet');
  setupFilterListener('counterSetFilter', 'setFilter', 'CounterSet');
  setupFilterListener('rageSetFilter', 'setFilter', 'RageSet');
  setupFilterListener('revengeSetFilter', 'setFilter', 'RevengeSet');
  setupFilterListener('injurySetFilter', 'setFilter', 'InjurySet');
  setupFilterListener('reversalSetFilter', 'setFilter', 'ReversalSet');
  setupFilterListener('riposteSetFilter', 'setFilter', 'RiposteSet');
  setupFilterListener('warfareSetFilter', 'setFilter', 'WarfareSet');
  setupFilterListener('pursuitSetFilter', 'setFilter', 'PursuitSet');
  setupFilterListener('fervorSetFilter', 'setFilter', 'FervorSet');
  setupFilterListener('weakeningSetFilter', 'setFilter', 'WeakeningSet');
  setupFilterListener('criticalSetFilter', 'setFilter', 'CriticalSet');
  setupFilterListener('hitSetFilter', 'setFilter', 'HitSet');
  setupFilterListener('healthSetFilter', 'setFilter', 'HealthSet');
  setupFilterListener('defenseSetFilter', 'setFilter', 'DefenseSet');
  setupFilterListener('resistSetFilter', 'setFilter', 'ResistSet');
  setupFilterListener('immunitySetFilter', 'setFilter', 'ImmunitySet');
  setupFilterListener('unitySetFilter', 'setFilter', 'UnitySet');
  setupFilterListener('penetrationSetFilter', 'setFilter', 'PenetrationSet');
  setupFilterListener('torrentSetFilter', 'setFilter', 'TorrentSet');

  setupClearListener('clearSetFilter', 'setFilter');

  // Main
  setupFilterListener(
    'mainStatAttackPercentFilter',
    'statFilter',
    'AttackPercent',
  );
  setupFilterListener('mainStatAttackFilter', 'statFilter', 'Attack');
  setupFilterListener(
    'mainStatDefensePercentFilter',
    'statFilter',
    'DefensePercent',
  );
  setupFilterListener('mainStatDefenseFilter', 'statFilter', 'Defense');
  setupFilterListener(
    'mainStatHealthPercentFilter',
    'statFilter',
    'HealthPercent',
  );
  setupFilterListener('mainStatHealthFilter', 'statFilter', 'Health');
  setupFilterListener(
    'mainStatCrFilter',
    'statFilter',
    'CriticalHitChancePercent',
  );
  setupFilterListener(
    'mainStatCdFilter',
    'statFilter',
    'CriticalHitDamagePercent',
  );
  setupFilterListener(
    'mainStatEffFilter',
    'statFilter',
    'EffectivenessPercent',
  );
  setupFilterListener(
    'mainStatEffResFilter',
    'statFilter',
    'EffectResistancePercent',
  );
  setupFilterListener('mainStatSpeedFilter', 'statFilter', 'Speed');

  setupClearListener('clearMainStatFilter', 'statFilter');

  // Sub
  setupFilterListener(
    'subStatAttackPercentFilter',
    'substatFilter',
    'AttackPercent',
  );
  setupFilterListener('subStatAttackFilter', 'substatFilter', 'Attack');
  setupFilterListener(
    'subStatDefensePercentFilter',
    'substatFilter',
    'DefensePercent',
  );
  setupFilterListener('subStatDefenseFilter', 'substatFilter', 'Defense');
  setupFilterListener(
    'subStatHealthPercentFilter',
    'substatFilter',
    'HealthPercent',
  );
  setupFilterListener('subStatHealthFilter', 'substatFilter', 'Health');
  setupFilterListener(
    'subStatCrFilter',
    'substatFilter',
    'CriticalHitChancePercent',
  );
  setupFilterListener(
    'subStatCdFilter',
    'substatFilter',
    'CriticalHitDamagePercent',
  );
  setupFilterListener(
    'subStatEffFilter',
    'substatFilter',
    'EffectivenessPercent',
  );
  setupFilterListener(
    'subStatEffResFilter',
    'substatFilter',
    'EffectResistancePercent',
  );
  setupFilterListener('subStatSpeedFilter', 'substatFilter', 'Speed');

  // Level
  setupFilterListener('level90Filter', 'levelFilter', '90');
  setupFilterListener('level88Filter', 'levelFilter', '88');
  setupFilterListener('level85Filter', 'levelFilter', '85');
  setupFilterListener('levelUnder85Filter', 'levelFilter', 'under85');
  setupFilterListener('level0Filter', 'levelFilter', '0');

  setupClearListener('clearLevelFilter', 'levelFilter');

  // Enhance
  setupFilterListener('plus15Filter', 'enhanceFilter', 'plus15');
  setupFilterListener('plus12Filter', 'enhanceFilter', 'plus12');
  setupFilterListener('plus9Filter', 'enhanceFilter', 'plus9');
  setupFilterListener('plus6Filter', 'enhanceFilter', 'plus6');
  setupFilterListener('plus3Filter', 'enhanceFilter', 'plus3');
  setupFilterListener('plus0Filter', 'enhanceFilter', 'plus0');

  setupClearListener('clearEnhanceFilter', 'enhanceFilter');

  // Modify
  setupFilterListener('modifyAtkFilter', 'modifyFilter', 'Attack');
  setupFilterListener(
    'modifyAtkPercentFilter',
    'modifyFilter',
    'AttackPercent',
  );
  setupFilterListener('modifyDefFilter', 'modifyFilter', 'Defense');
  setupFilterListener(
    'modifyDefPercentFilter',
    'modifyFilter',
    'DefensePercent',
  );
  setupFilterListener('modifyHpFilter', 'modifyFilter', 'Health');
  setupFilterListener('modifyHpPercentFilter', 'modifyFilter', 'HealthPercent');
  setupFilterListener(
    'modifyCrFilter',
    'modifyFilter',
    'CriticalHitChancePercent',
  );
  setupFilterListener(
    'modifyCdFilter',
    'modifyFilter',
    'CriticalHitDamagePercent',
  );
  setupFilterListener(
    'modifyEffFilter',
    'modifyFilter',
    'EffectivenessPercent',
  );
  setupFilterListener(
    'modifyResFilter',
    'modifyFilter',
    'EffectResistancePercent',
  );
  setupFilterListener('modifySpeedFilter', 'modifyFilter', 'Speed');

  setupClearListener('clearModifyFilter', 'modifyFilter');

  // Rank
  setupFilterListener('rankEpicFilter', 'rankFilter', 'Epic');
  setupFilterListener('rankHeroicFilter', 'rankFilter', 'Heroic');
  setupFilterListener('rankRareFilter', 'rankFilter', 'Rare');
  setupFilterListener('rankGoodFilter', 'rankFilter', 'Good');
  setupFilterListener('rankNormalFilter', 'rankFilter', 'Normal');
  setupFilterListener('otherworldlyFilter', 'rankFilter', 'otherworldly');
  setupClearListener('clearRankFilter', 'rankFilter');

  // Other
  setupFilterListener('duplicateFilter', 'duplicateFilter', 'duplicate');

  setupFilterListener('equippedFilter', 'equippedOrNotFilter', 'equipped');
  setupFilterListener('unequippedFilter', 'equippedOrNotFilter', 'unequipped');

  // clearOtherFilter clears both other-category filters (duplicate + equipped/unequipped).
  // Using an inline handler rather than two setupClearListener calls to avoid registering
  // two listeners (which would call refreshFilters twice per click).
  document.getElementById('clearOtherFilter').addEventListener('click', () => {
    ['duplicateFilter', 'equippedOrNotFilter'].forEach((key) => {
      elementsByFilter[key].forEach((x) =>
        $(`#${x}`).removeClass('gearTabButtonSelected'),
      );
      filters[key] = null;
    });
    ItemsGrid.refreshFilters(filters);
  });

  // clearAllFilter has its own comprehensive inline listener below — do NOT also
  // call setupClearListener here, which would register a second listener and cause
  // a double refreshFilters call on every click.
  document.getElementById('clearAllFilter').addEventListener('click', () => {
    Object.keys(elementsByFilter).forEach((key) => {
      elementsByFilter[key].forEach((x) => {
        $(`#${x}`).removeClass('gearTabButtonSelected');
      });
      filters[key] = MULTI_SELECT_FILTERS.has(key) ? [] : null;
    });
    ItemsGrid.refreshFilters(filters);
  });

  // Button
  document
    .getElementById('clearSubstatsFilter')
    .addEventListener('click', () => {
      filters.substatFilter = [];
      elementsByFilter.substatFilter.forEach((x) => {
        $(`#${x}`).removeClass('gearTabButtonSelected');
      });
      ItemsGrid.refreshFilters(filters);
    });
  // Text above buttons
  document
    .getElementById('clearSubStatFilter')
    .addEventListener('click', () => {
      filters.substatFilter = [];
      elementsByFilter.substatFilter.forEach((x) => {
        $(`#${x}`).removeClass('gearTabButtonSelected');
      });
      ItemsGrid.refreshFilters(filters);
    });

  document.getElementById('modifySwitch').addEventListener('click', () => {
    if (modifyGreater) {
      modifyGreater = false;

      $('#modifyAtkIcon').attr('src', './assets/lesseratk.png');
      $('#modifyAtkPercentIcon').attr('src', './assets/lesseratkpercent.png');
      $('#modifyDefIcon').attr('src', './assets/lesserdef.png');
      $('#modifyDefPercentIcon').attr('src', './assets/lesserdefpercent.png');
      $('#modifyHpIcon').attr('src', './assets/lesserhp.png');
      $('#modifyHpPercentIcon').attr('src', './assets/lesserhppercent.png');
      $('#modifyCrIcon').attr('src', './assets/lessercr.png');
      $('#modifyCdIcon').attr('src', './assets/lessercd.png');
      $('#modifyEffIcon').attr('src', './assets/lessereff.png');
      $('#modifyResIcon').attr('src', './assets/lesserres.png');
      $('#modifySpeedIcon').attr('src', './assets/lesserspeed.png');
      $('#modifySwitchIcon').attr('src', './assets/greater.png');
    } else {
      modifyGreater = true;

      $('#modifyAtkIcon').attr('src', './assets/greateratk.png');
      $('#modifyAtkPercentIcon').attr('src', './assets/greateratkpercent.png');
      $('#modifyDefIcon').attr('src', './assets/greaterdef.png');
      $('#modifyDefPercentIcon').attr('src', './assets/greaterdefpercent.png');
      $('#modifyHpIcon').attr('src', './assets/greaterhp.png');
      $('#modifyHpPercentIcon').attr('src', './assets/greaterhppercent.png');
      $('#modifyCrIcon').attr('src', './assets/greatercr.png');
      $('#modifyCdIcon').attr('src', './assets/greatercd.png');
      $('#modifyEffIcon').attr('src', './assets/greatereff.png');
      $('#modifyResIcon').attr('src', './assets/greaterres.png');
      $('#modifySpeedIcon').attr('src', './assets/greaterspeed.png');
      $('#modifySwitchIcon').attr('src', './assets/lesser.png');
    }
  });
}

// ─── Hero Gear Matcher ───────────────────────────────────────────────────────

const PRIO_INPUT_IDS = [
  'hmPrioAtk',
  'hmPrioHp',
  'hmPrioDef',
  'hmPrioSpd',
  'hmPrioCr',
  'hmPrioCd',
  'hmPrioEff',
  'hmPrioRes',
];

function readMatcherConfig() {
  const heroName = document.getElementById('heroMatcherHeroSelect').value;
  if (!heroName) return null;
  return {
    heroName,
    priorities: {
      atk: Number.parseFloat(document.getElementById('hmPrioAtk').value) || 0,
      hp: Number.parseFloat(document.getElementById('hmPrioHp').value) || 0,
      def: Number.parseFloat(document.getElementById('hmPrioDef').value) || 0,
      spd: Number.parseFloat(document.getElementById('hmPrioSpd').value) || 0,
      cr: Number.parseFloat(document.getElementById('hmPrioCr').value) || 0,
      cd: Number.parseFloat(document.getElementById('hmPrioCd').value) || 0,
      eff: Number.parseFloat(document.getElementById('hmPrioEff').value) || 0,
      res: Number.parseFloat(document.getElementById('hmPrioRes').value) || 0,
    },
    mainStatPreference: {
      necklace: $('#hmMainNecklace').multipleSelect('getSelects') || [],
      ring: $('#hmMainRing').multipleSelect('getSelects') || [],
      boots: $('#hmMainBoots').multipleSelect('getSelects') || [],
    },
    setPreference: $('#hmSetPreference').multipleSelect('getSelects') || [],
  };
}

function loadMatcherConfigIntoUI(config) {
  const p = config.priorities || {};
  document.getElementById('hmPrioAtk').value = p.atk || 0;
  document.getElementById('hmPrioHp').value = p.hp || 0;
  document.getElementById('hmPrioDef').value = p.def || 0;
  document.getElementById('hmPrioSpd').value = p.spd || 0;
  document.getElementById('hmPrioCr').value = p.cr || 0;
  document.getElementById('hmPrioCd').value = p.cd || 0;
  document.getElementById('hmPrioEff').value = p.eff || 0;
  document.getElementById('hmPrioRes').value = p.res || 0;
  const m = config.mainStatPreference || {};
  $('#hmMainNecklace').multipleSelect('setSelects', m.necklace || []);
  $('#hmMainRing').multipleSelect('setSelects', m.ring || []);
  $('#hmMainBoots').multipleSelect('setSelects', m.boots || []);
  $('#hmSetPreference').multipleSelect(
    'setSelects',
    config.setPreference || [],
  );
}

function applyMatcherAndRedraw() {
  const config = readMatcherConfig();
  HeroGearMatcher.setCurrentConfig(config);
  if (config) {
    HeroGearMatcher.saveConfig(config.heroName, config);
  }
  ItemsTab.redraw();
}

function setupHeroMatcher() {
  // Populate hero dropdown from HeroData
  const heroData = HeroData.getAllHeroData();
  const heroNames = Object.keys(heroData).sort((a, b) => a.localeCompare(b));
  const selectEl = document.getElementById('heroMatcherHeroSelect');
  heroNames.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    selectEl.appendChild(option);
  });

  // Initialize multipleSelect on set + main stat selectors
  const msOptions = {
    maxHeight: 220,
    showClear: false,
    minimumCountSelected: 99,
    displayTitle: true,
    selectAll: false,
    placeholder: i18next.t('Any'),
    onChange: applyMatcherAndRedraw,
  };
  $('#hmMainNecklace').multipleSelect(msOptions);
  $('#hmMainRing').multipleSelect(msOptions);
  $('#hmMainBoots').multipleSelect(msOptions);
  $('#hmSetPreference').multipleSelect({
    ...msOptions,
    showClear: true,
    selectAll: true,
    placeholder: i18next.t('Any set'),
    formatSelectAll() {
      return i18next.t('[Select all]');
    },
  });

  // Toggle panel visibility
  document.getElementById('heroMatcherToggle').addEventListener('click', () => {
    const panel = document.getElementById('heroMatcherPanel');
    const btn = document.getElementById('heroMatcherToggle');
    const isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? '' : 'none';
    btn.innerHTML = isHidden ? '&#9650;' : '&#9660;';
  });

  // When hero changes: load saved config for that hero, then recalculate
  document
    .getElementById('heroMatcherHeroSelect')
    .addEventListener('change', () => {
      const heroName = document.getElementById('heroMatcherHeroSelect').value;
      if (heroName) {
        const saved = HeroGearMatcher.loadConfig(heroName);
        loadMatcherConfigIntoUI(saved || HeroGearMatcher.getDefaultConfig());
      } else {
        loadMatcherConfigIntoUI(HeroGearMatcher.getDefaultConfig());
      }
      applyMatcherAndRedraw();
    });

  // When priorities change: recalculate
  PRIO_INPUT_IDS.forEach((id) => {
    document
      .getElementById(id)
      .addEventListener('change', applyMatcherAndRedraw);
  });
}

/* global multiOptimizerHeroes, i18next, $, AG_GRID_LOCALE_ZH, AG_GRID_LOCALE_ZH_TW, AG_GRID_LOCALE_FR, AG_GRID_LOCALE_JA, AG_GRID_LOCALE_KO, AG_GRID_LOCALE_RU, AG_GRID_LOCALE_EN, GridRenderer, Settings, OptimizerTab, HeroData, Utils, Selectors, Api, ModificationFilter, Dialog, Saves, Assets, HtmlGenerator, Notifier */

// Diagnostic logging uses the central Log utility (Log.debug, gated by window.__optDebug; see 5. Dev Only/LogControl.js).

let progressTimer = null;
let permutations = 0;
let interrupt = false;
globalThis.multiOptimizerHeroes = [];

function setMultiOptimizerHero(index, heroResponse) {
  redrawHeroImage(index);
  multiOptimizerHeroes[index].heroResponse = heroResponse;
  multiOptimizerHeroes[index].hero = heroResponse.hero;

  recalculateFilters(index);

  setPinnedHero(index, heroResponse.hero);
  togglePanelSelect(index, false);

  drawMultiPreview([], [], index);
  if (multiOptimizerHeroes[index]?.grid) {
    multiOptimizerHeroes[index].grid.gridOptions.api.deselectAll();
  }
}

function initializeBlank(index) {
  const html = `<div class="multiOptimizerHeroRow" id="heroRow${index}">
  <div class="multiTopRow">
      <div class="multiInfoPanel" id="multiInfoPanel${index}">
          <select id="addMultiOptimizerHeroesSelector${index}" class="gearPreviewButton"></select>
          <div class="inputHeroImageContainer">
              <img src="" id="multiInputHeroImage${index}" class="inputHeroImage"></img>
          </div>

          <input type="submit" value="${i18next.t(
            'Start',
          )}" class="gearPreviewButton" id="multiStart${index}" data-t ><br>
          <div class="multiSpace"></div>
          <input type="submit" value="${i18next.t(
            'Edit filters',
          )}" class="gearPreviewButton" id="multiEditFilters${index}" data-t ><br>
          <div class="multiSpace"></div>
          <input type="submit" value="${i18next.t(
            'Equip',
          )}" class="gearPreviewButton" id="multiEquip${index}" data-t ><br>
          <div class="multiSpace"></div>
          <input type="submit" value="${i18next.t(
            'Save',
          )}" class="gearPreviewButton" id="multiSave${index}" data-t ><br>
          <div class="multiSpace"></div>
          <input type="submit" value="${i18next.t(
            'Deselect',
          )}" class="gearPreviewButton" id="multiUnselect${index}" data-t ><br>
          <div class="multiSpace"></div>
          <input type="submit" value="${i18next.t(
            'Cancel',
          )}" class="gearPreviewButton" id="multiCancel${index}" data-t ><br>
          <div class="multiSpace"></div>
          <input type="submit" value="${i18next.t(
            'Remove',
          )}" class="gearPreviewButton" id="multiRemove${index}" data-t ><br>
      </div>
      <div class="ag-theme-balham multiGrid" id="multiGrid${index}">
      </div>
  </div>

  <div class="multiBottomRow">
    <div id="multi-optimizer-equipped-section${index}" class="optimizer-equipped-section">
      <div id="multi-optimizer-heroes-equipped-weapon${index}" class="gear-preview-row">
      </div>
      <div class="vertical"></div>
      <div id="multi-optimizer-heroes-equipped-helmet${index}" class="gear-preview-row">
      </div>
      <div class="vertical"></div>
      <div id="multi-optimizer-heroes-equipped-armor${index}" class="gear-preview-row">
      </div>
      <div class="vertical"></div>
      <div id="multi-optimizer-heroes-equipped-necklace${index}" class="gear-preview-row">
      </div>
      <div class="vertical"></div>
      <div id="multi-optimizer-heroes-equipped-ring${index}" class="gear-preview-row">
      </div>
      <div class="vertical"></div>
      <div id="multi-optimizer-heroes-equipped-boots${index}" class="gear-preview-row">
      </div>
    </div>
  </div>
  <div class="horizontalSpace"></div>
</div>
`;

  $('#multi-optimizer-section').append(html);

  let localeText;
  if (i18next.language === 'zh') {
    localeText = AG_GRID_LOCALE_ZH;
  } else if (i18next.language === 'zh-TW') {
    localeText = AG_GRID_LOCALE_ZH_TW;
  } else if (i18next.language === 'fr') {
    localeText = AG_GRID_LOCALE_FR;
  } else if (i18next.language === 'ja') {
    localeText = AG_GRID_LOCALE_JA;
  } else if (i18next.language === 'ko') {
    localeText = AG_GRID_LOCALE_KO;
  } else if (i18next.language === 'ru') {
    localeText = AG_GRID_LOCALE_RU;
  } else {
    localeText = AG_GRID_LOCALE_EN;
  }
  const DIGITS_2 = 30;
  const DIGITS_3 = 35;
  const DIGITS_4 = 42;
  const DIGITS_5 = 45;
  const DIGITS_6 = 50;

  function customGridGetter() {
    return multiOptimizerHeroes[index].grid;
  }

  const gridOptions = {
    defaultColDef: {
      width: 50,
      sortable: true,
      sortingOrder: ['desc', 'asc'],
      cellDataType: false,
      cellStyle: columnGradientProvider(index),
      // suppressNavigable: true,
      cellClass: 'no-border',
    },

    columnDefs: [
      {
        headerName: i18next.t('sets'),
        field: 'sets',
        width: 80,
        cellRenderer: (params) => GridRenderer.renderSets(params.value),
      },
      { headerName: i18next.t('atk'), field: 'atk', width: DIGITS_4 },
      { headerName: i18next.t('def'), field: 'def', width: DIGITS_4 },
      { headerName: i18next.t('hp'), field: 'hp', width: DIGITS_5 },
      { headerName: i18next.t('spd'), field: 'spd', width: DIGITS_3 },
      { headerName: i18next.t('cr'), field: 'cr', width: DIGITS_3 },
      { headerName: i18next.t('cd'), field: 'cd', width: DIGITS_3 },
      { headerName: i18next.t('eff'), field: 'eff', width: DIGITS_3 },
      { headerName: i18next.t('res'), field: 'res', width: DIGITS_3 },
      // {headerName: i18next.t('dac'), field: 'dac'},
      { headerName: i18next.t('cp'), field: 'cp', width: DIGITS_6 },
      { headerName: i18next.t('hps'), field: 'hpps', width: DIGITS_4 },
      { headerName: i18next.t('ehp'), field: 'ehp', width: DIGITS_6 },
      { headerName: i18next.t('ehps'), field: 'ehpps', width: DIGITS_5 },
      { headerName: i18next.t('dmg'), field: 'dmg', width: DIGITS_5 },
      { headerName: i18next.t('dmgs'), field: 'dmgps', width: DIGITS_4 },
      { headerName: i18next.t('mcd'), field: 'mcdmg', width: DIGITS_5 },
      {
        headerName: i18next.t('mcds'),
        field: 'mcdmgps',
        width: DIGITS_4,
      },
      { headerName: i18next.t('dmgh'), field: 'dmgh', width: DIGITS_5 },
      { headerName: i18next.t('dmgd'), field: 'dmgd', width: DIGITS_4 },
      { headerName: i18next.t('s1'), field: 's1', width: DIGITS_5 },
      { headerName: i18next.t('s2'), field: 's2', width: DIGITS_5 },
      { headerName: i18next.t('s3'), field: 's3', width: DIGITS_5 },
      { headerName: i18next.t('gs'), field: 'score', width: DIGITS_3 },
      { headerName: i18next.t('bs'), field: 'bs', width: DIGITS_3 },
      {
        headerName: i18next.t('prio'),
        field: 'priority',
        width: DIGITS_3,
      },
      {
        // Build Score — the same authoritative ranking shown on the single Optimizer (Bscr),
        // so rows rank/colour consistently across tabs. The backend sends it ×100 on every
        // result row (getResultRows); divide only for display. No frontend calculateBuildScore
        // fallback here: that needs this hero's base/targets, but the shared OptimizerGrid
        // currentBaseStats/currentTargets belong to the single-optimizer pinned hero — so a
        // missing value renders blank rather than a wrong number.
        headerName: i18next.t('bscr'),
        field: 'buildScore',
        width: DIGITS_3,
        headerTooltip:
          'Build Score — the authoritative ranking: per-slot/per-set-weighted gear value + stat-target bonus. Same number used on the Optimizer tab.',
        valueFormatter: (p) =>
          p.value === null || p.value === undefined
            ? ''
            : (p.value / 100).toFixed(1),
      },
      { headerName: i18next.t('eq'), field: 'eq', width: DIGITS_2 },
      {
        headerName: i18next.t('upg'),
        field: 'upgrades',
        width: DIGITS_2,
      },
      {
        headerName: 'FSpd',
        field: 'finalSpeed',
        width: DIGITS_5,
        headerTooltip:
          'Final Speed = Speed / (1 - CR Push%). Set the push % in the CR Push box on the Optimizer tab.',
      },
      {
        headerName: 'SpdEff',
        field: 'spdEff',
        width: DIGITS_5,
        headerTooltip:
          'SpdEff = Speed + Effectiveness x weight (Eff wt box on the Optimizer tab, default 0.5).',
      },
      {
        headerName: i18next.t(''),
        field: 'property',
        width: 25,
        sortable: false,
        cellRenderer: (params) => GridRenderer.renderStar(params.value),
      },
    ],
    rowHeight: 27,
    rowModelType: 'infinite',
    rowSelection: {
      mode: 'singleRow',
      headerCheckbox: false,
      enableClickSelection: true,
    },
    pagination: true,
    paginationPageSize: 500,
    paginationPageSizeSelector: false,
    localeText,
    cacheBlockSize: 500,
    maxBlocksInCache: 1,
    suppressPaginationPanel: false,
    datasource: { getRows: (params) => params.successCallback([], 0) },
    suppressScrollOnNewData: true,
    suppressCellFocus: true,
    navigateToNextCell: GridRenderer.arrowKeyNavigator(
      this,
      'multiGrid',
      null,
      customGridGetter,
    ),
    getRowId: (params) => {
      return params.data.id;
    },
    suppressDragLeaveHidesColumns: true,
  };

  const gridDiv = document.getElementById(`multiGrid${index}`);
  const grid = createGridCompat(gridDiv, gridOptions);

  grid.gridOptions.onRowSelected = provideOnRowSelected(grid, index);

  multiOptimizerHeroes[index] = {
    index,
    div: gridDiv,
    gridOptions,
    grid,
    initialized: false,
    currentAggregate: {},
  };

  const pagingPanelId = $(`#${multiOptimizerHeroes[index].div.id}`)
    .find('.ag-paging-panel')
    .first()
    .attr('id');

  $(`#${pagingPanelId}`).prepend(`
        <div class="injectedSummaryRow">
            <div class="injectedSummaryComponent" id="summaryPanel1-${index}">
            </div>
            <div class="injectedSummaryComponent" id="summaryPanel2-${index}">
            </div>
            <div class="injectedSummaryComponent" id="summaryPanel3-${index}">
            </div>
        </div>
    `);

  redrawHeroSelector(index);

  $(`#addMultiOptimizerHeroesSelector${index}`).change(async () => {
    const heroId = document.getElementById(
      `addMultiOptimizerHeroesSelector${index}`,
    ).value;

    if (
      !heroId ||
      heroId.length === 0 ||
      heroId === multiOptimizerHeroes[index].hero?.id
    ) {
      return;
    }

    const heroResponse = await Api.getHeroById(heroId, true);

    setMultiOptimizerHero(index, heroResponse);
    if (index === multiOptimizerHeroes.length - 1) {
      initializeBlank(index + 1);
    }
  });

  document
    .getElementById(`multiStart${index}`)
    .addEventListener('click', async () => {
      interrupt = false;
      handleStartOptimizationRequest(index);
    });

  document
    .getElementById(`multiEditFilters${index}`)
    .addEventListener('click', async () => {
      Log.debug(multiOptimizerHeroes, multiOptimizerHeroes[index]);
      const heroIndex = multiOptimizerHeroes[index];

      if (!heroIndex?.hero) {
        return;
      }

      const heroResponse = await Api.getHeroById(heroIndex.hero.id, true);

      const { hero } = heroResponse;
      if (!hero) {
        return;
      }

      const params = await Dialog.editFiltersDialog(hero, index);

      if (!params) {
        return;
      }

      // baseStats lives on the freshly-fetched heroResponse, not on the cached heroIndex entry
      // (setMultiOptimizerHero never sets heroIndex.baseStats), so request.base was undefined and
      // the saved request omitted base stats.
      const { baseStats } = heroResponse;

      const request = {
        base: baseStats,
        requestType: 'OptimizationRequest',
        items: null,
        bonusHp: hero.bonusHp,
        bonusAtk: hero.bonusAtk,
        hero,
      };

      const mergedRequest = Object.assign(request, params, baseStats);

      const _saveRequest = Object.assign({}, mergedRequest);
      [
        'inputAtkPriority',
        'inputHpPriority',
        'inputDefPriority',
        'inputSpdPriority',
        'inputCrPriority',
        'inputCdPriority',
        'inputEffPriority',
        'inputResPriority',
      ].forEach((k) => {
        if (_saveRequest[k] != null)
          _saveRequest[k] = Math.round(_saveRequest[k]);
      });
      Api.saveOptimizationRequest(_saveRequest)
        .then(Saves.autoSave)
        .catch(Log.error);

      recalculateFilters(index);
    });

  document
    .getElementById(`multiEquip${index}`)
    .addEventListener('click', async () => {
      const heroIndex = multiOptimizerHeroes[index];
      const { grid: equipGrid } = heroIndex;

      const selectedGear = getSelectedGearIds(equipGrid);
      if (selectedGear.length === 0) return;
      if (selectedGear.includes(undefined) || selectedGear.includes(null)) {
        return;
      }

      const heroId = heroIndex.hero.id;

      const heroResult = await Api.equipItemsOnHero(
        heroId,
        selectedGear,
        $('#inputPredictReforges').prop('checked'),
      );
      const { hero } = heroResult;

      const row = equipGrid.gridOptions.api.getSelectedRows()[0];
      const node = equipGrid.gridOptions.api.getSelectedNodes()[0];
      const rowId = row.id;

      if (row.mods.some(Boolean)) {
        let modGradeLabel = '';
        if (hero.modGrade === 'greater') {
          modGradeLabel = 'Greater';
        } else if (hero.modGrade) {
          modGradeLabel = 'Lesser';
        }
        row.name = `MOD: ${modGradeLabel} ${hero.rollQuality || '0'}%`;
      }

      await Api.addBuild(heroId, row);
      await Api.editResultRows(
        Number.parseInt(rowId, 10),
        'star',
        heroIndex.executionId,
      );

      row.property = 'star';
      node.updateData(row);

      drawMultiPreview(selectedGear, getSelectedGearMods(equipGrid), index);
      setPinnedHero(index, hero);
      Saves.autoSave();
    });

  document
    .getElementById(`multiRemove${index}`)
    .addEventListener('click', async () => {
      handleRemove(index);
    });

  document
    .getElementById(`multiCancel${index}`)
    .addEventListener('click', async () => {
      const heroIndex = multiOptimizerHeroes[index];
      if (heroIndex?.progressTimer) {
        clearInterval(heroIndex.progressTimer);
        heroIndex.progressTimer = null;
      }
      if (heroIndex?.executionId) {
        Api.cancelExecution(heroIndex.executionId);
      } else {
        Api.cancelOptimizationRequest();
      }
    });

  document
    .getElementById(`multiSave${index}`)
    .addEventListener('click', async () => {
      const heroIndex = multiOptimizerHeroes[index];
      const { grid: saveGrid } = heroIndex;

      const selectedGear = getSelectedGearIds(saveGrid);
      if (selectedGear.length === 0) return;
      if (selectedGear.includes(undefined) || selectedGear.includes(null)) {
        return;
      }

      const heroId = heroIndex.hero.id;

      const row = saveGrid.gridOptions.api.getSelectedRows()[0];
      const node = saveGrid.gridOptions.api.getSelectedNodes()[0];
      const rowId = row.id;

      const { hero } = await Api.getHeroById(heroId);
      if (row.mods.some(Boolean)) {
        let modGradeLabel = '';
        if (hero.modGrade === 'greater') {
          modGradeLabel = 'Greater';
        } else if (hero.modGrade) {
          modGradeLabel = 'Lesser';
        }
        row.name = `MOD: ${modGradeLabel} ${hero.rollQuality || '0'}%`;
      }

      await Api.addBuild(heroId, row);
      await Api.editResultRows(
        Number.parseInt(rowId, 10),
        'star',
        heroIndex.executionId,
      );

      row.property = 'star';
      node.updateData(row);

      drawMultiPreview(selectedGear, getSelectedGearMods(saveGrid), index);
    });

  document
    .getElementById(`multiUnselect${index}`)
    .addEventListener('click', async () => {
      handleDeselect(index);
    });
}

function handleDeselect(index) {
  const heroIndex = multiOptimizerHeroes[index];
  if (!heroIndex?.grid) {
    return;
  }

  const { grid } = heroIndex;

  grid.gridOptions.api.deselectAll();
  drawMultiPreview([], [], index);
  filterMultiGridItems(index);
  togglePanelSelect(index, false);
}

function handleRemove(index) {
  if (multiOptimizerHeroes.filter((x) => !!x).length === 1) {
    return;
  }

  if (!multiOptimizerHeroes[index]?.hero) {
    return;
  }

  const heroIndex = multiOptimizerHeroes[index];
  const { grid } = heroIndex;

  grid.destroy();

  Api.deleteExecution(heroIndex.executionId);

  $(`#heroRow${index}`).remove();
  multiOptimizerHeroes[index] = null;
}

async function recalculateFilters(index) {
  const heroIndex = multiOptimizerHeroes[index];
  const heroResponse = await Api.getHeroById(heroIndex.hero.id, true);

  const { hero } = heroResponse;
  if (!hero) {
    return;
  }

  const allItemsResponse = await Api.getAllItems();

  const allowedHeroIds = [];

  multiOptimizerHeroes
    .filter((multiHero) => multiHero?.hero)
    .forEach((multiHero) => {
      allowedHeroIds.push(multiHero.hero.id);
    });

  const params = hero.optimizationRequest || getDefaultParams();
  params.excludeFilter = Settings.getExcludeSelects();

  const gearMainFilters = [
    params.inputNecklaceStat,
    params.inputRingStat,
    params.inputBootsStat,
  ];

  OptimizerTab.applyItemFilters(
    params,
    heroResponse,
    allItemsResponse,
    false,
    allowedHeroIds,
    gearMainFilters,
  )
    .then((result) => {
      const { items } = result;

      const weapons = items.filter((x) => x.gear === 'Weapon');
      const helmets = items.filter((x) => x.gear === 'Helmet');
      const armors = items.filter((x) => x.gear === 'Armor');
      const necklaces = items.filter((x) => x.gear === 'Necklace');
      const rings = items.filter((x) => x.gear === 'Ring');
      const boots = items.filter((x) => x.gear === 'Boots');

      permutations =
        weapons.length *
        helmets.length *
        armors.length *
        necklaces.length *
        rings.length *
        boots.length;

      $(`#summaryPanel1-${index}`).text(
        `${i18next.t('Permutations')}: ${Number(
          permutations,
        ).toLocaleString()}`,
      );

      Log.debug(`PERMUTATIONS: ${permutations}`);
      return permutations;
    })
    .catch(Log.error);
}

export function toggleDarkMode(enabled) {
  if (enabled) {
    gradient = darkGradient;
  } else {
    gradient = lightGradient;
  }

  try {
    multiOptimizerHeroes.forEach((multiHero) => {
      if (multiHero?.grid) {
        multiHero.grid.gridOptions.api.redrawRows();
      }
    });
  } catch (e) {
    Log.error(e);
  }
}
export async function initialize() {
  initializeBlank(0);

  document.getElementById('multiGuide').addEventListener('click', async () => {
    Dialog.multiOptimizerGuide(
      `
<h2>
    ${i18next.t('Multi Optimizer Guide')}
</h2>

${i18next.t(
  'This tool is for building multiple heroes simultaneously, who share similar gear requirements.',
)}

<ul class='newFeatures'>
    <li>${i18next.t('Instructions')}</li>
    <ul>
        <li>${i18next.t(
          'First, add all the heroes that you want to optimize.',
        )}</li>
        <li>${i18next.t(
          "Heroes must have filters to optimize, click 'Edit filters' to change their stat and item filters.",
        )}</li>
        <li>${i18next.t(
          'Lower your permutations as much as possible. Aim for < 5 million results total across all heroes.',
        )}</li>
        <li>${i18next.t(
          "Click 'Start all' to begin optimizing all selected heroes, then wait for results.",
        )}</li>
        <li>${i18next.t(
          "Once finished, select a row to filter out builds containing the row's items from other heroes.",
        )}</li>
        <li>${i18next.t(
          "Click 'Deselect' to clear the selected build, and un-filter the row's items from other heroes.",
        )}</li>
    </ul>

    <br>
    <li>${i18next.t('Details')}</li>
    <ul>
        <li>${i18next.t(
          'This works best with 2-4 heroes, but there is no hard limit. More than 4 can be slow.',
        )}</li>
        <li>${i18next.t(
          "The hero priority filter has one difference: all units added into the multi-optimizer are allowed to use each other's equipped items.",
        )}</li>
        <li>${i18next.t(
          "If a new hero is added to the multi-optimizer while other heroes already have results, Hit 'Start all' again to refresh the existing builds.",
        )}</li>
        <li>${i18next.t(
          "The java process has to store all the results across all heroes. If you notice the permutations progressing very slowly, you may have run out of memory. Hit 'Cancel all' and apply stricter filters.",
        )}</li>
    </ul>
</ul>`,
    );
  });

  document
    .getElementById('multiStartAll')
    .addEventListener('click', async () => {
      interrupt = false;
      const PARALLEL_SLOTS = 2;
      const heroIndices = multiOptimizerHeroes
        .map((h, i) => ({ h, i }))
        .filter(({ h }) => h?.hero)
        .map(({ i }) => i);
      let queuePos = 0;
      let activeSlots = 0;

      function tryStartNext() {
        while (
          activeSlots < PARALLEL_SLOTS &&
          queuePos < heroIndices.length &&
          !interrupt
        ) {
          const idx = heroIndices[queuePos++];
          activeSlots++;
          handleStartOptimizationRequest(
            idx,
            () => {
              activeSlots--;
              tryStartNext();
            },
            true,
          );
        }
      }
      tryStartNext();
    });

  document
    .getElementById('multiCancelAll')
    .addEventListener('click', async () => {
      interrupt = true;
      multiOptimizerHeroes.forEach((heroIndex) => {
        if (!heroIndex) return;
        if (heroIndex.progressTimer) {
          clearInterval(heroIndex.progressTimer);
          heroIndex.progressTimer = null;
        }
        if (heroIndex.executionId) {
          Api.cancelExecution(heroIndex.executionId);
        }
      });
      // global safety net for single-optimizer and legacy paths
      Api.cancelOptimizationRequest();
    });

  document
    .getElementById('multiRemoveAll')
    .addEventListener('click', async () => {
      for (let i = multiOptimizerHeroes.length - 1; i >= 0; i -= 1) {
        handleRemove(i);
      }
    });

  document
    .getElementById('multiDeselectAll')
    .addEventListener('click', async () => {
      for (let i = multiOptimizerHeroes.length - 1; i >= 0; i -= 1) {
        handleDeselect(i);
      }
    });

  const refreshHeroSelectorAtIndex = (heroes, i) => {
    const selectorId = `addMultiOptimizerHeroesSelector${i}`;
    const optimizerHeroSelector = document.getElementById(selectorId);
    if (!optimizerHeroSelector) return;

    const { options } = optimizerHeroSelector;
    let selected = [...options].filter((x) => x.selected);
    selected = selected.length ? selected[0] : null;

    const { length } = optimizerHeroSelector.options;
    for (let k = length - 1; k >= 0; k -= 1) {
      optimizerHeroSelector.options[k] = null;
    }

    for (const element of heroes) {
      const hero = element;
      const option = document.createElement('option');
      option.innerHTML = i18next.t(hero.name);
      option.label = hero.name;
      option.value = hero.id;
      if (selected && hero.id === selected.value) {
        option.selected = true;
      }
      optimizerHeroSelector.add(option);
    }

    Selectors.refreshMultiHeroSelector(selectorId);
  };

  document.getElementById('tab2label').addEventListener('click', async () => {
    const getAllHeroesResponse = await Api.getAllHeroes();
    const { heroes } = getAllHeroesResponse;
    Utils.sortByAttribute(heroes, 'name');

    for (let i = 0; i < multiOptimizerHeroes.length; i += 1) {
      refreshHeroSelectorAtIndex(heroes, i);
    }
  });
}
export async function redrawHeroSelector(index) {
  const getAllHeroesResponse = await Api.getAllHeroes();

  clearHeroOptions(`addMultiOptimizerHeroesSelector${index}`);

  const optimizerHeroSelector = document.getElementById(
    `addMultiOptimizerHeroesSelector${index}`,
  );
  const { heroes } = getAllHeroesResponse;
  Utils.sortByAttribute(heroes, 'name');

  heroes.unshift({
    name: '',
    id: '',
  });

  heroes.forEach((hero) => {
    const option = document.createElement('option');
    option.innerHTML = i18next.t(hero.name);
    option.label = hero.name;
    option.value = hero.id;

    optimizerHeroSelector.add(option);
  });

  Selectors.setMultiHeroSelector(`addMultiOptimizerHeroesSelector${index}`);
}

function setPinnedHero(index, hero) {
  globalThis.OptimizerGrid?.decorateCalcFields?.([hero], hero?.crPush);
  multiOptimizerHeroes[index].grid.gridOptions.api.setGridOption(
    'pinnedTopRowData',
    [hero],
  );
}

/**
 * Re-apply the FSpd/SpdEff columns across every multi-optimizer grid when the
 * shared CR-push / eff-weight inputs change on the Optimizer tab.  Re-decorates
 * each pinned current-gear row and refreshes the infinite cache so the result
 * blocks are re-fetched (and re-sorted server-side) with the new values.
 */
export function refreshCalcColumns() {
  multiOptimizerHeroes.forEach((entry) => {
    if (!entry || !entry.grid) return;
    try {
      const { api } = entry.grid.gridOptions;
      const pinned = api.getPinnedTopRow(0);
      if (pinned && pinned.data) {
        globalThis.OptimizerGrid?.decorateCalcFields?.(
          [pinned.data],
          entry.hero?.crPush,
        );
        api.setGridOption('pinnedTopRowData', [pinned.data]);
      }
      api.refreshInfiniteCache();
    } catch (e) {
      Log.error('multi refreshCalcColumns failed:', e);
    }
  });
}

function clearHeroOptions(id) {
  const select = document.getElementById(id);
  const { length } = select.options;
  for (let i = length - 1; i >= 0; i -= 1) {
    select.options[i] = null;
  }
}

import tinygradient from 'tinygradient';
import colorPicker from '../../6. Shared/4. UI/1. Components/colorPicker';

const lightGradient = {
  gradient: tinygradient([
    { color: '#F5A191', pos: 0 }, // red
    { color: '#ffffe5', pos: 0.4 },
    { color: '#77e246', pos: 1 }, // green
  ]),
};

const darkGradient = colorPicker.getColors();

let gradient = lightGradient;

function columnGradientProvider(index) {
  function columnGradient(params) {
    try {
      if (params?.value === undefined) return null;
      const { colId } = params.column;
      const { value } = params;

      const agg = multiOptimizerHeroes[index].currentAggregate[colId];
      if (!agg) return null;

      let percent =
        agg.max === agg.min ? 1 : (value - agg.min) / (agg.max - agg.min);
      percent = Math.min(1, Math.max(0, percent));

      let color = gradient.gradient.rgbAt(percent);
      if (agg.min === 0 && agg.max === 0) {
        color = gradient.gradient.rgbAt(0.5);
      }

      return {
        backgroundColor: color.toHexString(),
      };
    } catch (e) {
      Log.error(e);
      return null;
    }
  }

  return columnGradient;
}

function aggregateCurrentHeroStats(heroStats, index) {
  const { currentAggregate } = multiOptimizerHeroes[index];
  const statsToAggregate = [
    'atk',
    'hp',
    'def',
    'spd',
    'cr',
    'cd',
    'eff',
    'res',
    'dac',
    'cp',
    'hpps',
    'ehp',
    'ehpps',
    'dmg',
    'dmgps',
    'mcdmg',
    'mcdmgps',
    'dmgh',
    'dmgd',
    's1',
    's2',
    's3',
    'score',
    'bs',
    'priority',
    'buildScore',
    // Derived display columns — stamped by OptimizerGrid.decorateCalcFields().
    'finalSpeed',
    'spdEff',
  ];

  const count = heroStats.length;

  statsToAggregate.forEach((stat) => {
    const arrSum = (arr) => arr.reduce((a, b) => a + b[stat], 0);
    const vals = getField(heroStats, stat);
    // Avoid Math.max/min(...spread): with cacheBlockSize 500 the arg list can overflow the call
    // stack (the single optimizer was already fixed this way). reduce() is O(n) and stack-safe.
    // Empty block → 0 (not -Infinity/NaN) so the heatmap gradient stays well-defined.
    let max = vals.length
      ? vals.reduce((a, b) => (b > a ? b : a), -Infinity)
      : 0;
    let min = vals.length
      ? vals.reduce((a, b) => (b < a ? b : a), Infinity)
      : 0;
    const sum = arrSum(heroStats);
    const avg = count > 0 ? sum / count : 0;

    if (stat === 'cr') {
      max = Math.min(100, max);
      min = Math.min(100, min);
    }
    // No hard CD cap — heroes with cdCapBonus can legitimately exceed 350

    currentAggregate[stat] = {
      max: cleanInfinities(max),
      min: cleanInfinities(min),
      sum: cleanInfinities(sum),
      avg: cleanInfinities(avg),
    };
  });
}

function getDataSource(index, grid) {
  // Coalesce concurrent getRows calls for the SAME block+sort+execution into one backend
  // request — AG-Grid's infinite model can re-fire a block on rapid refresh/sort. Every
  // queued params still receives its success/fail callback (AG-Grid's contract), and the
  // executionId in the key pins the underlying result set so a coalesced caller can never
  // get stale data. Map is per data source (i.e. per hero card).
  const _inFlight = new Map();

  return {
    async getRows(params) {
      const { startRow } = params;
      const { endRow } = params;
      const sortColumn = params.sortModel.length
        ? params.sortModel[0].colId
        : null;
      const sortOrder = params.sortModel.length
        ? params.sortModel[0].sort
        : null;

      grid.gridOptions.api.setGridOption('loading', true);

      const { executionId } = multiOptimizerHeroes[index];
      // Backend SpdEff sort uses the same weight as the displayed column.
      const spdEffWeight = globalThis.OptimizerGrid?.getSpdEffWeight?.() ?? 0.5;
      const key = `${startRow}|${endRow}|${sortColumn}|${sortOrder}|${spdEffWeight}|${executionId}`;

      // An identical request is already in flight — queue this params and let that
      // response fulfill it too, rather than firing a duplicate backend call.
      const queued = _inFlight.get(key);
      if (queued) {
        queued.push(params);
        return;
      }
      _inFlight.set(key, [params]);

      const heroId = document.getElementById('inputHeroAdd').value;
      const optimizationRequest = OptimizerTab.getOptimizationRequestParams();
      optimizationRequest.heroId = heroId;

      const request = {
        startRow,
        endRow,
        sortColumn,
        sortOrder,
        spdEffWeight,
        optimizationRequest,
        executionId,
      };

      Api.getResultRows(request)
        .then((resultRowsResponse) => {
          const waiters = _inFlight.get(key) || [];
          _inFlight.delete(key);

          globalThis.OptimizerGrid?.decorateCalcFields?.(
            resultRowsResponse.heroStats,
            multiOptimizerHeroes[index]?.hero?.crPush,
          );
          aggregateCurrentHeroStats(resultRowsResponse.heroStats, index);
          grid.gridOptions.api.setGridOption('loading', false);

          const pinned = grid.gridOptions.api.getPinnedTopRow(0);
          if (pinned) {
            grid.gridOptions.api.setGridOption('pinnedTopRowData', [
              pinned.data,
            ]);
          }

          waiters.forEach((p) =>
            p.successCallback(
              resultRowsResponse.heroStats,
              resultRowsResponse.maximum,
            ),
          );
          return resultRowsResponse;
        })
        .catch((err) => {
          // Always exit the loading state and tell AG-Grid the block(s) failed; otherwise a
          // backend error leaves this hero's grid spinning forever (single optimizer fixed
          // the same way).
          Log.error('[multiOptimizer getRows] failed', err);
          const waiters = _inFlight.get(key) || [];
          _inFlight.delete(key);
          grid.gridOptions.api.setGridOption('loading', false);
          waiters.forEach((p) => p.failCallback());
        });
    },
  };
}

function getField(heroStats, stat) {
  return heroStats.map((x) => x[stat]);
}
function cleanInfinities(num) {
  if (num === -Infinity || num === Infinity) {
    return 0;
  }
  return num;
}

function redrawHeroImage(index) {
  const name = $(
    `#addMultiOptimizerHeroesSelector${index} option:selected`,
  ).attr('label');
  if (!name || name.length === 0) {
    $(`#multiInputHeroImage${index}`).attr('src', Assets.getBlank());
    return;
  }

  const data = HeroData.getHeroExtraInfo(name.replace(/\s#\d+$/, ''));
  if (!data) return;
  const image = data.assets.thumbnail;

  $(`#multiInputHeroImage${index}`).attr('src', image);
}

function drawMultiPreview(gearIds, mods, index) {
  Log.debug('Draw preview', gearIds, mods);

  if (gearIds.length === 0) {
    document.getElementById(
      `multi-optimizer-heroes-equipped-weapon${index}`,
    ).innerHTML = HtmlGenerator.buildItemPanel(null, 'multOptimizerGrid', null);
    document.getElementById(
      `multi-optimizer-heroes-equipped-helmet${index}`,
    ).innerHTML = HtmlGenerator.buildItemPanel(null, 'multOptimizerGrid', null);
    document.getElementById(
      `multi-optimizer-heroes-equipped-armor${index}`,
    ).innerHTML = HtmlGenerator.buildItemPanel(null, 'multOptimizerGrid', null);
    document.getElementById(
      `multi-optimizer-heroes-equipped-necklace${index}`,
    ).innerHTML = HtmlGenerator.buildItemPanel(null, 'multOptimizerGrid', null);
    document.getElementById(
      `multi-optimizer-heroes-equipped-ring${index}`,
    ).innerHTML = HtmlGenerator.buildItemPanel(null, 'multOptimizerGrid', null);
    document.getElementById(
      `multi-optimizer-heroes-equipped-boots${index}`,
    ).innerHTML = HtmlGenerator.buildItemPanel(null, 'multOptimizerGrid', null);
    return;
  }

  const moddedGear = ModificationFilter.getModsByIds(gearIds, mods, index);
  Log.debug('Modded gear results', moddedGear);

  Api.getItemsByIds(gearIds)
    .then(async (response) => {
      const selectedGear = response.items;

      if (!multiOptimizerHeroes[index]?.hero) {
        return null;
      }

      const heroId = multiOptimizerHeroes[index].hero.id;

      const getHeroByIdResponse = await Api.getHeroById(heroId, true);
      const { hero } = getHeroByIdResponse;
      const { baseStats } = getHeroByIdResponse;

      if (!hero || !baseStats) return null;

      for (let i = 0; i < 6; i += 1) {
        if (moddedGear[i]) {
          const { equippedById } = selectedGear[i];
          const { equippedByName } = selectedGear[i];

          selectedGear[i] = moddedGear[i];
          selectedGear[i].equippedById = equippedById;
          selectedGear[i].equippedByName = equippedByName;
          selectedGear[i].substats = moddedGear[i].substats;
          for (let j = 0; j < selectedGear[i].substats.length; j += 1) {
            selectedGear[i].substats[j].modified =
              moddedGear[i].substats[j].modified;
            selectedGear[i].substats[j].value = moddedGear[i].substats[j].value;
            selectedGear[i].substats[j].reforgedValue =
              moddedGear[i].substats[j].reforgedValue;
            selectedGear[i].substats[j].reforged = true;
          }
        }
      }

      document.getElementById(
        `multi-optimizer-heroes-equipped-weapon${index}`,
      ).innerHTML = HtmlGenerator.buildItemPanel(
        selectedGear[0],
        'multOptimizerGrid',
        baseStats,
      );
      document.getElementById(
        `multi-optimizer-heroes-equipped-helmet${index}`,
      ).innerHTML = HtmlGenerator.buildItemPanel(
        selectedGear[1],
        'multOptimizerGrid',
        baseStats,
      );
      document.getElementById(
        `multi-optimizer-heroes-equipped-armor${index}`,
      ).innerHTML = HtmlGenerator.buildItemPanel(
        selectedGear[2],
        'multOptimizerGrid',
        baseStats,
      );
      document.getElementById(
        `multi-optimizer-heroes-equipped-necklace${index}`,
      ).innerHTML = HtmlGenerator.buildItemPanel(
        selectedGear[3],
        'multOptimizerGrid',
        baseStats,
      );
      document.getElementById(
        `multi-optimizer-heroes-equipped-ring${index}`,
      ).innerHTML = HtmlGenerator.buildItemPanel(
        selectedGear[4],
        'multOptimizerGrid',
        baseStats,
      );
      document.getElementById(
        `multi-optimizer-heroes-equipped-boots${index}`,
      ).innerHTML = HtmlGenerator.buildItemPanel(
        selectedGear[5],
        'multOptimizerGrid',
        baseStats,
      );
      return selectedGear;
    })
    .catch(Log.error);
}

async function filterMultiGridItems(index) {
  const heroesToFilter = multiOptimizerHeroes.filter(
    (multiHero) => multiHero?.hero && multiHero.index !== index,
  );

  const filterPromises = heroesToFilter.map(async (multiHero) => {
    const { grid } = multiHero;
    const filteredGearIds = getSelectedGearIds(grid);

    const allFilteredItems = multiOptimizerHeroes
      .filter(
        // Exclude THIS hero's own selected gear from the cross-hero exclusion set. The id lives
        // at multiHero.hero.id (entries have no top-level .id), so the old `multiHero.id` was
        // always undefined and never actually excluded self.
        (otherHero) =>
          otherHero?.hero && otherHero.hero.id !== multiHero.hero.id,
      )
      .reduce(
        (acc, otherHero) => acc.concat(getSelectedGearIds(otherHero.grid)),
        [],
      );

    const difference = allFilteredItems.filter(
      (x) => !filteredGearIds.includes(x),
    );

    const heroResponse = await Api.getHeroById(multiHero.hero.id);
    const request = heroResponse.hero.optimizationRequest;

    if (request) {
      request.executionId = multiHero.executionId;
      request.excludedGearIds = difference;

      const response = await Api.submitOptimizationFilterRequest(request);
      Log.debug('Optimization filter response', response);

      multiHero.grid.gridOptions.api.refreshInfiniteCache();
    }
    return multiHero;
  });

  await Promise.all(filterPromises);
  ensureSelectedRowVisible();
}

function ensureSelectedRowVisible() {
  multiOptimizerHeroes.forEach((multiHero) => {
    if (!multiHero?.grid) return;

    const selectedNodes = multiHero.grid.gridOptions.api.getSelectedNodes();
    if (selectedNodes.length > 0) {
      multiHero.grid.gridOptions.api.ensureNodeVisible(selectedNodes[0]);
    }
  });
}

function provideOnRowSelected(grid, index) {
  function onRowSelected(event) {
    Log.debug('row selected', event);
    if (!event.node.isSelected() || event.rowPinned === 'top') return;

    const gearIds = getSelectedGearIds(grid);
    const mods = getSelectedGearMods(grid);
    drawMultiPreview(gearIds, mods, index);

    multiOptimizerHeroes[index].selectedItems = gearIds;
    filterMultiGridItems(index);

    togglePanelSelect(index, true);
  }

  return onRowSelected;
}

function getSelectedGearIds(grid) {
  const selectedRows = grid.gridOptions.api.getSelectedRows();
  if (selectedRows.length > 0) {
    const row = selectedRows[0];
    Log.debug('getSelectedGearIds SELECTED ROW', row);

    return [
      row.items[0],
      row.items[1],
      row.items[2],
      row.items[3],
      row.items[4],
      row.items[5],
    ];
  }
  return [];
}

function getSelectedGearMods(grid) {
  const selectedRows = grid.gridOptions.api.getSelectedRows();
  if (selectedRows.length > 0) {
    const row = selectedRows[0];
    Log.debug('getSelectedGearModIds SELECTED ROW', row);

    return [
      row.mods[0],
      row.mods[1],
      row.mods[2],
      row.mods[3],
      row.mods[4],
      row.mods[5],
    ];
  }
  return [];
}

async function handleStartOptimizationRequest(
  index,
  callback,
  skipInProgressCheck = false,
) {
  Log.debug(`Start request @ index: ${index}`);

  if (!multiOptimizerHeroes[index]?.hero) {
    if (callback) callback('OK');
    return;
  }
  if (index >= multiOptimizerHeroes.length) {
    return;
  }

  const inProgressResponse = await Api.getOptimizationInProgress();
  if (!skipInProgressCheck && inProgressResponse.inProgress) {
    Notifier.warn(
      'Optimization already in progress. Please cancel before starting a new search.',
    );
    return;
  }

  const heroResponse = await Api.getHeroById(
    multiOptimizerHeroes[index].hero.id,
    true,
  );
  const allItemsResponse = await Api.getAllItems();
  const { hero } = heroResponse;
  const { baseStats } = heroResponse;

  const allowedHeroIds = [];

  multiOptimizerHeroes
    .filter((multiHero) => multiHero?.hero)
    .forEach((multiHero) => {
      allowedHeroIds.push(multiHero.hero.id);
    });

  if (!hero.optimizationRequest) {
    Dialog.error(
      `${hero.name} does not have filters saved. Please set your filters or run a regular optimization first.`,
    );
    return;
  }

  const params = hero.optimizationRequest;
  params.excludeFilter = Settings.getExcludeSelects();

  const gearMainFilters = [
    params.inputNecklaceStat,
    params.inputRingStat,
    params.inputBootsStat,
  ];

  let filterResult;
  try {
    filterResult = await OptimizerTab.applyItemFilters(
      params,
      heroResponse,
      allItemsResponse,
      true,
      allowedHeroIds,
      gearMainFilters,
      index,
    );
  } catch (e) {
    Log.warn('[multiOptimizer] aborted by validation:', e.message);
    return;
  }

  if (!hero.artifactName || hero.artifactName === 'None') {
    Notifier.warn(
      "Your hero does not have an artifact equipped, use the 'Add Bonus Stats' button on the Heroes page to add artifact stats",
    );
  }

  const request = {
    base: baseStats,
    requestType: 'OptimizationRequest',
    items: filterResult.items,
    bonusHp: hero.bonusHp,
    bonusAtk: hero.bonusAtk,
    hero,
  };

  const mergedRequest = Object.assign(request, params, baseStats);

  // Recalc permutations
  const { items } = filterResult;

  const weapons = items.filter((x) => x.gear === 'Weapon');
  const helmets = items.filter((x) => x.gear === 'Helmet');
  const armors = items.filter((x) => x.gear === 'Armor');
  const necklaces = items.filter((x) => x.gear === 'Necklace');
  const rings = items.filter((x) => x.gear === 'Ring');
  const boots = items.filter((x) => x.gear === 'Boots');

  permutations =
    weapons.length *
    helmets.length *
    armors.length *
    necklaces.length *
    rings.length *
    boots.length;

  $(`#summaryPanel1-${index}`).text(
    `${i18next.t('Permutations')}: ${Number(permutations).toLocaleString()}`,
  );

  if (OptimizerTab.warnParams(params, permutations)) {
    return;
  }

  Log.debug('Sending request:', mergedRequest);

  if (multiOptimizerHeroes[index]?.progressTimer) {
    clearInterval(multiOptimizerHeroes[index].progressTimer);
  }
  // Also clear the old module-level timer for single-optimizer compat
  if (progressTimer) {
    clearInterval(progressTimer);
  }

  const oldExecutionId = multiOptimizerHeroes[index].executionId;
  await Api.deleteExecution(oldExecutionId);

  const newExecutionId = await Api.prepareExecution();
  mergedRequest.executionId = newExecutionId;
  multiOptimizerHeroes[index].executionId = newExecutionId;

  function updateProgress() {
    Api.getExecutionProgress(newExecutionId)
      .then((result) => {
        const searchedCount = result.searched;
        const resultsCounter = result.results;

        const searchedStr = Number(searchedCount).toLocaleString();
        const resultsStr = Number(resultsCounter).toLocaleString();

        $(`#summaryPanel2-${index}`).text(
          `${i18next.t('Searched')}: ${searchedStr}`,
        );
        $(`#summaryPanel3-${index}`).text(
          `${i18next.t('Results')}: ${resultsStr}`,
        );
        return result;
      })
      .catch(Log.error);
  }

  const slotTimer = setInterval(updateProgress, 400);
  if (multiOptimizerHeroes[index]) {
    multiOptimizerHeroes[index].progressTimer = slotTimer;
  }
  progressTimer = slotTimer;

  setPinnedHero(index, hero);
  const _javaRequest = Object.assign({}, mergedRequest);
  [
    'inputAtkPriority',
    'inputHpPriority',
    'inputDefPriority',
    'inputSpdPriority',
    'inputCrPriority',
    'inputCdPriority',
    'inputEffPriority',
    'inputResPriority',
  ].forEach((k) => {
    if (_javaRequest[k] != null) _javaRequest[k] = Math.round(_javaRequest[k]);
  });
  Api.submitOptimizationRequest(_javaRequest)
    .then((result) => {
      Log.debug('RESPONSE RECEIVED', result);
      if (multiOptimizerHeroes[index]?.progressTimer) {
        clearInterval(multiOptimizerHeroes[index].progressTimer);
        multiOptimizerHeroes[index].progressTimer = null;
      }
      clearInterval(progressTimer);

      const searchedCount = result.searched;
      const resultsCounter = result.results;

      const searchedStr = Number(searchedCount).toLocaleString();
      const resultsStr = Number(resultsCounter).toLocaleString();

      const maxResults = Number.parseInt(
        Settings.parseNumberValue('settingMaxResults') || 0,
        10,
      );
      if (result.results >= maxResults) {
        Dialog.info(
          'Search terminated after the result limit was exceeded, the full results are not shown. Please apply more filters to narrow your search.',
        );
      } else {
        $(`#summaryPanel1-${index}`).text(
          `${i18next.t('Permutations')}: ${searchedStr}`,
        );
      }

      $(`#summaryPanel2-${index}`).text(
        `${i18next.t('Searched')}: ${searchedStr}`,
      );
      $(`#summaryPanel3-${index}`).text(
        `${i18next.t('Results')}: ${resultsStr}`,
      );
      const { grid } = multiOptimizerHeroes[index];
      // ag-grid v35 removed gridApi.setDatasource(); use the generic option setter.
      grid.gridOptions.api.setGridOption(
        'datasource',
        getDataSource(index, grid),
      );
      if (callback) callback('OK');
      return result;
    })
    .catch(Log.error);
}

function getDefaultParams() {
  return {
    inputSets: [[], [], []],
    inputExcludeSet: [],
    excludeFilter: [],
    inputSetsOne: [],
    inputSetsTwo: [],
    inputSetsThree: [],
    inputNecklaceStat: [],
    inputRingStat: [],
    inputBootsStat: [],
    inputPredictReforges: true,
    inputUsePvECritDamageCap: false,
    inputAllowEquippedItems: true,
    inputAllowLockedItems: true,
    inputOrderedHeroPriority: true,
    inputAtkPriority: 0,
    inputHpPriority: 0,
    inputDefPriority: 0,
    inputSpdPriority: 0,
    inputCrPriority: 0,
    inputCdPriority: 0,
    inputResPriority: 0,
    inputFilterPriority: 100,
  };
}

function togglePanelSelect(index, on) {
  if (on) {
    $(`#multiInfoPanel${index}`).css(
      'background-color',
      'var(--outline-color)',
    );
  } else {
    $(`#multiInfoPanel${index}`).css('background-color', '');
  }
}

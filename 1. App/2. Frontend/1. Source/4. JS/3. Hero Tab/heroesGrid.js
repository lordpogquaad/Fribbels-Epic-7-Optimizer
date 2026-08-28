/* global i18next, AG_GRID_LOCALE_ZH, AG_GRID_LOCALE_ZH_TW, AG_GRID_LOCALE_FR, AG_GRID_LOCALE_JA, AG_GRID_LOCALE_KO, AG_GRID_LOCALE_RU, AG_GRID_LOCALE_EN */
/* global Api, HeroesTab, HeroesGrid, Assets, Constants, HtmlGenerator, HeroData, GridRenderer, $ */
import tinygradient from 'tinygradient';
import colorPicker from '../6. Shared/4. UI/1. Components/colorPicker';

// Diagnostic logging uses the central Log utility (Log.debug, gated by window.__optDebug; see 5. Dev Only/LogControl.js).

const lightGradient = {
  gradient: tinygradient([
    { color: '#F5A191', pos: 0 }, // red
    { color: '#ffffe5', pos: 0.5 },
    { color: '#77e246', pos: 1 }, // green
  ]),
};

const darkGradient = colorPicker.getColors();

let gradient = lightGradient;

let heroesGrid = globalThis.heroesGrid || null;
let buildsGrid = globalThis.buildsGrid || null;
let currentHeroes = [];
// Build Planner: when on, low-pick-rate heroes sink to the bottom of the grid (via
// postSortRows) while the active column sort is preserved within the high/low groups.
let _separateLowPick = false;
let selectedBuildNode = null;

const currentAggregate = {};
const heroesAggregate = {};

export function toggleDarkMode(enabled) {
  if (enabled) {
    gradient = darkGradient;
  } else {
    gradient = lightGradient;
  }

  // The grid may not exist yet — dark mode can be applied during startup (Settings
  // loadSettings) before the grids are built. Nothing to redraw then; a freshly-built
  // grid paints with the current theme (dark mode is global CSS). Optional-chain so
  // this is a no-op until the grid is initialized.
  heroesGrid?.gridOptions?.api?.redrawRows();
}

export const initialize = () => {
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
  buildGrid(localeText);
};

export const resetSort = () => {
  heroesGrid.gridOptions.api.resetColumnState();
};

export const refresh = async (heroes, id) => {
  let heroList = heroes;
  if (!heroList) {
    const response = await Api.getAllHeroes();
    heroList = response.heroes;
  }
  const selectedNode = heroesGrid.gridOptions.api.getSelectedNodes()[0];

  heroList.forEach((element) => {
    element.label = i18next.t(element.name);
  });
  currentHeroes = heroList;
  updateHeroesAggregate(heroList);
  heroesGrid.gridOptions.api.setGridOption('rowData', heroList);
  heroesGrid.gridOptions.api.redrawRows();

  if (!selectedNode && !id) {
    return;
  }

  heroesGrid.gridOptions.api.forEachNode((node) => {
    if (id) {
      if (node.data.id === id) {
        node.setSelected(true, false);
        heroesGrid.gridOptions.api.ensureNodeVisible(node);
      }
    } else if (node.data.id === selectedNode.data.id) {
      node.setSelected(true, false);
    }
  });
};

export const refreshHeroesGrid = () => {
  const selectedNode = heroesGrid.gridOptions.api.getSelectedNodes()[0];
  heroesGrid.gridOptions.api.refreshCells();

  heroesGrid.gridOptions.api.forEachNode((node) => {
    if (node.data.id === selectedNode.data.id) {
      node.setSelected(true, false);
    }
  });
};

export const refreshBuilds = async (response) => {
  const selectedRow = getSelectedRow();
  if (!selectedRow) return;

  let hero;
  if (response) {
    hero = response.hero;
  } else {
    const useReforgedStats = HeroesTab.getUseReforgedStats();
    hero = (await Api.getHeroById(selectedRow.id, useReforgedStats)).hero;
  }

  updateCurrentAggregate(hero);
  Log.debug('Refresh build selected hero row', hero);
  buildsGrid.gridOptions.api.setGridOption(
    'rowData',
    hero.builds === null ? [] : hero.builds,
  );

  const getMaybeSelectedRows = buildsGrid.gridOptions.api.getSelectedNodes()[0];
  if (getMaybeSelectedRows) {
    selectedBuildNode = getMaybeSelectedRows;
  }

  if (!selectedBuildNode) {
    return;
  }

  buildsGrid.gridOptions.api.forEachNode((node) => {
    if (
      JSON.stringify(node.data.items) ===
      JSON.stringify(selectedBuildNode.data.items)
    ) {
      node.setSelected(true, false);
    }
  });
};

export const getSelectedRow = () => {
  const selectedRows = heroesGrid.gridOptions.api.getSelectedRows();
  if (selectedRows.length > 0) {
    const row = selectedRows[0];
    Log.debug('SELECTED ROW', row);
    return row;
  }
  return null;
};

export const getSelectedBuildRow = () => {
  const selectedRows = buildsGrid.gridOptions.api.getSelectedRows();
  if (selectedRows.length > 0) {
    const row = selectedRows[0];
    Log.debug('SELECTED ROW', row);
    return row;
  }
  return null;
};

export const refreshFilters = (filters) => {
  // Clear AG Grid column filters — class/element/name are handled by the external filter
  heroesGrid.gridOptions.api.setColumnFilterModel('role', null);
  heroesGrid.gridOptions.api.setColumnFilterModel('attribute', null);
  heroesGrid.gridOptions.api.onFilterChanged();
};

export const scrollToHero = (heroLabel, heroIndex) => {
  heroesGrid.gridOptions.api.forEachNode((node) => {
    if (
      (node.data.label === heroLabel || node.data.name === heroLabel) &&
      node.data.index === heroIndex
    ) {
      node.setSelected(true, true);
      heroesGrid.gridOptions.api.ensureNodeVisible(node);
    }
  });
};

export const redrawPreview = async () => {
  const heroRow = getSelectedRow();
  const buildRow = getSelectedBuildRow();
  if (buildRow) {
    const itemIds = buildRow.items;

    const itemsResponse = await Api.getItemsByIds(itemIds);
    const { items } = itemsResponse;

    const useReforgeStats = HeroesTab.getUseReforgedStats();
    const heroResponse = await Api.getHeroById(heroRow.id, useReforgeStats);
    const { baseStats } = heroResponse;

    for (let i = 0; i < 6; i += 1) {
      const item = items[i];

      const displayId = Constants.gearDisplayIdByIndex[i];
      const html = HtmlGenerator.buildItemPanel(item, 'heroesGrid', baseStats);
      document.getElementById(displayId).innerHTML = html;
    }
    return;
  }

  if (heroRow) {
    redrawPreviewHero(heroRow.id);
  }
};

function buildGrid(localeText) {
  const DIGITS_2 = 40;
  const DIGITS_3 = 40;
  const DIGITS_4 = 44;
  const DIGITS_5 = 48;
  const DIGITS_6 = 55;

  const gridOptions = {
    defaultColDef: {
      width: 47,
      sortable: true,
      sortingOrder: ['desc', 'asc', null],
      cellDataType: false,
      cellStyle: heroColumnGradient,
    },

    columnDefs: [
      {
        headerName: i18next.t('rank'),
        sortable: false,
        width: 60,
        field: 'index',
        rowDrag: true,
        rowDragText: (params) => {
          Log.debug(params);
          return params.rowNode.data.name;
        },
      },
      {
        headerName: i18next.t('icon'),
        sortable: false,
        field: 'name',
        width: 60,
        cellRenderer: (params) => renderIcon(params.value),
      },
      {
        headerName: i18next.t('elem'),
        field: 'attribute',
        width: 45,
        filter: 'agTextColumnFilter',
        cellRenderer: (params) => renderElement(params.value),
      },
      {
        headerName: i18next.t('class'),
        field: 'role',
        width: 50,
        filter: 'agTextColumnFilter',
        cellRenderer: (params) => renderClass(params.value),
      },
      // {headerName: i18next.t('name'), field: 'name', width: 0, wrapText: true, cellStyle: {'display':'none'}},
      {
        headerName: i18next.t('name'),
        field: 'label',
        width: 155,
        wrapText: true,
        sortingOrder: ['asc', 'desc', null],
        cellStyle: {
          'white-space': 'normal !important',
          'line-height': '16px',
        },
        cellRenderer: (params) => renderName(params),
      },
      // {headerName: i18next.t('Stars'), field: 'rarity', width: 50},
      // {headerName: i18next.t('Class'), field: 'role', width: 100, cellRenderer: (params) => renderClass(params.value)},
      {
        headerName: i18next.t('sets'),
        field: 'equipment',
        width: 85,
        cellRenderer: (params) => renderSets(params.value),
      },
      {
        headerName: 'Tier',
        colId: 'speedTier',
        width: 72,
        // Sort numerically by target speed (fastest first); display the band label.
        valueGetter: (params) => (params.data ? params.data.targetSpeed || 0 : null),
        valueFormatter: (params) => speedTierLabel(params.value),
        headerTooltip:
          'Speed tier band derived from Target Speed (Top ≥300, High 280–299, Med-High 250–279, Med 220–249, Med-Low 180–219, Low 150–179, Base 100–149). Sorts by target speed.',
      },
      {
        headerName: 'Tgt Spd',
        colId: 'targetSpeed',
        field: 'targetSpeed',
        width: DIGITS_4,
        cellRenderer: (params) => renderTargetSpeedInput(params),
        headerTooltip:
          'Target Speed — type a per-hero planning value directly in the cell; it saves automatically. Sort this column descending to rank your roster fastest-first. Not calculated.',
      },
      { headerName: i18next.t('atk'), field: 'atk', width: DIGITS_4 },
      { headerName: i18next.t('def'), field: 'def', width: DIGITS_4 },
      { headerName: i18next.t('hp'), field: 'hp', width: DIGITS_5 },
      { headerName: i18next.t('spd'), field: 'spd', width: DIGITS_3 },
      {
        headerName: 'pSpd',
        colId: 'pSpd',
        field: 'pSpd',
        width: DIGITS_4,
        valueGetter: (params) => (params.data ? heroPSpd(params.data) : null),
        headerTooltip:
          "Push Speed = Speed / (1 - CR Push%). Effective speed after this hero's combat-readiness push (set CR Push % in Bonus stats).",
      },
      { headerName: i18next.t('cr'), field: 'cr', width: DIGITS_3 },
      { headerName: i18next.t('cd'), field: 'cd', width: DIGITS_3 },
      { headerName: i18next.t('eff'), field: 'eff', width: DIGITS_3 },
      { headerName: i18next.t('res'), field: 'res', width: DIGITS_3 },
      { headerName: i18next.t('cp'), field: 'cp', width: DIGITS_6 },
      { headerName: i18next.t('hps'), field: 'hpps', width: DIGITS_4 },
      { headerName: i18next.t('ehp'), field: 'ehp', width: DIGITS_6 },
      { headerName: i18next.t('ehps'), field: 'ehpps', width: DIGITS_5 },
      { headerName: i18next.t('dmg'), field: 'dmg', width: DIGITS_5 },
      { headerName: i18next.t('dmgs'), field: 'dmgps', width: DIGITS_4 },
      {
        headerName: i18next.t('mcd'),
        field: 'mcdmg',
        width: DIGITS_3,
      },
      {
        headerName: i18next.t('mcds'),
        field: 'mcdmgps',
        width: DIGITS_4,
      },
      {
        headerName: i18next.t('dmgh'),
        field: 'dmgh',
        width: DIGITS_5,
      },
      {
        headerName: i18next.t('dmgd'),
        field: 'dmgd',
        width: DIGITS_5,
      },
      { headerName: i18next.t('hmcdmgs'), field: 'hmcdmgs', width: DIGITS_4 },
      { headerName: i18next.t('dmcdmgs'), field: 'dmcdmgs', width: DIGITS_4 },
      { headerName: i18next.t('hdmg'), field: 'hdmg', width: DIGITS_4 },
      { headerName: i18next.t('hdmgs'), field: 'hdmgs', width: DIGITS_4 },
      { headerName: i18next.t('ddmg'), field: 'ddmg', width: DIGITS_4 },
      { headerName: i18next.t('ddmgs'), field: 'ddmgs', width: DIGITS_4 },
      { headerName: i18next.t('s1'), field: 's1', width: DIGITS_4 },
      { headerName: i18next.t('s2'), field: 's2', width: DIGITS_4 },
      { headerName: i18next.t('s3'), field: 's3', width: DIGITS_4 },
      {
        headerName: i18next.t('gs'),
        field: 'score',
        width: DIGITS_3,
      },
      { headerName: i18next.t('bs'), field: 'bs', width: DIGITS_3 },
      {
        headerName: i18next.t('upg'),
        field: 'upgrades',
        width: DIGITS_2,
      },
      {
        headerName: 'Usage',
        colId: 'usageRate',
        field: 'usageRate',
        width: DIGITS_4,
        cellRenderer: (params) => renderUsageInput(params),
        headerTooltip:
          'Manual usage % (0–100) for reference. Type directly in the cell; saved automatically. Not calculated.',
      },
      {
        headerName: 'LowPk',
        colId: 'lowPickRate',
        field: 'lowPickRate',
        width: DIGITS_3,
        cellRenderer: (params) => renderLowPickCheckbox(params),
        headerTooltip:
          'Low pick-rate / power-crept flag. Turn on the "Separate low pick-rate" toggle above the grid to sink flagged heroes to the bottom while keeping your speed sort within each group.',
      },
    ],
    rowSelection: { mode: 'singleRow', enableClickSelection: true },
    rowData: [],
    suppressScrollOnNewData: true,
    rowHeight: 45,
    pagination: true,
    paginationPageSize: 100000,
    paginationPageSizeSelector: false,
    localeText,
    onRowSelected: onHeroRowSelected,
    onRowClicked: onHeroRowClick,
    onRowDragEnter,
    onRowDragEnd,
    onRowDragMove,
    onRowDragLeave,
    onSortChanged,
    onFilterChanged,
    // Build Planner: sink low-pick-rate heroes below the rest, keeping the active column
    // sort order within the high and low groups.  No-op unless the separate toggle is on.
    postSortRows: (params) => {
      if (!_separateLowPick) return;
      const { nodes } = params;
      const high = [];
      const low = [];
      for (let i = 0; i < nodes.length; i += 1) {
        const n = nodes[i];
        if (n.data && n.data.lowPickRate) low.push(n);
        else high.push(n);
      }
      const merged = high.concat(low);
      for (let i = 0; i < merged.length; i += 1) nodes[i] = merged[i];
    },
    isExternalFilterPresent: HeroesTab.isExternalFilterPresent,
    doesExternalFilterPass: HeroesTab.doesExternalFilterPass,
    suppressMoveWhenRowDragging: true,
    onRowDoubleClicked,
    suppressCellFocus: true,
    animateRows: true,
    suppressDragLeaveHidesColumns: true,
    getRowId: (params) => {
      return params.data.id;
    },
    navigateToNextCell: GridRenderer.arrowKeyNavigator(this, 'heroesGrid'),
  };

  const buildsGridOptions = {
    defaultColDef: {
      width: 45,
      sortable: true,
      sortingOrder: ['desc', 'asc'],
      cellDataType: false,
      cellStyle: columnGradient,
      cellClass: 'no-border',
    },
    columnDefs: [
      {
        headerName: i18next.t('name'),
        field: 'name',
        sortingOrder: ['asc', 'desc', null],
        width: 150,
      },
      {
        headerName: i18next.t('sets'),
        field: 'sets',
        width: 100,
        cellRenderer: (params) => GridRenderer.renderSets(params.value),
      },
      { headerName: i18next.t('atk'), field: 'atk' },
      { headerName: i18next.t('def'), field: 'def' },
      { headerName: i18next.t('hp'), field: 'hp', width: 55 },
      { headerName: i18next.t('spd'), field: 'spd', width: 40 },
      { headerName: i18next.t('cr'), field: 'cr', width: 40 },
      { headerName: i18next.t('cd'), field: 'cd', width: 40 },
      { headerName: i18next.t('eff'), field: 'eff', width: 40 },
      { headerName: i18next.t('res'), field: 'res', width: 40 },
      // {headerName: i18next.t('dac'), field: 'dac'},
      { headerName: i18next.t('cp'), field: 'cp', width: 50 },
      { headerName: i18next.t('hps'), field: 'hpps', width: 45 },
      { headerName: i18next.t('ehp'), field: 'ehp', width: 55 },
      { headerName: i18next.t('ehps'), field: 'ehpps', width: 45 },
      { headerName: i18next.t('dmg'), field: 'dmg', width: 50 },
      { headerName: i18next.t('dmgs'), field: 'dmgps', width: 45 },
      { headerName: i18next.t('mcd'), field: 'mcdmg', width: 50 },
      { headerName: i18next.t('mcds'), field: 'mcdmgps', width: 45 },
      { headerName: i18next.t('dmgh'), field: 'dmgh', width: 45 },
      { headerName: i18next.t('dmgd'), field: 'dmgd', width: 45 },
      { headerName: i18next.t('hmcdmgs'), field: 'hmcdmgs', width: 45 },
      { headerName: i18next.t('dmcdmgs'), field: 'dmcdmgs', width: 45 },
      { headerName: i18next.t('hdmg'), field: 'hdmg', width: 45 },
      { headerName: i18next.t('hdmgs'), field: 'hdmgs', width: 45 },
      { headerName: i18next.t('ddmg'), field: 'ddmg', width: 45 },
      { headerName: i18next.t('ddmgs'), field: 'ddmgs', width: 45 },
      { headerName: i18next.t('s1'), field: 's1', width: 50 },
      { headerName: i18next.t('s2'), field: 's2', width: 50 },
      { headerName: i18next.t('s3'), field: 's3', width: 50 },
      { headerName: i18next.t('gs'), field: 'score', width: 40 },
      { headerName: i18next.t('bs'), field: 'bs', width: 40 },
      { headerName: i18next.t('upg'), field: 'upgrades', width: 35 },
    ],
    rowHeight: 27,
    rowSelection: { mode: 'singleRow', enableClickSelection: true },
    onRowSelected: onBuildRowSelected,
    suppressScrollOnNewData: true,
    localeText,
    rowData: [],
    suppressPaginationPanel: false,
    suppressDragLeaveHidesColumns: true,
    suppressCellFocus: true,
    navigateToNextCell: GridRenderer.arrowKeyNavigator(this, 'buildsGrid'),
  };

  const gridDiv = document.getElementById('heroes-table');
  const buildsGridDiv = document.getElementById('builds-table');
  heroesGrid = createGridCompat(gridDiv, gridOptions);
  buildsGrid = createGridCompat(buildsGridDiv, buildsGridOptions);
}

const fourPieceSets = new Set([
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
function renderSets(equipment) {
  if (!equipment) return null;

  const setNames = Object.values(equipment).map((x) => x.set);
  const setCounters = [
    Math.floor(setNames.filter((x) => x === 'HealthSet').length),
    Math.floor(setNames.filter((x) => x === 'DefenseSet').length),
    Math.floor(setNames.filter((x) => x === 'AttackSet').length),
    Math.floor(setNames.filter((x) => x === 'SpeedSet').length),
    Math.floor(setNames.filter((x) => x === 'CriticalSet').length),
    Math.floor(setNames.filter((x) => x === 'HitSet').length),
    Math.floor(setNames.filter((x) => x === 'DestructionSet').length),
    Math.floor(setNames.filter((x) => x === 'LifestealSet').length),
    Math.floor(setNames.filter((x) => x === 'CounterSet').length),
    Math.floor(setNames.filter((x) => x === 'ResistSet').length),
    Math.floor(setNames.filter((x) => x === 'UnitySet').length),
    Math.floor(setNames.filter((x) => x === 'RageSet').length),
    Math.floor(setNames.filter((x) => x === 'ImmunitySet').length),
    Math.floor(setNames.filter((x) => x === 'PenetrationSet').length),
    Math.floor(setNames.filter((x) => x === 'RevengeSet').length),
    Math.floor(setNames.filter((x) => x === 'InjurySet').length),
    Math.floor(setNames.filter((x) => x === 'ProtectionSet').length),
    Math.floor(setNames.filter((x) => x === 'TorrentSet').length),
    Math.floor(setNames.filter((x) => x === 'ReversalSet').length),
    Math.floor(setNames.filter((x) => x === 'RiposteSet').length),
    Math.floor(setNames.filter((x) => x === 'WarfareSet').length),
    Math.floor(setNames.filter((x) => x === 'PursuitSet').length),
    Math.floor(setNames.filter((x) => x === 'FervorSet').length),
    Math.floor(setNames.filter((x) => x === 'WeakeningSet').length),
  ];

  const sets = [];
  for (let i = 0; i < setCounters.length; i += 1) {
    const setsFound = Math.floor(
      setCounters[i] / Constants.piecesBySetIndex[i],
    );
    for (let j = 0; j < setsFound; j += 1) {
      sets.push(Constants.setsByIndex[i]);
    }
  }

  sets.sort((a, b) => {
    if (fourPieceSets.has(a)) {
      return -1;
    }
    if (fourPieceSets.has(b)) {
      return 1;
    }
    return a.localeCompare(b);
  });

  const images = sets.map(
    (x) => `<img class="optimizerSetIcon" src=${Assets.getSetAsset(x)}></img>`,
  );

  return images.join('');
}

const BASE_CELL_STYLE = {
  height: '100%',
  display: 'flex',
  'justify-content': 'center',
  'align-items': 'center',
};

function heroColumnGradient(params) {
  try {
    if (params?.value === undefined) return BASE_CELL_STYLE;
    const { colId } = params.column;
    const { value } = params;
    const agg = heroesAggregate[colId];
    if (!agg) return BASE_CELL_STYLE;

    let color;
    let percent;
    if (value > agg.avg) {
      percent = 0.5 * ((value - agg.avg) / (agg.max - agg.avg)) + 0.5;
      percent = Math.min(1, Math.max(0, percent));
      color = gradient.gradient.rgbAt(percent);
    }
    if (value === agg.avg) {
      color = gradient.gradient.rgbAt(0.5);
    }
    if (value < agg.avg) {
      percent = (1 - (agg.avg - value) / (agg.avg - agg.min)) * 0.5;
      percent = Math.min(1, Math.max(0, percent));
      color = gradient.gradient.rgbAt(percent);
    }

    return { ...BASE_CELL_STYLE, backgroundColor: color.toHexString() };
  } catch (e) {
    Log.error(e);
    return BASE_CELL_STYLE;
  }
}

function columnGradient(params) {
  try {
    if (params?.value === undefined) return undefined;
    const { colId } = params.column;
    const { value } = params;

    const agg = currentAggregate[colId];

    if (!agg) return undefined;

    let color;
    let percent;
    if (value > agg.avg) {
      percent = 0.5 * ((value - agg.avg) / (agg.max - agg.avg)) + 0.5;
      percent = Math.min(1, Math.max(0, percent));
      color = gradient.gradient.rgbAt(percent);
    }

    if (value === agg.avg) {
      color = gradient.gradient.rgbAt(0.5);
    }

    if (value < agg.avg) {
      percent = (1 - (agg.avg - value) / (agg.avg - agg.min)) * 0.5;
      percent = Math.min(1, Math.max(0, percent));
      color = gradient.gradient.rgbAt(percent);
    }

    return {
      backgroundColor: color.toHexString(),
    };
  } catch (e) {
    Log.error(e);
    return undefined;
  }
}

function renderElement(element) {
  const file = Assets.getElementAsset(element);
  return `<img class='optimizerSetIcon' src='${file}'></img>`;
}

function renderName(params) {
  const { stars } = params.data;
  const name = i18next.t(params.data.name);
  return stars === 5 ? `${name} - 5 ★` : name;
}

function renderClass(role) {
  const file = Assets.getClassAsset(role);
  return `<img class='optimizerSetIcon' src='${file}'></img>`;
}

function renderIcon(name) {
  const baseName = name.replace(/\s#\d+$/, '');
  const url = HeroData.getHeroExtraInfo(baseName).assets.icon;
  const image = `<img class="heroIcon" src=${url}></img>`;
  return image;
}

async function onBuildRowSelected(event) {
  Log.debug('onBuildRowSelected', event);
  if (event.node.isSelected()) {
    const hero = HeroesGrid.getSelectedRow();
    const useReforgeStats = HeroesTab.getUseReforgedStats();
    const heroResponse = await Api.getHeroById(hero.id, useReforgeStats);
    const { baseStats } = heroResponse;
    const itemIds = event.data.items;

    const itemsResponse = await Api.getItemsByIds(itemIds);
    const { items } = itemsResponse;
    const mods = event.data.mods || [];

    for (let i = 0; i < 6; i += 1) {
      const item = items[i];
      const mod = mods[i];

      Log.debug('modding', items, mods, event.data);

      if (mod) {
        for (let j = 0; j < item.substats.length; j += 1) {
          const substat = item.substats[j];
          if (j === mod.index) {
            substat.type = mod.type;
            substat.value = mod.value;
            substat.originalType = mod.originalType;
            substat.originalValue = mod.originalValue;
            substat.modified = true;
          }
        }
      }

      const displayId = Constants.gearDisplayIdByIndex[i];
      const html = HtmlGenerator.buildItemPanel(
        item,
        'heroesGrid',
        baseStats,
        mods,
      );
      document.getElementById(displayId).innerHTML = html;
    }
  }
}

function onHeroRowClick() {
  selectedBuildNode = null;
}

function onHeroRowSelected(event) {
  if (event.node.isSelected()) {
    Log.debug('onHeroRowSelected', event);
    const heroId = event.data.id;
    redrawPreviewHero(heroId);
  }
}

function redrawPreviewHero(heroId) {
  const useReforgedStats = HeroesTab.getUseReforgedStats();
  Log.debug('Use reforge', useReforgedStats);
  return Api.getHeroById(heroId, useReforgedStats)
    .then(async (response) => {
      const { hero } = response;

      updateCurrentAggregate(hero);
      buildsGrid.gridOptions.api.setGridOption(
        'rowData',
        hero.builds === null ? [] : hero.builds,
      );

      const equipmentMap = hero.equipment ? hero.equipment : {};
      const equipment = [
        equipmentMap.Weapon,
        equipmentMap.Helmet,
        equipmentMap.Armor,
        equipmentMap.Necklace,
        equipmentMap.Ring,
        equipmentMap.Boots,
      ];

      refreshBuilds(response);

      const { baseStats } = response;

      for (let i = 0; i < 6; i += 1) {
        const gear = equipment[i];
        const displayId = Constants.gearDisplayIdByIndex[i];

        const html = HtmlGenerator.buildItemPanel(
          gear,
          'heroesGrid',
          baseStats,
        );
        document.getElementById(displayId).innerHTML = html;
      }
      return response;
    })
    .catch((e) => Log.error(e));
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

function updateCurrentAggregate(hero) {
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
    'hmcdmgs',
    'dmcdmgs',
    'hdmg',
    'hdmgs',
    'ddmg',
    'ddmgs',
    's1',
    's2',
    's3',
    'score',
    'bs',
  ];

  const heroStats = hero.builds || [];

  statsToAggregate.forEach((stat) => {
    const arrSum = (arr) => arr.reduce((a, b) => a + b[stat], 0);
    // Reduce instead of Math.max/min spread to avoid call-stack overflow on large arrays (G4).
    const vals = getField(heroStats, stat);
    let max = vals.reduce((m, v) => (v > m ? v : m), -Infinity);
    let min = vals.reduce((m, v) => (v < m ? v : m), Infinity);
    const sum = arrSum(heroStats);
    const avg = hero[stat];

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

  Log.debug('Aggregated', currentAggregate);
}

// Push Speed: effective speed after this hero's combat-readiness push.
// crPush is a per-hero fraction (set in Bonus stats); pSpd = spd / (1 - crPush).
function heroPSpd(h) {
  const crp = Math.min(0.95, Math.max(0, Number(h?.crPush) || 0));
  const spd = Number(h?.spd) || 0;
  return Math.round(spd / (1 - crp));
}

// Inline planner number cell (Target Speed, Usage %).  A transparent numeric input that
// saves on commit (Enter / blur) via the given save fn — no Bonus Stats round-trip.  The
// grid sorts on the row field (updated on commit), so sorting ranks by the typed values.
function plannerNumberCell(params, key, title, save) {
  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'numeric';
  input.value = params.data && params.data[key] ? params.data[key] : '';
  input.placeholder = '–';
  input.title = title;
  input.style.cssText =
    'width:100%;height:100%;box-sizing:border-box;background:transparent;border:none;' +
    'text-align:center;color:inherit;font:inherit;outline:none;padding:0;cursor:text;';
  // Keep clicks inside the input from selecting the row or starting a row drag.
  ['mousedown', 'click', 'dblclick'].forEach((evt) =>
    input.addEventListener(evt, (e) => e.stopPropagation()),
  );
  const commit = async () => {
    if (!params.data) return;
    const v = Math.max(0, Number.parseInt(input.value, 10) || 0);
    input.value = v ? v : '';
    if (params.data[key] === v) return;
    params.data[key] = v;
    try {
      await save(params.data.id, v);
    } catch (e) {
      Log.error(`Failed to save ${key}`, e);
    }
  };
  input.addEventListener('change', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur(); // commit via the resulting change/blur
  });
  return input;
}

function renderTargetSpeedInput(params) {
  return plannerNumberCell(
    params,
    'targetSpeed',
    'Target speed (saved automatically)',
    (id, v) => Api.setTargetSpeed(id, v),
  );
}

function renderUsageInput(params) {
  return plannerNumberCell(
    params,
    'usageRate',
    'Usage % (saved automatically)',
    (id, v) => Api.setBuildPlanner(id, { usageRate: v }),
  );
}

// Inline low-pick-rate checkbox.  Saves per hero via Api.setBuildPlanner on toggle; when
// the "Separate low pick-rate" view toggle is active it re-sorts so the row jumps to/from
// the bottom group immediately.
function renderLowPickCheckbox(params) {
  const wrap = document.createElement('div');
  wrap.style.cssText =
    'width:100%;height:100%;display:flex;align-items:center;justify-content:center;';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = !!(params.data && params.data.lowPickRate);
  cb.style.cssText = 'cursor:pointer;margin:0;';
  ['mousedown', 'click', 'dblclick'].forEach((evt) =>
    cb.addEventListener(evt, (e) => e.stopPropagation()),
  );
  cb.addEventListener('change', async () => {
    if (!params.data) return;
    const v = cb.checked;
    params.data.lowPickRate = v;
    try {
      await Api.setBuildPlanner(params.data.id, { lowPickRate: v });
    } catch (e) {
      Log.error('Failed to save low pick rate', e);
    }
    if (_separateLowPick) {
      try {
        heroesGrid.gridOptions.api.refreshClientSideRowModel('sort');
        heroesGrid.gridOptions.api.redrawRows();
      } catch {
        /* ignore */
      }
    }
  });
  wrap.appendChild(cb);
  return wrap;
}

// Speed-tier band label from a target speed value.  0 / unset → '' (blank).  Edit these
// bands freely — single source of truth for the Tier column.
const _SPEED_TIERS = [
  { min: 300, label: 'Top' },
  { min: 280, label: 'High' },
  { min: 250, label: 'Med-High' },
  { min: 220, label: 'Medium' },
  { min: 180, label: 'Med-Low' },
  { min: 150, label: 'Low' },
  { min: 100, label: 'Base' },
];
function speedTierLabel(spd) {
  const v = Number(spd) || 0;
  if (v <= 0) return '';
  for (let i = 0; i < _SPEED_TIERS.length; i += 1) {
    if (v >= _SPEED_TIERS[i].min) return _SPEED_TIERS[i].label;
  }
  return 'Sub';
}

// Toggle "separate low pick-rate" view: sink flagged heroes to the bottom while keeping
// the active column sort within each group.  Wired to the hero-tab switch.
export const setSeparateLowPick = (enabled) => {
  _separateLowPick = !!enabled;
  try {
    heroesGrid.gridOptions.api.setGridOption(
      'suppressRowDrag',
      _separateLowPick || sortActive || filterActive,
    );
    heroesGrid.gridOptions.api.refreshClientSideRowModel('sort');
    heroesGrid.gridOptions.api.redrawRows();
  } catch (e) {
    Log.error('Failed to toggle low-pick separation:', e);
  }
};

// Auto-rank the roster: high pick-rate first, then low-pick; within each group
// fastest→slowest by Target Speed (unset speeds sink).  Persists the new order via
// the one-call bulk reorder endpoint, then redraws.
export const autoRank = async () => {
  if (!Array.isArray(currentHeroes) || currentHeroes.length === 0) return;
  const ordered = [...currentHeroes].sort((a, b) => {
    const al = a.lowPickRate ? 1 : 0;
    const bl = b.lowPickRate ? 1 : 0;
    if (al !== bl) return al - bl; // high-pick (0) before low-pick (1)
    return (Number(b.targetSpeed) || 0) - (Number(a.targetSpeed) || 0); // faster first
  });
  try {
    await Api.reorderAllHeroes(ordered.map((h) => h.id));
    await HeroesTab.redraw();
  } catch (e) {
    Log.error('Auto-rank failed:', e);
  }
};

function updateHeroesAggregate(heroList) {
  const statsToAggregate = [
    'atk', 'hp', 'def', 'spd', 'pSpd', 'cr', 'cd', 'eff', 'res', 'dac', 'cp',
    'hpps', 'ehp', 'ehpps', 'dmg', 'dmgps', 'mcdmg', 'mcdmgps',
    'dmgh', 'dmgd', 'hmcdmgs', 'dmcdmgs', 'hdmg', 'hdmgs', 'ddmg', 'ddmgs',
    's1', 's2', 's3', 'score', 'bs',
  ];

  statsToAggregate.forEach((stat) => {
    const values = heroList
      .map((h) => (stat === 'pSpd' ? heroPSpd(h) : h[stat]))
      .filter((v) => v !== undefined && v !== null);
    if (values.length === 0) return;

    let max = values.reduce((m, v) => (v > m ? v : m), -Infinity);
    let min = values.reduce((m, v) => (v < m ? v : m), Infinity);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    if (stat === 'cr') { max = Math.min(100, max); min = Math.min(100, min); }
    // No hard CD cap — heroes with cdCapBonus can legitimately exceed 350

    heroesAggregate[stat] = {
      max: cleanInfinities(max),
      min: cleanInfinities(min),
      avg: cleanInfinities(avg),
    };
  });
}

function onRowDragEnter(e) {
  // ag-grid v35 removed gridApi.selectNode(); select the dragged row via the node API.
  e.node.setSelected(true);
}

async function onRowDragEnd(e) {
  Log.debug('onRowDragEnd', e, e.overIndex);

  const dragged = e.node.data;

  await Api.reorderHeroes(dragged.id, e.overIndex + 1);
  HeroesTab.redraw();
}

function onRowDragLeave() {}

let lastOverNode;

function onRowDragMove(event) {
  const movingNode = event.node;
  const { overNode } = event;

  const rowNeedsToMove =
    overNode.data.id !== lastOverNode?.data.id &&
    overNode.data.id !== movingNode.data.id;

  if (rowNeedsToMove) {
    Log.debug(
      'onRowDragMove',
      overNode.data.id,
      lastOverNode?.data.id,
      movingNode.data.id,
      rowNeedsToMove,
    );
  }
  lastOverNode = overNode;

  if (rowNeedsToMove) {
    // the list of rows we have is data, not row nodes, so extract the data
    const movingData = movingNode.data;
    const overData = overNode.data;

    const fromIndex = currentHeroes.indexOf(movingData);
    const toIndex = currentHeroes.indexOf(overData);

    const newStore = currentHeroes.slice();
    moveInArray(newStore, fromIndex, toIndex);

    currentHeroes = newStore;
    heroesGrid.gridOptions.api.setGridOption('rowData', newStore);

    heroesGrid.gridOptions.api.clearFocusedCell();
  }
}

function moveInArray(arr, fromIndex, toIndex) {
  const element = arr[fromIndex];
  arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, element);
}

let filterActive = false;
let sortActive = false;
function onSortChanged() {
  const colState = heroesGrid.gridOptions.api.getColumnState();
  sortActive = colState?.some((col) => col.sort != null);
  // suppress row drag if either sort or filter is active
  const suppressRowDrag = sortActive || filterActive;
  Log.debug(`sortActive = ${sortActive}, allowRowDrag = ${suppressRowDrag}`);
  heroesGrid.gridOptions.api.setGridOption('suppressRowDrag', suppressRowDrag);
}
// listen for changes on filter changed
function onFilterChanged() {
  filterActive = heroesGrid.gridOptions.api.isAnyFilterPresent();
  // suppress row drag if either sort or filter is active
  const suppressRowDrag = sortActive || filterActive;
  Log.debug(
    `sortActive = ${sortActive}, filterActive = ${filterActive}, allowRowDrag = ${suppressRowDrag}`,
  );
  heroesGrid.gridOptions.api.setGridOption('suppressRowDrag', suppressRowDrag);
}

function onRowDoubleClicked(e) {
  if (!e.data?.id) {
    return;
  }

  const heroId = e.data.id;

  Log.debug('Double clicked hero row', e);
  $('#inputHeroAdd').val(heroId).change();
  $('#tab1').trigger('click');
}

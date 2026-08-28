/* global i18next, AG_GRID_LOCALE_ZH, AG_GRID_LOCALE_ZH_TW, AG_GRID_LOCALE_FR */
/* global AG_GRID_LOCALE_JA, AG_GRID_LOCALE_KO, AG_GRID_LOCALE_RU, AG_GRID_LOCALE_EN */
/* global Api, GridRenderer, ItemsTab, Assets, HeroData, HtmlGenerator, Reforge, Notifier, $ */
/* global HeroGearMatcher, ArchetypeScorer, ArchetypeStore */
const tinygradient = require('tinygradient').default;
const colorPicker =
  require('../../6. Shared/4. UI/1. Components/colorPicker').default;

const lightGradient = { gradient: tinygradient('#ffffff', '#8fed78') };
const lightScoreGradient = {
  gradient: tinygradient('#ffa8a8', '#ffffe5', '#8fed78'),
};

const darkGradient = colorPicker.get2Colors();

const darkScoreGradient2 = colorPicker.getColors();

let gradient = lightGradient;
let scoreGradient = lightScoreGradient;

let itemsGrid = globalThis.itemsGrid || null;
const currentAggregate = {};
let selectedCell = null;

// Currently selected group for the gScore column (empty = off)
let _selectedGroup = '';

function _populateGroupFilter() {
  const sel = document.getElementById('archetypeGroupFilter');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '<option value="">— Off —</option>';
  const groups = [
    ...new Set(
      ArchetypeStore.getArchetypes()
        .map((a) => a.group)
        .filter((g) => g?.trim()),
    ),
  ].sort((a, b) => a.localeCompare(b));
  groups.forEach((g) => {
    const opt = document.createElement('option');
    opt.value = g;
    opt.textContent = g;
    if (g === prev) opt.selected = true;
    sel.appendChild(opt);
  });
  // If the previously selected group no longer exists, reset
  if (!groups.includes(prev)) _selectedGroup = '';
}

const ITEMS_GRID_COLUMN_STATE_KEY = 'itemsGridColumnState';

function saveColumnState() {
  try {
    const state = itemsGrid.gridOptions.api.getColumnState();
    localStorage.setItem(ITEMS_GRID_COLUMN_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    Log.error('Failed to save column state:', e);
    if (e.name === 'QuotaExceededError' && typeof Notifier !== 'undefined') {
      Notifier.warn(
        'Column layout could not be saved — browser storage is full.',
      );
    }
  }
}

module.exports = {
  async editedItem() {
    if (selectedCell) {
      const response = await Api.getItemById(selectedCell.id);
      selectedCell = response.item;
      module.exports.redraw();
    }
  },

  toggleDarkMode(enabled) {
    if (enabled) {
      gradient = darkGradient;
      scoreGradient = darkScoreGradient2;
    } else {
      gradient = lightGradient;
      scoreGradient = lightScoreGradient;
    }

    if (itemsGrid?.gridOptions?.api) {
      itemsGrid.gridOptions.api.redrawRows();
    }
  },

  initialize: async () => {
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

    let getAllItemsResponse;
    try {
      getAllItemsResponse = await Api.getAllItems();
    } catch (err) {
      Log.error('[ItemsGrid] initialize: API error', err);
      return;
    }
    const gridOptions = {
      defaultColDef: {
        width: 45,
        sortable: true,
        resizable: true,
        sortingOrder: ['desc', 'asc', null],
        cellDataType: false,
        cellStyle: columnGradient,
      },

      columnDefs: [
        {
          headerName: i18next.t('Set'),
          field: 'set',
          cellRenderer: (params) => renderSets(params.value),
        },
        {
          headerName: i18next.t('Gear'),
          field: 'gear',
          cellRenderer: (params) => renderGear(params.value),
        },
        {
          headerName: i18next.t('Rank'),
          field: 'rank',
          cellRenderer: (params) => i18next.t(params.value),
          width: 50,
        },
        {
          headerName: i18next.t('Level'),
          field: 'level',
          filter: 'agNumberColumnFilter',
        },
        {
          headerName: i18next.t('Enhance'),
          field: 'enhance',
          width: 60,
          filter: 'agNumberColumnFilter',
        },
        {
          headerName: i18next.t('Main'),
          field: 'main.type',
          width: 100,
          cellRenderer: (params) => renderStat(i18next.t(params.value)),
        },
        {
          headerName: i18next.t('Value'),
          field: 'main.value',
          width: 60,
        },
        {
          headerName: i18next.t('Atk%'),
          field: 'augmentedStats.AttackPercent',
          cellRenderer: (params) => (params.value === 0 ? '' : params.value),
        },
        {
          headerName: i18next.t('Atk'),
          field: 'augmentedStats.Attack',
          cellRenderer: (params) => (params.value === 0 ? '' : params.value),
        },
        {
          headerName: i18next.t('Spd'),
          field: 'augmentedStats.Speed',
          cellRenderer: (params) => (params.value === 0 ? '' : params.value),
        },
        {
          headerName: i18next.t('Cr'),
          field: 'augmentedStats.CriticalHitChancePercent',
          cellRenderer: (params) => (params.value === 0 ? '' : params.value),
        },
        {
          headerName: i18next.t('Cd'),
          field: 'augmentedStats.CriticalHitDamagePercent',
          cellRenderer: (params) => (params.value === 0 ? '' : params.value),
        },
        {
          headerName: i18next.t('Hp%'),
          field: 'augmentedStats.HealthPercent',
          cellRenderer: (params) => (params.value === 0 ? '' : params.value),
        },
        {
          headerName: i18next.t('Hp'),
          field: 'augmentedStats.Health',
          cellRenderer: (params) => (params.value === 0 ? '' : params.value),
        },
        {
          headerName: i18next.t('Def%'),
          field: 'augmentedStats.DefensePercent',
          cellRenderer: (params) => (params.value === 0 ? '' : params.value),
        },
        {
          headerName: i18next.t('Def'),
          field: 'augmentedStats.Defense',
          cellRenderer: (params) => (params.value === 0 ? '' : params.value),
        },
        {
          headerName: i18next.t('Eff'),
          field: 'augmentedStats.EffectivenessPercent',
          cellRenderer: (params) => (params.value === 0 ? '' : params.value),
        },
        {
          headerName: i18next.t('Res'),
          field: 'augmentedStats.EffectResistancePercent',
          cellRenderer: (params) => (params.value === 0 ? '' : params.value),
        },
        {
          headerName: i18next.t('Score'),
          field: 'reforgedWss',
          width: 50,
          cellStyle: scoreColumnGradient,
          valueGetter: (p) =>
            p.data ? ArchetypeScorer.computeGearScore(p.data) : null,
        },
        {
          headerName: i18next.t('dScore'),
          field: 'dpsWss',
          width: 50,
          cellStyle: scoreColumnGradient,
          valueGetter: (p) =>
            p.data
              ? ArchetypeScorer.getArchetypeScore(
                  p.data,
                  ArchetypeStore.getArchetypes(),
                  'dps',
                )
              : null,
        },
        {
          headerName: i18next.t('sScore'),
          field: 'supportWss',
          width: 50,
          cellStyle: scoreColumnGradient,
          valueGetter: (p) =>
            p.data
              ? ArchetypeScorer.getArchetypeScore(
                  p.data,
                  ArchetypeStore.getArchetypes(),
                  'er-tank',
                )
              : null,
        },
        {
          headerName: i18next.t('cScore'),
          field: 'combatWss',
          width: 50,
          cellStyle: scoreColumnGradient,
          valueGetter: (p) =>
            p.data
              ? ArchetypeScorer.getArchetypeScore(
                  p.data,
                  ArchetypeStore.getArchetypes(),
                  'bruiser',
                )
              : null,
        },
        {
          headerName: 'A.Score',
          field: 'groupWss',
          width: 60,
          cellStyle: scoreColumnGradient,
          valueGetter: (p) => {
            if (!p.data || !_selectedGroup) return null;
            return ArchetypeScorer.getBestGroupScore(
              p.data,
              ArchetypeStore.getArchetypes(),
              _selectedGroup,
            );
          },
        },
        {
          headerName: i18next.t('Match%'),
          field: 'heroMatchPercent',
          width: 60,
          cellStyle: scoreColumnGradient,
          cellRenderer: (params) =>
            params.value == null ? '\u2014' : String(params.value),
        },
        {
          headerName: i18next.t('Equipped'),
          field: 'equippedByName',
          width: 120,
          cellRenderer: (params) => renderStat(i18next.t(params.value)),
        },
        // {headerName: i18next.t('Mconf'), field: 'mconfidence', width: 50},
        // {headerName: i18next.t('Material'), field: 'material', width: 120},
        {
          headerName: i18next.t('Locked'),
          field: 'locked',
          cellRenderer: (params) =>
            params.value === true ? i18next.t('yes') : '',
        },
        {
          headerName: i18next.t('noMod'),
          field: 'disableMods',
          cellRenderer: (params) =>
            params.value === true ? i18next.t('yes') : '',
        },
        {
          headerName: i18next.t('Duplicate'),
          field: 'duplicateId',
          hide: true,
          filter: 'agTextColumnFilter',
        },
        {
          headerName: 'AllowedMods',
          field: 'allowedMods',
          hide: true,
          filter: 'agTextColumnFilter',
        },
        {
          headerName: 'EquippedById',
          field: 'equippedById',
          hide: true,
          filter: 'agTextColumnFilter',
        },
      ],
      rowSelection: {
        mode: 'multiRow',
        enableClickSelection: true,
      },
      selectionColumnDef: {
        width: 28,
        minWidth: 28,
        maxWidth: 28,
        suppressHeaderMenuButton: true,
      },
      pagination: true,
      paginationPageSize: 100000,
      paginationPageSizeSelector: false,
      localeText,
      rowData: getAllItemsResponse.items,
      onRowSelected,
      onCellMouseOver: cellMouseOver,
      onCellMouseOut: cellMouseOut,
      onCellFocused: cellFocused,
      suppressScrollOnNewData: true,
      navigateToNextCell: GridRenderer.arrowKeyNavigator(
        this,
        'itemsGrid',
        navigateCallback,
      ),
      animateRows: true,
      suppressDragLeaveHidesColumns: true,
      onColumnResized: (event) => {
        if (event.finished) saveColumnState();
      },
      onColumnMoved: saveColumnState,
      onColumnVisible: saveColumnState,
      suppressCellFocus: true,
      isExternalFilterPresent: ItemsTab.isExternalFilterPresent,
      doesExternalFilterPass: ItemsTab.doesExternalFilterPass,
      getRowId: (params) => {
        return params.data.id ?? `no-id-${params.node?.rowIndex}`;
      },
    };
    const gridDiv = document.getElementById('gear-grid');
    itemsGrid = createGridCompat(gridDiv, gridOptions);
    globalThis.itemsGrid = itemsGrid;

    globalThis.addEventListener('archetypesChanged', () => {
      if (itemsGrid?.gridOptions?.api) {
        _populateGroupFilter();
        itemsGrid.gridOptions.api.refreshCells({
          force: true,
          columns: [
            'reforgedWss',
            'dpsWss',
            'supportWss',
            'combatWss',
            'groupWss',
          ],
        });
      }
    });

    // Group filter selector
    const groupSel = document.getElementById('archetypeGroupFilter');
    if (groupSel) {
      _populateGroupFilter();
      groupSel.addEventListener('change', () => {
        _selectedGroup = groupSel.value;
        if (itemsGrid?.gridOptions?.api) {
          itemsGrid.gridOptions.api.refreshCells({
            force: true,
            columns: ['groupWss'],
          });
        }
      });
    }

    // Restore saved column state (widths, order, visibility)
    const savedColumnState = localStorage.getItem(ITEMS_GRID_COLUMN_STATE_KEY);
    if (savedColumnState) {
      try {
        itemsGrid.gridOptions.api.applyColumnState({
          state: JSON.parse(savedColumnState),
          applyOrder: true,
        });
      } catch (e) {
        Log.warn('Failed to restore column state, resetting:', e);
        localStorage.removeItem(ITEMS_GRID_COLUMN_STATE_KEY);
      }
    }
  },

  getSelectedGear: () => {
    if (!itemsGrid) return [];
    const selectedRows = itemsGrid.gridOptions.api.getSelectedRows();
    return selectedRows;
  },

  resetColumnState: () => {
    localStorage.removeItem(ITEMS_GRID_COLUMN_STATE_KEY);
    try {
      itemsGrid.gridOptions.api.resetColumnState();
    } catch (e) {
      Log.warn('Failed to reset column state:', e);
    }
  },

  redraw: async (newItem) => {
    if (!itemsGrid) return;
    let selectedNode;
    const selectedNodes = itemsGrid.gridOptions.api.getSelectedNodes();
    if (selectedNodes.length === 1) {
      [selectedNode] = selectedNodes;
    }

    let getAllItemsResponse;
    try {
      getAllItemsResponse = await Api.getAllItems();
    } catch (err) {
      Log.error('[ItemsGrid] redraw: API error', err);
      return;
    }
    aggregateCurrentGearStats(getAllItemsResponse.items);
    if (typeof HeroGearMatcher !== 'undefined') {
      HeroGearMatcher.applyCurrentScores(getAllItemsResponse.items);
    }
    itemsGrid.gridOptions.api.setGridOption(
      'rowData',
      getAllItemsResponse.items,
    );

    let refreshedItem;
    if (newItem) {
      itemsGrid.gridOptions.api.forEachNode((node) => {
        if (node.data.id === newItem.id) {
          node.setSelected(true, false);
          itemsGrid.gridOptions.api.ensureNodeVisible(node);
          refreshedItem = node.data;
        }
      });
    } else if (selectedNode) {
      itemsGrid.gridOptions.api.forEachNode((node) => {
        if (node.data.id === selectedNode.data.id) {
          node.setSelected(true, false);
          itemsGrid.gridOptions.api.ensureNodeVisible(node);
          refreshedItem = node.data;
        }
      });
    }
    drawPreview(refreshedItem);
    updateSelectedCount();
  },

  refreshFilters: (filters) => {
    if (!itemsGrid) {
      return;
    }

    const { substatFilter } = filters;
    const { duplicateFilter } = filters;
    const { equippedOrNotFilter } = filters;
    const { modifyFilter } = filters;

    // set/gear/level/enhance/statFilter are now handled by the external filter
    // (doesExternalFilterPass in itemsTab.js) — clear AG Grid column filters for them
    itemsGrid.gridOptions.api.setColumnFilterModel('set', null);
    itemsGrid.gridOptions.api.setColumnFilterModel('gear', null);
    itemsGrid.gridOptions.api.setColumnFilterModel('level', null);
    itemsGrid.gridOptions.api.setColumnFilterModel('enhance', null);
    itemsGrid.gridOptions.api.setColumnFilterModel('main.type', null);

    const statList = [
      'Attack',
      'AttackPercent',
      'Defense',
      'DefensePercent',
      'Health',
      'HealthPercent',
      'Speed',
      'CriticalHitChancePercent',
      'CriticalHitDamagePercent',
      'EffectivenessPercent',
      'EffectResistancePercent',
    ];
    statList.forEach((stat) => {
      itemsGrid.gridOptions.api.setColumnFilterModel(
        `augmentedStats.${stat}`,
        null,
      );
    });
    if (substatFilter) {
      /* empty */
    }

    itemsGrid.gridOptions.api.setColumnFilterModel(
      'allowedMods',
      modifyFilter ? { type: 'contains', filter: `|${modifyFilter}|` } : null,
    );

    itemsGrid.gridOptions.api.setColumnFilterModel(
      'duplicateId',
      duplicateFilter ? { type: 'startsWith', filter: 'DUPLICATE' } : null,
    );

    let equippedModel = null;
    if (equippedOrNotFilter === 'equipped') {
      equippedModel = { filterType: 'text', type: 'notBlank' };
    } else if (equippedOrNotFilter === 'unequipped') {
      equippedModel = { filterType: 'text', type: 'blank' };
    }
    itemsGrid.gridOptions.api.setColumnFilterModel(
      'equippedById',
      equippedModel,
    );

    itemsGrid.gridOptions.api.onFilterChanged();
    updateSelectedCount();
  },
};

function columnGradient(params) {
  try {
    const { colId } = params.column;
    const { value } = params;

    const agg = currentAggregate[colId];
    if (!agg) return undefined;

    const percent = value / (agg.max + 1);
    const color = gradient.gradient.rgbAt(percent);

    if (percent === 0) {
      return {
        backgroundColor: 'transparent',
      };
    }

    return {
      backgroundColor: color.toHexString(),
    };
  } catch (e) {
    Log.error(e);
    return undefined;
  }
}

function scoreColumnGradient(params) {
  try {
    if (params?.value === undefined || params.value === null) return undefined;
    const { value } = params;

    let percent = value / 100;
    percent = Math.min(1, percent);
    percent = Math.max(0, percent);

    const color = scoreGradient.gradient.rgbAt(percent);

    return {
      backgroundColor: color.toHexString(),
    };
  } catch (e) {
    Log.error(e);
    return undefined;
  }
}

function aggregateCurrentGearStats(items) {
  const statsToAggregate = [
    'augmentedStats.AttackPercent',
    'augmentedStats.Attack',
    'augmentedStats.Speed',
    'augmentedStats.CriticalHitChancePercent',
    'augmentedStats.CriticalHitDamagePercent',
    'augmentedStats.HealthPercent',
    'augmentedStats.Health',
    'augmentedStats.DefensePercent',
    'augmentedStats.Defense',
    'augmentedStats.EffectivenessPercent',
    'augmentedStats.EffectResistancePercent',
  ];

  const count = items.length;

  statsToAggregate.forEach((stat) => {
    const key = stat.split('.')[1];
    const values = items.map((x) => x.augmentedStats?.[key] || 0);
    const max = values.reduce((m, v) => Math.max(v, m), 0);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = count ? sum / count : 0;

    currentAggregate[stat] = {
      max,
      sum,
      avg,
    };
  });
}

function renderSets(name) {
  return `<img class="optimizerSetIcon" src="${Assets.getSetAsset(name)}">`;
}

function renderGear(name) {
  return `<img class="optimizerSetIcon" src="${Assets.getGearAsset(name)}">`;
}

function renderStat(name) {
  const statEdits = {
    CriticalHitDamagePercent: 'Crit Dmg %',
    CriticalHitChancePercent: 'Crit Chance %',
    EffectivenessPercent: 'Effectiveness %',
    EffectResistancePercent: 'Effect Resist %',
    AttackPercent: 'Attack %',
    HealthPercent: 'Health %',
    DefensePercent: 'Defense %',
  };

  return statEdits[name] || name;
}

function updateSelectedCount() {
  const count = module.exports.getSelectedGear().length;
  $('#selectedCount').html(count);
}

function navigateCallback(selectedNode) {
  if (!selectedNode) return;
  const item = selectedNode.data;
  selectedCell = item;

  drawPreview(item);
}

function cellFocused() {
  // This function is intentionally left empty as cell focus is handled by navigateCallback
}

async function cellMouseOver(event) {
  const item = event.data;

  await drawPreview(item);
}

async function cellMouseOut() {
  if (!selectedCell) return;

  await drawPreview(selectedCell);
}

async function drawPreview(item) {
  if (!item) {
    document.getElementById('gearTabPreview').innerHTML = '';
    return;
  }

  let baseStats = null;

  if (item.equippedByName) {
    // 6-star base stats for the equipped hero (signature is (name, stars)).
    baseStats = HeroData.getBaseStatsByStars(item.equippedByName, 6);
  }

  const html = HtmlGenerator.buildItemPanel(
    item,
    'itemsGrid',
    baseStats,
    'Speed',
  );
  document.getElementById('gearTabPreview').innerHTML = html;
}

function onRowSelected(event) {
  if (event.node.isSelected()) {
    selectedCell = event.data;
    updateSelectedCount();

    Reforge.unreforgeItem(event.data);
  }
}

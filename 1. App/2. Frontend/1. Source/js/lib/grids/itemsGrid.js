/* global i18next, AG_GRID_LOCALE_ZH, AG_GRID_LOCALE_ZH_TW, AG_GRID_LOCALE_FR */
/* global AG_GRID_LOCALE_JA, AG_GRID_LOCALE_KO, AG_GRID_LOCALE_RU, AG_GRID_LOCALE_EN */
/* global Api, Grid, GridRenderer, ItemsTab, Assets, HeroData, HtmlGenerator, Reforge, Tooltip, $ */
/* global HeroGearMatcher, ArchetypeScorer, ArchetypeStore */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
const tinygradient = require('tinygradient');
const colorPicker = require('../ui/colorPicker').default;

const lightGradient = { gradient: tinygradient('#ffffff', '#8fed78') };
const lightScoreGradient = {
    gradient: tinygradient('#ffa8a8', '#ffffe5', '#8fed78'),
};

const darkGradient = colorPicker.get2Colors();
// var darkGradient = tinygradient('#5A1A06', '#38821F');//Item Grid: Values
// const darkScoreGradient = tinygradient('#5A1A06', '#343127', '#38821F'); // Not used?
const darkScoreGradient2 = colorPicker.getColors();
// var darkScoreGradient2 = tinygradient([
//     {color: '#5A1A06', pos: 0}, // red
//     {color: '#343127', pos: 0.4},
//     {color: '#38821F', pos: 1} // green
// ]); //Item Grid: Score

let gradient = lightGradient;
let scoreGradient = lightScoreGradient;

let itemsGrid = global.itemsGrid || null;
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
                .filter((g) => g && g.trim()),
        ),
    ].sort();
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
        const state = itemsGrid.gridOptions.columnApi.getColumnState();
        localStorage.setItem(ITEMS_GRID_COLUMN_STATE_KEY, JSON.stringify(state));
    } catch (e) {
        // noop
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

        try {
            itemsGrid.gridOptions.api.redrawRows();
        } catch (e) {
            // noop
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
        console.log(`localeText:${localeText}`);

        const getAllItemsResponse = await Api.getAllItems();
        const gridOptions = {
            defaultColDef: {
                width: 45,
                sortable: true,
                resizable: true,
                sortingOrder: ['desc', 'asc', null],
                cellStyle: columnGradient,
                // valueFormatter: numberFormatter,
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
                    cellRenderer: (params) =>
                        renderStat(i18next.t(params.value)),
                },
                {
                    headerName: i18next.t('Value'),
                    field: 'main.value',
                    width: 60,
                },
                {
                    headerName: i18next.t('Atk%'),
                    field: 'augmentedStats.AttackPercent',
                    cellRenderer: (params) =>
                        params.value === 0 ? '' : params.value,
                },
                {
                    headerName: i18next.t('Atk'),
                    field: 'augmentedStats.Attack',
                    cellRenderer: (params) =>
                        params.value === 0 ? '' : params.value,
                },
                {
                    headerName: i18next.t('Spd'),
                    field: 'augmentedStats.Speed',
                    cellRenderer: (params) =>
                        params.value === 0 ? '' : params.value,
                },
                {
                    headerName: i18next.t('Cr'),
                    field: 'augmentedStats.CriticalHitChancePercent',
                    cellRenderer: (params) =>
                        params.value === 0 ? '' : params.value,
                },
                {
                    headerName: i18next.t('Cd'),
                    field: 'augmentedStats.CriticalHitDamagePercent',
                    cellRenderer: (params) =>
                        params.value === 0 ? '' : params.value,
                },
                {
                    headerName: i18next.t('Hp%'),
                    field: 'augmentedStats.HealthPercent',
                    cellRenderer: (params) =>
                        params.value === 0 ? '' : params.value,
                },
                {
                    headerName: i18next.t('Hp'),
                    field: 'augmentedStats.Health',
                    cellRenderer: (params) =>
                        params.value === 0 ? '' : params.value,
                },
                {
                    headerName: i18next.t('Def%'),
                    field: 'augmentedStats.DefensePercent',
                    cellRenderer: (params) =>
                        params.value === 0 ? '' : params.value,
                },
                {
                    headerName: i18next.t('Def'),
                    field: 'augmentedStats.Defense',
                    cellRenderer: (params) =>
                        params.value === 0 ? '' : params.value,
                },
                {
                    headerName: i18next.t('Eff'),
                    field: 'augmentedStats.EffectivenessPercent',
                    cellRenderer: (params) =>
                        params.value === 0 ? '' : params.value,
                },
                {
                    headerName: i18next.t('Res'),
                    field: 'augmentedStats.EffectResistancePercent',
                    cellRenderer: (params) =>
                        params.value === 0 ? '' : params.value,
                },
                {
                    headerName: i18next.t('Score'),
                    field: 'reforgedWss',
                    width: 50,
                    cellStyle: scoreColumnGradient,
                    valueGetter: (p) => p.data ? ArchetypeScorer.computeGearScore(p.data) : null,
                },
                {
                    headerName: i18next.t('dScore'),
                    field: 'dpsWss',
                    width: 50,
                    cellStyle: scoreColumnGradient,
                    valueGetter: (p) => p.data ? ArchetypeScorer.getArchetypeScore(p.data, ArchetypeStore.getArchetypes(), 'dps') : null,
                },
                {
                    headerName: i18next.t('sScore'),
                    field: 'supportWss',
                    width: 50,
                    cellStyle: scoreColumnGradient,
                    valueGetter: (p) => p.data ? ArchetypeScorer.getArchetypeScore(p.data, ArchetypeStore.getArchetypes(), 'er-tank') : null,
                },
                {
                    headerName: i18next.t('cScore'),
                    field: 'combatWss',
                    width: 50,
                    cellStyle: scoreColumnGradient,
                    valueGetter: (p) => p.data ? ArchetypeScorer.getArchetypeScore(p.data, ArchetypeStore.getArchetypes(), 'bruiser') : null,
                },
                {
                    headerName: 'A.Score',
                    field: 'groupWss',
                    width: 60,
                    cellStyle: scoreColumnGradient,
                    valueGetter: (p) => {
                        if (!p.data || !_selectedGroup) return null;
                        return ArchetypeScorer.getBestGroupScore(p.data, ArchetypeStore.getArchetypes(), _selectedGroup);
                    },
                },
                {
                    headerName: i18next.t('Match%'),
                    field: 'heroMatchPercent',
                    width: 60,
                    cellStyle: scoreColumnGradient,
                    cellRenderer: (params) =>
                        params.value !== undefined ? String(params.value) : '\u2014',
                },
                {
                    headerName: i18next.t('Equipped'),
                    field: 'equippedByName',
                    width: 120,
                    cellRenderer: (params) =>
                        renderStat(i18next.t(params.value)),
                },
                // {headerName: i18next.t('Mconf'), field: 'mconfidence', width: 50},
                // {headerName: i18next.t('Material'), field: 'material', width: 120},
                {
                    headerName: i18next.t('Locked'),
                    field: 'locked',
                    cellRenderer: (params) =>
                        params.value === true
                            ? i18next.t('yes')
                            : i18next.t(''),
                },
                {
                    headerName: i18next.t('noMod'),
                    field: 'disableMods',
                    cellRenderer: (params) =>
                        params.value === true
                            ? i18next.t('yes')
                            : i18next.t(''),
                },
                // {headerName: i18next.t('Actions'), field: 'id', cellRenderer: renderActions},
                {
                    headerName: i18next.t('Duplicate'),
                    field: 'duplicateId',
                    hide: true,
                },
                { headerName: 'AllowedMods', field: 'allowedMods', hide: true },
                {
                    headerName: 'EquippedById',
                    field: 'equippedById',
                    hide: true,
                },
            ],
            rowSelection: 'multiple',
            pagination: true,
            paginationPageSize: 100000,
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
            onColumnResized: (event) => { if (event.finished) saveColumnState(); },
            onColumnMoved: saveColumnState,
            onColumnVisible: saveColumnState,
            immutableData: true,
            suppressCellSelection: true,
            enableRangeSelection: false,
            isExternalFilterPresent: ItemsTab.isExternalFilterPresent,
            doesExternalFilterPass: ItemsTab.doesExternalFilterPass,
            getRowNodeId: (data) => {
                return data.id;
            },

            // onRowSelected: onRowSelected,
        };
        const gridDiv = document.getElementById('gear-grid');
        itemsGrid = new Grid(gridDiv, gridOptions);
        global.itemsGrid = itemsGrid;
        console.log('!!! itemsGrid', itemsGrid);

        window.addEventListener('archetypesChanged', () => {
            if (itemsGrid && itemsGrid.gridOptions && itemsGrid.gridOptions.api) {
                _populateGroupFilter();
                itemsGrid.gridOptions.api.refreshCells({
                    force: true,
                    columns: ['reforgedWss', 'dpsWss', 'supportWss', 'combatWss', 'groupWss'],
                });
            }
        });

        // Group filter selector
        const groupSel = document.getElementById('archetypeGroupFilter');
        if (groupSel) {
            _populateGroupFilter();
            groupSel.addEventListener('change', () => {
                _selectedGroup = groupSel.value;
                if (itemsGrid && itemsGrid.gridOptions && itemsGrid.gridOptions.api) {
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
                itemsGrid.gridOptions.columnApi.applyColumnState({
                    state: JSON.parse(savedColumnState),
                    applyOrder: true,
                });
            } catch (e) {
                localStorage.removeItem(ITEMS_GRID_COLUMN_STATE_KEY);
            }
        }

        Tooltip.displayItem('item1', 'asdf');
        // module.exports.redraw();
    },

    getSelectedGear: () => {
        const selectedRows = itemsGrid.gridOptions.api.getSelectedRows();
        console.log('SELECTED ROWS', selectedRows);

        return selectedRows;
    },

    resetColumnState: () => {
        localStorage.removeItem(ITEMS_GRID_COLUMN_STATE_KEY);
        try {
            itemsGrid.gridOptions.columnApi.resetColumnState();
        } catch (e) {
            // noop
        }
    },

    redraw: async (newItem) => {
        if (!itemsGrid) return;
        console.log('Redraw items', newItem);
        let selectedNode;
        const selectedNodes = itemsGrid.gridOptions.api.getSelectedNodes();
        if (selectedNodes.length === 1) {
            [selectedNode] = selectedNodes;
        }

        const getAllItemsResponse = await Api.getAllItems();
        aggregateCurrentGearStats(getAllItemsResponse.items);
        if (typeof HeroGearMatcher !== 'undefined') {
            HeroGearMatcher.applyCurrentScores(getAllItemsResponse.items);
        }
        itemsGrid.gridOptions.api.setRowData(getAllItemsResponse.items);

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

    // refreshFilters: (setFilter, gearFilter, levelFilter, enhanceFilter, statFilter) => {
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
        itemsGrid.gridOptions.api.getFilterInstance('set').setModel(null);
        itemsGrid.gridOptions.api.getFilterInstance('gear').setModel(null);
        itemsGrid.gridOptions.api.getFilterInstance('level').setModel(null);
        itemsGrid.gridOptions.api.getFilterInstance('enhance').setModel(null);
        itemsGrid.gridOptions.api.getFilterInstance('main.type').setModel(null);

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
            itemsGrid.gridOptions.api
                .getFilterInstance(`augmentedStats.${stat}`)
                .setModel(null);
        });
        if (substatFilter) {
            // const substatFilterComponent = itemsGrid.gridOptions.api.getFilterInstance('augmentedStats.' + substatFilter);
            // substatFilterComponent.setModel({
            //     type: 'notEqual',
            //     filter: 0
            // });
        }

        const allowedModsFilterComponent =
            itemsGrid.gridOptions.api.getFilterInstance('allowedMods');
        if (modifyFilter) {
            allowedModsFilterComponent.setModel({
                type: 'contains',
                filter: `|${modifyFilter}|`,
            });
        } else {
            allowedModsFilterComponent.setModel(null);
        }

        const duplicateFilterComponent =
            itemsGrid.gridOptions.api.getFilterInstance('duplicateId');
        if (!duplicateFilter) {
            duplicateFilterComponent.setModel(null);
        } else {
            duplicateFilterComponent.setModel({
                type: 'startsWith',
                filter: 'DUPLICATE',
            });
        }

        const equippedOrNotFilterComponent =
            itemsGrid.gridOptions.api.getFilterInstance('equippedById');
        if (!equippedOrNotFilter) {
            equippedOrNotFilterComponent.setModel(null);
        } else {
            if (equippedOrNotFilter === 'equipped') {
                equippedOrNotFilterComponent.setModel({
                    type: 'contains',
                    filter: '-',
                });
            }

            if (equippedOrNotFilter === 'unequipped') {
                equippedOrNotFilterComponent.setModel({
                    filterType: 'string',
                    operator: 'AND',
                    condition1: {
                        filterType: 'string',
                        type: 'notContains',
                        filter: '-',
                    },
                    condition2: {
                        filterType: 'string',
                        type: 'notContains',
                        filter: '1',
                    },

                    // type: 'notContains',
                    // filter: '-'
                });
            }
        }

        itemsGrid.gridOptions.api.onFilterChanged();
        updateSelectedCount();
    },
};
// SAMPLE OR FILTER
// statFilterComponent.setModel({
//     // filterType: 'string',
//     // operator: 'OR',
//     // condition1: {
//     //     filterType: 'string',
//     //     type: 'notEqual',
//     //     filter: modifyFilter
//     // },
//     // condition2: {
//     //     filterType: 'string',
//     //     type: 'equals',
//     //     filter: 6
//     // }
//     type: 'notEqual',
//     filter: modifyFilter
// });

function columnGradient(params) {
    try {
        // if (!params || params.value == undefined) return;
        const { colId } = params.column;
        const { value } = params;

        const agg = currentAggregate[colId];
        if (!agg) return undefined;

        const percent = value / (agg.max + 1);
        const color = gradient.gradient.rgbAt(percent);

        if (percent === 0) {
            return {
                backgroundColor: 'ffffff00',
            };
        }

        return {
            backgroundColor: color.toHexString(),
        };
    } catch (e) {
        console.error(e);
        return undefined;
    }
}

function scoreColumnGradient(params) {
    try {
        if (!params || params.value === undefined || params.value === null) return undefined;
        const { value } = params;

        // var percent = value * (80-40) + 0.4;
        let percent = (80 * (value / 80)) / 100;
        percent = Math.min(1, percent);
        percent = Math.max(0, percent);

        const color = scoreGradient.gradient.rgbAt(percent);

        return {
            backgroundColor: color.toHexString(),
        };
    } catch (e) {
        console.error(e);
        return undefined;
    }
}

function aggregateCurrentGearStats(items) {
    console.log('Aggregating', items);
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
        const arrSum = (arr) =>
            arr.reduce((a, b) => a + b.augmentedStats[stat.split('.')[1]], 0);

        const max = Math.max(...getField(items, stat));
        const sum = arrSum(items);
        const avg = sum / count;

        currentAggregate[stat] = {
            max,
            sum,
            avg,
        };
    });

    console.log('Aggregated', currentAggregate);
}

function getField(items, stat) {
    return items.map((x) => x.augmentedStats[stat.split('.')[1]]);
}

function renderSets(name) {
    return `<img class="optimizerSetIcon" src=${Assets.getSetAsset(
        name,
    )}></img>`;
}

function renderGear(name) {
    return `<img class="optimizerSetIcon" src=${Assets.getGearAsset(
        name,
    )}></img>`;
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
    // console.log("callback", selectedNode);

    if (!selectedNode) return;
    const item = selectedNode.data;
    selectedCell = item;

    drawPreview(item);
}

function cellFocused() {}

async function cellMouseOver(event) {
    const item = event.data;

    await drawPreview(item);
}

async function cellMouseOut() {
    if (!selectedCell) return;
    // console.log("out", event);

    await drawPreview(selectedCell);
}

async function drawPreview(item) {
    if (!item) {
        document.getElementById('gearTabPreview').innerHTML = '';
        return;
    }

    let baseStats = null;

    if (item.equippedByName) {
        // baseStats = (await Api.getHeroById(item.equippedById, true)).baseStats;
        baseStats = HeroData.getBaseStatsByStars(item.equippedByName, true, 6);
    }

    // TODO ADD STAT SELECTOR
    const html = HtmlGenerator.buildItemPanel(
        item,
        'itemsGrid',
        baseStats,
        'Speed',
    );
    document.getElementById('gearTabPreview').innerHTML = html;
}

function onRowSelected(event) {
    if (event.node.selected) {
        selectedCell = event.data;
        updateSelectedCount();

        // Testing purposes
        // Reforge.calculateMaxes(event.data);
        Reforge.unreforgeItem(event.data);
        console.log(event.data);
        // GearRating.rate(event.data);
    }
}

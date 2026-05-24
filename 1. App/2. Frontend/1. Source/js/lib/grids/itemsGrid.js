/* global i18next, AG_GRID_LOCALE_ZH, AG_GRID_LOCALE_ZH_TW, AG_GRID_LOCALE_FR */
/* global AG_GRID_LOCALE_JA, AG_GRID_LOCALE_KO, AG_GRID_LOCALE_RU, AG_GRID_LOCALE_EN */
/* global Api, Grid, GridRenderer, ItemsTab, Assets, HeroData, HtmlGenerator, Reforge, Tooltip, $ */
/* global HeroGearMatcher */
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

const ITEMS_GRID_COLUMN_STATE_KEY = 'itemsGridColumnState_v3';

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
                tooltipShowDelay: 0,
                // valueFormatter: numberFormatter,
            },
            headerHeight: 24,
            groupHeaderHeight: 24,
            enableBrowserTooltips: true,

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
                // ── Substats ────────────────────────────────────────────
                {
                    headerName: 'Substats',
                    headerClass: 'substats-group-header',
                    openByDefault: true,
                    marryChildren: true,
                    children: [
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
                    ],
                },
                // ── Scores group ─────────────────────────────────────────
                {
                    headerName: i18next.t('Scores'),
                    openByDefault: true,
                    children: [
                        {
                            headerName: i18next.t('Score'),
                            field: 'reforgedWss',
                            width: 50,
                            cellStyle: scoreColumnGradient,
                        },
                        // ΔScore: reforge gain (reforgedWss - wss)
                        {
                            headerName: i18next.t('ΔScore'),
                            colId: 'deltaScore',
                            valueGetter: (params) => {
                                const item = params.data;
                                if (!item || !item.reforgeable
                                    || item.reforgedWss == null || item.wss == null) return null;
                                return Math.round(item.reforgedWss - item.wss);
                            },
                            width: 60,
                            cellRenderer: (params) => {
                                if (params.value == null) return '\u2014';
                                return params.value > 0
                                    ? `<span style="color:#4CAF50">+${params.value}</span>`
                                    : String(params.value);
                            },
                        },
                        // Top official archetype score
                        {
                            headerName: i18next.t('Top Off.'),
                            colId: 'bestOfficialScore',
                            field: 'archetypeScores.bestOfficialScore',
                            width: 58,
                            cellStyle: scoreColumnGradient,
                            cellRenderer: (params) =>
                                params.value != null ? String(params.value) : '\u2014',
                            tooltipValueGetter: (params) => {
                                const s = params.data?.archetypeScores;
                                if (!s) return '';
                                return buildArchetypeBreakdownTooltip(s.allScores, 'Off. ');
                            },
                        },
                        // Best official archetype name (short, no "Off. " prefix)
                        // Tooltip shows ALL scored archetypes (full breakdown) for both tracks
                        {
                            headerName: i18next.t('Top Arch.'),
                            colId: 'bestOfficialArchetype',
                            field: 'archetypeScores.bestOfficialArchetype',
                            width: 70,
                            cellStyle: () => undefined,
                            cellRenderer: (params) => {
                                if (!params.value) return '\u2014';
                                return params.value.replace(/^(Off\.|UOff\.) /, '');
                            },
                            tooltipValueGetter: (params) => {
                                const s = params.data?.archetypeScores;
                                if (!s) return '';
                                const offLine  = buildArchetypeBreakdownTooltip(s.allScores, 'Off. ');
                                const uoffLine = buildArchetypeBreakdownTooltip(s.allScores, 'UOff. ');
                                const lines = [];
                                if (offLine)  lines.push(offLine);
                                if (uoffLine) lines.push(uoffLine);
                                return lines.join('\n');
                            },
                        },
                        // Top personal (UOff.) archetype score
                        {
                            headerName: i18next.t('Top UOff.'),
                            colId: 'bestPersonalScore',
                            field: 'archetypeScores.bestPersonalScore',
                            width: 58,
                            cellStyle: scoreColumnGradient,
                            cellRenderer: (params) =>
                                params.value != null ? String(params.value) : '\u2014',
                            tooltipValueGetter: (params) => {
                                const s = params.data?.archetypeScores;
                                if (!s) return '';
                                return buildArchetypeBreakdownTooltip(s.allScores, 'UOff. ');
                            },
                        },
                        // Off. C.Power — Top Speed + Speed (qualified) + best priority group (off. track, incl. Future)
                        {
                            headerName: i18next.t('Off.C.Power'),
                            colId: 'offCPower',
                            field: 'archetypeScores.offCPower',
                            width: 68,
                            cellStyle: (params) => {
                                const base = scoreColumnGradient(params);
                                return base ? { ...base, color: '#ffd93d' } : { color: '#ffd93d' };
                            },
                            cellRenderer: (params) =>
                                params.value > 0 ? String(params.value) : '\u2014',
                            tooltipValueGetter: (params) => {
                                const s = params.data?.archetypeScores;
                                if (!s) return '';
                                return `Off. C.Power: ${s.offCPower ?? 0} | Off. A.Power: ${s.offAPower ?? 0}`;
                            },
                        },
                        // UOff. C.Power — personal track (borrows Off. Future)
                        {
                            headerName: i18next.t('UOff.C.Pwr'),
                            colId: 'uoffCPower',
                            field: 'archetypeScores.uoffCPower',
                            width: 68,
                            cellStyle: (params) => {
                                const base = scoreColumnGradient(params);
                                return base ? { ...base, color: '#ffd93d' } : { color: '#ffd93d' };
                            },
                            cellRenderer: (params) =>
                                params.value > 0 ? String(params.value) : '\u2014',
                            tooltipValueGetter: (params) => {
                                const s = params.data?.archetypeScores;
                                if (!s) return '';
                                return `UOff. C.Power: ${s.uoffCPower ?? 0} | UOff. A.Power: ${s.uoffAPower ?? 0}`;
                            },
                        },
                        // Off. A.Power — same as C.Power but excludes Future group
                        {
                            headerName: i18next.t('Off.A.Power'),
                            colId: 'offAPower',
                            field: 'archetypeScores.offAPower',
                            width: 68,
                            hide: true,
                            cellStyle: (params) => {
                                const base = scoreColumnGradient(params);
                                return base ? { ...base, color: '#ff9f43' } : { color: '#ff9f43' };
                            },
                            cellRenderer: (params) =>
                                params.value > 0 ? String(params.value) : '\u2014',
                            tooltipValueGetter: () => 'Off. A.Power (no Future group)',
                        },
                        // UOff. A.Power
                        {
                            headerName: i18next.t('UOff.A.Pwr'),
                            colId: 'uoffAPower',
                            field: 'archetypeScores.uoffAPower',
                            width: 68,
                            hide: true,
                            cellStyle: (params) => {
                                const base = scoreColumnGradient(params);
                                return base ? { ...base, color: '#ff9f43' } : { color: '#ff9f43' };
                            },
                            cellRenderer: (params) =>
                                params.value > 0 ? String(params.value) : '\u2014',
                            tooltipValueGetter: () => 'UOff. A.Power (no Future group)',
                        },
                    ],
                },
                {
                    headerName: i18next.t('Match%'),
                    field: 'heroMatchPercent',
                    width: 60,
                    cellStyle: scoreColumnGradient,
                    tooltipField: 'heroMatchPercent',
                    cellRenderer: (params) => {
                        if (params.value !== undefined) return String(params.value);
                        return '<span title="Select a hero in the optimizer to see match %">\u2014</span>';
                    },
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
        if (!params || params.value === undefined) return undefined;
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
        // Testing purposes
        // Reforge.calculateMaxes(event.data);
        Reforge.unreforgeItem(event.data);
        console.log(event.data);
        // GearRating.rate(event.data);
    }

    updateSelectedCount();

    // Show comparison panel when exactly 2 items are selected
    const selected = itemsGrid.gridOptions.api.getSelectedRows();
    const panel = document.getElementById('comparisonPanel');
    if (selected.length === 2) {
        showComparison(selected[0], selected[1]);
    } else if (panel) {
        panel.style.display = 'none';
    }
}

/**
 * Builds a single-line tooltip string showing all non-zero archetype scores for one track.
 * Format: "Off.  DPS: 30 | Future: 2"  or  "UOff. DPS: 30 | Atk + EFF: 8 | Bruiser: 8"
 *
 * @param {Object|null} allScores - item.archetypeScores.allScores
 * @param {string} prefix - 'Off. ' or 'UOff. '
 * @returns {string} formatted tooltip line, or '' if no scores
 */
function buildArchetypeBreakdownTooltip(allScores, prefix) {
    if (!allScores) return '';
    const entries = Object.entries(allScores)
        .filter(([k]) => k.startsWith(prefix))
        .sort(([, a], [, b]) => b.score - a.score)
        .map(([k, v]) => `${k.slice(prefix.length)}: ${v.score}`);
    if (!entries.length) return '';
    const label = prefix === 'Off. ' ? 'Off. ' : 'UOff.';
    return `${label}  ${entries.join(' | ')}`;
}

function showComparison(itemA, itemB) {
    const panel = document.getElementById('comparisonPanel');
    if (!panel) return;

    panel.style.display = 'block';

    const aEl = document.getElementById('compItem1');
    const bEl = document.getElementById('compItem2');
    if (aEl) aEl.innerHTML = HtmlGenerator.buildItemPanel(itemA, 'comp1', null);
    if (bEl) bEl.innerHTML = HtmlGenerator.buildItemPanel(itemB, 'comp2', null);

    buildComparisonScoreTable(itemA, itemB);
}

function buildComparisonScoreTable(itemA, itemB) {
    const container = document.getElementById('comparisonScoreTable');
    if (!container) return;

    const aScores = itemA.archetypeScores && itemA.archetypeScores.allScores;
    const bScores = itemB.archetypeScores && itemB.archetypeScores.allScores;

    // Collect all archetype names present in either item (score > 0)
    const archetypeNames = new Set();
    if (aScores) Object.keys(aScores).forEach((n) => archetypeNames.add(n));
    if (bScores) Object.keys(bScores).forEach((n) => archetypeNames.add(n));

    // Sort: Official archetypes first, then by higher-of-two score descending
    const sorted = [...archetypeNames].sort((x, y) => {
        const xOff = x.startsWith('Off.') ? 0 : 1;
        const yOff = y.startsWith('Off.') ? 0 : 1;
        if (xOff !== yOff) return xOff - yOff;
        const xMax = Math.max(
            (aScores && aScores[x] && aScores[x].score) || 0,
            (bScores && bScores[x] && bScores[x].score) || 0,
        );
        const yMax = Math.max(
            (aScores && aScores[y] && aScores[y].score) || 0,
            (bScores && bScores[y] && bScores[y].score) || 0,
        );
        return yMax - xMax;
    });

    const rows = sorted
        .map((name) => {
            const aScore = (aScores && aScores[name] && aScores[name].score) || 0;
            const bScore = (bScores && bScores[name] && bScores[name].score) || 0;
            if (aScore === 0 && bScore === 0) return '';
            const diff = aScore - bScore;
            const diffStr =
                diff > 0
                    ? `<span style="color:#4CAF50">+${diff}</span>`
                    : diff < 0
                    ? `<span style="color:#f77">${diff}</span>`
                    : '<span style="color:#888">0</span>';
            const aStyle = aScore > bScore ? 'color:#4CAF50;font-weight:bold' : '';
            const bStyle = bScore > aScore ? 'color:#4CAF50;font-weight:bold' : '';
            const shortName = name.replace(/^(Off\.|UOff\.) /, '');
            return `<tr>
                <td style="padding:2px 6px;white-space:nowrap">${shortName}</td>
                <td style="padding:2px 8px;text-align:right;${aStyle}">${aScore || ''}</td>
                <td style="padding:2px 6px;text-align:center">${diffStr}</td>
                <td style="padding:2px 8px;text-align:right;${bStyle}">${bScore || ''}</td>
            </tr>`;
        })
        .join('');

    const aWss = itemA.reforgedWss != null ? itemA.reforgedWss : '—';
    const bWss = itemB.reforgedWss != null ? itemB.reforgedWss : '—';
    const wssAStyle = aWss > bWss ? 'color:#4CAF50;font-weight:bold' : '';
    const wssBStyle = bWss > aWss ? 'color:#4CAF50;font-weight:bold' : '';

    container.innerHTML = `
        <div style="font-size:11px;color:#aaa;margin-bottom:6px;">
            Archetype Score Comparison &nbsp;|&nbsp;
            <span>Score: <b style="${wssAStyle}">${aWss}</b> vs <b style="${wssBStyle}">${bWss}</b></span>
        </div>
        <table style="font-size:11px;border-collapse:collapse;width:100%">
            <thead>
                <tr style="border-bottom:1px solid #555">
                    <th style="text-align:left;padding:2px 6px">Archetype</th>
                    <th style="padding:2px 8px">A</th>
                    <th style="padding:2px 6px">&#916;</th>
                    <th style="padding:2px 8px">B</th>
                </tr>
            </thead>
            <tbody>
                ${
                    rows ||
                    '<tr><td colspan="4" style="text-align:center;color:#888;padding:8px">No archetype scores — augment items first</td></tr>'
                }
            </tbody>
        </table>`;
}

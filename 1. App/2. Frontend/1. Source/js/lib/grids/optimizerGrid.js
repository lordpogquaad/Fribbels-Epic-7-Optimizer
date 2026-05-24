/* global i18next, AG_GRID_LOCALE_ZH, AG_GRID_LOCALE_ZH_TW, AG_GRID_LOCALE_FR */
/* global AG_GRID_LOCALE_JA, AG_GRID_LOCALE_KO, AG_GRID_LOCALE_RU, AG_GRID_LOCALE_EN */
/* global Api, GridRenderer, OptimizerTab, StatPreview, Grid */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import tinygradient from 'tinygradient';
import colorPicker from '../ui/colorPicker';

const lightGradient = {
    gradient: tinygradient([
        { color: '#F5A191', pos: 0 }, // red
        { color: '#ffffe5', pos: 0.4 },
        { color: '#77e246', pos: 1 }, // green
    ]),
};

const darkGradient = colorPicker.getColors();
// var darkGradient = {gradient:tinygradient([
//     {color: '#5A1A06', pos: 0}, // red
//     {color: '#343127', pos: 0.4},
//     {color: '#38821F', pos: 1} // green
// ])};

let gradient = lightGradient;

let optimizerGrid = global.optimizerGrid || null;
const currentAggregate = {};
let selectedRow = null;
let pinnedRow = {
    atk: 0,
    def: 0,
    hp: 0,
    spd: 0,
    cr: 0,
    cd: 0,
    eff: 0,
    res: 0,
};

export default {
    toggleDarkMode(enabled) {
        if (enabled) {
            gradient = darkGradient;
        } else {
            gradient = lightGradient;
        }

        try {
            optimizerGrid.gridOptions.api.redrawRows();
        } catch (e) {
            // noop
        }
    },

    initialize: () => {
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

        buildGrid(localeText);
    },

    reloadData: () => {
        optimizerGrid.gridOptions.api.setDatasource(datasource);
    },

    refresh: () => {
        // gridOptions
        console.log('REFRESH');
        // const selectedNode = optimizerGrid.gridOptions.api.getSelectedNodes()[0]

        optimizerGrid.gridOptions.api.refreshInfiniteCache();
        // optimizerGrid.gridOptions.api.forEachNode((node) => {
        //     console.log(node.data)
        //     console.log(selectedNode.data)
        //     if (selectedNode && node.data.id == selectedNode.data.id) {
        //         node.setSelected(true, false);
        //     }
        // })
        // optimizerGrid.gridOptions.api.refreshInfiniteCache();
        // optimizerGrid.gridOptions.api.paginationGoToPage(0);
    },

    setPinnedHero: (hero) => {
        hero.eq = 0;
        optimizerGrid.gridOptions.api.setPinnedTopRowData([hero]);
        pinnedRow = hero;
        StatPreview.draw(pinnedRow, pinnedRow);
    },

    showLoadingOverlay: () => {
        optimizerGrid.gridOptions.api.showLoadingOverlay();
    },

    getSelectedGearIds,

    getSelectedGearMods,

    getSelectedRow: () => {
        const selectedRows = optimizerGrid.gridOptions.api.getSelectedRows();
        if (selectedRows.length > 0) {
            const row = selectedRows[0];
            console.log('getSelectedRow SELECTED ROW', row);

            return row;
        }
        return null;
    },

    getSelectedNode: () => {
        const selectedNodes = optimizerGrid.gridOptions.api.getSelectedNodes();
        if (selectedNodes.length > 0) {
            const node = selectedNodes[0];
            console.log('selectedNode SELECTED NODE', node);

            return node;
        }
        return null;
    },
};

function getSelectedGearIds() {
    const selectedRows = optimizerGrid.gridOptions.api.getSelectedRows();
    if (selectedRows.length > 0) {
        const row = selectedRows[0];
        console.log('getSelectedGearIds SELECTED ROW', row);

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

function getSelectedGearMods() {
    const selectedRows = optimizerGrid.gridOptions.api.getSelectedRows();
    if (selectedRows.length > 0) {
        const row = selectedRows[0];
        console.log('getSelectedGearModIds SELECTED ROW', row);

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

const datasource = {
    async getRows(params) {
        console.log('DEBUG getRows params', params);
        const { startRow } = params;
        const { endRow } = params;
        const sortColumn = params.sortModel.length
            ? params.sortModel[0].colId
            : null;
        const sortOrder = params.sortModel.length
            ? params.sortModel[0].sort
            : null;

        global.optimizerGrid = optimizerGrid;

        optimizerGrid.gridOptions.api.showLoadingOverlay();
        const heroId = document.getElementById('inputHeroAdd').value;
        const optimizationRequest = OptimizerTab.getOptimizationRequestParams();
        optimizationRequest.heroId = heroId;

        const request = {
            startRow,
            endRow,
            sortColumn,
            sortOrder,
            optimizationRequest,
        };

        request.executionId = OptimizerTab.getCurrentExecutionId();

        Api.getResultRows(request)
            .then((response) => {
                console.log('GetResultRowsResponse', response);
                aggregateCurrentHeroStats(response.heroStats);
                optimizerGrid.gridOptions.api.hideOverlay();
                params.successCallback(response.heroStats, response.maximum);

                const pinned = optimizerGrid.gridOptions.api.getPinnedTopRow(0);
                if (pinned) {
                    optimizerGrid.gridOptions.api.setPinnedTopRowData([
                        pinned.data,
                    ]);
                }
                return undefined;
            })
            .catch((e) => {
                console.error(e);
            });
    },
};

function aggregateCurrentHeroStats(heroStats) {
    // currentAggregate
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
    ];

    const count = heroStats.length;

    statsToAggregate.forEach((stat) => {
        const arrSum = (arr) => arr.reduce((a, b) => a + b[stat], 0);
        let max = Math.max(...getField(heroStats, stat));
        let min = Math.min(...getField(heroStats, stat));
        const sum = arrSum(heroStats);
        const avg = sum / count;

        if (stat === 'cr') {
            max = Math.min(100, max);
            min = Math.min(100, min);
        }
        if (stat === 'cd') {
            max = Math.min(350, max);
            min = Math.min(350, min);
        }

        currentAggregate[stat] = {
            max: cleanInfinities(max),
            min: cleanInfinities(min),
            sum: cleanInfinities(sum),
            avg: cleanInfinities(avg),
        };
    });

    console.log('Aggregated', currentAggregate);
}

function cleanInfinities(num) {
    if (num === -Infinity || num === Infinity) {
        return 0;
    }
    return num;
}

function getField(heroStats, stat) {
    return heroStats.map((x) => x[stat]);
}

function buildGrid(localeText) {
    const DIGITS_2 = 30;
    const DIGITS_3 = 34;
    const DIGITS_4 = 39;
    const DIGITS_5 = 45;
    const DIGITS_6 = 48;

    const gridOptions = {
        defaultColDef: {
            width: 50,
            sortable: true,
            sortingOrder: ['desc', 'asc'],
            cellStyle: columnGradient,
            // suppressNavigable: true,
            cellClass: 'no-border',
            // valueFormatter: numberFormatter,
        },

        columnDefs: [
            {
                headerName: i18next.t('sets'),
                field: 'sets',
                width: 80,
                cellRenderer: (params) =>
                    GridRenderer.renderSets(params.value, 'shrinkSets'),
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
            { headerName: i18next.t('eq'), field: 'eq', width: DIGITS_2 },
            {
                headerName: i18next.t('upg'),
                field: 'upgrades',
                width: DIGITS_2,
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
        rowSelection: 'single',
        onRowClicked,
        onRowSelected,
        pagination: true,
        paginationPageSize: 500,
        localeText,
        cacheBlockSize: 500,
        maxBlocksInCache: 1,
        suppressPaginationPanel: false,
        datasource,
        suppressScrollOnNewData: true,
        onCellMouseOver: cellMouseOver,
        onCellMouseOut: cellMouseOut,
        suppressCellSelection: true,
        enableRangeSelection: false,
        navigateToNextCell: GridRenderer.arrowKeyNavigator(
            this,
            'optimizerGrid',
        ),
        suppressDragLeaveHidesColumns: true,
    };

    const gridDiv = document.getElementById('myGrid');
    optimizerGrid = new Grid(gridDiv, gridOptions);
    console.log('Built optimizergrid', optimizerGrid);
}

function columnGradient(params) {
    try {
        if (!params || params.value === undefined) return undefined;
        const { colId } = params.column;
        const { value } = params;

        const agg = currentAggregate[colId];
        if (!agg) return undefined;

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
        console.error(e);
        return undefined;
    }
}

function onRowSelected(event) {
    console.log('row selected', event);
    if (!event.node.selected || event.rowPinned === 'top') return;

    selectedRow = event.data;
    StatPreview.draw(pinnedRow, selectedRow);

    const gearIds = getSelectedGearIds();
    const mods = getSelectedGearMods();
    OptimizerTab.drawPreview(gearIds, mods);
}

function onRowClicked(event) {
    console.log('row clicked', event);
    if (event.rowPinned !== 'top') return;

    selectedRow = event.data;
    StatPreview.draw(pinnedRow, selectedRow);

    optimizerGrid.gridOptions.api.deselectAll();
    const gearIds = [
        event.data.equipment.Weapon?.id,
        event.data.equipment.Helmet?.id,
        event.data.equipment.Armor?.id,
        event.data.equipment.Necklace?.id,
        event.data.equipment.Ring?.id,
        event.data.equipment.Boots?.id,
    ];
    OptimizerTab.drawPreview(gearIds, []);
}

function cellMouseOver(event) {
    const row = event.data;
    if (!row) return;

    StatPreview.draw(pinnedRow, row);
}

function cellMouseOut() {
    const row = selectedRow;
    if (!row) return;

    StatPreview.draw(pinnedRow, row);
}

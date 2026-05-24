/* global DarkMode, Api, $, ItemSimulator, Reforge, HtmlGenerator, Utils, GearRating, i18next */
/* global Dialog, ItemAugmenter, Notifier, ItemsGrid, Saves */
/* eslint-disable no-console */
import * as echarts from 'echarts';

const barsCharts = [undefined, undefined, undefined, undefined];
let guageChart;
let radarChart;
let gsChart;

// The item currently displayed in the Enhancing tab
let _currentItem = null;

// Deferred initializer — echarts.init() must not be called while the
// Enhancing tab is hidden (DOM elements have 0 width/height at that point,
// which triggers a console.error that surfaces as a Notifier popup).
let _chartsReady = false;
function _initCharts() {
    if (_chartsReady) return;
    // If the Enhancing section is not yet visible the container elements still
    // report clientWidth/clientHeight === 0.  Calling echarts.init() on them
    // logs a console.error.  Return WITHOUT setting _chartsReady so that the
    // next call (from the tab's change-event requestAnimationFrame) can
    // initialise properly once the browser has done its CSS layout pass.
    const sentinel = document.getElementById('chart1');
    if (sentinel && sentinel.clientWidth === 0 && sentinel.clientHeight === 0)
        return;
    _chartsReady = true;
    const theme = DarkMode.isDark() ? 'dark' : undefined;
    guageChart = echarts.init(document.getElementById('chart1'), theme);
    radarChart = echarts.init(document.getElementById('chart2'), theme);
    gsChart = echarts.init(document.getElementById('gsChart'), theme);
    ['stat1bars', 'stat2bars', 'stat3bars', 'stat4bars'].forEach((id, i) => {
        barsCharts[i] = echarts.init(document.getElementById(id), theme);
    });
}

const maxes = {
    Attack: 346 * 1.5,
    AttackPercent: 56,
    Defense: 264 * 1.5,
    DefensePercent: 56,
    Health: 1551 * 1.5,
    HealthPercent: 56,
    Speed: 28,
    CriticalHitChancePercent: 36,
    CriticalHitDamagePercent: 49,
    EffectivenessPercent: 56,
    EffectResistancePercent: 56,
};

const substatWeights = {
    AttackPercent: 1,
    DefensePercent: 1,
    HealthPercent: 1,
    EffectivenessPercent: 1,
    EffectResistancePercent: 1,
    Attack: 3.46 / 39,
    Health: 3.09 / 174,
    Defense: 4.99 / 31,
    CriticalHitDamagePercent: 8 / 7,
    CriticalHitChancePercent: 8 / 5,
    Speed: 8 / 4,
};

const statToReadableText = {
    Attack: 'Attack',
    AttackPercent: 'Attack %',
    Defense: 'Defense',
    DefensePercent: 'Defense %',
    Health: 'Health',
    HealthPercent: 'Health %',
    Speed: 'Speed',
    CriticalHitChancePercent: 'Crit Chance',
    CriticalHitDamagePercent: 'Crit Dmg',
    EffectivenessPercent: 'Eff',
    EffectResistancePercent: 'Eff Res',
};

function calculateMaxPossibleScore(item) {
    let total = 0;

    item.substats.forEach((substat) => {
        total += substat.reforgedMax * substatWeights[substat.type];
    });

    return total;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calculateScoreTotals(item) {
    let totalMin = 0;
    let totalRolled = 0;
    let totalMissing = 0;

    item.substats.forEach((substat) => {
        const min = Math.floor(substat.reforgedMin);
        const rolled =
            (item.level === 85 ? substat.reforgedValue : substat.value) -
            Math.floor(substat.reforgedMin);
        const missing =
            Math.floor(substat.reforgedMax) -
            (item.level === 85 ? substat.reforgedValue : substat.value);

        totalMin += min * substatWeights[substat.type];
        totalRolled += rolled * substatWeights[substat.type];
        totalMissing += missing * substatWeights[substat.type];
    });

    return {
        totalMin,
        totalRolled,
        totalMissing,
    };
}

function setTheme() {
    if (!echarts) {
        return;
    }
    const contrastColor = '#eee';
    function axisCommon() {
        return {
            axisLine: {
                lineStyle: {
                    color: contrastColor,
                },
            },
            axisTick: {
                lineStyle: {
                    color: contrastColor,
                },
            },
            axisLabel: {
                color: contrastColor,
            },
            splitLine: {
                lineStyle: {
                    type: 'dashed',
                    color: '#aaa',
                },
            },
            splitArea: {
                areaStyle: {
                    color: contrastColor,
                },
            },
        };
    }

    const colorPalette = [
        '#dd6b66',
        '#759aa0',
        '#e69d87',
        '#8dc1a9',
        '#ea7e53',
        '#eedd78',
        '#73a373',
        '#73b9bc',
        '#7289ab',
        '#91ca8c',
        '#f49f42',
    ];
    const theme = {
        color: colorPalette,
        backgroundColor: '#00000000',
        tooltip: {
            axisPointer: {
                lineStyle: {
                    color: contrastColor,
                },
                crossStyle: {
                    color: contrastColor,
                },
            },
        },
        legend: {
            textStyle: {
                color: contrastColor,
            },
        },
        textStyle: {
            color: contrastColor,
        },
        title: {
            textStyle: {
                color: contrastColor,
            },
        },
        toolbox: {
            iconStyle: {
                borderColor: contrastColor,
            },
        },
        dataZoom: {
            textStyle: {
                color: contrastColor,
            },
        },
        timeline: {
            lineStyle: {
                color: contrastColor,
            },
            itemStyle: {
                color: colorPalette[1],
            },
            label: {
                color: contrastColor,
            },
            controlStyle: {
                color: contrastColor,
                borderColor: contrastColor,
            },
        },
        timeAxis: axisCommon(),
        logAxis: axisCommon(),
        valueAxis: axisCommon(),
        categoryAxis: axisCommon(),

        line: {
            symbol: 'circle',
        },
        graph: {
            color: colorPalette,
        },
        gauge: {
            title: {
                color: contrastColor,
            },
        },
        candlestick: {
            itemStyle: {
                color: '#FD1050',
                color0: '#0CF49B',
                borderColor: '#FD1050',
                borderColor0: '#0CF49B',
            },
        },
    };
    theme.categoryAxis.splitLine.show = false;
    echarts.registerTheme('dark', theme);
}

const EnhancingTab = {
    initialize: async () => {
        setTheme();

        // Init charts only when the Enhancing tab becomes visible so that
        // echarts.init() always has a properly-sized container.
        // requestAnimationFrame defers until after the CSS display:block reflow
        // so clientWidth/clientHeight are non-zero when echarts.init() runs.
        document.getElementById('tab5').addEventListener('change', () => {
            requestAnimationFrame(() => {
                _initCharts();
                [guageChart, radarChart, gsChart, ...barsCharts].forEach(
                    (chart) => {
                        if (chart) chart.resize();
                    },
                );
            });
            // Refresh top reforge candidates whenever the Enhancing tab is opened
            redrawTopReforgeCandidates();
        });

        // ── Phase 3.1: Action button handlers ─────────────────────────────────
        document.getElementById('enhanceReforgeBtn')?.addEventListener('click', async () => {
            if (!_currentItem) return;
            const item = _currentItem;
            if (item.level !== 85 || item.enhance !== 15) {
                Notifier.warn('Only +15 level 85 gear can be reforged.');
                return;
            }
            if (Reforge.isGaveleets(item)) {
                Notifier.warn("Abyss lifesteal set (Gaveleet's) cannot be reforged.");
                return;
            }
            ItemAugmenter.augment([item]);
            const editedItem = await Dialog.editGearDialog(item, true, true);
            if (!editedItem) return;
            await Api.editItems([editedItem]);
            Notifier.quick('Reforged item');
            await ItemsGrid.editedItem();
            Saves.autoSave();
            // Refresh the enhancing view with the reforged item
            EnhancingTab.redrawEnhanceGuide(editedItem);
        });

        document.getElementById('enhanceViewItemsBtn')?.addEventListener('click', () => {
            // Switch to the Gear (items) tab
            $('#tab3').trigger('click');
        });

        // const getAllItemsResponse = await Api.getAllItems();
        // const items = getAllItemsResponse.items;
        // console.warn(items)
        // const item = items[900];

        // ItemAugmenter.augment([item])

        // document.getElementById('removeBuildSubmit').addEventListener("click", async () => {
        //     console.log("removeBuildSubmit");
        // });

        // // document.getElementById('tab2label').addEventListener("click", () => {
        // //     module.exports.redrawEnhanceGuide(item);
        // // });

        // module.exports.redrawEnhanceGuide(item);
    },

    // setItem: async (item) => {
    //     const html = HtmlGenerator.buildItemPanel(item, "enhanceTab", null, "Speed")
    //     document.getElementById("enhanceTabPreview").innerHTML = html;
    // },

    redrawEnhanceGuideFromRemoteId: async (itemId) => {
        return Api.getItemById(itemId)
            .then((x) => {
                // Switch to Enhancing tab FIRST so the panel becomes visible
                // and chart containers get non-zero dimensions.
                // The change listener schedules rAF #1 to call _initCharts().
                $('#tab5').trigger('click');
                // Schedule rAF #2 (runs after rAF #1) so charts are guaranteed
                // to be initialised before we try to set their options.
                requestAnimationFrame(() => {
                    EnhancingTab.redrawEnhanceGuide(x.item);
                });
                return undefined;
            })
            .catch((e) => {
                console.error(e);
            });
    },

    redrawEnhanceGuide: async (item) => {
        // _initCharts() is a no-op if already ready, and silently skips when
        // containers are 0-sized (tab not visible) thanks to the size guard.
        _initCharts();
        // If charts are still not ready (0-size guard fired), bail out.
        // redrawEnhanceGuideFromRemoteId() re-calls us after the tab is shown.
        if (!guageChart || !radarChart) return;

        // Store the item for action button handlers
        _currentItem = item;

        // Ensure archetype scores are populated
        ItemAugmenter.augment([item]);

        const simulationResults = ItemSimulator.simulate(item);
        setTheme();
        Reforge.calculateMaxes(item);
        console.log('redraw', item);

        // Show/hide action buttons
        const actionBtns = document.getElementById('enhanceActionButtons');
        if (actionBtns) actionBtns.style.display = 'flex';
        const reforgeBtn = document.getElementById('enhanceReforgeBtn');
        if (reforgeBtn) {
            // Enable only for +15 level 85 items that are not already reforged and not Gaveleet's
            const canReforge = item.level === 85 && item.enhance === 15 && !Reforge.isGaveleets(item);
            reforgeBtn.disabled = !canReforge;
            reforgeBtn.title = canReforge ? '' : 'Only +15 level 85 gear can be reforged';
        }

        const baseStats = null;
        const html = HtmlGenerator.buildItemPanel(
            item,
            'enhanceTab',
            baseStats,
            true,
        );
        document.getElementById('enhanceTabPreview').innerHTML = html;

        // Guage

        const maxScore = Math.floor(calculateMaxPossibleScore(item));
        const maxPerEnhance = [37, 47, 55, 65, 75, 85];
        const percent = Utils.round10ths((item.reforgedWss / maxScore) * 100);
        const gaugeOption = {
            tooltip: {
                formatter: '{a} <br/>{b} : {c}%',
            },
            series: [
                {
                    name: 'Rating',
                    type: 'gauge',
                    startAngle: 225,
                    radius: '90%',
                    endAngle: -45,
                    // max: 80,
                    max: maxPerEnhance[Math.floor(item.enhance / 3)],
                    splitNumber: 8,
                    detail: {
                        // formatter: '{value}',
                        formatter: `{value} / ${maxScore}\n ${percent}%`,
                        fontSize: 18,
                        lineHeight: 20,
                        offsetCenter: [0, '15%'],
                        color: DarkMode.isDark() ? '#f0f0f0' : '#363636',
                    },
                    axisLabel: {
                        color: DarkMode.isDark() ? '#f0f0f0' : '#363636',
                        formatter(value) {
                            return Math.round(value);
                        },
                    },
                    axisLine: {
                        lineStyle: {
                            width: 6,
                            color: [
                                [42.5 / 85, '#FF6E76'],
                                [53.13 / 85, '#ffb340'],
                                [63.77 / 85, '#FDDD60'],
                                [74.37 / 85, '#7CFFB2'],
                                [1, '#58D9F9'],
                            ],
                        },
                    },
                    title: {
                        offsetCenter: [0, '-10%'],
                        color: DarkMode.isDark() ? '#f0f0f0' : '#363636',
                    },
                    data: [
                        {
                            value: item.reforgedWss,
                            name: i18next.t('SCORE'),
                        },
                    ],
                    pointer: {
                        icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
                        length: '25%',
                        width: 20,
                        offsetCenter: [0, '-40%'],
                        itemStyle: {
                            color: 'auto',
                        },
                    },
                    tooltip: {
                        trigger: false,
                        formatter(value) {
                            return `asdffsd${value}`;
                        },
                    },
                },
            ],
        };

        guageChart.setOption(gaugeOption);

        // Stats

        // Speed
        // var speedStats = item.substats.filter(x => x.type == "Speed")
        // var roundedEnhance = Math.floor(item.enhance / 3) * 3;
        // var maxSpeed = 0;
        // if (speedStats.length > 0) {
        //     var speedStat = speedStats[0];
        //     var rolls = speedStat.rolls;
        //     var enhance = item.enhance;
        //     var rollsLeft = Math.ceil(15 - item.enhance)/3;

        //     var potentialRolls = Constants.speedByItemTypeAlreadyRolled[item.rank][roundedEnhance];

        //     var reforgedValue = item.level == 90 ? speedStat.value : speedStat.reforgedValue;

        //     console.warn(reforgedValue)
        //     console.warn(Constants.speedRollsToValue[potentialRolls + rolls] - Constants.speedRollsToValue[rolls])
        //     console.warn("------------------------")
        //     maxSpeed = reforgedValue + potentialRolls * 4 + (item.level == 85 ? Constants.speedRollsToValue[potentialRolls + rolls] - Constants.speedRollsToValue[rolls] : 0);
        // } else {
        //     var potentialRolls = Constants.speedByItemTypeNotYetRolled[item.rank][roundedEnhance];
        //     maxSpeed = potentialRolls * 4 + (item.level == 85 ? Constants.speedRollsToValue[potentialRolls] : 0);

        //     console.warn(potentialRolls)
        //     console.warn(Constants.speedRollsToValue[potentialRolls])
        //     console.warn("------------------------")
        // }

        // leftText += "Max speed: <br>";
        // rightText += maxSpeed + "<br>";

        // Score

        // var scores = calculateScoreTotals(item)

        // leftText += "Score: <br>";
        // rightText += item.reforgedWss + "<br>";

        // leftText += "Score: <br>";
        // rightText += maxScore + "<br>";

        // leftText += "Dps score: <br>";
        // rightText += item.dpsWss + "<br>";

        // leftText += "Support score: <br>";
        // rightText += item.supportWss + "<br>";

        // leftText += "Combat score: <br>";
        // rightText += item.combatWss + "<br>";

        //

        // $('#statsLeft').html(leftText)
        // $('#statsRight').html(rightText)

        // Radar — archetype scores

        const arcScores = (item.archetypeScores && item.archetypeScores.allScores) || null;
        if (arcScores && Object.keys(arcScores).length > 0) {
            const entries = Object.entries(arcScores).filter(([, v]) => v.score > 0);
            const maxScore = entries.reduce((m, [, v]) => Math.max(m, v.score), 1);
            const radarIndicators = entries.map(([name]) => ({ name, max: maxScore }));
            const radarValues = entries.map(([, v]) => v.score);

            const radarOption = {
                tooltip: { trigger: 'item' },
                radar: {
                    indicator: radarIndicators,
                    radius: '65%',
                    name: { fontSize: 10 },
                },
                series: [
                    {
                        name: i18next.t('Archetypes'),
                        type: 'radar',
                        areaStyle: { opacity: 0.3 },
                        data: [
                            {
                                value: radarValues,
                                name: i18next.t('Archetypes'),
                            },
                        ],
                    },
                ],
            };
            radarChart.setOption(radarOption);
        } else {
            // Fallback to old GearRating radar
            const ratings = GearRating.rate(item);
            ratings.forEach((x) => { x.max = 2; });
            const radarOption = {
                radar: { indicator: ratings },
                tooltip: { trigger: 'item' },
                series: [{
                    name: 'Scores',
                    type: 'radar',
                    areaStyle: {},
                    data: [{ value: ratings.map((x) => Utils.round100ths(x.score)), name: i18next.t('Archetypes') }],
                }],
            };
            radarChart.setOption(radarOption);
        }

        // GS

        function generateLineArr(gsArr, minVal, maxVal) {
            const xArr = [];
            const yArr = [];
            let count = 0;
            for (let i = minVal; i <= maxVal; i += 1) {
                xArr[count] = i;
                yArr[count] = 0;
                count += 1;
            }
            gsArr.forEach((result) => {
                const index = result - minVal;
                yArr[index] += 1;
            });

            const n = ItemSimulator.getSimulationN();
            for (let i = 0; i < yArr.length; i += 1) {
                yArr[i] = (yArr[i] / n) * 100;
            }

            if (item.enhance >= 15) {
                for (let i = 0; i <= yArr.length; i += 1) {
                    if (yArr[i] === 0) {
                        yArr[i] = undefined;
                    }
                }
            }
            return {
                xArr,
                yArr,
            };
        }

        if (item.enhance < 16) {
            const gs = simulationResults.gsArr;
            const moddedGs = simulationResults.moddedGsArr;

            const min = Math.min(Math.min(...gs), Math.min(...moddedGs)) - 1;
            const max = Math.max(Math.max(...gs), Math.max(...moddedGs)) + 1;

            const gsSeries = generateLineArr(gs, min, max);
            const moddedGsSeries = generateLineArr(moddedGs, min, max);

            const gsOption = {
                xAxis: {
                    type: 'category',
                    name: 'Gear score',
                    data: gsSeries.xArr,
                },
                yAxis: [
                    {
                        type: 'value',
                        name: '% chance',
                        tickAmount: 16,
                        // ...
                    },
                ],
                legend: {
                    data: [
                        'GS probabilities',
                        'GS probabilities with max substat mod',
                    ],
                },
                series: [
                    {
                        name: 'GS probabilities',
                        data: gsSeries.yArr,
                        type: item.enhance >= 15 ? 'scatter' : 'line',
                        areaStyle: {},
                        smooth: true,
                    },
                    {
                        name: 'GS probabilities with max substat mod',
                        data: moddedGsSeries.yArr,
                        type: item.enhance >= 15 ? 'scatter' : 'line',
                        areaStyle: {},
                        smooth: true,
                        lineStyle: { color: '#71de7c' },
                        itemStyle: { color: '#71de7c' },
                    },
                ],
            };
            // option.yaxis.labels.formatter = val => val.toFixed(2)
            gsChart.setOption(gsOption);
        }
        // Bars

        function buildBars(id, showAxis, index) {
            const stat = item.substats[index];
            if (!stat) return;

            // var min = Utils.round100ths(stat.reforgedMin / stat.reforgedMax);
            // var rolled = Utils.round100ths(((item.min == 85 ? stat.reforgedValue : stat.value) - stat.reforgedMin) / (stat.reforgedMax));
            // var missing = Utils.round100ths(1 - min - rolled);

            const min = Utils.round10ths(Math.floor(stat.reforgedMin));
            // For reforgeable items (level 85, +15, not yet reforged to 90)
            // split the 'remaining' segment into reforge bonus + true remaining
            const isReforgeable = item.reforgeable === 1;
            const currentVal = item.level === 85 ? stat.reforgedValue : stat.value;
            const rolled = Utils.round10ths(currentVal - Math.floor(stat.reforgedMin));
            const reforgeBonus = isReforgeable
                ? Utils.round10ths(Math.max(0, stat.reforgedValue - stat.value))
                : 0;
            const effectiveVal = isReforgeable ? stat.reforgedValue : currentVal;
            const missing = Utils.round10ths(
                Math.floor(stat.reforgedMax) - effectiveVal,
            );

            const totalCurrent = min + rolled + (isReforgeable ? reforgeBonus : 0);
            const totalMax = min + rolled + (isReforgeable ? reforgeBonus : 0) + missing;
            const barLabel = `    ${totalCurrent} / ${totalMax}   (${Utils.round100ths(
                (totalCurrent / totalMax) * 100,
            )} %)`;

            const option = {
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        // Use axis to trigger tooltip
                        type: 'shadow', // 'shadow' as default; can also be 'line' or 'shadow'
                    },
                },
                grid: {
                    left: '10%',
                },
                xAxis: {
                    show: false,
                    minInterval: 10000,
                    type: 'value',
                    max: maxes[stat.type],
                    min: 0,
                    axisLabel: {
                        formatter: (x) => {
                            return parseFloat(x);
                        },
                    },
                },
                yAxis: {
                    type: 'category',
                    data: [i18next.t(statToReadableText[stat.type])],
                },
                series: [
                    {
                        type: 'bar',
                        stack: 'total',
                        name: i18next.t('Minimum possible stats'),
                        label: {
                            show: !(min < 1),
                            position: 'inside',
                            fontSize: 10,
                            overflow: 'truncate',
                        },
                        itemStyle: {
                            color: '#f2f2f2',
                        },
                        data: [min],
                    },
                    {
                        type: 'bar',
                        stack: 'total',
                        name: i18next.t('Rolled stats'),
                        label: {
                            show: !(rolled < 1),
                            position: 'inside',
                            fontSize: 10,
                            overflow: 'truncate',
                        },
                        itemStyle: {
                            color: '#8bde87',
                        },
                        data: [rolled],
                    },
                    {
                        type: 'bar',
                        stack: 'total',
                        name: i18next.t('Reforge bonus'),
                        label: {
                            show: reforgeBonus > 0,
                            position: 'inside',
                            fontSize: 10,
                            overflow: 'truncate',
                        },
                        itemStyle: {
                            color: '#7ec8e3',
                        },
                        data: [reforgeBonus],
                    },
                    {
                        type: 'bar',
                        name: i18next.t('Missing potential stats'),
                        stack: 'total',
                        label: {
                            show: !(missing < 1),
                            position: 'inside',
                            fontSize: 10,
                            overflow: 'truncate',
                        },
                        itemStyle: {
                            color: '#f5bea9',
                        },
                        data: [missing],
                    },
                    {
                        type: 'bar',
                        stack: 'total',
                        tooltip: {
                            show: false,
                        },
                        label: {
                            show: true,
                            position: 'right',
                            // position: stat.type == "Health" && missing > 50 ? 'right' : 'inside',
                            fontSize: 10,
                            color: DarkMode.isDark() ? '#f0f0f0' : '#363636',
                            formatter: function x() {
                                return barLabel;
                            },
                        },
                        itemStyle: {
                            color: '#f5bea9',
                        },
                        data: [0],
                    },
                ],
            };

            barsCharts[index].setOption(option);
        }

        barsCharts.forEach((x) => {
            if (x) {
                x.clear();
            }
        });

        buildBars('stat1bars', false, 0);
        buildBars('stat2bars', false, 1);
        buildBars('stat3bars', false, 2);
        buildBars('stat4bars', true, 3);
    },
};

// ── Phase 3.2: Top reforge candidates ────────────────────────────────────────
async function redrawTopReforgeCandidates() {
    const listEl = document.getElementById('topReforgeCandidatesList');
    if (!listEl) return;
    listEl.innerHTML = '<span style="color:#aaa;font-size:11px;">Loading...</span>';

    try {
        const response = await Api.getAllItems();
        const items = response.items;
        ItemAugmenter.augment(items);

        // Filter to items that are reforgeable now (+15 level 85) and sort by delta score
        const candidates = items
            .filter((x) => x.reforgeable === 1 && typeof x.reforgedWss === 'number' && typeof x.wss === 'number')
            .map((x) => ({ item: x, delta: Math.round(x.reforgedWss - x.wss) }))
            .filter((x) => x.delta > 0)
            .sort((a, b) => b.delta - a.delta)
            .slice(0, 15);

        if (candidates.length === 0) {
            listEl.innerHTML = '<span style="color:#aaa;font-size:11px;">No reforgeable candidates found.</span>';
            return;
        }

        const rows = candidates.map(({ item, delta }) => {
            const name = `${item.set} ${item.gear} (${item.main && item.main.type ? item.main.type.replace('Percent', '%') : ''})`;
            const bestArch = (item.archetypeScores && item.archetypeScores.bestOfficialArchetype) || '';
            return `<div class="topCandidateRow" style="display:flex;gap:8px;align-items:center;padding:2px 0;font-size:11px;">
                <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${name}">${name}</span>
                <span style="color:#7ec8e3;min-width:40px;text-align:right;">+${delta} GS</span>
                <span style="color:#aaa;min-width:70px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap;" title="${bestArch}">${bestArch}</span>
                <button style="font-size:10px;padding:1px 4px;" onclick="EnhancingTab.redrawEnhanceGuideFromRemoteId('${item.id}')">View</button>
            </div>`;
        });

        listEl.innerHTML = rows.join('');
    } catch (e) {
        listEl.innerHTML = '<span style="color:#f88;font-size:11px;">Error loading items.</span>';
        console.error('redrawTopReforgeCandidates error', e);
    }
}

export default EnhancingTab;

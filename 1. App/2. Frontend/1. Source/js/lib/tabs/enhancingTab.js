/* global DarkMode, Api, $, ItemSimulator, Reforge, HtmlGenerator, Utils, GearRating, i18next */
/* eslint-disable no-console */
import * as echarts from 'echarts';

const barsCharts = [undefined, undefined, undefined, undefined];
let gaugeChart;
let radarChart;
let gsChart;

// Deferred initializer — echarts.init() must not be called while the
// Enhancing tab is hidden (DOM elements have 0 width/height at that point,
// which triggers a console.error that surfaces as a Notifier popup).
let _chartsReady = false;
function _initCharts() {
    if (_chartsReady) return;
    console.log('[EnhancingTab] _initCharts: initializing charts');
    // If the Enhancing section is not yet visible the container elements still
    // report clientWidth/clientHeight === 0.  Calling echarts.init() on them
    // logs a console.error.  Return WITHOUT setting _chartsReady so that the
    // next call (from the tab's change-event requestAnimationFrame) can
    // initialise properly once the browser has done its CSS layout pass.
    const sentinel = document.getElementById('chart1');
    if (sentinel && sentinel.clientWidth === 0 && sentinel.clientHeight === 0) {
        console.log('[EnhancingTab] _initCharts: container not visible yet, deferring');
        return;
    }
    _chartsReady = true;
    const theme = DarkMode.isDark() ? 'dark' : undefined;
    gaugeChart = echarts.init(document.getElementById('chart1'), theme);
    radarChart = echarts.init(document.getElementById('chart2'), theme);
    gsChart    = echarts.init(document.getElementById('gsChart'),  theme);
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
        console.log('[EnhancingTab] initialize');
        setTheme();

        // Init charts only when the Enhancing tab becomes visible so that
        // echarts.init() always has a properly-sized container.
        // requestAnimationFrame defers until after the CSS display:block reflow
        // so clientWidth/clientHeight are non-zero when echarts.init() runs.
        document.getElementById('tab5').addEventListener('change', () => {
            requestAnimationFrame(() => {
                _initCharts();
                [gaugeChart, radarChart, gsChart, ...barsCharts].forEach((chart) => {
                    if (chart) chart.resize();
                });
            });
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
        if (!gaugeChart || !radarChart) return;
        const simulationResults = ItemSimulator.simulate(item);
        setTheme();
        Reforge.calculateMaxes(item);
        console.log('redraw', item);
        console.log('[EnhancingTab] redrawEnhanceGuide item:', item && item.id, item && item.gear, item && item.set);

        const baseStats = null;
        const html = HtmlGenerator.buildItemPanel(
            item,
            'enhanceTab',
            baseStats,
            true
        );
        document.getElementById('enhanceTabPreview').innerHTML = html;

        // Guage

        const maxScore = Math.floor(calculateMaxPossibleScore(item));
        const maxPerEnhance = [40, 48, 56, 64, 72, 80];
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
                                [40 / 80, '#FF6E76'],
                                [50 / 80, '#ffb340'],
                                [60 / 80, '#FDDD60'],
                                [70 / 80, '#7CFFB2'],
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

        gaugeChart.setOption(gaugeOption, { notMerge: true });

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

        // Archetype Bar Chart

        const ratings = GearRating.rate(item);
        const top10 = ratings.slice(0, 10);
        const barOption = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
            },
            grid: {
                left: '3%',
                right: '12%',
                bottom: '3%',
                top: '3%',
                containLabel: true,
            },
            xAxis: { type: 'value', min: 0 },
            yAxis: {
                type: 'category',
                data: top10.map((x) => x.name).reverse(),
                axisLabel: { fontSize: 11 },
            },
            series: [
                {
                    name: i18next.t('Archetypes'),
                    type: 'bar',
                    data: top10.map((x) => Utils.round100ths(x.score)).reverse(),
                    label: { show: true, position: 'right', fontSize: 10 },
                },
            ],
        };

        radarChart.setOption(barOption, true);

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
                for (let i = 0; i < yArr.length; i += 1) {
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

        function buildBars(index) {
            const stat = item.substats[index];
            if (!stat) return;

            // var min = Utils.round100ths(stat.reforgedMin / stat.reforgedMax);
            // var rolled = Utils.round100ths(((item.min == 85 ? stat.reforgedValue : stat.value) - stat.reforgedMin) / (stat.reforgedMax));
            // var missing = Utils.round100ths(1 - min - rolled);

            const min = Utils.round10ths(Math.floor(stat.reforgedMin));
            const rolled = Utils.round10ths(
                (item.level === 85 ? stat.reforgedValue : stat.value) -
                    Math.floor(stat.reforgedMin)
            );
            const missing = Utils.round10ths(
                Math.floor(stat.reforgedMax) -
                    (item.level === 85 ? stat.reforgedValue : stat.value)
            );

            const barLabel = `    ${min + rolled} / ${
                min + rolled + missing
            }   (${Utils.round100ths(
                ((min + rolled) / (min + rolled + missing)) * 100
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
                            // position: stat.type == "Health" && rolled > 50 ? 'left' : 'inside',
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
                        name: i18next.t('Missing potential stats'),
                        stack: 'total',
                        label: {
                            show: !(missing < 1),
                            position: 'inside',
                            // position: stat.type == "Health" && missing > 50 ? 'right' : 'inside',
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

        buildBars(0);
        buildBars(1);
        buildBars(2);
        buildBars(3);
    },
};

export default EnhancingTab;

import tinygradient from 'tinygradient';

/* global Settings */

/*

default
bg = #212529
text = #e2e2e2
accent = #F84C48
textbox/button #2D3136

text #e2e2e2
red f84c48
neutral 212529
green  00be9b


*/

function LightenDarkenColor(col, amt) {
    const usePound = col.startsWith('#');
    const str = usePound ? col.slice(1) : col;

    const num = parseInt(str, 16);

    let r = Math.floor(num / 65536) + amt;

    if (r > 255) r = 255;
    else if (r < 0) r = 0;

    let b = (Math.floor(num / 256) % 256) + amt;

    if (b > 255) b = 255;
    else if (b < 0) b = 0;

    let g = (num % 256) + amt;

    if (g > 255) g = 255;
    else if (g < 0) g = 0;

    return (usePound ? '#' : '') + (g + b * 256 + r * 65536).toString(16);
}

const myColors = {
    bad: '#5A1A06',
    neutral: '#343127',
    good: '#38821F',
};
global.myColors = myColors;

const userGradient = {
    gradient: tinygradient([
        { color: myColors.bad, pos: 0 }, // red
        { color: myColors.neutral, pos: 0.5 },
        { color: myColors.good, pos: 1 }, // green
    ]),
};

const darkUserGradient = {
    gradient: tinygradient(myColors.good, myColors.neutral),
};
global.darkUserGradient = darkUserGradient;

const ColorPicker = {
    redraw: () => {
        userGradient.gradient = tinygradient([
            { color: myColors.bad, pos: 0 }, // red
            { color: myColors.neutral, pos: 0.5 },
            { color: myColors.good, pos: 1 }, // green
        ]);

        try {
            global.itemsGrid.gridOptions.api.redrawRows();
            global.buildsGrid.gridOptions.api.redrawRows();
            global.optimizerGrid.gridOptions.api.redrawRows();
        } catch (_e) {
            /* no-op */
        }
    },
    loadColorSettings: (settings) => {
        if (settings.settingBackgroundColor) {
            document.documentElement.style.setProperty(
                '--bg-color',
                settings.settingBackgroundColor
            );
            document.getElementById('backgroundColorPicker').value =
                settings.settingBackgroundColor;
        }
        if (settings.settingTextColorPicker) {
            document.documentElement.style.setProperty(
                '--font-color',
                settings.settingTextColorPicker
            );
            document.documentElement.style.setProperty(
                '--inactive-color',
                `${settings.settingTextColorPicker}3f`
            );
            document.getElementById('textColorPicker').value =
                settings.settingTextColorPicker;
        }
        if (settings.settingAccentColorPicker) {
            document.documentElement.style.setProperty(
                '--accent-color',
                settings.settingAccentColorPicker
            );
            document.documentElement.style.setProperty(
                '--outline-color',
                `${settings.settingAccentColorPicker}60`
            );
            document.getElementById('accentColorPicker').value =
                settings.settingAccentColorPicker;
        }
        if (settings.settingInputColorPicker) {
            document.documentElement.style.setProperty(
                '--input-color',
                settings.settingInputColorPicker
            );
            document.documentElement.style.setProperty(
                '--btn-color',
                settings.settingInputColorPicker
            );
            document.getElementById('inputColorPicker').value =
                settings.settingInputColorPicker;
        }
        if (settings.settingGridTextColorPicker) {
            document.documentElement.style.setProperty(
                '--grid-font-color',
                settings.settingGridTextColorPicker
            );
            document.getElementById('gridTextColorPicker').value =
                settings.settingGridTextColorPicker;
        }
        if (settings.settingRedColorPicker) {
            document.getElementById('redColorPicker').value =
                settings.settingRedColorPicker;
            myColors.bad = settings.settingRedColorPicker;

            ColorPicker.redraw();
        }
        if (settings.settingNeutralColorPicker) {
            myColors.neutral = settings.settingNeutralColorPicker;
            document.getElementById('neutralColorPicker').value =
                settings.settingNeutralColorPicker;

            ColorPicker.redraw();
        }
        if (settings.settingGreenColorPicker) {
            document.documentElement.style.setProperty(
                '--accent-green',
                settings.settingGreenColorPicker
            );
            myColors.good = settings.settingGreenColorPicker;
            document.getElementById('greenColorPicker').value =
                settings.settingGreenColorPicker;
            // darkUserGradient.gradient = tinygradient(LightenDarkenColor(myColors.good, 60), myColors.good);

            darkUserGradient.gradient = tinygradient(
                myColors.neutral,
                myColors.good
            );

            ColorPicker.redraw();
        }
    },

    initialize: () => {
        const bgColor = document.getElementById('backgroundColorPicker');
        const textColor = document.getElementById('textColorPicker');
        const accentColor = document.getElementById('accentColorPicker');
        const inputColor = document.getElementById('inputColorPicker');
        const gridTextColorPicker = document.getElementById(
            'gridTextColorPicker'
        );
        const redColor = document.getElementById('redColorPicker');
        const neutralColor = document.getElementById('neutralColorPicker');
        const greenColor = document.getElementById('greenColorPicker');

        const settingsToChange = [
            'backgroundColorPicker',
            'textColorPicker',
            'accentColorPicker',
            'inputColorPicker',
            'gridTextColorPicker',
            'redColorPicker',
            'neutralColorPicker',
            'greenColorPicker',
        ];

        settingsToChange.forEach((toChange) => {
            document.getElementById(toChange).addEventListener(
                'change',
                () => {
                    Settings.saveSettings();
                },
                false
            );
        });

        // const defaults = {
        //     backgroundColorPickerText: ["#212529", "backgroundColorPicker"],
        //     textColorPickerText: ["#E2E2E2", "textColorPicker"],
        //     accentColorPickerText: ["#F84C48", "accentColorPicker"],
        //     textboxColorPickerText: ["#2D3136", "inputColorPicker"],
        //     // gridTextColorPickerText: ["#e2e2e2", redColor],
        //     gridRedColorPickerText: ["#f84c48", "redColorPicker"],
        //     gridNeutralColorPickerText: ["#212529", "neutralColorPicker"],
        //     gridGreenColorPickerText: ["#00be9b", "greenColorPicker"]
        // }

        // for (label of Object.keys(defaults)) {
        //     const value = defaults[label];

        //     document.getElementById(label).addEventListener("click", (ev) => {
        //         document.documentElement.style.setProperty('--bg-color', value[0]);
        //         document.getElementById(value[]).value = value[0];
        //     }, false);

        // }

        document.getElementById('backgroundColorPickerText').addEventListener(
            'click',
            () => {
                document.documentElement.style.setProperty(
                    '--bg-color',
                    '#212529'
                );
                document.getElementById('backgroundColorPicker').value =
                    '#212529';
                Settings.saveSettings();
            },
            false
        );

        document.getElementById('textColorPickerText').addEventListener(
            'click',
            () => {
                document.documentElement.style.setProperty(
                    '--font-color',
                    '#E2E2E2'
                );
                document.documentElement.style.setProperty(
                    '--inactive-color',
                    '#E2E2E23f'
                );
                document.getElementById('textColorPicker').value = '#E2E2E2';
                Settings.saveSettings();
            },
            false
        );

        document.getElementById('accentColorPickerText').addEventListener(
            'click',
            () => {
                document.documentElement.style.setProperty(
                    '--accent-color',
                    '#F84C48'
                );
                document.documentElement.style.setProperty(
                    '--outline-color',
                    '#F84C4860'
                );
                document.getElementById('accentColorPicker').value = '#F84C48';
                Settings.saveSettings();
            },
            false
        );

        document.getElementById('textboxColorPickerText').addEventListener(
            'click',
            () => {
                document.documentElement.style.setProperty(
                    '--input-color',
                    '#2D3136'
                );
                document.documentElement.style.setProperty(
                    '--btn-color',
                    '#2D3136'
                );
                document.getElementById('inputColorPicker').value = '#2D3136';
                Settings.saveSettings();
            },
            false
        );

        document.getElementById('gridTextColorPickerText').addEventListener(
            'click',
            () => {
                document.documentElement.style.setProperty(
                    '--grid-font-color',
                    '#E2E2E2'
                );
                document.getElementById('gridTextColorPicker').value =
                    '#E2E2E2';
                Settings.saveSettings();
            },
            false
        );

        document.getElementById('gridRedColorPickerText').addEventListener(
            'click',
            () => {
                // document.documentElement.style.setProperty('--accent-red', '#5A1A06');
                document.getElementById('redColorPicker').value = '#5A1A06';
                myColors.bad = '#5A1A06';

                ColorPicker.redraw();
                Settings.saveSettings();
            },
            false
        );

        document.getElementById('gridNeutralColorPickerText').addEventListener(
            'click',
            () => {
                myColors.neutral = '#343127';
                document.getElementById('neutralColorPicker').value = '#343127';

                ColorPicker.redraw();
                Settings.saveSettings();
            },
            false
        );

        document.getElementById('gridGreenColorPickerText').addEventListener(
            'click',
            () => {
                document.documentElement.style.setProperty(
                    '--accent-green',
                    '#00BE9B'
                );
                myColors.good = '#38821F';
                document.getElementById('greenColorPicker').value = '#38821F';
                // darkUserGradient.gradient = tinygradient(LightenDarkenColor(myColors.good, 60), myColors.good);

                darkUserGradient.gradient = tinygradient(
                    myColors.neutral,
                    myColors.good
                );

                ColorPicker.redraw();
                Settings.saveSettings();
            },
            false
        );

        bgColor.addEventListener(
            'input',
            (ev) => {
                document.documentElement.style.setProperty(
                    '--bg-color',
                    ev.target.value
                );
            },
            false
        );

        textColor.addEventListener(
            'input',
            (ev) => {
                document.documentElement.style.setProperty(
                    '--font-color',
                    ev.target.value
                );
                document.documentElement.style.setProperty(
                    '--inactive-color',
                    `${ev.target.value}3f`
                );
            },
            false
        );

        accentColor.addEventListener(
            'input',
            (ev) => {
                document.documentElement.style.setProperty(
                    '--accent-color',
                    ev.target.value
                );
                document.documentElement.style.setProperty(
                    '--outline-color',
                    `${ev.target.value}60`
                );
            },
            false
        );

        inputColor.addEventListener(
            'input',
            (ev) => {
                document.documentElement.style.setProperty(
                    '--input-color',
                    ev.target.value
                );
                document.documentElement.style.setProperty(
                    '--btn-color',
                    ev.target.value
                );
            },
            false
        );

        gridTextColorPicker.addEventListener(
            'input',
            (ev) => {
                document.documentElement.style.setProperty(
                    '--grid-font-color',
                    ev.target.value
                );
            },
            false
        );

        redColor.addEventListener(
            'change',
            (ev) => {
                // document.documentElement.style.setProperty('--accent-red', ev.target.value);
                myColors.bad = ev.target.value;

                userGradient.gradient = tinygradient([
                    { color: myColors.bad, pos: 0 }, // red
                    { color: myColors.neutral, pos: 0.5 },
                    { color: myColors.good, pos: 1 }, // green
                ]);

                try {
                    global.itemsGrid.gridOptions.api.redrawRows();
                    global.buildsGrid.gridOptions.api.redrawRows();
                    global.optimizerGrid.gridOptions.api.redrawRows();
                } catch (_e) {
                    /* no-op */
                }

                // add red value for the grids
            },
            false
        );

        neutralColor.addEventListener(
            'change',
            (ev) => {
                myColors.neutral = ev.target.value;

                userGradient.gradient = tinygradient([
                    { color: myColors.bad, pos: 0 }, // red
                    { color: myColors.neutral, pos: 0.5 },
                    { color: myColors.good, pos: 1 }, // green
                ]);

                try {
                    global.itemsGrid.gridOptions.api.redrawRows();
                    global.buildsGrid.gridOptions.api.redrawRows();
                    global.optimizerGrid.gridOptions.api.redrawRows();
                } catch (_e) {
                    /* no-op */
                }

                // add middle value for the grids
            },
            false
        );

        greenColor.addEventListener(
            'change',
            (ev) => {
                // document.documentElement.style.setProperty('--accent-green', ev.target.value);
                myColors.good = ev.target.value;

                userGradient.gradient = tinygradient([
                    { color: myColors.bad, pos: 0 }, // red
                    { color: myColors.neutral, pos: 0.5 },
                    { color: myColors.good, pos: 1 }, // green
                ]);

                darkUserGradient.gradient = tinygradient(
                    LightenDarkenColor(myColors.good, 60),
                    myColors.good
                );

                try {
                    global.itemsGrid.gridOptions.api.redrawRows();
                    global.buildsGrid.gridOptions.api.redrawRows();
                    global.optimizerGrid.gridOptions.api.redrawRows();
                } catch (_e) {
                    /* no-op */
                }

                // add green value for the grids
            },
            false
        );
    },

    getColors: () => {
        return userGradient;
    },

    get2Colors: () => {
        return darkUserGradient;
    },
};

export default ColorPicker;

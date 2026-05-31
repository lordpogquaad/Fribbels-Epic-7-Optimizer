/* global $, Files, Notifier, GearRating, Saves, DarkMode, ColorPicker, Updater, Api, HeroData, FlatStatCalibration */

import * as remote from '@electron/remote';

const { dialog } = remote;
const currentWindow = remote.getCurrentWindow();
const documentsPath = remote.app.getPath('documents');
const savesFolder = `${documentsPath}/FribbelsOptimizerSaves`;

const defaultPath = savesFolder;

const settingsPath = `${defaultPath}/settings.ini`;
let pathOverride;

let excludeSelects = [];
let defaultOptimizerSettings = {
    settingDefaultUseReforgedStats: true,
    settingDefaultUseHeroPriority: false,
    settingDefaultUseSubstatMods: false,
    settingDefaultLockedItems: false,
    settingDefaultEquippedItems: false,
    settingDefaultKeepCurrent: false,
};

function formatNumbersOnKey(event) {
    // When user select text in the document, also abort.
    const selection = window.getSelection().toString();
    if (selection !== '') {
        return;
    }
    // When the arrow keys are pressed, abort.
    if ($.inArray(event.keyCode, [38, 40, 37, 39]) !== -1) {
        return;
    }
    const $this = $(this);
    // Get the value.
    let input = $this.val();
    input = input.replace(/[\D\s._-]+/g, '');
    input = input ? parseInt(input, 10) : 0;
    $this.val(() => (input === 0 ? '' : input.toLocaleString('en-US')));
}

const Settings = {
    initialize: async () => {
        await Settings.loadSettings();

        // Format numbers
        $('#settingMaxResults').on('keyup', formatNumbersOnKey);
        $('#settingMaxRamGb').on('keyup', formatNumbersOnKey);
        $('#settingPenDefense').on('keyup', formatNumbersOnKey);
        $('#settingLocatorWidth').on('keyup', formatNumbersOnKey);

        const settingsIds = [
            'settingGpu',
            'settingUnlockOnUnequip',
            'settingMaxResults',
            'settingMaxRamGb',
            'settingPenDefense',
            'settingLocatorWidth',
            'settingRageSet',
            'settingPenSet',
            'settingDefaultUseReforgedStats',
            'settingDefaultUseHeroPriority',
            'settingDefaultUseSubstatMods',
            'settingDefaultLockedItems',
            'settingDefaultEquippedItems',
            'settingDefaultKeepCurrent',
        ];

        $('#optionsExcludeGearFrom').change(Settings.saveSettings);
        $('#optionsEnhanceLimit').change(Settings.saveSettings);
        $('#darkSlider').change(Settings.saveSettings);

        settingsIds.forEach((id) => {
            document.getElementById(id).addEventListener('change', () => {
                Settings.saveSettings();
            });
        });

        document
            .getElementById('selectDefaultFolderSubmit')
            .addEventListener('click', async () => {
                const options = {
                    title: 'Open folder',
                    defaultPath: Settings.getDefaultPath(),
                    buttonLabel: 'Open folder',
                    properties: ['openDirectory'],
                };

                const filenames = dialog.showOpenDialogSync(
                    currentWindow,
                    options,
                );

                if (!filenames || filenames.length < 1) {
                    return;
                }

                const path = Files.path(filenames[0]);
                pathOverride = path;
                Settings.saveSettings();
                $('#selectDefaultFolderSubmitOutputText').text(
                    `New saves folder: ${path}`,
                );

                Notifier.info(path);
            });

        function _updateCalibrationStatus() {
            const w = FlatStatCalibration.getWeights();
            const isCalibrated = FlatStatCalibration.isCalibrated();
            const msg = isCalibrated
                ? `Calibrated: Atk=${w.atk.toFixed(2)}, HP=${w.hp.toFixed(2)}, Def=${w.def.toFixed(2)}`
                : `Using defaults: Atk=${w.atk.toFixed(2)}, HP=${w.hp.toFixed(2)}, Def=${w.def.toFixed(2)}`;
            document.getElementById('calibrateFlatStatsResult').textContent =
                msg;
        }

        document
            .getElementById('calibrateFlatStatsBtn')
            .addEventListener('click', () => {
                const result = FlatStatCalibration.calibrate(
                    HeroData.getAllHeroData(),
                );
                if (result && result.heroCount > 0) {
                    document.getElementById(
                        'calibrateFlatStatsResult',
                    ).textContent =
                        `Calibrated (${result.heroCount} heroes): Atk=${result.atk.toFixed(2)}, HP=${result.hp.toFixed(2)}, Def=${result.def.toFixed(2)}`;
                } else {
                    document.getElementById(
                        'calibrateFlatStatsResult',
                    ).textContent =
                        'No eligible 5★ heroes found. Load hero data first.';
                }
            });

        document
            .getElementById('resetFlatStatsBtn')
            .addEventListener('click', () => {
                FlatStatCalibration.reset();
                _updateCalibrationStatus();
            });

        _updateCalibrationStatus();
    },

    getDefaultPath: () => {
        return Files.path(pathOverride || defaultPath);
    },

    getExcludeSelects: () => {
        return excludeSelects;
    },

    getOptimizerOptions: () => {
        return defaultOptimizerSettings;
    },

    getDefaultSettings: () => {
        return {
            settingGpu: true,
            settingUnlockOnUnequip: true,
            settingRageSet: true,
            settingPenSet: true,
            settingMaxResults: 5_000_000,
            settingMaxRamGb: 6,
            settingPenDefense: 1_500,
            settingLocatorWidth: 5,
            settingDefaultPath: defaultPath,
            settingExcludeEquipped: [],
            settingEnhanceLimit: 0,
            settingDarkMode: true,
            settingArchetypes: GearRating.getDefaultArchetypes(),
            settingDefaultUseReforgedStats: true,
            settingDefaultUseHeroPriority: false,
            settingDefaultUseSubstatMods: false,
            settingDefaultLockedItems: false,
            settingDefaultEquippedItems: false,
            settingDefaultKeepCurrent: false,
            settingBackgroundColor: '#1a1a1a',
            settingTextColorPicker: '#E2E2E2',
            settingAccentColorPicker: '#F84C48',
            settingInputColorPicker: '#616161',
            settingGridTextColorPicker: '#E2E2E2',
            settingRedColorPicker: '#5A1A06',
            settingNeutralColorPicker: '#343127',
            settingGreenColorPicker: '#38821F',
        };
    },

    parseNumberValue: (id) => {
        let { value } = document.getElementById(id);
        value = value.replace(/,/g, '');

        return parseInt(value, 10);
    },

    loadSettings: async () => {
        try {
            Saves.createFolder();
        } catch (e) {
            Notifier.error(
                'Unable to create the Documents/FribbelsOptimizerSaves folder. Try disabling running the app as admin and disabling your virus scan',
            );
            return;
        }

        let settings;
        try {
            const text = await Files.readFileSync(Files.path(settingsPath));
            settings = JSON.parse(text);
        } catch (e) {
            settings = Settings.getDefaultSettings();
            Notifier.error(
                `There was an error parsing the ${Files.path(
                    settingsPath,
                )} file. Please repair the file or delete it.`,
            );
            Notifier.error(`Using default settings instead.`);
        }

        const isNullUndefined = (x) => x === null || x === undefined;

        document.getElementById('settingGpu').checked = isNullUndefined(
            settings.settingGpu,
        )
            ? true
            : settings.settingGpu;
        document.getElementById('settingUnlockOnUnequip').checked =
            isNullUndefined(settings.settingUnlockOnUnequip)
                ? true
                : settings.settingUnlockOnUnequip;
        document.getElementById('settingRageSet').checked = isNullUndefined(
            settings.settingRageSet,
        )
            ? true
            : settings.settingRageSet;
        document.getElementById('settingPenSet').checked = isNullUndefined(
            settings.settingPenSet,
        )
            ? true
            : settings.settingPenSet;
        document.getElementById('settingDefaultUseReforgedStats').checked =
            isNullUndefined(settings.settingDefaultUseReforgedStats)
                ? true
                : settings.settingDefaultUseReforgedStats;
        document.getElementById('settingDefaultUseHeroPriority').checked =
            settings.settingDefaultUseHeroPriority;
        document.getElementById('settingDefaultUseSubstatMods').checked =
            settings.settingDefaultUseSubstatMods;
        document.getElementById('settingDefaultLockedItems').checked =
            settings.settingDefaultLockedItems;
        document.getElementById('settingDefaultEquippedItems').checked =
            settings.settingDefaultEquippedItems;
        document.getElementById('settingDefaultKeepCurrent').checked =
            settings.settingDefaultKeepCurrent;
        defaultOptimizerSettings = {
            settingDefaultUseReforgedStats: isNullUndefined(
                settings.settingDefaultUseReforgedStats,
            )
                ? true
                : settings.settingDefaultUseReforgedStats,
            settingDefaultUseHeroPriority:
                settings.settingDefaultUseHeroPriority,
            settingDefaultUseSubstatMods: settings.settingDefaultUseSubstatMods,
            settingDefaultLockedItems: settings.settingDefaultLockedItems,
            settingDefaultEquippedItems: settings.settingDefaultEquippedItems,
            settingDefaultKeepCurrent: settings.settingDefaultKeepCurrent,
        };
        pathOverride = settings.settingDefaultPath;

        if (isNullUndefined(settings.settingPenSet)) {
            settings.settingPenSet = true;
        }

        if (isNullUndefined(settings.settingGpu)) {
            settings.settingGpu = true;
        }

        if (settings.settingMaxResults) {
            document.getElementById('settingMaxResults').value =
                settings.settingMaxResults
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        } else {
            document.getElementById('settingMaxResults').value = '5,000,000';
            settings.settingMaxResults = 5_000_000;
        }

        if (settings.settingMaxRamGb) {
            document.getElementById('settingMaxRamGb').value =
                settings.settingMaxRamGb
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        } else {
            document.getElementById('settingMaxRamGb').value = '6';
            settings.settingMaxRamGb = 6;
        }

        if (settings.settingPenDefense) {
            document.getElementById('settingPenDefense').value =
                settings.settingPenDefense
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        } else {
            document.getElementById('settingPenDefense').value = '1,500';
            settings.settingPenDefense = 1_500;
        }

        if (settings.settingLocatorWidth) {
            document.getElementById('settingLocatorWidth').value =
                settings.settingLocatorWidth
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        } else {
            document.getElementById('settingLocatorWidth').value = '5';
            settings.settingLocatorWidth = 5;
        }

        if (settings.settingDarkMode) {
            document.getElementById('darkSlider').checked = true;
            DarkMode.toggle();
        }

        if (settings.settingExcludeEquipped) {
            $('#optionsExcludeGearFrom').multipleSelect(
                'setSelects',
                settings.settingExcludeEquipped,
            );
            excludeSelects = settings.settingExcludeEquipped;
        }

        if (settings.settingEnhanceLimit) {
            $('#optionsEnhanceLimit').multipleSelect(
                'setSelects',
                settings.settingEnhanceLimit,
            );
        }

        // "settingBackgroundColor": "#212529",
        // "settingTextColorPicker": "#e2e2e2",
        // "settingAccentColorPicker": "#f84c48",
        // "settingInputColorPicker": "#2d3136",
        // "settingGridTextColorPicker": "#ffffff",
        // "settingRedColorPicker": "#ff430a",
        // "settingNeutralColorPicker": "#343127",
        // "settingGreenColorPicker": "#38821f"

        ColorPicker.loadColorSettings(settings);

        const currentVersion = Updater.getCurrentVersion();
        if (settings.settingVersion) {
            if (currentVersion !== settings.settingVersion) {
                Updater.showNewFeatures(currentVersion);
                Settings.saveSettings();
            }
        } else {
            Updater.showNewFeatures(currentVersion);
            Settings.saveSettings();
        }

        // NOTE: settingArchetypes intentionally NOT applied here.
        // ArchetypeStore owns e7-archetypes.json as sole source of truth.
        // Loading from settings.ini would overwrite the dedicated file with stale data.

        $('#selectDefaultFolderSubmitOutputText').text(
            settings.settingDefaultPath || defaultPath,
        );
        Api.setSettings(settings);
    },

    saveSettings: async () => {
        try {
            Saves.createFolder();
        } catch (e) {
            Notifier.error(
                'Unable to create the Documents/FribbelsOptimizerSaves folder. Try disabling running the app as admin and disabling your virus scan',
            );
            return;
        }

        const settings = {
            settingGpu: document.getElementById('settingGpu').checked,
            settingUnlockOnUnequip: document.getElementById(
                'settingUnlockOnUnequip',
            ).checked,
            settingRageSet: document.getElementById('settingRageSet').checked,
            settingPenSet: document.getElementById('settingPenSet').checked,
            settingDefaultUseReforgedStats: document.getElementById(
                'settingDefaultUseReforgedStats',
            ).checked,
            settingDefaultUseHeroPriority: document.getElementById(
                'settingDefaultUseHeroPriority',
            ).checked,
            settingDefaultUseSubstatMods: document.getElementById(
                'settingDefaultUseSubstatMods',
            ).checked,
            settingDefaultLockedItems: document.getElementById(
                'settingDefaultLockedItems',
            ).checked,
            settingDefaultEquippedItems: document.getElementById(
                'settingDefaultEquippedItems',
            ).checked,
            settingDefaultKeepCurrent: document.getElementById(
                'settingDefaultKeepCurrent',
            ).checked,
            settingMaxResults: parseInt(
                Settings.parseNumberValue('settingMaxResults') || 5_000_000,
                10,
            ),
            settingMaxRamGb: parseInt(
                Settings.parseNumberValue('settingMaxRamGb') || 6,
                10,
            ),
            settingPenDefense: parseInt(
                Settings.parseNumberValue('settingPenDefense') || 1_500,
                10,
            ),
            settingLocatorWidth: parseInt(
                Settings.parseNumberValue('settingLocatorWidth') || 5,
                10,
            ),
            settingDefaultPath: pathOverride || defaultPath,
            settingExcludeEquipped: $('#optionsExcludeGearFrom').multipleSelect(
                'getSelects',
            ),
            settingEnhanceLimit: $('#optionsEnhanceLimit').multipleSelect(
                'getSelects',
            ),
            settingDarkMode: document.getElementById('darkSlider').checked,
            settingVersion: Updater.getCurrentVersion(),
            // settingArchetypes removed — archetypes are persisted to e7-archetypes.json by ArchetypeStore
            settingBackgroundColor: document.getElementById(
                'backgroundColorPicker',
            ).value,
            settingTextColorPicker:
                document.getElementById('textColorPicker').value,
            settingAccentColorPicker:
                document.getElementById('accentColorPicker').value,
            settingInputColorPicker:
                document.getElementById('inputColorPicker').value,
            settingGridTextColorPicker: document.getElementById(
                'gridTextColorPicker',
            ).value,
            settingRedColorPicker:
                document.getElementById('redColorPicker').value,
            settingNeutralColorPicker:
                document.getElementById('neutralColorPicker').value,
            settingGreenColorPicker:
                document.getElementById('greenColorPicker').value,
        };
        defaultOptimizerSettings = {
            settingDefaultUseReforgedStats:
                settings.settingDefaultUseReforgedStats,
            settingDefaultUseHeroPriority:
                settings.settingDefaultUseHeroPriority,
            settingDefaultUseSubstatMods: settings.settingDefaultUseSubstatMods,
            settingDefaultLockedItems: settings.settingDefaultLockedItems,
            settingDefaultEquippedItems: settings.settingDefaultEquippedItems,
            settingDefaultKeepCurrent: settings.settingDefaultKeepCurrent,
        };

        excludeSelects = settings.settingExcludeEquipped;

        Files.saveFile(settingsPath, JSON.stringify(settings, null, 2));
        if (Files.isMac()) {
            settings.settingGpu = false;
        }
        Api.setSettings(settings);
    },
};

export default Settings;

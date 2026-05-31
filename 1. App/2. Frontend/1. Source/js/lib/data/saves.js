/* global Files, Settings, Api, Dialog, Notifier, ItemAugmenter, ModificationFilter, HeroData, OptimizerTab, HeroesTab, $ */
const remote = require('@electron/remote');

const { dialog } = remote;
const currentWindow = remote.getCurrentWindow();

const documentsPath = remote.app.getPath('documents');
const savesFolder = `${documentsPath}/FribbelsOptimizerSaves`;

// const defaultPath = Files.isMac() ?
//                     (Files.getDataPath() + "/saves/").replace(/\//g, "/") :
//                     (Files.getDataPath() + "/saves/").replace(/\//g, "\\");

function getDateString() {
    const now = new Date();
    const dateString = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0];
    return dateString;
}

const euglmomorainData = {
    _id: 'euglmomorain',
    name: 'Euglmomorain',
    moonlight: true,
    rarity: 3,
    attribute: 'light',
    role: 'manauser',
    zodiac: 'fish',
    self_devotion: {
        type: 'res',
        grades: {
            D: 0.045,
            C: 0.068,
            B: 0.09,
            A: 0.112,
            S: 0.135,
            SS: 0.158,
            SSS: 0.18,
        },
    },
    devotion: {
        type: 'def',
        grades: {
            D: 12,
            C: 18,
            B: 24,
            A: 30,
            S: 36,
            SS: 42,
            SSS: 48,
        },
        slots: {
            1: true,
            2: true,
            3: true,
            4: true,
        },
    },
    assets: {
        icon: 'https://raw.githubusercontent.com/fribbels/Fribbels-Epic-7-Optimizer/main/data/cachedimages/euglmomorainPortrait.png',
        image: 'https://raw.githubusercontent.com/fribbels/Fribbels-Epic-7-Optimizer/main/data/cachedimages/question_circle.png',
        thumbnail:
            'https://raw.githubusercontent.com/fribbels/Fribbels-Epic-7-Optimizer/main/data/cachedimages/euglmomorainPanel.png',
    },
    ex_equip: [],
    calculatedStatus: {
        lv50FiveStarNoAwaken: {
            cp: 9236,
            atk: 313,
            hp: 3270,
            spd: 94,
            def: 511,
            chc: 0.15,
            chd: 1.5,
            dac: 0.05,
            eff: 0,
            efr: 0,
        },
        lv50FiveStarFullyAwakened: {
            cp: 10755,
            atk: 433,
            hp: 3904,
            spd: 94,
            def: 556,
            chc: 0.15,
            chd: 1.5,
            dac: 0.05,
            eff: 0,
            efr: 0,
            bonusMaxAtkPercent: 0,
            bonusMaxDefPercent: 0,
            bonusMaxHpPercent: 0,
            overrideAtk: 0,
            overrideHp: 4231,
            overrideDef: 0,
            overrideAdditionalCr: 0,
            overrideAdditionalCd: 0,
            overrideAdditionalSpd: 0,
            overrideAdditionalEff: 0,
            overrideAdditionalRes: 0.4,
        },
        lv60SixStarNoAwaken: {
            cp: 11520,
            atk: 390,
            hp: 4111,
            spd: 94,
            def: 634,
            chc: 0.15,
            chd: 1.5,
            dac: 0.05,
            eff: 0,
            efr: 0,
        },
        lv60SixStarFullyAwakened: {
            cp: 13775,
            atk: 540,
            hp: 4900,
            spd: 94,
            def: 729,
            chc: 0.15,
            chd: 1.5,
            dac: 0.05,
            eff: 0,
            efr: 0,
            bonusMaxAtkPercent: 0,
            bonusMaxDefPercent: 0,
            bonusMaxHpPercent: 0,
            overrideAtk: 0,
            overrideHp: 5312,
            overrideDef: 0,
            overrideAdditionalCr: 0,
            overrideAdditionalCd: 0,
            overrideAdditionalSpd: 0,
            overrideAdditionalEff: 0,
            overrideAdditionalRes: 0,
        },
    },
};

const Saves = {
    createFolder: () => {
        Files.createFolder(savesFolder);
    },

    autoSave: async () => {
        Saves.createFolder();
        Saves.saveData(`${Settings.getDefaultPath()}/autosave.json`);
    },

    saveData: async (filename) => {
        try {
            Saves.createFolder();
            const getAllHeroesResponse = await Api.getAllHeroes();
            const getAllItemsResponse = await Api.getAllItems();

            const data = {
                heroes: getAllHeroesResponse.heroes,
                items: getAllItemsResponse.items,
            };

            const stringified = JSON.stringify(data);
            Files.saveFile(Files.path(filename), stringified);

            return data;
        } catch (e) {
            Dialog.error(
                'Unable to save file. Please try disabling your antivirus, or add the app as an exception, then restarting the app in admin mode. Check if your saves folder is under OneDrive on the Settings tab, and if so, change it to somewhere else.'
            );
            return undefined;
        }
    },

    loadAutoSave: async () => {
        const autoSavePath = `${Settings.getDefaultPath()}/autosave.json`;

        try {
            const data = await Files.readFileSync(Files.path(autoSavePath));
            await Saves.loadSavedData(JSON.parse(data));
        } catch (e) {
            // Notifier.error("Failed to load autosave - " + e);
        }
    },

    initialize: async () => {
        Saves.createFolder();

        document
            .getElementById('saveDataSubmit')
            .addEventListener('click', async () => {
                const options = {
                    title: 'Save file',
                    defaultPath: Files.path(
                        `${Settings.getDefaultPath()}/${getDateString()}-export.json`
                    ),
                    buttonLabel: 'Save file',
                    filters: [{ name: 'JSON', extensions: ['json'] }],
                };
                const filename = dialog.showSaveDialogSync(
                    currentWindow,
                    options
                );

                if (!filename) return;

                const data = await Saves.saveData(Files.path(filename));
                await Saves.autoSave();
                $('#saveDataSubmitOutputText').text(
                    `Saved ${data.heroes.length} heroes and ${data.items.length} items to ${filename}`
                );
            });

        document
            .getElementById('loadDataSubmit')
            .addEventListener('click', async () => {
                const options = {
                    title: 'Load file',
                    defaultPath: Files.path(Settings.getDefaultPath()),
                    buttonLabel: 'Load file',
                    filters: [{ name: 'JSON', extensions: ['json'] }],
                };
                const filenames = dialog.showOpenDialogSync(
                    currentWindow,
                    options
                );

                if (!filenames || filenames.length < 1) {
                    return;
                }

                try {
                    const data = await Files.readFileSync(filenames[0]);
                    const parsedData = JSON.parse(data);
                    await Saves.loadSavedData(parsedData);

                    $('#loadDataSubmitOutputText').text(
                        `Loaded ${parsedData.heroes.length} heroes and ${parsedData.items.length} items from ${filenames[0]}`
                    );
                    Saves.autoSave();
                } catch (e) {
                    console.error('Failed to load save file', e);
                    Dialog.error(`Failed to load save file: ${e.message}`);
                }
            });
    },

    loadSavedData: async (data) => {
        const baseToStatObj = (stats) => ({
            atk: stats.atk,
            hp: stats.hp,
            def: stats.def,
            cr: Math.round(stats.chc * 100),
            cd: Math.round(stats.chd * 100),
            eff: Math.round(stats.eff * 100),
            res: Math.round(stats.efr * 100),
            spd: stats.spd,
            dac: Math.round(stats.dac * 100),
            bonusStats: {
                bonusMaxAtkPercent: stats.bonusMaxAtkPercent,
                bonusMaxDefPercent: stats.bonusMaxDefPercent,
                bonusMaxHpPercent: stats.bonusMaxHpPercent,
                overrideAtk: stats.overrideAtk,
                overrideHp: stats.overrideHp,
                overrideDef: stats.overrideDef,
                overrideAdditionalCr: Math.round(
                    stats.overrideAdditionalCr * 100
                ),
                overrideAdditionalCd: Math.round(
                    stats.overrideAdditionalCd * 100
                ),
                overrideAdditionalSpd: stats.overrideAdditionalSpd,
                overrideAdditionalEff: Math.round(
                    stats.overrideAdditionalEff * 100
                ),
                overrideAdditionalRes: Math.round(
                    stats.overrideAdditionalRes * 100
                ),
            },
        });

        if (!data || !data.items || !data.heroes) {
            Notifier.error('Invalid save data');
            return;
        }

        ItemAugmenter.augment(data.items);

        // Rebuild the mod-variant cache so that saved mod builds can be
        // equipped/previewed after import without re-running the optimizer.
        const itemsById = Object.fromEntries(
            data.items.map((item) => [item.id, item]),
        );
        data.heroes.forEach((hero) => {
            if (!hero.builds) return;
            hero.builds.forEach((build) => {
                if (!build.modIds || !build.mods || !build.items) return;
                build.modIds.forEach((modId, i) => {
                    const mod = build.mods[i];
                    const baseItemId = build.items[i];
                    if (!modId || !mod || !baseItemId) return;
                    if (modId === baseItemId) return; // not a mod variant
                    const baseItem = itemsById[baseItemId];
                    if (!baseItem) return;
                    ModificationFilter.seedCache(modId, baseItem);
                });
            });
        });

        if (
            data.heroes &&
            data.heroes.filter((x) => x.name === 'Euglmomorain').length > 0
        ) {
            const status = euglmomorainData.calculatedStatus;
            const euglmomorainBaseStats = {
                lv50FiveStarFullyAwakened: baseToStatObj(
                    status.lv50FiveStarFullyAwakened
                ),
                lv60SixStarFullyAwakened: baseToStatObj(
                    status.lv60SixStarFullyAwakened
                ),
            };

            const baseStatsByName = {};
            Object.keys(HeroData.getAllHeroData()).forEach((x) => {
                const baseStats = HeroData.getBaseStatsByName(x);
                baseStatsByName[x] = baseStats;
            });

            baseStatsByName.Euglmomorain = euglmomorainBaseStats;
            await Api.setBaseStats(baseStatsByName);
            HeroData.getAllHeroData().Euglmomorain = euglmomorainData;
        }

        await Api.setItems(data.items);
        ItemsTab.redraw();
        await Api.setHeroes(data.heroes);

        const heroData = HeroData.getAllHeroData();
        const heroNames = Object.keys(heroData);
        // Clean up the temporary Euglmomorain injection so it doesn’t persist
        // across subsequent save loads (BF9 — avoid permanently mutating shared heroData).
        delete HeroData.getAllHeroData().Euglmomorain;

        // Remove bad overrides
        await Promise.all(
            data.heroes
                .filter((hero) => !heroNames.includes(hero.name))
                .map((hero) => Api.removeHeroById(hero.id))
        );

        OptimizerTab.redrawHeroSelector();
        HeroesTab.redraw();
    },
};

export default Saves;

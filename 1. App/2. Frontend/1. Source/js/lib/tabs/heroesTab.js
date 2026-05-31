/* global HeroData, HeroesGrid, OptimizerTab, Dialog, Notifier, Api, Constants, Saves, $, i18next, Artifact */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import { v4 as uuidv4 } from 'uuid';

let useReforgedStats = true;
let searchableHeroes = [];
let lastRankEntry = { rank: null, name: '' };

function updateLastRankDisplay() {
    const el = document.getElementById('heroLastRankDisplay');
    if (!el) return;
    if (lastRankEntry.rank == null) {
        el.textContent = '';
        return;
    }
    el.textContent = `Last: #${lastRankEntry.rank}${lastRankEntry.name ? ` · ${lastRankEntry.name}` : ''}`;
}

const HeroesTab = {
    initialize: () => {
        console.log('[HeroesTab] initialize');
        setupEventListeners();
        const selector = document.getElementById('addHeroesSelector');
        const allHeroData = HeroData.getAllHeroData();
        console.log('[HeroesTab] allHeroData loaded, hero count:', Object.keys(allHeroData).length);
        const names = Object.keys(allHeroData).sort();

        console.log('[HeroesTab] hero names:', names);

        names.forEach((name) => {
            const hero = allHeroData[name];
            const option = document.createElement('option');
            option.innerHTML = i18next.t(hero.name);
            option.label = hero.name;
            option.value = name;
            selector.add(option);
        });

        document
            .getElementById('heroPreviewSelectAll')
            .addEventListener('click', () => {
                $('#heroesGridWeapon').prop('checked', true);
                $('#heroesGridHelmet').prop('checked', true);
                $('#heroesGridArmor').prop('checked', true);
                $('#heroesGridNecklace').prop('checked', true);
                $('#heroesGridRing').prop('checked', true);
                $('#heroesGridBoots').prop('checked', true);
            });
        document
            .getElementById('heroPreviewDeselectAll')
            .addEventListener('click', () => {
                $('#heroesGridWeapon').prop('checked', false);
                $('#heroesGridHelmet').prop('checked', false);
                $('#heroesGridArmor').prop('checked', false);
                $('#heroesGridNecklace').prop('checked', false);
                $('#heroesGridRing').prop('checked', false);
                $('#heroesGridBoots').prop('checked', false);
            });

        document
            .getElementById('addHeroesSubmit')
            .addEventListener('click', async () => {
                console.log('[HeroesTab] addHeroesSubmit:', selector.value);
                const id = selector.value;
                addHero(id);
                HeroesGrid.redrawPreview();
            });

        document
            .getElementById('heroesTabUseReforgedStats')
            .addEventListener('change', async () => {
                useReforgedStats = document.getElementById(
                    'heroesTabUseReforgedStats',
                ).checked;
                console.log(`[HeroesTab] reforgedStats changed to: ${useReforgedStats}`);
                await redrawGrid();
                clearPreview();
                HeroesGrid.refreshBuilds();
                HeroesGrid.redrawPreview();
            });

        document
            .getElementById('editBuildSubmit')
            .addEventListener('click', async () => {
                console.log('[HeroesTab] editBuildSubmit');
                const row = HeroesGrid.getSelectedRow();

                const existingBuild = HeroesGrid.getSelectedBuildRow();
                if (!existingBuild) {
                    Notifier.warn('Select a build to edit.');
                    return;
                }

                const editedBuild = await Dialog.editBuildDialog(
                    existingBuild.name,
                );
                console.log('[HeroesTab] editBuildSubmit result:', editedBuild, existingBuild);

                const { buildName } = editedBuild;

                existingBuild.name = buildName;

                await Api.editBuild(row.id, existingBuild);
                HeroesGrid.refreshBuilds();
                Saves.autoSave();
            });

        document
            .getElementById('removeBuildSubmit')
            .addEventListener('click', async () => {
                console.log('[HeroesTab] removeBuildSubmit');
                const row = HeroesGrid.getSelectedRow();
                const existingBuild = HeroesGrid.getSelectedBuildRow();

                console.log('[HeroesTab] removeBuildSubmit row/build:', row, existingBuild);

                await Api.removeBuild(row.id, existingBuild);
                HeroesGrid.refreshBuilds();
                Saves.autoSave();
            });

        document
            .getElementById('saveAsBuildSubmit')
            .addEventListener('click', async () => {
                console.log('saveAsBuildSubmit');
                const row = HeroesGrid.getSelectedRow();
                if (!row) return;

                const eq = row.equipment;
                if (
                    !eq ||
                    !eq.Weapon || !eq.Helmet || !eq.Armor ||
                    !eq.Necklace || !eq.Ring || !eq.Boots
                ) {
                    Notifier.warn(
                        'Hero needs a 6 item build before it can be saved',
                    );
                    return;
                }

                row.items = [
                    eq.Weapon.id,
                    eq.Helmet.id,
                    eq.Armor.id,
                    eq.Necklace.id,
                    eq.Ring.id,
                    eq.Boots.id,
                ];

                await Api.addBuild(row.id, row);
                await HeroesGrid.refreshBuilds();
                Saves.autoSave();
            });

        document
            .getElementById('equipBuildSubmit')
            .addEventListener('click', async () => {
                console.log('equipBuildSubmit');
                const row = HeroesGrid.getSelectedRow();
                const existingBuild = HeroesGrid.getSelectedBuildRow();

                if (
                    !existingBuild ||
                    !existingBuild.items ||
                    !row ||
                    existingBuild.items.includes(undefined) ||
                    existingBuild.items.includes(null)
                ) {
                    return;
                }

                await Api.equipItemsOnHero(row.id, existingBuild.items);
                HeroesGrid.refreshBuilds();
                HeroesTab.redraw();
                HeroesGrid.redrawPreview();
                Saves.autoSave();
            });

        document
            .getElementById('addSubstatModsSubmit')
            .addEventListener('click', async () => {
                const row = HeroesGrid.getSelectedRow();
                if (!row) return;
                console.log('addSubstatModsSubmit', row);

                // Fetch fresh hero data so the dialog always shows the latest
                // saved settings, not whatever is cached in the grid row.
                const { hero: freshHero } = await Api.getHeroById(row.id);
                const modStats = await Dialog.editModStatsDialog(freshHero || row);

                // mods — if OK was clicked, do a final save with the latest state;
                // always redraw & autosave so in-dialog saves are reflected in the grid.
                if (modStats) {
                    await Api.setModStats(modStats, row.id);
                    Notifier.success('Saved mod stats');
                }
                await HeroesTab.redraw();
                Saves.autoSave();
            });

        document
            .getElementById('setHeroRankSubmit')
            .addEventListener('click', async () => {
                const row = HeroesGrid.getSelectedRow();
                if (!row) return;
                console.log('setHeroRankSubmit', row);

                const rankInfo = await Dialog.editRankDialog(lastRankEntry.rank ?? row.index + 1);
                if (!rankInfo) return;

                await Api.reorderHeroes(row.id, rankInfo.rank).then(
                    HeroesTab.redraw,
                );

                // Remember last rank entered
                lastRankEntry = { rank: rankInfo.rank, name: row.label || row.name || '' };
                updateLastRankDisplay();

                Saves.autoSave();
            });

        document
            .getElementById('addHeroStatsSubmit')
            .addEventListener('click', async () => {
                const row = HeroesGrid.getSelectedRow();
                if (!row) return;
                console.log('addHeroStatsSubmit', row);

                // Api.removeHeroById(row.id).then(response => {
                //     console.log("RESPONSE", response)
                //     HeroesGrid.refresh(response.heroes)
                //     redrawHeroInputSelector();
                // });
                await HeroesTab.showBonusStatsWindow(row);
                Saves.autoSave();
            });

        document
            .getElementById('removeHeroesSubmit')
            .addEventListener('click', async () => {
                console.log('[HeroesTab] removeHeroesSubmit');
                const row = HeroesGrid.getSelectedRow();
                if (!row) return;

                const removeResponse = await Api.removeHeroById(row.id);
                console.log('[HeroesTab] removeHero response:', removeResponse);
                HeroesTab.redrawHeroInputSelector();
                await redrawGrid();
                HeroesGrid.redrawPreview();
                Saves.autoSave();
            });

        document
            .getElementById('unequipHeroesSubmit')
            .addEventListener('click', async () => {
                console.log('unequipHeroesSubmit', HeroesGrid.getSelectedRow());
                const row = HeroesGrid.getSelectedRow();
                if (!row) return;

                const unequipResponse =
                    await Api.unequipItems(getSelectedGearIds());
                console.log('RESPONSE', unequipResponse);
                await redrawGrid();
                clearPreview();
                HeroesGrid.redrawPreview();
                Saves.autoSave();
            });

        document
            .getElementById('unlockHeroesSubmit')
            .addEventListener('click', async () => {
                console.log('unlockHeroesSubmit', HeroesGrid.getSelectedRow());
                const row = HeroesGrid.getSelectedRow();
                if (!row) return;

                // Api.unlockHeroById(row.id).then(response => {
                //     console.log("RESPONSE", response)
                //     HeroesGrid.refresh(response.heroes)
                //     redrawGrid();
                //     clearPreview();
                //     Saves.autoSave();
                // })

                const unlockResponse =
                    await Api.unlockItems(getSelectedGearIds());
                console.log('RESPONSE', unlockResponse);
                await redrawGrid();
                clearPreview();
                HeroesGrid.redrawPreview();
                Saves.autoSave();
            });

        document
            .getElementById('lockHeroesSubmit')
            .addEventListener('click', async () => {
                console.log('lockHeroesSubmit', HeroesGrid.getSelectedRow());
                const row = HeroesGrid.getSelectedRow();
                if (!row) return;

                // Api.lockHeroById(row.id).then(response => {
                //     console.log("RESPONSE", response)
                //     HeroesGrid.refresh(response.heroes)
                //     redrawGrid();
                //     clearPreview();
                //     Saves.autoSave();
                // })

                const lockResponse = await Api.lockItems(getSelectedGearIds());
                console.log('RESPONSE', lockResponse);
                await redrawGrid();
                clearPreview();
                HeroesGrid.redrawPreview();
                Saves.autoSave();
            });

        document.getElementById('tab4label').addEventListener('click', () => {
            HeroesTab.redraw();
            HeroesGrid.refreshBuilds();
        });

        Api.getAllHeroes(useReforgedStats)
            .then((response) => {
                console.log('[HeroesTab] getAllHeroes response:', response);

                if (!response || !response.heroes) return null;
                if (response.heroes.length === 0) {
                    // addHero("Maid Chloe")
                } else {
                    HeroesTab.redrawHeroInputSelector();
                }
                HeroesGrid.refresh(response.heroes);
                return HeroesGrid.redrawPreview();
            })
            .catch(console.error);
    },

    redrawHeroInputSelector: () => {
        OptimizerTab.redrawHeroSelector();
    },

    redraw: async () => {
        await redrawGrid();
    },

    isExternalFilterPresent: () => {
        return (
            filters.classFilter.length > 0 ||
            filters.elementFilter.length > 0 ||
            filters.nameFilter.length > 0
        );
    },

    doesExternalFilterPass: (rowData) => {
        const hero = rowData.data;

        if (filters.classFilter.length > 0 && !filters.classFilter.includes(hero.role)) {
            return false;
        }
        if (filters.elementFilter.length > 0 && !filters.elementFilter.includes(hero.attribute)) {
            return false;
        }
        if (filters.nameFilter.length > 0) {
            const label = (hero.label || hero.name || '').toLowerCase();
            if (!label.includes(filters.nameFilter.toLowerCase())) return false;
        }
        return true;
    },

    refreshSearchDatalist: (heroes) => {
        // Cache heroes for the custom search dropdown
        searchableHeroes = heroes;
    },

    getUseReforgedStats: () => {
        return useReforgedStats;
    },

    getNewHeroByName: (heroName) => {
        const allHeroData = HeroData.getAllHeroData();
        const heroData = allHeroData[heroName];

        if (!heroData) {
            return null;
        }

        const id = uuidv4();
        const data = JSON.parse(JSON.stringify(heroData));

        return {
            id,
            name: heroName,
            data,
            equipped: new Array(6),
        };
    },

    showBonusStatsWindow: async (row) => {
        showEditHeroInfoPopups(row.name);
        const bonusStats = await Dialog.editHeroDialog(row);

        if (!bonusStats) return;

        const e7StatToBonusStat = {
            att_rate: 'aeiAttackPercent',
            max_hp_rate: 'aeiHealthPercent',
            def_rate: 'aeiDefensePercent',
            att: 'aeiAttack',
            max_hp: 'aeiHealth',
            def: 'aeiDefense',
            speed: 'aeiSpeed',
            res: 'aeiEffectResistance',
            cri: 'aeiCritChance',
            cri_dmg: 'aeiCritDamage',
            acc: 'aeiEffectiveness',
            coop: 'aeiDualAttackChance',
        };

        console.log('Bonus stats', bonusStats, row.id);

        // Imprint
        const imprintIngameType = bonusStats.heroInfo.self_devotion.type;
        const imprintBonusType = e7StatToBonusStat[imprintIngameType];
        const imprintNumberText = bonusStats.imprintNumber;
        if (imprintNumberText !== 'None') {
            const imprintNumber = parseFloat(imprintNumberText);

            console.log('ADDING AEI IMPRINT', imprintNumber, imprintBonusType);

            bonusStats[imprintBonusType] += imprintNumber;
        }

        // Artifact
        const { artifactName } = bonusStats;
        if (artifactName !== 'None') {
            const artifactLevelText = bonusStats.artifactLevel;
            if (artifactLevelText !== 'None') {
                const artifactLevel = parseInt(artifactLevelText, 10);
                const artifactStats = Artifact.getStats(
                    artifactName,
                    artifactLevel,
                );

                console.log('ADDING AEI ARTIFACT', artifactLevel);
                console.log('ADDING AEI ARTIFACT', artifactLevelText);
                console.log('ADDING AEI ARTIFACT', artifactName);

                bonusStats.aeiHealth += artifactStats.health;
                bonusStats.aeiAttack += artifactStats.attack;
                bonusStats.aeiDefense += artifactStats.defense;
                bonusStats.artifactHealth = artifactStats.health;
                bonusStats.artifactAttack = artifactStats.attack;
                bonusStats.artifactDefense = artifactStats.defense;
            }
        }

        // EE
        const eeNumberText = bonusStats.eeNumber;
        if (eeNumberText !== 'None') {
            const eeNumber = parseInt(eeNumberText, 10);
            const eeIngameType = bonusStats.ee.stat.type;
            const eeBonusType = e7StatToBonusStat[eeIngameType];

            console.log('ADDING AEI EE', eeBonusType, eeNumber);

            bonusStats[eeBonusType] += eeNumber;
        }

        await Api.setBonusStats(bonusStats, row.id).then(HeroesTab.redraw);
        Notifier.success('Saved bonus stats');
    },
};

function showEditHeroInfoPopups(name) {
    if (name === 'Eaton') {
        Notifier.info(
            "Eaton's 20% total Health bonus from S2 is already automatically added.",
        );
    }
    if (name === 'Gunther') {
        Notifier.info(
            "Gunther's 75% total Attack bonus from S2 is already automatically added.",
        );
    }
    if (name === 'Lena') {
        Notifier.info(
            "Lena's 50% Crit Chance bonus from S2 is already automatically added.",
        );
    }
    if (name === 'Apocalypse Ravi') {
        Notifier.info(
            "Apocalypse Ravi's 30% Crit Chance bonus from S2 is already automatically added.",
        );
    }
    if (name === 'Senya') {
        Notifier.info(
            "Senya's 30% total Attack bonus from S2 is already automatically added.",
        );
    }
}

function getSelectedGear() {
    const buildRow = HeroesGrid.getSelectedBuildRow();
    if (buildRow) {
        return buildRow.items.map((x) => {
            return {
                id: x,
            };
        });
    }

    const row = HeroesGrid.getSelectedRow();
    if (!row || !row.equipment) return [];

    const results = [];
    if (row.equipment.Weapon && $('#heroesGridWeapon').prop('checked'))
        results.push(row.equipment.Weapon);
    if (row.equipment.Helmet && $('#heroesGridHelmet').prop('checked'))
        results.push(row.equipment.Helmet);
    if (row.equipment.Armor && $('#heroesGridArmor').prop('checked'))
        results.push(row.equipment.Armor);
    if (row.equipment.Necklace && $('#heroesGridNecklace').prop('checked'))
        results.push(row.equipment.Necklace);
    if (row.equipment.Ring && $('#heroesGridRing').prop('checked'))
        results.push(row.equipment.Ring);
    if (row.equipment.Boots && $('#heroesGridBoots').prop('checked'))
        results.push(row.equipment.Boots);

    return results;
}

function getSelectedGearIds() {
    return getSelectedGear().map((x) => x.id);
}

function addHero(heroName) {
    const newHero = HeroesTab.getNewHeroByName(heroName);
    newHero.rarity = newHero.data.rarity;
    newHero.attribute = newHero.data.attribute;
    newHero.role = newHero.data.role;
    newHero.path = heroName;
    newHero.stars = 6;

    Api.addHeroes([newHero])
        .then(async () => {
            HeroesTab.redrawHeroInputSelector();
            await redrawGrid(newHero.id);

            const heroResponse = await Api.getHeroById(newHero.id);
            const createdHero = heroResponse.hero;
            await HeroesTab.showBonusStatsWindow(createdHero);
            Saves.autoSave();
            return null;
        })
        .catch(console.error);
}

async function redrawGrid(id) {
    const response = await Api.getAllHeroes(useReforgedStats);
    if (!response || !response.heroes) return;
    HeroesGrid.refresh(response.heroes, id);
    HeroesTab.refreshSearchDatalist(response.heroes);

    HeroesGrid.refreshFilters(filters);
}

function clearPreview() {
    for (let i = 0; i < 6; i += 1) {
        const displayId = Constants.gearDisplayIdByIndex[i];
        document.getElementById(displayId).innerHTML = '';
    }
}

const filters = {
    classFilter: [],
    elementFilter: [],
    nameFilter: '',
};

const elementsByFilter = {
    elementFilter: [
        'fireElementFilter',
        'iceElementFilter',
        'windElementFilter',
        'lightElementFilter',
        'darkElementFilter',
    ],
    classFilter: [
        'knightClassFilter',
        'warriorClassFilter',
        'assassinClassFilter',
        'mageClassFilter',
        'manauserClassFilter',
        'rangerClassFilter',
    ],
};
function setupFilterListener(elementId, filter, filterContent) {
    document.getElementById(elementId).addEventListener('click', () => {
        const element = $(`#${elementId}`);
        element.toggleClass('gearTabButtonSelected');
        // Multi-select: toggle in/out of array
        if (element.hasClass('gearTabButtonSelected')) {
            if (!filters[filter].includes(filterContent)) {
                filters[filter].push(filterContent);
            }
        } else {
            filters[filter] = filters[filter].filter((x) => x !== filterContent);
        }
        HeroesGrid.refreshFilters(filters);
    });
}

function setupEventListeners() {
    // Elements
    setupFilterListener('fireElementFilter', 'elementFilter', 'fire');
    setupFilterListener('iceElementFilter', 'elementFilter', 'ice');
    setupFilterListener('windElementFilter', 'elementFilter', 'wind');
    setupFilterListener('lightElementFilter', 'elementFilter', 'light');
    setupFilterListener('darkElementFilter', 'elementFilter', 'dark');

    // Classes
    setupFilterListener('knightClassFilter', 'classFilter', 'knight');
    setupFilterListener('warriorClassFilter', 'classFilter', 'warrior');
    setupFilterListener('assassinClassFilter', 'classFilter', 'assassin');
    setupFilterListener('mageClassFilter', 'classFilter', 'mage');
    setupFilterListener('manauserClassFilter', 'classFilter', 'manauser');
    setupFilterListener('rangerClassFilter', 'classFilter', 'ranger');

    document.getElementById('clearHeroFilter').addEventListener('click', () => {
        const keys = Object.keys(elementsByFilter);
        keys.forEach((key) => {
            elementsByFilter[key].forEach((x) => {
                $(`#${x}`).removeClass('gearTabButtonSelected');
            });
            filters[key] = [];
        });
        filters.nameFilter = '';
        document.getElementById('heroSearchInput').value = '';
        hideSearchDropdown();

        HeroesGrid.resetSort();
        HeroesGrid.refreshFilters(filters);
    });

    const searchInput = document.getElementById('heroSearchInput');
    const searchDropdown = document.getElementById('heroSearchDropdown');

    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (!val) {
            hideSearchDropdown();
            filters.nameFilter = '';
            HeroesGrid.refreshFilters(filters);
            return;
        }
        // Live-filter the grid
        filters.nameFilter = val;
        HeroesGrid.refreshFilters(filters);
        // Show custom dropdown with up to 50 matching heroes
        const lower = val.toLowerCase();
        const matches = searchableHeroes
            .filter((h) => (h.label || h.name || '').toLowerCase().includes(lower))
            .slice(0, 50);
        showSearchDropdown(matches);
    });

    searchInput.addEventListener('blur', () => {
        // Delay so mousedown on a dropdown item fires before the dropdown hides
        setTimeout(hideSearchDropdown, 150);
    });

    searchInput.addEventListener('focus', (e) => {
        if (e.target.value.trim()) e.target.dispatchEvent(new Event('input'));
    });

    function showSearchDropdown(heroes) {
        searchDropdown.innerHTML = '';
        if (heroes.length === 0) {
            hideSearchDropdown();
            return;
        }
        heroes.forEach((hero) => {
            const item = document.createElement('div');
            item.className = 'heroSearchDropdownItem';
            item.textContent = `${hero.label || hero.name} (Rank ${hero.index + 1})`;
            item.addEventListener('mousedown', (ev) => {
                ev.preventDefault(); // keep input focused so blur delay doesn't interfere
                filters.nameFilter = '';
                HeroesGrid.refreshFilters(filters);
                setTimeout(() => HeroesGrid.scrollToHero(hero.label || hero.name, hero.index), 0);
                searchInput.value = '';
                hideSearchDropdown();
            });
            searchDropdown.appendChild(item);
        });
        searchDropdown.classList.add('open');
    }

    function hideSearchDropdown() {
        searchDropdown.classList.remove('open');
    }
}

export default HeroesTab;

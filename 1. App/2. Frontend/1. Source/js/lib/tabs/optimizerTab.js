/* global $, Api, Selectors, HeroesTab, StatPreview, ModificationFilter, PriorityFilter, ForceFilter, OptimizerGrid, Dialog, Saves, Notifier, HeroData, DamageCalc, Settings, OptimizationRequest, EnhancingTab, i18next, HtmlGenerator, Utils, Artifact, ItemAugmenter, Reforge, ItemsGrid, ItemsTab, HeroesGrid, Assets, Grid */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import rangesliderJs from 'rangeslider-js';
import Sortable from 'sortablejs';
import electron from 'electron';

let permutations = 0;
let progressTimer;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let currentFilteredItems = [];

const ipc = electron.ipcRenderer;

let currentExecutionId;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let resized = false;
let recalcDebounceTimer = null;
let _cachedItems = null;
let _cachedHeroes = null;
let currentHeroResponse = null;
let heroPrioritySortable = null;
let presetListSortable = null;
let _renamePresetId = null;
let _renameHeroId = null;
let _renameHeroResponse = null;
let _renameIndex = null;

// Fribbels Library panel state
let fribbelsLoadedHeroName = null;
let fribbelsSelectedRow = null;
let fribbelsAllBuilds = [];
let fribbelsFilteredBuilds = [];
let fribbelsBaseStats = null;
let lastPartialGridReload = 0;
let fribbelsGridApi = null;
let fribbelsCurrentBuildRow = null;

// Build pinned for side-by-side comparison
let _pinnedBuildRow = null;

// ---------------------------------------------------------------------------
// Build-result persistence — stores up to RESULTS_CACHE_MAX_PER_HERO recent
// result sets per hero in localStorage so they survive hero switches and app
// restarts.  Only the first RESULTS_CACHE_MAX_ROWS rows of each run are kept.
// ---------------------------------------------------------------------------
const RESULTS_CACHE_KEY = 'e7opt_results_cache';
const RESULTS_CACHE_MAX_PER_HERO = 5;
const RESULTS_CACHE_MAX_ROWS = 500;

/**
 * Updates the Optimizer bottom-tab label to show the result count.
 * Pass a numeric string (already formatted) or 0 / null to clear the badge.
 */
function updateOptimizerTabLabel(countStr) {
    const btn = document.getElementById('bottomTabBtnGear');
    if (!btn) return;
    if (countStr && countStr !== '0') {
        btn.textContent = `Optimizer (${countStr})`;
    } else {
        btn.textContent = 'Optimizer';
    }
}

const slotSubstatFiltersMap = { '': {}, 1: {}, 2: {} };
let allItemsSlotCounts = {
    Weapon: 0,
    Helmet: 0,
    Armor: 0,
    Necklace: 0,
    Ring: 0,
    Boots: 0,
};

function inputDisplayNumber(value) {
    if (value === 0 || value === 2147483647) {
        return '';
    }
    return value;
}

function inputDisplayNumberNumber(value, base) {
    if (!value || value === 2147483647) {
        if (base) {
            return base;
        }
        return 0;
    }
    return value;
}

function fixSliders(indexArg) {
    const index = indexArg ?? '';
    // if (!resized) {
    //     console.log("NOT FIXING")
    //     return;
    // }
    console.log('Fixing sliders');
    document.querySelector(`#atkSlider${index}`)['rangeslider-js'].update();
    document.querySelector(`#hpSlider${index}`)['rangeslider-js'].update();
    document.querySelector(`#defSlider${index}`)['rangeslider-js'].update();
    document.querySelector(`#spdSlider${index}`)['rangeslider-js'].update();
    document.querySelector(`#crSlider${index}`)['rangeslider-js'].update();
    document.querySelector(`#cdSlider${index}`)['rangeslider-js'].update();
    document.querySelector(`#effSlider${index}`)['rangeslider-js'].update();
    document.querySelector(`#resSlider${index}`)['rangeslider-js'].update();
    document
        .querySelector(`#weaponFilterSlider${index}`)
        ['rangeslider-js'].update();
    document
        .querySelector(`#helmetFilterSlider${index}`)
        ['rangeslider-js'].update();
    document
        .querySelector(`#armorFilterSlider${index}`)
        ['rangeslider-js'].update();
    document
        .querySelector(`#necklaceFilterSlider${index}`)
        ['rangeslider-js'].update();
    document
        .querySelector(`#ringFilterSlider${index}`)
        ['rangeslider-js'].update();
    document
        .querySelector(`#bootsFilterSlider${index}`)
        ['rangeslider-js'].update();

    resized = false;
}

const PRIORITY_WEIGHT_STATS = [
    { id: 'atk', targetId: 'inputAtkTarget', minTargetId: 'inputAtkMinTarget', label: 'ATK', color: '#e07848' },
    { id: 'def', targetId: 'inputDefTarget', minTargetId: 'inputDefMinTarget', label: 'DEF', color: '#5b8dd9' },
    { id: 'hp',  targetId: 'inputHpTarget',  minTargetId: 'inputHpMinTarget',  label: 'HP',  color: '#5bbf6a' },
    { id: 'spd', targetId: 'inputSpdTarget', minTargetId: 'inputSpdMinTarget', label: 'SPD', color: '#59c9c9' },
    { id: 'cr',  targetId: 'inputCrTarget',  minTargetId: 'inputCrMinTarget',  label: 'CR',  color: '#d4c94a' },
    { id: 'cd',  targetId: 'inputCdTarget',  minTargetId: 'inputCdMinTarget',  label: 'CD',  color: '#d49442' },
    { id: 'eff', targetId: 'inputEffTarget', minTargetId: 'inputEffMinTarget', label: 'EFF', color: '#a65bc9' },
    { id: 'res', targetId: 'inputResTarget', minTargetId: 'inputResMinTarget', label: 'RES', color: '#4ab89a' },
];

function updatePriorityWeightBar(index) {
    const idx = index ?? '';
    const values = PRIORITY_WEIGHT_STATS.map((s) => {
        const el = document.getElementById(`${s.id}SliderInput${idx}`);
        return el ? Math.max(0, parseFloat(el.value) || 0) : 0;
    });
    const total = values.reduce((a, b) => a + b, 0);
    const barEl = document.getElementById(`priorityWeightBar${idx}`);
    if (barEl) {
        if (total > 0) {
            barEl.innerHTML = '';
            PRIORITY_WEIGHT_STATS.forEach((s, i) => {
                if (values[i] <= 0) return;
                const pct = (values[i] / total) * 100;
                const seg = document.createElement('div');
                seg.className = 'pwb-seg';
                seg.style.width = pct + '%';
                seg.style.background = s.color;
                seg.title = `${s.label}: ${values[i]} (${Math.round(pct)}%)`;
                barEl.appendChild(seg);
            });
            barEl.style.display = '';
        } else {
            barEl.style.display = 'none';
        }
    }
    PRIORITY_WEIGHT_STATS.forEach((s) => {
        const dot = document.getElementById(`${s.id}SliderTargetDot${idx}`);
        if (!dot) return;
        const targetEl = document.getElementById(`${s.targetId}${idx}`);
        const minTargetEl = document.getElementById(`${s.minTargetId}${idx}`);
        const hasTarget = (targetEl && (parseFloat(targetEl.value) || 0) > 0) ||
                          (minTargetEl && (parseFloat(minTargetEl.value) || 0) > 0);
        dot.classList.toggle('display-none', !hasTarget);
    });
}

function isNullUndefined(x) {
    return x === null || x === undefined;
}

function formatCompactNumber(n) {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return Math.round(n / 1_000) + 'K';
    return String(n);
}

function calculatePlaceholderRatings(indexArg) {
    const index = indexArg ?? '';

    const minDef = readNumber(`inputMinDefLimit${index}`);
    const minHp = readNumber(`inputMinHpLimit${index}`);

    if (
        minDef === undefined ||
        minHp === undefined ||
        minDef === 0 ||
        minHp === 0
    ) {
        $(`#inputMinEhpLimit${index}`).attr('placeholder', '');
    } else {
        const ehp = Math.floor(minHp * (minDef / 300 + 1));
        $(`#inputMinEhpLimit${index}`).attr('placeholder', ehp);
    }

    const minAtk = readNumber(`inputMinAtkLimit${index}`);
    const minCd = readNumber(`inputMinCdLimit${index}`);

    if (
        minAtk === undefined ||
        minCd === undefined ||
        minAtk === 0 ||
        minCd === 0
    ) {
        $(`#inputMinMcdmgLimit${index}`).attr('placeholder', '');
    } else {
        const mcd = (minAtk * minCd) / 100;
        $(`#inputMinMcdmgLimit${index}`).attr('placeholder', mcd);
    }
}

function getFilterPresets(heroId) {
    return JSON.parse(
        localStorage.getItem('optimizerPresets_' + heroId) || '[]',
    );
}

function saveFilterPresetsToStorage(heroId, presets) {
    localStorage.setItem('optimizerPresets_' + heroId, JSON.stringify(presets));
}

function renderFilterPresets(heroId, heroResponseArg, index) {
    const container = document.getElementById('presetList');
    if (!container) return;
    container.innerHTML = '';
    const presets = getFilterPresets(heroId);
    presets.forEach((preset) => {
        const chip = document.createElement('div');
        chip.className = 'preset-chip';
        chip.title = preset.name;

        const sets = preset.sets || [];
        sets.flat()
            .filter(Boolean)
            .forEach((setKey) => {
                const img = document.createElement('img');
                // setKey is stored as e.g. 'WarfareSet' — strip the trailing 'Set'
                const name = setKey.replace(/Set$/i, '').toLowerCase();
                img.src = './assets/set' + name + '.png';
                img.alt = name;
                chip.appendChild(img);
            });

        const nameSpan = document.createElement('span');
        nameSpan.className = 'preset-chip-name';
        nameSpan.textContent = preset.name;
        chip.appendChild(nameSpan);

        if (preset.fribbelsRow) {
            const badge = document.createElement('span');
            badge.className = 'preset-chip-fbadge';
            badge.title = `Community build: ATK ${preset.fribbelsRow.atk}  DEF ${preset.fribbelsRow.def}  HP ${preset.fribbelsRow.hp}  SPD ${preset.fribbelsRow.spd}  GS ${preset.fribbelsRow.gs}`;
            badge.textContent = 'F';
            chip.appendChild(badge);
        }

        const del = document.createElement('span');
        del.className = 'preset-chip-delete';
        del.textContent = '\u00d7';
        del.title = 'Delete preset';
        del.addEventListener('click', (e) => {
            e.stopPropagation();
            const updated = getFilterPresets(heroId).filter(
                (p) => p.id !== preset.id,
            );
            saveFilterPresetsToStorage(heroId, updated);
            renderFilterPresets(heroId, heroResponseArg, index);
        });
        chip.appendChild(del);

        chip.addEventListener('click', () => {
            if (!heroResponseArg) return;
            const mockResponse = {
                ...heroResponseArg,
                hero: {
                    ...heroResponseArg.hero,
                    optimizationRequest: preset.request,
                },
            };
            OptimizerTab.loadPreviousHeroFilters(
                mockResponse,
                index,
                true,
                null,
            );
            fribbelsRestorePresetRow(preset.fribbelsRow || null);
        });

        chip.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            openRenameModal(preset, heroId, heroResponseArg, index);
        });

        container.appendChild(chip);
    });

    if (presetListSortable) { presetListSortable.destroy(); presetListSortable = null; }
    if (presets.length > 1) {
        presetListSortable = new Sortable(container, {
            animation: 150,
            filter: '.preset-chip-delete',
            preventOnFilter: false,
            onEnd: (evt) => {
                const current = getFilterPresets(heroId);
                if (current.length < 2) return;
                const moved = current.splice(evt.oldIndex, 1)[0];
                current.splice(evt.newIndex, 0, moved);
                saveFilterPresetsToStorage(heroId, current);
            },
        });
    }
}

function saveFilterPreset(heroId, heroResponseArg, index) {
    const request = OptimizerTab.getOptimizationRequestParams(false, index);
    const sets = (request.inputSets || []).filter(Boolean);
    const existing = getFilterPresets(heroId);
    const nameInput = document.getElementById('presetNameInput');
    const inputName = nameInput ? nameInput.value.trim() : '';
    const preset = {
        id: Date.now(),
        name: inputName || 'Build ' + (existing.length + 1),
        sets,
        request,
        fribbelsRow: fribbelsSelectedRow || null,
    };
    existing.push(preset);
    saveFilterPresetsToStorage(heroId, existing);
    if (nameInput) nameInput.value = '';
    renderFilterPresets(heroId, heroResponseArg, index);
}

function openRenameModal(preset, heroId, heroResponseArg, index) {
    _renamePresetId = preset.id;
    _renameHeroId = heroId;
    _renameHeroResponse = heroResponseArg;
    _renameIndex = index;
    const overlay = document.getElementById('presetRenameOverlay');
    const input = document.getElementById('presetRenameInput');
    if (!overlay || !input) return;
    input.value = preset.name;
    overlay.style.display = 'flex';
    input.focus();
    input.select();
}

function closeRenameModal() {
    const overlay = document.getElementById('presetRenameOverlay');
    if (overlay) overlay.style.display = 'none';
    _renamePresetId = null;
    _renameHeroId = null;
    _renameHeroResponse = null;
    _renameIndex = null;
}

function commitRename() {
    if (_renamePresetId === null || !_renameHeroId) return;
    const input = document.getElementById('presetRenameInput');
    const newName = input ? input.value.trim() : '';
    if (!newName) return;
    const presets = getFilterPresets(_renameHeroId);
    const p = presets.find((x) => x.id === _renamePresetId);
    if (p) {
        p.name = newName;
        saveFilterPresetsToStorage(_renameHeroId, presets);
        renderFilterPresets(_renameHeroId, _renameHeroResponse, _renameIndex);
    }
    closeRenameModal();
}

function initPresetRenameModal() {
    document.getElementById('presetRenameConfirm')?.addEventListener('click', commitRename);
    document.getElementById('presetRenameCancel')?.addEventListener('click', closeRenameModal);
    document.getElementById('presetRenameOverlay')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeRenameModal();
    });
    document.getElementById('presetRenameInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') commitRename();
        if (e.key === 'Escape') closeRenameModal();
    });
}

function updateSlotSubstatFilterButton(index) {
    const filters = slotSubstatFiltersMap[index] || {};
    const activeCount = Object.values(filters).filter(
        (sf) => sf && sf.enabled && sf.substats && sf.substats.length > 0,
    ).length;
    const btn = document.getElementById(`openSlotSubstatFilter${index}`);
    if (!btn) return;
    if (activeCount > 0) {
        btn.classList.add('slot-filter-active');
        btn.textContent = `Substat Filter (${activeCount})`;
    } else {
        btn.classList.remove('slot-filter-active');
        btn.textContent = 'Substat Filter';
    }
}

function setAllSlotSliders(pct) {
    const slots = ['weapon', 'helmet', 'armor', 'necklace', 'ring', 'boots'];
    slots.forEach((slot) => {
        const inputEl = document.getElementById(`${slot}FilterSliderInput`);
        if (!inputEl) return;
        inputEl.value = pct;
        const sliderEl = document.querySelector(`#${slot}FilterSlider`);
        if (sliderEl && sliderEl['rangeslider-js']) {
            sliderEl['rangeslider-js'].update({
                value: Math.round(10 * Math.sqrt(pct)),
            });
        }
    });
}

/**
 * Set each slot's filter slider to the top-N% of that slot's items that
 * could plausibly contribute to a good build, based on the current priority
 * weights.  Uses a "score cliff" heuristic: keep all items whose score is
 * at or above `threshold` percent (default 5%) of the best item in that
 * slot, expressed as a percentage of total items in the slot.
 *
 * Call this after the hero and params are loaded.  If no priorities are set
 * (all zeros) the function does nothing.
 *
 * @param {Object} params        - Optimization params from getOptimizationRequestParams()
 * @param {Object[]} allItems    - All gear items (from Api.getAllItems().items)
 * @param {Object} baseStats     - Hero base stats ({ atk, hp, def })
 * @param {number} [cliffPct=5] - Keep items scoring >= this % of the per-slot max
 */
function autoConfigSlotFiltersFromTargets(params, allItems, baseStats, cliffPct = 5) {
    const allPriorityZero =
        !params.inputAtkPriority && !params.inputHpPriority &&
        !params.inputDefPriority && !params.inputSpdPriority &&
        !params.inputCrPriority && !params.inputCdPriority &&
        !params.inputEffPriority && !params.inputResPriority;
    if (allPriorityZero) return;

    // When substat mods are enabled the item pool expands 2–4× after scoring,
    // so we loosen the score cliff to keep enough source items feeding the
    // mod expansion (otherwise the suggested % can be too aggressive).
    const effectiveCliff = params.inputSubstatMods ? Math.min(cliffPct, 2) : cliffPct;

    const reforge = $('#inputPredictReforges').prop('checked');
    const SLOTS = ['weapon', 'helmet', 'armor', 'necklace', 'ring', 'boots'];
    const SLOT_GEAR = { weapon: 'Weapon', helmet: 'Helmet', armor: 'Armor',
                        necklace: 'Necklace', ring: 'Ring', boots: 'Boots' };

    SLOTS.forEach((slot) => {
        const gearType = SLOT_GEAR[slot];
        const gearItems = allItems.filter((x) => x.gear === gearType);
        if (gearItems.length === 0) return;

        // Score every item in this slot
        gearItems.forEach((item) => PriorityFilter.scoreItem(item, params, baseStats, reforge));

        const maxScore = Math.max(...gearItems.map((x) => x.score || 0));
        if (maxScore <= 0) return; // no priority weights produce any signal for this slot

        const threshold = (effectiveCliff / 100) * maxScore;
        const countAbove = gearItems.filter((x) => (x.score || 0) >= threshold).length;
        const suggestedPct = Math.max(1, Math.min(100, Math.round((countAbove / gearItems.length) * 100)));

        const inputEl = document.getElementById(`${slot}FilterSliderInput`);
        if (!inputEl) return;
        inputEl.value = suggestedPct;
        const sliderEl = document.querySelector(`#${slot}FilterSlider`);
        if (sliderEl && sliderEl['rangeslider-js']) {
            sliderEl['rangeslider-js'].update({
                value: Math.round(10 * Math.sqrt(suggestedPct)),
            });
        }
    });
}

// ---------------------------------------------------------------------------
// Filter-reset undo stack (max 5 states)
// ---------------------------------------------------------------------------
const FILTER_RESET_HISTORY_LIMIT = 5;
const filterResetHistory = [];

const SLIDER_IDS = [
    'atkSlider', 'hpSlider', 'defSlider', 'spdSlider',
    'crSlider', 'cdSlider', 'effSlider', 'resSlider',
    'weaponFilterSlider', 'helmetFilterSlider', 'armorFilterSlider',
    'necklaceFilterSlider', 'ringFilterSlider', 'bootsFilterSlider',
];

function captureFilterState() {
    // Priority ratings (.optimizer-number-input)
    const ratings = {};
    document.querySelectorAll('.optimizer-number-input').forEach((el) => {
        if (el.id) ratings[el.id] = el.value;
    });

    // Stat targets (.stat-number-input)
    const stats = {};
    document.querySelectorAll('.stat-number-input').forEach((el) => {
        if (el.id) stats[el.id] = el.value;
    });

    // Substat priority & gear-slot sliders
    const sliders = {};
    SLIDER_IDS.forEach((id) => {
        const inputEl = document.getElementById(`${id}Input`);
        sliders[id] = inputEl ? inputEl.value : '0';
    });

    // Set / main-stat selectors
    const setFilters = Selectors.getSetFilters();
    const mainFilters = Selectors.getGearMainFilters();

    // Options checkboxes
    const options = {
        predictReforges: $('#inputPredictReforges').prop('checked'),
        substatMods: $('#inputSubstatMods').prop('checked'),
        allowLockedItems: $('#inputAllowLockedItems').prop('checked'),
        allowEquippedItems: $('#inputAllowEquippedItems').prop('checked'),
        orderedHeroPriority: $('#inputOrderedHeroPriority').prop('checked'),
        keepCurrentItems: $('#inputKeepCurrentItems').prop('checked'),
    };

    // Slot substat filters (deep copy)
    const slotSubstatFilterSnapshot = JSON.parse(JSON.stringify(slotSubstatFiltersMap[''] || {}));

    return { ratings, stats, sliders, setFilters, mainFilters, options, slotSubstatFilterSnapshot };
}

let _undoResetTimer = null;

function restoreFilterState(state) {
    // Ratings
    Object.entries(state.ratings).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) { el.value = value; $(el).trigger('change'); }
    });

    // Stat targets
    Object.entries(state.stats).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) { el.value = value; $(el).trigger('change'); }
    });

    // Sliders
    SLIDER_IDS.forEach((id) => {
        const sliderEl = document.querySelector(`#${id}`);
        if (!sliderEl || !sliderEl['rangeslider-js']) return;
        const inputEl = document.getElementById(`${id}Input`);
        const rawVal = state.sliders[id] !== undefined ? Number(state.sliders[id]) : 0;
        sliderEl['rangeslider-js'].update({ value: rawVal });
        if (inputEl) { inputEl.value = rawVal; inputEl.setAttribute('value', rawVal); }
    });

    // Set / main-stat selectors
    const { sets, exclude } = state.setFilters;
    $('#inputSet1').multipleSelect('setSelects', (sets[0] || []).map((x) => x.replace('Set', '')));
    $('#inputSet2').multipleSelect('setSelects', (sets[1] || []).map((x) => x.replace('Set', '')));
    $('#inputSet3').multipleSelect('setSelects', (sets[2] || []).map((x) => x.replace('Set', '')));
    $('#inputExcludeSet').multipleSelect('setSelects', (exclude || []).map((x) => x.replace('Set', '')));
    const [necklace, ring, boots] = state.mainFilters;
    $('#inputNecklaceStat').multipleSelect('setSelects', necklace || []);
    $('#inputRingStat').multipleSelect('setSelects', ring || []);
    $('#inputBootsStat').multipleSelect('setSelects', boots || []);

    // Options checkboxes
    $('#inputPredictReforges').prop('checked', state.options.predictReforges);
    $('#inputSubstatMods').prop('checked', state.options.substatMods);
    $('#inputAllowLockedItems').prop('checked', state.options.allowLockedItems);
    $('#inputAllowEquippedItems').prop('checked', state.options.allowEquippedItems);
    $('#inputOrderedHeroPriority').prop('checked', state.options.orderedHeroPriority);
    $('#inputKeepCurrentItems').prop('checked', state.options.keepCurrentItems);

    // Slot substat filters
    slotSubstatFiltersMap[''] = JSON.parse(JSON.stringify(state.slotSubstatFilterSnapshot));
    updateSlotSubstatFilterButton('');

    calculatePlaceholderRatings();
    recalculateFilters();
}

function showUndoResetButton() {
    const btn = document.getElementById('submitOptimizerUndoReset');
    if (!btn) return;
    btn.classList.remove('display-none');
    if (_undoResetTimer) clearTimeout(_undoResetTimer);
    _undoResetTimer = setTimeout(() => {
        btn.classList.add('display-none');
    }, 5000);
}

function hideUndoResetButton() {
    const btn = document.getElementById('submitOptimizerUndoReset');
    if (!btn) return;
    btn.classList.add('display-none');
    if (_undoResetTimer) { clearTimeout(_undoResetTimer); _undoResetTimer = null; }
}
// ---------------------------------------------------------------------------

const OptimizerTab = {
    initialize: () => {
        ipc.on('resized', () => {
            resized = true;
            fixSliders();
        });

        document
            .getElementById('inputMinDefLimit')
            .addEventListener('change', () => {
                calculatePlaceholderRatings();
            });
        document
            .getElementById('inputMinHpLimit')
            .addEventListener('change', () => {
                calculatePlaceholderRatings();
            });

        document
            .getElementById('inputMinAtkLimit')
            .addEventListener('change', () => {
                calculatePlaceholderRatings();
            });
        document
            .getElementById('inputMinCdLimit')
            .addEventListener('change', () => {
                calculatePlaceholderRatings();
            });

        document
            .getElementById('submitOptimizerRequest')
            .addEventListener('click', () => {
                submitOptimizationRequest();
            });
        document
            .getElementById('submitOptimizerFilter')
            .addEventListener('click', () => {
                submitOptimizationFilterRequest();
            });
        document
            .getElementById('submitOptimizerCancel')
            .addEventListener('click', () => {
                if (progressTimer) {
                    clearInterval(progressTimer);
                }
                Api.cancelOptimizationRequest();
                // Immediately snapshot partial results from the still-active live
                // array, before GPU/CPU threads finish winding down or the execution
                // is deleted by a subsequent search start.
                const snapId = currentExecutionId;
                Api.getBestSoFar(snapId)
                    .then((response) => {
                        if (response && response.maximum > 0) {
                            OptimizerGrid.setRestoredSource(response.heroStats, response.maximum);
                            const n = Number(response.maximum).toLocaleString();
                            updateOptimizerTabLabel(n);
                            $('#resultsFoundNum').text(n);
                            Notifier.info(`Search cancelled — showing best ${n} results found`);
                        }
                    })
                    .catch(() => {});
            });
        // document.getElementById('submitOptimizerLoad').addEventListener("click", async () => {
        //     loadPreviousHeroFilters();
        // });

        document
            .getElementById('submitOptimizerHeroLibrary')
            .addEventListener('click', async () => {
                const heroId = document.getElementById('inputHeroAdd').value;
                const heroResponse = await Api.getHeroById(
                    heroId,
                    $('#inputPredictReforges').prop('checked'),
                );
                electron.shell.openExternal(
                    `https://fribbels.github.io/e7/hero-library.html?hero=${heroResponse.hero.name}`,
                );
            });

        document.getElementById('bottomTabBtnGear').addEventListener('click', () => {
            OptimizerTab.switchBottomTab('gear');
        });
        document.getElementById('bottomTabBtnFribbels').addEventListener('click', () => {
            OptimizerTab.switchBottomTab('fribbels');
        });
        document.getElementById('fribbels-fetch-btn').addEventListener('click', () => {
            fribbelsLoadedHeroName = null; // force reload
            fribbelsAllBuilds = [];
            fribbelsCurrentBuildRow = null;
            fribbelsLoadData();
        });
        document.getElementById('fribbelsSetTargets').addEventListener('click', () => {
            fribbelsApplyRow(fribbelsSelectedRow, 'targets');
        });
        document.getElementById('fribbelsSetMinLimits').addEventListener('click', () => {
            fribbelsApplyRow(fribbelsSelectedRow, 'minlimits');
        });
        document.getElementById('fribbelsAutoPriorities').addEventListener('click', () => {
            fribbelsAutoPriorities(fribbelsSelectedRow);
        });
        document.getElementById('fribbelsP50Priorities').addEventListener('click', () => {
            fribbelsP50Priorities();
        });
        document.getElementById('fribbelsDeselectRow').addEventListener('click', () => {
            fribbelsDeselectRow();
        });
        document.getElementById('fribbels-filter-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('fribbels-filter-popup').classList.toggle('display-none');
        });
        document.getElementById('fribbels-filter-close-btn').addEventListener('click', () => {
            document.getElementById('fribbels-filter-popup').classList.add('display-none');
        });
        document.getElementById('fribbels-filter-apply-btn').addEventListener('click', () => {
            document.getElementById('fribbels-filter-popup').classList.add('display-none');
            fribbelsApplyFilters();
        });
        document.getElementById('fribbels-filter-reset-btn').addEventListener('click', () => {
            ['minGS', 'minBS', 'minSPD', 'minATK', 'minDEF', 'minHP', 'minCR', 'minCD', 'minEFF', 'minRES', 'minEHP'].forEach((id) => {
                const el = document.getElementById(`fFilter-${id}`);
                if (el) el.value = '';
            });
            Object.keys(FRIBBELS_SET_ABBREV).forEach((key) => {
                const el = document.getElementById(`fFilter-${key}`);
                if (el) el.checked = false;
            });
            const artifactSearch = document.getElementById('fFilter-artifactSearch');
            if (artifactSearch) artifactSearch.value = '';
            document.querySelectorAll('.fFilter-artifact-cb').forEach((cb) => { cb.checked = false; });
            document.querySelectorAll('#fFilter-artifactList label').forEach((lbl) => lbl.classList.remove('hidden'));
            fribbelsApplyFilters();
        });
        document.getElementById('fribbels-summary-btn').addEventListener('click', () => {
            document.getElementById('fribbels-summary-panel').classList.toggle('display-none');
        });
        fribbelsPopulateSetFilterUI();
        document.getElementById('fFilter-artifactSearch')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('#fFilter-artifactList label').forEach((lbl) => {
                lbl.classList.toggle('hidden', !lbl.textContent.toLowerCase().includes(q));
            });
        });
        document.addEventListener('mousedown', (e) => {
            const popup = document.getElementById('fribbels-filter-popup');
            const filterBtn = document.getElementById('fribbels-filter-btn');
            if (popup && !popup.classList.contains('display-none')) {
                if (!popup.contains(e.target) && e.target !== filterBtn) {
                    popup.classList.add('display-none');
                }
            }
        });
        document
            .getElementById('submitOptimizerReset')
            .addEventListener('click', () => {
                // Push current state to undo history before clearing
                filterResetHistory.push(captureFilterState());
                if (filterResetHistory.length > FILTER_RESET_HISTORY_LIMIT) {
                    filterResetHistory.shift();
                }
                showUndoResetButton();

                clearRatings();
                clearStats();
                calculatePlaceholderRatings();
                // clearForce();

                Selectors.clearGearMainAndSets();

                clearSubstatPriority();

                clearOptions();

                slotSubstatFiltersMap[''] = {};
                updateSlotSubstatFilterButton('');

                recalculateFilters();
            });
        document
            .getElementById('submitOptimizerUndoReset')
            .addEventListener('click', () => {
                if (filterResetHistory.length === 0) return;
                const state = filterResetHistory.pop();
                restoreFilterState(state);
                hideUndoResetButton();
            });
        document
            .getElementById('openSlotSubstatFilter')
            .addEventListener('click', async () => {
                const result = await Dialog.slotSubstatFilterDialog(
                    slotSubstatFiltersMap[''] || {},
                    '',
                );
                if (result) {
                    slotSubstatFiltersMap[''] = result.slotFilters;
                    updateSlotSubstatFilterButton('');
                    recalculateFilters();
                    Saves.autoSave();
                }
            });
        document
            .getElementById('slotFilterSetAll')
            .addEventListener('click', () => {
                const pct = Math.min(
                    100,
                    Math.max(
                        1,
                        parseInt(
                            document.getElementById('slotFilterAllInput').value,
                            10,
                        ) || 100,
                    ),
                );
                setAllSlotSliders(pct);
                recalculateFilters();
            });
        document
            .getElementById('slotFilterAuto')
            .addEventListener('click', () => {
                const targetM =
                    parseFloat(
                        document.getElementById('slotFilterAutoTarget').value,
                    ) || 3;
                const TARGET = targetM * 1_000_000;
                const SLOT_KEYS = [
                    'Weapon',
                    'Helmet',
                    'Armor',
                    'Necklace',
                    'Ring',
                    'Boots',
                ];
                const totalPre = SLOT_KEYS.reduce(
                    (acc, s) => acc * Math.max(1, allItemsSlotCounts[s] || 1),
                    1,
                );
                const pct = Math.min(
                    100,
                    Math.max(
                        1,
                        Math.round(100 * Math.pow(TARGET / totalPre, 1 / 6)),
                    ),
                );
                document.getElementById('slotFilterAllInput').value = pct;
                setAllSlotSliders(pct);
                recalculateFilters();
            });
        document
            .getElementById('slotFilterAutoFromTargets')
            .addEventListener('click', async () => {
                const heroId = document.getElementById('inputHeroAdd').value;
                if (!heroId) return;
                const params = OptimizerTab.getOptimizationRequestParams();
                const heroResponse = await Api.getHeroById(
                    heroId,
                    $('#inputPredictReforges').prop('checked'),
                );
                const allItemsResponse = await getAllItemsCached();
                autoConfigSlotFiltersFromTargets(
                    params,
                    allItemsResponse.items,
                    heroResponse.baseStats,
                );
                recalculateFilters();
            });
        document
            .getElementById('saveFilterPreset')
            .addEventListener('click', () => {
                const heroId = document.getElementById('inputHeroAdd').value;
                if (!heroId) return;
                saveFilterPreset(heroId, currentHeroResponse, '');
            });
        initPresetRenameModal();
        document
            .getElementById('gearPreviewAddBuild')
            .addEventListener('click', () => {
                addBuild();
            });
        document
            .getElementById('gearPreviewRemoveBuild')
            .addEventListener('click', () => {
                removeBuild();
            });
        document
            .getElementById('gearPreviewSaveSelected')
            .addEventListener('click', () => {
                saveSelectedBuilds();
            });
        document
            .getElementById('gearPreviewCopyBuild')
            .addEventListener('click', () => {
                copyBuildToClipboard();
            });
        document
            .getElementById('gearPreviewPinCompare')
            .addEventListener('click', () => {
                pinCurrentBuildRow();
            });
        document
            .getElementById('gearPreviewCompare')
            .addEventListener('click', () => {
                openCompareModal();
            });
        document
            .getElementById('compareBuildClose')
            .addEventListener('click', () => {
                document.getElementById('compareBuildOverlay').style.display = 'none';
            });
        document
            .getElementById('compareBuildOverlay')
            .addEventListener('click', (e) => {
                if (e.target === document.getElementById('compareBuildOverlay')) {
                    document.getElementById('compareBuildOverlay').style.display = 'none';
                }
            });
        document
            .getElementById('gearPreviewEquip')
            .addEventListener('click', () => {
                equipSelectedGear();
            });
        document
            .getElementById('gearPreviewUnequip')
            .addEventListener('click', () => {
                unequipSelectedGear();
            });
        document
            .getElementById('gearPreviewLock')
            .addEventListener('click', () => {
                lockSelectedGear();
            });
        document
            .getElementById('gearPreviewUnlock')
            .addEventListener('click', () => {
                unlockSelectedGear();
            });
        document
            .getElementById('gearPreviewSelectAll')
            .addEventListener('click', () => {
                $('#optimizerGridWeapon').prop('checked', true);
                $('#optimizerGridHelmet').prop('checked', true);
                $('#optimizerGridArmor').prop('checked', true);
                $('#optimizerGridNecklace').prop('checked', true);
                $('#optimizerGridRing').prop('checked', true);
                $('#optimizerGridBoots').prop('checked', true);
            });
        document
            .getElementById('gearPreviewDeselectAll')
            .addEventListener('click', () => {
                $('#optimizerGridWeapon').prop('checked', false);
                $('#optimizerGridHelmet').prop('checked', false);
                $('#optimizerGridArmor').prop('checked', false);
                $('#optimizerGridNecklace').prop('checked', false);
                $('#optimizerGridRing').prop('checked', false);
                $('#optimizerGridBoots').prop('checked', false);
            });

        $('#inputHeroAdd').change(async () => {
            const heroId = document.getElementById('inputHeroAdd').value;
            const heroResponse = await Api.getHeroById(
                heroId,
                $('#inputPredictReforges').prop('checked'),
            );

            invalidateItemsCache();
            recalculateFilters();
            redrawHeroImage();
            OptimizerTab.redrawHeroSelector();
            OptimizerTab.loadPreviousHeroFilters(heroResponse, null, true);
            OptimizerGrid.setPinnedHero(heroResponse.hero);
            OptimizerGrid.setBaseStats(heroResponse.baseStats);
            StatPreview.draw(heroResponse.hero, heroResponse.hero);
            // Invalidate Fribbels cache when hero changes
            fribbelsLoadedHeroName = null;
            fribbelsSelectedRow = null;
            fribbelsAllBuilds = [];
            fribbelsCurrentBuildRow = null;

            // Restore the most recent cached results for this hero so the
            // grid isn't empty while the user decides whether to re-run.
            OptimizerGrid.clearRestoredSource();
            const cachedEntry = loadHeroResultsFromCache(heroId);
            if (cachedEntry) {
                OptimizerGrid.setRestoredSource(cachedEntry.rows, cachedEntry.maximum);
                const cachedCount = Number(cachedEntry.maximum).toLocaleString();
                $('#resultsFoundNum').text(cachedCount);
                updateOptimizerTabLabel(cachedCount);
                $('#searchedPermutationsNum').text('—');
                $('#maxPermutationsNum').text('—');
            } else {
                $('#resultsFoundNum').text('0');
                updateOptimizerTabLabel(null);
            }
        });

        $('#forceNumberSelect').change(recalculateFilters);
        $('.optimizer-number-input').change(debouncedRecalculate);
        $('.optimizer-checkbox').change(recalculateFilters);
        $('.inputGearFilterSelect').change(recalculateFilters);
        $('.inputSetFilterSelect').change(recalculateFilters);
        $('.icon-close').click(recalculateFilters);

        document
            .getElementById('inputOrderedHeroPriority')
            .addEventListener('change', (e) => {
                const panel = document.getElementById('heroPriorityPanel');
                if (e.target.checked) {
                    panel.classList.remove('display-none');
                    populateHeroPriorityList();
                } else {
                    panel.classList.add('display-none');
                }
            });
        // $('#filterSliderInput').change(recalculateFilters);

        document.getElementById('forceFilterToggle').addEventListener('click', () => {
            const section = document.getElementById('forceFilterSection');
            const label = document.getElementById('forceFilterToggleLabel');
            const open = section.style.display === 'none';
            section.style.display = open ? '' : 'none';
            label.textContent = (open ? '▾ ' : '▸ ') + (label.dataset.t !== undefined ? i18next.t('Force Substat Filter') : 'Force Substat Filter');
        });

        document.getElementById('mustHaveSubstatToggle').addEventListener('click', () => {
            const section = document.getElementById('mustHaveSubstatSection');
            const label = document.getElementById('mustHaveSubstatToggleLabel');
            const open = section.style.display === 'none';
            section.style.display = open ? '' : 'none';
            label.textContent = (open ? '▾ ' : '▸ ') + 'Must-Have Substat';
        });

        $('#mustHaveSubstatSelect').change(recalculateFilters);
        $('#mustHaveSubstatCount').change(recalculateFilters);

        $('.optionsExcludeGearFrom').change(() => {
            // Doesnt work without explicit function call for some reason
            recalculateFilters();
        });

        document
            .getElementById('tab1label')
            .addEventListener('click', async () => {
                await OptimizerTab.redrawHeroSelector();
                invalidateItemsCache();
                recalculateFilters();
                fixSliders();
                if (
                    document.getElementById('inputOrderedHeroPriority').checked
                ) {
                    populateHeroPriorityList();
                }
            });

        document
            .getElementById('substatPriorityLabel')
            .addEventListener('click', async () => {
                clearSubstatPriority();
                recalculateFilters();
            });
        document
            .getElementById('statsLabel')
            .addEventListener('click', async () => {
                clearStats();
                recalculateFilters();
            });
        document
            .getElementById('ratingsLabel')
            .addEventListener('click', async () => {
                clearRatings();
                recalculateFilters();
            });
        document
            .getElementById('skillsLabel')
            .addEventListener('click', async () => {
                clearSkills();
                recalculateFilters();
            });
        document
            .getElementById('optionsLabel')
            .addEventListener('click', async () => {
                clearOptions();
                recalculateFilters();
            });

        document
            .getElementById('skillOptionsButton')
            .addEventListener('click', async () => {
                const heroId = document.getElementById('inputHeroAdd').value;
                if (!heroId) return;
                console.log('addSkills', heroId);

                await OptimizerTab.showSkillOptionsWindow(heroId);

                Saves.autoSave();
            });

        document
            .getElementById('addBonusStatsOptimizerButton')
            .addEventListener('click', async () => {
                const heroId = document.getElementById('inputHeroAdd').value;
                if (!heroId) return;

                const { hero } = await Api.getHeroById(heroId);

                await HeroesTab.showBonusStatsWindow(hero);
                redrawHeroImage();
                Saves.autoSave();
            });

        document
            .getElementById('addSubstatModsOptimizerButton')
            .addEventListener('click', async () => {
                const heroId = document.getElementById('inputHeroAdd').value;
                if (!heroId) return;

                const { hero } = await Api.getHeroById(heroId);

                const modStats = await Dialog.editModStatsDialog(hero);
                if (!modStats) return;

                // mods

                await Api.setModStats(modStats, hero.id);
                Notifier.success('Saved mod stats');
                Saves.autoSave();
                redrawHeroImage();

                // var heroId = document.getElementById('inputHeroAdd').value;
                // if (!heroId) return;
                // console.log("addSkills", heroId);

                // var skillOptions = await OptimizerTab.showSkillOptionsWindow(heroId);

                // Saves.autoSave();
            });
        // document.getElementById('accessorySetsLabel').addEventListener("click", async () => {
        //     Selectors.clearGearMainAndSets();
        //     recalculateFilters();
        // });

        const updatePriorityBar = () => updatePriorityWeightBar('');
        OptimizerTab.buildSlider('#atkSlider', true, updatePriorityBar);
        OptimizerTab.buildSlider('#hpSlider', true, updatePriorityBar);
        OptimizerTab.buildSlider('#defSlider', true, updatePriorityBar);
        OptimizerTab.buildSlider('#spdSlider', true, updatePriorityBar);
        OptimizerTab.buildSlider('#crSlider', true, updatePriorityBar);
        OptimizerTab.buildSlider('#cdSlider', true, updatePriorityBar);
        OptimizerTab.buildSlider('#effSlider', true, updatePriorityBar);
        OptimizerTab.buildSlider('#resSlider', true, updatePriorityBar);
        ['inputAtkTarget', 'inputDefTarget', 'inputHpTarget', 'inputSpdTarget',
            'inputCrTarget', 'inputCdTarget', 'inputEffTarget', 'inputResTarget',
            'inputAtkMinTarget', 'inputDefMinTarget', 'inputHpMinTarget', 'inputSpdMinTarget',
            'inputCrMinTarget', 'inputCdMinTarget', 'inputEffMinTarget', 'inputResMinTarget'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', updatePriorityBar);
                el.addEventListener('change', () => OptimizerGrid.refreshTargetCells());
            }
        });
        OptimizerTab.buildTopSlider('#weaponFilterSlider', true);
        OptimizerTab.buildTopSlider('#helmetFilterSlider', true);
        OptimizerTab.buildTopSlider('#armorFilterSlider', true);
        OptimizerTab.buildTopSlider('#necklaceFilterSlider', true);
        OptimizerTab.buildTopSlider('#ringFilterSlider', true);
        OptimizerTab.buildTopSlider('#bootsFilterSlider', true);
    },

    buildSlider: (slider, recalc, extraCallback) => {
        const sliderEl = document.querySelector(slider);
        const nrInput = document.querySelector(`${slider}Input`);
        rangesliderJs.create(sliderEl, {
            onSlideEnd: (val) => {
                nrInput.setAttribute('value', val);
                nrInput.value = val;
                if (extraCallback) extraCallback();
                if (recalc) {
                    debouncedRecalculate();
                }
            },
            onSlide: (val) => {
                nrInput.setAttribute('value', val);
                nrInput.value = val;
                if (extraCallback) extraCallback();
            },
        });
        nrInput.addEventListener('input', (ev) => {
            sliderEl['rangeslider-js'].update({ value: ev.target.value });
            if (extraCallback) extraCallback();
        });
        nrInput.addEventListener('change', (ev) => {
            const min = parseInt(sliderEl.min, 10);
            const max = parseInt(sliderEl.max, 10);
            const parsed = parseInt(ev.target.value, 10);
            const clamped = Number.isNaN(parsed)
                ? 0
                : Math.min(max, Math.max(min, parsed));
            nrInput.value = clamped;
            sliderEl['rangeslider-js'].update({ value: clamped });
            if (extraCallback) extraCallback();
            if (recalc) debouncedRecalculate();
        });
    },

    buildTopSlider: (slider, recalc) => {
        const sliderEl = document.querySelector(slider);
        const nrInput = document.querySelector(`${slider}Input`);
        let inputDriven = false;
        rangesliderJs.create(sliderEl, {
            onSlideEnd: (val) => {
                if (!inputDriven) {
                    const displayed = Math.round(0.01 * val ** 2);
                    nrInput.setAttribute('value', displayed);
                    nrInput.value = displayed;
                    sliderEl.title = `Slider position ${val} → top ${displayed}% of gear by score`;
                }
                if (recalc) {
                    debouncedRecalculate();
                }
            },
            onSlide: (val) => {
                if (!inputDriven) {
                    const displayed = Math.round(0.01 * val ** 2);
                    nrInput.setAttribute('value', displayed);
                    nrInput.value = displayed;
                    sliderEl.title = `Slider position ${val} → top ${displayed}% of gear by score`;
                }
            },
        });
        nrInput.addEventListener('input', (ev) => {
            const val = parseInt(ev.target.value, 10);
            if (!Number.isNaN(val) && val >= 1) {
                inputDriven = true;
                sliderEl['rangeslider-js'].update({
                    value: Math.round(10 * Math.sqrt(val)),
                });
                inputDriven = false;
            }
        });
        nrInput.addEventListener('change', (ev) => {
            const parsed = parseInt(ev.target.value, 10);
            const clamped = Number.isNaN(parsed)
                ? 100
                : Math.min(100, Math.max(1, parsed));
            nrInput.value = clamped;
            inputDriven = true;
            sliderEl['rangeslider-js'].update({
                value: Math.round(10 * Math.sqrt(clamped)),
            });
            inputDriven = false;
            if (recalc) debouncedRecalculate();
        });
    },

    applyItemFilters: async (
        params,
        heroResponse,
        allItemsResponse,
        submit,
        allowedHeroIds,
        overrideGearMainFilters,
        index,
    ) => {
        ModificationFilter.clear(index);

        const gearMainFilters =
            overrideGearMainFilters || Selectors.getGearMainFilters();
        const getAllItemsResponse = allItemsResponse;
        const { hero } = heroResponse;
        const { baseStats } = heroResponse;
        const heroId = hero.id;
        const allItems = getAllItemsResponse.items;
        let items = allItems;

        const allHeroesResponse = await getAllHeroesCached();
        const { heroes } = allHeroesResponse;

        if (!params.inputSets) {
            params.inputSets = [
                params.inputSetsOne,
                params.inputSetsTwo,
                params.inputSetsThree,
            ];
        }

        console.log('Optimization params', params);

        if (params.enhanceLimit) {
            const limit =
                params.enhanceLimit.length > 0
                    ? parseInt(params.enhanceLimit[0], 10)
                    : 0;
            items = items.filter((x) => x.enhance >= limit);
        }

        if (params.inputExcludeSet.length > 0) {
            items = items.filter(
                (x) => !params.inputExcludeSet.includes(x.set),
            );
        }

        if (params.excludeFilter.length > 0) {
            items = items.filter(
                (x) =>
                    !params.excludeFilter.includes(x.equippedById) ||
                    x.equippedById === heroId,
            );
        }

        // if (params.inputOnlyMaxedGear) {
        //     items = items.filter(x => x.enhance === 15 && !Reforge.isReforgeable(x));
        // }

        // Filter items to only the selected sets whenever any sets are specified.
        // Previously this only ran for 4+2 or 2+2+2 combos — 2+2 and single-set
        // selections would skip filtering and send all sets to the backend, massively
        // bloating the search space.
        const possibleSets = params.inputSets ? params.inputSets.flat().filter(Boolean) : [];
        if (possibleSets.length > 0) {
            items = items.filter((x) => possibleSets.includes(x.set));
        }

        if (!params.inputAllowEquippedItems) {
            items = items.filter(
                (x) => !x.equippedById || x.equippedById === heroId,
            );
        }

        if (!params.inputAllowLockedItems) {
            items = items.filter((x) => !x.locked || x.equippedById === heroId);
        }

        if (params.inputOrderedHeroPriority) {
            // Sort by index so drag-reordered priority is respected
            const sortedHeroes = [...heroes].sort(
                (a, b) => (a.index ?? 0) - (b.index ?? 0),
            );
            let higherPriorityHeroes = [];
            for (let i = 0; i < sortedHeroes.length; i += 1) {
                if (sortedHeroes[i].id === hero.id) {
                    break;
                }
                higherPriorityHeroes.push(sortedHeroes[i].id);
            }
            higherPriorityHeroes = higherPriorityHeroes.filter(
                (x) => !(allowedHeroIds || []).includes(x),
            );
            items = items.filter(
                (x) => !higherPriorityHeroes.includes(x.equippedById),
            );
        }

        if (params.inputKeepCurrentItems) {
            if (!hero.equipment) {
                items = [];
                hero.equipment = {};
            }

            const equipped = Object.values(hero.equipment);
            for (let i = 0; i < 6; i += 1) {
                const item = equipped[i];
                if (item) {
                    items = items.filter((x) => {
                        const passFilter =
                            item.gear !== x.gear ||
                            item.equippedById === x.equippedById;
                        // if (!passFilter)
                        //     console.log(x);
                        return passFilter;
                    });
                }
            }
        }

        for (let i = 0; i < gearMainFilters.length; i += 1) {
            const filter = gearMainFilters[i];
            if (filter.length > 0) {
                if (i === 0)
                    items = items.filter(
                        (x) =>
                            (filter.includes(x.main.type) &&
                                x.gear === 'Necklace') ||
                            x.gear !== 'Necklace',
                    );
                if (i === 1)
                    items = items.filter(
                        (x) =>
                            (filter.includes(x.main.type) &&
                                x.gear === 'Ring') ||
                            x.gear !== 'Ring',
                    );
                if (i === 2)
                    items = items.filter(
                        (x) =>
                            (filter.includes(x.main.type) &&
                                x.gear === 'Boots') ||
                            x.gear !== 'Boots',
                    );
            }
        }

        if (params.inputPredictReforges) {
            console.log('Predict reforges enabled');
            ItemAugmenter.augment(items);
            items.forEach((x) => {
                if (Reforge.isReforgeableNow(x)) {
                    x.substats.forEach((substat) => {
                        if (substat.reforgedValue) {
                            substat.value = substat.reforgedValue;
                        }
                    });

                    x.main.value = x.main.reforgedValue;
                }
            });
        }

        const min =
            params.inputMinItemGSLimit === undefined
                ? 0
                : params.inputMinItemGSLimit;
        const max =
            params.inputMaxItemGSLimit === undefined
                ? 99999999
                : params.inputMaxItemGSLimit;

        items = items.filter((item) => {
            return item.reforgedWss > min && item.reforgedWss < max;
        });

        // Per-slot substat pre-filter
        const slotSubstatFilters = params.inputSlotSubstatFilters;
        if (slotSubstatFilters) {
            items = items.filter((item) => {
                const sf = slotSubstatFilters[item.gear];
                if (
                    !sf ||
                    !sf.enabled ||
                    !sf.substats ||
                    sf.substats.length === 0 ||
                    sf.minCount <= 0
                )
                    return true;
                const matchCount = item.substats.filter((s) =>
                    sf.substats.includes(s.type),
                ).length;
                return matchCount >= sf.minCount;
            });
        }

        const forceNumber = parseInt($('#forceNumberSelect').val(), 10);
        items = ForceFilter.applyForceFilters(params, items, forceNumber);

        // B: SPD impossibility fast-reject — skip backend if max achievable SPD < min limit
        if (items.length > 0 && params.inputSpdMinLimit) {
            const maxSpd = computeMaxAchievableSpd(items, baseStats, hero);
            if (maxSpd < params.inputSpdMinLimit) {
                console.log(
                    `SPD fast-reject: min ${params.inputSpdMinLimit} unreachable — pool max is ${maxSpd}`,
                );
                items = [];
            }
        }

        // C: Global must-have substat filter
        if (items.length > 0) {
            items = applyMustHaveSubstatFilter(params, items);
        }

        const preModCount = items.length;
        items = ModificationFilter.apply(
            items,
            params.inputSubstatMods,
            hero,
            submit,
            index,
        );
        const postModCount = items.length;

        items = PriorityFilter.applyPriorityFilters(
            params,
            items,
            baseStats,
            allItems,
            params.inputPredictReforges,
            params.inputSubstatMods,
        );

        items = items.sort((a, b) => {
            return a.set - b.set;
        });

        const priorityBucket = [];
        const restBucket = [];
        // Previously only checked inputSetsOne, so items from Sets 2 & 3 went to
        // restBucket and were deprioritized. Now all selected sets are prioritized equally.
        const allSelectedSets = params.inputSets ? params.inputSets.flat().filter(Boolean) : [];
        items.forEach((item) => {
            if (allSelectedSets.length === 0 || allSelectedSets.includes(item.set)) {
                priorityBucket.push(item);
            } else {
                restBucket.push(item);
            }
        });
        const prioritizedItems = priorityBucket.concat(restBucket);

        console.log('Filtered items', prioritizedItems.length);
        currentFilteredItems = prioritizedItems;
        return {
            items: prioritizedItems,
            allItems,
            preModCount,
            postModCount,
        };
    },

    getOptimizationRequestParams: (showError, indexArg) => {
        const index = indexArg ?? '';
        const request = new OptimizationRequest();

        const setFilters = Selectors.getSetFilters(index);
        const mainFilters = Selectors.getGearMainFilters(index);
        const excludeFilter = Selectors.getExcludeGearFrom(index);
        const enhanceLimit = Selectors.getEnhanceLimit(index);
        const setFormat = getSetFormat(setFilters.sets, showError);
        console.log('SETFORMAT', setFormat);

        request.inputSubstatMods = readCheckbox(`inputSubstatMods${index}`);
        request.inputAllowLockedItems = readCheckbox(
            `inputAllowLockedItems${index}`,
        );
        request.inputAllowEquippedItems = readCheckbox(
            `inputAllowEquippedItems${index}`,
        );
        request.inputOrderedHeroPriority = readCheckbox(
            `inputOrderedHeroPriority${index}`,
        );
        request.inputKeepCurrentItems = readCheckbox(
            `inputKeepCurrentItems${index}`,
        );
        request.inputOnlyMaxedGear = readCheckbox(`inputOnlyMaxedGear${index}`);
        request.inputPredictReforges =
            request.inputSubstatMods ||
            readCheckbox(`inputPredictReforges${index}`);
        // request.inputOver85   = readCheckbox('inputOver85');
        // request.inputOnlyPlus15Gear   = readCheckbox('inputOnlyPlus15Gear');

        request.inputAtkMinLimit = readNumber(`inputMinAtkLimit${index}`);
        request.inputAtkMaxLimit = readNumber(`inputMaxAtkLimit${index}`);
        request.inputHpMinLimit = readNumber(`inputMinHpLimit${index}`);
        request.inputHpMaxLimit = readNumber(`inputMaxHpLimit${index}`);
        request.inputDefMinLimit = readNumber(`inputMinDefLimit${index}`);
        request.inputDefMaxLimit = readNumber(`inputMaxDefLimit${index}`);
        request.inputSpdMinLimit = readNumber(`inputMinSpdLimit${index}`);
        request.inputSpdMaxLimit = readNumber(`inputMaxSpdLimit${index}`);
        request.inputCrMinLimit = readNumber(`inputMinCrLimit${index}`);
        request.inputCrMaxLimit = readNumber(`inputMaxCrLimit${index}`);
        request.inputCdMinLimit = readNumber(`inputMinCdLimit${index}`);
        request.inputCdMaxLimit = readNumber(`inputMaxCdLimit${index}`);
        request.inputEffMinLimit = readNumber(`inputMinEffLimit${index}`);
        request.inputEffMaxLimit = readNumber(`inputMaxEffLimit${index}`);
        request.inputResMinLimit = readNumber(`inputMinResLimit${index}`);
        request.inputResMaxLimit = readNumber(`inputMaxResLimit${index}`);

        request.inputAtkTarget = readNumber(`inputAtkTarget${index}`);
        request.inputHpTarget = readNumber(`inputHpTarget${index}`);
        request.inputDefTarget = readNumber(`inputDefTarget${index}`);
        request.inputSpdTarget = readNumber(`inputSpdTarget${index}`);
        request.inputCrTarget = readNumber(`inputCrTarget${index}`);
        request.inputCdTarget = readNumber(`inputCdTarget${index}`);
        request.inputEffTarget = readNumber(`inputEffTarget${index}`);
        request.inputResTarget = readNumber(`inputResTarget${index}`);

        request.inputAtkMinTarget = readNumber(`inputAtkMinTarget${index}`);
        request.inputHpMinTarget = readNumber(`inputHpMinTarget${index}`);
        request.inputDefMinTarget = readNumber(`inputDefMinTarget${index}`);
        request.inputSpdMinTarget = readNumber(`inputSpdMinTarget${index}`);
        request.inputCrMinTarget = readNumber(`inputCrMinTarget${index}`);
        request.inputCdMinTarget = readNumber(`inputCdMinTarget${index}`);
        request.inputEffMinTarget = readNumber(`inputEffMinTarget${index}`);
        request.inputResMinTarget = readNumber(`inputResMinTarget${index}`);

        request.inputMinCpLimit = readNumber(`inputMinCpLimit${index}`);
        request.inputMaxCpLimit = readNumber(`inputMaxCpLimit${index}`);
        request.inputMinHppsLimit = readNumber(`inputMinHppsLimit${index}`);
        request.inputMaxHppsLimit = readNumber(`inputMaxHppsLimit${index}`);
        request.inputMinEhpLimit = readNumber(`inputMinEhpLimit${index}`);
        request.inputMaxEhpLimit = readNumber(`inputMaxEhpLimit${index}`);
        request.inputMinEhppsLimit = readNumber(`inputMinEhppsLimit${index}`);
        request.inputMaxEhppsLimit = readNumber(`inputMaxEhppsLimit${index}`);
        request.inputMinDmgLimit = readNumber(`inputMinDmgLimit${index}`);
        request.inputMaxDmgLimit = readNumber(`inputMaxDmgLimit${index}`);
        request.inputMinDmgpsLimit = readNumber(`inputMinDmgpsLimit${index}`);
        request.inputMaxDmgpsLimit = readNumber(`inputMaxDmgpsLimit${index}`);
        request.inputMinMcdmgLimit = readNumber(`inputMinMcdmgLimit${index}`);
        request.inputMaxMcdmgLimit = readNumber(`inputMaxMcdmgLimit${index}`);
        request.inputMinMcdmgpsLimit = readNumber(
            `inputMinMcdmgpsLimit${index}`,
        );
        request.inputMaxMcdmgpsLimit = readNumber(
            `inputMaxMcdmgpsLimit${index}`,
        );

        request.inputMinS1Limit = readNumber(`inputMinS1Limit${index}`);
        request.inputMaxS1Limit = readNumber(`inputMaxS1Limit${index}`);
        request.inputMinS2Limit = readNumber(`inputMinS2Limit${index}`);
        request.inputMaxS2Limit = readNumber(`inputMaxS2Limit${index}`);
        request.inputMinS3Limit = readNumber(`inputMinS3Limit${index}`);
        request.inputMaxS3Limit = readNumber(`inputMaxS3Limit${index}`);

        request.inputMinDmgHLimit = readNumber(`inputMinDmgHLimit${index}`);
        request.inputMaxDmgHLimit = readNumber(`inputMaxDmgHLimit${index}`);
        request.inputMinDmgDLimit = readNumber(`inputMinDmgDLimit${index}`);
        request.inputMaxDmgDLimit = readNumber(`inputMaxDmgDLimit${index}`);
        request.inputMinHmcdmgsLimit = readNumber(
            `inputMinHmcdmgsLimit${index}`,
        );
        request.inputMaxHmcdmgsLimit = readNumber(
            `inputMaxHmcdmgsLimit${index}`,
        );
        request.inputMinDmcdmgsLimit = readNumber(
            `inputMinDmcdmgsLimit${index}`,
        );
        request.inputMaxDmcdmgsLimit = readNumber(
            `inputMaxDmcdmgsLimit${index}`,
        );
        request.inputMinHdmgLimit = readNumber(`inputMinHdmgLimit${index}`);
        request.inputMaxHdmgLimit = readNumber(`inputMaxHdmgLimit${index}`);
        request.inputMinHdmgsLimit = readNumber(`inputMinHdmgsLimit${index}`);
        request.inputMaxHdmgsLimit = readNumber(`inputMaxHdmgsLimit${index}`);
        request.inputMinDdmgLimit = readNumber(`inputMinDdmgLimit${index}`);
        request.inputMaxDdmgLimit = readNumber(`inputMaxDdmgLimit${index}`);
        request.inputMinDdmgsLimit = readNumber(`inputMinDdmgsLimit${index}`);
        request.inputMaxDdmgsLimit = readNumber(`inputMaxDdmgsLimit${index}`);
        request.inputMinUpgradesLimit = readNumber(
            `inputMinUpgradesLimit${index}`,
        );
        request.inputMaxUpgradesLimit = readNumber(
            `inputMaxUpgradesLimit${index}`,
        );
        request.inputMinConversionsLimit = readNumber(
            `inputMinConversionsLimit${index}`,
        );
        request.inputMaxConversionsLimit = readNumber(
            `inputMaxConversionsLimit${index}`,
        );
        request.inputMinEquippedLimit = readNumber(
            `inputMinEquippedLimit${index}`,
        );
        request.inputMaxEquippedLimit = readNumber(
            `inputMaxEquippedLimit${index}`,
        );
        request.inputMinScoreLimit = readNumber(`inputMinScoreLimit${index}`);
        request.inputMaxScoreLimit = readNumber(`inputMaxScoreLimit${index}`);
        request.inputMinBSLimit = readNumber(`inputMinBSLimit${index}`);
        request.inputMaxBSLimit = readNumber(`inputMaxBSLimit${index}`);
        request.inputMinPriorityLimit = readNumber(
            `inputMinPriorityLimit${index}`,
        );
        request.inputMaxPriorityLimit = readNumber(
            `inputMaxPriorityLimit${index}`,
        );
        request.inputMinItemGSLimit = readNumber(`inputMinItemGSLimit${index}`);
        request.inputMaxItemGSLimit = readNumber(`inputMaxItemGSLimit${index}`);

        request.inputAtkMinForce = readNumber('inputMinAtkForce');
        request.inputAtkMaxForce = readNumber('inputMaxAtkForce');
        request.inputAtkPercentMinForce = readNumber('inputMinAtkPercentForce');
        request.inputAtkPercentMaxForce = readNumber('inputMaxAtkPercentForce');
        request.inputSpdMinForce = readNumber('inputMinSpdForce');
        request.inputSpdMaxForce = readNumber('inputMaxSpdForce');
        request.inputCrMinForce = readNumber('inputMinCrForce');
        request.inputCrMaxForce = readNumber('inputMaxCrForce');
        request.inputCdMinForce = readNumber('inputMinCdForce');
        request.inputCdMaxForce = readNumber('inputMaxCdForce');
        request.inputHpMinForce = readNumber('inputMinHpForce');
        request.inputHpMaxForce = readNumber('inputMaxHpForce');
        request.inputHpPercentMinForce = readNumber('inputMinHpPercentForce');
        request.inputHpPercentMaxForce = readNumber('inputMaxHpPercentForce');
        request.inputDefMinForce = readNumber('inputMinDefForce');
        request.inputDefMaxForce = readNumber('inputMaxDefForce');
        request.inputDefPercentMinForce = readNumber('inputMinDefPercentForce');
        request.inputDefPercentMaxForce = readNumber('inputMaxDefPercentForce');
        request.inputEffMinForce = readNumber('inputMinEffForce');
        request.inputEffMaxForce = readNumber('inputMaxEffForce');
        request.inputResMinForce = readNumber('inputMinResForce');
        request.inputResMaxForce = readNumber('inputMaxResForce');

        request.inputAtkPriority = readNumber(`atkSlider${index}Input`);
        request.inputHpPriority = readNumber(`hpSlider${index}Input`);
        request.inputDefPriority = readNumber(`defSlider${index}Input`);
        request.inputSpdPriority = readNumber(`spdSlider${index}Input`);
        request.inputCrPriority = readNumber(`crSlider${index}Input`);
        request.inputCdPriority = readNumber(`cdSlider${index}Input`);
        request.inputEffPriority = readNumber(`effSlider${index}Input`);
        request.inputResPriority = readNumber(`resSlider${index}Input`);
        request.inputWeaponFilterPriority = readNumber(
            `weaponFilterSlider${index}Input`,
        );
        request.inputHelmetFilterPriority = readNumber(
            `helmetFilterSlider${index}Input`,
        );
        request.inputArmorFilterPriority = readNumber(
            `armorFilterSlider${index}Input`,
        );
        request.inputNecklaceFilterPriority = readNumber(
            `necklaceFilterSlider${index}Input`,
        );
        request.inputRingFilterPriority = readNumber(
            `ringFilterSlider${index}Input`,
        );
        request.inputBootsFilterPriority = readNumber(
            `bootsFilterSlider${index}Input`,
        );

        request.inputForceNumberSelect = readNumber('forceNumberSelect');

        request.inputGlobalMustHaveStat = $('#mustHaveSubstatSelect').val() || null;
        request.inputGlobalMustHaveCount = readNumber('mustHaveSubstatCount') || 1;

        request.inputSets = setFilters.sets;

        [request.inputSetsOne, request.inputSetsTwo, request.inputSetsThree] =
            setFilters.sets;
        request.inputExcludeSet = setFilters.exclude;

        [
            request.inputNecklaceStat,
            request.inputRingStat,
            request.inputBootsStat,
        ] = mainFilters;

        request.excludeFilter = excludeFilter;
        request.enhanceLimit = enhanceLimit;

        request.setFormat = setFormat;

        request.inputSlotSubstatFilters = slotSubstatFiltersMap[index] || {};

        return request;
    },

    loadPreviousHeroFilters: async (heroResponseArg, indexArg, recalc, tab) => {
        const index = indexArg ?? '';
        let heroResponse = heroResponseArg;
        if (!indexArg) currentHeroResponse = heroResponseArg;

        if (!heroResponse) {
            const heroId = document.getElementById('inputHeroAdd').value;
            heroResponse = await Api.getHeroById(
                heroId,
                $('#inputPredictReforges').prop('checked'),
            );
        }

        const { hero } = heroResponse;
        const request = hero.optimizationRequest;

        if (!hero) return;
        if (!request) {
            const optimizerSettings = Settings.getOptimizerOptions();

            $(`#inputPredictReforges${index}`).prop(
                'checked',
                optimizerSettings.settingDefaultUseReforgedStats,
            );
            $(`#inputSubstatMods${index}`).prop(
                'checked',
                optimizerSettings.settingDefaultUseSubstatMods,
            );
            $(`#inputAllowLockedItems${index}`).prop(
                'checked',
                optimizerSettings.settingDefaultLockedItems,
            );
            $(`#inputAllowEquippedItems${index}`).prop(
                'checked',
                optimizerSettings.settingDefaultEquippedItems,
            );
            $(`#inputOrderedHeroPriority${index}`).prop(
                'checked',
                optimizerSettings.settingDefaultUseHeroPriority,
            );
            $(`#inputKeepCurrentItems${index}`).prop(
                'checked',
                optimizerSettings.settingDefaultKeepCurrent,
            );
            return;
        }

        $(`#inputMinAtkLimit${index}`).val(
            inputDisplayNumber(request.inputAtkMinLimit),
        );
        $(`#inputMaxAtkLimit${index}`).val(
            inputDisplayNumber(request.inputAtkMaxLimit),
        );
        $(`#inputMinHpLimit${index}`).val(
            inputDisplayNumber(request.inputHpMinLimit),
        );
        $(`#inputMaxHpLimit${index}`).val(
            inputDisplayNumber(request.inputHpMaxLimit),
        );
        $(`#inputMinDefLimit${index}`).val(
            inputDisplayNumber(request.inputDefMinLimit),
        );
        $(`#inputMaxDefLimit${index}`).val(
            inputDisplayNumber(request.inputDefMaxLimit),
        );
        $(`#inputMinSpdLimit${index}`).val(
            inputDisplayNumber(request.inputSpdMinLimit),
        );
        $(`#inputMaxSpdLimit${index}`).val(
            inputDisplayNumber(request.inputSpdMaxLimit),
        );
        $(`#inputMinCrLimit${index}`).val(
            inputDisplayNumber(request.inputCrMinLimit),
        );
        $(`#inputMaxCrLimit${index}`).val(
            inputDisplayNumber(request.inputCrMaxLimit),
        );
        $(`#inputMinCdLimit${index}`).val(
            inputDisplayNumber(request.inputCdMinLimit),
        );
        $(`#inputMaxCdLimit${index}`).val(
            inputDisplayNumber(request.inputCdMaxLimit),
        );
        $(`#inputMinEffLimit${index}`).val(
            inputDisplayNumber(request.inputEffMinLimit),
        );
        $(`#inputMaxEffLimit${index}`).val(
            inputDisplayNumber(request.inputEffMaxLimit),
        );
        $(`#inputMinResLimit${index}`).val(
            inputDisplayNumber(request.inputResMinLimit),
        );
        $(`#inputMaxResLimit${index}`).val(
            inputDisplayNumber(request.inputResMaxLimit),
        );

        $(`#inputAtkTarget${index}`).val(
            inputDisplayNumber(request.inputAtkTarget),
        );
        $(`#inputHpTarget${index}`).val(
            inputDisplayNumber(request.inputHpTarget),
        );
        $(`#inputDefTarget${index}`).val(
            inputDisplayNumber(request.inputDefTarget),
        );
        $(`#inputSpdTarget${index}`).val(
            inputDisplayNumber(request.inputSpdTarget),
        );
        $(`#inputCrTarget${index}`).val(
            inputDisplayNumber(request.inputCrTarget),
        );
        $(`#inputCdTarget${index}`).val(
            inputDisplayNumber(request.inputCdTarget),
        );
        $(`#inputEffTarget${index}`).val(
            inputDisplayNumber(request.inputEffTarget),
        );
        $(`#inputResTarget${index}`).val(
            inputDisplayNumber(request.inputResTarget),
        );

        $(`#inputAtkMinTarget${index}`).val(
            inputDisplayNumber(request.inputAtkMinTarget),
        );
        $(`#inputHpMinTarget${index}`).val(
            inputDisplayNumber(request.inputHpMinTarget),
        );
        $(`#inputDefMinTarget${index}`).val(
            inputDisplayNumber(request.inputDefMinTarget),
        );
        $(`#inputSpdMinTarget${index}`).val(
            inputDisplayNumber(request.inputSpdMinTarget),
        );
        $(`#inputCrMinTarget${index}`).val(
            inputDisplayNumber(request.inputCrMinTarget),
        );
        $(`#inputCdMinTarget${index}`).val(
            inputDisplayNumber(request.inputCdMinTarget),
        );
        $(`#inputEffMinTarget${index}`).val(
            inputDisplayNumber(request.inputEffMinTarget),
        );
        $(`#inputResMinTarget${index}`).val(
            inputDisplayNumber(request.inputResMinTarget),
        );

        $(`#inputMinCpLimit${index}`).val(
            inputDisplayNumber(request.inputMinCpLimit),
        );
        $(`#inputMaxCpLimit${index}`).val(
            inputDisplayNumber(request.inputMaxCpLimit),
        );
        $(`#inputMinHppsLimit${index}`).val(
            inputDisplayNumber(request.inputMinHppsLimit),
        );
        $(`#inputMaxHppsLimit${index}`).val(
            inputDisplayNumber(request.inputMaxHppsLimit),
        );
        $(`#inputMinEhpLimit${index}`).val(
            inputDisplayNumber(request.inputMinEhpLimit),
        );
        $(`#inputMaxEhpLimit${index}`).val(
            inputDisplayNumber(request.inputMaxEhpLimit),
        );
        $(`#inputMinEhppsLimit${index}`).val(
            inputDisplayNumber(request.inputMinEhppsLimit),
        );
        $(`#inputMaxEhppsLimit${index}`).val(
            inputDisplayNumber(request.inputMaxEhppsLimit),
        );
        $(`#inputMinDmgLimit${index}`).val(
            inputDisplayNumber(request.inputMinDmgLimit),
        );
        $(`#inputMaxDmgLimit${index}`).val(
            inputDisplayNumber(request.inputMaxDmgLimit),
        );
        $(`#inputMinDmgpsLimit${index}`).val(
            inputDisplayNumber(request.inputMinDmgpsLimit),
        );
        $(`#inputMaxDmgpsLimit${index}`).val(
            inputDisplayNumber(request.inputMaxDmgpsLimit),
        );
        $(`#inputMinMcdmgLimit${index}`).val(
            inputDisplayNumber(request.inputMinMcdmgLimit),
        );
        $(`#inputMaxMcdmgLimit${index}`).val(
            inputDisplayNumber(request.inputMaxMcdmgLimit),
        );
        $(`#inputMinMcdmgpsLimit${index}`).val(
            inputDisplayNumber(request.inputMinMcdmgpsLimit),
        );
        $(`#inputMaxMcdmgpsLimit${index}`).val(
            inputDisplayNumber(request.inputMaxMcdmgpsLimit),
        );

        $(`#inputMinS1Limit${index}`).val(
            inputDisplayNumber(request.inputMinS1Limit),
        );
        $(`#inputMaxS1Limit${index}`).val(
            inputDisplayNumber(request.inputMaxS1Limit),
        );
        $(`#inputMinS2Limit${index}`).val(
            inputDisplayNumber(request.inputMinS2Limit),
        );
        $(`#inputMaxS2Limit${index}`).val(
            inputDisplayNumber(request.inputMaxS2Limit),
        );
        $(`#inputMinS3Limit${index}`).val(
            inputDisplayNumber(request.inputMinS3Limit),
        );
        $(`#inputMaxS3Limit${index}`).val(
            inputDisplayNumber(request.inputMaxS3Limit),
        );

        $(`#inputMinDmgHLimit${index}`).val(
            inputDisplayNumber(request.inputMinDmgHLimit),
        );
        $(`#inputMaxDmgHLimit${index}`).val(
            inputDisplayNumber(request.inputMaxDmgHLimit),
        );
        $(`#inputMinDmgDLimit${index}`).val(
            inputDisplayNumber(request.inputMinDmgDLimit),
        );
        $(`#inputMaxDmgDLimit${index}`).val(
            inputDisplayNumber(request.inputMaxDmgDLimit),
        );
        $(`#inputMinHmcdmgsLimit${index}`).val(
            inputDisplayNumber(request.inputMinHmcdmgsLimit),
        );
        $(`#inputMaxHmcdmgsLimit${index}`).val(
            inputDisplayNumber(request.inputMaxHmcdmgsLimit),
        );
        $(`#inputMinDmcdmgsLimit${index}`).val(
            inputDisplayNumber(request.inputMinDmcdmgsLimit),
        );
        $(`#inputMaxDmcdmgsLimit${index}`).val(
            inputDisplayNumber(request.inputMaxDmcdmgsLimit),
        );
        $(`#inputMinHdmgLimit${index}`).val(
            inputDisplayNumber(request.inputMinHdmgLimit),
        );
        $(`#inputMaxHdmgLimit${index}`).val(
            inputDisplayNumber(request.inputMaxHdmgLimit),
        );
        $(`#inputMinHdmgsLimit${index}`).val(
            inputDisplayNumber(request.inputMinHdmgsLimit),
        );
        $(`#inputMaxHdmgsLimit${index}`).val(
            inputDisplayNumber(request.inputMaxHdmgsLimit),
        );
        $(`#inputMinDdmgLimit${index}`).val(
            inputDisplayNumber(request.inputMinDdmgLimit),
        );
        $(`#inputMaxDdmgLimit${index}`).val(
            inputDisplayNumber(request.inputMaxDdmgLimit),
        );
        $(`#inputMinDdmgsLimit${index}`).val(
            inputDisplayNumber(request.inputMinDdmgsLimit),
        );
        $(`#inputMaxDdmgsLimit${index}`).val(
            inputDisplayNumber(request.inputMaxDdmgsLimit),
        );
        $(`#inputMinUpgradesLimit${index}`).val(
            inputDisplayNumber(request.inputMinUpgradesLimit),
        );
        $(`#inputMaxUpgradesLimit${index}`).val(
            inputDisplayNumber(request.inputMaxUpgradesLimit),
        );
        $(`#inputMinConversionsLimit${index}`).val(
            inputDisplayNumber(request.inputMinConversionsLimit),
        );
        $(`#inputMaxConversionsLimit${index}`).val(
            inputDisplayNumber(request.inputMaxConversionsLimit),
        );
        $(`#inputMinEquippedLimit${index}`).val(
            inputDisplayNumber(request.inputMinEquippedLimit),
        );
        $(`#inputMaxEquippedLimit${index}`).val(
            inputDisplayNumber(request.inputMaxEquippedLimit),
        );
        $(`#inputMinScoreLimit${index}`).val(
            inputDisplayNumber(request.inputMinScoreLimit),
        );
        $(`#inputMaxScoreLimit${index}`).val(
            inputDisplayNumber(request.inputMaxScoreLimit),
        );
        $(`#inputMinBSLimit${index}`).val(
            inputDisplayNumber(request.inputMinBSLimit),
        );
        $(`#inputMaxBSLimit${index}`).val(
            inputDisplayNumber(request.inputMaxBSLimit),
        );
        $(`#inputMinPriorityLimit${index}`).val(
            inputDisplayNumber(request.inputMinPriorityLimit),
        );
        $(`#inputMaxPriorityLimit${index}`).val(
            inputDisplayNumber(request.inputMaxPriorityLimit),
        );

        const optimizerSettings = Settings.getOptimizerOptions();

        $(`#inputPredictReforges${index}`).prop(
            'checked',
            isNullUndefined(request.inputPredictReforges)
                ? optimizerSettings.settingDefaultUseReforgedStats
                : request.inputPredictReforges,
        );
        $(`#inputSubstatMods${index}`).prop(
            'checked',
            isNullUndefined(request.inputSubstatMods)
                ? optimizerSettings.settingDefaultUseSubstatMods
                : request.inputSubstatMods,
        );
        $(`#inputAllowLockedItems${index}`).prop(
            'checked',
            isNullUndefined(request.inputAllowLockedItems)
                ? optimizerSettings.settingDefaultLockedItems
                : request.inputAllowLockedItems,
        );
        $(`#inputAllowEquippedItems${index}`).prop(
            'checked',
            isNullUndefined(request.inputAllowEquippedItems)
                ? optimizerSettings.settingDefaultEquippedItems
                : request.inputAllowEquippedItems,
        );
        $(`#inputKeepCurrentItems${index}`).prop(
            'checked',
            isNullUndefined(request.inputKeepCurrentItems)
                ? optimizerSettings.settingDefaultKeepCurrent
                : request.inputKeepCurrentItems,
        );
        $(`#inputOrderedHeroPriority${index}`).prop(
            'checked',
            isNullUndefined(request.inputOrderedHeroPriority)
                ? optimizerSettings.settingDefaultUseHeroPriority
                : request.inputOrderedHeroPriority,
        );

        const _setSliderVal = (id, val) => {
            const el = document.querySelector(id);
            el.setAttribute('value', val);
            el.value = val;
        };

        document.querySelector(`#atkSlider${index}`)['rangeslider-js'].update({
            value: inputDisplayNumberNumber(request.inputAtkPriority),
        });
        _setSliderVal(
            `#atkSlider${index}Input`,
            inputDisplayNumberNumber(request.inputAtkPriority),
        );

        document.querySelector(`#hpSlider${index}`)['rangeslider-js'].update({
            value: inputDisplayNumberNumber(request.inputHpPriority),
        });
        _setSliderVal(
            `#hpSlider${index}Input`,
            inputDisplayNumberNumber(request.inputHpPriority),
        );

        document.querySelector(`#defSlider${index}`)['rangeslider-js'].update({
            value: inputDisplayNumberNumber(request.inputDefPriority),
        });
        _setSliderVal(
            `#defSlider${index}Input`,
            inputDisplayNumberNumber(request.inputDefPriority),
        );

        document.querySelector(`#spdSlider${index}`)['rangeslider-js'].update({
            value: inputDisplayNumberNumber(request.inputSpdPriority),
        });
        _setSliderVal(
            `#spdSlider${index}Input`,
            inputDisplayNumberNumber(request.inputSpdPriority),
        );

        document.querySelector(`#crSlider${index}`)['rangeslider-js'].update({
            value: inputDisplayNumberNumber(request.inputCrPriority),
        });
        _setSliderVal(
            `#crSlider${index}Input`,
            inputDisplayNumberNumber(request.inputCrPriority),
        );

        document.querySelector(`#cdSlider${index}`)['rangeslider-js'].update({
            value: inputDisplayNumberNumber(request.inputCdPriority),
        });
        _setSliderVal(
            `#cdSlider${index}Input`,
            inputDisplayNumberNumber(request.inputCdPriority),
        );

        document.querySelector(`#effSlider${index}`)['rangeslider-js'].update({
            value: inputDisplayNumberNumber(request.inputEffPriority),
        });
        _setSliderVal(
            `#effSlider${index}Input`,
            inputDisplayNumberNumber(request.inputEffPriority),
        );

        document.querySelector(`#resSlider${index}`)['rangeslider-js'].update({
            value: inputDisplayNumberNumber(request.inputResPriority),
        });
        _setSliderVal(
            `#resSlider${index}Input`,
            inputDisplayNumberNumber(request.inputResPriority),
        );

        const _slotFilterData = [
            { id: 'weaponFilterSlider', key: 'inputWeaponFilterPriority' },
            { id: 'helmetFilterSlider', key: 'inputHelmetFilterPriority' },
            { id: 'armorFilterSlider', key: 'inputArmorFilterPriority' },
            { id: 'necklaceFilterSlider', key: 'inputNecklaceFilterPriority' },
            { id: 'ringFilterSlider', key: 'inputRingFilterPriority' },
            { id: 'bootsFilterSlider', key: 'inputBootsFilterPriority' },
        ];
        _slotFilterData.forEach(({ id, key }) => {
            const val = inputDisplayNumberNumber(request[key], 100);
            document.querySelector(`#${id}${index}`)['rangeslider-js'].update({
                value: Math.round(10 * Math.sqrt(val)),
            });
            _setSliderVal(`#${id}${index}Input`, val);
        });

        $('#forceNumberSelect').val(inputDisplayNumberNumber(request.inputForceNumberSelect));

        if (request.inputGlobalMustHaveStat) {
            $('#mustHaveSubstatSelect').val(request.inputGlobalMustHaveStat);
            if (request.inputGlobalMustHaveCount) {
                $('#mustHaveSubstatCount').val(request.inputGlobalMustHaveCount);
            }
            // Expand the section so the user can see the saved values
            const section = document.getElementById('mustHaveSubstatSection');
            const label = document.getElementById('mustHaveSubstatToggleLabel');
            if (section && section.style.display === 'none') {
                section.style.display = '';
                label.textContent = '▾ Must-Have Substat';
            }
        } else {
            $('#mustHaveSubstatSelect').val('');
        }

        Selectors.setGearMainAndSetsFromRequest(request, index);

        if (request.inputSlotSubstatFilters) {
            slotSubstatFiltersMap[index] = request.inputSlotSubstatFilters;
        } else {
            slotSubstatFiltersMap[index] = {};
        }
        updateSlotSubstatFilterButton(index);

        if (recalc) {
            recalculateFilters(null, heroResponse);
        }
        if (!indexArg) renderFilterPresets(hero.id, heroResponseArg, '');
        fixSliders(index);
        if (tab !== 'multiOptimizer') {
            calculatePlaceholderRatings(index);
        }
        updatePriorityWeightBar(indexArg ?? '');
    },

    // True if blocking error
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    warnParams: (params, overridePermutations) => {
        const allSlotsAt100 =
            (params.inputWeaponFilterPriority ?? 100) === 100 &&
            (params.inputHelmetFilterPriority ?? 100) === 100 &&
            (params.inputArmorFilterPriority ?? 100) === 100 &&
            (params.inputNecklaceFilterPriority ?? 100) === 100 &&
            (params.inputRingFilterPriority ?? 100) === 100 &&
            (params.inputBootsFilterPriority ?? 100) === 100;
        const anySlotsBelow100 = !allSlotsAt100;
        const noPriorities =
            params.inputAtkPriority === 0 &&
            params.inputHpPriority === 0 &&
            params.inputDefPriority === 0 &&
            params.inputSpdPriority === 0 &&
            params.inputCrPriority === 0 &&
            params.inputCdPriority === 0 &&
            params.inputEffPriority === 0 &&
            params.inputResPriority === 0;

        if (allSlotsAt100 && noPriorities) {
            Notifier.info(
                'No stat priority selected. For best results, use the stat priority filter.',
            );
        } else if (allSlotsAt100 && !noPriorities) {
            Dialog.error(
                'Stat priority was selected but all slot filters are set to Top 100%. The stat priority filter is only useful when at least one slot % is not 100.',
            );
            return true;
        } else if (anySlotsBelow100 && noPriorities) {
            Dialog.error(
                'Top % was selected but no stat priorities are assigned. Assign stat priorities otherwise the filter will not work.',
            );
            return true;
        }

        if (params.inputSetsOne && params.inputSetsOne.length === 0) {
            Notifier.info(
                'No sets were selected. For best results, select at least one set.',
            );
        }

        if (params.inputDefMinLimit > 10000) {
            Dialog.error(
                'Your minimum defense filter is over 10,000, did you mean HP?',
            );
            return true;
        }

        if (
            params.inputNecklaceStat &&
            params.inputNecklaceStat.length === 0 &&
            params.inputRingStat &&
            params.inputRingStat.length === 0 &&
            params.inputBootsStat &&
            params.inputBootsStat.length === 0
        ) {
            Notifier.warn(
                'No accessory main stats were selected. For best results, use the main stat filter to narrow down the search.',
            );
        }

        // Warn if any target is set on a stat that has 0 priority weight.
        // calculateBuildScore multiplies target bonuses by priority, so a target
        // on a 0-priority stat is silently ignored and will never influence ranking.
        const _targetPriorityPairs = [
            { target: params.inputAtkTarget || params.inputAtkMinTarget, priority: params.inputAtkPriority, name: 'ATK' },
            { target: params.inputHpTarget  || params.inputHpMinTarget,  priority: params.inputHpPriority,  name: 'HP'  },
            { target: params.inputDefTarget || params.inputDefMinTarget, priority: params.inputDefPriority, name: 'DEF' },
            { target: params.inputSpdTarget || params.inputSpdMinTarget, priority: params.inputSpdPriority, name: 'SPD' },
            { target: params.inputCrTarget  || params.inputCrMinTarget,  priority: params.inputCrPriority,  name: 'CR'  },
            { target: params.inputCdTarget  || params.inputCdMinTarget,  priority: params.inputCdPriority,  name: 'CD'  },
            { target: params.inputEffTarget || params.inputEffMinTarget, priority: params.inputEffPriority, name: 'EFF' },
            { target: params.inputResTarget || params.inputResMinTarget, priority: params.inputResPriority, name: 'RES' },
        ];
        const _orphanTargets = _targetPriorityPairs
            .filter((x) => (x.target > 0) && (x.priority === 0))
            .map((x) => x.name);
        if (_orphanTargets.length > 0) {
            Notifier.warn(
                `Target set on ${_orphanTargets.join(', ')} but priority is 0 — target bonuses are ignored without a priority weight.`,
            );
        }

        // if ((overridePermutations ? overridePermutations : permutations) >= 5_000_000_000) {
        //     Notifier.info("Over 5 billion permutations selected. For faster results, try applying stricter filters or using a lower Top N%.")
        // }
        return false;
    },

    drawPreview: async (gearIds, mods) => {
        console.log('Draw preview', gearIds, mods);

        const moddedGear = ModificationFilter.getModsByIds(gearIds, mods);
        console.log('Modded gear results', moddedGear);

        const response = await Api.getItemsByIds(gearIds);
        const selectedGear = response.items;

        const heroId = document.getElementById('inputHeroAdd').value;
        const getHeroByIdResponse = await Api.getHeroById(
            heroId,
            $('#inputPredictReforges').prop('checked'),
        );
        const { hero } = getHeroByIdResponse;
        const { baseStats } = getHeroByIdResponse;

        if (!hero || !baseStats) return;

        for (let i = 0; i < 6; i += 1) {
            if (moddedGear[i]) {
                const { equippedById } = selectedGear[i];
                const { equippedByName } = selectedGear[i];

                selectedGear[i] = moddedGear[i];
                selectedGear[i].equippedById = equippedById;
                selectedGear[i].equippedByName = equippedByName;
                selectedGear[i].substats = moddedGear[i].substats;
                for (let j = 0; j < selectedGear[i].substats.length; j += 1) {
                    selectedGear[i].substats[j].modified =
                        moddedGear[i].substats[j].modified;
                    selectedGear[i].substats[j].value =
                        moddedGear[i].substats[j].value;
                    selectedGear[i].substats[j].reforgedValue =
                        moddedGear[i].substats[j].reforgedValue;
                    selectedGear[i].substats[j].reforged = true;
                }
            }
        }

        document.getElementById('optimizer-heroes-equipped-weapon').innerHTML =
            HtmlGenerator.buildItemPanel(
                selectedGear[0],
                'optimizerGrid',
                baseStats,
            );
        document.getElementById('optimizer-heroes-equipped-helmet').innerHTML =
            HtmlGenerator.buildItemPanel(
                selectedGear[1],
                'optimizerGrid',
                baseStats,
            );
        document.getElementById('optimizer-heroes-equipped-armor').innerHTML =
            HtmlGenerator.buildItemPanel(
                selectedGear[2],
                'optimizerGrid',
                baseStats,
            );
        document.getElementById(
            'optimizer-heroes-equipped-necklace',
        ).innerHTML = HtmlGenerator.buildItemPanel(
            selectedGear[3],
            'optimizerGrid',
            baseStats,
        );
        document.getElementById('optimizer-heroes-equipped-ring').innerHTML =
            HtmlGenerator.buildItemPanel(
                selectedGear[4],
                'optimizerGrid',
                baseStats,
            );
        document.getElementById('optimizer-heroes-equipped-boots').innerHTML =
            HtmlGenerator.buildItemPanel(
                selectedGear[5],
                'optimizerGrid',
                baseStats,
            );
    },

    editGearFromIcon: (id, reforge, checkboxPrefix) => {
        editGearFromIcon(id, reforge, checkboxPrefix);
    },

    lockGearFromIcon: (id, checkboxPrefix) => {
        lockGearFromIcon(id, checkboxPrefix);
    },

    toggleDisableModsFromIcon: (id, checkboxPrefix) => {
        toggleDisableModsFromIcon(id, checkboxPrefix);
    },

    getCurrentExecutionId: () => {
        return currentExecutionId;
    },

    switchBottomTab: (tab) => {
        const optimizerTabEl = document.getElementById('optimizer-tab');
        const fribbelsPanel = document.getElementById('fribbels-library-panel');
        const optimizerSection = document.getElementById('optimizer-section');
        const gearBtn = document.getElementById('bottomTabBtnGear');
        const fribbelsBtn = document.getElementById('bottomTabBtnFribbels');
        if (tab === 'fribbels') {
            optimizerTabEl.style.display = 'none';
            // Give optimizer-section a fixed height so the fribbels flex chain has
            // a height source — without this it collapses to min-height: 350px only.
            optimizerSection.style.height = '100vh';
            fribbelsPanel.style.display = 'flex';
            fribbelsInitGrid();
            gearBtn.classList.remove('active');
            fribbelsBtn.classList.add('active');
            // Sync hero selector with current optimizer hero
            const heroId = document.getElementById('inputHeroAdd').value;
            const libSelect = document.getElementById('fribbelsHeroSelect');
            if (libSelect && heroId) libSelect.value = heroId;
            // Auto-fetch if hero changed since last load
            if (heroId && fribbelsLoadedHeroName !== heroId) {
                fribbelsLoadData();
            }
        } else {
            optimizerTabEl.style.display = '';
            optimizerSection.style.height = '';
            fribbelsPanel.style.display = 'none';
            gearBtn.classList.add('active');
            fribbelsBtn.classList.remove('active');
        }
    },

    redrawHeroSelector: async () => {
        const getAllHeroesResponse = await Api.getAllHeroes();
        const selectedId = $('#inputHeroAdd option:selected').val();

        clearHeroOptions('inputHeroAdd');
        clearHeroOptions('optionsExcludeGearFrom');
        const optimizerHeroSelector = document.getElementById('inputHeroAdd');
        const optimizerAllowGearFromSelector = document.getElementById(
            'optionsExcludeGearFrom',
        );
        const { heroes } = getAllHeroesResponse;
        Utils.sortByAttribute(heroes, 'name');
        console.log('getAllHeroesResponse', getAllHeroesResponse);
        heroes.forEach((hero) => {
            const option = document.createElement('option');
            const option2 = document.createElement('option');
            option.innerHTML = i18next.t(hero.name);
            option.label = hero.name;
            option.value = hero.id;
            option2.innerHTML = i18next.t(hero.name);
            option2.label = hero.name;
            option2.value = hero.id;

            optimizerHeroSelector.add(option);
            optimizerAllowGearFromSelector.add(option2);

            // Also populate Fribbels Library hero selector
            const fribbelsSelector = document.getElementById('fribbelsHeroSelect');
            if (fribbelsSelector) {
                const option3 = document.createElement('option');
                option3.innerHTML = i18next.t(hero.name);
                option3.label = hero.name;
                option3.value = hero.id;
                fribbelsSelector.add(option3);
            }

            if (selectedId && selectedId === hero.id) {
                optimizerHeroSelector.value = selectedId;
                OptimizerGrid.setPinnedHero(hero);
            }
        });
        redrawHeroImage();
        recalculateFilters();
        Selectors.refreshInputHeroAdd();
        Selectors.refreshAllowGearFrom();
    },

    showSkillOptionsWindow: async (heroId) => {
        // showEditHeroInfoPopups(row.name)
        const skillOptions = await Dialog.changeSkillOptionsDialog(heroId);

        if (!skillOptions) {
            return;
        }

        console.warn('skillOptions', skillOptions);

        Api.setSkillOptions(skillOptions, heroId);
        Notifier.success('Saved skill options');
        Saves.autoSave();
    },

    getSlotSubstatFilters: (index) => slotSubstatFiltersMap[index] || {},

    setSlotSubstatFilters: (index, filters) => {
        slotSubstatFiltersMap[index] = filters;
        updateSlotSubstatFilterButton(index);
    },
};

function clearSubstatPriority() {
    const _clearSlider = (sliderId, val) => {
        document
            .querySelector(sliderId)
            ['rangeslider-js'].update({ value: val });
        const input = document.querySelector(`${sliderId}Input`);
        input.setAttribute('value', val);
        input.value = val;
    };

    _clearSlider('#atkSlider', 0);
    _clearSlider('#hpSlider', 0);
    _clearSlider('#defSlider', 0);
    _clearSlider('#spdSlider', 0);
    _clearSlider('#crSlider', 0);
    _clearSlider('#cdSlider', 0);
    _clearSlider('#effSlider', 0);
    _clearSlider('#resSlider', 0);
    _clearSlider('#weaponFilterSlider', 100);
    _clearSlider('#helmetFilterSlider', 100);
    _clearSlider('#armorFilterSlider', 100);
    _clearSlider('#necklaceFilterSlider', 100);
    _clearSlider('#ringFilterSlider', 100);
    _clearSlider('#bootsFilterSlider', 100);
}

function clearRatings() {
    $('.optimizer-number-input').val('');
}
function clearSkills() {
    $('.skill-number-input').val('');
}
function clearStats() {
    $('.stat-number-input').val('');
    calculatePlaceholderRatings();
}

function clearOptions() {
    const optimizerSettings = Settings.getOptimizerOptions();

    $('#inputPredictReforges').prop(
        'checked',
        optimizerSettings.settingDefaultUseReforgedStats,
    );
    $('#inputSubstatMods').prop(
        'checked',
        optimizerSettings.settingDefaultUseSubstatMods,
    );
    $('#inputAllowLockedItems').prop(
        'checked',
        optimizerSettings.settingDefaultLockedItems,
    );
    $('#inputAllowEquippedItems').prop(
        'checked',
        optimizerSettings.settingDefaultEquippedItems,
    );
    $('#inputOrderedHeroPriority').prop(
        'checked',
        optimizerSettings.settingDefaultUseHeroPriority,
    );
    $('#inputKeepCurrentItems').prop(
        'checked',
        optimizerSettings.settingDefaultKeepCurrent,
    );
}

async function editGearFromIcon(id, reforge, checkboxPrefix) {
    const result = await Api.getItemById(id);
    console.log('a1', result.item);
    const editedItem = await Dialog.editGearDialog(result.item, true, reforge);

    if (!editedItem) return;

    ItemAugmenter.augment([editedItem]);
    await Api.editItems([editedItem]);
    Notifier.quick('Edited item');
    await ItemsGrid.editedItem();

    ItemsTab.redraw(editedItem);
    drawPreview();
    Saves.autoSave();
    HeroesGrid.redrawPreview();
    HeroesGrid.refresh();

    if (checkboxPrefix === 'enhanceTab') {
        EnhancingTab.redrawEnhanceGuideFromRemoteId(editedItem.id);
    }
}

async function lockGearFromIcon(id, checkboxPrefix) {
    const result = await Api.getItemById(id);
    console.log(result.item);

    if (result.item.locked) {
        await Api.unlockItems([id]);
        Notifier.quick('Unlocked item');
    } else {
        await Api.lockItems([id]);
        Notifier.quick('Locked item');
    }

    invalidateItemsCache();
    ItemsTab.redraw(result.item);
    drawPreview();
    Saves.autoSave();
    HeroesGrid.redrawPreview();

    if (checkboxPrefix === 'enhanceTab') {
        EnhancingTab.redrawEnhanceGuideFromRemoteId(id);
    }
}

async function toggleDisableModsFromIcon(id, checkboxPrefix) {
    const result = await Api.getItemById(id);
    const item = result.item;
    item.disableMods = !item.disableMods;
    await Api.editItems([item]);
    if (item.disableMods) {
        Notifier.quick(i18next.t('Mods disabled for this item'));
    } else {
        Notifier.quick(i18next.t('Mods enabled for this item'));
    }
    invalidateItemsCache();
    ItemsTab.redraw(item);
    drawPreview();
    Saves.autoSave();
    HeroesGrid.redrawPreview();
    if (checkboxPrefix === 'enhanceTab') {
        EnhancingTab.redrawEnhanceGuideFromRemoteId(id);
    }
}

async function redrawHeroImage() {
    const name = $('#inputHeroAdd option:selected').attr('label');
    const id = $('#inputHeroAdd option:selected').attr('value');
    if (!name || name.length === 0) {
        $('#inputHeroImage').attr('src', Assets.getBlank());
        return;
    }

    const data = HeroData.getHeroExtraInfo(name);
    const image = data.assets.thumbnail;
    $('#inputHeroImage').attr('src', image);

    const heroResponse = await Api.getHeroById(
        id,
        $('#inputPredictReforges').prop('checked'),
    );
    const { hero } = heroResponse;
    const artifact = hero.artifactName;
    const artifactData = HeroData.getArtifactByName(artifact);

    if (artifactData) {
        let artiUrl =
            'https://raw.githubusercontent.com/fribbels/Fribbels-Epic-7-Optimizer/main/data/cachedimages/question_circle.png';
        if (artifactData.code && artifactData.code.length > 2) {
            artiUrl = `https://static.smilegatemegaport.com/event/live/epic7/guide/wearingStatus/images/artifact/${artifactData.code}_ico.png`;
        }

        $('#inputArtifactImage').attr('src', artiUrl);
    } else {
        $('#inputArtifactImage').attr('src', Assets.getBlank());
    }
    const imprintType = data.self_devotion.type;

    const isFlat =
        imprintType === 'max_hp' ||
        imprintType === 'att' ||
        imprintType === 'def';

    const imprintNumber = isFlat
        ? parseInt(hero.imprintNumber, 10)
        : Utils.round100ths(parseFloat(hero.imprintNumber) / 100);
    const imprintMatch = Object.entries(data.self_devotion.grades).filter(
        (x) =>
            (isFlat ? parseInt(x[1], 10) : Utils.round100ths(x[1])) ===
            imprintNumber,
    );
    if (imprintMatch.length > 0) {
        $('#inputImprintImage').attr(
            'src',
            `./assets/imprint${imprintMatch[0][0]}.png`,
        );
    } else {
        $('#inputImprintImage').attr('src', Assets.getBlank());
    }

    const modSummaryEl = document.getElementById('heroModSummary');
    if (modSummaryEl) {
        const summaryHtml = HtmlGenerator.buildHeroModSummary(hero);
        if (summaryHtml) {
            modSummaryEl.innerHTML = summaryHtml;
            modSummaryEl.classList.remove('display-none');
        } else {
            modSummaryEl.innerHTML = '';
            modSummaryEl.classList.add('display-none');
        }
    }
}

function clearHeroOptions(id) {
    const select = document.getElementById(id);
    const { length } = select.options;
    for (let i = length - 1; i >= 0; i -= 1) {
        select.options[i] = null;
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function setSort4Piece(sets, arr) {
    arr.sort((a, b) => {
        if (sets.includes(a.set)) {
            return -1;
        }
        if (sets.includes(b.set)) {
            return 1;
        }
        return 0;
    });
}

function debouncedRecalculate() {
    clearTimeout(recalcDebounceTimer);
    recalcDebounceTimer = setTimeout(recalculateFilters, 150);
}

function invalidateItemsCache() {
    _cachedItems = null;
    _cachedHeroes = null;
    // Evict stale item-score cache entries (e.g. old mod UUIDs after hero change).
    PriorityFilter.clearScoreCache();
}

async function getAllItemsCached() {
    if (!_cachedItems) {
        _cachedItems = await Api.getAllItems();
    }
    return _cachedItems;
}

async function getAllHeroesCached() {
    if (!_cachedHeroes) {
        _cachedHeroes = await Api.getAllHeroes();
    }
    return _cachedHeroes;
}

async function populateHeroPriorityList() {
    const listEl = document.getElementById('heroPriorityList');
    if (!listEl) return;

    const { heroes } = await Api.getAllHeroes();
    heroes.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

    listEl.innerHTML = '';
    heroes.forEach((hero) => {
        const li = document.createElement('li');
        li.dataset.id = hero.id;
        li.style.cssText =
            'display:flex;align-items:center;padding:2px 6px;cursor:grab;font-size:11px;user-select:none;';
        li.innerHTML = `<span style="margin-right:5px;color:#888;pointer-events:none">☰</span>${i18next.t(hero.name)}`;
        listEl.appendChild(li);
    });

    if (heroPrioritySortable) {
        heroPrioritySortable.destroy();
    }
    heroPrioritySortable = new Sortable(listEl, {
        animation: 150,
        onEnd: async (evt) => {
            const { id } = evt.item.dataset;
            const newIndex = evt.newIndex + 1;
            await Api.reorderHeroes(id, newIndex);
            // Invalidate hero cache so updated order is reflected in next filter run.
            _cachedHeroes = null;
            Saves.autoSave();
        },
    });
}

async function recalculateFilters(e, heroResponseArg) {
    // Selects fire twice, we should only calculate once
    if (e && e.target.className.includes('offscreen')) {
        return;
    }

    const heroId = document.getElementById('inputHeroAdd').value;
    if (!heroId || heroId.length === 0) {
        return;
    }

    const params = OptimizerTab.getOptimizationRequestParams();
    let heroResponse = heroResponseArg;

    if (!heroResponse) {
        heroResponse = await Api.getHeroById(
            heroId,
            $('#inputPredictReforges').prop('checked'),
        );
    }

    const allItemsResponse = await getAllItemsCached();

    const { items, allItems, preModCount, postModCount } =
        await OptimizerTab.applyItemFilters(
            params,
            heroResponse,
            allItemsResponse,
            false,
        );

    const weapons = items.filter((x) => x.gear === 'Weapon');
    const helmets = items.filter((x) => x.gear === 'Helmet');
    const armors = items.filter((x) => x.gear === 'Armor');
    const necklaces = items.filter((x) => x.gear === 'Necklace');
    const rings = items.filter((x) => x.gear === 'Ring');
    const boots = items.filter((x) => x.gear === 'Boots');

    const allWeapons = allItems.filter((x) => x.gear === 'Weapon');
    const allHelmets = allItems.filter((x) => x.gear === 'Helmet');
    const allArmors = allItems.filter((x) => x.gear === 'Armor');
    const allNecklaces = allItems.filter((x) => x.gear === 'Necklace');
    const allRings = allItems.filter((x) => x.gear === 'Ring');
    const allBoots = allItems.filter((x) => x.gear === 'Boots');

    allItemsSlotCounts = {
        Weapon: allWeapons.length,
        Helmet: allHelmets.length,
        Armor: allArmors.length,
        Necklace: allNecklaces.length,
        Ring: allRings.length,
        Boots: allBoots.length,
    };

    permutations =
        weapons.length *
        helmets.length *
        armors.length *
        necklaces.length *
        rings.length *
        boots.length;

    const weaponsPercent = Math.round(
        (weapons.length / (allWeapons.length || 1)) * 100,
    );
    const helmetsPercent = Math.round(
        (helmets.length / (allHelmets.length || 1)) * 100,
    );
    const armorsPercent = Math.round(
        (armors.length / (allArmors.length || 1)) * 100,
    );
    const necklacesPercent = Math.round(
        (necklaces.length / (allNecklaces.length || 1)) * 100,
    );
    const ringsPercent = Math.round(
        (rings.length / (allRings.length || 1)) * 100,
    );
    const bootsPercent = Math.round(
        (boots.length / (allBoots.length || 1)) * 100,
    );

    $('#maxPermutationsNum').text(Number(permutations).toLocaleString());

    const comboEl = document.getElementById('slotFilterEstCombo');
    if (comboEl) {
        const fmtCombo = formatCompactNumber(permutations);
        const targetM = parseFloat(document.getElementById('slotFilterAutoTarget')?.value) || 3;
        const targetNum = targetM * 1_000_000;
        comboEl.textContent = `Est: ${fmtCombo} combos`;
        comboEl.className = 'slot-filter-est-combo' + (
            permutations <= targetNum ? ' combo-ok'
            : permutations <= targetNum * 3 ? ' combo-warn'
            : ' combo-high'
        );
    }

    const modExpansionRow = document.getElementById('modExpansionRow');
    if (modExpansionRow) {
        if (
            params.inputSubstatMods &&
            preModCount > 0 &&
            postModCount > preModCount
        ) {
            const ratio = (postModCount / preModCount).toFixed(1);
            document.getElementById('modExpansionInfo').textContent =
                `~${Number(postModCount).toLocaleString()} (${ratio}\u00d7)`;
            modExpansionRow.style.display = '';
        } else {
            modExpansionRow.style.display = 'none';
        }
    }

    $('#filteredWeaponsNum').text(
        `${Number(weapons.length).toLocaleString()} / ${Number(
            allWeapons.length,
        ).toLocaleString()} - (${weaponsPercent}%)`,
    );
    $('#filteredHelmetsNum').text(
        `${Number(helmets.length).toLocaleString()} / ${Number(
            allHelmets.length,
        ).toLocaleString()} - (${helmetsPercent}%)`,
    );
    $('#filteredArmorsNum').text(
        `${Number(armors.length).toLocaleString()} / ${Number(
            allArmors.length,
        ).toLocaleString()} - (${armorsPercent}%)`,
    );
    $('#filteredNecklacesNum').text(
        `${Number(necklaces.length).toLocaleString()} / ${Number(
            allNecklaces.length,
        ).toLocaleString()} - (${necklacesPercent}%)`,
    );
    $('#filteredRingsNum').text(
        `${Number(rings.length).toLocaleString()} / ${Number(
            allRings.length,
        ).toLocaleString()} - (${ringsPercent}%)`,
    );
    $('#filteredBootsNum').text(
        `${Number(boots.length).toLocaleString()} / ${Number(
            allBoots.length,
        ).toLocaleString()} - (${bootsPercent}%)`,
    );

    // Per-slot slider heatmap: show "all → filtered" counts next to each slider
    function setSliderHeatmap(id, filtered, total) {
        const el = document.getElementById(id);
        if (!el) return;
        const pct = total > 0 ? Math.round((filtered / total) * 100) : 100;
        el.textContent = `${filtered} / ${total}`;
        el.className =
            'slider-heatmap' +
            (pct >= 66
                ? ' heatmap-high'
                : pct >= 33
                  ? ' heatmap-mid'
                  : ' heatmap-low');
    }
    setSliderHeatmap('weaponSliderHeatmap', weapons.length, allWeapons.length);
    setSliderHeatmap('helmetSliderHeatmap', helmets.length, allHelmets.length);
    setSliderHeatmap('armorSliderHeatmap', armors.length, allArmors.length);
    setSliderHeatmap(
        'necklaceSliderHeatmap',
        necklaces.length,
        allNecklaces.length,
    );
    setSliderHeatmap('ringSliderHeatmap', rings.length, allRings.length);
    setSliderHeatmap('bootsSliderHeatmap', boots.length, allBoots.length);
}

function getSelectedHeroId() {
    return document.getElementById('inputHeroAdd').value;
}

function filterSelectedGearByCheckbox(selectedGear) {
    const filteredIds = [];

    if ($('#optimizerGridWeapon').prop('checked'))
        filteredIds.push(selectedGear[0]);
    if ($('#optimizerGridHelmet').prop('checked'))
        filteredIds.push(selectedGear[1]);
    if ($('#optimizerGridArmor').prop('checked'))
        filteredIds.push(selectedGear[2]);
    if ($('#optimizerGridNecklace').prop('checked'))
        filteredIds.push(selectedGear[3]);
    if ($('#optimizerGridRing').prop('checked'))
        filteredIds.push(selectedGear[4]);
    if ($('#optimizerGridBoots').prop('checked'))
        filteredIds.push(selectedGear[5]);

    return filteredIds.filter((x) => !!x);
}

// ---------------------------------------------------------------------------
// Set-combo display helper — shared by copyBuildToClipboard + openCompareModal
// ---------------------------------------------------------------------------
const _SETS_PIECES_BY_IDX = [2, 2, 4, 4, 2, 2, 4, 4, 4, 2, 2, 4, 2, 2, 4, 4, 4, 2, 4, 4, 4, 2];
const _SETS_BY_IDX = ['HealthSet','DefenseSet','AttackSet','SpeedSet','CriticalSet','HitSet','DestructionSet','LifestealSet','CounterSet','ResistSet','UnitySet','RageSet','ImmunitySet','PenetrationSet','RevengeSet','InjurySet','ProtectionSet','TorrentSet','ReversalSet','RiposteSet','WarfareSet','PursuitSet'];
const _SETS_FOUR_PIECE = new Set(['AttackSet','SpeedSet','DestructionSet','LifestealSet','ProtectionSet','CounterSet','RageSet','RevengeSet','InjurySet','ReversalSet','RiposteSet','WarfareSet']);

function setsDisplayText(row) {
    const arr = [];
    if (row && row.sets) {
        for (let i = 0; i < row.sets.length; i++) {
            const count = Math.floor((row.sets[i] || 0) / (_SETS_PIECES_BY_IDX[i] || 1));
            for (let j = 0; j < count; j++) arr.push(_SETS_BY_IDX[i]);
        }
    }
    arr.sort((a, b) => {
        if (_SETS_FOUR_PIECE.has(a) && !_SETS_FOUR_PIECE.has(b)) return -1;
        if (!_SETS_FOUR_PIECE.has(a) && _SETS_FOUR_PIECE.has(b)) return 1;
        return a.localeCompare(b);
    });
    return arr.map((s) => s.replace('Set', '')).join(' / ') || '\u2014';
}

/**
 * Copies the selected optimizer build as formatted plain text to the clipboard.
 * Format is suitable for Discord, spreadsheets, etc.
 */
async function copyBuildToClipboard() {
    const row = OptimizerGrid.getSelectedRow();
    if (!row) {
        Dialog.info('Select a build row first.');
        return;
    }

    // Hero name (translated if possible)
    const heroName = (currentHeroResponse && currentHeroResponse.hero)
        ? (i18next.t(currentHeroResponse.hero.name) || currentHeroResponse.hero.name)
        : (document.getElementById('inputHeroAdd').value || 'Unknown');

    // Stats line
    const statsLine = `ATK ${row.atk}  DEF ${row.def}  HP ${row.hp}  SPD ${row.spd}  CR ${row.cr}  CD ${row.cd}  EFF ${row.eff}  RES ${row.res}  GS ${row.score}`;

    // Gear piece lines
    const STAT_LABEL = {
        flatatk: 'ATK', flathp: 'HP', flatdef: 'DEF',
        atk: 'ATK%', hp: 'HP%', def: 'DEF%',
        cr: 'CR', cd: 'CD', eff: 'EFF', res: 'RES', spd: 'SPD',
    };
    const SLOT_PAD = {
        Weapon: 'Weapon  ', Helmet: 'Helmet  ', Armor: 'Armor   ',
        Necklace: 'Necklace', Ring: 'Ring    ', Boots: 'Boots   ',
    };

    let gearLines = '';
    const gearIds = OptimizerGrid.getSelectedGearIds();
    if (gearIds && gearIds.filter(Boolean).length > 0) {
        try {
            const response = await Api.getItemsByIds(gearIds);
            gearLines = '\n' + (response.items || []).map((item) => {
                if (!item) return null;
                const slotLabel = SLOT_PAD[item.gear] || (item.gear || '').padEnd(8);
                const setLabel  = (item.set || '').replace('Set', '').padEnd(12);
                const enhance   = `+${item.enhance}`.padEnd(3);
                const mainLabel = STAT_LABEL[item.main.type] || item.main.type;
                const mainStr   = `${mainLabel} ${item.main.value}`.padEnd(10);
                const subStr    = (item.substats || [])
                    .map((s) => `${STAT_LABEL[s.type] || s.type}+${s.value}`)
                    .join('  ');
                return `${slotLabel}  ${enhance} (${setLabel}):  ${mainStr}  ${subStr}`;
            }).filter(Boolean).join('\n');
        } catch (e) {
            console.error('copyBuildToClipboard: failed to fetch gear', e);
        }
    }

    const text = `${heroName}\nSets: ${setsDisplayText(row)}\n${statsLine}${gearLines}`;
    try {
        await navigator.clipboard.writeText(text.trim());
        Notifier.quick('Build copied to clipboard');
    } catch (e) {
        console.error('copyBuildToClipboard: clipboard write failed', e);
    }
}

/** Pins the currently selected result row so it can be compared against a second row. */
function pinCurrentBuildRow() {
    const row = OptimizerGrid.getSelectedRow();
    if (!row) {
        Dialog.info('Select a result row first, then click Pin.');
        return;
    }
    _pinnedBuildRow = row;
    const btn = document.getElementById('gearPreviewPinCompare');
    if (btn) {
        btn.value = 'Pin \u2713';
        btn.classList.add('pin-active');
    }
    Notifier.quick('Build pinned \u2014 select another row and click Compare');
}

/** Opens a 2-column comparison modal between the pinned build and the selected build. */
function openCompareModal() {
    const rowB = OptimizerGrid.getSelectedRow();
    const rowA = _pinnedBuildRow;
    if (!rowA) {
        Dialog.info('Pin a build first (select a row, then click Pin), then select another row and click Compare.');
        return;
    }
    if (!rowB) {
        Dialog.info('Select a second result row to compare against the pinned build.');
        return;
    }
    if (rowA === rowB || (rowA.id != null && rowA.id === rowB.id)) {
        Dialog.info('The pinned build and the selected build are the same row. Select a different row.');
        return;
    }

    const STAT_FIELDS = [
        { section: 'Core Stats' },
        { key: 'sets',   label: 'Sets',  text: true },
        { key: 'atk',    label: 'ATK'  },
        { key: 'def',    label: 'DEF'  },
        { key: 'hp',     label: 'HP'   },
        { key: 'spd',    label: 'SPD'  },
        { key: 'cr',     label: 'CR'   },
        { key: 'cd',     label: 'CD'   },
        { key: 'eff',    label: 'EFF'  },
        { key: 'res',    label: 'RES'  },
        { section: 'Scores' },
        { key: 'score',  label: 'GS'   },
        { key: 'cp',     label: 'CP'   },
        { key: 'ehp',    label: 'EHP'  },
        { key: 'ehpps',  label: 'EHP/s' },
        { key: 'dmg',    label: 'DMG'  },
        { key: 'mcdmg',  label: 'MCD'  },
    ];

    const rows = STAT_FIELDS.map((f) => {
        if (f.section) {
            return `<tr class="cmp-section-header"><td colspan="4">${f.section}</td></tr>`;
        }
        if (f.text) {
            const a = setsDisplayText(rowA);
            const b = setsDisplayText(rowB);
            const same = a === b;
            return `<tr>
                <td class="cmp-label">${f.label}</td>
                <td class="cmp-a">${a}</td>
                <td class="cmp-b ${same ? '' : 'cmp-diff'}">${b}</td>
                <td class="cmp-delta cmp-${same ? 'same' : 'diff'}">${same ? '=' : '~'}</td>
            </tr>`;
        }
        const a = rowA[f.key] ?? 0;
        const b = rowB[f.key] ?? 0;
        const delta = Math.round(b - a);
        const deltaStr = delta === 0 ? '=' : (delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString());
        const cls = delta === 0 ? 'cmp-same' : (delta > 0 ? 'cmp-up' : 'cmp-down');
        return `<tr>
            <td class="cmp-label">${f.label}</td>
            <td class="cmp-a">${Math.round(a).toLocaleString()}</td>
            <td class="cmp-b ${cls}">${Math.round(b).toLocaleString()}</td>
            <td class="cmp-delta ${cls}">${deltaStr}</td>
        </tr>`;
    }).join('');

    const heroName = (currentHeroResponse && currentHeroResponse.hero)
        ? (i18next.t(currentHeroResponse.hero.name) || currentHeroResponse.hero.name)
        : '';
    const headerA = `&#128204; GS ${rowA.score ?? '?'}`;
    const headerB = `Selected (GS ${rowB.score ?? '?'})`;

    const content = document.getElementById('compareBuildContent');
    content.innerHTML = `
        ${heroName ? `<div style="font-size:11px;color:#aaa;margin-bottom:8px;">${heroName}</div>` : ''}
        <table class="compare-build-table">
            <thead><tr>
                <th class="cmp-label"></th>
                <th class="cmp-a">${headerA}</th>
                <th class="cmp-b">&#8678; ${headerB}</th>
                <th class="cmp-delta">&Delta;</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>`;

    document.getElementById('compareBuildOverlay').style.display = 'flex';
}

async function addBuild() {
    const row = OptimizerGrid.getSelectedRow();
    const node = OptimizerGrid.getSelectedNode();
    const selectedGear = filterSelectedGearByCheckbox(
        OptimizerGrid.getSelectedGearIds(),
    );
    if (
        !selectedGear.length ||
        selectedGear.includes(undefined) ||
        selectedGear.includes(null)
    ) {
        return;
    }

    const rowId = row.id;
    const heroId = getSelectedHeroId();

    const { hero } = await Api.getHeroById(heroId);

    console.log('ADD BUILD', row);

    if (row.mods.filter((x) => x).length > 0) {
        /* eslint-disable no-nested-ternary */
        row.name = `MOD: ${
            !hero.modGrade
                ? ''
                : hero.modGrade === 'greater'
                  ? 'Greater'
                  : 'Lesser'
        } ${hero.rollQuality || '0'}%`;
        /* eslint-enable no-nested-ternary */
    }

    await Api.addBuild(heroId, row);
    await Api.editResultRows(parseInt(rowId, 10), 'star', currentExecutionId);

    row.property = 'star';
    node.updateData(row);

    HeroesGrid.refresh(null, heroId);
    drawPreview();
    Saves.autoSave();
}

async function removeBuild() {
    const row = OptimizerGrid.getSelectedRow();
    const node = OptimizerGrid.getSelectedNode();
    const selectedGear = filterSelectedGearByCheckbox(
        OptimizerGrid.getSelectedGearIds(),
    );
    if (!row) return;
    if (selectedGear.length === 0) return;

    const rowId = row.id;

    const heroId = getSelectedHeroId();

    console.log('REMOVE BUILD', row);

    await Api.removeBuild(heroId, row);
    await Api.editResultRows(
        parseInt(rowId, 10),
        'not star',
        currentExecutionId,
    );

    row.property = 'not star';
    node.updateData(row);

    HeroesGrid.refresh(null, heroId);
    drawPreview();
    Saves.autoSave();
}

async function saveSelectedBuilds() {
    const nodes = OptimizerGrid.getSelectedNodes();
    if (!nodes.length) {
        Notifier.warn('Select one or more rows (Ctrl+click) to save as builds.');
        return;
    }

    const heroId = getSelectedHeroId();
    const { hero } = await Api.getHeroById(heroId);

    const modName = `MOD: ${
        !hero.modGrade
            ? ''
            : hero.modGrade === 'greater'
              ? 'Greater'
              : 'Lesser'
    } ${hero.rollQuality || '0'}%`;

    let savedCount = 0;
    for (const node of nodes) {
        const row = node.data;
        if (!row) continue;
        const items = row.items;
        if (!items || items.length < 6 || items.includes(null) || items.includes(undefined)) continue;

        if (row.mods && row.mods.filter((x) => x).length > 0) {
            row.name = modName;
        }

        await Api.addBuild(heroId, row);
        await Api.editResultRows(parseInt(row.id, 10), 'star', currentExecutionId);

        row.property = 'star';
        node.updateData(row);
        savedCount++;
    }

    if (savedCount > 0) {
        HeroesGrid.refresh(null, heroId);
        drawPreview();
        Saves.autoSave();
        Notifier.success(`Saved ${savedCount} build${savedCount > 1 ? 's' : ''}.`);
    }
}

async function equipSelectedGear() {
    const selectedGear = filterSelectedGearByCheckbox(
        OptimizerGrid.getSelectedGearIds(),
    );
    if (selectedGear.length === 0) return;
    if (selectedGear.includes(undefined) || selectedGear.includes(null)) {
        return;
    }
    const heroId = getSelectedHeroId();

    const heroResult = await Api.equipItemsOnHero(
        heroId,
        selectedGear,
        $('#inputPredictReforges').prop('checked'),
    );
    invalidateItemsCache();
    const { hero } = heroResult;

    const row = OptimizerGrid.getSelectedRow();
    const node = OptimizerGrid.getSelectedNode();
    const rowId = row.id;

    if (row.mods.filter((x) => x).length > 0) {
        /* eslint-disable no-nested-ternary */
        row.name = `MOD: ${
            !hero.modGrade
                ? ''
                : hero.modGrade === 'greater'
                  ? 'Greater'
                  : 'Lesser'
        } ${hero.rollQuality || '0'}%`;
        /* eslint-enable no-nested-ternary */
    }

    await Api.addBuild(heroId, row);
    await Api.editResultRows(parseInt(rowId, 10), 'star', currentExecutionId);

    row.property = 'star';
    node.updateData(row);

    HeroesGrid.refresh(null, heroId);
    OptimizerGrid.setPinnedHero(hero);
    drawPreview();
    Saves.autoSave();
}

async function unequipSelectedGear() {
    const selectedGear = filterSelectedGearByCheckbox(
        OptimizerGrid.getSelectedGearIds(),
    );
    if (selectedGear.length === 0) return;

    const heroId = getSelectedHeroId();

    await Api.unequipItems(selectedGear);
    invalidateItemsCache();

    const heroResponse = await Api.getHeroById(
        heroId,
        $('#inputPredictReforges').prop('checked'),
    );
    const { hero } = heroResponse;

    OptimizerGrid.setPinnedHero(hero);

    drawPreview();
    Saves.autoSave();
}

async function lockSelectedGear() {
    const selectedGear = filterSelectedGearByCheckbox(
        OptimizerGrid.getSelectedGearIds(),
    );

    if (selectedGear.length === 0) return;

    await Api.lockItems(selectedGear);
    invalidateItemsCache();
    drawPreview();
    Saves.autoSave();
}

async function unlockSelectedGear() {
    const selectedGear = filterSelectedGearByCheckbox(
        OptimizerGrid.getSelectedGearIds(),
    );

    if (selectedGear.length === 0) return;

    await Api.unlockItems(selectedGear);
    invalidateItemsCache();
    drawPreview();
    Saves.autoSave();
}

// ---------------------------------------------------------------------------
// Helpers — build-result persistence
// ---------------------------------------------------------------------------

/**
 * Persist the first RESULTS_CACHE_MAX_ROWS rows of the current execution to
 * localStorage, keyed by heroId.  Keeps the last RESULTS_CACHE_MAX_PER_HERO
 * runs per hero, oldest removed first.
 */
async function saveHeroResults(heroId, executionIdToSave, total) {
    if (!heroId || total <= 0) return;
    try {
        const optimizationRequest = OptimizerTab.getOptimizationRequestParams();
        optimizationRequest.heroId = heroId;
        const fetchReq = {
            startRow: 0,
            endRow: Math.min(RESULTS_CACHE_MAX_ROWS, total),
            sortColumn: null,
            sortOrder: null,
            optimizationRequest,
            executionId: executionIdToSave,
        };
        const response = await Api.getResultRows(fetchReq);
        if (!response || !response.heroStats || response.heroStats.length === 0) return;

        let cache;
        try {
            cache = JSON.parse(localStorage.getItem(RESULTS_CACHE_KEY) || '{}');
        } catch (e) {
            cache = {};
        }
        if (!cache[heroId]) cache[heroId] = [];
        cache[heroId].unshift({ ts: Date.now(), maximum: response.maximum, rows: response.heroStats });
        if (cache[heroId].length > RESULTS_CACHE_MAX_PER_HERO) {
            cache[heroId].length = RESULTS_CACHE_MAX_PER_HERO;
        }
        try {
            localStorage.setItem(RESULTS_CACHE_KEY, JSON.stringify(cache));
        } catch (quotaErr) {
            // Storage full — drop the oldest entry for every hero and retry once
            try {
                Object.keys(cache).forEach((k) => {
                    if (cache[k].length > 1) cache[k].pop();
                });
                localStorage.setItem(RESULTS_CACHE_KEY, JSON.stringify(cache));
            } catch (e2) {
                console.warn('e7opt: could not persist results — localStorage full', e2);
            }
        }
    } catch (e) {
        console.warn('e7opt: saveHeroResults failed', e);
    }
}

/**
 * Load the most recent cached result set for `heroId` from localStorage.
 * Returns `{ rows, maximum, ts }` or `null` if nothing is stored.
 */
function loadHeroResultsFromCache(heroId) {
    if (!heroId) return null;
    try {
        const raw = localStorage.getItem(RESULTS_CACHE_KEY);
        if (!raw) return null;
        const cache = JSON.parse(raw);
        const entries = cache[heroId];
        if (!entries || entries.length === 0) return null;
        return entries[0]; // most recent first
    } catch (e) {
        return null;
    }
}

async function submitOptimizationFilterRequest() {
    const params = OptimizerTab.getOptimizationRequestParams();
    getSetFormat(params.inputSets, true);
    if (OptimizerTab.warnParams(params)) {
        return;
    }

    const heroId = document.getElementById('inputHeroAdd').value;
    const heroResponse = await Api.getHeroById(
        heroId,
        $('#inputPredictReforges').prop('checked'),
    );
    params.hero = heroResponse.hero;
    params.hero.artifactAttack = 0;
    params.hero.artifactHealth = 0;
    params.hero.artifactDefense = 0;
    if (params.hero.artifactName && params.hero.artifactName !== 'None') {
        const artifactLevelText = params.hero.artifactLevel;
        if (artifactLevelText !== 'None') {
            const artifactLevel = parseInt(artifactLevelText, 10);
            const artifactStats = Artifact.getStats(
                params.hero.artifactName,
                artifactLevel,
            );

            params.hero.artifactHealth += artifactStats.health;
            params.hero.artifactAttack += artifactStats.attack;
            params.hero.artifactDefense += artifactStats.defense;
        }
    }

    OptimizerGrid.showLoadingOverlay();
    params.executionId = currentExecutionId;

    Api.submitOptimizationFilterRequest(params)
        .then((response) => {
            console.warn('Optimization filter response', response);
            OptimizerGrid.reloadData();
            return response;
        })
        .catch(console.error);
}

async function submitOptimizationRequest() {
    recalculateFilters();

    const inProgressResponse = await Api.getOptimizationInProgress();
    if (inProgressResponse.inProgress) {
        Notifier.warn(
            'Optimization already in progress. Please cancel before starting a new search.',
        );
        return;
    }

    // console.log(ItemSerializer.serializeToArr(getAllItemsResponse.items));
    const params = OptimizerTab.getOptimizationRequestParams(true);
    const heroId = document.getElementById('inputHeroAdd').value;

    const allItemsResponse = await Api.getAllItems();
    const heroResponse = await Api.getHeroById(
        heroId,
        $('#inputPredictReforges').prop('checked'),
    );
    const { hero } = heroResponse;
    const { baseStats } = heroResponse;

    const filterResult = await OptimizerTab.applyItemFilters(
        params,
        heroResponse,
        allItemsResponse,
        true,
    );
    const { items } = filterResult;

    console.log('OPTIMIZING HERO', hero);

    OptimizerGrid.setPinnedHero(hero);
    const request = {
        base: baseStats,
        requestType: 'OptimizationRequest',
        items,
        bonusHp: hero.bonusHp,
        bonusAtk: hero.bonusAtk,
        hero,
        damageMultipliers: DamageCalc.getMultipliers(hero, hero.skillOptions),
    };

    request.hero.artifactAttack = 0;
    request.hero.artifactHealth = 0;
    request.hero.artifactDefense = 0;
    if (request.hero.artifactName && request.hero.artifactName !== 'None') {
        const artifactLevelText = request.hero.artifactLevel;
        if (artifactLevelText !== 'None') {
            const artifactLevel = parseInt(artifactLevelText, 10);
            const artifactStats = Artifact.getStats(
                request.hero.artifactName,
                artifactLevel,
            );

            request.hero.artifactHealth = artifactStats.health;
            request.hero.artifactAttack = artifactStats.attack;
            request.hero.artifactDefense = artifactStats.defense;
        }
    }

    if (!hero.artifactName || hero.artifactName === 'None') {
        Notifier.warn(
            "Your hero does not have an artifact equipped, use the 'Add Bonus Stats' button on the Heroes page to add artifact stats",
        );
    }

    if (OptimizerTab.warnParams(params)) {
        return;
    }

    const mergedRequest = Object.assign(request, params, baseStats);

    console.log('Sending request:', mergedRequest);
    OptimizerGrid.showLoadingOverlay();
    // Subprocess.sendString(str)
    if (progressTimer) {
        clearInterval(progressTimer);
    }
    lastPartialGridReload = 0;
    progressTimer = setInterval(updateProgress, 200);

    // Switch grid to live-backend mode before the new execution starts
    OptimizerGrid.clearRestoredSource();
    await Api.deleteExecution(currentExecutionId);
    currentExecutionId = await Api.prepareExecution();
    mergedRequest.executionId = currentExecutionId;

    // Immediately initialize the datasource so refreshInfiniteCache() calls
    // in updateProgress() will find an active datasource and start streaming
    // results as soon as the backend produces them (no 2-second delay).
    OptimizerGrid.reloadData();

    Api.submitOptimizationRequest(mergedRequest)
        .then((result) => {
            console.log('RESPONSE RECEIVED', result);
            if (progressTimer) {
                clearInterval(progressTimer);
            }
            // $('#estimatedPermutations').text(Number(permutations).toLocaleString());
            const searchedCount = result.searched;
            const resultsCounter = result.results;

            const searchedStr = Number(searchedCount).toLocaleString();
            const resultsStr = Number(resultsCounter).toLocaleString();

            const maxResults = parseInt(
                Settings.parseNumberValue('settingMaxResults') || 0,
                10,
            );
            if (result.results >= maxResults) {
                Dialog.info(
                    'Search terminated after the result limit was exceeded, the full results are not shown. Please apply more filters to narrow your search.',
                );
            } else {
                $('#maxPermutationsNum').text(searchedStr);
            }

            $('#searchedPermutationsNum').text(searchedStr);
            $('#resultsFoundNum').text(resultsStr);
            updateOptimizerTabLabel(resultsStr);
            OptimizerGrid.reloadData();
            console.log('REFRESHED');
            // Persist first 500 rows for this hero so results survive
            // hero switches and app restarts.
            const savedHeroId = document.getElementById('inputHeroAdd').value;
            const savedExecId = currentExecutionId;
            saveHeroResults(savedHeroId, savedExecId, result.results);
            return null;
        })
        .catch(console.error);
}

async function updateProgress() {
    const result = await Api.getOptimizationProgress();
    const searchedCount = result.searched;
    const resultsCounter = result.results;

    const searchedStr = Number(searchedCount).toLocaleString();
    const resultsStr = Number(resultsCounter).toLocaleString();

    $('#searchedPermutationsNum').text(searchedStr);
    $('#resultsFoundNum').text(resultsStr);
    updateOptimizerTabLabel(resultsStr);

    // Progressively refresh the results grid every 500ms so partial results
    // are visible during long (>100M permutation) GPU searches.
    // Uses refreshInfiniteCache() (in-place update, no flicker) instead of
    // setDatasource() (full clear) — the final reloadData() after completion
    // handles proper server-side sort.
    const now = Date.now();
    if (now - lastPartialGridReload >= 500) {
        lastPartialGridReload = now;
        OptimizerGrid.refresh();
    }
}

async function drawPreview() {
    const selectedGear = OptimizerGrid.getSelectedGearIds();
    const selectedMods = OptimizerGrid.getSelectedGearMods();
    OptimizerTab.drawPreview(selectedGear, selectedMods);
}

const fourPieceSets = [
    'AttackSet',
    'SpeedSet',
    'DestructionSet',
    'LifestealSet',
    'ProtectionSet',
    'CounterSet',
    'RageSet',
    'RevengeSet',
    'InjurySet',
    'ReversalSet',
    'RiposteSet',
    'WarfareSet',
];

const twoPieceSets = [
    'HealthSet',
    'DefenseSet',
    'CriticalSet',
    'HitSet',
    'ResistSet',
    'UnitySet',
    'ImmunitySet',
    'PenetrationSet',
    'TorrentSet',
    'PursuitSet',
];

function isFourAndTwoPieceSets(sets) {
    return (
        hasFourPieceSet(sets[0]) &&
        (hasTwoPieceSet(sets[1]) || hasTwoPieceSet(sets[2]))
    );
}
function isTwoAndTwoAndTwoPieceSets(sets) {
    return (
        hasTwoPieceSet(sets[0]) &&
        hasTwoPieceSet(sets[1]) &&
        hasTwoPieceSet(sets[2])
    );
}
function hasFourPieceSet(set) {
    return set.filter((x) => fourPieceSets.includes(x)).length > 0;
}
function hasTwoPieceSet(set) {
    return set.filter((x) => twoPieceSets.includes(x)).length > 0;
}

/**
 * B: Stat-impossibility fast-reject for SPD.
 *
 * Computes the theoretical maximum SPD achievable from the given item pool
 * by picking the best item from each slot.  Boots with SPD as main stat are
 * counted via their main stat value rather than a substat.
 *
 * @param {Array}  items     - Already-filtered item array
 * @param {Object} baseStats - Hero base stats object (must have `.spd` property)
 * @returns {number} Maximum achievable SPD
 */
function computeMaxAchievableSpd(items, baseStats, hero) {
    const slots = ['Weapon', 'Helmet', 'Armor', 'Necklace', 'Ring', 'Boots'];
    const baseSpd = (baseStats && baseStats.spd) ? baseStats.spd : 0;
    let maxTotal = baseSpd;

    for (const slot of slots) {
        let best = 0;
        for (const item of items) {
            if (item.gear !== slot) continue;
            let val = 0;
            if (slot === 'Boots' && item.augmentedStats && item.augmentedStats.mainType === 'Speed') {
                // Speed is the boots main stat — use its main value
                val = item.augmentedStats.mainValue || 0;
            } else if (item.augmentedStats) {
                // All other slots: speed can only come from a substat
                val = item.augmentedStats.Speed || 0;
            }
            if (val > best) best = val;
        }
        maxTotal += best;
    }

    // Add hero bonus speed (imprint / AEI connections) — the backend adds these too.
    if (hero) {
        maxTotal += (hero.bonusSpeed || 0) + (hero.aeiSpeed || 0);
    }

    // Add the maximum possible 4-piece SPD set bonus (Speed set = 25% of base SPD).
    // Being conservative here avoids false fast-rejects; the backend filters correctly.
    maxTotal += Math.floor(0.25 * baseSpd);

    return maxTotal;
}

/**
 * C: Global must-have substat filter.
 *
 * Ensures that at least `params.inputGlobalMustHaveCount` of the 6 gear slots
 * contribute an item that has `params.inputGlobalMustHaveStat` as a substat.
 *
 * Pruning logic:
 *  - totalCanContribute = number of slots that have ≥1 item with the stat
 *  - If totalCanContribute < minCount → no valid build possible → return []
 *  - If totalCanContribute === minCount → every contributing slot is forced;
 *    remove items that lack the stat from those slots
 *  - If totalCanContribute > minCount → can't safely prune individual items
 *    without backend support; return items unchanged
 *
 * @param {Object} params - Optimization params with inputGlobalMustHaveStat / inputGlobalMustHaveCount
 * @param {Array}  items  - Current item array
 * @returns {Array} Filtered item array
 */
function applyMustHaveSubstatFilter(params, items) {
    const stat = params.inputGlobalMustHaveStat;
    const minCount = params.inputGlobalMustHaveCount;

    if (!stat || !minCount || minCount <= 0) return items;

    const slots = ['Weapon', 'Helmet', 'Armor', 'Necklace', 'Ring', 'Boots'];

    // Determine which slots have at least one item containing the stat as a substat
    const slotHasStat = {};
    for (const slot of slots) {
        slotHasStat[slot] = items.some(
            (x) => x.gear === slot && x.substats && x.substats.some((s) => s.type === stat),
        );
    }

    const totalCanContribute = slots.filter((s) => slotHasStat[s]).length;

    if (totalCanContribute < minCount) {
        console.log(
            `Must-Have Substat: need ${minCount} pieces with '${stat}' but only ${totalCanContribute} slots can provide it. No valid builds possible.`,
        );
        return [];
    }

    if (totalCanContribute === minCount) {
        // Every slot that CAN contribute MUST contribute — prune items without the stat from those slots
        return items.filter(
            (item) =>
                !slotHasStat[item.gear] || // slot that can't contribute: pass freely
                item.substats.some((s) => s.type === stat), // forced slot: must have stat
        );
    }

    // totalCanContribute > minCount: can't prune individual items safely; pass everything through
    return items;
}

function readNumber(id) {
    const possibleNaN = parseInt(document.getElementById(id).value, 10);

    return Number.isNaN(possibleNaN) ? undefined : possibleNaN;
}

function readCheckbox(id) {
    const boolean = document.getElementById(id).checked;

    return boolean === true;
}

function getSetFormat(sets, showError) {
    if (sets[0].length === 0) {
        if (sets[1].length > 0) {
            if (showError)
                Dialog.error(
                    'Invalid sets, fill in the set filters from top to bottom.',
                );
            throw new Error('Invalid Sets');
        }
        if (sets[2].length > 0) {
            if (showError)
                Dialog.error(
                    'Invalid sets, fill in the set filters from top to bottom.',
                );
            throw new Error('Invalid Sets');
        }
        return 0;
    }
    if (hasFourPieceSet(sets[0])) {
        if (hasTwoPieceSet(sets[0])) {
            if (showError)
                Dialog.error(
                    'Invalid sets, the first set filter must be either all 4 piece or all 2 piece sets.',
                );
            throw new Error('Invalid Sets');
        }
        if (hasTwoPieceSet(sets[2])) {
            if (showError)
                Dialog.error(
                    'Invalid sets, fill in the set filters from top to bottom.',
                );
            throw new Error('Invalid Sets');
        }
        if (sets[1].length > 0) {
            return 1;
        }
        return 2;
    }
    if (hasTwoPieceSet(sets[0])) {
        if (sets[1].length > 0) {
            if (sets[2].length > 0) {
                return 5;
            }
            return 4;
        }
        if (sets[2].length > 0) {
            if (showError)
                Dialog.error(
                    'Invalid sets, fill in the set filters from top to bottom.',
                );
            throw new Error('Invalid Sets');
        }
        return 3;
    }
    return undefined;
}

// ===== FRIBBELS LIBRARY PANEL =====

const FRIBBELS_BUILDS_URL = 'https://krivpfvxi0.execute-api.us-west-2.amazonaws.com/dev/getBuilds';

let _fribbelsArtifactsByCode = null;
function fribbelsArtifactName(code) {
    if (!code) return '?';
    if (!_fribbelsArtifactsByCode) {
        _fribbelsArtifactsByCode = {};
        const all = HeroData.getAllArtifactData();
        for (const [name, data] of Object.entries(all || {})) {
            if (data.code) _fribbelsArtifactsByCode[data.code] = name;
        }
    }
    return _fribbelsArtifactsByCode[code] || code;
}

const FRIBBELS_SET_ABBREV = {
    set_acc: 'Hit', set_att: 'Atk', set_coop: 'Unity', set_counter: 'Ctr',
    set_cri_dmg: 'Dest', set_cri: 'Crit', set_def: 'Def', set_immune: 'Imm',
    set_max_hp: 'HP', set_penetrate: 'Pen', set_rage: 'Rage', set_res: 'Res',
    set_revenge: 'Rev', set_scar: 'Inj', set_speed: 'Spd', set_vampire: 'LS',
    set_shield: 'Prot', set_torrent: 'Torr', set_revenant: 'Rvrsl', set_riposte: 'Riposte',
    set_opener: 'War', set_chase: 'Pursuit',
};

const FRIBBELS_FOUR_PIECE_SETS = [
    'set_att', 'set_counter', 'set_cri_dmg', 'set_rage', 'set_revenge',
    'set_scar', 'set_speed', 'set_vampire', 'set_shield', 'set_revenant', 'set_riposte',
    'set_opener',
];

const FRIBBELS_SET_KEY_TO_GAME_NAME = {
    set_acc: 'HitSet', set_att: 'AttackSet', set_coop: 'UnitySet', set_counter: 'CounterSet',
    set_cri_dmg: 'DestructionSet', set_cri: 'CriticalSet', set_def: 'DefenseSet', set_immune: 'ImmunitySet',
    set_max_hp: 'HealthSet', set_penetrate: 'PenetrationSet', set_rage: 'RageSet', set_res: 'ResistSet',
    set_revenge: 'RevengeSet', set_scar: 'InjurySet', set_speed: 'SpeedSet', set_vampire: 'LifestealSet',
    set_shield: 'ProtectionSet', set_torrent: 'TorrentSet', set_revenant: 'ReversalSet', set_riposte: 'RiposteSet',
    set_opener: 'WarfareSet', set_chase: 'PursuitSet',
};

function fribbelsAbbrevSets(sets) {
    const parts = [];
    for (const [key, count] of Object.entries(sets || {})) {
        const minCount = FRIBBELS_FOUR_PIECE_SETS.includes(key) ? 4 : 2;
        if (count >= minCount) {
            parts.push(FRIBBELS_SET_ABBREV[key] || key);
        }
    }
    return parts.join('+') || '-';
}

function fribbelsSetIcons(sets) {
    const setList = [];
    for (const [key, count] of Object.entries(sets || {})) {
        const isFour = FRIBBELS_FOUR_PIECE_SETS.includes(key);
        const minCount = isFour ? 4 : 2;
        const complete = Math.floor(count / minCount);
        const gameName = FRIBBELS_SET_KEY_TO_GAME_NAME[key];
        if (complete > 0 && gameName) {
            for (let i = 0; i < complete; i++) {
                setList.push({ key, gameName, isFour });
            }
        }
    }
    setList.sort((a, b) => {
        if (a.isFour && !b.isFour) return -1;
        if (!a.isFour && b.isFour) return 1;
        return a.key.localeCompare(b.key);
    });
    const icons = setList.map(({ gameName, key }) => {
        const src = Assets.getSetAsset(gameName);
        const abbrev = FRIBBELS_SET_ABBREV[key] || key;
        return `<img class="shrinkSets" src="${src}" title="${abbrev}">`;
    });
    return icons.join('') || '-';
}

function fribbelsSetStatus(text) {
    const status = document.getElementById('fribbels-status');
    const wrap = document.querySelector('.fribbels-table-wrap');
    if (!status) return;
    status.textContent = text;
    status.classList.remove('display-none');
    if (wrap) wrap.classList.add('display-none');
}

function fribbelsHideStatus() {
    const status = document.getElementById('fribbels-status');
    const wrap = document.querySelector('.fribbels-table-wrap');
    if (status) status.classList.add('display-none');
    if (wrap) wrap.classList.remove('display-none');
}

function fribbelsDeselectRow() {
    fribbelsSelectedRow = null;
    if (fribbelsGridApi) fribbelsGridApi.deselectAll();
    const copyBar = document.getElementById('fribbels-copy-bar');
    if (copyBar) copyBar.classList.add('display-none');
}

function fribbelsSelectRow(row) {
    fribbelsSelectedRow = row;

    const skillPart = [row.s1, row.s2, row.s3].some((v) => v > 0)
        ? `  S1 ${row.s1 > 0 ? row.s1.toLocaleString() : '-'}  S2 ${row.s2 > 0 ? row.s2.toLocaleString() : '-'}  S3 ${row.s3 > 0 ? row.s3.toLocaleString() : '-'}`
        : '';
    const statsText = `ATK ${row.atk}  DEF ${row.def}  HP ${row.hp}  SPD ${row.spd}  CR ${row.chc}  CD ${row.chd}  EFF ${row.eff}  RES ${row.efr}  |  EHP ${row.ehp.toLocaleString()}  EHP/s ${row.ehpps.toLocaleString()}  DMG ${row.dmg.toLocaleString()}  MCD ${row.mcdmg.toLocaleString()}${skillPart}  |  ${fribbelsArtifactName(row.artifactCode)}  GS ${row.gs}`;
    const copyStats = document.getElementById('fribbels-copy-stats');
    if (copyStats) copyStats.textContent = statsText;

    const copyBar = document.getElementById('fribbels-copy-bar');
    if (copyBar) copyBar.classList.remove('display-none');
}

function fribbelsRestorePresetRow(row) {
    if (!row) {
        fribbelsDeselectRow();
        return;
    }
    fribbelsSelectedRow = row;
    const skillPart = [row.s1, row.s2, row.s3].some((v) => v > 0)
        ? `  S1 ${row.s1 > 0 ? row.s1.toLocaleString() : '-'}  S2 ${row.s2 > 0 ? row.s2.toLocaleString() : '-'}  S3 ${row.s3 > 0 ? row.s3.toLocaleString() : '-'}`
        : '';
    const statsText = `ATK ${row.atk}  DEF ${row.def}  HP ${row.hp}  SPD ${row.spd}  CR ${row.chc}  CD ${row.chd}  EFF ${row.eff}  RES ${row.efr}  |  EHP ${row.ehp.toLocaleString()}  EHP/s ${row.ehpps.toLocaleString()}  DMG ${row.dmg.toLocaleString()}  MCD ${row.mcdmg.toLocaleString()}${skillPart}  |  ${fribbelsArtifactName(row.artifactCode)}  GS ${row.gs}`;
    const copyStats = document.getElementById('fribbels-copy-stats');
    if (copyStats) copyStats.textContent = statsText;
    const copyBar = document.getElementById('fribbels-copy-bar');
    if (copyBar) copyBar.classList.remove('display-none');
    if (fribbelsGridApi) {
        const key = fribbelsRowKey(row);
        fribbelsGridApi.deselectAll();
        fribbelsGridApi.forEachNode((node) => {
            if (node.data && fribbelsRowKey(node.data) === key) {
                node.setSelected(true);
                fribbelsGridApi.ensureNodeVisible(node, 'middle');
            }
        });
    }
}

function fribbelsAutoPriorities(row) {
    if (!row) return;
    const base = fribbelsBaseStats || (currentHeroResponse && currentHeroResponse.baseStats) || {};
    // Max practical gear contributions per stat (fully-invested reference build)
    const MAX_GEAR = { atk: 1800, def: 1200, hp: 12000, spd: 80, cr: 75, cd: 150, eff: 100, res: 100 };
    // Gear contribution = total stat - hero base (CR base = 15, CD base = 150 are universal)
    const contrib = {
        atk: Math.max(0, row.atk - (base.atk || 900)),
        def: Math.max(0, row.def - (base.def || 600)),
        hp:  Math.max(0, row.hp  - (base.hp  || 4500)),
        spd: Math.max(0, row.spd - (base.spd || 100)),
        cr:  Math.max(0, row.chc - 15),
        cd:  Math.max(0, row.chd - 150),
        eff: Math.max(0, row.eff),
        res: Math.max(0, row.efr),
    };
    const SLIDER_MAP = {
        atk: ['atkSlider', 'atkSliderInput'],
        def: ['defSlider', 'defSliderInput'],
        hp:  ['hpSlider',  'hpSliderInput'],
        spd: ['spdSlider', 'spdSliderInput'],
        cr:  ['crSlider',  'crSliderInput'],
        cd:  ['cdSlider',  'cdSliderInput'],
        eff: ['effSlider', 'effSliderInput'],
        res: ['resSlider', 'resSliderInput'],
    };
    for (const [key, gearVal] of Object.entries(contrib)) {
        // Map 0%→-1 (deprioritize) and 100%→6 (max), using the full -1..6 slider range
        const priority = Math.round(Math.min(1, gearVal / MAX_GEAR[key]) * 7) - 1;
        const [, inputId] = SLIDER_MAP[key];
        const input = document.getElementById(inputId);
        if (input) {
            input.setAttribute('value', String(priority));
            input.value = priority;
            input.dispatchEvent(new Event('input'));
        }
    }
    // Re-render slider handle positions (handles the case where sliders had 0 width at update time)
    fixSliders('');
    updatePriorityWeightBar('');
}

function fribbelsP50Priorities() {
    if (!fribbelsFilteredBuilds.length) return;
    const median = (sorted) => sorted.length % 2 === 1
        ? sorted[Math.floor(sorted.length / 2)]
        : Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2);
    const medRow = {};
    ['atk', 'def', 'hp', 'spd', 'chc', 'chd', 'eff', 'efr'].forEach((k) => {
        const vals = fribbelsFilteredBuilds.map((r) => r[k] || 0).sort((a, b) => a - b);
        medRow[k] = median(vals);
    });
    fribbelsAutoPriorities(medRow);
}

function fribbelsApplyRow(row, mode) {
    if (!row) return;
    const index = '';
    const setVal = (id, val) => {
        const el = document.getElementById(id + index);
        if (el && val !== undefined) {
            el.value = val;
        }
    };
    if (mode === 'targets') {
        setVal('inputAtkTarget', row.atk);
        setVal('inputHpTarget', row.hp);
        setVal('inputDefTarget', row.def);
        setVal('inputSpdTarget', row.spd);
        setVal('inputCrTarget', row.chc);
        setVal('inputCdTarget', row.chd);
        setVal('inputEffTarget', row.eff);
        setVal('inputResTarget', row.efr);
    } else if (mode === 'minlimits') {
        setVal('inputMinAtkLimit', row.atk);
        setVal('inputMinHpLimit', row.hp);
        setVal('inputMinDefLimit', row.def);
        setVal('inputMinSpdLimit', row.spd);
        setVal('inputMinCrLimit', row.chc);
        setVal('inputMinCdLimit', row.chd);
        setVal('inputMinEffLimit', row.eff);
        setVal('inputMinResLimit', row.efr);
        setVal('inputMinEhpLimit', row.ehp);
        setVal('inputMinEhppsLimit', row.ehpps);
        setVal('inputMinDmgLimit', row.dmg);
        setVal('inputMinDmgpsLimit', row.dmgps);
        setVal('inputMinMcdmgLimit', row.mcdmg);
        if (row.s1 > 0) setVal('inputMinS1Limit', row.s1);
        if (row.s2 > 0) setVal('inputMinS2Limit', row.s2);
        if (row.s3 > 0) setVal('inputMinS3Limit', row.s3);
    }
    recalculateFilters();
}

function fribbelsComputeSkillValue(mults, s, row, targetDef, rageSetEnabled) {
    if (!mults || !mults.targets[s]) return 0;

    const penSetOn = (row.sets?.set_penetrate || 0) >= 2 ? 1.0 : 0.0;
    const targets = mults.targets[s] === 1 ? 1 : 0;
    const atk = row.atk;
    const def = row.def;
    const hp = row.hp;
    const spd = row.spd;
    const critDamage = Math.min(row.chd, 350) / 100;

    const rageOn = rageSetEnabled && (row.sets?.set_rage || 0) >= 4 ? 0.3 : 0;
    const torrentBonus = (row.sets?.set_torrent || 0) >= 2 ? Math.floor((row.sets.set_torrent) / 2) * 0.1 : 0;
    const pctDmgMultiplier = 1 + rageOn + torrentBonus;

    const realPenetration = (1 - mults.penetration[s]) * (1 - penSetOn * 0.15 * targets);
    const statScalings = mults.selfHpScaling[s] * hp
        + mults.selfAtkScaling[s] * atk
        + mults.selfDefScaling[s] * def
        + mults.selfSpdScaling[s] * spd;
    const hitTypeMultis = mults.crit[s] * (critDamage + mults.cdmgIncrease[s]) + mults.hitMulti[s];
    const increasedValue = 1 + mults.increasedValue[s];
    const dmgUpMod = 1 + mults.selfSpdScaling[s] * spd;
    const extraDamage = (mults.extraSelfHpScaling[s] * hp
        + mults.extraSelfAtkScaling[s] * atk
        + mults.extraSelfDefScaling[s] * def)
        * 1.871 / (targetDef * 0.3 / 300 + 1);
    const offensive = (atk * mults.rate[s] + statScalings) * 1.871 * mults.pow[s]
        * increasedValue * hitTypeMultis * dmgUpMod * pctDmgMultiplier;
    const support = mults.selfHpScaling[s] * hp * mults.support[s]
        + mults.selfAtkScaling[s] * atk * mults.support[s]
        + mults.selfDefScaling[s] * def * mults.support[s];
    const defensive = 1 / (targetDef * Math.max(0, realPenetration) / 300 + 1);
    return Math.floor(offensive * defensive + support + extraDamage);
}

function fribbelsRowKey(row) {
    return `${row.atk}:${row.hp}:${row.def}:${row.spd}:${row.chc}:${row.chd}:${row.eff}:${row.efr}:${row.gs}:${row.createDate || ''}`;
}

function fribbelsBuildCurrentRow(hero, baseStats, mults, targetDef, rageSetEnabled) {
    if (!hero || !hero.atk) return null;
    // Build reverse map: game set name → fribbels set key
    const GAME_NAME_TO_SET_KEY = {};
    for (const [k, v] of Object.entries(FRIBBELS_SET_KEY_TO_GAME_NAME)) GAME_NAME_TO_SET_KEY[v] = k;
    const sets = {};
    if (hero.equipment) {
        Object.values(hero.equipment).forEach((item) => {
            if (item && item.set) {
                const key = GAME_NAME_TO_SET_KEY[item.set];
                if (key) sets[key] = (sets[key] || 0) + 1;
            }
        });
    }
    const chc = hero.cr;
    const chd = hero.cd;
    const efr = hero.res;
    const cr = Math.min(chc, 100) / 100;
    const cd = chd / 100;
    const penMult  = (sets.set_penetrate || 0) >= 2 ? 1.14 : 1.0;
    const torrentMult = 1 + Math.floor((sets.set_torrent || 0) / 2) * 0.1;
    const ehp   = Math.floor(hero.hp * (hero.def / 300 + 1));
    const dmg   = Math.floor(((cr * hero.atk * cd) + (1 - cr) * hero.atk) * penMult * torrentMult);
    const mcdmg = Math.floor(hero.atk * cd * penMult * torrentMult);
    const row = {
        _isCurrent: true,
        atk: hero.atk, def: hero.def, hp: hero.hp, spd: hero.spd,
        chc, chd, eff: hero.eff, efr,
        gs: hero.score || 0,
        bs: 0,
        sets,
        ehp,
        ehpps: Math.floor(ehp * hero.spd / 1000),
        dmg,
        dmgps: Math.floor(dmg * hero.spd / 1000),
        mcdmg,
        s1: 0, s2: 0, s3: 0,
        artifactCode: '',
        createDate: null,
    };
    if (mults) {
        row.s1 = fribbelsComputeSkillValue(mults, 0, row, targetDef, rageSetEnabled);
        row.s2 = fribbelsComputeSkillValue(mults, 1, row, targetDef, rageSetEnabled);
        row.s3 = fribbelsComputeSkillValue(mults, 2, row, targetDef, rageSetEnabled);
    }
    if (baseStats) {
        const bs_bonusStats = baseStats.bonusStats || {};
        const bonusSetMaxHp    = 15 * Math.floor((sets.set_max_hp  || 0) / 2);
        const bonusSetTorrent  = 10 * Math.floor((sets.set_torrent || 0) / 2);
        const bonusSetAtt      = (sets.set_att      || 0) >= 4 ? 35 : 0;
        const bonusSetDef      = 15 * Math.floor((sets.set_def     || 0) / 2);
        const bonusSetCri      = 12 * Math.floor((sets.set_cri     || 0) / 2);
        const bonusSetCriDmg   = (sets.set_cri_dmg  || 0) >= 4 ? 60 : 0;
        const bonusSetAcc      = 20 * Math.floor((sets.set_acc     || 0) / 2);
        const bonusSetRes      = 20 * Math.floor((sets.set_res     || 0) / 2);
        const bonusSetSpeed    = (sets.set_speed    || 0) >= 4 ? 25 : 0;
        const bonusSetRevenge  = (sets.set_revenge  || 0) >= 4 ? 25 : 0;
        const bonusSetRevenant = (sets.set_revenant || 0) >= 4 ? 25 : 0;
        const bsStats = {
            hp:  (hero.hp  - baseStats.hp  - bonusSetMaxHp  / 100 * baseStats.hp  - bonusSetTorrent / 100 * baseStats.hp) / baseStats.hp  * 100,
            atk: (hero.atk - baseStats.atk - bonusSetAtt    / 100 * baseStats.atk) / baseStats.atk * 100,
            def: (hero.def - baseStats.def - bonusSetDef    / 100 * baseStats.def) / baseStats.def * 100,
            chc: (Math.min(100, chc) - baseStats.cr  - (bs_bonusStats.overrideAdditionalCr  || 0) - bonusSetCri),
            chd: (Math.min(350, chd) - baseStats.cd  - (bs_bonusStats.overrideAdditionalCd  || 0) - bonusSetCriDmg),
            eff: (hero.eff - baseStats.eff - (bs_bonusStats.overrideAdditionalEff || 0) - bonusSetAcc),
            res: (efr - baseStats.res - (bs_bonusStats.overrideAdditionalRes || 0) - bonusSetRes),
            spd: (hero.spd - baseStats.spd - bonusSetSpeed - bonusSetRevenge - bonusSetRevenant),
        };
        row.bs = Math.floor(bsStats.hp + bsStats.atk + bsStats.def + bsStats.eff + bsStats.res
                 + bsStats.chc * 1.6 + bsStats.chd * 1.14 + bsStats.spd * 2);
    }
    return row;
}

function fribbelsPopulateSetFilterUI() {
    const container = document.getElementById('fribbels-filter-sets-container');
    if (!container) return;
    const twoPieceSets = Object.keys(FRIBBELS_SET_ABBREV).filter((key) => !FRIBBELS_FOUR_PIECE_SETS.includes(key));
    function makeCol(heading, keys) {
        const col = document.createElement('div');
        col.className = 'fribbels-filter-sets-col';
        const hdr = document.createElement('div');
        hdr.className = 'fribbels-filter-sets-col-label';
        hdr.textContent = heading;
        col.appendChild(hdr);
        keys.forEach((key) => {
            const abbrev   = FRIBBELS_SET_ABBREV[key] || key;
            const gameName = FRIBBELS_SET_KEY_TO_GAME_NAME[key];
            const lbl = document.createElement('label');
            const cb  = document.createElement('input');
            cb.type = 'checkbox';
            cb.id   = `fFilter-${key}`;
            const img = document.createElement('img');
            img.src   = Assets.getSetAsset(gameName) || '';
            img.alt   = abbrev;
            img.title = abbrev;
            lbl.appendChild(cb);
            lbl.appendChild(img);
            lbl.appendChild(document.createTextNode(abbrev));
            col.appendChild(lbl);
        });
        return col;
    }
    container.appendChild(makeCol('4-Piece', FRIBBELS_FOUR_PIECE_SETS));
    container.appendChild(makeCol('2-Piece', twoPieceSets));
}

function fribbelsPopulateArtifactFilter() {
    const list   = document.getElementById('fFilter-artifactList');
    const search = document.getElementById('fFilter-artifactSearch');
    if (!list) return;
    if (search) search.value = '';
    const codesInBuilds = new Set(fribbelsAllBuilds.map((r) => r.artifactCode).filter(Boolean));
    if (codesInBuilds.size === 0) {
        list.innerHTML = '<div style="color:#aaa;font-size:10px;padding:2px 0">No artifact data</div>';
        return;
    }
    const entries = [...codesInBuilds].map((code) => ({ code, name: fribbelsArtifactName(code) }));
    entries.sort((a, b) => a.name.localeCompare(b.name));
    list.innerHTML = '';
    entries.forEach(({ code, name }) => {
        const lbl = document.createElement('label');
        const cb  = document.createElement('input');
        cb.type  = 'checkbox';
        cb.value = code;
        cb.className = 'fFilter-artifact-cb';
        lbl.appendChild(cb);
        lbl.appendChild(document.createTextNode(` ${name}`));
        list.appendChild(lbl);
    });
}

function fribbelsInitGrid() {
    const gridDiv = document.getElementById('fribbels-builds-grid');
    if (!gridDiv || fribbelsGridApi) return;
    const gridOptions = {
        defaultColDef: {
            sortable: true,
            resizable: true,
            sortingOrder: ['desc', 'asc'],
            cellClass: 'no-border',
        },
        columnDefs: [
            {
                headerName: '#',
                valueGetter: (p) => p.node.rowPinned === 'top' ? '\u25B6' : p.node.rowIndex + 1,
                width: 35,
                sortable: false,
                cellStyle: (p) => p.node.rowPinned === 'top'
                    ? { color: '#1a5fcc', textAlign: 'center', fontWeight: '700' }
                    : { color: '#888', textAlign: 'center' },
            },
            {
                headerName: 'Sets',
                field: 'sets',
                width: 74,
                cellRenderer: (p) => fribbelsSetIcons(p.data?.sets),
                comparator: (a, b) => fribbelsAbbrevSets(a).localeCompare(fribbelsAbbrevSets(b)),
            },
            { headerName: 'GS',    field: 'gs',       width: 40 },
            { headerName: 'BS',    field: 'bs',       width: 40 },
            { headerName: 'ATK',   field: 'atk',      width: 44 },
            { headerName: 'DEF',   field: 'def',      width: 44 },
            { headerName: 'HP',    field: 'hp',       width: 56 },
            { headerName: 'SPD',   field: 'spd',      width: 40 },
            { headerName: 'CR',    field: 'chc',      width: 40 },
            { headerName: 'CD',    field: 'chd',      width: 40 },
            { headerName: 'EFF',   field: 'eff',      width: 40 },
            { headerName: 'RES',   field: 'efr',      width: 40 },
            { headerName: 'EHP',   field: 'ehp',      width: 62, valueFormatter: (p) => p.value?.toLocaleString() ?? '' },
            { headerName: 'EHP/s', field: 'ehpps',    width: 62, valueFormatter: (p) => p.value?.toLocaleString() ?? '' },
            { headerName: 'DMG',   field: 'dmg',      width: 62, valueFormatter: (p) => p.value?.toLocaleString() ?? '' },
            { headerName: 'DMG/s', field: 'dmgps',    width: 62, valueFormatter: (p) => p.value?.toLocaleString() ?? '' },
            { headerName: 'MCD',   field: 'mcdmg',    width: 62, valueFormatter: (p) => p.value?.toLocaleString() ?? '' },
            { headerName: 'S1',    field: 's1',       width: 56, valueFormatter: (p) => p.value > 0 ? p.value.toLocaleString() : '-' },
            { headerName: 'S2',    field: 's2',       width: 56, valueFormatter: (p) => p.value > 0 ? p.value.toLocaleString() : '-' },
            { headerName: 'S3',    field: 's3',       width: 56, valueFormatter: (p) => p.value > 0 ? p.value.toLocaleString() : '-' },
            {
                headerName: 'Artifact',
                field: 'artifactCode',
                width: 130,
                valueFormatter: (p) => fribbelsArtifactName(p.value),
                cellStyle: { textAlign: 'left' },
            },
            {
                headerName: 'Date',
                field: 'createDate',
                width: 90,
                valueFormatter: (p) => p.node?.rowPinned === 'top' ? 'Current' : (p.value || '').slice(0, 10),
            },
        ],
        rowHeight: 24,
        rowSelection: 'single',
        suppressCellSelection: true,
        suppressScrollOnNewData: true,
        getRowStyle: (p) => {
            if (p.node.rowPinned === 'top') {
                return DarkMode.isDark()
                    ? { background: '#0d3a5e', fontWeight: '600', borderBottom: '2px solid #4a9eff', color: '#c4e4ff' }
                    : { background: '#cce8ff', fontWeight: '600', borderBottom: '2px solid #4a9eff' };
            }
            return null;
        },
        onRowClicked: (event) => {
            if (!event.data || event.node.rowPinned === 'top') return;
            fribbelsSelectRow(event.data);
        },
    };
    const agGridInstance = new Grid(gridDiv, gridOptions);
    fribbelsGridApi = gridOptions.api;
    console.log('Fribbels grid initialized', agGridInstance);
}

function fribbelsSetGridData(rows) {
    if (!fribbelsGridApi) return;
    fribbelsGridApi.setRowData(rows);
    fribbelsGridApi.setPinnedTopRowData(fribbelsCurrentBuildRow ? [fribbelsCurrentBuildRow] : []);
    if (fribbelsSelectedRow) {
        const key = fribbelsRowKey(fribbelsSelectedRow);
        fribbelsGridApi.forEachNode((node) => {
            if (node.data && fribbelsRowKey(node.data) === key) {
                node.setSelected(true);
            }
        });
    }
}

function fribbelsApplyFilters() {
    if (!fribbelsAllBuilds.length) return;
    const getMin = (id) => parseInt(document.getElementById(id)?.value || '0', 10) || 0;
    const minGS  = getMin('fFilter-minGS');
    const minBS  = getMin('fFilter-minBS');
    const minSPD = getMin('fFilter-minSPD');
    const minATK = getMin('fFilter-minATK');
    const minDEF = getMin('fFilter-minDEF');
    const minHP  = getMin('fFilter-minHP');
    const minCR  = getMin('fFilter-minCR');
    const minCD  = getMin('fFilter-minCD');
    const minEFF = getMin('fFilter-minEFF');
    const minRES = getMin('fFilter-minRES');
    const minEHP = getMin('fFilter-minEHP');
    const requiredSets = Object.keys(FRIBBELS_SET_ABBREV).filter(
        (key) => document.getElementById(`fFilter-${key}`)?.checked,
    );
    const selectedArtifacts = Array.from(document.querySelectorAll('.fFilter-artifact-cb:checked')).map((cb) => cb.value);
    const statCount   = [minGS, minBS, minSPD, minATK, minDEF, minHP, minCR, minCD, minEFF, minRES, minEHP].filter((v) => v > 0).length;
    const activeCount = statCount + requiredSets.length + (selectedArtifacts.length > 0 ? 1 : 0);
    const badge = document.getElementById('fribbels-filter-badge');
    if (badge) {
        badge.classList.toggle('display-none', activeCount === 0);
        if (activeCount > 0) badge.textContent = `Filtered (${activeCount})`;
    }
    const filtered = fribbelsAllBuilds.filter((row) => {
        if (row.gs  < minGS)  return false;
        if (row.bs  < minBS)  return false;
        if (row.spd < minSPD) return false;
        if (row.atk < minATK) return false;
        if (row.def < minDEF) return false;
        if (row.hp  < minHP)  return false;
        if (row.chc < minCR)  return false;
        if (row.chd < minCD)  return false;
        if (row.eff < minEFF) return false;
        if (row.efr < minRES) return false;
        if (row.ehp < minEHP) return false;
        for (const setKey of requiredSets) {
            const minPieces = FRIBBELS_FOUR_PIECE_SETS.includes(setKey) ? 4 : 2;
            if ((row.sets?.[setKey] || 0) < minPieces) return false;
        }
        if (selectedArtifacts.length > 0 && !selectedArtifacts.includes(row.artifactCode)) return false;
        return true;
    });
    fribbelsFilteredBuilds = filtered;
    fribbelsSetGridData(filtered);
    fribbelsUpdateSummary(filtered, fribbelsAllBuilds.length);
}

function fribbelsUpdateSummary(rows, total) {
    const countEl = document.getElementById('fribbels-summary-count');
    if (countEl) countEl.textContent = `${rows.length.toLocaleString()} / ${total.toLocaleString()} builds`;
    const statsTbody = document.getElementById('fribbels-stats-summary-tbody');
    if (statsTbody) {
        if (rows.length === 0) {
            statsTbody.innerHTML = '<tr><td colspan="5" style="color:#999;text-align:center">No builds</td></tr>';
        } else {
            const statDefs = [
                ['GS',    (r) => r.gs],
                ['BS',    (r) => r.bs],
                ['SPD',   (r) => r.spd],
                ['ATK',   (r) => r.atk],
                ['DEF',   (r) => r.def],
                ['HP',    (r) => r.hp],
                ['CR',    (r) => r.chc],
                ['CD',    (r) => r.chd],
                ['EFF',   (r) => r.eff],
                ['RES',   (r) => r.efr],
                ['EHP',   (r) => r.ehp],
                ['EHP/s', (r) => r.ehpps],
                ['DMG',   (r) => r.dmg],
                ['DMG/s', (r) => r.dmgps],
                ['MCD',   (r) => r.mcdmg],
            ];
            if (rows.some((r) => r.s1 > 0)) statDefs.push(['S1', (r) => r.s1]);
            if (rows.some((r) => r.s2 > 0)) statDefs.push(['S2', (r) => r.s2]);
            if (rows.some((r) => r.s3 > 0)) statDefs.push(['S3', (r) => r.s3]);
            const median = (sorted) => sorted.length % 2 === 1
                ? sorted[Math.floor(sorted.length / 2)]
                : Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2);
            statsTbody.innerHTML = statDefs.map(([label, fn]) => {
                const vals = rows.map(fn);
                const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
                const sorted = [...vals].sort((a, b) => a - b);
                const p50 = median(sorted);
                const min = sorted[0];
                const max = sorted[sorted.length - 1];
                return `<tr><td>${label}</td><td>${avg.toLocaleString()}</td><td>${p50.toLocaleString()}</td><td>${min.toLocaleString()}</td><td>${max.toLocaleString()}</td></tr>`;
            }).join('');
        }
    }
    const setsTbody = document.getElementById('fribbels-sets-summary-tbody');
    if (setsTbody) {
        if (rows.length === 0) {
            setsTbody.innerHTML = '<tr><td colspan="3" style="color:#999;text-align:center">No builds</td></tr>';
        } else {
            const freq = {};
            rows.forEach((r) => {
                const key = fribbelsAbbrevSets(r.sets);
                freq[key] = (freq[key] || 0) + 1;
            });
            const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
            setsTbody.innerHTML = sorted.map(([combo, cnt]) =>
                `<tr><td>${combo}</td><td>${cnt}</td><td>${Math.round(cnt / rows.length * 100)}%</td></tr>`,
            ).join('');
        }
    }
}

async function fribbelsLoadData() {
    const heroId = document.getElementById('fribbelsHeroSelect').value
        || document.getElementById('inputHeroAdd').value;
    if (!heroId) {
        fribbelsSetStatus('No hero selected.');
        return;
    }

    fribbelsSetStatus('Loading community builds...');
    fribbelsSelectedRow = null;
    fribbelsAllBuilds = [];
    fribbelsCurrentBuildRow = null;
    const copyBar = document.getElementById('fribbels-copy-bar');
    if (copyBar) copyBar.classList.add('display-none');

    let heroName, baseStats, heroObj;
    try {
        const heroResponse = await Api.getHeroById(heroId, false);
        heroName = heroResponse.hero.name;
        baseStats = heroResponse.baseStats;
        heroObj = heroResponse.hero;
        fribbelsBaseStats = baseStats;
    } catch (e) {
        fribbelsSetStatus('Could not resolve hero name.');
        return;
    }

    try {
        const response = await fetch(FRIBBELS_BUILDS_URL, {
            method: 'POST',
            body: heroName,
        });
        const json = await response.json();
        const data = (json.data || []).filter((d) => d.atk && d.hp);
        data.sort((a, b) => parseInt(b.gs, 10) - parseInt(a.gs, 10));

        if (data.length === 0) {
            fribbelsSetStatus(`No community builds found for ${heroName}.`);
            return;
        }

        let mults = null;
        try {
            mults = DamageCalc.getMultipliers({ name: heroName });
        } catch (e) {
            // hero has no skill data in heroData — s1/s2/s3 will show '-'
        }
        const targetDef = Settings.parseNumberValue('settingPenDefense') || 1500;
        const rageSetEnabled = document.getElementById('settingRageSet')?.checked ?? true;

        const processedRows = [];
        data.forEach((row) => {
            row.atk = parseInt(row.atk, 10);
            row.def = parseInt(row.def, 10);
            row.hp = parseInt(row.hp, 10);
            row.chc = parseInt(row.chc, 10);
            row.chd = parseInt(row.chd, 10);
            row.eff = parseInt(row.eff, 10);
            row.efr = parseInt(row.efr, 10);
            row.spd = parseInt(row.spd, 10);
            row.gs = parseInt(row.gs, 10);

            // Compute BS using set-bonus-stripped gear stats
            const sets = row.sets || {};
            const bonusSetMaxHp    = 15 * Math.floor((sets.set_max_hp  || 0) / 2);
            const bonusSetTorrent  = 10 * Math.floor((sets.set_torrent || 0) / 2);
            const bonusSetAtt      = (sets.set_att      || 0) >= 4 ? 35 : 0;
            const bonusSetDef      = 15 * Math.floor((sets.set_def     || 0) / 2);
            const bonusSetCri      = 12 * Math.floor((sets.set_cri     || 0) / 2);
            const bonusSetCriDmg   = (sets.set_cri_dmg  || 0) >= 4 ? 60 : 0;
            const bonusSetAcc      = 20 * Math.floor((sets.set_acc     || 0) / 2);
            const bonusSetRes      = 20 * Math.floor((sets.set_res     || 0) / 2);
            const bonusSetSpeed    = (sets.set_speed    || 0) >= 4 ? 25 : 0;
            const bonusSetRevenge  = (sets.set_revenge  || 0) >= 4 ? 25 : 0;
            const bonusSetRevenant = (sets.set_revenant || 0) >= 4 ? 25 : 0;
            const bs_bonusStats = (baseStats && baseStats.bonusStats) || {};
            const bsStats = {
                hp:  (row.hp  - baseStats.hp  - bonusSetMaxHp  / 100 * baseStats.hp  - bonusSetTorrent / 100 * baseStats.hp ) / baseStats.hp  * 100,
                atk: (row.atk - baseStats.atk - bonusSetAtt    / 100 * baseStats.atk) / baseStats.atk * 100,
                def: (row.def - baseStats.def - bonusSetDef    / 100 * baseStats.def) / baseStats.def * 100,
                chc: (Math.min(100, row.chc) - baseStats.cr   - (bs_bonusStats.overrideAdditionalCr  || 0) - bonusSetCri),
                chd: (Math.min(350, row.chd) - baseStats.cd   - (bs_bonusStats.overrideAdditionalCd  || 0) - bonusSetCriDmg),
                eff: (row.eff - baseStats.eff - (bs_bonusStats.overrideAdditionalEff || 0) - bonusSetAcc),
                res: (row.efr - baseStats.res - (bs_bonusStats.overrideAdditionalRes || 0) - bonusSetRes),
                spd: (row.spd - baseStats.spd - bonusSetSpeed  - bonusSetRevenge - bonusSetRevenant),
            };
            row.gs = Math.ceil(row.gs - Math.max(0, row.chc - 100) * 1.6 - Math.max(0, row.chd - 350) * 1.14);
            const bs = bsStats.hp + bsStats.atk + bsStats.def + bsStats.eff + bsStats.res
                     + bsStats.chc * 1.6 + bsStats.chd * 1.14 + bsStats.spd * 2;
            row.bs = baseStats ? Math.floor(bs) : 0;

            const penMult = (row.sets?.set_penetrate || 0) >= 2 ? 1.14 : 1.0;
            const torrentMult = 1 + Math.floor((row.sets?.set_torrent || 0) / 2) * 0.1;
            const cr = row.chc / 100;
            const cd = row.chd / 100;
            row.ehp = Math.floor(row.hp * (row.def / 300 + 1));
            row.ehpps = Math.floor(row.ehp * row.spd / 1000);
            row.dmg = Math.floor(((cr * row.atk * cd) + (1 - cr) * row.atk) * penMult * torrentMult);
            row.dmgps = Math.floor(row.dmg * row.spd / 1000);
            row.mcdmg = Math.floor(row.atk * cd * penMult * torrentMult);
            row.s1 = fribbelsComputeSkillValue(mults, 0, row, targetDef, rageSetEnabled);
            row.s2 = fribbelsComputeSkillValue(mults, 1, row, targetDef, rageSetEnabled);
            row.s3 = fribbelsComputeSkillValue(mults, 2, row, targetDef, rageSetEnabled);

            processedRows.push(row);
        });

        fribbelsCurrentBuildRow = fribbelsBuildCurrentRow(heroObj, baseStats, mults, targetDef, rageSetEnabled);
        fribbelsAllBuilds = processedRows;
        fribbelsPopulateArtifactFilter();
        fribbelsApplyFilters();
        fribbelsLoadedHeroName = heroId;
        fribbelsHideStatus();
    } catch (e) {
        console.error('Fribbels Library fetch error', e);
        fribbelsSetStatus('Failed to load builds. Check your internet connection.');
    }
}

export default OptimizerTab;

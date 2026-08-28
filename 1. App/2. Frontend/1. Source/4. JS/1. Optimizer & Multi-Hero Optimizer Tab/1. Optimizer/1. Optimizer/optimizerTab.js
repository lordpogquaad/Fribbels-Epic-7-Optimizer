/* global $, Api, Selectors, HeroesTab, StatPreview, ModificationFilter, PriorityFilter, ForceFilter, OptimizerGrid, Dialog, Saves, Notifier, HeroData, DamageCalc, Settings, Constants, OptimizationRequest, EnhancingTab, i18next, HtmlGenerator, Utils, Artifact, ItemAugmenter, ItemsGrid, ItemsTab, HeroesGrid, Assets */
import rangesliderJs from 'rangeslider-js';
import Sortable from 'sortablejs';
import electron from 'electron';
import FribbelsLibrary from '../2. Fribbels Hero Library/fribbelsLibrary.js';
import {
  applyAllFastRejects,
  SETS_BY_INDEX,
  SET_PIECES_BY_INDEX,
  FOUR_PIECE_SETS,
  TWO_PIECE_SETS,
} from './rollDivisors.js';

let permutations = 0;
let progressTimer;
let lastPartialGridReload = 0;
let _liveSnapshotInFlight = false;

const ipc = electron.ipcRenderer;

// Diagnostic logging uses the central Log utility (Log.debug, gated by window.__optDebug; see 5. Dev Only/LogControl.js).

let currentExecutionId;
// How the current run was cancelled (drives the completion handler): null = not
// cancelled, 'all' = Cancel (show full kept set), 'quick' = Quick Cancel (500 snapshot).
let _cancelMode = null;
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

// Build pinned for side-by-side comparison
let _pinnedBuildRow = null;

// ── #17 Request fingerprinting ────────────────────────────────────────────────
// Maps heroId → fingerprint of the last successfully completed run.
// Used to skip identical re-runs within the same session.
const _lastRunFingerprints = new Map();

// ── #16 Archetype auto-config ─────────────────────────────────────────────────
// Priority slider values (range -1..6) for each official archetype.
// Applied by the "Archetype" button; sets are taken from ARCHETYPE_RULES.
const _ARCHETYPE_PRIORITY_WEIGHTS = {
  'Top Speed': { atk: 2, hp: 0, def: 0, spd: 6, cr: 2, cd: 2, eff: 0, res: 0 },
  Speed: { atk: 2, hp: 0, def: 0, spd: 5, cr: 2, cd: 2, eff: 0, res: 0 },
  DPS: { atk: 5, hp: 0, def: 0, spd: 2, cr: 5, cd: 6, eff: 0, res: 0 },
  'DPS (No CC)': {
    atk: 5,
    hp: 0,
    def: 0,
    spd: 2,
    cr: 0,
    cd: 6,
    eff: 0,
    res: 0,
  },
  'Res Tank': { atk: 0, hp: 5, def: 4, spd: 2, cr: 0, cd: 0, eff: 0, res: 6 },
  'Pure Tank': { atk: 0, hp: 6, def: 6, spd: 2, cr: 0, cd: 0, eff: 0, res: 3 },
  'EFF. Tank': { atk: 0, hp: 4, def: 4, spd: 2, cr: 0, cd: 0, eff: 6, res: 0 },
  'Atk + ER': { atk: 5, hp: 0, def: 0, spd: 2, cr: 3, cd: 3, eff: 0, res: 5 },
  'Atk + EFF': { atk: 5, hp: 0, def: 0, spd: 2, cr: 3, cd: 3, eff: 5, res: 0 },
  'Bruiser(Hp/Def)': {
    atk: 3,
    hp: 5,
    def: 5,
    spd: 2,
    cr: 2,
    cd: 4,
    eff: 0,
    res: 0,
  },
  Bruiser: { atk: 4, hp: 4, def: 4, spd: 2, cr: 3, cd: 5, eff: 0, res: 0 },
  Future: { atk: 3, hp: 1, def: 1, spd: 3, cr: 3, cd: 3, eff: 0, res: 0 },
};

function _initArchetypeDropdown() {
  const select = document.getElementById('archetypeSelect');
  if (!select) return;
  const rules =
    globalThis.ARCHETYPE_RULES || globalThis.OFFICIAL_ARCHETYPE_RULES;
  const names = rules?.Weapon
    ? [...new Set(rules.Weapon.map((r) => r.archetype))]
    : Object.keys(_ARCHETYPE_PRIORITY_WEIGHTS);
  names.forEach((name) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

// ── #19 Global preset templates ───────────────────────────────────────────────
const _GLOBAL_TEMPLATES = [
  { label: 'DPS Fast Cleave', key: 'Top Speed' },
  { label: 'DPS', key: 'DPS' },
  { label: 'Pure Tank', key: 'Pure Tank' },
  { label: 'Eff Support', key: 'EFF. Tank' },
];

function _applyArchetypeByName(archetypeName) {
  if (!archetypeName) return;

  const rules =
    globalThis.ARCHETYPE_RULES || globalThis.OFFICIAL_ARCHETYPE_RULES;
  const weaponRules = rules?.Weapon || [];
  const archetypeRule = weaponRules.find((r) => r.archetype === archetypeName);

  if (archetypeRule?.sets) {
    const allowed = new Set(archetypeRule.sets);
    const excludeSets = (Constants.setsByIndex || []).filter(
      (s) => !allowed.has(s.replace('Set', '')),
    );
    Selectors.setGearMainAndSetsFromRequest(
      {
        inputExcludeSet: excludeSets,
        inputSetsOne: [],
        inputSetsTwo: [],
        inputSetsThree: [],
      },
      '',
    );
  }

  const w = _ARCHETYPE_PRIORITY_WEIGHTS[archetypeName];
  if (w) {
    OptimizerTab._applyStatPrioritySliders(
      {
        inputAtkPriority: w.atk,
        inputHpPriority: w.hp,
        inputDefPriority: w.def,
        inputSpdPriority: w.spd,
        inputCrPriority: w.cr,
        inputCdPriority: w.cd,
        inputEffPriority: w.eff,
        inputResPriority: w.res,
      },
      '',
    );
    updatePriorityWeightBar('');
  }

  recalculateFilters();
  Notifier.success(`Applied ${archetypeName} defaults`);
}

function _applyArchetypeDefaults() {
  _applyArchetypeByName(document.getElementById('archetypeSelect').value);
}

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
const slotStatFloorFiltersMap = { '': {}, 1: {}, 2: {} };
// Per-optimizer per-slot priority matrix authored in the Per-Slot Priorities
// dialog.  Keyed by optimizer index ('' = single optimizer).  Each value is a
// materialized { Weapon:{atk,hp,def,spd,cr,cd,eff,res}, ... } object (8-category
// weights for all 6 slots) or null when never edited.  These weights drive both
// the slot filter cut AND the build ranking (item.priority); they are serialized
// into the request so the backend persists them on the hero.
const slotPriorityConfigByIndex = { '': null, 1: null, 2: null };
// Per-optimizer per-set priority overrides ({ SpeedSet:{enabled, atk,…res}, … } or
// null).  Precedence set > slot > global.  Storage-only on the Java side.
const setPriorityConfigByIndex = { '': null, 1: null, 2: null };

// --- Two-way binding: global priority sliders <-> materialized per-slot matrix ---
const _PRIO_CATS = ['atk', 'hp', 'def', 'spd', 'cr', 'cd', 'eff', 'res'];
const _PRIO_SLOTS = ['Weapon', 'Helmet', 'Armor', 'Necklace', 'Ring', 'Boots'];
const _GLOBAL_SLIDER_ID = {
  atk: 'atkSlider',
  hp: 'hpSlider',
  def: 'defSlider',
  spd: 'spdSlider',
  cr: 'crSlider',
  cd: 'cdSlider',
  eff: 'effSlider',
  res: 'resSlider',
};
// Guard so programmatic global-slider updates (from re-averaging) don't loop back
// into a broadcast.
let _suppressGlobalBroadcast = false;

function _globalSliderInputId(cat, index = '') {
  return `${_GLOBAL_SLIDER_ID[cat]}${index}Input`;
}
// Global slider edit → flatten that category value across every slot row (both
// flat & % types, legal only) via materializeSlotRow.  No-op until the matrix is
// materialized (global-only mode is left untouched).
function broadcastGlobalsToSlots(index = '') {
  const matrix = slotPriorityConfigByIndex[index];
  if (!matrix || !PriorityFilter.materializeSlotRow) return;
  const g = {};
  _PRIO_CATS.forEach((cat) => {
    g[cat] = readFloat(_globalSliderInputId(cat, index)) || 0;
  });
  _PRIO_SLOTS.forEach((slot) => {
    matrix[slot] = PriorityFilter.materializeSlotRow(g, slot);
  });
}
// Per-slot matrix edit → refresh the 8 global sliders to the legal-slot average.
function reaverageGlobalsFromMatrix(index = '') {
  const matrix = slotPriorityConfigByIndex[index];
  if (!matrix || !PriorityFilter.globalFromMatrix) return;
  const g = PriorityFilter.globalFromMatrix(matrix);
  _suppressGlobalBroadcast = true;
  try {
    _PRIO_CATS.forEach((cat) => {
      const el = document.getElementById(_globalSliderInputId(cat, index));
      if (el) {
        el.value = g[cat];
        el.setAttribute('value', g[cat]);
      }
    });
  } finally {
    // Always clear the guard — if it leaked true (e.g. on a throw), every later global
    // slider edit would be silently swallowed and the binding would wedge.
    _suppressGlobalBroadcast = false;
  }
  updatePriorityWeightBar(index);
}
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

// Per-hero "target priority" ranks (1 = highest target importance) + tunable scale ride
// the saved optimization request, exactly like the stat targets: read into the request
// by getOptimizationRequestParams, persisted on Start / Save build, and written back to
// the rank boxes on hero load (loadPreviousHeroFilters).  The backend / calculateBuildScore
// scale each stat's target bonus by 1 + (8 - rank) * scale.

function fixSliders(index = '') {
  Log.debug('Fixing sliders');
  // priority spinners no longer use rangeslider-js
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
}

const PRIORITY_WEIGHT_STATS = [
  {
    id: 'atk',
    targetId: 'inputAtkTarget',
    minTargetId: 'inputAtkMinTarget',
    sweetTargetId: 'inputAtkSweetTarget',
    label: 'ATK',
    color: '#e07848',
  },
  {
    id: 'def',
    targetId: 'inputDefTarget',
    minTargetId: 'inputDefMinTarget',
    sweetTargetId: 'inputDefSweetTarget',
    label: 'DEF',
    color: '#5b8dd9',
  },
  {
    id: 'hp',
    targetId: 'inputHpTarget',
    minTargetId: 'inputHpMinTarget',
    sweetTargetId: 'inputHpSweetTarget',
    label: 'HP',
    color: '#5bbf6a',
  },
  {
    id: 'spd',
    targetId: 'inputSpdTarget',
    minTargetId: 'inputSpdMinTarget',
    sweetTargetId: 'inputSpdSweetTarget',
    label: 'SPD',
    color: '#59c9c9',
  },
  {
    id: 'cr',
    targetId: 'inputCrTarget',
    minTargetId: 'inputCrMinTarget',
    sweetTargetId: 'inputCrSweetTarget',
    label: 'CR',
    color: '#d4c94a',
  },
  {
    id: 'cd',
    targetId: 'inputCdTarget',
    minTargetId: 'inputCdMinTarget',
    sweetTargetId: 'inputCdSweetTarget',
    label: 'CD',
    color: '#d49442',
  },
  {
    id: 'eff',
    targetId: 'inputEffTarget',
    minTargetId: 'inputEffMinTarget',
    sweetTargetId: 'inputEffSweetTarget',
    label: 'EFF',
    color: '#a65bc9',
  },
  {
    id: 'res',
    targetId: 'inputResTarget',
    minTargetId: 'inputResMinTarget',
    sweetTargetId: 'inputResSweetTarget',
    label: 'RES',
    color: '#4ab89a',
  },
];

function updatePriorityWeightBar(idx = '') {
  const values = PRIORITY_WEIGHT_STATS.map((s) => {
    const el = document.getElementById(`${s.id}SliderInput${idx}`);
    return el ? Math.max(0, Number.parseFloat(el.value) || 0) : 0;
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
    const sweetTargetEl = document.getElementById(`${s.sweetTargetId}${idx}`);
    const hasTarget =
      (targetEl && (Number.parseFloat(targetEl.value) || 0) > 0) ||
      (minTargetEl && (Number.parseFloat(minTargetEl.value) || 0) > 0) ||
      (sweetTargetEl && (Number.parseFloat(sweetTargetEl.value) || 0) > 0);
    dot.classList.toggle('display-none', !hasTarget);
  });
}

// Validate stat-limit and target inputs for the given optimizer (index '' = single).
// Flags offending inputs with the `input-invalid` class (red) and returns
// { blocking, warning } messages:
//   • blocking — a stat min-LIMIT above its max-LIMIT yields zero results, so block submit.
//   • warning  — target trio out of order (need min ≤ ◎ sweet ≤ max); the sweet-spot bonus
//                only applies strictly inside [min,max], so a stray ◎ silently no-ops.
function validateTargets(index = '') {
  let blocking = null;
  let warning = null;
  const num = (id) => {
    const el = document.getElementById(`${id}${index}`);
    if (!el) return { el: null, v: 0, set: false };
    const raw = String(el.value ?? '').trim();
    const v = Number.parseFloat(raw) || 0;
    return { el, v, set: raw !== '' && v > 0 };
  };
  const mark = (entry, bad) => {
    if (entry && entry.el) entry.el.classList.toggle('input-invalid', !!bad);
  };
  PRIORITY_WEIGHT_STATS.forEach((s) => {
    const cap = s.id.charAt(0).toUpperCase() + s.id.slice(1);
    const minL = num(`inputMin${cap}Limit`);
    const maxL = num(`inputMax${cap}Limit`);
    const minT = num(s.minTargetId);
    const sweetT = num(s.sweetTargetId);
    const maxT = num(s.targetId);

    const limitBad = minL.set && maxL.set && minL.v > maxL.v;
    mark(minL, limitBad);
    mark(maxL, limitBad);
    if (limitBad && !blocking) {
      blocking = `${s.label}: min limit (${minL.v}) is above max limit (${maxL.v}).`;
    }

    let bandBad = false;
    if (minT.set && maxT.set && minT.v > maxT.v) bandBad = true;
    if (sweetT.set && minT.set && sweetT.v < minT.v) bandBad = true;
    if (sweetT.set && maxT.set && sweetT.v > maxT.v) bandBad = true;
    mark(minT, bandBad);
    mark(sweetT, bandBad);
    mark(maxT, bandBad);
    if (bandBad && !warning) {
      warning = `${s.label}: targets must satisfy min ≤ ◎ sweet ≤ max — that stat's sweet spot is being ignored.`;
    }
  });
  return { blocking, warning };
}

const _HINT_STATS = [
  { id: 'atk', priorityKey: 'inputAtkPriority' },
  { id: 'def', priorityKey: 'inputDefPriority' },
  { id: 'hp', priorityKey: 'inputHpPriority' },
  { id: 'spd', priorityKey: 'inputSpdPriority' },
  { id: 'cr', priorityKey: 'inputCrPriority' },
  { id: 'cd', priorityKey: 'inputCdPriority' },
  { id: 'eff', priorityKey: 'inputEffPriority' },
  { id: 'res', priorityKey: 'inputResPriority' },
];

function updatePriorityHints() {
  const baseStats = currentHeroResponse?.baseStats;
  if (!baseStats?.atk) {
    _HINT_STATS.forEach(({ id }) => {
      const hintEl = document.getElementById(`${id}PriorityHint`);
      if (hintEl && hintEl !== document.activeElement) hintEl.value = '';
      const baseEl = document.getElementById(`${id}PriorityBase`);
      const deltaEl = document.getElementById(`${id}PriorityDelta`);
      if (baseEl) baseEl.textContent = '';
      if (deltaEl) {
        deltaEl.textContent = '';
        deltaEl.className = 'priority-delta';
      }
    });
    return;
  }

  const setFilters = Selectors.getSetFilters();
  const mainFilters = Selectors.getGearMainFilters();

  const params = {
    hero: currentHeroResponse?.hero || {},
    inputSetsOne: setFilters.sets[0],
    inputSetsTwo: setFilters.sets[1],
    inputSetsThree: setFilters.sets[2],
    inputNecklaceStat: mainFilters[0],
    inputRingStat: mainFilters[1],
    inputBootsStat: mainFilters[2],
  };
  _HINT_STATS.forEach(({ id, priorityKey }) => {
    params[priorityKey] =
      Number.parseFloat(document.getElementById(`${id}SliderInput`)?.value) ||
      0;
  });

  const est = PriorityFilter.estimatePriorityStats(params, baseStats);
  if (!est) return;

  const noMains = {
    inputNecklaceStat: [],
    inputRingStat: [],
    inputBootsStat: [],
  };

  // B column: fixed stats only — zero priorities, no right-side accessory mains.
  const baseParams = Object.assign({}, params, noMains);
  _HINT_STATS.forEach(({ priorityKey }) => {
    baseParams[priorityKey] = 0;
  });
  const est0 = PriorityFilter.estimatePriorityStats(baseParams, baseStats);

  // Delta / total use `est` (the full estimate: actual priorities AND the forced
  // accessory main stats), so a forced Necklace/Ring/Boots main (e.g. ATK%, Speed)
  // is reflected in the projected gain and total — not just substat rolls.
  _HINT_STATS.forEach(({ id }) => {
    const baseEl = document.getElementById(`${id}PriorityBase`);
    const deltaEl = document.getElementById(`${id}PriorityDelta`);
    const hintEl = document.getElementById(`${id}PriorityHint`);

    if (baseEl && est0) baseEl.textContent = est0[id];

    if (deltaEl && est0 && est) {
      const delta = est[id] - est0[id];
      if (delta === 0) {
        deltaEl.textContent = '';
        deltaEl.className = 'priority-delta';
      } else {
        deltaEl.textContent = delta > 0 ? `+${delta}` : `${delta}`;
        deltaEl.className = `priority-delta ${delta > 0 ? 'priority-delta-pos' : 'priority-delta-neg'}`;
      }
    }

    if (hintEl && hintEl !== document.activeElement) {
      hintEl.value = est ? est[id] : '';
    }
  });
}

function applyTargetHint(statId) {
  const hintEntry = _HINT_STATS.find((s) => s.id === statId);
  if (!hintEntry) return;

  const hintEl = document.getElementById(`${statId}PriorityHint`);
  const target = Number.parseFloat(hintEl?.value);
  if (!hintEl || !(target > 0)) return;

  const baseStats = currentHeroResponse?.baseStats;
  if (!baseStats?.atk) return;

  const setFilters = Selectors.getSetFilters();
  const params = {
    hero: currentHeroResponse?.hero || {},
    inputSetsOne: setFilters.sets[0],
    inputSetsTwo: setFilters.sets[1],
    inputSetsThree: setFilters.sets[2],
    inputNecklaceStat: [],
    inputRingStat: [],
    inputBootsStat: [],
  };
  _HINT_STATS.forEach(({ priorityKey }) => {
    params[priorityKey] = 0;
  });

  const EPS = 0.01;
  const paramsAtEps = Object.assign({}, params, {
    [hintEntry.priorityKey]: EPS,
  });

  const est0 = PriorityFilter.estimatePriorityStats(params, baseStats);
  const estEps = PriorityFilter.estimatePriorityStats(paramsAtEps, baseStats);
  if (!est0 || !estEps) return;

  const slope = (estEps[statId] - est0[statId]) / EPS;
  if (slope <= 0) return;

  const required = (target - est0[statId]) / slope;
  const rounded = Math.round(Math.max(-1, Math.min(6, required)) * 10) / 10;

  const sliderInputEl = document.getElementById(`${statId}SliderInput`);
  if (!sliderInputEl) return;
  sliderInputEl.value = rounded;
  sliderInputEl.dispatchEvent(new Event('change', { bubbles: true }));
}

function isNullUndefined(x) {
  return x === null || x === undefined;
}

function formatCompactNumber(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 10_000) return Math.round(n / 1_000) + 'K';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function calculatePlaceholderRatings(index = '') {
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
  return JSON.parse(localStorage.getItem('optimizerPresets_' + heroId) || '[]');
}

function saveFilterPresetsToStorage(heroId, presets) {
  localStorage.setItem('optimizerPresets_' + heroId, JSON.stringify(presets));
}

function renderFilterPresets(heroId, heroResponseArg, index) {
  const container = document.getElementById('presetList');
  if (!container) return;
  container.innerHTML = '';

  // ── Built-in template chips (always shown) ────────────────────────────────
  const tmplHeader = document.createElement('div');
  tmplHeader.className = 'preset-section-label';
  tmplHeader.textContent = 'Templates';
  container.appendChild(tmplHeader);
  _GLOBAL_TEMPLATES.forEach(({ label, key }) => {
    const chip = document.createElement('div');
    chip.className = 'preset-chip preset-chip-template';
    chip.title = `Apply ${label} defaults`;
    const nameSpan = document.createElement('span');
    nameSpan.className = 'preset-chip-name';
    nameSpan.textContent = label;
    chip.appendChild(nameSpan);
    chip.addEventListener('click', () => _applyArchetypeByName(key));
    container.appendChild(chip);
  });

  const presets = getFilterPresets(heroId);
  if (presets.length > 0) {
    const myHeader = document.createElement('div');
    myHeader.className = 'preset-section-label';
    myHeader.textContent = 'My Presets';
    container.appendChild(myHeader);
  }

  presets.forEach((preset) => {
    const chip = document.createElement('div');
    chip.className = 'preset-chip';
    chip.title = preset.name;

    const sets = preset.sets || [];
    sets
      .flat()
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
    del.addEventListener('click', async (e) => {
      e.stopPropagation();
      // Confirm before deleting — the chip's tiny × is easy to misclick and the
      // preset (filters + sets + community-build row) is otherwise lost permanently.
      const confirmed = await Dialog.confirmation(
        `Delete preset "${preset.name}"?`,
      );
      if (!confirmed) return;
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
      OptimizerTab.loadPreviousHeroFilters(mockResponse, index, true, null);
      FribbelsLibrary.restorePresetRow(preset.fribbelsRow || null);
    });

    chip.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      openRenameModal(preset, heroId, heroResponseArg, index);
    });

    container.appendChild(chip);
  });

  if (presetListSortable) {
    presetListSortable.destroy();
    presetListSortable = null;
  }
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
    fribbelsRow: FribbelsLibrary.getSelectedRow() || null,
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
  document
    .getElementById('presetRenameConfirm')
    ?.addEventListener('click', commitRename);
  document
    .getElementById('presetRenameCancel')
    ?.addEventListener('click', closeRenameModal);
  document
    .getElementById('presetRenameOverlay')
    ?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeRenameModal();
    });
  document
    .getElementById('presetRenameInput')
    ?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') commitRename();
      if (e.key === 'Escape') closeRenameModal();
    });
}

function updateSlotSubstatFilterButton(index) {
  const filters = slotSubstatFiltersMap[index] || {};
  const activeCount = Object.values(filters).filter(
    (sf) => sf?.enabled && sf.substats && sf.substats.length > 0,
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

function updateSlotStatFloorButton(index) {
  const filters = slotStatFloorFiltersMap[index] || {};
  const activeCount = Object.values(filters).filter(
    (sf) => sf?.enabled && sf.floors && Object.keys(sf.floors).length > 0,
  ).length;
  const btn = document.getElementById(`openSlotStatFloor${index}`);
  if (!btn) return;
  if (activeCount > 0) {
    btn.classList.add('slot-filter-active');
    btn.textContent = `Stat Floor (${activeCount})`;
  } else {
    btn.classList.remove('slot-filter-active');
    btn.textContent = 'Stat Floor';
  }
}

function setAllSlotSliders(pct) {
  const slots = ['weapon', 'helmet', 'armor', 'necklace', 'ring', 'boots'];
  slots.forEach((slot) => {
    const inputEl = document.getElementById(`${slot}FilterSliderInput`);
    if (!inputEl) return;
    inputEl.value = pct;
    const sliderEl = document.querySelector(`#${slot}FilterSlider`);
    if (sliderEl?.['rangeslider-js']) {
      sliderEl['rangeslider-js'].update({
        value: Math.round(10 * Math.sqrt(pct)),
      });
    }
  });
}

function setOneSlotSlider(slot, pct) {
  const inputEl = document.getElementById(`${slot}FilterSliderInput`);
  if (!inputEl) return;
  inputEl.value = pct;
  const sliderEl = document.querySelector(`#${slot}FilterSlider`);
  if (sliderEl?.['rangeslider-js']) {
    sliderEl['rangeslider-js'].update({
      value: Math.round(10 * Math.sqrt(pct)),
    });
  }
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
function autoConfigSlotFiltersFromTargets(
  params,
  allItems,
  baseStats,
  cliffPct = 5,
) {
  const allPriorityZero =
    !params.inputAtkPriority &&
    !params.inputHpPriority &&
    !params.inputDefPriority &&
    !params.inputSpdPriority &&
    !params.inputCrPriority &&
    !params.inputCdPriority &&
    !params.inputEffPriority &&
    !params.inputResPriority;
  // A per-slot or per-set matrix still produces a per-slot signal even when the
  // global sliders are all 0, so only bail when there is no weighting at all.
  if (
    allPriorityZero &&
    !PriorityFilter.hasAnySlotOverride(params) &&
    !PriorityFilter.hasAnySetOverride(params)
  )
    return;

  // When substat mods are enabled the item pool expands 2–4× after scoring,
  // so we loosen the score cliff to keep enough source items feeding the
  // mod expansion (otherwise the suggested % can be too aggressive).
  const effectiveCliff = params.inputSubstatMods
    ? Math.min(cliffPct, 2)
    : cliffPct;

  const reforge = $('#inputPredictReforges').prop('checked');
  const SLOTS = ['weapon', 'helmet', 'armor', 'necklace', 'ring', 'boots'];
  const SLOT_GEAR = {
    weapon: 'Weapon',
    helmet: 'Helmet',
    armor: 'Armor',
    necklace: 'Necklace',
    ring: 'Ring',
    boots: 'Boots',
  };

  SLOTS.forEach((slot) => {
    const gearType = SLOT_GEAR[slot];
    const gearItems = allItems.filter((x) => x.gear === gearType);
    if (gearItems.length === 0) return;

    // Score every item in this slot
    gearItems.forEach((item) =>
      PriorityFilter.scoreItem(item, params, baseStats, reforge),
    );

    const maxScore = Math.max(...gearItems.map((x) => x.score || 0));
    if (maxScore <= 0) return; // no priority weights produce any signal for this slot

    const threshold = (effectiveCliff / 100) * maxScore;
    const countAbove = gearItems.filter(
      (x) => (x.score || 0) >= threshold,
    ).length;
    const suggestedPct = Math.max(
      1,
      Math.min(100, Math.round((countAbove / gearItems.length) * 100)),
    );

    const inputEl = document.getElementById(`${slot}FilterSliderInput`);
    if (!inputEl) return;
    inputEl.value = suggestedPct;
    const sliderEl = document.querySelector(`#${slot}FilterSlider`);
    if (sliderEl?.['rangeslider-js']) {
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
  'atkSlider',
  'hpSlider',
  'defSlider',
  'spdSlider',
  'crSlider',
  'cdSlider',
  'effSlider',
  'resSlider',
  'weaponFilterSlider',
  'helmetFilterSlider',
  'armorFilterSlider',
  'necklaceFilterSlider',
  'ringFilterSlider',
  'bootsFilterSlider',
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
  const slotSubstatFilterSnapshot = structuredClone(
    slotSubstatFiltersMap[''] || {},
  );

  // Slot stat floor filters (deep copy)
  const slotStatFloorSnapshot = structuredClone(
    slotStatFloorFiltersMap[''] || {},
  );

  // Per-slot / per-set priority matrices (deep copy) so Undo can restore them too —
  // the Reset handler now clears these, so capture/restore must round-trip them.
  const slotPriorityConfigSnapshot = structuredClone(
    slotPriorityConfigByIndex[''] || null,
  );
  const setPriorityConfigSnapshot = structuredClone(
    setPriorityConfigByIndex[''] || null,
  );

  return {
    ratings,
    stats,
    sliders,
    setFilters,
    mainFilters,
    options,
    slotSubstatFilterSnapshot,
    slotStatFloorSnapshot,
    slotPriorityConfigSnapshot,
    setPriorityConfigSnapshot,
  };
}

let _undoResetTimer = null;

function restoreFilterState(state) {
  // Ratings
  Object.entries(state.ratings).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = value;
      $(el).trigger('change');
    }
  });

  // Stat targets
  Object.entries(state.stats).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = value;
      $(el).trigger('change');
    }
  });

  // Sliders
  SLIDER_IDS.forEach((id) => {
    const sliderEl = document.querySelector(`#${id}`);
    if (!sliderEl?.['rangeslider-js']) return;
    const inputEl = document.getElementById(`${id}Input`);
    const rawVal =
      state.sliders[id] === undefined ? 0 : Number(state.sliders[id]);
    sliderEl['rangeslider-js'].update({ value: rawVal });
    if (inputEl) {
      inputEl.value = rawVal;
      inputEl.setAttribute('value', rawVal);
    }
  });

  // Set / main-stat selectors — close any open dropdowns first to prevent ghost overlaps
  [
    '#inputSet1',
    '#inputSet2',
    '#inputSet3',
    '#inputExcludeSet',
    '#inputNecklaceStat',
    '#inputRingStat',
    '#inputBootsStat',
  ].forEach((id) => $(id).multipleSelect('close'));
  const { sets, exclude } = state.setFilters;
  $('#inputSet1').multipleSelect(
    'setSelects',
    (sets[0] || []).map((x) => x.replace('Set', '')),
  );
  $('#inputSet2').multipleSelect(
    'setSelects',
    (sets[1] || []).map((x) => x.replace('Set', '')),
  );
  $('#inputSet3').multipleSelect(
    'setSelects',
    (sets[2] || []).map((x) => x.replace('Set', '')),
  );
  $('#inputExcludeSet').multipleSelect(
    'setSelects',
    (exclude || []).map((x) => x.replace('Set', '')),
  );
  const [necklace, ring, boots] = state.mainFilters;
  $('#inputNecklaceStat').multipleSelect('setSelects', necklace || []);
  $('#inputRingStat').multipleSelect('setSelects', ring || []);
  $('#inputBootsStat').multipleSelect('setSelects', boots || []);

  // Options checkboxes
  $('#inputPredictReforges').prop('checked', state.options.predictReforges);
  $('#inputSubstatMods').prop('checked', state.options.substatMods);
  $('#inputAllowLockedItems').prop('checked', state.options.allowLockedItems);
  $('#inputAllowEquippedItems').prop(
    'checked',
    state.options.allowEquippedItems,
  );
  $('#inputOrderedHeroPriority').prop(
    'checked',
    state.options.orderedHeroPriority,
  );
  $('#inputKeepCurrentItems').prop('checked', state.options.keepCurrentItems);

  // Slot substat filters
  slotSubstatFiltersMap[''] = structuredClone(state.slotSubstatFilterSnapshot);
  updateSlotSubstatFilterButton('');

  // Slot stat floor filters
  slotStatFloorFiltersMap[''] = structuredClone(
    state.slotStatFloorSnapshot || {},
  );
  updateSlotStatFloorButton('');

  // Per-slot / per-set priority matrices (paired with the Reset that now clears them)
  slotPriorityConfigByIndex[''] = state.slotPriorityConfigSnapshot
    ? structuredClone(state.slotPriorityConfigSnapshot)
    : null;
  setPriorityConfigByIndex[''] = state.setPriorityConfigSnapshot
    ? structuredClone(state.setPriorityConfigSnapshot)
    : null;
  // Re-sync the global sliders from a restored matrix so the two stay consistent.
  if (slotPriorityConfigByIndex['']) reaverageGlobalsFromMatrix('');

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
  if (_undoResetTimer) {
    clearTimeout(_undoResetTimer);
    _undoResetTimer = null;
  }
}
// ---------------------------------------------------------------------------

const OptimizerTab = {
  initialize: () => {
    ipc.on('resized', () => {
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
    const _quickFilterBtn = document.getElementById(
      'submitOptimizerQuickFilter',
    );
    if (_quickFilterBtn) {
      _quickFilterBtn.addEventListener('click', async () => {
        const cur = OptimizerTab.getOptimizationRequestParams();
        const FIELDS = [
          'inputAtkMinLimit',
          'inputAtkMaxLimit',
          'inputHpMinLimit',
          'inputHpMaxLimit',
          'inputDefMinLimit',
          'inputDefMaxLimit',
          'inputSpdMinLimit',
          'inputSpdMaxLimit',
          'inputCrMinLimit',
          'inputCrMaxLimit',
          'inputCdMinLimit',
          'inputCdMaxLimit',
          'inputEffMinLimit',
          'inputEffMaxLimit',
          'inputResMinLimit',
          'inputResMaxLimit',
        ];
        const seed = {};
        FIELDS.forEach((k) => {
          seed[k] = cur[k];
        });
        const result = await Dialog.scratchFilterDialog(seed);
        if (result) {
          await submitScratchFilterRequest(result);
        }
      });
    }
    document
      .getElementById('submitOptimizerCancel')
      .addEventListener('click', () => {
        // Cancel = stop and show ALL kept results (served from the backend,
        // paginated) — not just a 500-row snapshot.
        if (progressTimer) {
          clearInterval(progressTimer);
        }
        _cancelMode = 'all';
        Api.cancelOptimizationRequest();
        _lastRunFingerprints.delete(
          document.getElementById('inputHeroAdd').value,
        );
        const snapId = currentExecutionId;
        Api.getBestSoFar(snapId)
          .then((response) => {
            if (response && response.maximum > 0) {
              // Backend mode: the grid pages through the full frozen result set.
              OptimizerGrid.clearRestoredSource();
              OptimizerGrid.reloadData();
              const n = Number(response.maximum).toLocaleString();
              updateOptimizerTabLabel(n);
              $('#resultsFoundNum').text(n);
              _clearStaleResultsBanner();
              Notifier.info(
                `Search cancelled — showing all ${n} results found`,
              );
            }
          })
          .catch(() => {});
      });
    const _quickCancelBtn = document.getElementById(
      'submitOptimizerQuickCancel',
    );
    if (_quickCancelBtn) {
      _quickCancelBtn.addEventListener('click', () => {
        // Quick Cancel = stop and show an instant 500-row snapshot of the best
        // results found so far (no full-set page/sort).
        if (progressTimer) {
          clearInterval(progressTimer);
        }
        _cancelMode = 'quick';
        Api.cancelOptimizationRequest();
        _lastRunFingerprints.delete(
          document.getElementById('inputHeroAdd').value,
        );
        const snapId = currentExecutionId;
        Api.getBestSoFar(snapId)
          .then((response) => {
            if (response && response.maximum > 0) {
              OptimizerGrid.setRestoredSource(
                response.heroStats,
                response.maximum,
              );
              const shown = Math.min(500, response.maximum);
              updateOptimizerTabLabel(
                Number(response.maximum).toLocaleString(),
              );
              $('#resultsFoundNum').text(
                Number(response.maximum).toLocaleString(),
              );
              _clearStaleResultsBanner();
              Notifier.info(
                `Search cancelled — quick preview of the best ${Number(shown).toLocaleString()} results`,
              );
            }
          })
          .catch(() => {});
      });
    }

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

    document
      .getElementById('bottomTabBtnGear')
      .addEventListener('click', () => {
        OptimizerTab.switchBottomTab('gear');
      });
    document
      .getElementById('bottomTabBtnFribbels')
      .addEventListener('click', () => {
        OptimizerTab.switchBottomTab('fribbels');
      });
    // Wire all Fribbels Library event listeners and pass required dependencies
    FribbelsLibrary.init({
      recalculateFilters,
      updatePriorityWeightBar,
      getCurrentHero: () => currentHeroResponse,
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

        Selectors.clearGearMainAndSets();

        clearSubstatPriority();

        clearOptions();

        slotSubstatFiltersMap[''] = {};
        updateSlotSubstatFilterButton('');

        slotStatFloorFiltersMap[''] = {};
        updateSlotStatFloorButton('');

        // Per-slot / per-set priority matrices are live filter inputs (consumed even when the
        // global sliders read 0, via hasAnySlotOverride/hasAnySetOverride). Clearing the maps
        // above but not these left a hidden matrix silently filtering after a "Reset".
        slotPriorityConfigByIndex[''] = null;
        setPriorityConfigByIndex[''] = null;

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
    _initArchetypeDropdown();
    document
      .getElementById('applyArchetypeBtn')
      .addEventListener('click', () => _applyArchetypeDefaults());
    const _readGlobalWeights = () => ({
      atk: readFloat('atkSliderInput') || 0,
      hp: readFloat('hpSliderInput') || 0,
      def: readFloat('defSliderInput') || 0,
      spd: readFloat('spdSliderInput') || 0,
      cr: readFloat('crSliderInput') || 0,
      cd: readFloat('cdSliderInput') || 0,
      eff: readFloat('effSliderInput') || 0,
      res: readFloat('resSliderInput') || 0,
    });
    document
      .getElementById('openSlotPrioritiesBtn')
      .addEventListener('click', async () => {
        const result = await Dialog.editSlotPrioritiesDialog(
          slotPriorityConfigByIndex[''] || null,
          _readGlobalWeights(),
        );
        if (result) {
          slotPriorityConfigByIndex[''] = result;
          // Globals become the legal-slot average of the edited matrix (two-way).
          reaverageGlobalsFromMatrix('');
          // Re-run the filter so the slot heatmaps reflect the new weights.
          // Persisted onto the hero on the next optimize (same as the sliders).
          recalculateFilters();
        }
      });
    const _openSetPrioBtn = document.getElementById('openSetPrioritiesBtn');
    if (_openSetPrioBtn) {
      _openSetPrioBtn.addEventListener('click', async () => {
        const params = OptimizerTab.getOptimizationRequestParams(false);
        if (!PriorityFilter.setForced(params)) {
          Dialog.info(
            'Force at least one set first to set per-set priorities.',
          );
          return;
        }
        const forcedSets = [...PriorityFilter.getRequiredSets(params)];
        const result = await Dialog.editSetPrioritiesDialog(
          setPriorityConfigByIndex[''] || null,
          _readGlobalWeights(),
          forcedSets,
        );
        if (result) {
          setPriorityConfigByIndex[''] = result;
          recalculateFilters();
        }
      });
    }
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
      .getElementById('openSlotStatFloor')
      .addEventListener('click', async () => {
        const result = await Dialog.slotStatFloorDialog(
          slotStatFloorFiltersMap[''] || {},
          '',
        );
        if (result) {
          slotStatFloorFiltersMap[''] = result.slotFilters;
          updateSlotStatFloorButton('');
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
            Number.parseInt(
              document.getElementById('slotFilterAllInput').value,
              10,
            ) || 100,
          ),
        );
        setAllSlotSliders(pct);
        debouncedRecalculate();
      });
    document
      .getElementById('slotFilterBalance')
      .addEventListener('click', () => {
        const SLOT_KEYS = [
          'Weapon',
          'Helmet',
          'Armor',
          'Necklace',
          'Ring',
          'Boots',
        ];
        const slots = [
          'weapon',
          'helmet',
          'armor',
          'necklace',
          'ring',
          'boots',
        ];

        const pct = Math.min(
          100,
          Math.max(
            1,
            Number.parseInt(
              document.getElementById('slotFilterAllInput').value,
              10,
            ) || 1,
          ),
        );

        // Use the largest slot at the given % as the target item count.
        // Smaller slots (Necklace, Ring) get a higher % so they contribute
        // the same number of items as the largest slot would at pct%.
        const maxCount = Math.max(
          ...SLOT_KEYS.map((s) => allItemsSlotCounts[s] || 1),
        );
        const targetCount = Math.ceil((pct / 100) * maxCount);

        slots.forEach((slot, i) => {
          const count = allItemsSlotCounts[SLOT_KEYS[i]] || 1;
          const slotPct = Math.max(
            1,
            Math.min(100, Math.ceil((targetCount / count) * 100)),
          );
          setOneSlotSlider(slot, slotPct);
        });

        recalculateFilters();
      });
    document.getElementById('slotFilterAuto').addEventListener('click', () => {
      const targetM =
        Number.parseFloat(
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
        Math.max(1, Math.round(100 * Math.pow(TARGET / totalPre, 1 / 6))),
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
        PriorityFilter.clearScoreCache();
        autoConfigSlotFiltersFromTargets(
          params,
          allItemsResponse.items,
          heroResponse.baseStats,
        );
        recalculateFilters();
      });

    document
      .getElementById('slotFilterHeatmapApply')
      .addEventListener('click', () => {
        const pct = Number.parseInt(
          document.getElementById('slotFilterHeatmapSelect').value,
          10,
        );
        setAllSlotSliders(pct);
        const globalSlider = document.getElementById('globalSlotFilterSlider');
        const globalSliderValue = document.getElementById(
          'globalSlotFilterValue',
        );
        if (globalSlider) globalSlider.value = pct;
        if (globalSliderValue) globalSliderValue.textContent = `${pct}%`;
        document.getElementById('slotFilterAllInput').value = pct;
        recalculateFilters();
      });

    document.querySelectorAll('.slot-heatmap-select').forEach((sel) => {
      sel.addEventListener('change', () => {
        if (!sel.value) return;
        const pct = Number.parseInt(sel.value, 10);
        setOneSlotSlider(sel.dataset.slot, pct);
        recalculateFilters();
      });
    });

    document.querySelectorAll('.slider-step-btn').forEach((btn) => {
      const slot = btn.dataset.slot;
      const delta = Number.parseInt(btn.dataset.delta, 10);
      addRepeatClick(btn, () => {
        const inputEl = document.getElementById(`${slot}FilterSliderInput`);
        if (!inputEl) return;
        const current = Number.parseInt(inputEl.value, 10) || 100;
        const next = Math.min(100, Math.max(1, current + delta));
        setOneSlotSlider(slot, next);
        debouncedRecalculate();
      });
    });

    const globalSlider = document.getElementById('globalSlotFilterSlider');
    const globalSliderValue = document.getElementById('globalSlotFilterValue');
    if (globalSlider) {
      globalSlider.addEventListener('input', () => {
        const pct = Number.parseInt(globalSlider.value, 10);
        globalSliderValue.textContent = `${pct}%`;
        document.getElementById('slotFilterAllInput').value = pct;
        setAllSlotSliders(pct);
        debouncedRecalculate();
      });
    }

    document.querySelectorAll('.global-slider-step-btn').forEach((btn) => {
      const delta = Number.parseInt(btn.dataset.delta, 10);
      addRepeatClick(btn, () => {
        const current = Number.parseInt(globalSlider.value, 10) || 100;
        const next = Math.min(100, Math.max(10, current + delta));
        globalSlider.value = next;
        globalSliderValue.textContent = `${next}%`;
        document.getElementById('slotFilterAllInput').value = next;
        setAllSlotSliders(next);
        debouncedRecalculate();
      });
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
    document.getElementById('gearPreviewLock').addEventListener('click', () => {
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
      FribbelsLibrary.resetForHeroChange();

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
        _showStaleResultsBanner('Cached — re-run to update');
      } else {
        $('#resultsFoundNum').text('0');
        updateOptimizerTabLabel(null);
        _clearStaleResultsBanner();
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

    document
      .getElementById('forceFilterToggle')
      .addEventListener('click', () => {
        const section = document.getElementById('forceFilterSection');
        const label = document.getElementById('forceFilterToggleLabel');
        const open = section.style.display === 'none';
        section.style.display = open ? '' : 'none';
        label.textContent =
          (open ? '▾ ' : '▸ ') +
          (label.dataset.t === undefined
            ? 'Force Substat Filter'
            : i18next.t('Force Substat Filter'));
      });

    document
      .getElementById('mustHaveSubstatToggle')
      .addEventListener('click', () => {
        const section = document.getElementById('mustHaveSubstatSection');
        const label = document.getElementById('mustHaveSubstatToggleLabel');
        const open = section.style.display === 'none';
        section.style.display = open ? '' : 'none';
        label.textContent = (open ? '▾ ' : '▸ ') + 'Must-Have Substat';
      });

    document
      .getElementById('targetPriorityToggle')
      .addEventListener('click', () => {
        const section = document.getElementById('targetPrioritySection');
        const label = document.getElementById('targetPriorityToggleLabel');
        const open = section.style.display === 'none';
        section.style.display = open ? '' : 'none';
        label.textContent = (open ? '▾ ' : '▸ ') + 'Target Priority';
      });

    $('#mustHaveSubstatSelect').change(recalculateFilters);
    $('#mustHaveSubstatCount').change(recalculateFilters);

    $('.optionsExcludeGearFrom').change(() => {
      // Doesnt work without explicit function call for some reason
      recalculateFilters();
    });

    document.getElementById('tab1label').addEventListener('click', async () => {
      await OptimizerTab.redrawHeroSelector();
      invalidateItemsCache();
      recalculateFilters();
      fixSliders();
      if (document.getElementById('inputOrderedHeroPriority').checked) {
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
        Log.debug('addSkills', heroId);

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
        // Re-pin the hero so the optimizer reflects the new bonus stats — including
        // CR push, which drives the FSpd column (and the library's, same hero).
        try {
          const updated = await Api.getHeroById(
            heroId,
            $('#inputPredictReforges').prop('checked'),
          );
          OptimizerGrid.setPinnedHero(updated.hero);
          OptimizerGrid.setBaseStats(updated.baseStats);
          OptimizerGrid.refresh();
          FribbelsLibrary.refreshCalcColumns?.();
        } catch (e) {
          Log.error('Failed to refresh hero after bonus edit:', e);
        }
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
      });

    const updatePriorityBar = () => {
      // Two-way binding: a manual global-slider edit broadcasts into the
      // materialized per-slot matrix (no-op in global-only mode).  Suppressed
      // while we programmatically re-average globals from the matrix.
      if (!_suppressGlobalBroadcast) broadcastGlobalsToSlots('');
      updatePriorityWeightBar('');
      updatePriorityHints();
    };
    _HINT_STATS.forEach(({ id }) =>
      buildPrioritySpinner(id, updatePriorityBar),
    );
    _HINT_STATS.forEach(({ id }) => {
      const el = document.getElementById(`${id}PriorityHint`);
      if (!el) return;
      el.addEventListener('change', () => applyTargetHint(id));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyTargetHint(id);
        }
      });
    });
    [
      'inputAtkTarget',
      'inputDefTarget',
      'inputHpTarget',
      'inputSpdTarget',
      'inputCrTarget',
      'inputCdTarget',
      'inputEffTarget',
      'inputResTarget',
      'inputAtkMinTarget',
      'inputDefMinTarget',
      'inputHpMinTarget',
      'inputSpdMinTarget',
      'inputCrMinTarget',
      'inputCdMinTarget',
      'inputEffMinTarget',
      'inputResMinTarget',
      'inputAtkSweetTarget',
      'inputDefSweetTarget',
      'inputHpSweetTarget',
      'inputSpdSweetTarget',
      'inputCrSweetTarget',
      'inputCdSweetTarget',
      'inputEffSweetTarget',
      'inputResSweetTarget',
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', updatePriorityBar);
        el.addEventListener('change', () => OptimizerGrid.refreshTargetCells());
        el.addEventListener('change', () => validateTargets(''));
      }
    });
    // Stat min/max LIMIT inputs: flag an inverted (min>max) limit live too.
    ['Atk', 'Def', 'Hp', 'Spd', 'Cr', 'Cd', 'Eff', 'Res'].forEach((cap) => {
      ['inputMin', 'inputMax'].forEach((pfx) => {
        const el = document.getElementById(`${pfx}${cap}Limit`);
        if (el) el.addEventListener('change', () => validateTargets(''));
      });
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
      const min = Number.parseFloat(sliderEl.min);
      const max = Number.parseFloat(sliderEl.max);
      const parsed = Number.parseFloat(ev.target.value);
      const clamped = Number.isNaN(parsed)
        ? 0
        : Math.min(max, Math.max(min, parsed));
      const rounded = Math.round(clamped * 10) / 10;
      nrInput.value = rounded;
      sliderEl['rangeslider-js'].update({ value: rounded });
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
      const val = Number.parseInt(ev.target.value, 10);
      if (!Number.isNaN(val) && val >= 1) {
        inputDriven = true;
        sliderEl['rangeslider-js'].update({
          value: Math.round(10 * Math.sqrt(val)),
        });
        inputDriven = false;
      }
    });
    nrInput.addEventListener('change', (ev) => {
      const parsed = Number.parseInt(ev.target.value, 10);
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
    const { hero } = heroResponse;
    const { baseStats } = heroResponse;
    const heroId = hero.id;
    const allItems = allItemsResponse.items;

    if (!params.inputSets) {
      params.inputSets = [
        params.inputSetsOne,
        params.inputSetsTwo,
        params.inputSetsThree,
      ];
    }

    Log.debug('Optimization params', params);

    // Per-slot filter-pipeline trace (gated by Log.debug / window.__optDebug — silent by default).
    const _slots = ['Weapon', 'Helmet', 'Armor', 'Necklace', 'Ring', 'Boots'];
    function _dbg(label, arr) {
      const bySlot = {};
      _slots.forEach((s) => {
        bySlot[s] = 0;
      });
      arr.forEach((i) => {
        if (bySlot[i.gear] !== undefined) bySlot[i.gear]++;
      });
      const parts = _slots
        .map((s) => `${s.substring(0, 2)}:${bySlot[s]}`)
        .join(' ');
      Log.debug(
        `[FILTER] ${label.padEnd(22)} total=${String(arr.length).padStart(5)}  ${parts}`,
      );
    }

    const allHeroesResponse = await getAllHeroesCached();
    const { heroes } = allHeroesResponse;

    let items = applyBasicFilters(allItems, params, heroId);
    _dbg('applyBasicFilters', items);
    Dialog.updateSetFilterCounts(computeSetCounts(items), items.length, index);
    items = applySetFilter(items, params);
    _dbg('applySetFilter', items);
    items = applySetRequirementPreFilter(items, params);
    _dbg('applySetReqPreFilter', items);
    Dialog.updateMainStatCounts(computeMainStatCounts(items), index);
    items = applyEquipLockFilters(items, params, heroId);
    items = applyHeroPriorityFilter(
      items,
      params,
      heroes,
      hero,
      allowedHeroIds,
    );
    items = applyKeepCurrentItemsFilter(items, params, hero);
    items = applyGearMainFilters(items, gearMainFilters);
    _dbg('applyGearMainFilters', items);
    items = applyPredictReforges(items, params);
    items = applyGSLimitFilter(items, params);
    _dbg('applyGSLimitFilter', items);
    items = applySlotSubstatFilters(items, params);
    _dbg('applySlotSubstatFilters', items);
    Log.debug(
      '[FILTER] inputSlotStatFloors:',
      JSON.stringify(params.inputSlotStatFloors),
    );
    items = applySlotStatFloorFilter(items, params);
    _dbg('applySlotStatFloorFilter', items);

    const forceNumber = Number.parseInt($('#forceNumberSelect').val(), 10);
    const forceAndMode = $('#forceAndMode').prop('checked') || false;
    items = ForceFilter.applyForceFilters(
      params,
      items,
      forceNumber,
      forceAndMode,
    );
    _dbg('ForceFilter', items);
    items = applyAllFastRejects(items, params, baseStats, hero);
    _dbg('applyAllFastRejects', items);

    if (items.length > 0) {
      items = applyMustHaveSubstatFilter(params, items);
    }

    // Priority filter runs on base items BEFORE mod expansion so the top-N%
    // cutoff applies to the smaller un-expanded pool.  Mod expansion then only
    // generates variants for items that already passed the priority gate.
    items = PriorityFilter.applyPriorityFilters(
      params,
      items,
      baseStats,
      allItems,
      params.inputPredictReforges,
      params.inputSubstatMods,
      hero,
      params.inputSubstatMods,
    );

    const preModCount = items.length;
    // B (variant pruning): the set of substat types that can affect this run's
    // ranking/feasibility.  apply() skips cloning mod variants whose new stat is
    // not in this set (dominated — zero priority, no target, no min-limit/force).
    // null when mods are off; an empty set inside apply() disables pruning.
    const relevantStats = params.inputSubstatMods
      ? PriorityFilter.computeRelevantStats(params)
      : null;
    items = ModificationFilter.apply(
      items,
      params.inputSubstatMods,
      hero,
      submit,
      index,
      relevantStats,
    );
    // Re-score the mod variants from their MODDED stats.  apply() structuredClones each
    // variant, so it inherits the base item's score/priority/priorityScore — without this
    // the build ranking (buildScore = Σ item.priorityScore) would credit a modded build as
    // if the gear were un-modded.  Done here (not in modificationFilter) because that module
    // can't import priorityFilter without a circular dependency.  Base items are score-cache
    // hits (no-op); only the uuid-keyed variants recompute, against their modded augmented/
    // reforged stats, using the same reforge flag the base scoring used.
    if (params.inputSubstatMods) {
      items.forEach((it) => {
        if (it.mod) {
          PriorityFilter.scoreItem(
            it,
            params,
            baseStats,
            params.inputPredictReforges,
          );
        }
      });
    }
    const postModCount = items.length;

    // Capture per-slot counts after mod expansion so Filter/Search details
    // can show "passed / total-modded-pool" per slot.
    const postModSlotCounts = {
      Weapon: 0,
      Helmet: 0,
      Armor: 0,
      Necklace: 0,
      Ring: 0,
      Boots: 0,
    };
    items.forEach((item) => {
      if (postModSlotCounts[item.gear] !== undefined)
        postModSlotCounts[item.gear]++;
    });

    // (Removed a dead `items.sort((a, b) => a.set - b.set)` — `item.set` is a string set name,
    // so the subtraction was NaN and the sort a no-op; bucketizeBySelectedSets reorders anyway.)
    const prioritizedItems = bucketizeBySelectedSets(items, params);

    Log.debug('Filtered items', prioritizedItems.length);
    return {
      items: prioritizedItems,
      allItems,
      preModCount,
      postModCount,
      postModSlotCounts,
    };
  },

  // Ranks/scale ride the saved optimization request — persisted on Start / Save build
  // and restored on hero load, exactly like the stat targets.  Refresh the score cells
  // so the change is reflected on the next run.
  onTargetRankChange: () => {
    try {
      OptimizerGrid.refreshTargetCells();
    } catch {
      /* ignore */
    }
  },

  getOptimizationRequestParams: (showError, index = '') => {
    const request = new OptimizationRequest();

    const setFilters = Selectors.getSetFilters(index);
    const mainFilters = Selectors.getGearMainFilters(index);
    const excludeFilter = Selectors.getExcludeGearFrom(index);
    const enhanceLimit = Selectors.getEnhanceLimit(index);
    const setFormat = getSetFormat(setFilters.sets, showError);

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
    request.inputUsePvECritDamageCap = readCheckbox(
      `inputUsePvECritDamageCap${index}`,
    );
    // Substat mods are applied on top of reforged substats, so enabling mods forces
    // predict-reforges on regardless of the checkbox (intentional coupling).
    request.inputPredictReforges =
      request.inputSubstatMods || readCheckbox(`inputPredictReforges${index}`);

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

    request.inputAtkSweetTarget = readNumber(`inputAtkSweetTarget${index}`);
    request.inputHpSweetTarget = readNumber(`inputHpSweetTarget${index}`);
    request.inputDefSweetTarget = readNumber(`inputDefSweetTarget${index}`);
    request.inputSpdSweetTarget = readNumber(`inputSpdSweetTarget${index}`);
    request.inputCrSweetTarget = readNumber(`inputCrSweetTarget${index}`);
    request.inputCdSweetTarget = readNumber(`inputCdSweetTarget${index}`);
    request.inputEffSweetTarget = readNumber(`inputEffSweetTarget${index}`);
    request.inputResSweetTarget = readNumber(`inputResSweetTarget${index}`);

    // Per-hero target-priority ranks (1 = highest) + tunable scale.
    request.inputAtkTargetRank = readNumber(`inputAtkTargetRank${index}`);
    request.inputHpTargetRank = readNumber(`inputHpTargetRank${index}`);
    request.inputDefTargetRank = readNumber(`inputDefTargetRank${index}`);
    request.inputSpdTargetRank = readNumber(`inputSpdTargetRank${index}`);
    request.inputCrTargetRank = readNumber(`inputCrTargetRank${index}`);
    request.inputCdTargetRank = readNumber(`inputCdTargetRank${index}`);
    request.inputEffTargetRank = readNumber(`inputEffTargetRank${index}`);
    request.inputResTargetRank = readNumber(`inputResTargetRank${index}`);
    request.inputTargetRankScale =
      Number.parseFloat(
        document.getElementById(`inputTargetRankScale${index}`)?.value,
      ) || 0;

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
    request.inputMinMcdmgpsLimit = readNumber(`inputMinMcdmgpsLimit${index}`);
    request.inputMaxMcdmgpsLimit = readNumber(`inputMaxMcdmgpsLimit${index}`);

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
    request.inputMinHmcdmgsLimit = readNumber(`inputMinHmcdmgsLimit${index}`);
    request.inputMaxHmcdmgsLimit = readNumber(`inputMaxHmcdmgsLimit${index}`);
    request.inputMinDmcdmgsLimit = readNumber(`inputMinDmcdmgsLimit${index}`);
    request.inputMaxDmcdmgsLimit = readNumber(`inputMaxDmcdmgsLimit${index}`);
    request.inputMinHdmgLimit = readNumber(`inputMinHdmgLimit${index}`);
    request.inputMaxHdmgLimit = readNumber(`inputMaxHdmgLimit${index}`);
    request.inputMinHdmgsLimit = readNumber(`inputMinHdmgsLimit${index}`);
    request.inputMaxHdmgsLimit = readNumber(`inputMaxHdmgsLimit${index}`);
    request.inputMinDdmgLimit = readNumber(`inputMinDdmgLimit${index}`);
    request.inputMaxDdmgLimit = readNumber(`inputMaxDdmgLimit${index}`);
    request.inputMinDdmgsLimit = readNumber(`inputMinDdmgsLimit${index}`);
    request.inputMaxDdmgsLimit = readNumber(`inputMaxDdmgsLimit${index}`);
    request.inputMinUpgradesLimit = readNumber(`inputMinUpgradesLimit${index}`);
    request.inputMaxUpgradesLimit = readNumber(`inputMaxUpgradesLimit${index}`);
    request.inputMinConversionsLimit = readNumber(
      `inputMinConversionsLimit${index}`,
    );
    request.inputMaxConversionsLimit = readNumber(
      `inputMaxConversionsLimit${index}`,
    );
    request.inputMinEquippedLimit = readNumber(`inputMinEquippedLimit${index}`);
    request.inputMaxEquippedLimit = readNumber(`inputMaxEquippedLimit${index}`);
    request.inputMinScoreLimit = readNumber(`inputMinScoreLimit${index}`);
    request.inputMaxScoreLimit = readNumber(`inputMaxScoreLimit${index}`);
    request.inputMinBSLimit = readNumber(`inputMinBSLimit${index}`);
    request.inputMaxBSLimit = readNumber(`inputMaxBSLimit${index}`);
    request.inputMinPriorityLimit = readNumber(`inputMinPriorityLimit${index}`);
    request.inputMaxPriorityLimit = readNumber(`inputMaxPriorityLimit${index}`);
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

    request.inputAtkPriority = readFloat(`atkSlider${index}Input`);
    request.inputHpPriority = readFloat(`hpSlider${index}Input`);
    request.inputDefPriority = readFloat(`defSlider${index}Input`);
    request.inputSpdPriority = readFloat(`spdSlider${index}Input`);
    request.inputCrPriority = readFloat(`crSlider${index}Input`);
    request.inputCdPriority = readFloat(`cdSlider${index}Input`);
    request.inputEffPriority = readFloat(`effSlider${index}Input`);
    request.inputResPriority = readFloat(`resSlider${index}Input`);
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
    request.inputPriorityScoreFloor = readNumber('priorityScoreFloor') || 0;

    // Per-slot priority overrides + ranking basis (filtering-only; the backend
    // persists them on the hero but the Java optimizer ignores them).
    request.slotPriorityConfig = slotPriorityConfigByIndex[index] || null;
    request.setPriorityConfig = setPriorityConfigByIndex[index] || null;
    // Global Settings toggle: scan the whole space and keep only the best N by
    // priority (bounded, crash-proof) instead of stopping at the result cap.
    request.keepBestN =
      document.getElementById('settingKeepBestN')?.checked === true;
    // Keep-best-N has its own result cap (separate box) so it can differ from the
    // legacy stop-at-limit; 0 ⇒ backend falls back to settingMaxResults.
    request.keepBestNLimit =
      Number.parseInt(
        Settings.parseNumberValue('settingMaxResultsKeepN') || 0,
        10,
      ) || 0;
    request.inputPriorityRankBasis =
      document.getElementById(`inputPriorityRankBasis${index}`)?.value || null;

    request.inputForceNumberSelect = readNumber('forceNumberSelect');
    request.inputForceAndMode = $('#forceAndMode').prop('checked') || false;

    request.inputGlobalMustHaveStat = $('#mustHaveSubstatSelect').val() || null;
    request.inputGlobalMustHaveCount = readNumber('mustHaveSubstatCount') || 1;

    request.inputSets = setFilters.sets;

    [request.inputSetsOne, request.inputSetsTwo, request.inputSetsThree] =
      setFilters.sets;
    request.inputExcludeSet = setFilters.exclude;

    [request.inputNecklaceStat, request.inputRingStat, request.inputBootsStat] =
      mainFilters;

    request.excludeFilter = excludeFilter;
    request.enhanceLimit = enhanceLimit;

    request.setFormat = setFormat;

    request.inputSlotSubstatFilters = slotSubstatFiltersMap[index] || {};
    request.inputSlotStatFloors = slotStatFloorFiltersMap[index] || {};

    return request;
  },

  _applyDefaultOptimizerSettings: (index) => {
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
    $(`#inputUsePvECritDamageCap${index}`).prop('checked', false);
  },

  _applyRequestCheckboxes: (index, request) => {
    const optimizerSettings = Settings.getOptimizerOptions();
    // Boolean toggles: use the saved value, else fall back to the user's default setting
    // (id === request key for all of these).
    [
      ['inputPredictReforges', 'settingDefaultUseReforgedStats'],
      ['inputSubstatMods', 'settingDefaultUseSubstatMods'],
      ['inputAllowLockedItems', 'settingDefaultLockedItems'],
      ['inputAllowEquippedItems', 'settingDefaultEquippedItems'],
      ['inputKeepCurrentItems', 'settingDefaultKeepCurrent'],
      ['inputOrderedHeroPriority', 'settingDefaultUseHeroPriority'],
    ].forEach(([id, setKey]) => {
      $(`#${id}${index}`).prop(
        'checked',
        isNullUndefined(request[id]) ? optimizerSettings[setKey] : request[id],
      );
    });
    // No settingDefault* counterpart for this one (defaults to off, like Rex's upstream).
    $(`#inputUsePvECritDamageCap${index}`).prop(
      'checked',
      request.inputUsePvECritDamageCap === true,
    );
  },

  _applyMustHaveSubstat: (request) => {
    if (request.inputGlobalMustHaveStat) {
      $('#mustHaveSubstatSelect').val(request.inputGlobalMustHaveStat);
      if (request.inputGlobalMustHaveCount) {
        $('#mustHaveSubstatCount').val(request.inputGlobalMustHaveCount);
      }
      const section = document.getElementById('mustHaveSubstatSection');
      const label = document.getElementById('mustHaveSubstatToggleLabel');
      if (section?.style.display === 'none') {
        section.style.display = '';
        label.textContent = '▾ Must-Have Substat';
      }
    } else {
      $('#mustHaveSubstatSelect').val('');
    }
  },

  loadPreviousHeroFilters: async (heroResponseArg, indexArg, recalc, tab) => {
    const index = indexArg ?? '';
    let heroResponse = heroResponseArg;

    if (!heroResponse) {
      const heroId = document.getElementById('inputHeroAdd').value;
      heroResponse = await Api.getHeroById(
        heroId,
        $('#inputPredictReforges').prop('checked'),
      );
    }
    // Capture the RESOLVED response (after the null-arg fallback fetch), not the raw arg —
    // assigning the raw arg first would null out currentHeroResponse when called with no
    // response and break the priority hints (which read currentHeroResponse?.baseStats).
    if (!indexArg) currentHeroResponse = heroResponse;

    const { hero } = heroResponse;
    if (!hero) return;
    const request = hero.optimizationRequest;

    if (!request) {
      // No saved request for this hero — clear any per-slot/per-set priority matrices and slot
      // filters carried over from the previously-loaded hero, so they don't silently apply to
      // (and get persisted onto) this one.
      slotPriorityConfigByIndex[index] = null;
      setPriorityConfigByIndex[index] = null;
      slotSubstatFiltersMap[index] = {};
      updateSlotSubstatFilterButton(index);
      slotStatFloorFiltersMap[index] = {};
      updateSlotStatFloorButton(index);
      OptimizerTab._applyDefaultOptimizerSettings(index);
      return;
    }

    // Restore every numeric stat-limit / target / sweet-spot input from the saved
    // request. Entry is [elementId, requestKey] when they differ (the 8 core-stat
    // Min/Max limits: #inputMin<Stat>Limit ← input<Stat>MinLimit) or a bare string when
    // id === key. Order is irrelevant — each sets a distinct element from the unchanged
    // request. (Was ~280 lines of hand-written .val() calls.)
    const _restoreNumberFields = [
      ['inputMinAtkLimit', 'inputAtkMinLimit'],
      ['inputMaxAtkLimit', 'inputAtkMaxLimit'],
      ['inputMinHpLimit', 'inputHpMinLimit'],
      ['inputMaxHpLimit', 'inputHpMaxLimit'],
      ['inputMinDefLimit', 'inputDefMinLimit'],
      ['inputMaxDefLimit', 'inputDefMaxLimit'],
      ['inputMinSpdLimit', 'inputSpdMinLimit'],
      ['inputMaxSpdLimit', 'inputSpdMaxLimit'],
      ['inputMinCrLimit', 'inputCrMinLimit'],
      ['inputMaxCrLimit', 'inputCrMaxLimit'],
      ['inputMinCdLimit', 'inputCdMinLimit'],
      ['inputMaxCdLimit', 'inputCdMaxLimit'],
      ['inputMinEffLimit', 'inputEffMinLimit'],
      ['inputMaxEffLimit', 'inputEffMaxLimit'],
      ['inputMinResLimit', 'inputResMinLimit'],
      ['inputMaxResLimit', 'inputResMaxLimit'],
      'inputAtkTarget',
      'inputHpTarget',
      'inputDefTarget',
      'inputSpdTarget',
      'inputCrTarget',
      'inputCdTarget',
      'inputEffTarget',
      'inputResTarget',
      'inputAtkMinTarget',
      'inputHpMinTarget',
      'inputDefMinTarget',
      'inputSpdMinTarget',
      'inputCrMinTarget',
      'inputCdMinTarget',
      'inputEffMinTarget',
      'inputResMinTarget',
      'inputAtkSweetTarget',
      'inputHpSweetTarget',
      'inputDefSweetTarget',
      'inputSpdSweetTarget',
      'inputCrSweetTarget',
      'inputCdSweetTarget',
      'inputEffSweetTarget',
      'inputResSweetTarget',
      'inputMinCpLimit',
      'inputMaxCpLimit',
      'inputMinHppsLimit',
      'inputMaxHppsLimit',
      'inputMinEhpLimit',
      'inputMaxEhpLimit',
      'inputMinEhppsLimit',
      'inputMaxEhppsLimit',
      'inputMinDmgLimit',
      'inputMaxDmgLimit',
      'inputMinDmgpsLimit',
      'inputMaxDmgpsLimit',
      'inputMinMcdmgLimit',
      'inputMaxMcdmgLimit',
      'inputMinMcdmgpsLimit',
      'inputMaxMcdmgpsLimit',
      'inputMinS1Limit',
      'inputMaxS1Limit',
      'inputMinS2Limit',
      'inputMaxS2Limit',
      'inputMinS3Limit',
      'inputMaxS3Limit',
      'inputMinDmgHLimit',
      'inputMaxDmgHLimit',
      'inputMinDmgDLimit',
      'inputMaxDmgDLimit',
      'inputMinHmcdmgsLimit',
      'inputMaxHmcdmgsLimit',
      'inputMinDmcdmgsLimit',
      'inputMaxDmcdmgsLimit',
      'inputMinHdmgLimit',
      'inputMaxHdmgLimit',
      'inputMinHdmgsLimit',
      'inputMaxHdmgsLimit',
      'inputMinDdmgLimit',
      'inputMaxDdmgLimit',
      'inputMinDdmgsLimit',
      'inputMaxDdmgsLimit',
      'inputMinUpgradesLimit',
      'inputMaxUpgradesLimit',
      'inputMinConversionsLimit',
      'inputMaxConversionsLimit',
      'inputMinEquippedLimit',
      'inputMaxEquippedLimit',
      'inputMinScoreLimit',
      'inputMaxScoreLimit',
      'inputMinBSLimit',
      'inputMaxBSLimit',
      'inputMinPriorityLimit',
      'inputMaxPriorityLimit',
    ];
    _restoreNumberFields.forEach((f) => {
      const [id, key] = Array.isArray(f) ? f : [f, f];
      $(`#${id}${index}`).val(inputDisplayNumber(request[key]));
    });

    // Per-hero target-priority ranks (id === key; blank when 0/unset) + the global scale.
    [
      'inputAtkTargetRank',
      'inputHpTargetRank',
      'inputDefTargetRank',
      'inputSpdTargetRank',
      'inputCrTargetRank',
      'inputCdTargetRank',
      'inputEffTargetRank',
      'inputResTargetRank',
    ].forEach((id) => $(`#${id}${index}`).val(request[id] || ''));
    $(`#inputTargetRankScale${index}`).val(
      inputDisplayNumberNumber(request.inputTargetRankScale, 0.5),
    );

    OptimizerTab._applyRequestCheckboxes(index, request);

    OptimizerTab._applyStatPrioritySliders(request, index);
    if (!index) updatePriorityHints();
    OptimizerTab._applySlotFilterSliders(request, index);
    OptimizerTab._applySlotPriorityConfig(request, index);
    $('#priorityScoreFloor').val(
      inputDisplayNumberNumber(request.inputPriorityScoreFloor) || 0,
    );

    $('#forceNumberSelect').val(
      inputDisplayNumberNumber(request.inputForceNumberSelect),
    );
    $('#forceAndMode').prop('checked', request.inputForceAndMode || false);

    // Restore the substat-force min/max inputs (global, single-optimizer only). They are
    // serialized by getOptimizationRequestParams but were never written back, so stale values
    // leaked across hero switches and got re-saved onto the next hero.
    if (!index) {
      const _forceMap = {
        inputMinAtkForce: request.inputAtkMinForce,
        inputMaxAtkForce: request.inputAtkMaxForce,
        inputMinAtkPercentForce: request.inputAtkPercentMinForce,
        inputMaxAtkPercentForce: request.inputAtkPercentMaxForce,
        inputMinSpdForce: request.inputSpdMinForce,
        inputMaxSpdForce: request.inputSpdMaxForce,
        inputMinCrForce: request.inputCrMinForce,
        inputMaxCrForce: request.inputCrMaxForce,
        inputMinCdForce: request.inputCdMinForce,
        inputMaxCdForce: request.inputCdMaxForce,
        inputMinHpForce: request.inputHpMinForce,
        inputMaxHpForce: request.inputHpMaxForce,
        inputMinHpPercentForce: request.inputHpPercentMinForce,
        inputMaxHpPercentForce: request.inputHpPercentMaxForce,
        inputMinDefForce: request.inputDefMinForce,
        inputMaxDefForce: request.inputDefMaxForce,
        inputMinDefPercentForce: request.inputDefPercentMinForce,
        inputMaxDefPercentForce: request.inputDefPercentMaxForce,
        inputMinEffForce: request.inputEffMinForce,
        inputMaxEffForce: request.inputEffMaxForce,
        inputMinResForce: request.inputResMinForce,
        inputMaxResForce: request.inputResMaxForce,
      };
      Object.entries(_forceMap).forEach(([id, val]) => {
        $(`#${id}`).val(inputDisplayNumber(val));
      });
    }

    OptimizerTab._applyMustHaveSubstat(request);

    Selectors.setGearMainAndSetsFromRequest(request, index);

    slotSubstatFiltersMap[index] = request.inputSlotSubstatFilters ?? {};
    updateSlotSubstatFilterButton(index);

    slotStatFloorFiltersMap[index] = request.inputSlotStatFloors ?? {};
    updateSlotStatFloorButton(index);

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

  _setSliderVal: (id, val) => {
    const el = document.querySelector(id);
    if (!el) return; // missing slider (e.g. a partially-built multi card) — skip, don't abort restore
    el.setAttribute('value', val);
    el.value = val;
  },

  _applyStatPrioritySliders: (request, index) => {
    const _statSliders = [
      { id: 'atkSlider', key: 'inputAtkPriority' },
      { id: 'hpSlider', key: 'inputHpPriority' },
      { id: 'defSlider', key: 'inputDefPriority' },
      { id: 'spdSlider', key: 'inputSpdPriority' },
      { id: 'crSlider', key: 'inputCrPriority' },
      { id: 'cdSlider', key: 'inputCdPriority' },
      { id: 'effSlider', key: 'inputEffPriority' },
      { id: 'resSlider', key: 'inputResPriority' },
    ];
    _statSliders.forEach(({ id, key }) => {
      const val = inputDisplayNumberNumber(request[key]);
      OptimizerTab._setSliderVal(`#${id}${index}Input`, val);
    });
  },

  _applySlotFilterSliders: (request, index) => {
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
      // Guard the rangeslider deref: a partially-built multi card may not have this
      // slider yet (parity with _setSliderVal, which skips a missing element).
      const sliderEl = document.querySelector(`#${id}${index}`);
      if (sliderEl?.['rangeslider-js']) {
        sliderEl['rangeslider-js'].update({
          value: Math.round(10 * Math.sqrt(val)),
        });
      }
      OptimizerTab._setSliderVal(`#${id}${index}Input`, val);
    });
    // Single optimizer: reflect the restored per-slot values in the global
    // "All %" / "All slots %" set-all helpers, which otherwise stay at their
    // default 100 on restore.  Uses the shared value when uniform, else the
    // rounded average.  Set directly (don't fire setAllSlotSliders, which would
    // overwrite the per-slot values just restored).
    if (!index) {
      const vals = _slotFilterData.map(({ key }) =>
        inputDisplayNumberNumber(request[key], 100),
      );
      const allEqual = vals.every((v) => v === vals[0]);
      const pct = allEqual
        ? vals[0]
        : Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      const allInput = document.getElementById('slotFilterAllInput');
      if (allInput) allInput.value = pct;
      const gSlider = document.getElementById('globalSlotFilterSlider');
      if (gSlider) gSlider.value = Math.max(10, Math.min(100, pct));
      const gVal = document.getElementById('globalSlotFilterValue');
      if (gVal) gVal.textContent = `${pct}%`;
    }
  },

  // Restore per-slot priority overrides + ranking basis from a hero's saved
  // optimizationRequest (sibling of _applyStatPrioritySliders).
  _applySetPriorityConfig: (request, index) => {
    setPriorityConfigByIndex[index] = request.setPriorityConfig || null;
  },

  _applySlotPriorityConfig: (request, index) => {
    slotPriorityConfigByIndex[index] = request.slotPriorityConfig || null;
    OptimizerTab._applySetPriorityConfig(request, index);
    // Keep the global sliders showing the legal-slot average of the restored
    // matrix (two-way).  Single-optimizer only — multi reads per-hero configs.
    if ((index ?? '') === '' && slotPriorityConfigByIndex['']) {
      reaverageGlobalsFromMatrix('');
    }
    const el = document.getElementById(`inputPriorityRankBasis${index}`);
    if (el) el.value = request.inputPriorityRankBasis || '';
  },

  // True if blocking error
  warnParams: (params) => {
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
      Notifier.info(
        "All slot filters are at Top 100% — stat priority will rank results but won't pre-filter items.",
      );
    } else if (anySlotsBelow100 && noPriorities) {
      Dialog.error(
        'Top % was selected but no stat priorities are assigned. Assign stat priorities otherwise the filter will not work.',
      );
      return true;
    }

    if (params.inputSetsOne?.length === 0) {
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
      params.inputNecklaceStat?.length === 0 &&
      params.inputRingStat?.length === 0 &&
      params.inputBootsStat?.length === 0
    ) {
      Notifier.warn(
        'No accessory main stats were selected. For best results, use the main stat filter to narrow down the search.',
      );
    }

    // (No "target without priority" warning: a target/sweet-spot now counts on its own
    // at an implicit weight of 1 — see StatCalculator.statTargetBonus / calculateBuildScore.)
    return false;
  },

  drawPreview: async (gearIds, mods) => {
    try {
      const moddedGear = ModificationFilter.getModsByIds(gearIds, mods);

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
          const equippedById = selectedGear[i]?.equippedById;
          const equippedByName = selectedGear[i]?.equippedByName;

          selectedGear[i] = moddedGear[i];
          selectedGear[i].equippedById = equippedById;
          selectedGear[i].equippedByName = equippedByName;
          selectedGear[i].substats = moddedGear[i].substats;
          for (let j = 0; j < selectedGear[i].substats.length; j += 1) {
            selectedGear[i].substats[j].modified =
              moddedGear[i].substats[j].modified;
            selectedGear[i].substats[j].value = moddedGear[i].substats[j].value;
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
      document.getElementById('optimizer-heroes-equipped-necklace').innerHTML =
        HtmlGenerator.buildItemPanel(
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

      // Actionable decision-support: list exactly which pieces this build needs modded
      // (permanent in-game), the mod count vs the maxModPieces budget, and the RNG range.
      renderModChecklist(mods, moddedGear, hero);
    } catch (e) {
      Log.warn('drawPreview failed', e);
      Notifier.warn('Could not load the build preview — please try again.');
    }
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

  isOptimizing: () => {
    return !!progressTimer;
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
      FribbelsLibrary.initGrid();
      gearBtn.classList.remove('active');
      fribbelsBtn.classList.add('active');
      // Sync hero selector with current optimizer hero
      const heroId = document.getElementById('inputHeroAdd').value;
      const libSelect = document.getElementById('fribbelsHeroSelect');
      if (libSelect && heroId) libSelect.value = heroId;
      // Auto-fetch if hero changed since last load
      if (heroId && FribbelsLibrary.getLoadedHeroName() !== heroId) {
        FribbelsLibrary.loadData();
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
    const fribbelsSelector = document.getElementById('fribbelsHeroSelect');
    if (fribbelsSelector) clearHeroOptions('fribbelsHeroSelect');
    const optimizerHeroSelector = document.getElementById('inputHeroAdd');
    const optimizerAllowGearFromSelector = document.getElementById(
      'optionsExcludeGearFrom',
    );
    const { heroes } = getAllHeroesResponse;
    Utils.sortByAttribute(heroes, 'name');
    heroes.forEach((hero) => {
      const option = document.createElement('option');
      const option2 = document.createElement('option');
      option.textContent = i18next.t(hero.name);
      option.label = hero.name;
      option.value = hero.id;
      option2.textContent = i18next.t(hero.name);
      option2.label = hero.name;
      option2.value = hero.id;

      optimizerHeroSelector.add(option);
      optimizerAllowGearFromSelector.add(option2);

      // Also populate Fribbels Library hero selector
      if (fribbelsSelector) {
        const option3 = document.createElement('option');
        option3.textContent = i18next.t(hero.name);
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
    const skillOptions = await Dialog.changeSkillOptionsDialog(heroId);

    if (!skillOptions) {
      return;
    }

    Log.debug('skillOptions', skillOptions);

    Api.setSkillOptions(skillOptions, heroId);
    Notifier.success('Saved skill options');
    Saves.autoSave();
  },

  getSlotSubstatFilters: (index) => slotSubstatFiltersMap[index] || {},

  setSlotSubstatFilters: (index, filters) => {
    slotSubstatFiltersMap[index] = filters;
    updateSlotSubstatFilterButton(index);
  },

  getSlotStatFloorFilters: (index) => slotStatFloorFiltersMap[index] || {},

  setSlotStatFloorFilters: (index, filters) => {
    slotStatFloorFiltersMap[index] = filters;
    updateSlotStatFloorButton(index);
  },
};

// Hold-to-repeat helper for +/- step buttons (slot-filter sliders, priority spinners).
// A single press fires once; holding past 400ms repeats every 80ms. The repeat is stopped
// by a document-level mouseup/pointerup and a window blur (not just the button's own
// mouseup) so it can't run away if the pointer is released off the button or focus is lost.
function addRepeatClick(btn, action) {
  let holdTimeout = null;
  let holdInterval = null;
  function stop() {
    clearTimeout(holdTimeout);
    clearInterval(holdInterval);
    holdTimeout = null;
    holdInterval = null;
    document.removeEventListener('mouseup', stop);
    document.removeEventListener('pointerup', stop);
    window.removeEventListener('blur', stop);
  }
  btn.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    action();
    document.addEventListener('mouseup', stop);
    document.addEventListener('pointerup', stop);
    window.addEventListener('blur', stop);
    holdTimeout = setTimeout(() => {
      holdInterval = setInterval(action, 80);
    }, 400);
  });
  btn.addEventListener('mouseleave', stop);
}

function buildPrioritySpinner(statId, updateCallback) {
  const inputEl = document.getElementById(`${statId}SliderInput`);
  if (!inputEl) return;
  const MIN = -6,
    MAX = 6;

  function setVal(next) {
    inputEl.value = next;
    if (updateCallback) updateCallback();
    debouncedRecalculate();
  }

  function applyStep(delta) {
    const current = Number.parseFloat(inputEl.value) || 0;
    setVal(
      Math.max(MIN, Math.min(MAX, Math.round((current + delta) * 10) / 10)),
    );
  }

  document
    .querySelectorAll(`.priority-step-btn[data-id="${statId}"]`)
    .forEach((btn) => {
      const delta = Number.parseFloat(btn.dataset.delta);
      addRepeatClick(btn, () => applyStep(delta));
    });

  inputEl.addEventListener('input', () => {
    if (updateCallback) updateCallback();
  });
  inputEl.addEventListener('change', () => {
    const parsed = Number.parseFloat(inputEl.value);
    const clamped = Number.isNaN(parsed)
      ? 0
      : Math.max(MIN, Math.min(MAX, parsed));
    setVal(Math.round(clamped * 10) / 10);
  });
}

function clearSubstatPriority() {
  const _clearSlider = (sliderId, val) => {
    const el = document.querySelector(sliderId);
    const input = document.querySelector(`${sliderId}Input`);
    if (input) {
      input.setAttribute('value', val);
      input.value = val;
    }
    if (el?.['rangeslider-js']) el['rangeslider-js'].update({ value: val });
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
  $('#inputUsePvECritDamageCap').prop('checked', false);
}

async function editGearFromIcon(id, reforge, checkboxPrefix) {
  const result = await Api.getItemById(id);
  Log.debug('a1', result.item);
  const editedItem = await Dialog.editGearDialog(result.item, true, reforge);

  if (!editedItem) return;

  ItemAugmenter.augment([editedItem]);
  await Api.editItems([editedItem]);
  // The edited gear stats changed — invalidate the cached item pool + score cache and raise
  // the stale-results banner, so the next optimize run scores against the new stats (parity
  // with lockGearFromIcon / toggleDisableModsFromIcon, which already do this).
  invalidateItemsCache();
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
  Log.debug(result.item);

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

  const data = HeroData.getHeroExtraInfo(name.replace(/\s#\d+$/, ''));
  if (!data) return;
  const image = data.assets.thumbnail;
  $('#inputHeroImage').attr('src', image);

  const heroResponse = await Api.getHeroById(
    id,
    $('#inputPredictReforges').prop('checked'),
  );
  const { hero } = heroResponse;
  if (!hero) return;
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
    imprintType === 'max_hp' || imprintType === 'att' || imprintType === 'def';

  const imprintNumber = isFlat
    ? Number.parseInt(hero.imprintNumber, 10)
    : Utils.round100ths(Number.parseFloat(hero.imprintNumber) / 100);
  const imprintMatch = Object.entries(data.self_devotion.grades).filter(
    (x) =>
      (isFlat ? Number.parseInt(x[1], 10) : Utils.round100ths(x[1])) ===
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

function debouncedRecalculate() {
  clearTimeout(recalcDebounceTimer);
  recalcDebounceTimer = setTimeout(recalculateFilters, 150);
}

function _showStaleResultsBanner(msg) {
  const el = document.getElementById('staleResultsBanner');
  if (el) {
    el.textContent = msg;
    el.style.display = '';
  }
}
function _clearStaleResultsBanner() {
  const el = document.getElementById('staleResultsBanner');
  if (el) {
    el.style.display = 'none';
  }
}

function invalidateItemsCache() {
  _cachedItems = null;
  _cachedHeroes = null;
  // Evict stale item-score cache entries (e.g. old mod UUIDs after hero change).
  PriorityFilter.clearScoreCache();
  // Warn if results on screen are now based on a different gear state.
  const resultNum = parseInt(
    ($('#resultsFoundNum').text() || '').replace(/,/g, ''),
    10,
  );
  if (resultNum > 0) {
    _showStaleResultsBanner('⚠ Gear changed — results may be outdated');
  }
}

async function getAllItemsCached() {
  if (!_cachedItems) {
    // Store the Promise (not the result) so concurrent calls before the first
    // resolves all share the same in-flight request rather than spawning duplicates.
    // Reset on rejection so the next caller retries rather than re-receiving a stale
    // rejected Promise.
    _cachedItems = Api.getAllItems().catch((err) => {
      _cachedItems = null;
      throw err;
    });
  }
  return _cachedItems;
}

async function getAllHeroesCached() {
  if (!_cachedHeroes) {
    _cachedHeroes = Api.getAllHeroes().catch((err) => {
      _cachedHeroes = null;
      throw err;
    });
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

let _recalcGeneration = 0;

async function recalculateFilters(e, heroResponseArg) {
  // Selects fire twice, we should only calculate once.
  // Use classList.contains to avoid SVGAnimatedString (className on SVG elements has no .includes).
  if (e?.target.classList?.contains('offscreen')) {
    return;
  }

  const heroId = document.getElementById('inputHeroAdd').value;
  if (!heroId || heroId.length === 0) {
    return;
  }

  let params;
  try {
    params = OptimizerTab.getOptimizationRequestParams();
  } catch {
    return;
  }

  // Stale-run guard: rapid filter edits (slider drags, auto-repeat steps) can launch several
  // recalculateFilters() calls whose awaits resolve out of order. Capture a generation token
  // here, after the synchronous early-returns; once the awaits below resolve, bail if a newer
  // call has superseded this one, so an older run can't overwrite the newer DOM counts.
  const _myGen = ++_recalcGeneration;

  let heroResponse = heroResponseArg;

  if (!heroResponse) {
    heroResponse = await Api.getHeroById(
      heroId,
      $('#inputPredictReforges').prop('checked'),
    );
  }

  const allItemsResponse = await getAllItemsCached();

  let filterResult;
  try {
    filterResult = await OptimizerTab.applyItemFilters(
      params,
      heroResponse,
      allItemsResponse,
      false,
    );
  } catch (err) {
    Log.error('[recalculateFilters] applyItemFilters failed:', err);
    return;
  }
  const { items, allItems, preModCount, postModCount, postModSlotCounts } =
    filterResult;

  // A newer recalculateFilters() started while we were awaiting — drop this stale result
  // rather than clobbering the newer counts/heatmaps already (or about to be) on screen.
  if (_myGen !== _recalcGeneration) return;

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

  // Use post-mod pool counts as denominator for Filter/Search details
  // so it shows "passed priority / total modded filtered pool" per slot.
  // Use ?? not || so a legitimate count of 0 isn't replaced by allXxx.length.
  const poolWeapons = postModSlotCounts?.Weapon ?? allWeapons.length;
  const poolHelmets = postModSlotCounts?.Helmet ?? allHelmets.length;
  const poolArmors = postModSlotCounts?.Armor ?? allArmors.length;
  const poolNecklaces = postModSlotCounts?.Necklace ?? allNecklaces.length;
  const poolRings = postModSlotCounts?.Ring ?? allRings.length;
  const poolBoots = postModSlotCounts?.Boots ?? allBoots.length;

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
    (weapons.length / (poolWeapons || 1)) * 100,
  );
  const helmetsPercent = Math.round(
    (helmets.length / (poolHelmets || 1)) * 100,
  );
  const armorsPercent = Math.round((armors.length / (poolArmors || 1)) * 100);
  const necklacesPercent = Math.round(
    (necklaces.length / (poolNecklaces || 1)) * 100,
  );
  const ringsPercent = Math.round((rings.length / (poolRings || 1)) * 100);
  const bootsPercent = Math.round((boots.length / (poolBoots || 1)) * 100);

  $('#maxPermutationsNum').text(Number(permutations).toLocaleString());

  const comboEl = document.getElementById('slotFilterEstCombo');
  if (comboEl) {
    const fmtCombo = formatCompactNumber(permutations);
    const targetM =
      Number.parseFloat(
        document.getElementById('slotFilterAutoTarget')?.value,
      ) || 3;
    const targetNum = targetM * 1_000_000;
    comboEl.textContent = `Est: ${fmtCombo} combos`;
    let comboClass;
    if (permutations <= targetNum) {
      comboClass = ' combo-ok';
    } else if (permutations <= targetNum * 3) {
      comboClass = ' combo-warn';
    } else {
      comboClass = ' combo-high';
    }
    comboEl.className = 'slot-filter-est-combo' + comboClass;
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
    `${Number(weapons.length).toLocaleString()} / ${Number(poolWeapons).toLocaleString()} - (${weaponsPercent}%)`,
  );
  $('#filteredHelmetsNum').text(
    `${Number(helmets.length).toLocaleString()} / ${Number(poolHelmets).toLocaleString()} - (${helmetsPercent}%)`,
  );
  $('#filteredArmorsNum').text(
    `${Number(armors.length).toLocaleString()} / ${Number(poolArmors).toLocaleString()} - (${armorsPercent}%)`,
  );
  $('#filteredNecklacesNum').text(
    `${Number(necklaces.length).toLocaleString()} / ${Number(poolNecklaces).toLocaleString()} - (${necklacesPercent}%)`,
  );
  $('#filteredRingsNum').text(
    `${Number(rings.length).toLocaleString()} / ${Number(poolRings).toLocaleString()} - (${ringsPercent}%)`,
  );
  $('#filteredBootsNum').text(
    `${Number(boots.length).toLocaleString()} / ${Number(poolBoots).toLocaleString()} - (${bootsPercent}%)`,
  );

  // Per-slot slider heatmap: show "all → filtered" counts next to each slider
  function setSliderHeatmap(id, filtered, total) {
    const el = document.getElementById(id);
    if (!el) return;
    const pct = total > 0 ? Math.round((filtered / total) * 100) : 100;
    let heatmapClass;
    if (pct >= 66) {
      heatmapClass = ' heatmap-high';
    } else if (pct >= 33) {
      heatmapClass = ' heatmap-mid';
    } else {
      heatmapClass = ' heatmap-low';
    }
    el.className = 'slider-heatmap' + heatmapClass;
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

// Slot order must match OptimizerGrid.getSelectedGearIds() → [Weapon,Helmet,Armor,Necklace,Ring,Boots]
const _GEAR_CHECKBOX_MAP = [
  { checkbox: '#optimizerGridWeapon', idx: 0 },
  { checkbox: '#optimizerGridHelmet', idx: 1 },
  { checkbox: '#optimizerGridArmor', idx: 2 },
  { checkbox: '#optimizerGridNecklace', idx: 3 },
  { checkbox: '#optimizerGridRing', idx: 4 },
  { checkbox: '#optimizerGridBoots', idx: 5 },
];

function filterSelectedGearByCheckbox(selectedGear) {
  return _GEAR_CHECKBOX_MAP
    .filter(({ checkbox }) => $(checkbox).prop('checked'))
    .map(({ idx }) => selectedGear[idx])
    .filter((x) => !!x);
}

// ---------------------------------------------------------------------------
// Set-combo display helper — shared by copyBuildToClipboard + openCompareModal
// ---------------------------------------------------------------------------
// Canonical set metadata lives in rollDivisors.js (single source of truth);
// these are local aliases so the usages below read unchanged.
const _SETS_PIECES_BY_IDX = SET_PIECES_BY_INDEX;
const _SETS_BY_IDX = SETS_BY_INDEX;
const _SETS_FOUR_PIECE = FOUR_PIECE_SETS;

function setsDisplayText(row) {
  const arr = [];
  if (row?.sets) {
    for (let i = 0; i < row.sets.length; i++) {
      const count = Math.floor(
        (row.sets[i] || 0) / (_SETS_PIECES_BY_IDX[i] || 1),
      );
      // G7: _SETS_BY_IDX may be shorter than _SETS_PIECES_BY_IDX if a new set
      // is added to the piece-count array before a name is added here.
      const setName = _SETS_BY_IDX[i];
      for (let j = 0; j < count; j++) if (setName) arr.push(setName);
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
  const heroName = currentHeroResponse?.hero
    ? i18next.t(currentHeroResponse.hero.name) || currentHeroResponse.hero.name
    : document.getElementById('inputHeroAdd').value || 'Unknown';

  // Stats line
  const statsLine = `ATK ${row.atk}  DEF ${row.def}  HP ${row.hp}  SPD ${row.spd}  CR ${row.cr}  CD ${row.cd}  EFF ${row.eff}  RES ${row.res}  GS ${row.score}`;

  // Gear piece lines
  const STAT_LABEL = {
    flatatk: 'ATK',
    flathp: 'HP',
    flatdef: 'DEF',
    atk: 'ATK%',
    hp: 'HP%',
    def: 'DEF%',
    cr: 'CR',
    cd: 'CD',
    eff: 'EFF',
    res: 'RES',
    spd: 'SPD',
  };
  const SLOT_PAD = {
    Weapon: 'Weapon  ',
    Helmet: 'Helmet  ',
    Armor: 'Armor   ',
    Necklace: 'Necklace',
    Ring: 'Ring    ',
    Boots: 'Boots   ',
  };

  let gearLines = '';
  const gearIds = OptimizerGrid.getSelectedGearIds();
  if (gearIds?.some(Boolean)) {
    try {
      const response = await Api.getItemsByIds(gearIds);
      gearLines =
        '\n' +
        (response.items || [])
          .map((item) => {
            if (!item) return null;
            const slotLabel =
              SLOT_PAD[item.gear] || (item.gear || '').padEnd(8);
            const setLabel = (item.set || '').replace('Set', '').padEnd(12);
            const enhance = `+${item.enhance}`.padEnd(3);
            const mainLabel = STAT_LABEL[item.main.type] || item.main.type;
            const mainStr = `${mainLabel} ${item.main.value}`.padEnd(10);
            const subStr = (item.substats || [])
              .map((s) => `${STAT_LABEL[s.type] || s.type}+${s.value}`)
              .join('  ');
            return `${slotLabel}  ${enhance} (${setLabel}):  ${mainStr}  ${subStr}`;
          })
          .filter(Boolean)
          .join('\n');
    } catch (e) {
      Log.error('copyBuildToClipboard: failed to fetch gear', e);
    }
  }

  const text = `${heroName}\nSets: ${setsDisplayText(row)}\n${statsLine}${gearLines}`;
  try {
    await navigator.clipboard.writeText(text.trim());
    Notifier.quick('Build copied to clipboard');
  } catch (e) {
    Log.error('copyBuildToClipboard: clipboard write failed', e);
  }
}

/** Pins the currently selected result row so it can be compared against a second row. */
function pinCurrentBuildRow() {
  const row = OptimizerGrid.getSelectedRow();
  if (!row) {
    Dialog.info('Select a result row first, then click Pin.');
    return;
  }
  // Snapshot the row so a later grid refresh/re-sort can't mutate the pinned build
  // out from under the Compare modal.
  _pinnedBuildRow = { ...row };
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
    Dialog.info(
      'Pin a build first (select a row, then click Pin), then select another row and click Compare.',
    );
    return;
  }
  if (!rowB) {
    Dialog.info(
      'Select a second result row to compare against the pinned build.',
    );
    return;
  }
  const _buildKey = (r) =>
    `${r.atk}:${r.def}:${r.hp}:${r.spd}:${r.cr}:${r.cd}:${r.eff}:${r.res}:${r.score}`;
  if (
    rowA === rowB ||
    (rowA.id != null && rowA.id === rowB.id) ||
    _buildKey(rowA) === _buildKey(rowB)
  ) {
    Dialog.info(
      'The pinned build and the selected build are the same row. Select a different row.',
    );
    return;
  }

  const STAT_FIELDS = [
    { section: 'Core Stats' },
    { key: 'sets', label: 'Sets', text: true },
    { key: 'atk', label: 'ATK' },
    { key: 'def', label: 'DEF' },
    { key: 'hp', label: 'HP' },
    { key: 'spd', label: 'SPD' },
    { key: 'cr', label: 'CR' },
    { key: 'cd', label: 'CD' },
    { key: 'eff', label: 'EFF' },
    { key: 'res', label: 'RES' },
    { section: 'Scores' },
    { key: 'score', label: 'GS' },
    { key: 'bs', label: 'BS' },
    { key: 'cp', label: 'CP' },
    { section: 'Survivability' },
    { key: 'ehp', label: 'EHP' },
    { key: 'ehpps', label: 'EHP/s' },
    { key: 'hpps', label: 'HP/s' },
    { section: 'Damage' },
    { key: 'dmg', label: 'DMG' },
    { key: 'dmgps', label: 'DMG/s' },
    { key: 'mcdmg', label: 'MCD' },
    { key: 'mcdmgps', label: 'MCD/s' },
    { key: 's1', label: 'S1', skipZero: true },
    { key: 's2', label: 'S2', skipZero: true },
    { key: 's3', label: 'S3', skipZero: true },
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
    if (f.skipZero && a === 0 && b === 0) return '';
    const delta = Math.round(b - a);
    let deltaStr;
    if (delta === 0) {
      deltaStr = '=';
    } else if (delta > 0) {
      deltaStr = `+${delta.toLocaleString()}`;
    } else {
      deltaStr = delta.toLocaleString();
    }
    let cls;
    if (delta === 0) {
      cls = 'cmp-same';
    } else if (delta > 0) {
      cls = 'cmp-up';
    } else {
      cls = 'cmp-down';
    }
    return `<tr>
            <td class="cmp-label">${f.label}</td>
            <td class="cmp-a">${Math.round(a).toLocaleString()}</td>
            <td class="cmp-b ${cls}">${Math.round(b).toLocaleString()}</td>
            <td class="cmp-delta ${cls}">${deltaStr}</td>
        </tr>`;
  }).join('');

  const heroName = currentHeroResponse?.hero
    ? i18next.t(currentHeroResponse.hero.name) || currentHeroResponse.hero.name
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

  Log.debug('ADD BUILD', row);

  if (row.mods?.some(Boolean)) {
    let modGradeLabel = '';
    if (hero.modGrade === 'greater') {
      modGradeLabel = 'Greater';
    } else if (hero.modGrade) {
      modGradeLabel = 'Lesser';
    }
    row.name = `MOD: ${modGradeLabel} ${hero.rollQuality || '0'}%`;
  }

  await Api.addBuild(heroId, row);
  await Api.editResultRows(
    Number.parseInt(rowId, 10),
    'star',
    currentExecutionId,
  );

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

  Log.debug('REMOVE BUILD', row);

  await Api.removeBuild(heroId, row);
  await Api.editResultRows(
    Number.parseInt(rowId, 10),
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

  let modGradeLabel = '';
  if (hero.modGrade) {
    modGradeLabel = hero.modGrade === 'greater' ? 'Greater' : 'Lesser';
  }
  const modName = `MOD: ${modGradeLabel} ${hero.rollQuality || '0'}%`;

  let savedCount = 0;
  for (const node of nodes) {
    const row = node.data;
    if (!row) continue;
    const items = row.items;
    if (
      !items ||
      items.length < 6 ||
      items.includes(null) ||
      items.includes(undefined)
    )
      continue;

    if (row.mods?.some((x) => x)) {
      row.name = modName;
    }

    await Api.addBuild(heroId, row);
    await Api.editResultRows(
      Number.parseInt(row.id, 10),
      'star',
      currentExecutionId,
    );

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

  if (row.mods?.some(Boolean)) {
    let modGradeLabel = '';
    if (hero.modGrade === 'greater') {
      modGradeLabel = 'Greater';
    } else if (hero.modGrade) {
      modGradeLabel = 'Lesser';
    }
    row.name = `MOD: ${modGradeLabel} ${hero.rollQuality || '0'}%`;
  }

  await Api.addBuild(heroId, row);
  await Api.editResultRows(
    Number.parseInt(rowId, 10),
    'star',
    currentExecutionId,
  );

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
    if (!response?.heroStats || response.heroStats.length === 0) return;

    let cache;
    try {
      cache = JSON.parse(localStorage.getItem(RESULTS_CACHE_KEY) || '{}');
    } catch (e) {
      Log.warn('e7opt: could not parse results cache', e);
      cache = {};
    }
    if (!cache[heroId]) cache[heroId] = [];
    cache[heroId].unshift({
      ts: Date.now(),
      maximum: response.maximum,
      rows: response.heroStats,
    });
    if (cache[heroId].length > RESULTS_CACHE_MAX_PER_HERO) {
      cache[heroId].length = RESULTS_CACHE_MAX_PER_HERO;
    }
    try {
      localStorage.setItem(RESULTS_CACHE_KEY, JSON.stringify(cache));
    } catch (quotaErr) {
      // Storage full — evict the globally-oldest cached run (by timestamp) one at a
      // time and retry, until the new set fits or nothing is left.  Never silent:
      // each eviction is logged so a shrinking cache is visible, not mysterious.
      Log.warn(
        'e7opt: localStorage quota exceeded, evicting oldest cached runs',
        quotaErr,
      );
      let evicted = 0;
      let saved = false;
      for (let attempt = 0; attempt < 1000; attempt += 1) {
        let oldestHero = null;
        let oldestTs = Infinity;
        Object.keys(cache).forEach((k) => {
          const arr = cache[k];
          if (!arr || !arr.length) return;
          const last = arr[arr.length - 1];
          const ts = last && last.ts ? last.ts : 0;
          if (ts < oldestTs) {
            oldestTs = ts;
            oldestHero = k;
          }
        });
        if (oldestHero === null) break; // nothing left to drop
        cache[oldestHero].pop();
        if (cache[oldestHero].length === 0) delete cache[oldestHero];
        evicted += 1;
        try {
          localStorage.setItem(RESULTS_CACHE_KEY, JSON.stringify(cache));
          saved = true;
          break;
        } catch {
          // still too big — keep evicting
        }
      }
      if (saved) {
        Log.warn(
          `e7opt: evicted ${evicted} oldest cached run(s) to fit the new results`,
        );
      } else {
        Log.warn(
          'e7opt: could not persist results — localStorage full even after eviction',
        );
      }
    }
  } catch (e) {
    Log.warn('e7opt: saveHeroResults failed', e);
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
    Log.warn('e7opt: loadHeroResultsFromCache failed', e);
    return null;
  }
}

// Attach the hero + resolved artifact stats onto a filter params object (shared by
// the normal Filter and the Quick/scratch Filter).
// Compute and attach artifact stat bonuses onto a hero object (0 when the hero has no
// artifact or no artifact level). Shared by the filter path (_attachHeroAndArtifact, on a
// freshly fetched hero) and submitOptimizationRequest (on the in-scope hero); these
// previously duplicated this body, differing only in += vs = after the zero-init (which are
// equivalent from zero — so this canonical = form preserves behavior for both).
function _attachArtifactStats(hero) {
  hero.artifactAttack = 0;
  hero.artifactHealth = 0;
  hero.artifactDefense = 0;
  if (hero.artifactName && hero.artifactName !== 'None') {
    const artifactLevelText = hero.artifactLevel;
    if (artifactLevelText !== 'None') {
      const artifactLevel = Number.parseInt(artifactLevelText, 10);
      const artifactStats = Artifact.getStats(hero.artifactName, artifactLevel);
      hero.artifactHealth = artifactStats.health;
      hero.artifactAttack = artifactStats.attack;
      hero.artifactDefense = artifactStats.defense;
    }
  }
}

async function _attachHeroAndArtifact(params) {
  const heroId = document.getElementById('inputHeroAdd').value;
  const heroResponse = await Api.getHeroById(
    heroId,
    $('#inputPredictReforges').prop('checked'),
  );
  params.hero = heroResponse.hero;
  _attachArtifactStats(params.hero);
}

// Java filters by integer priority values; round before sending.
function _roundFilterPriorities(request) {
  [
    'inputAtkPriority',
    'inputHpPriority',
    'inputDefPriority',
    'inputSpdPriority',
    'inputCrPriority',
    'inputCdPriority',
    'inputEffPriority',
    'inputResPriority',
  ].forEach((k) => {
    if (request[k] != null) request[k] = Math.round(request[k]);
  });
}

async function submitOptimizationFilterRequest() {
  const params = OptimizerTab.getOptimizationRequestParams();
  getSetFormat(params.inputSets, true);
  if (OptimizerTab.warnParams(params)) {
    return;
  }

  await _attachHeroAndArtifact(params);

  OptimizerGrid.showLoadingOverlay();
  params.executionId = currentExecutionId;

  const _filterRequest = Object.assign({}, params);
  _roundFilterPriorities(_filterRequest);

  Api.submitOptimizationFilterRequest(_filterRequest)
    .then((response) => {
      Log.debug('Optimization filter response', response);
      OptimizerGrid.reloadData();
      return response;
    })
    .catch(Log.error);
}

// Quick/scratch filter: re-filter the displayed result set with ad-hoc stat-limit
// overrides, WITHOUT persisting onto the hero (noSave) — the user's saved Stat
// filters and priority weights are left untouched.  `overrides` is a map of
// request fields (e.g. inputAtkMinLimit) → value|null.
async function submitScratchFilterRequest(overrides) {
  const params = OptimizerTab.getOptimizationRequestParams();
  getSetFormat(params.inputSets, true);
  if (OptimizerTab.warnParams(params)) {
    return;
  }

  await _attachHeroAndArtifact(params);

  OptimizerGrid.showLoadingOverlay();
  params.executionId = currentExecutionId;

  const _filterRequest = Object.assign({}, params, overrides, { noSave: true });
  _roundFilterPriorities(_filterRequest);

  Api.submitOptimizationFilterRequest(_filterRequest)
    .then((response) => {
      OptimizerGrid.reloadData();
      return response;
    })
    .catch(Log.error);
}

function _buildRequestFingerprint(mergedRequest, items) {
  // Use only base (non-mod-variant) item IDs for fingerprinting.
  // Mod variant modIds are UUIDs regenerated on LRU eviction — using them
  // would cause identical runs to always miss the dedup check.
  const sortedItemIds = items
    .filter((i) => !i.upgradeable)
    .map((i) => i.id)
    .sort();
  return JSON.stringify(mergedRequest, (key, val) => {
    if (key === 'executionId') return undefined; // changes every run
    if (key === 'items') return sortedItemIds; // replace with canonical sorted IDs
    if (key === 'equippedItems') return undefined; // hero's current gear doesn't affect optimization params
    return val;
  });
}

// Synchronous double-submit guard. The backend getOptimizationInProgress() check below is
// awaited, so two rapid clicks can both pass it before either has registered a run on the
// backend (the gap spans getAllItems + getHeroById + applyItemFilters + prepareExecution).
// This JS-level flag is set before any await and cleared in finally — which covers every one
// of the inner function's early returns, so it can't wedge. The backend check + the #17
// re-run fingerprint remain the backstop once a run is actually dispatched.
let _submitInFlight = false;

async function submitOptimizationRequest() {
  if (_submitInFlight) {
    Notifier.warn('A search is already being prepared — please wait a moment.');
    return;
  }
  _submitInFlight = true;
  try {
    await _runOptimizationRequest();
  } finally {
    _submitInFlight = false;
  }
}

async function _runOptimizationRequest() {
  recalculateFilters();

  const inProgressResponse = await Api.getOptimizationInProgress();
  if (inProgressResponse.inProgress) {
    Notifier.warn(
      'Optimization already in progress. Please cancel before starting a new search.',
    );
    return;
  }

  const params = OptimizerTab.getOptimizationRequestParams(true);
  const heroId = document.getElementById('inputHeroAdd').value;
  Log.debug(
    '[submitOptimizationRequest] START heroId:',
    heroId,
    'filters:',
    {
      cr: params.inputCrMinLimit,
      cd: params.inputCdMinLimit,
      spd: params.inputSpdMinLimit,
      hp: params.inputHpMinLimit,
      minPriority: params.inputMinPriorityLimit,
      sets: params.inputSets,
      setFormat: params.setFormat,
    },
    'priorities:',
    {
      atk: params.inputAtkPriority,
      hp: params.inputHpPriority,
      def: params.inputDefPriority,
      spd: params.inputSpdPriority,
      cr: params.inputCrPriority,
      cd: params.inputCdPriority,
    },
  );

  const allItemsResponse = await Api.getAllItems();
  const heroResponse = await Api.getHeroById(
    heroId,
    $('#inputPredictReforges').prop('checked'),
  );
  const { hero } = heroResponse;
  const { baseStats } = heroResponse;
  Log.debug(
    '[submitOptimizationRequest] hero:',
    hero?.name,
    'baseStats:',
    baseStats,
  );

  // Validate stat limits / targets up front: an inverted min>max LIMIT yields zero
  // results, so block; an out-of-order target trio only no-ops that stat's sweet
  // spot, so warn but proceed.
  const _tv = validateTargets('');
  if (_tv.blocking) {
    Notifier.warn(_tv.blocking);
    return;
  }
  if (_tv.warning) {
    Notifier.warn(_tv.warning);
  }

  let filterResult;
  try {
    filterResult = await OptimizerTab.applyItemFilters(
      params,
      heroResponse,
      allItemsResponse,
      true,
    );
  } catch (e) {
    // Dialog.error() was already shown to the user before the throw — just stop here
    Log.warn(
      '[submitOptimizationRequest] aborted by validation:',
      e.message,
    );
    return;
  }
  const { items } = filterResult;
  Log.debug(
    '[submitOptimizationRequest] items after applyItemFilters:',
    items?.length,
    'by slot:',
    items
      ? Object.entries(
          items.reduce((acc, i) => {
            acc[i.gear] = (acc[i.gear] || 0) + 1;
            return acc;
          }, {}),
        )
          .map(([k, v]) => `${k}:${v}`)
          .join(' ')
      : 'N/A',
  );

  Log.debug('OPTIMIZING HERO', hero);
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

  _attachArtifactStats(request.hero);

  if (!hero.artifactName || hero.artifactName === 'None') {
    Notifier.warn(
      "Your hero does not have an artifact equipped, use the 'Add Bonus Stats' button on the Heroes page to add artifact stats",
    );
  }

  if (OptimizerTab.warnParams(params)) {
    return;
  }

  const mergedRequest = Object.assign(request, params, baseStats);

  // ── #17 Dedup identical re-runs ────────────────────────────────────────────
  const _runFp = _buildRequestFingerprint(mergedRequest, items);
  if (_lastRunFingerprints.get(heroId) === _runFp) {
    Notifier.info(
      'Results are current — nothing has changed since the last run.',
    );
    return;
  }
  // ──────────────────────────────────────────────────────────────────────────

  Log.debug('Sending request:', mergedRequest);
  OptimizerGrid.showLoadingOverlay();
  if (progressTimer) {
    clearInterval(progressTimer);
  }
  lastPartialGridReload = 0;

  // Switch grid to live-backend mode before the new execution starts
  OptimizerGrid.clearRestoredSource();
  await Api.deleteExecution(currentExecutionId);
  currentExecutionId = await Api.prepareExecution();
  mergedRequest.executionId = currentExecutionId;
  // Start polling only after the new executionId is assigned, so updateProgress() never
  // queries the previous / just-deleted execution.
  progressTimer = setInterval(updateProgress, 200);
  Log.debug(
    '[submitOptimizationRequest] executionId assigned:',
    currentExecutionId,
    'itemCount:',
    mergedRequest.items?.length,
    'hero:',
    mergedRequest.hero?.name,
  );

  // Fresh run — clear any cancel state and leave any prior restored (quick-cancel
  // / cached) snapshot so the grid streams live backend results.
  _cancelMode = null;
  OptimizerGrid.clearRestoredSource();
  // Immediately initialize the datasource so refreshInfiniteCache() calls
  // in updateProgress() will find an active datasource and start streaming
  // results as soon as the backend produces them (no 2-second delay).
  OptimizerGrid.reloadData();

  // Java StatCalculator declares priority weights as int — round decimal priority
  // values before sending.  JS-side calculations already ran with full float precision.
  const _javaRequest = Object.assign({}, mergedRequest);
  [
    'inputAtkPriority',
    'inputHpPriority',
    'inputDefPriority',
    'inputSpdPriority',
    'inputCrPriority',
    'inputCdPriority',
    'inputEffPriority',
    'inputResPriority',
  ].forEach((k) => {
    if (_javaRequest[k] != null) _javaRequest[k] = Math.round(_javaRequest[k]);
  });

  Api.submitOptimizationRequest(_javaRequest)
    .then((result) => {
      Log.debug(
        '[submitOptimizationRequest] RESPONSE RECEIVED',
        'searched:',
        result?.searched,
        'results:',
        result?.results,
        'executionId:',
        currentExecutionId,
      );
      if (result?.results === 0) {
        Log.error(
          '[submitOptimizationRequest] 0 results — check Java logs for why no builds passed filters',
        );
      }
      if (progressTimer) {
        clearInterval(progressTimer);
      }

      const searchedCount = result.searched;
      const resultsCounter = result.results;

      const searchedStr = Number(searchedCount).toLocaleString();
      const resultsStr = Number(resultsCounter).toLocaleString();

      const maxResults = Number.parseInt(
        Settings.parseNumberValue('settingMaxResults') || 0,
        10,
      );
      if (_cancelMode !== null) {
        // Cancelled — the cancel handler already messaged the user; no dialogs.
        $('#maxPermutationsNum').text(searchedStr);
      } else if (result.keptBestN) {
        // Scanned the whole space — show the best kept-N (its own cap), no error.
        $('#maxPermutationsNum').text(searchedStr);
        Dialog.info(
          `Scanned all permutations — showing the best ${resultsStr} builds by priority. Filter/Quick-Filter to narrow further.`,
        );
      } else if (result.results >= maxResults) {
        Dialog.info(
          'Search terminated after the result limit was exceeded, the full results are not shown. Please apply more filters to narrow your search.',
        );
      } else {
        $('#maxPermutationsNum').text(searchedStr);
      }

      $('#searchedPermutationsNum').text(searchedStr);
      $('#resultsFoundNum').text(resultsStr);
      updateOptimizerTabLabel(resultsStr);
      _clearStaleResultsBanner();
      // Quick Cancel keeps its instant 500-row snapshot; every other path (normal
      // completion, or Cancel = show all) serves the full finalized set.
      if (_cancelMode !== 'quick') {
        OptimizerGrid.clearRestoredSource();
        OptimizerGrid.reloadData();
      }
      Log.debug('REFRESHED');
      // Persist first 500 rows for this hero so results survive
      // hero switches and app restarts.
      const savedHeroId = document.getElementById('inputHeroAdd').value;
      const savedExecId = currentExecutionId;
      saveHeroResults(savedHeroId, savedExecId, result.results);
      _lastRunFingerprints.set(savedHeroId, _runFp);
      return null;
    })
    .catch((err) => {
      // On a backend rejection the .then() above never runs, so the progress timer and the
      // loading overlay would otherwise be left running forever. Always tear them down and
      // restore the grid to a usable state, and tell the user instead of failing silently.
      Log.error('[submitOptimizationRequest] failed', err);
      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }
      OptimizerGrid.clearRestoredSource();
      OptimizerGrid.reloadData();
      Notifier.error(
        'Optimization failed — see the console/Java logs. Please try again.',
      );
    });
}

async function updateProgress() {
  const result = await Api.getOptimizationProgress();
  const searchedCount = result.searched;
  const resultsCounter = result.results;
  Log.debug(
    '[updateProgress] searched:',
    searchedCount,
    'results:',
    resultsCounter,
    'executionId:',
    currentExecutionId,
  );

  const searchedStr = Number(searchedCount).toLocaleString();
  const resultsStr = Number(resultsCounter).toLocaleString();

  $('#searchedPermutationsNum').text(searchedStr);
  $('#resultsFoundNum').text(resultsStr);
  updateOptimizerTabLabel(resultsStr);

  // Progressively show partial results during the run. A fast (GPU) run answers
  // getResultRows almost instantly, but a CPU run full-sorts the up-to-2M live heap on
  // every fetch (multi-second) while all cores are busy — far slower than any purge
  // cadence, so the old purge-refresh grid stayed perpetually blank on CPU. Instead pull a
  // top-N snapshot (getBestSoFar) and serve it from memory via the restored-source path:
  // the prior snapshot stays visible while the next loads (no purge-blank), and the
  // in-flight guard self-paces it to however fast the backend can actually produce one.
  const now = Date.now();
  if (
    !_liveSnapshotInFlight &&
    progressTimer &&
    now - lastPartialGridReload >= 1000
  ) {
    lastPartialGridReload = now;
    _liveSnapshotInFlight = true;
    const snapExecId = currentExecutionId;
    Api.getBestSoFar(snapExecId)
      .then((response) => {
        // Drop a stale snapshot if the run ended or a new run started meanwhile.
        if (
          progressTimer &&
          snapExecId === currentExecutionId &&
          response &&
          response.maximum > 0 &&
          response.heroStats?.length
        ) {
          if (OptimizerGrid.isRestoredMode()) {
            OptimizerGrid.updateRestoredSnapshot(
              response.heroStats,
              response.maximum,
            );
          } else {
            OptimizerGrid.setRestoredSource(
              response.heroStats,
              response.maximum,
            );
          }
        }
        return null;
      })
      .catch(() => {})
      .finally(() => {
        _liveSnapshotInFlight = false;
      });
  }
}

async function drawPreview() {
  const selectedGear = OptimizerGrid.getSelectedGearIds();
  const selectedMods = OptimizerGrid.getSelectedGearMods();
  OptimizerTab.drawPreview(selectedGear, selectedMods);
}

// Short stat labels for the mod checklist (kept local so the checklist has no
// cross-module coupling to htmlGenerator's internal shortenStats).
const _MOD_CHK_STAT_LABEL = {
  Attack: 'Atk',
  AttackPercent: 'Atk%',
  Health: 'HP',
  HealthPercent: 'HP%',
  Defense: 'Def',
  DefensePercent: 'Def%',
  Speed: 'Spd',
  CriticalHitChancePercent: 'CRate',
  CriticalHitDamagePercent: 'CDmg',
  EffectivenessPercent: 'Eff',
  EffectResistancePercent: 'Res',
};
const _modChkIsPercent = (t) => typeof t === 'string' && t.endsWith('Percent');
const _modChkLabel = (t) => _MOD_CHK_STAT_LABEL[t] || t || '?';

/**
 * Renders the actionable "mods this build needs" checklist into
 * #optimizerModChecklist.  Since substat mods are PERMANENT in-game, the user
 * needs to know up-front exactly which pieces to mod (slot, original→new, value),
 * how many mods the build costs vs their maxModPieces budget, and the RNG range
 * the in-game roll lands in.  Empty (no mods) ⇒ the container clears and hides.
 *
 *   mods       per-slot mod descriptors (null where no mod), in W/H/A/N/R/B order
 *   moddedGear materialized modded items (for source-roll counts + reforge state)
 *   hero       supplies the maxModPieces budget and the mod grade for the range
 */
function renderModChecklist(mods, moddedGear, hero) {
  const el = document.getElementById('optimizerModChecklist');
  if (!el) return;

  const SLOT_NAMES = ['Weapon', 'Helmet', 'Armor', 'Necklace', 'Ring', 'Boots'];
  const entries = [];
  for (let i = 0; i < 6; i += 1) {
    const m = mods && mods[i];
    if (!m) continue;
    entries.push({
      slot: SLOT_NAMES[i],
      mod: m,
      item: moddedGear && moddedGear[i],
    });
  }

  if (entries.length === 0) {
    el.innerHTML = '';
    return;
  }

  const budget =
    typeof hero?.maxModPieces === 'number' &&
    hero.maxModPieces >= 1 &&
    hero.maxModPieces <= 6
      ? hero.maxModPieces
      : null;
  const atCap = budget != null && entries.length >= budget;
  const grade = hero?.modGrade || 'greater';

  // Predicted-value range the in-game roll falls within, from the same modValues
  // table the optimizer used.  reforge branch mirrors enumerateModCandidates
  // (reforged for lvl-85 reforgeable or lvl-90 gear).  Defensive: any miss ⇒ no range.
  const rangeStr = (mod, item) => {
    try {
      if (!item || typeof Constants === 'undefined' || !Constants.modValues)
        return '';
      const reforgeType =
        item.level === 85 || item.level === 90 ? 'reforged' : 'unreforged';
      const sub = item.substats && item.substats[mod.index];
      const rollIndex = sub && sub.rolls ? sub.rolls - 1 : 0;
      const r =
        Constants.modValues[reforgeType] &&
        Constants.modValues[reforgeType][grade] &&
        Constants.modValues[reforgeType][grade][mod.type] &&
        Constants.modValues[reforgeType][grade][mod.type][rollIndex];
      if (!r) return '';
      const u = _modChkIsPercent(mod.type) ? '%' : '';
      return ` <span class="modChkRange">(${r[0]}${u}–${r[1]}${u})</span>`;
    } catch {
      return '';
    }
  };

  const rows = entries
    .map(({ slot, mod, item }) => {
      const u = _modChkIsPercent(mod.type) ? '%' : '';
      return (
        `<div class="modChkRow">` +
        `<span class="modChkSlot">${i18next.t(slot)}</span>` +
        `<span class="modChkFrom">${_modChkLabel(mod.originalType)}</span>` +
        `<span class="modChkArrow">→</span>` +
        `<span class="modChkTo">${_modChkLabel(mod.type)} +${mod.value}${u}</span>` +
        `${rangeStr(mod, item)}</div>`
      );
    })
    .join('');

  const budgetHtml =
    budget != null
      ? `<span class="modChkBudget${atCap ? ' modChkAtCap' : ''}">${entries.length} / ${budget}</span>`
      : `<span class="modChkBudget">${entries.length}</span>`;

  el.innerHTML =
    `<div class="modChkHeader">⚠ ${i18next.t('This build needs')} ${budgetHtml} ${i18next.t('permanent mod(s)')}</div>` +
    `<div class="modChkRows">${rows}</div>` +
    `<div class="modChkWarn">${i18next.t(
      'Mods are permanent & irreversible and cost in-game resources. Listed values are predictions at your roll-quality; the actual in-game roll is random within the range shown.',
    )}</div>`;
}

// Aliases for the shared canonical set membership (see rollDivisors.js).
const fourPieceSets = FOUR_PIECE_SETS;
const twoPieceSets = TWO_PIECE_SETS;

function hasFourPieceSet(set) {
  return set.some((x) => fourPieceSets.has(x));
}
function hasTwoPieceSet(set) {
  return set.some((x) => twoPieceSets.has(x));
}

// ---------------------------------------------------------------------------
// Item filter functions called by applyItemFilters
// ---------------------------------------------------------------------------

function computeSetCounts(items) {
  const counts = {};
  for (const item of items) {
    if (item.set) counts[item.set] = (counts[item.set] || 0) + 1;
  }
  return counts;
}

function computeMainStatCounts(items) {
  const slots = { Necklace: {}, Ring: {}, Boots: {} };
  const totals = { Necklace: 0, Ring: 0, Boots: 0 };
  for (const item of items) {
    if (slots[item.gear] !== undefined && item.main?.type) {
      slots[item.gear][item.main.type] =
        (slots[item.gear][item.main.type] || 0) + 1;
      totals[item.gear]++;
    }
  }
  return { slots, totals };
}

function applyBasicFilters(allItems, params, heroId) {
  let items = allItems;

  if (!params.inputAllowLockedItems) {
    items = items.filter((item) => !item.locked);
  }

  if (!params.inputAllowEquippedItems) {
    items = items.filter(
      (item) => !item.equippedById || item.equippedById === heroId,
    );
  }

  if (params.enhanceLimit?.length > 0) {
    const minEnhance = Number.parseInt(params.enhanceLimit[0], 10);
    if (!Number.isNaN(minEnhance)) {
      items = items.filter((item) => (item.enhance ?? 0) >= minEnhance);
    }
  }

  if (params.inputOnlyMaxedGear) {
    items = items.filter((item) => item.enhance === 15);
  }

  if (params.excludeFilter?.length > 0) {
    const excluded = new Set(params.excludeFilter);
    items = items.filter((item) => !excluded.has(item.gear));
  }

  return items;
}

function applySetFilter(items, params) {
  if (!params.inputExcludeSet?.length) return items;
  const excluded = new Set(params.inputExcludeSet);
  return items.filter((item) => !excluded.has(item.set));
}

// Pre-prune items whose sets can never appear in a valid build given the active set
// format and required sets — shrinks the permutation space before the backend search.
function applySetRequirementPreFilter(items, params) {
  const { setFormat, inputSets } = params;
  if (!inputSets) return items;

  const SLOTS = ['Weapon', 'Helmet', 'Armor', 'Necklace', 'Ring', 'Boots'];

  if (setFormat === 1) {
    // [4+2]: no free slots — every item must be from one of the two required sets
    const validSets = new Set([
      ...(inputSets[0] || []),
      ...(inputSets[1] || []),
    ]);
    if (validSets.size === 0) return items;
    return items.filter((item) => validSets.has(item.set));
  }

  if (setFormat === 5) {
    // [2+2+2]: no free slots — every item must be from one of the three required sets
    const validSets = new Set([
      ...(inputSets[0] || []),
      ...(inputSets[1] || []),
      ...(inputSets[2] || []),
    ]);
    if (validSets.size === 0) return items;
    return items.filter((item) => validSets.has(item.set));
  }

  if (setFormat === 2) {
    // [4][0][0]: 4-piece required + 2 free slots
    const reqSets = new Set(inputSets[0] || []);
    if (reqSets.size === 0) return items;

    const bySlot = Object.fromEntries(SLOTS.map((s) => [s, []]));
    for (const item of items) {
      if (bySlot[item.gear]) bySlot[item.gear].push(item);
    }

    // Slots with no required-set items must occupy a free position
    const forcedFreeSlots = new Set(
      SLOTS.filter((s) => !bySlot[s].some((x) => reqSets.has(x.set))),
    );
    if (forcedFreeSlots.size > 2) return []; // need 4 req-set slots but fewer than 4 exist
    if (forcedFreeSlots.size === 2) {
      // Both free positions are determined; the other 4 slots must all use required-set items
      return items.filter(
        (item) => forcedFreeSlots.has(item.gear) || reqSets.has(item.set),
      );
    }
    return items;
  }

  if (setFormat === 3) {
    // [2][0][0]: 2-piece required + 4 free slots
    const reqSets = new Set(inputSets[0] || []);
    if (reqSets.size === 0) return items;

    const bySlot = Object.fromEntries(SLOTS.map((s) => [s, []]));
    for (const item of items) {
      if (bySlot[item.gear]) bySlot[item.gear].push(item);
    }

    const slotsWithReqSet = SLOTS.filter((s) =>
      bySlot[s].some((x) => reqSets.has(x.set)),
    );
    if (slotsWithReqSet.length < 2) return []; // can't form a 2-piece
    if (slotsWithReqSet.length === 2) {
      // Only these 2 slots can supply required-set items, so both must — prune non-req items from them
      const mustUseReqSet = new Set(slotsWithReqSet);
      return items.filter(
        (item) => !mustUseReqSet.has(item.gear) || reqSets.has(item.set),
      );
    }
    return items;
  }

  if (setFormat === 4) {
    // [2][2][0]: two 2-piece required + 2 free slots
    const reqSets = new Set([...(inputSets[0] || []), ...(inputSets[1] || [])]);
    if (reqSets.size === 0) return items;

    const bySlot = Object.fromEntries(SLOTS.map((s) => [s, []]));
    for (const item of items) {
      if (bySlot[item.gear]) bySlot[item.gear].push(item);
    }

    const forcedFreeSlots = new Set(
      SLOTS.filter((s) => !bySlot[s].some((x) => reqSets.has(x.set))),
    );
    if (forcedFreeSlots.size > 2) return []; // need 4 req-set slots but fewer than 4 exist
    if (forcedFreeSlots.size === 2) {
      // Both free positions determined; the other 4 slots must use required-set items
      return items.filter(
        (item) => forcedFreeSlots.has(item.gear) || reqSets.has(item.set),
      );
    }
    return items;
  }

  return items;
}

function applyEquipLockFilters(items, params, heroId) {
  // Per-item equip locks are enforced by the backend; pass through here.
  return items;
}

function applyHeroPriorityFilter(items, params, heroes, hero, allowedHeroIds) {
  // Hero priority ordering is a backend concern; pass through here.
  return items;
}

function applyKeepCurrentItemsFilter(items, params, hero) {
  // "Keep current items" is a backend optimization constraint; pass through.
  return items;
}

function applyGearMainFilters(items, gearMainFilters) {
  const [necklaceStats, ringStats, bootsStats] = gearMainFilters ?? [
    [],
    [],
    [],
  ];
  return items.filter((item) => {
    if (item.gear === 'Necklace' && necklaceStats?.length > 0) {
      return necklaceStats.includes(item.main?.type);
    }
    if (item.gear === 'Ring' && ringStats?.length > 0) {
      return ringStats.includes(item.main?.type);
    }
    if (item.gear === 'Boots' && bootsStats?.length > 0) {
      return bootsStats.includes(item.main?.type);
    }
    return true;
  });
}

function applyPredictReforges(items, params) {
  // Reforge stat prediction is computed by the backend; pass through.
  return items;
}

function applyGSLimitFilter(items, params) {
  const min = params.inputMinItemGSLimit;
  const max = params.inputMaxItemGSLimit;
  if (min == null && max == null) return items;
  return items.filter((item) => {
    const gs = item.wss ?? item.score ?? 0;
    if (min != null && gs < min) return false;
    if (max != null && gs > max) return false;
    return true;
  });
}

function applySlotSubstatFilters(items, params) {
  const filters = params.inputSlotSubstatFilters;
  if (!filters || Object.keys(filters).length === 0) return items;
  return items.filter((item) => {
    const slotFilters = filters[item.gear];
    if (!slotFilters?.length) return true;
    for (const { type, count } of slotFilters) {
      if (!type || !count) continue;
      const has = (item.substats ?? []).filter((s) => s.type === type).length;
      if (has < count) return false;
    }
    return true;
  });
}

function applySlotStatFloorFilter(items, params) {
  const floors = params.inputSlotStatFloors;
  if (!floors || Object.keys(floors).length === 0) return items;
  return items.filter((item) => {
    const sf = floors[item.gear];
    if (!sf?.enabled) return true;
    const floorMap = sf.floors || {};
    const aug = item.augmentedStats || {};
    for (const [stat, minVal] of Object.entries(floorMap)) {
      if (!minVal) continue;
      if ((aug[stat] || 0) < minVal) return false;
    }
    return true;
  });
}

function bucketizeBySelectedSets(items, params) {
  // Place items whose set matches a selected set first so the backend
  // searches the most promising combinations earliest.
  const selectedSets = new Set((params.inputSets || []).flat().filter(Boolean));
  if (selectedSets.size === 0) return items;
  const primary = items.filter((item) => selectedSets.has(item.set));
  const secondary = items.filter((item) => !selectedSets.has(item.set));
  return [...primary, ...secondary];
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

  // Single pass: flag each slot that has at least one item carrying the stat as a substat.
  // Pre-seeded to false so `=== false` matches only a known, not-yet-flagged slot — an item
  // with an unexpected gear type is ignored here (and passes freely below, exactly as the
  // previous per-slot `items.some(...)` did, which only considered these six slots).
  const slotHasStat = {
    Weapon: false,
    Helmet: false,
    Armor: false,
    Necklace: false,
    Ring: false,
    Boots: false,
  };
  for (const item of items) {
    if (
      slotHasStat[item.gear] === false &&
      item.substats?.some((s) => s.type === stat)
    ) {
      slotHasStat[item.gear] = true;
    }
  }

  const totalCanContribute = slots.filter((s) => slotHasStat[s]).length;

  if (totalCanContribute < minCount) {
    Log.debug(
      `Must-Have Substat: need ${minCount} pieces with '${stat}' but only ${totalCanContribute} slots can provide it. No valid builds possible.`,
    );
    return [];
  }

  if (totalCanContribute === minCount) {
    // Every slot that CAN contribute MUST contribute — prune items without the stat from those slots
    return items.filter(
      (item) =>
        !slotHasStat[item.gear] || // slot that can't contribute: pass freely
        item.substats?.some((s) => s.type === stat), // forced slot: must have stat
    );
  }

  // totalCanContribute > minCount: can't prune individual items safely; pass everything through
  return items;
}

function readNumber(id) {
  const el = document.getElementById(id);
  if (!el) return undefined;
  const possibleNaN = Number.parseInt(el.value, 10);

  return Number.isNaN(possibleNaN) ? undefined : possibleNaN;
}

// Reads a decimal number (e.g. 0.4, 2.3) from an input element.
// Used for priority slider inputs which now support 0.1 increments.
function readFloat(id) {
  const possibleNaN = Number.parseFloat(document.getElementById(id)?.value);
  return Number.isNaN(possibleNaN) ? undefined : possibleNaN;
}

function readCheckbox(id) {
  const el = document.getElementById(id);
  return el ? el.checked === true : false;
}

function throwInvalidSets(showError, message) {
  if (showError) Dialog.error(message);
  throw new Error('Invalid Sets');
}

function throwTopToBottom(showError) {
  throwInvalidSets(
    showError,
    'Invalid sets, fill in the set filters from top to bottom.',
  );
}

function getSetFormatForEmptyFirstSlot(sets, showError) {
  if (sets[1].length > 0) throwTopToBottom(showError);
  if (sets[2].length > 0) throwTopToBottom(showError);
  return 0;
}

function getSetFormatForFourPiece(sets, showError) {
  if (hasTwoPieceSet(sets[0]))
    throwInvalidSets(
      showError,
      'Invalid sets, the first set filter must be either all 4 piece or all 2 piece sets.',
    );
  if (hasTwoPieceSet(sets[2])) throwTopToBottom(showError);
  return sets[1].length > 0 ? 1 : 2;
}

function getSetFormatForTwoPiece(sets, showError) {
  if (sets[1].length > 0) {
    return sets[2].length > 0 ? 5 : 4;
  }
  if (sets[2].length > 0) throwTopToBottom(showError);
  return 3;
}

function getSetFormat(sets, showError) {
  if (sets[0].length === 0)
    return getSetFormatForEmptyFirstSlot(sets, showError);
  if (hasFourPieceSet(sets[0]))
    return getSetFormatForFourPiece(sets, showError);
  if (hasTwoPieceSet(sets[0])) return getSetFormatForTwoPiece(sets, showError);
  return undefined;
}

// Fribbels Library Panel logic lives in:
// 2. Fribbels Hero Library/fribbelsLibrary.js (imported as FribbelsLibrary above)

export default OptimizerTab;

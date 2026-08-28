/* global ArchetypeStore */
const _remote = require('@electron/remote');
const _fs = require('node:fs');

// Diagnostic logging uses the central Log utility (Log.debug, gated by window.__optDebug; see 5. Dev Only/LogControl.js).
/**
 * ArchetypeTab — editor UI for the Archetypes tab (tab10).
 *
 * Features:
 *  - Group column (free-text, used to group archetypes for item scoring)
 *  - Multi-select dropdown for set and main-stat fields
 *  - Single-select dropdown for each substat slot
 *  - Drag-and-drop row reordering
 *  - Add / delete / reset / export / import
 *  - Full dark-mode support via CSS variables
 */

// ---------------------------------------------------------------------------
// Known-value lists for dropdowns
// ---------------------------------------------------------------------------

const KNOWN_SETS = [
  'SpeedSet',
  'AttackSet',
  'HealthSet',
  'DefenseSet',
  'CriticalSet',
  'ImmunitySet',
  'HitSet',
  'ResistSet',
  'CounterSet',
  'RevengeSet',
  'RageSet',
  'LifestealSet',
  'PenetrationSet',
  'TorrentSet',
  'PursuitSet',
  'InjurySet',
  'DestructionSet',
  'ReversalSet',
  'RiposteSet',
  'WarfareSet',
  'ProtectionSet',
  'UnitySet',
  'FervorSet',
  'WeakeningSet',
];

const KNOWN_SUBSTATS = [
  'Speed',
  'AttackPercent',
  'Attack',
  'HealthPercent',
  'Health',
  'DefensePercent',
  'Defense',
  'CriticalHitChancePercent',
  'CriticalHitDamagePercent',
  'EffectivenessPercent',
  'EffectResistancePercent',
];

const KNOWN_NECKLACE = [
  'AttackPercent',
  'HealthPercent',
  'DefensePercent',
  'Attack',
  'Health',
  'Defense',
  'CriticalHitChancePercent',
  'CriticalHitDamagePercent',
];
const KNOWN_RING = [
  'AttackPercent',
  'HealthPercent',
  'DefensePercent',
  'Attack',
  'Health',
  'Defense',
  'EffectivenessPercent',
  'EffectResistancePercent',
];
const KNOWN_BOOTS = [
  'AttackPercent',
  'HealthPercent',
  'DefensePercent',
  'Speed',
];

// Valid substat pools per gear slot (mirrors E7 drop rules)
const SLOT_SUBSTATS = {
  Weapon: [
    'AttackPercent',
    'Health',
    'HealthPercent',
    'Speed',
    'CriticalHitChancePercent',
    'CriticalHitDamagePercent',
    'EffectivenessPercent',
    'EffectResistancePercent',
  ],
  Helmet: [
    'Attack',
    'AttackPercent',
    'Defense',
    'DefensePercent',
    'HealthPercent',
    'Speed',
    'CriticalHitChancePercent',
    'CriticalHitDamagePercent',
    'EffectivenessPercent',
    'EffectResistancePercent',
  ],
  Armor: [
    'DefensePercent',
    'Health',
    'HealthPercent',
    'Speed',
    'CriticalHitChancePercent',
    'CriticalHitDamagePercent',
    'EffectivenessPercent',
    'EffectResistancePercent',
  ],
  Necklace: [
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
  ],
  Ring: [
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
  ],
  Boots: [
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
  ],
};
const SLOT_ORDER = ['Weapon', 'Helmet', 'Armor', 'Necklace', 'Ring', 'Boots'];

// ---------------------------------------------------------------------------
// Display label abbreviations
// ---------------------------------------------------------------------------

const _LABEL_MAP = {
  AttackPercent: 'Atk%',
  DefensePercent: 'Def%',
  HealthPercent: 'HP%',
  Attack: 'Atk',
  Defense: 'Def',
  Health: 'HP',
  Speed: 'Spd',
  CriticalHitChancePercent: 'CC%',
  CriticalHitDamagePercent: 'CD%',
  EffectivenessPercent: 'Eff%',
  EffectResistancePercent: 'Res%',
};

/** Returns a short display label for a stat or set value. */
function _label(val) {
  if (_LABEL_MAP[val]) return _LABEL_MAP[val];
  // Sets: strip trailing "Set"
  if (val?.endsWith('Set')) return val.slice(0, -3);
  return val;
}

// ---------------------------------------------------------------------------
// Multi-select dropdown component
// Panels are appended to <body> when open so they aren't clipped by overflow.
// ---------------------------------------------------------------------------

let _openPanel = null;

function _closeOpenPanel() {
  if (_openPanel) {
    // Flush any focused input inside the panel before removing it from the DOM.
    // Without this, a 'change' event never fires if the user typed a value and
    // then clicked outside (or closed the app) without first blurring the input.
    const focused = _openPanel.querySelector(':focus');
    if (focused) focused.blur();
    if (_openPanel.parentNode) _openPanel.remove();
    _openPanel = null;
  }
}

document.addEventListener('click', _closeOpenPanel);
// Flush any in-progress panel input before the page unloads (e.g. force-reload).
// _closeOpenPanel calls focused.blur() which fires the 'input' save handler.
window.addEventListener('beforeunload', _closeOpenPanel);
window.addEventListener(
  'scroll',
  (e) => {
    // Don't close when scrolling inside an open panel
    if (_openPanel?.contains(e.target)) return;
    _closeOpenPanel();
  },
  true,
);

function _openFloatingPanel(panel, triggerEl) {
  _closeOpenPanel();
  const rect = triggerEl.getBoundingClientRect();
  panel.style.top = `${rect.bottom}px`;
  panel.style.left = `${rect.left}px`;
  panel.style.display = 'block';
  document.body.appendChild(panel);
  _openPanel = panel;
}

/**
 * Build a <td> with a multi-select dropdown.
 * currentValues : string[] | null  (null means "Any" / no preference)
 * options        : string[]
 * onChange       : function(string[] | null)
 */
function multiSelectTd(currentValues, options, onChange) {
  const td = document.createElement('td');
  td.style.position = 'relative';

  // The visible trigger button
  const trigger = document.createElement('div');
  trigger.className = 'arch-ms-trigger';

  // The floating panel (detached until opened)
  const panel = document.createElement('div');
  panel.className = 'arch-ms-panel';
  panel.style.display = 'none';

  // Helpers
  function getSelected() {
    return Array.from(panel.querySelectorAll('input.arch-ms-cb[data-val]'))
      .filter((cb) => cb.checked)
      .map((cb) => cb.dataset.val);
  }

  function updateTrigger(vals) {
    const text =
      !vals || vals.length === 0 ? 'Any' : vals.map(_label).join(', ');
    trigger.textContent = text;
    trigger.title = text;
  }

  // Build the panel contents
  function buildPanel(initVals) {
    panel.innerHTML = '';

    // "Any" row
    const anyLabel = document.createElement('label');
    anyLabel.className = 'arch-ms-option arch-ms-any';
    const anyCb = document.createElement('input');
    anyCb.type = 'checkbox';
    anyCb.className = 'arch-ms-cb';
    anyCb.dataset.val = '__any__';
    anyCb.checked = !initVals || initVals.length === 0;
    anyCb.addEventListener('change', onAnyCbChange);
    anyLabel.appendChild(anyCb);
    anyLabel.appendChild(document.createTextNode(' Any'));
    panel.appendChild(anyLabel);

    options.forEach((opt) => buildOptionRow(opt, initVals, anyCb));
  }

  function onAnyCbChange() {
    const anyCb = panel.querySelector('input.arch-ms-cb[data-val="__any__"]');
    if (!anyCb?.checked) return;
    panel.querySelectorAll('input.arch-ms-cb[data-val]').forEach((cb) => {
      if (cb !== anyCb) cb.checked = false;
    });
    updateTrigger(null);
    onChange(null);
  }

  function onOptionCbChange(anyCb) {
    if (this.checked) anyCb.checked = false;
    const selected = getSelected().filter((v) => v !== '__any__');
    if (selected.length === 0) anyCb.checked = true;
    updateTrigger(selected.length ? selected : null);
    onChange(selected.length ? selected : null);
  }

  function buildOptionRow(opt, initVals, anyCb) {
    const lbl = document.createElement('label');
    lbl.className = 'arch-ms-option';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'arch-ms-cb';
    cb.dataset.val = opt;
    cb.checked = !!initVals?.includes(opt);
    cb.addEventListener('change', onOptionCbChange.bind(cb, anyCb));
    lbl.appendChild(cb);
    lbl.appendChild(document.createTextNode(` ${_label(opt)}`));
    panel.appendChild(lbl);
  }

  // Normalise: filter out nulls for display purposes
  const initVals = Array.isArray(currentValues)
    ? currentValues.filter((x) => x !== null && x !== undefined)
    : null;

  buildPanel(initVals);
  updateTrigger(initVals?.length ? initVals : null);

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (_openPanel === panel) {
      _closeOpenPanel();
      return;
    }
    _openFloatingPanel(panel, trigger);
  });

  td.appendChild(trigger);
  return td;
}

// ---------------------------------------------------------------------------
// Single-select dropdown cell (substats S1–S6)
// ---------------------------------------------------------------------------

function singleSelectTd(currentValue, onChange) {
  const td = document.createElement('td');
  const select = document.createElement('select');
  select.className = 'arch-ss';

  const anyOpt = document.createElement('option');
  anyOpt.value = '';
  anyOpt.textContent = 'Any';
  select.appendChild(anyOpt);

  KNOWN_SUBSTATS.forEach((opt) => {
    const o = document.createElement('option');
    o.value = opt;
    o.textContent = _label(opt);
    select.appendChild(o);
  });

  select.value = currentValue || '';
  select.addEventListener('change', () => {
    onChange(select.value === '' ? null : select.value);
  });

  td.appendChild(select);
  return td;
}

// ---------------------------------------------------------------------------
// Text input cell (group, name) and numeric cell (setBonus, mainBonus)
// ---------------------------------------------------------------------------

function textTd(value, onChange, wide) {
  const td = document.createElement('td');
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value || '';
  input.className =
    'archetype-cell-input' + (wide ? ' archetype-cell-wide' : '');
  input.addEventListener('change', () => onChange(input.value.trim()));
  td.appendChild(input);
  return td;
}

function numTd(value, onChange) {
  const td = document.createElement('td');
  const input = document.createElement('input');
  input.type = 'number';
  input.step = '0.05';
  input.min = '1';
  input.value = value;
  input.className = 'archetype-cell-input archetype-cell-num';
  input.addEventListener('change', () => {
    const v = Number.parseFloat(input.value);
    onChange(Number.isNaN(v) ? 1 : Math.max(1, v));
  });
  td.appendChild(input);
  return td;
}

// ---------------------------------------------------------------------------
// Stat-weights floating editor cell
// Opens a panel with an "Any" default multiplier plus one numeric input per
// stat. Each stat input defaults to the "Any" value; clearing it (blank/invalid)
// removes that stat's override. "Any" itself is removed when set back to 1.0.
// ---------------------------------------------------------------------------

function _makeStatWeightInputHandler(archetype, refreshTrigger, inp, stat) {
  return () => {
    const v = Number.parseFloat(inp.value);
    const fresh = ArchetypeStore.getArchetypes().find(
      (a) => a.id === archetype.id,
    );
    const newSw = { ...(fresh?.statWeights ? fresh.statWeights : {}) };
    if (Number.isNaN(v)) {
      delete newSw[stat];
    } else {
      newSw[stat] = Math.round(v * 100) / 100;
    }
    const toStore = Object.keys(newSw).length ? newSw : null;
    archetype.statWeights = toStore;
    ArchetypeStore.updateArchetype(archetype.id, { statWeights: toStore });
    refreshTrigger();
  };
}

function statWeightsTd(archetype) {
  const td = document.createElement('td');
  const trigger = document.createElement('button');
  trigger.className = 'arch-wt-trigger gearPreviewButton';

  const panel = document.createElement('div');
  panel.className = 'arch-ms-panel arch-wt-panel';
  panel.style.display = 'none';
  panel.addEventListener('click', (e) => e.stopPropagation());

  function refreshTrigger() {
    const sw = archetype.statWeights;
    const anyVal = sw?._any == null ? 1 : sw._any;
    const hasCustom =
      anyVal !== 1 ||
      (sw && Object.entries(sw).some(([k, v]) => k !== '_any' && v !== anyVal));
    trigger.textContent = hasCustom ? 'Wts\u2605' : 'Wts';
    trigger.title = hasCustom
      ? 'Custom stat weights active — click to edit'
      : 'Stat weights (all 1.0) — click to edit';
  }

  function buildPanel() {
    panel.innerHTML = '';
    const current = ArchetypeStore.getArchetypes().find(
      (a) => a.id === archetype.id,
    );
    const sw = current?.statWeights ? current.statWeights : {};
    const anyVal = sw._any == null ? 1 : sw._any;

    // --- "Any" default row ---
    const anyRow = document.createElement('div');
    anyRow.className = 'arch-wt-row arch-wt-any-row';
    const anyLabel = document.createElement('span');
    anyLabel.className = 'arch-wt-label';
    anyLabel.textContent = 'Any';
    const anyInp = document.createElement('input');
    anyInp.type = 'number';
    anyInp.step = '0.1';
    anyInp.min = '0';
    anyInp.max = '10';
    anyInp.className = 'arch-wt-input';
    anyInp.value = anyVal;
    anyInp.title = 'Default multiplier for all stats not explicitly overridden';
    anyInp.addEventListener('input', () => {
      const v = Number.parseFloat(anyInp.value);
      const fresh = ArchetypeStore.getArchetypes().find(
        (a) => a.id === archetype.id,
      );
      const newSw = { ...(fresh?.statWeights ? fresh.statWeights : {}) };
      if (Number.isNaN(v) || v === 1) {
        delete newSw._any;
      } else {
        newSw._any = Math.round(v * 100) / 100;
      }
      const toStore = Object.keys(newSw).length ? newSw : null;
      archetype.statWeights = toStore;
      ArchetypeStore.updateArchetype(archetype.id, {
        statWeights: toStore,
      });
      refreshTrigger();
    });
    anyRow.appendChild(anyLabel);
    anyRow.appendChild(anyInp);
    panel.appendChild(anyRow);

    const divider = document.createElement('div');
    divider.className = 'arch-wt-divider';
    panel.appendChild(divider);

    // --- individual stat rows ---
    const statList = [
      'AttackPercent',
      'DefensePercent',
      'HealthPercent',
      'EffectivenessPercent',
      'EffectResistancePercent',
      'Attack',
      'Defense',
      'Health',
      'Speed',
      'CriticalHitChancePercent',
      'CriticalHitDamagePercent',
    ];

    const makeStatWeightInputHandler = _makeStatWeightInputHandler.bind(
      null,
      archetype,
      refreshTrigger,
    );

    for (const stat of statList) {
      const row = document.createElement('div');
      row.className = 'arch-wt-row';

      const label = document.createElement('span');
      label.className = 'arch-wt-label';
      label.textContent = _label(stat);

      const inp = document.createElement('input');
      inp.type = 'number';
      inp.step = '0.1';
      inp.min = '0';
      inp.max = '10';
      inp.className = 'arch-wt-input';
      inp.value = sw[stat] == null ? anyVal : sw[stat];

      inp.addEventListener('input', makeStatWeightInputHandler(inp, stat));

      row.appendChild(label);
      row.appendChild(inp);
      panel.appendChild(row);
    }
  }

  refreshTrigger();

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (_openPanel === panel) {
      _closeOpenPanel();
      return;
    }
    buildPanel();
    _openFloatingPanel(panel, trigger);
  });

  td.appendChild(trigger);
  return td;
}

// ---------------------------------------------------------------------------
// Drag-and-drop helpers
// ---------------------------------------------------------------------------

let _dragSrcId = null;

function _onDragStart(e, id) {
  _dragSrcId = id;
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('arch-row-dragging');
}

function _onDragEnd(e) {
  e.currentTarget.classList.remove('arch-row-dragging');
  document
    .querySelectorAll('.arch-row-over')
    .forEach((el) => el.classList.remove('arch-row-over'));
}

function _onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('arch-row-over');
}

function _onDragLeave(e) {
  e.currentTarget.classList.remove('arch-row-over');
}

function _onDrop(e, dropId) {
  e.preventDefault();
  e.currentTarget.classList.remove('arch-row-over');
  if (_dragSrcId === null || _dragSrcId === dropId) return;
  const archetypes = ArchetypeStore.getArchetypes().slice();
  const fromIdx = archetypes.findIndex((a) => a.id === _dragSrcId);
  const toIdx = archetypes.findIndex((a) => a.id === dropId);
  if (fromIdx === -1 || toIdx === -1) return;
  archetypes.splice(toIdx, 0, archetypes.splice(fromIdx, 1)[0]);
  ArchetypeStore.saveArchetypes(archetypes);
  _renderTable();
  _dragSrcId = null;
}

// ---------------------------------------------------------------------------
// Per-slot substat overrides panel
// Opens a floating panel with a row per gear slot; each row has S1–S6 selects
// filtered to the valid substat pool for that slot.
// Stored as archetype.slotSubstats = { Weapon: [s1..s6], ... }
// Missing slot key = use global archetype.substats for that slot.
// ---------------------------------------------------------------------------

function _makeSpan(className, text) {
  const el = document.createElement('span');
  el.className = className;
  el.textContent = text;
  return el;
}

function makeSlotChangeHandler(sel, slot, idx, archetype, refreshTrigger) {
  return function onSlotChange() {
    const currentFresh =
      ArchetypeStore.getArchetypes().find((a) => a.id === archetype.id) ||
      archetype;
    const ss = { ...currentFresh.slotSubstats };
    ss[slot] = ss[slot] ? [...ss[slot]] : [null, null, null, null, null, null];
    ss[slot][idx] = sel.value || null;
    // Remove slot key if entire array is null
    if (ss[slot].every((v) => v === null)) delete ss[slot];
    const toStore = Object.keys(ss).length ? ss : null;
    archetype.slotSubstats = toStore;
    ArchetypeStore.updateArchetype(archetype.id, {
      slotSubstats: toStore,
    });
    refreshTrigger();
  };
}

function slotSubstatsTd(archetype) {
  const td = document.createElement('td');
  const trigger = document.createElement('button');
  trigger.className = 'arch-wt-trigger gearPreviewButton';

  const panel = document.createElement('div');
  panel.className = 'arch-ms-panel arch-slot-panel';
  panel.style.display = 'none';
  panel.addEventListener('click', (e) => e.stopPropagation());

  function hasCustom() {
    const ss = archetype.slotSubstats;
    return (
      ss &&
      Object.keys(ss).length > 0 &&
      Object.values(ss).some(
        (arr) => Array.isArray(arr) && arr.some((v) => v !== null),
      )
    );
  }

  function refreshTrigger() {
    trigger.textContent = hasCustom() ? 'Slots\u2605' : 'Slots';
    trigger.title = hasCustom()
      ? 'Per-slot substat overrides active — click to edit'
      : 'Per-slot substat overrides — click to edit';
  }

  function buildPanel() {
    panel.innerHTML = '';

    // Header
    const headerRow = document.createElement('div');
    headerRow.className = 'arch-slot-row arch-slot-header';
    headerRow.appendChild(_makeSpan('arch-slot-name', ''));
    for (let i = 1; i <= 6; i++) {
      headerRow.appendChild(_makeSpan('arch-slot-sel-hdr', `S${i}`));
    }
    panel.appendChild(headerRow);

    const fresh =
      ArchetypeStore.getArchetypes().find((a) => a.id === archetype.id) ||
      archetype;
    const slotSubstats = fresh.slotSubstats || {};

    SLOT_ORDER.forEach((slot) => {
      const row = document.createElement('div');
      row.className = 'arch-slot-row';
      row.appendChild(_makeSpan('arch-slot-name', slot));

      const slotArr = slotSubstats[slot]
        ? [...slotSubstats[slot]]
        : [null, null, null, null, null, null];
      const validOpts = SLOT_SUBSTATS[slot];

      for (let i = 0; i < 6; i++) {
        const idx = i;
        const sel = document.createElement('select');
        sel.className = 'arch-slot-sel arch-ss';

        const anyOpt = document.createElement('option');
        anyOpt.value = '';
        anyOpt.textContent = '\u2014'; // em-dash = "none"
        sel.appendChild(anyOpt);

        validOpts.forEach((opt) => {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = _label(opt);
          sel.appendChild(o);
        });

        sel.value = slotArr[idx] || '';
        sel.addEventListener('change', makeSlotChangeHandler(sel, slot, idx));

        row.appendChild(sel);
      }

      panel.appendChild(row);
    });
  }

  refreshTrigger();

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (_openPanel === panel) {
      _closeOpenPanel();
      return;
    }
    buildPanel();
    _openFloatingPanel(panel, trigger);
  });

  td.appendChild(trigger);
  return td;
}

// ---------------------------------------------------------------------------

function _generateId(name) {
  const base = (name || 'archetype')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base}-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Row rendering
// ---------------------------------------------------------------------------
function renderRow(archetype) {
  const tr = document.createElement('tr');
  tr.dataset.id = archetype.id;
  tr.draggable = true;
  tr.addEventListener('dragstart', (e) => _onDragStart(e, archetype.id));
  tr.addEventListener('dragend', _onDragEnd);
  tr.addEventListener('dragover', _onDragOver);
  tr.addEventListener('dragleave', _onDragLeave);
  tr.addEventListener('drop', (e) => _onDrop(e, archetype.id));

  // Drag handle
  const handleTd = document.createElement('td');
  handleTd.className = 'arch-drag-handle';
  handleTd.innerHTML = '&#x2630;';
  handleTd.title = 'Drag to reorder';
  tr.appendChild(handleTd);

  // Group
  tr.appendChild(
    textTd(
      archetype.group,
      (v) => {
        Log.debug('[ArchetypeTab] update group', archetype.id, '→', v);
        ArchetypeStore.updateArchetype(archetype.id, { group: v });
      },
      false,
    ),
  );

  // Name
  tr.appendChild(
    textTd(
      archetype.name || '',
      (v) => {
        Log.debug('[ArchetypeTab] update name', archetype.id, '→', v);
        ArchetypeStore.updateArchetype(archetype.id, { name: v });
      },
      true,
    ),
  );

  // 4pc Sets
  tr.appendChild(
    multiSelectTd(archetype.fourPieceSets, KNOWN_SETS, (v) => {
      Log.debug('[ArchetypeTab] update 4pcSets', archetype.id, '→', v);
      ArchetypeStore.updateArchetype(archetype.id, { fourPieceSets: v });
    }),
  );

  // 2pc Sets
  tr.appendChild(
    multiSelectTd(archetype.twoPieceSets, KNOWN_SETS, (v) => {
      Log.debug('[ArchetypeTab] update 2pcSets', archetype.id, '→', v);
      ArchetypeStore.updateArchetype(archetype.id, { twoPieceSets: v });
    }),
  );

  // Main stats — helpers to keep the current mainStats object intact
  function updateMain(slot, v) {
    Log.debug('[ArchetypeTab] update mainStats', archetype.id, slot, '→', v);
    const existing = ArchetypeStore.getArchetypes().find(
      (a) => a.id === archetype.id,
    );
    const ms = existing ? { ...existing.mainStats } : {};
    ms[slot] = v;
    ArchetypeStore.updateArchetype(archetype.id, { mainStats: ms });
  }

  const necklaceVals = archetype.mainStats?.Necklace
    ? archetype.mainStats.Necklace.filter((x) => x !== null)
    : null;
  tr.appendChild(
    multiSelectTd(necklaceVals, KNOWN_NECKLACE, (v) =>
      updateMain('Necklace', v),
    ),
  );

  const ringVals = archetype.mainStats?.Ring
    ? archetype.mainStats.Ring.filter((x) => x !== null)
    : null;
  tr.appendChild(
    multiSelectTd(ringVals, KNOWN_RING, (v) => updateMain('Ring', v)),
  );

  const bootsVals = archetype.mainStats?.Boots
    ? archetype.mainStats.Boots.filter((x) => x !== null)
    : null;
  tr.appendChild(
    multiSelectTd(bootsVals, KNOWN_BOOTS, (v) => updateMain('Boots', v)),
  );

  // Substats S1–S6
  const substats = archetype.substats || [null, null, null, null, null, null];
  for (let i = 0; i < 6; i++) {
    const idx = i;
    tr.appendChild(
      singleSelectTd(substats[i], (v) => {
        const existing = ArchetypeStore.getArchetypes().find(
          (a) => a.id === archetype.id,
        );
        const ss = existing
          ? [...(existing.substats || [null, null, null, null, null, null])]
          : [null, null, null, null, null, null];
        ss[idx] = v;
        ArchetypeStore.updateArchetype(archetype.id, { substats: ss });
      }),
    );
  }

  // Per-slot substat overrides
  tr.appendChild(slotSubstatsTd(archetype));

  // Stat weights
  tr.appendChild(statWeightsTd(archetype));

  // setBonus / mainBonus
  tr.appendChild(
    numTd(archetype.setBonus ?? 1.25, (v) =>
      ArchetypeStore.updateArchetype(archetype.id, { setBonus: v }),
    ),
  );
  tr.appendChild(
    numTd(archetype.mainBonus ?? 1.5, (v) =>
      ArchetypeStore.updateArchetype(archetype.id, { mainBonus: v }),
    ),
  );

  // Delete button
  const delTd = document.createElement('td');
  const delBtn = document.createElement('button');
  delBtn.textContent = '✕';
  delBtn.className = 'archetype-del-btn gearPreviewButton';
  delBtn.title = 'Delete this archetype';
  delBtn.addEventListener('click', () => {
    if (!globalThis.confirm('Delete this archetype?')) return;
    Log.debug('[ArchetypeTab] removeArchetype', archetype.id);
    ArchetypeStore.removeArchetype(archetype.id);
    _renderTable();
  });
  delTd.appendChild(delBtn);
  tr.appendChild(delTd);

  return tr;
}

// ---------------------------------------------------------------------------
// Table render
// ---------------------------------------------------------------------------

function _renderTable() {
  const tbody = document.getElementById('archetypeTableBody');
  if (!tbody) {
    Log.error('[ArchetypeTab] _renderTable: archetypeTableBody not found');
    return;
  }
  const archetypes = ArchetypeStore.getArchetypes();
  Log.debug(
    '[ArchetypeTab] _renderTable:',
    archetypes.length,
    'archetypes',
    archetypes.map((a) => a.name),
  );
  tbody.innerHTML = '';
  archetypes.forEach((a) => tbody.appendChild(renderRow(a)));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const ArchetypeTab = {
  _initialized: false,

  initialize() {
    if (this._initialized) return;
    this._initialized = true;
    Log.debug('[ArchetypeTab] initialize');

    _renderTable();

    document
      .getElementById('archetypeResetDefaults')
      .addEventListener('click', () => {
        if (
          !globalThis.confirm(
            'Reset all archetypes to built-in defaults? This cannot be undone.',
          )
        )
          return;
        Log.debug('[ArchetypeTab] resetToDefaults');
        ArchetypeStore.resetToDefaults();
        _renderTable();
      });

    const _saveBtn = document.getElementById('archetypeSave');
    document.getElementById('archetypeSave').addEventListener('click', () => {
      Log.debug('[ArchetypeTab] Save button clicked');
      ArchetypeStore.saveArchetypes(ArchetypeStore.getArchetypes());
      _saveBtn.textContent = 'Saved ✓';
      setTimeout(() => {
        _saveBtn.textContent = 'Save';
      }, 1500);
    });

    document.getElementById('archetypeAddRow').addEventListener('click', () => {
      Log.debug('[ArchetypeTab] addRow');
      const newArchetype = {
        id: _generateId('new-archetype'),
        name: 'New Archetype',
        group: '',
        fourPieceSets: null,
        twoPieceSets: null,
        mainStats: { Necklace: null, Ring: null, Boots: null },
        substats: [null, null, null, null, null, null],
        setBonus: 1.25,
        mainBonus: 1.5,
      };
      ArchetypeStore.addArchetype(newArchetype);
      _renderTable();
      const tbody = document.getElementById('archetypeTableBody');
      if (tbody?.lastElementChild) {
        tbody.lastElementChild.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    });

    document
      .getElementById('archetypeExportJson')
      .addEventListener('click', () => {
        Log.debug('[ArchetypeTab] exportJson clicked');
        const filename = _remote.dialog.showSaveDialogSync(
          _remote.getCurrentWindow(),
          {
            title: 'Export Archetypes',
            defaultPath: 'e7-archetypes.json',
            buttonLabel: 'Export',
            filters: [{ name: 'JSON', extensions: ['json'] }],
          },
        );
        if (!filename) {
          Log.debug('[ArchetypeTab] exportJson cancelled');
          return;
        }
        Log.debug('[ArchetypeTab] exportJson writing to:', filename);
        const json = JSON.stringify(ArchetypeStore.getArchetypes(), null, 2);
        try {
          _fs.writeFileSync(filename, json, 'utf8');
          Log.debug('[ArchetypeTab] exportJson write OK');
        } catch (e) {
          Log.error('[ArchetypeTab] exportJson write FAILED:', e);
        }
      });

    document
      .getElementById('archetypeImportJson')
      .addEventListener('click', () => {
        document.getElementById('archetypeImportFile').click();
      });

    document
      .getElementById('archetypeImportFile')
      .addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        Log.debug('[ArchetypeTab] importJson reading file:', file.name);
        file.text().then((text) => {
          try {
            const parsed = JSON.parse(text);
            if (!Array.isArray(parsed))
              throw new Error('Expected a JSON array of archetypes.');
            const isValid =
              parsed.length > 0 &&
              parsed.every(
                (a) =>
                  typeof a.id === 'string' &&
                  a.id.length > 0 &&
                  Array.isArray(a.substats),
              );
            if (!isValid)
              throw new Error(
                'Each archetype must have a non-empty string id and a substats array.',
              );
            Log.debug(
              '[ArchetypeTab] importJson loaded',
              parsed.length,
              'archetypes',
            );
            ArchetypeStore.saveArchetypes(parsed);
            _renderTable();
          } catch (err) {
            Log.error('[ArchetypeTab] importJson FAILED:', err);
            globalThis.alert(`Import failed: ${err.message}`);
          }
        });
        event.target.value = '';
      });
  },
};

export default ArchetypeTab;

/* global DarkMode, createGridCompat */

/**
 * fribbelsGrid.js — AG Grid setup for the Fribbels Hero Library panel.
 *
 * Column structure and field names mirror the Fribbels website (fribbels.github.io):
 *   rank, sets, gs, bs, atk, def, hp, spd, chc, chd, eff, efr,
 *   ehp, hps, ehps, dmg, dmgs, mcd, mcds, dmgh, dmgd,
 *   artifactName, createDate
 * Plus our extension columns: s1, s2, s3 (skill damage).
 *
 * Key additions vs website:
 *   - columnGradient: red→black→green cell coloring based on min/max per column
 *   - aggregateCurrentHeroStats: tracks min/max across all rows for gradient
 */

// ── Column width constants (matching website naming) ─────────────────────────
const DIGITS_3 = 40;
const DIGITS_4 = 47;
const DIGITS_5 = 54;

// ── Internal state ────────────────────────────────────────────────────────────
let _gridApi = null;
let _currentAggregate = {};

let _callbacks = {
  onRowClick: () => {},
  artifactName: (code) => code || '?',
  setIcons: () => '-',
  abbrevSets: () => '-',
};

// ── Gradient coloring (mirrors website columnGradient) ────────────────────────

/**
 * AG Grid cellStyle function — colors each cell on a red→black→green gradient
 * based on where its value sits relative to the column's min/max across all rows.
 * Matches the website's `columnGradient` function.
 */
function columnGradient(params) {
  try {
    if (!params || params.value == null) return null;
    const colId = params.column.colId;
    const agg = _currentAggregate[colId];
    if (!agg) return null;

    const range = agg.max - agg.min;
    let percent = range === 0 ? 0.5 : (params.value - agg.min) / range;
    percent = Math.min(1, Math.max(0, percent));

    // Simple red → black → green gradient (approx tinygradient stops)
    let r, g, b;
    if (percent < 0.5) {
      // red (#5A1A06) → black (#343127)
      const t = percent / 0.5;
      r = Math.round(90 + t * (52 - 90));
      g = Math.round(26 + t * (49 - 26));
      b = Math.round(6 + t * (39 - 6));
    } else {
      // black (#343127) → green (#38821F)
      const t = (percent - 0.5) / 0.5;
      r = Math.round(52 + t * (56 - 52));
      g = Math.round(49 + t * (130 - 49));
      b = Math.round(39 + t * (31 - 39));
    }
    return { backgroundColor: `rgb(${r},${g},${b})` };
  } catch (e) {
    Log.error(e);
    return null;
  }
}

// ── Aggregate stats (mirrors website aggregateCurrentHeroStats) ───────────────

const STATS_TO_AGGREGATE = [
  'atk',
  'def',
  'hp',
  'spd',
  'chc',
  'chd',
  'eff',
  'efr',
  'ehp',
  'hps',
  'ehps',
  'dmg',
  'dmgs',
  'mcd',
  'mcds',
  'dmgh',
  'dmgd',
  'hmcdmgs',
  'dmcdmgs',
  'hdmg',
  'hdmgs',
  'ddmg',
  'ddmgs',
  'gs',
  'bs',
  's1',
  's2',
  's3',
  // Derived display columns — stamped by OptimizerGrid.decorateCalcFields().
  'finalSpeed',
  'spdEff',
];

function cleanInfinities(num) {
  return num === Infinity || num === -Infinity ? 0 : num;
}

/**
 * Builds min/max/avg per stat across all rows so columnGradient can color cells.
 * Must be called before setData() to have up-to-date values.
 */
function aggregateCurrentHeroStats(rows) {
  _currentAggregate = {};
  if (!rows || !rows.length) return;
  for (const stat of STATS_TO_AGGREGATE) {
    const vals = rows.map((r) => r[stat] || 0);
    // Reduce instead of Math.max/min spread to avoid a call-stack overflow on large
    // arrays (mirrors the G4 fix in optimizerGrid.aggregateCurrentHeroStats).
    let max = vals.reduce((m, v) => (v > m ? v : m), -Infinity);
    let min = vals.reduce((m, v) => (v < m ? v : m), Infinity);
    // Cap at game limits; CD cap is hero-specific (350 + cdCapBonus)
    if (stat === 'chc') {
      max = Math.min(100, max);
      min = Math.min(100, min);
    }
    if (stat === 'chd') {
      const cdCap = 350 + (rows[0]?.cdCapBonus || 0);
      max = Math.min(cdCap, max);
      min = Math.min(cdCap, min);
    }
    const sum = vals.reduce((a, b) => a + b, 0);
    _currentAggregate[stat] = {
      max: cleanInfinities(max),
      min: cleanInfinities(min),
      avg: cleanInfinities(sum / rows.length),
    };
  }
}

// ── Column definitions (matching website structure) ───────────────────────────

function buildColumnDefs() {
  return [
    {
      headerName: ' #',
      field: 'rank',
      width: DIGITS_3,
      sortable: true,
      sortingOrder: ['asc', 'desc'],
      cellStyle: (p) =>
        p.node.rowPinned === 'top'
          ? { color: '#1a5fcc', textAlign: 'center', fontWeight: '700' }
          : { color: '#888', textAlign: 'center' },
    },
    {
      headerName: ' sets',
      field: 'sets',
      width: 85,
      cellRenderer: (p) => _callbacks.setIcons(p.data?.sets),
      comparator: (a, b) =>
        _callbacks.abbrevSets(a).localeCompare(_callbacks.abbrevSets(b)),
    },
    {
      headerName: ' gs',
      field: 'gs',
      width: DIGITS_3,
      cellStyle: columnGradient,
    },
    {
      headerName: ' bs',
      field: 'bs',
      width: DIGITS_3,
      cellStyle: columnGradient,
    },
    {
      headerName: ' atk',
      field: 'atk',
      width: DIGITS_4,
      cellStyle: columnGradient,
    },
    {
      headerName: ' def',
      field: 'def',
      width: DIGITS_4,
      cellStyle: columnGradient,
    },
    {
      headerName: ' hp',
      field: 'hp',
      width: DIGITS_5,
      cellStyle: columnGradient,
    },
    {
      headerName: ' spd',
      field: 'spd',
      width: DIGITS_3,
      cellStyle: columnGradient,
    },
    {
      headerName: ' cc',
      field: 'chc',
      width: DIGITS_3,
      cellStyle: columnGradient,
    },
    {
      headerName: ' cd',
      field: 'chd',
      width: DIGITS_3,
      cellStyle: columnGradient,
    },
    {
      headerName: ' eff',
      field: 'eff',
      width: DIGITS_3,
      cellStyle: columnGradient,
    },
    {
      headerName: ' res',
      field: 'efr',
      width: DIGITS_3,
      cellStyle: columnGradient,
    },
    {
      headerName: ' ehp',
      field: 'ehp',
      width: DIGITS_4,
      cellStyle: columnGradient,
    },
    {
      headerName: ' hps',
      field: 'hps',
      width: DIGITS_4,
      cellStyle: columnGradient,
    },
    {
      headerName: ' ehps',
      field: 'ehps',
      width: DIGITS_4,
      cellStyle: columnGradient,
    },
    {
      headerName: ' dmg',
      field: 'dmg',
      width: DIGITS_4,
      cellStyle: columnGradient,
    },
    {
      headerName: ' dmgs',
      field: 'dmgs',
      width: DIGITS_4,
      cellStyle: columnGradient,
    },
    {
      headerName: ' mcd',
      field: 'mcd',
      width: DIGITS_4,
      cellStyle: columnGradient,
    },
    {
      headerName: ' mcds',
      field: 'mcds',
      width: DIGITS_4,
      cellStyle: columnGradient,
    },
    {
      headerName: ' dmgh',
      field: 'dmgh',
      width: DIGITS_4,
      cellStyle: columnGradient,
    },
    {
      headerName: ' dmgd',
      field: 'dmgd',
      width: DIGITS_4,
      cellStyle: columnGradient,
    },
    {
      headerName: ' hmcdgs',
      field: 'hmcdmgs',
      width: DIGITS_4,
      cellStyle: columnGradient,
    },
    {
      headerName: ' dmcdgs',
      field: 'dmcdmgs',
      width: DIGITS_4,
      cellStyle: columnGradient,
    },
    {
      headerName: ' hdmg',
      field: 'hdmg',
      width: DIGITS_4,
      cellStyle: columnGradient,
    },
    {
      headerName: ' hdmgs',
      field: 'hdmgs',
      width: DIGITS_4,
      cellStyle: columnGradient,
    },
    {
      headerName: ' ddmg',
      field: 'ddmg',
      width: DIGITS_4,
      cellStyle: columnGradient,
    },
    {
      headerName: ' ddmgs',
      field: 'ddmgs',
      width: DIGITS_4,
      cellStyle: columnGradient,
    },
    // Skill damage (our extension, not on website)
    {
      headerName: 'S1',
      field: 's1',
      width: DIGITS_4,
      valueFormatter: (p) => (p.value > 0 ? p.value.toLocaleString() : '-'),
      cellStyle: (p) => (p.value > 0 ? columnGradient(p) : null),
    },
    {
      headerName: 'S2',
      field: 's2',
      width: DIGITS_4,
      valueFormatter: (p) => (p.value > 0 ? p.value.toLocaleString() : '-'),
      cellStyle: (p) => (p.value > 0 ? columnGradient(p) : null),
    },
    {
      headerName: 'S3',
      field: 's3',
      width: DIGITS_4,
      valueFormatter: (p) => (p.value > 0 ? p.value.toLocaleString() : '-'),
      cellStyle: (p) => (p.value > 0 ? columnGradient(p) : null),
    },
    {
      headerName: 'FSpd',
      field: 'finalSpeed',
      width: DIGITS_5,
      cellStyle: columnGradient,
      headerTooltip:
        'Final Speed = Speed / (1 - CR Push%). Set the push % in the CR Push box on the Optimizer tab.',
    },
    {
      headerName: 'SpdEff',
      field: 'spdEff',
      width: DIGITS_5,
      cellStyle: columnGradient,
      headerTooltip:
        'SpdEff = Speed + Effectiveness x weight (Eff wt box on the Optimizer tab, default 0.5).',
    },
    {
      headerName: 'arti',
      field: 'artifactName',
      width: 150,
      cellStyle: { 'justify-content': 'left', display: 'block' },
    },
    {
      headerName: 'date',
      field: 'createDate',
      width: 85,
      valueFormatter: (p) =>
        p.node?.rowPinned === 'top' ? 'Current' : (p.value || '').slice(0, 10),
    },
  ];
}

// ── Row key ───────────────────────────────────────────────────────────────────

export function rowKey(row) {
  return `${row.atk}:${row.hp}:${row.def}:${row.spd}:${row.chc}:${row.chd}:${row.eff}:${row.efr}:${row.gs}:${row.createDate || ''}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

const FribbelsGrid = {
  /**
   * Wire callbacks and create the AG Grid instance (idempotent).
   *
   * @param {{
   *   onRowClick:   (row: object) => void,
   *   artifactName: (code: string) => string,
   *   setIcons:     (sets: object) => string,
   *   abbrevSets:   (sets: object) => string,
   * }} callbacks
   */
  init(callbacks) {
    Object.assign(_callbacks, callbacks);

    const gridDiv = document.getElementById('fribbels-builds-grid');
    if (!gridDiv || _gridApi) return;

    const gridOptions = {
      defaultColDef: {
        sortable: true,
        resizable: true,
        sortingOrder: ['desc', 'asc'],
        cellDataType: false,
        cellClass: 'no-border',
        width: DIGITS_3,
      },
      overlayNoRowsTemplate: 'Select a hero',
      columnDefs: buildColumnDefs(),
      rowHeight: 24,
      rowSelection: { mode: 'singleRow', enableClickSelection: true },
      suppressCellFocus: true,
      suppressScrollOnNewData: true,
      suppressDragLeaveHidesColumns: true,
      getRowStyle: (p) => {
        if (p.node.rowPinned === 'top') {
          return DarkMode.isDark()
            ? {
                background: '#0d3a5e',
                fontWeight: '600',
                borderBottom: '2px solid #4a9eff',
                color: '#c4e4ff',
              }
            : {
                background: '#cce8ff',
                fontWeight: '600',
                borderBottom: '2px solid #4a9eff',
              };
        }
        return null;
      },
      onRowClicked: (event) => {
        if (!event.data || event.node.rowPinned === 'top') return;
        _callbacks.onRowClick(event.data);
      },
    };

    const instance = createGridCompat(gridDiv, gridOptions);
    _gridApi = instance.gridOptions.api;
  },

  isReady() {
    return _gridApi !== null;
  },

  /**
   * Push data into the grid.
   * Aggregates stats first so columnGradient has min/max values.
   *
   * @param {object[]}   rows        - community build rows
   * @param {object|null} pinnedRow  - current hero's equipped build (pinned top)
   * @param {string|null} selectedKey - rowKey of previously selected row
   */
  setData(rows, pinnedRow, selectedKey) {
    if (!_gridApi) return;
    // Stamp finalSpeed/spdEff from spd/eff so the two derived columns display,
    // colour, and sort (client-side) like the rest.  CR push comes from the loaded
    // hero (these are community builds for that hero); eff weight is the global box.
    const crp = globalThis.OptimizerGrid?.getLoadedHeroCrp?.() ?? 0;
    globalThis.OptimizerGrid?.decorateCalcFields?.(rows, crp);
    if (pinnedRow)
      globalThis.OptimizerGrid?.decorateCalcFields?.([pinnedRow], crp);
    aggregateCurrentHeroStats(rows);
    _gridApi.setGridOption('rowData', rows);
    _gridApi.setGridOption('pinnedTopRowData', pinnedRow ? [pinnedRow] : []);
    if (selectedKey) {
      _gridApi.forEachNode((node) => {
        if (node.data && rowKey(node.data) === selectedKey) {
          node.setSelected(true);
        }
      });
    }
  },

  deselectAll() {
    if (_gridApi) _gridApi.deselectAll();
  },

  /**
   * Re-select a row by key and scroll it into view (used by preset restore).
   */
  selectByKey(key) {
    if (!_gridApi || !key) return;
    _gridApi.deselectAll();
    _gridApi.forEachNode((node) => {
      if (node.data && rowKey(node.data) === key) {
        node.setSelected(true);
        _gridApi.ensureNodeVisible(node, 'middle');
      }
    });
  },

  destroy() {
    if (_gridApi) {
      _gridApi.destroy?.();
      _gridApi = null;
    }
  },
};

export default FribbelsGrid;

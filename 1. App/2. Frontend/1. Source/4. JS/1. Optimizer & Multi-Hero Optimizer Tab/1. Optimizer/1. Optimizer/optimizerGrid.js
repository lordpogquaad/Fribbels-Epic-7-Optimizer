/* global i18next, AG_GRID_LOCALE_ZH, AG_GRID_LOCALE_ZH_TW, AG_GRID_LOCALE_FR */
/* global AG_GRID_LOCALE_JA, AG_GRID_LOCALE_KO, AG_GRID_LOCALE_RU, AG_GRID_LOCALE_EN */
/* global Api, GridRenderer, OptimizerTab, StatPreview, PriorityFilter */
import tinygradient from 'tinygradient';
import colorPicker from '../../../6. Shared/4. UI/1. Components/colorPicker';

const lightGradient = {
  gradient: tinygradient([
    { color: '#F5A191', pos: 0 }, // red
    { color: '#ffffe5', pos: 0.4 },
    { color: '#77e246', pos: 1 }, // green
  ]),
};

const darkGradient = colorPicker.getColors();

let gradient = lightGradient;

let optimizerGrid = globalThis.optimizerGrid || null;
const currentAggregate = {};
let currentTargets = {};
let selectedRow = null;

// Set by OptimizerTab after hero load so build-score column can normalise
// gear stat gains against the hero's base stats.
let currentBaseStats = null;

// ---------------------------------------------------------------------------
// Restored-results state — when set, the datasource serves from this local
// array instead of calling the Java backend.  Cleared before each live run.
// ---------------------------------------------------------------------------
let _restoredRows = null;
let _restoredMaximum = 0;
// Memo of the decorated+sorted FULL restored set so scrolling pages don't re-decorate
// and re-sort every row each fetch.  `_restoredEpoch` bumps when the restored set is
// (re)assigned, invalidating the memo.
let _restoredEpoch = 0;
let _restoredSortCache = null; // { key, rows }
// Set once the user edits targets/ranks/scale while in restored mode: from then on the
// restored bscr is re-stamped live from the JS calculateBuildScore (an approximation of
// the backend score) so it + the sort track the edits.  Stays off on (re)load so a freshly
// restored set shows its backend-authoritative bscr until the user actually edits something.
let _restoredBscrLive = false;

// ---------------------------------------------------------------------------
// Derived columns finalSpeed (FSpd) and spdEff (SpdEff):
//   finalSpeed = spd / (1 - crPush)   crPush = the loaded hero's CR-push fraction
//                                     (a per-hero Bonus stat), clamped 0–0.95
//   spdEff     = spd + eff * weight   weight from the global Eff-wt box (default 0.5)
// Both are stamped onto each result row as real numeric fields so they sort
// generically in restored mode and colour via the existing heatmap.  CR push is
// per-hero now (no global box); the eff weight stays a global, persisted box.
// ---------------------------------------------------------------------------
const CALC_SPDEFF_WEIGHT_KEY = 'e7opt_spdEffWeight';

function _readStoredNumber(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

let _spdEffWeight = Math.max(0, _readStoredNumber(CALC_SPDEFF_WEIGHT_KEY, 0.5));

// CR-push fraction of the hero currently loaded in the optimizer — captured when
// the hero is pinned (from hero.crPush) — drives this grid's FSpd column.  Multi /
// library pass their own hero's value to decorateCalcFields directly.
let _loadedHeroCrp = 0;
// CD cap of the loaded hero (350 + hero.cdCapBonus) — mirrors priorityFilter's scoring
// cap so the CD heatmap doesn't stretch past the value the score actually uses.
let _loadedHeroCdCap = 350;

function _clampCrp(v) {
  return Math.min(0.95, Math.max(0, Number(v) || 0));
}

// Read the SpdEff effectiveness-weight box; default 0.5, non-negative.
function getSpdEffWeight() {
  const el = document.getElementById('inputSpdEffWeight');
  if (el) {
    const w = Number.parseFloat(el.value);
    if (Number.isFinite(w)) {
      _spdEffWeight = Math.max(0, w);
    }
  }
  return _spdEffWeight;
}

// The CR-push fraction of the optimizer's currently-loaded hero (used by the
// hero library, which shows community builds for that same hero).
function getLoadedHeroCrp() {
  return _loadedHeroCrp;
}

// Stamp finalSpeed / spdEff onto each row from its spd/eff, the given per-hero
// CR-push fraction, and the global eff weight.
function decorateCalcFields(rows, crpFraction) {
  if (!rows || !rows.length) return rows;
  const crp = _clampCrp(crpFraction);
  const w = getSpdEffWeight();
  const denom = 1 - crp; // crp clamped < 1, so denom in [0.05, 1]
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row) continue;
    // Coerce: hero-library rows can carry stats as strings (external API), which
    // would make `spd + eff*w` string-concatenate. Number() is a no-op on numbers.
    const spd = Number(row.spd) || 0;
    const eff = Number(row.eff) || 0;
    row.finalSpeed = Math.round(spd / denom);
    row.spdEff = Math.round(spd + eff * w);
  }
  return rows;
}

// Stamp buildScore (×100) onto any row that lacks the backend field (old localStorage
// caches predate it), so the bscr column reads a field instead of recomputing
// calculateBuildScore on every cell render.  Live backend rows already carry it, so
// this is a no-op for them.  Needs currentBaseStats; if absent the valueGetter fallback
// still covers display.
// `force` (restored-results live re-stamp): when true, recompute bscr from the current
// targets/ranks/scale even if a value already exists, so editing a rank/scale after
// loading cached results updates bscr (the JS approximation) + the sort live instead of
// staying stale until the next backend run.  When false this is the original behavior:
// only fill in rows missing the field (old caches predate it); live backend rows are a no-op.
function stampBuildScore(rows, force) {
  if (!rows || !rows.length || !currentBaseStats) return;
  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i];
    if (r && (force || r.buildScore == null)) {
      const v = PriorityFilter.calculateBuildScore(
        r,
        currentTargets,
        currentBaseStats,
      );
      r.buildScore = Number.isFinite(v) ? Math.round(v * 100) : null;
    }
  }
}

const STAT_TARGET_MAP = {
  atk: 'inputAtkTarget',
  hp: 'inputHpTarget',
  def: 'inputDefTarget',
  spd: 'inputSpdTarget',
  cr: 'inputCrTarget',
  cd: 'inputCdTarget',
  eff: 'inputEffTarget',
  res: 'inputResTarget',
};
let pinnedRow = {
  atk: 0,
  def: 0,
  hp: 0,
  spd: 0,
  cr: 0,
  cd: 0,
  eff: 0,
  res: 0,
};

export default {
  toggleDarkMode(enabled) {
    if (enabled) {
      gradient = darkGradient;
    } else {
      gradient = lightGradient;
    }

    // The grid may not exist yet — dark mode can be applied during startup (Settings
    // loadSettings) before the grids are built. Nothing to redraw then; a freshly-built
    // grid paints with the current theme (dark mode is global CSS). Optional-chain so
    // this is a no-op until the grid is initialized.
    optimizerGrid?.gridOptions?.api?.redrawRows();
  },

  initialize: () => {
    let localeText;
    if (i18next.language === 'zh') {
      localeText = AG_GRID_LOCALE_ZH;
    } else if (i18next.language === 'zh-TW') {
      localeText = AG_GRID_LOCALE_ZH_TW;
    } else if (i18next.language === 'fr') {
      localeText = AG_GRID_LOCALE_FR;
    } else if (i18next.language === 'ja') {
      localeText = AG_GRID_LOCALE_JA;
    } else if (i18next.language === 'ko') {
      localeText = AG_GRID_LOCALE_KO;
    } else if (i18next.language === 'ru') {
      localeText = AG_GRID_LOCALE_RU;
    } else {
      localeText = AG_GRID_LOCALE_EN;
    }
    buildGrid(localeText);
    // Restore the persisted SpdEff eff-weight box so the displayed value matches
    // storage (getSpdEffWeight reads the box, so the box must lead).
    try {
      const wEl = document.getElementById('inputSpdEffWeight');
      if (wEl) wEl.value = String(_spdEffWeight);
    } catch {
      // ignore — box may not be present in some embeddings
    }
  },

  reloadData: () => {
    optimizerGrid.gridOptions.api.setGridOption('datasource', datasource);
  },

  refresh: () => {
    // Live-preview reload during a run. Must be a HARD purge, not refreshInfiniteCache():
    // the run's first getRows fires before the backend has any results, so it returns
    // 0 rows and ag-grid records rowCount=0 with NO cache blocks. refreshInfiniteCache()
    // only reloads blocks that already exist, so from that empty cache it never re-fetches
    // and the streamed partial results never appear (counters tick, grid stays empty).
    // purgeInfiniteCache() reloads from scratch starting at block 0, so partial results
    // render live as the backend produces them. (refreshCalcInputs() can still use
    // refreshInfiniteCache because by then the grid is already populated.)
    optimizerGrid.gridOptions.api.purgeInfiniteCache();
  },

  setPinnedHero: (hero) => {
    hero.eq = 0;
    // Capture this hero's CR-push (a per-hero Bonus stat) for the FSpd column.
    _loadedHeroCrp = _clampCrp(hero?.crPush);
    _loadedHeroCdCap = 350 + (Number(hero?.cdCapBonus) || 0);
    decorateCalcFields([hero], _loadedHeroCrp);
    optimizerGrid.gridOptions.api.setGridOption('pinnedTopRowData', [hero]);
    pinnedRow = hero;
    StatPreview.draw(pinnedRow, pinnedRow);
  },

  /**
   * Re-read the SpdEff eff-weight box, persist it, and refresh every grid that
   * shares it so the SpdEff column (and any active sort on it) updates live.
   * Wired to the box's `oninput` in app.html.  (CR push is per-hero now and
   * refreshes when the hero or its Bonus stats change, not from a box.)
   */
  refreshCalcInputs: () => {
    const w = getSpdEffWeight();
    try {
      localStorage.setItem(CALC_SPDEFF_WEIGHT_KEY, String(w));
    } catch {
      // ignore storage failures
    }
    try {
      const pinned = optimizerGrid.gridOptions.api.getPinnedTopRow(0);
      if (pinned && pinned.data) {
        decorateCalcFields([pinned.data], _loadedHeroCrp);
        optimizerGrid.gridOptions.api.setGridOption('pinnedTopRowData', [
          pinned.data,
        ]);
      }
    } catch {
      // ignore — no pinned row yet
    }
    try {
      const { api } = optimizerGrid.gridOptions;
      const colState = api.getColumnState ? api.getColumnState() : [];
      const sorted = colState.find((c) => c.sort);
      const sortCol = sorted ? sorted.colId : 'buildScore';
      if (sortCol === 'finalSpeed' || sortCol === 'spdEff') {
        // The eff-weight reorders these columns → must refetch/re-sort from the source.
        api.refreshInfiniteCache();
      } else {
        // Sort is unaffected: re-stamp the already-loaded rows and repaint just the two
        // derived columns in place — no backend refetch / cache purge.
        api.forEachNode((node) => {
          if (node && node.data)
            decorateCalcFields([node.data], _loadedHeroCrp);
        });
        api.refreshCells({ columns: ['finalSpeed', 'spdEff'], force: true });
      }
    } catch (e) {
      Log.error('Failed to refresh calc columns:', e);
    }
    // Propagate to the other grids that share the eff weight so SpdEff updates
    // live across tabs, not just on their next fetch/render.
    try {
      globalThis.MultiOptimizerTab?.refreshCalcColumns?.();
    } catch (e) {
      Log.error('multi calc refresh failed:', e);
    }
    try {
      globalThis.FribbelsLibrary?.refreshCalcColumns?.();
    } catch (e) {
      Log.error('library calc refresh failed:', e);
    }
  },

  showLoadingOverlay: () => {
    optimizerGrid.gridOptions.api.setGridOption('loading', true);
  },

  refreshTargetCells: () => {
    try {
      currentTargets = OptimizerTab.getOptimizationRequestParams();
      if (_restoredRows !== null) {
        // Restored-results mode: bscr depends on the current targets/ranks/scale via the
        // JS calculateBuildScore, so re-stamp + re-sort live rather than staying stale
        // until the next backend run.  Enable the live re-stamp from here on, drop the
        // sort memo, and refetch (mirrors refreshCalcInputs' live re-sort for eff weight).
        _restoredBscrLive = true;
        _restoredSortCache = null;
        optimizerGrid.gridOptions.api.refreshInfiniteCache();
        return;
      }
      optimizerGrid.gridOptions.api.refreshCells({
        force: true,
        columns: [...Object.keys(STAT_TARGET_MAP), 'buildScore'],
      });
    } catch (e) {
      Log.error('Failed to refresh target cells:', e);
    }
  },

  /** Switch the grid to serve rows from a localStorage-restored result set. */
  setRestoredSource: (rows, maximum) => {
    _restoredRows = rows;
    _restoredMaximum = maximum;
    _restoredEpoch += 1;
    _restoredSortCache = null;
    _restoredBscrLive = false;
    optimizerGrid.gridOptions.api.setGridOption('datasource', datasource);
  },

  /**
   * Live-preview update: replace the in-memory snapshot WITHOUT resetting the
   * datasource, so the grid refills block 0 from memory in place (no clear/flicker).
   * Use only after setRestoredSource has already put the grid in restored mode.
   */
  updateRestoredSnapshot: (rows, maximum) => {
    _restoredRows = rows;
    _restoredMaximum = maximum;
    _restoredEpoch += 1;
    _restoredSortCache = null;
    _restoredBscrLive = false;
    optimizerGrid.gridOptions.api.refreshInfiniteCache();
  },

  /** Return to live-backend mode (called before submitting a new optimisation). */
  clearRestoredSource: () => {
    _restoredRows = null;
    _restoredMaximum = 0;
    _restoredSortCache = null;
    _restoredBscrLive = false;
  },

  isRestoredMode: () => _restoredRows !== null,

  /**
   * Set the current hero's base stats so the build-score valueGetter can
   * normalise gear stat gains correctly.  Call after each hero load.
   */
  setBaseStats: (bs) => {
    currentBaseStats = bs;
  },

  // Shared calc helpers so the multi-optimizer and hero-library grids reuse the
  // same decorate logic + global eff weight.  CR push is per-hero: the library
  // (community builds for the loaded hero) reads getLoadedHeroCrp().
  getLoadedHeroCrp,
  getSpdEffWeight,
  decorateCalcFields,

  getSelectedGearIds,

  getSelectedGearMods,

  getSelectedRow: () => {
    const selectedRows = optimizerGrid.gridOptions.api.getSelectedRows();
    if (selectedRows.length > 0) {
      const row = selectedRows[0];
      return row;
    }
    return null;
  },

  getSelectedRows: () =>
    optimizerGrid.gridOptions.api.getSelectedRows().filter(Boolean),

  getSelectedNode: () => {
    const selectedNodes = optimizerGrid.gridOptions.api.getSelectedNodes();
    if (selectedNodes.length > 0) {
      const node = selectedNodes[0];
      return node;
    }
    return null;
  },

  getSelectedNodes: () =>
    optimizerGrid.gridOptions.api
      .getSelectedNodes()
      .filter((n) => n && !n.rowPinned),
};

function getSelectedGearIds() {
  const selectedRows = optimizerGrid.gridOptions.api.getSelectedRows();
  if (selectedRows.length > 0) {
    const row = selectedRows[0];
    return [
      row.items[0],
      row.items[1],
      row.items[2],
      row.items[3],
      row.items[4],
      row.items[5],
    ];
  }
  return [];
}

function getSelectedGearMods() {
  const selectedRows = optimizerGrid.gridOptions.api.getSelectedRows();
  if (selectedRows.length > 0) {
    const row = selectedRows[0];
    const mods = row.mods || [];
    return [mods[0], mods[1], mods[2], mods[3], mods[4], mods[5]];
  }
  return [];
}

const datasource = {
  async getRows(params) {
    try {
      const { startRow } = params;
      const { endRow } = params;
      // Default ranking is the faithful build score (per-slot/per-set-weighted gear
      // value + stat-target bonus, computed server-side).  Users can still sort by any
      // column; clearing the sort falls back to buildScore desc.
      const sortColumn = params.sortModel.length
        ? params.sortModel[0].colId
        : 'buildScore';
      const sortOrder = params.sortModel.length
        ? params.sortModel[0].sort
        : 'desc';

      globalThis.optimizerGrid = optimizerGrid;

      // ------------------------------------------------------------------
      // Restored-data path: serve rows from in-memory cache instead of
      // calling the Java backend.
      // ------------------------------------------------------------------
      if (_restoredRows !== null) {
        // G1: getOptimizationRequestParams() can throw — caught by outer try/catch
        currentTargets = OptimizerTab.getOptimizationRequestParams();
        // Decorate (finalSpeed/spdEff), stamp buildScore, and sort the FULL restored
        // set ONCE per (epoch, sort, eff-weight, crp) — scrolling then only re-slices
        // and re-aggregates instead of redoing all that work on every page fetch.
        const w = getSpdEffWeight();
        const cacheKey = `${_restoredEpoch}|${sortColumn}|${sortOrder}|${w}|${_loadedHeroCrp}`;
        let rows;
        if (_restoredSortCache && _restoredSortCache.key === cacheKey) {
          rows = _restoredSortCache.rows;
        } else {
          decorateCalcFields(_restoredRows, _loadedHeroCrp);
          stampBuildScore(_restoredRows, _restoredBscrLive);
          rows = _restoredRows;
          if (sortColumn && sortOrder) {
            const dir = sortOrder === 'asc' ? 1 : -1;
            rows = [...rows].sort((a, b) => {
              const av = a[sortColumn];
              const bv = b[sortColumn];
              if (typeof av === 'string' || typeof bv === 'string') {
                return dir * String(av ?? '').localeCompare(String(bv ?? ''));
              }
              return dir * ((av || 0) - (bv || 0) || 0);
            });
          }
          _restoredSortCache = { key: cacheKey, rows };
        }
        const slice = rows.slice(startRow, Math.min(endRow, rows.length));
        aggregateCurrentHeroStats(slice);
        optimizerGrid.gridOptions.api.setGridOption('loading', false);
        params.successCallback(slice, _restoredRows.length);
        const pinned = optimizerGrid.gridOptions.api.getPinnedTopRow(0);
        if (pinned) {
          optimizerGrid.gridOptions.api.setGridOption('pinnedTopRowData', [
            pinned.data,
          ]);
        }
        return;
      }

      optimizerGrid.gridOptions.api.setGridOption('loading', true);
      const heroId = document.getElementById('inputHeroAdd').value;
      // G1: getOptimizationRequestParams() can throw — caught by outer try/catch
      const optimizationRequest = OptimizerTab.getOptimizationRequestParams();
      optimizationRequest.heroId = heroId;
      currentTargets = optimizationRequest;

      const request = {
        startRow,
        endRow,
        sortColumn,
        sortOrder,
        // Backend SpdEff sort uses the same weight the display columns do.
        spdEffWeight: getSpdEffWeight(),
        optimizationRequest,
      };

      request.executionId = OptimizerTab.getCurrentExecutionId();

      if (!request.executionId) {
        params.successCallback([], 0);
        return;
      }

      Api.getResultRows(request)
        .then((response) => {
          // Live-fetch diagnostics: heroStats=0 with maximum>0 ⇒ backend isn't streaming
          // live rows; heroStats>0 but grid blank ⇒ render side. Toggled centrally via
          // `5. Dev Only/LogControl.js` → window.__liveGridLog.
          Log.liveGrid(
            '[getRows LIVE] startRow', startRow,
            'endRow', endRow,
            'execId', request.executionId,
            '→ heroStats', response?.heroStats?.length,
            'maximum', response?.maximum,
          );
          decorateCalcFields(response.heroStats, _loadedHeroCrp);
          stampBuildScore(response.heroStats);
          aggregateCurrentHeroStats(response.heroStats);
          optimizerGrid.gridOptions.api.setGridOption('loading', false);
          params.successCallback(response.heroStats, response.maximum);

          const pinned = optimizerGrid.gridOptions.api.getPinnedTopRow(0);
          if (pinned) {
            optimizerGrid.gridOptions.api.setGridOption('pinnedTopRowData', [
              pinned.data,
            ]);
          }
          return undefined;
        })
        .catch((e) => {
          // G2/G8: always call failCallback so the grid exits the loading state
          Log.error('[optimizerGrid] getResultRows failed:', e);
          optimizerGrid.gridOptions.api.setGridOption('loading', false);
          params.failCallback();
        });
    } catch (e) {
      // G1: getOptimizationRequestParams() threw or another sync error occurred
      Log.error('[optimizerGrid] getRows failed:', e);
      optimizerGrid.gridOptions.api.setGridOption('loading', false);
      params.failCallback();
    }
  },
};

function aggregateCurrentHeroStats(heroStats) {
  // currentAggregate
  const statsToAggregate = [
    'atk',
    'hp',
    'def',
    'spd',
    'cr',
    'cd',
    'eff',
    'res',
    'dac',
    'cp',
    'hpps',
    'ehp',
    'ehpps',
    'dmg',
    'dmgps',
    'mcdmg',
    'mcdmgps',
    'dmgh',
    'dmgd',
    'hmcdmgs',
    'dmcdmgs',
    'hdmg',
    'hdmgs',
    'ddmg',
    'ddmgs',
    's1',
    's2',
    's3',
    'score',
    'bs',
    'priority',
    // buildScore is now a real backend field (×100) — aggregate it so the heatmap colours it.
    'buildScore',
    'customScore',
    // Derived display columns — real fields stamped by decorateCalcFields().
    'finalSpeed',
    'spdEff',
  ];

  const count = heroStats.length;

  if (count === 0) {
    statsToAggregate.forEach((stat) => {
      currentAggregate[stat] = { max: 0, min: 0, sum: 0, avg: 0 };
    });
    return;
  }

  statsToAggregate.forEach((stat) => {
    const arrSum = (arr) => arr.reduce((a, b) => a + b[stat], 0);
    // G4: avoid Math.max/min spread on large arrays (call-stack overflow at ~500 rows)
    const vals = getField(heroStats, stat);
    let max = vals.reduce((m, v) => (v > m ? v : m), -Infinity);
    let min = vals.reduce((m, v) => (v < m ? v : m), Infinity);
    const sum = arrSum(heroStats);
    const avg = sum / count;

    if (stat === 'cr') {
      max = Math.min(100, max);
      min = Math.min(100, min);
    }
    if (stat === 'cd') {
      // Cap at the loaded hero's CD cap (350 + cdCapBonus) so the heatmap matches the
      // scoring cap and over-cap builds don't all collapse to the same maximum shade.
      max = Math.min(_loadedHeroCdCap, max);
      min = Math.min(_loadedHeroCdCap, min);
    }

    currentAggregate[stat] = {
      max: cleanInfinities(max),
      min: cleanInfinities(min),
      sum: cleanInfinities(sum),
      avg: cleanInfinities(avg),
    };
  });

  Log.debug('Aggregated', currentAggregate);
}

function cleanInfinities(num) {
  if (!Number.isFinite(num)) return 0;
  return num;
}

function getField(heroStats, stat) {
  return heroStats.map((x) => x[stat]);
}

function buildGrid(localeText) {
  const DIGITS_2 = 30;
  const DIGITS_3 = 34;
  const DIGITS_4 = 39;
  const DIGITS_5 = 45;
  const DIGITS_6 = 48;

  const gridOptions = {
    defaultColDef: {
      width: 50,
      sortable: true,
      resizable: true,
      sortingOrder: ['desc', 'asc'],
      cellDataType: false,
      cellStyle: columnGradient,
      cellClass: 'no-border',
    },

    columnDefs: [
      {
        headerName: i18next.t('sets'),
        field: 'sets',
        width: 80,
        cellRenderer: (params) =>
          GridRenderer.renderSets(params.value, 'shrinkSets'),
      },
      { headerName: i18next.t('atk'), field: 'atk', width: DIGITS_4 },
      { headerName: i18next.t('def'), field: 'def', width: DIGITS_4 },
      { headerName: i18next.t('hp'), field: 'hp', width: DIGITS_5 },
      { headerName: i18next.t('spd'), field: 'spd', width: DIGITS_3 },
      { headerName: i18next.t('cr'), field: 'cr', width: DIGITS_3 },
      { headerName: i18next.t('cd'), field: 'cd', width: DIGITS_3 },
      { headerName: i18next.t('eff'), field: 'eff', width: DIGITS_3 },
      { headerName: i18next.t('res'), field: 'res', width: DIGITS_3 },
      { headerName: i18next.t('cp'), field: 'cp', width: DIGITS_6 },
      { headerName: i18next.t('hps'), field: 'hpps', width: DIGITS_4 },
      { headerName: i18next.t('ehp'), field: 'ehp', width: DIGITS_6 },
      { headerName: i18next.t('ehps'), field: 'ehpps', width: DIGITS_5 },
      { headerName: i18next.t('dmg'), field: 'dmg', width: DIGITS_5 },
      { headerName: i18next.t('dmgs'), field: 'dmgps', width: DIGITS_4 },
      { headerName: i18next.t('mcd'), field: 'mcdmg', width: DIGITS_5 },
      {
        headerName: i18next.t('mcds'),
        field: 'mcdmgps',
        width: DIGITS_4,
      },
      { headerName: i18next.t('dmgh'), field: 'dmgh', width: DIGITS_5 },
      { headerName: i18next.t('dmgd'), field: 'dmgd', width: DIGITS_4 },
      {
        headerName: i18next.t('hmcdmgs'),
        field: 'hmcdmgs',
        width: DIGITS_4,
      },
      {
        headerName: i18next.t('dmcdmgs'),
        field: 'dmcdmgs',
        width: DIGITS_4,
      },
      { headerName: i18next.t('hdmg'), field: 'hdmg', width: DIGITS_5 },
      { headerName: i18next.t('hdmgs'), field: 'hdmgs', width: DIGITS_4 },
      { headerName: i18next.t('ddmg'), field: 'ddmg', width: DIGITS_5 },
      { headerName: i18next.t('ddmgs'), field: 'ddmgs', width: DIGITS_4 },
      { headerName: i18next.t('s1'), field: 's1', width: DIGITS_5 },
      { headerName: i18next.t('s2'), field: 's2', width: DIGITS_5 },
      { headerName: i18next.t('s3'), field: 's3', width: DIGITS_5 },
      {
        headerName: i18next.t('gs'),
        field: 'score',
        width: DIGITS_3,
        headerTooltip:
          'Gear Score — overall gear-quality rating (fixed weights; ignores your priorities/targets).',
      },
      {
        headerName: i18next.t('bs'),
        field: 'bs',
        width: DIGITS_3,
        headerTooltip:
          'Base Score — backend fixed-weight gear score; not affected by your priority sliders or targets.',
      },
      {
        headerName: i18next.t('prio'),
        field: 'priority',
        width: DIGITS_3,
        headerTooltip:
          'Priority (legacy) — sum of per-item priority (rounded). Superseded by Build Score (Bscr) for ranking; kept for reference.',
      },
      {
        headerName: i18next.t('bscr'),
        field: 'buildScore',
        width: DIGITS_3,
        headerTooltip:
          'Build Score — the authoritative ranking: per-slot/per-set-weighted gear value + stat-target bonus. Default sort and keep-best-N basis.',
        // The backend now sends the faithful build score (×100 of the displayed value):
        // per-slot/per-set-weighted gear value + stat-target bonus, the same number the
        // results are ranked and kept-best-N by.  Keep the raw ×100 value for
        // sort/aggregate/gradient consistency and divide only for display.  Old cached
        // result rows predate the field, so fall back to the frontend estimate (also ×100).
        valueGetter: (p) => {
          if (!p.data) return null;
          if (p.data.buildScore != null) return p.data.buildScore;
          if (!currentBaseStats) return null;
          return Math.round(
            PriorityFilter.calculateBuildScore(
              p.data,
              currentTargets,
              currentBaseStats,
            ) * 100,
          );
        },
        valueFormatter: (p) =>
          p.value === null || p.value === undefined
            ? ''
            : (p.value / 100).toFixed(1),
      },
      {
        headerName: i18next.t('mods'),
        colId: 'modCount',
        width: DIGITS_3,
        // Backend doesn't sort by this derived count (infinite row model), so display-only.
        sortable: false,
        headerTooltip:
          'Mods — number of PERMANENT substat modifications this build requires (count of modded pieces). 0 = no mods needed. Select a row to see exactly which pieces to mod.',
        valueGetter: (p) =>
          p.data && p.data.mods ? p.data.mods.filter(Boolean).length : 0,
        cellStyle: (p) =>
          p.value > 0 ? { color: '#e0a23a', fontWeight: '600' } : null,
      },
      {
        headerName: 'Cust',
        field: 'customScore',
        width: DIGITS_3,
        headerTooltip:
          'Custom Score — backend score from the global priority sliders only (ignores per-slot/per-set matrices and targets).',
      },
      { headerName: i18next.t('eq'), field: 'eq', width: DIGITS_2 },
      {
        headerName: i18next.t('upg'),
        field: 'upgrades',
        width: DIGITS_2,
      },
      {
        headerName: 'FSpd',
        field: 'finalSpeed',
        width: DIGITS_5,
        headerTooltip:
          'Final Speed = Speed / (1 - CR Push%). Effective speed after a combat-readiness push; set the push % in the CR Push box.',
      },
      {
        headerName: 'SpdEff',
        field: 'spdEff',
        width: DIGITS_5,
        headerTooltip:
          'SpdEff = Speed + Effectiveness x weight (Eff wt box, default 0.5). A speed-first score that also values effectiveness for debuffers.',
      },
      {
        headerName: i18next.t(''),
        field: 'property',
        width: 25,
        sortable: false,
        cellRenderer: (params) => GridRenderer.renderStar(params.value),
      },
    ],
    rowHeight: 27,
    rowModelType: 'infinite',
    rowSelection: {
      mode: 'multiRow',
      enableSelectionWithoutKeys: true,
      headerCheckbox: false,
    },
    onRowClicked,
    onRowSelected,
    pagination: true,
    paginationPageSize: 500,
    paginationPageSizeSelector: false,
    localeText,
    cacheBlockSize: 500,
    maxBlocksInCache: 1,
    suppressPaginationPanel: false,
    datasource,
    suppressScrollOnNewData: true,
    onCellMouseOver: cellMouseOver,
    onCellMouseOut: cellMouseOut,
    suppressCellFocus: true,
    navigateToNextCell: GridRenderer.arrowKeyNavigator(this, 'optimizerGrid'),
    suppressDragLeaveHidesColumns: true,
  };

  const gridDiv = document.getElementById('myGrid');
  optimizerGrid = createGridCompat(gridDiv, gridOptions);
}

function getTargetProgressBarStyle(colId, value, params) {
  const targetKey = STAT_TARGET_MAP[colId];
  if (!targetKey || params.node?.rowPinned) return undefined;

  const targetEl = document.getElementById(targetKey);
  const target = targetEl ? Number.parseFloat(targetEl.value) || 0 : 0;
  if (target <= 0) return undefined;

  const ratio = value / target;
  let barColor;
  if (ratio >= 1) {
    barColor = 'rgba(76, 175, 80, 0.55)'; // green — target met
  } else if (ratio >= 0.9) {
    barColor = 'rgba(220, 180, 40, 0.65)'; // yellow — within 10%
  } else {
    barColor = 'rgba(220, 80, 60, 0.55)'; // red — below 90%
  }
  const barPct = Math.min(100, Math.round(ratio * 100));
  return {
    background: `linear-gradient(to right, ${barColor} ${barPct}%, transparent ${barPct}%)`,
  };
}

function columnGradient(params) {
  try {
    if (params?.value === undefined) return undefined;
    const { colId } = params.column;
    const { value } = params;

    // Target-aware progress bar coloring — read directly from DOM so
    // restored-results mode and live target edits are always current.
    const targetStyle = getTargetProgressBarStyle(colId, value, params);
    if (targetStyle) return targetStyle;

    const agg = currentAggregate[colId];
    if (!agg) return undefined;

    // G6: aggregate caps CR at 100 (and CD at the hero's cap) for coloring; clamp the
    // cell value to match so over-cap items don't all collapse to the same max shade.
    let gradientValue = value;
    if (colId === 'cr') gradientValue = Math.min(100, value);
    else if (colId === 'cd') gradientValue = Math.min(_loadedHeroCdCap, value);
    let percent =
      agg.max === agg.min ? 1 : (gradientValue - agg.min) / (agg.max - agg.min);
    percent = Math.min(1, Math.max(0, percent));

    let color = gradient.gradient.rgbAt(percent);
    if (agg.min === 0 && agg.max === 0) {
      color = gradient.gradient.rgbAt(0.5);
    }

    return {
      backgroundColor: color.toHexString(),
    };
  } catch (e) {
    Log.error(e);
    return undefined;
  }
}

function onRowSelected(event) {
  // Preview drawing is handled in onRowClicked for direct clicks.
  // This only fires for programmatic multi-select (Ctrl+click adds rows).
  if (!event.node.isSelected() || event.rowPinned === 'top') return;
  if (event.source === 'rowClicked') return; // already handled below
  selectedRow = event.data;
  StatPreview.draw(pinnedRow, selectedRow);
  const gearIds = getSelectedGearIds();
  const mods = getSelectedGearMods();
  OptimizerTab.drawPreview(gearIds, mods);
}

function onRowClicked(event) {
  if (!event.data) return;

  if (event.rowPinned === 'top') {
    selectedRow = event.data;
    StatPreview.draw(pinnedRow, selectedRow);
    optimizerGrid.gridOptions.api.deselectAll();
    const eq = event.data?.equipment ?? {};
    const gearIds = [
      eq.Weapon?.id,
      eq.Helmet?.id,
      eq.Armor?.id,
      eq.Necklace?.id,
      eq.Ring?.id,
      eq.Boots?.id,
    ];
    OptimizerTab.drawPreview(gearIds, []);
    return;
  }

  // Explicitly set selection — infinite row model doesn't reliably auto-select on click
  event.node.setSelected(true, true);
  selectedRow = event.data;
  StatPreview.draw(pinnedRow, selectedRow);
  // DEBUG: log this build's buildScore breakdown to the console (DevTools) so the
  // per-stat scoring — and the speed base/set/gear split — is visible on each click.
  // Gated behind window.__optDebug so it doesn't recompute the score on every click.
  try {
    if (
      window.__optDebug &&
      currentBaseStats &&
      PriorityFilter.calculateBuildScore
    ) {
      PriorityFilter.calculateBuildScore(
        event.data,
        currentTargets,
        currentBaseStats,
        true,
      );
    }
  } catch (e) {
    Log.warn('[bscr debug] breakdown failed:', e);
  }
  const gearIds = getSelectedGearIds();
  const mods = getSelectedGearMods();
  OptimizerTab.drawPreview(gearIds, mods);
}

function cellMouseOver(event) {
  const row = event.data;
  if (!row) return;

  StatPreview.draw(pinnedRow, row);
}

function cellMouseOut() {
  const row = selectedRow;
  if (!row) return;

  StatPreview.draw(pinnedRow, row);
}

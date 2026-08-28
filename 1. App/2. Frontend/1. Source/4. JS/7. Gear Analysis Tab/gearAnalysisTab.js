(function () {
  'use strict';

  const EMPTY_GEAR_SCORER = {
    OFFICIAL_ARCHETYPE_KEYS: [],
    UNOFFICIAL_ARCHETYPE_KEYS: [],
    ALL_ARCHETYPE_KEYS: [],
    POTENTIAL_ARCHETYPES: new Set(),
    scoreAllItems: () => [],
  };

  // Stat type ↔ short label mappings used by bulk mod-target helpers
  const _GA_MOD_STATS = [
    { type: 'HealthPercent', label: 'HP%' },
    { type: 'Health', label: 'HP' },
    { type: 'AttackPercent', label: 'Atk%' },
    { type: 'Attack', label: 'Atk' },
    { type: 'DefensePercent', label: 'Def%' },
    { type: 'Defense', label: 'Def' },
    { type: 'Speed', label: 'Spd' },
    { type: 'CriticalHitChancePercent', label: 'CC%' },
    { type: 'CriticalHitDamagePercent', label: 'CD%' },
    { type: 'EffectivenessPercent', label: 'EFF%' },
    { type: 'EffectResistancePercent', label: 'ER%' },
  ];
  const _GA_TYPE_FROM_LBL = Object.fromEntries(
    _GA_MOD_STATS.map((s) => [s.label, s.type]),
  );
  const _GA_LABEL_FROM_TYPE = Object.fromEntries(
    _GA_MOD_STATS.map((s) => [s.type, s.label]),
  );

  // The "focus stat" each potential archetype wants to PROTECT (disable from modding)
  const _FOCUS_STAT_BY_ARCH = {
    'Top Speed': new Set(['Speed']),
    'HP Focus': new Set(['HealthPercent', 'Health']),
    'Attack Focus': new Set(['AttackPercent', 'Attack']),
    'Effectiveness Focus': new Set(['EffectivenessPercent']),
    'Effect Resist Focus': new Set(['EffectResistancePercent']),
    'Crit Chance Focus': new Set(['CriticalHitChancePercent']),
  };

  let _warnedMissingGearScorer = false;

  function getGearScorer() {
    if (globalThis.GearScorer) return globalThis.GearScorer;
    if (!_warnedMissingGearScorer) {
      _warnedMissingGearScorer = true;
      Log.warn(
        '[GearAnalysis] GearScorer is unavailable; using safe fallback. Check script load order.',
      );
    }
    return EMPTY_GEAR_SCORER;
  }

  // ── State ─────────────────────────────────────────────────────────────────

  let _scored = [];
  let _sortCol = 'gs';
  let _sortAsc = false;
  let _searchText = '';
  let _useReforged = true;
  // 'official' | 'unofficial' | 'all'
  let _archetypeSet = 'all';
  // Which archetypes are visible (checked in the column menu)
  let _visibleArchetypes = new Set();
  let _initializedVisibleArchetypes = false;
  // Advanced filters
  let _slotFilter = new Set([
    'Weapon',
    'Helmet',
    'Armor',
    'Necklace',
    'Ring',
    'Boots',
  ]);
  let _rankFilter = new Set(['Epic', 'Heroic', 'Rare', 'Good', 'Normal']);
  let _enhanceFilter = new Set(); // empty = show all; add values to restrict to only those
  let _lockFilter = 'all'; // 'all' | 'locked' | 'storage' | 'unlocked'
  let _archFilter = ''; // '' = no filter | archetype name string
  let _showBreakdown = false;

  // Render is debounced so rapid filter changes don't each trigger a full rebuild
  let _renderTimer = null;
  // Stores the last rendered rows so the delegated tbody click can look up item+score by index
  let _lastRenderedRows = [];

  // HTML-escape helper — required when injecting untrusted strings via innerHTML
  function _esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  let _headerDirty = true; // rebuild header only when archetype set/visibility changes
  const ROW_RENDER_LIMIT = 2000; // cap DOM rows for performance

  // Cached DOM refs — populated once in init() so renderTable never re-queries the DOM
  const _dom = {
    tbody: null,
    countEl: null,
    tableWrap: null,
    breakdownEl: null,
    thead: null,
    totalEl: null,
    modal: null,
    modalPreview: null,
    modalTitle: null,
    modalAnalysis: null,
  };
  // Cached button/checkbox collections — populated once in init()
  let _slotBtns = [];
  let _enhBtns = [];

  function scheduleRender() {
    if (_renderTimer) clearTimeout(_renderTimer);
    _renderTimer = setTimeout(renderTable, 60);
  }

  // Repopulates the archetype filter dropdown to match the current active key set.
  // Resets _archFilter if the selected archetype is no longer in the active set.
  // Safe no-op when the dropdown element is absent.
  function _buildArchFilterDropdown() {
    const archSelect = document.getElementById('ga-arch-filter');
    if (!archSelect) return;

    const activeKeys = getActiveKeys();
    archSelect.innerHTML = '<option value="">All archetypes</option>';
    activeKeys.forEach((arch) => {
      const opt = document.createElement('option');
      opt.value = arch;
      opt.textContent = arch;
      archSelect.appendChild(opt);
    });

    // Drop stale selection — arch may not exist in the new set
    if (_archFilter && !activeKeys.includes(_archFilter)) {
      _archFilter = '';
    }
    archSelect.value = _archFilter;
  }

  function _resetAllFilters() {
    const ALL_SLOTS = [
      'Weapon',
      'Helmet',
      'Armor',
      'Necklace',
      'Ring',
      'Boots',
    ];
    const ALL_RANKS = ['Epic', 'Heroic', 'Rare', 'Good', 'Normal'];

    ALL_SLOTS.forEach((s) => _slotFilter.add(s));
    ALL_RANKS.forEach((r) => _rankFilter.add(r));
    _enhanceFilter.clear();
    _lockFilter = 'all';
    _archFilter = '';
    _searchText = '';

    // Sync slot buttons
    _slotBtns.forEach((b) => {
      const s = b.dataset.slot;
      b.classList.toggle('active', s === 'All' ? true : _slotFilter.has(s));
    });
    // Sync rank checkboxes
    document.querySelectorAll('.ga-rank-cb').forEach((cb) => {
      cb.checked = ALL_RANKS.includes(cb.dataset.rank);
    });
    // Sync enhance buttons
    _enhBtns.forEach((b) => b.classList.remove('active'));
    // Sync lock dropdown
    const lockSelect = document.getElementById('ga-lock-filter');
    if (lockSelect) lockSelect.value = 'all';
    // Sync arch dropdown
    const archSelect = document.getElementById('ga-arch-filter');
    if (archSelect) archSelect.value = '';
    // Sync search input
    const searchEl = document.getElementById('gearAnalysisSearch');
    if (searchEl) searchEl.value = '';

    scheduleRender();
  }

  const SLOT_ORDER = ['Weapon', 'Helmet', 'Armor', 'Necklace', 'Ring', 'Boots'];
  const RANK_COLORS = {
    Epic: '#00bcd4',
    Heroic: '#3f51b5',
    Rare: '#9c27b0',
    Good: '#4caf50',
    Normal: '#9e9e9e',
  };
  const RANK_ORDER = { Epic: 5, Heroic: 4, Rare: 3, Good: 2, Normal: 1 };

  // ── Helpers ───────────────────────────────────────────────────────────────

  function getMainStatDisplay(item) {
    if (!item.main) return '';
    const type =
      typeof item.main === 'object' ? (item.main.type ?? '') : item.main;
    return type
      .replace('AttackPercent', 'Atk%')
      .replace('DefensePercent', 'Def%')
      .replace('HealthPercent', 'HP%')
      .replace('CriticalHitChancePercent', 'CC%')
      .replace('CriticalHitDamagePercent', 'CD%')
      .replace('EffectResistancePercent', 'ER%')
      .replace('EffectivenessPercent', 'EFF%')
      .replace('Attack', 'Atk')
      .replace('Defense', 'Def')
      .replace('Speed', 'Spd');
  }

  function getSetDisplay(item) {
    const raw = item.set ?? '';
    return raw.endsWith('Set') ? raw.slice(0, -3) : raw;
  }

  const GEAR_ICON_BY_SLOT = {
    Weapon: './assets/gearweapon.png',
    Helmet: './assets/gearhelmet.png',
    Armor: './assets/geararmor.png',
    Necklace: './assets/gearnecklace.png',
    Ring: './assets/gearring.png',
    Boots: './assets/gearboots.png',
  };

  const STAT_ICON_BY_TYPE = {
    AttackPercent: './assets/statatkpercent_dt.png',
    Attack: './assets/statatk_dt.png',
    DefensePercent: './assets/statdefpercent_dt.png',
    Defense: './assets/statdef_dt.png',
    HealthPercent: './assets/stathppercent_dt.png',
    Health: './assets/stathp_dt.png',
    Speed: './assets/statspd_dt.png',
    CriticalHitChancePercent: './assets/statcr_dt.png',
    CriticalHitDamagePercent: './assets/statcd_dt.png',
    EffectivenessPercent: './assets/stateff_dt.png',
    EffectResistancePercent: './assets/statres_dt.png',
  };

  const SET_ICON_BY_NAME = {
    HealthSet: './assets/sethealth.png',
    DefenseSet: './assets/setdefense.png',
    AttackSet: './assets/setattack.png',
    SpeedSet: './assets/setspeed.png',
    CriticalSet: './assets/setcritical.png',
    HitSet: './assets/sethit.png',
    DestructionSet: './assets/setdestruction.png',
    LifestealSet: './assets/setlifesteal.png',
    CounterSet: './assets/setcounter.png',
    ResistSet: './assets/setresist.png',
    UnitySet: './assets/setunity.png',
    RageSet: './assets/setrage.png',
    ImmunitySet: './assets/setimmunity.png',
    RevengeSet: './assets/setrevenge.png',
    InjurySet: './assets/setinjury.png',
    PenetrationSet: './assets/setpenetration.png',
    ProtectionSet: './assets/setprotection.png',
    TorrentSet: './assets/settorrent.png',
    ReversalSet: './assets/setreversal.png',
    RiposteSet: './assets/setriposte.png',
    WarfareSet: './assets/setwarfare.png',
    PursuitSet: './assets/setpursuit.png',
    FervorSet: './assets/setfervor.png',
    WeakeningSet: './assets/setweakening.png',
  };

  function makeIconNode(iconPath, alt, size = 16) {
    if (!iconPath) return null;
    const img = document.createElement('img');
    img.src = iconPath;
    img.alt = alt;
    img.title = alt;
    img.style.cssText = `width:${size}px;height:${size}px;object-fit:contain;vertical-align:middle;`;
    return img;
  }

  function getThemeIcon(lightPath, darkPath) {
    const isDark = !!globalThis.DarkMode?.isDark?.();
    return isDark ? (darkPath ?? lightPath) : lightPath;
  }

  function makeIconLabelNode(label, iconPath, alt = label, size = 16) {
    const wrapper = document.createElement('span');
    wrapper.style.cssText = 'display:inline-flex;align-items:center;gap:5px;';
    const icon = makeIconNode(iconPath, alt, size);
    if (icon) wrapper.appendChild(icon);
    const text = document.createElement('span');
    text.textContent = label;
    wrapper.appendChild(text);
    return wrapper;
  }

  const STAT_SHORT = {
    AttackPercent: 'Atk%',
    Attack: 'Atk',
    DefensePercent: 'Def%',
    Defense: 'Def',
    HealthPercent: 'HP%',
    Health: 'HP',
    CriticalHitChancePercent: 'CC%',
    CriticalHitDamagePercent: 'CD%',
    EffectivenessPercent: 'EFF%',
    EffectResistancePercent: 'ER%',
    Speed: 'Spd',
  };

  const PERCENT_STATS = new Set([
    'AttackPercent',
    'DefensePercent',
    'HealthPercent',
    'CriticalHitChancePercent',
    'CriticalHitDamagePercent',
    'EffectivenessPercent',
    'EffectResistancePercent',
  ]);

  function statLabel(type) {
    return STAT_SHORT[type] ?? type;
  }

  function getReforgeBonus(statType, rolls) {
    const table = (globalThis.ITEM_REFORGE_TABLES ?? {})[
      (globalThis.ITEM_REFORGE_STAT_MAP ?? {})[statType]
    ];
    if (!table || rolls <= 0) return 0;
    return table[Math.min(rolls - 1, table.length - 1)] ?? 0;
  }

  function getDisplayedSubstatValue(item, sub, useReforged) {
    const base = sub?.value ?? 0;
    if (!useReforged) return base;
    if (sub?.reforgedValue !== undefined) return sub.reforgedValue;
    if (
      globalThis.Reforge?.isReforgeable
        ? globalThis.Reforge.isReforgeable(item)
        : (item?.level ?? 0) === 85
    ) {
      return base + getReforgeBonus(sub?.type, sub?.rolls ?? 1);
    }
    return base;
  }

  function statValStr(item, sub, useReforged) {
    const base = sub.value ?? 0;
    const reforged = getDisplayedSubstatValue(item, sub, useReforged);
    const pct = PERCENT_STATS.has(sub.type) ? '%' : '';
    if (useReforged && reforged !== base) {
      return `${base}${pct}→${reforged}${pct}`;
    }
    return `${useReforged ? reforged : base}${pct}`;
  }

  function gsColor(gs) {
    if (gs >= 20) return '#4caf50';
    if (gs >= 14) return '#8bc34a';
    if (gs >= 8) return '#ffc107';
    if (gs > 0) return '#f44336';
    return '#555';
  }

  /** Returns the active archetype keys for the current set tab. */
  function getActiveKeys() {
    if (_archetypeSet === 'official')
      return getGearScorer().OFFICIAL_ARCHETYPE_KEYS;
    if (_archetypeSet === 'unofficial')
      return getGearScorer().UNOFFICIAL_ARCHETYPE_KEYS;
    return getGearScorer().ALL_ARCHETYPE_KEYS;
  }

  /** Get the score sub-object for a given archetype in the current set mode. */
  function getArchScore(score, arch) {
    if (_archetypeSet === 'official') return score.official;
    if (_archetypeSet === 'unofficial') return score.unofficial;
    // 'all': Future is official-only; Focus archetypes are unofficial-only; rest use unofficial
    const gs = getGearScorer();
    if (
      gs.OFFICIAL_ARCHETYPE_KEYS.includes(arch) &&
      !gs.UNOFFICIAL_ARCHETYPE_KEYS.includes(arch)
    ) {
      return score.official;
    }
    return score.unofficial;
  }

  // ── Filtering / Sorting ───────────────────────────────────────────────────

  function filterAndSort() {
    const q = _searchText.toLowerCase();
    let rows = _scored;

    // Slot filter
    rows = rows.filter(({ item }) => _slotFilter.has(item.gear ?? ''));

    // Rank filter
    rows = rows.filter(({ item }) => _rankFilter.has(item.rank ?? 'Epic'));

    // Enhance filter: empty = all shown; non-empty = show only selected tiers
    if (_enhanceFilter.size > 0) {
      rows = rows.filter(({ item }) => _enhanceFilter.has(item.enhance ?? 0));
    }

    // Lock/storage filter
    if (_lockFilter === 'locked') {
      rows = rows.filter(({ item }) => item.locked === true);
    } else if (_lockFilter === 'storage') {
      rows = rows.filter(({ item }) => item.storage === true);
    } else if (_lockFilter === 'unlocked') {
      rows = rows.filter(({ item }) => !item.locked && !item.storage);
    }

    // Archetype "must score" filter
    if (_archFilter) {
      rows = rows.filter(({ score }) => {
        const s = getArchScore(score, _archFilter);
        return (
          s.valid[_archFilter] === true && (s.nonModGS[_archFilter] ?? 0) > 0
        );
      });
    }

    // Text search
    if (q) {
      rows = rows.filter(({ item }) => {
        const slot = (item.gear ?? '').toLowerCase();
        const set = getSetDisplay(item).toLowerCase();
        const hero = (item.heroName ?? '').toLowerCase();
        const main = getMainStatDisplay(item).toLowerCase();
        return (
          slot.includes(q) ||
          set.includes(q) ||
          hero.includes(q) ||
          main.includes(q)
        );
      });
    }

    rows = [...rows].sort((a, b) => {
      let va, vb;
      if (_sortCol === 'gs') {
        va = a.score.gs;
        vb = b.score.gs;
      } else if (_sortCol === 'slot') {
        va = SLOT_ORDER.indexOf(a.item.gear ?? '');
        vb = SLOT_ORDER.indexOf(b.item.gear ?? '');
      } else if (_sortCol === 'enhance') {
        va = a.item.enhance ?? 0;
        vb = b.item.enhance ?? 0;
      } else if (_sortCol === 'hero') {
        va = a.item.heroName ?? '';
        vb = b.item.heroName ?? '';
      } else if (_sortCol === 'gsPerRoll') {
        va = a.score.gsPerRoll ?? 0;
        vb = b.score.gsPerRoll ?? 0;
      } else if (_sortCol === 'gs15') {
        va = a.score.gs15 ?? 0;
        vb = b.score.gs15 ?? 0;
      } else if (_sortCol === 'offCPower') {
        va = a.score.official.cPower?.score ?? 0;
        vb = b.score.official.cPower?.score ?? 0;
      } else if (_sortCol === 'offAPower') {
        va = a.score.official.aPower?.score ?? 0;
        vb = b.score.official.aPower?.score ?? 0;
      } else if (_sortCol === 'unoffCPower') {
        va = a.score.unofficial.cPower?.score ?? 0;
        vb = b.score.unofficial.cPower?.score ?? 0;
      } else if (_sortCol === 'unoffAPower') {
        va = a.score.unofficial.aPower?.score ?? 0;
        vb = b.score.unofficial.aPower?.score ?? 0;
      } else if (_sortCol === 'set') {
        va = getSetDisplay(a.item);
        vb = getSetDisplay(b.item);
      } else if (_sortCol === 'main') {
        va = getMainStatDisplay(a.item);
        vb = getMainStatDisplay(b.item);
      } else if (_sortCol === 'level') {
        va = a.item.level ?? 0;
        vb = b.item.level ?? 0;
      } else if (_sortCol === 'rank') {
        va = RANK_ORDER[a.item.rank ?? 'Epic'] ?? 0;
        vb = RANK_ORDER[b.item.rank ?? 'Epic'] ?? 0;
      } else if (_sortCol === 'totalRolls') {
        va = (a.item.substats ?? []).reduce(
          (s, sub) => s + (sub?.rolls ?? 0),
          0,
        );
        vb = (b.item.substats ?? []).reduce(
          (s, sub) => s + (sub?.rolls ?? 0),
          0,
        );
      } else if (_sortCol === 'speedPot') {
        va = a.score.speedPotential ?? 0;
        vb = b.score.speedPotential ?? 0;
      } else if (_sortCol === 'modified') {
        va = (a.item.substats ?? []).some((s) => s?.modified) ? 1 : 0;
        vb = (b.item.substats ?? []).some((s) => s?.modified) ? 1 : 0;
      } else if (_sortCol === 'storage') {
        va = a.item.storage ? 1 : 0;
        vb = b.item.storage ? 1 : 0;
      } else {
        // Archetype column — sort by Mod GS (highest value after modification)
        const sa = getArchScore(a.score, _sortCol);
        const sb = getArchScore(b.score, _sortCol);
        va = sa?.modGS?.[_sortCol] ?? sa?.nonModGS?.[_sortCol] ?? 0;
        vb = sb?.modGS?.[_sortCol] ?? sb?.nonModGS?.[_sortCol] ?? 0;
      }
      if (typeof va === 'string' && typeof vb === 'string') {
        const cmp = va.localeCompare(vb);
        return _sortAsc ? cmp : -cmp;
      }
      if (va < vb) return _sortAsc ? -1 : 1;
      if (va > vb) return _sortAsc ? 1 : -1;
      return 0;
    });

    return rows;
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  function buildHeaderRow() {
    if (!_headerDirty) return;
    _headerDirty = false;

    const thead = _dom.thead;
    if (!thead) return;
    thead
      .querySelectorAll('th[data-arch], th[data-power], th[data-hero]')
      .forEach((th) => th.remove());

    const thStyle =
      'cursor:pointer;white-space:nowrap;padding:8px 10px;border-bottom:2px solid var(--inactive-color,#aaa);text-align:center;font-size:13px;';

    // Power summary columns
    [
      { col: 'offCPower', label: 'Off. C.Power' },
      { col: 'offAPower', label: 'Off. A.Power' },
      { col: 'unoffCPower', label: 'UOff. C.Power' },
      { col: 'unoffAPower', label: 'UOff. A.Power' },
    ].forEach(({ col, label }) => {
      const th = document.createElement('th');
      th.dataset.col = col;
      th.dataset.power = '1';
      th.style.cssText =
        thStyle + 'border-left:1px solid var(--inactive-color,#aaa);';
      th.textContent = label;
      th.title = `Sort by ${label} | Estimated — best individual mod improvement per archetype`;
      th.addEventListener('click', () => handleSort(col));
      thead.appendChild(th);
    });

    const gs = getGearScorer();
    const offSet = new Set(gs.OFFICIAL_ARCHETYPE_KEYS);
    const unoffSet = new Set(gs.UNOFFICIAL_ARCHETYPE_KEYS);
    const showAllBadge = _archetypeSet === 'all';

    getActiveKeys().forEach((arch) => {
      if (!_visibleArchetypes.has(arch)) return;
      const inOff = offSet.has(arch);
      const inUnoff = unoffSet.has(arch);

      // Color-code by rule-set when in "All" mode
      let borderColor = '';
      let badge = '';
      if (showAllBadge) {
        if (inOff && !inUnoff) {
          borderColor = '#ffc107';
          badge = ' [O]';
        } else if (!inOff && inUnoff) {
          borderColor = '#9c27b0';
          badge = ' [U]';
        } else {
          borderColor = '#4caf50';
        }
      }

      const th = document.createElement('th');
      th.dataset.col = arch;
      th.dataset.arch = '1';
      th.style.cssText =
        thStyle + (borderColor ? `border-top:3px solid ${borderColor};` : '');
      th.textContent = arch + badge;
      th.title = showAllBadge
        ? `${arch} — ${inOff && !inUnoff ? 'Official only' : !inOff && inUnoff ? 'Unofficial only' : 'Both rule sets'} | Sort by Mod GS`
        : `Sort by ${arch} Mod GS`;
      th.addEventListener('click', () => handleSort(arch));
      thead.appendChild(th);
    });

    const heroTh = document.createElement('th');
    heroTh.dataset.col = 'hero';
    heroTh.dataset.hero = '1';
    heroTh.style.cssText =
      thStyle +
      'text-align:left;border-left:1px solid var(--inactive-color,#aaa);';
    heroTh.textContent = 'Equipped';
    heroTh.title = 'Sort by Equipped';
    heroTh.addEventListener('click', () => handleSort('hero'));
    thead.appendChild(heroTh);
  }

  // ── innerHTML row-cell helpers ─────────────────────────────────────────────

  function _substatsCellHtml(item, useReforged) {
    let h =
      '<td style="padding:5px 10px;vertical-align:top;white-space:nowrap;">';
    for (const sub of item.substats ?? []) {
      if (!sub || !sub.type) continue;
      const icon = STAT_ICON_BY_TYPE[sub.type];
      const lbl = statLabel(sub.type);
      const val = statValStr(item, sub, useReforged);
      const isRf =
        useReforged &&
        getDisplayedSubstatValue(item, sub, useReforged) !== sub.value;
      const imgH = icon
        ? `<img src="${_esc(icon)}" alt="${_esc(lbl)}" style="width:12px;height:12px;object-fit:contain;vertical-align:middle;" />`
        : '';
      h += `<div style="line-height:1.55;font-size:13px;">`;
      h += `<span class="ga-stat-name" style="display:inline-flex;align-items:center;min-width:34px;">${imgH} ${_esc(lbl)}</span>`;
      h += `<span class="${isRf ? 'ga-stat-reforged' : 'ga-stat-value'}"> ${_esc(val)}</span>`;
      h += sub.rolls ? `<span class="ga-stat-roll"> [${sub.rolls}]</span>` : '';
      h += '</div>';
    }
    return h + '</td>';
  }

  function _powerColHtml(pwrData, label) {
    const base =
      'text-align:center;padding:5px 8px;vertical-align:middle;min-width:70px;border-left:1px solid var(--border-color,#444);';
    if (!pwrData || pwrData.score <= 0)
      return `<td style="${base}" class="ga-arch-invalid">—</td>`;
    const modH = pwrData.hasMod
      ? `<div class="ga-mod-gain" style="line-height:1.3;">${pwrData.modScore} (+${pwrData.gain})</div>`
      : `<div class="ga-mod-none" style="line-height:1.3;">—</div>`;
    const tip = pwrData.hasMod
      ? `${label}: ${pwrData.score} | Mod: ${pwrData.modScore} (+${pwrData.gain})`
      : `${label}: ${pwrData.score}`;
    return `<td style="${base}" title="${_esc(tip)}"><div style="font-weight:bold;color:${gsColor(pwrData.score)};font-size:14px;line-height:1.4;">${pwrData.score}</div>${modH}</td>`;
  }

  function _archColHtml(
    arch,
    archScore,
    potentialArchs,
    substatCount,
    extraNote = '',
  ) {
    const base = 'text-align:center;padding:5px 8px;vertical-align:middle;';
    if (!archScore || !archScore.valid[arch])
      return `<td style="${base}" class="ga-arch-invalid">—</td>`;
    const nm = archScore.nonModGS[arch] ?? 0;
    if (potentialArchs?.has(arch)) {
      if (nm <= 0) return `<td style="${base}" class="ga-arch-invalid">—</td>`;
      return `<td style="${base}" title="${_esc(arch + ': ' + nm + extraNote)}"><div style="font-size:14px;font-weight:bold;line-height:1.4;">${nm}</div></td>`;
    }
    const mod = archScore.modGS[arch] ?? 0;
    const hint = archScore.modHint[arch] ?? '';
    const gain = mod - nm;
    if (nm <= 0 && gain <= 0)
      return `<td style="${base}" class="ga-arch-invalid">—</td>`;
    const mc = archScore.matchCount?.[arch] ?? 0;
    const modH =
      gain > 0
        ? `<div class="ga-mod-gain" style="line-height:1.3;">${mod} (+${gain})</div>`
        : `<div class="ga-mod-none" style="line-height:1.3;">—</div>`;
    const hintH =
      hint && gain > 0
        ? `<div class="ga-mod-hint" style="line-height:1.2;white-space:pre-line;">${_esc(hint)}</div>`
        : '';
    const matchLine =
      substatCount != null ? `${mc}/${substatCount} matching substats\n` : '';
    const tip =
      gain > 0
        ? `${matchLine}NM: ${nm} | Mod: ${mod} (+${gain})${hint ? '\n' + hint : ''}${extraNote}`
        : `${matchLine}NM: ${nm} (no mod improvement)${extraNote}`;
    return `<td style="${base}" title="${_esc(tip)}"><div style="font-weight:${nm >= 8 ? 'bold' : 'normal'};color:${gsColor(nm)};font-size:14px;line-height:1.4;">${nm}</div>${modH}${hintH}</td>`;
  }

  function renderTable() {
    // Breakdown mode — swap to pivot view
    const breakdownEl = _dom.breakdownEl;
    const tableWrap = _dom.tableWrap;
    if (_showBreakdown) {
      if (tableWrap) tableWrap.style.display = 'none';
      if (breakdownEl) {
        breakdownEl.style.display = '';
        buildBreakdown(filterAndSort());
      }
      return;
    }
    if (tableWrap) tableWrap.style.display = '';
    if (breakdownEl) breakdownEl.style.display = 'none';

    buildHeaderRow();

    const tbody = _dom.tbody;
    if (!tbody) return;

    const allRows = filterAndSort();
    const rows =
      allRows.length > ROW_RENDER_LIMIT
        ? allRows.slice(0, ROW_RENDER_LIMIT)
        : allRows;

    // Store for delegated click handler
    _lastRenderedRows = rows;

    // Hoist loop-invariant values
    const gs = getGearScorer();
    const activeKeys = getActiveKeys();
    const potentialArchs = gs.POTENTIAL_ARCHETYPES;

    // Precompute per-archetype score accessor to avoid repeated Array.includes() inside the row loop
    let _archScoreFn;
    if (_archetypeSet === 'official') {
      _archScoreFn = (s, _arch) => s.official;
    } else if (_archetypeSet === 'unofficial') {
      _archScoreFn = (s, _arch) => s.unofficial;
    } else {
      const _officialOnlyKeys = new Set(
        (gs.OFFICIAL_ARCHETYPE_KEYS ?? []).filter(
          (k) => !(gs.UNOFFICIAL_ARCHETYPE_KEYS ?? []).includes(k),
        ),
      );
      _archScoreFn = (s, arch) =>
        _officialOnlyKeys.has(arch) ? s.official : s.unofficial;
    }

    // Build entire tbody as an HTML string — ~50× faster than createElement per cell
    const parts = new Array(rows.length);
    for (let i = 0; i < rows.length; i++) {
      const { item, score } = rows[i];

      const lvl = item.level ?? 0;
      const lvlColor = lvl >= 90 ? '#9c27b0' : lvl >= 85 ? '#ff9800' : '';
      const rankVal = item.rank ?? 'Epic';
      const slot = item.gear ?? '';
      const mainType =
        typeof item.main === 'object' && item.main
          ? (item.main.type ?? '')
          : (item.main ?? '');
      const mainText = getMainStatDisplay(item);
      const setDisp = getSetDisplay(item);
      const speedPot = score.speedPotential ?? 0;
      const totalRolls = (item.substats ?? []).reduce(
        (s, sub) => s + (sub?.rolls ?? 0),
        0,
      );
      const modSub = (item.substats ?? []).find((s) => s?.modified === true);
      const rowCls = (score.gs ?? 0) > 0 ? 'ga-row-scored' : 'ga-row-unscored';

      // Slot cell icons
      const slotImg = GEAR_ICON_BY_SLOT[slot] ?? '';
      const lockImg = item.locked
        ? getThemeIcon('./assets/lock.png', './assets/lock_dt.png')
        : '';
      const lockH = lockImg
        ? `<img src="${_esc(lockImg)}" alt="Locked" style="width:12px;height:12px;object-fit:contain;vertical-align:middle;margin-right:3px;">`
        : '';
      const slotH = slotImg
        ? `<img src="${_esc(slotImg)}" alt="${_esc(slot)}" style="width:14px;height:14px;object-fit:contain;vertical-align:middle;"> `
        : '';

      // Set cell
      const setImg = SET_ICON_BY_NAME[item.set ?? ''] ?? '';
      const setH = setImg
        ? `<img src="${_esc(setImg)}" alt="${_esc(setDisp)}" style="width:14px;height:14px;object-fit:contain;vertical-align:middle;"> `
        : '';

      // Main stat
      const mainImg = STAT_ICON_BY_TYPE[mainType] ?? '';
      const mainH = mainImg
        ? `<img src="${_esc(mainImg)}" alt="${_esc(mainText)}" style="width:14px;height:14px;object-fit:contain;vertical-align:middle;"> `
        : '';

      // Modified cell
      const modCellH = modSub
        ? `<td style="text-align:center;padding:6px 6px;font-size:12px;color:#9be7ff;text-shadow:0 0 2px rgba(0,0,0,.7);font-weight:800;">${_esc(STAT_SHORT[modSub.type] ?? modSub.type)}</td>`
        : `<td style="text-align:center;padding:6px 6px;font-size:12px;" class="ga-stat-name">—</td>`;

      // Storage cell
      const storImg = item.storage
        ? getThemeIcon('./assets/storage.png', './assets/storage_dt.png')
        : '';
      const storH = storImg
        ? `<img src="${_esc(storImg)}" alt="In Storage" style="width:14px;height:14px;object-fit:contain;vertical-align:middle;">`
        : '';

      // Archetype columns
      const _mainType = item.main?.type ?? item.main ?? '';
      const _isRingFocusSub =
        item.gear === 'Ring' &&
        (_mainType === 'EffectivenessPercent' ||
          _mainType === 'EffectResistancePercent');
      const substatCount = (item.substats ?? []).length;
      const archColParts = [];
      for (const arch of activeKeys) {
        if (!_visibleArchetypes.has(arch)) continue;
        const focusNote =
          _isRingFocusSub && arch.includes('Focus')
            ? '\n⚠ Ring EFF%/ER% main — scored as Atk% Focus'
            : '';
        archColParts.push(
          _archColHtml(
            arch,
            _archScoreFn(score, arch),
            potentialArchs,
            substatCount,
            focusNote,
          ),
        );
      }
      const archCols = archColParts.join('');

      // Hero cell
      const heroName = item.heroName ?? '';

      parts[i] =
        `<tr class="${rowCls}" data-row="${i}" style="cursor:pointer;">` +
        `<td style="text-align:center;padding:6px 6px;font-size:13px;${lvlColor ? `color:${lvlColor};font-weight:700;` : ''}">${lvl}</td>` +
        `<td style="white-space:nowrap;padding:6px 10px;font-size:13px;">${lockH}${slotH}${_esc(slot)}</td>` +
        `<td style="padding:6px 10px;font-size:13px;">${setH}${_esc(setDisp)}</td>` +
        `<td style="text-align:center;padding:6px 6px;font-size:11px;"><span style="color:${RANK_COLORS[rankVal] ?? '#9e9e9e'};font-weight:700;">${_esc(rankVal)}</span></td>` +
        `<td style="text-align:center;padding:6px 6px;font-size:13px;">+${item.enhance ?? 0}</td>` +
        `<td style="padding:6px 10px;font-size:13px;">${mainH}${_esc(mainText)}</td>` +
        _substatsCellHtml(item, _useReforged) +
        `<td style="text-align:center;padding:6px 6px;font-size:13px;">${totalRolls}</td>` +
        modCellH +
        `<td style="text-align:center;padding:6px 4px;font-size:13px;">${storH}</td>` +
        `<td style="color:${gsColor(score.gs)};font-weight:bold;text-align:center;padding:6px 10px;font-size:15px;">${score.gs}</td>` +
        `<td style="text-align:center;padding:6px 8px;font-size:13px;">${score.gsPerRoll ?? 0}</td>` +
        `<td style="color:${gsColor(score.gs15 ?? 0)};text-align:center;padding:6px 8px;font-size:13px;font-weight:bold;">${score.gs15 ?? 0}</td>` +
        `<td style="text-align:center;padding:6px 6px;font-size:13px;${speedPot > 0 ? 'color:#4caf50;font-weight:700;' : ''}">${speedPot > 0 ? speedPot : '—'}</td>` +
        _powerColHtml(score.official.cPower, 'Off. C.Power') +
        _powerColHtml(score.official.aPower, 'Off. A.Power') +
        _powerColHtml(score.unofficial.cPower, 'UOff. C.Power') +
        _powerColHtml(score.unofficial.aPower, 'UOff. A.Power') +
        archCols +
        `<td style="padding:6px 8px;font-size:12px;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-left:1px solid var(--border-color,#444);"${!heroName ? ' class="ga-stat-name"' : ''}>${_esc(heroName)}</td>` +
        '</tr>';
    }

    tbody.innerHTML = parts.join('');

    const countEl = _dom.countEl;
    if (countEl) {
      countEl.textContent =
        allRows.length > ROW_RENDER_LIMIT
          ? `Showing first ${ROW_RENDER_LIMIT} of ${allRows.length} — use filters to narrow`
          : `Showing ${allRows.length} items`;
      countEl.style.color = allRows.length > ROW_RENDER_LIMIT ? '#ffc107' : '';
    }
  }

  function _td(tr, text) {
    const cell = document.createElement('td');
    if (text !== '') cell.textContent = text;
    tr.appendChild(cell);
    return cell;
  }

  // ── Item Modal ────────────────────────────────────────────────────────────

  function openItemModal(item, score) {
    const modal = _dom.modal;
    const preview = _dom.modalPreview;
    const titleEl = _dom.modalTitle;
    if (!modal || !preview) return;

    // Header title
    if (titleEl) {
      titleEl.textContent = `⚔️ ${item.gear ?? ''} — ${getSetDisplay(item)} +${item.enhance ?? 0}`;
    }

    // Native item card — reuse HtmlGenerator from the gear tab
    const HG = globalThis.HtmlGenerator;
    if (HG && typeof HG.buildItemPanel === 'function') {
      let baseStats = null;
      try {
        if (item.equippedByName && globalThis.HeroData?.getBaseStatsByStars) {
          baseStats = globalThis.HeroData.getBaseStatsByStars(
            item.equippedByName,
            6,
          );
        }
        preview.innerHTML = HG.buildItemPanel(
          item,
          'gaPopup',
          baseStats,
          'Speed',
        );
      } catch (e) {
        Log.warn('[GearAnalysis] HtmlGenerator.buildItemPanel failed:', e);
        preview.innerHTML =
          '<div style="padding:16px;color:rgba(255,255,255,0.4);font-size:13px;">Item card unavailable</div>';
      }
    } else {
      preview.innerHTML =
        '<div style="padding:16px;color:rgba(255,255,255,0.4);font-size:13px;">Loading…</div>';
    }

    // Analysis scores panel
    showSidebar(item, score);

    modal.style.display = 'flex';
  }

  function closeItemModal() {
    if (_dom.modal) _dom.modal.style.display = 'none';
  }

  // ── Sidebar / Analysis scores ─────────────────────────────────────────────

  function showSidebar(item, score) {
    const content = _dom.modalAnalysis;
    if (!content) return;

    const slot = item.gear ?? '';
    const set = getSetDisplay(item);
    const main = getMainStatDisplay(item);
    const rank = item.rank ?? 'Epic';
    const enhance = item.enhance ?? 0;
    const level = item.level ?? 0;

    const rowStyle =
      'display:flex;justify-content:space-between;margin-bottom:5px;font-size:13px;';
    const labelStyle = 'color:rgba(255,255,255,0.6);';
    const valueStyle = 'font-weight:600;';

    function row(label, value) {
      return `<div style="${rowStyle}"><span style="${labelStyle}">${label}</span><span style="${valueStyle}">${value}</span></div>`;
    }

    function rowIcon(label, iconPath, value, size = 14) {
      const iconLabel = iconPath
        ? `<span style="display:inline-flex;align-items:center;gap:5px;"><img src="${iconPath}" alt="${label}" title="${label}" style="width:${size}px;height:${size}px;object-fit:contain;" /><span>${label}</span></span>`
        : label;
      return row(iconLabel, value);
    }

    // Gear info section
    const _reforgeReforgeable = globalThis.Reforge?.isReforgeable
      ? globalThis.Reforge.isReforgeable(item)
      : level === 85;
    const _reforgeStatus =
      level >= 88
        ? 'Reforged'
        : _reforgeReforgeable
          ? 'Reforgeable'
          : 'Not Reforgeable';
    const _reforgeIcon = getThemeIcon(
      './assets/reforge.png',
      './assets/reforge_dt.png',
    );

    let html = `
      <div style="background:var(--btn-color,#2d2d2d);border-radius:6px;padding:12px;margin-bottom:14px;border:1px solid var(--border-color,#444);">
        ${rowIcon('Slot', GEAR_ICON_BY_SLOT[slot] ?? null, `${item.locked ? '🔒 ' : ''}${slot}`)}
        ${rowIcon('Set', SET_ICON_BY_NAME[item.set ?? ''] ?? null, set)}
        ${row('Rank', `${rank} Lv.${level}`)}
        ${row('Enhance', `+${enhance}`)}
        ${rowIcon('Reforge', _reforgeIcon, _reforgeStatus)}
        ${rowIcon('Main Stat', STAT_ICON_BY_TYPE[(item.main?.type ?? item.main) || ''] ?? null, main)}
        ${item.heroName ? rowIcon('Equipped', getThemeIcon('./assets/bag.png', './assets/bag_dt.png'), item.heroName) : ''}
      </div>`;

    // GS summary
    html += `
      <div style="background:var(--btn-color,#2d2d2d);border-radius:6px;padding:12px;margin-bottom:14px;border:1px solid var(--border-color,#444);">
        <div style="color:#00fff2;font-weight:600;margin-bottom:8px;font-size:14px;">📊 Gear Score</div>
        ${row('GS', `<span style="color:${gsColor(score.gs)};font-weight:700;">${score.gs}</span>`)}
        ${row('GS/Roll', score.gsPerRoll)}
        ${row('GS+15', `<span style="color:${gsColor(score.gs15 ?? 0)};font-weight:700;">${score.gs15 ?? 0}</span>`)}
        ${score.speedPotential > 0 ? row('Speed Potential', score.speedPotential) : ''}
      </div>`;

    // Substats
    html += `<div style="background:var(--btn-color,#2d2d2d);border-radius:6px;padding:12px;margin-bottom:14px;border:1px solid var(--border-color,#444);">
      <div style="color:#00fff2;font-weight:600;margin-bottom:8px;font-size:14px;">🎲 Substats</div>`;
    const _hasPinnedSubs = (item.substats ?? []).some(
      (s) => s?.pinMod === true,
    );
    (item.substats ?? []).forEach((sub) => {
      if (!sub || !sub.type) return;
      const baseVal = sub.value ?? 0;
      const refVal = getDisplayedSubstatValue(item, sub, _useReforged);
      const pct = PERCENT_STATS.has(sub.type) ? '%' : '';
      const isModified = sub.modified === true;
      const isReforgedChange = _useReforged && refVal !== baseVal;
      const modBadge = isModified
        ? `<span style="color:#ff9800;font-size:10px;font-weight:700;margin-left:5px;background:rgba(255,152,0,0.2);padding:1px 4px;border-radius:3px;">✦ MOD</span>`
        : '';
      let modTargetBadge = '';
      if (sub.pinMod === true) {
        const targets = Array.isArray(sub.allowedTargetStats)
          ? sub.allowedTargetStats
          : [];
        if (targets.length > 0) {
          const labels = targets
            .map((t) => _GA_LABEL_FROM_TYPE[t] ?? STAT_SHORT[t] ?? t)
            .join('/');
          modTargetBadge = `<span style="color:#4caf50;font-size:10px;font-weight:600;margin-left:4px;background:rgba(76,175,80,0.12);padding:1px 4px;border-radius:3px;">→${labels}</span>`;
        } else {
          modTargetBadge = `<span style="color:#4caf50;font-size:10px;font-weight:600;margin-left:4px;background:rgba(76,175,80,0.12);padding:1px 4px;border-radius:3px;">→any</span>`;
        }
      } else if (_hasPinnedSubs) {
        modTargetBadge = `<span style="color:rgba(255,100,100,0.5);font-size:10px;margin-left:4px;background:rgba(255,100,100,0.07);padding:1px 4px;border-radius:3px;">off</span>`;
      }
      let valHtml;
      if (isReforgedChange) {
        valHtml = `<span style="color:#aaa;">${baseVal}${pct}</span><span style="color:#fff;font-weight:600;">→${refVal}${pct}</span>`;
      } else {
        valHtml = `<span style="color:#fff;font-weight:600;">${_useReforged ? refVal : baseVal}${pct}</span>`;
      }
      html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px;margin-bottom:3px;background:rgba(255,255,255,0.05);border-radius:4px;font-size:13px;">
        <span style="color:#e0e0e0;display:inline-flex;align-items:center;gap:4px;">${makeIconLabelNode(statLabel(sub.type), STAT_ICON_BY_TYPE[sub.type] ?? null, statLabel(sub.type), 12).outerHTML}${modBadge}${modTargetBadge}</span>
        <span>${valHtml}</span>
        <span style="color:rgba(255,255,255,0.4);font-size:11px;">[${sub.rolls ?? 0} roll${sub.rolls !== 1 ? 's' : ''}]</span>
      </div>`;
    });
    html += '</div>';

    // Archetype scores — Off. and UOff. side by side
    const _sidebarMainType = item.main?.type ?? item.main ?? '';
    const _sidebarRingFocusSub =
      item.gear === 'Ring' &&
      (_sidebarMainType === 'EffectivenessPercent' ||
        _sidebarMainType === 'EffectResistancePercent');

    function archRow(arch, as, isPot) {
      if (!as.valid[arch]) return '';
      const nm = as.nonModGS[arch] ?? 0;
      const mod = as.modGS[arch] ?? 0;
      const hint = as.modHint[arch] ?? '';
      const gain = mod - nm;
      const color = gsColor(nm);
      const detailLine = hint ? `\n${hint}` : '';
      const mc = as.matchCount?.[arch] ?? 0;
      const subTotal = (item.substats ?? []).length;
      const matchBadge = !isPot
        ? `<span style="color:#888;font-size:10px;margin-left:5px;white-space:nowrap;">${mc}/${subTotal}</span>`
        : '';
      const focusBadge =
        _sidebarRingFocusSub && arch.includes('Focus')
          ? `<span style="color:#ff9800;font-size:10px;margin-left:5px;" title="Ring EFF%/ER% main — scored as Atk% Focus">⚠</span>`
          : '';
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px;margin-bottom:3px;background:rgba(255,255,255,0.05);border-radius:4px;font-size:13px;">
        <span style="color:#e0e0e0;flex:1;">${arch}${matchBadge}${focusBadge}</span>
        <span style="color:${color};font-weight:700;min-width:28px;text-align:right;">${nm || '—'}</span>
        ${!isPot && gain > 0 ? `<span style="color:#9be7ff;font-size:11px;font-weight:800;margin-left:6px;white-space:pre-line;text-align:left;text-shadow:0 0 2px rgba(0,0,0,0.7);">${mod}(+${gain})${detailLine}</span>` : ''}
      </div>`;
    }

    const offKeys = getGearScorer().OFFICIAL_ARCHETYPE_KEYS;
    const unoffKeys = getGearScorer().UNOFFICIAL_ARCHETYPE_KEYS;
    const potSet = getGearScorer().POTENTIAL_ARCHETYPES;

    html += `<div style="background:var(--btn-color,#2d2d2d);border-radius:6px;padding:12px;margin-bottom:14px;border:1px solid var(--border-color,#444);">
      <div style="color:#00fff2;font-weight:600;margin-bottom:8px;font-size:14px;">🏆 Archetype Scores — Off.</div>`;
    offKeys.forEach((arch) => {
      html += archRow(arch, score.official, potSet.has(arch));
    });
    html += '</div>';

    html += `<div style="background:var(--btn-color,#2d2d2d);border-radius:6px;padding:12px;margin-bottom:14px;border:1px solid var(--border-color,#444);">
      <div style="color:#00fff2;font-weight:600;margin-bottom:8px;font-size:14px;">🏆 Archetype Scores — UOff.</div>`;
    unoffKeys.forEach((arch) => {
      html += archRow(arch, score.unofficial, potSet.has(arch));
    });
    html += '</div>';

    // C.Power / A.Power (Off.) + UOff. C.Power / A.Power
    const cp = score.official.cPower;
    const ap = score.official.aPower;
    const ucp = score.unofficial.cPower;
    const uap = score.unofficial.aPower;
    function pwrTile(label, data) {
      return `<div style="flex:1;background:rgba(255,255,255,0.05);border-radius:4px;padding:8px;text-align:center;min-width:0;">
        <div style="color:rgba(255,255,255,0.5);font-size:11px;margin-bottom:4px;">${label}</div>
        <div style="color:${gsColor(data.score)};font-weight:700;font-size:18px;">${data.score || '—'}</div>
        ${data.hasMod ? `<div style="color:#9be7ff;font-size:12px;font-weight:800;text-shadow:0 0 2px rgba(0,0,0,0.7);">${data.modScore} (+${data.gain})</div>` : ''}
      </div>`;
    }
    html += `<div style="background:var(--btn-color,#2d2d2d);border-radius:6px;padding:12px;border:1px solid var(--border-color,#444);">
      <div style="color:#00fff2;font-weight:600;margin-bottom:8px;font-size:14px;">⚡ Combat Power</div>
      <div style="display:flex;gap:6px;">
        ${pwrTile('Off. C.Power', cp)}
        ${pwrTile('Off. A.Power', ap)}
        ${pwrTile('UOff. C.Power', ucp)}
        ${pwrTile('UOff. A.Power', uap)}
      </div>
    </div>`;

    content.innerHTML = html;
  }

  // ── Breakdown view ────────────────────────────────────────────────────────

  function buildBreakdown(rows) {
    const el = document.getElementById('ga-breakdown');
    if (!el) return;

    const archKeys = getActiveKeys();

    // Group by slot → (set+main key) → arch counts
    const slots = [..._slotFilter]
      .filter((s) => SLOT_ORDER.includes(s))
      .sort((a, b) => SLOT_ORDER.indexOf(a) - SLOT_ORDER.indexOf(b));

    let html = '';
    slots.forEach((slot) => {
      const slotRows = rows.filter(({ item }) => (item.gear ?? '') === slot);
      if (!slotRows.length) return;

      // Build unique set+main combos
      const comboMap = new Map();
      slotRows.forEach(({ item, score }) => {
        const key = `${getSetDisplay(item)} | ${getMainStatDisplay(item)}`;
        if (!comboMap.has(key)) comboMap.set(key, { counts: {}, total: 0 });
        const entry = comboMap.get(key);
        entry.total++;
        archKeys.forEach((arch) => {
          const as = getArchScore(score, arch);
          if (as && as.valid[arch] && (as.nonModGS[arch] ?? 0) > 0) {
            entry.counts[arch] = (entry.counts[arch] ?? 0) + 1;
          }
        });
      });

      // Render slot table
      html += `<div style="margin-bottom:20px;">
        <div style="font-size:14px;font-weight:700;color:#00fff2;margin-bottom:6px;padding:4px 8px;background:rgba(0,255,242,0.08);border-radius:4px;">${slot}</div>
        <div style="overflow-x:auto;">
        <table style="border-collapse:collapse;font-size:12px;width:100%;">
        <thead><tr>
          <th style="padding:5px 8px;border:1px solid var(--border-color,#444);text-align:left;white-space:nowrap;">Set / Main</th>
          <th style="padding:5px 6px;border:1px solid var(--border-color,#444);text-align:center;">#</th>`;
      archKeys.forEach((arch) => {
        html += `<th style="padding:5px 4px;border:1px solid var(--border-color,#444);text-align:center;white-space:nowrap;font-size:11px;">${arch}</th>`;
      });
      html += '</tr></thead><tbody>';

      [...comboMap.entries()]
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([combo, entry]) => {
          html += `<tr>
          <td style="padding:4px 8px;border:1px solid var(--border-color,#444);white-space:nowrap;">${combo}</td>
          <td style="padding:4px 6px;border:1px solid var(--border-color,#444);text-align:center;color:rgba(255,255,255,0.5);">${entry.total}</td>`;
          archKeys.forEach((arch) => {
            const cnt = entry.counts[arch] ?? 0;
            const bg =
              cnt === 0
                ? 'rgba(244,67,54,0.25)'
                : cnt <= 2
                  ? 'rgba(255,193,7,0.2)'
                  : 'rgba(76,175,80,0.2)';
            const color =
              cnt === 0 ? '#f44336' : cnt <= 2 ? '#ffc107' : '#4caf50';
            html += `<td style="padding:4px 6px;border:1px solid var(--border-color,#444);text-align:center;background:${bg};color:${color};font-weight:700;">${cnt || '·'}</td>`;
          });
          html += '</tr>';
        });

      html += '</tbody></table></div></div>';
    });

    el.innerHTML =
      html ||
      '<div style="color:rgba(255,255,255,0.4);padding:20px;text-align:center;">No items match current filters.</div>';
  }

  // ── Breakdown CSV export ─────────────────────────────────────────────────

  function downloadBreakdownCsv(rows) {
    const archKeys = getActiveKeys();
    const slots = [..._slotFilter]
      .filter((s) => SLOT_ORDER.includes(s))
      .sort((a, b) => SLOT_ORDER.indexOf(a) - SLOT_ORDER.indexOf(b));

    const csvRows = [];
    csvRows.push(
      ['Slot', 'Set / Main', '#', ...archKeys].map(csvCell).join(','),
    );

    slots.forEach((slot) => {
      const slotRows = rows.filter(({ item }) => (item.gear ?? '') === slot);
      if (!slotRows.length) return;

      const comboMap = new Map();
      slotRows.forEach(({ item, score }) => {
        const key = `${getSetDisplay(item)} | ${getMainStatDisplay(item)}`;
        if (!comboMap.has(key)) comboMap.set(key, { counts: {}, total: 0 });
        const entry = comboMap.get(key);
        entry.total++;
        archKeys.forEach((arch) => {
          const as = getArchScore(score, arch);
          if (as && as.valid[arch] && (as.nonModGS[arch] ?? 0) > 0) {
            entry.counts[arch] = (entry.counts[arch] ?? 0) + 1;
          }
        });
      });

      [...comboMap.entries()]
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([combo, entry]) => {
          csvRows.push(
            [
              slot,
              combo,
              entry.total,
              ...archKeys.map((arch) => entry.counts[arch] ?? 0),
            ]
              .map(csvCell)
              .join(','),
          );
        });
    });

    const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gear_analysis_breakdown.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function csvCell(v) {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  }

  // ── Sort ──────────────────────────────────────────────────────────────────

  function handleSort(col) {
    if (_sortCol === col) {
      _sortAsc = !_sortAsc;
    } else {
      _sortCol = col;
      _sortAsc = col === 'slot' || col === 'set' || col === 'main';
    }
    updateSortIndicators();
    scheduleRender();
  }

  function updateSortIndicators() {
    document
      .querySelectorAll('#gear-analysis-table th[data-col]')
      .forEach((th) => {
        const col = th.dataset.col;
        const arrow = _sortCol === col ? (_sortAsc ? ' ▲' : ' ▼') : '';
        th.textContent = th.textContent.replace(/ [▲▼]$/, '') + arrow;
      });
  }

  // ── Column-visibility menu ────────────────────────────────────────────────

  function buildArchetypeToggleMenu() {
    const menu = document.getElementById('gear-analysis-arch-toggles');
    if (!menu) return;

    if (!_initializedVisibleArchetypes) {
      const allArchKeys = getGearScorer().ALL_ARCHETYPE_KEYS;
      if (allArchKeys.length > 0) {
        allArchKeys.forEach((arch) => _visibleArchetypes.add(arch));
        _initializedVisibleArchetypes = true;
      }
    }

    menu.innerHTML = '';

    getActiveKeys().forEach((arch) => {
      const label = document.createElement('label');
      label.style.cssText =
        'display:block;padding:2px 8px;cursor:pointer;white-space:nowrap;';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = _visibleArchetypes.has(arch);
      cb.addEventListener('change', () => {
        if (cb.checked) _visibleArchetypes.add(arch);
        else _visibleArchetypes.delete(arch);
        _headerDirty = true;
        scheduleRender();
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' ' + arch));
      menu.appendChild(label);
    });
  }

  // ── Archetype set tab switch ──────────────────────────────────────────────

  function switchArchetypeSet(newSet) {
    _archetypeSet = newSet;
    document.querySelectorAll('.ga-set-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.set === newSet);
    });
    _headerDirty = true;
    buildArchetypeToggleMenu();
    _buildArchFilterDropdown();
    scheduleRender();
  }

  // ── Main refresh ──────────────────────────────────────────────────────────

  async function refresh() {
    const btn = document.getElementById('gearAnalysisRefresh');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Loading...';
    }

    try {
      const api = globalThis.Api;
      if (!api || typeof api.getAllItems !== 'function') {
        throw new Error('Api.getAllItems is unavailable');
      }
      const response = await api.getAllItems();
      const items = response?.items ?? [];
      _useReforged =
        document.getElementById('gearAnalysisReforged')?.checked ?? true;
      _scored = getGearScorer().scoreAllItems(items, _useReforged);
      renderTable();
      if (_dom.totalEl) _dom.totalEl.textContent = `${items.length} total`;
    } catch (e) {
      Log.error('[GearAnalysis] Failed to load items:', e);
      if (_dom.totalEl) _dom.totalEl.textContent = 'Error loading';
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Refresh';
      }
    }
  }

  // ── Bulk mod-target helpers ───────────────────────────────────────────────

  // Returns hintsByFrom map from regular-archetype mod hints only.
  // Potential archetypes never produce hints (modGS=0, modHint='') so they are not present.
  function _parseHintsFromScore(score, positiveGainOnly) {
    const hintsByFrom = {};
    if (!score) return hintsByFrom;
    for (const result of [score.official, score.unofficial]) {
      if (!result) continue;
      for (const [arch, hint] of Object.entries(result.modHint ?? {})) {
        if (!hint) continue;
        if (positiveGainOnly) {
          const diff =
            (result.modGS?.[arch] ?? 0) - (result.nonModGS?.[arch] ?? 0);
          if (diff <= 0) continue;
        }
        for (const line of hint.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const arrowIdx = trimmed.indexOf('→');
          if (arrowIdx < 0) continue;
          const fromLbl = trimmed.slice(0, arrowIdx).trim();
          const toRaw = trimmed.slice(arrowIdx + 1).trim();
          const pipeIdx = toRaw.indexOf('|');
          const toLbl = (pipeIdx >= 0 ? toRaw.slice(0, pipeIdx) : toRaw).trim();
          const toType = _GA_TYPE_FROM_LBL[toLbl];
          if (!toType) continue;
          if (!hintsByFrom[fromLbl]) hintsByFrom[fromLbl] = new Set();
          hintsByFrom[fromLbl].add(toType);
        }
      }
    }
    return hintsByFrom;
  }

  // Returns the set of focus stat types that are active (nonModGS > 0) for potential archetypes.
  function _getActiveFocusStats(score) {
    const active = new Set();
    if (!score) return active;
    const potentialArchs = getGearScorer().POTENTIAL_ARCHETYPES ?? new Set();
    for (const result of [score.official, score.unofficial]) {
      if (!result) continue;
      for (const [arch, gs] of Object.entries(result.nonModGS ?? {})) {
        if (!potentialArchs.has(arch) || !(gs > 0)) continue;
        const stats = _FOCUS_STAT_BY_ARCH[arch];
        if (stats) stats.forEach((s) => active.add(s));
      }
    }
    return active;
  }

  function _applyAutoConfigToItem(item, score, positiveGainOnly) {
    if (!item.substats || !score) return false;
    const hintsByFrom = _parseHintsFromScore(score, positiveGainOnly);

    if (Object.keys(hintsByFrom).length > 0) {
      // ── Regular archetype mode ────────────────────────────────────────
      // Hint slots: pinMod=true + allowedTargetStats. Non-hint: excluded via hasPinnedSubstats.
      const gearType = item.gear ?? '';
      const mainType = item.main?.type ?? '';
      const existingTypes = new Set(
        item.substats.map((s) => s?.type).filter(Boolean),
      );
      item.substats.forEach((sub) => {
        if (!sub?.type || sub.type === 'None') return;
        const fromLbl = _GA_LABEL_FROM_TYPE[sub.type];
        let targets = fromLbl ? [...(hintsByFrom[fromLbl] ?? [])] : [];
        targets = targets.filter((t) => {
          if (t === mainType) return false;
          if (existingTypes.has(t) && t !== sub.type) return false;
          if (
            gearType === 'Weapon' &&
            (t === 'Defense' || t === 'DefensePercent')
          )
            return false;
          if (gearType === 'Armor' && (t === 'Attack' || t === 'AttackPercent'))
            return false;
          return true;
        });
        if (targets.length > 0) {
          sub.pinMod = true;
          sub.allowedTargetStats = targets;
          delete sub.pinModOff;
        } else {
          // Non-hint: excluded from modding (hasPinnedSubstats from hint slots → skip !pinMod)
          delete sub.pinMod;
          delete sub.allowedTargetStats;
          delete sub.pinModOff;
        }
      });
      return true;
    }

    // ── Potential archetype mode ──────────────────────────────────────────
    // Focus stat is the valuable stat — DISABLE it (protect from replacement).
    // All other substats are ON so the optimizer can replace them freely.
    const activeFocusStats = _getActiveFocusStats(score);
    if (activeFocusStats.size === 0) return false;
    item.substats.forEach((sub) => {
      if (!sub?.type || sub.type === 'None') return;
      if (activeFocusStats.has(sub.type)) {
        // Focus stat: DISABLE (hasPinnedSubstats from non-focus slots will skip this)
        delete sub.pinMod;
        delete sub.allowedTargetStats;
        delete sub.pinModOff;
      } else {
        // Non-focus: ON, any target allowed
        sub.pinMod = true;
        delete sub.allowedTargetStats;
        delete sub.pinModOff;
      }
    });
    return true;
  }

  function _resetModTargetsOnItem(item) {
    let changed = false;
    (item.substats ?? []).forEach((sub) => {
      if (!sub) return;
      if (
        sub.pinMod !== undefined ||
        sub.pinModOff !== undefined ||
        sub.allowedTargetStats !== undefined
      ) {
        delete sub.pinMod;
        delete sub.pinModOff;
        delete sub.allowedTargetStats;
        changed = true;
      }
    });
    return changed;
  }

  async function _bulkModTargetAction(action) {
    if (!action) return;
    const api = globalThis.Api;
    const notifier = globalThis.Notifier;
    if (!api) {
      Log.warn('[GearAnalysis] Api unavailable');
      return;
    }

    const modified = [];
    if (action === 'reset') {
      _scored.forEach(({ item }) => {
        if (_resetModTargetsOnItem(item)) modified.push(item);
      });
    } else {
      const positiveGainOnly = action === 'auto';
      _scored.forEach(({ item, score }) => {
        if (_applyAutoConfigToItem(item, score, positiveGainOnly))
          modified.push(item);
      });
    }

    if (modified.length === 0) {
      notifier?.quick('No items changed.');
      return;
    }

    try {
      // Strip computed stat fields — items from _scored came via getAllItems (backend round-trip)
      // which loses substat.reforgedValue. Sending augmentedStats/reforgedStats from these items
      // would zero them out in the DB. The backend will preserve the existing DB values when null.
      modified.forEach((item) => {
        delete item.augmentedStats;
        delete item.reforgedStats;
      });
      await api.editItems(modified);
      notifier?.quick(
        `${action === 'reset' ? 'Reset' : 'Applied'} mod targets on ${modified.length} items.`,
      );
    } catch (err) {
      Log.error('[GearAnalysis] bulk mod target action failed', err);
      notifier?.warn('Failed to save mod target changes.');
    }
  }

  // ── Initialization ────────────────────────────────────────────────────────

  function init() {
    // Populate DOM cache — one lookup per element, reused everywhere
    _dom.tbody = document.getElementById('gear-analysis-tbody');
    _dom.countEl = document.getElementById('gear-analysis-count');
    _dom.tableWrap = document.getElementById('ga-table-wrap');
    _dom.breakdownEl = document.getElementById('ga-breakdown');
    _dom.thead = document.querySelector('#gear-analysis-table thead tr');
    _dom.totalEl = document.getElementById('gear-analysis-total');
    _dom.modal = document.getElementById('ga-item-modal');
    _dom.modalPreview = document.getElementById('ga-item-preview');
    _dom.modalTitle = document.getElementById('ga-modal-title');
    _dom.modalAnalysis = document.getElementById('ga-modal-analysis');

    // Cache button/checkbox collections used in repeated handlers
    _slotBtns = Array.from(document.querySelectorAll('.ga-slot-btn'));
    // Exclude the reset button (no data-enhance) from the toggle collection
    _enhBtns = Array.from(
      document.querySelectorAll('.ga-enh-btn[data-enhance]'),
    );

    // Static header sort
    document
      .querySelectorAll(
        '#gear-analysis-table thead th[data-col]:not([data-arch])',
      )
      .forEach((th) => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => handleSort(th.dataset.col));
      });

    // Search
    const searchEl = document.getElementById('gearAnalysisSearch');
    if (searchEl) {
      searchEl.addEventListener('input', () => {
        _searchText = searchEl.value;
        scheduleRender();
      });
    }

    // Reforged checkbox
    const reforgedEl = document.getElementById('gearAnalysisReforged');
    if (reforgedEl) {
      reforgedEl.addEventListener('change', () => {
        _useReforged = reforgedEl.checked;
        if (_scored.length > 0) {
          _scored = getGearScorer().scoreAllItems(
            _scored.map((s) => s.item),
            _useReforged,
          );
          renderTable();
        }
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('gearAnalysisRefresh');
    if (refreshBtn) refreshBtn.addEventListener('click', refresh);

    // Archetype set tabs (Official / Unofficial / All)
    document.querySelectorAll('.ga-set-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchArchetypeSet(btn.dataset.set));
    });

    // Column-visibility toggle
    const toggleBtn = document.getElementById('gearAnalysisToggleCols');
    const toggleMenu = document.getElementById('gear-analysis-arch-toggles');
    if (toggleBtn && toggleMenu) {
      buildArchetypeToggleMenu();
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu.style.display =
          toggleMenu.style.display !== 'none' ? 'none' : 'block';
      });
      document.addEventListener('click', () => {
        if (toggleMenu) toggleMenu.style.display = 'none';
      });
    }

    // Item modal close
    const modalClose = document.getElementById('ga-item-modal-close');
    if (modalClose) modalClose.addEventListener('click', closeItemModal);

    // Click the dim overlay (outside the dialog box) to close
    if (_dom.modal) {
      _dom.modal.addEventListener('click', (e) => {
        if (e.target === _dom.modal) closeItemModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeItemModal();
    });

    // Slot filter buttons
    _slotBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const slot = btn.dataset.slot;
        if (slot === 'All') {
          const allSlots = [
            'Weapon',
            'Helmet',
            'Armor',
            'Necklace',
            'Ring',
            'Boots',
          ];
          if (_slotFilter.size === allSlots.length) {
            _slotFilter.clear();
          } else {
            allSlots.forEach((s) => _slotFilter.add(s));
          }
        } else {
          if (_slotFilter.has(slot)) _slotFilter.delete(slot);
          else _slotFilter.add(slot);
        }
        _slotBtns.forEach((b) => {
          const s = b.dataset.slot;
          b.classList.toggle(
            'active',
            s === 'All' ? _slotFilter.size === 6 : _slotFilter.has(s),
          );
        });
        scheduleRender();
      });
    });

    // Rank filter checkboxes
    document.querySelectorAll('.ga-rank-cb').forEach((cb) => {
      cb.addEventListener('change', () => {
        if (cb.checked) _rankFilter.add(cb.dataset.rank);
        else _rankFilter.delete(cb.dataset.rank);
        scheduleRender();
      });
    });

    // Enhance tier buttons — empty filter = all shown; selected = show only those
    _enhBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const enhance = Number.parseInt(btn.dataset.enhance ?? '', 10);
        if (Number.isNaN(enhance)) return;
        if (_enhanceFilter.has(enhance)) _enhanceFilter.delete(enhance);
        else _enhanceFilter.add(enhance);
        btn.classList.toggle('active', _enhanceFilter.has(enhance));
        scheduleRender();
      });
    });

    // Enhance reset button — clear all selections (show all)
    document.getElementById('ga-enh-reset')?.addEventListener('click', () => {
      _enhanceFilter.clear();
      _enhBtns.forEach((b) => b.classList.remove('active'));
      scheduleRender();
    });

    // Reset all filters button
    document
      .getElementById('ga-reset-all-filters')
      ?.addEventListener('click', _resetAllFilters);

    // Bulk mod-target Apply button
    document
      .getElementById('ga-mod-target-apply')
      ?.addEventListener('click', () => {
        const sel = document.getElementById('ga-mod-target-action');
        _bulkModTargetAction(sel?.value ?? '');
      });

    // Delegated row click — single listener instead of one per row
    if (_dom.tbody) {
      _dom.tbody.addEventListener('click', (e) => {
        if (e.target.closest('input, button, select')) return;
        const tr = e.target.closest('tr[data-row]');
        if (!tr) return;
        const entry = _lastRenderedRows[Number(tr.dataset.row)];
        if (entry) openItemModal(entry.item, entry.score);
      });
    }

    // Lock/storage filter dropdown
    const lockSelect = document.getElementById('ga-lock-filter');
    if (lockSelect) {
      lockSelect.addEventListener('change', () => {
        _lockFilter = lockSelect.value;
        scheduleRender();
      });
    }

    // Archetype "must score" filter
    const archSelect = document.getElementById('ga-arch-filter');
    if (archSelect) {
      _buildArchFilterDropdown();
      archSelect.addEventListener('change', () => {
        _archFilter = archSelect.value;
        scheduleRender();
      });
    }

    // Breakdown toggle
    const breakdownBtn = document.getElementById('ga-breakdown-toggle');
    const exportBtn = document.getElementById('ga-breakdown-export');
    if (breakdownBtn) {
      breakdownBtn.addEventListener('click', () => {
        _showBreakdown = !_showBreakdown;
        breakdownBtn.classList.toggle('active', _showBreakdown);
        breakdownBtn.textContent = _showBreakdown ? '📋 Table' : '📊 Breakdown';
        if (exportBtn) exportBtn.style.display = _showBreakdown ? '' : 'none';
        scheduleRender();
      });
    }
    if (exportBtn) {
      exportBtn.addEventListener('click', () =>
        downloadBreakdownCsv(filterAndSort()),
      );
    }

    // Activate on first tab show
    const tab13 = document.getElementById('tab13');
    if (tab13) {
      tab13.addEventListener('change', () => {
        if (tab13.checked && _scored.length === 0) refresh();
      });
    }

    // Tab state persistence — saves last active tab to localStorage and restores
    // it on reload.  Restore uses .checked = true WITHOUT dispatchEvent so the
    // CSS panel shows immediately but tab-specific data loads (e.g. gear analysis
    // refresh) are NOT triggered automatically — the user can click Refresh when ready.
    const TAB_STORAGE_KEY = 'fribbels_active_tab';
    document.querySelectorAll('input[name="tabset"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        if (radio.checked) localStorage.setItem(TAB_STORAGE_KEY, radio.id);
      });
    });
    const savedTabId = localStorage.getItem(TAB_STORAGE_KEY);
    if (savedTabId) {
      const savedRadio = document.getElementById(savedTabId);
      if (savedRadio && savedRadio.name === 'tabset') {
        savedRadio.checked = true;
      }
    }
  }

  globalThis.refreshGearAnalysis = refresh;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

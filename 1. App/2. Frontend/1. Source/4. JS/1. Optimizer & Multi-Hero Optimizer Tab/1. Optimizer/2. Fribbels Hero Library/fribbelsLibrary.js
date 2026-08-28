/* global Api, HeroData, Assets, DamageCalc, Settings */
import FribbelsPriorityFilter from './fribbelsPriorityFilter.js';
import FribbelsGrid, { rowKey as fribbelsRowKey } from './fribbelsGrid.js';

// ── Dependency injection (set by FribbelsLibrary.init) ───────────────────────
// deps = { recalculateFilters, updatePriorityWeightBar, getCurrentHero }
let _deps = {};

// ── Module-private state ──────────────────────────────────────────────────────
let fribbelsLoadedHeroName = null;
let fribbelsSelectedRow = null;
let fribbelsAllBuilds = [];
let fribbelsFilteredBuilds = [];
let fribbelsBaseStats = null;
let fribbelsCurrentBuildRow = null;

// ── Constants ─────────────────────────────────────────────────────────────────
const FRIBBELS_BUILDS_URL =
  'https://krivpfvxi0.execute-api.us-west-2.amazonaws.com/dev/getBuilds';

let _fribbelsArtifactsByCode = null;

const FRIBBELS_SET_ABBREV = {
  set_acc: 'Hit',
  set_att: 'Atk',
  set_coop: 'Unity',
  set_counter: 'Ctr',
  set_cri_dmg: 'Dest',
  set_cri: 'Crit',
  set_def: 'Def',
  set_immune: 'Imm',
  set_max_hp: 'HP',
  set_penetrate: 'Pen',
  set_rage: 'Rage',
  set_res: 'Res',
  set_revenge: 'Rev',
  set_scar: 'Inj',
  set_speed: 'Spd',
  set_vampire: 'LS',
  set_shield: 'Prot',
  set_torrent: 'Torr',
  set_revenant: 'Rvrsl',
  set_riposte: 'Riposte',
  set_opener: 'War',
  set_chase: 'Pursuit',
  set_might: 'Fervor',
  set_weak: 'Weak',
};

const FRIBBELS_FOUR_PIECE_SETS = [
  'set_att',
  'set_counter',
  'set_cri_dmg',
  'set_rage',
  'set_revenge',
  'set_scar',
  'set_speed',
  'set_vampire',
  'set_shield',
  'set_revenant',
  'set_riposte',
  'set_opener',
  'set_weak',
];

const FRIBBELS_SET_KEY_TO_GAME_NAME = {
  set_acc: 'HitSet',
  set_att: 'AttackSet',
  set_coop: 'UnitySet',
  set_counter: 'CounterSet',
  set_cri_dmg: 'DestructionSet',
  set_cri: 'CriticalSet',
  set_def: 'DefenseSet',
  set_immune: 'ImmunitySet',
  set_max_hp: 'HealthSet',
  set_penetrate: 'PenetrationSet',
  set_rage: 'RageSet',
  set_res: 'ResistSet',
  set_revenge: 'RevengeSet',
  set_scar: 'InjurySet',
  set_speed: 'SpeedSet',
  set_vampire: 'LifestealSet',
  set_shield: 'ProtectionSet',
  set_torrent: 'TorrentSet',
  set_revenant: 'ReversalSet',
  set_riposte: 'RiposteSet',
  set_opener: 'WarfareSet',
  set_chase: 'PursuitSet',
  set_might: 'FervorSet',
  set_weak: 'WeakeningSet',
};

// ── Lookup / display helpers ──────────────────────────────────────────────────

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

function fribbelsGetArtiStats(artifactName) {
  if (!artifactName) return { atk: 0, hp: 0, def: 0 };
  const all = HeroData.getAllArtifactData?.() || {};
  const entry = all[artifactName];
  if (!entry?.stats) return { atk: 0, hp: 0, def: 0 };
  return {
    atk: (entry.stats.attack || 0) * 13,
    hp: (entry.stats.health || 0) * 13,
    def: (entry.stats.defense || 0) * 13,
  };
}

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

// ── UI helpers ────────────────────────────────────────────────────────────────

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

function fribbelsSkillPart(row) {
  if (![row.s1, row.s2, row.s3].some((v) => v > 0)) return '';
  const s1 = row.s1 > 0 ? row.s1.toLocaleString() : '-';
  const s2 = row.s2 > 0 ? row.s2.toLocaleString() : '-';
  const s3 = row.s3 > 0 ? row.s3.toLocaleString() : '-';
  return `  S1 ${s1}  S2 ${s2}  S3 ${s3}`;
}

// ── Row selection ─────────────────────────────────────────────────────────────

function fribbelsDeselectRow() {
  fribbelsSelectedRow = null;
  FribbelsGrid.deselectAll();
  const copyBar = document.getElementById('fribbels-copy-bar');
  if (copyBar) copyBar.classList.add('display-none');
}

function fribbelsSelectRow(row) {
  fribbelsSelectedRow = row;

  const skillPart = fribbelsSkillPart(row);
  const statsText = `ATK ${row.atk}  DEF ${row.def}  HP ${row.hp}  SPD ${row.spd}  CR ${row.chc}  CD ${row.chd}  EFF ${row.eff}  RES ${row.efr}  |  EHP ${(row.ehp ?? 0).toLocaleString()}  EHP/s ${(row.ehps ?? 0).toLocaleString()}  DMG ${(row.dmg ?? 0).toLocaleString()}  MCD ${(row.mcd ?? 0).toLocaleString()}${skillPart}  |  ${fribbelsArtifactName(row.artifactCode)}  GS ${row.gs}`;
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
  const s1Str = row.s1 > 0 ? row.s1.toLocaleString() : '-';
  const s2Str = row.s2 > 0 ? row.s2.toLocaleString() : '-';
  const s3Str = row.s3 > 0 ? row.s3.toLocaleString() : '-';
  const skillPart = [row.s1, row.s2, row.s3].some((v) => v > 0)
    ? `  S1 ${s1Str}  S2 ${s2Str}  S3 ${s3Str}`
    : '';
  const statsText = `ATK ${row.atk}  DEF ${row.def}  HP ${row.hp}  SPD ${row.spd}  CR ${row.chc}  CD ${row.chd}  EFF ${row.eff}  RES ${row.efr}  |  EHP ${(row.ehp ?? 0).toLocaleString()}  EHP/s ${(row.ehps ?? 0).toLocaleString()}  DMG ${(row.dmg ?? 0).toLocaleString()}  MCD ${(row.mcd ?? 0).toLocaleString()}${skillPart}  |  ${fribbelsArtifactName(row.artifactCode)}  GS ${row.gs}`;
  const copyStats = document.getElementById('fribbels-copy-stats');
  if (copyStats) copyStats.textContent = statsText;
  const copyBar = document.getElementById('fribbels-copy-bar');
  if (copyBar) copyBar.classList.remove('display-none');
  FribbelsGrid.selectByKey(fribbelsRowKey(row));
}

// ── Build construction ────────────────────────────────────────────────────────

function fribbelsBuildEquippedSets(equipment) {
  const GAME_NAME_TO_SET_KEY = {};
  for (const [k, v] of Object.entries(FRIBBELS_SET_KEY_TO_GAME_NAME))
    GAME_NAME_TO_SET_KEY[v] = k;
  const sets = {};
  if (equipment) {
    Object.values(equipment).forEach((item) => {
      if (item?.set) {
        const key = GAME_NAME_TO_SET_KEY[item.set];
        if (key) sets[key] = (sets[key] || 0) + 1;
      }
    });
  }
  return sets;
}

function fribbelsBuildCurrentRow(
  hero,
  baseStats,
  mults,
  targetDef,
  rageSetEnabled,
  fervorSetEnabled,
) {
  if (!hero?.atk) return null;
  const sets = fribbelsBuildEquippedSets(hero.equipment);
  const chc = hero.cr;
  const chd = hero.cd;
  const efr = hero.res;

  const row = {
    _isCurrent: true,
    atk: hero.atk,
    def: hero.def,
    hp: hero.hp,
    spd: hero.spd,
    chc,
    chd,
    eff: hero.eff,
    efr,
    gs: hero.score || 0,
    bs: 0,
    sets,
    ehp: 0,
    hps: 0,
    ehps: 0,
    dmg: 0,
    dmgs: 0,
    mcd: 0,
    mcds: 0,
    dmgh: 0,
    dmgd: 0,
    hmcdmgs: 0,
    dmcdmgs: 0,
    hdmg: 0,
    hdmgs: 0,
    ddmg: 0,
    ddmgs: 0,
    s1: 0,
    s2: 0,
    s3: 0,
    rank: 0,
    artifactCode: '',
    artifactName: '',
    createDate: null,
  };

  FribbelsPriorityFilter.computeRowStats(
    row,
    mults,
    targetDef,
    rageSetEnabled,
    fervorSetEnabled,
  );

  if (baseStats) {
    const bsStats = FribbelsPriorityFilter.computeBsStats(
      row,
      baseStats,
      sets,
      { atk: 0, hp: 0, def: 0 },
    );
    row.bs = FribbelsPriorityFilter.bsScore(bsStats);
  }
  return row;
}

// ── Data loading ──────────────────────────────────────────────────────────────

async function fribbelsLoadData() {
  const heroId =
    document.getElementById('fribbelsHeroSelect').value ||
    document.getElementById('inputHeroAdd').value;
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
    Log.error(e);
    return;
  }

  try {
    const response = await fetch(FRIBBELS_BUILDS_URL, {
      method: 'POST',
      body: heroName,
    });
    const json = await response.json();
    const data = (json.data || []).filter((d) => d.atk && d.hp);
    data.sort((a, b) => Number.parseInt(b.gs, 10) - Number.parseInt(a.gs, 10));

    if (data.length === 0) {
      fribbelsSetStatus(`No community builds found for ${heroName}.`);
      return;
    }

    let mults = null;
    try {
      mults = DamageCalc.getMultipliers({ name: heroName });
    } catch (e) {
      if (!(e instanceof Error && e.message.includes('no skill data'))) {
        Log.warn(e);
      }
    }
    const targetDef = Settings.parseNumberValue('settingPenDefense') || 1500;
    const rageSetEnabled =
      document.getElementById('settingRageSet')?.checked ?? true;
    const fervorSetEnabled =
      document.getElementById('settingFervorSet')?.checked ?? true;

    const processedRows = [];
    data.forEach((row) => {
      row.atk = Number.parseInt(row.atk, 10);
      row.def = Number.parseInt(row.def, 10);
      row.hp = Number.parseInt(row.hp, 10);
      row.chc = Number.parseInt(row.chc, 10);
      row.chd = Number.parseInt(row.chd, 10);
      row.eff = Number.parseInt(row.eff, 10);
      row.efr = Number.parseInt(row.efr, 10);
      row.spd = Number.parseInt(row.spd, 10);
      row.gs = Number.parseInt(row.gs, 10);
      row.cdCapBonus = heroObj.cdCapBonus || 0;

      row.artifactName = fribbelsArtifactName(row.artifactCode);
      const artiStats = fribbelsGetArtiStats(row.artifactName);
      const sets = row.sets || {};

      const cdCap = 350 + row.cdCapBonus;
      row.gs = Math.ceil(
        row.gs -
          Math.max(0, row.chc - 100) * 1.6 -
          Math.max(0, row.chd - cdCap) * 1.14,
      );

      const bsStats = FribbelsPriorityFilter.computeBsStats(
        row,
        baseStats,
        sets,
        artiStats,
      );
      row.bs = baseStats ? FribbelsPriorityFilter.bsScore(bsStats) : 0;

      FribbelsPriorityFilter.computeRowStats(
        row,
        mults,
        targetDef,
        rageSetEnabled,
        fervorSetEnabled,
      );

      FribbelsPriorityFilter.calculateBuildScore(row, baseStats, artiStats);

      processedRows.push(row);
    });

    processedRows.forEach((r, i) => {
      r.rank = i + 1;
    });

    fribbelsCurrentBuildRow = fribbelsBuildCurrentRow(
      heroObj,
      baseStats,
      mults,
      targetDef,
      rageSetEnabled,
      fervorSetEnabled,
    );
    fribbelsAllBuilds = processedRows;
    fribbelsPopulateArtifactFilter();
    fribbelsApplyFilters();
    fribbelsLoadedHeroName = heroId;
    fribbelsHideStatus();
  } catch (e) {
    Log.error('Fribbels Library fetch error', e);
    fribbelsSetStatus('Failed to load builds. Check your internet connection.');
  }
}

// ── Grid ──────────────────────────────────────────────────────────────────────

function fribbelsSetGridData(rows) {
  const selectedKey = fribbelsSelectedRow
    ? fribbelsRowKey(fribbelsSelectedRow)
    : null;
  FribbelsGrid.setData(rows, fribbelsCurrentBuildRow, selectedKey);
}

// ── Filtering ─────────────────────────────────────────────────────────────────

function fribbelsApplyFilters() {
  if (!fribbelsAllBuilds.length) return;
  const getMin = (id) =>
    Number.parseInt(document.getElementById(id)?.value || '0', 10) || 0;
  const minGS = getMin('fFilter-minGS');
  const minBS = getMin('fFilter-minBS');
  const minSPD = getMin('fFilter-minSPD');
  const minATK = getMin('fFilter-minATK');
  const minDEF = getMin('fFilter-minDEF');
  const minHP = getMin('fFilter-minHP');
  const minCR = getMin('fFilter-minCR');
  const minCD = getMin('fFilter-minCD');
  const minEFF = getMin('fFilter-minEFF');
  const minRES = getMin('fFilter-minRES');
  const minEHP = getMin('fFilter-minEHP');
  const minS1 = getMin('fFilter-minS1');
  const minS2 = getMin('fFilter-minS2');
  const minS3 = getMin('fFilter-minS3');
  const requiredSets = Object.keys(FRIBBELS_SET_ABBREV).filter(
    (key) => document.getElementById(`fFilter-${key}`)?.checked,
  );
  const selectedArtifacts = Array.from(
    document.querySelectorAll('.fFilter-artifact-cb:checked'),
  ).map((cb) => cb.value);
  const statCount = [
    minGS,
    minBS,
    minSPD,
    minATK,
    minDEF,
    minHP,
    minCR,
    minCD,
    minEFF,
    minRES,
    minEHP,
    minS1,
    minS2,
    minS3,
  ].filter((v) => v > 0).length;
  const activeCount =
    statCount + requiredSets.length + (selectedArtifacts.length > 0 ? 1 : 0);
  const badge = document.getElementById('fribbels-filter-badge');
  if (badge) {
    badge.classList.toggle('display-none', activeCount === 0);
    if (activeCount > 0) badge.textContent = `Filtered (${activeCount})`;
  }
  const meetsStatThresholds = (row) =>
    row.gs >= minGS &&
    row.bs >= minBS &&
    row.spd >= minSPD &&
    row.atk >= minATK &&
    row.def >= minDEF &&
    row.hp >= minHP &&
    row.chc >= minCR &&
    row.chd >= minCD &&
    row.eff >= minEFF &&
    row.efr >= minRES &&
    row.ehp >= minEHP &&
    (minS1 === 0 || row.s1 >= minS1) &&
    (minS2 === 0 || row.s2 >= minS2) &&
    (minS3 === 0 || row.s3 >= minS3);

  const meetsSetRequirements = (row) =>
    requiredSets.every((setKey) => {
      const minPieces = FRIBBELS_FOUR_PIECE_SETS.includes(setKey) ? 4 : 2;
      return (row.sets?.[setKey] || 0) >= minPieces;
    });

  const meetsArtifactFilter = (row) =>
    selectedArtifacts.length === 0 ||
    selectedArtifacts.includes(row.artifactCode);

  const filtered = fribbelsAllBuilds.filter(
    (row) =>
      meetsStatThresholds(row) &&
      meetsSetRequirements(row) &&
      meetsArtifactFilter(row),
  );
  fribbelsFilteredBuilds = filtered;
  fribbelsSetGridData(filtered);
  fribbelsUpdateSummary(filtered, fribbelsAllBuilds.length);
}

// ── Summary analytics ─────────────────────────────────────────────────────────

function fribbelsRenderStatsTbody(rows) {
  const statDefs = [
    ['GS', (r) => r.gs],
    ['BS', (r) => r.bs],
    ['SPD', (r) => r.spd],
    ['ATK', (r) => r.atk],
    ['DEF', (r) => r.def],
    ['HP', (r) => r.hp],
    ['CR', (r) => r.chc],
    ['CD', (r) => r.chd],
    ['EFF', (r) => r.eff],
    ['RES', (r) => r.efr],
    ['EHP', (r) => r.ehp],
    ['HPS', (r) => r.hps],
    ['EHP/s', (r) => r.ehps],
    ['DMG', (r) => r.dmg],
    ['DMG/s', (r) => r.dmgs],
    ['MCD', (r) => r.mcd],
    ['MCD/s', (r) => r.mcds],
    ['DMG-H', (r) => r.dmgh],
    ['DMG-D', (r) => r.dmgd],
    ['HMCDs', (r) => r.hmcdmgs],
    ['DMCDs', (r) => r.dmcdmgs],
    ['hDMG', (r) => r.hdmg],
    ['hDMG/s', (r) => r.hdmgs],
    ['dDMG', (r) => r.ddmg],
    ['dDMG/s', (r) => r.ddmgs],
  ];
  if (rows.some((r) => r.s1 > 0)) statDefs.push(['S1', (r) => r.s1]);
  if (rows.some((r) => r.s2 > 0)) statDefs.push(['S2', (r) => r.s2]);
  if (rows.some((r) => r.s3 > 0)) statDefs.push(['S3', (r) => r.s3]);
  return FribbelsPriorityFilter.computeStatSummary(rows, statDefs)
    .map(
      ({ label, avg, p50, min, max }) =>
        `<tr><td>${label}</td><td>${avg.toLocaleString()}</td><td>${p50.toLocaleString()}</td><td>${min.toLocaleString()}</td><td>${max.toLocaleString()}</td></tr>`,
    )
    .join('');
}

function fribbelsRenderSetsTbody(rows) {
  const freq = {};
  rows.forEach((r) => {
    const key = fribbelsAbbrevSets(r.sets);
    freq[key] = (freq[key] || 0) + 1;
  });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return sorted
    .map(
      ([combo, cnt]) =>
        `<tr><td>${combo}</td><td>${cnt}</td><td>${Math.round((cnt / rows.length) * 100)}%</td></tr>`,
    )
    .join('');
}

function fribbelsUpdateSummary(rows, total) {
  const countEl = document.getElementById('fribbels-summary-count');
  if (countEl)
    countEl.textContent = `${rows.length.toLocaleString()} / ${total.toLocaleString()} builds`;

  const statsTbody = document.getElementById('fribbels-stats-summary-tbody');
  if (statsTbody) {
    statsTbody.innerHTML =
      rows.length === 0
        ? '<tr><td colspan="5" style="color:#999;text-align:center">No builds</td></tr>'
        : fribbelsRenderStatsTbody(rows);
  }

  const setsTbody = document.getElementById('fribbels-sets-summary-tbody');
  if (setsTbody) {
    setsTbody.innerHTML =
      rows.length === 0
        ? '<tr><td colspan="3" style="color:#999;text-align:center">No builds</td></tr>'
        : fribbelsRenderSetsTbody(rows);
  }
}

// ── Priority slider actions ───────────────────────────────────────────────────

const PRIORITY_SLIDER_MAP = {
  atk: 'atkSliderInput',
  def: 'defSliderInput',
  hp: 'hpSliderInput',
  spd: 'spdSliderInput',
  cr: 'crSliderInput',
  cd: 'cdSliderInput',
  eff: 'effSliderInput',
  res: 'resSliderInput',
};

function fribbelsApplyPriorities(priorities) {
  for (const [key, priority] of Object.entries(priorities)) {
    const input = document.getElementById(PRIORITY_SLIDER_MAP[key]);
    if (!input) continue;
    input.value = String(priority);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  _deps.updatePriorityWeightBar('');
  _deps.recalculateFilters();
}

function fribbelsAutoPriorities(row) {
  if (!row) return;
  const base = fribbelsBaseStats || _deps.getCurrentHero()?.baseStats || {};
  const artiStats = fribbelsGetArtiStats(row.artifactName);
  fribbelsApplyPriorities(
    FribbelsPriorityFilter.computePrioritiesFromRow(
      row,
      base,
      row.sets || {},
      artiStats,
    ),
  );
}

function fribbelsP50Priorities() {
  if (!fribbelsFilteredBuilds.length) return;
  const base = fribbelsBaseStats || _deps.getCurrentHero()?.baseStats || {};

  const allPriorities = fribbelsFilteredBuilds.map((row) => {
    const artiStats = fribbelsGetArtiStats(row.artifactName);
    return FribbelsPriorityFilter.computePrioritiesFromRow(
      row,
      base,
      row.sets || {},
      artiStats,
    );
  });

  const STATS = ['atk', 'def', 'hp', 'spd', 'cr', 'cd', 'eff', 'res'];
  const medPriorities = {};
  STATS.forEach((stat) => {
    const vals = allPriorities.map((p) => p[stat]).sort((a, b) => a - b);
    medPriorities[stat] = FribbelsPriorityFilter.computeMedian(vals);
  });

  fribbelsApplyPriorities(medPriorities);
}

// ── Apply row to optimizer form ───────────────────────────────────────────────

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
    setVal('inputMinEhppsLimit', row.ehps);
    setVal('inputMinDmgLimit', row.dmg);
    setVal('inputMinDmgpsLimit', row.dmgs);
    setVal('inputMinMcdmgLimit', row.mcd);
    if (row.s1 > 0) setVal('inputMinS1Limit', row.s1);
    if (row.s2 > 0) setVal('inputMinS2Limit', row.s2);
    if (row.s3 > 0) setVal('inputMinS3Limit', row.s3);
  }
  _deps.recalculateFilters();
}

// ── UI population helpers ─────────────────────────────────────────────────────

function fribbelsPopulateSetFilterUI() {
  const container = document.getElementById('fribbels-filter-sets-container');
  if (!container) return;
  const twoPieceSets = Object.keys(FRIBBELS_SET_ABBREV).filter(
    (key) => !FRIBBELS_FOUR_PIECE_SETS.includes(key),
  );
  function makeCol(heading, keys) {
    const col = document.createElement('div');
    col.className = 'fribbels-filter-sets-col';
    const hdr = document.createElement('div');
    hdr.className = 'fribbels-filter-sets-col-label';
    hdr.textContent = heading;
    col.appendChild(hdr);
    keys.forEach((key) => {
      const abbrev = FRIBBELS_SET_ABBREV[key] || key;
      const gameName = FRIBBELS_SET_KEY_TO_GAME_NAME[key];
      const lbl = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = `fFilter-${key}`;
      const img = document.createElement('img');
      img.src = Assets.getSetAsset(gameName) || '';
      img.alt = abbrev;
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
  const list = document.getElementById('fFilter-artifactList');
  const search = document.getElementById('fFilter-artifactSearch');
  if (!list) return;
  if (search) search.value = '';
  const codesInBuilds = new Set(
    fribbelsAllBuilds.map((r) => r.artifactCode).filter(Boolean),
  );
  if (codesInBuilds.size === 0) {
    list.innerHTML =
      '<div style="color:#aaa;font-size:10px;padding:2px 0">No artifact data</div>';
    return;
  }
  const entries = [...codesInBuilds].map((code) => ({
    code,
    name: fribbelsArtifactName(code),
  }));
  entries.sort((a, b) => a.name.localeCompare(b.name));
  list.innerHTML = '';
  entries.forEach(({ code, name }) => {
    const lbl = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = code;
    cb.className = 'fFilter-artifact-cb';
    lbl.appendChild(cb);
    lbl.appendChild(document.createTextNode(` ${name}`));
    list.appendChild(lbl);
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

const FribbelsLibrary = {
  /**
   * Wire dependencies and register all Fribbels-related DOM event listeners.
   * Call once from OptimizerTab.initialize() after DOM is ready.
   *
   * @param {{ recalculateFilters: Function, updatePriorityWeightBar: Function, getCurrentHero: Function }} deps
   */
  init(deps) {
    _deps = deps;

    fribbelsPopulateSetFilterUI();

    document
      .getElementById('fribbels-fetch-btn')
      ?.addEventListener('click', () => {
        fribbelsLoadedHeroName = null;
        fribbelsAllBuilds = [];
        fribbelsCurrentBuildRow = null;
        fribbelsLoadData();
      });

    document
      .getElementById('fribbelsSetTargets')
      ?.addEventListener('click', () => {
        fribbelsApplyRow(fribbelsSelectedRow, 'targets');
      });
    document
      .getElementById('fribbelsSetMinLimits')
      ?.addEventListener('click', () => {
        fribbelsApplyRow(fribbelsSelectedRow, 'minlimits');
      });
    document
      .getElementById('fribbelsAutoPriorities')
      ?.addEventListener('click', () => {
        fribbelsAutoPriorities(fribbelsSelectedRow);
      });
    document
      .getElementById('fribbelsP50Priorities')
      ?.addEventListener('click', () => {
        fribbelsP50Priorities();
      });
    document
      .getElementById('fribbelsDeselectRow')
      ?.addEventListener('click', () => {
        fribbelsDeselectRow();
      });

    document
      .getElementById('fribbels-filter-btn')
      ?.addEventListener('click', (e) => {
        e.stopPropagation();
        document
          .getElementById('fribbels-filter-popup')
          ?.classList.toggle('display-none');
      });
    document
      .getElementById('fribbels-filter-close-btn')
      ?.addEventListener('click', () => {
        document
          .getElementById('fribbels-filter-popup')
          ?.classList.add('display-none');
      });
    document
      .getElementById('fribbels-filter-apply-btn')
      ?.addEventListener('click', () => {
        document
          .getElementById('fribbels-filter-popup')
          ?.classList.add('display-none');
        fribbelsApplyFilters();
      });

    document
      .getElementById('fribbels-filter-reset-btn')
      ?.addEventListener('click', () => {
        [
          'minGS',
          'minBS',
          'minSPD',
          'minATK',
          'minDEF',
          'minHP',
          'minCR',
          'minCD',
          'minEFF',
          'minRES',
          'minEHP',
          'minS1',
          'minS2',
          'minS3',
        ].forEach((id) => {
          const el = document.getElementById(`fFilter-${id}`);
          if (el) el.value = '';
        });
        Object.keys(FRIBBELS_SET_ABBREV).forEach((key) => {
          const el = document.getElementById(`fFilter-${key}`);
          if (el) el.checked = false;
        });
        const artifactSearch = document.getElementById(
          'fFilter-artifactSearch',
        );
        if (artifactSearch) artifactSearch.value = '';
        document.querySelectorAll('.fFilter-artifact-cb').forEach((cb) => {
          cb.checked = false;
        });
        document
          .querySelectorAll('#fFilter-artifactList label')
          .forEach((lbl) => lbl.classList.remove('hidden'));
        fribbelsApplyFilters();
      });

    document
      .getElementById('fribbels-summary-btn')
      ?.addEventListener('click', () => {
        document
          .getElementById('fribbels-summary-panel')
          ?.classList.toggle('display-none');
      });

    document
      .getElementById('fFilter-artifactSearch')
      ?.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        document
          .querySelectorAll('#fFilter-artifactList label')
          .forEach((lbl) => {
            lbl.classList.toggle(
              'hidden',
              !lbl.textContent.toLowerCase().includes(q),
            );
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
  },

  // ── State accessors ─────────────────────────────────────────────────────────
  getSelectedRow() {
    return fribbelsSelectedRow;
  },
  getLoadedHeroName() {
    return fribbelsLoadedHeroName;
  },

  // ── Panel lifecycle (called from optimizerTab.js switchBottomTab) ───────────
  initGrid() {
    FribbelsGrid.init({
      onRowClick: (row) => fribbelsSelectRow(row),
      artifactName: (code) => fribbelsArtifactName(code),
      setIcons: (sets) => fribbelsSetIcons(sets),
      abbrevSets: (sets) => fribbelsAbbrevSets(sets),
    });
  },
  loadData() {
    fribbelsLoadData();
  },
  applyFilters() {
    fribbelsApplyFilters();
  },
  /**
   * Re-render the library grid when the shared CR-push / eff-weight inputs change
   * on the Optimizer tab, so the FSpd/SpdEff columns update live.  Re-runs the
   * normal filter→setData path (which re-decorates, re-aggregates and re-sorts).
   */
  refreshCalcColumns() {
    if (!FribbelsGrid.isReady() || !fribbelsAllBuilds.length) return;
    fribbelsApplyFilters();
  },
  deselectRow() {
    fribbelsDeselectRow();
  },
  restorePresetRow(row) {
    fribbelsRestorePresetRow(row);
  },

  // ── Hero change cleanup ──────────────────────────────────────────────────────
  resetForHeroChange() {
    fribbelsLoadedHeroName = null;
    fribbelsSelectedRow = null;
    fribbelsAllBuilds = [];
    fribbelsCurrentBuildRow = null;
  },
};

// Expose globally so OptimizerGrid.refreshCalcInputs() can trigger a live
// refresh of the library's FSpd/SpdEff columns from the Optimizer tab's inputs.
globalThis.FribbelsLibrary = FribbelsLibrary;

export default FribbelsLibrary;

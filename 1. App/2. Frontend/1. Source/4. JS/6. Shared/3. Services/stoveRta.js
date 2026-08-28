import https from 'node:https';
import zlib from 'node:zlib';
import RtaStats from './rtaStats';
import { readDiskCache, writeDiskCache } from './diskCache';
// ---------------------------------------------------------------------------
// Official E7 Stove RTA analysis service.  Unlike epic7rtastats (combined
// champion+), the Stove getHeroAnalysis API is split BY RANK/grade and is far
// richer: per-stat distribution → tier (1–6, mapping onto the Fribbels priority
// sliders), equip combos with win rate, pick/ban by draft slot, and recommended
// skill levels.  Ported from the personal "Hero Analyzer" Apps Script.
//
// A grade RANGE (e.g. Champion → Legend) is supported by aggregating the RAW
// per-grade data: stat bucket-counts are summed then re-peaked; equip and skill
// distributions are games-weighted.  Runs in the renderer via Node https.
// ---------------------------------------------------------------------------

const E7_STOVE_API = {
  BASE_URL: 'https://e7api.onstove.com/gameApi',
  CALLER_ID: 'WEB_STOVE_EPIC7',
  ORIGIN: 'https://epic7.onstove.com',
};

// RTA grades, strongest → weakest.  Champion is the default high-meta view.
const GRADE_CODES = [
  'legend',
  'emperor',
  'warlord',
  'champion',
  'challenger',
  'master',
  'gold',
  'silver',
  'bronze',
];

// set_code → Fribbels display name + Target-Sets key (for "apply").
const SET_NAME = {
  set_acc: 'Hit',
  set_att: 'Attack',
  set_coop: 'Unity',
  set_counter: 'Counter',
  set_cri_dmg: 'Destruction',
  set_cri: 'Critical',
  set_def: 'Defense',
  set_immune: 'Immunity',
  set_max_hp: 'Health',
  set_penetrate: 'Penetration',
  set_rage: 'Rage',
  set_res: 'Resist',
  set_revenge: 'Revenge',
  set_scar: 'Injury',
  set_speed: 'Speed',
  set_vampire: 'Lifesteal',
  set_shield: 'Protection',
  set_torrent: 'Torrent',
  set_revenant: 'Reversal',
  set_riposte: 'Riposte',
  set_opener: 'Warfare',
  set_chase: 'Pursuit',
  set_might: 'Fervor',
  set_weak: 'Weakening',
};
const setKey = (code) => `${SET_NAME[code] || code}Set`;

// 11-element boundary arrays → 10 buckets.  Index i covers [bounds[i], bounds[i+1]).
const STAT_BUCKET_BOUNDS = {
  spd: [110, 126, 142, 158, 174, 190, 206, 222, 238, 254, 270],
  atk: [1200, 1600, 2000, 2400, 2800, 3200, 3600, 4000, 4400, 4800, 5200],
  def: [800, 960, 1120, 1280, 1440, 1600, 1760, 1920, 2080, 2240, 2400],
  hp: [
    9000, 10600, 12200, 13800, 15400, 17000, 18600, 20200, 21800, 23400, 25000,
  ],
  chc: [15, 24, 32, 41, 49, 58, 66, 75, 83, 92, 100],
  chd: [150, 170, 190, 210, 230, 250, 270, 290, 310, 330, 350],
  eff: [0, 18, 36, 54, 72, 90, 108, 126, 144, 162, 180],
  res: [0, 23, 45, 68, 90, 113, 135, 158, 180, 203, 225],
};
const STAT_KEYS = ['atk', 'def', 'hp', 'spd', 'chc', 'chd', 'eff', 'res'];
const SKILL_LEVELS = [
  '+1',
  '+2',
  '+3',
  '+4',
  '+5',
  '+6',
  '+7',
  '+8',
  '+9',
  '+10',
];

// Map a peak bucket index (0–9) onto the 1–6 Fribbels slider dot.
function _statPeakTier(peakIdx) {
  if (peakIdx < 0) return 0;
  if (peakIdx <= 1) return 1; // very low
  if (peakIdx <= 3) return 2; // low
  if (peakIdx <= 5) return 3; // mid
  if (peakIdx <= 7) return 4; // mid-high
  if (peakIdx <= 8) return 5; // high
  return 6; // very high (open-ended bucket)
}

// Parse a "129,142,252,…" distribution string into a 10-length count array (or null).
function _counts(str) {
  if (!str) return null;
  const c = String(str).split(',').map(Number);
  return c.length === 10 ? c : null;
}

// Decode a 10-bucket count array → peak bucket, tier, range, and peak %.
function _decodeCounts(counts, bounds) {
  if (!counts || !bounds || counts.length !== 10) return null;
  const total = counts.reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0);
  if (total === 0) return null;
  let peakIdx = 0;
  for (let i = 1; i < counts.length; i += 1) {
    if (counts[i] > counts[peakIdx]) peakIdx = i;
  }
  const lo = bounds[peakIdx];
  const hi = bounds[peakIdx + 1];
  const open = peakIdx === counts.length - 1;
  return {
    peakIdx,
    tier: _statPeakTier(peakIdx),
    range: open ? `${lo}+` : `${lo}–${hi}`,
    peakLow: lo,
    // Open bucket ("270+") has no upper bound — use the floor so the apply target
    // ((peakLow+peakHigh)/2) resolves to that floor rather than Infinity.
    peakHigh: open ? lo : hi,
    pct: ((counts[peakIdx] / total) * 100).toFixed(1) + '%',
  };
}

// ── HTTP (POST, gzip-aware) ───────────────────────────────────────────────────
function _uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function _headers() {
  return {
    'caller-id': E7_STOVE_API.CALLER_ID,
    'caller-detail': _uuid(),
    origin: E7_STOVE_API.ORIGIN,
    referer: `${E7_STOVE_API.ORIGIN}/`,
    'content-type': 'application/json;charset=UTF-8',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Accept-Encoding': 'gzip, deflate, br',
  };
}

function _stovePost(url) {
  return new Promise((resolve, reject) => {
    let u;
    try {
      u = new URL(url);
    } catch (e) {
      reject(e);
      return;
    }
    const req = https.request(
      {
        method: 'POST',
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: { ..._headers(), 'Content-Length': 0 },
      },
      (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('error', reject);
        res.on('end', () => {
          try {
            let buf = Buffer.concat(chunks);
            const enc = String(
              res.headers['content-encoding'] || '',
            ).toLowerCase();
            if (enc === 'gzip') buf = zlib.gunzipSync(buf);
            else if (enc === 'br') buf = zlib.brotliDecompressSync(buf);
            else if (enc === 'deflate') buf = zlib.inflateSync(buf);
            resolve(buf.toString('utf8'));
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on('error', reject);
    req.setTimeout(20000, () =>
      req.destroy(new Error('Stove request timed out')),
    );
    req.end();
  });
}

// ── Disk cache: current season + per (heroCode, grade, season) RAW analysis ───
const CACHE_FILE = 'stovertacache.json';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;
let _seasonCode = null;
let _cache = null; // { season:{ts,code}, analysis:{ 'code:grade:season':{ts,raw} } }

function _loadCache() {
  if (!_cache) _cache = readDiskCache(CACHE_FILE) || {};
  if (!_cache.analysis) _cache.analysis = {};
  return _cache;
}

function _evictAndSave(cache) {
  const keys = Object.keys(cache.analysis);
  if (keys.length > CACHE_MAX_ENTRIES) {
    keys
      .sort((a, b) => (cache.analysis[a].ts || 0) - (cache.analysis[b].ts || 0))
      .slice(0, keys.length - CACHE_MAX_ENTRIES)
      .forEach((k) => delete cache.analysis[k]);
  }
  writeDiskCache(CACHE_FILE, cache);
}

async function getCurrentSeasonCode() {
  if (_seasonCode) return _seasonCode;
  const cache = _loadCache();
  if (
    cache.season &&
    cache.season.code &&
    cache.season.ts &&
    Date.now() - cache.season.ts < CACHE_TTL_MS
  ) {
    _seasonCode = cache.season.code;
    return _seasonCode;
  }
  const text = await _stovePost(
    `${E7_STOVE_API.BASE_URL}/getSeasonList?lang=en`,
  );
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error('Stove season list was not JSON.', { cause: e });
  }
  // Stove wraps payloads as { value: { result_body: {...} } } (like getHeroAnalysis).
  const root = (json.value && json.value.result_body) || json.result || json;
  const list =
    (root &&
      (root.season_list ||
        root.seasonList ||
        root.seasons ||
        root.list ||
        (Array.isArray(root) ? root : null))) ||
    [];
  const seasons = Array.isArray(list) ? list : [];
  const newest = seasons[0] || {};
  _seasonCode =
    newest.season_code || newest.seasonCode || newest.code || newest.id || null;
  if (!_seasonCode) {
    const msg =
      (json.value && json.value.result_message) ||
      json.message ||
      json.result_message;
    Log.error(
      '[stoveRta] Unrecognized getSeasonList response:',
      JSON.stringify(json).slice(0, 1000),
    );
    throw new Error(
      `Could not resolve current RTA season${msg ? ` (${msg})` : ' — unexpected Stove response, see console'}.`,
    );
  }
  cache.season = { ts: Date.now(), code: _seasonCode };
  writeDiskCache(CACHE_FILE, cache);
  return _seasonCode;
}

async function getHeroAnalysis(heroCode, seasonCode, gradeCode) {
  const url =
    `${E7_STOVE_API.BASE_URL}/getHeroAnalysis?hero_code=${encodeURIComponent(heroCode)}` +
    `&season_code=${encodeURIComponent(seasonCode)}` +
    `&grade_code=${encodeURIComponent(gradeCode)}&lang=en`;
  return JSON.parse(await _stovePost(url));
}

// Extract the RAW (un-decoded) numbers we aggregate over: total games, the season
// win %, equip combos (games derivable from rate × games), 3 skill level-count
// arrays, and the 8 stat 10-bucket count arrays.
function _extractRaw(apiResult, seasonCode) {
  const body =
    (apiResult.value && apiResult.value.result_body) ||
    apiResult.result ||
    apiResult;

  const totalGames = Number(body.current_seasontier_tot) || 0;
  const winArr = Array.isArray(body.win_rate) ? body.win_rate : [];
  const cur =
    winArr.find((s) => s.season_code === seasonCode) || winArr[0] || {};
  const winPct =
    cur.win_rate !== undefined && cur.win_rate !== ''
      ? Number(cur.win_rate)
      : null;
  const rank = cur.rank !== undefined ? Number(cur.rank) : null;

  const equip = (Array.isArray(body.equip) ? body.equip : []).map((e) => {
    const codes = Array.isArray(e.equip_list) ? e.equip_list : [];
    return {
      codes,
      key: codes.join('+'),
      rate: Number(e.rate) || 0, // use %
      win:
        e.win_rate !== undefined && e.win_rate !== ''
          ? Number(e.win_rate)
          : null,
    };
  });

  const rec = body.recommend_skill || {};
  const names = Array.isArray(rec.name) ? rec.name : [];
  const slist = Array.isArray(rec.list) ? rec.list : [];
  const skills = [0, 1, 2].map((idx) => {
    const entry = slist.find((s) => s.skill === idx + 1);
    return {
      name: names[idx] || '',
      counts: entry ? _counts(entry.level) : null,
    };
  });

  const ab = body.abillity || body.ability || {};
  const dist = {
    atk: _counts(ab.att || ab.atk),
    def: _counts(ab.def),
    hp: _counts(ab.max_hp || ab.hp),
    spd: _counts(ab.speed || ab.spd),
    chc: _counts(ab.cri || ab.chc),
    chd: _counts(ab.cri_dmg || ab.chd),
    eff: _counts(ab.acc || ab.eff),
    res: _counts(ab.res),
  };

  return { totalGames, winPct, rank, equip, skills, dist };
}

// Cached RAW per (code, grade, season).
async function getHeroAnalysisRaw(code, grade, season) {
  const cache = _loadCache();
  const key = `${code}:${grade}:${season}`;
  const hit = cache.analysis[key];
  if (hit && hit.ts && Date.now() - hit.ts < CACHE_TTL_MS && hit.raw)
    return hit.raw;
  const raw = _extractRaw(await getHeroAnalysis(code, season, grade), season);
  cache.analysis[key] = { ts: Date.now(), raw };
  _evictAndSave(cache);
  return raw;
}

// Aggregate one-or-more grades' RAW data into one combined raw.
function _aggregate(raws) {
  const totalGames = raws.reduce((a, r) => a + (r.totalGames || 0), 0);

  // Games-weighted win %.
  let winAcc = 0;
  let winGames = 0;
  raws.forEach((r) => {
    if (r.winPct != null && r.totalGames > 0) {
      winAcc += r.winPct * r.totalGames;
      winGames += r.totalGames;
    }
  });
  const winPct = winGames > 0 ? winAcc / winGames : null;

  const ranks = raws.map((r) => r.rank).filter((n) => Number.isFinite(n));
  const rank = ranks.length ? Math.min(...ranks) : null; // best (lowest) rank in range

  // Equip: combine by set-combo key; games = rate% × that grade's games.
  const equipMap = {};
  raws.forEach((r) => {
    r.equip.forEach((e) => {
      const games = (e.rate / 100) * (r.totalGames || 0);
      if (!equipMap[e.key])
        equipMap[e.key] = { codes: e.codes, games: 0, winAcc: 0, winGames: 0 };
      equipMap[e.key].games += games;
      if (e.win != null) {
        equipMap[e.key].winAcc += e.win * games;
        equipMap[e.key].winGames += games;
      }
    });
  });
  const equip = Object.values(equipMap);

  // Skills: sum level counts per skill index across grades.
  const skills = [0, 1, 2].map((idx) => {
    let name = '';
    const summed = new Array(10).fill(0);
    let any = false;
    raws.forEach((r) => {
      const sk = r.skills[idx];
      if (sk && sk.name && !name) name = sk.name;
      if (sk && sk.counts && sk.counts.length === 10) {
        any = true;
        for (let i = 0; i < 10; i += 1) summed[i] += sk.counts[i] || 0;
      }
    });
    return { name, counts: any ? summed : null };
  });

  // Stat distributions: sum bucket counts per stat across grades.
  const dist = {};
  STAT_KEYS.forEach((k) => {
    const summed = new Array(10).fill(0);
    let any = false;
    raws.forEach((r) => {
      const c = r.dist[k];
      if (c && c.length === 10) {
        any = true;
        for (let i = 0; i < 10; i += 1) summed[i] += c[i] || 0;
      }
    });
    dist[k] = any ? summed : null;
  });

  return { totalGames, winPct, rank, equip, skills, dist };
}

// Decode the aggregated raw into the display structure the dialog renders.
function _decode(agg, gradeLabel) {
  const stats = {};
  STAT_KEYS.forEach((k) => {
    stats[k] = _decodeCounts(agg.dist[k], STAT_BUCKET_BOUNDS[k]);
  });

  const equip = agg.equip
    .map((e) => ({
      label: e.codes.map((c) => SET_NAME[c] || c).join(' + '),
      setKeys: e.codes.map(setKey),
      usagePctNum: agg.totalGames > 0 ? (e.games / agg.totalGames) * 100 : 0,
      usePct:
        agg.totalGames > 0
          ? `${((e.games / agg.totalGames) * 100).toFixed(1)}%`
          : '',
      winPct: e.winGames > 0 ? `${(e.winAcc / e.winGames).toFixed(1)}%` : '',
    }))
    .sort((a, b) => b.usagePctNum - a.usagePctNum)
    .slice(0, 5);

  const skills = agg.skills.map((sk) => {
    if (!sk.counts) return { name: sk.name, top: null };
    const total = sk.counts.reduce((a, b) => a + b, 0);
    if (total === 0) return { name: sk.name, top: null };
    let pk = 0;
    for (let i = 1; i < sk.counts.length; i += 1)
      if (sk.counts[i] > sk.counts[pk]) pk = i;
    return {
      name: sk.name,
      top: {
        level: SKILL_LEVELS[pk],
        pct: ((sk.counts[pk] / total) * 100).toFixed(0) + '%',
      },
    };
  });

  return {
    grade: gradeLabel,
    totalGames: agg.totalGames,
    winRate: agg.winPct != null ? `${agg.winPct.toFixed(1)}%` : '',
    rank: agg.rank ?? '',
    equip,
    skills,
    stats,
  };
}

// The contiguous grade slice between two grades (inclusive), strongest → weakest.
function _gradeRange(a, b) {
  const ia = GRADE_CODES.indexOf(a);
  const ib = GRADE_CODES.indexOf(b);
  if (ia < 0 && ib < 0) return ['champion'];
  if (ia < 0) return [b];
  if (ib < 0) return [a];
  return GRADE_CODES.slice(Math.min(ia, ib), Math.max(ia, ib) + 1);
}

const _cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Analyze one Fribbels hero across a grade range (single grade if from === to).
async function analyzeHeroStoveRange(
  fribbelsHeroName,
  gradeFrom = 'champion',
  gradeTo,
) {
  const code = await RtaStats.resolveHeroCode(fribbelsHeroName);
  if (!code) throw new Error(`No Stove entry for "${fribbelsHeroName}".`);
  const season = await getCurrentSeasonCode();
  const grades = _gradeRange(gradeFrom, gradeTo || gradeFrom);
  const label =
    grades.length === 1
      ? _cap(grades[0])
      : `${_cap(grades[grades.length - 1])}–${_cap(grades[0])}`;

  // Fetch every grade in parallel and tolerate partial failure: one slow/empty grade
  // no longer blocks (was 20s × N sequential) or fails the whole range — we aggregate
  // whatever came back and report which grades were dropped.
  const settled = await Promise.allSettled(
    grades.map((g) => getHeroAnalysisRaw(code, g, season)),
  );
  const raws = [];
  const dropped = [];
  settled.forEach((res, i) => {
    if (res.status === 'fulfilled' && res.value && res.value.totalGames > 0) {
      raws.push(res.value);
    } else {
      dropped.push(_cap(grades[i]));
    }
  });
  if (raws.length === 0) {
    throw new Error(`No Stove data for "${fribbelsHeroName}" in ${label}.`);
  }
  const result = {
    heroCode: code,
    season,
    ..._decode(_aggregate(raws), label),
  };
  if (dropped.length) result.droppedGrades = dropped;
  return result;
}

// Back-compat single-grade entry point.
function analyzeHeroStove(fribbelsHeroName, gradeCode = 'champion') {
  return analyzeHeroStoveRange(fribbelsHeroName, gradeCode, gradeCode);
}

const StoveRta = {
  GRADE_CODES,
  getCurrentSeasonCode,
  getHeroAnalysis,
  analyzeHeroStove,
  analyzeHeroStoveRange,
};

export default StoveRta;

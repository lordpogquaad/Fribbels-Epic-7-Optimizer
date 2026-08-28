import https from 'node:https';
import zlib from 'node:zlib';
import { readDiskCache, writeDiskCache } from './diskCache';
import { SET_CODE_TO_DISPLAY, FOUR_PIECE_CODES } from './setData';
// ---------------------------------------------------------------------------
// RTA meta-stats service — scrapes epic7rtastats.com for a hero's RTA usage /
// pick / win / low-pick rate plus the per-hero set-combo breakdown.  Ported from
// the personal "Fribbels Hero Analyzer" Google Apps Script.
//
// Runs directly in the renderer: Electron here has nodeIntegration on and no
// webSecurity wall (the Hero Library already does cross-origin fetch), so the
// RSC requests with custom headers work without a proxy or the Java backend.
//
// FRAGILITY: if Analyze suddenly returns "no data", the RSC request shape went stale.
// The more likely culprit is the route STATE-TREE (`_stateTree`, encodes the site's
// route segments); `_rsc` below is most likely just a Next.js CDN cache-buster.  Auto-
// detecting `_rsc` was evaluated and declined (it isn't reliably in the page HTML, and
// threading a wrong value through the token-keyed caches would break a working path).
// Instead, getHeroList() now fails loud + actionable when the payload parses to zero
// heroes.  To fix a real break: open the site, inspect a /heroes RSC request, and update
// RSC_TOKEN and/or `_stateTree` below.
// ---------------------------------------------------------------------------

const RTA_BASE = 'https://www.epic7rtastats.com/heroes';
const RSC_TOKEN = '10kex';
const STOVE_HERO_JSON =
  'https://static-pubcomm.onstove.com/gameRecord/epic7/epic7_hero.json';

// epic7rtastats set_code → Fribbels set display name, and the 4-piece set codes —
// both from the shared single source of truth (./setData) so this and communityBuilds
// can't drift apart (the cause of the earlier Fervor/Weakening bug).
const SET_NAMES = SET_CODE_TO_DISPLAY;
const FOUR_PIECE_SET_CODES = FOUR_PIECE_CODES;

// ── module caches (per session) ───────────────────────────────────────────────
let _heroCodeMap = null; // { stoveName: hero_code }
let _heroListByCode = null; // { hero_code: rawStat }
let _highPickCodes = null; // Set of hero_codes that survive the low-pick filter
let _gamesCount = 0;

// Strip the Fribbels duplicate suffix ("Cermia #1" → "Cermia"); the Stove "en"
// names line up with Fribbels display names otherwise.
function _baseName(name) {
  return (name || '').replace(/\s#\d+$/, '').trim();
}

// Fribbels display name → Stove "en" name, for the few that GENUINELY differ in
// spelling.  Most match 1:1, and _resolveCode's punctuation/case/spacing-insensitive
// fallback (_norm) already absorbs formatting differences — so only add an entry here
// for a confirmed real-word mismatch (a wrong alias mis-maps to the wrong hero, which
// is worse than a clean "not found").  When a lookup fails, _suggestNames surfaces the
// closest Stove names so the exact mismatch can be confirmed before adding it here.
const NAME_ALIASES = {
  "Jack-O'": 'Jack-O', // some sources show the apostrophe; Stove "en" uses "Jack-O"
};

function _norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Resolve a hero name → RTA/Stove code: exact → alias → normalized fallback.
function _resolveCode(codeMap, name) {
  if (!codeMap) return null;
  if (codeMap[name]) return codeMap[name];
  const alias = NAME_ALIASES[name];
  if (alias && codeMap[alias]) return codeMap[alias];
  const target = _norm(name);
  const keys = Object.keys(codeMap);
  for (let i = 0; i < keys.length; i += 1) {
    if (_norm(keys[i]) === target) return codeMap[keys[i]];
  }
  return null;
}

// Closest Stove names to a failed lookup (normalized substring match), so an
// unresolved hero produces an actionable "did you mean …" instead of a dead end —
// and tells you the exact spelling to add to NAME_ALIASES if it's a real mismatch.
function _suggestNames(codeMap, name) {
  if (!codeMap) return [];
  const target = _norm(name);
  if (!target) return [];
  const out = [];
  const keys = Object.keys(codeMap);
  for (let i = 0; i < keys.length && out.length < 3; i += 1) {
    const nk = _norm(keys[i]);
    if (nk && (nk.includes(target) || target.includes(nk))) out.push(keys[i]);
  }
  return out;
}

// ── Disk cache (survives restarts) ────────────────────────────────────────────
// The hero list + Stove code map are large and shared across every Analyze, so
// persist them.  Keyed by RSC token so a token change auto-invalidates; TTL-bounded.
let _diskHydrated = false;
const CACHE_FILE = 'rtastatscache.json';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h

function _hydrateFromDisk() {
  if (_diskHydrated) return;
  _diskHydrated = true;
  const c = readDiskCache(CACHE_FILE);
  if (!c || c.rscToken !== RSC_TOKEN) return; // token change → invalidate
  if (!c.ts || Date.now() - c.ts > CACHE_TTL_MS) return; // expired
  if (c.codeMap) _heroCodeMap = c.codeMap;
  if (c.heroListByCode) _heroListByCode = c.heroListByCode;
  if (Array.isArray(c.highPickCodes)) _highPickCodes = new Set(c.highPickCodes);
  if (typeof c.gamesCount === 'number') _gamesCount = c.gamesCount;
}

function _saveDiskCache() {
  writeDiskCache(CACHE_FILE, {
    ts: Date.now(),
    rscToken: RSC_TOKEN,
    codeMap: _heroCodeMap,
    heroListByCode: _heroListByCode,
    highPickCodes: _highPickCodes ? [..._highPickCodes] : null,
    gamesCount: _gamesCount,
  });
}

// Next-Router-State-Tree header value: the heroes-list tree, or the hero-detail
// tree when a heroCode is given (mirrors the Apps Script exactly).
function _stateTree(heroCode) {
  if (heroCode) {
    return (
      '%5B%22%22%2C%7B%22children%22%3A%5B%22heroes%22%2C%7B%22children%22%3A%5B%22' +
      heroCode +
      '%22%2C%7B%7D%5D%7D%5D%7D%5D'
    );
  }
  return '%5B%22%22%2C%7B%22children%22%3A%5B%22heroes%22%2C%7B%7D%5D%7D%5D';
}

// Node https GET (renderer has nodeIntegration).  Used instead of browser fetch so
// the requests aren't subject to CORS — epic7rtastats / Stove don't send the
// permissive CORS headers the Hero Library's AWS endpoint does.  Follows redirects
// and transparently decompresses gzip / br / deflate (CDNs in front of these hosts
// can compress regardless of Accept-Encoding).
function _httpsGet(url, headers, redirectsLeft = 4) {
  return new Promise((resolve, reject) => {
    let req;
    try {
      req = https.get(
        url,
        {
          headers: {
            'Accept-Encoding': 'gzip, deflate, br',
            ...(headers || {}),
          },
        },
        (res) => {
          const { statusCode } = res;

          // Follow redirects (resolve relative Location against the current url).
          if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
            res.resume();
            if (redirectsLeft <= 0) {
              reject(new Error('Too many redirects'));
              return;
            }
            let next;
            try {
              next = new URL(res.headers.location, url).toString();
            } catch (e) {
              reject(e);
              return;
            }
            _httpsGet(next, headers, redirectsLeft - 1).then(resolve, reject);
            return;
          }

          if (statusCode < 200 || statusCode >= 300) {
            res.resume();
            reject(new Error(`HTTP ${statusCode}`));
            return;
          }

          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
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
    } catch (e) {
      reject(e);
      return;
    }
    req.on('error', reject);
    req.setTimeout(20000, () =>
      req.destroy(new Error('RTA request timed out')),
    );
  });
}

function _fetchRsc(url, heroCode) {
  return _httpsGet(url, {
    RSC: '1',
    'Next-Router-State-Tree': _stateTree(heroCode),
  });
}

// Return the balanced-bracket substring starting at `startIdx` (which must point
// at an `open` char), inclusive of the matching `close`.  Mirrors the Apps
// Script's manual bracket counting used to slice JSON out of the RSC payload.
function _sliceBalanced(content, startIdx, open, close) {
  let depth = 0;
  for (let i = startIdx; i < content.length; i += 1) {
    if (content[i] === open) depth += 1;
    else if (content[i] === close) {
      depth -= 1;
      if (depth === 0) return content.substring(startIdx, i + 1);
    }
  }
  return null;
}

// ── Hero code map (Stove hero JSON) ───────────────────────────────────────────
async function getHeroCodeMap() {
  _hydrateFromDisk();
  if (_heroCodeMap) return _heroCodeMap;
  const body = await _httpsGet(STOVE_HERO_JSON);
  const json = JSON.parse(body);
  const en = json.en || [];
  const map = {};
  en.forEach((h) => {
    if (h.name && h.code) map[h.name] = h.code;
  });
  _heroCodeMap = map;
  // Not persisted here — getHeroList() saves the full cache (codeMap + list) once it
  // runs (the only caller, analyzeHero, always calls both), avoiding a redundant
  // incomplete write.
  return map;
}

// ── Hero list + low-pick set ──────────────────────────────────────────────────
// Two cached calls: lowData=false yields ALL heroes (+ gamesCount); the default
// (filtered) call yields only non-low-pick heroes, so low-pick = not in that set.
async function getHeroList() {
  _hydrateFromDisk();
  if (_heroListByCode) {
    return {
      byCode: _heroListByCode,
      gamesCount: _gamesCount,
      highPick: _highPickCodes,
    };
  }

  const parseHeroArray = (content) => {
    const dataIdx = content.indexOf('"data":[{"hero_code"');
    if (dataIdx === -1) return [];
    const startIdx = content.indexOf('[', dataIdx);
    const arr = _sliceBalanced(content, startIdx, '[', ']');
    if (!arr) return [];
    try {
      return JSON.parse(arr);
    } catch {
      return [];
    }
  };

  // Full list (+ gamesCount metadata).  Critical call — failure aborts Analyze (no
  // usable data); the filtered call below is best-effort by contrast.
  let fullContent;
  try {
    fullContent = await _fetchRsc(
      `${RTA_BASE}?lowData=false&_rsc=${RSC_TOKEN}`,
      null,
    );
  } catch (e) {
    throw new Error(
      `Failed to fetch RTA hero list (the _rsc token may be stale): ${e.message}`,
      { cause: e },
    );
  }
  const gcMatch = fullContent.match(/"gamesCount":(\d+)/);
  _gamesCount = gcMatch ? parseInt(gcMatch[1], 10) : 0;
  const byCode = {};
  parseHeroArray(fullContent).forEach((s) => {
    byCode[s.hero_code] = s;
  });
  // A 200 that parses to zero heroes means the RSC payload shape changed (most
  // likely the route state-tree, possibly the _rsc token) — fail loud and actionable
  // instead of proceeding with an empty map that yields confusing "no data" later.
  if (Object.keys(byCode).length === 0) {
    throw new Error(
      'epic7rtastats returned no parseable hero data — the site structure or the ' +
        '_rsc token / route state-tree (rtaStats.js) likely changed and needs updating.',
    );
  }
  _heroListByCode = byCode;

  // Filtered list → high-pick code set (best-effort; low-pick flag degrades to
  // "unknown" if this call fails).
  try {
    const filtContent = await _fetchRsc(`${RTA_BASE}?_rsc=${RSC_TOKEN}`, null);
    const high = new Set();
    parseHeroArray(filtContent).forEach((s) => high.add(s.hero_code));
    _highPickCodes = high;
  } catch {
    _highPickCodes = null;
  }

  _saveDiskCache();
  return {
    byCode: _heroListByCode,
    gamesCount: _gamesCount,
    highPick: _highPickCodes,
  };
}

// ── Per-hero set breakdown (disk-cached) ──────────────────────────────────────
// Set breakdowns are stable per site build, so cache them on disk keyed by
// (heroCode, RSC_TOKEN) to avoid re-fetching/re-parsing on every Analyze or roster
// review.  TTL- and count-bounded; the RSC‑token key auto-invalidates on a new build.
const SET_CACHE_FILE = 'rtastatssetcache.json';
const SET_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h
const SET_CACHE_MAX = 100;
let _setCache = null; // { rscToken, heroes: { [code]: { ts, results } } }

function _loadSetCache() {
  if (_setCache) return _setCache;
  const c = readDiskCache(SET_CACHE_FILE);
  _setCache =
    c && c.rscToken === RSC_TOKEN && c.heroes
      ? c
      : { rscToken: RSC_TOKEN, heroes: {} };
  return _setCache;
}

function _readSetCache(heroCode) {
  const hit = _loadSetCache().heroes[heroCode];
  if (
    hit &&
    hit.ts &&
    Date.now() - hit.ts < SET_CACHE_TTL_MS &&
    Array.isArray(hit.results)
  ) {
    return hit.results;
  }
  return null;
}

function _writeSetCache(heroCode, results) {
  const cache = _loadSetCache();
  cache.heroes[heroCode] = { ts: Date.now(), results };
  const codes = Object.keys(cache.heroes);
  if (codes.length > SET_CACHE_MAX) {
    codes
      .sort((a, b) => (cache.heroes[a].ts || 0) - (cache.heroes[b].ts || 0))
      .slice(0, codes.length - SET_CACHE_MAX)
      .forEach((c) => delete cache.heroes[c]);
  }
  writeDiskCache(SET_CACHE_FILE, cache);
}

// Returns [{ fourPieceSet, twoPieceSets, setsUsage(games), setWinRate, setKeys[] }]
// sorted by usage desc.  Faithful port of fetchRTAStatsSetBreakdown.
async function getSetBreakdown(heroCode) {
  const cached = _readSetCache(heroCode);
  if (cached) return cached;
  const results = await _fetchSetBreakdown(heroCode);
  if (results && results.length) _writeSetCache(heroCode, results);
  return results;
}

async function _fetchSetBreakdown(heroCode) {
  // No lowData param → epic7rtastats removes low-pick SET aggregations (the per-set
  // low-pick filter, distinct from the hero-level low-pick flag), so we get the
  // meaningful set combos instead of every rare pairing.  (lowData=false would show all.)
  const content = await _fetchRsc(
    `${RTA_BASE}/${heroCode}?_rsc=${RSC_TOKEN}`,
    heroCode,
  );

  const setAggIdx = content.indexOf('"setAggStats":[');
  const setsMapIdx = content.indexOf('"setsMap":{');
  const setStatsIdx = content.indexOf('"setStats":[');
  if (setAggIdx === -1 || setsMapIdx === -1) return [];

  // setsMap (set_code → localized name from the site; we prefer our SET_NAMES).
  const setsMapSlice = _sliceBalanced(
    content,
    setsMapIdx + '"setsMap":'.length,
    '{',
    '}',
  );
  let setsMap = {};
  try {
    setsMap = JSON.parse(setsMapSlice);
  } catch {
    setsMap = {};
  }

  // setStats → per-individual-set total_games (used to rank 2pc-only builds).
  const individualSetUsage = {};
  if (setStatsIdx > -1) {
    const setStatsSlice = _sliceBalanced(
      content,
      content.indexOf('[', setStatsIdx),
      '[',
      ']',
    );
    try {
      JSON.parse(setStatsSlice).forEach((s) => {
        individualSetUsage[s.set_code] = s.total_games || 0;
      });
    } catch {
      /* fall back to priority ordering */
    }
  }

  const setAggSlice = _sliceBalanced(
    content,
    content.indexOf('[', setAggIdx),
    '[',
    ']',
  );
  let setAggStats;
  try {
    setAggStats = JSON.parse(setAggSlice);
  } catch {
    return [];
  }

  const name = (code) => SET_NAMES[code] || setsMap[code] || code;
  const PRIORITY = {
    set_immune: 10,
    set_max_hp: 8,
    set_penetrate: 7,
    set_torrent: 6,
    set_chase: 5,
    set_cri: 4,
    set_acc: 3,
    set_res: 2,
    set_def: 1,
    set_coop: 1,
  };

  const byPrimary = {}; // primaryLabel → { combos:[], keys:Set }

  setAggStats.forEach((stat) => {
    const codes = String(stat.set_agg_code || '')
      .split('+')
      .filter(Boolean);
    let fourCode = null;
    const twoCodes = [];
    codes.forEach((c) => {
      if (FOUR_PIECE_SET_CODES.has(c)) fourCode = c;
      else twoCodes.push(c);
    });

    let primary;
    let companions;
    // Only the PRIMARY set(s) that DEFINE this group — never the union of every 2pc
    // companion seen across its builds.  Using the union over-checks on Apply (a
    // "Speed" group would tick Speed + every 2pc ever paired with it), which then
    // makes the community "Fill Speed" subset-match impossible.
    const primaryCodes = [];

    if (fourCode) {
      primary = name(fourCode);
      primaryCodes.push(fourCode);
      companions = twoCodes.map((c) => name(c));
    } else {
      const counts = {};
      twoCodes.forEach((c) => {
        counts[c] = (counts[c] || 0) + 1;
      });
      let maxCount = 0;
      let primaryCode = null;
      Object.keys(counts).forEach((c) => {
        if (counts[c] > maxCount) {
          maxCount = counts[c];
          primaryCode = c;
        }
      });
      if (primaryCode && maxCount >= 2) {
        const pn = name(primaryCode);
        primary = `${pn} + ${pn}`;
        primaryCodes.push(primaryCode);
        companions = twoCodes
          .filter((c) => c !== primaryCode)
          .map((c) => name(c));
        if (maxCount > 2) companions.push(pn);
      } else if (twoCodes.length >= 2) {
        const sorted = twoCodes.slice().sort((a, b) => {
          if (Object.keys(individualSetUsage).length > 0) {
            return (individualSetUsage[b] || 0) - (individualSetUsage[a] || 0);
          }
          return (PRIORITY[b] || 0) - (PRIORITY[a] || 0);
        });
        primary = `${name(sorted[0])} + ${name(sorted[1])}`;
        primaryCodes.push(sorted[0], sorted[1]);
        companions = sorted.slice(2).map((c) => name(c));
      } else {
        primary = 'Broken';
        companions = twoCodes.map((c) => name(c));
      }
    }

    let companionStr;
    if (fourCode && companions.length === 0) companionStr = 'Broken';
    else companionStr = companions.length > 0 ? companions.join(', ') : '';

    const wins = stat.total_wins || 0;
    const losses = stat.total_losses || 0;

    if (!byPrimary[primary])
      byPrimary[primary] = { combos: [], keys: new Set() };
    primaryCodes.forEach((c) => byPrimary[primary].keys.add(c));
    byPrimary[primary].combos.push({
      twoPiece: companionStr,
      games: stat.total_games || 0,
      wins,
      losses,
    });
  });

  const results = [];
  Object.keys(byPrimary).forEach((primary) => {
    const { combos, keys } = byPrimary[primary];
    const seen = {};
    const uniqueTwo = [];
    combos
      .slice()
      .sort((a, b) => b.games - a.games)
      .forEach((c) => {
        if (c.twoPiece && !seen[c.twoPiece]) {
          seen[c.twoPiece] = true;
          uniqueTwo.push(c.twoPiece);
        }
      });
    let totalUsage = 0;
    let totalWins = 0;
    let totalLosses = 0;
    combos.forEach((c) => {
      totalUsage += c.games;
      totalWins += c.wins;
      totalLosses += c.losses;
    });
    const played = totalWins + totalLosses;
    results.push({
      fourPieceSet: primary,
      twoPieceSets: uniqueTwo.join(', '),
      setsUsage: totalUsage,
      setWinRate:
        played > 0 ? ((totalWins / played) * 100).toFixed(1) + '%' : 'N/A',
      // Fribbels set keys for the whole primary group, for "Apply to Target Sets".
      setKeys: [...keys].map((c) => `${SET_NAMES[c] || c}Set`),
    });
  });

  results.sort((a, b) => b.setsUsage - a.setsUsage);
  return results;
}

// ── Top-level: analyze one Fribbels hero ──────────────────────────────────────
async function analyzeHero(fribbelsHeroName) {
  const stoveName = _baseName(fribbelsHeroName);
  const codeMap = await getHeroCodeMap();
  const code = _resolveCode(codeMap, stoveName);
  if (!code) {
    const hints = _suggestNames(codeMap, stoveName);
    const hint = hints.length ? ` Closest matches: ${hints.join(', ')}.` : '';
    throw new Error(`No epic7rtastats entry for "${stoveName}".${hint}`);
  }

  const { byCode, gamesCount, highPick } = await getHeroList();
  const stat = byCode[code] || null;
  const combos = await getSetBreakdown(code);

  const pct = (num, den) =>
    den > 0 ? ((num / den) * 100).toFixed(1) + '%' : 'N/A';

  let pickRate = 'N/A';
  let winRate = 'N/A';
  if (stat) {
    pickRate = pct(stat.total_games || 0, gamesCount);
    const played = (stat.total_wins || 0) + (stat.total_losses || 0);
    winRate = pct(stat.total_wins || 0, played);
  }
  // low-pick = absent from the filtered list (or unknown if that call failed).
  let lowPick = null;
  if (highPick) lowPick = stat ? !highPick.has(code) : true;

  // Per-combo usage % = share of this hero's set-data games.
  const comboGamesTotal = combos.reduce((a, c) => a + c.setsUsage, 0);
  const combosWithPct = combos.map((c) => ({
    ...c,
    usagePct: comboGamesTotal > 0 ? (c.setsUsage / comboGamesTotal) * 100 : 0,
  }));

  return {
    heroName: stoveName,
    code,
    gamesCount,
    totalGames: stat ? stat.total_games || 0 : 0,
    pickRate,
    winRate,
    lowPick,
    combos: combosWithPct,
  };
}

// Resolve a Fribbels hero name → RTA/Stove hero code (exact → alias → fuzzy).
// Shared with stoveRta.js so both integrations use one hero-code map + matcher.
async function resolveHeroCode(fribbelsHeroName) {
  const codeMap = await getHeroCodeMap();
  return _resolveCode(codeMap, _baseName(fribbelsHeroName));
}

const RtaStats = {
  RSC_TOKEN,
  getHeroCodeMap,
  resolveHeroCode,
  getHeroList,
  getSetBreakdown,
  analyzeHero,
};

export default RtaStats;

import { readDiskCache, writeDiskCache } from './diskCache';
import { SET_CODE_TO_GAME as CODE_TO_GAME, FOUR_PIECE_CODES } from './setData';
// ---------------------------------------------------------------------------
// Community-builds service — the "speed / what people actually build" half of the
// Build Planner, complementing the RTA meta scrape (rtaStats.js).
//
// Reuses the same community-builds endpoint the Fribbels Hero Library uses
// (fribbelsLibrary.js).  That AWS endpoint sends permissive CORS, so a plain
// renderer fetch is fine here (unlike the epic7rtastats RSC scrape).
//
// Builds carry `sets` as { set_code: pieceCount } and a per-build `spd`, so for a
// chosen set combo we can report how many builds run it (usage %) and the median
// speed of those builds (→ the Build Planner's Target Speed / Tier).
// ---------------------------------------------------------------------------

const FRIBBELS_BUILDS_URL =
  'https://krivpfvxi0.execute-api.us-west-2.amazonaws.com/dev/getBuilds';

// FOUR_PIECE_CODES (4-piece set codes; everything else needs 2) and CODE_TO_GAME
// (set_code → Fribbels set key, matching the Build Planner Target Sets values) both
// come from the shared single source of truth (./setData), shared with rtaStats so
// they can't drift apart (the cause of the earlier Fervor/Weakening bug).

// Per-hero disk cache (survives restarts).  Trimmed to {spd, sets} — the only fields
// analyzeForSets reads — so it stays small; 24h TTL; bounded to CACHE_MAX_HEROES.
const CACHE_FILE = 'communitybuildscache.json';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_HEROES = 60;
let _cache = null; // { [heroName]: { ts, builds: [{spd, sets}] } }

function _loadCache() {
  if (!_cache) _cache = readDiskCache(CACHE_FILE) || {};
  return _cache;
}

// Fetch the hero's community builds (same payload shape the Hero Library uses), with
// a disk cache so repeat lookups / cold starts don't re-pull.
async function getBuilds(heroName) {
  const cache = _loadCache();
  const hit = cache[heroName];
  if (
    hit &&
    hit.ts &&
    Date.now() - hit.ts < CACHE_TTL_MS &&
    Array.isArray(hit.builds)
  ) {
    return hit.builds;
  }
  const res = await fetch(FRIBBELS_BUILDS_URL, {
    method: 'POST',
    body: heroName,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const builds = (json.data || [])
    .filter((d) => d && d.atk && d.hp && d.spd != null)
    .map((d) => ({ spd: d.spd, sets: d.sets }));
  cache[heroName] = { ts: Date.now(), builds };
  // Bound: evict the oldest heroes beyond the cap.
  const names = Object.keys(cache);
  if (names.length > CACHE_MAX_HEROES) {
    names
      .sort((a, b) => (cache[a].ts || 0) - (cache[b].ts || 0))
      .slice(0, names.length - CACHE_MAX_HEROES)
      .forEach((n) => delete cache[n]);
  }
  writeDiskCache(CACHE_FILE, cache);
  return builds;
}

// The set keys a build actually COMPLETES (4-piece needs 4, 2-piece needs 2).
function _completedSets(buildSets) {
  const out = new Set();
  Object.entries(buildSets || {}).forEach(([code, count]) => {
    const need = FOUR_PIECE_CODES.has(code) ? 4 : 2;
    if (Number(count) >= need && CODE_TO_GAME[code])
      out.add(CODE_TO_GAME[code]);
  });
  return out;
}

function _median(nums) {
  if (!nums.length) return 0;
  const s = nums.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

// The selected Target Sets' game names that are 4-piece (the "primary" requirement).
const FOUR_PIECE_GAME = new Set(
  [...FOUR_PIECE_CODES].map((c) => CODE_TO_GAME[c]).filter(Boolean),
);

// Match community builds to the selected Target Sets and return usage % + median speed.
// Matching mirrors how E7 builds actually work:
//   • selected 4-PIECE sets are REQUIRED (AND) — a build can only run one, so this is
//     normally a single set ("Speed");
//   • selected 2-PIECE sets and "Broken" are OR alternatives for the second slot — so
//     "Speed + Pursuit + Broken" combines Speed+Pursuit AND Speed+(no 2nd set) builds.
// With only a 4-piece checked, every variant of it is combined (the broad median).
function analyzeForSets(builds, selectedGameNames) {
  const sel = (selectedGameNames || []).filter(Boolean);
  const brokenSel = sel.includes('Broken');
  const real = sel.filter((s) => s !== 'Broken');
  const sel4 = real.filter((s) => FOUR_PIECE_GAME.has(s));
  const sel2 = real.filter((s) => !FOUR_PIECE_GAME.has(s));

  const matching = (builds || []).filter((b) => {
    const done = _completedSets(b.sets);
    // All selected 4-piece sets must be completed.
    for (let i = 0; i < sel4.length; i += 1)
      if (!done.has(sel4[i])) return false;
    // No second-slot constraint → combine every variant of the 4-piece.
    if (sel2.length === 0 && !brokenSel) return true;
    // Second slot: ANY selected 2-piece completes → match.
    if (sel2.some((s) => done.has(s))) return true;
    // Or "Broken": nothing completed beyond the selected 4-piece set(s).
    if (brokenSel) {
      let extra = 0;
      done.forEach((s) => {
        if (!sel4.includes(s)) extra += 1;
      });
      if (extra === 0) return true;
    }
    return false;
  });

  const spds = matching
    .map((b) => Number.parseInt(b.spd, 10))
    .filter((n) => Number.isFinite(n));
  return {
    total: (builds || []).length,
    matching: matching.length,
    usagePct:
      builds && builds.length ? (matching.length / builds.length) * 100 : 0,
    medianSpd: _median(spds),
    multipleFourPiece: sel4.length > 1, // impossible (a build runs one 4-piece)
  };
}

const CommunityBuilds = { getBuilds, analyzeForSets };

export default CommunityBuilds;

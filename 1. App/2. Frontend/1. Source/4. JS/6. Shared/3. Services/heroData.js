/* global jQuery, Files, Api, Settings */

// Diagnostic logging uses the central Log utility (Log.debug, gated by window.__optDebug; see 5. Dev Only/LogControl.js).

let heroesByName = {};
let artifactsByName = {};
const eesByName = {};

// fribbels (original author) is no longer maintaining the data feed; RexQian's fork
// is the actively-updated source. Primary source is Rex's raw `main` branch, with the
// original fribbels S3/CN mirrors kept as fallbacks — see _cacheUrlReady below.
const REX_RAW_CACHE_BASE =
  'https://raw.githubusercontent.com/RexQian/Fribbels-Epic-7-Optimizer/main/data/cache';
const REX_RAW_IMAGE_BASE =
  'https://raw.githubusercontent.com/RexQian/Fribbels-Epic-7-Optimizer/main/data/cachedimages';
const REX_HERO_CACHE = `${REX_RAW_CACHE_BASE}/herodata.json?`;
const REX_ARTIFACT_CACHE = `${REX_RAW_CACHE_BASE}/artifactdata.json?`;
const S3_HERO_CACHE =
  'https://e7-optimizer-game-data.s3-accelerate.amazonaws.com/herodata.json?';
const S3_ARTIFACT_CACHE =
  'https://e7-optimizer-game-data.s3-accelerate.amazonaws.com/artifactdata.json?';
const CN_HERO_CACHE =
  'https://fribbels-epic-7-optimizer-cn.azurewebsites.net/data/cache/herodata.json?';
const CN_ARTIFACT_CACHE =
  'https://fribbels-epic-7-optimizer-cn.azurewebsites.net/data/cache/artifactdata.json?';

let HERO_CACHE = REX_HERO_CACHE;
let ARTIFACT_CACHE = REX_ARTIFACT_CACHE;

globalThis.TEST = false;

function baseToStatObj(stats) {
  return {
    atk: stats.atk,
    hp: stats.hp,
    def: stats.def,
    cr: Math.round(stats.chc * 100),
    cd: Math.round(stats.chd * 100),
    eff: Math.round(stats.eff * 100),
    res: Math.round(stats.efr * 100),
    spd: stats.spd,
    dac: Math.round(stats.dac * 100),
    bonusStats: {
      bonusMaxAtkPercent: stats.bonusMaxAtkPercent,
      bonusMaxDefPercent: stats.bonusMaxDefPercent,
      bonusMaxHpPercent: stats.bonusMaxHpPercent,
      overrideAtk: stats.overrideAtk,
      overrideHp: stats.overrideHp,
      overrideDef: stats.overrideDef,
      overrideAdditionalCr: Math.round(stats.overrideAdditionalCr * 100),
      overrideAdditionalCd: Math.round(stats.overrideAdditionalCd * 100),
      overrideAdditionalSpd: stats.overrideAdditionalSpd,
      overrideAdditionalEff: Math.round(stats.overrideAdditionalEff * 100),
      overrideAdditionalRes: Math.round(stats.overrideAdditionalRes * 100),
    },
  };
}

function processHeroSkill(s, skill) {
  const skillData = s[skill];

  if (skillData) {
    if (!skillData.options) skillData.options = [];
    skillData.hitTypes.forEach((z) => {
      if (!skillData.options.some((y) => y.name.includes(z))) {
        skillData.options.push({
          name: `${skill} ${z}`,
          rate: skillData.rate,
          note: skillData.note,
          pow: skillData.pow,
          targets: skillData.targets,
          selfHpScaling: skillData.selfHpScaling,
          selfAtkScaling: skillData.selfAtkScaling,
          selfDefScaling: skillData.selfDefScaling,
          selfSpdScaling: skillData.selfSpdScaling,
          increasedValue: skillData.increasedValue,
          extraSelfHpScaling: skillData.extraSelfHpScaling,
          extraSelfDefScaling: skillData.extraSelfDefScaling,
          extraSelfAtkScaling: skillData.extraSelfAtkScaling,
          cdmgIncrease: skillData.cdmgIncrease,
          penetration: skillData.penetration,
        });
      }
    });
  }

  if (!skillData) {
    s[skill] = {};
  }

  if (!s[skill].options || s[skill].options.length === 0) {
    s[skill].options = [];
    s[skill].options.push({
      name: `${skill} n/a`,
      targets: 0,
      rate: 0,
      pow: 0,
    });
  }
}

// Filenames present in the local assets dir, read once per launch (not once per
// hero) — CopyAssets.js copies all hero PNGs flat into 1. HTML/assets/.
let localAssetFilenames = null;
function getLocalAssetFilenames() {
  if (localAssetFilenames) return localAssetFilenames;
  try {
    localAssetFilenames = new Set(
      Files.listFilesInFolder(Files.getAssetsPath()),
    );
  } catch (e) {
    Log.warn('Failed to read local hero-image directory:', e);
    localAssetFilenames = new Set();
  }
  return localAssetFilenames;
}

function localizeHeroAssets(x) {
  const hero = heroesByName[x];
  if (!hero?.assets) return;
  const localFiles = getLocalAssetFilenames();
  // Use the local copy when CopyAssets.js has already flattened it into
  // 1. HTML/assets/; otherwise fall back to Rex's raw cachedimages URL so a
  // newly-released hero still renders before the next sync-upstream-data run.
  const remap = (url) => {
    if (!url || url.startsWith('./')) return url;
    const filename = url.split('/').pop();
    if (localFiles.has(filename)) return `./assets/${filename}`;
    return `${REX_RAW_IMAGE_BASE}/${filename}`;
  };
  hero.assets.icon = remap(hero.assets.icon);
  hero.assets.image = remap(hero.assets.image);
  hero.assets.thumbnail = remap(hero.assets.thumbnail);
}

function processHero(x) {
  localizeHeroAssets(x);
  if (!heroesByName[x].skills) {
    heroesByName[x].skills = {
      S1: { hitTypes: ['normal'], targets: 0, rate: 0, pow: 0, options: [] },
      S2: { hitTypes: ['normal'], targets: 0, rate: 0, pow: 0, options: [] },
      S3: { hitTypes: ['normal'], targets: 0, rate: 0, pow: 0, options: [] },
    };
  }
  const s = heroesByName[x].skills;
  ['S1', 'S2', 'S3'].forEach((skill) => processHeroSkill(s, skill));
}

function UrlExists(url, cb) {
  jQuery.ajax({
    url,
    dataType: 'text',
    type: 'GET',
    complete(xhr) {
      if (typeof cb === 'function') cb.apply(this, [xhr.status]);
    },
  });
}

// ---------------------------------------------------------------------------
// ETag-based conditional fetch.  Stores the server's ETag in localStorage so
// subsequent cold starts can send If-None-Match and receive a 304 (Not
// Modified) instead of re-downloading the full JSON.
//
// Returns:
//   parsed JSON object  — on HTTP 200 (new content downloaded & file updated)
//   null                — on HTTP 304 (local cache file is already current)
// ---------------------------------------------------------------------------
async function fetchCacheConditional(url, storageKey, localCachePath) {
  const storedEtag = localStorage.getItem(`${storageKey}_etag`);

  const headers = new Headers();
  if (storedEtag) {
    headers.append('If-None-Match', storedEtag);
  }

  const response = await fetch(url, { method: 'GET', headers });

  if (response.status === 304) {
    // Content unchanged — the local cache file is already up to date
    return null;
  }

  const text = await response.text();

  // Persist the new ETag for the next cold start
  const newEtag = response.headers.get('ETag') || response.headers.get('etag');
  if (newEtag) {
    try {
      localStorage.setItem(`${storageKey}_etag`, newEtag);
    } catch (e) {
      Log.warn('Failed to store ETag in localStorage:', e);
    }
  }

  // Parse first — if the server returned garbage, throw before touching disk
  const parsed = JSON.parse(text);

  // Keep the local cache file in sync so 304 paths stay consistent
  if (localCachePath) {
    try {
      Files.saveFile(localCachePath, text);
    } catch (e) {
      Log.warn('Failed to save local cache file:', e);
    }
  }

  return parsed;
}

// Probe Rex's raw GitHub feed first (actively maintained); fall back to the
// original fribbels S3 bucket, then its CN mirror, if Rex is unreachable.
const _cacheUrlReady = new Promise((resolve) => {
  try {
    UrlExists(REX_HERO_CACHE, (rexStatus) => {
      if (rexStatus === 200) {
        resolve();
        return;
      }
      UrlExists(S3_HERO_CACHE, (s3Status) => {
        if (s3Status === 200) {
          HERO_CACHE = S3_HERO_CACHE;
          ARTIFACT_CACHE = S3_ARTIFACT_CACHE;
        } else {
          HERO_CACHE = CN_HERO_CACHE;
          ARTIFACT_CACHE = CN_ARTIFACT_CACHE;
        }
        resolve();
      });
    });
  } catch (e) {
    Log.warn('Failed to check URL availability:', e);
    resolve();
  }
});

const HeroData = {
  initialize: async () => {
    try {
      const heroesByNameStr = await Files.readFileSync(
        `${Files.getCachePath()}/cache/herodata.json`,
      );
      heroesByName = JSON.parse(heroesByNameStr);
    } catch (e) {
      Log.warn('Failed to load hero cache:', e);
    }

    try {
      const artifactsByNameStr = await Files.readFileSync(
        `${Files.getCachePath()}/cache/artifactdata.json`,
      );
      artifactsByName = JSON.parse(artifactsByNameStr);
    } catch (e) {
      Log.warn('Failed to load artifact cache:', e);
    }

    const useLocalCache =
      typeof Settings !== 'undefined' && Settings.getUseLocalCache
        ? Settings.getUseLocalCache()
        : false;

    try {
      if (useLocalCache || globalThis.TEST) {
        // Local-only: heroesByName already loaded from disk above — nothing to do
        Log.debug('[HeroData] Using local cache for hero data');
      } else {
        await _cacheUrlReady;
        const heroCachePath = `${Files.getCachePath()}/cache/herodata.json`;
        const heroOverride = await fetchCacheConditional(
          HERO_CACHE,
          'e7opt_herodata',
          heroCachePath,
        );
        // null means 304 Not Modified — heroesByName already loaded from disk above
        if (heroOverride !== null) {
          heroesByName = heroOverride;
        }
      }
    } catch (e) {
      Log.warn('Failed to load hero data cache:', e);
    }

    try {
      if (useLocalCache || globalThis.TEST) {
        // Local-only: artifactsByName already loaded from disk above — nothing to do
        Log.debug('[HeroData] Using local cache for artifact data');
      } else {
        const artifactCachePath = `${Files.getCachePath()}/cache/artifactdata.json`;
        const artifactOverride = await fetchCacheConditional(
          ARTIFACT_CACHE,
          'e7opt_artifactdata',
          artifactCachePath,
        );
        // null means 304 Not Modified — artifactsByName already loaded from disk above
        if (artifactOverride !== null) {
          artifactsByName = artifactOverride;
        }
      }
    } catch (e) {
      Log.warn('Failed to load artifact data cache:', e);
    }

    const baseStatsByName = {};
    Object.keys(heroesByName).forEach((x) => {
      processHero(x);
      const baseStats = HeroData.getBaseStatsByName(x);
      baseStatsByName[x] = baseStats;
    });

    await Api.setArtifacts(artifactsByName);
    await Api.setBaseStats(baseStatsByName);
  },

  getAllHeroData: () => {
    return heroesByName;
  },

  getHeroExtraInfo: (name) => {
    const heroInfo = heroesByName[name && name.replace(/\s#\d+$/, '')];
    return heroInfo;
  },

  getAllArtifactData: () => {
    return artifactsByName;
  },

  getArtifactByName: (name) => {
    return artifactsByName[name];
  },

  getAllEeData: () => {
    return eesByName;
  },

  getEeByName: (name) => {
    return eesByName[name];
  },

  getBaseStatsByName: (name) => {
    const baseName = name && name.replace(/\s#\d+$/, '');
    if (!heroesByName[baseName]) return null;

    const status = heroesByName[baseName].calculatedStatus;
    if (!status) return null;
    return {
      lv50FiveStarFullyAwakened: baseToStatObj(
        status.lv50FiveStarFullyAwakened,
      ),
      lv60SixStarFullyAwakened: baseToStatObj(status.lv60SixStarFullyAwakened),
      skills: {
        S1: heroesByName[baseName].skills.S1.options,
        S2: heroesByName[baseName].skills.S2.options,
        S3: heroesByName[baseName].skills.S3.options,
      },
    };
  },

  getBaseStatsByStars: (name, stars) => {
    const baseStats = HeroData.getBaseStatsByName(name);

    if (stars === 5) {
      return baseStats.lv50FiveStarFullyAwakened;
    }
    return baseStats.lv60SixStarFullyAwakened;
  },
};

export default HeroData;

/* global jQuery, Files, Api */

let heroesByName = {};
let artifactsByName = {};
const eesByName = {};

let HERO_CACHE =
    'https://e7-optimizer-game-data.s3-accelerate.amazonaws.com/herodata.json?';
let ARTIFACT_CACHE =
    'https://e7-optimizer-game-data.s3-accelerate.amazonaws.com/artifactdata.json?';

global.TEST = false;

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
    headers.append('pragma', 'no-cache');
    headers.append('cache-control', 'no-cache');
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
        try { localStorage.setItem(`${storageKey}_etag`, newEtag); } catch (e) { /* ignore */ }
    }

    // Keep the local cache file in sync so 304 paths stay consistent
    if (localCachePath) {
        try { Files.saveFile(localCachePath, text); } catch (e) { /* ignore */ }
    }

    return JSON.parse(text);
}

const _cacheUrlReady = new Promise((resolve) => {
    try {
        UrlExists(
            'https://e7-optimizer-game-data.s3-accelerate.amazonaws.com/herodata.json?',
            (status) => {
                if (status !== 200) {
                    HERO_CACHE =
                        'https://fribbels-epic-7-optimizer-cn.azurewebsites.net/data/cache/herodata.json?';
                    ARTIFACT_CACHE =
                        'https://fribbels-epic-7-optimizer-cn.azurewebsites.net/data/cache/artifactdata.json?';
                }
                resolve();
            },
        );
    } catch (e) {
        resolve();
    }
});

const HeroData = {
    initialize: async () => {
        try {
            const heroesByNameStr = await Files.readFileSync(
                `${Files.getDataPath()}/cache/herodata.json`,
            );
            heroesByName = JSON.parse(heroesByNameStr);
        } catch (e) {
            // ignore
        }

        try {
            const artifactsByNameStr = await Files.readFileSync(
                `${Files.getDataPath()}/cache/artifactdata.json`,
            );
            artifactsByName = JSON.parse(artifactsByNameStr);
        } catch (e) {
            // ignore
        }

        try {
            if (global.TEST) {
                const heroOverride = JSON.parse(
                    await Files.readFileSync(
                        `${Files.getDataPath()}/cache/herodata.json`,
                    ),
                );
                heroesByName = heroOverride;
            } else {
                await _cacheUrlReady;
                const heroCachePath = `${Files.getDataPath()}/cache/herodata.json`;
                const heroOverride = await fetchCacheConditional(
                    HERO_CACHE, 'e7opt_herodata', heroCachePath,
                );
                // null means 304 Not Modified — heroesByName already loaded from disk above
                if (heroOverride !== null) {
                    heroesByName = heroOverride;
                }
            }
        } catch (e) {
            // ignore
        }

        try {
            if (global.TEST) {
                const artifactOverride = JSON.parse(
                    await Files.readFileSync(
                        `${Files.getDataPath()}/cache/artifactdata.json`,
                    ),
                );
                artifactsByName = artifactOverride;
            } else {
                const artifactCachePath = `${Files.getDataPath()}/cache/artifactdata.json`;
                const artifactOverride = await fetchCacheConditional(
                    ARTIFACT_CACHE, 'e7opt_artifactdata', artifactCachePath,
                );
                // null means 304 Not Modified — artifactsByName already loaded from disk above
                if (artifactOverride !== null) {
                    artifactsByName = artifactOverride;
                }
            }
        } catch (e) {
            // ignore
        }

        const baseStatsByName = {};
        Object.keys(heroesByName).forEach((x) => {
            if (!heroesByName[x].skills) {
                heroesByName[x].skills = {
                    S1: {
                        hitTypes: ['normal'],
                        targets: 0,
                        rate: 0,
                        pow: 0,
                        options: [],
                    },
                    S2: {
                        hitTypes: ['normal'],
                        targets: 0,
                        rate: 0,
                        pow: 0,
                        options: [],
                    },
                    S3: {
                        hitTypes: ['normal'],
                        targets: 0,
                        rate: 0,
                        pow: 0,
                        options: [],
                    },
                };
            }

            const s = heroesByName[x].skills;
            ['S1', 'S2', 'S3'].forEach((skill) => {
                const skillData = s[skill];

                if (skillData) {
                    skillData.hitTypes.forEach((z) => {
                        if (
                            !skillData.options.find((y) => y.name.includes(z))
                        ) {
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
                                extraSelfHpScaling:
                                    skillData.extraSelfHpScaling,
                                extraSelfDefScaling:
                                    skillData.extraSelfDefScaling,
                                extraSelfAtkScaling:
                                    skillData.extraSelfAtkScaling,
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
            });

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
        const heroInfo = heroesByName[name];
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
                    overrideAdditionalCr: Math.round(
                        stats.overrideAdditionalCr * 100,
                    ),
                    overrideAdditionalCd: Math.round(
                        stats.overrideAdditionalCd * 100,
                    ),
                    overrideAdditionalSpd: stats.overrideAdditionalSpd,
                    overrideAdditionalEff: Math.round(
                        stats.overrideAdditionalEff * 100,
                    ),
                    overrideAdditionalRes: Math.round(
                        stats.overrideAdditionalRes * 100,
                    ),
                },
            };
        }

        if (!heroesByName[name]) return null;

        const status = heroesByName[name].calculatedStatus;
        return {
            lv50FiveStarFullyAwakened: baseToStatObj(
                status.lv50FiveStarFullyAwakened,
            ),
            lv60SixStarFullyAwakened: baseToStatObj(
                status.lv60SixStarFullyAwakened,
            ),
            skills: {
                S1: heroesByName[name].skills.S1.options,
                S2: heroesByName[name].skills.S2.options,
                S3: heroesByName[name].skills.S3.options,
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

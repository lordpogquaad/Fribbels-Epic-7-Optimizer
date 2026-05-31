/**
 * FlatStatCalibration — manages calibrated flat-stat roll scores derived from
 * the actual hero pool. Stored values are roll scores
 * (avgRoll × 7 / mean(baseStat × 0.07)) for ATK, HP, and DEF — representing
 * how many scoring units one average flat roll is worth.
 *
 * GS formula: `flatStatValue × rollScore / avgRoll`
 * This is equivalent to `flatStatValue × 7 / mean(baseStat × 0.07)`, i.e.
 * how the flat roll scales relative to the average hero's base stat.
 *
 * Stored roll scores (defaults back-derive the original hardcoded GS weights exactly):
 *   ATK:  avgRoll=39,  rollScore ≈ 3.46   (39  × 7 / 78.90)
 *   HP:   avgRoll=174, rollScore ≈ 3.09   (174 × 7 / 394.17)
 *   DEF:  avgRoll=31,  rollScore ≈ 4.99   (31  × 7 / 43.49)
 */

const LS_KEY = 'e7opt-flat-stat-calibration';

// Average flat substat roll values per game tier — constant across all heroes.
const AVG_ROLLS = { atk: 39, hp: 174, def: 31 };

// Roll scores at default calibration (back-derive original hardcoded GS weights exactly).
const DEFAULTS = {
    atk: 3.46,   // = 39  × 7 / 78.90
    hp:  3.09,   // = 174 × 7 / 394.17
    def: 4.99,   // = 31  × 7 / 43.49
};

let _cache = null;

function _load() {
    if (_cache !== null) return _cache;
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.atk && parsed.hp && parsed.def) {
                // Migration: old format stored mean(baseStat×0.07) (≈78.90 for ATK).
                // New format stores roll score (avgRoll×7/calibratedWeight ≈ 3.46 for ATK).
                // Guard: old ATK default ≈78.9; new ATK max ≈10.2, so 15 is a safe boundary.
                if (parsed.atk > 15) {
                    parsed.atk = AVG_ROLLS.atk * 7 / parsed.atk;
                    parsed.hp  = AVG_ROLLS.hp  * 7 / parsed.hp;
                    parsed.def = AVG_ROLLS.def * 7 / parsed.def;
                    localStorage.setItem(LS_KEY, JSON.stringify(parsed));
                }
                _cache = parsed;
                return _cache;
            }
        }
    } catch (e) {
        // fall through to defaults
    }
    _cache = { ...DEFAULTS };
    return _cache;
}

const FlatStatCalibration = {
    /**
     * Returns the current calibration roll scores { atk, hp, def }.
     * Each value = avgRoll × 7 / mean(baseStat × 0.07) for the hero pool.
     * Formula: flatStatValue × rollScore / avgRoll  (AVG_ROLLS: atk=39, hp=174, def=31)
     */
    getWeights() {
        return _load();
    },

    /**
     * Calibrate from the live hero data map (keyed by hero name).
     * Filters to rarity === 5 + lv60SixStarFullyAwakened present.
     * Saves result to localStorage and dispatches 'flatStatCalibrationChanged'.
     *
     * @param {object} heroesByName  - map of { heroName: heroDataObject }
     * @returns {{ atk, hp, def, heroCount }}
     */
    calibrate(heroesByName) {
        const totals = { atk: 0, hp: 0, def: 0 };
        let count = 0;

        Object.values(heroesByName).forEach((hero) => {
            if (hero.rarity !== 5) return;
            const stats = hero.calculatedStatus && hero.calculatedStatus.lv60SixStarFullyAwakened;
            if (!stats) return;
            if (!stats.atk || !stats.hp || !stats.def) return;
            totals.atk += stats.atk * 0.07;
            totals.hp  += stats.hp  * 0.07;
            totals.def += stats.def * 0.07;
            count++;
        });

        if (count === 0) {
            console.warn('[FlatStatCalibration] No eligible heroes found — keeping current weights.');
            return { ...(_load()), heroCount: 0 };
        }

        const calibratedMean = { atk: totals.atk / count, hp: totals.hp / count, def: totals.def / count };
        // Convert to roll scores: avgRoll × 7 / mean(baseStat × 0.07)
        const result = {
            atk: AVG_ROLLS.atk * 7 / calibratedMean.atk,
            hp:  AVG_ROLLS.hp  * 7 / calibratedMean.hp,
            def: AVG_ROLLS.def * 7 / calibratedMean.def,
            heroCount: count,
        };

        _cache = { atk: result.atk, hp: result.hp, def: result.def };
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(_cache));
        } catch (e) {
            console.warn('[FlatStatCalibration] Failed to save to localStorage:', e);
        }

        window.dispatchEvent(new CustomEvent('flatStatCalibrationChanged', { detail: result }));
        return result;
    },

    /**
     * Reset to default weights (removes localStorage entry).
     * Dispatches 'flatStatCalibrationChanged'.
     */
    reset() {
        _cache = { ...DEFAULTS };
        try {
            localStorage.removeItem(LS_KEY);
        } catch (e) {
            // ignore
        }
        window.dispatchEvent(new CustomEvent('flatStatCalibrationChanged', { detail: { ..._cache, heroCount: null } }));
    },

    /**
     * Returns true if calibrated values are saved (non-default).
     */
    isCalibrated() {
        try {
            return localStorage.getItem(LS_KEY) !== null;
        } catch (e) {
            return false;
        }
    },

    getDefaults() {
        return { ...DEFAULTS };
    },
};

export default FlatStatCalibration;

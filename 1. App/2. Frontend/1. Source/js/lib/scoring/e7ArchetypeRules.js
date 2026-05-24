/**
 * e7ArchetypeRules.js
 * Loads archetype rules and scoring configs from the GAS source file (2. Archetype Rules.js)
 * using Node.js vm to execute it in a sandboxed context seeded with our constants.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const {
    ITEM_MAIN,
    GEAR_SLOT,
    ITEM_ENHANCE_LEVELS,
} = require('./e7Constants');

// ── Path to the GAS source ───────────────────────────────────────────────────
// Override with E7_ARCHETYPE_RULES_PATH env var (absolute path) if the file
// lives somewhere other than the default relative location.
//
// Walk up from __dirname to find the project root (the directory that contains
// both '1. App' and '2. Personal'). This is robust against webpack mocking
// __dirname as the context directory rather than the source file's directory.
function findProjectRoot(start) {
    let dir = path.resolve(start);
    for (let i = 0; i < 12; i++) {
        const parent = path.dirname(dir);
        if (parent === dir) break; // reached filesystem root
        if (
            fs.existsSync(path.join(parent, '1. App')) &&
            fs.existsSync(path.join(parent, '2. Personal'))
        ) {
            return parent;
        }
        dir = parent;
    }
    // Hard fallback: 6 levels up from the actual source file location
    return path.resolve(start, '../../../../../../');
}

const GAS_RULES_PATH = process.env.E7_ARCHETYPE_RULES_PATH
    ? path.resolve(process.env.E7_ARCHETYPE_RULES_PATH)
    : path.join(
        findProjectRoot(__dirname),
        '2. Personal', 'Json Gear Project', '2. Archetype Rules.js'
    );

// ── Sandbox: globalThis-compatible context seeded with required constants ───
const sandbox = Object.create(null);

// Self-reference so `globalThis.X = Y` writes land back on sandbox
Object.defineProperty(sandbox, 'globalThis', { value: sandbox, writable: true, configurable: true });

// Pre-populate constants referenced inside Archetype Rules.js object literals
sandbox.ITEM_MAIN           = ITEM_MAIN;
sandbox.GEAR_SLOT           = GEAR_SLOT;
sandbox.ITEM_ENHANCE_LEVELS = ITEM_ENHANCE_LEVELS;

// Provide JS built-ins (vm.createContext attaches primordials automatically, but
// we also provide them explicitly for defensive compatibility across Node versions)
sandbox.Object  = Object;
sandbox.Array   = Array;
sandbox.Math    = Math;
sandbox.JSON    = JSON;
sandbox.console = console;
sandbox.Boolean = Boolean;
sandbox.Number  = Number;
sandbox.String  = String;
sandbox.RegExp  = RegExp;
sandbox.Error   = Error;
sandbox.Map     = Map;
sandbox.Set     = Set;

// ── Execute the GAS source inside the sandbox ───────────────────────────────
// Uses Function constructor instead of Node.js vm module — vm is banned in
// Electron's renderer process (incompatible with the Blink engine).
const src = fs.readFileSync(GAS_RULES_PATH, 'utf8');
// eslint-disable-next-line no-new-func
new Function('globalThis', src)(sandbox);

// ── Export what e7Scorer.js and archetypeScorer.js need ─────────────────────
module.exports = {
    ARCHETYPE_RULES:           sandbox.ARCHETYPE_RULES          || {},
    OFFICIAL_ARCHETYPE_RULES:  sandbox.OFFICIAL_ARCHETYPE_RULES || {},
    SCORING_CONFIGS:           sandbox.SCORING_CONFIGS           || {},
    OFFICIAL_SCORING_CONFIGS:  sandbox.OFFICIAL_SCORING_CONFIGS  || {},

    // Set arrays (used by archetypeScorer filters)
    ALL_SETS:          sandbox.ALL_SETS          || [],
    SPEED_SETS:        sandbox.SPEED_SETS        || [],
    DPS_SETS:          sandbox.DPS_SETS          || [],
    DPS_NO_CC_SETS:    sandbox.DPS_NO_CC_SETS    || [],
    RES_TANK_SETS:     sandbox.RES_TANK_SETS     || [],
    PURE_TANK_SETS:    sandbox.PURE_TANK_SETS    || [],
    EFF_TANK_SETS:     sandbox.EFF_TANK_SETS     || [],
    ATK_ER_SETS:       sandbox.ATK_ER_SETS       || [],
    ATK_EFF_SETS:      sandbox.ATK_EFF_SETS      || [],
    EFF_ER_SETS:       sandbox.EFF_ER_SETS       || [],
    BRUISER_HP_DEF_SETS: sandbox.BRUISER_HP_DEF_SETS || [],
    BRUISER_SETS:      sandbox.BRUISER_SETS      || [],
    BRUISER_B_DMG_SETS: sandbox.BRUISER_B_DMG_SETS || [],

    // ── Speed archetype tier configs ──────────────────────────────────────
    TopSpeedTiers:          sandbox.TopSpeedTiers          || null,
    OFFICIAL_TopSpeedTiers: sandbox.OFFICIAL_TopSpeedTiers || null,
    SpeedTiers:             sandbox.SpeedTiers             || null,
    OFFICIAL_SpeedTiers:    sandbox.OFFICIAL_SpeedTiers    || null,
    SpeedSets:              sandbox.SpeedSets              || null,
    OFFICIAL_SpeedSets:     sandbox.OFFICIAL_SpeedSets     || null,

    // ── Focus archetype tier configs ──────────────────────────────────────
    BOOT_EFF_FOCUS_TIERS:  sandbox.BOOT_EFF_FOCUS_TIERS  || null,
    BOOT_ER_FOCUS_TIERS:   sandbox.BOOT_ER_FOCUS_TIERS   || null,
    BOOT_CC_FOCUS_TIERS:   sandbox.BOOT_CC_FOCUS_TIERS   || null,
    BOOT_ATK_FOCUS_TIERS:  sandbox.BOOT_ATK_FOCUS_TIERS  || null,
    HP_FOCUS_TIERS:        sandbox.HP_FOCUS_TIERS        || null,
    FLAT_HP_FOCUS_TIERS:   sandbox.FLAT_HP_FOCUS_TIERS   || null,
    FLAT_ATK_FOCUS_TIERS:  sandbox.FLAT_ATK_FOCUS_TIERS  || null,

    // ── Focus archetype set arrays ────────────────────────────────────────
    BOOT_EFF_SETS:                    sandbox.BOOT_EFF_SETS                    || [],
    BOOT_ER_SETS:                     sandbox.BOOT_ER_SETS                     || [],
    BOOT_CC_SETS:                     sandbox.BOOT_CC_SETS                     || [],
    BOOT_ATK_SETS:                    sandbox.BOOT_ATK_SETS                    || [],
    BOOT_HP_FOCUS_SETS:               sandbox.BOOT_HP_FOCUS_SETS               || [],
    BOOT_EFF_FOCUS_ALL_SETS:          sandbox.BOOT_EFF_FOCUS_ALL_SETS          || [],
    BOOT_ER_FOCUS_ALL_SETS:           sandbox.BOOT_ER_FOCUS_ALL_SETS           || [],
    BOOT_ATK_FOCUS_ALL_SETS:          sandbox.BOOT_ATK_FOCUS_ALL_SETS          || [],
    BOOT_HP_FOCUS_ALL_SETS:           sandbox.BOOT_HP_FOCUS_ALL_SETS           || [],
    ARMOR_ER_SETS:                    sandbox.ARMOR_ER_SETS                    || [],
    EFF_FOCUS_WEAPON_HELM_ARMOR_SETS: sandbox.EFF_FOCUS_WEAPON_HELM_ARMOR_SETS || [],
    ATK_FOCUS_HELM_WEAPON_SETS:       sandbox.ATK_FOCUS_HELM_WEAPON_SETS       || [],
    ATK_FOCUS_NECK_RING_SETS:         sandbox.ATK_FOCUS_NECK_RING_SETS         || [],
    EFF_FOCUS_ATTACK_SETS:            sandbox.EFF_FOCUS_ATTACK_SETS            || [],
    ER_FOCUS_ATTACK_SETS:             sandbox.ER_FOCUS_ATTACK_SETS             || [],
    HP_FOCUS_SETS:                    sandbox.HP_FOCUS_SETS                    || [],
};

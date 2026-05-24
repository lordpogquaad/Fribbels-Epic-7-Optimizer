const gearEnum = {
    Weapon: 'Weapon',
    Helmet: 'Helmet',
    Armor: 'Armor',
    Necklace: 'Necklace',
    Ring: 'Ring',
    Boots: 'Boots',
};

// Declaration order = game set index (0-based).
// constants.js derives setsByIndex via Object.values(setEnum) — keep in sync
// with piecesBySetIndex there when adding new sets.
const setEnum = {
    HEALTH:       'HealthSet',
    DEFENSE:      'DefenseSet',
    ATTACK:       'AttackSet',
    SPEED:        'SpeedSet',
    CRIT:         'CriticalSet',
    HIT:          'HitSet',
    DESTRUCTION:  'DestructionSet',
    LIFESTEAL:    'LifestealSet',
    COUNTER:      'CounterSet',
    RESIST:       'ResistSet',
    UNITY:        'UnitySet',
    RAGE:         'RageSet',
    IMMUNITY:     'ImmunitySet',
    PENETRATION:  'PenetrationSet',
    REVENGE:      'RevengeSet',
    INJURY:       'InjurySet',
    PROTECTION:   'ProtectionSet',
    TORRENT:      'TorrentSet',
    REVERSAL:     'ReversalSet',
    RIPOSTE:      'RiposteSet',
    WARFARE:      'WarfareSet',
    PURSUIT:      'PursuitSet',
};

const rankEnum = {
    NORMAL: 'Normal',
    GOOD:   'Good',
    RARE:   'Rare',
    HEROIC: 'Heroic',
    EPIC:   'Epic',
};

const statEnum = {
    FLATATK: 'flatatk',
    FLATHP: 'flathp',
    FLATDEF: 'flatdef',
    ATK: 'atk',
    HP: 'hp',
    DEF: 'def',
    CR: 'cr',
    CD: 'cd',
    EFF: 'eff',
    RES: 'res',
    SPD: 'spd',
};

const heroes = {
    Angelica: {
        stats: {
            cp: 14709,
            atk: 576,
            hp: 5700,
            spd: 88,
            def: 743,
            chc: 0.15,
            chd: 1.5,
            eff: 0,
            efr: 0,
            dac: 0.05,
        },
    },
};

export {
    gearEnum as Gears,
    setEnum as Sets,
    rankEnum as Ranks,
    statEnum as Stats,
    heroes as Heroes,
};

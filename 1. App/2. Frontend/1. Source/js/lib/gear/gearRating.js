/* global i18next */

let archetypes = [
    {
        name: 'DPS',
        Necklace: [
            'CriticalHitChancePercent',
            'CriticalHitDamagePercent',
            'Attack',
        ],
        Ring: ['Attack'],
        Boots: ['Speed', 'Attack'],
        scale: 10,
        Attack: 3,
        CriticalHitChancePercent: 2,
        CriticalHitDamagePercent: 3,
        Speed: 3,
    },
    {
        name: 'Speed',
        Necklace: ['*'],
        Ring: ['*'],
        Boots: ['Speed'],
        scale: 6,
        Speed: 3,
    },
    {
        name: 'Debuff',
        Necklace: ['*'],
        Ring: ['EffectivenessPercent'],
        Boots: ['Speed'],
        scale: 6,
        Speed: 3,
        EffectivenessPercent: 3,
    },
    {
        name: 'Res Support',
        Necklace: ['Health', 'Defense'],
        Ring: ['Health', 'Defense', 'EffectResistancePercent'],
        Boots: ['Speed', 'Health', 'Defense'],
        scale: 10,
        EffectResistancePercent: 4,
        Health: 2,
        Defense: 2,
        Speed: 2,
    },
    {
        name: 'Tank',
        Necklace: ['Health', 'Defense'],
        Ring: ['Health', 'Defense'],
        Boots: ['Speed', 'Health', 'Defense'],
        scale: 8,
        Health: 3,
        Defense: 3,
        Speed: 2,
    },
    {
        name: 'Bruiser',
        Necklace: [
            'CriticalHitChancePercent',
            'CriticalHitDamagePercent',
            'Health',
            'Defense',
            'Attack',
        ],
        Ring: ['Health', 'Defense', 'Attack'],
        Boots: ['Speed', 'Health', 'Defense', 'Attack'],
        scale: 12,
        Attack: 2,
        Defense: 2,
        Health: 3,
        CriticalHitChancePercent: 3,
        CriticalHitDamagePercent: 3,
        Speed: 2,
    },
    {
        name: 'Atk DPS',
        Necklace: ['Attack', 'Health', 'Defense'],
        Ring: ['EffectivenessPercent', 'Attack', 'Health', 'Defense'],
        Boots: ['Speed', 'Attack', 'Health', 'Defense'],
        scale: 7,
        Attack: 3,
        Speed: 1,
        Health: 1,
        Defense: 1,
        EffectivenessPercent: 1,
    },
    {
        name: 'Nuke',
        Necklace: [
            'CriticalHitChancePercent',
            'CriticalHitDamagePercent',
            'Attack',
        ],
        Ring: ['Attack'],
        Boots: ['Attack'],
        scale: 7,
        Attack: 3,
        CriticalHitChancePercent: 2,
        CriticalHitDamagePercent: 3,
    },
];

const defaultArchetypes = archetypes;

const GearRating = {
    initialize: () => {},

    setArchetypes: (a) => {
        archetypes = a;
    },

    getDefaultArchetypes: () => {
        return defaultArchetypes;
    },

    getArchetypes: () => {
        return archetypes;
    },

    rate: (item) => {
        // const stats = reforge ? item.reforgedStats : item.augmentedStats;
        const stats = item.augmentedStats;

        const atkRolls = (stats.AttackPercent + (stats.Attack * 3.46) / 39) / 8;
        const hpRolls = (stats.HealthPercent + (stats.Health * 3.09) / 174) / 8;
        const defRolls =
            (stats.DefensePercent + (stats.Defense * 4.99) / 31) / 8;
        const spdRolls = stats.Speed / 4;
        const crRolls = stats.CriticalHitChancePercent / 5;
        const cdRolls = stats.CriticalHitDamagePercent / 7;
        const effRolls = stats.EffectivenessPercent / 8;
        const resRolls = stats.EffectResistancePercent / 8;

        const scoredArchetypes = archetypes.map((archetype) => {
            const { scale } = archetype;

            const score =
                atkRolls * (archetype.Attack || 0) +
                hpRolls * (archetype.Health || 0) +
                defRolls * (archetype.Defense || 0) +
                spdRolls * (archetype.Speed || 0) +
                crRolls * (archetype.CriticalHitChancePercent || 0) +
                cdRolls * (archetype.CriticalHitDamagePercent || 0) +
                effRolls * (archetype.EffectivenessPercent || 0) +
                resRolls * (archetype.EffectResistancePercent || 0);

            const mains = archetype[item.gear] || [];
            const match =
                mains.includes('*') ||
                mains.some((main) => item.main.type.includes(main));

            return {
                score:
                    (score / scale) *
                    (match ||
                    item.gear === 'Weapon' ||
                    item.gear === 'Helmet' ||
                    item.gear === 'Armor'
                        ? 1
                        : 0.25),
                name: i18next.t(archetype.name),
            };
        });

        return scoredArchetypes;
    },
};

export default GearRating;

/*
+ Flat Attack * 3.46 / 39
+ Flat Defense * 4.99 / 31
+ Flat Hp * 3.09 / 174
*/

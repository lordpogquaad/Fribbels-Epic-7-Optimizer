// ============================================================================
// ARCHETYPE RULES (slot -> archetype definitions)
// Uses references to Item_Main for slot main stats and per-archetype Item_Substats
// ============================================================================

// Shared set arrays (early cache optimization)
var ALL_SETS = Object.freeze([
  'Destruction',
  'Penetration',
  'Speed',
  'Torrent',
  'Lifesteal',
  'Counter',
  'Resist',
  'Immunity',
  'Reversal',
  'Riposte',
  'Revenge',
  'Hit',
  'Protection',
  'Health',
  'Injury',
  'Critical',
  'Defense',
  'Rage',
  'Unity',
  'Attack',
  'Pursuit',
  'Warfare',
  'Fervor',
  'Weakening',
]);
var SPEED_SETS = Object.freeze([
  'Speed',
  'Critical',
  'Health',
  'Defense',
  'Immunity',
  'Penetration',
  'Torrent',
  'Hit',
  'Resist',
  'Revenge',
  'Reversal',
  'Pursuit',
  'Fervor',
  'Weakening',
]);
var DPS_SETS = Object.freeze([
  'Speed',
  'Destruction',
  'Critical',
  'Penetration',
  'Torrent',
  'Counter',
  'Lifesteal',
  'Immunity',
  'Riposte',
  'Warfare',
  'Attack',
  'Rage',
  'Unity',
  'Pursuit',
  'Fervor',
]);
var DPS_NO_CC_SETS = Object.freeze([
  'Speed',
  'Destruction',
  'Penetration',
  'Torrent',
  'Immunity',
  'Riposte',
  'Counter',
  'Attack',
  'Pursuit',
]);
var RES_TANK_SETS = Object.freeze([
  'Speed',
  'Health',
  'Defense',
  'Resist',
  'Protection',
  'Counter',
  'Immunity',
  'Reversal',
  'Revenge',
  'Pursuit',
  'Warfare',
]);
var PURE_TANK_SETS = Object.freeze([
  'Speed',
  'Health',
  'Defense',
  'Protection',
  'Immunity',
  'Reversal',
  'Warfare',
  'Pursuit',
  'Counter',
]);
var EFF_TANK_SETS = Object.freeze([
  'Speed',
  'Health',
  'Defense',
  'Hit',
  'Immunity',
  'Pursuit',
  'Protection',
  'Reversal',
  'Counter',
  'Weakening',
]);
var ATK_ER_SETS = Object.freeze([
  'Speed',
  'Health',
  'Defense',
  'Resist',
  'Counter',
  'Immunity',
  'Penetration',
  'Pursuit',
  'Riposte',
]);
var ATK_EFF_SETS = Object.freeze([
  'Speed',
  'Health',
  'Defense',
  'Hit',
  'Counter',
  'Immunity',
  'Destruction',
  'Critical',
  'Attack',
  'Injury',
  'Rage',
  'Pursuit',
  'Unity',
  'Protection',
  'Fervor',
  'Weakening',
]);
var EFF_ER_SETS = Object.freeze([
  'Speed',
  'Health',
  'Defense',
  'Hit',
  'Resist',
  'Counter',
  'Immunity',
  'Reversal',
  'Pursuit',
  'Warfare',
  'Protection',
  'Fervor',
  'Weakening',
]);
var BRUISER_HP_DEF_SETS = Object.freeze([
  'Speed',
  'Health',
  'Defense',
  'Destruction',
  'Counter',
  'Injury',
  'Immunity',
  'Penetration',
  'Pursuit',
]);
var BRUISER_SETS = Object.freeze([
  'Speed',
  'Health',
  'Defense',
  'Critical',
  'Destruction',
  'Counter',
  'Injury',
  'Lifesteal',
  'Immunity',
  'Penetration',
  'Riposte',
  'Reversal',
  'Warfare',
  'Pursuit',
  'Revenge',
  'Unity',
  'Attack',
  'Protection',
  'Fervor',
]);
var BRUISER_B_DMG_SETS = Object.freeze([
  'Speed',
  'Health',
  'Defense',
  'Counter',
  'Immunity',
  'Warfare',
  'Pursuit',
  'Attack',
  'Riposte',
]);

// ============================================================================
// FOCUS ARCHETYPE SETS (Potential-based archetypes)
// ============================================================================

// --- Boots-specific sets (for Speed main stat) ---
var BOOT_EFF_SETS = Object.freeze([
  'Speed',
  'Hit',
  'Immunity',
  'Torrent',
  'Pursuit',
  'Weakening',
]);
var BOOT_ER_SETS = Object.freeze([
  'Speed',
  'Resist',
  'Immunity',
  'Defense',
  'Health',
]);
var BOOT_CC_SETS = Object.freeze([
  'Speed',
  'Critical',
  'Immunity',
  'Torrent',
  'Penetration',
]);
var BOOT_ATK_SETS = Object.freeze([
  'Pursuit',
  'Speed',
  'Immunity',
  'Torrent',
  'Attack',
  'Weakening',
]);
var BOOT_HP_FOCUS_SETS = Object.freeze([
  'Protection',
  'Health',
  'Immunity',
  'Speed',
  'Pursuit',
  'Defense',
  'Resist',
]);

// --- Fixed slot sets (Weapon/Helmet/Armor) ---
var EFF_FOCUS_WEAPON_HELM_ARMOR_SETS = Object.freeze([
  'Torrent',
  'Attack',
  'Hit',
  'Immunity',
  'Pursuit',
  'Weakening',
]);
var ARMOR_ER_SETS = Object.freeze([
  'Counter',
  'Resist',
  'Immunity',
  'Penetration',
  'Pursuit',
  'Torrent',
]);
var ATK_FOCUS_HELM_WEAPON_SETS = Object.freeze([
  'Pursuit',
  'Immunity',
  'Torrent',
  'Attack',
  'Hit',
  'Penetration',
  'Counter',
  'Resist',
]);

// --- Necklace/Ring sets (for non-Speed main stats) ---
var EFF_FOCUS_ATTACK_SETS = Object.freeze([
  'Torrent',
  'Attack',
  'Hit',
  'Immunity',
  'Pursuit',
  'Weakening',
]);
var ER_FOCUS_ATTACK_SETS = Object.freeze([
  'Counter',
  'Resist',
  'Immunity',
  'Penetration',
  'Pursuit',
  'Torrent',
]);
var ATK_FOCUS_NECK_RING_SETS = Object.freeze([
  'Pursuit',
  'Immunity',
  'Torrent',
  'Attack',
  'Hit',
  'Penetration',
  'Counter',
  'Resist',
]);

// --- Combined Boots sets (union of Speed main + other main stat paths) ---
var BOOT_EFF_FOCUS_ALL_SETS = Object.freeze([
  'Speed',
  'Hit',
  'Immunity',
  'Torrent',
  'Attack',
  'Pursuit',
  'Weakening',
]);
var BOOT_ER_FOCUS_ALL_SETS = Object.freeze([
  'Speed',
  'Resist',
  'Immunity',
  'Counter',
  'Penetration',
  'Pursuit',
  'Torrent',
  'Defense',
  'Health',
]);
var BOOT_ATK_FOCUS_ALL_SETS = Object.freeze([
  'Pursuit',
  'Speed',
  'Immunity',
  'Torrent',
  'Attack',
  'Hit',
  'Penetration',
  'Counter',
  'Resist',
]);
var BOOT_HP_FOCUS_ALL_SETS = Object.freeze([
  'Protection',
  'Health',
  'Counter',
  'Immunity',
  'Speed',
  'Pursuit',
  'Defense',
  'Resist',
]);

// --- HP Focus sets (all slots) ---
var HP_FOCUS_SETS = Object.freeze([
  'Protection',
  'Health',
  'Counter',
  'Immunity',
  'Pursuit',
]);

// ============================================================================

// ============================================================================
// OFFICIAL ARCHETYPES (E7Bot Reference - Do Not Modify)
// Contains official e7Bot archetype definitions for scoring reference
// Duplicated archetypes: Top Speed, Speed, DPS, Res Tank, Pure Tank, EFF. Tank,
// Atk + ER, Atk + EFF, Bruiser(Hp/Def), Bruiser, Future
// ============================================================================

// Official set arrays (duplicated for independent modification)
var OFFICIAL_ALL_SETS = Object.freeze([
  'Destruction',
  'Penetration',
  'Speed',
  'Torrent',
  'Lifesteal',
  'Counter',
  'Resist',
  'Immunity',
  'Reversal',
  'Riposte',
  'Revenge',
  'Hit',
  'Protection',
  'Health',
  'Injury',
  'Critical',
  'Defense',
  'Rage',
  'Unity',
  'Attack',
  'Pursuit',
  'Warfare',
]);
var OFFICIAL_SPEED_SETS = Object.freeze([
  'Speed',
  'Critical',
  'Health',
  'Defense',
  'Immunity',
  'Penetration',
  'Torrent',
  'Hit',
  'Resist',
  'Pursuit',
]);
var OFFICIAL_DPS_SETS = Object.freeze([
  'Speed',
  'Destruction',
  'Critical',
  'Penetration',
  'Torrent',
  'Counter',
  'Lifesteal',
  'Immunity',
  'Riposte',
  'Warfare',
]);
var OFFICIAL_DPS_NO_CC_SETS = Object.freeze([
  'Speed',
  'Destruction',
  'Penetration',
  'Torrent',
  'Immunity',
  'Riposte',
]);
var OFFICIAL_RES_TANK_SETS = Object.freeze([
  'Speed',
  'Health',
  'Defense',
  'Resist',
  'Protection',
  'Counter',
  'Immunity',
  'Reversal',
  'Warfare',
  'Pursuit',
]);
var OFFICIAL_PURE_TANK_SETS = Object.freeze([
  'Speed',
  'Health',
  'Defense',
  'Protection',
  'Immunity',
  'Reversal',
  'Warfare',
]);
var OFFICIAL_EFF_TANK_SETS = Object.freeze([
  'Speed',
  'Health',
  'Defense',
  'Hit',
  'Immunity',
  'Pursuit',
]);
var OFFICIAL_ATK_ER_SETS = Object.freeze([
  'Speed',
  'Health',
  'Defense',
  'Resist',
  'Counter',
  'Immunity',
]);
var OFFICIAL_ATK_EFF_SETS = Object.freeze([
  'Speed',
  'Health',
  'Defense',
  'Hit',
  'Counter',
  'Immunity',
]);
var OFFICIAL_EFF_ER_SETS = Object.freeze([
  'Speed',
  'Health',
  'Defense',
  'Hit',
  'Resist',
  'Counter',
  'Immunity',
]);
var OFFICIAL_BRUISER_HP_DEF_SETS = Object.freeze([
  'Speed',
  'Health',
  'Defense',
  'Destruction',
  'Counter',
  'Injury',
  'Immunity',
  'Penetration',
  'Pursuit',
]);
var OFFICIAL_BRUISER_SETS = Object.freeze([
  'Speed',
  'Health',
  'Defense',
  'Critical',
  'Destruction',
  'Counter',
  'Injury',
  'Lifesteal',
  'Immunity',
  'Penetration',
  'Riposte',
]);
var OFFICIAL_BRUISER_B_DMG_SETS = Object.freeze([
  'Speed',
  'Health',
  'Defense',
  'Counter',
  'Immunity',
  'Warfare',
  'Pursuit',
]);

var OFFICIAL_ARCHETYPE_RULES =
  globalThis.OFFICIAL_ARCHETYPE_RULES ||
  Object.freeze({
    Weapon: Object.freeze([
      Object.freeze({
        archetype: 'Top Speed',
        sets: OFFICIAL_ALL_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'Speed',
        sets: OFFICIAL_SPEED_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'DPS',
        sets: OFFICIAL_DPS_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'DPS (No CC%)',
        sets: OFFICIAL_DPS_NO_CC_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'Res Tank',
        sets: OFFICIAL_RES_TANK_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'Speed',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Pure Tank',
        sets: OFFICIAL_PURE_TANK_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'Speed',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF. Tank',
        sets: OFFICIAL_EFF_TANK_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'Speed',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + ER',
        sets: OFFICIAL_ATK_ER_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'EffectResistancePercent',
          'AttackPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + EFF',
        sets: OFFICIAL_ATK_EFF_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'EffectivenessPercent',
          'AttackPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF + ER',
        sets: OFFICIAL_EFF_ER_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'EffectResistancePercent',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser(Hp/Def)',
        sets: OFFICIAL_BRUISER_HP_DEF_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'Health',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser',
        sets: OFFICIAL_BRUISER_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'Health',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser (B. Dmg)',
        sets: OFFICIAL_BRUISER_B_DMG_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Speed',
          'HealthPercent',
          'Health',
        ]),
      }),
      Object.freeze({
        archetype: 'Future',
        sets: OFFICIAL_ALL_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
      }),
    ]),
    Helmet: Object.freeze([
      Object.freeze({
        archetype: 'Top Speed',
        sets: OFFICIAL_ALL_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'Defense',
          'DefensePercent',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'Speed',
        sets: OFFICIAL_SPEED_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'Defense',
          'DefensePercent',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'DPS',
        sets: OFFICIAL_DPS_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Attack',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'DPS (No CC%)',
        sets: OFFICIAL_DPS_NO_CC_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Attack',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'Res Tank',
        sets: OFFICIAL_RES_TANK_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'DefensePercent',
          'Defense',
          'Speed',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Pure Tank',
        sets: OFFICIAL_PURE_TANK_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'DefensePercent',
          'Defense',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF. Tank',
        sets: OFFICIAL_EFF_TANK_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'DefensePercent',
          'Defense',
          'Speed',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + ER',
        sets: OFFICIAL_ATK_ER_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'DefensePercent',
          'Defense',
          'EffectResistancePercent',
          'AttackPercent',
          'Attack',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + EFF',
        sets: OFFICIAL_ATK_EFF_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'DefensePercent',
          'Defense',
          'EffectivenessPercent',
          'AttackPercent',
          'Attack',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF + ER',
        sets: OFFICIAL_EFF_ER_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'DefensePercent',
          'Defense',
          'EffectResistancePercent',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser(Hp/Def)',
        sets: OFFICIAL_BRUISER_HP_DEF_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser',
        sets: OFFICIAL_BRUISER_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Attack',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser (B. Dmg)',
        sets: OFFICIAL_BRUISER_B_DMG_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Attack',
          'Speed',
          'HealthPercent',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Future',
        sets: OFFICIAL_ALL_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'Defense',
          'DefensePercent',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
      }),
    ]),
    Armor: Object.freeze([
      Object.freeze({
        archetype: 'Top Speed',
        sets: OFFICIAL_ALL_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'DefensePercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'Speed',
        sets: OFFICIAL_SPEED_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'DefensePercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'DPS',
        sets: OFFICIAL_DPS_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'DPS (No CC%)',
        sets: OFFICIAL_DPS_NO_CC_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'Res Tank',
        sets: OFFICIAL_RES_TANK_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Speed',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Pure Tank',
        sets: OFFICIAL_PURE_TANK_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF. Tank',
        sets: OFFICIAL_EFF_TANK_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Speed',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + ER',
        sets: OFFICIAL_ATK_ER_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + EFF',
        sets: OFFICIAL_ATK_EFF_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF + ER',
        sets: OFFICIAL_EFF_ER_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'EffectResistancePercent',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser(Hp/Def)',
        sets: OFFICIAL_BRUISER_HP_DEF_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser',
        sets: OFFICIAL_BRUISER_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser (B. Dmg)',
        sets: OFFICIAL_BRUISER_B_DMG_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Future',
        sets: OFFICIAL_ALL_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'DefensePercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
      }),
    ]),
    Necklace: Object.freeze([
      Object.freeze({
        archetype: 'Top Speed',
        sets: OFFICIAL_ALL_SETS,
        Item_Main: globalThis.ITEM_MAIN.NECKLACE.main_stats,
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'Defense',
          'DefensePercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'Speed',
        sets: OFFICIAL_SPEED_SETS,
        Item_Main: Object.freeze([
          'CriticalHitDamagePercent',
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
          'CriticalHitChancePercent',
        ]),
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'Defense',
          'DefensePercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'DPS',
        sets: OFFICIAL_DPS_SETS,
        Item_Main: Object.freeze([
          'CriticalHitDamagePercent',
          'CriticalHitChancePercent',
        ]),
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Attack',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'DPS (No CC%)',
        sets: OFFICIAL_DPS_NO_CC_SETS,
        Item_Main: Object.freeze(['CriticalHitDamagePercent']),
        Item_Substats: Object.freeze(['AttackPercent', 'Attack', 'Speed']),
      }),
      Object.freeze({
        archetype: 'Res Tank',
        sets: OFFICIAL_RES_TANK_SETS,
        Item_Main: Object.freeze(['DefensePercent', 'HealthPercent']),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'Speed',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Pure Tank',
        sets: OFFICIAL_PURE_TANK_SETS,
        Item_Main: Object.freeze(['HealthPercent']),
        Item_Substats: Object.freeze([
          'Health',
          'DefensePercent',
          'Defense',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF. Tank',
        sets: OFFICIAL_EFF_TANK_SETS,
        Item_Main: Object.freeze(['DefensePercent', 'HealthPercent']),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'Speed',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + ER',
        sets: OFFICIAL_ATK_ER_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
        ]),
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'EffectResistancePercent',
          'AttackPercent',
          'Attack',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + EFF',
        sets: OFFICIAL_ATK_EFF_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
        ]),
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'EffectivenessPercent',
          'AttackPercent',
          'Attack',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF + ER',
        sets: OFFICIAL_EFF_ER_SETS,
        Item_Main: Object.freeze(['DefensePercent', 'HealthPercent']),
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'EffectResistancePercent',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser(Hp/Def)',
        sets: OFFICIAL_BRUISER_HP_DEF_SETS,
        Item_Main: Object.freeze([
          'CriticalHitDamagePercent',
          'CriticalHitChancePercent',
        ]),
        Item_Substats: Object.freeze([
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser',
        sets: OFFICIAL_BRUISER_SETS,
        Item_Main: Object.freeze([
          'CriticalHitDamagePercent',
          'CriticalHitChancePercent',
        ]),
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Attack',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser (B. Dmg)',
        sets: OFFICIAL_BRUISER_B_DMG_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
        ]),
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Attack',
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Future',
        sets: OFFICIAL_ALL_SETS,
        Item_Main: Object.freeze([
          'CriticalHitDamagePercent',
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
          'CriticalHitChancePercent',
        ]),
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'Defense',
          'DefensePercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
      }),
    ]),
    Ring: Object.freeze([
      Object.freeze({
        archetype: 'Top Speed',
        sets: OFFICIAL_ALL_SETS,
        Item_Main: globalThis.ITEM_MAIN.RING.main_stats,
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'Defense',
          'DefensePercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'Speed',
        sets: OFFICIAL_SPEED_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
          'EffectResistancePercent',
          'EffectivenessPercent',
        ]),
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'Defense',
          'DefensePercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'DPS',
        sets: OFFICIAL_DPS_SETS,
        Item_Main: Object.freeze(['AttackPercent']),
        Item_Substats: Object.freeze([
          'Attack',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'DPS (No CC%)',
        sets: OFFICIAL_DPS_NO_CC_SETS,
        Item_Main: Object.freeze(['AttackPercent']),
        Item_Substats: Object.freeze([
          'Attack',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'Res Tank',
        sets: OFFICIAL_RES_TANK_SETS,
        Item_Main: Object.freeze([
          'DefensePercent',
          'HealthPercent',
          'EffectResistancePercent',
        ]),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'Speed',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Pure Tank',
        sets: OFFICIAL_PURE_TANK_SETS,
        Item_Main: Object.freeze(['HealthPercent']),
        Item_Substats: Object.freeze([
          'Health',
          'DefensePercent',
          'Defense',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF. Tank',
        sets: OFFICIAL_EFF_TANK_SETS,
        Item_Main: Object.freeze([
          'DefensePercent',
          'HealthPercent',
          'EffectivenessPercent',
        ]),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'Speed',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + ER',
        sets: OFFICIAL_ATK_ER_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
          'EffectResistancePercent',
        ]),
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'EffectResistancePercent',
          'AttackPercent',
          'Attack',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + EFF',
        sets: OFFICIAL_ATK_EFF_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
          'EffectivenessPercent',
        ]),
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'EffectivenessPercent',
          'AttackPercent',
          'Attack',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF + ER',
        sets: OFFICIAL_EFF_ER_SETS,
        Item_Main: Object.freeze([
          'DefensePercent',
          'HealthPercent',
          'EffectResistancePercent',
          'EffectivenessPercent',
        ]),
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'EffectResistancePercent',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser(Hp/Def)',
        sets: OFFICIAL_BRUISER_HP_DEF_SETS,
        Item_Main: Object.freeze(['DefensePercent', 'HealthPercent']),
        Item_Substats: Object.freeze([
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser',
        sets: OFFICIAL_BRUISER_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
        ]),
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser (B. Dmg)',
        sets: OFFICIAL_BRUISER_B_DMG_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
        ]),
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Future',
        sets: OFFICIAL_ALL_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
          'EffectResistancePercent',
          'EffectivenessPercent',
        ]),
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'Defense',
          'DefensePercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
      }),
    ]),
    Boots: Object.freeze([
      Object.freeze({
        archetype: 'DPS',
        sets: OFFICIAL_DPS_SETS,
        Item_Main: Object.freeze(['AttackPercent', 'Speed']),
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Attack',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'DPS (No CC%)',
        sets: OFFICIAL_DPS_NO_CC_SETS,
        Item_Main: Object.freeze(['AttackPercent', 'Speed']),
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Attack',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'Res Tank',
        sets: OFFICIAL_RES_TANK_SETS,
        Item_Main: Object.freeze(['DefensePercent', 'HealthPercent', 'Speed']),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'Speed',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Pure Tank',
        sets: OFFICIAL_PURE_TANK_SETS,
        Item_Main: Object.freeze(['HealthPercent', 'Speed']),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF. Tank',
        sets: OFFICIAL_EFF_TANK_SETS,
        Item_Main: Object.freeze(['Speed']),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + ER',
        sets: OFFICIAL_ATK_ER_SETS,
        Item_Main: Object.freeze(['Speed']),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'EffectResistancePercent',
          'Attack',
          'AttackPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + EFF',
        sets: OFFICIAL_ATK_EFF_SETS,
        Item_Main: Object.freeze(['Speed']),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'EffectivenessPercent',
          'Attack',
          'AttackPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF + ER',
        sets: OFFICIAL_EFF_ER_SETS,
        Item_Main: Object.freeze(['Speed']),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'EffectResistancePercent',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser(Hp/Def)',
        sets: OFFICIAL_BRUISER_HP_DEF_SETS,
        Item_Main: Object.freeze(['Speed']),
        Item_Substats: Object.freeze([
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser',
        sets: OFFICIAL_BRUISER_SETS,
        Item_Main: Object.freeze(['Speed']),
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser (B. Dmg)',
        sets: OFFICIAL_BRUISER_B_DMG_SETS,
        Item_Main: Object.freeze(['Speed']),
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Future',
        sets: OFFICIAL_ALL_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
          'Speed',
        ]),
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'Defense',
          'DefensePercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
      }),
    ]),
  });
globalThis.OFFICIAL_ARCHETYPE_RULES = OFFICIAL_ARCHETYPE_RULES;

// ============================================================================
// PERSONAL/CUSTOMIZABLE ARCHETYPES
// Original archetype definitions - modify these as needed
// ============================================================================

var ARCHETYPE_RULES =
  globalThis.ARCHETYPE_RULES ||
  Object.freeze({
    Weapon: Object.freeze([
      Object.freeze({
        archetype: 'Top Speed',
        sets: ALL_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'Speed',
        sets: SPEED_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'DPS',
        sets: DPS_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'DPS (No CC%)',
        sets: DPS_NO_CC_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'Res Tank',
        sets: RES_TANK_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'Speed',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Pure Tank',
        sets: PURE_TANK_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'Speed',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF. Tank',
        sets: EFF_TANK_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'Speed',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + ER',
        sets: ATK_ER_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'EffectResistancePercent',
          'AttackPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + EFF',
        sets: ATK_EFF_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'EffectivenessPercent',
          'AttackPercent',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF + ER',
        sets: EFF_ER_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'EffectivenessPercent',
          'Speed',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser(Hp/Def)',
        sets: BRUISER_HP_DEF_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'Health',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser',
        sets: BRUISER_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'Health',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser (B. Dmg)',
        sets: BRUISER_B_DMG_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Speed',
          'HealthPercent',
          'Health',
        ]),
      }),
      Object.freeze({
        archetype: 'HP Focus',
        sets: HP_FOCUS_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze(['HealthPercent']),
        requiredSubstats: Object.freeze(['HealthPercent']),
      }),
      Object.freeze({
        archetype: 'Attack Focus',
        sets: ATK_FOCUS_HELM_WEAPON_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze(['AttackPercent']),
        requiredSubstats: Object.freeze(['AttackPercent']),
      }),
      Object.freeze({
        archetype: 'Effectiveness Focus',
        sets: EFF_FOCUS_WEAPON_HELM_ARMOR_SETS,
        Item_Main: globalThis.ITEM_MAIN.WEAPON.main_stats,
        Item_Substats: Object.freeze(['EffectivenessPercent']),
        requiredSubstats: Object.freeze(['EffectivenessPercent']),
      }),
    ]),
    Helmet: Object.freeze([
      Object.freeze({
        archetype: 'Top Speed',
        sets: ALL_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'Defense',
          'DefensePercent',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'Speed',
        sets: SPEED_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'Defense',
          'DefensePercent',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'DPS',
        sets: DPS_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Attack',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'DPS (No CC%)',
        sets: DPS_NO_CC_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Attack',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'Res Tank',
        sets: RES_TANK_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'DefensePercent',
          'Defense',
          'Speed',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Pure Tank',
        sets: PURE_TANK_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'DefensePercent',
          'Defense',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF. Tank',
        sets: EFF_TANK_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'DefensePercent',
          'Defense',
          'Speed',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + ER',
        sets: ATK_ER_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'DefensePercent',
          'Defense',
          'EffectResistancePercent',
          'AttackPercent',
          'Attack',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + EFF',
        sets: ATK_EFF_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'DefensePercent',
          'Defense',
          'EffectivenessPercent',
          'AttackPercent',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Attack',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF + ER',
        sets: EFF_ER_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'EffectivenessPercent',
          'Speed',
          'EffectResistancePercent',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser(Hp/Def)',
        sets: BRUISER_HP_DEF_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser',
        sets: BRUISER_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'DefensePercent',
          'Defense',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser (B. Dmg)',
        sets: BRUISER_B_DMG_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Attack',
          'Speed',
          'HealthPercent',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'HP Focus',
        sets: HP_FOCUS_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze(['HealthPercent']),
        requiredSubstats: Object.freeze(['HealthPercent']),
      }),
      Object.freeze({
        archetype: 'Attack Focus',
        sets: ATK_FOCUS_HELM_WEAPON_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze(['AttackPercent']),
        requiredSubstats: Object.freeze(['AttackPercent']),
      }),
      Object.freeze({
        archetype: 'Effectiveness Focus',
        sets: EFF_FOCUS_WEAPON_HELM_ARMOR_SETS,
        Item_Main: globalThis.ITEM_MAIN.HELMET.main_stats,
        Item_Substats: Object.freeze(['EffectivenessPercent']),
        requiredSubstats: Object.freeze(['EffectivenessPercent']),
      }),
    ]),
    Armor: Object.freeze([
      Object.freeze({
        archetype: 'Top Speed',
        sets: ALL_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'DefensePercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'Speed',
        sets: SPEED_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'DefensePercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'DPS',
        sets: DPS_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'DPS (No CC%)',
        sets: DPS_NO_CC_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'Res Tank',
        sets: RES_TANK_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Speed',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Pure Tank',
        sets: PURE_TANK_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF. Tank',
        sets: EFF_TANK_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Speed',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + ER',
        sets: ATK_ER_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + EFF',
        sets: ATK_EFF_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'EffectivenessPercent',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF + ER',
        sets: EFF_ER_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'EffectResistancePercent',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser(Hp/Def)',
        sets: BRUISER_HP_DEF_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser',
        sets: BRUISER_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser (B. Dmg)',
        sets: BRUISER_B_DMG_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Effect Resist Focus',
        sets: ARMOR_ER_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze(['EffectResistancePercent']),
        requiredSubstats: Object.freeze(['EffectResistancePercent']),
      }),
      Object.freeze({
        archetype: 'Effectiveness Focus',
        sets: EFF_FOCUS_ATTACK_SETS,
        Item_Main: Object.freeze(['AttackPercent']),
        Item_Substats: Object.freeze(['EffectivenessPercent']),
        requiredSubstats: Object.freeze(['EffectivenessPercent']),
      }),
      Object.freeze({
        archetype: 'Effectiveness Focus',
        sets: EFF_FOCUS_WEAPON_HELM_ARMOR_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze(['EffectivenessPercent']),
        requiredSubstats: Object.freeze(['EffectivenessPercent']),
      }),
      Object.freeze({
        archetype: 'HP Focus',
        sets: HP_FOCUS_SETS,
        Item_Main: globalThis.ITEM_MAIN.ARMOR.main_stats,
        Item_Substats: Object.freeze(['HealthPercent']),
        requiredSubstats: Object.freeze(['HealthPercent']),
      }),
    ]),
    Necklace: Object.freeze([
      Object.freeze({
        archetype: 'Top Speed',
        sets: ALL_SETS,
        Item_Main: globalThis.ITEM_MAIN.NECKLACE.main_stats,
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'Defense',
          'DefensePercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'Speed',
        sets: SPEED_SETS,
        Item_Main: Object.freeze([
          'CriticalHitDamagePercent',
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
          'CriticalHitChancePercent',
        ]),
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'Defense',
          'DefensePercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'DPS',
        sets: DPS_SETS,
        Item_Main: Object.freeze([
          'CriticalHitDamagePercent',
          'CriticalHitChancePercent',
        ]),
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Attack',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'DPS (No CC%)',
        sets: DPS_NO_CC_SETS,
        Item_Main: Object.freeze(['CriticalHitDamagePercent']),
        Item_Substats: Object.freeze(['AttackPercent', 'Attack', 'Speed']),
      }),
      Object.freeze({
        archetype: 'Res Tank',
        sets: RES_TANK_SETS,
        Item_Main: Object.freeze(['DefensePercent', 'HealthPercent']),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'Speed',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Pure Tank',
        sets: PURE_TANK_SETS,
        Item_Main: Object.freeze(['DefensePercent', 'HealthPercent']),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF. Tank',
        sets: EFF_TANK_SETS,
        Item_Main: Object.freeze(['DefensePercent', 'HealthPercent']),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'Speed',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + ER',
        sets: ATK_ER_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
        ]),
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'EffectResistancePercent',
          'AttackPercent',
          'Attack',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + EFF',
        sets: ATK_EFF_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
        ]),
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'EffectivenessPercent',
          'AttackPercent',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Attack',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF + ER',
        sets: EFF_ER_SETS,
        Item_Main: Object.freeze(['DefensePercent', 'HealthPercent']),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'EffectivenessPercent',
          'Speed',
          'EffectResistancePercent',
          'Defense',
          'DefensePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser(Hp/Def)',
        sets: BRUISER_HP_DEF_SETS,
        Item_Main: Object.freeze([
          'CriticalHitDamagePercent',
          'CriticalHitChancePercent',
        ]),
        Item_Substats: Object.freeze([
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser',
        sets: BRUISER_SETS,
        Item_Main: Object.freeze([
          'CriticalHitDamagePercent',
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
          'CriticalHitChancePercent',
        ]),
        Item_Substats: Object.freeze([
          'AttackPercent',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'EffectResistancePercent',
          'Attack',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser (B. Dmg)',
        sets: BRUISER_B_DMG_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
        ]),
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Attack',
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Effectiveness Focus',
        sets: EFF_FOCUS_ATTACK_SETS,
        Item_Main: Object.freeze(['AttackPercent']),
        Item_Substats: Object.freeze(['EffectivenessPercent']),
        requiredSubstats: Object.freeze(['EffectivenessPercent']),
      }),
      Object.freeze({
        archetype: 'Effect Resist Focus',
        sets: ER_FOCUS_ATTACK_SETS,
        Item_Main: Object.freeze(['AttackPercent']),
        Item_Substats: Object.freeze(['EffectResistancePercent']),
        requiredSubstats: Object.freeze(['EffectResistancePercent']),
      }),
      Object.freeze({
        archetype: 'Attack Focus',
        sets: ATK_FOCUS_NECK_RING_SETS,
        Item_Main: Object.freeze(['AttackPercent']),
        Item_Substats: Object.freeze(['Attack']),
        requiredSubstats: Object.freeze(['Attack']),
      }),
      Object.freeze({
        archetype: 'HP Focus',
        sets: HP_FOCUS_SETS,
        Item_Main: Object.freeze(['HealthPercent']),
        Item_Substats: Object.freeze(['Health']),
        requiredSubstats: Object.freeze(['Health']),
      }),
    ]),
    Ring: Object.freeze([
      Object.freeze({
        archetype: 'Top Speed',
        sets: ALL_SETS,
        Item_Main: globalThis.ITEM_MAIN.RING.main_stats,
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'Defense',
          'DefensePercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'Speed',
        sets: SPEED_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
          'EffectResistancePercent',
          'EffectivenessPercent',
        ]),
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'Defense',
          'DefensePercent',
          'Health',
          'HealthPercent',
          'Speed',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        requiredSubstats: Object.freeze(['Speed']),
      }),
      Object.freeze({
        archetype: 'DPS',
        sets: DPS_SETS,
        Item_Main: Object.freeze(['AttackPercent']),
        Item_Substats: Object.freeze([
          'Attack',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'DPS (No CC%)',
        sets: DPS_NO_CC_SETS,
        Item_Main: Object.freeze(['AttackPercent']),
        Item_Substats: Object.freeze([
          'Attack',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'Res Tank',
        sets: RES_TANK_SETS,
        Item_Main: Object.freeze([
          'DefensePercent',
          'HealthPercent',
          'EffectResistancePercent',
        ]),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'Speed',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Pure Tank',
        sets: PURE_TANK_SETS,
        Item_Main: Object.freeze(['HealthPercent', 'DefensePercent']),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF. Tank',
        sets: EFF_TANK_SETS,
        Item_Main: Object.freeze([
          'DefensePercent',
          'HealthPercent',
          'EffectivenessPercent',
        ]),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'Speed',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + ER',
        sets: ATK_ER_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
          'EffectResistancePercent',
        ]),
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'EffectResistancePercent',
          'AttackPercent',
          'Attack',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + EFF',
        sets: ATK_EFF_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
          'EffectivenessPercent',
        ]),
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'EffectivenessPercent',
          'AttackPercent',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Attack',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF + ER',
        sets: EFF_ER_SETS,
        Item_Main: Object.freeze([
          'HealthPercent',
          'DefensePercent',
          'EffectivenessPercent',
          'EffectResistancePercent',
        ]),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'EffectivenessPercent',
          'Speed',
          'EffectResistancePercent',
          'Defense',
          'DefensePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser(Hp/Def)',
        sets: BRUISER_HP_DEF_SETS,
        Item_Main: Object.freeze(['DefensePercent', 'HealthPercent']),
        Item_Substats: Object.freeze([
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser',
        sets: BRUISER_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
          'EffectResistancePercent',
        ]),
        Item_Substats: Object.freeze([
          'AttackPercent',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'EffectResistancePercent',
          'Attack',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser (B. Dmg)',
        sets: BRUISER_B_DMG_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
        ]),
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Effectiveness Focus',
        sets: EFF_FOCUS_ATTACK_SETS,
        Item_Main: Object.freeze(['AttackPercent', 'EffectivenessPercent']),
        Item_Substats: Object.freeze(['EffectivenessPercent', 'AttackPercent']),
        // Note: No requiredSubstats - main stat determines which substat is required (handled in scoring)
      }),
      Object.freeze({
        archetype: 'Effect Resist Focus',
        sets: ER_FOCUS_ATTACK_SETS,
        Item_Main: Object.freeze(['AttackPercent', 'EffectResistancePercent']),
        Item_Substats: Object.freeze([
          'EffectResistancePercent',
          'AttackPercent',
        ]),
        // Note: No requiredSubstats - main stat determines which substat is required (handled in scoring)
      }),
      Object.freeze({
        archetype: 'HP Focus',
        sets: HP_FOCUS_SETS,
        Item_Main: Object.freeze(['HealthPercent']),
        Item_Substats: Object.freeze(['Health']),
        requiredSubstats: Object.freeze(['Health']),
      }),
      Object.freeze({
        archetype: 'Attack Focus',
        sets: ATK_FOCUS_NECK_RING_SETS,
        Item_Main: Object.freeze(['AttackPercent']),
        Item_Substats: Object.freeze(['Attack']),
        requiredSubstats: Object.freeze(['Attack']),
      }),
    ]),
    Boots: Object.freeze([
      Object.freeze({
        archetype: 'DPS',
        sets: DPS_SETS,
        Item_Main: Object.freeze(['AttackPercent', 'Speed']),
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Attack',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'DPS (No CC%)',
        sets: DPS_NO_CC_SETS,
        Item_Main: Object.freeze(['AttackPercent', 'Speed']),
        Item_Substats: Object.freeze([
          'AttackPercent',
          'Attack',
          'CriticalHitDamagePercent',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'Res Tank',
        sets: RES_TANK_SETS,
        Item_Main: Object.freeze(['DefensePercent', 'HealthPercent', 'Speed']),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'Speed',
          'EffectResistancePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Pure Tank',
        sets: PURE_TANK_SETS,
        Item_Main: Object.freeze(['HealthPercent', 'Speed', 'DefensePercent']),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'Speed',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF. Tank',
        sets: EFF_TANK_SETS,
        Item_Main: Object.freeze(['HealthPercent', 'Speed', 'DefensePercent']),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'Speed',
          'EffectivenessPercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + ER',
        sets: ATK_ER_SETS,
        Item_Main: Object.freeze(['Speed', 'AttackPercent']),
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'EffectResistancePercent',
          'AttackPercent',
          'Attack',
        ]),
      }),
      Object.freeze({
        archetype: 'Atk + EFF',
        sets: ATK_EFF_SETS,
        Item_Main: Object.freeze(['Speed', 'AttackPercent', 'HealthPercent']),
        Item_Substats: Object.freeze([
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'EffectivenessPercent',
          'AttackPercent',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Attack',
        ]),
      }),
      Object.freeze({
        archetype: 'EFF + ER',
        sets: EFF_ER_SETS,
        Item_Main: Object.freeze(['HealthPercent', 'DefensePercent', 'Speed']),
        Item_Substats: Object.freeze([
          'HealthPercent',
          'EffectivenessPercent',
          'Speed',
          'EffectResistancePercent',
          'Health',
          'Defense',
          'DefensePercent',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser(Hp/Def)',
        sets: BRUISER_HP_DEF_SETS,
        Item_Main: Object.freeze(['Speed']),
        Item_Substats: Object.freeze([
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser',
        sets: BRUISER_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
          'Speed',
        ]),
        Item_Substats: Object.freeze([
          'AttackPercent',
          'CriticalHitChancePercent',
          'CriticalHitDamagePercent',
          'Speed',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
          'EffectResistancePercent',
          'Attack',
        ]),
      }),
      Object.freeze({
        archetype: 'Bruiser (B. Dmg)',
        sets: BRUISER_B_DMG_SETS,
        Item_Main: Object.freeze([
          'AttackPercent',
          'DefensePercent',
          'HealthPercent',
          'Speed',
        ]),
        Item_Substats: Object.freeze([
          'Attack',
          'AttackPercent',
          'HealthPercent',
          'Health',
          'DefensePercent',
          'Defense',
        ]),
      }),
      Object.freeze({
        archetype: 'Effectiveness Focus',
        sets: BOOT_EFF_FOCUS_ALL_SETS,
        Item_Main: Object.freeze(['Speed', 'AttackPercent']),
        Item_Substats: Object.freeze(['EffectivenessPercent']),
        requiredSubstats: Object.freeze(['EffectivenessPercent']),
      }),
      Object.freeze({
        archetype: 'Effect Resist Focus',
        sets: BOOT_ER_FOCUS_ALL_SETS,
        Item_Main: Object.freeze(['Speed', 'AttackPercent']),
        Item_Substats: Object.freeze(['EffectResistancePercent']),
        requiredSubstats: Object.freeze(['EffectResistancePercent']),
      }),
      Object.freeze({
        archetype: 'Crit Chance Focus',
        sets: BOOT_CC_SETS,
        Item_Main: Object.freeze(['Speed']),
        Item_Substats: Object.freeze(['CriticalHitChancePercent']),
        requiredSubstats: Object.freeze(['CriticalHitChancePercent']),
      }),
      Object.freeze({
        archetype: 'Attack Focus',
        sets: BOOT_ATK_FOCUS_ALL_SETS,
        Item_Main: Object.freeze(['Speed', 'AttackPercent']),
        Item_Substats: Object.freeze(['AttackPercent', 'Attack']),
        requiredSubstats: Object.freeze(['AttackPercent', 'Attack']),
      }),
      Object.freeze({
        archetype: 'HP Focus',
        sets: BOOT_HP_FOCUS_ALL_SETS,
        Item_Main: Object.freeze(['Speed', 'HealthPercent']),
        Item_Substats: Object.freeze(['HealthPercent', 'Health']),
        requiredSubstats: Object.freeze(['HealthPercent', 'Health']),
      }),
    ]),
  });
globalThis.ARCHETYPE_RULES = ARCHETYPE_RULES;

// ============================================================================
// ARCHETYPE SCORING CONFIGS
// Structure: SCORING_CONFIGS[gearSlot][archetype] = array of tier objects
// Each tier: { min, max (optional), base (optional), formula: 'type1'|'type2', multiplier, offset (optional) }
// Note: All divisions that were previously `/ 9` now divide by ITEM_MAX_ENHANCE_TOTAL_ROLLS.EPIC for consistency.
// ============================================================================

// Special scoring tier definitions (used for custom scoring logic)
var TopSpeedTiers = Object.freeze({
  Tier3: Object.freeze({
    Min: 27,
    Max: Infinity,
    formula: 'type2',
    multiplier: 20,
    offset: 490,
  }),
  Tier2: Object.freeze({
    Min: 25,
    Max: 26,
    formula: 'type2',
    multiplier: 10,
    offset: 225,
  }),
  Tier1: Object.freeze({
    Min: 22,
    Max: 24,
    formula: 'type2',
    multiplier: 5,
    offset: 105,
  }),
  Tier0: Object.freeze({
    Min: 20,
    Max: 21,
    formula: 'type2',
    multiplier: 2,
    offset: 39,
  }), // Personal-only: 20 spd=1, 21 spd=3
});

var SpeedTiers = Object.freeze({
  SpeedSet: Object.freeze({
    Tier3: Object.freeze({
      Min: 78.0,
      formula: 'type2',
      multiplier: 4,
      offset: 285,
    }), // Score: 27+
    Tier2: Object.freeze({
      Min: 73.0,
      Max: 77.9999,
      formula: 'type2',
      multiplier: 3,
      offset: 207,
    }), // Score: 12-27
    Tier1: Object.freeze({
      Min: 67.5,
      Max: 72.9999,
      formula: 'type2',
      multiplier: 2,
      offset: 134,
    }), // Score: 2-12
  }),
  OtherSets: Object.freeze({
    Tier2: Object.freeze({
      Min: 75.0,
      Max: Infinity,
      formula: 'type2',
      multiplier: 1,
      offset: 69,
    }), // Score: 6+
    Tier1: Object.freeze({
      Min: 68.75,
      Max: 74.9999,
      base: 67.5,
      formula: 'type1',
      multiplier: 0.8,
    }), // Score: 2-6
  }),
});

var SpeedSets = Object.freeze({
  SpeedSet: 'Speed',
  OtherSets: Object.freeze([
    'Critical',
    'Health',
    'Defense',
    'Immunity',
    'Penetration',
    'Torrent',
    'Hit',
    'Resist',
    'Revenge',
    'Reversal',
    'Pursuit',
  ]),
});

// Shared tier configurations (early cache optimization)
// These are referenced in SCORING_CONFIGS to eliminate duplication
// ============================================================================
// ORGANIZED BY ARCHETYPE (for easier verification and comparison)
// ============================================================================

var CUSTOM_PLACEHOLDER = Object.freeze([
  { min: 0, formula: 'custom', multiplier: 0 },
]);

// ============================================================================
// DPS ARCHETYPE TIERS
// ============================================================================
var DPS_WEAPON_HELMET_TIERS = Object.freeze([
  { min: 78.0, formula: 'type2', multiplier: 3, offset: 220 }, // Tier 3: 3*GS-220
  { min: 75.0, max: 77.9999, formula: 'type2', multiplier: 2, offset: 142 }, // Tier 2: 2*GS-142
  { min: 70.0, max: 74.9999, formula: 'type2', multiplier: 1.4, offset: 97 }, // Tier 1: 1.4*GS-97
]);

var DPS_ARMOR_TIERS = Object.freeze([
  { min: 73.0, formula: 'type2', multiplier: 3, offset: 203 }, // Tier 3: 3*GS-203
  { min: 69.0, max: 72.9999, formula: 'type2', multiplier: 2, offset: 130 }, // Tier 2: 2*GS-130
  { min: 64.0, max: 68.9999, formula: 'type2', multiplier: 1.4, offset: 88.6 }, // Tier 1: 1.4*GS-88.6
]);

var DPS_NECKLACE_RING_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 4, offset: 280 }, // Tier 3: 4*GS-280
  { min: 71.0, max: 73.9999, formula: 'type2', multiplier: 2.5, offset: 169 }, // Tier 2: 2.5*GS-169
  { min: 66.0, max: 70.9999, formula: 'type2', multiplier: 1.5, offset: 98 }, // Tier 1: 1.5*GS-98
]);

var DPS_BOOTS_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 4, offset: 277.5 }, // Tier 3: 4*GS-277.5
  { min: 71.0, max: 73.9999, formula: 'type2', multiplier: 2.5, offset: 166.5 }, // Tier 2: 2.5*GS-166.5
  {
    min: 64.334,
    max: 70.9999,
    formula: 'type2',
    multiplier: 1.5,
    offset: 95.5,
  }, // Tier 1: 1.5*GS-95.5
]);

// ============================================================================
// RES TANK ARCHETYPE TIERS
// ============================================================================
var RES_TANK_WEAPON_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 3, offset: 204 }, // Score: 18+ (74+ GS)
  { min: 70.0, max: 73.9999, formula: 'type2', multiplier: 2, offset: 130 }, // Score: 10-18 (70-74 GS)
  { min: 64.0, max: 69.9999, formula: 'type2', multiplier: 1.5, offset: 95 }, // Score: 1-10 (64-70 GS)
]);

var RES_TANK_HELMET_ARMOR_TIERS = Object.freeze([
  { min: 79.0, formula: 'type2', multiplier: 3, offset: 221 }, // Score: 16+ (79+ GS)
  { min: 76.0, max: 78.9999, formula: 'type2', multiplier: 2, offset: 142 }, // Score: 10-16 (76-79 GS)
  { min: 70.0, max: 75.9999, formula: 'type2', multiplier: 1.5, offset: 104 }, // Score: 1-10 (70-76 GS)
]);

var RES_TANK_NECKLACE_RING_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 3, offset: 203 }, // Score: 19+ (74+ GS)
  { min: 70.0, max: 73.9999, formula: 'type2', multiplier: 2, offset: 129 }, // Score: 11-19 (70-74 GS)
  { min: 63.334, max: 69.9999, formula: 'type2', multiplier: 1.5, offset: 94 }, // Score: 2-11 (64-70 GS)
]);
// ============================================================================
// PURE TANK ARCHETYPE TIERS
// ============================================================================
var PURE_TANK_WEAPON_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 3, offset: 204 }, // Score: 18+ (74+ GS)
  { min: 70.0, max: 73.9999, formula: 'type2', multiplier: 2, offset: 130 }, // Score: 10-18 (70-74 GS)
  { min: 64.0, max: 69.9999, formula: 'type2', multiplier: 1.5, offset: 95 }, // Score: 1-10 (64-70 GS)
]);

var PURE_TANK_HELMET_ARMOR_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 3.5, offset: 237 }, // Score: 22+ (74+ GS)
  { min: 68.0, max: 73.9999, formula: 'type2', multiplier: 2, offset: 126 }, // Score: 10-22 (68-74 GS)
  { min: 63.0, max: 67.9999, formula: 'type2', multiplier: 1.8, offset: 112.4 }, // Score: 0.8-10 (63-68 GS)
]);

var PURE_TANK_NECKLACE_TIERS = Object.freeze([
  { min: 70.0, formula: 'type2', multiplier: 5, offset: 321 }, // Score: 29+ (70+ GS)
  { min: 64.0, max: 69.9999, formula: 'type2', multiplier: 3, offset: 181 }, // Score: 11-29 (64-70 GS)
  { min: 57.334, max: 63.9999, formula: 'type2', multiplier: 1.5, offset: 85 }, // Score: 2-11 (58-64 GS)
]);

var PURE_TANK_RING_BOOTS_TIERS = Object.freeze([
  { min: 68.0, formula: 'type2', multiplier: 5, offset: 319 }, // Score: 21+ (68+ GS)
  { min: 64.0, max: 67.9999, formula: 'type2', multiplier: 2.5, offset: 149 }, // Score: 11-21 (64-68 GS)
  { min: 57.334, max: 63.9999, formula: 'type2', multiplier: 1.5, offset: 85 }, // Score: 2-11 (58-64 GS)
]);

// ============================================================================
// EFF. TANK ARCHETYPE TIERS
// ============================================================================
var EFF_TANK_WEAPON_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 3, offset: 204 }, // Score: 18+ (74+ GS)
  { min: 70.0, max: 73.9999, formula: 'type2', multiplier: 2, offset: 130 }, // Score: 10-18 (70-74 GS)
  { min: 64.0, max: 69.9999, formula: 'type2', multiplier: 1.5, offset: 95 }, // Score: 1-10 (64-70 GS)
]);

var EFF_TANK_HELMET_ARMOR_TIERS = Object.freeze([
  { min: 79.0, formula: 'type2', multiplier: 3, offset: 221 }, // Score: 16+ (79+ GS)
  { min: 76.0, max: 78.9999, formula: 'type2', multiplier: 2, offset: 142 }, // Score: 10-16 (76-79 GS)
  { min: 70.0, max: 75.9999, formula: 'type2', multiplier: 1.5, offset: 104 }, // Score: 1-10 (70-76 GS)
]);

var EFF_TANK_NECKLACE_RING_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 3, offset: 203 }, // Score: 19+ (74+ GS)
  { min: 70.0, max: 73.9999, formula: 'type2', multiplier: 2, offset: 129 }, // Score: 11-19 (70-74 GS)
  { min: 63.334, max: 69.9999, formula: 'type2', multiplier: 1.5, offset: 94 }, // Score: 2-11 (64-70 GS)
]);

var EFF_TANK_BOOTS_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 3, offset: 203 }, // Score: 19+ (74+ GS)
  { min: 70.0, max: 73.9999, formula: 'type2', multiplier: 2, offset: 129 }, // Score: 11-19 (70-74 GS)
  { min: 63.334, max: 69.9999, formula: 'type2', multiplier: 1.5, offset: 94 }, // Score: 2-11 (64-70 GS)
]);

// ============================================================================
// BRUISER ARCHETYPE TIERS
// ============================================================================
var BRUISER_HP_DEF_COMMON_TIERS = Object.freeze([
  { min: 77.0, formula: 'type2', multiplier: 3, offset: 221 }, // Score: 10+
  { min: 74.0, max: 76.9999, formula: 'type2', multiplier: 2, offset: 144 }, // Score: 4-10
  { min: 71.0, max: 73.9999, formula: 'type2', multiplier: 1, offset: 70 }, // Score: 1-4
]);

var BRUISER_HP_DEF_NECKLACE_RING_BOOTS_TIERS = Object.freeze([
  { min: 77.0, formula: 'type2', multiplier: 4, offset: 295 }, // Score: 13+
  { min: 74.0, max: 76.9999, formula: 'type2', multiplier: 2, offset: 141 }, // Score: 7-13
  { min: 68.0, max: 73.9999, formula: 'type2', multiplier: 1, offset: 67 }, // Score: 1-7
]);

var BRUISER_COMMON_TIERS = Object.freeze([
  { min: 75.0, formula: 'type2', multiplier: 2, offset: 146 }, // Score: 4+
  { min: 72.0, max: 74.9999, formula: 'type2', multiplier: 1, offset: 71 }, // Score: 1-4
]);

// ============================================================================
// DPS (No CC%) ARCHETYPE TIERS (Personal)
// ============================================================================
var DPS_NO_CC_WEAPON_TIERS = Object.freeze([
  { min: 72.0, formula: 'type2', multiplier: 5, offset: 340.5 }, // Score: 19.5+ (72+ GS)
  { min: 68.0, max: 71.9999, formula: 'type2', multiplier: 2.5, offset: 160.5 }, // Score: 9.5-19.5 (68-72 GS)
  {
    min: 62.334,
    max: 67.9999,
    formula: 'type2',
    multiplier: 1.5,
    offset: 92.5,
  }, // Score: 2-9.5 (63-68 GS)
]);

var DPS_NO_CC_HELMET_TIERS = Object.freeze([
  { min: 75.0, formula: 'type2', multiplier: 5, offset: 355.5 }, // Score: 19.5+ (75+ GS)
  { min: 71.0, max: 74.9999, formula: 'type2', multiplier: 2.5, offset: 168 }, // Score: 9.5-19.5 (71-75 GS)
  { min: 65.334, max: 70.9999, formula: 'type2', multiplier: 1.5, offset: 97 }, // Score: 2-9.5 (66-71 GS)
]);

var DPS_NO_CC_NECKLACE_RING_BOOTS_TIERS = Object.freeze([
  { min: 66.0, formula: 'type2', multiplier: 5, offset: 310.5 }, // Score: 19.5+ (66+ GS)
  { min: 63.0, max: 65.9999, formula: 'type2', multiplier: 3, offset: 178.5 }, // Score: 10.5-19.5 (63-66 GS)
  { min: 58.25, max: 62.9999, formula: 'type2', multiplier: 2, offset: 115.5 }, // Score: 2.5-10.5 (59-63 GS)
]);

// ============================================================================
// BRUISER (B. DMG) ARCHETYPE TIERS (Personal)
// ============================================================================
var BRUISER_B_DMG_WEAPON_ARMOR_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 3, offset: 204 }, // Score: 18+
  { min: 70.0, max: 73.9999, formula: 'type2', multiplier: 2, offset: 130 }, // Score: 10-18
  { min: 64.0, max: 69.9999, formula: 'type2', multiplier: 1.5, offset: 95 }, // Score: 1-10
]);

var BRUISER_B_DMG_HELMET_TIERS = Object.freeze([
  { min: 79.0, formula: 'type2', multiplier: 3, offset: 221 }, // Score: 16+
  { min: 76.0, max: 78.9999, formula: 'type2', multiplier: 2, offset: 142 }, // Score: 10-16
  { min: 70.0, max: 75.9999, formula: 'type2', multiplier: 1.5, offset: 104 }, // Score: 1-10
]);

var BRUISER_B_DMG_NECKLACE_RING_BOOTS_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 4, offset: 280 }, // Score: 16+
  { min: 71.0, max: 73.9999, formula: 'type2', multiplier: 2.5, offset: 169 }, // Score: 8.5-16
  { min: 66.0, max: 70.9999, formula: 'type2', multiplier: 1.5, offset: 98 }, // Score: 1-8.5
]);

// ============================================================================
// ATK + ER / ATK + EFF ARCHETYPE TIERS
// ============================================================================
var ATK_ER_EFF_COMMON_TIERS = Object.freeze([
  { min: 75.0, formula: 'type2', multiplier: 2, offset: 146 }, // Score: 4+
  { min: 72.0, max: 74.9999, formula: 'type2', multiplier: 1, offset: 71 }, // Score: 1-4
]);

// Note: Future archetype (high-rolled gear) uses OFFICIAL_FUTURE_COMMON_TIERS (no separate Personal config)

// ============================================================================
// BOOT-SPECIFIC FOCUS ARCHETYPE TIERS
// ============================================================================
// Effectiveness Focus: Max roll = 8%, Tiers from 38-54+ (continuous power scale)
var BOOT_EFF_FOCUS_TIERS = Object.freeze({
  Tier4: Object.freeze({ Min: 54, Max: Infinity, Base: 43.5, Multiplier: 2 }), // Score: 2(value-43.5) for 54+ (starts at 21)
  Tier3: Object.freeze({ Min: 48, Max: 54, Base: 40, Multiplier: 1.5 }), // Score: 1.5(value-40) for 48-54 (starts at 12)
  Tier2: Object.freeze({ Min: 43, Max: 48, Base: 38, Multiplier: 1.2 }), // Score: 1.2(value-38) for 43-48 (starts at 6)
  Tier1: Object.freeze({ Min: 38, Max: 43, Base: 37, Multiplier: 1 }), // Score: 1(value-37) for 38-43 (starts at 1)
});

// Effect Resist Focus: Max roll = 8%, Tiers from 38-54+ (continuous power scale)
var BOOT_ER_FOCUS_TIERS = Object.freeze({
  Tier4: Object.freeze({ Min: 54, Max: Infinity, Base: 43.5, Multiplier: 2 }), // Score: 2(value-43.5) for 54+ (starts at 21)
  Tier3: Object.freeze({ Min: 48, Max: 54, Base: 40, Multiplier: 1.5 }), // Score: 1.5(value-40) for 48-54 (starts at 12)
  Tier2: Object.freeze({ Min: 43, Max: 48, Base: 38, Multiplier: 1.2 }), // Score: 1.2(value-38) for 43-48 (starts at 6)
  Tier1: Object.freeze({ Min: 38, Max: 43, Base: 37, Multiplier: 1 }), // Score: 1(value-37) for 38-43 (starts at 1)
});

// Crit Chance Focus: Max roll = 5%, Tiers from 25-34+ (continuous power scale)
var BOOT_CC_FOCUS_TIERS = Object.freeze({
  Tier4: Object.freeze({ Min: 34, Max: Infinity, Base: 27.95, Multiplier: 2 }), // Score: 2(value-27.95) for 34+ (starts at 12.1)
  Tier3: Object.freeze({
    Min: 31,
    Max: 34,
    Base: 25.933333333333334,
    Multiplier: 1.5,
  }), // Score: 1.5(value-25.93) for 31-34 (starts at 7.6)
  Tier2: Object.freeze({
    Min: 28,
    Max: 31,
    Base: 24.666666666666668,
    Multiplier: 1.2,
  }), // Score: 1.2(value-24.67) for 28-31 (starts at 4)
  Tier1: Object.freeze({ Min: 25, Max: 28, Base: 24, Multiplier: 1 }), // Score: 1(value-24) for 25-28 (starts at 1)
});

// Attack Focus: Max roll = 8%, Tiers from 38-54+ (continuous power scale)
var BOOT_ATK_FOCUS_TIERS = Object.freeze({
  Tier4: Object.freeze({ Min: 54, Max: Infinity, Base: 43.5, Multiplier: 2 }), // Score: 2(value-43.5) for 54+ (starts at 21)
  Tier3: Object.freeze({ Min: 48, Max: 54, Base: 40, Multiplier: 1.5 }), // Score: 1.5(value-40) for 48-54 (starts at 12)
  Tier2: Object.freeze({ Min: 43, Max: 48, Base: 38, Multiplier: 1.2 }), // Score: 1.2(value-38) for 43-48 (starts at 6)
  Tier1: Object.freeze({ Min: 38, Max: 43, Base: 37, Multiplier: 1 }), // Score: 1(value-37) for 38-43 (starts at 1)
});

// HP Focus: Max roll HP% = 8%, Tiers for HP% potential (similar to Effectiveness/ER Focus)
var HP_FOCUS_TIERS = Object.freeze({
  Tier4: Object.freeze({ Min: 54, Max: Infinity, Base: 43.5, Multiplier: 2 }), // Score: 2(value-43.5) for 54+ (starts at 21)
  Tier3: Object.freeze({ Min: 48, Max: 54, Base: 40, Multiplier: 1.5 }), // Score: 1.5(value-40) for 48-54 (starts at 12)
  Tier2: Object.freeze({ Min: 43, Max: 48, Base: 38, Multiplier: 1.2 }), // Score: 1.2(value-38) for 43-48 (starts at 6)
  Tier1: Object.freeze({ Min: 38, Max: 43, Base: 37, Multiplier: 1 }), // Score: 1(value-37) for 38-43 (starts at 1)
});

// Flat HP Focus: Max roll flat HP = 202, Tiers for flat HP potential (for Neck/Ring/Boots HP% main)
var FLAT_HP_FOCUS_TIERS = Object.freeze({
  Tier4: Object.freeze({
    Min: 1303,
    Max: Infinity,
    Base: 1128,
    Multiplier: 0.12,
  }), // Score: 0.12(value-1128) for 1303+ (starts at 21)
  Tier3: Object.freeze({
    Min: 1203,
    Max: 1303,
    Base: 1069.67,
    Multiplier: 0.09,
  }), // Score: 0.09(value-1069.67) for 1203-1303 (starts at 12)
  Tier2: Object.freeze({ Min: 1103, Max: 1203, Base: 1003, Multiplier: 0.06 }), // Score: 0.06(value-1003) for 1103-1203 (starts at 6)
  Tier1: Object.freeze({
    Min: 1033,
    Max: 1103,
    Base: 971,
    Multiplier: 0.045454545,
  }), // Score: 0.045454(value-971) for 1033-1103 (starts at 1)
});

// Flat Attack Focus: Max roll flat Attack = 46, Tiers for flat Attack potential (for Neck/Ring/Boots Atk% main)
var FLAT_ATK_FOCUS_TIERS = Object.freeze({
  Tier4: Object.freeze({
    Min: 277,
    Max: Infinity,
    Base: 246,
    Multiplier: 0.12,
  }), // Score: 0.12(value-246) for 277+
  Tier3: Object.freeze({ Min: 259, Max: 277, Base: 235.5, Multiplier: 0.09 }), // Score: 0.09(value-235.5) for 259-277
  Tier2: Object.freeze({ Min: 241, Max: 259, Base: 224, Multiplier: 0.06 }), // Score: 0.06(value-224) for 241-259
  Tier1: Object.freeze({
    Min: 229,
    Max: 241,
    Base: 218,
    Multiplier: 0.045454545,
  }), // Score: 0.045454(value-218) for 229-241
});

// ============================================================================
// OFFICIAL TIER CONFIGURATIONS (E7Bot Reference - Do Not Modify)
// Duplicated tier definitions for independent official scoring adjustments
// ============================================================================

// Special scoring tier definitions for Top Speed and Speed archetypes
var OFFICIAL_TopSpeedTiers = Object.freeze({
  Tier3: Object.freeze({
    Min: 27,
    Max: Infinity,
    formula: 'type2',
    multiplier: 20,
    offset: 490,
  }),
  Tier2: Object.freeze({
    Min: 25,
    Max: 26,
    formula: 'type2',
    multiplier: 10,
    offset: 225,
  }),
  Tier1: Object.freeze({
    Min: 22,
    Max: 24,
    formula: 'type2',
    multiplier: 5,
    offset: 105,
  }),
});

var OFFICIAL_SpeedTiers = Object.freeze({
  SpeedSet: Object.freeze({
    Tier3: Object.freeze({
      Min: 78.0,
      formula: 'type2',
      multiplier: 4,
      offset: 285,
    }), // Score: 27+
    Tier2: Object.freeze({
      Min: 73.0,
      Max: 77.9999,
      formula: 'type2',
      multiplier: 3,
      offset: 207,
    }), // Score: 12-27
    Tier1: Object.freeze({
      Min: 68.0,
      Max: 72.9999,
      formula: 'type2',
      multiplier: 2,
      offset: 134,
    }), // Score: 2-12
  }),
  OtherSets: Object.freeze({
    Tier2: Object.freeze({
      Min: 75.0,
      Max: Infinity,
      formula: 'type2',
      multiplier: 1,
      offset: 69,
    }), // Score: 6+
    Tier1: Object.freeze({
      Min: 70.0,
      Max: 74.9999,
      base: 67.5,
      formula: 'type1',
      multiplier: 0.8,
    }), // Score: 2-6
  }),
});

var OFFICIAL_SpeedSets = Object.freeze({
  SpeedSet: 'Speed',
  OtherSets: Object.freeze([
    'Critical',
    'Health',
    'Defense',
    'Immunity',
    'Penetration',
    'Torrent',
    'Hit',
    'Resist',
    'Pursuit',
  ]),
});

var OFFICIAL_CUSTOM_PLACEHOLDER = Object.freeze([
  { min: 0, formula: 'custom', multiplier: 0 },
]);

// DPS ARCHETYPE TIERS
var OFFICIAL_DPS_WEAPON_HELMET_TIERS = Object.freeze([
  { min: 78.0, formula: 'type2', multiplier: 3, offset: 220 }, // Tier 3: 3*GS-220
  { min: 75.0, max: 77.9999, formula: 'type2', multiplier: 2, offset: 142 }, // Tier 2: 2*GS-142
  { min: 70.0, max: 74.9999, formula: 'type2', multiplier: 1.4, offset: 97 }, // Tier 1: 1.4*GS-97
]);

var OFFICIAL_DPS_ARMOR_TIERS = Object.freeze([
  { min: 73.0, formula: 'type2', multiplier: 3, offset: 203 }, // Tier 3: 3*GS-203
  { min: 69.0, max: 72.9999, formula: 'type2', multiplier: 2, offset: 130 }, // Tier 2: 2*GS-130
  { min: 64.0, max: 68.9999, formula: 'type2', multiplier: 1.4, offset: 88.6 }, // Tier 1: 1.4*GS-88.6
]);

var OFFICIAL_DPS_NECKLACE_RING_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 4, offset: 280 }, // Tier 3: 4*GS-280
  { min: 71.0, max: 73.9999, formula: 'type2', multiplier: 2.5, offset: 169 }, // Tier 2: 2.5*GS-169
  { min: 66.0, max: 70.9999, formula: 'type2', multiplier: 1.5, offset: 98 }, // Tier 1: 1.5*GS-98
]);

var OFFICIAL_DPS_BOOTS_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 4, offset: 277.5 }, // Tier 3: 4*GS-277.5
  { min: 71.0, max: 73.9999, formula: 'type2', multiplier: 2.5, offset: 166.5 }, // Tier 2: 2.5*GS-166.5
  { min: 65.0, max: 70.9999, formula: 'type2', multiplier: 1.5, offset: 95.5 }, // Tier 1: 1.5*GS-95.5
]);

// RES TANK ARCHETYPE TIERS
var OFFICIAL_RES_TANK_WEAPON_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 3, offset: 204 }, // Score: 18+ (74+ GS)
  { min: 70.0, max: 73.9999, formula: 'type2', multiplier: 2, offset: 130 }, // Score: 10-18 (70-74 GS)
  { min: 64.0, max: 69.9999, formula: 'type2', multiplier: 1.5, offset: 95 }, // Score: 2-10 (64-70 GS)
]);

var OFFICIAL_RES_TANK_HELMET_ARMOR_TIERS = Object.freeze([
  { min: 79.0, formula: 'type2', multiplier: 3, offset: 221 }, // Score: 16+ (79+ GS)
  { min: 76.0, max: 78.9999, formula: 'type2', multiplier: 2, offset: 142 }, // Score: 10-16 (76-79 GS)
  { min: 70.0, max: 75.9999, formula: 'type2', multiplier: 1.5, offset: 104 }, // Score: 1.5-10 (70-76 GS)
]);

var OFFICIAL_RES_TANK_NECKLACE_RING_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 3, offset: 203 }, // Score: 19+ (74+ GS)
  { min: 70.0, max: 73.9999, formula: 'type2', multiplier: 2, offset: 129 }, // Score: 11-19 (70-74 GS)
  { min: 64.0, max: 69.9999, formula: 'type2', multiplier: 1.5, offset: 94 }, // Score: 2-11 (64-70 GS)
]);

// PURE TANK ARCHETYPE TIERS
var OFFICIAL_PURE_TANK_WEAPON_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 3, offset: 204 }, // Score: 18+ (74+ GS)
  { min: 70.0, max: 73.9999, formula: 'type2', multiplier: 2, offset: 130 }, // Score: 10-18 (70-74 GS)
  { min: 64.0, max: 69.9999, formula: 'type2', multiplier: 1.5, offset: 95 }, // Score: 2-10 (64-70 GS)
]);

var OFFICIAL_PURE_TANK_HELMET_ARMOR_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 3.5, offset: 237 }, // Score: 22+ (74+ GS)
  { min: 68.0, max: 73.9999, formula: 'type2', multiplier: 2, offset: 126 }, // Score: 10-22 (68-74 GS)
  { min: 63.0, max: 67.9999, formula: 'type2', multiplier: 1.8, offset: 112.4 }, // Score: 1.2-10 (63-68 GS)
]);

var OFFICIAL_PURE_TANK_NECKLACE_TIERS = Object.freeze([
  { min: 70.0, formula: 'type2', multiplier: 5, offset: 321 }, // Score: 29+ (70+ GS)
  { min: 64.0, max: 69.9999, formula: 'type2', multiplier: 3, offset: 181 }, // Score: 11-29 (64-70 GS)
  { min: 58.0, max: 63.9999, formula: 'type2', multiplier: 1.5, offset: 85 }, // Score: 2-11 (58-64 GS)
]);

var OFFICIAL_PURE_TANK_RING_BOOTS_TIERS = Object.freeze([
  { min: 68.0, formula: 'type2', multiplier: 5, offset: 319 }, // Score: 21+ (68+ GS)
  { min: 64.0, max: 67.9999, formula: 'type2', multiplier: 2.5, offset: 149 }, // Score: 11-21 (64-68 GS)
  { min: 58.0, max: 63.9999, formula: 'type2', multiplier: 1.5, offset: 85 }, // Score: 2-11 (58-64 GS)
]);

// EFF. TANK ARCHETYPE TIERS
var OFFICIAL_EFF_TANK_WEAPON_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 3, offset: 204 }, // Score: 18+ (74+ GS)
  { min: 70.0, max: 73.9999, formula: 'type2', multiplier: 2, offset: 130 }, // Score: 10-18 (70-74 GS)
  { min: 64.0, max: 69.9999, formula: 'type2', multiplier: 1.5, offset: 95 }, // Score: 2-10 (64-70 GS)
]);

var OFFICIAL_EFF_TANK_HELMET_ARMOR_TIERS = Object.freeze([
  { min: 79.0, formula: 'type2', multiplier: 3, offset: 221 }, // Score: 16+ (79+ GS)
  { min: 76.0, max: 78.9999, formula: 'type2', multiplier: 2, offset: 142 }, // Score: 10-16 (76-79 GS)
  { min: 70.0, max: 75.9999, formula: 'type2', multiplier: 1.5, offset: 104 }, // Score: 1.5-10 (70-76 GS)
]);

var OFFICIAL_EFF_TANK_NECKLACE_RING_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 3, offset: 203 }, // Score: 19+ (74+ GS)
  { min: 70.0, max: 73.9999, formula: 'type2', multiplier: 2, offset: 129 }, // Score: 11-19 (70-74 GS)
  { min: 64.0, max: 69.9999, formula: 'type2', multiplier: 1.5, offset: 94 }, // Score: 2-11 (64-70 GS)
]);

var OFFICIAL_EFF_TANK_BOOTS_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 3, offset: 203 }, // Score: 19+ (74+ GS)
  { min: 70.0, max: 73.9999, formula: 'type2', multiplier: 2, offset: 129 }, // Score: 11-19 (70-74 GS)
  { min: 64.0, max: 69.9999, formula: 'type2', multiplier: 1.5, offset: 94 }, // Score: 2-11 (64-70 GS)
]);

// BRUISER ARCHETYPE TIERS
var OFFICIAL_BRUISER_HP_DEF_COMMON_TIERS = Object.freeze([
  { min: 77.0, formula: 'type2', multiplier: 3, offset: 221 }, // Score: 10+
  { min: 74.0, max: 76.9999, formula: 'type2', multiplier: 2, offset: 144 }, // Score: 4-10
  { min: 71.0, max: 73.9999, formula: 'type2', multiplier: 1, offset: 70 }, // Score: 1-4
]);

var OFFICIAL_BRUISER_HP_DEF_NECKLACE_RING_BOOTS_TIERS = Object.freeze([
  { min: 77.0, formula: 'type2', multiplier: 4, offset: 295 }, // Score: 13+
  { min: 74.0, max: 76.9999, formula: 'type2', multiplier: 2, offset: 141 }, // Score: 7-13
  { min: 68.0, max: 73.9999, formula: 'type2', multiplier: 1, offset: 67 }, // Score: 1-7
]);

var OFFICIAL_BRUISER_COMMON_TIERS = Object.freeze([
  { min: 75.0, formula: 'type2', multiplier: 2, offset: 146 }, // Score: 4+
  { min: 72.0, max: 74.9999, formula: 'type2', multiplier: 1, offset: 71 }, // Score: 1-4
]);

// DPS (No CC%) ARCHETYPE TIERS
var OFFICIAL_DPS_NO_CC_WEAPON_TIERS = Object.freeze([
  { min: 72.0, formula: 'type2', multiplier: 5, offset: 340.5 }, // Score: 19.5+ (72+ GS)
  { min: 68.0, max: 71.9999, formula: 'type2', multiplier: 2.5, offset: 160.5 }, // Score: 9.5-19.5 (68-72 GS)
  { min: 63.0, max: 67.9999, formula: 'type2', multiplier: 1.5, offset: 92.5 }, // Score: 2-9.5 (63-68 GS)
]);

var OFFICIAL_DPS_NO_CC_HELMET_TIERS = Object.freeze([
  { min: 75.0, formula: 'type2', multiplier: 5, offset: 355.5 }, // Score: 19.5+ (75+ GS)
  { min: 71.0, max: 74.9999, formula: 'type2', multiplier: 2.5, offset: 168 }, // Score: 9.5-19.5 (71-75 GS)
  { min: 66.0, max: 70.9999, formula: 'type2', multiplier: 1.5, offset: 97 }, // Score: 2-9.5 (66-71 GS)
]);

var OFFICIAL_DPS_NO_CC_NECKLACE_RING_BOOTS_TIERS = Object.freeze([
  { min: 66.0, formula: 'type2', multiplier: 5, offset: 310.5 }, // Score: 19.5+ (66+ GS)
  { min: 63.0, max: 65.9999, formula: 'type2', multiplier: 3, offset: 178.5 }, // Score: 10.5-19.5 (63-66 GS)
  { min: 59.0, max: 62.9999, formula: 'type2', multiplier: 2, offset: 115.5 }, // Score: 2.5-10.5 (59-63 GS)
]);

// BRUISER (B. DMG) ARCHETYPE TIERS
var OFFICIAL_BRUISER_B_DMG_WEAPON_ARMOR_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 3, offset: 204 }, // Score: 18+
  { min: 70.0, max: 73.9999, formula: 'type2', multiplier: 2, offset: 130 }, // Score: 10-18
  { min: 65.0, max: 69.9999, formula: 'type2', multiplier: 1.5, offset: 95 }, // Score: 1-10
]);

var OFFICIAL_BRUISER_B_DMG_HELMET_TIERS = Object.freeze([
  { min: 79.0, formula: 'type2', multiplier: 3, offset: 221 }, // Score: 16+
  { min: 76.0, max: 78.9999, formula: 'type2', multiplier: 2, offset: 142 }, // Score: 10-16
  { min: 71.0, max: 75.9999, formula: 'type2', multiplier: 1.5, offset: 104 }, // Score: 1-10
]);

var OFFICIAL_BRUISER_B_DMG_NECKLACE_RING_BOOTS_TIERS = Object.freeze([
  { min: 74.0, formula: 'type2', multiplier: 4, offset: 280 }, // Score: 16+
  { min: 71.0, max: 73.9999, formula: 'type2', multiplier: 2.5, offset: 169 }, // Score: 8.5-16
  { min: 67.0, max: 70.9999, formula: 'type2', multiplier: 1.5, offset: 98 }, // Score: 1-8.5
]);

// ATK + ER / ATK + EFF ARCHETYPE TIERS
var OFFICIAL_ATK_ER_EFF_COMMON_TIERS = Object.freeze([
  { min: 75.0, formula: 'type2', multiplier: 2, offset: 146 }, // Score: 4+
  { min: 72.0, max: 74.9999, formula: 'type2', multiplier: 1, offset: 71 }, // Score: 1-4
]);

// EFF + ER ARCHETYPE TIERS
var OFFICIAL_EFF_ER_COMMON_TIERS = Object.freeze([
  { min: 75.0, formula: 'type2', multiplier: 2, offset: 146 }, // Score: 4+
  { min: 72.0, max: 74.9999, formula: 'type2', multiplier: 1, offset: 71 }, // Score: 1-4
]);

// FUTURE ARCHETYPE TIERS
var OFFICIAL_FUTURE_COMMON_TIERS = Object.freeze([
  { min: 75.0, base: 73.5, formula: 'type1', multiplier: 2 / 3 }, // Score: 1+
]);

// ============================================================================
// OFFICIAL SCORING CONFIGS (E7Bot Reference - Do Not Modify)
// Maps official archetypes to their tier configurations
// ============================================================================
var OFFICIAL_SCORING_CONFIGS = {
  Weapon: {
    'Top Speed': OFFICIAL_CUSTOM_PLACEHOLDER,
    Speed: OFFICIAL_CUSTOM_PLACEHOLDER,
    DPS: OFFICIAL_DPS_WEAPON_HELMET_TIERS,
    'DPS (No CC%)': OFFICIAL_DPS_NO_CC_WEAPON_TIERS,
    'Res Tank': OFFICIAL_RES_TANK_WEAPON_TIERS,
    'Pure Tank': OFFICIAL_PURE_TANK_WEAPON_TIERS,
    'EFF. Tank': OFFICIAL_EFF_TANK_WEAPON_TIERS,
    'Atk + ER': OFFICIAL_ATK_ER_EFF_COMMON_TIERS,
    'Atk + EFF': OFFICIAL_ATK_ER_EFF_COMMON_TIERS,
    'EFF + ER': OFFICIAL_EFF_ER_COMMON_TIERS,
    'Bruiser(Hp/Def)': OFFICIAL_BRUISER_HP_DEF_COMMON_TIERS,
    Bruiser: OFFICIAL_BRUISER_COMMON_TIERS,
    'Bruiser (B. Dmg)': OFFICIAL_BRUISER_B_DMG_WEAPON_ARMOR_TIERS,
    Future: OFFICIAL_FUTURE_COMMON_TIERS,
  },
  Helmet: {
    'Top Speed': OFFICIAL_CUSTOM_PLACEHOLDER,
    Speed: OFFICIAL_CUSTOM_PLACEHOLDER,
    DPS: OFFICIAL_DPS_WEAPON_HELMET_TIERS,
    'DPS (No CC%)': OFFICIAL_DPS_NO_CC_HELMET_TIERS,
    'Res Tank': OFFICIAL_RES_TANK_HELMET_ARMOR_TIERS,
    'Pure Tank': OFFICIAL_PURE_TANK_HELMET_ARMOR_TIERS,
    'EFF. Tank': OFFICIAL_EFF_TANK_HELMET_ARMOR_TIERS,
    'Atk + ER': OFFICIAL_ATK_ER_EFF_COMMON_TIERS,
    'Atk + EFF': OFFICIAL_ATK_ER_EFF_COMMON_TIERS,
    'EFF + ER': OFFICIAL_EFF_ER_COMMON_TIERS,
    'Bruiser(Hp/Def)': OFFICIAL_BRUISER_HP_DEF_COMMON_TIERS,
    Bruiser: OFFICIAL_BRUISER_COMMON_TIERS,
    'Bruiser (B. Dmg)': OFFICIAL_BRUISER_B_DMG_HELMET_TIERS,
    Future: OFFICIAL_FUTURE_COMMON_TIERS,
  },
  Armor: {
    'Top Speed': OFFICIAL_CUSTOM_PLACEHOLDER,
    Speed: OFFICIAL_CUSTOM_PLACEHOLDER,
    DPS: OFFICIAL_DPS_ARMOR_TIERS,
    'DPS (No CC%)': OFFICIAL_DPS_ARMOR_TIERS,
    'Res Tank': OFFICIAL_RES_TANK_HELMET_ARMOR_TIERS,
    'Pure Tank': OFFICIAL_PURE_TANK_HELMET_ARMOR_TIERS,
    'EFF. Tank': OFFICIAL_EFF_TANK_HELMET_ARMOR_TIERS,
    'Atk + ER': OFFICIAL_ATK_ER_EFF_COMMON_TIERS,
    'Atk + EFF': OFFICIAL_ATK_ER_EFF_COMMON_TIERS,
    'EFF + ER': OFFICIAL_EFF_ER_COMMON_TIERS,
    'Bruiser(Hp/Def)': OFFICIAL_BRUISER_HP_DEF_COMMON_TIERS,
    Bruiser: OFFICIAL_BRUISER_COMMON_TIERS,
    'Bruiser (B. Dmg)': OFFICIAL_BRUISER_B_DMG_WEAPON_ARMOR_TIERS,
    Future: OFFICIAL_FUTURE_COMMON_TIERS,
  },
  Necklace: {
    'Top Speed': OFFICIAL_CUSTOM_PLACEHOLDER,
    Speed: OFFICIAL_CUSTOM_PLACEHOLDER,
    DPS: OFFICIAL_DPS_NECKLACE_RING_TIERS,
    'DPS (No CC%)': OFFICIAL_DPS_NO_CC_NECKLACE_RING_BOOTS_TIERS,
    'Res Tank': OFFICIAL_RES_TANK_NECKLACE_RING_TIERS,
    'Pure Tank': OFFICIAL_PURE_TANK_NECKLACE_TIERS,
    'EFF. Tank': OFFICIAL_EFF_TANK_NECKLACE_RING_TIERS,
    'Atk + ER': OFFICIAL_ATK_ER_EFF_COMMON_TIERS,
    'Atk + EFF': OFFICIAL_ATK_ER_EFF_COMMON_TIERS,
    'EFF + ER': OFFICIAL_EFF_ER_COMMON_TIERS,
    'Bruiser(Hp/Def)': OFFICIAL_BRUISER_HP_DEF_NECKLACE_RING_BOOTS_TIERS,
    Bruiser: OFFICIAL_BRUISER_COMMON_TIERS,
    'Bruiser (B. Dmg)': OFFICIAL_BRUISER_B_DMG_NECKLACE_RING_BOOTS_TIERS,
    Future: OFFICIAL_FUTURE_COMMON_TIERS,
  },
  Ring: {
    'Top Speed': OFFICIAL_CUSTOM_PLACEHOLDER,
    Speed: OFFICIAL_CUSTOM_PLACEHOLDER,
    DPS: OFFICIAL_DPS_NECKLACE_RING_TIERS,
    'DPS (No CC%)': OFFICIAL_DPS_NO_CC_NECKLACE_RING_BOOTS_TIERS,
    'Res Tank': OFFICIAL_RES_TANK_NECKLACE_RING_TIERS,
    'Pure Tank': OFFICIAL_PURE_TANK_RING_BOOTS_TIERS,
    'EFF. Tank': OFFICIAL_EFF_TANK_NECKLACE_RING_TIERS,
    'Atk + ER': OFFICIAL_ATK_ER_EFF_COMMON_TIERS,
    'Atk + EFF': OFFICIAL_ATK_ER_EFF_COMMON_TIERS,
    'EFF + ER': OFFICIAL_EFF_ER_COMMON_TIERS,
    'Bruiser(Hp/Def)': OFFICIAL_BRUISER_HP_DEF_NECKLACE_RING_BOOTS_TIERS,
    Bruiser: OFFICIAL_BRUISER_COMMON_TIERS,
    'Bruiser (B. Dmg)': OFFICIAL_BRUISER_B_DMG_NECKLACE_RING_BOOTS_TIERS,
    Future: OFFICIAL_FUTURE_COMMON_TIERS,
  },
  Boots: {
    DPS: OFFICIAL_DPS_BOOTS_TIERS,
    'DPS (No CC%)': OFFICIAL_DPS_NO_CC_NECKLACE_RING_BOOTS_TIERS,
    'Res Tank': OFFICIAL_RES_TANK_NECKLACE_RING_TIERS,
    'Pure Tank': OFFICIAL_PURE_TANK_RING_BOOTS_TIERS,
    'EFF. Tank': OFFICIAL_EFF_TANK_BOOTS_TIERS,
    'Atk + ER': OFFICIAL_ATK_ER_EFF_COMMON_TIERS,
    'Atk + EFF': OFFICIAL_ATK_ER_EFF_COMMON_TIERS,
    'EFF + ER': OFFICIAL_EFF_ER_COMMON_TIERS,
    'Bruiser(Hp/Def)': OFFICIAL_BRUISER_HP_DEF_NECKLACE_RING_BOOTS_TIERS,
    Bruiser: OFFICIAL_BRUISER_COMMON_TIERS,
    'Bruiser (B. Dmg)': OFFICIAL_BRUISER_B_DMG_NECKLACE_RING_BOOTS_TIERS,
    Future: OFFICIAL_FUTURE_COMMON_TIERS,
  },
};

// ============================================================================
// PERSONAL/CUSTOMIZABLE SCORING CONFIGS
// SCORING_CONFIGS uses tier data above for custom archetype scoring
// ============================================================================
var SCORING_CONFIGS = {
  Weapon: {
    'Top Speed': CUSTOM_PLACEHOLDER,
    Speed: CUSTOM_PLACEHOLDER,
    DPS: DPS_WEAPON_HELMET_TIERS,
    'DPS (No CC%)': DPS_NO_CC_WEAPON_TIERS,
    'Res Tank': RES_TANK_WEAPON_TIERS,
    'Pure Tank': PURE_TANK_WEAPON_TIERS,
    'EFF. Tank': EFF_TANK_WEAPON_TIERS,
    'Atk + ER': ATK_ER_EFF_COMMON_TIERS,
    'Atk + EFF': ATK_ER_EFF_COMMON_TIERS,
    'EFF + ER': ATK_ER_EFF_COMMON_TIERS,
    'Bruiser(Hp/Def)': BRUISER_HP_DEF_COMMON_TIERS,
    Bruiser: BRUISER_COMMON_TIERS,
    'Bruiser (B. Dmg)': BRUISER_B_DMG_WEAPON_ARMOR_TIERS,
    Future: OFFICIAL_FUTURE_COMMON_TIERS,
    'HP Focus': CUSTOM_PLACEHOLDER,
    'Attack Focus': CUSTOM_PLACEHOLDER,
    'Effectiveness Focus': CUSTOM_PLACEHOLDER,
  },
  Helmet: {
    'Top Speed': CUSTOM_PLACEHOLDER,
    Speed: CUSTOM_PLACEHOLDER,
    DPS: DPS_WEAPON_HELMET_TIERS,
    'DPS (No CC%)': DPS_NO_CC_HELMET_TIERS,
    'Res Tank': RES_TANK_HELMET_ARMOR_TIERS,
    'Pure Tank': PURE_TANK_HELMET_ARMOR_TIERS,
    'EFF. Tank': EFF_TANK_HELMET_ARMOR_TIERS,
    'Atk + ER': ATK_ER_EFF_COMMON_TIERS,
    'Atk + EFF': ATK_ER_EFF_COMMON_TIERS,
    'EFF + ER': ATK_ER_EFF_COMMON_TIERS,
    'Bruiser(Hp/Def)': BRUISER_HP_DEF_COMMON_TIERS,
    Bruiser: BRUISER_COMMON_TIERS,
    'Bruiser (B. Dmg)': BRUISER_B_DMG_HELMET_TIERS,
    Future: OFFICIAL_FUTURE_COMMON_TIERS,
    'HP Focus': CUSTOM_PLACEHOLDER,
    'Attack Focus': CUSTOM_PLACEHOLDER,
    'Effectiveness Focus': CUSTOM_PLACEHOLDER,
  },
  Armor: {
    'Top Speed': CUSTOM_PLACEHOLDER,
    Speed: CUSTOM_PLACEHOLDER,
    DPS: DPS_ARMOR_TIERS,
    'DPS (No CC%)': DPS_ARMOR_TIERS,
    'Res Tank': RES_TANK_HELMET_ARMOR_TIERS,
    'Pure Tank': PURE_TANK_HELMET_ARMOR_TIERS,
    'EFF. Tank': EFF_TANK_HELMET_ARMOR_TIERS,
    'Atk + ER': ATK_ER_EFF_COMMON_TIERS,
    'Atk + EFF': ATK_ER_EFF_COMMON_TIERS,
    'EFF + ER': ATK_ER_EFF_COMMON_TIERS,
    'Bruiser(Hp/Def)': BRUISER_HP_DEF_COMMON_TIERS,
    Bruiser: BRUISER_COMMON_TIERS,
    'Bruiser (B. Dmg)': BRUISER_B_DMG_WEAPON_ARMOR_TIERS,
    Future: OFFICIAL_FUTURE_COMMON_TIERS,
    'Effect Resist Focus': CUSTOM_PLACEHOLDER,
    'Effectiveness Focus': CUSTOM_PLACEHOLDER,
    'HP Focus': CUSTOM_PLACEHOLDER,
  },
  Necklace: {
    'Top Speed': CUSTOM_PLACEHOLDER,
    Speed: CUSTOM_PLACEHOLDER,
    DPS: DPS_NECKLACE_RING_TIERS,
    'DPS (No CC%)': DPS_NO_CC_NECKLACE_RING_BOOTS_TIERS,
    'Res Tank': RES_TANK_NECKLACE_RING_TIERS,
    'Pure Tank': PURE_TANK_NECKLACE_TIERS,
    'EFF. Tank': EFF_TANK_NECKLACE_RING_TIERS,
    'Atk + ER': ATK_ER_EFF_COMMON_TIERS,
    'Atk + EFF': ATK_ER_EFF_COMMON_TIERS,
    'EFF + ER': ATK_ER_EFF_COMMON_TIERS,
    'Bruiser(Hp/Def)': BRUISER_HP_DEF_NECKLACE_RING_BOOTS_TIERS,
    Bruiser: BRUISER_COMMON_TIERS,
    'Bruiser (B. Dmg)': BRUISER_B_DMG_NECKLACE_RING_BOOTS_TIERS,
    Future: OFFICIAL_FUTURE_COMMON_TIERS,
    'Effectiveness Focus': CUSTOM_PLACEHOLDER,
    'Effect Resist Focus': CUSTOM_PLACEHOLDER,
    'HP Focus': CUSTOM_PLACEHOLDER,
    'Attack Focus': CUSTOM_PLACEHOLDER,
  },
  Ring: {
    'Top Speed': CUSTOM_PLACEHOLDER,
    Speed: CUSTOM_PLACEHOLDER,
    DPS: DPS_NECKLACE_RING_TIERS,
    'DPS (No CC%)': DPS_NO_CC_NECKLACE_RING_BOOTS_TIERS,
    'Res Tank': RES_TANK_NECKLACE_RING_TIERS,
    'Pure Tank': PURE_TANK_RING_BOOTS_TIERS,
    'EFF. Tank': EFF_TANK_NECKLACE_RING_TIERS,
    'Atk + ER': ATK_ER_EFF_COMMON_TIERS,
    'Atk + EFF': ATK_ER_EFF_COMMON_TIERS,
    'EFF + ER': ATK_ER_EFF_COMMON_TIERS,
    'Bruiser(Hp/Def)': BRUISER_HP_DEF_NECKLACE_RING_BOOTS_TIERS,
    Bruiser: BRUISER_COMMON_TIERS,
    'Bruiser (B. Dmg)': BRUISER_B_DMG_NECKLACE_RING_BOOTS_TIERS,
    Future: OFFICIAL_FUTURE_COMMON_TIERS,
    'Effectiveness Focus': CUSTOM_PLACEHOLDER,
    'Effect Resist Focus': CUSTOM_PLACEHOLDER,
    'HP Focus': CUSTOM_PLACEHOLDER,
    'Attack Focus': CUSTOM_PLACEHOLDER,
  },
  Boots: {
    DPS: DPS_BOOTS_TIERS,
    'DPS (No CC%)': DPS_NO_CC_NECKLACE_RING_BOOTS_TIERS,
    'Res Tank': RES_TANK_NECKLACE_RING_TIERS,
    'Pure Tank': PURE_TANK_RING_BOOTS_TIERS,
    'EFF. Tank': EFF_TANK_BOOTS_TIERS,
    'Atk + ER': ATK_ER_EFF_COMMON_TIERS,
    'Atk + EFF': ATK_ER_EFF_COMMON_TIERS,
    'EFF + ER': ATK_ER_EFF_COMMON_TIERS,
    'Bruiser(Hp/Def)': BRUISER_HP_DEF_NECKLACE_RING_BOOTS_TIERS,
    Bruiser: BRUISER_COMMON_TIERS,
    'Bruiser (B. Dmg)': BRUISER_B_DMG_NECKLACE_RING_BOOTS_TIERS,
    Future: OFFICIAL_FUTURE_COMMON_TIERS,
    'Effectiveness Focus': CUSTOM_PLACEHOLDER,
    'Effect Resist Focus': CUSTOM_PLACEHOLDER,
    'Crit Chance Focus': CUSTOM_PLACEHOLDER,
    'Attack Focus': CUSTOM_PLACEHOLDER,
    'Boot HP Focus': CUSTOM_PLACEHOLDER,
    'HP Focus': CUSTOM_PLACEHOLDER,
  },
};

// ============================================================================
// PERSONAL/CUSTOMIZABLE EXPORTS (for Code.js access)
// ============================================================================
globalThis.ARCHETYPE_RULES = ARCHETYPE_RULES;
globalThis.SCORING_CONFIGS = SCORING_CONFIGS;

// Personal set arrays
globalThis.ALL_SETS = ALL_SETS;
globalThis.SPEED_SETS = SPEED_SETS;
globalThis.DPS_SETS = DPS_SETS;
globalThis.DPS_NO_CC_SETS = DPS_NO_CC_SETS;
globalThis.RES_TANK_SETS = RES_TANK_SETS;
globalThis.PURE_TANK_SETS = PURE_TANK_SETS;
globalThis.EFF_TANK_SETS = EFF_TANK_SETS;
globalThis.ATK_ER_SETS = ATK_ER_SETS;
globalThis.ATK_EFF_SETS = ATK_EFF_SETS;
globalThis.EFF_ER_SETS = EFF_ER_SETS;
globalThis.BRUISER_HP_DEF_SETS = BRUISER_HP_DEF_SETS;
globalThis.BRUISER_SETS = BRUISER_SETS;
globalThis.BRUISER_B_DMG_SETS = BRUISER_B_DMG_SETS;

// Personal tier configurations
globalThis.TopSpeedTiers = TopSpeedTiers;
globalThis.SpeedTiers = SpeedTiers;
globalThis.SpeedSets = SpeedSets;
globalThis.CUSTOM_PLACEHOLDER = CUSTOM_PLACEHOLDER;

// Personal tier arrays
globalThis.DPS_WEAPON_HELMET_TIERS = DPS_WEAPON_HELMET_TIERS;
globalThis.DPS_ARMOR_TIERS = DPS_ARMOR_TIERS;
globalThis.DPS_NECKLACE_RING_TIERS = DPS_NECKLACE_RING_TIERS;
globalThis.DPS_BOOTS_TIERS = DPS_BOOTS_TIERS;
globalThis.RES_TANK_WEAPON_TIERS = RES_TANK_WEAPON_TIERS;
globalThis.RES_TANK_HELMET_ARMOR_TIERS = RES_TANK_HELMET_ARMOR_TIERS;
globalThis.RES_TANK_NECKLACE_RING_TIERS = RES_TANK_NECKLACE_RING_TIERS;
globalThis.PURE_TANK_WEAPON_TIERS = PURE_TANK_WEAPON_TIERS;
globalThis.PURE_TANK_HELMET_ARMOR_TIERS = PURE_TANK_HELMET_ARMOR_TIERS;
globalThis.PURE_TANK_NECKLACE_TIERS = PURE_TANK_NECKLACE_TIERS;
globalThis.PURE_TANK_RING_BOOTS_TIERS = PURE_TANK_RING_BOOTS_TIERS;
globalThis.EFF_TANK_WEAPON_TIERS = EFF_TANK_WEAPON_TIERS;
globalThis.EFF_TANK_HELMET_ARMOR_TIERS = EFF_TANK_HELMET_ARMOR_TIERS;
globalThis.EFF_TANK_NECKLACE_RING_TIERS = EFF_TANK_NECKLACE_RING_TIERS;
globalThis.EFF_TANK_BOOTS_TIERS = EFF_TANK_BOOTS_TIERS;
globalThis.BRUISER_HP_DEF_COMMON_TIERS = BRUISER_HP_DEF_COMMON_TIERS;
globalThis.BRUISER_HP_DEF_NECKLACE_RING_BOOTS_TIERS =
  BRUISER_HP_DEF_NECKLACE_RING_BOOTS_TIERS;
globalThis.BRUISER_COMMON_TIERS = BRUISER_COMMON_TIERS;
globalThis.DPS_NO_CC_WEAPON_TIERS = DPS_NO_CC_WEAPON_TIERS;
globalThis.DPS_NO_CC_HELMET_TIERS = DPS_NO_CC_HELMET_TIERS;
globalThis.DPS_NO_CC_NECKLACE_RING_BOOTS_TIERS =
  DPS_NO_CC_NECKLACE_RING_BOOTS_TIERS;
globalThis.BRUISER_B_DMG_WEAPON_ARMOR_TIERS = BRUISER_B_DMG_WEAPON_ARMOR_TIERS;
globalThis.BRUISER_B_DMG_HELMET_TIERS = BRUISER_B_DMG_HELMET_TIERS;
globalThis.BRUISER_B_DMG_NECKLACE_RING_BOOTS_TIERS =
  BRUISER_B_DMG_NECKLACE_RING_BOOTS_TIERS;
globalThis.ATK_ER_EFF_COMMON_TIERS = ATK_ER_EFF_COMMON_TIERS;

// Boot-specific personal sets and tiers
globalThis.BOOT_EFF_FOCUS_TIERS = BOOT_EFF_FOCUS_TIERS;
globalThis.BOOT_ER_FOCUS_TIERS = BOOT_ER_FOCUS_TIERS;
globalThis.BOOT_CC_FOCUS_TIERS = BOOT_CC_FOCUS_TIERS;
globalThis.BOOT_ATK_FOCUS_TIERS = BOOT_ATK_FOCUS_TIERS;
globalThis.BOOT_EFF_SETS = BOOT_EFF_SETS;
globalThis.BOOT_ER_SETS = BOOT_ER_SETS;
globalThis.BOOT_CC_SETS = BOOT_CC_SETS;
globalThis.BOOT_ATK_SETS = BOOT_ATK_SETS;
globalThis.BOOT_HP_FOCUS_SETS = BOOT_HP_FOCUS_SETS;
globalThis.BOOT_EFF_FOCUS_ALL_SETS = BOOT_EFF_FOCUS_ALL_SETS;
globalThis.BOOT_ER_FOCUS_ALL_SETS = BOOT_ER_FOCUS_ALL_SETS;
globalThis.BOOT_ATK_FOCUS_ALL_SETS = BOOT_ATK_FOCUS_ALL_SETS;
globalThis.BOOT_HP_FOCUS_ALL_SETS = BOOT_HP_FOCUS_ALL_SETS;

// Other personal sets and tiers
globalThis.HP_FOCUS_TIERS = HP_FOCUS_TIERS;
globalThis.FLAT_HP_FOCUS_TIERS = FLAT_HP_FOCUS_TIERS;
globalThis.ARMOR_ER_SETS = ARMOR_ER_SETS;
globalThis.EFF_FOCUS_WEAPON_HELM_ARMOR_SETS = EFF_FOCUS_WEAPON_HELM_ARMOR_SETS;
globalThis.ATK_FOCUS_HELM_WEAPON_SETS = ATK_FOCUS_HELM_WEAPON_SETS;
globalThis.ATK_FOCUS_NECK_RING_SETS = ATK_FOCUS_NECK_RING_SETS;
globalThis.EFF_FOCUS_ATTACK_SETS = EFF_FOCUS_ATTACK_SETS;
globalThis.ER_FOCUS_ATTACK_SETS = ER_FOCUS_ATTACK_SETS;
globalThis.FLAT_ATK_FOCUS_TIERS = FLAT_ATK_FOCUS_TIERS;
globalThis.HP_FOCUS_SETS = HP_FOCUS_SETS;

// ============================================================================
// OFFICIAL EXPORTS (E7Bot Reference - for Code.js access)
// ============================================================================
globalThis.OFFICIAL_SCORING_CONFIGS = OFFICIAL_SCORING_CONFIGS;

// Official set arrays
globalThis.OFFICIAL_ALL_SETS = OFFICIAL_ALL_SETS;
globalThis.OFFICIAL_SPEED_SETS = OFFICIAL_SPEED_SETS;
globalThis.OFFICIAL_DPS_SETS = OFFICIAL_DPS_SETS;
globalThis.OFFICIAL_DPS_NO_CC_SETS = OFFICIAL_DPS_NO_CC_SETS;
globalThis.OFFICIAL_RES_TANK_SETS = OFFICIAL_RES_TANK_SETS;
globalThis.OFFICIAL_PURE_TANK_SETS = OFFICIAL_PURE_TANK_SETS;
globalThis.OFFICIAL_EFF_TANK_SETS = OFFICIAL_EFF_TANK_SETS;
globalThis.OFFICIAL_ATK_ER_SETS = OFFICIAL_ATK_ER_SETS;
globalThis.OFFICIAL_ATK_EFF_SETS = OFFICIAL_ATK_EFF_SETS;
globalThis.OFFICIAL_EFF_ER_SETS = OFFICIAL_EFF_ER_SETS;
globalThis.OFFICIAL_BRUISER_HP_DEF_SETS = OFFICIAL_BRUISER_HP_DEF_SETS;
globalThis.OFFICIAL_BRUISER_SETS = OFFICIAL_BRUISER_SETS;
globalThis.OFFICIAL_BRUISER_B_DMG_SETS = OFFICIAL_BRUISER_B_DMG_SETS;

// Official archetype rules
globalThis.OFFICIAL_ARCHETYPE_RULES = OFFICIAL_ARCHETYPE_RULES;

// Official tier configurations (Top Speed and Speed)
globalThis.OFFICIAL_TopSpeedTiers = OFFICIAL_TopSpeedTiers;
globalThis.OFFICIAL_SpeedTiers = OFFICIAL_SpeedTiers;
globalThis.OFFICIAL_SpeedSets = OFFICIAL_SpeedSets;
globalThis.OFFICIAL_CUSTOM_PLACEHOLDER = OFFICIAL_CUSTOM_PLACEHOLDER;

// Official tier arrays
globalThis.OFFICIAL_DPS_WEAPON_HELMET_TIERS = OFFICIAL_DPS_WEAPON_HELMET_TIERS;
globalThis.OFFICIAL_DPS_ARMOR_TIERS = OFFICIAL_DPS_ARMOR_TIERS;
globalThis.OFFICIAL_DPS_NECKLACE_RING_TIERS = OFFICIAL_DPS_NECKLACE_RING_TIERS;
globalThis.OFFICIAL_DPS_BOOTS_TIERS = OFFICIAL_DPS_BOOTS_TIERS;
globalThis.OFFICIAL_RES_TANK_WEAPON_TIERS = OFFICIAL_RES_TANK_WEAPON_TIERS;
globalThis.OFFICIAL_RES_TANK_HELMET_ARMOR_TIERS =
  OFFICIAL_RES_TANK_HELMET_ARMOR_TIERS;
globalThis.OFFICIAL_RES_TANK_NECKLACE_RING_TIERS =
  OFFICIAL_RES_TANK_NECKLACE_RING_TIERS;
globalThis.OFFICIAL_PURE_TANK_WEAPON_TIERS = OFFICIAL_PURE_TANK_WEAPON_TIERS;
globalThis.OFFICIAL_PURE_TANK_HELMET_ARMOR_TIERS =
  OFFICIAL_PURE_TANK_HELMET_ARMOR_TIERS;
globalThis.OFFICIAL_PURE_TANK_NECKLACE_TIERS =
  OFFICIAL_PURE_TANK_NECKLACE_TIERS;
globalThis.OFFICIAL_PURE_TANK_RING_BOOTS_TIERS =
  OFFICIAL_PURE_TANK_RING_BOOTS_TIERS;
globalThis.OFFICIAL_EFF_TANK_WEAPON_TIERS = OFFICIAL_EFF_TANK_WEAPON_TIERS;
globalThis.OFFICIAL_EFF_TANK_HELMET_ARMOR_TIERS =
  OFFICIAL_EFF_TANK_HELMET_ARMOR_TIERS;
globalThis.OFFICIAL_EFF_TANK_NECKLACE_RING_TIERS =
  OFFICIAL_EFF_TANK_NECKLACE_RING_TIERS;
globalThis.OFFICIAL_EFF_TANK_BOOTS_TIERS = OFFICIAL_EFF_TANK_BOOTS_TIERS;
globalThis.OFFICIAL_BRUISER_HP_DEF_COMMON_TIERS =
  OFFICIAL_BRUISER_HP_DEF_COMMON_TIERS;
globalThis.OFFICIAL_BRUISER_HP_DEF_NECKLACE_RING_BOOTS_TIERS =
  OFFICIAL_BRUISER_HP_DEF_NECKLACE_RING_BOOTS_TIERS;
globalThis.OFFICIAL_BRUISER_COMMON_TIERS = OFFICIAL_BRUISER_COMMON_TIERS;
globalThis.OFFICIAL_DPS_NO_CC_WEAPON_TIERS = OFFICIAL_DPS_NO_CC_WEAPON_TIERS;
globalThis.OFFICIAL_DPS_NO_CC_HELMET_TIERS = OFFICIAL_DPS_NO_CC_HELMET_TIERS;
globalThis.OFFICIAL_DPS_NO_CC_NECKLACE_RING_BOOTS_TIERS =
  OFFICIAL_DPS_NO_CC_NECKLACE_RING_BOOTS_TIERS;
globalThis.OFFICIAL_BRUISER_B_DMG_WEAPON_ARMOR_TIERS =
  OFFICIAL_BRUISER_B_DMG_WEAPON_ARMOR_TIERS;
globalThis.OFFICIAL_BRUISER_B_DMG_HELMET_TIERS =
  OFFICIAL_BRUISER_B_DMG_HELMET_TIERS;
globalThis.OFFICIAL_BRUISER_B_DMG_NECKLACE_RING_BOOTS_TIERS =
  OFFICIAL_BRUISER_B_DMG_NECKLACE_RING_BOOTS_TIERS;
globalThis.OFFICIAL_ATK_ER_EFF_COMMON_TIERS = OFFICIAL_ATK_ER_EFF_COMMON_TIERS;
globalThis.OFFICIAL_FUTURE_COMMON_TIERS = OFFICIAL_FUTURE_COMMON_TIERS;

// ---------------------------------------------------------------------------
// Shared E7 gear-set tables — single source of truth for the epic7rtastats
// `set_xxx` codes, so the per-hero meta services (rtaStats.js, communityBuilds.js)
// can't drift out of sync.  This duplication is exactly what caused the Fervor /
// Weakening (`set_might` / `set_weak`) bug, where one file knew a set the others
// didn't.  Add a new game set in ONE place here.
//
// Scope note: this covers the epic7rtastats `set_xxx` code space only.  stoveRta.js
// uses Stove's own equip-set identifiers (a different code system), and the scoring
// set-bonus percentages in priorityFilter.js / rollDivisors.js mirror the Java
// backend — both are deliberately left separate.
// ---------------------------------------------------------------------------

// set_code → Fribbels display name (NO "Set" suffix).
export const SET_CODE_TO_DISPLAY = {
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

// set_code → Fribbels set KEY (display + "Set"), matching the Target Sets values.
export const SET_CODE_TO_GAME = Object.fromEntries(
  Object.entries(SET_CODE_TO_DISPLAY).map(([code, name]) => [
    code,
    `${name}Set`,
  ]),
);

// 4-piece sets (need 4 pieces to complete); every other set needs 2.  set_weak
// (Weakening) IS a 4-piece set — it's also treated as 4-piece in heroesGrid.js.
export const FOUR_PIECE_CODES = new Set([
  'set_att',
  'set_counter',
  'set_cri_dmg',
  'set_rage',
  'set_revenge',
  'set_scar',
  'set_speed',
  'set_vampire',
  'set_shield',
  'set_revenant',
  'set_riposte',
  'set_opener',
  'set_weak',
]);

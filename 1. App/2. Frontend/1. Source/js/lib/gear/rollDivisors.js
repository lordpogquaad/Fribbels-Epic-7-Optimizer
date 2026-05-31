/**
 * Shared roll-normalization divisors used across priorityFilter.js,
 * heroGearMatcher.js, and archetypeScorer.js.
 *
 * Each value represents the "worth" of one roll for that stat type — e.g.
 * one ATK% roll ≈ 9 percentage points at max roll (tier-88 Epic).
 * Dividing a substat's raw value by its divisor converts it to a
 * dimensionless "roll-count" that can be weighted against other stats.
 *
 * Update these when new gear tiers change substat roll ranges.
 */
const ROLL_DIVISORS = {
    pct: 9.333, // ATK%, HP%, DEF%, EFF%, RES%  (56 / 6  — one full roll ≈ 9.333%)
    spd: 5.667, // Speed                         (34 / 6  — one full roll ≈ 5.667 spd)
    cr:  6.000, // Crit Chance%                  (36 / 6  — one full roll ≈ 6.000%)
    cd:  8.167, // Crit Damage%                  (49 / 6  — one full roll ≈ 8.167%)
    // Flat stat max single-roll values (tier-88 Epic) — same normalisation as pct above.
    atk:  57,   // Flat Attack  (max one-roll value)
    hp:  314,   // Flat Health  (max one-roll value)
    def:  44,   // Flat Defense (max one-roll value)
};

export default ROLL_DIVISORS;

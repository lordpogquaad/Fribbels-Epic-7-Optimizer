package com.fribbels.core;

import com.fribbels.model.DamageMultipliers;
import com.fribbels.model.Hero;
import com.fribbels.model.HeroStats;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class StatCalculatorTest {

    @Test
    public void pveCritDamageCapAffectsDamageButNotCp() {
        final HeroStats standardResult = calculateStats(400, false, 0);
        final HeroStats pveResult = calculateStats(400, true, 0);

        assertEquals(3500, standardResult.getMcdmg());
        assertEquals(4000, pveResult.getMcdmg());
        assertEquals(standardResult.getCp(), pveResult.getCp());
    }

    @Test
    public void pveCritDamageCapStopsAtFourHundredPercent() {
        final HeroStats pveResult = calculateStats(450, true, 0);

        assertEquals(4000, pveResult.getMcdmg());
    }

    @Test
    public void pveCritDamageCapDoesNotChangeValuesBelowStandardCap() {
        final HeroStats standardResult = calculateStats(300, false, 0);
        final HeroStats pveResult = calculateStats(300, true, 0);

        assertEquals(standardResult.getDmg(), pveResult.getDmg());
        assertEquals(standardResult.getMcdmg(), pveResult.getMcdmg());
        assertEquals(standardResult.getCp(), pveResult.getCp());
    }

    // ── Fervor set (2pc, sets[22]) — +20% damage, no effect on CP ────────────────
    @Test
    public void fervorSetAddsTwentyPercentDamageButNotCp() {
        final HeroStats withFervor = calculateStatsWithFervor(true, 2);
        final HeroStats withoutFervor = calculateStatsWithFervor(false, 2);

        assertEquals(Math.round(withoutFervor.getMcdmg() * 1.2f), withFervor.getMcdmg());
        assertEquals(withoutFervor.getCp(), withFervor.getCp());
    }

    // ── Skill damage under Rage (4pc: +30%) and Fervor (2pc: +20%) ──────────────────────────
    //
    // Fixture: ATK 1000, CD 300 (x3.0), CR 100, and a skill table that reduces S1 to
    //   (ATK * rate 1) * 1.871 * pow 1 * (crit 1 * 3.0) * pctDmgMultiplier * defense factor
    // with every other scaling, hit and penetration term 0. The defense factor is
    // 1 / (1500 * (1 - 0) / 300 + 1) = 1/6 at the default target defense of 1500, so
    // S1 = (int) (1000 * 1.871 * 3.0 * pct / 6) = (int) (935.5 * pct). The two set bonuses add
    // to the multiplier (1 + 0.3 + 0.2 = 1.5); they do not multiply (1.3 * 1.2 = 1.56).

    private static final int S1_NO_BONUS = 935; // 935.5
    private static final int S1_RAGE = 1216; // 935.5 * 1.3 = 1216.15
    private static final int S1_FERVOR = 1122; // 935.5 * 1.2 = 1122.6
    private static final int S1_RAGE_AND_FERVOR = 1403; // 935.5 * 1.5 = 1403.25

    @Test
    public void rageAndFervorAddTheirBonusesBeforeScalingTheSkill() {
        final HeroStats build = calculateSkillBuild(4, 2, true, true);

        assertEquals(S1_RAGE_AND_FERVOR, build.getS1());
        assertEquals(S1_RAGE_AND_FERVOR, build.getS2());
        assertEquals(S1_RAGE_AND_FERVOR, build.getS3());
        // The same multiplier feeds the max-crit-damage column: 1000 * 3.0 * 1.5.
        assertEquals(4500, build.getMcdmg());
    }

    @Test
    public void rageAloneAndFervorAloneEachScaleTheSkillByTheirOwnBonus() {
        assertEquals(S1_NO_BONUS, calculateSkillBuild(0, 0, true, true).getS1());
        assertEquals(S1_RAGE, calculateSkillBuild(4, 0, true, true).getS1());
        assertEquals(S1_FERVOR, calculateSkillBuild(0, 2, true, true).getS1());
    }

    @Test
    public void rageNeedsFourPiecesAndFervorNeedsTwoAndDoesNotStack() {
        assertEquals(S1_FERVOR, calculateSkillBuild(3, 2, true, true).getS1()); // 3 Rage pieces: no bonus
        assertEquals(S1_NO_BONUS, calculateSkillBuild(0, 1, true, true).getS1()); // 1 Fervor piece: no bonus
        assertEquals(S1_FERVOR, calculateSkillBuild(0, 4, true, true).getS1()); // 4 pieces: still one +20%
        assertEquals(S1_RAGE_AND_FERVOR, calculateSkillBuild(6, 2, true, true).getS1());
    }

    @Test
    public void theRageAndFervorSettingsTurnTheirBonusOff() {
        assertEquals(S1_FERVOR, calculateSkillBuild(4, 2, false, true).getS1());
        assertEquals(S1_RAGE, calculateSkillBuild(4, 2, true, false).getS1());
        assertEquals(S1_NO_BONUS, calculateSkillBuild(4, 2, false, false).getS1());
    }

    private HeroStats calculateSkillBuild(final int ragePieces, final int fervorPieces,
            final boolean rageSetting, final boolean fervorSetting) {
        final boolean previousRage = StatCalculator.SETTING_RAGE_SET;
        final boolean previousFervor = StatCalculator.SETTING_FERVOR_SET;
        StatCalculator.SETTING_RAGE_SET = rageSetting;
        StatCalculator.SETTING_FERVOR_SET = fervorSetting;
        try {
            final HeroStats base = HeroStats.builder().atk(1000).hp(1000).def(100).spd(100).cr(100).cd(300).build();
            final Float[] zero = { 0f, 0f, 0f };
            final Float[] one = { 1f, 1f, 1f };
            final DamageMultipliers skills = DamageMultipliers.builder()
                    .rate(one).pow(one).crit(one)
                    .targets(new Integer[] { 0, 0, 0 })
                    .selfHpScaling(zero).selfAtkScaling(zero).selfDefScaling(zero).selfSpdScaling(zero)
                    .increasedValue(zero).cdmgIncrease(zero).hitMulti(zero).support(zero).penetration(zero)
                    .extraSelfHpScaling(zero).extraSelfAtkScaling(zero).extraSelfDefScaling(zero)
                    .build();
            final Hero hero = Hero.builder().damageMultipliers(skills).build();
            final StatCalculator calculator = new StatCalculator();
            calculator.setBaseValues(base, hero);

            final int[] sets = new int[24];
            sets[11] = ragePieces;
            sets[22] = fervorPieces;
            return calculator.addAccumulatorArrsToHero(base,
                    new float[][] { new float[15], new float[15], new float[15],
                            new float[15], new float[15], new float[15] },
                    sets, hero, 0, 0, 0, 0, 0);
        } finally {
            StatCalculator.SETTING_RAGE_SET = previousRage;
            StatCalculator.SETTING_FERVOR_SET = previousFervor;
        }
    }

    private HeroStats calculateStats(final int critDamage, final boolean usePvECritDamageCap,
            final int fervorCount) {
        final HeroStats base = HeroStats.builder()
                .atk(1000)
                .hp(1000)
                .def(100)
                .spd(100)
                .cr(100)
                .cd(critDamage)
                .build();
        final Hero hero = Hero.builder().build();
        final StatCalculator calculator = new StatCalculator();
        calculator.setUsePvECritDamageCap(usePvECritDamageCap);
        calculator.setBaseValues(base, hero);

        final int[] sets = new int[24];
        sets[22] = fervorCount;

        return calculator.addAccumulatorArrsToHero(
                base,
                new float[][] {
                        new float[15], new float[15], new float[15],
                        new float[15], new float[15], new float[15]
                },
                sets,
                hero,
                0,
                0,
                0,
                0,
                0);
    }

    private HeroStats calculateStatsWithFervor(final boolean settingFervorSet, final int fervorCount) {
        final boolean previousSetting = StatCalculator.SETTING_FERVOR_SET;
        StatCalculator.SETTING_FERVOR_SET = settingFervorSet;
        try {
            return calculateStats(300, false, fervorCount);
        } finally {
            StatCalculator.SETTING_FERVOR_SET = previousSetting;
        }
    }
}

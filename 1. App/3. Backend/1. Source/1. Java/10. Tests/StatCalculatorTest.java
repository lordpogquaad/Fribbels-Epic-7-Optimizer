package com.fribbels.core;

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

package com.fribbels.core;

import com.fribbels.db.BaseStatsDb;
import com.fribbels.model.BaseStats;
import com.fribbels.model.BonusStats;
import com.fribbels.model.HeroStats;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

/**
 * Pins {@link SpecialStats#setScBonusStats}: a hero's data-driven bonus stats replace its attack,
 * defense and health outright and add to crit rate, crit damage, speed, effectiveness and
 * resistance. The renderer reads the same fields the same way (`overrideAtk || atk`, base speed
 * plus `overrideAdditionalSpd`), and crit and resistance values are whole percents.
 */
public class SpecialStatsTest {

    private static HeroStats baseHero(final BonusStats bonus) {
        return HeroStats.builder()
                .atk(1000).hp(5000).def(600)
                .cr(15).cd(150).spd(100).eff(10).res(20).dac(7)
                .bonusStats(bonus)
                .build();
    }

    @Test
    public void attackDefenseAndHealthAreReplacedNotAdded() {
        final HeroStats hero = baseHero(BonusStats.builder().overrideAtk(1800).overrideDef(900).overrideHp(7000).build());

        SpecialStats.setScBonusStats(hero);

        assertEquals(1800, hero.getAtk());
        assertEquals(900, hero.getDef());
        assertEquals(7000, hero.getHp());
    }

    @Test
    public void critSpeedEffectivenessAndResistanceAreAddedToTheBase() {
        final HeroStats hero = baseHero(BonusStats.builder()
                .overrideAdditionalCr(10).overrideAdditionalCd(25).overrideAdditionalSpd(5)
                .overrideAdditionalEff(30).overrideAdditionalRes(40).build());

        SpecialStats.setScBonusStats(hero);

        assertEquals(25, hero.getCr());
        assertEquals(175, hero.getCd());
        assertEquals(105, hero.getSpd());
        assertEquals(40, hero.getEff());
        assertEquals(60, hero.getRes());
    }

    @Test
    public void aNegativeAdditionAppliesLikeAnyOther() {
        final HeroStats hero = baseHero(BonusStats.builder().overrideAdditionalSpd(-8).overrideAdditionalCr(-5).build());

        SpecialStats.setScBonusStats(hero);

        assertEquals(92, hero.getSpd());
        assertEquals(10, hero.getCr());
    }

    @Test
    public void zeroMeansNotSetSoAllZeroBonusesChangeNothing() {
        final HeroStats hero = baseHero(new BonusStats());

        SpecialStats.setScBonusStats(hero);

        assertEquals(1000, hero.getAtk());
        assertEquals(5000, hero.getHp());
        assertEquals(600, hero.getDef());
        assertEquals(15, hero.getCr());
        assertEquals(150, hero.getCd());
        assertEquals(100, hero.getSpd());
        assertEquals(10, hero.getEff());
        assertEquals(20, hero.getRes());
    }

    @Test
    public void aHeroWithoutBonusStatsComesBackUnchanged() {
        final HeroStats hero = baseHero(null);

        assertSame(hero, SpecialStats.setScBonusStats(hero));

        assertEquals(1000, hero.getAtk());
        assertEquals(100, hero.getSpd());
    }

    @Test
    public void statsTheBonusDoesNotNameAreLeftAlone() {
        final HeroStats hero = baseHero(BonusStats.builder().overrideAtk(1800).overrideAdditionalSpd(5).build());

        SpecialStats.setScBonusStats(hero);

        assertEquals(5000, hero.getHp());
        assertEquals(600, hero.getDef());
        assertEquals(15, hero.getCr());
        assertEquals(7, hero.getDac(), "dodge/attack chance has no bonus field");
    }

    @Test
    public void theBaseStatsLookupAppliesTheBonusToTheStarLevelRequested() {
        final BaseStatsDb db = new BaseStatsDb();
        final BonusStats bonus = BonusStats.builder().overrideAtk(2000).overrideAdditionalSpd(12).build();
        db.setBaseStatsByName(Map.of("Probe", BaseStats.builder()
                .lv50FiveStarFullyAwakened(baseHero(null))
                .lv60SixStarFullyAwakened(baseHero(bonus))
                .build()));

        final HeroStats six = db.getBaseStatsByName("Probe", 6);
        assertEquals(2000, six.getAtk());
        assertEquals(112, six.getSpd());

        final HeroStats five = db.getBaseStatsByName("Probe", 5);
        assertEquals(1000, five.getAtk());
        assertEquals(100, five.getSpd());
    }

    @Test
    public void theLookupDoesNotCompoundTheBonusOnTheStoredBaseStats() {
        final BaseStatsDb db = new BaseStatsDb();
        db.setBaseStatsByName(Map.of("Probe", BaseStats.builder()
                .lv60SixStarFullyAwakened(baseHero(BonusStats.builder().overrideAdditionalSpd(12).build()))
                .build()));

        assertEquals(112, db.getBaseStatsByName("Probe", 6).getSpd());
        assertEquals(112, db.getBaseStatsByName("Probe", 6).getSpd(), "a second lookup added the bonus again");
    }
}

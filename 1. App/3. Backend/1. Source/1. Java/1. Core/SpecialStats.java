package com.fribbels.core;

import com.fribbels.model.HeroStats;

public class SpecialStats {

    // Applies a hero's special/soulburn bonus stats from its data-driven bonusStats
    // override fields (set upstream from game data). Mutates and returns the hero.
    public static HeroStats setScBonusStats(final HeroStats hero) {
        if (hero.bonusStats != null) {
            if (hero.bonusStats.overrideAtk != 0) {
                hero.setAtk(hero.bonusStats.overrideAtk);
            }
            if (hero.bonusStats.overrideDef != 0) {
                hero.setDef(hero.bonusStats.overrideDef);
            }
            if (hero.bonusStats.overrideHp != 0) {
                hero.setHp(hero.bonusStats.overrideHp);
            }
            if (hero.bonusStats.overrideAdditionalCr != 0) {
                hero.setCr(hero.getCr() + hero.bonusStats.overrideAdditionalCr);
            }
            if (hero.bonusStats.overrideAdditionalCd != 0) {
                hero.setCd(hero.getCd() + hero.bonusStats.overrideAdditionalCd);
            }
            if (hero.bonusStats.overrideAdditionalSpd != 0) {
                hero.setSpd(hero.getSpd() + hero.bonusStats.overrideAdditionalSpd);
            }
            if (hero.bonusStats.overrideAdditionalEff != 0) {
                hero.setEff(hero.getEff() + hero.bonusStats.overrideAdditionalEff);
            }
            if (hero.bonusStats.overrideAdditionalRes != 0) {
                hero.setRes(hero.getRes() + hero.bonusStats.overrideAdditionalRes);
            }
        }

        return hero;
    }
}

package com.fribbels.core;

import com.fribbels.enums.OptimizationColumn;
import com.fribbels.enums.SortOrder;
import com.fribbels.model.HeroStats;

import java.util.Arrays;
import java.util.Comparator;

public class Sorter {

    public static void sortHeroes(final HeroStats[] data, final OptimizationColumn column, final SortOrder order) {
        sortHeroes(data, column, order, 0.5d);
    }

    public static void sortHeroes(final HeroStats[] data, final OptimizationColumn column, final SortOrder order,
            final double spdEffWeight) {
        if (order != SortOrder.ASC && order != SortOrder.DESC) {
            System.err.println("INVALID ORDER " + order);
            return;
        }
        final Comparator<HeroStats> comparator = comparatorFor(column, spdEffWeight);
        if (comparator == null) {
            System.err.println("INVALID COLUMN " + column);
            return;
        }
        Arrays.sort(data, order == SortOrder.DESC ? comparator.reversed() : comparator);
    }

    // Ascending comparator for a sort column; DESC reverses it. Null for an unknown
    // column.
    private static Comparator<HeroStats> comparatorFor(final OptimizationColumn column, final double spdEffWeight) {
        switch (column) {
            case ATK:
                return Comparator.comparingInt(HeroStats::getAtk);
            case HP:
                return Comparator.comparingInt(HeroStats::getHp);
            case DEF:
                return Comparator.comparingInt(HeroStats::getDef);
            case SPD:
                return Comparator.comparingInt(HeroStats::getSpd);
            case CR:
                return Comparator.comparingInt(HeroStats::getCr);
            case CD:
                return Comparator.comparingInt(HeroStats::getCd);
            case EFF:
                return Comparator.comparingInt(HeroStats::getEff);
            case RES:
                return Comparator.comparingInt(HeroStats::getRes);
            case DAC:
                return Comparator.comparingInt(HeroStats::getDac);
            case CP:
                return Comparator.comparingInt(HeroStats::getCp);
            case HPPS:
                return Comparator.comparingInt(HeroStats::getHpps);
            case EHP:
                return Comparator.comparingInt(HeroStats::getEhp);
            case EHPPS:
                return Comparator.comparingInt(HeroStats::getEhpps);
            case DMG:
                return Comparator.comparingInt(HeroStats::getDmg);
            case DMGPS:
                return Comparator.comparingInt(HeroStats::getDmgps);
            case MCDMG:
                return Comparator.comparingInt(HeroStats::getMcdmg);
            case MCDMGPS:
                return Comparator.comparingInt(HeroStats::getMcdmgps);
            case DMGH:
                return Comparator.comparingInt(HeroStats::getDmgh);
            case DMGD:
                return Comparator.comparingInt(HeroStats::getDmgd);
            case HMCDMGS:
                return Comparator.comparingInt(HeroStats::getHmcdmgs);
            case DMCDMGS:
                return Comparator.comparingInt(HeroStats::getDmcdmgs);
            case HDMG:
                return Comparator.comparingInt(HeroStats::getHdmg);
            case HDMGS:
                return Comparator.comparingInt(HeroStats::getHdmgs);
            case DDMG:
                return Comparator.comparingInt(HeroStats::getDdmg);
            case DDMGS:
                return Comparator.comparingInt(HeroStats::getDdmgs);
            case S1:
                return Comparator.comparingInt(HeroStats::getS1);
            case S2:
                return Comparator.comparingInt(HeroStats::getS2);
            case S3:
                return Comparator.comparingInt(HeroStats::getS3);
            case UPGRADES:
                return Comparator.comparingInt(HeroStats::getUpgrades);
            case SCORE:
                return Comparator.comparingInt(HeroStats::getScore);
            case BS:
                return Comparator.comparingInt(HeroStats::getBs);
            case PRIORITY:
                return Comparator.comparingInt(HeroStats::getPriority);
            case CONVERSIONS:
                return Comparator.comparingInt(HeroStats::getConversions);
            case EQ:
                return Comparator.comparingInt(HeroStats::getEq);
            case CUSTOMSCORE:
                return Comparator.comparingInt(HeroStats::getCustomScore);
            case BUILDSCORE:
                return Comparator.comparingInt(HeroStats::getBuildScore);
            case FINALSPEED:
                // Final Speed = spd / (1 - crp); monotonic in spd, so spd order suffices.
                return Comparator.comparingInt(HeroStats::getSpd);
            case SPDEFF:
                return Comparator.<HeroStats>comparingDouble(h -> h.getSpd() + h.getEff() * spdEffWeight);
            default:
                return null;
        }
    }
}

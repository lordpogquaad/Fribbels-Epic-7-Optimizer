package com.fribbels.db;

import com.fribbels.core.SpecialStats;
import com.fribbels.model.BaseStats;
import com.fribbels.model.HeroStats;

import java.util.HashMap;
import java.util.Map;

public class BaseStatsDb {

    private Map<String, BaseStats> baseStatsByName;

    public BaseStatsDb() {
        baseStatsByName = new HashMap<>();
    }

    // Strips the "#N" duplicate suffix so "Vivian #2" lookups resolve to "Vivian".
    private static String baseName(final String name) {
        if (name == null)
            return null;
        return name.replaceAll("\\s#\\d+$", "");
    }

    public BaseStats getBaseStatsByName(final String name) {
        final String base = baseName(name);
        if (!baseStatsByName.containsKey(base)) {
            return null;
        }
        return BaseStats.builder()
                .lv50FiveStarFullyAwakened(getBaseStatsByName(base, 5))
                .lv60SixStarFullyAwakened(getBaseStatsByName(base, 6))
                .skills(baseStatsByName.get(base).getSkills())
                .build();
    }

    public HeroStats getBaseStatsByName(final String name, final int stars) {
        final String base = baseName(name);
        if (!baseStatsByName.containsKey(base)) {
            return null;
        }

        final BaseStats baseStats = baseStatsByName.get(base);
        final HeroStats heroStats = stars == 5 ? baseStats.getLv50FiveStarFullyAwakened()
                : baseStats.getLv60SixStarFullyAwakened();

        final HeroStats response = HeroStats.builder()
                .atk(heroStats.getAtk())
                .hp(heroStats.getHp())
                .def(heroStats.getDef())
                .cr(heroStats.getCr())
                .cd(heroStats.getCd())
                .eff(heroStats.getEff())
                .res(heroStats.getRes())
                .dac(heroStats.getDac())
                .spd(heroStats.getSpd())
                .bonusStats(heroStats.getBonusStats())
                .name(base)
                .build();

        SpecialStats.setScBonusStats(response);

        return response;
    }

    public void setBaseStatsByName(final Map<String, BaseStats> baseStatsByName) {
        this.baseStatsByName = baseStatsByName;
    }
}

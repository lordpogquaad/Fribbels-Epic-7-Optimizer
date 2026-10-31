package com.fribbels.db;

import com.fribbels.model.Hero;
import com.fribbels.model.HeroStats;
import com.fribbels.request.OptimizationRequest;
import com.google.common.collect.ImmutableList;
import com.google.gson.ExclusionStrategy;
import com.google.gson.FieldAttributes;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.Strings;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Objects;
import java.util.logging.Logger;
import java.util.stream.Collectors;

public class HeroDb {

    private static final Logger logger = Logger.getLogger(HeroDb.class.getName());
    // Request fields a hero's saved copy leaves out: the live hero and gear, the per-run set
    // arrays, and the damage multipliers, which every run derives from the hero's skills and
    // options (a saved copy would be merged into a multi-hero run and serve old values).
    private static final java.util.Set<String> UNSAVED_REQUEST_FIELDS = java.util.Set.of(
            "hero", "items", "boolArr", "setPermutationIndicesPlusOne", "damageMultipliers");

    private static final Gson SAVE_GSON = new GsonBuilder()
            .setExclusionStrategies(new ExclusionStrategy() {
                @Override
                public boolean shouldSkipField(final FieldAttributes field) {
                    return field.getDeclaringClass() == OptimizationRequest.class
                            && UNSAVED_REQUEST_FIELDS.contains(field.getName());
                }

                @Override
                public boolean shouldSkipClass(final Class<?> type) {
                    return false;
                }
            })
            .create();

    private BaseStatsDb baseStatsDb;
    private List<Hero> heroes;

    public HeroDb(final BaseStatsDb baseStatsDb) {
        heroes = new ArrayList<>();
        this.baseStatsDb = baseStatsDb;
    }

    public void addHeroes(final List<Hero> newHeroes) {
        newHeroes.forEach(newHero -> {
            final com.fribbels.model.BaseStats heroBase = baseStatsDb.getBaseStatsByName(newHero.name);
            if (heroBase != null) {
                newHero.setSkills(heroBase.getSkills());
                if (newHero.getAtk() == 0) {
                    final int stars = newHero.getStars() > 0 ? newHero.getStars() : 6;
                    final HeroStats baseStats = baseStatsDb.getBaseStatsByName(newHero.name, stars);
                    if (baseStats != null) {
                        newHero.setAtk(baseStats.getAtk());
                        newHero.setHp(baseStats.getHp());
                        newHero.setDef(baseStats.getDef());
                        newHero.setSpd(baseStats.getSpd());
                        newHero.setCr(baseStats.getCr());
                        newHero.setCd(baseStats.getCd());
                        newHero.setEff(baseStats.getEff());
                        newHero.setRes(baseStats.getRes());
                        newHero.setDac(baseStats.getDac());
                    }
                }
            }
            sanitizeHero(newHero);
        });
        heroes.addAll(newHeroes);
        for (int i = 0; i < heroes.size(); i++) {
            final Hero hero = heroes.get(i);
            hero.setIndex(i + 1);
        }
    }

    private void sanitizeHero(final Hero hero) {
        // A stored value came from a run against older skill data and options (B18); the
        // next run stores a fresh one.
        hero.setDamageMultipliers(null);
        if (hero.getEquipment() == null) {
            hero.setEquipment(new HashMap<>());
        }
        if (hero.getBuilds() == null) {
            hero.setBuilds(new ArrayList<>());
        }
    }

    public List<Hero> getAllHeroes() {
        return new ArrayList<>(heroes);
    }

    public void setHeroes(final List<Hero> newHeroes) {
        if (CollectionUtils.isEmpty(newHeroes)) {
            heroes = new ArrayList<>();
            return;
        }
        for (int i = 0; i < newHeroes.size(); i++) {
            final Hero newHero = newHeroes.get(i);
            final com.fribbels.model.BaseStats heroBase = baseStatsDb.getBaseStatsByName(newHero.name);
            if (heroBase != null) {
                newHero.setSkills(heroBase.getSkills());
            }

            sanitizeHero(newHero);
            newHero.setIndex(i + 1);
        }
        heroes = newHeroes;
    }

    public Hero getHeroById(final String id) {
        return heroes.stream()
                .filter(Objects::nonNull)
                .filter(x -> Strings.CS.equals(x.getId(), id))
                .findFirst()
                .orElse(null);
    }

    public Hero getHeroByIngameId(final String ingameId) {
        if (ingameId == null)
            return null;
        return heroes.stream()
                .filter(Objects::nonNull)
                .filter(x -> Strings.CS.equals(x.getIngameId(), ingameId))
                .findFirst()
                .orElse(null);
    }

    public void saveOptimizationRequest(final OptimizationRequest request) {
        if (request.getHero() == null || request.getHero().getId() == null)
            return;

        final String heroId = request.getHero().getId();
        final Hero hero = getHeroById(heroId);

        if (hero == null)
            return;

        // Deep-copy the request without the heavy fields, so the original keeps them for
        // optimize(). The run is saved after its set arrays are built, which can be huge.
        final OptimizationRequest savedRequest = SAVE_GSON.fromJson(SAVE_GSON.toJson(request),
                OptimizationRequest.class);
        hero.setOptimizationRequest(savedRequest);
    }

    public List<HeroStats> getBuildsForHero(final String heroId) {
        if (heroId == null)
            return ImmutableList.of();
        final Hero hero = getHeroById(heroId);
        if (hero == null)
            return ImmutableList.of();

        if (hero.getBuilds() == null) {
            hero.setBuilds(new ArrayList<>());
        }

        return new ArrayList<>(hero.getBuilds());
    }

    public void addBuildToHero(final String heroId, final HeroStats build) {
        if (heroId == null || build == null || build.getBuildHash() == null)
            return;
        final Hero hero = getHeroById(heroId);
        if (hero == null)
            return;

        if (hero.getBuilds() == null) {
            hero.setBuilds(new ArrayList<>());
        }

        if (!hero.getBuilds()
                .stream()
                .map(HeroStats::getBuildHash)
                .collect(Collectors.toSet())
                .contains(build.getBuildHash())) {
            hero.getBuilds().add(build);
            logger.info("Added new build to hero: " + hero.getName());
        }
    }
}

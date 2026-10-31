package com.fribbels.handler;

import com.fribbels.core.StatCalculator;
import com.fribbels.db.ArtifactStatsDb;
import com.fribbels.db.BaseStatsDb;
import com.fribbels.db.HeroDb;
import com.fribbels.db.ItemDb;
import com.fribbels.model.Hero;
import com.fribbels.model.HeroStats;
import com.fribbels.request.BuildsRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * B27: a build with no hash (it does not name six items) compared equal to every other build
 * with no hash, so removing or renaming one touched them all.
 */
public class BuildHashNullTest {

    private HeroDb heroDb;
    private HeroesRequestHandler handler;
    private Hero hero;

    private static HeroStats noHashBuild(final String name) {
        final HeroStats build = new HeroStats();
        build.setName(name);
        build.setItems(new ArrayList<>(List.of("only-one")));
        return build;
    }

    @BeforeEach
    void setUp() {
        heroDb = new HeroDb(new BaseStatsDb());
        handler = new HeroesRequestHandler(heroDb, new BaseStatsDb(), new ArtifactStatsDb(), new ItemDb(heroDb),
                new StatCalculator());
        hero = Hero.builder().id("h1").name("Ras").stars(6).build();
        hero.setBuilds(new ArrayList<>(List.of(noHashBuild("first"), noHashBuild("second"))));
        heroDb.addHeroes(new ArrayList<>(List.of(hero)));
    }

    private BuildsRequest requestFor(final HeroStats build) {
        final BuildsRequest request = BuildsRequest.builder().heroId("h1").build(build).build();
        return request;
    }

    @Test
    void theHashIsNullWhenTheBuildDoesNotNameSixItems() {
        assertNull(noHashBuild("x").getBuildHash());
    }

    @Test
    void removingABuildWithNoHashRemovesNothing() {
        handler.removeBuild(requestFor(noHashBuild("first")));

        assertEquals(2, heroDb.getBuildsForHero("h1").size(), "a null hash matched the other null-hash builds");
    }

    @Test
    void renamingABuildWithNoHashRenamesNothing() {
        handler.editBuild(requestFor(noHashBuild("renamed")));

        assertEquals(List.of("first", "second"),
                heroDb.getBuildsForHero("h1").stream().map(HeroStats::getName).toList());
    }
}

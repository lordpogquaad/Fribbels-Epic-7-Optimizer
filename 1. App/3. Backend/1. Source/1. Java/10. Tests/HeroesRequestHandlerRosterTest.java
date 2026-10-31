package com.fribbels.handler;

import com.fribbels.core.StatCalculator;
import com.fribbels.db.ArtifactStatsDb;
import com.fribbels.db.BaseStatsDb;
import com.fribbels.db.HeroDb;
import com.fribbels.db.ItemDb;
import com.fribbels.enums.Gear;
import com.fribbels.enums.Rank;
import com.fribbels.enums.Set;
import com.fribbels.model.AugmentedStats;
import com.fribbels.model.Hero;
import com.fribbels.model.HeroStats;
import com.fribbels.model.Item;
import com.fribbels.request.BuildsRequest;
import com.fribbels.request.IdRequest;
import com.fribbels.request.ReorderAllRequest;
import com.fribbels.request.ReorderRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The roster paths of {@link HeroesRequestHandler}: reordering, removing, unequipping and
 * locking heroes, and saving and removing builds. These are what the hero grid calls, and
 * none of them was exercised before (B41).
 */
public class HeroesRequestHandlerRosterTest {

    private HeroDb heroDb;
    private ItemDb itemDb;
    private HeroesRequestHandler handler;
    private final boolean unlockBefore = HeroesRequestHandler.SETTING_UNLOCK_ON_UNEQUIP;

    private static Item item(final String id, final Gear gear) {
        final AugmentedStats stats = AugmentedStats.builder().attack(10).speed(5).build();
        return Item.builder()
                .id(id)
                .gear(gear)
                .rank(Rank.EPIC)
                .set(Set.SPEED)
                .level(85)
                .enhance(15)
                .priorityScore(100)
                .augmentedStats(stats)
                .reforgedStats(stats)
                .build();
    }

    private static HeroStats buildOf(final String name, final String... itemIds) {
        final HeroStats build = new HeroStats();
        build.setName(name);
        build.setItems(new ArrayList<>(List.of(itemIds)));
        return build;
    }

    private static IdRequest id(final String id) {
        return IdRequest.builder().id(id).build();
    }

    private List<String> heroIds() {
        return heroDb.getAllHeroes().stream().map(Hero::getId).toList();
    }

    @BeforeEach
    void setUp() {
        heroDb = new HeroDb(new BaseStatsDb());
        itemDb = new ItemDb(heroDb);
        itemDb.setItems(new ArrayList<>(List.of(item("w", Gear.WEAPON), item("h", Gear.HELMET))));
        handler = new HeroesRequestHandler(heroDb, new BaseStatsDb(), new ArtifactStatsDb(), itemDb,
                new StatCalculator());
        heroDb.addHeroes(new ArrayList<>(List.of(
                Hero.builder().id("a").name("A").stars(6).build(),
                Hero.builder().id("b").name("B").stars(6).build(),
                Hero.builder().id("c").name("C").stars(6).build(),
                Hero.builder().id("d").name("D").stars(6).build())));
    }

    @AfterEach
    void restoreSetting() {
        HeroesRequestHandler.SETTING_UNLOCK_ON_UNEQUIP = unlockBefore;
    }

    private ReorderRequest reorder(final String heroId, final Integer destination) {
        final ReorderRequest request = new ReorderRequest();
        request.setId(heroId);
        request.setDestinationIndex(destination);
        return request;
    }

    private ReorderAllRequest reorderAll(final List<String> ids) {
        final ReorderAllRequest request = new ReorderAllRequest();
        request.setIds(ids);
        return request;
    }

    @Test
    void reorderMovesAHeroToAOneBasedPosition() {
        handler.reorderHeroes(reorder("d", 2));
        assertEquals(List.of("a", "d", "b", "c"), heroIds());
    }

    @Test
    void reorderClampsAPositionPastEitherEnd() {
        handler.reorderHeroes(reorder("a", 99));
        assertEquals(List.of("b", "c", "d", "a"), heroIds());

        handler.reorderHeroes(reorder("a", -5));
        assertEquals(List.of("a", "b", "c", "d"), heroIds());
    }

    @Test
    void reorderIgnoresAMissingPositionAnUnknownHeroAndAMoveOntoItself() {
        handler.reorderHeroes(reorder("c", null));
        handler.reorderHeroes(reorder("nobody", 1));
        handler.reorderHeroes(reorder("b", 2));
        assertEquals(List.of("a", "b", "c", "d"), heroIds());
    }

    @Test
    void reorderAllFollowsTheGivenOrderDropsRepeatsAndUnknownIdsAndKeepsTheRestAtTheEnd() {
        handler.reorderAll(reorderAll(List.of("c", "x", "a", "c")));
        assertEquals(List.of("c", "a", "b", "d"), heroIds());
    }

    @Test
    void reorderAllWithNoIdsChangesNothing() {
        handler.reorderAll(reorderAll(List.of()));
        handler.reorderAll(reorderAll(null));
        assertEquals(List.of("a", "b", "c", "d"), heroIds());
    }

    private void equipTwoItemsOnA() {
        itemDb.equipItemOnHero("w", "a");
        itemDb.equipItemOnHero("h", "a");
        assertEquals("a", itemDb.getItemById("w").getEquippedById());
    }

    @Test
    void removingAHeroFreesItsGearAndDropsItFromTheRoster() {
        equipTwoItemsOnA();
        itemDb.getItemById("w").setLocked(true);

        handler.removeHeroById(id("a"));

        assertEquals(List.of("b", "c", "d"), heroIds());
        assertNull(itemDb.getItemById("w").getEquippedById());
        assertNull(itemDb.getItemById("h").getEquippedByName());
        assertTrue(itemDb.getItemById("w").isLocked(), "the lock stays unless the setting asks to drop it");
    }

    @Test
    void removingAHeroUnlocksItsGearWhenTheSettingSaysSo() {
        equipTwoItemsOnA();
        itemDb.getItemById("w").setLocked(true);
        HeroesRequestHandler.SETTING_UNLOCK_ON_UNEQUIP = true;

        handler.removeHeroById(id("a"));

        assertFalse(itemDb.getItemById("w").isLocked());
    }

    @Test
    void removingAnUnknownHeroChangesNothing() {
        assertEquals("", handler.removeHeroById(id("nobody")));
        assertEquals(4, heroDb.getAllHeroes().size());
    }

    @Test
    void unequippingAHeroKeepsTheHeroAndFreesItsGear() {
        equipTwoItemsOnA();

        handler.unequipHeroById(id("a"));

        assertEquals(4, heroDb.getAllHeroes().size());
        assertTrue(heroDb.getHeroById("a").getEquipment().isEmpty());
        assertNull(itemDb.getItemById("h").getEquippedById());
    }

    @Test
    void lockingAHeroLocksAndUnlocksItsGear() {
        equipTwoItemsOnA();

        handler.toggleLockHeroById(id("a"), true);
        assertTrue(itemDb.getItemById("w").isLocked());
        assertTrue(itemDb.getItemById("h").isLocked());

        handler.toggleLockHeroById(id("a"), false);
        assertFalse(itemDb.getItemById("w").isLocked());
    }

    @Test
    void aBuildIsSavedOnceAndRemovedByItsHash() {
        final String[] six = { "1", "2", "3", "4", "5", "6" };
        final String[] otherSix = { "1", "2", "3", "4", "5", "7" };
        handler.addBuild(BuildsRequest.builder().heroId("a").build(buildOf("one", six)).build());
        handler.addBuild(BuildsRequest.builder().heroId("a").build(buildOf("again", six)).build());
        handler.addBuild(BuildsRequest.builder().heroId("a").build(buildOf("two", otherSix)).build());
        assertEquals(List.of("one", "two"), heroDb.getBuildsForHero("a").stream().map(HeroStats::getName).toList());

        handler.editBuild(BuildsRequest.builder().heroId("a").build(buildOf("renamed", otherSix)).build());
        handler.removeBuild(BuildsRequest.builder().heroId("a").build(buildOf("x", six)).build());

        assertEquals(List.of("renamed"), heroDb.getBuildsForHero("a").stream().map(HeroStats::getName).toList());
    }
}

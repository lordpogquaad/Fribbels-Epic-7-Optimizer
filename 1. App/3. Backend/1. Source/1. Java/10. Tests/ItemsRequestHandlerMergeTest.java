package com.fribbels.handler;

import com.fribbels.core.StatCalculator;
import com.fribbels.db.ArtifactStatsDb;
import com.fribbels.db.BaseStatsDb;
import com.fribbels.db.HeroDb;
import com.fribbels.db.ItemDb;
import com.fribbels.enums.Gear;
import com.fribbels.enums.HeroFilter;
import com.fribbels.enums.Rank;
import com.fribbels.enums.Set;
import com.fribbels.model.Hero;
import com.fribbels.model.Item;
import com.fribbels.model.MergeHero;
import com.fribbels.model.Stat;
import com.fribbels.enums.StatType;
import com.fribbels.request.MergeRequest;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Regression tests for {@link ItemsRequestHandler#mergeHeroes} stale-hero pruning/relinking.
 *
 * <p>Bug: mergeHeroes was purely additive — it linked/created optimizer heroes from a scan but
 * never removed an optimizer hero whose in-game unit id had dropped out of the scan (fed,
 * imprinted, sold, etc.). A stale entry also kept its old ingameId forever, so a re-obtained
 * copy of the same hero couldn't relink to it (only NULL-ingameId heroes are eligible for the
 * name fallback) and was created as a spurious "Name #2" instead.
 *
 * <p>The fix: heroes whose ingameId is absent from the scan's id set are "stale" — their
 * ingameId is cleared up front so they become eligible for name-based relinking (via a
 * per-base-name FIFO queue, consulted before the plain unlinked-by-name map), and any stale
 * hero that's still unlinked after all matching is deleted (with its items unequipped).
 */
public class ItemsRequestHandlerMergeTest {

    private static ItemsRequestHandler newHandler(final HeroDb heroDb, final ItemDb itemDb) {
        final BaseStatsDb baseStatsDb = new BaseStatsDb();
        final ArtifactStatsDb artifactStatsDb = new ArtifactStatsDb();
        final HeroesRequestHandler heroesRequestHandler = new HeroesRequestHandler(
                heroDb, baseStatsDb, artifactStatsDb, itemDb, new StatCalculator());
        return new ItemsRequestHandler(itemDb, heroDb, baseStatsDb, heroesRequestHandler);
    }

    private static Hero optimizerHero(final String id, final String name, final String ingameId) {
        return Hero.builder()
                .id(id)
                .name(name)
                .stars(6)
                .ingameId(ingameId)
                .equipment(new HashMap<>())
                .build();
    }

    private static Hero optimizerHeroWithEquipment(final String id, final String name, final String ingameId,
            final Map<Gear, Item> equipment) {
        return Hero.builder()
                .id(id)
                .name(name)
                .stars(6)
                .ingameId(ingameId)
                .equipment(equipment)
                .build();
    }

    private static Item ring(final String id) {
        return Item.builder()
                .gear(Gear.RING)
                .rank(Rank.EPIC)
                .set(Set.SPEED)
                .level(85)
                .enhance(15)
                .id(id)
                .build();
    }

    private static MergeHero scanHero(final String ingameId, final String name) {
        return new MergeHero(null, 6, name, ingameId, Hero.builder().name(name).stars(6).build());
    }

    private static MergeRequest mergeRequestOf(final HeroFilter filter, final MergeHero... heroes) {
        return mergeRequestOf(filter, new ArrayList<>(), heroes);
    }

    private static MergeRequest mergeRequestOf(final HeroFilter filter, final List<Item> items,
            final MergeHero... heroes) {
        return MergeRequest.builder()
                .items(items)
                .mergeHeroes(new ArrayList<>(Arrays.asList(heroes)))
                .enhanceLimit(0)
                .heroFilter(filter)
                .build();
    }

    @Test
    public void staleLinkedHeroAbsentFromScan_isDeletedAndItsItemsUnequipped() {
        final HeroDb heroDb = new HeroDb(new BaseStatsDb());
        final ItemDb itemDb = new ItemDb(heroDb);

        // mergeItems() (called first, inside mergeHeroes) rebuilds itemDb.items from
        // request.getItems() — re-report the same item (matched by ingameId) so it survives.
        final Item equipped = ring("item1");
        equipped.setIngameId("itemIngame1");
        equipped.setEquippedById("h1");
        equipped.setEquippedByName("Ras");
        itemDb.setItems(new ArrayList<>(List.of(equipped)));

        final Map<Gear, Item> equipment = new HashMap<>();
        equipment.put(Gear.RING, equipped);
        final Hero stale = optimizerHeroWithEquipment("h1", "Ras", "oldRasId", equipment);
        heroDb.setHeroes(new ArrayList<>(List.of(stale)));

        final Item rescannedItem = ring("item1-rescan");
        rescannedItem.setIngameId("itemIngame1");
        // ingameId-match branch of mergeItems() never dereferences the existing item's own
        // (null) main, but does read the new item's — give it a non-null, non-zero one.
        rescannedItem.setMain(new Stat(StatType.ATTACK, 100, null, null, null, null, null, null));

        // Scan no longer contains "oldRasId" — only an unrelated hero (keeps scanIds non-empty).
        final MergeRequest request = mergeRequestOf(HeroFilter.SIX_STAR, new ArrayList<>(List.of(rescannedItem)),
                scanHero("otherId", "Vildred"));

        newHandler(heroDb, itemDb).mergeHeroes(request);

        assertNull(heroDb.getHeroById("h1"), "the stale hero must be deleted");
        assertNull(itemDb.getItemById("item1").getEquippedById(), "its item must be unequipped");
    }

    @Test
    public void staleLinkedHeroPlusSameNameScanUnit_relinksExistingHeroObject() {
        final HeroDb heroDb = new HeroDb(new BaseStatsDb());
        final ItemDb itemDb = new ItemDb(heroDb);

        final Hero stale = optimizerHero("h1", "Vivian", "oldVivianId");
        heroDb.setHeroes(new ArrayList<>(List.of(stale)));

        final MergeRequest request = mergeRequestOf(HeroFilter.SIX_STAR, scanHero("newVivianId", "Vivian"));

        newHandler(heroDb, itemDb).mergeHeroes(request);

        final List<Hero> allHeroes = heroDb.getAllHeroes();
        assertEquals(1, allHeroes.size(), "no new '#2' hero should be created");
        final Hero result = allHeroes.get(0);
        assertEquals("h1", result.getId(), "the SAME optimizer hero object/id must be reused");
        assertEquals("Vivian", result.getName(), "no '#2' suffix");
        assertEquals("newVivianId", result.getIngameId(), "ingameId must be relinked to the new scan unit");
    }

    @Test
    public void twoStaleCopiesPlusTwoNewScanCopies_bothRelinkNoneCreatedNoneDeleted() {
        final HeroDb heroDb = new HeroDb(new BaseStatsDb());
        final ItemDb itemDb = new ItemDb(heroDb);

        final Hero stale1 = optimizerHero("h1", "Zahhak", "oldZahhak1");
        final Hero stale2 = optimizerHero("h2", "Zahhak #2", "oldZahhak2");
        heroDb.setHeroes(new ArrayList<>(List.of(stale1, stale2)));

        final MergeRequest request = mergeRequestOf(HeroFilter.SIX_STAR,
                scanHero("newZahhak1", "Zahhak"),
                scanHero("newZahhak2", "Zahhak"));

        newHandler(heroDb, itemDb).mergeHeroes(request);

        final List<Hero> allHeroes = heroDb.getAllHeroes();
        assertEquals(2, allHeroes.size(), "no hero created or deleted — only relinked");

        final java.util.Set<String> resultIds = allHeroes.stream().map(Hero::getId)
                .collect(java.util.stream.Collectors.toSet());
        assertEquals(java.util.Set.of("h1", "h2"), resultIds, "both original optimizer heroes preserved");

        final java.util.Set<String> resultIngameIds = allHeroes.stream().map(Hero::getIngameId)
                .collect(java.util.stream.Collectors.toSet());
        assertEquals(java.util.Set.of("newZahhak1", "newZahhak2"), resultIngameIds,
                "both stale heroes relinked to the two new scan copies");
    }

    @Test
    public void heroWithNullIngameIdAndNoScanMatch_isUntouched() {
        final HeroDb heroDb = new HeroDb(new BaseStatsDb());
        final ItemDb itemDb = new ItemDb(heroDb);

        final Hero manual = optimizerHero("h1", "What-If Build", null);
        heroDb.setHeroes(new ArrayList<>(List.of(manual)));

        final MergeRequest request = mergeRequestOf(HeroFilter.SIX_STAR, scanHero("someId", "Vildred"));

        newHandler(heroDb, itemDb).mergeHeroes(request);

        final Hero result = heroDb.getHeroById("h1");
        assertNotNull(result, "a manually-added hero must never be pruned");
        assertNull(result.getIngameId(), "must remain unlinked");
        assertEquals(2, heroDb.getAllHeroes().size(), "the unmatched scan hero is added, the manual one kept");
    }

    @Test
    public void scanWithAllNullIds_pruningIsSkippedEntirely() {
        final HeroDb heroDb = new HeroDb(new BaseStatsDb());
        final ItemDb itemDb = new ItemDb(heroDb);

        final Hero existing = optimizerHero("h1", "Ras", "oldRasId");
        heroDb.setHeroes(new ArrayList<>(List.of(existing)));

        // Legacy scan: every MergeHero has a null id.
        final MergeRequest request = mergeRequestOf(HeroFilter.SIX_STAR, scanHero(null, "Vildred"));

        newHandler(heroDb, itemDb).mergeHeroes(request);

        final Hero result = heroDb.getHeroById("h1");
        assertNotNull(result, "nothing should be pruned when the scan provides no ingame ids");
        assertEquals("oldRasId", result.getIngameId(), "ingameId must be left untouched");
        assertFalse(heroDb.getAllHeroes().stream().anyMatch(h -> "Ras #2".equals(h.getName())),
                "no spurious duplicate should be created either");
    }
}

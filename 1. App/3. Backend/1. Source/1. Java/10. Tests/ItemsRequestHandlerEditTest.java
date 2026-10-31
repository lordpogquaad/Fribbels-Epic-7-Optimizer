package com.fribbels.handler;

import com.fribbels.db.ArtifactStatsDb;
import com.fribbels.db.BaseStatsDb;
import com.fribbels.db.HeroDb;
import com.fribbels.db.ItemDb;
import com.fribbels.enums.Gear;
import com.fribbels.enums.Rank;
import com.fribbels.enums.Set;
import com.fribbels.model.Hero;
import com.fribbels.model.Item;
import com.fribbels.request.ItemsRequest;
import com.fribbels.request.MergeRequest;
import com.fribbels.enums.HeroFilter;
import com.fribbels.core.StatCalculator;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogRecord;
import java.util.logging.Logger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins what {@link ItemsRequestHandler#editItems} keeps when the editor sends a partial item (B16)
 * and what an import does with an item whose set the backend cannot bind (B24).
 */
public class ItemsRequestHandlerEditTest {

    private static ItemsRequestHandler newHandler(final HeroDb heroDb, final ItemDb itemDb) {
        final BaseStatsDb baseStatsDb = new BaseStatsDb();
        final HeroesRequestHandler heroesRequestHandler = new HeroesRequestHandler(
                heroDb, baseStatsDb, new ArtifactStatsDb(), itemDb, new StatCalculator());
        return new ItemsRequestHandler(itemDb, heroDb, baseStatsDb, heroesRequestHandler);
    }

    private static Item ring(final String id, final Set set) {
        return Item.builder()
                .gear(Gear.RING)
                .rank(Rank.EPIC)
                .set(set)
                .level(85)
                .enhance(15)
                .id(id)
                .build();
    }

    /** What editGearDialog sends: the edited fields, and no op or storage. */
    private static Item editorCopy(final Item stored) {
        return Item.builder()
                .id(stored.getId())
                .gear(stored.getGear())
                .rank(stored.getRank())
                .set(stored.getSet())
                .level(stored.getLevel())
                .enhance(16)
                .build();
    }

    // ── B16 ──────────────────────────────────────────────────────────────────────

    @Test
    public void editItems_withoutOpAndStorage_keepsTheStoredOnes() {
        final HeroDb heroDb = new HeroDb(new BaseStatsDb());
        final ItemDb itemDb = new ItemDb(heroDb);
        final Item stored = ring("item1", Set.SPEED);
        stored.setOp(List.of(List.of("line one")));
        stored.setStorage(Boolean.TRUE);
        itemDb.setItems(new ArrayList<>(List.of(stored)));

        newHandler(heroDb, itemDb).editItems(ItemsRequest.builder()
                .items(new ArrayList<>(List.of(editorCopy(stored))))
                .build());

        final Item after = itemDb.getItemById("item1");
        assertEquals(16, after.getEnhance(), "the edit itself must still apply");
        assertEquals(List.of(List.of("line one")), after.getOp(), "an absent op must not clear the stored one");
        assertEquals(Boolean.TRUE, after.getStorage(), "an absent storage must not clear the stored flag");
    }

    @Test
    public void editItems_withOpAndStorage_replacesTheStoredOnes() {
        final HeroDb heroDb = new HeroDb(new BaseStatsDb());
        final ItemDb itemDb = new ItemDb(heroDb);
        final Item stored = ring("item1", Set.SPEED);
        stored.setOp(List.of(List.of("old")));
        stored.setStorage(Boolean.TRUE);
        itemDb.setItems(new ArrayList<>(List.of(stored)));

        final Item edit = editorCopy(stored);
        edit.setOp(List.of(List.of("new")));
        edit.setStorage(Boolean.FALSE);
        newHandler(heroDb, itemDb).editItems(ItemsRequest.builder()
                .items(new ArrayList<>(List.of(edit)))
                .build());

        final Item after = itemDb.getItemById("item1");
        assertEquals(List.of(List.of("new")), after.getOp());
        assertEquals(Boolean.FALSE, after.getStorage(), "an explicit false is a real value, not absent");
    }

    // ── B24 ──────────────────────────────────────────────────────────────────────

    /** Collects what a logger publishes while a test runs. */
    private static final class Capture extends Handler {
        final List<LogRecord> records = new ArrayList<>();

        @Override
        public void publish(final LogRecord record) {
            records.add(record);
        }

        @Override
        public void flush() {
            // nothing buffered
        }

        @Override
        public void close() {
            // nothing held
        }
    }

    @Test
    public void setItems_dropsAnItemWithNoSetAndSaysSo() {
        final Logger logger = Logger.getLogger(ItemDb.class.getName());
        final Capture capture = new Capture();
        logger.addHandler(capture);
        try {
            final ItemDb itemDb = new ItemDb(new HeroDb(new BaseStatsDb()));
            itemDb.setItems(new ArrayList<>(List.of(ring("kept", Set.SPEED), ring("unbound", null))));

            assertEquals(1, itemDb.getAllItems().size());
            assertNull(itemDb.getItemById("unbound"));
            final boolean warned = capture.records.stream()
                    .anyMatch(r -> r.getLevel().intValue() >= Level.WARNING.intValue()
                            && r.getMessage().contains("unbound"));
            assertTrue(warned, "a dropped item must be reported with its id, not dropped in silence");
        } finally {
            logger.removeHandler(capture);
        }
    }

    @Test
    public void mergeItems_unequipsTheHeroOfAnItemItDrops() {
        final HeroDb heroDb = new HeroDb(new BaseStatsDb());
        final ItemDb itemDb = new ItemDb(heroDb);

        final Item equipped = ring("item1", Set.SPEED);
        equipped.setEquippedById("h1");
        equipped.setEquippedByName("Ras");
        itemDb.setItems(new ArrayList<>(List.of(equipped)));

        final Map<Gear, Item> equipment = new HashMap<>();
        equipment.put(Gear.RING, equipped);
        final Hero hero = Hero.builder().id("h1").name("Ras").stars(6).equipment(equipment).build();
        heroDb.setHeroes(new ArrayList<>(List.of(hero)));

        // The rescan reports the same item id, now with a set the backend cannot bind.
        final Item rescanned = ring("item1", null);
        final MergeRequest request = MergeRequest.builder()
                .items(new ArrayList<>(List.of(rescanned)))
                .mergeHeroes(new ArrayList<>())
                .enhanceLimit(0)
                .heroFilter(HeroFilter.SIX_STAR)
                .build();

        newHandler(heroDb, itemDb).mergeItems(request);

        assertNull(itemDb.getItemById("item1"), "the item is not in the inventory after the import");
        assertTrue(heroDb.getHeroById("h1").getEquipment().isEmpty(),
                "the hero must not keep an item the inventory no longer has");
    }
}

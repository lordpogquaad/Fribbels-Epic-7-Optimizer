package com.fribbels.handler;

import com.fribbels.db.HeroDb;
import com.fribbels.db.ItemDb;
import com.fribbels.enums.Gear;
import com.fribbels.enums.Rank;
import com.fribbels.enums.Set;
import com.fribbels.enums.StatType;
import com.fribbels.model.Item;
import com.fribbels.model.Stat;
import com.fribbels.request.MergeRequest;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Regression tests for {@link ItemsRequestHandler#mergeItems} ingameId/hash matching.
 *
 * <p>Bug (silent data loss): the ingameId-match branch leaves the matched existing item in
 * the hash index, and the hash branch merges purely by hash. {@code getHash()} excludes
 * ingameId, so a DISTINCT piece with identical stats (its own non-null ingameId) was
 * mis-merged into the same existing item and then dropped by the {@code setItems} id-dedup.
 * The fix makes the hash branch skip a candidate whose non-null ingameId differs from the
 * new item's — without regressing same-item (same- or null-ingameId) re-reports.
 */
public class MergeItemsTest {

    // main == null makes a piece's hash depend only on gear/rank/set/level/augmentedStats,
    // so two null-main pieces of the same slot/rank/set/level collide on hash (the repro).
    // The ingameId-matched item (N1) needs a non-null, non-zero main so mergeItems' ingameId
    // branch takes the else path and never dereferences the existing item's null main.
    private static final Stat NONZERO_MAIN =
            new Stat(StatType.ATTACK, 100, null, null, null, null, null, null);

    private static ItemsRequestHandler newHandler(final ItemDb itemDb, final HeroDb heroDb) {
        // baseStatsDb + heroesRequestHandler are only used inside the per-hero loop; with an
        // empty heroDb that loop never runs, so null is safe for this test.
        return new ItemsRequestHandler(itemDb, heroDb, null, null);
    }

    private static Item gearPiece(final String id, final String ingameId, final Stat main) {
        return Item.builder()
                .gear(Gear.RING)
                .rank(Rank.EPIC)
                .set(Set.SPEED)
                .level(85)
                .enhance(15)
                .id(id)
                .ingameId(ingameId)
                .main(main)
                .build();
    }

    private static MergeRequest mergeOf(final Item... items) {
        return MergeRequest.builder()
                .items(new ArrayList<>(Arrays.asList(items)))
                .enhanceLimit(0)
                .build();
    }

    private static ItemDb dbWithExisting(final HeroDb heroDb, final Item... existing) {
        final ItemDb itemDb = new ItemDb(heroDb);
        itemDb.setItems(new ArrayList<>(Arrays.asList(existing)));
        return itemDb;
    }

    @Test
    public void distinctStatTwinWithItsOwnIngameId_isNotDropped() {
        final HeroDb heroDb = new HeroDb(null);
        // Existing item E (ingameId "X"), then a scan with N1 (re-scan of E, ingameId "X")
        // and N2 — a DIFFERENT piece (ingameId "Y") that merely shares E's stats (same hash).
        final ItemDb itemDb = dbWithExisting(heroDb, gearPiece("E", "X", null));
        final MergeRequest req = mergeOf(
                gearPiece("N1", "X", NONZERO_MAIN),
                gearPiece("N2", "Y", null));

        newHandler(itemDb, heroDb).mergeItems(req);

        final List<Item> result = itemDb.getAllItems();
        assertEquals(2, result.size(), "the distinct same-stats piece must be kept, not dropped");
        assertTrue(result.stream().anyMatch(it -> "Y".equals(it.getIngameId())),
                "the piece with ingameId Y must survive the merge");
    }

    @Test
    public void sameItemReportedTwice_collapsesToOne() {
        final HeroDb heroDb = new HeroDb(null);
        final ItemDb itemDb = dbWithExisting(heroDb, gearPiece("E", "X", null));
        // Same physical item reported twice in one scan (same ingameId "X").
        final MergeRequest req = mergeOf(
                gearPiece("N1", "X", NONZERO_MAIN),
                gearPiece("N2", "X", null));

        newHandler(itemDb, heroDb).mergeItems(req);

        assertEquals(1, itemDb.getAllItems().size(), "duplicate report of the same item must collapse");
    }

    @Test
    public void sameItemReportedWithNullIngameId_collapsesToOne() {
        final HeroDb heroDb = new HeroDb(null);
        final ItemDb itemDb = dbWithExisting(heroDb, gearPiece("E", "X", null));
        // A null-ingameId re-report can't be distinguished from a twin, so it still merges.
        final MergeRequest req = mergeOf(
                gearPiece("N1", "X", NONZERO_MAIN),
                gearPiece("N2", null, null));

        newHandler(itemDb, heroDb).mergeItems(req);

        assertEquals(1, itemDb.getAllItems().size(), "null-ingameId re-report still merges by hash");
    }
}

package com.fribbels.handler;

import com.fribbels.db.BaseStatsDb;
import com.fribbels.db.HeroDb;
import com.fribbels.db.ItemDb;
import com.fribbels.db.OptimizationDb;
import com.fribbels.model.BaseStats;
import com.fribbels.model.Hero;
import com.fribbels.model.HeroStats;
import com.fribbels.model.Item;
import com.fribbels.request.OptimizationRequest;
import com.google.gson.Gson;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * What the CPU search skips before and while it loops, on the sample request's 32 items
 * (5 weapons, 6 helmets, 5 armors, 5 necklaces, 6 rings, 5 boots = 22500 combinations; the
 * hero's base stats are CR 15, CD 150, SPD 88). {@code searched} counts the combinations the
 * loop built, {@code results} the ones that passed the filter. Every expected number below was
 * worked out from the pool and the rules stated in the comments, not read off a run.
 */
public class SearchPruningTest {

    private static final Gson GSON = new Gson();
    private static final Path SAMPLE = Path.of("1. Java", "10. Tests", "sampleOptimizationRequest.json");
    private static final String HERO_ID = "h1";

    private OptimizationRequestHandler handler;
    private HeroDb heroDb;

    @BeforeEach
    void setUp() {
        final BaseStatsDb baseStatsDb = new BaseStatsDb();
        final HeroStats stats = HeroStats.builder().atk(576).hp(5700).def(743).cr(15).cd(150).eff(0).res(0)
                .spd(88).dac(5).build();
        baseStatsDb.setBaseStatsByName(Map.of("Probe", BaseStats.builder()
                .lv50FiveStarFullyAwakened(stats)
                .lv60SixStarFullyAwakened(stats)
                .build()));
        heroDb = new HeroDb(baseStatsDb);
        heroDb.addHeroes(List.of(Hero.builder().id(HERO_ID).name("Probe").stars(6).build()));
        handler = new OptimizationRequestHandler(baseStatsDb, heroDb, new ItemDb(heroDb));
    }

    private OptimizationRequest request(final int setFormat) throws IOException {
        final OptimizationRequest request = GSON.fromJson(Files.readString(SAMPLE), OptimizationRequest.class);
        for (final Item item : request.getItems()) {
            item.setModId(item.getId());
        }
        request.setHero(GSON.fromJson(GSON.toJson(heroDb.getHeroById(HERO_ID)), Hero.class));
        request.setHeroId(HERO_ID);
        request.setExecutionId(handler.prepareExecution());
        request.setSetFormat(setFormat);
        return request;
    }

    @SuppressWarnings("unchecked")
    private OptimizationDb run(final OptimizationRequest request) throws ReflectiveOperationException {
        final String response = handler.handleOptimizationRequest(request);
        assertTrue(response.startsWith("{"), "the run was refused: " + response);
        final Field field = OptimizationRequestHandler.class.getDeclaredField("optimizationDbs");
        field.setAccessible(true);
        return ((Map<String, OptimizationDb>) field.get(handler)).get(request.getExecutionId());
    }

    /** Counts the one-item-per-slot builds whose sets are four Speed or Destruction pieces plus two Health or Immunity. */
    private static long validFourTwoBuilds(final OptimizationRequest request) {
        final List<List<Item>> slots = new java.util.ArrayList<>();
        for (final String gear : List.of("Weapon", "Helmet", "Armor", "Necklace", "Ring", "Boots")) {
            slots.add(request.getItems().stream().filter(i -> i.getGear().name().equalsIgnoreCase(gear)).toList());
        }
        return countFourTwo(slots, 0, new java.util.HashMap<>());
    }

    private static long countFourTwo(final List<List<Item>> slots, final int slot, final Map<String, Integer> counts) {
        if (slot == slots.size()) {
            return isFourTwo(counts) ? 1 : 0;
        }
        long total = 0;
        for (final Item item : slots.get(slot)) {
            final String set = item.getSet().name();
            counts.merge(set, 1, Integer::sum);
            total += countFourTwo(slots, slot + 1, counts);
            counts.merge(set, -1, Integer::sum);
        }
        return total;
    }

    private static boolean isFourTwo(final Map<String, Integer> counts) {
        final java.util.SortedMap<String, Integer> used = new java.util.TreeMap<>(counts);
        used.values().removeIf(n -> n == 0);
        if (used.size() != 2) {
            return false;
        }
        final boolean four = used.entrySet().stream()
                .anyMatch(x -> x.getValue() == 4 && List.of("SPEED", "DESTRUCTION").contains(x.getKey()));
        final boolean two = used.entrySet().stream()
                .anyMatch(x -> x.getValue() == 2 && List.of("HEALTH", "IMMUNITY").contains(x.getKey()));
        return four && two;
    }

    // ── Short-circuit (set formats 1 and 2: a 4-piece set is required) ───────────────────────

    @Test
    void aFourPieceFormatSkipsTheCombinationsThatCannotHoldTheSetButLosesNoValidBuild() throws Exception {
        final OptimizationRequest request = request(1); // four of Speed/Destruction + two of Health/Immunity
        final long valid = validFourTwoBuilds(request);

        final OptimizationDb db = run(request);

        // Loop order is the slots by ascending size, ties in canonical order: weapons (5), armors (5),
        // necklaces (5), boots (5), helmets (6), rings (6). Items of the wanted 4-piece sets come first
        // in every slot. The third loop stops at the first necklace outside those sets once neither the
        // weapon nor the armor is in them. In the pool: 1 of 5 weapons, 2 of 5 armors and 1 of 5
        // necklaces are Speed (no Destruction item exists). Of the 25 weapon/armor pairs, 4*3 = 12 have
        // neither in the sets and see 1 necklace; the other 13 see all 5. Each necklace is then
        // followed by 5 boots * 6 helmets * 6 rings = 180 combinations.
        assertEquals((13 * 5 + 12 * 1) * 180, db.getSearchedCounter().get());
        // A 4-piece build needs 4 of the 6 pieces, so at least one of the first three loop slots
        // holds one: every valid build is still reached.
        assertEquals(valid, db.getResultsCounter().get());
        assertEquals(104, valid);
    }

    @Test
    void theSameGearWithNoSetFormatSearchesEveryCombination() throws Exception {
        final OptimizationDb db = run(request(0));

        assertEquals(5 * 6 * 5 * 5 * 6 * 5, db.getSearchedCounter().get());
        assertEquals(22500, db.getResultsCounter().get()); // format 0 allows every set combination
    }

    // ── Per-slot stat pre-filter (CR / CD / SPD / EFF minimums) ─────────────────────────────
    //
    // An item is dropped when its stat, plus the best item of every other slot, plus the hero's
    // base, plus the largest set bonus that stat can get, still misses the minimum. The bonus
    // ceilings: CR 3 x 12 (Critical), CD 60 (Destruction 4pc), SPD 25% of base speed (Speed 4pc).

    @Test
    void theCritRatePreFilterDropsItemsThatCannotReachTheMinimumAndKeepsEveryOneThatCan() throws Exception {
        // Best CR per slot: weapon 10, helmet 7, armor 9, necklace 45 (an Attack-set CR main stat),
        // ring 12, boots 12; their sum is 95, so the ideal build is 15 + 95 + 36 = 146. At a minimum
        // of 118 an item needs its own CR >= 118 - 146 + (the best CR in its slot): only the necklaces
        // with CR >= 45 - 28 = 17 stay (45 and 21), the other slots lose nothing: 9000 combinations.
        final OptimizationRequest request = request(0);
        request.setInputCrMinLimit(118);

        final OptimizationDb db = run(request);

        assertEquals(5 * 6 * 5 * 2 * 6 * 5, db.getSearchedCounter().get());
        // Builds of CR >= 118 counted by hand over all 22500 combinations: the 9 built from the
        // survivors, so nothing feasible was pruned.
        assertEquals(9, db.getResultsCounter().get());
    }

    @Test
    void theCritRatePreFilterPrunesInEverySlotWhenTheMinimumIsNearTheIdealBuild() throws Exception {
        // Minimum 140: an item needs CR >= 140 - 146 + (best in slot) = best - 6. Weapons (best 10)
        // keep CR 10, 7, 6 (3 of 5); helmets (best 7) keep 7, 7, 6 (3 of 6); armors (best 9) keep all
        // 5 (the lowest is 4 >= 3); necklaces (best 45) keep only the 45 (1 of 5); rings (best 12)
        // keep 12, 9, 7 (3 of 6); boots (best 12) keep 12, 11, 8, 8 (4 of 5).
        final OptimizationRequest request = request(0);
        request.setInputCrMinLimit(140);

        final OptimizationDb db = run(request);

        assertEquals(3 * 3 * 5 * 1 * 3 * 4, db.getSearchedCounter().get());
        assertEquals(0, db.getResultsCounter().get());
    }

    @Test
    void theCritDamagePreFilterUsesTheSixtyPointDestructionCeiling() throws Exception {
        // Best CD per slot: 15, 10, 13, 65, 21, 6 (sum 130); ideal build 150 + 130 + 60 = 340. At a
        // minimum of 290 an item needs CD >= 290 - 340 + (best in slot) = best - 50. Only the necklaces
        // can fall short: the two with a 65 CD main stat stay and the other three (CD 0) go, so
        // 2 of 5 stay and every other slot keeps all. No build reaches 290.
        final OptimizationRequest request = request(0);
        request.setInputCdMinLimit(290);

        final OptimizationDb db = run(request);

        assertEquals(5 * 6 * 5 * 2 * 6 * 5, db.getSearchedCounter().get());
        assertEquals(0, db.getResultsCounter().get());
    }

    @Test
    void theSpeedPreFilterUsesTwentyFivePercentOfBaseSpeedAsTheSetCeiling() throws Exception {
        // Best SPD per slot: 9, 9, 12, 14, 11, 40 (sum 95); ideal 88 + 95 + 22 (25% of 88) = 205. At a
        // minimum of 190 an item needs SPD >= 190 - 205 + (best in slot) = best - 15: only the boots
        // (best 40) can lose any, and the 3 with a Speed main stat keep it, the other 2 go.
        // 5*6*5*5*6*3 = 13500 combinations are searched; 107 builds reach 190 by hand count.
        final OptimizationRequest request = request(0);
        request.setInputSpdMinLimit(190);

        final OptimizationDb db = run(request);

        assertEquals(5 * 6 * 5 * 5 * 6 * 3, db.getSearchedCounter().get());
        assertEquals(107, db.getResultsCounter().get());
    }
}

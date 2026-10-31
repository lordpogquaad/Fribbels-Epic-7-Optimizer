package com.fribbels.handler;

import com.fribbels.db.BaseStatsDb;
import com.fribbels.db.HeroDb;
import com.fribbels.db.ItemDb;
import com.fribbels.model.HeroStats;
import com.fribbels.request.OptimizationRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.function.BiConsumer;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins the CPU build filter {@code passesFilter} and the set-index arithmetic behind its set
 * check. The rule, as the request fields and the grid state it: a build passes when every stat
 * lies inside its own [min, max] range (both ends inclusive) and its sorted set indices are
 * allowed in {@code boolArr}; a request field left unset means min 0 and max Integer.MAX_VALUE.
 * Expected values are worked out from those rules, not read off a run.
 */
public class PassesFilterTest {

    private static final int SET_COUNT = 24;

    /** One filtered stat: how to set it on a build, and its minimum and maximum on the request. */
    private record Limit(String name, BiConsumer<HeroStats, Integer> stat,
            BiConsumer<OptimizationRequest, Integer> min, BiConsumer<OptimizationRequest, Integer> max) {
    }

    private static final List<Limit> LIMITS = List.of(
            new Limit("atk", (h, v) -> h.atk = v, (r, v) -> r.inputAtkMinLimit = v, (r, v) -> r.inputAtkMaxLimit = v),
            new Limit("hp", (h, v) -> h.hp = v, (r, v) -> r.inputHpMinLimit = v, (r, v) -> r.inputHpMaxLimit = v),
            new Limit("def", (h, v) -> h.def = v, (r, v) -> r.inputDefMinLimit = v, (r, v) -> r.inputDefMaxLimit = v),
            new Limit("spd", (h, v) -> h.spd = v, (r, v) -> r.inputSpdMinLimit = v, (r, v) -> r.inputSpdMaxLimit = v),
            new Limit("cr", (h, v) -> h.cr = v, (r, v) -> r.inputCrMinLimit = v, (r, v) -> r.inputCrMaxLimit = v),
            new Limit("cd", (h, v) -> h.cd = v, (r, v) -> r.inputCdMinLimit = v, (r, v) -> r.inputCdMaxLimit = v),
            new Limit("eff", (h, v) -> h.eff = v, (r, v) -> r.inputEffMinLimit = v, (r, v) -> r.inputEffMaxLimit = v),
            new Limit("res", (h, v) -> h.res = v, (r, v) -> r.inputResMinLimit = v, (r, v) -> r.inputResMaxLimit = v),
            new Limit("cp", (h, v) -> h.cp = v, (r, v) -> r.inputMinCpLimit = v, (r, v) -> r.inputMaxCpLimit = v),
            new Limit("hpps", (h, v) -> h.hpps = v, (r, v) -> r.inputMinHppsLimit = v,
                    (r, v) -> r.inputMaxHppsLimit = v),
            new Limit("ehp", (h, v) -> h.ehp = v, (r, v) -> r.inputMinEhpLimit = v, (r, v) -> r.inputMaxEhpLimit = v),
            new Limit("ehpps", (h, v) -> h.ehpps = v, (r, v) -> r.inputMinEhppsLimit = v,
                    (r, v) -> r.inputMaxEhppsLimit = v),
            new Limit("dmg", (h, v) -> h.dmg = v, (r, v) -> r.inputMinDmgLimit = v, (r, v) -> r.inputMaxDmgLimit = v),
            new Limit("dmgps", (h, v) -> h.dmgps = v, (r, v) -> r.inputMinDmgpsLimit = v,
                    (r, v) -> r.inputMaxDmgpsLimit = v),
            new Limit("mcdmg", (h, v) -> h.mcdmg = v, (r, v) -> r.inputMinMcdmgLimit = v,
                    (r, v) -> r.inputMaxMcdmgLimit = v),
            new Limit("mcdmgps", (h, v) -> h.mcdmgps = v, (r, v) -> r.inputMinMcdmgpsLimit = v,
                    (r, v) -> r.inputMaxMcdmgpsLimit = v),
            new Limit("dmgh", (h, v) -> h.dmgh = v, (r, v) -> r.inputMinDmgHLimit = v,
                    (r, v) -> r.inputMaxDmgHLimit = v),
            new Limit("dmgd", (h, v) -> h.dmgd = v, (r, v) -> r.inputMinDmgDLimit = v,
                    (r, v) -> r.inputMaxDmgDLimit = v),
            new Limit("hmcdmgs", (h, v) -> h.hmcdmgs = v, (r, v) -> r.inputMinHmcdmgsLimit = v,
                    (r, v) -> r.inputMaxHmcdmgsLimit = v),
            new Limit("dmcdmgs", (h, v) -> h.dmcdmgs = v, (r, v) -> r.inputMinDmcdmgsLimit = v,
                    (r, v) -> r.inputMaxDmcdmgsLimit = v),
            new Limit("hdmg", (h, v) -> h.hdmg = v, (r, v) -> r.inputMinHdmgLimit = v,
                    (r, v) -> r.inputMaxHdmgLimit = v),
            new Limit("hdmgs", (h, v) -> h.hdmgs = v, (r, v) -> r.inputMinHdmgsLimit = v,
                    (r, v) -> r.inputMaxHdmgsLimit = v),
            new Limit("ddmg", (h, v) -> h.ddmg = v, (r, v) -> r.inputMinDdmgLimit = v,
                    (r, v) -> r.inputMaxDdmgLimit = v),
            new Limit("ddmgs", (h, v) -> h.ddmgs = v, (r, v) -> r.inputMinDdmgsLimit = v,
                    (r, v) -> r.inputMaxDdmgsLimit = v),
            new Limit("s1", (h, v) -> h.s1 = v, (r, v) -> r.inputMinS1Limit = v, (r, v) -> r.inputMaxS1Limit = v),
            new Limit("s2", (h, v) -> h.s2 = v, (r, v) -> r.inputMinS2Limit = v, (r, v) -> r.inputMaxS2Limit = v),
            new Limit("s3", (h, v) -> h.s3 = v, (r, v) -> r.inputMinS3Limit = v, (r, v) -> r.inputMaxS3Limit = v),
            new Limit("upgrades", (h, v) -> h.upgrades = v, (r, v) -> r.inputMinUpgradesLimit = v,
                    (r, v) -> r.inputMaxUpgradesLimit = v),
            new Limit("conversions", (h, v) -> h.conversions = v, (r, v) -> r.inputMinConversionsLimit = v,
                    (r, v) -> r.inputMaxConversionsLimit = v),
            new Limit("equipped", (h, v) -> h.eq = v, (r, v) -> r.inputMinEquippedLimit = v,
                    (r, v) -> r.inputMaxEquippedLimit = v),
            new Limit("score", (h, v) -> h.score = v, (r, v) -> r.inputMinScoreLimit = v,
                    (r, v) -> r.inputMaxScoreLimit = v),
            new Limit("bs", (h, v) -> h.bs = v, (r, v) -> r.inputMinBSLimit = v, (r, v) -> r.inputMaxBSLimit = v),
            new Limit("priority", (h, v) -> h.priority = v, (r, v) -> r.inputMinPriorityLimit = v,
                    (r, v) -> r.inputMaxPriorityLimit = v));

    private OptimizationRequestHandler handler;

    @BeforeEach
    void setUp() {
        final BaseStatsDb baseStatsDb = new BaseStatsDb();
        final HeroDb heroDb = new HeroDb(baseStatsDb);
        handler = new OptimizationRequestHandler(baseStatsDb, heroDb, new ItemDb(heroDb));
    }

    /** An open request: every stat range unbounded, and the one set index the sets below use allowed. */
    private static OptimizationRequest openRequest() {
        final OptimizationRequest request = new OptimizationRequest();
        request.boolArr = new boolean[] { true };
        return request;
    }

    /** Six pieces of set 0, whose sorted index array is all zeros, so its set index is 0. */
    private static int[] setsAllZeroIndex() {
        final int[] sets = new int[SET_COUNT];
        sets[0] = 6;
        return sets;
    }

    @Test
    void theFixtureCoversEveryStatRangeTheRequestCarries() {
        // 33 minimum/maximum pairs on the request; a forgotten row would leave one unpinned.
        assertEquals(33, LIMITS.size());
    }

    @Test
    void anUnsetRequestLetsAnyBuildThrough() {
        final HeroStats build = HeroStats.builder().atk(5000).hp(30000).def(2000).cr(100).cd(350).spd(250).build();

        assertTrue(handler.passesFilter(build, openRequest(), setsAllZeroIndex()));
    }

    @Test
    void aStatBelowItsMinimumIsRejectedAndOneAtTheMinimumPasses() {
        for (final Limit limit : LIMITS) {
            final OptimizationRequest request = openRequest();
            limit.min().accept(request, 10);

            assertFalse(passes(limit, request, 9), limit.name() + " 9 < min 10");
            assertTrue(passes(limit, request, 10), limit.name() + " 10 == min 10");
        }
    }

    /** Whether a build whose only non-zero stat is the limit's own, at {@code value}, passes. */
    private boolean passes(final Limit limit, final OptimizationRequest request, final int value) {
        final HeroStats build = new HeroStats();
        limit.stat().accept(build, value);
        return handler.passesFilter(build, request, setsAllZeroIndex());
    }

    @Test
    void aStatAboveItsMaximumIsRejectedAndOneAtTheMaximumPasses() {
        for (final Limit limit : LIMITS) {
            final OptimizationRequest request = openRequest();
            limit.max().accept(request, 10);

            assertFalse(passes(limit, request, 11), limit.name() + " 11 > max 10");
            assertTrue(passes(limit, request, 10), limit.name() + " 10 == max 10");
        }
    }

    @Test
    void theSetCheckLooksUpTheSortedSetIndicesInBoolArr() {
        // Four pieces of set 0 and two of set 1 sort to {0,0,0,0,1,1}: index 1*24 + 1 = 25.
        // Two of set 0 and four of set 1 sort to {0,0,1,1,1,1}: 1*13824 + 1*576 + 1*24 + 1 = 14425.
        final OptimizationRequest request = new OptimizationRequest();
        request.boolArr = new boolean[14426];
        request.boolArr[25] = true;
        final HeroStats build = new HeroStats();

        final int[] fourAndTwo = new int[SET_COUNT];
        fourAndTwo[0] = 4;
        fourAndTwo[1] = 2;
        final int[] twoAndFour = new int[SET_COUNT];
        twoAndFour[0] = 2;
        twoAndFour[1] = 4;

        assertTrue(handler.passesFilter(build, request, fourAndTwo));
        assertFalse(handler.passesFilter(build, request, twoAndFour));
    }

    @Test
    void aBuildInRangeOnEveryStatStillFailsWhenItsSetsAreNotAllowed() {
        final OptimizationRequest request = openRequest();
        request.boolArr = new boolean[1]; // index 0 present but not allowed

        assertFalse(handler.passesFilter(new HeroStats(), request, setsAllZeroIndex()));
    }

    @Test
    void theStatRangesAreCheckedBeforeTheSets() {
        // Both fail; the point is only that a stat failure does not need a valid set index. A
        // boolArr too short for the index would throw if the set check ran first.
        final OptimizationRequest request = openRequest();
        request.inputSpdMinLimit = 10;
        request.boolArr = new boolean[1];
        final int[] farIndex = new int[SET_COUNT];
        farIndex[5] = 6;

        assertFalse(handler.passesFilter(new HeroStats(), request, farIndex));
    }

    @Test
    void calculateSetIndexIsABaseTwentyFourNumberOverTheSixIndices() {
        final int top = SET_COUNT - 1;

        assertEquals(0, handler.calculateSetIndex(new int[] { 0, 0, 0, 0, 0, 0 }));
        assertEquals(1, handler.calculateSetIndex(new int[] { 0, 0, 0, 0, 0, 1 }));
        assertEquals(24, handler.calculateSetIndex(new int[] { 0, 0, 0, 0, 1, 0 }));
        assertEquals(576, handler.calculateSetIndex(new int[] { 0, 0, 0, 1, 0, 0 }));
        assertEquals(13824, handler.calculateSetIndex(new int[] { 0, 0, 1, 0, 0, 0 }));
        assertEquals(331776, handler.calculateSetIndex(new int[] { 0, 1, 0, 0, 0, 0 }));
        assertEquals(7962624, handler.calculateSetIndex(new int[] { 1, 0, 0, 0, 0, 0 }));
        // 1*24^5 + 2*24^4 + 3*24^3 + 4*24^2 + 5*24 + 6 = 7962624 + 663552 + 41472 + 2304 + 120 + 6
        assertEquals(8670078, handler.calculateSetIndex(new int[] { 1, 2, 3, 4, 5, 6 }));
        // The largest index, 24^6 - 1, is the last slot of the SET_EXPONENTIAL (24^6) arrays.
        assertEquals(191102975, handler.calculateSetIndex(new int[] { top, top, top, top, top, top }));
    }

    @Test
    void calculateSetIndexGivesEverySortedCombinationItsOwnIndex() {
        // Distinct sorted six-tuples must not collide, or two different set combinations would
        // share one boolArr slot. Enumerates tuples over the first five set indices.
        final java.util.Set<Integer> seen = new java.util.HashSet<>();
        final int tuples = addSortedTuples(new int[6], 0, 0, seen);

        // Multisets of size 6 from 5 kinds: C(10, 6) = 210.
        assertEquals(210, tuples);
        assertEquals(tuples, seen.size());
    }

    /** Fills {@code tuple} with every non-decreasing sequence over 0-4, adding each one's index to {@code seen}. */
    private int addSortedTuples(final int[] tuple, final int position, final int from, final java.util.Set<Integer> seen) {
        if (position == tuple.length) {
            seen.add(handler.calculateSetIndex(tuple));
            return 1;
        }
        int count = 0;
        for (int value = from; value < 5; value++) {
            tuple[position] = value;
            count += addSortedTuples(tuple, position + 1, value, seen);
        }
        return count;
    }

    @Test
    void convertSetsArrayIntoIndexArrayExpandsTheCountsInAscendingSetOrder() {
        final int[] sets = new int[SET_COUNT];
        sets[22] = 2;
        sets[2] = 1;
        sets[11] = 3;

        assertArrayEquals(new int[] { 2, 11, 11, 11, 22, 22 }, handler.convertSetsArrayIntoIndexArray(sets));
    }
}

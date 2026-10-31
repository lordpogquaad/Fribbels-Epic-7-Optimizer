package com.fribbels.db;

import com.fribbels.enums.OptimizationColumn;
import com.fribbels.enums.SortOrder;
import com.fribbels.model.HeroStats;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins the lifecycle of one optimization's results: the order a finished run is
 * served in, in legacy (pre-allocated array) and keep-best-N (bounded heap) modes,
 * filtering, and when a cancel survives. Each {@link Run} drives the db in the same
 * order as {@code OptimizationRequestHandler.optimize}.
 */
public class OptimizationDbTest {

    private static final int CAPACITY = 1000;

    /** Discovery order. buildScore, atk and the speed fields each rank them differently. */
    private static HeroStats[] rows() {
        return new HeroStats[] {
                build("a", 10, 300, 100, 10),
                build("b", 40, 100, 110, 80),
                build("c", 20, 500, 120, 20),
                build("d", 50, 200, 130, 0),
                build("e", 30, 400, 140, 30),
        };
    }

    private static final List<String> BY_BUILD_SCORE_DESC = List.of("d", "b", "e", "c", "a");
    private static final List<String> BY_ATK_ASC = List.of("b", "d", "a", "e", "c");
    private static final List<String> BY_ATK_DESC = List.of("c", "e", "a", "d", "b");

    private static HeroStats build(final String id, final int buildScore, final int atk, final int spd,
            final int eff) {
        // priority and score run against buildScore, so a default of either one shows up.
        return HeroStats.builder()
                .id(id)
                .buildScore(buildScore)
                .priority(-buildScore)
                .score(-buildScore)
                .atk(atk)
                .spd(spd)
                .eff(eff)
                .build();
    }

    private static List<String> ids(final HeroStats[] heroStats) {
        return Arrays.stream(heroStats).map(HeroStats::getId).collect(Collectors.toList());
    }

    private static List<String> allRows(final OptimizationDb db) {
        return ids(db.getRows(0, CAPACITY));
    }

    // ── The two run shapes ──────────────────────────────────────────────────────

    private interface Run {
        /** The handler's setLiveResults or setLiveTopN call. */
        void goLive();

        void add(HeroStats... found);

        /** The handler's setResultHeroes call. */
        void finish();
    }

    private static final class LegacyRun implements Run {
        private final OptimizationDb db;
        private final HeroStats[] results = new HeroStats[CAPACITY];

        LegacyRun(final OptimizationDb db) {
            this.db = db;
        }

        @Override
        public void goLive() {
            db.setLiveResults(results, db.getResultsCounter());
        }

        @Override
        public void add(final HeroStats... found) {
            for (final HeroStats heroStats : found) {
                results[(int) db.getResultsCounter().getAndIncrement()] = heroStats;
            }
        }

        @Override
        public void finish() {
            db.setResultHeroes(results, Math.min(CAPACITY, db.getResultsCounter().get()));
        }
    }

    private static final class KeepBestNRun implements Run {
        private final OptimizationDb db;
        private final TopNResults topN = new TopNResults(CAPACITY);

        KeepBestNRun(final OptimizationDb db) {
            this.db = db;
        }

        @Override
        public void goLive() {
            db.setLiveTopN(topN);
        }

        @Override
        public void add(final HeroStats... found) {
            for (final HeroStats heroStats : found) {
                db.getResultsCounter().getAndIncrement();
                topN.offer(heroStats);
            }
        }

        @Override
        public void finish() {
            final HeroStats[] finalArr = topN.toArray();
            db.setResultHeroes(finalArr, finalArr.length);
        }
    }

    private static Run started(final Function<OptimizationDb, Run> mode, final OptimizationDb db) {
        final Run run = mode.apply(db);
        db.beginRun();
        run.goLive();
        return run;
    }

    private static void completeRun(final Function<OptimizationDb, Run> mode, final OptimizationDb db,
            final HeroStats... found) {
        final Run run = started(mode, db);
        run.add(found);
        run.finish();
        db.setDone(true);
    }

    // ── B14: sort recorded before the run ───────────────────────────────────────

    private static void assertSortRecordedBeforeRunApplies(final Function<OptimizationDb, Run> mode) {
        final OptimizationDb db = new OptimizationDb();
        db.sort(OptimizationColumn.BUILDSCORE, SortOrder.DESC);

        completeRun(mode, db, rows());

        // The grid's post-run fetch repeats the pre-run sort, which hits sameSort.
        db.sort(OptimizationColumn.BUILDSCORE, SortOrder.DESC);
        assertEquals(BY_BUILD_SCORE_DESC, allRows(db));
    }

    @Test
    public void legacyFinishedRunHonoursSortRecordedBeforeRun() {
        assertSortRecordedBeforeRunApplies(LegacyRun::new);
    }

    @Test
    public void keepBestNFinishedRunHonoursSortRecordedBeforeRun() {
        assertSortRecordedBeforeRunApplies(KeepBestNRun::new);
    }

    // ── B14: sort requested during the run ──────────────────────────────────────

    private static void assertSortRequestedDuringRunApplies(final Function<OptimizationDb, Run> mode) {
        final OptimizationDb db = new OptimizationDb();
        db.sort(OptimizationColumn.BUILDSCORE, SortOrder.DESC);
        final Run run = started(mode, db);
        final HeroStats[] found = rows();
        run.add(found[0], found[1]);

        db.sort(OptimizationColumn.ATK, SortOrder.ASC);

        run.add(found[2], found[3], found[4]);
        run.finish();
        // saveHeroResults can reach the db before the grid's own fetch.
        db.sort(null, null);
        assertEquals(BY_ATK_ASC, allRows(db));
    }

    @Test
    public void legacyFinishedRunHonoursSortRequestedDuringRun() {
        assertSortRequestedDuringRunApplies(LegacyRun::new);
    }

    @Test
    public void keepBestNFinishedRunHonoursSortRequestedDuringRun() {
        assertSortRequestedDuringRunApplies(KeepBestNRun::new);
    }

    @Test
    public void legacyLiveArrayIsNeverSortedWhileTheRunWrites() {
        final OptimizationDb db = new OptimizationDb();
        final HeroStats[] results = new HeroStats[CAPACITY];
        db.beginRun();
        db.setLiveResults(results, db.getResultsCounter());
        final HeroStats[] found = rows();
        System.arraycopy(found, 0, results, 0, found.length);
        db.getResultsCounter().set(found.length);

        db.sort(OptimizationColumn.ATK, SortOrder.ASC);

        assertArrayEquals(found, Arrays.copyOf(results, found.length));
        assertEquals(List.of("a", "b", "c", "d", "e"), allRows(db));
    }

    @Test
    public void legacyFinishDoesNotReorderTheArrayTheRunWroteInto() {
        final OptimizationDb db = new OptimizationDb();
        db.sort(OptimizationColumn.BUILDSCORE, SortOrder.DESC);
        final HeroStats[] results = new HeroStats[CAPACITY];
        db.beginRun();
        db.setLiveResults(results, db.getResultsCounter());
        final HeroStats[] found = rows();
        System.arraycopy(found, 0, results, 0, found.length);

        db.setResultHeroes(results, found.length);

        assertArrayEquals(found, Arrays.copyOf(results, found.length));
    }

    private static void assertBestSoFarHonoursSortRequestedDuringRun(final Function<OptimizationDb, Run> mode) {
        final OptimizationDb db = new OptimizationDb();
        final Run run = started(mode, db);
        run.add(rows());

        db.sort(OptimizationColumn.ATK, SortOrder.DESC);

        assertEquals(BY_ATK_DESC.subList(0, 2), ids(db.getBestSoFar(2)));
    }

    @Test
    public void legacyBestSoFarHonoursSortRequestedDuringRun() {
        assertBestSoFarHonoursSortRequestedDuringRun(LegacyRun::new);
    }

    @Test
    public void keepBestNBestSoFarHonoursSortRequestedDuringRun() {
        assertBestSoFarHonoursSortRequestedDuringRun(KeepBestNRun::new);
    }

    // ── B14: sort changed after the run ─────────────────────────────────────────

    private static void assertSortColumnChangeAfterFinishApplies(final Function<OptimizationDb, Run> mode) {
        final OptimizationDb db = new OptimizationDb();
        db.sort(OptimizationColumn.BUILDSCORE, SortOrder.DESC);
        completeRun(mode, db, rows());

        db.sort(OptimizationColumn.ATK, SortOrder.DESC);
        assertEquals(BY_ATK_DESC, allRows(db));

        db.sort(OptimizationColumn.ATK, SortOrder.ASC);
        assertEquals(BY_ATK_ASC, allRows(db));

        db.sort(OptimizationColumn.BUILDSCORE, SortOrder.DESC);
        assertEquals(BY_BUILD_SCORE_DESC, allRows(db));
    }

    @Test
    public void legacySortColumnChangeAfterFinishApplies() {
        assertSortColumnChangeAfterFinishApplies(LegacyRun::new);
    }

    @Test
    public void keepBestNSortColumnChangeAfterFinishApplies() {
        assertSortColumnChangeAfterFinishApplies(KeepBestNRun::new);
    }

    // ── B14: nothing recorded, and null-sort fetches ────────────────────────────

    private static void assertNoRecordedSortServesBuildScoreDesc(final Function<OptimizationDb, Run> mode) {
        final OptimizationDb db = new OptimizationDb();
        completeRun(mode, db, rows());

        db.sort(null, null);
        assertEquals(BY_BUILD_SCORE_DESC, allRows(db));
    }

    @Test
    public void legacyFinishedRunDefaultsToBuildScoreDesc() {
        assertNoRecordedSortServesBuildScoreDesc(LegacyRun::new);
    }

    @Test
    public void keepBestNFinishedRunDefaultsToBuildScoreDesc() {
        assertNoRecordedSortServesBuildScoreDesc(KeepBestNRun::new);
    }

    private static void assertNullSortFetchKeepsRecordedSort(final Function<OptimizationDb, Run> mode) {
        final OptimizationDb db = new OptimizationDb();
        db.sort(OptimizationColumn.ATK, SortOrder.DESC);
        completeRun(mode, db, rows());

        db.sort(null, null);
        assertEquals(BY_ATK_DESC, allRows(db));
    }

    @Test
    public void legacyNullSortFetchKeepsRecordedSort() {
        assertNullSortFetchKeepsRecordedSort(LegacyRun::new);
    }

    @Test
    public void keepBestNNullSortFetchKeepsRecordedSort() {
        assertNullSortFetchKeepsRecordedSort(KeepBestNRun::new);
    }

    /** saveHeroResults caches the first 500 rows of a null-sort fetch. */
    private static void assertFirstFiveHundredAreTheTopRows(final Function<OptimizationDb, Run> mode) {
        final OptimizationDb db = new OptimizationDb();
        db.sort(OptimizationColumn.BUILDSCORE, SortOrder.DESC);
        // Ascending discovery, so the best 500 are the last ones found.
        final HeroStats[] found = IntStream.range(0, 800)
                .mapToObj(i -> build(String.valueOf(i), i, 0, 0, 0))
                .toArray(HeroStats[]::new);
        completeRun(mode, db, found);

        db.sort(null, null);
        final HeroStats[] saved = db.getRows(0, 500);

        final List<Integer> expected = new ArrayList<>();
        for (int score = 799; score >= 300; score--) {
            expected.add(score);
        }
        assertEquals(expected, Arrays.stream(saved).map(HeroStats::getBuildScore).collect(Collectors.toList()));
    }

    @Test
    public void legacyFirstFiveHundredRowsAreTheTopRows() {
        assertFirstFiveHundredAreTheTopRows(LegacyRun::new);
    }

    @Test
    public void keepBestNFirstFiveHundredRowsAreTheTopRows() {
        assertFirstFiveHundredAreTheTopRows(KeepBestNRun::new);
    }

    @Test
    public void keepBestNLiveRowsDefaultToBuildScoreDesc() {
        // The multi-hero grid sends a null sort until a column is clicked.
        final OptimizationDb db = new OptimizationDb();
        final Run run = started(KeepBestNRun::new, db);
        run.add(rows());

        db.sort(null, null);

        assertEquals(BY_BUILD_SCORE_DESC, allRows(db));
    }

    private static void assertBestSoFarDefaultsToBuildScoreDesc(final Function<OptimizationDb, Run> mode) {
        final OptimizationDb db = new OptimizationDb();
        final Run run = started(mode, db);
        run.add(rows());

        assertEquals(BY_BUILD_SCORE_DESC.subList(0, 2), ids(db.getBestSoFar(2)));
    }

    @Test
    public void legacyBestSoFarDefaultsToBuildScoreDesc() {
        assertBestSoFarDefaultsToBuildScoreDesc(LegacyRun::new);
    }

    @Test
    public void keepBestNBestSoFarDefaultsToBuildScoreDesc() {
        assertBestSoFarDefaultsToBuildScoreDesc(KeepBestNRun::new);
    }

    // ── B14: the finish itself ──────────────────────────────────────────────────

    private static void assertCancelledRunIsSorted(final Function<OptimizationDb, Run> mode) {
        final OptimizationDb db = new OptimizationDb();
        db.sort(OptimizationColumn.BUILDSCORE, SortOrder.DESC);
        final Run run = started(mode, db);
        run.add(rows());

        db.interrupt();
        run.finish();

        db.sort(OptimizationColumn.BUILDSCORE, SortOrder.DESC);
        assertEquals(BY_BUILD_SCORE_DESC, allRows(db));
    }

    @Test
    public void legacyCancelledRunIsSorted() {
        assertCancelledRunIsSorted(LegacyRun::new);
    }

    @Test
    public void keepBestNCancelledRunIsSorted() {
        assertCancelledRunIsSorted(KeepBestNRun::new);
    }

    private static void assertSpdEffWeightAppliesAtFinish(final Function<OptimizationDb, Run> mode) {
        final OptimizationDb db = new OptimizationDb();
        db.sort(OptimizationColumn.SPDEFF, SortOrder.DESC, 2.0d);
        completeRun(mode, db, rows());

        // spd + eff * 2: b 270, e 200, c 160, d 130, a 120.
        db.sort(OptimizationColumn.SPDEFF, SortOrder.DESC, 2.0d);
        assertEquals(List.of("b", "e", "c", "d", "a"), allRows(db));

        // A weight-only change must still re-sort: spd alone.
        db.sort(OptimizationColumn.SPDEFF, SortOrder.DESC, 0.0d);
        assertEquals(List.of("e", "d", "c", "b", "a"), allRows(db));
    }

    @Test
    public void legacySpdEffWeightAppliesAtFinish() {
        assertSpdEffWeightAppliesAtFinish(LegacyRun::new);
    }

    @Test
    public void keepBestNSpdEffWeightAppliesAtFinish() {
        assertSpdEffWeightAppliesAtFinish(KeepBestNRun::new);
    }

    @Test
    public void unwrittenSlotInTheResultArrayDoesNotBreakTheFinish() {
        final OptimizationDb db = new OptimizationDb();
        db.sort(OptimizationColumn.BUILDSCORE, SortOrder.DESC);
        final HeroStats[] found = rows();
        // A worker that took an index and failed before writing leaves a hole.
        final HeroStats[] withHole = { found[0], null, found[3] };
        db.beginRun();
        db.setLiveResults(withHole, db.getResultsCounter());

        db.setResultHeroes(withHole, withHole.length);

        assertEquals(2, db.getMaximum());
        assertEquals(List.of("d", "a"), allRows(db));
        // A later column change walks the whole array.
        db.sort(OptimizationColumn.ATK, SortOrder.ASC);
        assertEquals(List.of("d", "a"), allRows(db));
    }

    // ── B26: filtering ──────────────────────────────────────────────────────────

    private static OptimizationDb finishedDb() {
        final OptimizationDb db = new OptimizationDb();
        db.sort(OptimizationColumn.BUILDSCORE, SortOrder.DESC);
        completeRun(LegacyRun::new, db, rows());
        return db;
    }

    @Test
    public void zeroMatchFilterReturnsNoRows() {
        final OptimizationDb db = finishedDb();

        db.setFilteredIds(Set.of(), 0);

        assertEquals(0, db.getMaximum());
        assertEquals(0, db.getRows(0, CAPACITY).length);
    }

    @Test
    public void zeroMatchFilterLeavesNoRowForBestSoFarOrAnEdit() {
        final OptimizationDb db = finishedDb();

        db.setFilteredIds(Set.of(), 0);

        assertEquals(0, db.getBestSoFar(500).length);
        // handleEditResultRowsRequest fetches the single row it edits this way.
        assertEquals(0, db.getRows(0, 1).length);
    }

    @Test
    public void partialFilterServesOnlyMatchesAndFollowsLaterSorts() {
        final OptimizationDb db = finishedDb();

        db.setFilteredIds(Set.of("a", "c", "d"), 3);

        assertEquals(3, db.getMaximum());
        assertEquals(List.of("d", "c", "a"), allRows(db));
        db.sort(OptimizationColumn.ATK, SortOrder.ASC);
        assertEquals(List.of("d", "a", "c"), allRows(db));
    }

    @Test
    public void newResultsClearAZeroMatchFilter() {
        final OptimizationDb db = finishedDb();
        db.setFilteredIds(Set.of(), 0);

        completeRun(LegacyRun::new, db, rows());

        assertEquals(5, db.getMaximum());
        assertEquals(BY_BUILD_SCORE_DESC, allRows(db));
    }

    // ── B21: cancel ─────────────────────────────────────────────────────────────

    private static void assertCancelBeforeLiveStartSurvives(final Function<OptimizationDb, Run> mode) {
        final OptimizationDb db = new OptimizationDb();
        final Run run = mode.apply(db);
        db.beginRun();

        db.interrupt();
        run.goLive();

        assertTrue(db.isInterrupted());
        assertTrue(db.isDone());
    }

    @Test
    public void legacyCancelBeforeLiveStartSurvives() {
        assertCancelBeforeLiveStartSurvives(LegacyRun::new);
    }

    @Test
    public void keepBestNCancelBeforeLiveStartSurvives() {
        assertCancelBeforeLiveStartSurvives(KeepBestNRun::new);
    }

    /** prepareExecution has made the db, but the run request has not reached the handler. */
    private static void assertCancelBeforeRunBeginsSurvives(final Function<OptimizationDb, Run> mode) {
        final OptimizationDb db = new OptimizationDb();

        db.interrupt();
        started(mode, db);

        assertTrue(db.isInterrupted());
        assertTrue(db.isDone());
    }

    @Test
    public void legacyCancelBeforeRunBeginsSurvives() {
        assertCancelBeforeRunBeginsSurvives(LegacyRun::new);
    }

    @Test
    public void keepBestNCancelBeforeRunBeginsSurvives() {
        assertCancelBeforeRunBeginsSurvives(KeepBestNRun::new);
    }

    // ── B21: second run on the same db ──────────────────────────────────────────

    private static void assertSecondRunStartsClean(final Function<OptimizationDb, Run> mode) {
        final OptimizationDb db = new OptimizationDb();
        db.sort(OptimizationColumn.BUILDSCORE, SortOrder.DESC);
        final Run first = started(mode, db);
        first.add(rows());
        db.getSearchedCounter().set(1234);
        db.interrupt();
        first.finish();

        final HeroStats[] second = { build("x", 1, 0, 0, 0), build("y", 2, 0, 0, 0) };
        final Run run = started(mode, db);

        assertFalse(db.isInterrupted());
        assertFalse(db.isDone());
        assertEquals(0, db.getSearchedCounter().get());
        assertEquals(0, db.getResultsCounter().get());

        run.add(second);
        run.finish();

        assertEquals(2, db.getMaximum());
        assertEquals(List.of("y", "x"), allRows(db));
    }

    @Test
    public void legacySecondRunOnTheSameDbStartsClean() {
        assertSecondRunStartsClean(LegacyRun::new);
    }

    @Test
    public void keepBestNSecondRunOnTheSameDbStartsClean() {
        assertSecondRunStartsClean(KeepBestNRun::new);
    }

    // ── B34: a run that fails after going live ──────────────────────────────────

    private static void assertFailedRunPublishesWhatItFound(final Function<OptimizationDb, Run> mode) {
        final OptimizationDb db = new OptimizationDb();
        db.sort(OptimizationColumn.BUILDSCORE, SortOrder.DESC);
        final Run run = started(mode, db);
        run.add(rows());

        db.publishLiveSnapshot();

        assertFalse(db.isLive(), "the live references were left set");
        assertEquals(5, db.getMaximum());
        assertEquals(BY_BUILD_SCORE_DESC, allRows(db));
        // The db is usable again: a new sort now reorders the published rows.
        db.sort(OptimizationColumn.ATK, SortOrder.ASC);
        assertEquals(BY_ATK_ASC, allRows(db));
    }

    @Test
    public void legacyFailedRunPublishesWhatItFound() {
        assertFailedRunPublishesWhatItFound(LegacyRun::new);
    }

    @Test
    public void keepBestNFailedRunPublishesWhatItFound() {
        assertFailedRunPublishesWhatItFound(KeepBestNRun::new);
    }

    @Test
    public void legacyFailedRunDropsSlotsAWorkerNeverWrote() {
        final OptimizationDb db = new OptimizationDb();
        final HeroStats[] results = new HeroStats[CAPACITY];
        db.beginRun();
        db.setLiveResults(results, db.getResultsCounter());
        final HeroStats[] found = rows();
        results[0] = found[0];
        results[2] = found[2]; // slot 1 was claimed by a worker that died before writing
        db.getResultsCounter().set(3);

        db.publishLiveSnapshot();

        assertEquals(2, db.getMaximum());
        assertFalse(allRows(db).contains(null));
    }

    @Test
    public void publishingAnUnstartedRunChangesNothing() {
        final OptimizationDb db = new OptimizationDb();
        completeRun(LegacyRun::new, db, rows());

        db.publishLiveSnapshot();

        assertEquals(5, db.getMaximum());
        assertFalse(db.isLive());
    }

    private static void assertSecondRunCancelBeforeLiveStartSurvives(final Function<OptimizationDb, Run> mode) {
        final OptimizationDb db = new OptimizationDb();
        completeRun(mode, db, rows());
        final Run run = mode.apply(db);
        db.beginRun();

        db.interrupt();
        run.goLive();

        assertTrue(db.isInterrupted());
        assertTrue(db.isDone());
    }

    @Test
    public void legacySecondRunCancelBeforeLiveStartSurvives() {
        assertSecondRunCancelBeforeLiveStartSurvives(LegacyRun::new);
    }

    @Test
    public void keepBestNSecondRunCancelBeforeLiveStartSurvives() {
        assertSecondRunCancelBeforeLiveStartSurvives(KeepBestNRun::new);
    }
}

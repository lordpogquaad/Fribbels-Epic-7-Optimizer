package com.fribbels.db;

import com.fribbels.core.Sorter;
import com.fribbels.enums.OptimizationColumn;
import com.fribbels.enums.SortOrder;
import com.fribbels.model.HeroStats;
import org.apache.commons.lang3.ArrayUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Predicate;
import java.util.concurrent.atomic.AtomicLong;

public class OptimizationDb {

    private HeroStats[] resultHeroStats;
    private int[] filteredIndices;
    private Set<String> filteredIds;
    // The row count and the sort state are written under the lock and read without it by the
    // progress poll (getMaximum) and the best-so-far snapshot (sortSnapshot). Nothing in the
    // search loop reads them, so volatile costs the search nothing. Writers set them in an
    // order that never shows a reader a count that was not a real one.
    private volatile long maximum;
    private volatile long filteredMaximum;
    private volatile boolean filtered = false;

    private volatile OptimizationColumn column;
    private volatile SortOrder order;
    // Effectiveness weight for the SpdEff synthetic sort key (spd + eff*weight),
    // updated per getResultRows request so the server sort matches the displayed
    // column.
    private volatile double spdEffWeight = 0.5d;
    // Weight actually applied by the last in-place sort, so a weight-only change
    // (same column/order) still forces a re-sort.
    private double lastSortWeight = 0.5d;

    // Live streaming: set while optimization is in progress
    private volatile HeroStats[] liveArray = null;
    private volatile AtomicLong liveCounter = null;
    // Live streaming for keep-best-N mode (bounded top-N heap instead of an array).
    private volatile TopNResults liveTopN = null;

    // Per-execution progress counters (used instead of the shared handler fields)
    private final AtomicLong searchedCounter = new AtomicLong(0);
    private final AtomicLong resultsCounter = new AtomicLong(0);
    // Per-execution interrupt and completion flags
    private final AtomicBoolean interrupted = new AtomicBoolean(false);
    private volatile boolean done = false;
    // Whether a run has begun on this db, so beginRun can tell a cancel waiting for
    // the first run from the leftovers of a finished one.
    private boolean runBegun = false;

    public OptimizationDb() {
        resultHeroStats = new HeroStats[] {};
        filteredIndices = new int[] {};
        filteredIds = new HashSet<>();
        maximum = 0;
        filteredMaximum = 0;
        filtered = false;
    }

    // ── Per-execution progress ──────────────────────────────────────────────
    public AtomicLong getSearchedCounter() {
        return searchedCounter;
    }

    public AtomicLong getResultsCounter() {
        return resultsCounter;
    }

    /**
     * Result count for live progress: the bounded heap size in keep-best-N mode
     * (kept builds), otherwise the raw filter-passer counter.
     */
    public long getLiveResultsCount() {
        final TopNResults topN = liveTopN;
        if (topN != null) {
            return topN.size();
        }
        return resultsCounter.get();
    }

    // ── Per-execution interrupt ─────────────────────────────────────────────
    public boolean isInterrupted() {
        return interrupted.get();
    }

    public void interrupt() {
        interrupted.set(true);
        done = true;
    }

    // ── Completion flag ─────────────────────────────────────────────────────
    public boolean isDone() {
        return done;
    }

    public void setDone(final boolean done) {
        this.done = done;
    }

    /**
     * Called once as a run begins, before any of its work. A db normally serves one
     * run, and a cancel that landed before this call belongs to that run, so it is
     * kept. Only a db that already ran is reset: its flags and counters are the
     * previous run's. From here on a cancel sticks until the next beginRun.
     */
    public synchronized void beginRun() {
        if (runBegun) {
            interrupted.set(false);
            done = false;
            searchedCounter.set(0);
            resultsCounter.set(0);
        }
        runBegun = true;
    }

    /**
     * Enables live result streaming for a legacy run. Leaves the cancel state alone:
     * this point comes after item filtering and mod expansion, and a cancel that
     * landed during them still applies.
     */
    public synchronized void setLiveResults(final HeroStats[] arr, final AtomicLong counter) {
        liveArray = arr;
        liveCounter = counter;
        liveTopN = null;
    }

    /**
     * Enables live streaming for keep-best-N mode: the grid serves sorted snapshots
     * of the bounded top-N heap while the search runs. Leaves the cancel state alone,
     * as {@link #setLiveResults} does.
     */
    public synchronized void setLiveTopN(final TopNResults topN) {
        liveTopN = topN;
        liveArray = null;
        liveCounter = null;
    }

    /** True while a run's live references are set, that is, between going live and publishing. */
    public boolean isLive() {
        return liveTopN != null || liveArray != null;
    }

    /**
     * Publishes what a run that never reached {@link #setResultHeroes} had found, so a
     * failed run does not leave the live references set (where {@link #sort} only
     * records and the grid keeps serving a frozen snapshot). Does nothing when no run
     * is live. The results are whatever the workers had written, so they are partial.
     */
    public synchronized void publishLiveSnapshot() {
        final TopNResults topN = liveTopN;
        if (topN != null) {
            final HeroStats[] found = topN.toArray();
            setResultHeroes(found, found.length);
            return;
        }
        final HeroStats[] live = liveArray;
        final AtomicLong liveCount = liveCounter;
        if (live != null && liveCount != null) {
            setResultHeroes(live, Math.min(liveCount.get(), live.length));
        }
    }

    /** Clears the live streaming references (called when the run finishes). */
    public synchronized void clearLiveResults() {
        liveArray = null;
        liveCounter = null;
        liveTopN = null;
    }

    /**
     * Sorts a detached array by the recorded column/order, defaulting to buildScore
     * descending (the ranking keep-best-N retains by, and the grid's default) when no
     * sort has been chosen.
     */
    private void sortSnapshot(final HeroStats[] arr) {
        // One read of each, so a concurrent sort() cannot hand over a column and an order
        // from two different requests.
        final OptimizationColumn sortColumn = column;
        final SortOrder sortOrder = order;
        if (sortColumn != null && sortOrder != null) {
            Sorter.sortHeroes(arr, sortColumn, sortOrder, spdEffWeight);
        } else {
            Sorter.sortHeroes(arr, OptimizationColumn.BUILDSCORE, SortOrder.DESC);
        }
    }

    /**
     * Publishes a finished run. The results are sorted here, on a copy, because the
     * sort recorded before or during the run was never applied to them: the next
     * fetch asks for that same sort and {@link #sort} skips it as already done.
     * A slot a failed worker left unwritten is dropped, since it would break the sort.
     * The live references are cleared last so the unsynchronized {@link #getMaximum}
     * moves straight from the live count to the final one. The filtered count is left as it
     * was: a reader that read the flag before it dropped would otherwise return zero, and
     * every consumer of the count checks the flag first.
     */
    public synchronized void setResultHeroes(final HeroStats[] newResultHeroStats, final long newMaximum) {
        final HeroStats[] finished = Arrays.stream(ArrayUtils.subarray(newResultHeroStats, 0, (int) newMaximum))
                .filter(Objects::nonNull)
                .toArray(HeroStats[]::new);
        sortSnapshot(finished);
        lastSortWeight = spdEffWeight;

        resultHeroStats = finished;
        maximum = finished.length;
        filtered = false;
        filteredIds = new HashSet<>();
        filteredIndices = new int[] {};
        clearLiveResults();
    }

    /**
     * Filters the published rows by a predicate and records the result. The walk and the
     * recording happen under one hold of the lock, so a concurrent {@link #sort} cannot reorder
     * the rows while they are being read (B42, B36).
     */
    public synchronized void applyFilter(final Predicate<HeroStats> passes) {
        final Set<String> ids = new HashSet<>();
        int count = 0;
        for (final HeroStats row : resultHeroStats) {
            if (passes.test(row)) {
                ids.add(row.getId());
                count++;
            }
        }
        setFilteredIds(ids, count);
    }

    public synchronized void setFilteredIds(final Set<String> newFilteredIds, final int newFilteredMaximum) {
        // The count first, the flag last: getMaximum reads the flag, then the count.
        filteredIds = newFilteredIds;
        filteredMaximum = newFilteredMaximum;

        int count = 0;
        final int[] sortedFilteredIndices = new int[newFilteredMaximum];
        for (int i = 0; i < maximum; i++) {
            if (count >= sortedFilteredIndices.length)
                break;
            if (filteredIds.contains(resultHeroStats[i].getId())) {
                sortedFilteredIndices[count] = i;
                count++;
            }
        }

        filteredIndices = sortedFilteredIndices;
        filtered = true;
    }

    public synchronized HeroStats[] getRows(final int startRow, final int endRow) {
        // Keep-best-N live streaming: serve a sorted snapshot of the bounded heap.
        final TopNResults topN = liveTopN;
        if (topN != null) {
            final HeroStats[] arr = topN.toArray();
            sortSnapshot(arr);
            final int from = Math.max(0, startRow);
            final int to = Math.min(endRow, arr.length);
            if (from >= to) {
                return new HeroStats[0];
            }
            return Arrays.copyOfRange(arr, from, to);
        }

        // Live streaming: serve partial results directly from the in-progress array
        final HeroStats[] live = liveArray;
        final AtomicLong liveCount = liveCounter;
        if (live != null && liveCount != null) {
            final int safeBound = (int) Math.min(liveCount.get(), live.length);
            final List<HeroStats> liveResults = new ArrayList<>();
            for (int i = startRow; i < Math.min(endRow, safeBound); i++) {
                final HeroStats entry = live[i];
                if (entry != null) {
                    liveResults.add(entry);
                }
            }
            return liveResults.toArray(new HeroStats[0]);
        }

        if (!filtered) {
            return ArrayUtils.subarray(resultHeroStats, startRow, endRow);
        }

        final List<HeroStats> results = new ArrayList<>();
        for (int i = startRow; i < endRow; i++) {
            if (i >= filteredIndices.length) {
                break;
            }
            final int index = filteredIndices[i];
            final HeroStats heroStats = resultHeroStats[index];
            results.add(heroStats);
        }

        final HeroStats[] resultsArray = new HeroStats[results.size()];
        return results.toArray(resultsArray);
    }

    /**
     * Returns the best results found so far, in the recorded sort or buildScore
     * descending when none is recorded.
     * Safe to call at any time: reads from the live array if optimization is
     * still running, or from the finalised result set if it has completed or
     * been cancelled. Never mutates any internal state.
     */
    public HeroStats[] getBestSoFar(final int limit) {
        // Keep-best-N mode: snapshot the bounded heap, sorted.
        final TopNResults topN = liveTopN;
        if (topN != null) {
            final HeroStats[] arr = topN.toArray();
            sortSnapshot(arr);
            final int count = Math.min(limit, arr.length);
            return Arrays.copyOf(arr, count);
        }

        final HeroStats[] live = liveArray;
        final AtomicLong liveCount = liveCounter;
        if (live != null && liveCount != null) {
            final int safeBound = (int) Math.min(liveCount.get(), live.length);
            final List<HeroStats> results = new ArrayList<>();
            for (int i = 0; i < safeBound; i++) {
                final HeroStats entry = live[i];
                if (entry != null) {
                    results.add(entry);
                }
            }
            final HeroStats[] arr = results.toArray(new HeroStats[0]);
            sortSnapshot(arr);
            final int count = Math.min(limit, arr.length);
            return Arrays.copyOf(arr, count);
        }
        return getRows(0, limit);
    }

    public synchronized HeroStats[] getAllHeroStats() {
        return resultHeroStats;
    }

    public long getMaximum() {
        // During a live run, report the live result count so the grid row count updates
        // progressively
        final TopNResults topN = liveTopN;
        if (topN != null) {
            return topN.size();
        }
        final AtomicLong liveCount = liveCounter;
        if (liveArray != null && liveCount != null) {
            return liveCount.get();
        }
        if (filtered)
            return filteredMaximum;
        return maximum;
    }

    public synchronized void sort(final OptimizationColumn newColumn, final SortOrder newOrder,
            final double newSpdEffWeight) {
        spdEffWeight = newSpdEffWeight;
        sort(newColumn, newOrder);
    }

    public synchronized void sort(final OptimizationColumn newColumn, final SortOrder newOrder) {
        // Never sort in place while a run is live: the legacy array is still being
        // written. Just record the requested order for the snapshots and for
        // setResultHeroes, which applies it when the run finishes.
        if (liveTopN != null || liveArray != null) {
            if (newColumn != null && newOrder != null) {
                column = newColumn;
                order = newOrder;
            }
            return;
        }
        // Re-sort when column/order changed, OR (for the weight-sensitive SpdEff
        // column) the effectiveness weight changed since the last in-place sort.
        final boolean sameSort = newColumn == column && newOrder == order
                && (newColumn != OptimizationColumn.SPDEFF || spdEffWeight == lastSortWeight);
        if (newColumn == null || newOrder == null || sameSort) {
            return;
        }

        Sorter.sortHeroes(resultHeroStats, newColumn, newOrder, spdEffWeight);
        lastSortWeight = spdEffWeight;

        int count = 0;
        final int[] sortedFilteredIndices = new int[filtered ? (int) filteredMaximum : 0];
        for (int i = 0; i < maximum; i++) {
            if (count >= sortedFilteredIndices.length)
                break; // safety: filteredMaximum was exact when set
            if (filteredIds.contains(resultHeroStats[i].getId())) {
                sortedFilteredIndices[count] = i;
                count++;
            }
        }

        filteredIndices = sortedFilteredIndices;

        column = newColumn;
        order = newOrder;
    }
}

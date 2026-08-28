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
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

public class OptimizationDb {

    private HeroStats[] resultHeroStats;
    private int[] filteredIndices;
    private Set<String> filteredIds;
    private long maximum;
    private long filteredMaximum;
    private boolean filtered = false;

    private OptimizationColumn column;
    private SortOrder order;
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
     * Called at the start of an optimization run to enable live result streaming.
     */
    public synchronized void setLiveResults(final HeroStats[] arr, final AtomicLong counter) {
        interrupted.set(false);
        done = false;
        liveArray = arr;
        liveCounter = counter;
        liveTopN = null;
    }

    /**
     * Enables live streaming for keep-best-N mode: the grid serves sorted snapshots
     * of the bounded top-N heap while the search runs.
     */
    public synchronized void setLiveTopN(final TopNResults topN) {
        interrupted.set(false);
        done = false;
        liveTopN = topN;
        liveArray = null;
        liveCounter = null;
    }

    /** Clears the live streaming references (called when the run finishes). */
    public synchronized void clearLiveResults() {
        liveArray = null;
        liveCounter = null;
        liveTopN = null;
    }

    /**
     * Sorts a detached snapshot array by the current grid column/order, defaulting
     * to
     * priority descending (the headline ranking) when no sort has been chosen.
     */
    private void sortSnapshot(final HeroStats[] arr) {
        if (column != null && order != null) {
            Sorter.sortHeroes(arr, column, order, spdEffWeight);
        } else {
            Arrays.sort(arr, (a, b) -> Integer.compare(b.getPriority(), a.getPriority()));
        }
    }

    public void setResultHeroes(final HeroStats[] newResultHeroStats, final long newMaximum) {
        clearLiveResults();
        resultHeroStats = ArrayUtils.subarray(newResultHeroStats, 0, (int) newMaximum);
        maximum = newMaximum;
        filteredMaximum = 0;
        filteredIds = new HashSet<>();
        filteredIndices = new int[] {};
        filtered = false;
    }

    public void setFilteredIds(final Set<String> newFilteredIds, final int newFilteredMaximum) {
        filtered = true;
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

        if (filteredIds.size() == 0) {
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
     * Returns the best results found so far, sorted descending by score.
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
            if (column != null && order != null) {
                Sorter.sortHeroes(arr, column, order, spdEffWeight);
            } else {
                Arrays.sort(arr, (a, b) -> Integer.compare(b.getScore(), a.getScore()));
            }
            final int count = Math.min(limit, arr.length);
            return Arrays.copyOf(arr, count);
        }
        return getRows(0, limit);
    }

    public HeroStats[] getAllHeroStats() {
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
        // Keep-best-N live: the heap is the source of truth — just record the requested
        // order so getRows' snapshot honors it; don't sort anything in place.
        if (liveTopN != null) {
            if (newColumn != null && newOrder != null) {
                column = newColumn;
                order = newOrder;
            }
            return;
        }
        // Never sort in-place while the optimization run is still writing into the
        // array
        if (liveArray != null) {
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
        final int[] sortedFilteredIndices = new int[(int) filteredMaximum];
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

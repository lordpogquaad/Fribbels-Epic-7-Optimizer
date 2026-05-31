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

    // Live streaming: set while optimization is in progress
    private volatile HeroStats[] liveArray = null;
    private volatile AtomicLong liveCounter = null;

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
    public AtomicLong getSearchedCounter() { return searchedCounter; }
    public AtomicLong getResultsCounter()  { return resultsCounter; }

    // ── Per-execution interrupt ─────────────────────────────────────────────
    public boolean isInterrupted() { return interrupted.get(); }
    public void interrupt()        { interrupted.set(true); done = true; }

    // ── Completion flag ─────────────────────────────────────────────────────
    public boolean isDone()            { return done; }
    public void    setDone(boolean v)  { done = v; }

    /** Called at the start of an optimization run to enable live result streaming. */
    public void setLiveResults(final HeroStats[] arr, final AtomicLong counter) {
        liveArray = arr;
        liveCounter = counter;
    }

    /** Clears the live streaming references (called when the run finishes). */
    public void clearLiveResults() {
        liveArray = null;
        liveCounter = null;
    }

    public void setResultHeroes(final HeroStats[] newResultHeroStats, final long newMaximum) {
        clearLiveResults();
        resultHeroStats = ArrayUtils.subarray(newResultHeroStats, 0, Integer.parseInt(String.valueOf(newMaximum)));
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
            if (filteredIds.contains(resultHeroStats[i].getId())) {
                sortedFilteredIndices[count] = i;
                count++;
            }
        }

        filteredIndices = sortedFilteredIndices;
    }

    public HeroStats[] getRows(final int startRow, final int endRow) {
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

        // System.out.println("Filtered indices.length " + filteredIndices.length);
        // System.out.println("FilteredIds size " + filteredIds.size());

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
     * been cancelled.  Never mutates any internal state.
     */
    public HeroStats[] getBestSoFar(final int limit) {
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
                Sorter.sortHeroes(arr, column, order);
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
        // During a live run, report the live result count so the grid row count updates progressively
        final AtomicLong liveCount = liveCounter;
        if (liveArray != null && liveCount != null) {
            return liveCount.get();
        }
        if (filtered)
            return filteredMaximum;
        return maximum;
    }

    public void sort(final OptimizationColumn newColumn, final SortOrder newOrder) {
        // Never sort in-place while the optimization run is still writing into the array
        if (liveArray != null) {
            return;
        }
        if (newColumn == null || newOrder == null || (newColumn == column && newOrder == order)) {
            return;
        }

        // System.out.println("START SORT");
        Sorter.sortHeroes(resultHeroStats, newColumn, newOrder);

        int count = 0;
        final int[] sortedFilteredIndices = new int[Integer.parseInt(String.valueOf(maximum))];
        for (int i = 0; i < maximum; i++) {
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

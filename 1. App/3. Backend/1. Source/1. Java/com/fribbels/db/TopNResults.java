package com.fribbels.db;

import com.fribbels.model.HeroStats;

import java.util.Comparator;
import java.util.PriorityQueue;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Thread-safe bounded "keep best N by buildScore" collector.
 *
 * <p>
 * Backs the optimizer's "scan everything, keep the best N" mode: instead of a
 * pre-allocated array that fills and hard-stops the search, this keeps a
 * fixed-size
 * min-heap (smallest buildScore on top) of capacity N. When full, a new build
 * only
 * enters if its buildScore beats the current weakest kept build, which is then
 * evicted
 * — so memory stays bounded at N regardless of how many trillions of
 * permutations
 * are scanned, and the search never has to stop early.
 *
 * <p>
 * <b>Concurrency:</b> both optimizer loops are parallel (GPU = a small
 * executor,
 * CPU = ForkJoinPool). A single shared heap guarded by a {@link ReentrantLock}
 * is
 * used rather than per-thread heaps (which would cost threads&times;N memory
 * and
 * reintroduce the OOM the feature exists to prevent). A lock-free
 * {@code volatile}
 * {@link #threshold} (the N-th-best buildScore once full) lets {@link #offer}
 * reject
 * sub-threshold builds with a single read, so the lock is taken only by builds
 * that
 * can actually enter the top N.
 */
public final class TopNResults {

    private final int capacity;
    private final PriorityQueue<HeroStats> heap; // min-heap: weakest (lowest buildScore) on top
    private final ReentrantLock lock = new ReentrantLock();

    /**
     * The current N-th-best buildScore once the heap is full;
     * {@link Long#MIN_VALUE}
     * during warm-up so every build is accepted until capacity is reached. Only
     * ever
     * rises. Read lock-free by {@link #offer}.
     */
    private volatile long threshold = Long.MIN_VALUE;

    public TopNResults(final int capacity) {
        this.capacity = Math.max(1, capacity);
        // Grow lazily — don't eagerly allocate an N-slot backing array.
        // Retention basis is buildScore (the faithful per-slot/per-set +
        // target-weighted
        // ranking score), so the heap keeps the best N builds the user actually ranks
        // by.
        this.heap = new PriorityQueue<>(
                Math.min(this.capacity, 1 << 16),
                Comparator.comparingInt(HeroStats::getBuildScore));
    }

    /**
     * Offer a fully-built, filter-passing build. Thread-safe. The heap retains it
     * only
     * if there is room or it beats the current weakest kept build (strict {@code >}
     * —
     * ties keep the first-found build and never churn the heap).
     */
    public void offer(final HeroStats hs) {
        final long p = hs.getBuildScore();
        if (p <= threshold) {
            // Fast reject. (threshold == MIN_VALUE during warm-up, so this never
            // triggers before the heap is full.)
            return;
        }
        lock.lock();
        try {
            if (heap.size() < capacity) {
                heap.add(hs);
                if (heap.size() == capacity) {
                    threshold = heap.peek().getBuildScore(); // armed: heap is now full
                }
            } else if (p > heap.peek().getBuildScore()) {
                heap.poll(); // evict the weakest
                heap.add(hs);
                threshold = heap.peek().getBuildScore(); // threshold only rises
            }
        } finally {
            lock.unlock();
        }
    }

    public int size() {
        lock.lock();
        try {
            return heap.size();
        } finally {
            lock.unlock();
        }
    }

    /** Snapshot of the current contents in heap (unsorted) order. Safe mid-run. */
    public HeroStats[] toArray() {
        lock.lock();
        try {
            return heap.toArray(new HeroStats[0]);
        } finally {
            lock.unlock();
        }
    }
}

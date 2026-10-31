package com.fribbels.handler;

import com.fribbels.db.OptimizationDb;
import com.fribbels.model.HeroStats;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins the cross-thread publication of state written on one HTTP thread and read on another (B40).
 * A visibility fix cannot be proven by timing, so the fields are pinned by modifier; the one
 * ordering rule that can be observed, how the row count moves through a publish and a filter
 * change, is checked by a reader thread.
 *
 * <p>None of these fields is read per permutation: the settings are read once per run and the
 * db fields once per grid or progress request, so volatile costs the search loop nothing.
 */
public class SharedStateVisibilityTest {

    private static boolean isVolatile(final Class<?> owner, final String name) throws NoSuchFieldException {
        final Field field = owner.getDeclaredField(name);
        return Modifier.isVolatile(field.getModifiers());
    }

    @Test
    public void handlerSettingsWrittenOnTheHttpThreadAreVolatile() throws NoSuchFieldException {
        for (final String name : List.of("SETTING_GPU", "SETTING_MAXIMUM_RESULTS", "SETTING_MAX_PERMUTATIONS")) {
            assertTrue(isVolatile(OptimizationRequestHandler.class, name), name);
        }
        assertTrue(isVolatile(HeroesRequestHandler.class, "SETTING_UNLOCK_ON_UNEQUIP"));
    }

    @Test
    public void rowCountAndSortStateReadWithoutTheLockAreVolatile() throws NoSuchFieldException {
        for (final String name : List.of("maximum", "filteredMaximum", "filtered", "column", "order")) {
            assertTrue(isVolatile(OptimizationDb.class, name), name);
        }
    }

    private static HeroStats row(final String id) {
        final HeroStats row = new HeroStats();
        row.setId(id);
        return row;
    }

    /**
     * getMaximum is read without the lock, so every value it can return while the db is being
     * published or filtered must be a real count: the whole set or the filtered one, never the
     * zero a half-written publish would leave behind.
     */
    @Test
    public void rowCountIsAlwaysARealCountWhilePublishingAndFiltering() throws InterruptedException {
        final int total = 6;
        final int filteredCount = 3;
        final Set<String> keep = new HashSet<>(List.of("a", "b", "c"));
        final HeroStats[] results = { row("a"), row("b"), row("c"), row("d"), row("e"), row("f") };

        final OptimizationDb db = new OptimizationDb();
        db.setResultHeroes(results.clone(), total);

        final AtomicBoolean stop = new AtomicBoolean(false);
        final AtomicLong bad = new AtomicLong();
        final AtomicLong badValue = new AtomicLong(-1);
        final Thread reader = new Thread(() -> {
            while (!stop.get()) {
                final long seen = db.getMaximum();
                if (seen != total && seen != filteredCount) {
                    bad.incrementAndGet();
                    badValue.set(seen);
                }
            }
        });
        reader.start();
        try {
            for (int i = 0; i < 20_000; i++) {
                db.setFilteredIds(keep, filteredCount);
                db.setResultHeroes(results.clone(), total);
            }
        } finally {
            stop.set(true);
            reader.join(10_000);
        }

        assertEquals(0, bad.get(), "getMaximum returned " + badValue.get() + " during a publish or filter change");
    }
}

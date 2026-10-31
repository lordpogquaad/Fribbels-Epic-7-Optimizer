package com.fribbels.handler;

import com.fribbels.db.BaseStatsDb;
import com.fribbels.db.HeroDb;
import com.fribbels.db.ItemDb;
import com.fribbels.db.OptimizationDb;
import com.fribbels.enums.OptimizationColumn;
import com.fribbels.enums.SortOrder;
import com.fribbels.model.HeroStats;
import com.fribbels.request.OptimizationRequest;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * A filter request walks a finished run's rows while a sort request can reorder those same rows
 * in place (B42, B36). The filtered set must be exactly the rows that pass, whatever the order
 * the sorts leave them in.
 */
public class FilterSortRaceTest {

    private static final int ROWS = 200_000;
    private static final int THRESHOLD = ROWS / 2;

    /** A request that every row passes: each min limit at the bottom, each max at the top. */
    private static OptimizationRequest passEverything() throws IllegalAccessException {
        final OptimizationRequest request = new OptimizationRequest();
        for (final Field field : OptimizationRequest.class.getDeclaredFields()) {
            final String name = field.getName();
            if (field.getType() != int.class || Modifier.isStatic(field.getModifiers())
                    || !name.startsWith("input") || !name.endsWith("Limit")) {
                continue;
            }
            field.setAccessible(true);
            if (name.contains("Min")) {
                field.setInt(request, Integer.MIN_VALUE);
            } else if (name.contains("Max")) {
                field.setInt(request, Integer.MAX_VALUE);
            }
        }
        return request;
    }

    @SuppressWarnings("unchecked")
    private static OptimizationDb registerDb(final OptimizationRequestHandler handler, final String executionId)
            throws ReflectiveOperationException {
        final Field field = OptimizationRequestHandler.class.getDeclaredField("optimizationDbs");
        field.setAccessible(true);
        final Map<String, OptimizationDb> dbs = (Map<String, OptimizationDb>) field.get(handler);
        final OptimizationDb db = new OptimizationDb();
        dbs.put(executionId, db);
        return db;
    }

    @Test
    public void filteredSetIsExactWhileSortsReorderTheRows() throws Exception {
        final BaseStatsDb baseStatsDb = new BaseStatsDb();
        final HeroDb heroDb = new HeroDb(baseStatsDb);
        final OptimizationRequestHandler handler = new OptimizationRequestHandler(baseStatsDb, heroDb,
                new ItemDb(heroDb));
        final OptimizationDb db = registerDb(handler, "run1");

        final HeroStats[] rows = new HeroStats[ROWS];
        for (int i = 0; i < ROWS; i++) {
            final HeroStats row = new HeroStats();
            row.setId("r" + i);
            row.setAtk(i);
            row.setItems(List.of());
            rows[i] = row;
        }
        db.setResultHeroes(rows, ROWS);

        final OptimizationRequest request = passEverything();
        request.setExecutionId("run1");
        request.setNoSave(true);
        request.setInputAtkMinLimit(THRESHOLD);

        final AtomicBoolean stop = new AtomicBoolean(false);
        final Thread sorter = new Thread(() -> {
            boolean asc = true;
            while (!stop.get()) {
                db.sort(OptimizationColumn.ATK, asc ? SortOrder.ASC : SortOrder.DESC);
                db.sort(OptimizationColumn.SPD, SortOrder.ASC); // all ties: a different order again
                asc = !asc;
            }
        });
        sorter.start();
        final List<Long> counts = new ArrayList<>();
        try {
            for (int i = 0; i < 40; i++) {
                handler.handleOptimizationFilterRequest(request);
                counts.add(db.getMaximum());
            }
        } finally {
            stop.set(true);
            sorter.join(20_000);
        }

        final long wrong = counts.stream().filter(c -> c != ROWS - THRESHOLD).count();
        assertEquals(0, wrong, "every filter must find exactly " + (ROWS - THRESHOLD) + " rows, saw " + counts);
        assertTrue(counts.size() == 40);
    }
}

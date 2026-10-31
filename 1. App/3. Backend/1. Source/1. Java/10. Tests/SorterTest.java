package com.fribbels.core;

import com.fribbels.enums.OptimizationColumn;
import com.fribbels.enums.SortOrder;
import com.fribbels.model.HeroStats;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.function.ObjIntConsumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins {@link Sorter}, which orders every result grid: each column the grid can request, in both
 * directions, plus the two columns that are not a plain field.
 */
public class SorterTest {

    /** The HeroStats field that decides each column's order. Every column must have an entry. */
    private static final Map<OptimizationColumn, ObjIntConsumer<HeroStats>> FIELD_OF = new EnumMap<>(
            OptimizationColumn.class);

    static {
        FIELD_OF.put(OptimizationColumn.ATK, HeroStats::setAtk);
        FIELD_OF.put(OptimizationColumn.HP, HeroStats::setHp);
        FIELD_OF.put(OptimizationColumn.DEF, HeroStats::setDef);
        FIELD_OF.put(OptimizationColumn.SPD, HeroStats::setSpd);
        FIELD_OF.put(OptimizationColumn.CR, HeroStats::setCr);
        FIELD_OF.put(OptimizationColumn.CD, HeroStats::setCd);
        FIELD_OF.put(OptimizationColumn.EFF, HeroStats::setEff);
        FIELD_OF.put(OptimizationColumn.RES, HeroStats::setRes);
        FIELD_OF.put(OptimizationColumn.DAC, HeroStats::setDac);
        FIELD_OF.put(OptimizationColumn.CP, HeroStats::setCp);
        FIELD_OF.put(OptimizationColumn.HPPS, HeroStats::setHpps);
        FIELD_OF.put(OptimizationColumn.EHP, HeroStats::setEhp);
        FIELD_OF.put(OptimizationColumn.EHPPS, HeroStats::setEhpps);
        FIELD_OF.put(OptimizationColumn.DMG, HeroStats::setDmg);
        FIELD_OF.put(OptimizationColumn.DMGPS, HeroStats::setDmgps);
        FIELD_OF.put(OptimizationColumn.MCDMG, HeroStats::setMcdmg);
        FIELD_OF.put(OptimizationColumn.MCDMGPS, HeroStats::setMcdmgps);
        FIELD_OF.put(OptimizationColumn.DMGH, HeroStats::setDmgh);
        FIELD_OF.put(OptimizationColumn.DMGD, HeroStats::setDmgd);
        FIELD_OF.put(OptimizationColumn.HMCDMGS, HeroStats::setHmcdmgs);
        FIELD_OF.put(OptimizationColumn.DMCDMGS, HeroStats::setDmcdmgs);
        FIELD_OF.put(OptimizationColumn.HDMG, HeroStats::setHdmg);
        FIELD_OF.put(OptimizationColumn.HDMGS, HeroStats::setHdmgs);
        FIELD_OF.put(OptimizationColumn.DDMG, HeroStats::setDdmg);
        FIELD_OF.put(OptimizationColumn.DDMGS, HeroStats::setDdmgs);
        FIELD_OF.put(OptimizationColumn.S1, HeroStats::setS1);
        FIELD_OF.put(OptimizationColumn.S2, HeroStats::setS2);
        FIELD_OF.put(OptimizationColumn.S3, HeroStats::setS3);
        FIELD_OF.put(OptimizationColumn.UPGRADES, HeroStats::setUpgrades);
        FIELD_OF.put(OptimizationColumn.CONVERSIONS, HeroStats::setConversions);
        FIELD_OF.put(OptimizationColumn.EQ, HeroStats::setEq);
        FIELD_OF.put(OptimizationColumn.SCORE, HeroStats::setScore);
        FIELD_OF.put(OptimizationColumn.BS, HeroStats::setBs);
        FIELD_OF.put(OptimizationColumn.PRIORITY, HeroStats::setPriority);
        FIELD_OF.put(OptimizationColumn.CUSTOMSCORE, HeroStats::setCustomScore);
        FIELD_OF.put(OptimizationColumn.BUILDSCORE, HeroStats::setBuildScore);
        // Final speed sorts by spd, and spdEff by spd + eff * weight; both are checked below.
        FIELD_OF.put(OptimizationColumn.FINALSPEED, HeroStats::setSpd);
    }

    /** Three rows whose only difference, for the column under test, is the id order of their values. */
    private static HeroStats[] rowsDiffering(final ObjIntConsumer<HeroStats> field) {
        final HeroStats low = new HeroStats();
        final HeroStats mid = new HeroStats();
        final HeroStats high = new HeroStats();
        low.setId("low");
        mid.setId("mid");
        high.setId("high");
        field.accept(low, 10);
        field.accept(mid, 20);
        field.accept(high, 30);
        // Handed over in neither order, so an untouched array fails both directions.
        return new HeroStats[] { mid, high, low };
    }

    private static List<String> ids(final HeroStats[] rows) {
        return Arrays.stream(rows).map(HeroStats::getId).toList();
    }

    @Test
    public void everyColumnHasAFieldMappingOrIsSpdEff() {
        final List<OptimizationColumn> unmapped = new ArrayList<>(Arrays.asList(OptimizationColumn.values()));
        unmapped.removeAll(FIELD_OF.keySet());
        assertEquals(List.of(OptimizationColumn.SPDEFF), unmapped,
                "a new column needs an entry here, and a case in Sorter");
    }

    @Test
    public void everyColumnSortsAscendingAndDescending() {
        // Every column is checked before the test fails, so one wrong column names itself
        // and a second wrong one is not hidden behind it.
        final List<String> wrong = new ArrayList<>();
        for (final Map.Entry<OptimizationColumn, ObjIntConsumer<HeroStats>> entry : FIELD_OF.entrySet()) {
            final OptimizationColumn column = entry.getKey();

            final HeroStats[] asc = rowsDiffering(entry.getValue());
            Sorter.sortHeroes(asc, column, SortOrder.ASC);
            if (!List.of("low", "mid", "high").equals(ids(asc))) {
                wrong.add(column + " ASC gave " + ids(asc));
            }

            final HeroStats[] desc = rowsDiffering(entry.getValue());
            Sorter.sortHeroes(desc, column, SortOrder.DESC);
            if (!List.of("high", "mid", "low").equals(ids(desc))) {
                wrong.add(column + " DESC gave " + ids(desc));
            }
        }
        assertEquals(List.of(), wrong);
    }

    @Test
    public void everyColumnSortsOnlyByItsOwnField() {
        // Rows that differ in a different field must keep their handed-over order: a column that
        // read the wrong getter would reorder them. Sorting is stable, so ties keep input order.
        for (final OptimizationColumn column : FIELD_OF.keySet()) {
            final ObjIntConsumer<HeroStats> other = column == OptimizationColumn.ATK ? HeroStats::setHp
                    : HeroStats::setAtk;
            final HeroStats[] rows = rowsDiffering(other);
            final List<String> before = ids(rows);
            Sorter.sortHeroes(rows, column, SortOrder.ASC);
            assertEquals(before, ids(rows), column + " must ignore a field that is not its own");
        }
    }

    @Test
    public void spdEffUsesTheWeight() {
        // a: spd 100, eff 0 -> 100 at any weight. b: spd 50, eff 100 -> 100 at weight 0.5,
        // 50 at weight 0, 150 at weight 1.
        final HeroStats a = new HeroStats();
        a.setId("a");
        a.setSpd(100);
        final HeroStats b = new HeroStats();
        b.setId("b");
        b.setSpd(50);
        b.setEff(100);

        final HeroStats[] weightZero = { b, a };
        Sorter.sortHeroes(weightZero, OptimizationColumn.SPDEFF, SortOrder.DESC, 0d);
        assertEquals(List.of("a", "b"), ids(weightZero));

        final HeroStats[] weightOne = { a, b };
        Sorter.sortHeroes(weightOne, OptimizationColumn.SPDEFF, SortOrder.DESC, 1d);
        assertEquals(List.of("b", "a"), ids(weightOne));
    }

    @Test
    public void spdEffWithoutAWeightUsesHalf() {
        final HeroStats a = new HeroStats();
        a.setId("a");
        a.setSpd(100);
        final HeroStats b = new HeroStats();
        b.setId("b");
        b.setSpd(50);
        b.setEff(200);

        final HeroStats[] rows = { a, b };
        Sorter.sortHeroes(rows, OptimizationColumn.SPDEFF, SortOrder.DESC);
        assertEquals(List.of("b", "a"), ids(rows), "50 + 200 * 0.5 = 150 beats 100");
    }

    @Test
    public void descendingKeepsTiedRowsInDiscoveryOrder() {
        final HeroStats first = new HeroStats();
        first.setId("first");
        first.setAtk(5);
        final HeroStats second = new HeroStats();
        second.setId("second");
        second.setAtk(5);
        final HeroStats best = new HeroStats();
        best.setId("best");
        best.setAtk(9);

        final HeroStats[] rows = { first, second, best };
        Sorter.sortHeroes(rows, OptimizationColumn.ATK, SortOrder.DESC);
        assertEquals(List.of("best", "first", "second"), ids(rows));
    }

    @Test
    public void emptyAndSingleRowArraysAreLeftAlone() {
        Sorter.sortHeroes(new HeroStats[0], OptimizationColumn.ATK, SortOrder.ASC);
        final HeroStats only = new HeroStats();
        final HeroStats[] one = { only };
        Sorter.sortHeroes(one, OptimizationColumn.ATK, SortOrder.DESC);
        assertTrue(one[0] == only);
    }

    // B27 reports this, it does not change it: a null order prints to stderr and leaves the
    // array as it was, so a bad request shows an unsorted grid with no error to the caller.
    @Test
    public void nullOrderLeavesTheArrayUnsorted() {
        final HeroStats[] rows = rowsDiffering(HeroStats::setAtk);
        final List<String> before = ids(rows);
        Sorter.sortHeroes(rows, OptimizationColumn.ATK, null);
        assertEquals(before, ids(rows));
    }
}

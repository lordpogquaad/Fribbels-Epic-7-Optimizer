package com.fribbels.core;

import com.fribbels.db.TopNResults;
import com.fribbels.enums.OptimizationColumn;
import com.fribbels.enums.SortOrder;
import com.fribbels.model.Hero;
import com.fribbels.model.HeroStats;
import com.fribbels.request.OptimizationRequest;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Validates the reworked ranking basis: builds are ranked, retained
 * (keep-best-N),
 * and computed by the faithful {@code buildScore} (per-slot/per-set-weighted
 * gear
 * value, carried as Σ(item.priorityScore) ×100, plus a build-level stat-target
 * bonus)
 * rather than the legacy Σ(rounded item.priority).
 */
public class BuildScoreRankingTest {

    // ── Sorter ranks by buildScore ──────────────────────────────────────────────
    @Test
    public void sorterOrdersByBuildScore() {
        final HeroStats a = HeroStats.builder().buildScore(10).priority(999).build();
        final HeroStats b = HeroStats.builder().buildScore(50).priority(1).build();
        final HeroStats c = HeroStats.builder().buildScore(30).priority(500).build();
        final HeroStats[] data = new HeroStats[] { a, b, c };

        Sorter.sortHeroes(data, OptimizationColumn.BUILDSCORE, SortOrder.DESC);
        assertEquals(50, data[0].getBuildScore());
        assertEquals(30, data[1].getBuildScore());
        assertEquals(10, data[2].getBuildScore());

        Sorter.sortHeroes(data, OptimizationColumn.BUILDSCORE, SortOrder.ASC);
        assertEquals(10, data[0].getBuildScore());
        assertEquals(50, data[2].getBuildScore());
    }

    // ── Keep-best-N retains the top N by buildScore (NOT by priority) ────────────
    @Test
    public void topNRetainsHighestBuildScores() {
        final TopNResults topN = new TopNResults(3);
        // priority is deliberately anti-correlated with buildScore to prove the heap
        // now keys on buildScore, not the legacy priority sum.
        topN.offer(HeroStats.builder().buildScore(10).priority(900).build());
        topN.offer(HeroStats.builder().buildScore(50).priority(100).build());
        topN.offer(HeroStats.builder().buildScore(30).priority(700).build());
        topN.offer(HeroStats.builder().buildScore(40).priority(200).build());
        topN.offer(HeroStats.builder().buildScore(20).priority(800).build());

        final Set<Integer> kept = new HashSet<>();
        for (final HeroStats hs : topN.toArray()) {
            kept.add(hs.getBuildScore());
        }
        assertEquals(3, kept.size());
        assertTrue(kept.contains(50));
        assertTrue(kept.contains(40));
        assertTrue(kept.contains(30));
        assertFalse(kept.contains(20));
        assertFalse(kept.contains(10));
    }

    // ── StatCalculator.buildScore = Σ(priorityScore) + round(targetBonus×100) ────
    private HeroStats computeBuild(final OptimizationRequest request, final int weightedScore) {
        final HeroStats base = HeroStats.builder()
                .atk(1000).hp(5000).def(500).cr(15).cd(150).eff(0).res(0).spd(100).build();
        final Hero hero = Hero.builder().build();

        final StatCalculator sc = new StatCalculator();
        sc.setBaseValues(base, hero);
        sc.setPriorityWeights(request);
        sc.setTargets(request);

        // All-zero accumulators except +50 raw speed on the first slot, so the build's
        // final speed is exactly base.spd(100) + 50 = 150 with no set bonuses.
        final float[][] accs = new float[6][15];
        accs[0][10] = 50f; // index 10 = SPD accumulator
        final int[] sets = new int[40]; // no completed sets

        return sc.addAccumulatorArrsToHero(base, accs, sets, hero, 0, 0, 0, /* priority */ 0, weightedScore);
    }

    @Test
    public void buildScoreEqualsWeightedScoreWithNoTargets() {
        final OptimizationRequest request = new OptimizationRequest();
        request.setInputSpdPriority(1.0); // priority set, but no target → no bonus
        final HeroStats result = computeBuild(request, 5000);
        assertEquals(5000, result.getBuildScore());
    }

    @Test
    public void buildScoreAddsTargetBonusWhenTargetMet() {
        final OptimizationRequest request = new OptimizationRequest();
        request.setInputSpdPriority(1.0);
        request.setInputSpdTarget(150); // single/max target; build hits it exactly
        // targetRatio(150/150)=1 → bonus = 1 × priority(1) = 1.0 → ×100 = 100
        final HeroStats result = computeBuild(request, 5000);
        assertEquals(5100, result.getBuildScore());
    }

    @Test
    public void targetBonusCountsAtImplicitWeightWhenPriorityZero() {
        final OptimizationRequest request = new OptimizationRequest();
        // SPD priority is 0 but a target IS set — setting a target is itself the "I
        // care"
        // signal, so it counts at an implicit weight of 1 (rolls stay unweighted).
        // targetRatio(150/150)=1 × weight 1 = 1.0 → ×100 = 100.
        request.setInputSpdTarget(150);
        final HeroStats result = computeBuild(request, 5000);
        assertEquals(5100, result.getBuildScore());
    }

    // ── Sweet-spot (median target): gentle additive peak inside the [min,max]
    // range ──
    @Test
    public void buildScoreAddsSweetSpotBonusAtMedian() {
        final OptimizationRequest request = new OptimizationRequest();
        request.setInputSpdPriority(1.0);
        request.setInputSpdMinTarget(100);
        request.setInputSpdSweetTarget(150); // build's final SPD is exactly 150 (the median)
        request.setInputSpdTarget(200);
        // In range → base 1.0; sitting on the median → +SWEET_PEAK(0.5); 1.5 ×
        // priority(1) → ×100 = 150
        final HeroStats result = computeBuild(request, 5000);
        assertEquals(5150, result.getBuildScore());
    }

    @Test
    public void sweetSpotBonusIsZeroAtRangeEdge() {
        final OptimizationRequest request = new OptimizationRequest();
        request.setInputSpdPriority(1.0);
        request.setInputSpdMinTarget(150); // build's final SPD (150) sits on the min edge
        request.setInputSpdSweetTarget(170);
        request.setInputSpdTarget(200);
        // In range → base 1.0; at the edge the sweet bonus tapers to 0; 1.0 ×
        // priority(1) → ×100 = 100
        final HeroStats result = computeBuild(request, 5000);
        assertEquals(5100, result.getBuildScore());
    }
}

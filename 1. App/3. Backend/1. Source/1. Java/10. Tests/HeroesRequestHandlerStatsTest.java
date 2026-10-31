package com.fribbels.handler;

import com.fribbels.core.StatCalculator;
import com.fribbels.db.ArtifactStatsDb;
import com.fribbels.db.BaseStatsDb;
import com.fribbels.db.HeroDb;
import com.fribbels.db.ItemDb;
import com.fribbels.enums.Gear;
import com.fribbels.enums.Rank;
import com.fribbels.enums.Set;
import com.fribbels.enums.StatType;
import com.fribbels.model.AugmentedStats;
import com.fribbels.model.Hero;
import com.fribbels.model.HeroStats;
import com.fribbels.model.Item;
import com.fribbels.request.OptimizationRequest;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins {@link HeroesRequestHandler#addStatsToBuild}: which columns it refreshes on a saved
 * build (B17), and that two requests sharing the handler's one {@link StatCalculator} cannot
 * interleave its set-up and its use (B40).
 */
public class HeroesRequestHandlerStatsTest {

    private static final int SENTINEL = -1;
    private static final Gear[] SLOTS = { Gear.WEAPON, Gear.HELMET, Gear.ARMOR, Gear.NECKLACE, Gear.RING,
            Gear.BOOTS };

    /** Records which thread last set the base values and counts uses that follow another thread's. */
    private static final class ProbeCalculator extends StatCalculator {
        private volatile Thread lastSetter;
        private final AtomicInteger torn = new AtomicInteger();

        @Override
        public void setBaseValues(final HeroStats base, final Hero hero) {
            super.setBaseValues(base, hero);
            lastSetter = Thread.currentThread();
            // Widen the window so an unlocked second request lands inside it.
            try {
                Thread.sleep(60);
            } catch (final InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        @Override
        public HeroStats addAccumulatorArrsToHero(final HeroStats base, final float[][] accs, final int[] sets,
                final Hero hero, final int upgrades, final int conversions, final int alreadyEquipped,
                final int priority, final int weightedScore) {
            if (lastSetter != Thread.currentThread()) {
                torn.incrementAndGet();
            }
            return super.addAccumulatorArrsToHero(base, accs, sets, hero, upgrades, conversions, alreadyEquipped,
                    priority, weightedScore);
        }
    }

    private static final class Fixture {
        final HeroDb heroDb = new HeroDb(new BaseStatsDb());
        final ItemDb itemDb = new ItemDb(heroDb);
        final List<String> itemIds = new ArrayList<>();
        final HeroesRequestHandler handler;
        final HeroStats base = HeroStats.builder().atk(1000).hp(5000).def(500).spd(100).cr(15).cd(150).build();

        Fixture(final StatCalculator calculator) {
            final List<Item> items = new ArrayList<>();
            for (int i = 0; i < SLOTS.length; i++) {
                final AugmentedStats stats = AugmentedStats.builder()
                        .attack(40 + i)
                        .attackPercent(10)
                        .critRate(5)
                        .critDamage(10)
                        .speed(8)
                        .health(300)
                        .defense(20)
                        .mainType(StatType.ATTACK)
                        .mainValue(0)
                        .build();
                items.add(Item.builder()
                        .id("item" + i)
                        .gear(SLOTS[i])
                        .rank(Rank.EPIC)
                        .set(Set.SPEED)
                        .level(85)
                        .enhance(15)
                        .priorityScore(100)
                        .augmentedStats(stats)
                        .reforgedStats(stats)
                        .build());
                itemIds.add("item" + i);
            }
            itemDb.setItems(items);
            handler = new HeroesRequestHandler(heroDb, new BaseStatsDb(), new ArtifactStatsDb(), itemDb,
                    calculator);
        }

        HeroStats sentinelBuild() {
            final HeroStats build = new HeroStats();
            build.setItems(new ArrayList<>(itemIds));
            for (final String field : new String[] { "dac", "hmcdmgs", "dmcdmgs", "hdmg", "hdmgs", "ddmg", "ddmgs",
                    "customScore", "buildScore" }) {
                try {
                    HeroStats.class.getField(field).setInt(build, SENTINEL);
                } catch (final ReflectiveOperationException e) {
                    throw new IllegalStateException(e);
                }
            }
            return build;
        }
    }

    @Test
    public void addStatsToBuild_refreshesEveryCalculatedColumn() {
        final Fixture f = new Fixture(new StatCalculator());
        final Hero hero = Hero.builder().id("h1").name("Ras").stars(6).build();
        final OptimizationRequest saved = new OptimizationRequest();
        saved.setInputSpdPriority(2.0);
        saved.setInputAtkPriority(1.0);
        hero.setOptimizationRequest(saved);

        final HeroStats build = f.sentinelBuild();
        assertTrue(f.handler.addStatsToBuild(hero, f.base, build, false));

        // Expected values come from a calculator driven the way the optimizer drives it.
        final StatCalculator expected = new StatCalculator();
        expected.setBaseValues(f.base, hero);
        expected.setPriorityWeights(saved);
        expected.setTargets(saved);
        final float[][] accs = new float[6][];
        final List<Item> items = f.itemDb.getItemsById(f.itemIds);
        for (int i = 0; i < 6; i++) {
            accs[i] = expected.buildStatAccumulatorArr(f.base, items.get(i), false);
        }
        final HeroStats want = expected.addAccumulatorArrsToHero(f.base, accs,
                expected.buildSetsArr(items.toArray(new Item[0])), hero, 0, 0, 0, 0, 600);

        assertEquals(want.getDac(), build.getDac(), "dac");
        assertEquals(want.getHmcdmgs(), build.getHmcdmgs(), "hmcdmgs");
        assertEquals(want.getDmcdmgs(), build.getDmcdmgs(), "dmcdmgs");
        assertEquals(want.getHdmg(), build.getHdmg(), "hdmg");
        assertEquals(want.getHdmgs(), build.getHdmgs(), "hdmgs");
        assertEquals(want.getDdmg(), build.getDdmg(), "ddmg");
        assertEquals(want.getDdmgs(), build.getDdmgs(), "ddmgs");
        assertEquals(want.getCustomScore(), build.getCustomScore(), "customScore");
        assertEquals(want.getBuildScore(), build.getBuildScore(), "buildScore");
        assertTrue(build.getCustomScore() != 0, "the fixture's priorities must make customScore non-zero");
        assertEquals(600, build.getBuildScore(), "no targets set, so buildScore is the six items' priorityScore");
    }

    @Test
    public void addStatsToBuild_withoutSavedRequest_doesNotUseAnotherHerosWeights() {
        final Fixture f = new Fixture(new StatCalculator());
        final Hero weighted = Hero.builder().id("h1").name("Ras").stars(6).build();
        final OptimizationRequest saved = new OptimizationRequest();
        saved.setInputSpdPriority(5.0);
        weighted.setOptimizationRequest(saved);
        final Hero plain = Hero.builder().id("h2").name("Vildred").stars(6).build();

        f.handler.addStatsToBuild(weighted, f.base, f.sentinelBuild(), false);
        final HeroStats build = f.sentinelBuild();
        f.handler.addStatsToBuild(plain, f.base, build, false);

        assertEquals(0, build.getCustomScore(), "a hero with no saved request has no priorities to weigh");
    }

    // B44: mergeHeroes calls equipItemsOnHero with an empty list for a null-id scan unit. It was
    // suspected of stripping that hero's gear; it only equips what it is given.
    @Test
    public void equipItemsOnHero_withAnEmptyList_leavesTheGearAlone() {
        final Fixture f = new Fixture(new StatCalculator());
        final Hero hero = Hero.builder().id("h1").name("Ras").stars(6).equipment(new java.util.HashMap<>()).build();
        f.heroDb.setHeroes(new ArrayList<>(List.of(hero)));
        f.itemDb.equipItemOnHero("item0", "h1");
        f.itemDb.equipItemOnHero("item1", "h1");

        f.handler.equipItemsOnHero(com.fribbels.request.EquipItemsOnHeroRequest.builder()
                .heroId("h1")
                .itemIds(new ArrayList<>())
                .useReforgeStats(true)
                .build());

        assertEquals(2, hero.getEquipment().size(), "the hero's gear must survive an empty equip list");
        assertEquals("h1", f.itemDb.getItemById("item0").getEquippedById());
    }

    @Test
    public void concurrentAddStatsToBuild_neverUsesAnotherRequestsBaseValues() throws Exception {
        final ProbeCalculator probe = new ProbeCalculator();
        final Fixture f = new Fixture(probe);
        final int threads = 4;
        final CountDownLatch go = new CountDownLatch(1);
        final List<Thread> workers = new ArrayList<>();
        for (int t = 0; t < threads; t++) {
            final Hero hero = Hero.builder().id("h" + t).name("Hero" + t).stars(6).build();
            final Thread worker = new Thread(() -> {
                try {
                    go.await();
                } catch (final InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return;
                }
                f.handler.addStatsToBuild(hero, f.base, f.sentinelBuild(), false);
            });
            workers.add(worker);
            worker.start();
        }
        go.countDown();
        for (final Thread worker : workers) {
            worker.join(20_000);
        }

        assertEquals(0, probe.torn.get(), "set-up and use of the shared calculator must not interleave");
    }
}

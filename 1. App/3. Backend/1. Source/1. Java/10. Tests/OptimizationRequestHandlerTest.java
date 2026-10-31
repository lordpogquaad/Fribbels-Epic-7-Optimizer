package com.fribbels.handler;

import com.fribbels.db.BaseStatsDb;
import com.fribbels.db.HeroDb;
import com.fribbels.db.ItemDb;
import com.fribbels.db.OptimizationDb;
import com.fribbels.enums.OptimizationColumn;
import com.fribbels.enums.SortOrder;
import com.fribbels.model.BaseStats;
import com.fribbels.model.DamageMultipliers;
import com.fribbels.model.Hero;
import com.fribbels.model.HeroSkillOptions;
import com.fribbels.model.HeroSkills;
import com.fribbels.model.HeroStats;
import com.fribbels.model.Item;
import com.fribbels.model.SingleSkillOptions;
import com.fribbels.model.SkillData;
import com.fribbels.request.GetResultRowsRequest;
import com.fribbels.request.OptimizationRequest;
import com.fribbels.request.SkillOptionsRequest;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.Timeout.ThreadMode;

import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Drives the real handler on a small gear pool (the sample request's 32 items) with the
 * hero in a real {@link HeroDb}: what a run leaves on the stored hero (B15, B19).
 */
// A search that spins (B39) must fail the run, not hang it: the timeout runs each test on its own thread.
@Timeout(value = 120, threadMode = ThreadMode.SEPARATE_THREAD)
public class OptimizationRequestHandlerTest {

    private static final Gson GSON = new Gson();
    private static final Path SAMPLE = Path.of("1. Java", "10. Tests", "sampleOptimizationRequest.json");
    private static final String HERO_ID = "h1";

    private HeroDb heroDb;
    private OptimizationRequestHandler handler;

    @BeforeEach
    void setUp() {
        final BaseStatsDb baseStatsDb = new BaseStatsDb();
        final HeroStats stats = HeroStats.builder().atk(576).hp(5700).def(743).cr(15).cd(150).eff(0).res(0)
                .spd(88).dac(5).build();
        baseStatsDb.setBaseStatsByName(Map.of("Probe", BaseStats.builder()
                .lv50FiveStarFullyAwakened(stats)
                .lv60SixStarFullyAwakened(stats)
                .skills(skills())
                .build()));
        heroDb = new HeroDb(baseStatsDb);
        heroDb.addHeroes(List.of(Hero.builder().id(HERO_ID).name("Probe").stars(6).build()));
        handler = new OptimizationRequestHandler(baseStatsDb, heroDb, new ItemDb(heroDb));
    }

    private static HeroSkills skills() {
        return HeroSkills.builder()
                .S1(skillTiers(1.0f))
                .S2(skillTiers(2.0f))
                .S3(skillTiers(3.0f))
                .build();
    }

    private static SkillData[] skillTiers(final float rate) {
        final SkillData[] tiers = new SkillData[3];
        for (int i = 0; i < tiers.length; i++) {
            tiers[i] = SkillData.builder().name("normal" + i).rate(rate + 10 * i).pow(1f).targets(1).build();
        }
        return tiers;
    }

    /** A request shaped like the renderer's, on the sample gear. */
    private OptimizationRequest request(final boolean withSkills) throws IOException {
        final OptimizationRequest request = GSON.fromJson(Files.readString(SAMPLE), OptimizationRequest.class);
        for (int i = 0; i < request.getItems().size(); i++) {
            final Item item = request.getItems().get(i);
            item.setModId(item.getId());
            item.setPriorityScore(i + 1); // without it every buildScore is 0 and any order passes
        }
        // The renderer echoes the hero it got from the backend.
        final Hero echoed = GSON.fromJson(GSON.toJson(heroDb.getHeroById(HERO_ID)), Hero.class);
        if (!withSkills) {
            echoed.setSkills(null);
        }
        request.setHero(echoed);
        request.setHeroId(HERO_ID);
        request.setExecutionId(handler.prepareExecution());
        return request;
    }

    private HeroStats[] rows(final OptimizationRequest request) throws Exception {
        final Method method = OptimizationRequestHandler.class.getDeclaredMethod("handleGetResultRowsRequest",
                GetResultRowsRequest.class);
        method.setAccessible(true);
        final String json = (String) method.invoke(handler, GetResultRowsRequest.builder()
                .executionId(request.getExecutionId())
                .startRow(0)
                .endRow(100)
                .sortColumn(OptimizationColumn.BUILDSCORE)
                .sortOrder(SortOrder.DESC)
                .optimizationRequest(request)
                .build());
        final JsonObject response = JsonParser.parseString(json).getAsJsonObject();
        return GSON.fromJson(response.get("heroStats"), HeroStats[].class);
    }

    private JsonObject saved() {
        return GSON.toJsonTree(heroDb.getHeroById(HERO_ID).getOptimizationRequest()).getAsJsonObject();
    }

    @Test
    void anAcceptedRunSavesTheRequestIncludingTheFiltersTheJavaClassUsedToDrop() throws Exception {
        final OptimizationRequest request = request(true);
        request.setInputGlobalMustHaveStat("Speed");
        request.setInputMaxItemGSLimit(90);
        request.setEnhanceLimit(List.of("12"));

        final String response = handler.handleOptimizationRequest(request);

        assertTrue(response.startsWith("{"), "the run was refused: " + response);
        assertEquals("Speed", saved().get("inputGlobalMustHaveStat").getAsString());
        assertEquals(90, saved().get("inputMaxItemGSLimit").getAsInt());
        assertEquals("12", saved().get("enhanceLimit").getAsJsonArray().get(0).getAsString());
    }

    @Test
    void aRunWithNoLiveExecutionLeavesTheSavedFiltersAlone() throws Exception {
        final OptimizationRequest first = request(true);
        first.setInputSpdMinLimit(200);
        handler.handleOptimizationRequest(first);
        assertEquals(200, saved().get("inputSpdMinLimit").getAsInt());

        // An execution id the handler never prepared (or has evicted): the run is refused.
        final OptimizationRequest refused = request(true);
        refused.setExecutionId("never-prepared");
        refused.setInputSpdMinLimit(5);
        handler.handleOptimizationRequest(refused);

        assertEquals(200, saved().get("inputSpdMinLimit").getAsInt());
    }

    @Test
    void aRunTheBackstopRefusesLeavesTheSavedFiltersAlone() throws Exception {
        final OptimizationRequest first = request(true);
        first.setInputSpdMinLimit(200);
        handler.handleOptimizationRequest(first);

        final long limit = OptimizationRequestHandler.SETTING_MAX_PERMUTATIONS;
        OptimizationRequestHandler.SETTING_MAX_PERMUTATIONS = 1;
        try {
            final OptimizationRequest refused = request(true);
            refused.setInputSpdMinLimit(5);
            assertEquals("ERROR", handler.handleOptimizationRequest(refused));
        } finally {
            OptimizationRequestHandler.SETTING_MAX_PERMUTATIONS = limit;
        }

        assertEquals(200, saved().get("inputSpdMinLimit").getAsInt());
    }

    @Test
    void aRunWithoutMultipliersDoesNotWipeTheOnesAnEarlierRunStored() throws Exception {
        final OptimizationRequest single = request(true);
        single.setDamageMultipliers(DamageMultipliers.builder().build());
        handler.handleOptimizationRequest(single);
        final DamageMultipliers stored = heroDb.getHeroById(HERO_ID).getDamageMultipliers();
        assertSame(single.getDamageMultipliers(), stored);

        // A multi-hero run: the saved request it merges in carries no multipliers.
        final OptimizationRequest multi = request(true);
        multi.setDamageMultipliers(null);
        handler.handleOptimizationRequest(multi);

        assertTrue(heroDb.getHeroById(HERO_ID).hasStoredDamageMultipliers(), "the stored multipliers were nulled");
        assertSame(stored, heroDb.getHeroById(HERO_ID).getDamageMultipliers());
    }

    @Test
    void aRunWithoutMultipliersStillScoresSkillsFromTheStoredHeroWhenTheRequestHeroHasNone() throws Exception {
        final OptimizationRequest request = request(false);
        request.setDamageMultipliers(null);
        handler.handleOptimizationRequest(request);

        final HeroStats[] rows = rows(request);
        assertNotNull(rows);
        assertTrue(rows.length > 0, "the sample pool produced no builds");
        assertTrue(rows[0].getS1() > 0, "S1 came out as " + rows[0].getS1());
        assertTrue(rows[0].getS3() > rows[0].getS1(), "S3 should be a 3x skill against S1");
    }

    @Test
    void aRunWithoutMultipliersFollowsTheStoredHeroSkillOptionsNotTheEchoedOnes() throws Exception {
        final OptimizationRequest before = request(true);
        before.setDamageMultipliers(null);
        handler.handleOptimizationRequest(before);
        final int s1Before = rows(before)[0].getS1();

        // The echo was taken earlier; the options change on the stored hero afterwards.
        final OptimizationRequest staleEcho = request(true);
        staleEcho.setDamageMultipliers(null);
        heroDb.getHeroById(HERO_ID).setSkillOptions(SkillOptionsRequest.builder()
                .heroId(HERO_ID)
                .skillOptions(HeroSkillOptions.builder()
                        .S1(SingleSkillOptions.builder().skillEffect("normal1").build())
                        .S2(SingleSkillOptions.builder().skillEffect("normal1").build())
                        .S3(SingleSkillOptions.builder().skillEffect("normal1").build())
                        .build())
                .build());
        handler.handleOptimizationRequest(staleEcho);

        assertTrue(rows(staleEcho)[0].getS1() > s1Before,
                "S1 stayed at " + s1Before + ": the run used the echoed hero's old options");
    }

    @SuppressWarnings("unchecked")
    private OptimizationDb dbOf(final OptimizationRequest request) throws Exception {
        final Field field = OptimizationRequestHandler.class.getDeclaredField("optimizationDbs");
        field.setAccessible(true);
        return ((Map<String, OptimizationDb>) field.get(handler)).get(request.getExecutionId());
    }

    @Test
    void aRunThatThrowsAfterGoingLiveStillReportsTheFailureAndLeavesTheDbUsable() throws Exception {
        // A skill table with S1 but no S2 or S3 passes hasSkillData() and makes the multiplier step
        // throw, which runs after the db goes live. (Skill options missing a skill no longer throw:
        // they fall back to the first option, as the renderer's calculator does.)
        heroDb.getHeroById(HERO_ID).setSkills(HeroSkills.builder().S1(skillTiers(1.0f)).build());
        final OptimizationRequest request = request(true);
        request.setDamageMultipliers(null);

        assertThrows(RuntimeException.class, () -> handler.handleOptimizationRequest(request));

        final OptimizationDb db = dbOf(request);
        assertTrue(db.isDone());
        assertFalse(db.isLive(), "the live references were left set after the failure");
    }

    @Test
    void theRequestsOwnMultipliersStillDecideTheSValues() throws Exception {
        final OptimizationRequest request = request(true);
        request.setDamageMultipliers(null);
        handler.handleOptimizationRequest(request);
        final HeroStats[] fromHero = rows(request);

        final OptimizationRequest withMultipliers = request(true);
        withMultipliers.setDamageMultipliers(heroDb.getHeroById(HERO_ID).getDamageMultipliers());
        handler.handleOptimizationRequest(withMultipliers);
        final HeroStats[] fromRequest = rows(withMultipliers);

        assertTrue(fromHero.length > 0);
        assertEquals(fromHero.length, fromRequest.length);
        assertEquals(fromHero[0].getS1(), fromRequest[0].getS1());
        assertEquals(fromHero[0].getS2(), fromRequest[0].getS2());
    }

    // B39: set format 1 or 2 names a 4-piece set (3 to 5 a 2-piece one) in the first list. With that list empty there is
    // no set to require: the permutation table threw (the "any set" default includes 2-piece sets)
    // and the 4-piece short-circuit would have stopped at once. The UI cannot send it, so a
    // programmatic one is searched as format 0, every set combination.
    @Test
    void formats1To5WithAnEmptyFirstSetListSearchEverySetCombination() throws Exception {
        final OptimizationRequest anySet = request(true);
        anySet.setSetFormat(0);
        handler.handleOptimizationRequest(anySet);
        final long expected = dbOf(anySet).getMaximum();
        assertTrue(expected > 0, "the sample pool must have builds for this comparison to mean anything");

        for (final int format : new int[] { 1, 2, 3, 4, 5 }) {
            final OptimizationRequest empty = request(true);
            empty.setSetFormat(format);
            empty.setInputSetsOne(List.of());
            empty.setInputSetsTwo(List.of());
            handler.handleOptimizationRequest(empty);
            assertEquals(expected, dbOf(empty).getMaximum(), "format " + format + " with an empty first list");
        }
    }

    // B27: the progress poll summed every execution the handler still held, finished ones
    // included, so a new run started its counter at the last run's total.
    @Test
    void progressCountsOnlyTheRunsStillGoing() throws Exception {
        final OptimizationRequest finished = request(true);
        handler.handleOptimizationRequest(finished);
        assertTrue(dbOf(finished).getSearchedCounter().get() > 0, "the finished run must have searched something");

        final String runningId = handler.prepareExecution();
        final OptimizationRequest running = request(true);
        running.setExecutionId(runningId);
        dbOf(running).getSearchedCounter().set(7);

        final JsonObject progress = JsonParser.parseString(handler.handleGetProgressRequest()).getAsJsonObject();
        assertEquals(7, progress.get("searched").getAsLong(), "the finished run's count leaked into the progress");
    }

    // B27: the set-permutation index table is read only by the GPU kernel, and is 24^6 ints
    // (about 760 MB). A run with the GPU switched off must not build it, and switching the GPU on
    // afterwards must still get it, not the cached table without it.
    @Test
    void theGpuOnlyIndexTableIsBuiltOnlyWhenTheGpuIsOn() throws Exception {
        final boolean before = OptimizationRequestHandler.SETTING_GPU;
        try {
            OptimizationRequestHandler.SETTING_GPU = false;
            final OptimizationRequest cpu = request(true);
            cpu.setSetFormat(2);
            handler.addCalculatedFields(cpu);
            assertNotNull(cpu.getBoolArr(), "the CPU filter reads the allowed-set table");
            assertNull(cpu.getSetPermutationIndicesPlusOne(), "built for a run that cannot use it");

            OptimizationRequestHandler.SETTING_GPU = true;
            final OptimizationRequest gpu = request(true);
            gpu.setSetFormat(2);
            handler.addCalculatedFields(gpu);
            final Field usable = OptimizationRequestHandler.class.getDeclaredField("canUseGpu");
            usable.setAccessible(true);
            if (usable.getBoolean(handler)) {
                assertNotNull(gpu.getSetPermutationIndicesPlusOne(), "the cached CPU-only table was reused");
            }
        } finally {
            OptimizationRequestHandler.SETTING_GPU = before;
        }
    }

    // B41: the execution bookkeeping the renderer drives around a run.
    @Test
    void theHandlerKeepsOnlyTheThreeNewestExecutions() throws Exception {
        final List<String> ids = new java.util.ArrayList<>();
        for (int i = 0; i < 4; i++) {
            ids.add(handler.prepareExecution());
        }
        assertNull(dbOfId(ids.get(0)), "the oldest execution should have been dropped");
        for (final String kept : ids.subList(1, 4)) {
            assertNotNull(dbOfId(kept));
        }
    }

    @Test
    void deletingAnExecutionDropsItsDbAndIgnoresAnUnknownOrMissingId() throws Exception {
        final String id = handler.prepareExecution();
        handler.deleteExecutionRequest(com.fribbels.request.IdRequest.builder().id(id).build());
        assertNull(dbOfId(id));

        assertEquals("", handler.deleteExecutionRequest(com.fribbels.request.IdRequest.builder().id(null).build()));
        assertEquals("", handler.deleteExecutionRequest(com.fribbels.request.IdRequest.builder().id("nope").build()));
    }

    @Test
    void interruptAllCancelsEveryKeptExecution() throws Exception {
        final String first = handler.prepareExecution();
        final String second = handler.prepareExecution();

        handler.interruptAll();

        assertTrue(dbOfId(first).isInterrupted());
        assertTrue(dbOfId(second).isInterrupted());
    }

    @Test
    void nothingIsInProgressBeforeARunStarts() {
        assertEquals(false, JsonParser.parseString(handler.handleInProgressRequest()).getAsJsonObject()
                .get("inProgress").getAsBoolean());
    }

    @SuppressWarnings("unchecked")
    private OptimizationDb dbOfId(final String executionId) throws Exception {
        final Field field = OptimizationRequestHandler.class.getDeclaredField("optimizationDbs");
        field.setAccessible(true);
        return ((Map<String, OptimizationDb>) field.get(handler)).get(executionId);
    }

    // B27: a poll that lands after the last run ended still reports that run, not zero.
    @Test
    void progressAfterTheLastRunEndedStillReportsIt() throws Exception {
        final OptimizationRequest finished = request(true);
        handler.handleOptimizationRequest(finished);
        final long searched = dbOf(finished).getSearchedCounter().get();

        final JsonObject progress = JsonParser.parseString(handler.handleGetProgressRequest()).getAsJsonObject();
        assertEquals(searched, progress.get("searched").getAsLong());
    }
}

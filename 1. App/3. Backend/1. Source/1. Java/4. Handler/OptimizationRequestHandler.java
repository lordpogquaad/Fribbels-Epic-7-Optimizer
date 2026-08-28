package com.fribbels.handler;

import com.aparapi.Kernel;
import com.aparapi.Range;
import com.aparapi.device.Device;
import com.aparapi.device.OpenCLDevice;
import com.aparapi.internal.kernel.KernelManager;
import com.aparapi.internal.opencl.OpenCLPlatform;
import com.fribbels.Main;
import com.fribbels.core.StatCalculator;
import com.fribbels.db.BaseStatsDb;
import com.fribbels.db.HeroDb;
import com.fribbels.db.ItemDb;
import com.fribbels.db.OptimizationDb;
import com.fribbels.db.TopNResults;
import com.fribbels.enums.Gear;
import com.fribbels.enums.Set;
import com.fribbels.gpu.GpuOptimizerKernel;
import com.fribbels.gpu.SetFormat000OptimizerKernel;
import com.fribbels.model.Hero;
import com.fribbels.model.HeroStats;
import com.fribbels.model.Item;
import com.fribbels.model.PassesContainer;
import com.fribbels.request.EditResultRowsRequest;
import com.fribbels.request.GetResultRowsRequest;
import com.fribbels.request.IdRequest;
import com.fribbels.request.OptimizationRequest;
import com.fribbels.response.GetInProgressResponse;
import com.fribbels.response.GetResultRowsResponse;
import com.fribbels.response.OptimizationResponse;
import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import lombok.Getter;
import lombok.SneakyThrows;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.Strings;
import org.apache.commons.lang3.StringUtils;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Function;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

import static com.fribbels.enums.Set.SET_COUNT;

public class OptimizationRequestHandler extends RequestHandler implements HttpHandler {

    public static int SETTING_MAXIMUM_RESULTS = 5_000_000;
    public static boolean SETTING_GPU = true;
    // Hard ceiling on the permutation search space (base + mod-variant pool). The
    // frontend
    // soft-warns (OptimizerTab.warnParams) but is bypassable / absent on some
    // programmatic
    // paths; this backstop refuses a run whose combination count would never finish
    // (or that
    // overflowed the count), returning "ERROR" instead of hanging/allocating. Set
    // conservative-HIGH so only the pathological zone is blocked — legitimate large
    // runs
    // (typically ≤ ~1e9) are unaffected. Tune here if a real run is ever wrongly
    // rejected.
    public static long SETTING_MAX_PERMUTATIONS = 1_000_000_000_000L; // 1e12

    private final BaseStatsDb baseStatsDb;
    private final Map<String, OptimizationDb> optimizationDbs;
    private final HeroDb heroDb;
    private final ItemDb itemDb;
    /** Number of optimizations currently running (max 2 for parallel support). */
    public static final AtomicInteger runningCount = new AtomicInteger(0);
    public static final int MAX_CONCURRENT = 2;

    private static final Gson gson = new Gson();
    private static final Logger logger = Logger.getLogger(OptimizationRequestHandler.class.getName());
    @Getter
    private AtomicLong searchedCounter = new AtomicLong(0);
    private AtomicLong resultsCounter = new AtomicLong(0);

    private volatile long[] setSolutionBitMasks;

    private float[] pooledWeaponAccs = new float[0];
    private float[] pooledHelmetAccs = new float[0];
    private float[] pooledArmorAccs = new float[0];
    private float[] pooledNecklaceAccs = new float[0];
    private float[] pooledRingAccs = new float[0];
    private float[] pooledBootAccs = new float[0];

    private GpuOptimizerKernel cachedKernel = null;
    private String cachedKernelHeroId = null;
    private boolean cachedKernelIsFormat0 = false;

    private static final class BoolArrEntry {
        final String key;
        final boolean[] boolArr;
        final int[] setPermIndices;

        BoolArrEntry(String key, boolean[] boolArr, int[] setPermIndices) {
            this.key = key;
            this.boolArr = boolArr;
            this.setPermIndices = setPermIndices;
        }
    }

    private volatile BoolArrEntry cachedBoolArrEntry = null;

    private volatile boolean canUseGpu = true;

    public static final int ARG_COUNT = 14;

    private static final int SET_EXPONENTIAL = 191102976; // SET_COUNT ^ 6 (24 ^ 6)

    public static OptimizationRequestHandler instance;

    public void configureGpu(final boolean gpuEnabled) {
        logger.info("GPU acceleration enabled: " + gpuEnabled);
        OptimizationRequestHandler.SETTING_GPU = gpuEnabled;

        if (gpuEnabled) {
            final Device device = KernelManager.instance().bestDevice();
            Main.BEST_DEVICE_ID = device.getDeviceId();

            logger.info("Best GPU device type: " + KernelManager.instance().bestDevice().getType());

            ExecutorService t = Executors.newFixedThreadPool(1);
            t.execute(() -> {
                try {
                    final boolean isIntel = KernelManager
                            .instance()
                            .bestDevice()
                            .toString()
                            .toLowerCase()
                            .contains("intel");
                    if (isIntel) {
                        logger.warning("Disabling GPU acceleration: Intel card detected");
                        canUseGpu = false;
                        return;
                    }

                    final Kernel testKernel = new Kernel() {
                        @Override
                        public void run() {

                        }
                    };
                    if (!testKernel.isRunningCL()) {
                        logger.warning("Disabling GPU acceleration: Non CL device detected");
                        canUseGpu = false;
                        return;
                    }
                    testKernel.dispose();

                } catch (final Exception e) {
                    canUseGpu = false;
                    logger.log(Level.WARNING, "Error detecting GPU", e);
                }
            });
            t.shutdown();
        }
    }

    private synchronized void ensureSolutionBitMasks() {
        if (setSolutionBitMasks != null)
            return;
        logger.info("Starting setSolutionBitMasks generation...");
        long start = System.currentTimeMillis();
        final long[] masks = new long[SET_EXPONENTIAL];
        int count = 0;
        for (int a = 0; a < SET_COUNT; a++) {
            for (int b = 0; b < SET_COUNT; b++) {
                for (int c = 0; c < SET_COUNT; c++) {
                    for (int d = 0; d < SET_COUNT; d++) {
                        for (int e = 0; e < SET_COUNT; e++) {
                            for (int f = 0; f < SET_COUNT; f++) {
                                int[] sets = new int[] { a, b, c, d, e, f };
                                int[] counters = convertSetsToSetCounters(sets);

                                long l = 0;

                                l += counters[23] / 4 > 0 ? 1L : 0L; // weakening
                                l <<= 1;
                                l += counters[22] / 2 > 0 ? 1L : 0L; // fervor
                                l <<= 1;
                                l += counters[21] / 2 > 0 ? 1L : 0L; // pursuit
                                l <<= 1;
                                l += counters[20] / 4 > 0 ? 1L : 0L; // warfare (opener)
                                l <<= 1;
                                l += counters[19] / 4 > 0 ? 1L : 0L; // riposte
                                l <<= 1;
                                l += counters[18] / 4 > 0 ? 1L : 0L; // reversal
                                l <<= 1;
                                l += counters[17] / 2 > 0 ? 1L : 0L; // torrent 1
                                l <<= 1;
                                l += counters[17] / 2 - 1 > 0 ? 1L : 0L; // torrent 2
                                l <<= 1;
                                l += counters[17] / 2 - 2 > 0 ? 1L : 0L; // torrent 3
                                l <<= 1;
                                l += counters[16] / 4 > 0 ? 1L : 0L; // protection
                                l <<= 1;
                                l += counters[15] / 4 > 0 ? 1L : 0L; // injury
                                l <<= 1;
                                l += counters[14] / 4 > 0 ? 1L : 0L; // revenge
                                l <<= 1;
                                l += counters[13] / 2 > 0 ? 1L : 0L; // pen
                                l <<= 1;
                                l += counters[12] / 2 > 0 ? 1L : 0L; // immunity
                                l <<= 1;
                                l += counters[11] / 4 > 0 ? 1L : 0L; // rage
                                l <<= 1;
                                l += counters[10] / 2 > 0 ? 1L : 0L; // unity - should be x3 but don't need it
                                l <<= 1;
                                l += counters[9] / 2 > 0 ? 1L : 0L; // res1
                                l <<= 1;
                                l += counters[9] / 2 - 1 > 0 ? 1L : 0L; // res2
                                l <<= 1;
                                l += counters[9] / 2 - 2 > 0 ? 1L : 0L; // res3
                                l <<= 1;
                                l += counters[8] / 4 > 0 ? 1L : 0L; // counter
                                l <<= 1;
                                l += counters[7] / 4 > 0 ? 1L : 0L; // lifesteal
                                l <<= 1;
                                l += counters[6] / 4 > 0 ? 1L : 0L; // destr
                                l <<= 1;
                                l += counters[5] / 2 > 0 ? 1L : 0L; // hit1
                                l <<= 1;
                                l += counters[5] / 2 - 1 > 0 ? 1L : 0L; // hit2
                                l <<= 1;
                                l += counters[5] / 2 - 2 > 0 ? 1L : 0L; // hit3
                                l <<= 1;
                                l += counters[4] / 2 > 0 ? 1L : 0L; // crit1
                                l <<= 1;
                                l += counters[4] / 2 - 1 > 0 ? 1L : 0L; // crit2
                                l <<= 1;
                                l += counters[4] / 2 - 2 > 0 ? 1L : 0L; // crit3
                                l <<= 1;
                                l += counters[3] / 4 > 0 ? 1L : 0L; // spd
                                l <<= 1;
                                l += counters[2] / 4 > 0 ? 1L : 0L; // atk
                                l <<= 1;
                                l += counters[1] / 2 > 0 ? 1L : 0L; // def1
                                l <<= 1;
                                l += counters[1] / 2 - 1 > 0 ? 1L : 0L; // def2
                                l <<= 1;
                                l += counters[1] / 2 - 2 > 0 ? 1L : 0L; // def3
                                l <<= 1;
                                l += counters[0] / 2 > 0 ? 1L : 0L; // hp1
                                l <<= 1;
                                l += counters[0] / 2 - 1 > 0 ? 1L : 0L; // hp2
                                l <<= 1;
                                l += counters[0] / 2 - 2 > 0 ? 1L : 0L; // hp3

                                masks[count] = l;
                                count++;
                            }
                        }
                    }
                }
            }
        }
        setSolutionBitMasks = masks;
        logger.info("Finished setSolutionBitMasks generation in "
                + (System.currentTimeMillis() - start) + "ms. First element: " + setSolutionBitMasks[0]
                + ", Last element: " + setSolutionBitMasks[setSolutionBitMasks.length - 1]);
    }

    public OptimizationRequestHandler(final BaseStatsDb baseStatsDb,
            final HeroDb heroDb,
            final ItemDb itemDb) {
        this.baseStatsDb = baseStatsDb;
        this.heroDb = heroDb;
        this.itemDb = itemDb;
        instance = this;
        optimizationDbs = Collections.synchronizedMap(new LinkedHashMap<String, OptimizationDb>(4, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, OptimizationDb> eldest) {
                return size() > 3;
            }
        });

    }

    @Override
    public void handle(final HttpExchange exchange) throws IOException {
        logger.info("===================== OptimizationRequestHandler =====================");
        final String path = exchange.getRequestURI().getPath();

        logger.info("Path: " + path);

        try {
            switch (path) {
                case "/optimization/prepareExecution":
                    sendResponse(exchange, prepareExecution());
                    return;
                case "/optimization/deleteExecution":
                    final IdRequest deleteExecutionRequest = parseRequest(exchange, IdRequest.class);
                    sendResponse(exchange, deleteExecutionRequest(deleteExecutionRequest));
                    return;
                case "/optimization/optimizationRequest":
                    // Do NOT reset Main.interrupt here — concurrent runs each use per-execution
                    // interrupt flags
                    final OptimizationRequest optimizationRequest = parseRequest(exchange, OptimizationRequest.class);
                    sendResponse(exchange, handleOptimizationRequest(optimizationRequest));
                    return;
                case "/optimization/optimizationFilterRequest":
                    final OptimizationRequest optimizationFilterRequest = parseRequest(exchange,
                            OptimizationRequest.class);
                    sendResponse(exchange, handleOptimizationFilterRequest(optimizationFilterRequest));
                    return;
                case "/optimization/getResultRows":
                    final GetResultRowsRequest getResultRowsRequest = parseRequest(exchange,
                            GetResultRowsRequest.class);
                    sendResponse(exchange, handleGetResultRowsRequest(getResultRowsRequest));
                    return;
                case "/optimization/editResultRows":
                    final EditResultRowsRequest editResultRowsRequest = parseRequest(exchange,
                            EditResultRowsRequest.class);
                    sendResponse(exchange, handleEditResultRowsRequest(editResultRowsRequest));
                    return;
                case "/optimization/getProgress":
                    sendResponse(exchange, handleGetProgressRequest());
                    return;
                case "/optimization/inProgress":
                    sendResponse(exchange, handleInProgressRequest());
                    return;
                case "/optimization/getBestSoFar":
                    final IdRequest getBestSoFarRequest = parseRequest(exchange, IdRequest.class);
                    sendResponse(exchange, handleGetBestSoFarRequest(getBestSoFarRequest));
                    return;
                case "/optimization/getExecutionProgress":
                    final IdRequest execProgressRequest = parseRequest(exchange, IdRequest.class);
                    sendResponse(exchange, handleGetExecutionProgressRequest(execProgressRequest));
                    return;
                case "/optimization/cancelExecution":
                    final IdRequest cancelExecRequest = parseRequest(exchange, IdRequest.class);
                    sendResponse(exchange, handleCancelExecutionRequest(cancelExecRequest));
                    return;
                default:
                    logger.warning("No handler found for " + path);
            }
        } catch (final RuntimeException e) {
            logger.log(Level.SEVERE, "Error handling optimization request", e);
        }

        sendResponse(exchange, "ERROR");
    }

    public String handleInProgressRequest() {
        final GetInProgressResponse response = GetInProgressResponse.builder()
                .inProgress(runningCount.get() >= MAX_CONCURRENT)
                .build();

        return gson.toJson(response);
    }

    public String handleGetProgressRequest() {
        // Sum progress across all active executions so single-optimizer tab polling
        // still works
        long searched = 0;
        long results = 0;
        synchronized (optimizationDbs) {
            for (final OptimizationDb db : optimizationDbs.values()) {
                searched += db.getSearchedCounter().get();
                // In keep-best-N mode report the bounded heap size (kept builds), not
                // the raw passer count which can run into the billions.
                results += db.getLiveResultsCount();
            }
        }
        final OptimizationResponse response = OptimizationResponse.builder()
                .searched(searched)
                .results(results)
                .build();

        return gson.toJson(response);
    }

    public String handleOptimizationFilterRequest(final OptimizationRequest request) {
        final OptimizationDb optimizationDb = optimizationDbs.get(request.getExecutionId());

        if (optimizationDb == null) {
            return "";
        }

        final boolean hasExcludedGearIds = CollectionUtils.isNotEmpty(request.getExcludedGearIds());
        final Map<String, String> excludedGearIds = new HashMap<>();
        if (hasExcludedGearIds) {
            for (final String gearId : request.getExcludedGearIds()) {
                excludedGearIds.put(gearId, gearId);
            }
        }

        // Scratch/quick filters re-filter without persisting onto the hero.
        if (!request.isNoSave()) {
            heroDb.saveOptimizationRequest(request);
        }
        final HeroStats[] heroStats = optimizationDb.getAllHeroStats();
        final int[] indices = new int[heroStats.length];
        final java.util.Set<String> ids = new HashSet<>();
        int count = 0;

        for (int i = 0; i < heroStats.length; i++) {
            final HeroStats heroStatsInstance = heroStats[i];
            if (passesUpdatedFilter(request, heroStatsInstance)) {
                boolean passesGearIdFilter = true;
                if (hasExcludedGearIds) {
                    for (final String gearId : heroStatsInstance.items) {
                        if (excludedGearIds.containsKey(gearId)) {
                            passesGearIdFilter = false;
                            break;
                        }
                    }
                }

                if (passesGearIdFilter) {
                    indices[count] = i;
                    ids.add(heroStatsInstance.getId());
                    count++;
                }
            }
        }

        optimizationDb.setFilteredIds(ids, count);

        return "";
    }

    private boolean passesUpdatedFilter(final OptimizationRequest request, final HeroStats heroStats) {
        return heroStats.getAtk() >= request.getInputAtkMinLimit()
                && heroStats.getAtk() <= request.getInputAtkMaxLimit()
                && heroStats.getHp() >= request.getInputHpMinLimit()
                && heroStats.getHp() <= request.getInputHpMaxLimit()
                && heroStats.getDef() >= request.getInputDefMinLimit()
                && heroStats.getDef() <= request.getInputDefMaxLimit()
                && heroStats.getSpd() >= request.getInputSpdMinLimit()
                && heroStats.getSpd() <= request.getInputSpdMaxLimit()
                && heroStats.getCr() >= request.getInputCrMinLimit()
                && heroStats.getCr() <= request.getInputCrMaxLimit()
                && heroStats.getCd() >= request.getInputCdMinLimit()
                && heroStats.getCd() <= request.getInputCdMaxLimit()
                && heroStats.getEff() >= request.getInputEffMinLimit()
                && heroStats.getEff() <= request.getInputEffMaxLimit()
                && heroStats.getRes() >= request.getInputResMinLimit()
                && heroStats.getRes() <= request.getInputResMaxLimit()
                && heroStats.getCp() >= request.getInputMinCpLimit()
                && heroStats.getCp() <= request.getInputMaxCpLimit()
                && heroStats.getHpps() >= request.getInputMinHppsLimit()
                && heroStats.getHpps() <= request.getInputMaxHppsLimit()
                && heroStats.getEhp() >= request.getInputMinEhpLimit()
                && heroStats.getEhp() <= request.getInputMaxEhpLimit()
                && heroStats.getEhpps() >= request.getInputMinEhppsLimit()
                && heroStats.getEhpps() <= request.getInputMaxEhppsLimit()
                && heroStats.getDmg() >= request.getInputMinDmgLimit()
                && heroStats.getDmg() <= request.getInputMaxDmgLimit()
                && heroStats.getDmgps() >= request.getInputMinDmgpsLimit()
                && heroStats.getDmgps() <= request.getInputMaxDmgpsLimit()
                && heroStats.getMcdmg() >= request.getInputMinMcdmgLimit()
                && heroStats.getMcdmg() <= request.getInputMaxMcdmgLimit()
                && heroStats.getMcdmgps() >= request.getInputMinMcdmgpsLimit()
                && heroStats.getMcdmgps() <= request.getInputMaxMcdmgpsLimit()
                && heroStats.getDmgh() >= request.getInputMinDmgHLimit()
                && heroStats.getDmgh() <= request.getInputMaxDmgHLimit()
                && heroStats.getDmgd() >= request.getInputMinDmgDLimit()
                && heroStats.getDmgd() <= request.getInputMaxDmgDLimit()
                && heroStats.getHmcdmgs() >= request.getInputMinHmcdmgsLimit()
                && heroStats.getHmcdmgs() <= request.getInputMaxHmcdmgsLimit()
                && heroStats.getDmcdmgs() >= request.getInputMinDmcdmgsLimit()
                && heroStats.getDmcdmgs() <= request.getInputMaxDmcdmgsLimit()
                && heroStats.getHdmg() >= request.getInputMinHdmgLimit()
                && heroStats.getHdmg() <= request.getInputMaxHdmgLimit()
                && heroStats.getHdmgs() >= request.getInputMinHdmgsLimit()
                && heroStats.getHdmgs() <= request.getInputMaxHdmgsLimit()
                && heroStats.getDdmg() >= request.getInputMinDdmgLimit()
                && heroStats.getDdmg() <= request.getInputMaxDdmgLimit()
                && heroStats.getDdmgs() >= request.getInputMinDdmgsLimit()
                && heroStats.getDdmgs() <= request.getInputMaxDdmgsLimit()
                && heroStats.getS1() >= request.getInputMinS1Limit()
                && heroStats.getS1() <= request.getInputMaxS1Limit()
                && heroStats.getS2() >= request.getInputMinS2Limit()
                && heroStats.getS2() <= request.getInputMaxS2Limit()
                && heroStats.getS3() >= request.getInputMinS3Limit()
                && heroStats.getS3() <= request.getInputMaxS3Limit()
                && heroStats.getScore() >= request.getInputMinScoreLimit()
                && heroStats.getScore() <= request.getInputMaxScoreLimit()
                && heroStats.getBs() >= request.getInputMinBSLimit()
                && heroStats.getBs() <= request.getInputMaxBSLimit()
                && heroStats.getPriority() >= request.getInputMinPriorityLimit()
                && heroStats.getPriority() <= request.getInputMaxPriorityLimit()
                && heroStats.getUpgrades() >= request.getInputMinUpgradesLimit()
                && heroStats.getUpgrades() <= request.getInputMaxUpgradesLimit()
                && heroStats.getConversions() >= request.getInputMinConversionsLimit()
                && heroStats.getConversions() <= request.getInputMaxConversionsLimit()
                && heroStats.getEq() >= request.getInputMinEquippedLimit()
                && heroStats.getEq() <= request.getInputMaxEquippedLimit();
    }

    public String prepareExecution() {
        final String executionId = UUID.randomUUID().toString();

        optimizationDbs.put(executionId, new OptimizationDb());

        return executionId;
    }

    public String deleteExecutionRequest(final IdRequest request) {
        if (request.getId() == null) {
            return "";
        }

        optimizationDbs.remove(request.getId());

        return "";
    }

    public String handleOptimizationRequest(final OptimizationRequest request) {
        heroDb.saveOptimizationRequest(request);
        System.gc();

        return optimize(request, HeroStats.builder()
                .atk(request.getAtk())
                .hp(request.getHp())
                .spd(request.getSpd())
                .def(request.getDef())
                .cr(request.getCr())
                .cd(request.getCd())
                .eff(request.getEff())
                .res(request.getRes())
                .dac(request.getDac())
                .build());
    }

    private String handleGetResultRowsRequest(final GetResultRowsRequest request) {
        if (request.getExecutionId() == null) {
            logger.warning("[getResultRows] executionId is null — returning empty");
            final GetResultRowsResponse response = GetResultRowsResponse.builder()
                    .heroStats(new HeroStats[] {})
                    .maximum(0)
                    .build();
            return gson.toJson(response);
        }
        final OptimizationDb optimizationDb = optimizationDbs.get(request.getExecutionId());
        logger.fine("[getResultRows] executionId=" + request.getExecutionId()
                + " dbFound=" + (optimizationDb != null)
                + " knownIds=" + optimizationDbs.keySet()
                + (optimizationDb != null
                        ? " maximum=" + optimizationDb.getMaximum()
                                + " done=" + optimizationDb.isDone()
                                + " results=" + optimizationDb.getResultsCounter().get()
                                + " searched=" + optimizationDb.getSearchedCounter().get()
                        : ""));
        if (optimizationDb == null) {
            return "";
        }

        final String heroId = request.getOptimizationRequest().getHeroId();
        final List<HeroStats> builds = heroDb.getBuildsForHero(heroId);
        final java.util.Set<String> buildHashes = builds.stream()
                .map(HeroStats::getBuildHash)
                .collect(Collectors.toSet());

        optimizationDb.sort(request.getSortColumn(), request.getSortOrder(), request.getSpdEffWeight());
        final HeroStats[] heroStats = optimizationDb.getRows(request.getStartRow(), request.getEndRow());
        final long maximum = optimizationDb.getMaximum();
        logger.fine("[getResultRows] getRows(" + request.getStartRow() + "," + request.getEndRow() + ")"
                + " => heroStats.length=" + (heroStats != null ? heroStats.length : "null")
                + " maximum=" + maximum);

        if (heroStats != null) {
            for (final HeroStats build : heroStats) {
                if (build == null) {
                    continue;
                }
                final String hash = build.getBuildHash();
                if (buildHashes.contains(hash)) {
                    build.setProperty("star");
                } else {
                    build.setProperty("none");
                }
            }
        }

        final GetResultRowsResponse response = GetResultRowsResponse.builder()
                .heroStats(heroStats)
                .maximum(maximum)
                .build();
        return gson.toJson(response);
    }

    private String handleGetBestSoFarRequest(final IdRequest request) {
        final GetResultRowsResponse emptyResponse = GetResultRowsResponse.builder()
                .heroStats(new HeroStats[] {})
                .maximum(0)
                .build();
        if (request.getId() == null) {
            return gson.toJson(emptyResponse);
        }
        final OptimizationDb optimizationDb = optimizationDbs.get(request.getId());
        if (optimizationDb == null) {
            return gson.toJson(emptyResponse);
        }
        final HeroStats[] best = optimizationDb.getBestSoFar(500);
        final long maximum = optimizationDb.getMaximum();
        final GetResultRowsResponse response = GetResultRowsResponse.builder()
                .heroStats(best)
                .maximum(maximum)
                .build();
        return gson.toJson(response);
    }

    private String handleGetExecutionProgressRequest(final IdRequest request) {
        final OptimizationResponse empty = OptimizationResponse.builder()
                .searched(0).results(0).done(true).build();
        if (request.getId() == null)
            return gson.toJson(empty);
        final OptimizationDb db = optimizationDbs.get(request.getId());
        if (db == null)
            return gson.toJson(empty);
        return gson.toJson(OptimizationResponse.builder()
                .searched(db.getSearchedCounter().get())
                .results(db.getResultsCounter().get())
                .done(db.isDone())
                .build());
    }

    private String handleCancelExecutionRequest(final IdRequest request) {
        if (request.getId() == null)
            return "";
        final OptimizationDb db = optimizationDbs.get(request.getId());
        if (db != null)
            db.interrupt();
        return "";
    }

    public void interruptAll() {
        synchronized (optimizationDbs) {
            optimizationDbs.values().forEach(OptimizationDb::interrupt);
        }
    }

    private String handleEditResultRowsRequest(final EditResultRowsRequest request) {
        final OptimizationDb optimizationDb = optimizationDbs.get(request.getExecutionId());
        if (optimizationDb == null) {
            return "";
        }

        final HeroStats[] heroStats = optimizationDb.getRows(request.getIndex(), request.getIndex() + 1);
        if (heroStats.length == 0) {
            return "";
        }

        final HeroStats heroStat = heroStats[0];

        heroStat.setProperty(request.getProperty());

        return "";
    }

    public void fillAccs(final StatCalculator statCalculator, final Item[] items, final HeroStats base,
            final boolean useReforgeStats) {
        for (final Item item : items) {
            item.tempStatAccArr = statCalculator.buildStatAccumulatorArr(base, item, useReforgeStats);
        }
    }

    public float[] flattenAccArrs(final Item[] items, final StatCalculator statCalculator) {
        return flattenAccArrs(items, statCalculator, new float[0]);
    }

    public float[] flattenAccArrs(final Item[] items, final StatCalculator statCalculator, final float[] pool) {
        final int needed = items.length * ARG_COUNT;
        final float[] output = pool.length >= needed ? pool : new float[needed];

        for (int i = 0; i < items.length; i++) {
            final Item item = items[i];
            final int base = i * ARG_COUNT;
            System.arraycopy(item.tempStatAccArr, 0, output, base, 3); // 0 atk, 1 hp, 2 def
            System.arraycopy(item.tempStatAccArr, 6, output, base + 3, 6); // 3 cr, 4 cd, 5 eff, 6 res, 7 spd, 8 score
            output[base + ARG_COUNT - 5] = item.set.index; // 9 set
            output[base + ARG_COUNT - 4] = item.priority; // 10 prio
            output[base + ARG_COUNT - 3] = item.upgradeable; // 11 upg
            output[base + ARG_COUNT - 2] = item.convertable; // 12 conv
            output[base + ARG_COUNT - 1] = item.alreadyEquipped; // 13 eq
        }

        return output;
    }

    // Compute a power of two less than or equal to `n`
    public static int findPreviousPowerOf2(int n) {
        // set all bits after the last set bit
        n = n | (n >> 1);
        n = n | (n >> 2);
        n = n | (n >> 4);
        n = n | (n >> 8);
        n = n | (n >> 16);

        // drop all but the last set bit from `n`
        return n - (n >> 1);
    }

    @SneakyThrows
    public String optimize(final OptimizationRequest request, final HeroStats unused) {
        final OptimizationDb optimizationDb = optimizationDbs.get(request.getExecutionId());
        if (optimizationDb == null) {
            return "";
        }

        // Register this execution in the global running count; always decrement on exit
        runningCount.incrementAndGet();
        try {
            return optimizeInternal(request, optimizationDb);
        } finally {
            runningCount.decrementAndGet();
            optimizationDb.setDone(true);
        }
    }

    @SneakyThrows
    private String optimizeInternal(final OptimizationRequest request, final OptimizationDb optimizationDb) {
        // Reset the global interrupt flag only when we're the sole running
        // optimization;
        // if a parallel run is already active, don't clear its interrupt state.
        if (runningCount.get() <= 1) {
            Main.interrupt = false;
        }

        long startTime = System.currentTimeMillis();
        final StatCalculator statCalculator = new StatCalculator();

        // Per-execution counters (thread-safe; each execution has its own)
        final AtomicLong searchedCounter = optimizationDb.getSearchedCounter();
        final AtomicLong resultsCounter = optimizationDb.getResultsCounter();

        final HeroStats base = baseStatsDb.getBaseStatsByName(request.hero.name, request.hero.getStars());
        if (base == null) {
            throw new RuntimeException("Hero not found in base stats database: " + request.hero.name
                    + " (stars=" + request.hero.getStars() + "). Check that hero data is loaded.");
        }
        _filterRejectLog.set(0);
        logger.info("[optimizeInternal] START hero=" + request.hero.name
                + " stars=" + request.hero.getStars()
                + " executionId=" + request.getExecutionId()
                + " setFormat=" + request.getSetFormat()
                + " sets=" + request.getInputSetsOne() + "+" + request.getInputSetsTwo()
                + " predictReforges=" + request.getInputPredictReforges()
                + " itemsReceived=" + (request.getItems() != null ? request.getItems().size() : 0));
        logger.info("[optimizeInternal] filters:"
                + " CR>=" + request.getInputCrMinLimit()
                + " CD>=" + request.getInputCdMinLimit()
                + " SPD>=" + request.getInputSpdMinLimit()
                + " HP>=" + request.getInputHpMinLimit()
                + " ATK>=" + request.getInputAtkMinLimit()
                + " minPriority=" + request.getInputMinPriorityLimit());
        addCalculatedFields(request);
        final boolean useReforgeStats = Boolean.TRUE.equals(request.getInputPredictReforges());
        final List<Item> rawItems = request.getItems();
        rawItems.forEach(x -> itemDb.calculateWss(x));

        final List<Set> firstSets = request.getInputSetsOne() != null
                ? request.getInputSetsOne()
                : Collections.emptyList();
        rawItems.sort(Comparator.comparing(Item::getSet, Comparator.nullsLast(Comparator.naturalOrder())));
        final List<Item> priorityItems = new ArrayList<>();
        final List<Item> otherItems = new ArrayList<>();
        for (Item item : rawItems) {
            if (firstSets.contains(item.getSet())) {
                priorityItems.add(item);
            } else {
                otherItems.add(item);
            }
        }

        priorityItems.addAll(otherItems);
        final List<Item> items = priorityItems;

        items.forEach(item -> {
            final String id = request.hero.getId();
            final String equippedId = item.getEquippedById();

            if (!Strings.CS.equals(id, equippedId) && StringUtils.isNotBlank(equippedId)) {
                item.alreadyEquipped = 1;
            }
        });

        final Map<Gear, List<Item>> itemsByGear = buildItemsByGear(items);

        final Map<String, float[]> accumulatorArrsByItemId = new ConcurrentHashMap<>(new HashMap<>());
        final ExecutorService executorService = Executors.newFixedThreadPool(2);

        // ── #13 Java Per-Slot Stat Pre-Filter (CR / CD / SPD / EFF) ──────────────────
        // For each stat with a minimum limit set, reject any item that provably cannot
        // contribute to a build satisfying that minimum — even when paired with the
        // best
        // items in every other slot plus the maximum possible set bonus. Runs before
        // the
        // slot size variables are computed so the filtered counts flow downstream.
        if (request.inputCrMinLimit > 0 || request.inputCdMinLimit > 0
                || request.inputSpdMinLimit > 0 || request.inputEffMinLimit > 0) {
            final Gear[] FILTER_GEARS = { Gear.WEAPON, Gear.HELMET, Gear.ARMOR, Gear.NECKLACE, Gear.RING, Gear.BOOTS };
            final Item[][] slotArrays = new Item[6][];
            for (int g = 0; g < 6; g++) {
                slotArrays[g] = itemsByGear.get(FILTER_GEARS[g]).toArray(new Item[0]);
                fillAccs(statCalculator, slotArrays[g], base, useReforgeStats);
            }

            // tempStatAccArr indices: [6]=CR, [7]=CD, [8]=EFF, [10]=SPD
            // Conservative upper-bound set bonuses (assumes most favourable gear set
            // composition)
            final float maxCrSet = 36f; // 3× CritSet 2-piece @ 12% each
            final float maxCdSet = 60f; // 1× RageSet 4-piece
            final float maxEffSet = 60f; // 3× EffSet 2-piece @ 20% each
            final float maxSpdSet = 0.25f * base.spd; // 1× SpeedSet 4-piece @ 25%

            // Hero base contributions that are always present regardless of gear
            final float heroBaseCr = base.cr + request.hero.bonusCr + request.hero.aeiCr;
            final float heroBaseCd = base.cd + request.hero.bonusCd + request.hero.aeiCd;
            final float heroBaseEff = base.eff + request.hero.bonusEff + request.hero.aeiEff;
            final float heroBaseSpd = base.spd + request.hero.bonusSpeed + request.hero.aeiSpeed;

            // Per-slot maximum contribution for each target stat
            final float[] maxCr = new float[6];
            final float[] maxCd = new float[6];
            final float[] maxEff = new float[6];
            final float[] maxSpd = new float[6];
            for (int g = 0; g < 6; g++) {
                for (final Item item : slotArrays[g]) {
                    if (item.tempStatAccArr[6] > maxCr[g])
                        maxCr[g] = item.tempStatAccArr[6];
                    if (item.tempStatAccArr[7] > maxCd[g])
                        maxCd[g] = item.tempStatAccArr[7];
                    if (item.tempStatAccArr[8] > maxEff[g])
                        maxEff[g] = item.tempStatAccArr[8];
                    if (item.tempStatAccArr[10] > maxSpd[g])
                        maxSpd[g] = item.tempStatAccArr[10];
                }
            }

            float sumCr = 0, sumCd = 0, sumEff = 0, sumSpd = 0;
            for (int g = 0; g < 6; g++) {
                sumCr += maxCr[g];
                sumCd += maxCd[g];
                sumEff += maxEff[g];
                sumSpd += maxSpd[g];
            }

            long removedTotal = 0;
            for (int g = 0; g < 6; g++) {
                final List<Item> slotList = itemsByGear.get(FILTER_GEARS[g]);
                final float otherCr = sumCr - maxCr[g];
                final float otherCd = sumCd - maxCd[g];
                final float otherEff = sumEff - maxEff[g];
                final float otherSpd = sumSpd - maxSpd[g];
                final int before = slotList.size();
                slotList.clear();
                for (final Item item : slotArrays[g]) {
                    if (request.inputCrMinLimit > 0
                            && item.tempStatAccArr[6] + otherCr + heroBaseCr + maxCrSet < request.inputCrMinLimit)
                        continue;
                    if (request.inputCdMinLimit > 0
                            && item.tempStatAccArr[7] + otherCd + heroBaseCd + maxCdSet < request.inputCdMinLimit)
                        continue;
                    if (request.inputSpdMinLimit > 0
                            && item.tempStatAccArr[10] + otherSpd + heroBaseSpd + maxSpdSet < request.inputSpdMinLimit)
                        continue;
                    if (request.inputEffMinLimit > 0
                            && item.tempStatAccArr[8] + otherEff + heroBaseEff + maxEffSet < request.inputEffMinLimit)
                        continue;
                    slotList.add(item);
                }
                removedTotal += before - slotList.size();
            }
            if (removedTotal > 0) {
                logger.info(
                        "[preFilter] removed " + removedTotal + " items across all slots via CR/CD/SPD/EFF stat floor");
            }
        }

        final long wSize = itemsByGear.get(Gear.WEAPON).size();
        final long hSize = itemsByGear.get(Gear.HELMET).size();
        final long aSize = itemsByGear.get(Gear.ARMOR).size();
        final long nSize = itemsByGear.get(Gear.NECKLACE).size();
        final long rSize = itemsByGear.get(Gear.RING).size();
        final long bSize = itemsByGear.get(Gear.BOOTS).size();
        final long maxPermsPreview = wSize * hSize * aSize * nSize * rSize * bSize;
        logger.info("[optimizeInternal] items per slot:"
                + " W=" + wSize + " H=" + hSize + " A=" + aSize
                + " N=" + nSize + " R=" + rSize + " B=" + bSize
                + " => maxPerms=" + maxPermsPreview);
        if (wSize == 0 || hSize == 0 || aSize == 0 || nSize == 0 || rSize == 0 || bSize == 0) {
            logger.severe("[optimizeInternal] FATAL: one or more slots have 0 items — will produce 0 results");
        }

        final Item[] allweapons = itemsByGear.get(Gear.WEAPON).toArray(new Item[0]);
        final Item[] allhelmets = itemsByGear.get(Gear.HELMET).toArray(new Item[0]);
        final Item[] allarmors = itemsByGear.get(Gear.ARMOR).toArray(new Item[0]);
        final Item[] allnecklaces = itemsByGear.get(Gear.NECKLACE).toArray(new Item[0]);
        final Item[] allrings = itemsByGear.get(Gear.RING).toArray(new Item[0]);
        final Item[] allboots = itemsByGear.get(Gear.BOOTS).toArray(new Item[0]);

        fillAccs(statCalculator, allweapons, base, useReforgeStats);
        fillAccs(statCalculator, allhelmets, base, useReforgeStats);
        fillAccs(statCalculator, allarmors, base, useReforgeStats);
        fillAccs(statCalculator, allnecklaces, base, useReforgeStats);
        fillAccs(statCalculator, allrings, base, useReforgeStats);
        fillAccs(statCalculator, allboots, base, useReforgeStats);

        final AtomicInteger maxReached = new AtomicInteger();

        final boolean isShortCircuitable4PieceSet = request.getSetFormat() == 1 || request.getSetFormat() == 2;

        // Long-safe permutation count. wSize…bSize are ints, so `int * int` is
        // evaluated in
        // int arithmetic and overflows (wrong/negative) BEFORE widening to long — which
        // would
        // corrupt the GPU-vs-CPU decision and result sizing below for large
        // mod-expanded pools.
        // multiplyExact keeps it exact; any overflow is treated as "over the ceiling".
        long maxPermsTmp;
        try {
            maxPermsTmp = Math.multiplyExact((long) wSize, hSize);
            maxPermsTmp = Math.multiplyExact(maxPermsTmp, aSize);
            maxPermsTmp = Math.multiplyExact(maxPermsTmp, nSize);
            maxPermsTmp = Math.multiplyExact(maxPermsTmp, rSize);
            maxPermsTmp = Math.multiplyExact(maxPermsTmp, bSize);
        } catch (final ArithmeticException overflow) {
            maxPermsTmp = Long.MAX_VALUE;
        }
        final long maxPerms = maxPermsTmp;
        final int MAXIMUM_RESULTS_PREVIEW = (int) Math.min(maxPerms, SETTING_MAXIMUM_RESULTS);
        final boolean useGpuPreview = SETTING_GPU && canUseGpu && maxPerms >= 20_000_000 && runningCount.get() <= 1;
        logger.info("[optimizeInternal] maxPerms=" + maxPerms
                + " MAXIMUM_RESULTS=" + MAXIMUM_RESULTS_PREVIEW
                + " useGPU=" + useGpuPreview
                + " isShortCircuitable4Piece=" + isShortCircuitable4PieceSet);

        // Hard backstop: refuse a pool so large the search would never finish (or whose
        // count
        // overflowed → Long.MAX_VALUE above). Returns the "ERROR" contract (api.js
        // surfaces it
        // via Notifier.error) before any large allocation or kernel launch. Empty-slot
        // pools
        // (maxPerms == 0) fall through to the existing 0-results handling unchanged.
        if (maxPerms > SETTING_MAX_PERMUTATIONS) {
            logger.severe("[optimizeInternal] ABORT: permutation count " + maxPerms
                    + " exceeds limit " + SETTING_MAX_PERMUTATIONS
                    + " — tighten filters or reduce mod variants and retry.");
            return "ERROR";
        }
        statCalculator.setBaseValues(base, request.hero);
        statCalculator.setPriorityWeights(request);
        statCalculator.setTargets(request);
        statCalculator.setUsePvECritDamageCap(Boolean.TRUE.equals(request.getInputUsePvECritDamageCap()));

        // Always use fresh local arrays — pooled arrays are not safe for concurrent
        // runs
        final float[] flattenedWeaponAccs = flattenAccArrs(allweapons, statCalculator);
        final float[] flattenedHelmetAccs = flattenAccArrs(allhelmets, statCalculator);
        final float[] flattenedArmorAccs = flattenAccArrs(allarmors, statCalculator);
        final float[] flattenedNecklaceAccs = flattenAccArrs(allnecklaces, statCalculator);
        final float[] flattenedRingAccs = flattenAccArrs(allrings, statCalculator);
        final float[] flattenedBootAccs = flattenAccArrs(allboots, statCalculator);

        final Hero hero = request.hero;

        final float atkSetBonus = 0.45f * base.atk;
        final float hpSetBonus = 0.20f * base.hp;
        final float defSetBonus = 0.20f * base.def;

        final float speedSetBonus = 0.25f * base.spd;
        final float revengeSetBonus = 0.12f * base.spd;
        final float reversalSetBonus = 0.15f * base.spd;
        final float weakeningSetBonus = 0.15f * base.spd;

        final float bonusBaseAtk = base.atk + base.atk * (hero.bonusAtkPercent + hero.aeiAtkPercent) / 100f
                + hero.bonusAtk + hero.aeiAtk;
        final float bonusBaseHp = base.hp + base.hp * (hero.bonusHpPercent + hero.aeiHpPercent) / 100f + hero.bonusHp
                + hero.aeiHp;
        final float bonusBaseDef = base.def + base.def * (hero.bonusDefPercent + hero.aeiDefPercent) / 100f
                + hero.bonusDef + hero.aeiDef;

        final float bonusMaxAtk;
        final float bonusMaxHp;
        final float bonusMaxDef;

        if (base.bonusStats == null) {
            bonusMaxAtk = 1 + hero.finalAtkMultiplier / 100;
            bonusMaxHp = 1 + hero.finalHpMultiplier / 100;
            bonusMaxDef = 1 + hero.finalDefMultiplier / 100;
        } else {
            bonusMaxAtk = 1 + base.bonusStats.bonusMaxAtkPercent / 100f + hero.finalAtkMultiplier / 100;
            bonusMaxHp = 1 + base.bonusStats.bonusMaxHpPercent / 100f + hero.finalHpMultiplier / 100;
            bonusMaxDef = 1 + base.bonusStats.bonusMaxDefPercent / 100f + hero.finalDefMultiplier / 100;
        }

        final float penSetDmgBonus = (StatCalculator.SETTING_PEN_DEFENSE / 300f + 1)
                / (0.00283333f * StatCalculator.SETTING_PEN_DEFENSE + 1);

        final int SETTING_RAGE_SET = StatCalculator.SETTING_RAGE_SET ? 1 : 0;
        final int SETTING_PEN_SET = StatCalculator.SETTING_PEN_SET ? 1 : 0;
        final int SETTING_FERVOR_SET = StatCalculator.SETTING_FERVOR_SET ? 1 : 0;

        // Keep-best-N mode: scan the whole space, keep only the best N builds by
        // priority in a bounded heap (no early-exit, no giant pre-allocated array).
        // It uses its OWN result cap (keepBestNLimit) so the "scan all" limit can
        // differ from the legacy stop-at-limit (SETTING_MAXIMUM_RESULTS); 0 ⇒ fall
        // back to the legacy setting.
        final boolean keepBestN = request.isKeepBestN();
        final long resultCapSetting = (keepBestN && request.getKeepBestNLimit() > 0)
                ? request.getKeepBestNLimit()
                : SETTING_MAXIMUM_RESULTS;
        final int MAXIMUM_RESULTS = (int) Math.min(maxPerms, resultCapSetting);

        final TopNResults topN = keepBestN ? new TopNResults(MAXIMUM_RESULTS) : null;

        logger.fine("Start allocating memory");
        // Legacy mode keeps the pre-allocated array; keep-best-N skips that ~N×0.7KB
        // allocation entirely (the heap grows lazily).
        final HeroStats[] resultHeroStats = keepBestN ? null : new HeroStats[MAXIMUM_RESULTS];
        logger.fine("Finished allocating memory");

        // Enable live streaming: frontend can poll getResultRows during the run
        if (keepBestN) {
            optimizationDb.setLiveTopN(topN);
        } else {
            optimizationDb.setLiveResults(resultHeroStats, resultsCounter);
        }

        final GpuOptimizerKernel kernel;

        hero.setDamageMultipliers(request.damageMultipliers);
        heroDb.getHeroById(hero.getId()).setDamageMultipliers(request.getDamageMultipliers());

        // Disable GPU when running in parallel — the GPU kernel is not thread-safe
        // across concurrent executions
        final boolean useGpu = SETTING_GPU && canUseGpu && maxPerms >= 20_000_000 && runningCount.get() <= 1;

        if (useGpu) {
            // GPU Optimize

            final int max = 1048576;

            ensureSolutionBitMasks();
            kernel = getOrCreateKernel(
                    request,
                    flattenedWeaponAccs,
                    flattenedHelmetAccs,
                    flattenedArmorAccs,
                    flattenedNecklaceAccs,
                    flattenedRingAccs,
                    flattenedBootAccs,
                    bonusBaseAtk,
                    bonusBaseDef,
                    bonusBaseHp,
                    atkSetBonus,
                    hpSetBonus,
                    defSetBonus,
                    speedSetBonus,
                    revengeSetBonus,
                    reversalSetBonus,
                    weakeningSetBonus,
                    penSetDmgBonus,
                    StatCalculator.SETTING_PEN_DEFENSE,
                    bonusMaxAtk,
                    bonusMaxDef,
                    bonusMaxHp,
                    SETTING_RAGE_SET,
                    SETTING_PEN_SET,
                    SETTING_FERVOR_SET,
                    base,
                    hero,
                    ARG_COUNT,
                    wSize,
                    hSize,
                    aSize,
                    nSize,
                    rSize,
                    bSize,
                    max, setSolutionBitMasks);

            try {

                int maxWorkGroupSize = 64;

                try {

                    List<OpenCLPlatform> platforms = OpenCLPlatform.getUncachedOpenCLPlatforms();
                    final Optional<OpenCLDevice> bestDevice = platforms.stream()
                            .flatMap(x -> x.getOpenCLDevices().stream())
                            .filter(x -> x.getDeviceId() == Main.BEST_DEVICE_ID)
                            .findFirst();

                    logger.fine("Best OpenCL device: " + bestDevice);

                    final int kernelMaxWorkGroupSize = kernel.getKernelMaxWorkGroupSize(bestDevice.get());
                    logger.fine("Kernel max work group size: " + kernelMaxWorkGroupSize);

                    maxWorkGroupSize = kernelMaxWorkGroupSize;
                    logger.fine("Kernel max work group size power of 2: " + maxWorkGroupSize);
                } catch (final Exception e) {
                    logger.log(Level.WARNING, "Could not find max work group size. Defaulting.", e);
                }

                final int finalMaxWorkGroupSize = maxWorkGroupSize;

                final AtomicBoolean exit = new AtomicBoolean(false);
                final AtomicInteger executionCounter = new AtomicInteger(0);

                final Map<String, PassesContainer> passesPool = new HashMap<>();

                for (int i = 0; i < maxPerms / max + 1; i++) {
                    if (exit.get() || Main.interrupt || optimizationDb.isInterrupted())
                        break;

                    final int finalI = i;

                    final boolean[] passes;
                    final String passesId;
                    final Optional<PassesContainer> containerOptional = passesPool.values()
                            .stream()
                            .filter(x -> !x.isLocked())
                            .findFirst();
                    if (containerOptional.isPresent()) {
                        final PassesContainer container = containerOptional.get();
                        passes = container.getPasses();
                        passesId = container.getId();
                        container.setLocked(true);
                    } else {
                        try {
                            passes = new boolean[max];
                            passesId = String.valueOf(finalI);
                            passesPool.put(passesId, PassesContainer.builder()
                                    .id(passesId)
                                    .passes(passes)
                                    .locked(true)
                                    .build());
                        } catch (final OutOfMemoryError e) {
                            logger.log(Level.SEVERE, "Out of memory allocating GPU passes buffer", e);
                            break;
                        }
                    }

                    List<OpenCLPlatform> platforms = OpenCLPlatform.getUncachedOpenCLPlatforms();
                    final Optional<OpenCLDevice> bestDevice = platforms.stream()
                            .flatMap(x -> x.getOpenCLDevices().stream())
                            .filter(x -> x.getDeviceId() == Main.BEST_DEVICE_ID)
                            .findFirst();

                    while (executionCounter.get() > 1 && !exit.get() && !Main.interrupt
                            && !optimizationDb.isInterrupted()) {
                        Thread.sleep(10);
                    }

                    executionCounter.incrementAndGet();

                    if (!bestDevice.isPresent()) {
                        executionCounter.decrementAndGet();
                        logger.warning("Could not find OpenCL device for batch " + finalI + ". Aborting GPU run.");
                        exit.set(true);
                        break;
                    }
                    final Range range = bestDevice.get().createRange(max, finalMaxWorkGroupSize);
                    kernel.setIteration(finalI);
                    kernel.setPasses(passes);
                    kernel.putPasses();
                    try {
                        kernel.execute(range);
                        kernel.getPasses();
                    } catch (final Exception e) {
                        logger.warning("GPU error, please try again. " + e);
                        break;
                    }

                    executorService.submit(() -> {
                        try {
                            // Use remaining permutations for this batch so the last batch doesn't overcount
                            searchedCounter.addAndGet(Math.min(max, maxPerms - (long) finalI * max));

                            for (int j = 0; j < max; j++) {
                                if (exit.get() || optimizationDb.isInterrupted()) {
                                    break;
                                }
                                final long iteration = ((long) finalI) * max + j;
                                if (iteration >= maxPerms) {
                                    break;
                                }

                                if (passes[j]) {

                                    final int b = (int) (iteration % bSize);
                                    final int r = (int) (((iteration - b) / bSize) % rSize);
                                    final int n = (int) (((iteration - r * bSize - b) / (bSize * rSize)) % nSize);
                                    final int a = (int) (((iteration - n * rSize * bSize - r * bSize - b)
                                            / (bSize * rSize * nSize)) % aSize);
                                    final int h = (int) (((iteration - a * nSize * rSize * bSize - n * rSize * bSize
                                            - r * bSize - b) / (bSize * rSize * nSize * aSize)) % hSize);
                                    final int w = (int) (((iteration - h * aSize * nSize * rSize * bSize
                                            - a * nSize * rSize * bSize - n * rSize * bSize - r * bSize - b)
                                            / (bSize * rSize * nSize * aSize * hSize)) % wSize);

                                    final Item weapon = allweapons[w];
                                    final Item helmet = allhelmets[h];
                                    final Item armor = allarmors[a];
                                    final Item necklace = allnecklaces[n];
                                    final Item ring = allrings[r];
                                    final Item boots = allboots[b];

                                    // Phase 4: max pieces to mod filter
                                    final Integer maxModPieces4 = request.hero.getMaxModPieces();
                                    if (maxModPieces4 != null && maxModPieces4 < 6) {
                                        final int modCount = (weapon.getMod() != null ? 1 : 0)
                                                + (helmet.getMod() != null ? 1 : 0)
                                                + (armor.getMod() != null ? 1 : 0)
                                                + (necklace.getMod() != null ? 1 : 0)
                                                + (ring.getMod() != null ? 1 : 0)
                                                + (boots.getMod() != null ? 1 : 0);
                                        if (modCount > maxModPieces4)
                                            continue;
                                    }

                                    final Item[] collectedItems = new Item[] { weapon, helmet, armor, necklace, ring,
                                            boots };
                                    final int[] collectedSets = statCalculator.buildSetsArr(collectedItems);

                                    final int reforges = weapon.upgradeable + helmet.upgradeable + armor.upgradeable
                                            + necklace.upgradeable + ring.upgradeable + boots.upgradeable;
                                    final int conversions = weapon.convertable + helmet.convertable + armor.convertable
                                            + necklace.convertable + ring.convertable + boots.convertable;
                                    final int alreadyEquipped = weapon.alreadyEquipped + helmet.alreadyEquipped
                                            + armor.alreadyEquipped + necklace.alreadyEquipped + ring.alreadyEquipped
                                            + boots.alreadyEquipped;
                                    final int priority = weapon.priority + helmet.priority + armor.priority
                                            + necklace.priority + ring.priority + boots.priority;
                                    final int weightedScore = weapon.priorityScore + helmet.priorityScore
                                            + armor.priorityScore + necklace.priorityScore + ring.priorityScore
                                            + boots.priorityScore;

                                    // buildScore (the keep-best-N retention basis) needs the build's final
                                    // stats for its target bonus, so it can't pre-gate before the HeroStats
                                    // build the way the old priority sum could. topN.offer() still rejects
                                    // sub-threshold builds lock-free on buildScore; only the stat build is
                                    // now unavoidable per kept permutation.
                                    final HeroStats result = statCalculator.addAccumulatorArrsToHero(base,
                                            new float[][] { weapon.tempStatAccArr, helmet.tempStatAccArr,
                                                    armor.tempStatAccArr, necklace.tempStatAccArr, ring.tempStatAccArr,
                                                    boots.tempStatAccArr },
                                            collectedSets, request.hero, reforges, conversions, alreadyEquipped,
                                            priority, weightedScore);

                                    result.setSets(collectedSets);
                                    result.setItems(
                                            Arrays.asList(allweapons[w].getId(), allhelmets[h].getId(), allarmors[a]
                                                    .getId(), allnecklaces[n].id, allrings[r].id, allboots[b].id));
                                    result.setModIds(Arrays.asList(allweapons[w].getModId(),
                                            allhelmets[h].getModId(), allarmors[a]
                                                    .getModId(),
                                            allnecklaces[n].modId, allrings[r].modId, allboots[b].modId));
                                    result.setMods(Arrays.asList(allweapons[w].getMod(), allhelmets[h].getMod(),
                                            allarmors[a]
                                                    .getMod(),
                                            allnecklaces[n].getMod(), allrings[r].getMod(), allboots[b].getMod()));

                                    if (keepBestN) {
                                        // Scan everything; the bounded heap keeps the best N by priority.
                                        result.setId(String.valueOf(resultsCounter.getAndIncrement()));
                                        topN.offer(result);
                                    } else {
                                        final long resultsIndex = resultsCounter.getAndIncrement();

                                        if (resultsIndex >= MAXIMUM_RESULTS) {
                                            maxReached.set(MAXIMUM_RESULTS);
                                            exit.set(true);
                                            break;
                                        }

                                        result.setId(String.valueOf(resultsIndex));
                                        resultHeroStats[(int) resultsIndex] = result;
                                    }
                                }
                            }

                            passesPool.get(passesId).setLocked(false);
                        } catch (final Exception e) {
                            logger.log(Level.WARNING, "Error processing GPU batch results", e);
                        } finally {
                            executionCounter.decrementAndGet();
                        }
                    });

                }
            } finally {
                // kernel kept alive for reuse via cachedKernel
            }
        } else {
            // CPU Optimize — sort slots by ascending item count so the smallest slot is
            // the outermost loop (fewest tasks × least wasted work per early rejection).
            // Split at the two outermost positions for ForkJoinPool work-stealing.
            final Gear[] CANONICAL_GEARS = {
                    Gear.WEAPON, Gear.HELMET, Gear.ARMOR, Gear.NECKLACE, Gear.RING, Gear.BOOTS };
            final long[] allSizes = { wSize, hSize, aSize, nSize, rSize, bSize };

            // Sort canonical slot indices 0-5 by ascending item count.
            final Integer[] slotOrder = { 0, 1, 2, 3, 4, 5 };
            Arrays.sort(slotOrder, Comparator.comparingLong(i -> allSizes[i]));

            @SuppressWarnings("unchecked")
            final List<Item>[] orderedItems = new List[6];
            final long[] orderedSizes = new long[6];
            for (int i = 0; i < 6; i++) {
                orderedItems[i] = itemsByGear.get(CANONICAL_GEARS[slotOrder[i]]);
                orderedSizes[i] = allSizes[slotOrder[i]];
            }

            logger.info("[optimizeInternal] CPU loop order (smallest first):"
                    + " " + CANONICAL_GEARS[slotOrder[0]] + "=" + orderedSizes[0]
                    + " " + CANONICAL_GEARS[slotOrder[1]] + "=" + orderedSizes[1]
                    + " " + CANONICAL_GEARS[slotOrder[2]] + "=" + orderedSizes[2]
                    + " " + CANONICAL_GEARS[slotOrder[3]] + "=" + orderedSizes[3]
                    + " " + CANONICAL_GEARS[slotOrder[4]] + "=" + orderedSizes[4]
                    + " " + CANONICAL_GEARS[slotOrder[5]] + "=" + orderedSizes[5]);

            final List<Future<?>> cpuFutures = new ArrayList<>((int) (orderedSizes[0] * orderedSizes[1]));

            for (int i0 = 0; i0 < orderedSizes[0]; i0++) {
                final Item item0 = orderedItems[0].get(i0);
                final float[] acc0 = statCalculator.getStatAccumulatorArr(base, item0,
                        accumulatorArrsByItemId, useReforgeStats);

                for (int i1 = 0; i1 < orderedSizes[1]; i1++) {
                    final Item item1 = orderedItems[1].get(i1);
                    final float[] acc1 = statCalculator.getStatAccumulatorArr(base, item1,
                            accumulatorArrsByItemId, useReforgeStats);

                    cpuFutures.add(ForkJoinPool.commonPool().submit(() -> {
                        boolean exit = false;
                        try {
                            for (int i2 = 0; i2 < orderedSizes[2]; i2++) {
                                final Item item2 = orderedItems[2].get(i2);
                                final float[] acc2 = statCalculator.getStatAccumulatorArr(base, item2,
                                        accumulatorArrsByItemId, useReforgeStats);

                                // For 4-piece sets, short-circuit once the first 3 loop slots
                                // contain no 4-piece set item (items are sorted firstSets-first).
                                if (isShortCircuitable4PieceSet) {
                                    if (!(firstSets.contains(item0.getSet())
                                            || firstSets.contains(item1.getSet())
                                            || firstSets.contains(item2.getSet()))) {
                                        break;
                                    }
                                }

                                for (int i3 = 0; i3 < orderedSizes[3]; i3++) {
                                    final Item item3 = orderedItems[3].get(i3);
                                    final float[] acc3 = statCalculator.getStatAccumulatorArr(base, item3,
                                            accumulatorArrsByItemId, useReforgeStats);

                                    for (int i4 = 0; i4 < orderedSizes[4]; i4++) {
                                        final Item item4 = orderedItems[4].get(i4);
                                        final float[] acc4 = statCalculator.getStatAccumulatorArr(base, item4,
                                                accumulatorArrsByItemId, useReforgeStats);

                                        for (int i5 = 0; i5 < orderedSizes[5]; i5++) {
                                            if (optimizationDb.isInterrupted()) {
                                                return;
                                            }
                                            if (exit)
                                                return;

                                            final Item item5 = orderedItems[5].get(i5);

                                            // Phase 4: max pieces to mod filter
                                            final Integer maxModPieces4 = request.hero.getMaxModPieces();
                                            if (maxModPieces4 != null && maxModPieces4 < 6) {
                                                final int modCount = (item0.getMod() != null ? 1 : 0)
                                                        + (item1.getMod() != null ? 1 : 0)
                                                        + (item2.getMod() != null ? 1 : 0)
                                                        + (item3.getMod() != null ? 1 : 0)
                                                        + (item4.getMod() != null ? 1 : 0)
                                                        + (item5.getMod() != null ? 1 : 0);
                                                if (modCount > maxModPieces4)
                                                    continue;
                                            }

                                            final float[] acc5 = statCalculator.getStatAccumulatorArr(
                                                    base, item5, accumulatorArrsByItemId, useReforgeStats);

                                            // Rebuild arrays in canonical slot order
                                            // (index 0=Weapon, 1=Helmet, 2=Armor, 3=Necklace, 4=Ring, 5=Boots)
                                            // so that result.setItems / setMods are correct for the frontend.
                                            final Item[] collectedItems = new Item[6];
                                            final float[][] accs = new float[6][];
                                            collectedItems[slotOrder[0]] = item0;
                                            accs[slotOrder[0]] = acc0;
                                            collectedItems[slotOrder[1]] = item1;
                                            accs[slotOrder[1]] = acc1;
                                            collectedItems[slotOrder[2]] = item2;
                                            accs[slotOrder[2]] = acc2;
                                            collectedItems[slotOrder[3]] = item3;
                                            accs[slotOrder[3]] = acc3;
                                            collectedItems[slotOrder[4]] = item4;
                                            accs[slotOrder[4]] = acc4;
                                            collectedItems[slotOrder[5]] = item5;
                                            accs[slotOrder[5]] = acc5;

                                            final int[] collectedSets = statCalculator.buildSetsArr(collectedItems);
                                            final int reforges = item0.upgradeable + item1.upgradeable
                                                    + item2.upgradeable + item3.upgradeable
                                                    + item4.upgradeable + item5.upgradeable;
                                            final int conversions = item0.convertable + item1.convertable
                                                    + item2.convertable + item3.convertable
                                                    + item4.convertable + item5.convertable;
                                            final int alreadyEquipped = item0.alreadyEquipped + item1.alreadyEquipped
                                                    + item2.alreadyEquipped + item3.alreadyEquipped
                                                    + item4.alreadyEquipped + item5.alreadyEquipped;
                                            final int priority = item0.priority + item1.priority
                                                    + item2.priority + item3.priority
                                                    + item4.priority + item5.priority;
                                            final int weightedScore = item0.priorityScore + item1.priorityScore
                                                    + item2.priorityScore + item3.priorityScore
                                                    + item4.priorityScore + item5.priorityScore;

                                            // buildScore (the keep-best-N retention basis) needs the build's
                                            // final stats for its target bonus, so unlike the old priority
                                            // sum it can't pre-gate before the HeroStats build. topN.offer()
                                            // still rejects sub-threshold builds lock-free on buildScore.
                                            final HeroStats result = statCalculator.addAccumulatorArrsToHero(
                                                    base,
                                                    accs,
                                                    collectedSets,
                                                    request.hero,
                                                    reforges,
                                                    conversions,
                                                    alreadyEquipped,
                                                    priority,
                                                    weightedScore);
                                            searchedCounter.getAndIncrement();

                                            final boolean passesFilter = passesFilter(result, request, collectedSets);
                                            result.setSets(collectedSets);
                                            if (passesFilter) {
                                                if (keepBestN) {
                                                    // Scan everything; the bounded heap keeps the best N.
                                                    result.setId(String.valueOf(resultsCounter.getAndIncrement()));
                                                    result.setItems(Arrays.asList(
                                                            collectedItems[0].getId(),
                                                            collectedItems[1].getId(),
                                                            collectedItems[2].getId(),
                                                            collectedItems[3].getId(),
                                                            collectedItems[4].getId(),
                                                            collectedItems[5].getId()));
                                                    result.setModIds(Arrays.asList(
                                                            collectedItems[0].getModId(),
                                                            collectedItems[1].getModId(),
                                                            collectedItems[2].getModId(),
                                                            collectedItems[3].getModId(),
                                                            collectedItems[4].getModId(),
                                                            collectedItems[5].getModId()));
                                                    result.setMods(Arrays.asList(
                                                            collectedItems[0].getMod(),
                                                            collectedItems[1].getMod(),
                                                            collectedItems[2].getMod(),
                                                            collectedItems[3].getMod(),
                                                            collectedItems[4].getMod(),
                                                            collectedItems[5].getMod()));
                                                    topN.offer(result);
                                                } else {
                                                    final long resultsIndex = resultsCounter.getAndIncrement();
                                                    if (resultsIndex < MAXIMUM_RESULTS) {
                                                        result.setId(String.valueOf(resultsIndex));

                                                        result.setItems(Arrays.asList(
                                                                collectedItems[0].getId(),
                                                                collectedItems[1].getId(),
                                                                collectedItems[2].getId(),
                                                                collectedItems[3].getId(),
                                                                collectedItems[4].getId(),
                                                                collectedItems[5].getId()));
                                                        result.setModIds(Arrays.asList(
                                                                collectedItems[0].getModId(),
                                                                collectedItems[1].getModId(),
                                                                collectedItems[2].getModId(),
                                                                collectedItems[3].getModId(),
                                                                collectedItems[4].getModId(),
                                                                collectedItems[5].getModId()));
                                                        result.setMods(Arrays.asList(
                                                                collectedItems[0].getMod(),
                                                                collectedItems[1].getMod(),
                                                                collectedItems[2].getMod(),
                                                                collectedItems[3].getMod(),
                                                                collectedItems[4].getMod(),
                                                                collectedItems[5].getMod()));

                                                        resultHeroStats[(int) resultsIndex] = result;

                                                        if (resultsIndex == MAXIMUM_RESULTS - 1) {
                                                            maxReached.set(MAXIMUM_RESULTS - 1);
                                                        }
                                                    } else {
                                                        exit = true;
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (final Exception e) {
                            logger.log(Level.WARNING, "Error in CPU optimization task", e);
                        }
                    }));
                }
            }
            for (final Future<?> f : cpuFutures) {
                try {
                    f.get();
                } catch (final Exception e) {
                    logger.log(Level.WARNING, "Error awaiting CPU optimization task", e);
                }
            }
        }

        logger.info("Time taken: " + (System.currentTimeMillis() - startTime) + " ms");

        try {
            executorService.shutdown();
            executorService.awaitTermination(50000, TimeUnit.MILLISECONDS);

            try {
                // Keep-best-N finalizes from the bounded heap; legacy from the array.
                final HeroStats[] finalArr;
                final long size;
                if (keepBestN) {
                    finalArr = topN.toArray();
                    size = finalArr.length;
                } else {
                    finalArr = resultHeroStats;
                    // resultHeroStats has length MAXIMUM_RESULTS, and both the CPU and GPU paths
                    // only
                    // write at indices < MAXIMUM_RESULTS, so the filled portion is exactly
                    // min(resultsCounter, MAXIMUM_RESULTS). The previous maxReached-flag check
                    // matched
                    // only the CPU path (which sets maxReached = MAXIMUM_RESULTS - 1); the GPU path
                    // sets
                    // MAXIMUM_RESULTS, so size fell back to the overshooting resultsCounter and
                    // could
                    // exceed the array length when MAXIMUM_RESULTS < the 5,000,000 clamp.
                    size = Math.min(MAXIMUM_RESULTS, resultsCounter.get());
                }
                logger.info("[optimizeInternal] COMPLETE"
                        + " keepBestN=" + keepBestN
                        + " searched=" + searchedCounter.get()
                        + " results=" + resultsCounter.get()
                        + " maxReached=" + maxReached.get()
                        + " size=" + size
                        + " interrupted=" + optimizationDb.isInterrupted()
                        + " maxPerms=" + maxPerms);
                if (size == 0) {
                    logger.warning("[optimizeInternal] 0 results stored — all " + searchedCounter.get()
                            + " combinations were rejected by passesFilter()");
                }

                optimizationDb.setResultHeroes(finalArr, size);

                OptimizationResponse response = OptimizationResponse.builder()
                        .searched(Math.min(searchedCounter.get(), maxPerms))
                        .results(keepBestN ? size : resultsCounter.get())
                        .keptBestN(keepBestN)
                        .build();

                return gson.toJson(response);
            } catch (final Exception e) {
                logger.log(Level.SEVERE, "Error finalizing optimization results", e);
            }
        } catch (final Exception e) {
            logger.log(Level.SEVERE, "Error during optimization shutdown", e);
        }

        return "";
    }

    public int[] convertSetsArrayIntoIndexArray(final int[] sets) {
        final int[] output = new int[] { 0, 0, 0, 0, 0, 0 };
        int count = 0;

        for (int i = 0; i < SET_COUNT; i++) {
            if (sets[i] > 0) {
                for (int j = 0; j < sets[i]; j++) {
                    output[count] = i;
                    count++;
                }
            }
        }

        return output;
    }

    public int[] convertSetsToSetCounters(final int[] sets) {
        final int[] output = new int[] { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }; // Length
                                                                                                                   // of
                                                                                                                   // SET_COUNT

        for (int i = 0; i < sets.length; i++) {
            output[sets[i]]++;
        }

        return output;
    }

    private static final java.util.concurrent.atomic.AtomicLong _filterRejectLog = new java.util.concurrent.atomic.AtomicLong(
            0);

    public boolean passesFilter(final HeroStats heroStats, final OptimizationRequest request, final int[] sets) {
        String rejectReason = null;
        if (heroStats.cr < request.inputCrMinLimit)
            rejectReason = "cr=" + heroStats.cr + " < " + request.inputCrMinLimit;
        else if (heroStats.cr > request.inputCrMaxLimit)
            rejectReason = "cr=" + heroStats.cr + " > " + request.inputCrMaxLimit;
        else if (heroStats.cd < request.inputCdMinLimit)
            rejectReason = "cd=" + heroStats.cd + " < " + request.inputCdMinLimit;
        else if (heroStats.cd > request.inputCdMaxLimit)
            rejectReason = "cd=" + heroStats.cd + " > " + request.inputCdMaxLimit;
        else if (heroStats.spd < request.inputSpdMinLimit)
            rejectReason = "spd=" + heroStats.spd + " < " + request.inputSpdMinLimit;
        else if (heroStats.spd > request.inputSpdMaxLimit)
            rejectReason = "spd=" + heroStats.spd + " > " + request.inputSpdMaxLimit;
        else if (heroStats.hp < request.inputHpMinLimit)
            rejectReason = "hp=" + heroStats.hp + " < " + request.inputHpMinLimit;
        else if (heroStats.hp > request.inputHpMaxLimit)
            rejectReason = "hp=" + heroStats.hp + " > " + request.inputHpMaxLimit;
        else if (heroStats.atk < request.inputAtkMinLimit)
            rejectReason = "atk=" + heroStats.atk + " < " + request.inputAtkMinLimit;
        else if (heroStats.atk > request.inputAtkMaxLimit)
            rejectReason = "atk=" + heroStats.atk + " > " + request.inputAtkMaxLimit;
        else if (heroStats.def < request.inputDefMinLimit)
            rejectReason = "def=" + heroStats.def + " < " + request.inputDefMinLimit;
        else if (heroStats.def > request.inputDefMaxLimit)
            rejectReason = "def=" + heroStats.def + " > " + request.inputDefMaxLimit;
        else if (heroStats.priority < request.inputMinPriorityLimit)
            rejectReason = "priority=" + heroStats.priority + " < " + request.inputMinPriorityLimit;
        else if (heroStats.priority > request.inputMaxPriorityLimit)
            rejectReason = "priority=" + heroStats.priority + " > " + request.inputMaxPriorityLimit;
        else if (heroStats.eff < request.inputEffMinLimit || heroStats.eff > request.inputEffMaxLimit
                || heroStats.res < request.inputResMinLimit || heroStats.res > request.inputResMaxLimit
                || heroStats.cp < request.inputMinCpLimit || heroStats.cp > request.inputMaxCpLimit
                || heroStats.ehp < request.inputMinEhpLimit || heroStats.ehp > request.inputMaxEhpLimit
                || heroStats.score < request.inputMinScoreLimit || heroStats.score > request.inputMaxScoreLimit
                || heroStats.upgrades < request.inputMinUpgradesLimit
                || heroStats.upgrades > request.inputMaxUpgradesLimit
                || heroStats.conversions < request.inputMinConversionsLimit
                || heroStats.conversions > request.inputMaxConversionsLimit
                || heroStats.eq < request.inputMinEquippedLimit || heroStats.eq > request.inputMaxEquippedLimit
                || heroStats.hpps < request.inputMinHppsLimit || heroStats.hpps > request.inputMaxHppsLimit
                || heroStats.ehpps < request.inputMinEhppsLimit || heroStats.ehpps > request.inputMaxEhppsLimit
                || heroStats.dmg < request.inputMinDmgLimit || heroStats.dmg > request.inputMaxDmgLimit
                || heroStats.dmgps < request.inputMinDmgpsLimit || heroStats.dmgps > request.inputMaxDmgpsLimit
                || heroStats.mcdmg < request.inputMinMcdmgLimit || heroStats.mcdmg > request.inputMaxMcdmgLimit
                || heroStats.mcdmgps < request.inputMinMcdmgpsLimit || heroStats.mcdmgps > request.inputMaxMcdmgpsLimit
                || heroStats.dmgh < request.inputMinDmgHLimit || heroStats.dmgh > request.inputMaxDmgHLimit
                || heroStats.dmgd < request.inputMinDmgDLimit || heroStats.dmgd > request.inputMaxDmgDLimit
                || heroStats.hmcdmgs < request.inputMinHmcdmgsLimit || heroStats.hmcdmgs > request.inputMaxHmcdmgsLimit
                || heroStats.dmcdmgs < request.inputMinDmcdmgsLimit || heroStats.dmcdmgs > request.inputMaxDmcdmgsLimit
                || heroStats.hdmg < request.inputMinHdmgLimit || heroStats.hdmg > request.inputMaxHdmgLimit
                || heroStats.hdmgs < request.inputMinHdmgsLimit || heroStats.hdmgs > request.inputMaxHdmgsLimit
                || heroStats.ddmg < request.inputMinDdmgLimit || heroStats.ddmg > request.inputMaxDdmgLimit
                || heroStats.ddmgs < request.inputMinDdmgsLimit || heroStats.ddmgs > request.inputMaxDdmgsLimit
                || heroStats.s1 < request.inputMinS1Limit || heroStats.s1 > request.inputMaxS1Limit
                || heroStats.s2 < request.inputMinS2Limit || heroStats.s2 > request.inputMaxS2Limit
                || heroStats.s3 < request.inputMinS3Limit || heroStats.s3 > request.inputMaxS3Limit
                || heroStats.bs < request.inputMinBSLimit || heroStats.bs > request.inputMaxBSLimit) {
            rejectReason = "other stat limit";
        }

        if (rejectReason != null) {
            final long n = _filterRejectLog.incrementAndGet();
            if (n <= 3) {
                // Log the first 3 rejections at WARNING so they surface in the UI console
                logger.warning("[passesFilter] reject #" + n + " reason=" + rejectReason
                        + " | cr=" + heroStats.cr + " cd=" + heroStats.cd
                        + " spd=" + heroStats.spd + " hp=" + heroStats.hp
                        + " priority=" + heroStats.priority);
            }
            return false;
        }

        final int[] indexArray = convertSetsArrayIntoIndexArray(sets);
        final int index = calculateSetIndex(indexArray);
        if (!request.boolArr[index]) {
            final long n = _filterRejectLog.incrementAndGet();
            if (n <= 3) {
                logger.warning("[passesFilter] reject #" + n + " reason=setFilter boolArr[" + index + "]=false");
            }
            return false;
        }
        return true;
    }

    public Map<Gear, List<Item>> buildItemsByGear(final List<Item> items) {
        return Arrays.stream(Gear.values())
                .collect(Collectors.toMap(
                        Function.identity(),
                        gear -> items.stream()
                                .filter(x -> x.getGear() == gear)
                                .collect(Collectors.toList())));
    }

    public List<Set> getSetsOrElseAll(final List<Set> sets) {
        if (sets == null || sets.size() == 0) {
            return Arrays.asList(Set.values());
        }
        return sets;
    }

    private static final int POW_24_5 = 7962624;
    private static final int POW_24_4 = 331776;
    private static final int POW_24_3 = 13824;
    private static final int POW_24_2 = 576;
    private static final int POW_24_1 = 24;

    public int calculateSetIndex(final int[] indices) { // sorted, size 6, elements [0-17]
        return indices[0] * POW_24_5
                + indices[1] * POW_24_4
                + indices[2] * POW_24_3
                + indices[3] * POW_24_2
                + indices[4] * POW_24_1
                + indices[5];
    }

    // https://java2blog.com/permutations-array-java/
    public List<List<Integer>> permute(int[] arr) {
        final List<List<Integer>> list = new ArrayList<>();
        permuteHelper(list, new ArrayList<>(), arr, new boolean[arr.length]);

        return list;
    }

    private void permuteHelper(final List<List<Integer>> list,
            final List<Integer> resultList,
            final int[] arr,
            final boolean[] used) {

        // Base case
        if (resultList.size() == arr.length) {
            list.add(new ArrayList<>(resultList));
        } else {
            for (int i = 0; i < arr.length; i++) {
                if (used[i] || i > 0 && arr[i] == arr[i - 1] && !used[i - 1]) {
                    // If element is already used
                    continue;
                }
                // choose element
                used[i] = true;
                resultList.add(arr[i]);

                // Explore
                permuteHelper(list, resultList, arr, used);

                // Unchoose element
                used[i] = false;
                resultList.remove(resultList.size() - 1);
            }
        }
    }

    public void addCalculatedFields(OptimizationRequest request) {
        final String boolArrCacheKey = request.getSetFormat() + ":"
                + request.getInputSetsOne() + ":"
                + request.getInputSetsTwo() + ":"
                + request.getInputSetsThree();
        final BoolArrEntry cachedEntry = cachedBoolArrEntry;
        if (cachedEntry != null && boolArrCacheKey.equals(cachedEntry.key)) {
            request.setBoolArr(cachedEntry.boolArr);
            request.setSetPermutationIndicesPlusOne(cachedEntry.setPermIndices);
            return;
        }

        // Allocate per-execution arrays so concurrent optimizations do not share state.
        // These local variables shadow the (now-unused) instance fields of the same
        // name.
        final boolean[] permutations = new boolean[SET_EXPONENTIAL];
        final int[] setPermutationIndicesPlusOne = new int[SET_EXPONENTIAL];

        final List<Set> inputSets1 = getSetsOrElseAll(request.getInputSetsOne());
        final List<Set> inputSets2 = getSetsOrElseAll(request.getInputSetsTwo());
        final List<Set> inputSets3 = getSetsOrElseAll(request.getInputSetsThree());

        final int setFormat = request.getSetFormat();
        if (setFormat == 0) {
            // [0][0][0] All valid

            Arrays.fill(permutations, true);
            setPermutationIndicesPlusOne[0] = 1;
        } else if (setFormat == 1) {
            // [4][2][0]

            for (Set set1 : inputSets1) {
                for (Set set2 : inputSets2) {
                    final int[] indices = ArrayUtils.addAll(set1.getIndices(), set2.getIndices());

                    List<List<Integer>> allSolutions = permute(indices);

                    for (int i = 0; i < allSolutions.size(); i++) {
                        final int[] solution = allSolutions.get(i).stream().mapToInt(x -> x).toArray();
                        final int index1D = calculateSetIndex(solution);

                        permutations[index1D] = true;
                        setPermutationIndicesPlusOne[index1D] = i + 1;
                    }
                }
            }
        } else if (setFormat == 2) {
            // [4][0][0]

            final int[] missing = new int[] { 0, 0 };
            for (Set set1 : inputSets1) {
                final int[] indices = ArrayUtils.addAll(set1.getIndices(), missing);
                for (int a = 0; a < SET_COUNT; a++) {
                    for (int b = 0; b < SET_COUNT; b++) {
                        final int[] indicesInstance = ArrayUtils.clone(indices);
                        indicesInstance[4] = a;
                        indicesInstance[5] = b;

                        List<List<Integer>> allSolutions = permute(indicesInstance);

                        for (int i = 0; i < allSolutions.size(); i++) {
                            final int[] solution = allSolutions.get(i).stream().mapToInt(x -> x).toArray();
                            final int index1D = calculateSetIndex(solution);

                            permutations[index1D] = true;
                            setPermutationIndicesPlusOne[index1D] = i + 1;
                        }
                    }
                }
            }
        } else if (setFormat == 3) {
            // [2][0][0]
            final int[] missing = new int[] { 0, 0, 0, 0 };
            for (Set set1 : inputSets1) {
                final int[] indices = ArrayUtils.addAll(set1.getIndices(), missing);
                for (int a = 0; a < SET_COUNT; a++) {
                    for (int b = 0; b < SET_COUNT; b++) {
                        for (int c = 0; c < SET_COUNT; c++) {
                            for (int d = 0; d < SET_COUNT; d++) {
                                final int[] indicesInstance = ArrayUtils.clone(indices);
                                indicesInstance[2] = a;
                                indicesInstance[3] = b;
                                indicesInstance[4] = c;
                                indicesInstance[5] = d;

                                final List<List<Integer>> allSolutions = permute(indicesInstance);

                                for (int i = 0; i < allSolutions.size(); i++) {
                                    final int[] solution = allSolutions.get(i).stream().mapToInt(x -> x).toArray();
                                    final int index1D = calculateSetIndex(solution);

                                    permutations[index1D] = true;
                                    setPermutationIndicesPlusOne[index1D] = i + 1;
                                }
                            }
                        }
                    }
                }
            }

        } else if (setFormat == 4) {
            // [2][2][0]

            final int[] missing = new int[] { 0, 0 };
            for (Set set1 : inputSets1) {
                for (Set set2 : inputSets2) {
                    final int[] indices = ArrayUtils.addAll(ArrayUtils.addAll(set1.getIndices(), set2.getIndices()),
                            missing);
                    for (int a = 0; a < SET_COUNT; a++) {
                        for (int b = 0; b < SET_COUNT; b++) {
                            final int[] indicesInstance = ArrayUtils.clone(indices);
                            indicesInstance[4] = a;
                            indicesInstance[5] = b;

                            List<List<Integer>> allSolutions = permute(indicesInstance);

                            for (int i = 0; i < allSolutions.size(); i++) {
                                final int[] solution = allSolutions.get(i).stream().mapToInt(x -> x).toArray();
                                final int index1D = calculateSetIndex(solution);

                                permutations[index1D] = true;
                                setPermutationIndicesPlusOne[index1D] = i + 1;
                            }
                        }
                    }
                }
            }
        } else if (setFormat == 5) {
            // [2][2][2]

            for (Set set1 : inputSets1) {
                for (Set set2 : inputSets2) {
                    for (Set set3 : inputSets3) {
                        final int[] indices = ArrayUtils.addAll(ArrayUtils.addAll(set1.getIndices(), set2.getIndices()),
                                set3.getIndices());

                        List<List<Integer>> allSolutions = permute(indices);

                        for (int i = 0; i < allSolutions.size(); i++) {
                            final int[] solution = allSolutions.get(i).stream().mapToInt(x -> x).toArray();
                            final int index1D = calculateSetIndex(solution);

                            permutations[index1D] = true;
                            setPermutationIndicesPlusOne[index1D] = i + 1;
                        }
                    }
                }
            }
        } else {
            throw new RuntimeException("Invalid Set Format " + request.getSetFormat());
        }

        cachedBoolArrEntry = new BoolArrEntry(boolArrCacheKey, permutations, setPermutationIndicesPlusOne);
        request.setBoolArr(permutations);
        request.setSetPermutationIndicesPlusOne(setPermutationIndicesPlusOne);

    }

    private GpuOptimizerKernel getOrCreateKernel(
            final OptimizationRequest request,
            final float[] flattenedWeaponAccs,
            final float[] flattenedHelmetAccs,
            final float[] flattenedArmorAccs,
            final float[] flattenedNecklaceAccs,
            final float[] flattenedRingAccs,
            final float[] flattenedBootAccs,
            final float bonusBaseAtk,
            final float bonusBaseDef,
            final float bonusBaseHp,
            final float atkSetBonus,
            final float hpSetBonus,
            final float defSetBonus,
            final float speedSetBonus,
            final float revengeSetBonus,
            final float reversalSetBonus,
            final float weakeningSetBonus,
            final float penSetDmgBonus,
            final float targetDefense,
            final float bonusMaxAtk,
            final float bonusMaxDef,
            final float bonusMaxHp,
            final int SETTING_RAGE_SET,
            final int SETTING_PEN_SET,
            final int SETTING_FERVOR_SET,
            final HeroStats base,
            final Hero hero,
            final long argSize,
            final long wSize,
            final long hSize,
            final long aSize,
            final long nSize,
            final long rSize,
            final long bSize,
            final long max,
            final long[] longSetMasks) {
        final boolean isFormat0 = request.getSetFormat() == 0;
        final String heroId = request.hero.getId();
        final boolean canReuse = cachedKernel != null
                && heroId.equals(cachedKernelHeroId)
                && isFormat0 == cachedKernelIsFormat0;
        if (canReuse) {
            cachedKernel.update(request,
                    flattenedWeaponAccs, flattenedHelmetAccs, flattenedArmorAccs,
                    flattenedNecklaceAccs, flattenedRingAccs, flattenedBootAccs,
                    wSize, hSize, aSize, nSize, rSize, bSize);
            cachedKernel.putPerRunArrays();
            return cachedKernel;
        }
        if (cachedKernel != null) {
            cachedKernel.dispose();
            cachedKernel = null;
        }
        final GpuOptimizerKernel kernel = selectKernel(request,
                flattenedWeaponAccs, flattenedHelmetAccs, flattenedArmorAccs,
                flattenedNecklaceAccs, flattenedRingAccs, flattenedBootAccs,
                bonusBaseAtk, bonusBaseDef, bonusBaseHp,
                atkSetBonus, hpSetBonus, defSetBonus,
                speedSetBonus, revengeSetBonus, reversalSetBonus, weakeningSetBonus, penSetDmgBonus,
                targetDefense, bonusMaxAtk, bonusMaxDef, bonusMaxHp,
                SETTING_RAGE_SET, SETTING_PEN_SET, SETTING_FERVOR_SET,
                base, hero, argSize, wSize, hSize, aSize, nSize, rSize, bSize, max, longSetMasks);
        kernel.setExplicit(true);
        kernel.putInitialArrays();
        cachedKernel = kernel;
        cachedKernelHeroId = heroId;
        cachedKernelIsFormat0 = isFormat0;
        return kernel;
    }

    private static GpuOptimizerKernel selectKernel(
            final OptimizationRequest request,
            final float[] flattenedWeaponAccs,
            final float[] flattenedHelmetAccs,
            final float[] flattenedArmorAccs,
            final float[] flattenedNecklaceAccs,
            final float[] flattenedRingAccs,
            final float[] flattenedBootAccs,
            final float bonusBaseAtk,
            final float bonusBaseDef,
            final float bonusBaseHp,
            final float atkSetBonus,
            final float hpSetBonus,
            final float defSetBonus,
            final float speedSetBonus,
            final float revengeSetBonus,
            final float reversalSetBonus,
            final float weakeningSetBonus,
            final float penSetDmgBonus,
            final float targetDefense,
            final float bonusMaxAtk,
            final float bonusMaxDef,
            final float bonusMaxHp,
            final int SETTING_RAGE_SET,
            final int SETTING_PEN_SET,
            final int SETTING_FERVOR_SET,
            final HeroStats base,
            final Hero hero,
            final long argSize,
            final long wSize,
            final long hSize,
            final long aSize,
            final long nSize,
            final long rSize,
            final long bSize,
            final long max,
            final long[] longSetMasks) {
        if (request.getSetFormat() == 0) {
            return new SetFormat000OptimizerKernel(
                    request,
                    flattenedWeaponAccs,
                    flattenedHelmetAccs,
                    flattenedArmorAccs,
                    flattenedNecklaceAccs,
                    flattenedRingAccs,
                    flattenedBootAccs,
                    bonusBaseAtk,
                    bonusBaseDef,
                    bonusBaseHp,
                    atkSetBonus,
                    hpSetBonus,
                    defSetBonus,
                    speedSetBonus,
                    revengeSetBonus,
                    reversalSetBonus,
                    weakeningSetBonus,
                    penSetDmgBonus,
                    targetDefense,
                    bonusMaxAtk,
                    bonusMaxDef,
                    bonusMaxHp,
                    SETTING_RAGE_SET,
                    SETTING_PEN_SET,
                    SETTING_FERVOR_SET,
                    base,
                    hero,
                    argSize,
                    wSize,
                    hSize,
                    aSize,
                    nSize,
                    rSize,
                    bSize,
                    max,
                    longSetMasks);
        }
        return new GpuOptimizerKernel(
                request,
                flattenedWeaponAccs,
                flattenedHelmetAccs,
                flattenedArmorAccs,
                flattenedNecklaceAccs,
                flattenedRingAccs,
                flattenedBootAccs,
                bonusBaseAtk,
                bonusBaseDef,
                bonusBaseHp,
                atkSetBonus,
                hpSetBonus,
                defSetBonus,
                speedSetBonus,
                revengeSetBonus,
                reversalSetBonus,
                weakeningSetBonus,
                penSetDmgBonus,
                targetDefense,
                bonusMaxAtk,
                bonusMaxDef,
                bonusMaxHp,
                SETTING_RAGE_SET,
                SETTING_PEN_SET,
                SETTING_FERVOR_SET,
                base,
                hero,
                argSize,
                wSize,
                hSize,
                aSize,
                nSize,
                rSize,
                bSize,
                max,
                longSetMasks);
    }
}

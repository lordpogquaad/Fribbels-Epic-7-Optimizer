package com.fribbels;

import com.fribbels.core.StatCalculator;
import com.fribbels.db.*;
import com.fribbels.handler.HeroesRequestHandler;
import com.fribbels.handler.ItemsRequestHandler;
import com.fribbels.handler.OptimizationRequestHandler;
import com.fribbels.handler.SystemRequestHandler;
import com.sun.net.httpserver.HttpServer;

import java.net.BindException;
import java.net.InetSocketAddress;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

public class Main {

  public static final ArtifactStatsDb artifactStatsDb = new ArtifactStatsDb();
  private static final BaseStatsDb baseStatsDb = new BaseStatsDb();
  private static final HeroDb heroDb = new HeroDb(baseStatsDb);
  private static final ItemDb itemDb = new ItemDb(heroDb);
  private static final Logger logger = Logger.getLogger(Main.class.getName());
  public static volatile boolean interrupt = false;
  public static int THREADS = 10;
  public static volatile long BEST_DEVICE_ID = 0;
  private static HttpServer server;
  private static ExecutorService executorService;

  public static void main(String[] args) throws Exception {
    try {
      final int threadsToUse = Runtime.getRuntime().availableProcessors() * 2;
      if (threadsToUse > THREADS) {
        THREADS = threadsToUse;
      }
    } catch (final RuntimeException e) {
      logger.warning("Error setting number of threads, defaulting to 10: " + e);
    }

    logger.info("START");

    Logger.getLogger("com.aparapi").setLevel(Level.SEVERE);

    start();
  }

  public static void start() throws Exception {
    int port = 8130;
    boolean bound = false;
    for (int attempt = 0; attempt < 10; attempt++) {
      try {
        server = HttpServer.create(new InetSocketAddress("localhost", port), 0);
        bound = true;
        break;
      } catch (BindException e) {
        logger.info("Port " + port + " already in use, trying next port...");
        port++;
      }
    }
    if (!bound) {
      logger.severe("All ports 8130-8139 are in use. Cannot start backend.");
      System.exit(1);
      return;
    }
    // Print chosen port as FIRST stdout line so the frontend can read it
    System.out.println("BACKEND_PORT:" + port);
    System.out.flush();

    executorService = Executors.newFixedThreadPool(THREADS);
    Runtime.getRuntime().addShutdownHook(new Thread(() -> {
      server.stop(0);
      executorService.shutdownNow();
    }));

    final HeroesRequestHandler heroesRequestHandler = new HeroesRequestHandler(heroDb, baseStatsDb, artifactStatsDb,
        itemDb, new StatCalculator());

    server.createContext("/system", new SystemRequestHandler());
    server.createContext("/items", new ItemsRequestHandler(itemDb, heroDb, baseStatsDb, heroesRequestHandler));
    server.createContext("/optimization", new OptimizationRequestHandler(baseStatsDb, heroDb, itemDb));
    server.createContext("/heroes", heroesRequestHandler);

    server.setExecutor(executorService);
    server.start();

    System.out.println("START BACKEND WITH " + THREADS + " THREADS");
    System.out.flush();
  }
}

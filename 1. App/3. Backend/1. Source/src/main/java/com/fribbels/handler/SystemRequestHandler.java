package com.fribbels.handler;

import com.fribbels.Main;
import com.fribbels.core.StatCalculator;
import com.fribbels.request.SetSettingsRequest;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.logging.Logger;

public class SystemRequestHandler extends RequestHandler implements HttpHandler {

    private static final Logger logger = Logger.getLogger(SystemRequestHandler.class.getName());

    @Override
    public void handle(final HttpExchange exchange) throws IOException {
        logger.info("===================== SystemRequestHandler =====================");
        final String path = exchange.getRequestURI().getPath();

        logger.info("Path: " + path);
        try {
            switch (path) {
                case "/system/interrupt":
                    sendResponse(exchange, interrupt());
                    return;
                case "/system/setSettings":
                    final SetSettingsRequest setSettingsRequest = parseRequest(exchange, SetSettingsRequest.class);
                    sendResponse(exchange, setSettings(setSettingsRequest));
                    return;

                default:
                    logger.warning("No handler found for " + path);
            }

            sendResponse(exchange, "ERROR");
        } catch (final Exception e) {
            logger.severe("Error handling request: " + e.getMessage());
            throw (e);
        }

    }

    private String interrupt() {
        Main.interrupt = true;
        logger.info("INTERRUPT MAIN");
        return "";
    }

    private String setSettings(final SetSettingsRequest request) {
        logger.info(String.valueOf(request));
        HeroesRequestHandler.SETTING_UNLOCK_ON_UNEQUIP = request.isSettingUnlockOnUnequip();
        StatCalculator.SETTING_RAGE_SET = request.isSettingRageSet();
        StatCalculator.SETTING_PEN_SET = request.isSettingPenSet();
        OptimizationRequestHandler.instance.configureGpu(request.isSettingGpu());

        if (request.getSettingMaxResults() != null) {
            final int max = Math.max(Math.min(request.getSettingMaxResults(), 100_000_000), 10_000);
            OptimizationRequestHandler.SETTING_MAXIMUM_RESULTS = max;
        }

        if (request.getSettingPenDefense() != null) {
            final int max = Math.max(Math.min(request.getSettingPenDefense(), 10_000), 0);
            StatCalculator.SETTING_PEN_DEFENSE = max;
        }

        return "";
    }
}

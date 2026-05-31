package com.fribbels.handler;

import com.fribbels.model.Request;
import com.fribbels.response.Response;
import com.google.common.collect.ImmutableList;
import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import org.apache.commons.io.IOUtils;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.logging.Logger;

public class RequestHandler {

    private static final Gson GSON = new Gson();
    private static final Logger logger = Logger.getLogger(RequestHandler.class.getName());

    public void handleRequest(final String filename) throws IOException {
        try {
            logger.info("handleRequest");
            final String data = readFile(filename);
            final Request request = GSON.fromJson(data, Request.class);

            handleSpecificRequest(request, data);
        } catch (final IOException e) {
            writeFile(e.toString());
        }

        logger.info("DONE");
    }

    private String handleSpecificRequest(final Request request, final String data) {
        logger.info("handleSpecificRequest");
        final String requestType = request.getRequestType();

        throw new UnsupportedOperationException(requestType);
    }

    private String readFile(final String filename) throws IOException {
        final File requestFile = new File(filename);
        return new String(Files.readAllBytes(requestFile.toPath()), StandardCharsets.UTF_8);
    }

    private void writeFile(final String data) throws IOException {
        final File responseFile = new File("response.txt");
        Files.write(responseFile.toPath(), data.getBytes(StandardCharsets.UTF_8));
    }

    protected void sendResponse(final HttpExchange exchange, final String response) throws IOException {
        final OutputStream outputStream = exchange.getResponseBody();
        final byte[] responseBytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(200, responseBytes.length);
        exchange.getResponseHeaders().put("Content-Type", ImmutableList.of("application/json"));
        try {
            outputStream.write(responseBytes);
            outputStream.flush();
        } finally {
            outputStream.close();
        }

        logger.info("Finished " + exchange.getRequestURI().getPath());
    }

    protected <T extends Request> T parseRequest(final HttpExchange exchange, final Class<T> type) throws IOException {
        final String body = IOUtils.toString(exchange.getRequestBody(), StandardCharsets.UTF_8);
        logger.info(body);
        final T request = GSON.fromJson(body, type);

        return request;
    }

    protected String toJson(final Response response) {
        return GSON.toJson(response);
    }
}

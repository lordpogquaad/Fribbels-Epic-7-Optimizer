package com.fribbels.handler;

import com.fribbels.model.Request;
import com.fribbels.response.Response;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonSyntaxException;
import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;
import com.google.gson.stream.JsonWriter;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.math.BigDecimal;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.logging.Logger;

public class RequestHandler {

    private static final BigDecimal INT_MAX = BigDecimal.valueOf(Integer.MAX_VALUE);
    private static final BigDecimal INT_MIN = BigDecimal.valueOf(Integer.MIN_VALUE);

    /**
     * Reads an int as Gson does, except that a whole number past the int range clamps to the
     * nearest bound instead of throwing. The throw reached the renderer as the generic failure it
     * reports as "hero is not yet in the backend database" (B25); a limit beyond the range means
     * the same as the bound, so the clamp keeps its meaning. A fractional value still fails.
     */
    private static final TypeAdapter<Number> CLAMPING_INT = new TypeAdapter<>() {
        @Override
        public void write(final JsonWriter out, final Number value) throws IOException {
            out.value(value);
        }

        @Override
        public Number read(final JsonReader in) throws IOException {
            if (in.peek() == JsonToken.NULL) {
                in.nextNull();
                return null;
            }
            final String text = in.nextString();
            try {
                return Integer.parseInt(text);
            } catch (final NumberFormatException e) {
                try {
                    final BigDecimal value = new BigDecimal(text);
                    if (value.compareTo(INT_MAX) > 0) {
                        return Integer.MAX_VALUE;
                    }
                    if (value.compareTo(INT_MIN) < 0) {
                        return Integer.MIN_VALUE;
                    }
                    return value.intValueExact();
                } catch (final NumberFormatException | ArithmeticException notAnInt) {
                    throw new JsonSyntaxException("Expected an int but was " + text, notAnInt);
                }
            }
        }
    };

    private static final Gson GSON = new GsonBuilder()
            .registerTypeAdapter(int.class, CLAMPING_INT)
            .registerTypeAdapter(Integer.class, CLAMPING_INT)
            .create();
    private static final Logger logger = Logger.getLogger(RequestHandler.class.getName());

    protected void sendResponse(final HttpExchange exchange, final String response) throws IOException {
        final OutputStream outputStream = exchange.getResponseBody();
        final byte[] responseBytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().put("Content-Type", List.of("application/json"));
        exchange.sendResponseHeaders(200, responseBytes.length);
        try {
            outputStream.write(responseBytes);
            outputStream.flush();
        } finally {
            outputStream.close();
        }

        logger.info("Finished " + exchange.getRequestURI().getPath());
    }

    protected <T extends Request> T parseRequest(final HttpExchange exchange, final Class<T> type) throws IOException {
        final String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        // FINE, not INFO: a request body can be megabytes of items, and logging it on every call
        // flooded the log. -Dcom.fribbels.level=FINE brings it back.
        logger.fine(body);
        return parseBody(body, type);
    }

    /** Parses a request body; split from {@link #parseRequest} so it can be tested without an exchange. */
    static <T extends Request> T parseBody(final String body, final Class<T> type) {
        return GSON.fromJson(body, type);
    }

    protected String toJson(final Response response) {
        return GSON.toJson(response);
    }
}

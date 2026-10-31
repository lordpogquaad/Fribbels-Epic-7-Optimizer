package com.fribbels.handler;

import com.fribbels.request.OptimizationRequest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * A typed limit past the int range used to throw from the parser, and the handler answered with
 * the generic failure the renderer reports as "hero is not yet in the backend database" (B25).
 * The wire contract is unchanged: the same field names, and an in-range value parses as before.
 */
public class RequestParsingTest {

    private static OptimizationRequest parse(final String json) {
        return RequestHandler.parseBody(json, OptimizationRequest.class);
    }

    @Test
    public void aLimitPastTheIntRangeClampsInsteadOfFailingTheRequest() {
        final OptimizationRequest request = parse(
                "{\"inputAtkMaxLimit\": 99999999999, \"inputAtkMinLimit\": -99999999999}");

        assertEquals(Integer.MAX_VALUE, request.getInputAtkMaxLimit());
        assertEquals(Integer.MIN_VALUE, request.getInputAtkMinLimit());
    }

    @Test
    public void aBoxedValuePastTheIntRangeClampsToo() {
        final OptimizationRequest request = parse("{\"inputAtkMinForce\": 5000000000}");

        assertEquals(Integer.MAX_VALUE, request.getInputAtkMinForce());
    }

    @Test
    public void anInRangeLimitParsesAsBefore() {
        final OptimizationRequest request = parse(
                "{\"inputAtkMaxLimit\": 12345, \"inputHpMinLimit\": 1e3, \"inputDefMaxLimit\": 7.0}");

        assertEquals(12345, request.getInputAtkMaxLimit());
        assertEquals(1000, request.getInputHpMinLimit());
        assertEquals(7, request.getInputDefMaxLimit());
    }

    @Test
    public void aFractionalLimitStillFailsAsBefore() {
        assertThrows(RuntimeException.class, () -> parse("{\"inputAtkMaxLimit\": 12.5}"));
    }
}

package com.fribbels.model;

/**
 * Common supertype and generic bound for every request DTO
 * (see {@link com.fribbels.handler.RequestHandler#parseRequest}, declared as
 * {@code <T extends Request>}). It deliberately carries no data: the former
 * {@code requestType} field was written by the frontend but never read by the
 * backend (its only reader was the long-removed {@code handleSpecificRequest}
 * dispatcher), so it was dropped. Gson silently ignores the still-sent
 * {@code "requestType"} JSON key. Keep this class even though it is empty — it
 * is the shared base/bound the handlers rely on.
 */
public class Request {
}

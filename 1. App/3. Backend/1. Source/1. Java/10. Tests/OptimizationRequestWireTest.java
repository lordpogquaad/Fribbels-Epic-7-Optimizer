package com.fribbels.request;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Gson drops a JSON key the target class does not declare, with no error. The renderer's
 * request builder grew past {@link OptimizationRequest} more than once (B15), and the
 * hero's saved request is read back as the multi-hero tab's params, so a dropped key
 * means a different search. This reads the renderer source and compares its keys with
 * the class.
 */
public class OptimizationRequestWireTest {

    private static final Path OPTIMIZER_TAB = Path.of("..", "..", "2. Frontend", "1. Source", "4. JS",
            "1. Optimizer & Multi-Hero Optimizer Tab", "1. Optimizer", "1. Optimizer", "optimizerTab.js");
    private static final Path MULTI_TAB = Path.of("..", "..", "2. Frontend", "1. Source", "4. JS",
            "1. Optimizer & Multi-Hero Optimizer Tab", "2. Multi-Hero Optimizer Tab", "multiOptimizerTab.js");

    /**
     * Keys the renderer sends that the backend deliberately does not declare. {@code inputSets}
     * is the aggregate of the three per-tier set lists, rebuilt in the renderer; see the comment
     * on {@link OptimizationRequest#getInputSetsOne()}.
     */
    private static final Set<String> DELIBERATELY_UNDECLARED = Set.of("inputSets");

    private static String read(final Path path) throws IOException {
        // A moved file must fail this test, not skip it: the Maven working directory is the pom folder.
        assertTrue(Files.isRegularFile(path), "renderer source not found at " + path.toAbsolutePath().normalize());
        return Files.readString(path);
    }

    private static Set<String> declaredFields() {
        final Set<String> names = new TreeSet<>();
        for (Class<?> type = OptimizationRequest.class; type != null; type = type.getSuperclass()) {
            for (final Field field : type.getDeclaredFields()) {
                names.add(field.getName());
            }
        }
        return names;
    }

    private static Set<String> missing(final Set<String> sent) {
        final Set<String> missing = new TreeSet<>(sent);
        missing.removeAll(declaredFields());
        missing.removeAll(DELIBERATELY_UNDECLARED);
        return missing;
    }

    /** Every {@code request.<key>} in the body of {@code getOptimizationRequestParams}. */
    private static Set<String> keysBuiltByTheOptimizerTab() throws IOException {
        final String source = read(OPTIMIZER_TAB);
        final int start = source.indexOf("getOptimizationRequestParams: (");
        final int end = source.indexOf("return request;", start);
        assertTrue(start >= 0 && end > start, "getOptimizationRequestParams not found in " + OPTIMIZER_TAB);

        final Set<String> keys = new TreeSet<>();
        final Matcher matcher = Pattern.compile("\\brequest\\.([A-Za-z0-9_]+)").matcher(source.substring(start, end));
        while (matcher.find()) {
            keys.add(matcher.group(1));
        }
        return keys;
    }

    /** The top-level keys of {@code getDefaultParams()}, the multi-hero tab's fallback params. */
    private static Set<String> keysInMultiHeroDefaults() throws IOException {
        final String source = read(MULTI_TAB);
        final int start = source.indexOf("function getDefaultParams()");
        final int end = source.indexOf("\n}\n", start);
        assertTrue(start >= 0 && end > start, "getDefaultParams not found in " + MULTI_TAB);

        final Set<String> keys = new TreeSet<>();
        final Matcher matcher = Pattern.compile("(?m)^ {4}([A-Za-z0-9_]+):").matcher(source.substring(start, end));
        while (matcher.find()) {
            keys.add(matcher.group(1));
        }
        return keys;
    }

    @Test
    void theWireTestReadsEnoughKeysToMeanSomething() throws IOException {
        // A selector that quietly matches nothing would pass every comparison below.
        assertTrue(keysBuiltByTheOptimizerTab().size() > 150, "optimizer tab keys: " + keysBuiltByTheOptimizerTab().size());
        assertTrue(keysInMultiHeroDefaults().size() > 20, "multi tab default keys: " + keysInMultiHeroDefaults().size());
    }

    @Test
    void everyKeyTheOptimizerTabSendsIsDeclaredOnTheJavaRequest() throws IOException {
        assertEquals(Set.of(), missing(keysBuiltByTheOptimizerTab()),
                "keys the renderer sends that OptimizationRequest drops");
    }

    @Test
    void everyKeyInTheMultiHeroDefaultsIsDeclaredOnTheJavaRequest() throws IOException {
        assertEquals(Set.of(), missing(keysInMultiHeroDefaults()),
                "multi-hero default params that OptimizationRequest drops");
    }
}

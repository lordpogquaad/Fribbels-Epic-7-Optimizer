---
name: wire-format-traps
description: How renderer JSON binds to the Java request classes, where a key is lost silently, and how to compare the two sides
metadata:
  type: reference
---

# Wire format traps

Verified 2026-10-30 against the renderer `4. JS/` and `backend.jar` of that date, by a Gson probe run on the jar.

- `OptimizationRequest` is two contracts. It is the optimizer input and also the storage type of
  `Hero.optimizationRequest`: `HeroDb.saveOptimizationRequest` round-trips it through Gson, so a key the
  class does not declare is gone from the saved hero, even though the optimizer never needs it. Compare
  `getOptimizationRequestParams` in `optimizerTab.js` with the class's fields, not with what Java reads.
- Multi-hero runs filter gear from the saved request (`hero.optimizationRequest` in
  `multiOptimizerTab.js`), so a key lost on save also changes which items that tab sends.
- Three error paths: `/heroes` answers HTTP 200 with a hand-built `{"error":...}` that `api.js` ignores,
  `/items` and `/optimization` answer `ERROR`, `/system` rethrows and drops the connection.
- Gson binds an unknown enum string to null without an error, so a sort column or set outside the enum
  is ignored quietly. A fractional or over-range number in an `int` field throws `JsonSyntaxException`.
- A request class with `@Builder` and no no-arg constructor is built without running field initialisers;
  `OptimizationRequest` has `@NoArgsConstructor`, which is what keeps its `MAX_VALUE` limit defaults.
- A read-only wire probe: a single-file `Probe.java` in the scratchpad, run by the JDK 27 `java` with
  `-cp "1. Master/3. Jar/backend.jar"`. It needs no build. See [[search-pipeline-map]] for the search side.

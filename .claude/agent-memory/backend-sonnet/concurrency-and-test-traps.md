---
name: concurrency-and-test-traps
description: Backend thread model (who shares what), how to make a visibility or race fix testable, and test-run shortcuts that worked. Verified 2026-10-30.
metadata:
  type: reference
---

- Thread model: `/heroes` requests are serialized by `HeroesRequestHandler.handle` being `synchronized`, but `ItemsRequestHandler.handle` is not and calls `heroesRequestHandler.addStatsToBuild`/`equipItemsOnHero` directly, so the Heroes handler's one shared `StatCalculator` needs its own lock (`calculateFinalStats`). The optimizer builds its own `StatCalculator` per run and sets it before `executorService.submit`, so StatCalculator's SpotBugs AT_ findings are noise there.
- A volatile fix has no deterministic red test: pin it with reflection (`Modifier.isVolatile`) plus a reader-thread stress test. For a count read after a flag (`getMaximum`), a writer cannot zero the count when it drops the flag: a reader that read the flag first still reads the zero.
- A race can be made deterministic: subclass the shared object, sleep in the setter, count uses that follow another thread's set (`HeroesRequestHandlerStatsTest.ProbeCalculator`).
- `mvn test -Dtest=<Class>` after an in-place mutation of a main file works as a mutation check: `cp` the original to the scratchpad first, mutate with `sed`, run, `cp` it back (no delete needed). A parametrized loop test that stops at the first wrong column hides the others; collect the wrong ones and assert the list empty.
- `yarn lint:spotbugs` XML is one line; count with a `.mjs` that matches `<BugInstance` blocks, not `grep -c`.

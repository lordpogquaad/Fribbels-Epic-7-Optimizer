---
name: search-pipeline-map
description: Where the optimizer search really prunes, sorts and computes damage, including the parts outside Java, and how to probe backend classes without a build. Verified 2026-10-30 against commit bb58eaf.
metadata:
  type: project
---

# Search pipeline map

Search correctness is not only Java. The pipeline a build passes through:

1. JS `OptimizerTab` item filter chain in `optimizerTab.js` (`applyBasicFilters` through `bucketizeBySelectedSets`). `applyAllFastRejects` in `rollDivisors.js` prunes items by min limits BEFORE `ModificationFilter.apply`, and reads `augmentedStats` even when reforge prediction is on. `applyPredictReforges` is a pass-through.
2. Java `optimizeInternal` pre-filter ("#13"), which runs after mod expansion and honours reforge stats.
3. CPU loop `passesFilter`, or the GPU kernels. The GPU path has no `passesFilter` afterwards, so the kernel is the only filter there.
4. `TopNResults` or the legacy array, then `OptimizationDb.setResultHeroes` and `sort`.

**Why:** an audit that stays in `core/` and `gpu/` misses the first and last stages, which is where the silent losses were.

**How to apply:**

- `OptimizationDb.sort` skips work when column and order match the recorded ones. The runtime log (`1. App/5. Dev Only/logs/prev-*.log`) records `sortColumn` per fetch and the `[optimizeInternal] START` line, so fetch order can be read there rather than guessed.
- "Damage is in three places" undersells it: the JS side has two functions, `computeSkillValue` (carries Rage and Fervor) and `computeRowStats` (does not), and `priorityFilter.js` has its own set-bonus maths.
- `getOrCreateKernel` reuses a kernel per hero and format, and the kernel's `final` fields are not refreshed by `update()`. Any new per-run kernel value must go through `update()`.
- A read-only probe needs no build: `java -cp "<the jar-with-dependencies in target/>;target/classes" <scratch>/Probe.java` from `3. Backend/1. Source/`, using the JDK `build_backend.ps1` sets. Single-file source launch writes nothing.
- A run has a pre-live window: `setLiveResults` and `setLiveTopN` clear `interrupted`, so a cancel landing before them is lost, and the handler's execution map is a small access-order LRU, so a `null` db can mean evicted, not unknown. Probed on `backend.jar` of commit 0eec85e, 2026-10-30.
- The API log lines in the runtime log are cut short, so they prove call order and response shape but not row order inside a response.

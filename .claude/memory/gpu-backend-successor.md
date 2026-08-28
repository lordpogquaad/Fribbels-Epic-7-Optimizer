---
name: gpu-backend-successor
description: "Future plan — the backend's GPU path runs on Aparapi (frozen since ~2021); options weighed 2026-08-28 (TornadoVM vs JOCL + hand-written OpenCL vs JCuda vs CPU Vector API), the recommendation, and the trigger for doing it."
metadata: 
  node_type: memory
  type: project
  originSessionId: ae12964a-a779-473a-b06c-7e3b2491cb82
  modified: 2026-08-28T10:41:16.065Z
---

# GPU backend successor (future plan, Marcus 2026-08-28)

**Today:** `3. Backend` GPU path = Aparapi (`com.aparapi:aparapi:3.0.2` + `aparapi-jni:1.4.3` in
`3. XML/pom.xml`), kernels in `1. Java/8. GPU/GpuOptimizerKernel.java` (+ `SetFormat000OptimizerKernel`)
extending `com.aparapi.Kernel`; Aparapi translates the `run()` bytecode to OpenCL C at runtime.
Project is effectively frozen (last releases ~2021) but still works on JDK 25 with the current OpenCL
driver — so there is no urgency; the trigger is a JDK/driver update that breaks it, or wanting the
perf headroom of a hand-tuned kernel (cf. Rex's `feat/offline` "perf/rtx5090-utilization" PR).
`2. Apache Maven/` is only the bundled build toolchain, not the deprecated piece.

**Options weighed (verified 2026-08-28 — re-check before acting):**

- **TornadoVM 5.2.0** (beehive-lab; JDK 21/25/26/27; Windows supported; OpenCL/PTX/Metal). The
  "Java-on-GPU" spiritual successor, but it is a JVM-level runtime, not a library: programs launch
  with `java @tornado-argfile …` (JVMCI flags + the SDK's compiler/runtime/driver jars + natives);
  the Maven Central artifact is the API only. Runtime is GPLv2+Classpath-exception, API Apache-2.0.
  Different programming model (`TaskGraph`, `@Parallel` loops, typed `FloatArray`/`IntArray`), so the
  kernel is rewritten anyway. Poor fit for a backend.jar that Electron spawns as a plain
  `java -jar` subprocess and ships in an installer.
- **JOCL** (`org.jocl:jocl`, release 2025-12; plain Maven dep with bundled natives, no JVM flags,
  same OpenCL-ICD requirement as today) + hand-written OpenCL C kernel. Aparapi already *generates*
  OpenCL C from the Java kernel — dump it with `-Dcom.aparapi.enableShowGeneratedOpenCL=true` — so the
  migration starts from real kernel source, and host code (buffers, set bitmask tables, work-group
  sizing already in `OptimizationRequestHandler`) maps 1:1. **Recommended path.** Cost: kernel becomes
  C (it was restricted Java that had to translate anyway).
- **JCuda / CUDA** — NVIDIA-only, needs CUDA toolkit; excludes AMD/Intel. Only if perf demands PTX.
- **CPU-only Vector API + threads** — no GPU; Vector API still incubating on JDK 25
  (`--add-modules jdk.incubator.vector`). Fallback thinking only.

**How to apply:** when this unit is scheduled, step 1 is the cheap experiment — dump Aparapi's
generated OpenCL for both kernels and read it — before committing to a rewrite; keep the three-path
damage-model invariant from [[set-effects-fervor-weakening]] (CPU `StatCalculator` is the oracle;
add a CPU-vs-GPU parity test). [[overhaul-plan-2026-08]]

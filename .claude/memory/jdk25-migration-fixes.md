---
name: jdk25-migration-fixes
description: "The three code-level fixes the Java 21→25 migration needed (Lombok annotation-processor path, aparapi native-access flag, aparapi-stderr-matcher false-positive), all verified still present 2026-08-28 — needed again if the JDK is bumped further or Lombok/aparapi versions change."
metadata:
  type: reference
---

# JDK 25 migration fixes (landed 2026-06-16, verified still present 2026-08-28)

The backend runs on Temurin JDK 25 (`F:\VSCode-Data\jdk\jdk-25.0.3+9`, `pom.xml`
`maven.compiler.release=25`; see [[java-build]]). Three code-level fixes were required and remain in
place — relevant again if the JDK is bumped further, or Lombok/aparapi are upgraded:

1. **Lombok under JDK 23+:** javac no longer runs classpath-only annotation processors, so Lombok's
   getters/setters silently stopped generating (`cannot find symbol`). Fix: declare Lombok explicitly
   in `maven-compiler-plugin`'s `<annotationProcessorPaths>` + `<proc>full</proc>` — confirmed present
   in `3. XML/pom.xml`'s `maven-compiler-plugin` config (also correct on JDK 21, so no regression risk
   from keeping it declared).
2. **aparapi native access:** `System.load` (aparapi's JNI GPU path) warns under JDK 24+'s native-access
   restrictions. Fix: `--enable-native-access=ALL-UNNAMED` passed to the backend JVM args — confirmed
   present in `4. JS/6. Shared/3. Services/subprocess.js` (backend spawn args).
3. **False GPU-error popup:** JVM `WARNING:` startup lines (some naming "com.aparapi") were being
   caught by `subprocess.js`'s stderr matcher and surfaced as a fake GPU error. Fix: the matcher now
   only treats a line as a real error when it's not a `^WARNING:`-prefixed JVM line, gated further by
   requiring an actual `aparapi`+failure or `OpenCL` signature — confirmed present in `subprocess.js`
   (`isJvmWarning` check + the `aparapi && (isRealError || OpenCL)` gate).

**Also still true:** the Maven/version-lens "Guava ⚠ latest 16.0.1" warning on
`com.google.guava:guava:33.6.0-jre` is a **false positive** — 33.6.0-jre IS latest; the linter
mis-parses the `-jre` flavor suffix as a pre-release qualifier and reports the newest *unqualified*
(pre-suffix, ~2014) version instead. Keep `-jre` (desktop JDK), not `-android`. Do not "fix" this.

aparapi's GPU path itself works on JDK 25 (verified via a full optimizer run at the time); the CPU
fallback (pure-Java ForkJoinPool) is the safety net if it ever doesn't. `sun.misc.Unsafe` still warns
on 25 (would throw on 26 — `--sun-misc-unsafe-memory-access=allow` is JDK-23+-only and is the future
fix if/when the JDK is bumped past 25).

**How to apply:** if a future JDK bump breaks Lombok, aparapi native access, or trips a false GPU
error again, these three fixes are the known playbook — check each is still in place before
re-diagnosing from scratch. [[java-build]] [[gpu-backend-successor]]

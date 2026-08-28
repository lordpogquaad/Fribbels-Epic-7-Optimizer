# TASK004 — Java 25 Readiness Advisories

**Status:** Pending  
**Added:** 2026-05-31  
**Updated:** 2026-05-31

## Original Request

Review the backend Java code against `java-21-to-java-25-upgrade.instructions.md` and the earlier Java 11→17 and 17→21 instruction files. Document any actions needed before or during a future Java 25 upgrade.

## Thought Process

The backend is correctly compiled at Java 21 (`maven.compiler.release=21`). The existing code uses classic Java style — no Records, no Sealed Classes, no Virtual Threads. This is safe and compatible with all Java 21 features. No mandatory rewrites are required to continue running on Java 21.

Two advisory items were identified for tracking before any Java 25 upgrade:

1. **aparapi JNI / JEP 472**: The OpenCL bridge uses JNI. Java 25 (JEP 472) will emit warnings — and a future release will restrict — JNI usage without explicit `--enable-native-access`. No action needed now; track for Java 25.
2. **`--add-opens` for JAR spawn**: The Maven Surefire plugin passes `--add-opens` flags for test-time reflection. The Electron `main.dev.js` spawn call does **not** forward these. If runtime module-access errors surface (Gson, aparapi introspecting private fields), add the flags to the spawn call.

No Java 17→21 or 11→17 mandatory migration items found. All upgrade paths are available but optional; the existing classic style is not blocking.

## Implementation Plan

- [ ] (Advisory) Monitor JEP 472 progress; add `--enable-native-access=ALL-UNNAMED` to spawn args before targeting Java 25
- [ ] (Pending) If runtime reflection/module-access errors appear when spawning the JAR, add `--add-opens` flags to the spawn call in `main.dev.js`

## Progress Tracking

**Overall Status:** Not Started — 0%

### Subtasks

| ID  | Description                                               | Status      | Updated    | Notes                                                                      |
| --- | --------------------------------------------------------- | ----------- | ---------- | -------------------------------------------------------------------------- |
| 4.1 | Track JEP 472 — aparapi JNI native-access warning         | Not Started | 2026-05-31 | Advisory only; act before any Java 25 upgrade. No code change needed now.  |
| 4.2 | Add `--add-opens` to JAR spawn in `main.dev.js` if needed | Not Started | 2026-05-31 | Trigger: runtime reflection/module-access errors. File: `app/main.dev.js`. |

## Progress Log

### 2026-05-31

- Java 21→25, 17→21, and 11→17 instruction files all reviewed
- Backend confirmed on Java 21 (`maven.compiler.release=21`); all dependencies modern
- No breaking changes and no mandatory rewrites identified
- Two advisory items recorded for pre-Java-25 tracking
- Task created in Pending state; no code changes applied

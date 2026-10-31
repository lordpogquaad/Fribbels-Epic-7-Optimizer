---
name: maven-report-tools
description: How JaCoCo, Enforcer, versions and SpotBugs are wired in the backend pom, and the traps hit. Verified 2026-10-30 on JDK 27.0.1, Maven 3.10.0.
metadata:
  type: reference
---

- All four read JDK 27 class files (JaCoCo 0.8.16, SpotBugs 4.10.5.0 with 0 missing classes/errors). The pom pins them; `mvn.cmd` is the bundled one under `3. Backend/2. Apache Maven/`.
- JaCoCo lives in profile `coverage` only. Surefire `argLine` is `@{argLine}` + the `--add-opens` flags, and the pom defines an empty `<argLine>` property, otherwise `@{argLine}` stays literal without the profile and the test JVM fails to start.
- SpotBugs and versions plugins have no executions (explicit goals only). SpotBugs XML uses single-quoted attributes; its first `SourceLine` in a BugInstance is the class, not the finding line.
- `mvn test` writes `target/` (not `clean`), so it is safe beside the language server; `-Pcoverage` adds `target/jacoco.exec` and `target/site/jacoco/`.
- A PreToolUse hook blocks `python -`/heredoc stdin programs in compound Bash; use a scratch `.mjs`.

# Update your agent memory as you discover codepaths, patterns, library locations, and key architectural decisions. This builds up institutional knowledge across conversations. Write concise notes about what you found and where

- [javac test harness](javac-test-harness.md) — run the JUnit suite via javac+Lombok in the scratchpad; classpath, quoting and formatter-hook traps.
- [Maven report tools](maven-report-tools.md) — JaCoCo/Enforcer/versions/SpotBugs wiring in the pom; argLine and profile traps.
- [JS parity in Node](js-parity-in-node.md) — run real damageCalc.js in Node vs Java computeDamageMultipliers; verdict and fixture.
- [Concurrency and test traps](concurrency-and-test-traps.md) — who shares what across HTTP threads, testing volatile/race fixes, mutation check via mvn -Dtest.

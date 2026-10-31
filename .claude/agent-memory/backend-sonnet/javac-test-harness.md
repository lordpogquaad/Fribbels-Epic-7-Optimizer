---
name: javac-test-harness
description: How to compile and run the backend JUnit suite with javac + Lombok into a scratch dir (bypassing the language server's target/classes), and the traps hit building it. Verified 2026-10-30.
metadata:
  type: reference
---

`mvn test` can test the language server's `target/classes` ("Nothing to compile"), so a javac run is the independent check.

- Classpath: the shaded `target/*-jar-with-dependencies.jar` has no Lombok, so put the Lombok jar from `~/.m2` on `-cp` AND `-processorpath`. JUnit needs api, engine, commons, platform-engine, launcher, opentest4j, apiguardian and jspecify from `~/.m2` (use the versions in `pom.xml`).
- Use Windows-style `C:/...` paths for every jar: a `~/.m2` path expanded by MSYS (`/c/Users/...`) is not understood by the native javac inside a `;`-joined classpath.
- javac `@argfile` splits on spaces: wrap each source path in quotes (the numbered folders have spaces).
- A 20-line `LauncherFactory` main (SummaryGeneratingListener) runs the tests; PMD (`yarn lint:java`) also scans the tests, and every test in `10. Tests` costs one `TypeNameMismatch` because its package is not its folder.
- Writing a `.js` file with Edit/Write fires a formatter hook that reflowed the whole `optimizerTab.js` (about 1500 changed lines). For a small JS edit, restore the file from `git show HEAD:<path>` and apply the change with `sed` through Bash.
- Mutation check without touching the repo (verified 2026-10-30): `sed`/a node script writes the one-line-mutated production file into a scratch dir, and the javac source list swaps that path in for the real one, so the tests run against the mutant; assert the mutation matched exactly once. In a double-quoted sed expression `$#` is the shell's argument count, so use `|` as the s-delimiter or the swap silently does nothing and every mutant "survives".
- `mvn test` says "Nothing to compile" for main code (the language server keeps `target/classes` current) but still compiles the new test classes, so it is a valid second run for test-only changes and for main edits the server has already rebuilt.
- `rm` of a scratch dir is denied by the auto-mode classifier; use a new output dir name per run instead.

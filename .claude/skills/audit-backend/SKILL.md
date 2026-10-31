---
name: audit-backend
description: Audit the Java backend of the Pog E7 Optimizer for real defects and hidden problems. Runs PMD and the Maven tests, then dispatches backend-sonnet in shards, or backend-opus with deep, and files every finding. Read-only apart from the fix list and ledger.
disable-model-invocation: true
argument-hint: '[drift|deep [paths]]'
---

# /audit-backend

Arguments: `$ARGUMENTS`

Read `.claude/skills/section-audit.md` now: it owns the modes, flow, agent contract and report.
This file supplies the backend's values. The agents are `backend-sonnet` and `backend-opus`.

## Scope

Under `1. App/3. Backend/1. Source/`: `1. Java/com/`, `1. Java/10. Tests/`, `pom.xml` and
`pmd-ruleset.xml`. Under `1. App/1. Master/2. PS1/`: `build_backend.ps1` and `lint_java.ps1`.

Exclude the numbered junction paths `1. Core` to `8. GPU`: git lists those files twice, and auditing
`com/fribbels/` covers them. Shard by package, with `Main.java` joining the `handler` shard and each
test joining the package it tests.

## Tool pass

Both write only to the ignored `3. Backend/1. Source/target/`.

- `yarn lint:java`: PMD. Exit 0 includes findings, so read them from `3. Backend/1. Source/target/pmd.xml`.
  Exit 1 means Maven could not run, and a missing `pmd.xml` or one older than this tool pass means no
  result.
- The Maven tests, using the Maven path and `JAVA_HOME` that `lint_java.ps1` sets, from
  `3. Backend/1. Source/`:

  ```bash
  JAVA_HOME="<as lint_java.ps1>" "../2. Apache Maven/<as lint_java.ps1>/bin/mvn.cmd" test
  ```

  Read the final `Tests run:` line and `BUILD SUCCESS`.

## What the agents check

- **Search correctness:** filters, pruning and result ranking that could drop or misorder a valid
  build with no error.
- **Damage model parity:** CPU `StatCalculator`, the GPU kernel and the JS calculator in
  `fribbelsPriorityFilter.js` must agree. Report a gap as a finding; the GPU side cannot run here.
- **Handlers:** swallowed exceptions, a failed request reported as success, unvalidated input, and
  shared state touched from concurrent requests.
- **Persistence and models:** `final` on Gson-bound fields, and data lost between save and load.
- **Tests and build:** a test that cannot fail, disabled tests, and `build_backend.ps1` reporting
  success after a failure (`B7`).

## Not run in an audit

`build_backend.ps1` overwrites the tracked `backend.jar`, so before-and-after jar comparisons do not
run. GPU kernels cannot run on this machine. Both stay in the report's `Not run` line.

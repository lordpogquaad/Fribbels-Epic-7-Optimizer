# Ledger

Dated record of findings and finished work, newest first, with the evidence behind each. Tags:
`[Repo]`, `[Backend]`, `[Frontend]`, `[Scanner]`, `[UI]`. Open work lives in
[FIX LIST.md](FIX LIST.md). History before this file: `Bugs/` and `Improvements/`.

## 2026-10-30

- `[Repo]` **Dev launch failed: `Cannot find module E:\Node\node_modules\corepack\dist\yarn.js`.**
  Node 26 no longer ships corepack, and the `yarn` shim in `Roaming\npm` still pointed at it. Fixed
  by Marcus running `npm install -g corepack` and `corepack enable`. The first dev compile sits
  silent after `CopyAssets`; the dev server was listening on 1212 by then, so that pause was not a
  hang.
- `[Repo]` **Project settings.** `Bash` permission rules do not restrict the PowerShell tool, so the
  push prompt and force-push deny were bypassable there. Added `PowerShell` twins, force-push rules
  with the flag after the branch, and `onFailure: block` on the package guard. Not committed.
- `[Repo]` **Lead acceptance of the update work.** Diffs reviewed. `yarn lint`, `yarn typecheck` and
  `yarn build` all exited 0 on the combined tree; the build has one `Critical dependency` warning in
  the main bundle, not yet compared with earlier builds. `electron-builder --dir` passed in the
  worker's run. The Java results above were not re-run by the lead. Electron 45.1.0 embeds Node
  24.22.1 and Chromium 156. `yarn npm audit --severity high` was clean for the outer tree; the inner
  npm install reported one high-severity advisory, not identified because that tree has no lockfile.
  `@babel/core` held at 8.0.9 until 8.0.10 passes Yarn's 24-hour age gate.
- `[Repo]` **Chain Log problems, session `cf0e8d69`.** 130 errors and 108 warnings. Hook slowness
  tracked the heavy worker load: `effort-cache.mjs` averaged 1.7 s and peaked at 104 s,
  `pre-shell-guards.mjs` peaked at 58 s, and 43 event-loop stalls were logged. At 10:59 UTC the 10 s
  limit on `guard-package-root.mjs` expired and `onFailure: block` stopped a worker's command, so the
  limit is now 30 s. `config-tools` dropped at 10:30 UTC with `CONNECT_TIMEOUT`. Also seen, not from
  this repo: `claude-artifacts` 404, `runpod`, `novita` and `atlascloud` startup timeouts, three
  `thread_not_found` API errors, stream stalls and resets.
- `[UI]` **`launch.json` pointed at the repo root,** which has no `node_modules`. Paths moved to
  `1. App`; `START_HOT`, `NODE_ENV` and an `ELECTRON_RUN_AS_NODE` clear added. Not run yet (U2).
- `[Backend]` **JDK 27 move, reported by the worker, lead acceptance pending (B1).** 21 tests pass.
  Real CPU optimization of 179,159,040 combinations gave the same counts and top row as the old jar
  on JDK 25. Lombok 1.18.48 is required (1.18.46 fails with an `EndPosTable` error). `final` removed
  from 10 Gson-bound fields for JEP 500, chosen over a JVM flag that stops JDK 25 from starting.
  `sun.misc.Unsafe` still defaults to `warn` on 27.0.1, so the "throws on 26" prediction was wrong.
- `[Backend]` **Maven and `pom.xml` bumps, reported by the worker, lead acceptance pending (B2).**
  Maven 3.10.0, gson 2.15.0, guava 33.7.2-jre, commons-collections4 4.6.0, commons-lang3 3.21.0,
  junit 6.1.3, compiler plugin 3.16.0, surefire 3.6.1; none held. 21 tests pass and the optimization
  matches the JDK 27 run exactly. A round trip of 399 heroes and 3,398 items matched the pre-bump jar
  apart from `duplicateId` values, which also change between two runs of the same jar. The
  auto-download branch of `build_backend.ps1` was not run; its URL and checksum were checked.
- `[Backend]` **GPU, reported by the worker (B4).** No `OpenCL.dll` on this machine, so it runs on
  CPU with no false popup. Separately, `ClassModel.getEntrypoint` throws `Sanity check, we seem to
  have >20 iterations collapsing logical expression` on both kernels on JDK 25 and 27, so this
  predates the JDK move.
- `[Backend]` **Stray folders in `3. XML/`** appeared at 05:22 on 2026-10-30, before the first
  worker build. Cause unconfirmed; `pom.xml` has `<directory>../target</directory>` (B3).
- `[Scanner]` **Toolchain check.** Python 3.14.10, scapy 2.8.0 (latest), Npcap service running.
- `[Repo]` **Sessions.** Older transcripts for this repo are gone, most likely removed by
  `cleanupPeriodDays: 30`. Inferred from dates; no deletion log entry was found.

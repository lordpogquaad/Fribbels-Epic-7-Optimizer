# Ledger

Dated record of findings and finished work, newest first, with the evidence behind each. Tags:
`[Repo]`, `[Backend]`, `[Frontend]`, `[Scanner]`, `[UI]`. Open work lives in
[FIX LIST.md](FIX LIST.md). History before this file: `Bugs/` and `Improvements/`.

## 2026-10-30

- `[Scanner]` **Rescan confirmed at 07:38.** With local cache on and the 5★ filter, the saved database
  holds 400 heroes and 3,780 items, none at level 0. Moro was named by code; only the four `s000N`
  story units were dropped; nothing pruned; no errors.
- `[Scanner]` **Set and image audit against the 07:09 scan.** All 24 set codes across 3,780 items map
  to known sets with icons, and all 1,179 hero image references exist locally. Rex's set-related code
  has not changed since the August sync. New gear code `ecs28` (3 items) came back level 0 and is
  fixed to 88 by `tryFixUnknownLevel88`, matching every other `ecs` item. Artifact icons load from
  Smilegate's site, not local files. Backend (21 tests) and frontend rebuilt at 07:33, RC 0.
- `[Frontend]` **Item locator ported from Rex's `4932fd3` (merged in `de27c65`).** The game's inventory
  order changed, so the locator now sorts by final substat value (`augmentedStats`) instead of summing
  `op` rolls. The fix was only on `feat/offline`, not `main`. Lint and typecheck pass; positions not
  yet compared with the game.
- `[Scanner]` **400 heroes in game, 395 in the app.** Five heroes are missing because Rex's
  `herodata.json` stops at 388 entries and lacks them. The scan export holds 399 units. `c2187` was
  dropped by `convertUnits` (no name, no hero data). Haru `c1192`, Renoa `c1193` and two Mei Lin
  `c1191` came back named, but the default Optimizer import filter only adds names already in the
  database, so `mergeHeroes` skipped them with no message. Bunny Girl Great Detective Moro appears in
  the game screenshot and not in the scan under that name, so `c2187` is probably that hero
  (inferred). The same import pruned 8 duplicate `#N` heroes whose ids were not in the scan.
  Correction: Rex had already published them on `e7-data-291fabdab9f046be8fb6870bddf5bed0`, commit
  `b5a42709`, which is 3 commits ahead of `main`. `sync-upstream-data.ps1` gained `-DataRef`; synced
  393 heroes and 13 images, and every code in the scan export now has data, confirming `c2187` as
  Moro. The app needs the local cache setting on, or a changed `main` can overwrite this data.
- `[Backend]` **First app run of the search on JDK 27 and Electron 45.** At 06:50 a CPU run for 491,438,350
  permutations was stopped by Marcus after 8.9 s: 11,446,471 searched, 3,913,805 matches, best 2,000,000 kept,
  result rows returned and sorted. No error, exception or JVM warning in `latest.log`. The earlier
  abort at 06:47 was the 1,000,000,000,000 limit (F5), not the update. A full run to completion has
  not been seen in the app yet. This closes R1, B1 and B2; the lead's last backend build passed all
  21 tests.
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
- `[Repo]` **Node declarations.** Marcus moved `@types/node` to ^26.6.6; `engines.node` is now `>=26`
  and `.nvmrc` is 26. Electron 45 still embeds Node 24.22.1, so these types can show Node 26 APIs the
  main process lacks. `yarn typecheck` and `yarn lint` exit 0 after the bump.
- `[Frontend]` **Renderer "1 high" advisory fixed.** Installed `follow-redirects` 1.16.0 was affected
  by GHSA-q3jh-wrc6-jgq8. `install_frontend.ps1` never moved it because npm keeps to the hidden
  `node_modules/.package-lock.json`. `npm update` of it and `@babel/runtime`, followed by the
  installer, reached 1.16.2 and 7.29.10, and npm reports 0 vulnerabilities. Every direct dependency in
  the renderer manifest is still used.
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

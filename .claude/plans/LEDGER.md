# Ledger

Dated record of findings and finished work, newest first, with the evidence behind each. Tags:
`[Repo]`, `[Backend]`, `[Frontend]`, `[Scanner]`, `[UI]`. Open work lives in
[FIX LIST.md](FIX LIST.md). History before this file: `Bugs/` and `Improvements/`.

## 2026-10-30

- `[Repo]` **R24 closed: `yarn scan`.** `ScanReport.mjs` runs the 10 report-only checks one at a time and
  writes `SCAN-REPORT.md`, counts per tool and rule. A check that cannot run, times out or gives output
  that does not parse shows as FAILED or TIMEOUT with `n/a`, never zero, and `scan` then exits 1. A probe
  proved all three paths. First run: all 10 ran, in about a minute. New file: adds 35 `checkJs` errors, so
  F10 is now 6,032. `lint:strict` rose from 936 to 939, cause not confirmed.
  The one `lint:deps-graph` error is a false report: `LogControl.js` requires `@electron/remote`, which is
  in the inner manifest and loads at runtime in a raw `<script>`; depcruise only looks from `1. App`.
- `[Backend]` **B9 closed: `yarn lint:java`.** Report-only PMD through `lint_java.ps1`, with
  `pmd-ruleset.xml` (bestpractices, errorprone, multithreading, performance). maven-pmd-plugin 3.28.0
  bundles PMD 7.17.0, which has no Java 27 grammar, so the pom overrides PMD to 7.29.0. It is bound to
  no phase, so `build_backend.ps1` does not run it. First run: 202 findings in 23 files, 0 parse errors,
  none from the junction paths, none triaged. The report is `target/pmd.xml`, which `mvn clean` removes.
  Maven 3.9.16 had no references and moved to `trashcan/`.
- `[Scanner]` **S6 closed: `yarn lint:py`.** Report-only Ruff with a root `ruff.toml`, plus
  `yarn lint:py:types` for mypy. `.flake8` moved to `trashcan/`; only its line length carried over.
  First run: 7 findings (no `S` or `B`), mypy clean, both over the 2 tracked Python files.
- `[Backend]` **B12 closed: the Java editor compiles the whole backend.** It compiled only `Main.java`,
  so backend classes had no real diagnostics. The eight `com/fribbels` links were already junctions (Git
  Bash shows them as symlinks), and the language server reads a junction as a file (inferred). Flipped
  them: `com/fribbels/<package>` are real, `1. Core` to `8. GPU` are junctions. git sees no change, so
  the flip exists only on this machine. The 10:43 editor rebuild then wrote 111 classes across all
  eight packages. `com.fribbels.Main` no longer resolved from `0. Main`, so `Main.java` moved to
  `com/fribbels/` and `0. Main` is gone. `build_backend.ps1`: 73 sources, 21 of 21 tests. Diagnostics now
  show zero backend errors plus real warnings (null safety, unused fields) for the backend section dive.
  The URI log noise stays open as B12.

- `[Repo]` **Lint scripts renamed and report scripts added (R17, R19).** `lint-fix`, `lint-styles` and
  `lint-styles-fix` are now `lint:fix`, `lint:styles`, `lint:styles:fix`; `lint:dead`, `lint:deps-graph` and `lint:dupes` run knip, dependency-cruiser and jscpd.
- `[Repo]` **Config audit: nothing hides a problem now.** `/audit-fix` over every config, read against
  the installed tools. Fixed: `lint-fix` and `lint-styles-fix` ran nothing and exited 0 (`yarn --silent`
  is invalid in Yarn 4); `prestart` never ran (no `prestart` in Yarn 4's bundle), so `start` now builds
  first; `.prettierignore` missed `translation.missing.json`; `.markdownlint-cli2.jsonc` read
  `.remember/` and could not resolve its `extends` from VS Code. Removed dead ignores and globs, and the
  bare `report/` ignore that could have hidden a future folder. Dead `codeQL`, `kilo-code` and nodemon
  keys left `.vscode/settings.json`; `eslint.workingDirectories`, `probe` and `validate` were added so
  ESLint stops failing on Markdown. `lint:strict` now turns `no-undef`, full `no-unused-vars` and
  `no-empty` back on, 577 to 936 warnings, and uses Node 24 rules for `5. Dev Only`.
  `yarn typecheck:strict:report` is new: 5,997 errors the passing gate does not show (F10). Kept on
  purpose: `endOfLine: auto`, because `sync-upstream-data.ps1` writes CRLF; the chat settings in
  `.vscode/settings.json`, which are personal but harmless. knip ignores only the four packages webpack
  names by string; other noise stays in reports to be judged case by case (Marcus).
- `[Backend]` **B3 closed: `pom.xml` moved to `1. Source/`.** The redhat.java `.project` and `.classpath`
  in its workspace storage prove the cause: m2e turned each pom path outside `3. XML/` into a linked
  folder, or rebuilt the absolute path as real folders. Those deep folders also made git print "Filename
  too long". Deleting them could not last, so the pom moved and its `..` paths went; `build_backend.ps1`
  and the docs followed. Build passes: 21 tests, fresh `backend.jar`. `3. XML/`, `.vscode/explaininh`,
  `.vscode/Apptree.md` and the empty root `2. Frontend/` are in `trashcan/config-audit-2026-10-30/`.
  Whether a Java LS clean keeps the folders away is B12. The moved `bin/pom.xml` then failed import as a
  duplicate project (redhat.java log, 09:55), so `java.import.exclusions` in
  `Poge7optimizer.code-workspace` now skips `trashcan/`; that setting is window-scoped, so a multi-root
  workspace ignores it in `.vscode/settings.json`.
- `[Repo]` **Report-tool configs added (R3).** `.editorconfig`, `.markdownlint-cli2.jsonc`, `knip.json`,
  `.dependency-cruiser.cjs`, `.jscpd.json` and `sonar-project.properties`, with their packages; `.gitignore`
  merged. `.gitattributes` already matched. `.remarkrc.mjs` skipped as adding nothing here. Marcus asked for
  `jsconfig.json` and `jsconfig.strict.json` too; `lint:strict` now takes type info from the strict one, still
  577 warnings. `yarn lint:strict:report` writes `.claude/plans/LINT-STRICT-REPORT.md` with the config repo's
  `lint-strict-report.mjs`. Sonar config leaves Java out until a Java scan is wanted. knip 6.43 is the newest the age gate
  allowed. Lead's run: lint, typecheck and build exit 0; Prettier lists the same 76 files with and without
  `.editorconfig`, so it changes no formatting.
- `[Repo]` **Prettier config moved to the root, permissions trimmed.** `.prettierrc.json` matches the config
  repo (width 100, was 80) and replaces the `prettier` block in `1. App/package.json`. `.prettierignore` moved
  to the root with unprefixed patterns, tested from both folders; `lint-styles` now names `2. CSS/`
  directly. It exits 2 on one existing error (U3). Marcus removed the project `ask` and `deny` rules himself
  because the auto mode classifier refused the edit; `guard-git-publish.mjs` asks on force-push. Added an
  ignored root `trashcan/`.
- `[Frontend]` **Strict lint added (R14).** `yarn lint:strict` is report-only: 577 warnings, 0 errors, exit 0.
  Top rules: `no-floating-promises` 222, `no-unnecessary-condition` 161, `no-misused-promises` 73,
  `require-await` 45, `require-atomic-updates` 20. `regexp/no-super-linear-move` 6 and
  `regexp/no-dupe-characters-character-class` 4 are unverified leads. The export demotes every rule to
  `warn`, because the regexp and promise presets ship `error` rules. `yarn lint`, `yarn typecheck` and
  `yarn build` exit 0 in the lead's own run. First `frontend-sonnet` run; its agent memory write worked
  with no prompt.
- `[Repo]` **Agent audit, project roster.** Gates clean on 30 files; 9 project agents audited, 21 user-scope
  agents gate-only. Nine small fixes applied, including one broken rule path in the UI agents and
  `yarn typecheck` in the scanner and UI gates. Gates clean afterwards. Correction: git holds one blob under two index entries for files under `com/`,
  not separate blobs, and `0. Main` and `10. Tests` have a single path.
- `[Repo]` **Project agents built with `/forge`.** Sonnet and Opus agents for backend, frontend, scanner
  and UI, plus `section-haiku`. Audit: 0 violations. Advisor is Fable through user-scope `advisorModel`,
  not per agent. Section agents use `memory: project` and read their twin's notes. New agents needed
  `/reload-plugins` to become spawnable. Two test runs returned their contracted format: B3 diagnosis
  and the R8 inventory, which also found the tracked `Copilot-Processing.md`. Both ran before memory,
  effort pins and the scouting change, so memory writes are untested. The old `.claude/agents/README.md`
  placeholder was removed. Effort is pinned per agent. Scouts are `section-haiku` and the global
  `sonnet-researcher`. A review of `backend-opus` corrected the build gate, the before-and-after run,
  GPU reporting, `com/` commit staging and path anchoring. No Opus 4.8 pairs: a subagent gets no
  automatic fallback, so after a cyber refusal the lead uses `opus-worker-opus48`.
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

---
name: runtime-log-file
description: "Where the app writes its on-disk log (both processes), how it rotates, its line format, and how to read it instead of asking Marcus to paste DevTools output."
metadata: 
  node_type: memory
  type: reference
  originSessionId: ae12964a-a779-473a-b06c-7e3b2491cb82
  modified: 2026-08-28T15:11:25.305Z
---

# Runtime log file (added 2026-08-28)

**Read this first when Marcus reports app behaviour** — do not ask him to paste console output.

Path (dev / `start-dev.bat`, Marcus's choice 2026-08-28 — "have logs go here"):
`1. App/5. Dev Only/logs/latest.log`, inside the repo, gitignored by the root `logs` pattern.
Packaged builds can't write inside the asar, so they fall back to Electron `userData`
(`C:\Users\Marcus\AppData\Roaming\Pog E7 Optimizer\logs\`); `FileLog.resolveLogDir` picks via
`app.isPackaged`. The exact path is printed at startup as `[main] file log: …` /
`[FileLog] writing to …` and in each header's `logDir:` line.
Rotation per launch: `latest.log → prev-1.log … prev-5.log`, oldest dropped, done by the **main**
process at `ready` before the window opens; the renderer only appends. The `userData` folder also
holds a stale `main.log` from the removed `electron-log` and the first launch's logs — ignore them.

Implementation: `1. App/5. Dev Only/FileLog.js` (shared primitives, no deps) + `main.dev.js`
(`initFileLog`: rotation, header, `[main]` console tee, uncaught errors) + `LogControl.js`
(`FLAGS.fileLog`, every `Log.*` method tees with the same gating as the console, plus a raw
`console.*` tee). Switches: `FLAGS.fileLog` (renderer) and `E7_FILE_LOG=0` (main, in
`start-dev.bat`). Not covered: DevTools "verbose" network lines (`Fetch finished loading …`) —
those are not console calls.

Line format: `HH:MM:SS.mmm LEVEL message`; levels `DEBUG INFO WARN ERROR JAVA GRID API TABLE GROUP`
(each `Log.*` method tees under the same flag that gates its console output — a channel that is off
in `FLAGS` is absent from the file too) and
`[main] LOG/INFO/WARN/ERROR/UNCAUGHT`. Two header blocks per launch (main, then renderer — the
renderer one carries the resolved `FLAGS` JSON). Lines are truncated at 1,000 chars with
` …[+N chars]` (the backend echoes whole request bodies at INFO); continuation lines are indented
four spaces so a `^\d\d:` grep yields one hit per record.

Useful greps: `hero count:` (hero data size), `PRUNED STALE HERO|RELINKED STALE HERO|mergeHeroes:`
(import), `SEVERE|Disabling GPU` (Aparapi/OpenCL), `\[HeroData\] Using local cache` (toggle on),
`killer|DEP0190` (should be absent). Whether the Rex data fetch hit 200 or 304 is not logged —
check the mtime of `6. JSON/2. CACHE/cache/herodata.json` instead (rewritten only on 200).

**How to apply:** for any runtime question, read `latest.log` (and `prev-N.log` for earlier
launches) before asking for a paste. [[log-control]] [[repo-lineage]]

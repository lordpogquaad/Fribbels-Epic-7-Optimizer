---
name: repo-lineage
description: "Fribbels (original, abandoned) → RexQian (public, actively maintained fork) → lordpogquaad (Marcus's PRIVATE personal fork); what that implies for upstream identity fields, auto-update, and merge friction."
metadata: 
  node_type: memory
  type: project
  originSessionId: ae12964a-a779-473a-b06c-7e3b2491cb82
  modified: 2026-08-28T11:44:36.574Z
---

# Repo lineage (Marcus, 2026-08-28)

- **Original** — https://github.com/fribbels/Fribbels-Epic-7-Optimizer — public; its author quit the
  game and stopped maintaining it. Not a git remote here.
- **Rex's fork** — https://github.com/RexQian/Fribbels-Epic-7-Optimizer — public fork that took over
  maintenance and ships the ongoing game-patch updates (`update: patch YYYYMMDD (#N)` commits).
  Git remote `upstream`. ⚠️ Two branches matter (Marcus, 2026-08-28): **`main`** carries the data
  patches; **`feat/offline`** is Rex's real dev branch — same data files, plus code `main` lacks
  (Fervor damage calc, PVE 400% crit-damage cap + `StatCalculatorTest`, a GPU-throughput rewrite
  `ea9131c` "perf/rtx5090-utilization", pom lombok bump + shade plugin, the offline/local-cache mode).
  Check `feat/offline` — https://github.com/RexQian/Fribbels-Epic-7-Optimizer/commits/feat/offline —
  when reviewing what code to port; `main` alone under-reports. `feat/import-support-china-server`
  is scanner-only, irrelevant here.
- **Marcus's fork** — https://github.com/lordpogquaad/Fribbels-Epic-7-Optimizer — **private** fork of
  Rex's version (chosen because it was the most current). Git remote `origin`. Personal build, not a
  distribution.

**Why it matters:**

- Identity/publish fields inherited from Rex were *upstream's*, not this fork's. Until 2026-08-28 a
  packaged build would have auto-updated itself with Rex's releases (`electron-updater` via
  `app-update.yml` + a hardcoded `update-electron-app` poll) — replacing Marcus's build with upstream's.
  Resolved that day: both updaters and `build.publish` removed, `appId` made fork-specific; this fork
  has **no self-update by design** (a private repo can't feed one without a token). `author` and the
  Help → Learn More URL still name Rex — deliberate, harmless attribution.
- There is NO `git merge upstream` workflow — the trees diverged (numbered-folder reorg). What Marcus
  takes from Rex per game patch is **data**: `data/cache/herodata.json` + `artifactdata.json` (Marcus,
  2026-08-28) — and, verified the same day, the matching **hero PNGs** in `data/cachedimages/`, because
  `localizeHeroAssets()` in `heroData.js` rewrites every hero asset URL to `./assets/<file>` with no
  network fallback, and Fribbels' repo (the URLs inside herodata.json) 404s for post-abandonment heroes
  while Rex's raw GitHub serves them. Rex's patches also carry code (new gear sets, scanner/OCR fixes);
  Marcus ported Fervor/Weakening himself with different enum indices (local `Set.java` MIGHT=22 2pc,
  WEAK=23 4pc + `weakeningSetBonus` speed in `StatCalculator`) — internally consistent, so do not
  "align" indices to upstream. Other upstream code changes need per-patch manual review, not merge.
- Runtime data path: the bundled `6. JSON/2. CACHE/cache/` IS `Files.getCachePath()`; at launch
  `heroData.js` conditionally refetches (ETag) from Fribbels' S3 bucket, which is still updated but lags
  Rex's git by ~a patch. Rex's raw GitHub URL for the JSON returns an ETag, so it is a drop-in source.

**How to apply:** treat `upstream` as the source of game-data patches (JSON + images), `origin` as
private personal work; never assume upstream's publish/updater/identity config is meant for this fork;
never do a wholesale merge from upstream. [[overhaul-plan-2026-08]]

# Existing Bugs — Known Backlog / Pending

Ordered highest priority → lowest. Java fixes require JAR rebuild unless noted.

---

## BUGS (JS only — no rebuild needed unless noted)

---

## SECURITY

**C1 — Insecure Electron window config**
`nodeIntegration: true` + `contextIsolation: false` present in both dev and prod `BrowserWindow` configs (`main.dev.js`).
Full fix requires a `preload.js` + `contextBridge` refactor across 11 renderer files
(fs, path, remote, ipcRenderer, child_process, process.env).
Deferred: H1 (XSS → RCE vector) already fixed via `escAttr()`; app only loads `file://` URLs.
Practical risk is very low without a live XSS vector.

> **Reviewed 2026-06-21 — keep deferred (intentional decision, not an un-triaged item).** Footprint
> re-confirmed: **11 files / 32 direct Node-API call sites** (`fs`/`path`/`child_process`/`@electron/remote`/
> `ipcRenderer`/`process.env`). The renderer is `<script src>`-loaded jQuery that `require()`s Node directly,
> so a `contextBridge` migration is an app-wide re-architecture with real regression risk on a working app —
> a **dedicated hardening project**, not backlog cleanup. Benefit is marginal (file:// only, XSS→RCE already
> mitigated). Take it on only as a deliberate security investment, ideally alongside enabling `sandbox`.

---

## OPTIMIZATION

**#22 — Partial-Sum Pruning in CPU Loop**
Pre-sort items per slot by stat contribution; accumulate running total; break if
`running + max_remaining < inputMinAtkLimit`. High difficulty due to percentage stats.
File: `OptimizationRequestHandler.java` nested loop lines ~1261–1329
Note: Deferred. Items #1–#21 all done. GPU path (#4 Phase 7 skip, #13 per-slot pre-filter)
already covers the common cases; CPU path is rarely the bottleneck.

> **Reviewed 2026-06-21 — keep deferred (now with a hard structural reason).** The GPU/CPU split is
> `useGpu = SETTING_GPU && canUseGpu && maxPerms >= 20_000_000 && runningCount <= 1` (line ~1041). So the
> **CPU loop only ever runs SMALL permutation spaces (< 20M — already fast) or a no-GPU fallback**; every
> heavy ≥20M-perm run (the only kind slow enough for pruning to pay off) is routed to the **GPU**, which
> already prunes (#4/#13). On a GPU-equipped machine pruning the CPU loop is near-zero value. Meanwhile the
> downside is severe: a naive additive `running + max_remaining` bound is **unsound for %-based stats**
> (atk%/hp%/def% are multiplicative on base), so a wrong bound would **silently drop valid builds** — wrong
> optimizer output, the worst failure mode here. Revisit ONLY to help GPU-less users with large runs, and
> ONLY with a provably-sound bound (benchmark-justified first).

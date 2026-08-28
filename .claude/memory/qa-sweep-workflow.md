---
name: qa-sweep-workflow
description: "Marcus's preferred workflow for a large deliberate file-by-file review pass: verify → fix → update stale comments → log, one file at a time, user drives which file is next; defer rebuild to the end for accumulated source edits, but rebuild immediately when a dependency/manifest changes mid-sweep."
metadata:
  type: feedback
---

# Large-change QA sweep workflow (established 2026-06, still the working pattern)

For a large deliberate review pass across many files (first used on the June 2026 modernization,
same shape as the ongoing [[overhaul-plan-2026-08]]), Marcus's preferred per-file cadence is:

**review for correctness → fix any bugs → update stale/inaccurate comments → log the fix** (to the
repo's fix history — currently `.claude/plans/Bugs/Change Logs.md` / `.claude/plans/Improvements/`,
moved in-repo 2026-08-28 per [[overhaul-plan-2026-08]]). For JS/TS files, also apply
[[js-file-hygiene]] (ESLint-clean + BOM strip) as part of the same pass — confirmed "a common theme"
across sweeps, not optional.

**Comments are in scope:** when reviewing/fixing a file, also keep its comments accurate — update
comments describing old behavior, fix comments citing a stale signature/value, delete comments
referencing removed code. Treat a misleading comment like a small bug to fix. Don't churn comments
that are already correct just to touch them.

**Rebuild timing — two different rules:**
- **Deferred rebuild** for accumulated plain source edits: don't rebuild mid-sweep; the user drives
  which file is next, and the rebuild happens once at the very end of the sweep.
- **Immediate rebuild** whenever a dependency or manifest changes mid-sweep: update the dep, sync
  the install, and rebuild right away — before continuing the file review. Reason Marcus gave: keep
  the installed state and the manifest in agreement, so a stale mismatch between what a file assumes
  and what's actually installed doesn't cause confusion mid-review.

**Why:** a large change touches many files; each gets verified individually rather than trusting one
big rebuild at the end to catch everything — except dependency state, which must stay truthful
throughout so review isn't working against a stale install.

**How to apply:** when Marcus starts a large multi-file review pass, follow this cadence by default
rather than asking each time. Don't tell him to "wait until the sweep is done" when he's just bumped
a dependency — that's the immediate-rebuild exception.

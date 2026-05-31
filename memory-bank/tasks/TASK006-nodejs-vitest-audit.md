# [TASK006] — Node.js/Vitest Instruction Audit

**Status:** Pending
**Added:** 2026-05-31
**Updated:** 2026-05-31

---

## Original Request

Audit the codebase against `nodejs-javascript-vitest.instructions.md` and document all findings. No source code changes — advisory and tracking only.

---

## Thought Process

The audit covers the renderer-layer JavaScript (`1. App/2. Frontend/1. Source/js/lib/`) and the root `package.json`. Seven finding categories were identified (NJ1–NJ7).

**Migration items (NJ1, NJ7):** These require non-trivial structural changes. NJ1 (Vitest) needs a full test infrastructure swap; NJ7 (ESM) is risky in the Electron + Webpack context. Both are deferred sprint items — investigation only.

**Pattern items (NJ2, NJ3, NJ4):** Mechanical refactors that reduce manual Promise plumbing. Low risk individually but high volume (23 `.then()` sites for NJ4 alone). Best addressed file-by-file over multiple sprints.

**Preference items (NJ5, NJ6):** Lower-priority style preferences. `null` vs `undefined` (NJ5) is pervasive (30+ sites) but low risk. Class vs factory function (NJ6) is defensible for `LruMap`; `OptimizationRequest` (empty class body) is the simplest first target.

No finding blocks compilation, runtime, or current test execution. All items are advisory.

---

## Implementation Plan

1. (NJ1) Evaluate Vitest migration — assess Jest-to-Vitest compatibility with Electron + Babel config
2. (NJ2) Replace manual `new Promise()` wrappers with `node:util.promisify` — `files.js`, `api.js`, `dialog.js`
3. (NJ3) Convert `javaversion(callback)` to async function — `services/subprocess.js`
4. (NJ4) Convert `.then()` chains to `async/await` — 23 sites across 9 files
5. (NJ5) Replace `= null` initialisers with `= undefined` (or bare `let`) — 30+ sites
6. (NJ6) Convert `OptimizationRequest` empty class to factory function first; evaluate `Item`, `Stat`, `LruMap`
7. (NJ7) Investigate ESM migration for `subprocess.js` — profile Webpack/Electron renderer constraints

---

## Progress Tracking

**Overall Status:** Not Started — 0%

### Subtasks

| ID  | Description                                | Status      | Updated    | Notes                                           |
| --- | ------------------------------------------ | ----------- | ---------- | ----------------------------------------------- |
| 6.1 | (NJ1) Evaluate Vitest migration            | Not Started | 2026-05-31 | Multi-sprint; high risk with Electron+Webpack   |
| 6.2 | (NJ2) Replace manual Promise wrappers      | Not Started | 2026-05-31 | `files.js:16`, `api.js:14`, `dialog.js:144,165` |
| 6.3 | (NJ3) Convert javaversion to async         | Not Started | 2026-05-31 | `subprocess.js:23–42`                           |
| 6.4 | (NJ4) Convert .then() to async/await       | Not Started | 2026-05-31 | 23 sites; `multiOptimizerTab.js` has most       |
| 6.5 | (NJ5) Replace null initialisers            | Not Started | 2026-05-31 | 30+ sites; low risk; do in batches              |
| 6.6 | (NJ6) Convert classes to factory functions | Not Started | 2026-05-31 | Start with `OptimizationRequest` (empty body)   |
| 6.7 | (NJ7) Investigate ESM for subprocess.js    | Not Started | 2026-05-31 | Needs Webpack/Electron validation               |

---

## Progress Log

### 2026-05-31

- Initial audit completed against `nodejs-javascript-vitest.instructions.md`
- 7 finding categories identified (NJ1–NJ7) with exact source citations
- All findings documented as advisory; no source code changes made
- Citations recorded in `memory-bank/# Code Citations.md` § TASK006
- Summary tables recorded in `memory-bank/tasks/Task List and Fixes.md` § TASK006

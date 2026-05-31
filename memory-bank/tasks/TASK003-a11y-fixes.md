# TASK003 — Accessibility (WCAG 2.2 AA) Fixes

**Status:** In Progress  
**Added:** 2026-05-31  
**Updated:** 2026-05-31

## Original Request

Apply the WCAG 2.2 AA findings from the `a11y.instructions.md` audit to `app/app.html` and `app/css/style.css`. The audit was run on 2026-05-31 and produced 16 open items (5 CRITICAL, 9 IMPORTANT, 2 SUGGESTION). All findings are documented with fix code snippets in `memory-bank/tasks/Task List and Fixes.md`.

## Thought Process

The audit found no landmark structure (entire page is `<div>` soup) and no skip link — common issues in older Electron apps that predate accessibility-first web conventions. The most impactful fixes, in order of effort vs. benefit:

1. **CSS first** (K5-a, K5-b): Adding `:focus-visible` rules is zero-risk and fixes the most user-visible CRITICAL issue — keyboard users currently see no focus indicator on most interactive elements.
2. **Small HTML attributes** (A8, A6-a, A6-b, F1-a): Single-attribute additions (`role`, `aria-label`, `aria-live`) — very low risk, high AT benefit.
3. **Language selectors** (S8/K1-a): Converting 7 `<div onclick>` to `<a>` tags requires testing that the language-switch JS still works.
4. **External-link labels** (S8/K1-b): Converting 3 `<label onclick>` to `<a>` tags requires updating the tab-radio input system or reworking how those tabs are triggered.
5. **Landmark + skip link** (S4, K4): Wrapping `.tabset` in `<main>` and adding a skip link is structural but low-risk.
6. **Tables** (S6): Adding `<caption>` and `scope="col"` is additive-only.
7. **Heading hierarchy** (S3): Adding a visually hidden `<h1>` is additive-only.
8. **Modals** (K3): Converting overlays to native `<dialog>` requires testing modal JS (open/close, focus management).
9. **Stat icon alt text** (V2): Every stat row image needs a meaningful `alt`. Requires enumeration of all stat icon usages.
10. **Suggestions** (A1, V5): Low priority; the `@media prefers-reduced-motion` wrap is additive.

## Implementation Plan

- [ ] Fix K5-a: Remove `outline: none` from `.valuePadding input`, `.input-holder > input`, `.input-holder-percent > input`; add `a11y-ignore` comment
- [ ] Fix K5-b: Add `:focus-visible` rules for all major button selectors
- [ ] Fix A8: Add `role="status" aria-live="polite"` to `#fribbels-status`
- [ ] Fix A6-a: Add `aria-label="Toggle Hero Gear Matcher panel"` to `#heroMatcherToggle`
- [ ] Fix A6-b: Add `aria-label="Deselect row"` to `#fribbelsDeselectRow`
- [ ] Fix F1-a: Add `aria-label="Search for required artifact"` to `#fFilter-artifactSearch`
- [ ] Fix S8/K1-a: Convert 7 language-selector `<div onclick>` to `<a href>` tags
- [ ] Fix S8/K1-b: Replace 3 `<label onclick>` external-link tabs with `<a>` elements
- [ ] Fix S4: Add `<main id="main-content" tabindex="-1">` landmark wrapper around `.tabset`
- [ ] Fix K4: Add skip-to-main-content link as first focusable element in `<body>`
- [ ] Fix S6: Add `<caption>` and `scope="col"` to all four data tables
- [ ] Fix S3: Add visually-hidden `<h1>Fribbels Epic 7 Optimizer</h1>` + `.sr-only` CSS rule
- [ ] Fix K3: Convert `#presetRenameOverlay` and `#compareBuildOverlay` to native `<dialog>` elements
- [ ] Fix V2: Add descriptive `alt` text to all stat icon images
- [ ] Fix A1: Remove redundant `aria-label` from tab `<input type="radio">` elements (label already names them)
- [ ] Fix V5: Wrap `.darkSlider` transition in `@media (prefers-reduced-motion: no-preference)`

## Progress Tracking

**Overall Status:** Not Started — 0%

### Subtasks

| ID   | ID (Audit) | Description                                                  | Severity   | Status      | Updated    | Notes                                   |
| ---- | ---------- | ------------------------------------------------------------ | ---------- | ----------- | ---------- | --------------------------------------- |
| 3.1  | K5-a       | Remove `outline:none` on 3 input selectors; add comment      | CRITICAL   | Not Started | 2026-05-31 | `style.css` lines 2207, 2229, 2244      |
| 3.2  | K5-b       | Add `:focus-visible` ring to all major button selectors      | CRITICAL   | Not Started | 2026-05-31 | `style.css`                             |
| 3.3  | S8/K1-a    | Convert 7 language `<div onclick>` to `<a>` tags             | CRITICAL   | Not Started | 2026-05-31 | `app.html` lines 6662–6704              |
| 3.4  | S8/K1-b    | Replace 3 `<label onclick>` tab links with `<a>`             | CRITICAL   | Not Started | 2026-05-31 | `app.html` lines 154–214                |
| 3.5  | A8         | Add `role="status" aria-live="polite"` to `#fribbels-status` | CRITICAL   | Not Started | 2026-05-31 | `app.html` ~3398                        |
| 3.6  | S4         | Add `<main>` landmark wrapper around `.tabset`               | IMPORTANT  | Not Started | 2026-05-31 | `app.html`                              |
| 3.7  | K4         | Add skip-to-main link as first `<body>` child                | IMPORTANT  | Not Started | 2026-05-31 | `app.html` + `style.css`                |
| 3.8  | S6         | Add `<caption>` + `scope="col"` to 4 data tables             | IMPORTANT  | Not Started | 2026-05-31 | `app.html` lines 3332, 3346, 6714, 7010 |
| 3.9  | F1-a       | Add `aria-label` to `#fFilter-artifactSearch`                | IMPORTANT  | Not Started | 2026-05-31 | `app.html` ~3275                        |
| 3.10 | K3         | Convert 2 custom overlay modals to native `<dialog>`         | IMPORTANT  | Not Started | 2026-05-31 | `app.html` lines 2340, 2380             |
| 3.11 | A6-a       | Add `aria-label` to `#heroMatcherToggle`                     | IMPORTANT  | Not Started | 2026-05-31 | `app.html` ~5015                        |
| 3.12 | A6-b       | Add `aria-label` to `#fribbelsDeselectRow`                   | IMPORTANT  | Not Started | 2026-05-31 | `app.html` ~3387                        |
| 3.13 | S3         | Add visually-hidden `<h1>` + `.sr-only` CSS class            | IMPORTANT  | Not Started | 2026-05-31 | `app.html` + `style.css`                |
| 3.14 | V2         | Add descriptive `alt` text to all stat icon images           | IMPORTANT  | Not Started | 2026-05-31 | `app.html` ~350–580                     |
| 3.15 | A1         | Remove redundant `aria-label` from tab radio inputs          | SUGGESTION | Not Started | 2026-05-31 | `app.html` lines 92–203                 |
| 3.16 | V5         | Gate `.darkSlider` transition with `prefers-reduced-motion`  | SUGGESTION | Not Started | 2026-05-31 | `style.css` ~3304                       |

## Progress Log

### 2026-05-31

- Audit of `app/app.html` and `app/css/style.css` completed against `a11y.instructions.md`
- 5 CRITICAL, 9 IMPORTANT, 2 SUGGESTION findings documented in `Task List and Fixes.md`
- Fix code snippets written for all 16 items
- 4 items require manual verification (contrast, tabindex injection, focus return, video captions)
- Task created; no fixes applied yet

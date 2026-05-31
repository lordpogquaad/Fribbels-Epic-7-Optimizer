# Task List and Fixes — Fribbels Epic 7 Optimizer

**Audit date:** 2026-05-31
**Audited files:** `app/app.html`, `app/css/style.css`
**Audit type:** WCAG 2.2 AA Accessibility (a11y.instructions.md)
**Agent-Safety audit:** No AI agent frameworks present — agent-safety.instructions.md does not apply.
**Agent-Skills audit:** No `skills/**/SKILL.md` files present — agent-skills.instructions.md does not apply.
**AI Prompt Engineering audit:** No LLM/prompt code in application — ai-prompt-engineering-safety-best-practices.instructions.md does not apply to app code. 103 `.agent.md` chatmode files exist in `.github/chatmodes/` but are out of scope for this audit track.
**Caveman-mode audit:** caveman-mode.instructions.md is a Copilot response-style instruction — no application code changes required. Activating terse communication mode for this session.
**Containerization audit:** No Dockerfile, docker-compose, or any container config files present — containerization-docker-best-practices.instructions.md does not apply.
**Context Engineering audit:** `COPILOT.md` was missing — created at workspace root documenting architecture, module patterns, file relationships, and coding conventions. File paths and semantic naming are largely compliant. TypeScript type annotations N/A (project uses vanilla JS). Strategic comments partially present; no SUGGESTION-level tracking item added (paths and names are already descriptive).
**Copilot Thought Logging audit:** copilot-thought-logging.instructions.md is a Copilot process-tracking meta-instruction — creates a temporary `Copilot-Processing.md` for task tracking per-session. No application code changes required. `Copilot-Processing.md` must be deleted after each session and not committed to the repository.
**DevOps Core Principles audit:** devops-core-principles.instructions.md is a Copilot advisory meta-instruction covering CALMS framework and DORA metrics. No application code changes required — project is a solo open-source Electron desktop app with no CI/CD pipelines, infrastructure code, or team ops in scope.
**Exclude Prompt Data audit:** exclude-prompt-data.instructions.md is a Copilot output-quality meta-instruction — prohibits echoing prompt content, rationale, or meta-commentary into files being edited. Governs AI assistant behavior only; no application code changes required.
**Gilfoyle Code Review audit:** gilfoyle-code-review.instructions.md is a Copilot persona/style meta-instruction — instructs the AI to adopt a sardonic, technically condescending code-review voice. Changes AI communication style only; no application code changes required.
**GitHub Actions CI/CD audit:** github-actions-ci-cd-best-practices.instructions.md applies to `.github/workflows/*.yml,.github/workflows/*.yaml` — no such files exist in this project. Solo Electron desktop app with no CI/CD pipeline configured; instruction does not apply.
**Hooks audit:** hooks.instructions.md applies to `.github/hooks/**` and `hooks/**` — neither directory exists in this project. No Copilot/Claude Code hook scripts or configs present; instruction does not apply.
**HTML/CSS Style Color Guide audit:** html-css-style-color-guide.instructions.md applies to `**/*.html, **/*.css, **/*.js` — all three file types exist in the project. Dual light/dark theme palette (dark neutrals, near-white/near-black text, red accent reserved for active states) is broadly compliant with 60-30-10 rule. No critical color violations found; instruction serves as a reference for future CSS additions.
**Instructions file guidelines audit:** instructions.instructions.md applies to `**/*.instructions.md` — 41 matching files exist in `.github/instructions/`. 40/41 are compliant after fix; `memory-bank.instructions.md` was missing the required `description` frontmatter field (added). Three Java upgrade files use array-format `applyTo` (minor deviation, left as-is). Instruction is a meta-standard for future instruction file authoring; no application code changes required.
**Java 11→17 upgrade audit:** java-11-to-java-17-upgrade.instructions.md applies to `**` but describes upgrading a Java 11 project to Java 17 (Records, Sealed Classes, Pattern Matching, Text Blocks, etc.). This project targets Java 8 (`maven.compiler.source=1.8`) and code-review-generic.instructions.md explicitly requires maintaining Java 8 compatibility. Instruction does not apply; no changes required.

---

## 🔴 CRITICAL — Must fix before merge

| #   | ID      | Description                                                                                                                                                                              | File : Line                        | Status |
| --- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------ |
| 1   | K5-a    | `outline: none` on `.valuePadding input`, `.input-holder > input`, `.input-holder-percent > input` with no `:focus-visible` on the element itself                                        | `css/style.css` : 2207, 2229, 2244 | ✅ Done |
| 2   | S8/K1-a | Seven `<div class="switchText languageToggle" onclick="...">` language selectors — not keyboard-operable (no role, no tabindex, no keydown handler)                                      | `app/app.html` : 6662–6704         | ✅ Done |
| 3   | S8/K1-b | Three `<label onclick="electron.shell.openExternal(...)">` external-link tabs (`for="tab9"`, `for="tab11"`, `for="tab12"`) — labels are not interactive elements; no keyboard activation | `app/app.html` : 154–214           | ✅ Done |
| 4   | A8      | `<div id="fribbels-status">` dynamically updated with no `role="status"` or `aria-live` — changes not announced to screen readers                                                        | `app/app.html` : ~3398             | ✅ Done |
| 5   | K5-b    | No `:focus-visible` rule for `.optimizer-btn`, `.fribbels-action-btn`, `.gearPreviewButton`, `input[type="submit"]` — majority of buttons have no visible focus ring                     | `app/css/style.css`                | ✅ Done |

---

## 🟡 IMPORTANT — Fix in same sprint

| #   | ID   | Description                                                                                                                                        | File : Line                             | Status |
| --- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------ |
| 6   | S4   | No landmark elements (`<main>`, `<nav>`, `<header>`, `<footer>`) — entire page is `<div>` soup                                                     | `app/app.html`                          | ☐ Open |
| 7   | K4   | No skip-to-main-content link as first focusable element                                                                                            | `app/app.html`                          | ☐ Open |
| 8   | S6   | Four `<table>` elements missing `<caption>` and `scope="col"` on `<th>` headers; archetype table has empty `<th>` cells                            | `app/app.html` : 3332, 3346, 6714, 7010 | ☐ Open |
| 9   | F1-a | `<input id="fFilter-artifactSearch">` uses only `placeholder=` — no `<label>`, `aria-label`, or `aria-labelledby`                                  | `app/app.html` : ~3275                  | ☐ Open |
| 10  | K3   | `#presetRenameOverlay` and `#compareBuildOverlay` are custom modals — no focus trap, no `<dialog>`, no Escape handler, focus not returned on close | `app/app.html` : 2340, 2380             | ☐ Open |
| 11  | A6-a | `<button id="heroMatcherToggle">&#9660;</button>` — icon-only button, no `aria-label`                                                              | `app/app.html` : ~5015                  | ☐ Open |
| 12  | A6-b | `<button id="fribbelsDeselectRow">&#10005;</button>` — icon-only close button, no `aria-label`                                                     | `app/app.html` : ~3387                  | ☐ Open |
| 13  | S3   | No `<h1>` in document body; multiple `<h2>` headings in Settings tab with no parent heading, breaking the hierarchy                                | `app/app.html` : 6408, 6667, 6720       | ☐ Open |
| 14  | V2   | Stat icon images (`statatkdark.png`, etc.) have `alt=""` but are the sole identifier for each stat row — screen readers get no context             | `app/app.html` : ~350–580               | ☐ Open |

---

## 🟢 SUGGESTION — Plan for future iteration

| #   | ID  | Description                                                                                                                                                    | File : Line                 | Status |
| --- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------ |
| 15  | A1  | `<input type="radio" aria-label="Optimizer">` has redundant `aria-label` when `<label for="tab1">` already names it — `aria-label` overrides the visible label | `app/app.html` : 92–203     | ☐ Open |
| 16  | V5  | `.darkSlider` transition and other animations not gated behind `@media (prefers-reduced-motion: no-preference)`                                                | `app/css/style.css` : ~3304 | ☐ Open |

---

## TASK007 — Object Calisthenics Audit (Java Backend)

**Instruction:** `object-calisthenics.instructions.md`
**Audit date:** 2026-05-31
**Audited scope:** `backend/src/main/java/com/fribbels/` — domain entities, domain services, application handlers
**Exempt scope:** `request/*`, `response/*`, `HeroStats`, `BonusStats`, `AugmentedStats`, `BaseStats` (DTOs); `gpu/*`, `ocr/*` (infrastructure)
**Source code changes:** None — advisory tracking only

### Summary by Rule

| Rule | Description                  | Status   | Severity   | Primary Violation Files                                                                                                                                   |
| ---- | ---------------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1   | One level of indentation     | Advisory | SUGGESTION | `Sorter.java`, `OptimizationRequestHandler.java`, `Hero.java`                                                                                             |
| R2   | No else keyword              | Advisory | SUGGESTION | `StatCalculator.java`, `Hero.java`                                                                                                                        |
| R3   | Wrap primitives and strings  | Advisory | IMPORTANT  | `Hero.java` (50+ raw ints/floats), `StatCalculator.java` (20+ raw floats)                                                                                 |
| R4   | First-class collections      | Advisory | SUGGESTION | `Hero.java` (`builds`, `equipment`, `keepStats`, `modSlots`)                                                                                              |
| R5   | One dot per line             | Advisory | SUGGESTION | `Hero.java` (`skills.S1[0].rate`, etc.)                                                                                                                   |
| R6   | Don't abbreviate             | Advisory | IMPORTANT  | All domain classes — `atk/hp/def/cr/cd/eff/res/dac/spd/ehp/dmg/bs/cp/wss`                                                                                 |
| R7   | Keep entities small          | Advisory | IMPORTANT  | `StatCalculator.java` (~500 lines), `OptimizationRequestHandler.java` (~500 lines), `Sorter.java` (~200 lines), `Hero.java` (~200 lines), handler classes |
| R8   | ≤2 instance variables        | Advisory | IMPORTANT  | `StatCalculator` (20+ vars), `HeroesRequestHandler` (5 vars), `ItemsRequestHandler` (4 vars)                                                              |
| R9   | No getters/setters on domain | Advisory | SUGGESTION | `Hero.java` (Lombok @Getter @Setter with business logic), `Item.java`                                                                                     |

### High-Priority Advisory Items

| #    | Item                                                    | File                  | Effort | Notes                              |
| ---- | ------------------------------------------------------- | --------------------- | ------ | ---------------------------------- |
| OC-1 | Add `GLOSSARY.md` for all stat abbreviations (R6)       | new file              | S      | Highest immediate value; zero risk |
| OC-2 | Extract `sortHeroes()` cases to comparator methods (R7) | `Sorter.java`         | M      | Isolated; low risk                 |
| OC-3 | Introduce `StatContext` parameter object (R8)           | `StatCalculator.java` | M      | Prerequisite for R8/R7 refactors   |
| OC-4 | Split `StatCalculator` into focused collaborators (R7)  | `StatCalculator.java` | L      | Depends on OC-3                    |

---

## TASK005 — Localization (ko-kr)

**Instruction:** `localization.instructions.md`
**Execution date:** 2026-06-01
**Locale chosen:** `ko-kr` (Korean, South Korea) — autonomous selection; Epic Seven is a Korean-origin game; `data/locales/ko/` UI strings already present
**Source file:** `1. App/README.md` (428 lines)
**Output file:** `localization/ko-kr/1. App/README.md`

### Localization checklist

- [x] All prose translated to Korean
- [x] Code block (gear score formula, indented block) preserved verbatim in English
- [x] All external image URLs preserved (12 imgur links)
- [x] All external links preserved (GitHub, YouTube, Python, Npcap, Wireshark, Oracle, buy-me-a-coffee)
- [x] TOC anchor links updated to match Korean heading text (GitHub-compatible slugs)
- [x] Pre-existing TOC orphan (`Setup steps` / `설정 단계`) preserved as-is
- [x] Korean disclaimer appended at end of document
- [x] No frontmatter in source — N/A
- [x] Directory `localization/ko-kr/1. App/` auto-created by create_file tool

### Status

✅ **Complete** — no open items

## Requires Manual Verification

| #   | ID  | What to verify                                                                                | Location                             |
| --- | --- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| MV1 | V1  | Contrast ratio of `#E2E2E2` on `#212529` (dark mode) and tab label hover states ≥ 4.5:1       | `css/style.css`, `css/darktheme.css` |
| MV2 | K2  | No positive `tabindex` values injected by `htmlGenerator.js` or ag-Grid cell renderers        | `app/js/lib/htmlGenerator.js`        |
| MV3 | K7  | Focus returned to trigger button when `#presetRenameOverlay` and `#compareBuildOverlay` close | `app/js/lib/*.js`                    |
| MV4 | D3  | Any `<video>` rendered by ag-Grid rows includes a `<track kind="captions">`                   | Dynamic HTML                         |

---

## Fix Code Snippets

### Fix 1 & 5 — Focus ring (style.css)

```css
/* Add after existing :focus rules */
button:focus-visible,
input[type="submit"]:focus-visible,
select:focus-visible {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}

/* Document intentional suppression on wrapper inputs */
.valuePadding input,
.input-holder > input,
.input-holder-percent > input {
  outline: none; /* a11y-ignore: parent .focus-within provides ring */
}
```

### Fix 2 — Language selectors (app.html)

```html
<!-- Replace each <div class="switchText languageToggle" onclick="..."> with: -->
<a href="app.html?lng=en" class="switchText languageToggle">English</a>
<!-- repeat for zh, zh-TW, fr, ja, ko, ru -->
```

### Fix 3 — External-link labels (app.html)

```html
<!-- Replace <label for="tab11" class="tabLabelLink" onclick="electron.shell.openExternal(...)"> with: -->
<a
  href="#"
  class="tabLabelLink"
  data-t
  onclick="event.preventDefault(); electron.shell.openExternal('https://www.buymeacoffee.com/fribbels')"
  >Donate ⧉</a
>
```

### Fix 4 — Live region (app.html)

```html
<div
  id="fribbels-status"
  class="fribbels-status"
  role="status"
  aria-live="polite"
>
  Select a hero then click the Fribbels Library tab to load community builds.
</div>
```

### Fix 6 & 7 — Landmark + skip link (app.html)

```html
<!-- First child of <body>: -->
<a href="#main-content" class="skip-link">Skip to main content</a>
<!-- Wrap .tabset: -->
<main id="main-content" tabindex="-1">
  <div class="tabset">...</div>
</main>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: 8px 16px;
  background: #000;
  color: #fff;
  z-index: 9999;
}
.skip-link:focus {
  top: 0;
}
```

### Fix 8 — Table captions (app.html)

```html
<table class="fribbels-summary-table">
  <caption>
    Build stats summary
  </caption>
  <thead>
    <tr>
      <th scope="col">Stat</th>
      <th scope="col">Avg</th>
      <th scope="col">P50</th>
      <th scope="col">Min</th>
      <th scope="col">Max</th>
    </tr>
  </thead>
  ...
</table>
```

### Fix 9 — Artifact search label (app.html)

```html
<input
  type="text"
  id="fFilter-artifactSearch"
  placeholder="Search artifact..."
  class="fribbels-filter-artifact-search"
  aria-label="Search for required artifact"
/>
```

### Fix 10 — Native dialog modals (app.html)

```html
<dialog id="presetRenameDialog" aria-labelledby="presetRenameTitle">
  <h2 id="presetRenameTitle" class="preset-rename-title">Rename preset</h2>
  <input
    id="presetRenameInput"
    type="text"
    class="preset-rename-input"
    maxlength="30"
    aria-label="New preset name"
  />
  <div class="preset-rename-actions">
    <button id="presetRenameConfirm" class="optimizer-btn">OK</button>
    <button id="presetRenameCancel" class="optimizer-btn">Cancel</button>
  </div>
</dialog>
```

### Fix 11 & 12 — Icon button labels (app.html)

```html
<button
  id="heroMatcherToggle"
  class="gearPreviewButton heroMatcherToggle"
  aria-label="Toggle Hero Gear Matcher panel"
  data-t
>
  &#9660;
</button>

<button
  id="fribbelsDeselectRow"
  class="fribbels-action-btn fribbels-deselect-btn"
  aria-label="Deselect row"
>
  &#10005;
</button>
```

### Fix 13 — Document heading (app.html)

```html
<!-- After <body>, before .tabset: -->
<h1 class="sr-only">Fribbels Epic 7 Optimizer</h1>
```

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## TASK004 — Java 25 Readiness Advisories

**Audit date:** 2026-05-31
**Audit type:** Java 21→25 upgrade review (java-21-to-java-25-upgrade.instructions.md)
**Status:** 1 advisory (no action now), 1 pending action

### Java 17→21 and 11→17 audits

Both instruction files were reviewed. The backend is correctly compiled at Java 21 (`maven.compiler.release=21`). All Java 17 and 21 language features (Records, Sealed Classes, Virtual Threads, pattern matching switch, Sequenced Collections, etc.) are available but not required. The existing code uses classic Java style — no breaking changes and no mandatory rewrites.

### Advisory — aparapi JNI under Java 25 (JEP 472)

`aparapi-jni 1.4.3` uses JNI to bridge the Java optimizer to native OpenCL code. Under Java 25, JEP 472 (_Prepare to Restrict the Use of JNI_) will emit warnings for JNI calls unless `--enable-native-access=ALL-UNNAMED` is added to the JVM command line. **No action needed while on Java 21.** Track this before any Java 25 upgrade.

### Pending action — Runtime JVM args for JAR spawn (`main.dev.js`)

The `maven-surefire-plugin` in `pom.xml` passes `--add-opens` args for test-time reflection. However, when Electron's `main.dev.js` spawns the backend JAR via `child_process.spawn()`, those same flags are **not** forwarded. If any runtime reflection or module-access issues surface (e.g., Gson accessing private fields, aparapi introspecting OpenCL classes), add the following JVM args to the spawn call:

```javascript
// In app/main.dev.js, the spawn call that launches the backend JAR:
const javaArgs = [
  "--add-opens=java.base/java.lang=ALL-UNNAMED",
  "--add-opens=java.base/java.util=ALL-UNNAMED",
  "--add-opens=java.base/java.lang.reflect=ALL-UNNAMED",
  "-jar",
  backendJarPath,
];
const backendProcess = spawn("java", javaArgs);
```

| #   | Item                                          | Action required?                                                 | Priority |
| --- | --------------------------------------------- | ---------------------------------------------------------------- | -------- |
| 1   | aparapi JNI warnings under Java 25 (JEP 472)  | No — advisory for future Java 25 upgrade                         | Low      |
| 2   | Runtime `--add-opens` not passed to JAR spawn | Yes — add to `main.dev.js` spawn args if reflection errors occur | Medium   |

---

## TASK006 — Node.js/Vitest Instruction Audit

**Audit date:** 2026-05-31
**Audit type:** `nodejs-javascript-vitest.instructions.md` compliance review
**Status:** 7 advisory findings (NJ1–NJ7); no source code changes required now

### Migration Items

| ID  | Rule                 | Finding                                           | Files                         | Status |
| --- | -------------------- | ------------------------------------------------- | ----------------------------- | ------ |
| NJ1 | Vitest configuration | Jest 30 used; Vitest not configured               | `1. App/package.json:36`      | ☐ Open |
| NJ7 | ESM vs require()     | Mixed CJS/ESM; `require()` used in renderer layer | `services/subprocess.js:4–12` | ☐ Open |

### Pattern Items

| ID  | Rule                            | Finding                                                   | Files                                                                                      | Status |
| --- | ------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------ |
| NJ2 | Avoid manual Promise wrapping   | `new Promise()` wraps node callbacks instead of promisify | `files.js:16`, `services/api.js:14`, `ui/dialog.js:144,165`                                | ☐ Open |
| NJ3 | Async/await over callbacks      | `javaversion(callback)` uses callback pattern             | `services/subprocess.js:23`                                                                | ☐ Open |
| NJ4 | Async/await over .then() chains | 23 `.then()` call-sites across 9 files                    | `services/api.js:17`, `tabs/multiOptimizerTab.js:330,543,968`, `tabs/optimizerTab.js:3476` | ☐ Open |

### Preference Items

| ID  | Rule                           | Finding                                                      | Files                                                                                                         | Status |
| --- | ------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------ |
| NJ5 | `undefined` over `null`        | 30+ module-level `= null` initialisers                       | `data/scanner.js:4`, `grids/optimizerGrid.js:29,33,39`, `services/subprocess.js:18`                           | ☐ Open |
| NJ6 | Factory functions over classes | 4 `class` definitions; instruction prefers factory functions | `models/item.js:1`, `models/stat.js:1`, `models/optimizationRequest.js:1`, `filters/modificationFilter.js:11` | ☐ Open |

---

## TASK008 — Performance Optimization Audit

**Instruction:** `performance-optimization.instructions.md`
**Audit date:** 2026-05-31
**Audited scope:** `app/app.html`, `app/css/style.css`, `app/js/lib/services/subprocess.js`
**Framework:** None (vanilla HTML/CSS/JS Electron desktop app)
**Applicable rules:** L1–L2, L4, J1–J8, C1–C7, I1–I8, B1–B6
**Not applicable:** L3, L5, L6, L8, L10 (server/CDN), R1–R8 (React hydration), NX/NG/RX/VU (framework-specific)

### Summary

| Severity | Count | Rules | Status |
| --- | --- | --- | --- |
| **CRITICAL** | 3 | L2, I5, J3 | ☐ Open |
| **IMPORTANT** | 2 | C1, I1 | ☐ Open |
| **SUGGESTION** | 2 | C3, B2 | ✅ Acceptable (no action needed) |
| **PASS** | 6+ | J1, J2, J4, J6, I2, server rules | ✅ No violation |

---

### 🔴 CRITICAL — Must fix before release

| # | ID | Description | File : Line | Status |
| --- | --- | --- | --- | --- |
| P1 | L2 | 7 `<script src="node_modules/...">` in `<head>` without `defer` or `async` — parser blocks on each before page render: i18next×5, rangeslider-js, multiple-select | `app.html` : 13–18, 34 | ☐ Open |
| P2 | I5 | 8 `@font-face` blocks for Fira Sans Condensed all missing `font-display` property — causes FOUT and CLS during app startup | `css/style.css` : 14–75 | ☐ Open |
| P3 | J3 | `setInterval()` result never assigned — cannot be cleared; runs indefinitely at 100 ms for the lifetime of the subprocess | `js/lib/services/subprocess.js` : 110 | ☐ Open |

---

### 🟡 IMPORTANT — Fix in same sprint

| # | ID | Description | File : Line | Status |
| --- | --- | --- | --- | --- |
| P4 | C1 | `transition: width 0.15s ease` and `transition: left 0.25s ease` — layout-triggering properties force browser reflow on every animation frame | `css/style.css` : 2384, 2823–2824 | ☐ Open |
| P5 | I1 | Multiple `<img>` tags without `width` and `height` attributes — causes layout shifts when images load | `app.html` : 84, 249, 264, 270, 279+ | ☐ Open |

---

### Passed / Acceptable

| Rule | Verdict | Notes |
| --- | --- | --- |
| C3 | ✅ Acceptable | `will-change: width` on `.rangeslider__fill` is justified — slider elements animate constantly |
| B2 | ✅ Acceptable | `require()` is correct for Electron/Node.js runtime modules |
| J1 | ✅ Pass | No heavy computation in event handlers |
| J2 | ✅ Pass | No DOM reads in tight loops |
| J4 | ✅ Pass | Event listeners are Electron lifecycle-bound |
| J6 | ✅ Pass | No synchronous XHR; `fetch()` used throughout |
| I2 | ✅ Pass | No `loading="lazy"` on above-fold images |

---

### Fix Code Snippets

#### Fix P1 — Add `defer` to render-blocking scripts (`app.html`)

```html
<!-- Lines 13–18: add defer to each -->
<script defer src="node_modules/i18next/i18next.min.js"></script>
<script defer src="node_modules/i18next-browser-languagedetector/i18nextBrowserLanguageDetector.min.js"></script>
<script defer src="node_modules/i18next-localstorage-backend/i18nextLocalStorageBackend.min.js"></script>
<script defer src="node_modules/i18next-http-backend/i18nextHttpBackend.min.js"></script>
<script defer src="node_modules/i18next-chained-backend/i18nextChainedBackend.min.js"></script>
<script defer src="node_modules/rangeslider-js/dist/rangeslider-js.min.js"></script>
<!-- Line 34: -->
<script defer src="node_modules/multiple-select/dist/multiple-select.min.js"></script>
```

> ⚠️ **Verify:** Confirm `init.js` is also deferred or loaded after so initialization order is preserved.

#### Fix P2 — Add `font-display` to all `@font-face` blocks (`css/style.css`)

Add `font-display: swap;` to each of the 8 `@font-face` blocks at lines 14–75:

```css
@font-face {
    font-family: 'Fira Sans Condensed';
    font-style: normal;
    font-weight: 400;
    src: url(...) format('woff2');
    unicode-range: ...;
    font-display: swap;  /* ADD THIS LINE to all 8 blocks */
}
```

#### Fix P3 — Store and clear `setInterval` in `subprocess.js`

```javascript
// Line 110 — store interval reference
let healthCheckInterval = setInterval(() => {
    if (child) {
        try { child.stdout.write(''); } catch (e) {}
    }
}, 100);

// In child.on('close', ...) handler — add clearInterval:
child.on('close', (code) => {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    if (code === 0 || killed === true) { return; }
    Notifier.error(`${i18next.t('Java subprocess errors')}: ${errors}`);
    Dialog.htmlError(defaultJavaError);
});
```

#### Fix P4 — Replace layout-triggering transitions (`css/style.css`)

```css
/* Line 2384 */
.pwb-seg { transition: transform 0.15s ease; /* was: width */ }

/* Lines 2823–2824 */
.switch-label::after {
    -webkit-transition: transform 0.25s ease;  /* was: left */
    transition: transform 0.25s ease;
}
```

#### Fix P5 — Add dimensions to `<img>` tags (`app.html`)

```html
<!-- Line 84 -->
<img class="coffeeContainerImage" id="coffeeImage" src="./assets/coffee.png" alt="" width="64" height="64" />
<!-- Lines 249, 264, 270, 279 -->
<img src="./assets/blank.png" id="inputHeroImage" class="inputHeroImage" alt="" width="100" height="100" />
<img src="./assets/blank.png" id="inputArtifactImage" class="inputArtifactImage" alt="" width="100" height="100" />
```

---

## TASK009 — Playwright TypeScript E2E Testing Audit

**Instruction:** `playwright-typescript.instructions.md`
**Audit date:** 2026-05-31
**Audited scope:** `app/package.json`, `app/app.html`, `app/js/lib/`, `tests/` (absent)
**Framework:** Electron desktop app (no browser runtime); TestCafe v3.7.4 currently installed for E2E
**Applicable rules:** File Organization, Test Structure, Imports, Code Quality Standards, Assertion Best Practices
**Not applicable:** Browser-specific launch rules (Electron uses `_electron.launch()`, not Chromium/Firefox/WebKit projects)

### Summary

| Severity | Count | Rules | Status |
| --- | --- | --- | --- |
| **CRITICAL** | 3 | File Organization, Imports | ☐ Open |
| **IMPORTANT** | 2 | Framework Scope, Coverage | ☐ Open |
| **PASS / N/A** | 5 | Code Quality, Assertions, test.describe, test.step, toMatchAriaSnapshot | ✅ N/A (no test files exist to evaluate) |

---

### 🔴 CRITICAL — Must fix before release

| # | ID | Description | File : Line | Status |
| --- | --- | --- | --- | --- |
| PW1 | File Organization | No `tests/` directory at project root — instruction mandates `tests/<feature>.spec.ts` naming convention | Root of workspace | ☐ Open |
| PW2 | File Organization | No `playwright.config.ts` or `playwright.config.js` anywhere in the project — Playwright cannot run without a configuration file | Root / `app/` | ☐ Open |
| PW3 | Imports | `@playwright/test` not installed in any `package.json`; project uses TestCafe v3.7.4 for E2E and Jest v30.4.2 for unit tests; no `"test:e2e:playwright"` script exists | `app/package.json` | ☐ Open |

---

### 🟡 IMPORTANT — Fix in same sprint

| # | ID | Description | File : Line | Status |
| --- | --- | --- | --- | --- |
| PW4 | Framework Scope | Electron app requires `_electron.launch()` pattern in `playwright.config.ts`; a standard browser project config (`chromium`/`firefox`/`webkit`) will fail to launch the app | `app/package.json` (Electron detected via `"electron"` key) | ☐ Open |
| PW5 | Coverage | 8 feature tabs (Optimizer, Multi-Optimizer, Gear, Heroes, Enhancing, Importer, Settings, Archetypes) have zero Playwright E2E coverage; the referenced TestCafe test file `test/e2e/HomePage.e2e.ts` does not exist on disk either | `app/package.json` : 38 | ☐ Open |

---

### Passed / Acceptable

| Rule | Verdict | Notes |
| --- | --- | --- |
| Code Quality Standards | N/A | No test files exist to evaluate naming, locators, or assertion patterns |
| Assertion Best Practices | N/A | No assertions exist yet |
| `test.describe()` / `beforeEach` structure | N/A | No test files exist |
| `test.step()` usage | N/A | No test files exist |
| `toMatchAriaSnapshot` / `toMatchAriaSnapshot` | N/A | No test files exist |
| No hard-coded waits | N/A | No test files exist |

---

### Setup Prerequisites (Advisory)

The following must be completed before any Playwright tests can run.

#### Step 1 — Install `@playwright/test` (`app/package.json`)

```json
{
  "devDependencies": {
    "@playwright/test": "^1.44.0"
  },
  "scripts": {
    "test:e2e:playwright": "playwright test"
  }
}
```

Then run:

```bash
npx playwright install --with-deps
```

#### Step 2 — Create `playwright.config.ts` at project root (Electron-specific)

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  reporter: 'html',
});
```

> **Note:** Per Playwright docs, Electron tests use `_electron.launch()` inside each test/fixture rather than a browser `project` entry. The config above provides common defaults; Electron-specific launch options live in each spec's `beforeEach`.

#### Step 3 — Proposed `tests/` directory layout

Following the `<feature-or-page>.spec.ts` naming convention:

```
tests/
  optimizer.spec.ts     — Tab 1: hero select, Start / Filter buttons, results table
  gear.spec.ts          — Tab 3: gear table, filter dropdowns
  importer.spec.ts      — Tab 6: file-import flow (JSON drag/drop or file picker)
  settings.spec.ts      — Tab 7: language switcher, dark mode toggle
```

#### Step 4 — Sample spec using Electron + role-based locators

```typescript
// tests/optimizer.spec.ts
import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';

test.describe('Optimizer Tab', () => {
  let electronApp: Awaited<ReturnType<typeof electron.launch>>;
  let page: Awaited<ReturnType<typeof electronApp.firstWindow>>;

  test.beforeEach(async () => {
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../app/main.dev.js')],
    });
    page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    await electronApp.close();
  });

  test('Dark mode toggle activates dark theme', async () => {
    await test.step('Toggle dark mode on', async () => {
      const darkToggle = page.getByLabel('Dark mode');
      await darkToggle.check();
    });

    await test.step('Verify darkmode class applied to body', async () => {
      await expect(page.locator('body')).toHaveClass(/darkmode/);
    });
  });

  test('Hero selector is visible and operable', async () => {
    await test.step('Locate hero select element', async () => {
      const heroSelect = page.getByLabel('Select hero');
      await expect(heroSelect).toBeVisible();
    });
  });

  test('Optimizer tab layout matches expected structure', async () => {
    await expect(page.getByRole('main')).toMatchAriaSnapshot(`
      - main:
        - region "Optimizer"
    `);
  });
});
```

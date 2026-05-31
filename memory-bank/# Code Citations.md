# Code Citations

**Audit date:** 2026-05-31 | **Audited files:** `app/app.html`, `app/css/style.css`

---

## CSS — `app/css/style.css`

### Citation 1 — Outline suppression on inner inputs (K5-a — CRITICAL)

**Lines 2205–2210, 2227–2232, 2242–2247**

```css
/* Line 2205 */
.valuePadding input {
    outline: none;         /* ← suppresses focus ring with no :focus-visible companion */
    border: none;
    background: none;
    ...
}
/* Line 2227 */
.input-holder > input {
    outline: none;         /* ← same issue */
    ...
}
/* Line 2242 */
.input-holder-percent > input {
    outline: none;         /* ← same issue */
    ...
}
```

**Parent wrapper rings (present, but insufficient on their own):**

```css
.valuePadding:focus-within {
  outline: 2px solid #005fcc;
} /* line 2210 */
.input-holder:focus-within {
  outline: 2px solid #005fcc;
} /* line 2231 */
```

**Recommended addition:**

```css
.valuePadding input,
.input-holder > input,
.input-holder-percent > input {
  outline: none; /* a11y-ignore: parent uses :focus-within ring */
}
```

Add the `/* a11y-ignore */` comment and confirm `:focus-within` visual ring is visible in both light and dark themes.

---

### Citation 2 — Transitions without prefers-reduced-motion (V5 — SUGGESTION)

**Lines ~3300–3310 (darkSlider) and 3430–3434 (collapsible)**

```css
/* line ~3300 */
.darkSlider {
  transition: 0.4s; /* ← not gated behind prefers-reduced-motion */
}
/* line 3430 */
.collapsible {
  transition: max-height 0.2s ease-out; /* ← same */
  outline: none;
}
.collapsible:focus-visible {
  outline: 2px solid #005fcc;
} /* ✓ correct pattern */
```

**Recommended:**

```css
@media (prefers-reduced-motion: no-preference) {
  .darkSlider {
    transition: 0.4s;
  }
  .collapsible {
    transition: max-height 0.2s ease-out;
  }
}
```

---

### Citation 3 — Missing global button focus-visible (K5-b — CRITICAL)

No rule matching `button:focus-visible` or `input[type="submit"]:focus-visible` exists in `style.css`. Buttons throughout the app have no visible keyboard focus indicator beyond the browser default (which may be suppressed by existing resets).

**Add:**

```css
button:focus-visible,
input[type="submit"]:focus-visible,
select:focus-visible {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}
```

---

## HTML — `app/app.html`

### Citation 4 — Language selector divs with onclick (S8/K1-a — CRITICAL)

**Lines 6662–6704**

```html
<!-- Seven instances of this pattern: -->
<div
  class="switchText languageToggle"
  onclick="location.href = 'app.html?lng=en'"
>
  English
</div>
<div
  class="switchText languageToggle"
  onclick="location.href = 'app.html?lng=zh'"
>
  中文
</div>
<!-- ... (zh-TW, fr, ja, ko, ru) -->
```

**Fix — replace each with a semantic anchor:**

```html
<a href="app.html?lng=en" class="switchText languageToggle">English</a>
<a href="app.html?lng=zh" class="switchText languageToggle">中文</a>
```

---

### Citation 5 — Label onclick for external tabs (S8/K1-b — CRITICAL)

**Lines ~154–214** (for="tab9" Hero Library, for="tab11" Donate, for="tab12" Discord)

```html
<label
  for="tab9"
  class="tabLink"
  data-t
  onclick="electron.shell.openExternal('https://fribbels.github.io/e7/hero-library.html')"
>
  <div class="tabIcon tabIconLibrary"></div>
  <div class="tabText" data-i18n="hero_library">Hero Library</div>
</label>

<label
  for="tab11"
  class="tabLink"
  data-t
  onclick="electron.shell.openExternal('https://www.buymeacoffee.com/fribbels')"
>
  ...
</label>

<label
  for="tab12"
  class="tabLink"
  data-t
  onclick="electron.shell.openExternal('https://discord.com/...')"
>
  ...
</label>
```

**Fix — replace each with an `<a>` element:**

```html
<a
  href="#"
  class="tabLink"
  data-t
  onclick="event.preventDefault(); electron.shell.openExternal('https://fribbels.github.io/e7/hero-library.html')"
>
  <div class="tabIcon tabIconLibrary"></div>
  <div class="tabText" data-i18n="hero_library">Hero Library ⧉</div>
</a>
```

---

### Citation 6 — Dynamic status div without live region (A8 — CRITICAL)

**Line ~3398**

```html
<!-- Current: -->
<div id="fribbels-status" class="fribbels-status">
  Select a hero then click the Fribbels Library tab to load community builds.
</div>
```

**Fix:**

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

---

### Citation 7 — Tab radio inputs with redundant aria-label (A1 — SUGGESTION)

**Lines 92–203 (one per tab)**

```html
<!-- Current: -->
<input type="radio" name="tabset" id="tab1" aria-label="Optimizer" checked />
<label for="tab1" data-t>
  <div class="tabIcon tabIconOptimizer"></div>
  <div class="tabText" data-i18n="optimizer">Optimizer</div>
</label>
```

The `aria-label="Optimizer"` on the input overrides the associated `<label>` text. Remove the `aria-label` — the `<label for="tab1">` already provides the accessible name.

```html
<!-- Fix: -->
<input type="radio" name="tabset" id="tab1" checked />
```

---

### Citation 8 — Icon-only buttons without aria-label (A6 — IMPORTANT)

**`#heroMatcherToggle` (~line 5015):**

```html
<!-- Current: -->
<button
  id="heroMatcherToggle"
  class="gearPreviewButton heroMatcherToggle"
  data-t
>
  &#9660;
</button>
<!-- Fix: -->
<button
  id="heroMatcherToggle"
  class="gearPreviewButton heroMatcherToggle"
  aria-label="Toggle Hero Gear Matcher panel"
  data-t
>
  &#9660;
</button>
```

**`#fribbelsDeselectRow` (~line 3387):**

```html
<!-- Current: -->
<button
  id="fribbelsDeselectRow"
  class="fribbels-action-btn fribbels-deselect-btn"
>
  &#10005;
</button>
<!-- Fix: -->
<button
  id="fribbelsDeselectRow"
  class="fribbels-action-btn fribbels-deselect-btn"
  aria-label="Deselect row"
>
  &#10005;
</button>
```

---

### Citation 9 — Artifact search input without label (F1-a — IMPORTANT)

**Line ~3275**

```html
<!-- Current: -->
<input
  type="text"
  id="fFilter-artifactSearch"
  placeholder="Search artifact..."
  class="fribbels-filter-artifact-search"
/>
<!-- Fix: -->
<input
  type="text"
  id="fFilter-artifactSearch"
  placeholder="Search artifact..."
  class="fribbels-filter-artifact-search"
  aria-label="Search for required artifact"
/>
```

---

### Citation 10 — Data tables missing caption and scope (S6 — IMPORTANT)

**Lines 3332, 3346, 6714, 7010**

```html
<!-- Current (fribbels-summary-table, line 3332): -->
<table class="fribbels-summary-table">
  <thead>
    <tr>
      <th>Stat</th>
      <th>Avg</th>
      <th>P50</th>
      <th>Min</th>
      <th>Max</th>
    </tr>
  </thead>
</table>
```

```html
<!-- Fix: -->
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
</table>
```

Apply same pattern (`<caption>` + `scope="col"`) to the three remaining tables at lines 3346, 6714, and 7010.

---

### Citation 11 — Custom overlay modals (K3 — IMPORTANT)

**Lines 2340, 2380**

```html
<!-- Current: plain div overlay, no dialog, no focus trap -->
<div id="presetRenameOverlay" class="overlay">
  <div class="overlay-box">
    <input id="presetRenameInput" ... />
    <button id="presetRenameConfirm">OK</button>
    <button id="presetRenameCancel">Cancel</button>
  </div>
</div>
```

**Fix — convert to native `<dialog>`:**

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

**JS change:** replace `$('#presetRenameOverlay').show()` with `document.getElementById('presetRenameDialog').showModal()`.

---

### Citation 12 — Missing landmarks and skip link (S4, K4 — IMPORTANT)

No landmark elements in the document body. No skip link.

**Body structure fix:**

```html
<body>
  <!-- First focusable element: -->
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <!-- Optional visually-hidden h1: -->
  <h1 class="sr-only">Fribbels Epic 7 Optimizer</h1>

  <!-- Wrap existing .tabset: -->
  <main id="main-content" tabindex="-1">
    <div class="tabset">...</div>
  </main>
</body>
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

## Agent-Safety Audit (`agent-safety.instructions.md`)

**Result: NOT APPLICABLE**

This codebase is a game gear optimizer (Electron desktop app). It contains no AI agent frameworks, LLM tool-calling code, multi-agent orchestration, policy files, or governed tool registries. The agent-safety instruction set targets systems using PydanticAI, CrewAI, LangChain, OpenAI Agents SDK, or similar. No findings.

The only externally-triggered calls are:

- `electron.shell.openExternal(url)` — hardcoded URLs for Hero Library, Donate, Discord (cited in Citation 5 above as an accessibility finding, not an agent-safety finding)
- Java backend HTTP calls for optimizer data — server-local only

---

## Agent-Skills Audit (`agent-skills.instructions.md`)

**Result: NOT APPLICABLE**

The `agent-skills.instructions.md` instruction has `applyTo: '**/skills/**/SKILL.md'` and governs the creation and quality of Agent Skill packages for GitHub Copilot. No `skills/` directories and no `SKILL.md` files exist anywhere in this repository. The instruction does not apply.

If Agent Skills are added to this project in the future, the skill must meet these requirements:

- `SKILL.md` frontmatter: `name` (lowercase, ≤64 chars), `description` (10–1024 chars, includes WHAT + WHEN + keywords)
- Body: ≤500 lines; split detailed workflows (>5 steps) into `references/` subfolder
- Required section: `## Gotchas` whenever the skill touches external tools, APIs, or non-obvious behavior
- No hardcoded credentials; relative paths for all bundled resource references

---

## AI Prompt Engineering & Safety Audit (`ai-prompt-engineering-safety-best-practices.instructions.md`)

**Result: NOT APPLICABLE to application code**

The `ai-prompt-engineering-safety-best-practices.instructions.md` instruction (`applyTo: '**'`) covers prompt engineering best practices, AI safety frameworks, bias mitigation, prompt injection prevention, and responsible AI usage. It is a meta-level guide for how Copilot should behave, not an application code audit checklist.

No actionable findings in application code because:

- The Fribbels app contains no LLM calls, no prompt construction, and no AI/ML integration
- No dynamic prompt interpolation of user input exists anywhere in `app/js/`, `app/app.html`, or the Java backend
- No AI agent frameworks (LangChain, OpenAI SDK, PydanticAI, etc.) are present
- No content moderation, bias detection, or responsible-AI logging is needed for a local game optimizer

**Artifacts present but out of scope for this audit track:**

- 103 `.agent.md` Copilot chatmode files in `.github/chatmodes/` (e.g., `prompt-engineer.agent.md`, `prompt-builder.agent.md`) — these ARE prompt files and could be evaluated against the instruction's quality criteria (clarity, safety, bias), but auditing them is a separate task from the accessibility/security audit being tracked here
- Instruction template files in `.github/instructions/` — same category

**If LLM features are ever added to the optimizer**, key requirements from the instruction:

- Never interpolate user input directly into prompts — use parameterized/structured prompt construction
- Sanitize all user input before passing to any AI model
- Log AI interactions with anonymized IDs, not raw content
- Test prompts for bias and harmful outputs before shipping
- Separate system prompt from user content (system/user message roles)

---

## Caveman-Mode Audit — NOT APPLICABLE

**Instruction:** `caveman-mode.instructions.md`
**applyTo:** `**`
**Verdict:** NOT APPLICABLE to application code.

`caveman-mode.instructions.md` is a Copilot communication style directive — it modifies how the AI assistant responds (terse, low-token, minimal prose). It contains zero application code requirements and no file-level changes to make in the codebase.

**Effect:** From this session forward, agent responses use caveman-mode: short sentences, bullets, no filler.

---

## Containerization & Docker Audit — NOT APPLICABLE

**Instruction:** `containerization-docker-best-practices.instructions.md`
**applyTo:** `**/Dockerfile,**/Dockerfile.*,**/*.dockerfile,**/docker-compose*.yml,**/docker-compose*.yaml,**/compose*.yml,**/compose*.yaml`
**Verdict:** NOT APPLICABLE.

No Docker or container files exist in the project. The optimizer is an Electron desktop app distributed as a binary — no containerization infrastructure present.

**If Docker is ever added**, key requirements from the instruction:

- Use multi-stage builds (build stage vs runtime stage)
- Pin base image versions (never use `latest` in production)
- Run as non-root user
- Use `.dockerignore` to exclude dev artifacts
- Scan images for vulnerabilities before shipping

---

## Context Engineering Audit — APPLICABLE (1 action taken)

**Instruction:** `context-engineering.instructions.md`
**applyTo:** `**`
**Verdict:** APPLICABLE. One missing artifact found and created.

### Findings

| Item                                        | Status                                                                  |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| COPILOT.md missing from workspace root      | ✅ CREATED                                                              |
| File paths (e.g., pp/js/lib/forceFilter.js) | ✅ Compliant — descriptive paths throughout                             |
| Semantic variable/function names            | ✅ Largely compliant — key modules use clear names                      |
| Type annotations                            | N/A — project uses vanilla JS, not TypeScript                           |
| Strategic comments at module tops           | Partial — complex modules (e7Scorer.js, scanner.js) have block comments |

### Action: Created COPILOT.md

**File:** `COPILOT.md` (workspace root)

Content covers:

- Directory layout with annotated purpose for each key path
- Frontend + backend stack tables
- ESM/CJS module split pattern
- Global scope bridge (`inputHandler.js` → `global.Gears` etc.)
- Single source of truth for reforge constants
- Scoring engine layers (`archetypeScorer → e7Scorer → e7Constants/e7ArchetypeRules`)
- Java backend IPC pattern + JAR rebuild requirement
- Coding conventions (locale keys, no magic numbers, no Java 9+ APIs)
- File relationship table (what to update when X changes)
- What NOT to do (Electron security flags, Java version, locale strings)

---

## Copilot Thought Logging Audit — NOT APPLICABLE (meta-instruction only)

**Instruction:** `copilot-thought-logging.instructions.md`
**applyTo:** `**`
**Verdict:** NOT APPLICABLE to application code.

`copilot-thought-logging.instructions.md` is a Copilot process-tracking meta-instruction. It directs Copilot to create a temporary `Copilot-Processing.md` file in the workspace root during task execution to track phases (Initialization, Planning, Execution, Summary). It contains no application code requirements and makes no permanent changes to the codebase.

**Effect for this session:**

- `Copilot-Processing.md` was created at workspace root to track this task's execution
- The file must be **deleted after review** and must not be committed to the repository
- Future Copilot sessions should create and clean up this file per-task

**Key constraint from instruction:**

- Phases must be executed one at a time; no phase combining in a single response
- No verbose commentary between phases — work silently
- File is ephemeral: always remove when done

---

## DevOps Core Principles Audit — NOT APPLICABLE (advisory meta-instruction)

**Instruction:** `devops-core-principles.instructions.md`
**applyTo:** `*` (entire codebase)
**Verdict:** NOT APPLICABLE to application code.

`devops-core-principles.instructions.md` is a Copilot advisory guidance instruction. It teaches the AI to advocate for DevOps culture (CALMS framework) and DORA metrics when assisting developers. It contains no directives to modify application code — only guidance for how Copilot should frame advice in team/pipeline contexts.

### Why this does not apply to Fribbels Epic 7 Optimizer

| DevOps Area              | Instruction Scope                              | Project Reality                           |
| ------------------------ | ---------------------------------------------- | ----------------------------------------- |
| CI/CD Pipelines          | GitHub Actions, build/test/deploy automation   | No `.github/workflows/` directory present |
| Infrastructure as Code   | Terraform, Ansible, Pulumi                     | No infrastructure — Electron desktop app  |
| Configuration Management | Server/environment automation                  | Not applicable to a local desktop app     |
| Monitoring & Alerting    | Prometheus, Grafana, dashboards                | No server/ops infrastructure              |
| Team Culture (CALMS)     | Multi-person teams, standups, blameless retros | Solo open-source project                  |
| DORA Metrics             | Deployment frequency, lead time, CFR, MTTR     | Not tracked; no production service        |

### Summary

The project is a **solo open-source Electron desktop application** distributed as a binary release. There is no CI/CD infrastructure, no IaC, no server operations, and no multi-person team. All five CALMS pillars and all four DORA metrics are outside the current project scope.

**Application code verdict:** No changes to `app/`, `backend/`, `configs/`, or any source files.

---

## Exclude Prompt Data Audit — NOT APPLICABLE (output-quality meta-instruction)

**Instruction:** `exclude-prompt-data.instructions.md`
**applyTo:** `**` (all files)
**Verdict:** NOT APPLICABLE to application code.

`exclude-prompt-data.instructions.md` governs how GitHub Copilot writes content when responding to prompts. The core rule: never echo prompt instructions, rationale, or meta-commentary into the files being changed — only write the result. It defines what counts as prompt data (descriptions of the change, inline rationale, references to the prompt itself, narrating comments) and what belongs in the output (the feature or fix written as if it always belonged there).

### Why it does not apply

This instruction contains no directives to modify application source files. It is a behavioral constraint on the AI assistant, not a code quality rule for the project codebase. There is nothing to audit in `app/`, `backend/`, or `configs/` — the instruction only affects how Copilot produces its responses.

| Scope               | Instruction Scope                           | Project Reality                                       |
| ------------------- | ------------------------------------------- | ----------------------------------------------------- |
| Source file content | Copilot output behavior only                | No actionable findings in source files                |
| Comments in code    | Must describe behavior, not narrate changes | N/A — instruction governs AI, not existing comments   |
| Documentation files | Must contain results, not prompt framing    | N/A — existing docs are author-written, not AI output |

**Application code verdict:** No changes to `app/`, `backend/`, `configs/`, or any source files.

---

## Gilfoyle Code Review Audit — NOT APPLICABLE (persona/style meta-instruction)

**Instruction:** `gilfoyle-code-review.instructions.md`
**applyTo:** `**` (all files)
**Verdict:** NOT APPLICABLE to application code.

`gilfoyle-code-review.instructions.md` is a Copilot persona instruction. It directs the AI assistant to adopt the character of Bertram Gilfoyle from Silicon Valley — technically precise but sardonic and condescending — when performing code reviews. It defines communication style, opening phrases, comparative insults, a review structure template, and character constraints (no solutions provided, maintain superiority). It contains no code standards, security requirements, accessibility rules, or architectural directives applicable to this project's source files.

### Why it does not apply

This instruction is a behavioral overlay on the AI reviewer, not a technical standard for the codebase. Comparable in scope to `caveman-mode.instructions.md` (terse responses) — both change _how_ Copilot communicates, not _what_ the project code must do.

| Dimension               | Instruction Content                 | Project Impact                         |
| ----------------------- | ----------------------------------- | -------------------------------------- |
| Scope                   | AI persona and review voice         | No source files affected               |
| Technical rules         | None — style/tone only              | No findings in `app/` or `backend/`    |
| `applyTo: '**'` meaning | Persona active for all file reviews | Not a checklist of code defects to fix |

**Application code verdict:** No changes to `app/`, `backend/`, `configs/`, or any source files.

---

## GitHub Actions CI/CD Best Practices Audit — NOT APPLICABLE (no workflows exist)

**Instruction:** `github-actions-ci-cd-best-practices.instructions.md`
**applyTo:** `.github/workflows/*.yml, .github/workflows/*.yaml`
**Verdict:** NOT APPLICABLE — scope pattern matches zero files.

This instruction is a comprehensive guide for designing GitHub Actions CI/CD pipelines: workflow structure, job design, secret management, OIDC authentication, `GITHUB_TOKEN` least privilege, dependency scanning, SAST, caching, matrix strategies, deployment patterns (rolling, blue/green, canary), and rollback strategies.

### Why it does not apply

The project has no `.github/workflows/` directory. The only workflow file found in the repository tree is:

```
1. App/1. Master/2. Data/py/.github/workflows/unittests.yml
```

This belongs to the vendored **scapy** Python library included in `data/py/` — it is not owned by or part of the Fribbels Epic 7 Optimizer project. The optimizer itself is distributed as a packaged Electron desktop application with no server-side deployment, no containerization, and no automated CI/CD pipeline.

| Dimension                 | Detail                                    |
| ------------------------- | ----------------------------------------- |
| `applyTo` scope           | `.github/workflows/*.yml` / `.yaml`       |
| Matching files in project | **0** — no `.github/workflows/` directory |
| Project type              | Solo open-source Electron desktop app     |
| Distribution model        | GitHub Releases (packaged installer)      |
| Build automation          | Manual (no pipeline)                      |

**Application code verdict:** No changes to `app/`, `backend/`, `configs/`, or any source files.

---

## Hooks Authoring Guidelines Audit — NOT APPLICABLE (no hook directories exist)

**Instruction:** `hooks.instructions.md`
**applyTo:** `.github/hooks/**, hooks/**`
**Verdict:** NOT APPLICABLE — scope pattern matches zero files.

This instruction covers authoring lifecycle-event hooks for GitHub Copilot agents: `.github/hooks/*.json` config structure, Bash/PowerShell script contracts, stdin/stdout payload schemas (`preToolUse`, `postToolUse`, `sessionStart`, `sessionEnd`, `userPromptSubmitted`, `agentStop`, `errorOccurred`), deny/allow patterns, the `env` static-config field, `matcher` filtering, cross-platform script strategies, packaging a reusable hook, and a full anti-pattern catalogue.

### Why it does not apply

Neither `.github/hooks/` nor a top-level `hooks/` directory exists in the repository. The project has no Copilot hook config files (`.json`) and no hook scripts (`.sh` / `.ps1`). The Fribbels Epic 7 Optimizer is a standalone Electron desktop app — it has no agent orchestration layer, no AI tool-call pipeline, and therefore no hook lifecycle events to intercept.

| Dimension                 | Detail                                |
| ------------------------- | ------------------------------------- |
| `applyTo` scope           | `.github/hooks/**`, `hooks/**`        |
| Matching files in project | **0** — no hook directories or files  |
| Project type              | Solo open-source Electron desktop app |
| AI agent layer            | None                                  |
| Hook scripts present      | None                                  |

**Application code verdict:** No changes to `app/`, `backend/`, `configs/`, or any source files.

---

## HTML/CSS Style Color Guide Audit — APPLICABLE (all three file types present)

**Instruction:** `html-css-style-color-guide.instructions.md`
**applyTo:** `**/*.html, **/*.css, **/*.js`
**Verdict:** APPLICABLE — `.html`, `.css`, and `.js` files all exist; existing color scheme is broadly compliant.

This instruction defines color usage rules for web-rendered HTML/CSS: the 60-30-10 rule (60% primary cool/light, 30% secondary cool/light, 10% hot accent), background color restrictions (no purple/magenta/red/orange/yellow/pink), text color guidelines (near-black on light, near-white on dark), gradient best practices, and a catalogue of colors to avoid or use only sparingly.

### Project files in scope

| File                                               | Notes                          |
| -------------------------------------------------- | ------------------------------ |
| `1. App/2. Frontend/1. Source/app.html`            | Main application HTML          |
| `1. App/2. Frontend/1. Source/css/style.css`       | Light theme stylesheet         |
| `1. App/2. Frontend/1. Source/css/darktheme.css`   | Dark theme override stylesheet |
| `1. App/2. Frontend/1. Source/css/chosen.css`      | Dropdown library CSS           |
| `1. App/2. Frontend/1. Source/css/awn.css`         | Notification library CSS       |
| `1. App/2. Frontend/1. Source/css/rangeslider.css` | Range slider library CSS       |
| `1. App/2. Frontend/1. Source/app.global.css`      | Global app stylesheet          |
| `1. App/2. Frontend/1. Source/js/lib/*.js`         | ~30 JS modules                 |

### Color scheme analysis

The project ships a **dual-theme** design: light mode via `style.css`, dark mode via `darktheme.css` (loaded at runtime when the user toggles dark mode).

**Dark theme CSS variables (`darktheme.css`):**

| Variable           | Value     | Instruction compliance                                             |
| ------------------ | --------- | ------------------------------------------------------------------ |
| `--bg-color`       | `#1a1a1a` | ✅ Dark neutral background                                         |
| `--font-color`     | `#e2e2e2` | ✅ Near-white text on dark background                              |
| `--accent-red`     | `#f84c48` | ✅ Hot color reserved for active-tab indicator (small accent area) |
| `--accent-green`   | `#00be9b` | ✅ Cool/teal accent for success states                             |
| `--link-blue`      | `#1e90ff` | ✅ Cool blue for links                                             |
| `--inactive-color` | `#5d646d` | ✅ Dark gray for inactive/disabled elements                        |
| `--btn-color`      | `#2a2a2a` | ✅ Dark neutral for button backgrounds                             |

**Light theme observations (`style.css`):**

| Element                    | Color             | Instruction compliance      |
| -------------------------- | ----------------- | --------------------------- |
| Panel/dropdown backgrounds | `#fff`, `#f0f0f0` | ✅ White/off-white neutrals |
| Table header backgrounds   | `#e8e8e8`         | ✅ Light neutral            |
| Borders                    | `#ccc`            | ✅ Neutral gray             |
| Hint/secondary text        | `#888`            | ✅ Mid-tone gray            |

### Compliance summary

The color scheme is **broadly compliant** with all instruction guidelines:

- **60-30-10 rule**: Dark neutrals/light neutrals dominate both themes; hot red appears only on the active-tab underline and error/warning accents — consistent with the "10% accent" role and the "Reserve for critical alerts" restriction.
- **Background colors**: No purple, magenta, red, orange, yellow, or pink backgrounds detected in either theme.
- **Text colors**: Near-white (`#e2e2e2`) on dark backgrounds; dark gray/neutral tones on light backgrounds.
- **Hot colors (red)**: `#f84c48` / `--accent-red` is confined to the active-tab underline indicator and warning states — appropriate per guideline (small accent area, conveys importance).
- **Gradients**: Not heavily used; no hot+cool gradient combinations found.

No code changes are required. The instruction functions as a living reference for future CSS additions.

| Dimension           | Detail                                                                                |
| ------------------- | ------------------------------------------------------------------------------------- |
| `applyTo` scope     | `**/*.html, **/*.css, **/*.js`                                                        |
| Matching file types | `.html` (1), `.css` (6), `.js` (30+)                                                  |
| Compliance level    | Broadly compliant — no critical violations                                            |
| Notable patterns    | Dual light/dark theme with CSS variables; hot colors reserved for accent/error states |
| Action needed       | None — existing palette aligns with guidelines                                        |

**Application code verdict:** No changes required — existing color scheme is broadly compliant. Instruction serves as a reference for future CSS/HTML additions.

---

## 15. `instructions.instructions.md` — Custom Instructions File Guidelines

**Instruction scope:** `applyTo: '**/*.instructions.md'`

**Purpose:** Guidelines for creating high-quality GitHub Copilot instruction files — required YAML frontmatter fields, file structure, naming conventions, content writing style, patterns to follow and avoid, testing, and maintenance.

### Does this instruction apply?

**YES** — 41 `*.instructions.md` files exist in `.github/instructions/`.

### Compliance Assessment

All 41 files were checked for the two required frontmatter fields (`description` and `applyTo`):

| File                                         | `description` | `applyTo`        | Compliant |
| -------------------------------------------- | ------------- | ---------------- | --------- |
| `memory-bank.instructions.md`                | ❌ missing    | ✅ `"**"`        | ❌        |
| `java-11-to-java-17-upgrade.instructions.md` | ✅            | ⚠️ array `["*"]` | ~✅       |
| `java-17-to-java-21-upgrade.instructions.md` | ✅            | ⚠️ array `['*']` | ~✅       |
| `java-21-to-java-25-upgrade.instructions.md` | ✅            | ⚠️ array `['*']` | ~✅       |
| All other 37 files                           | ✅            | ✅               | ✅        |

**Finding 1 — `memory-bank.instructions.md`** (IMPORTANT): Missing required `description` YAML frontmatter field. All other 40 files have it. Fixed by adding the field.

**Finding 2 — Java upgrade files** (minor): `applyTo` uses array notation (`["*"]`) instead of string notation (`"*"`). Functionally equivalent in YAML and accepted by VS Code. Left as-is.

**Other compliance notes:**

- All 41 files use kebab-case naming (`word-word.instructions.md`) — compliant.
- All files are located in `.github/instructions/` — compliant.
- All files have a level-1 or level-2 heading title — compliant.
- `object-calisthenics.instructions.md` has an unquoted `description` value — valid YAML, minor deviation only.
- `devops-core-principles.instructions.md` uses `applyTo: "*"` (single star) vs conventional `"**"` — minor deviation, left as-is.

### Changes made

- **`.github/instructions/memory-bank.instructions.md`**: Added `description: "Memory bank system for GitHub Copilot — persistent documentation for AI memory continuity across sessions, covering projectbrief, productContext, activeContext, systemPatterns, techContext, progress, and tasks."` to YAML frontmatter.

| Dimension        | Detail                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `applyTo` scope  | `**/*.instructions.md`                                                                   |
| Matching files   | 41 files in `.github/instructions/`                                                      |
| Compliance level | 40/41 fully compliant after fix                                                          |
| Notable issue    | `memory-bank.instructions.md` missing `description` (fixed)                              |
| Minor deviations | 3 Java upgrade files use array `applyTo`; 1 uses unquoted description; 1 uses single `*` |
| Action needed    | `description` field added to `memory-bank.instructions.md`                               |

**Application code verdict:** No changes to `app/`, `backend/`, `configs/`, or any source files. Single frontmatter fix applied to `.github/instructions/memory-bank.instructions.md`.

---

## 16. `java-11-to-java-17-upgrade.instructions.md` — Java 11 to Java 17 Upgrade Guide

**Instruction scope:** `applyTo: "**"`

**Purpose:** Guidance for upgrading Java projects from JDK 11 to JDK 17, covering Records (JEP 395), Sealed Classes (JEP 409), Pattern Matching for instanceof (JEP 394), Switch Expressions (JEP 361), Text Blocks (JEP 378), enhanced random generators (JEP 356), Unix-domain sockets (JEP 380), deserialization filters (JEP 415), and associated removals (Nashorn, Applet API, Security Manager).

### Does this instruction apply?

**NO** — This project's Java backend targets Java 8.

Evidence from `1. App/3. Backend/1. Source/pom.xml`:

```xml
<properties>
    <maven.compiler.source>1.8</maven.compiler.source>
    <maven.compiler.target>1.8</maven.compiler.target>
</properties>
```

`code-review-generic.instructions.md` also explicitly states: _"Java 8 compatibility must be maintained (no Java 9+ APIs like `List.of()`, `Map.copyOf()`, `var` keyword)"_. The project must stay on Java 8, making the Java 11→17 upgrade path entirely inapplicable.

### Assessment

| Dimension                | Detail                                                  |
| ------------------------ | ------------------------------------------------------- |
| `applyTo` scope          | `**`                                                    |
| Project Java version     | Java 8 (`maven.compiler.source=1.8`)                    |
| Instruction targets      | Java 11 → Java 17 migration                             |
| Version gap              | 3 major versions below the instruction's starting point |
| Compatibility constraint | `code-review-generic` requires Java 8 compatibility     |
| Action needed            | None — instruction does not apply                       |

**Application code verdict:** No changes to `app/`, `backend/`, `configs/`, or any source files. Instruction not applicable — project targets Java 8, not Java 11.

---

## Java Backend — `backend/pom.xml` (TASK004 — Java 21→25 Readiness Audit)

**Audit date:** 2026-05-31
**Instruction:** `java-21-to-java-25-upgrade.instructions.md` / `code-review-generic.instructions.md`
**Verdict:** Backend upgraded to Java 21; two advisories recorded for future Java 25 readiness.

### Citation 1 — `maven.compiler.release` property (`pom.xml`)

```xml
<properties>
    <maven.compiler.release>21</maven.compiler.release>
</properties>
```

The project now targets Java 21 LTS. The old `source=1.8` / `target=1.8` properties have been replaced with the single `release` flag, which enforces both source and target at the same version and prevents use of internal APIs from later JDKs.

### Citation 2 — `aparapi-jni` JNI bridge dependency

```xml
<dependency>
    <groupId>com.aparapi</groupId>
    <artifactId>aparapi-jni</artifactId>
    <version>1.4.3</version>
</dependency>
```

`aparapi-jni` uses JNI to invoke native OpenCL code for GPU-accelerated gear optimization. Under Java 25, **JEP 472** (_Prepare to Restrict the Use of JNI_) will issue warnings for every JNI call unless `--enable-native-access=ALL-UNNAMED` is explicitly granted. **No action required on Java 21** — the flag is informational-only in JEP 472's warning phase.

### Citation 3 — JAR spawn in `main.dev.js` (no `--add-opens` forwarded)

```javascript
// app/main.dev.js — backend JAR is spawned via child_process
const javaProcess = spawn("java", ["-jar", backendJarPath]);
```

The `maven-surefire-plugin` in `pom.xml` passes `--add-opens` JVM args for test-time reflection. These flags are **not forwarded** when Electron spawns the JAR at runtime. If runtime reflection errors surface (e.g., Gson accessing private fields across module boundaries, aparapi introspecting OpenCL classes), add the following to the spawn args:

```javascript
const javaArgs = [
  "--add-opens=java.base/java.lang=ALL-UNNAMED",
  "--add-opens=java.base/java.util=ALL-UNNAMED",
  "--add-opens=java.base/java.lang.reflect=ALL-UNNAMED",
  "-jar",
  backendJarPath,
];
const javaProcess = spawn("java", javaArgs);
```

**Status:** No reflection errors currently observed. Advisory only — act if errors appear.

---

## Localization Audit (`localization.instructions.md`)

**Audit date:** 2026-06-01
**Instruction:** `localization.instructions.md`
**applyTo:** `**/*.md`
**Verdict:** APPLICABLE — `1. App/README.md` localized to `ko-kr`.

### Locale Selection Rationale

No locale was specified by the user; autonomous selection applied. Korean (`ko-kr`) was chosen because:

- Epic Seven is a Korean-developed mobile game; Korean-speaking players form the largest non-English user base
- The project already ships Korean UI strings in `data/locales/ko/` — documentation parity is the natural next step
- `fr`, `ja`, `ru`, `zh`, `zh-TW` UI locales are already present; Korean was the highest-value documentation gap

### Output File

| Property   | Value                                 |
| ---------- | ------------------------------------- |
| Source     | `1. App/README.md` (428 lines)        |
| Output     | `localization/ko-kr/1. App/README.md` |
| Locale     | `ko-kr` (Korean, South Korea)         |
| Translator | GitHub Copilot (Claude Sonnet 4.6)    |

### Structure Verification

| Element                                                   | Source                        | Localized                  | Match |
| --------------------------------------------------------- | ----------------------------- | -------------------------- | ----- |
| `#` headings                                              | 1                             | 1                          | ✅    |
| `##` headings                                             | 8                             | 8                          | ✅    |
| `###` headings                                            | 18                            | 18                         | ✅    |
| `####` headings                                           | 2                             | 2                          | ✅    |
| `#####` headings                                          | 4                             | 4                          | ✅    |
| Indented code block (Score formula)                       | 1                             | 1 ✅ not translated        | ✅    |
| External image links (`imgur`)                            | 12                            | 12 preserved               | ✅    |
| External URLs (GitHub, YouTube, Python, Npcap, Wireshark) | All                           | All preserved              | ✅    |
| TOC anchor links                                          | Updated to Korean heading IDs | ✅                         |
| Disclaimer appended                                       | —                             | ✅ Korean disclaimer added |

### Decisions

- **Code block preserved as-is:** The gear score formula (`Score = Attack % + Defense % …`) is a mathematical specification, not prose — kept in English per the instruction rule "code blocks are not translated."
- **External section-reference links preserved:** Links pointing to `https://github.com/fribbels/Fribbels-Epic-7-Optimizer#optimizer-tab` etc. route to the original English GitHub page; noted in disclaimer.
- **`### Setup steps` TOC entry:** The source TOC references `[Setup steps](#setup-steps)` but the heading does not exist in the document body. The Korean TOC entry `[설정 단계](#설정-단계)` preserves this pre-existing source inconsistency.
- **Formatting artifact `\*\*` preserved:** The source document ends the substat modification tips block with a bare `\*\*` — preserved verbatim in the Korean version.
- **Disclaimer language:** Written in Korean to match the localized document audience.

---

## TASK006 — Node.js/Vitest Instruction Audit

**Audit date:** 2026-05-31
**Instruction file:** `nodejs-javascript-vitest.instructions.md`

---

### NJ1 — Vitest not configured

**File:** `1. App/package.json:36`

```json
"test": "cross-env BABEL_DISABLE_CACHE=1 jest",
```

`package.json` declares Jest 30 as the test runner (line 234: `"jest": "^30.4.2"`). The instruction mandates Vitest. No `vitest.config.*` exists. Migrating is a multi-sprint effort given the Electron + Webpack build context — track as a deferred sprint item.

---

### NJ2 — Manual Promise wrapping

**Files:** `services/api.js:14`, `files.js:16`, `ui/dialog.js:144,165`

```javascript
// services/api.js:14
function post(api, request) {
    return new Promise((resolve, reject) => {   // ← manual wrap
        axios.post(getEndpoint() + api, request)
            .then((response) => { resolve(response.data); })
```

```javascript
// files.js:16
return new Promise((resolve, reject) => {       // ← wraps fs.readFile callback
    fs.readFile(filePath, 'utf8', (err, data) => {
```

**Preferred pattern:**

```javascript
import { promisify } from "node:util";
const readFileAsync = promisify(fs.readFile);
const data = await readFileAsync(filePath, "utf8");
```

---

### NJ3 — Callback-style function

**File:** `services/subprocess.js:23–42`

```javascript
function javaversion(callback) {
  // ← callback pattern
  const javaSpawn = spawn("java", ["-version"]);
  javaSpawn.on("error", (err) => {
    return callback(err, null); // ← null sentinel + callback
  });
  javaSpawn.stderr.on("data", (data) => {
    callback(null, false, false, true);
  });
}
```

**Preferred pattern:**

```javascript
async function javaversion() {
  return new Promise((resolve, reject) => {
    const javaSpawn = spawn("java", ["-version"]);
    javaSpawn.on("error", reject);
    javaSpawn.stderr.on("data", (data) => {
      const str = data.toString();
      resolve({
        notRecognized: str.includes("not recognized"),
        not64Bit: !str.includes("64-Bit"),
      });
    });
  });
}
```

---

### NJ4 — .then() chains

**Key locations** (23 total across 9 files):

```javascript
// services/api.js:17
axios.post(getEndpoint() + api, request)
    .then((response) => { resolve(response.data); })   // ← .then chain

// tabs/multiOptimizerTab.js:330
optimizerTab.optimizeCallback()
    .then(() => { ... })                               // ← .then chain

// tabs/optimizerTab.js:3476
api.post('/savegear', payload)
    .then((response) => { ... })                       // ← .then chain
```

All 23 sites: `grids/heroesGrid.js:743`, `grids/optimizerGrid.js:292`, `services/api.js:17`, `tabs/enhancingTab.js:286`, `tabs/heroesTab.js:323,545`, `tabs/itemsTab.js:180`, `tabs/multiOptimizerTab.js:330,543,968,1070,1398,1424`, `tabs/optimizerTab.js:658,3476,3579`, `ui/dialog.js:153,174`.

**Preferred pattern:** Replace `.then(() => ...)` with `async/await`.

---

### NJ5 — null instead of undefined

**Representative locations** (30+ total):

```javascript
// services/subprocess.js:18
let child = null; // ← undefined preferred

// data/scanner.js:4
let scannerChild = null; // ← undefined preferred

// grids/optimizerGrid.js:29
let selectedRow = null; // ← undefined preferred

// grids/optimizerGrid.js:33
let selectedRowNode = null; // ← undefined preferred

// grids/optimizerGrid.js:39
let lastSelectedHeroName = null; // ← undefined preferred
```

**Preferred pattern:** `let child;` or `let child = undefined;` for "not yet initialised" state; reserve `null` for intentional absence of a value.

---

### NJ6 — class keyword

**Files:** `models/item.js:1`, `models/stat.js:1`, `models/optimizationRequest.js:1`, `filters/modificationFilter.js:11`

```javascript
// models/item.js:1
class Item {                        // ← instruction prefers factory function

// models/stat.js:1
class Stat {                        // ← instruction prefers factory function

// models/optimizationRequest.js:1
class OptimizationRequest {}        // ← empty class; strongest candidate for conversion

// filters/modificationFilter.js:11
class LruMap {                      // ← defensible: encapsulates LRU cache with private Map state
```

**Note:** `LruMap` manages a non-trivial data structure with private `Map` state — the `class` form is a reasonable trade-off. `OptimizationRequest` (empty body) is the highest-priority candidate for factory-function conversion.

---

### NJ7 — Mixed require()/import

**File:** `services/subprocess.js:4–12`

```javascript
const fs = require("fs"); // ← CJS require
const { spawn } = require("child_process");
const treekill = require("tree-kill");
const electron = require("electron");
const { killPortProcess } = require("kill-port-process");
```

The rest of the renderer codebase uses ESM `import` (e.g., `services/api.js:7` uses `import axios from 'axios'`). `subprocess.js` is likely excluded from the Webpack ESM transform because it calls Electron's `ipcRenderer` through `require('electron')`, which has specific module-resolution requirements in the renderer context. ESM migration for this file requires validation against both dev and production Webpack/Electron configurations.

---

## TASK007 — Object Calisthenics Audit (Java Backend)

**Audit date:** 2026-07-XX
**Instruction file:** `object-calisthenics.instructions.md`
**applyTo:** `**/*.{cs,ts,java}`
**Verdict:** APPLICABLE — Java backend files match glob. Advisory findings only; no source code changes made.

### Scope

| Included                                                    | Excluded (exempt DTOs/infrastructure)                    |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| `Hero.java`, `Item.java` (domain entities)                  | `request/*`, `response/*` (data bags)                    |
| `StatCalculator.java`, `Sorter.java` (domain services)      | `HeroStats`, `BonusStats`, `AugmentedStats`, `BaseStats` |
| `*RequestHandler.java`, `*Service.java` (application layer) | `gpu/*`, `ocr/*` (infrastructure)                        |

---

### OC-R1 — One level of indentation per method (SUGGESTION)

**Files:** `Sorter.java`, `OptimizationRequestHandler.java`, `Hero.java`

Representative violation — `Sorter.java` comparator switch:

```java
// Current: 3 levels of nesting inside case branch
switch (sortType) {
    case "score":
        heroes.sort((a, b) -> {
            if (a.score > b.score) return -1;   // 3rd level
            return 1;
        });
}
```

**Preferred pattern:** Extract each `case` body to a named comparator method.

```java
private static Comparator<Hero> byScore() {
    return (a, b) -> Double.compare(b.score, a.score);
}
```

---

### OC-R2 — No else keyword (SUGGESTION)

**Files:** `StatCalculator.java`, `Hero.java`

Representative violation — `StatCalculator.java` damage-branch logic:

```java
if (skill.isSingleTarget()) {
    damage = computeSingleTarget(hero, skill);
} else {
    damage = computeAoe(hero, skill);
}
```

**Preferred pattern:** Guard clause or early return.

```java
if (skill.isSingleTarget()) return computeSingleTarget(hero, skill);
return computeAoe(hero, skill);
```

---

### OC-R3 — Wrap all primitives and strings (IMPORTANT)

**Files:** `Hero.java` (~50+ raw `int`/`float` stat fields), `StatCalculator.java` (~20+ raw `float` calculation variables)

Representative violations — `Hero.java` public fields:

```java
public int atk;
public int hp;
public int def;
public int spd;
public float cr;
public float cd;
public float eff;
public float res;
public float dac;
```

These are domain-significant stat values stored as primitives. The rule requires each to be wrapped in a value object (e.g., `AttackValue`, `SpeedValue`) so that domain rules (non-negative, bounded range) can be encoded in the type.

**Preferred pattern:**

```java
public final class AttackValue {
    private final int value;
    public AttackValue(int value) {
        if (value < 0) throw new IllegalArgumentException("Attack cannot be negative");
        this.value = value;
    }
    public int get() { return value; }
}
```

**Effort:** LARGE — 50+ fields across Hero + all callers in StatCalculator. Prerequisite: define a `StatValue<T>` generic base or per-type value objects. No action until a dedicated refactor sprint.

---

### OC-R4 — First-class collections (SUGGESTION)

**File:** `Hero.java`

Representative violations — bare `List` and array fields:

```java
public List<Build> builds;
public Object[] equipment;
public List<String> keepStats;
public List<String> modSlots;
```

**Preferred pattern:** Wrap each collection in a named class:

```java
public final class BuildList {
    private final List<Build> builds;
    public BuildList() { this.builds = new ArrayList<>(); }
    public void add(Build build) { builds.add(build); }
    public List<Build> getAll() { return Collections.unmodifiableList(builds); }
}
```

---

### OC-R5 — One dot per line (SUGGESTION)

**File:** `Hero.java`

Representative violation — skill chain traversal:

```java
double rate = hero.skills.S1[0].rate;
```

**Preferred pattern:** Introduce accessor methods on the intermediate objects to avoid chained `.` traversal.

---

### OC-R6 — Do not abbreviate names (IMPORTANT)

**Files:** All domain classes — `Hero.java`, `StatCalculator.java`, `Item.java`, `Sorter.java`, handler classes

Pervasive abbreviations used as field names, local variables, and method parameters throughout the backend:

| Abbreviation | Meaning            |
| ------------ | ------------------ |
| `atk`        | Attack             |
| `hp`         | Health Points      |
| `def`        | Defense            |
| `cr`         | Critical Rate      |
| `cd`         | Critical Damage    |
| `eff`        | Effectiveness      |
| `res`        | Effect Resistance  |
| `dac`        | Dual Attack Chance |
| `spd`        | Speed              |
| `ehp`        | Effective HP       |
| `dmg`        | Damage             |
| `bs`         | Bonus Stats        |
| `cp`         | Combat Power       |
| `wss`        | Weapon/Set Score   |

**Recommended immediate action (zero-risk):**

Add `GLOSSARY.md` at `backend/GLOSSARY.md` mapping each abbreviation to its full name and the in-game stat description. This documents intent without touching source code and serves as a prerequisite for any future rename refactor.

**Full rename effort:** LARGE — abbreviations are used as JSON keys in the frontend↔backend IPC contract. Renaming requires a coordinated change across Java fields, JSON serialization annotations, and JavaScript consumer code.

---

### OC-R7 — Keep all entities small (≤50 lines) (IMPORTANT)

**Violating files:**

| File                              | Approx. Lines | Severity  |
| --------------------------------- | ------------- | --------- |
| `StatCalculator.java`             | ~500          | IMPORTANT |
| `OptimizationRequestHandler.java` | ~500          | IMPORTANT |
| `Sorter.java`                     | ~200          | IMPORTANT |
| `Hero.java`                       | ~200          | IMPORTANT |
| `HeroesRequestHandler.java`       | ~150          | IMPORTANT |
| `ItemsRequestHandler.java`        | ~100          | IMPORTANT |

**Highest-value split — `Sorter.java`:** Each `case` branch in the sort switch is a self-contained comparator. Extracting them to static `Comparator<Hero>` methods would reduce the file significantly with low risk and no behavior change.

**`StatCalculator.java` split strategy:**

1. `BaseDamageCalculator` — raw hit / crit damage
2. `SkillModifierApplier` — per-skill multiplier logic
3. `DefenseCalculator` — enemy defense reduction
4. `StatCalculator` — orchestrator only

---

### OC-R8 — No classes with more than two instance variables (IMPORTANT)

**Violating files:**

| Class                  | Instance Variable Count                                      |
| ---------------------- | ------------------------------------------------------------ |
| `StatCalculator`       | 20+ (stat fields injected via constructor or set methods)    |
| `HeroesRequestHandler` | 5 (`heroService`, `itemService`, `itemsGrid`, `cache`, `db`) |
| `ItemsRequestHandler`  | 4 (`itemService`, `heroService`, `cache`, `db`)              |
| `Hero`                 | 30+ (all stat + metadata fields as public members)           |

**Preferred pattern for handlers:** Introduce a `ServiceLocator` or `ApplicationContext` parameter object that bundles related services, reducing each handler to 1–2 declared fields.

```java
// Before
class HeroesRequestHandler {
    private final HeroService heroService;
    private final ItemService itemService;
    private final ItemsGrid itemsGrid;
    private final Cache cache;
    private final Database db;
}

// After
class HeroesRequestHandler {
    private final ApplicationContext ctx;  // bundles all services
}
```

---

### OC-R9 — No getters or setters on domain objects (SUGGESTION)

**Files:** `Hero.java`, `Item.java`

`Hero.java` uses Lombok `@Getter @Setter` annotations, generating accessors for all fields. This exposes internal structure and couples callers to the representation. Domain behavior (e.g., applying a buff, scaling a stat) should be encoded as named methods.

**Preferred pattern:**

```java
// Instead of setAtk(int value) / getAtk()
public void applyBuff(StatBuff buff) {
    this.atk = Math.round(this.atk * buff.getAtkMultiplier());
}
```

The Lombok annotations are acceptable on `request/*` / `response/*` DTOs but should be removed from `Hero.java` and replaced with intentional behavior methods.

---

### High-Priority Advisory Items (Summary)

| #    | Item                                                    | File                        | Effort | Risk                       |
| ---- | ------------------------------------------------------- | --------------------------- | ------ | -------------------------- |
| OC-1 | Add `GLOSSARY.md` for all stat abbreviations (R6)       | `backend/GLOSSARY.md` (new) | S      | None                       |
| OC-2 | Extract `sortHeroes()` cases to comparator methods (R7) | `Sorter.java`               | M      | Low                        |
| OC-3 | Introduce `StatContext` parameter object (R8)           | `StatCalculator.java`       | M      | Medium                     |
| OC-4 | Split `StatCalculator` into focused collaborators (R7)  | `StatCalculator.java`       | L      | High — touches all callers |

No source code changes made in this audit. All items are advisory, deferred to future sprints.

---

## Performance Optimization Audit (`performance-optimization.instructions.md`)

**Audit date:** 2026-05-31 | **Instruction:** `performance-optimization.instructions.md` | **applyTo:** `**`
**Audited scope:** `app/app.html`, `app/css/style.css`, `app/js/lib/services/subprocess.js`
**Framework:** Vanilla HTML/CSS/JS Electron desktop (no React, Angular, Vue, or Next.js)

> Core Web Vital targets (LCP < 2.5s, INP < 200ms, CLS < 0.1) are **not measured in an Electron app** — there is no network latency, no CDN, and no web browser render pipeline. However the underlying anti-patterns (render-blocking scripts, layout-shifting, leaked intervals, layout-triggering CSS transitions) still degrade startup time and UI responsiveness and are worth fixing.

---

### Citation P1 — Render-blocking scripts without `defer` (L2 — CRITICAL)

**Lines 13–18, 34 of `app/app.html`**

```html
<!-- Current: parser-blocking -->
<script src="node_modules/i18next/i18next.min.js"></script>
<script src="node_modules/i18next-browser-languagedetector/i18nextBrowserLanguageDetector.min.js"></script>
<script src="node_modules/i18next-localstorage-backend/i18nextLocalStorageBackend.min.js"></script>
<script src="node_modules/i18next-http-backend/i18nextHttpBackend.min.js"></script>
<script src="node_modules/i18next-chained-backend/i18nextChainedBackend.min.js"></script>
<script src="node_modules/rangeslider-js/dist/rangeslider-js.min.js"></script>
<!-- line 34 -->
<script src="node_modules/multiple-select/dist/multiple-select.min.js"></script>
```

**Fix — add `defer` to each:**

```html
<script defer src="node_modules/i18next/i18next.min.js"></script>
<script defer src="node_modules/i18next-browser-languagedetector/i18nextBrowserLanguageDetector.min.js"></script>
<script defer src="node_modules/i18next-localstorage-backend/i18nextLocalStorageBackend.min.js"></script>
<script defer src="node_modules/i18next-http-backend/i18nextHttpBackend.min.js"></script>
<script defer src="node_modules/i18next-chained-backend/i18nextChainedBackend.min.js"></script>
<script defer src="node_modules/rangeslider-js/dist/rangeslider-js.min.js"></script>
<script defer src="node_modules/multiple-select/dist/multiple-select.min.js"></script>
```

> **Verification:** Confirm `init.js` (which bootstraps i18next) also runs after all deferred scripts, or move it after them in source order.

---

### Citation P2 — `@font-face` blocks missing `font-display` (I5 — CRITICAL)

**Lines 14–75 of `app/css/style.css`** (8 `@font-face` declarations for Fira Sans Condensed at weights 300/400/500/600/700 in normal and italic)

```css
/* Current: no font-display — causes FOUT and CLS on app start */
@font-face {
    font-family: 'Fira Sans Condensed';
    font-style: normal;
    font-weight: 400;
    src: url('../assets/Fira_Sans_Condensed/FiraSansCondensed-Regular.woff2') format('woff2');
}
```

**Fix — add `font-display: swap;` to all 8 blocks:**

```css
@font-face {
    font-family: 'Fira Sans Condensed';
    font-style: normal;
    font-weight: 400;
    src: url('../assets/Fira_Sans_Condensed/FiraSansCondensed-Regular.woff2') format('woff2');
    font-display: swap;
}
```

---

### Citation P3 — Uncleared `setInterval` (J3 — CRITICAL)

**`app/js/lib/services/subprocess.js` : line 110** (approximate)

```javascript
// Current: interval fires every 100 ms, no reference stored, never cleared
setInterval(() => {
    if (child) {
        try { child.stdout.write(''); } catch (e) {}
    }
}, 100);
```

**Fix:**

```javascript
let healthCheckInterval = setInterval(() => {
    if (child) {
        try { child.stdout.write(''); } catch (e) {}
    }
}, 100);

// In the child.on('close', ...) handler — add:
child.on('close', (code) => {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    // ... existing close logic
});
```

---

### Citation P4 — Layout-triggering CSS transitions (C1 — IMPORTANT)

**`app/css/style.css` : line 2384 and lines 2823–2824**

```css
/* Line 2384 — animates width, triggers layout */
.pwb-seg { transition: width 0.15s ease; }

/* Lines 2823–2824 — animates left, triggers layout */
.switch-label::after {
    -webkit-transition: left 0.25s ease;
    transition: left 0.25s ease;
}
```

**Fix — replace with transform-based transitions (GPU composited, no reflow):**

```css
/* .pwb-seg slides via transform instead of width */
.pwb-seg { transition: transform 0.15s ease; }

/* Toggle switch uses translateX instead of left */
.switch-label::after {
    -webkit-transition: -webkit-transform 0.25s ease;
    transition: transform 0.25s ease;
}
.switch-input:checked + .switch-label::after {
    transform: translateX(24px); /* adjust to match current visual */
}
```

> **Note:** `will-change: width` on `.rangeslider__fill` (`style.css` ~line 2890) is **acceptable** — the rangeslider animates continuously on drag, and this element is the intended beneficiary of GPU promotion. C3 does not apply here.

---

### Citation P5 — Images without `width`/`height` attributes (I1 — IMPORTANT)

**`app/app.html` : lines 84, 249, 264, 270, 279** (and dynamic image slots populated by JS)

```html
<!-- Current: no dimensions — browser cannot reserve space, causes CLS -->
<img class="coffeeContainerImage" id="coffeeImage" src="./assets/coffee.png" alt="" />
<img src="./assets/blank.png" id="inputHeroImage" class="inputHeroImage" alt="" />
<img src="./assets/blank.png" id="inputArtifactImage" class="inputArtifactImage" alt="" />
```

**Fix — add explicit dimensions matching the CSS-rendered size:**

```html
<img class="coffeeContainerImage" id="coffeeImage" src="./assets/coffee.png" alt="" width="64" height="64" />
<img src="./assets/blank.png" id="inputHeroImage" class="inputHeroImage" alt="" width="100" height="100" />
<img src="./assets/blank.png" id="inputArtifactImage" class="inputArtifactImage" alt="" width="100" height="100" />
```

For JS-populated image elements (hero portraits, gear icons), add CSS `aspect-ratio` rules as a fallback:

```css
.inputHeroImage, .inputArtifactImage { aspect-ratio: 1 / 1; }
```

---

### Passed / Not Applicable

| Rule | Verdict | Notes |
| --- | --- | --- |
| L3 Preconnect | N/A | No third-party origins — all assets local in Electron |
| L5 Client-side fetch | Pass | Main content rendered as static HTML, not fetched in useEffect |
| L7 fetchpriority | N/A | No LCP network image; Electron file:// protocol |
| L8 Third-party scripts in head | N/A | Scripts are local `node_modules` |
| L10 Compression | N/A | No server; Electron loads files directly from disk |
| R1–R8 | N/A | No React, Next.js, Angular, or Vue |
| J1 Long handlers | Pass | Event handlers delegate to worker thread via IPC |
| J2 Layout thrashing | Pass | No DOM reads in loops found in audited files |
| J4 addEventListener cleanup | Pass | Electron lifecycle manages renderer process |
| J6 Sync XHR | Pass | No synchronous XHR anywhere; `fetch()` used throughout |
| B2 CommonJS require | Acceptable | Electron renderer allows CommonJS; `require()` correct here |
| C3 will-change permanently | Acceptable | `will-change: width` on `.rangeslider__fill` is justified by continuous animation |
| I2 Lazy loading above-fold | Pass | No `loading="lazy"` on hero or artifact slot images |

---

## Playwright TypeScript E2E Testing Audit (`playwright-typescript.instructions.md`)

**Audit date:** 2026-05-31 | **Instruction:** `playwright-typescript.instructions.md` | **applyTo:** `**`
**Audited scope:** `app/package.json`, `app/app.html`, `app/js/lib/`, `tests/` (absent)
**Framework:** Electron desktop app — no browser context; assets served via `file://` protocol; `_electron.launch()` required

> Playwright testing for Electron requires the `_electron` launcher from `@playwright/test`. Standard browser project configs (Chromium / Firefox / WebKit) cannot launch an Electron app. All CRITICAL findings reflect structural absence — no test infrastructure exists at all.

---

### Citation PW1 — No `tests/` directory (File Organization — CRITICAL)

**Location:** Project root (workspace scan)

The instruction specifies:
> *"Store all test files in the `tests/` directory."*
> *"Naming: `<feature-or-page>.spec.ts`"*

No `tests/` directory exists anywhere in the workspace. The TestCafe configuration in `app/package.json` references `test/e2e/HomePage.e2e.ts` but that file is also absent from disk.

```
# Expected (from instruction):
tests/
  optimizer.spec.ts
  gear.spec.ts
  importer.spec.ts
  settings.spec.ts

# Actual:
(directory does not exist)
```

---

### Citation PW2 — No `playwright.config.ts` (File Organization — CRITICAL)

**Location:** Project root / `app/` (workspace scan)

Playwright requires a configuration file to resolve `testDir`, `timeout`, `reporter`, and project-level launch options. No `playwright.config.ts`, `playwright.config.js`, or `playwright.config.mjs` exists in the workspace.

```typescript
// playwright.config.ts — must be created at project root
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  reporter: 'html',
});
```

---

### Citation PW3 — `@playwright/test` not installed (Imports — CRITICAL)

**File:** `app/package.json` (full file)

`@playwright/test` appears in neither `dependencies` nor `devDependencies`. The current E2E dependency is TestCafe:

```json
// Current app/package.json (relevant excerpt)
{
  "devDependencies": {
    "testcafe": "^3.7.4",
    "testcafe-browser-provider-electron": "^0.0.20"
  },
  "scripts": {
    "test-e2e": "testcafe electron:./app test/e2e/HomePage.e2e.ts"
  }
}
```

**Fix — add alongside TestCafe (coexistence, not replacement):**

```json
{
  "devDependencies": {
    "@playwright/test": "^1.44.0",
    "testcafe": "^3.7.4",
    "testcafe-browser-provider-electron": "^0.0.20"
  },
  "scripts": {
    "test-e2e": "testcafe electron:./app test/e2e/HomePage.e2e.ts",
    "test:e2e:playwright": "playwright test"
  }
}
```

---

### Citation PW4 — Electron launch config required (Framework Scope — IMPORTANT)

**File:** `app/package.json` (Electron detected via `"electron"` key and `"main": "main.dev.js"`)

The instruction's sample config uses standard browser projects. Electron apps require `_electron.launch()` inside the test body. A standard `project: [{ use: { browserName: 'chromium' } }]` entry will fail because there is no HTTP server and no browser-viewable URL.

```typescript
// BAD — standard browser config, fails for Electron
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});

// GOOD — Electron via _electron launcher in each spec's beforeEach
// playwright.config.ts has no browser projects; launch happens per-test:
import { _electron as electron } from '@playwright/test';
const app = await electron.launch({ args: ['app/main.dev.js'] });
const page = await app.firstWindow();
```

Key Electron-specific considerations:
- `args` must point to the app's entry file (`app/main.dev.js`)
- `page.waitForLoadState('domcontentloaded')` needed after `firstWindow()` — Electron windows load synchronously but renderer content may still be initializing
- `electronApp.close()` must be called in `afterEach` to avoid process leakage (maps to J3/J4 cleanup anti-patterns from the performance audit)

---

### Citation PW5 — Zero Playwright coverage on 8 feature tabs (Coverage — IMPORTANT)

**File:** `app/app.html` — tab radio inputs at lines 80–96 (approximate)

Eight feature tabs are defined in `app.html` with no corresponding Playwright spec. The instruction states:
> *"Aim for one test file per major application feature or page."*

```html
<!-- app/app.html — tab inputs providing the 8 feature areas -->
<input type="radio" name="tab" id="tab1" class="tab tab--1" />  <!-- Optimizer -->
<input type="radio" name="tab" id="tab2" class="tab tab--2" />  <!-- Multi-Optimizer -->
<input type="radio" name="tab" id="tab3" class="tab tab--3" />  <!-- Gear -->
<input type="radio" name="tab" id="tab4" class="tab tab--4" />  <!-- Heroes -->
<input type="radio" name="tab" id="tab5" class="tab tab--5" />  <!-- Enhancing -->
<input type="radio" name="tab" id="tab6" class="tab tab--6" />  <!-- Importer -->
<input type="radio" name="tab" id="tab7" class="tab tab--7" />  <!-- Settings -->
<input type="radio" name="tab" id="tab10" class="tab tab--10" /> <!-- Archetypes -->
```

Recommended coverage mapping (one file per major tab, consolidated minor tabs):

| Spec file | Tabs covered | Critical paths |
| --- | --- | --- |
| `tests/optimizer.spec.ts` | tab1 (#Optimizer) | hero select, Start, Filter, result count |
| `tests/multi-optimizer.spec.ts` | tab2 (#Multi-Optimizer) | multiple hero select, batch run |
| `tests/gear.spec.ts` | tab3 (#Gear) | gear table render, stat filter, lock/unlock |
| `tests/importer.spec.ts` | tab6 (#Importer) | JSON import, scanner trigger |
| `tests/settings.spec.ts` | tab7 (#Settings) | dark mode toggle, language switch |

The following dark-mode toggle test demonstrates the instruction's required locator and step pattern applied to an actual element in `app.html`:

```typescript
// tests/settings.spec.ts — dark mode toggle (getByLabel + test.step)
test('Dark mode toggle activates dark theme', async () => {
  await test.step('Toggle dark mode on', async () => {
    // #darkSlider has aria-label="Dark mode" in app.html
    await page.getByLabel('Dark mode').check();
  });

  await test.step('Verify darkmode class applied to body', async () => {
    await expect(page.locator('body')).toHaveClass(/darkmode/);
  });
});
```

---

### Passed / Not Applicable

| Rule | Verdict | Notes |
| --- | --- | --- |
| Locator priority (`getByRole`, `getByLabel`) | N/A | No test files exist to evaluate |
| `toMatchAriaSnapshot` for UI structure | N/A | No test files exist |
| `toHaveCount`, `toHaveText`, `toHaveURL` | N/A | No test files exist |
| No `sleep`/fixed waits | N/A | No test files exist |
| Test independence | N/A | No test files exist |
| `test.describe()` grouping | N/A | No test files exist |
| `beforeEach` / `afterEach` hooks | N/A | No test files exist |
| Test file naming (`<feature>.spec.ts`) | N/A | No spec files exist to validate naming |
| CI/CD integration | N/A | No `"test:e2e:playwright"` script in any `package.json` |

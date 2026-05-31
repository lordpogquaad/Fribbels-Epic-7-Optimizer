# Tasks Index

## In Progress

- [TASK002] Integration Testing — Running 6 manual checks on live Electron app
- [TASK003] A11y & Safety Audit Fixes — 16 open items (5 CRITICAL, 9 IMPORTANT, 2 SUGGESTION) from WCAG 2.2 AA audit of `app.html` + `style.css`; agent-safety audit N/A (no LLM code)

## Pending

- [TASK004] Java 25 Readiness Advisories — 1 advisory (aparapi JNI / JEP 472, no action on Java 21) + 1 pending item (add `--add-opens` args to `main.dev.js` JAR spawn if runtime reflection errors occur)
- [TASK006] Node.js/Vitest Instruction Audit — 7 advisory findings (NJ1–NJ7); no source code changes required; items deferred for future sprints
- [TASK007] Object Calisthenics Audit (Java Backend) — 9-rule audit; IMPORTANT violations in Rules 3, 6, 7, 8 across `Hero.java`, `StatCalculator.java`, `Sorter.java`, and handler classes; SUGGESTION violations in Rules 1, 2, 4, 5, 9; no source code changes; items deferred for future sprints
- [TASK008] Performance Optimization Audit — CWV/Core Web Vitals audit of `app.html`, `style.css`, `subprocess.js`; 3 CRITICAL (P1 render-blocking scripts, P2 missing font-display, P3 uncleared setInterval), 2 IMPORTANT (P4 layout-triggering transitions, P5 images without dimensions); no source code changes; items deferred for future sprints
- [TASK009] Playwright TypeScript E2E Audit — `playwright-typescript.instructions.md` gap analysis; 3 CRITICAL (PW1 no `tests/` directory, PW2 no `playwright.config.ts`, PW3 `@playwright/test` not installed), 2 IMPORTANT (PW4 Electron `_electron.launch()` config required, PW5 zero coverage on 8 feature tabs); no source code changes; items deferred for future sprints

## Completed

- [TASK001] Scoring Engine Integration — All Phases 5–9 complete (May 2026)
- [TASK005] Localization (ko-kr) — Korean translation of `1. App/README.md` created at `localization/ko-kr/1. App/README.md` (June 2026)

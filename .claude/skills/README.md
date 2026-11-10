# .claude/skills

Project-scope Skills (`<name>/SKILL.md`). Auto-discovered; invoked with `/<name>` or by the model
when the description matches, unless the Skill sets `disable-model-invocation: true`.

`/audit-backend`, `/audit-frontend`, `/audit-scanner` and `/audit-ui` audit one section each. They
share `section-audit.md`, which sits here because it is not a Skill; the section table is in
`.claude/rules/section-locations.md`.

`/run-pog-e7-optimizer` builds, launches and drives the running app: its `driver.mjs` starts the
dev server and Electron with a debugging port, then clicks, evaluates and screenshots over the
DevTools protocol. It is model-invocable, so "run the app" or "screenshot the app" loads it.

Possible next Skills wrap the real command surface so they cannot be run in the wrong root:
`/install-frontend` (→ `1. Master/2. PS1/install_frontend.ps1`),
`/build-backend` (→ `1. Master/2. PS1/build_backend.ps1`).

Keep Skill bodies short — Fable 5 is measured to degrade under over-prescriptive Skills
(`~/.claude/memory/fable-5-behavior-notes.md`). Never instruct hidden-reasoning echo
(`~/.claude/rules/no-reasoning-echo-instructions.md`).

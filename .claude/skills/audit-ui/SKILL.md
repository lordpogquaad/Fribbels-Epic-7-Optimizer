---
name: audit-ui
description: Audit the HTML, CSS, assets and translations of the Pog E7 Optimizer for real defects and hidden problems. Runs Stylelint and an asset and locale drift check, then dispatches ui-sonnet in shards, or ui-opus with deep, and files every finding. Read-only apart from the fix list and ledger.
disable-model-invocation: true
argument-hint: '[drift|deep [paths]]'
---

# /audit-ui

Arguments: `$ARGUMENTS`

Read `.claude/skills/section-audit.md` now: it owns the modes, flow, agent contract and report.
This file supplies the UI's values. The agents are `ui-sonnet` and `ui-opus`.

## Scope

Under `1. App/2. Frontend/1. Source/`: `1. HTML/app.html`, `2. CSS/`, and
`6. JSON/3. TRANSLATION/locales/*/translation.json` except `dev/`.

Exclude `1. HTML/assets/`, which is build output. Assets under `3. ASSETS/` are binary, so they go in
no shard: judge them by name and reference, from the drift script and from `app.html` and the CSS.
Shard `app.html` on its own, `2. CSS/` as one more, and the locales as a third. Read the project's own
stylesheets; for the vendored `awn.css` and `rangeslider.css`, diff against the npm copy instead.

## Tool pass

Run the drift script before any `yarn build` in the same session, because `copy-assets` fills in what
it would report as never copied.

- `yarn lint:styles`: Stylelint. Exit 2 means findings.
- `node "../.claude/skills/audit-ui/scripts/ui-drift.mjs"`: read-only, and it compares names only. It
  lists asset names found only in the build copy or only in the source, and translation keys missing
  from or extra in a locale, up to ten of each. Exit 1 means a check could not run.

## What the agents check

- **Dark mode and grids:** a style that breaks in `darktheme.css` or on the AG Grid tables, such as
  hard-coded colours, or text the same colour as its background.
- **`app.html`:** visible text with no `i18next` key, duplicate ids, a selector or id the JS relies on
  that no longer exists, and controls with no label.
- **CSS:** rules nothing uses, and overrides fighting each other. `awn.css` is customized on purpose,
  so a difference from npm there is not a finding on its own.
- **Assets:** a file referenced from HTML, CSS or JS that does not exist, and one nothing references.
- **Translations:** keys are the English strings and there is no fallback language, so a missing key
  shows its English key text. Report which screens it reaches.

## Not run in an audit

Agents cannot see the running app, and the UI rule needs visual evidence for a layout verdict. List
each suspected visual problem with what Marcus should look at, and put it under `Not run`, never as
confirmed. Report a behaviour problem for `/audit-frontend`.

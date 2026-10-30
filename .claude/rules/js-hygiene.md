---
paths:
  - "1. App/2. Frontend/1. Source/4. JS/**"
  - "1. App/2. Frontend/1. Source/5. TS/**"
---

# JS and TS file hygiene

**Fires when:** editing a renderer JS or TS file.

These checks are part of finishing the edit. Each one guards a mistake that passed lint here and
reached a user or a later pass.

## Before the file is done

- Leave the file ESLint-clean. `yarn lint` is the gate, and `yarn lint:fix` clears unused directives.
- Strip any UTF-8 BOM, and check the parse with `node --check`.
- Never blanket-replace a pattern that a helper's own body also contains. Convert call sites one at a
  time, then re-read the helper to confirm it did not rewrite itself.
- Never remove a debug `console.log` or `Log.*` call unless asked. Gate a noisy one with the flags in
  `LogControl.js` instead.

Evidence: project memory `js-file-hygiene`, `log-control`.

---
paths:
  - "1. App/2. Frontend/1. Source/4. JS/**/*.js"
---

# AG-Grid

**Fires when:** reading or editing renderer JS, which may create a grid or read its rows.

The app is on AG-Grid 33 or later, whose API differs from the old code and from most examples. A wrong
read here returns `undefined` and the action silently does nothing, with no error.

## API

- Read selection with `node.isSelected()` or `api.getSelectedNodes()`, and set it with
  `node.setSelected()`. Never read `node.selected`.
- Column state lives on `api`. Never add a `columnApi` alias.
- Use `ag-grid-community`. Never add the discontinued scoped `@ag-grid-community/*` packages.
- Keep `provideGlobalGridOptions({ theme: 'legacy' })` while the balham CSS is linked.

Evidence: project memory `ag-grid-setup`.

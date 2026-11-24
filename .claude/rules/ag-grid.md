---
paths:
  - "1. App/2. Frontend/1. Source/4. JS/**/*.js"
  - "1. App/2. Frontend/1. Source/package.json"
  - "1. App/2. Frontend/1. Source/1. HTML/app.html"
---

# AG-Grid

**Fires when:** reading or editing renderer JS, which may create a grid or read its rows, the
renderer `package.json`, which declares the grid package, or `app.html`, which links the balham CSS.

The app is on AG-Grid 33 or later, whose API differs from the old code and from most examples. A wrong
read here returns `undefined` and the action silently does nothing, with no error.

## API

- Read selection with `node.isSelected()` or `api.getSelectedNodes()`, and set it with
  `node.setSelected()`. Never read `node.selected`.
- Column state lives on `api`: where old code or an example calls `columnApi.*`, call the same
  method on `api`. Never add a `columnApi` alias.
- Use `ag-grid-community`. Never add the discontinued scoped `@ag-grid-community/*` packages.
- Keep `provideGlobalGridOptions({ theme: 'legacy' })` while the balham CSS is linked: without it
  AG-Grid defaults to its JS Theming API, which conflicts with that CSS.

Evidence: project memory `ag-grid-setup`.

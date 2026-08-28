---
name: ag-grid-setup
description: "AG-Grid integration is a single point in inputHandler.js (ModuleRegistry/AllCommunityModule/legacy theme); v33+ row selection dropped the .selected property for isSelected() — never reintroduce node.selected, columnApi, or the discontinued scoped @ag-grid-community/* packages."
metadata:
  type: reference
---

# AG-Grid integration (structure verified 2026-08-28 against ag-grid 36.1.0)

**Single integration point:** `2. Frontend\1. Source\4. JS\6. Shared\1. Core\inputHandler.js` —
confirmed present 2026-08-28 with:
- `const { ModuleRegistry, AllCommunityModule, createGrid, provideGlobalGridOptions } = require('ag-grid-community')`
- `ModuleRegistry.registerModules([AllCommunityModule])` — registers all community features in one
  shot (avoids per-feature "module not registered" errors).
- `provideGlobalGridOptions({ theme: 'legacy' })` — required since v33+ to keep the CSS-file themes;
  without it, ag-grid defaults to the JS Theming API and conflicts with the loaded balham CSS.
- `createGridCompat(el, opts)` wraps `createGrid` → returns `{ gridOptions: { api } }`; all grids call
  `grid.gridOptions.api.*`. The old separate `columnApi` was merged into `api`
  (`getColumnState`/`applyColumnState`/`resetColumnState` live on `api`) — never reintroduce a
  `columnApi` alias.

Do **not** reintroduce the scoped `@ag-grid-community/*` packages — they were discontinued at v32;
the current package is the single monolithic `ag-grid-community` (`36.1.0` — bumped from `35.3.1`
2026-08-28, own unit, see [[overhaul-plan-2026-08]] for the migration notes and pending runtime
check).

**v33+ selection API:** row nodes no longer expose a `selected` *property* — use the `isSelected()`
*method*. A blanket `event.node.selected` read silently returns `undefined` (selection-triggered
actions no-op — e.g. clicking a hero not loading its builds). Use `isSelected()` /
`api.getSelectedNodes()` / `node.setSelected()` — never `node.selected`.

**Theming:** legacy balham CSS via `<link>` in app.html (`ag-grid-community/styles/ag-grid.min.css` +
`ag-theme-balham.min.css`) plus dark overrides in `2. CSS\darktheme.css`. The `.ag-theme-balham`
block there sets `--ag-background-color` / `--ag-header-background-color` /
`--ag-odd-row-background-color` to the dark theme vars — required, otherwise balham's `#fff` default
shows an empty white grid area. All grids use `class="ag-theme-balham"` + the `rowSelection: { mode: ... }`
object API. App runs from source via `start-dev.bat` — see [[frontend-dev-server]].

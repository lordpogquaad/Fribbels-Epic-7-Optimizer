---
name: persistence-save-load-traps
description: Where a save, load or item edit loses data between the renderer and the Java db classes, and which handler paths bypass the lock
metadata:
  type: reference
---

# Persistence save and load traps

Verified 2026-10-30 by reading `saves.js`, `api.js`, `dialog.js`, `ItemsRequestHandler`, `HeroesRequestHandler`, and a
scratch run of the compiled `OptimizationDb` on commit `bb58eaf`. Recheck after any change to those files.

- There is no store on disk in Java. `Saves.saveData` is the only persistence: `getAllHeroes` plus `getAllItems`, then a
  plain `writeFileSync`. It does not check either response before overwriting `autosave.json`.
- `HeroesRequestHandler.getAllHeroes` has an outer catch that returns an empty hero list as a normal reply, so a failure
  there looks like a roster of zero to the save.
- `editItems` copies every field it names from the request, null included. The edit dialog builds a new object, so a field
  it does not carry (`op`, `storage`) is cleared on the db item. Check a new `Item` field against that list.
- Only `HeroesRequestHandler.handle` is synchronized. `ItemsRequestHandler` calls `equipItemsOnHero`, `addStatsToBuild`,
  `addHeroes` and `removeHeroById` directly, outside that monitor, and the `StatCalculator` instance has mutable fields.
- `OptimizationDb.sort` records column and order even on an empty pre-run db. A later same-sort call is skipped, so compare
  the call order, not just the method, before trusting a sorted result ([[search-pipeline-map]]).
- Binding rules are in [[wire-format-traps]].

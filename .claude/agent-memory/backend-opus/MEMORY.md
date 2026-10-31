# Update your agent memory as you discover codepaths, patterns, library locations, and key architectural decisions. This builds up institutional knowledge across conversations. Write concise notes about what you found and where

- [Search pipeline map](search-pipeline-map.md) — where a build is pruned, sorted and scored across JS and Java, plus the no-build probe recipe
- [Wire format traps](wire-format-traps.md) — how renderer JSON binds to Java requests, where keys vanish, and the three error paths
- [Persistence traps](persistence-save-load-traps.md) — where save, load and item edits lose data, and which paths bypass the handler lock

# .claude/rules

Project-scope Rules, auto-discovered by Claude Code (`*.md`). A Rule with no `paths:` frontmatter is
always loaded; a `paths:`-scoped Rule loads only when a matching file is read.

What belongs here: machine facts, section ownership and path-scoped traps (`machine.md`,
`section-locations.md`, and the path-scoped `ag-grid.md`, `js-hygiene.md`, `deps.md`). The command
surface, the gates and the two-manifest layout live in `.claude/CLAUDE.md`, which points to the
project memory that explains the Yarn-vs-npm split. Evidence and history belong in project memory
(the `autoMemoryDirectory` folder), not here.

One fact → one home. Do not duplicate a Rule's body into `CLAUDE.md` or a memory.

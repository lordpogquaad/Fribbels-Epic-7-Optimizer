# .claude/rules

Project-scope Rules, auto-discovered by Claude Code (`*.md`). A Rule with no `paths:` frontmatter is
always loaded; a `paths:`-scoped Rule loads only when a matching file is read.

What belongs here: always-on, project-specific directives — the real command surface, the
two-manifest / Yarn-vs-npm split, path-quoting traps from the numbered-folder layout, gates to run
before claiming a change works. Evidence and history belong in `.claude/memory/`, not here.

One fact → one home. Do not duplicate a Rule's body into `CLAUDE.md` or a memory.

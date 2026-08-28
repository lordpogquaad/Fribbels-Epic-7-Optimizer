# .claude/agents

Project-scope custom subagents (`<name>.md` with YAML frontmatter: `name`, `description`, `model`,
optional `effort`, `tools`). Auto-discovered; nearest duplicate name wins over user scope.

Placeholder until the reorganization settles which specialists this codebase warrants. Candidates:
a Java/Maven backend worker (`3. Backend`), a jQuery/webpack renderer worker (`2. Frontend/1. Source`),
a Python scanner/importer worker (`7. PY`). Generic `haiku-researcher` / `sonnet-worker` /
`opus-worker` already exist at user scope — do not duplicate them here.

Tiering policy lives in `~/.claude/rules/subagent-tiering.md`; audit with
`node 1-Dev/tools/audit-agent-frontmatter.mjs` from the Image AI repo (recursive, covers this dir
when passed).

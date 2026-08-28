# .claude/hooks

Project hook scripts. Registered in `.claude/settings.json` under `hooks`, launched as
`node "${CLAUDE_PROJECT_DIR}/.claude/hooks/<name>.mjs"` — the same mechanism as the user-scope
hooks in `~/.claude/hooks/`.

| Script | Event / matcher | Purpose |
|---|---|---|
| `guard-package-root.mjs` | `PreToolUse` · `Bash\|PowerShell` | Denies `npm`/`pnpm` mutations outside `2. Frontend/1. Source` and `yarn` mutations inside it — the two mistakes the two-manifest layout invites. |

Conventions (from the user-scope guards):

- Block with JSON `hookSpecificOutput.permissionDecision`, never an exit code — exit 1 fails OPEN on PreToolUse.
- Any parse/logic error → exit 0. Never block on our own bug.
- Keep scripts free of backslash characters; the tool-call layer can rewrite escapes before the file is written (see `~/.claude/rules/shell-escapes.md`).
- Pipe-test before trusting: `echo '{"tool_name":"Bash","tool_input":{"command":"npm install"}}' | node .claude/hooks/guard-package-root.mjs`

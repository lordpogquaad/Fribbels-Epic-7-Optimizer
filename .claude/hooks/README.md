# .claude/hooks

Project hook scripts. Registered in `.claude/settings.json` under `hooks`, launched as
`node "${CLAUDE_PROJECT_DIR}/.claude/hooks/<name>.mjs"` — the same mechanism as the user-scope
hooks in `~/.claude/hooks/`.

| Script                   | Event / matcher                   | Purpose                                                                                                                                                                                                          |
| ------------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `guard-package-root.mjs` | `PreToolUse` · `Bash\|PowerShell` | Judges each shell statement at its own folder. Inside this repo it denies `npm`/`pnpm` mutations, except `npm` with both installer flags in `2. Frontend/1. Source`, and denies `yarn` mutations in that folder. |

Conventions (from the user-scope guards):

- Block with JSON `hookSpecificOutput.permissionDecision` at exit 0. `onFailure: "block"` in settings makes a crash, a timeout or exit 1 block the call.
- Keep a hook self-contained: it imports only Node built-ins, because a failed import would block every shell call.
- Keep scripts free of backslash characters; the tool-call layer can rewrite escapes before the file is written (see `~/.claude/rules/shell-escapes.md`).
- Each hook has a mirror in `.claude/hooks-test/`. Run `yarn test:hooks` from `1. App`, and add a case there instead of pipe-testing by hand: any command text holding a guarded phrase trips the live hook.

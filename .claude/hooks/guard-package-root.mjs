#!/usr/bin/env node
// .claude/hooks/guard-package-root.mjs — PreToolUse guard for Bash|PowerShell.
//
// WHY: this repo has TWO package manifests with TWO different package managers:
//   1. App/package.json                       -> Yarn 4 (yarn.lock, .yarnrc.yml)
//   1. App/2. Frontend/1. Source/package.json -> npm, ONLY via 1. Master/2. PS1/install_frontend.ps1
//      (--ignore-scripts --legacy-peer-deps, lockfile deleted afterwards on purpose)
// Running the wrong manager in the wrong root silently corrupts node_modules or drops a stray
// package-lock.json. This guard denies the two mistakes that layout invites.
//
// DENY:
//   * npm/pnpm install|add|remove|update|i  unless the command text names the frontend Source dir
//   * yarn install|add|remove|up|upgrade    when the command text names the frontend Source dir
// ALLOW everything else (npx, npm view, npm ls, install_frontend.ps1, yarn in 1. App, ...).
//
// Blocking form is JSON permissionDecision, never an exit code (exit 1 fails OPEN on PreToolUse).
// Any parse/logic error -> exit 0 (never block on our own bug).
// This file deliberately contains no backslash characters (tool-call escape normalization trap).
import { readFileSync } from 'node:fs';

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0);
}

const tool = String(input.tool_name || '');
if (tool !== 'Bash' && tool !== 'PowerShell') process.exit(0);

const rawCmd = String((input.tool_input && input.tool_input.command) || '');
if (!rawCmd) process.exit(0);

const BACKSLASH = String.fromCharCode(92);
const cmd = rawCmd.split(BACKSLASH).join('/').toLowerCase();

const FRONTEND_DIR = '2. frontend/1. source';
const mentionsFrontend = cmd.includes(FRONTEND_DIR);

// (^|non-word) manager (spaces) verb (non-word|$)  — no backslash escapes used.
const npmMutation = /(^|[^a-z0-9_@])(npm|pnpm) +(install|add|remove|uninstall|update|up|i|ci)([^a-z0-9_-]|$)/;
// yarn with an explicit mutation verb …
const yarnVerb = /(^|[^a-z0-9_@])yarn +(install|add|remove|up|upgrade)([^a-z0-9_-]|$)/;
// … or bare `yarn` as a whole command segment (Yarn 4: bare yarn == yarn install).
const bareYarn = /(^|&&|;|[|]|[(]) *yarn *($|&&|;|[|]|[)])/;

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

if (npmMutation.test(cmd) && !mentionsFrontend) {
  deny('guard-package-root: npm/pnpm mutations are only valid inside "1. App/2. Frontend/1. Source" '
    + '(run 1. Master/2. PS1/install_frontend.ps1). "1. App" is a Yarn 4 workspace — use yarn there.');
}

// yarn mutation (explicit verb or bare `yarn`) in a command that targets the frontend tree.
if (mentionsFrontend && (yarnVerb.test(cmd) || bareYarn.test(cmd))) {
  deny('guard-package-root: "1. App/2. Frontend/1. Source" is npm-installed by '
    + '1. Master/2. PS1/install_frontend.ps1 — never run yarn there (it would write yarn.lock/.pnp state into the npm tree).');
}

process.exit(0);

#!/usr/bin/env node
// .claude/hooks/guard-package-root.mjs — PreToolUse guard for Bash|PowerShell.
//
// WHY: this repo has TWO package manifests with TWO different package managers:
//   1. App/package.json                       -> Yarn 4 (yarn.lock, .yarnrc.yml)
//   1. App/2. Frontend/1. Source/package.json -> npm, via 1. Master/2. PS1/install_frontend.ps1
//      (--ignore-scripts --legacy-peer-deps, lockfile deleted afterwards on purpose)
// Running the wrong manager in the wrong root silently corrupts node_modules or drops a stray
// package-lock.json.
//
// The command is read the way a shell reads it: heredoc bodies dropped, statements split, words
// tokenized, and each statement judged at its own folder (cwd, then `cd`, `--prefix`, `--cwd`).
// DENY, inside this repo only:
//   * npm/pnpm mutations anywhere except the frontend Source dir
//   * npm/pnpm mutations in the frontend Source dir, unless npm carries both installer flags
//   * yarn mutations (a mutation verb, or bare yarn) in the frontend Source dir
// ALLOW everything else: read-only commands, quoted text, other folders, `-g`, the installer script.
// A folder that cannot be resolved counts as inside the repo for npm, unless both flags are present.
//
// Blocking form is JSON permissionDecision at exit 0. onFailure "block" in settings makes a crash,
// a timeout or exit 1 block the call, so a bad payload exits 1 here on purpose.
// A shell reader lives in the user-scope hooks, but this one stays self-contained: importing it
// would throw on a clone without the config repo and block every shell call.
// This file deliberately contains no backslash characters (tool-call escape normalization trap).
import { realpathSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BACKSLASH = String.fromCodePoint(92);
export const STDIN_NET_MS = 5000;
const MAX_DEPTH = 3;

const normalize = (p) =>
  path.resolve(p).split(BACKSLASH).join('/').replace(/[/]+$/, '').toLowerCase();

const REPO_ROOT = normalize(fileURLToPath(new URL('../..', import.meta.url)));
const FRONTEND_ROOT = `${REPO_ROOT}/1. app/2. frontend/1. source`;

const CD_PROGRAMS = new Set(['cd', 'chdir', 'pushd', 'set-location', 'sl']);
const SHELL_PROGRAMS = new Set(['bash', 'sh', 'zsh', 'dash']);
const POWERSHELL_PROGRAMS = new Set(['pwsh', 'powershell']);
const PREFIX_WORDS = new Set([
  'then',
  'do',
  'else',
  'elif',
  'if',
  'while',
  'until',
  'time',
  'exec',
  'command',
  'sudo',
  'env',
  'call',
  'corepack',
  'xargs',
]);
const DROPPED_WORDS = new Set(['{', '}', '!']);
const NODE_VALUE_OPTIONS = new Set([
  '--prefix',
  '-c',
  '--dir',
  '--cache',
  '--loglevel',
  '--registry',
  '--userconfig',
  '--workspace',
  '-w',
  '--filter',
]);
const NODE_MUTATIONS = new Set([
  'install',
  'i',
  'in',
  'ins',
  'inst',
  'insta',
  'instal',
  'isnt',
  'isnta',
  'isntal',
  'isntall',
  'add',
  'remove',
  'rm',
  'r',
  'un',
  'uninstall',
  'unlink',
  'update',
  'up',
  'upgrade',
  'udpate',
  'ci',
  'clean-install',
  'ic',
  'install-clean',
  'isntall-clean',
  'it',
  'install-test',
  'cit',
  'clean-install-test',
  'sit',
  'prune',
  'dedupe',
  'ddp',
  'link',
  'ln',
]);
const YARN_MUTATIONS = new Set(['install', 'add', 'remove', 'up', 'upgrade', 'dedupe']);
const YARN_READ_FLAGS = new Set(['--version', '-v', '--help', '-h']);

const INSTALLER = 'pwsh -File "1. App/1. Master/2. PS1/install_frontend.ps1"';
const DENY_NPM_IN_REPO = `guard-package-root: "1. App" is a Yarn 4 project, so use yarn there. The renderer tree installs through ${INSTALLER}.`;
const DENY_NPM_IN_FRONTEND = `guard-package-root: the renderer tree installs through ${INSTALLER}. A targeted npm command there needs --ignore-scripts and --legacy-peer-deps.`;
const DENY_YARN_IN_FRONTEND = `guard-package-root: "1. App/2. Frontend/1. Source" is npm-managed by ${INSTALLER}. Never run yarn there.`;
const DENY_TOO_DEEP =
  'guard-package-root: shell nesting is too deep to judge. Run the package command directly.';

const SHELL_FED_LINE = /(^|[ |])(bash|sh|zsh|pwsh|powershell)([ .]|$)/i;
const HEREDOC_OPENER = /<<-?[ ]*['"]?([a-z0-9_]+)['"]?/i;
const REDIRECT = /^[0-9*]*(>>?|<<?-?|&>>?)(.*)$/;
const ASSIGNMENT = /^[a-z_][a-z0-9_]*=/i;
const ENV_REFERENCE = /[$][{]?(?:env:)?([a-z_][a-z0-9_]*)[}]?/gi;
const DRIVE_MSYS = /^[/]([a-z])[/]/i;

/** Drops heredoc and here-string bodies, keeping the text when no closing line exists. */
function stripHeredocs(text) {
  const lines = text.split('\n');
  const kept = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opener = HEREDOC_OPENER.exec(line);
    const trimmed = line.trimEnd();
    const hereString = trimmed.endsWith("@'") || trimmed.endsWith('@"');
    let close = -1;
    if (opener && !SHELL_FED_LINE.test(line)) {
      close = lines.findIndex((l, j) => j > i && l.trim() === opener[1]);
    } else if (hereString) {
      const closer = `${trimmed.at(-1)}@`;
      close = lines.findIndex((l, j) => j > i && l.trimStart().startsWith(closer));
    }
    if (close < 0) {
      kept.push(line);
      continue;
    }
    kept.push(hereString ? trimmed.slice(0, -2) : line);
    i = close;
  }
  return kept.join('\n');
}

/** Splits text into statements of words, honoring quotes and escapes. */
function parseStatements(text) {
  const statements = [];
  let words = [];
  let word = null;
  let quote = null;
  const endWord = () => {
    if (word !== null) words.push(word);
    word = null;
  };
  const endStatement = () => {
    endWord();
    if (words.length) statements.push(words);
    words = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (quote) {
      if (quote === '"' && c === BACKSLASH && next === '"') {
        word += '"';
        i++;
      } else if (c === quote) quote = null;
      else word += c === BACKSLASH ? '/' : c;
    } else if (c === BACKSLASH || c === '`') {
      const lineEnd = next === '\n' || next === '\r';
      if (lineEnd) i += next === '\r' && text[i + 2] === '\n' ? 2 : 1;
      else if (next === ' ' && c === BACKSLASH) {
        word = `${word ?? ''} `;
        i++;
      } else if (c === BACKSLASH) word = `${word ?? ''}/`;
    } else if (c === '"' || c === "'") {
      word ??= '';
      quote = c;
    } else if (c === '#' && word === null) {
      const end = text.indexOf('\n', i);
      if (end < 0) break;
      i = end - 1;
    } else if (c === '\n' || c === ';' || c === '(' || c === ')' || c === '|') {
      endStatement();
    } else if (c === '&' && text[i - 1] !== '>' && next !== '>') {
      endStatement();
    } else if (c === ' ' || c === '\t' || c === '\r') {
      endWord();
    } else {
      word = `${word ?? ''}${c}`;
    }
  }
  endStatement();
  return statements;
}

/** Removes redirections, assignments and wrapper words, leaving program + arguments. */
function commandWords(statement) {
  const words = [];
  for (let i = 0; i < statement.length; i++) {
    const redirect = REDIRECT.exec(statement[i]);
    if (redirect) {
      if (redirect[2] === '') i++;
    } else if (!DROPPED_WORDS.has(statement[i])) {
      words.push(statement[i]);
    }
  }
  while (words.length) {
    const first = words[0].toLowerCase();
    if (ASSIGNMENT.test(words[0])) words.shift();
    else if (PREFIX_WORDS.has(first)) {
      words.shift();
      if (first === 'env' && words[0] === '-u') words.splice(0, 2);
      while (words[0]?.startsWith('-')) words.shift();
    } else break;
  }
  return words;
}

const programName = (word) =>
  word
    .toLowerCase()
    .split('/')
    .pop()
    .replace(/[.](cmd|exe|bat|ps1)$/, '');

/** Resolves a path word against a folder; null when a variable or the base is unknown. */
function resolveDir(raw, base) {
  let missing = false;
  let value = raw.replaceAll(ENV_REFERENCE, (_match, name) => {
    const found = process.env[name];
    if (found === undefined) missing = true;
    return found ?? '';
  });
  if (missing) return null;
  value = value.replace(DRIVE_MSYS, (_match, drive) => `${drive}:/`);
  if (value === '~' || value.startsWith('~/')) value = os.homedir() + value.slice(1);
  if (path.isAbsolute(value)) return normalize(value);
  return base === null ? null : normalize(path.join(base, value));
}

function zoneOf(dir) {
  if (dir === null) return 'unknown';
  if (dir === FRONTEND_ROOT || dir.startsWith(`${FRONTEND_ROOT}/`)) return 'frontend';
  if (dir === REPO_ROOT || dir.startsWith(`${REPO_ROOT}/`)) return 'repo';
  return 'outside';
}

/** The folder a package command acts on: its own folder option, else the statement's folder. */
function targetDir(args, optionNames, dir) {
  for (let i = 0; i < args.length; i++) {
    const lower = args[i].toLowerCase();
    if (optionNames.has(lower) && args[i + 1] !== undefined) return resolveDir(args[i + 1], dir);
    for (const name of optionNames) {
      if (lower.startsWith(`${name}=`)) return resolveDir(args[i].slice(name.length + 1), dir);
    }
  }
  return dir;
}

function firstVerb(args, valueOptions) {
  for (let i = 0; i < args.length; i++) {
    const lower = args[i].toLowerCase();
    if (!lower.startsWith('-')) return { verb: lower, index: i };
    if (valueOptions.has(lower)) i++;
  }
  return null;
}

function judgeNodeManager(program, args, dir) {
  const lower = args.map((a) => a.toLowerCase());
  const found = firstVerb(args, NODE_VALUE_OPTIONS);
  const auditFix = found?.verb === 'audit' && lower.includes('fix');
  if (!found || (!NODE_MUTATIONS.has(found.verb) && !auditFix)) return null;
  if (lower.includes('-g') || lower.includes('--global') || lower.includes('--location=global'))
    return null;
  const options = program === 'npm' ? ['--prefix', '-c'] : ['--dir', '-c', '--prefix'];
  const zone = zoneOf(targetDir(args, new Set(options), dir));
  if (zone === 'outside') return null;
  const installerFlags = lower.includes('--ignore-scripts') && lower.includes('--legacy-peer-deps');
  if (zone === 'frontend') return program === 'npm' && installerFlags ? null : DENY_NPM_IN_FRONTEND;
  return zone === 'unknown' && installerFlags ? null : DENY_NPM_IN_REPO;
}

function judgeYarn(args, dir) {
  if (zoneOf(targetDir(args, new Set(['--cwd']), dir)) !== 'frontend') return null;
  const found = firstVerb(args, new Set(['--cwd']));
  if (!found)
    return args.some((a) => YARN_READ_FLAGS.has(a.toLowerCase())) ? null : DENY_YARN_IN_FRONTEND;
  const verb = found.verb === 'workspace' ? args[found.index + 2]?.toLowerCase() : found.verb;
  return YARN_MUTATIONS.has(verb) ? DENY_YARN_IN_FRONTEND : null;
}

/** The inner command of a shell wrapper, or null when the program is not one. */
function nestedCommand(program, args) {
  const lower = args.map((a) => a.toLowerCase());
  let at = -1;
  if (SHELL_PROGRAMS.has(program)) at = lower.findIndex((a) => /^-[a-z]*c$/.test(a));
  else if (program === 'cmd') at = lower.findIndex((a) => a === '/c' || a === '/k');
  else if (POWERSHELL_PROGRAMS.has(program)) {
    at = lower.findIndex((a) => a.length > 1 && '-command'.startsWith(a));
  }
  return at < 0 ? null : args.slice(at + 1).join(' ');
}

function cdTarget(args, dir) {
  const target = args.find((a) => !a.startsWith('-'));
  if (target === undefined) return dir;
  return resolveDir(target, dir);
}

/** Returns a deny reason for the command text, or null to allow it. */
export function judge(text, cwd, depth = 0) {
  if (depth > MAX_DEPTH) return /npm|yarn/i.test(text) ? DENY_TOO_DEEP : null;
  let dir = depth === 0 ? normalize(cwd) : cwd;
  for (const statement of parseStatements(stripHeredocs(text))) {
    const words = commandWords(statement);
    if (!words.length) continue;
    const program = programName(words[0]);
    const args = words.slice(1);
    const nested = nestedCommand(program, args);
    let reason = null;
    if (CD_PROGRAMS.has(program)) dir = cdTarget(args, dir);
    else if (program === 'popd') dir = null;
    else if (nested !== null) reason = judge(nested, dir, depth + 1);
    else if (program === 'npm' || program === 'pnpm') reason = judgeNodeManager(program, args, dir);
    else if (program === 'yarn') reason = judgeYarn(args, dir);
    if (reason) return reason;
  }
  return null;
}

function readInputWithNet() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const timer = setTimeout(() => reject(new Error('stdin stayed open')), STDIN_NET_MS);
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('error', reject);
    process.stdin.on('end', () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
  });
}

async function main() {
  const raw = await readInputWithNet();
  const input = JSON.parse(raw.replace(String.fromCodePoint(0xfeff), ''));
  const tool = input.tool_name;
  const command = input.tool_input?.command;
  if ((tool !== 'Bash' && tool !== 'PowerShell') || typeof command !== 'string') return;
  const cwd = normalize(typeof input.cwd === 'string' && input.cwd ? input.cwd : process.cwd());
  const reason = judge(command, cwd);
  if (!reason) return;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  );
}

const scriptPath = (p) => normalize(realpathSync(p));
if (process.argv[1] && scriptPath(process.argv[1]) === scriptPath(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    process.stderr.write(`guard-package-root: ${error.message}\n`);
    process.exit(1);
  });
}

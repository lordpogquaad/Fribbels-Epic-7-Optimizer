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
// The wrappers in WRAPPERS (sudo, env, timeout, nice, nohup, stdbuf) are stripped with the options
// and operands their spec lists, and `env -C` / `sudo -D` move that one command's folder; other
// prefix words (exec, command, xargs, ...) drop only their flag words. Under a POSIX shell a
// `( ... )` or `$( ... )` subshell restores the folder at its close; a `case` pattern's `)` closes
// no subshell. PowerShell and cmd parentheses do not restore, so there a `cd` inside them counts.
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
// Outside the newline, return and tab string escapes this file holds no backslash characters (the
// tool-call escape normalization trap); a literal backslash is BACKSLASH.
import { realpathSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BACKSLASH = String.fromCodePoint(92);
export const STDIN_NET_MS = 5000;
const MAX_DEPTH = 3;

const trimSlashes = (p) => {
  let end = p.length;
  while (end > 0 && p[end - 1] === '/') end--;
  return p.slice(0, end);
};

const normalize = (p) => trimSlashes(path.resolve(p).split(BACKSLASH).join('/')).toLowerCase();

const REPO_ROOT = normalize(fileURLToPath(new URL('../..', import.meta.url)));
const FRONTEND_ROOT = `${REPO_ROOT}/1. app/2. frontend/1. source`;

const CD_PROGRAMS = new Set(['cd', 'chdir', 'pushd', 'push-location', 'set-location', 'sl']);
const POP_PROGRAMS = new Set(['popd', 'pop-location']);
// Wrappers that run a command: value-taking short letters and long names (prefix-matched, as
// getopt does), how many operands precede the command (timeout's DURATION), the option that runs
// the command in another folder, and whether a lone `-` is an option (env's `-i`).
const WRAPPERS = new Map([
  ['timeout', { short: 'ks', long: ['kill-after', 'signal'], operands: 1 }],
  ['nice', { short: 'n', long: ['adjustment'], operands: 0 }],
  ['nohup', { short: '', long: [], operands: 0 }],
  ['stdbuf', { short: 'ioe', long: ['input', 'output', 'error'], operands: 0 }],
  [
    'sudo',
    {
      short: 'CDgprRtTUu',
      long: [
        'close-from',
        'chdir',
        'group',
        'host',
        'prompt',
        'chroot',
        'role',
        'type',
        'command-timeout',
        'other-user',
        'user',
      ],
      operands: 0,
      chdir: 'D',
    },
  ],
  ['env', { short: 'uC', long: ['unset', 'chdir'], operands: 0, chdir: 'C', dash: true }],
]);
const SUBSHELL_OPEN = Object.freeze(['(']);
const SUBSHELL_CLOSE = Object.freeze([')']);
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
  'rebuild',
  'rb',
  'shrinkwrap',
]);
const PKG_WRITES = new Set(['set', 'delete', 'fix']);
const YARN_MUTATIONS = new Set([
  'install',
  'add',
  'remove',
  'up',
  'upgrade',
  'upgrade-interactive',
  'dedupe',
  'link',
  'unlink',
  'set',
  'import',
  'patch-commit',
]);
const YARN_READ_FLAGS = new Set(['--version', '-v', '--help', '-h']);

const INSTALLER = 'pwsh -File "1. App/1. Master/2. PS1/install_frontend.ps1"';
const DENY_NPM_IN_REPO = `guard-package-root: "1. App" is a Yarn 4 project, so use yarn there. The renderer tree installs through ${INSTALLER}.`;
const DENY_NPM_IN_FRONTEND = `guard-package-root: the renderer tree installs through ${INSTALLER}. A targeted npm command there needs --ignore-scripts and --legacy-peer-deps.`;
const DENY_YARN_IN_FRONTEND = `guard-package-root: "1. App/2. Frontend/1. Source" is npm-managed by ${INSTALLER}. Never run yarn there.`;
const DENY_TOO_DEEP =
  'guard-package-root: shell nesting is too deep to judge. Run the package command directly.';

const SHELL_FED_LINE = /(^|[ |])(bash|sh|zsh|pwsh|powershell)([ .]|$)/i;
const HEREDOC_OPENER = /<<-? *['"]?([a-z0-9_]+)['"]?/i;
const REDIRECT = /^[0-9*]*(>>?|<<?-?|&>>?)(.*)$/;
const ASSIGNMENT = /^[a-z_][a-z0-9_]*=/i;
const ENV_REFERENCE = /[$][{]?(?:env:)?([a-z_][a-z0-9_]*)}?/gi;

const isHereString = (trimmed) => trimmed.endsWith("@'") || trimmed.endsWith('@"');

/** The index of the line closing a heredoc or here-string opened at line i, or -1. */
function closingLine(lines, i) {
  const line = lines[i];
  const opener = HEREDOC_OPENER.exec(line);
  const trimmed = line.trimEnd();
  if (opener && !SHELL_FED_LINE.test(line)) {
    return lines.findIndex((l, j) => j > i && l.trim() === opener[1]);
  }
  if (!isHereString(trimmed)) return -1;
  const closer = `${trimmed.at(-1)}@`;
  return lines.findIndex((l, j) => j > i && l.trimStart().startsWith(closer));
}

/** Drops heredoc and here-string bodies, keeping the text when no closing line exists. */
function stripHeredocs(text) {
  const lines = text.split('\n');
  const kept = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const close = closingLine(lines, i);
    if (close < 0) {
      kept.push(line);
      i++;
    } else {
      const trimmed = line.trimEnd();
      kept.push(isHereString(trimmed) ? trimmed.slice(0, -2) : line);
      i = close + 1;
    }
  }
  return kept.join('\n');
}

// Words that may precede a `case` or `esac` keyword in its command position.
const CASE_LEADS = new Set([
  'then',
  'do',
  'else',
  'elif',
  'if',
  'while',
  'until',
  'time',
  '!',
  '{',
]);

/**
 * Tracks `case WORD in ... esac` on each finished word; true when the word is consumed. Each open
 * case is a frame: 'head' until `in`, then 'pattern' until `)`, then 'body' until `;;` or `esac`.
 */
function caseWord(s, word) {
  const top = s.cases.at(-1);
  if (top?.state === 'head') {
    top.words++;
    if (top.words < 2 || word !== 'in') return false;
    top.state = 'pattern';
    s.words = [];
    return true;
  }
  if (s.wordQuoted || !s.words.every((w) => CASE_LEADS.has(w))) return false;
  if (word === 'esac' && top) {
    s.cases.pop();
    return true;
  }
  if (word === 'case' && top?.state !== 'pattern') s.cases.push({ state: 'head', words: 0 });
  return false;
}

const endWord = (s) => {
  if (s.word !== null && !caseWord(s, s.word)) s.words.push(s.word);
  s.word = null;
  s.wordQuoted = false;
};

const endStatement = (s) => {
  endWord(s);
  if (s.words.length) s.statements.push(s.words);
  s.words = [];
};

const appendToWord = (s, text) => {
  s.word = `${s.word ?? ''}${text}`;
};

function readQuoted(s, c, next) {
  if (s.quote === '"' && c === BACKSLASH && next === '"') {
    s.word += '"';
    s.i++;
  } else if (c === s.quote) s.quote = null;
  else s.word += c === BACKSLASH ? '/' : c;
}

function readEscape(s, c, next) {
  if (next === '\n' || next === '\r') {
    s.i += next === '\r' && s.text[s.i + 2] === '\n' ? 2 : 1;
  } else if (c === BACKSLASH && next === ' ') {
    appendToWord(s, ' ');
    s.i++;
  } else if (c === BACKSLASH) appendToWord(s, '/');
}

const endsStatement = (c, previous, next) =>
  '\n;|'.includes(c) || (c === '&' && previous !== '>' && next !== '>');

/** Ends the statement at a parenthesis and records it as a subshell marker. */
function readParen(s, c) {
  endStatement(s);
  s.statements.push(c === '(' ? SUBSHELL_OPEN : SUBSHELL_CLOSE);
}

/**
 * Reads a character that means something else inside an open case: in a pattern, `|` and a newline
 * only end a word, `(` is dropped and `)` ends the pattern (its words are not a command); in a
 * body, `;;`, `;&` and `;;&` end the item. False when the character reads as usual.
 */
function readCaseChar(s, c, next) {
  const top = s.cases.at(-1);
  if (top.state === 'pattern') {
    if (!'()|\n'.includes(c)) return false;
    endWord(s);
    if (c !== ')') return true;
    if (s.cases.at(-1) !== top) return false;
    s.words = [];
    top.state = 'body';
    return true;
  }
  if (top.state !== 'body' || c !== ';' || (next !== ';' && next !== '&')) return false;
  endStatement(s);
  s.i += next === ';' && s.text[s.i + 2] === '&' ? 2 : 1;
  top.state = 'pattern';
  return true;
}

/** Reads one character, or a whole comment, and moves past it. */
function readNext(s) {
  const c = s.text[s.i];
  const next = s.text[s.i + 1];
  if (s.quote === null && c === '#' && s.word === null) {
    const end = s.text.indexOf('\n', s.i);
    s.i = end < 0 ? s.text.length : end;
    return;
  }
  if (s.quote !== null) readQuoted(s, c, next);
  else if (c === BACKSLASH || c === '`') readEscape(s, c, next);
  else if (c === '"' || c === "'") {
    s.word ??= '';
    s.wordQuoted = true;
    s.quote = c;
  } else if (s.cases.length && readCaseChar(s, c, next)) {
    // consumed by the open case
  } else if (c === '(' || c === ')') readParen(s, c);
  else if (endsStatement(c, s.text[s.i - 1], next)) endStatement(s);
  else if (' \t\r'.includes(c)) endWord(s);
  else appendToWord(s, c);
  s.i++;
}

/** Splits text into statements of words, honoring quotes and escapes. */
function parseStatements(text) {
  const s = {
    text,
    i: 0,
    word: null,
    wordQuoted: false,
    quote: null,
    words: [],
    statements: [],
    cases: [],
  };
  while (s.i < text.length) readNext(s);
  endStatement(s);
  return s.statements;
}

function withoutRedirections(statement) {
  const words = [];
  for (let i = 0; i < statement.length; i++) {
    const redirect = REDIRECT.exec(statement[i]);
    if (redirect) {
      if (redirect[2] === '') i++;
    } else if (!DROPPED_WORDS.has(statement[i])) {
      words.push(statement[i]);
    }
  }
  return words;
}

/**
 * One wrapper option: its width in words (2 when its value is the next word), and its value when
 * it is the spec's change-folder option (`env -C`, `sudo -D`, `--chdir`), else undefined.
 */
function readOption(word, next, spec) {
  if (word.startsWith('--')) {
    const [name, attached] = word.slice(2).split(/=(.*)/s);
    const match = spec.long.find((l) => l.startsWith(name));
    const width = attached === undefined && match ? 2 : 1;
    const chdir = match === 'chdir' ? (attached ?? next) : undefined;
    return { width, chdir };
  }
  const at = [...word.slice(1)].findIndex((ch) => spec.short.includes(ch));
  const width = at >= 0 && at === word.length - 2 ? 2 : 1;
  const value = width === 2 ? next : word.slice(at + 2);
  return { width, chdir: at >= 0 && word[at + 1] === spec.chdir ? value : undefined };
}

/**
 * Drops a wrapper such as timeout with its options and operands, leaving its command. Returns the
 * folder its change-folder option names, or null.
 */
function stripWrapper(words, spec) {
  words.shift();
  let chdir = null;
  while (words[0]?.startsWith('-') && (words[0] !== '-' || spec.dash)) {
    if (words[0] === '--') {
      words.shift();
      break;
    }
    const option = readOption(words[0], words[1], spec);
    if (option.chdir !== undefined) chdir = option.chdir;
    words.splice(0, option.width);
  }
  words.splice(0, spec.operands);
  return chdir;
}

/** The folder after a subshell marker: an open saves it, a close restores the saved one. */
function afterMarker(marker, dir, saved) {
  if (marker === SUBSHELL_OPEN) saved.push(dir);
  else if (saved.length) return saved.pop();
  return dir;
}

/**
 * Removes redirections, assignments and wrapper words, leaving program + arguments. A wrapper's
 * change-folder option moves `at.dir` for this command only.
 */
function commandWords(statement, at = { dir: null }) {
  const words = withoutRedirections(statement);
  while (words.length) {
    const first = words[0].toLowerCase();
    const wrapper = WRAPPERS.get(programName(words[0]));
    if (ASSIGNMENT.test(words[0])) words.shift();
    else if (PREFIX_WORDS.has(first)) {
      words.shift();
      while (words[0]?.startsWith('-')) words.shift();
    } else if (wrapper) {
      const chdir = stripWrapper(words, wrapper);
      if (chdir !== null) at.dir = resolveDir(chdir, at.dir);
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
  if (value.length > 2 && value[0] === '/' && value[2] === '/' && /[a-z]/i.test(value[1])) {
    value = `${value[1]}:/${value.slice(3)}`;
  }
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
  const lower = new Set(args.map((a) => a.toLowerCase()));
  const found = firstVerb(args, NODE_VALUE_OPTIONS);
  const auditFix = found?.verb === 'audit' && lower.has('fix');
  const sub = found && firstVerb(args.slice(found.index + 1), NODE_VALUE_OPTIONS);
  const pkgWrite = found?.verb === 'pkg' && PKG_WRITES.has(sub?.verb);
  if (!found || (!NODE_MUTATIONS.has(found.verb) && !auditFix && !pkgWrite)) return null;
  if (lower.has('-g') || lower.has('--global') || lower.has('--location=global')) return null;
  const options = program === 'npm' ? ['--prefix', '-c'] : ['--dir', '-c', '--prefix'];
  const zone = zoneOf(targetDir(args, new Set(options), dir));
  if (zone === 'outside') return null;
  const installerFlags = lower.has('--ignore-scripts') && lower.has('--legacy-peer-deps');
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

/**
 * Returns a deny reason for the command text, or null to allow it. `shell` is 'posix' when
 * parentheses open a subshell (Bash), anything else when they only group (PowerShell, cmd).
 */
export function judge(text, cwd, depth = 0, shell = 'posix') {
  if (depth > MAX_DEPTH) return /npm|yarn/i.test(text) ? DENY_TOO_DEEP : null;
  let dir = depth === 0 ? normalize(cwd) : cwd;
  const saved = [];
  for (const statement of parseStatements(stripHeredocs(text))) {
    if (statement === SUBSHELL_OPEN || statement === SUBSHELL_CLOSE) {
      if (shell === 'posix') dir = afterMarker(statement, dir, saved);
      continue;
    }
    const at = { dir };
    const words = commandWords(statement, at);
    if (!words.length) continue;
    const program = programName(words[0]);
    const args = words.slice(1);
    const nested = nestedCommand(program, args);
    let reason = null;
    if (CD_PROGRAMS.has(program)) dir = cdTarget(args, at.dir);
    else if (POP_PROGRAMS.has(program)) dir = null;
    else if (nested !== null) {
      reason = judge(nested, at.dir, depth + 1, SHELL_PROGRAMS.has(program) ? 'posix' : 'other');
    } else if (program === 'npm' || program === 'pnpm')
      reason = judgeNodeManager(program, args, at.dir);
    else if (program === 'yarn') reason = judgeYarn(args, at.dir);
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
  const reason = judge(command, cwd, 0, tool === 'Bash' ? 'posix' : 'other');
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
  try {
    await main();
  } catch (error) {
    process.stderr.write(`guard-package-root: ${error.message}\n`);
    process.exit(1);
  }
}

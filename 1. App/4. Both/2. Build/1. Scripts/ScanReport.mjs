import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Report-only: `yarn scan`. Runs every report-only check (strict ESLint, strict typecheck, PMD,
// Ruff, mypy, Stylelint, markdownlint, knip, dependency-cruiser, jscpd) through its own `yarn`
// script, so each tool's config stays the one source, and writes one Markdown summary of counts per
// tool and rule beside the other generated reports. Counts and rule names only, no per-finding dumps.
// Each check runs in its own child process with its own exit code and timeout, one after another, so
// no check can stop the others. A check is "ok" only when its exit code is one it is allowed to
// return AND its output parsed; anything else is reported as FAILED or TIMEOUT with its RC and never
// as zero findings. Exit 0 = every check ran, findings or not. Exit 1 = at least one check could not
// run (the summary line names which). The report is written either way.
// Side effects of the checks themselves: typecheck:strict:report rewrites TYPECHECK-REPORT.md,
// lint:java writes 3. Backend/1. Source/target/ (pmd.xml is read straight after, before any clean).

const appDir = path.resolve(import.meta.dirname, '../../..');
const repoDir = path.resolve(appDir, '..');
const outFile = path.join(repoDir, '.claude/plans/SCAN-REPORT.md');
const typecheckReport = path.join(repoDir, '.claude/plans/TYPECHECK-REPORT.md');
const pmdXml = path.join(appDir, '3. Backend/1. Source/target/pmd.xml');
const regenerate = 'yarn scan';
const defaultTimeoutMs = 10 * 60 * 1000;

const ansi = new RegExp(`${String.fromCodePoint(27)}${String.raw`\[[0-9;]*m`}`, 'g');
const stripAnsi = (text) => text.replaceAll(ansi, '');
const bump = (map, key, by = 1) => map.set(key, (map.get(key) ?? 0) + by);
const sum = (map) => [...map.values()].reduce((a, b) => a + b, 0);

// A parser returns { rules: Map<rule, count>, files: number }, or throws when the output is not
// the shape the tool is known to print (which makes the check FAILED, never clean).
const parseJson = (text, what) => {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${what} output was not parseable JSON`);
  }
};
// Stylelint prints its JSON on stderr, the others on stdout: take whichever one holds JSON.
const jsonFrom = (run, what) => {
  for (const text of [run.stdout, run.stderr]) {
    if (text.trim().startsWith('[') || text.trim().startsWith('{')) return parseJson(text, what);
  }
  throw new Error(`${what} output was not parseable JSON`);
};

const parseEslint = (run) => {
  const results = jsonFrom(run, 'eslint');
  if (!Array.isArray(results)) throw new TypeError('eslint JSON was not an array');
  const rules = new Map();
  let files = 0;
  for (const result of results) {
    if (result.messages.length > 0) files += 1;
    for (const m of result.messages) bump(rules, m.ruleId ?? '(no rule: parse error)');
  }
  return { rules, files };
};

// The script writes TYPECHECK-REPORT.md; its counts are read back from that file and cross-checked
// against the line the script prints, so a stale or half-written file cannot pass.
const parseTypecheck = (run, ctx) => {
  const printed = /^(\d+) errors in (\d+) files/m.exec(run.stdout);
  if (!printed) throw new Error('typecheck printed no "N errors in M files" line');
  if (fs.statSync(typecheckReport).mtimeMs < ctx.startedAt - 2000) {
    throw new Error('TYPECHECK-REPORT.md was not rewritten by this run');
  }
  const md = fs.readFileSync(typecheckReport, 'utf8');
  const total = /^Total: (\d+) errors in (\d+) files\./m.exec(md);
  if (total?.[1] !== printed[1]) {
    throw new Error('TYPECHECK-REPORT.md total does not match the printed total');
  }
  const section =
    /## By error code\r?\n\r?\n\| Code \| Errors \|\r?\n\| --- \| --- \|\r?\n([^#]*)/.exec(md);
  const rules = new Map();
  for (const row of (section?.[1] ?? '').split(/\r?\n/)) {
    const m = /^\| (TS\d+) \| (\d+) \|$/.exec(row);
    if (m) bump(rules, m[1], Number(m[2]));
  }
  if (sum(rules) !== Number(total[1]))
    throw new Error('error-code table does not add up to the total');
  return { rules, files: Number(total[2]) };
};

// PMD: pmd.xml is read right after lint:java (mvn clean removes it); it must be from this run.
const parsePmd = (run, ctx) => {
  if (!fs.existsSync(pmdXml) || fs.statSync(pmdXml).mtimeMs < ctx.startedAt - 2000) {
    throw new Error('target/pmd.xml was not written by this run');
  }
  const xml = fs.readFileSync(pmdXml, 'utf8');
  if (!xml.includes('</pmd>')) throw new Error('target/pmd.xml is incomplete');
  const rules = new Map();
  for (const m of xml.matchAll(/<violation\b[^>]*?\brule="([^"]+)"/g)) bump(rules, m[1]);
  for (const m of xml.matchAll(/<(error|configerror)\b/g)) {
    bump(rules, m[1] === 'error' ? '(PMD processing error)' : '(PMD config error)');
  }
  const files = [...xml.matchAll(/<file\b[^>]*>\s*<violation\b/g)].length;
  const printed = /PMD [\d.]+ has found (\d+) violations/.exec(stripAnsi(run.stdout));
  const violations = [...xml.matchAll(/<violation\b/g)].length;
  if (printed && Number(printed[1]) !== violations) {
    throw new Error('pmd.xml violation count does not match the Maven summary line');
  }
  return { rules, files };
};

const parseRuff = (run) => {
  const findings = parseJson(run.stdout, 'ruff');
  if (!Array.isArray(findings)) throw new TypeError('ruff JSON was not an array');
  const rules = new Map();
  const files = new Set();
  for (const f of findings) {
    bump(rules, f.code ?? '(syntax error)');
    files.add(f.filename);
  }
  return { rules, files: files.size };
};

const parseMypy = (run) => {
  const text = stripAnsi(`${run.stdout}\n${run.stderr}`);
  const rules = new Map();
  const files = new Set();
  for (const raw of text.split(/\r?\n/)) {
    const m = /^(.+?):\d+(?::\d+)?: error: (.*)$/.exec(raw);
    if (m) {
      bump(rules, /\[([\w-]+)\]$/.exec(m[2])?.[1] ?? '(no code)');
      files.add(m[1]);
    }
  }
  const clean = /^Success: no issues found/m.test(text);
  const found = /^Found (\d+) errors? in (\d+) files?/m.exec(text);
  if (clean ? sum(rules) !== 0 : !found || Number(found[1]) !== sum(rules)) {
    throw new Error('mypy output did not match its own summary line');
  }
  return { rules, files: files.size };
};

const parseStylelint = (run) => {
  const results = jsonFrom(run, 'stylelint');
  if (!Array.isArray(results)) throw new TypeError('stylelint JSON was not an array');
  const rules = new Map();
  let files = 0;
  for (const result of results) {
    const problems = [...result.warnings, ...(result.parseErrors ?? [])];
    if (problems.length > 0) files += 1;
    for (const w of problems) bump(rules, w.rule ?? '(no rule: parse error)');
  }
  return { rules, files };
};

const parseMarkdownlint = (run) => {
  const text = stripAnsi(`${run.stdout}\n${run.stderr}`);
  const summary = /^Summary: (\d+) (?:issues?|errors?)/m.exec(text);
  if (!summary) throw new Error('markdownlint printed no Summary line');
  const rules = new Map();
  const files = new Set();
  for (const raw of text.split(/\r?\n/)) {
    const m = /^(.+?):\d+(?::\d+)? (?:error|warning) (MD\d+)\//.exec(raw);
    if (m) {
      bump(rules, m[2]);
      files.add(m[1]);
    }
  }
  if (sum(rules) !== Number(summary[1])) {
    throw new Error('markdownlint finding lines do not match its Summary line');
  }
  return { rules, files: files.size };
};

// knip --reporter json: one entry per file, each holding arrays per issue type.
const parseKnip = (run) => {
  const data = parseJson(run.stdout, 'knip');
  if (!Array.isArray(data.issues)) throw new TypeError('knip JSON has no issues array');
  const rules = new Map();
  let files = 0;
  for (const entry of data.issues) {
    let own = 0;
    for (const [key, value] of Object.entries(entry)) {
      if (Array.isArray(value) && value.length > 0) {
        bump(rules, key, value.length);
        own += value.length;
      }
    }
    if (own > 0) files += 1;
  }
  return { rules, files };
};

// dependency-cruiser --output-type json: summary.violations, each with a rule name and severity.
const parseDepcruise = (run) => {
  const data = parseJson(run.stdout, 'dependency-cruiser');
  if (!Array.isArray(data.summary?.violations))
    throw new TypeError('depcruise JSON has no summary');
  const rules = new Map();
  const files = new Set();
  for (const v of data.summary.violations) {
    bump(rules, `${v.rule.name} (${v.rule.severity})`);
    files.add(v.from);
  }
  return { rules, files: files.size };
};

// jscpd has only a console reporter configured: count clones by format from its own table.
const parseJscpd = (run) => {
  const text = stripAnsi(run.stdout);
  const found = /^Found (\d+) clones\./m.exec(text);
  if (!found) throw new Error('jscpd printed no "Found N clones" line');
  const rules = new Map();
  for (const raw of text.split(/\r?\n/)) {
    const m = /^│\s*(\w+)\s*│\s*\d+\s*│\s*\d+\s*│\s*\d+\s*│\s*(\d+)\s*│/.exec(raw);
    if (m) bump(rules, m[1], Number(m[2]));
  }
  const files = new Set();
  for (const m of text.matchAll(/^ *(?:-|\d+\.) (.+) \[\d+:\d+ - \d+:\d+\]/gm)) files.add(m[1]);
  if (sum(rules) !== Number(found[1]))
    throw new Error('jscpd format table does not match its total');
  return { rules, files: files.size };
};

// `okRcs` are the exit codes that mean "the tool ran" (a findings exit included).
const checks = [
  { name: 'lint:strict', args: ['-f', 'json'], okRcs: [0, 1], parse: parseEslint, rule: 'Rule' },
  { name: 'typecheck:strict:report', okRcs: [0], parse: parseTypecheck, rule: 'Code' },
  { name: 'lint:java', okRcs: [0], parse: parsePmd, rule: 'PMD rule' },
  {
    name: 'lint:py',
    args: ['--output-format', 'json'],
    okRcs: [0],
    parse: parseRuff,
    rule: 'Rule',
  },
  { name: 'lint:py:types', okRcs: [0, 1], parse: parseMypy, rule: 'Error code' },
  { name: 'lint:styles', args: ['-f', 'json'], okRcs: [0, 2], parse: parseStylelint, rule: 'Rule' },
  { name: 'lint:md', okRcs: [0, 1], parse: parseMarkdownlint, rule: 'Rule' },
  {
    name: 'lint:dead',
    args: ['--reporter', 'json'],
    okRcs: [0, 1],
    parse: parseKnip,
    rule: 'Issue type',
  },
  {
    name: 'lint:deps-graph',
    args: ['--output-type', 'json'],
    okRcs: [0],
    parse: parseDepcruise,
    rule: 'Rule (severity)',
  },
  { name: 'lint:dupes', okRcs: [0], parse: parseJscpd, rule: 'Format' },
];

// `shell: true` is needed because `yarn` is a .cmd shim on Windows (spawnSync refuses to start a
// .cmd without a shell). The command is one string of fixed words with no spaces inside any of
// them, so nothing needs quoting (and an args array with a shell only draws a Node deprecation).
export const runCheck = (check) => {
  const startedAt = Date.now();
  const timeoutMs = check.timeoutMs ?? defaultTimeoutMs;
  const run = spawnSync(`yarn ${[check.name, ...(check.args ?? [])].join(' ')}`, {
    cwd: appDir,
    encoding: 'utf8',
    shell: true,
    timeout: timeoutMs,
    maxBuffer: 1024 * 1024 * 1024,
  });
  const result = { check, rc: run.status, ms: Date.now() - startedAt };
  const fail = (status, reason) => ({ ...result, status, reason, run });
  if (run.error?.code === 'ETIMEDOUT') {
    return fail('TIMEOUT', `timed out after ${(timeoutMs / 1000).toFixed(1)} s`);
  }
  if (run.error) return fail('FAILED', `did not start: ${run.error.message}`);
  if (!check.okRcs.includes(run.status)) {
    return fail('FAILED', `exit ${run.status}, expected ${check.okRcs.join(' or ')}`);
  }
  try {
    const { rules, files } = check.parse(run, { startedAt });
    return { ...result, status: 'ok', rules, files, findings: sum(rules) };
  } catch (error) {
    return fail('FAILED', `exit ${run.status}, ${error.message}`);
  }
};

const cell = (text) => String(text).replaceAll('|', String.raw`\|`);
const seconds = (ms) => `${(ms / 1000).toFixed(1)} s`;

export const render = (results) => {
  const failed = results.filter((r) => r.status !== 'ok');
  const out = [
    '# Scan report',
    '',
    `Generated by \`${regenerate}\` (run from \`1. App/\`). It runs every report-only check, each through its own \`yarn\` script and config, in its own process with its own timeout, and counts findings per tool and rule. Nothing was fixed. A check that could not run shows \`FAILED\` or \`TIMEOUT\` with its exit code and has no finding count: it is never a clean tool.`,
    '',
    failed.length === 0
      ? `Checks: all ${results.length} ran.`
      : `Checks: ${results.length - failed.length} of ${results.length} ran; **${failed.length} could not run**: ${failed.map((r) => r.check.name).join(', ')}.`,
    '',
    '| Tool | Status | RC | Findings | Files | Duration |',
    '| --- | --- | --- | --- | --- | --- |',
    ...results.map((r) => {
      const ran = r.status === 'ok';
      return `| \`${r.check.name}\` | ${r.status} | ${r.rc ?? 'none'} | ${ran ? r.findings : 'n/a'} | ${ran ? r.files : 'n/a'} | ${seconds(r.ms)} |`;
    }),
  ];
  for (const r of results) {
    out.push('', `## ${r.check.name}`, '');
    if (r.status !== 'ok') {
      out.push(`Did not run (${r.status}): ${cell(r.reason)}.`);
    } else if (r.findings === 0) {
      out.push('No findings.');
    } else {
      const rows = [...r.rules.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      out.push(
        `${r.findings} findings in ${r.files} files.`,
        '',
        `| ${r.check.rule} | Count |`,
        '| --- | --- |',
        ...rows.map(([rule, n]) => `| ${cell(rule)} | ${n} |`),
      );
    }
  }
  return `${out.join('\n')}\n`;
};

// Only the entry point below runs checks; importing this module (a test, a scratch probe) does not.
if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  const results = [];
  for (const check of checks) {
    const result = runCheck(check);
    results.push(result);
    console.log(
      `${check.name}: ${result.status} (rc ${result.rc ?? 'none'}, ${seconds(result.ms)})${
        result.status === 'ok' ? `, ${result.findings} findings` : `, ${result.reason}`
      }`,
    );
    if (result.status !== 'ok') {
      const tail = `${result.run?.stdout ?? ''}${result.run?.stderr ?? ''}`.trim().slice(-600);
      if (tail) console.error(`--- last output of ${check.name} ---\n${tail}`);
    }
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, render(results));
  const failed = results.filter((r) => r.status !== 'ok');
  console.log(`-> ${path.relative(repoDir, outFile)}`);
  if (failed.length > 0) {
    console.error(
      `scan: ${failed.length} check(s) could not run: ${failed.map((r) => r.check.name).join(', ')}`,
    );
    process.exit(1);
  }
}

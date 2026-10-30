// Mirror of .claude/hooks/guard-package-root.mjs. Run: yarn test:hooks (from 1. App).
const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test } = require('node:test');

const root = path.resolve(__dirname, '../..');
const hook = path.join(root, '.claude/hooks/guard-package-root.mjs');
const source = '"1. App/2. Frontend/1. Source"';
const load = () => import(pathToFileURL(hook).href);

const npmPath = path.join(root, '1. App');
const outside = path.resolve(root, '..');

const denied = [
  ['bare install at the repo root', 'npm install'],
  ['install from 1. App', 'cd "1. App" && npm install'],
  ['bare install in the renderer tree', `cd ${source} && npm install`],
  ['add in the renderer tree', `cd ${source} && npm add left-pad`],
  ['pnpm in the renderer tree', `cd ${source} && pnpm install`],
  ['option before the verb', 'npm --prefix "1. App" install'],
  ['value option before the verb', 'npm --loglevel=error install'],
  ['uninstall aliases', 'npm rm left-pad'],
  ['audit fix', 'npm audit fix'],
  ['Windows shim', 'npm.cmd install'],
  ['PowerShell call operator', '& "npm" install'],
  ['tab separator', 'npm\tinstall'],
  ['cmd wrapper', 'cmd /c npm install'],
  ['bash wrapper', 'bash -c "npm install"'],
  ['corepack wrapper', 'corepack npm install'],
  ['second line', 'echo hi\nnpm install'],
  ['unresolved folder', 'cd "$NOT_A_SET_VARIABLE_HERE" && npm install'],
  ['yarn install in the renderer tree', `cd ${source} && yarn install`],
  ['bare yarn', `cd ${source} && yarn`],
  ['bare yarn on the next line', `cd ${source}\nyarn`],
  ['redirected bare yarn', `cd ${source} && yarn 2>&1 | tail -3`],
  ['yarn to a log', `cd ${source} && yarn > log.txt`],
  ['yarn with only flags', `cd ${source} && yarn --immutable`],
  ['yarn --cwd', `yarn --cwd ${source} install`],
  ['escaped spaces', 'cd 1.\\ App/2.\\ Frontend/1.\\ Source && yarn install'],
  ['backslash path', 'cd "1. App\\2. Frontend\\1. Source"; yarn add x'],
  ['corepack yarn', `cd ${source} && corepack yarn install`],
  ['heredoc fed to a shell', 'bash <<EOF\nnpm install\nEOF'],
];

const allowed = [
  ['commit message', 'git commit -m "npm install fixed"'],
  ['echo', 'echo "npm install"'],
  ['grep', 'grep -n "npm install" README.md'],
  ['grep in the renderer manifest', `grep -n "yarn add" ${source}/package.json`],
  ['heredoc body', "cat > x.txt <<'EOF'\nnpm install\nEOF"],
  ['comment', '# npm install\nls'],
  ['PowerShell here-string', "$a = @'\nnpm install\n'@"],
  ['read-only npm', 'npm ls'],
  ['npm view', 'npm view eslint version'],
  ['npm run', 'npm run build'],
  ['npx', 'npx prettier --check x'],
  ['installer script', 'pwsh -File "1. App/1. Master/2. PS1/install_frontend.ps1"'],
  ['global install', 'npm i -g typescript'],
  ['other folder', `cd "${outside}" && npm install`],
  ['other folder lockfile audit', `cd "${outside}" && npm i --package-lock-only`],
  [
    'flags in the renderer tree',
    `npm update --prefix ${source} x --ignore-scripts --legacy-peer-deps`,
  ],
  [
    'flags with an unresolved folder',
    'npm update --prefix "$NOT_A_SET_VARIABLE_HERE" x --ignore-scripts --legacy-peer-deps',
  ],
  ['yarn in 1. App', 'cd "1. App" && yarn install'],
  ['yarn scripts in the renderer tree', `cd ${source} && yarn lint`],
  ['yarn version in the renderer tree', `cd ${source} && yarn --version`],
  ['path named by a later statement', `yarn install --mode=skip-build && ls ${source}`],
  [
    'documented outer coupling',
    'yarn install && npx electron-rebuild --module-dir "2. Frontend/1. Source"',
  ],
  ['stderr merge', 'yarn lint 2>&1'],
];

for (const [name, command] of denied) {
  test(`deny: ${name}`, async () => {
    const { judge } = await load();
    assert.ok(judge(command, root.split(path.sep).join('/').toLowerCase()), command);
  });
}

for (const [name, command] of allowed) {
  test(`allow: ${name}`, async () => {
    const { judge } = await load();
    assert.equal(judge(command, root.split(path.sep).join('/').toLowerCase()), null, command);
  });
}

test('one mention of the renderer tree does not excuse another statement', async () => {
  const { judge } = await load();
  assert.ok(judge(`npm install && git add ${source}/package.json`, root));
});

test('the payload cwd counts', async () => {
  const { judge } = await load();
  const inner = path.join(root, '1. App/2. Frontend/1. Source');
  assert.ok(judge('yarn install', inner));
  assert.equal(judge('npm ls', inner), null);
  assert.equal(judge('yarn install', npmPath), null);
});

test('nesting past the cap denies a package command', async () => {
  const { judge } = await load();
  let command = 'npm ls';
  for (let i = 0; i < 6; i++) command = `bash -c '${command.replaceAll("'", '')}'`;
  assert.ok(judge(command, root));
});

const run = (payload) => spawnSync('node', [hook], { input: payload, encoding: 'utf8' });

test('spawned: a deny prints one JSON decision at exit 0', () => {
  const r = run(
    JSON.stringify({ tool_name: 'Bash', cwd: root, tool_input: { command: 'npm install' } }),
  );
  assert.equal(r.status, 0);
  assert.equal(JSON.parse(r.stdout).hookSpecificOutput.permissionDecision, 'deny');
});

test('spawned: an allow prints nothing at exit 0', () => {
  const r = run(
    JSON.stringify({ tool_name: 'Bash', cwd: root, tool_input: { command: 'npm ls' } }),
  );
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
});

test('spawned: a BOM-prefixed payload is still judged', () => {
  const payload = JSON.stringify({
    tool_name: 'PowerShell',
    cwd: root,
    tool_input: { command: 'npm install' },
  });
  assert.match(run(String.fromCodePoint(0xfeff) + payload).stdout, /deny/);
});

test('spawned: other tools pass', () => {
  const r = run(JSON.stringify({ tool_name: 'Read', tool_input: { file_path: 'x' } }));
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
});

test('spawned: an unparsable payload exits 1, which blocks under onFailure', () => {
  assert.equal(run('not json').status, 1);
});

test('spawned: a held-open stdin exits 1 inside the wiring timeout', async () => {
  const { STDIN_NET_MS } = await load();
  assert.ok(STDIN_NET_MS < 30000);
  const child = spawn('node', [hook], { stdio: ['pipe', 'ignore', 'ignore'] });
  child.stdin.write('{');
  const code = await new Promise((resolve) => child.on('exit', resolve));
  assert.equal(code, 1);
});

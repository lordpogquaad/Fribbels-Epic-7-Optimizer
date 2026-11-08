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
  ['timeout wrapper', 'timeout 120 npm install'],
  ['timeout with a kill-after value', 'timeout -k 5 120 npm install'],
  ['timeout with an attached signal', 'timeout -sKILL 120 npm install'],
  ['timeout with a long option', 'timeout --signal TERM 120 npm install'],
  ['nohup wrapper', 'nohup npm install'],
  ['nice wrapper', 'nice npm install'],
  ['nice with an adjustment', 'nice -n 10 npm install'],
  ['nice with a dash adjustment', 'nice -5 npm install'],
  ['stdbuf wrapper', 'stdbuf -o L npm install'],
  ['stacked wrappers', 'sudo timeout 60 nohup npm ci'],
  ['timeout yarn in the renderer tree', `cd ${source} && timeout 300 yarn install`],
  ['Push-Location into the renderer tree', `Push-Location ${source}; yarn install`],
  ['yarn upgrade-interactive', `cd ${source} && yarn upgrade-interactive`],
  ['yarn link', `cd ${source} && yarn link ../x`],
  ['yarn unlink', `cd ${source} && yarn unlink x`],
  ['yarn set version', `cd ${source} && yarn set version stable`],
  ['yarn import', `cd ${source} && yarn import`],
  ['yarn patch-commit', `cd ${source} && yarn patch-commit -s x`],
  ['npm rebuild in the renderer tree', `cd ${source} && npm rebuild`],
  ['npm rb', 'npm rb'],
  ['npm shrinkwrap', 'npm shrinkwrap'],
  ['npm pkg set', 'npm pkg set dependencies.x=1'],
  ['npm pkg delete', 'npm pkg delete scripts.x'],
  ['npm pkg fix', 'npm pkg fix'],
  ['cd inside a subshell counts inside it', `(cd ${source} && yarn install)`],
  ['an inner subshell restores one level', `(cd ${source} && (cd ..) && yarn install)`],
  [
    'PowerShell parentheses keep the folder',
    `pwsh -Command '(Set-Location ${source}); yarn install'`,
  ],
  ['a case pattern ends no subshell', `(cd ${source}; case $x in a) echo;; esac; yarn add x)`],
  ['a parenthesized case pattern', `(cd ${source}; case $x in (a) echo;; esac; yarn add x)`],
  ['a nested case', `(cd ${source}; case $x in a) case $y in b) echo;; esac;; esac; yarn add x)`],
  ['a cd in a case body stays in its subshell', '(case $x in a) cd /tmp;; esac); npm install'],
  ['yarn in a case body', `cd ${source}; case $x in a) yarn add x;; esac`],
  ['a function body cd still counts', `f() { cd ${source}; }; yarn add x`],
  ['sudo with a user', 'sudo -u bob npm install'],
  ['sudo with a group', 'sudo -g staff npm install'],
  ['sudo with an attached user', 'sudo -ubob npm install'],
  ['sudo --chdir into the renderer tree', `sudo -D ${source} yarn add x`],
  ['env with an unset', 'env -u X npm install'],
  ['env -C into the renderer tree', `env -C ${source} yarn add x`],
  ['env --chdir= into the renderer tree', `env --chdir=${source} yarn add x`],
  ['env with a dash and an assignment', 'env - FOO=1 npm install'],
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
  ['timeout read-only npm', 'timeout 60 npm ls'],
  ['timeout yarn in 1. App', 'cd "1. App" && timeout 300 yarn install'],
  [
    'Push-Location with installer flags',
    `Push-Location ${source}; npm i x --ignore-scripts --legacy-peer-deps`,
  ],
  ['Pop-Location leaves the renderer tree', `Push-Location ${source}; Pop-Location; yarn install`],
  ['npm pkg get', 'npm pkg get set'],
  ['subshell cd does not leak', `(cd ${source} && npm ls) && yarn install`],
  ['substitution cd does not leak', `x=$(cd ${source} && pwd) && yarn install`],
  ['a case closing its subshell', `(cd ${source}; case $x in a) echo;; esac); yarn add x`],
  ['case patterns are not commands', `cd ${source}; case $x in\nyarn|npm) echo;;\nesac`],
  ['env -C does not leak', `env -C ${source} pwd; yarn install`],
  ['env -C out of the renderer tree', `cd ${source} && env -C .. yarn install`],
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

test('spawned: a PowerShell payload keeps the folder set inside parentheses', () => {
  const command = `(Set-Location ${source}); yarn install`;
  const r = run(JSON.stringify({ tool_name: 'PowerShell', cwd: root, tool_input: { command } }));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /deny/);
  const bash = run(JSON.stringify({ tool_name: 'Bash', cwd: root, tool_input: { command } }));
  assert.equal(bash.status, 0, bash.stderr);
  assert.equal(bash.stdout, '');
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

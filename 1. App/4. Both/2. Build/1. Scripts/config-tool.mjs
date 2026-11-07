import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Runs one shared claude-config tool (`<config repo>/tools/tools/<tool.mjs>`) for a package.json
// script. Yarn's shell expands `$CLAUDE_CONFIG_DIR` in a script, but npm on Windows runs scripts
// through cmd.exe, which does not, and VS Code's NPM Scripts view picks npm here because the
// workspace root has no yarn.lock. Resolving the path in Node works under both. The same shim lives
// in Image AI and the claude-code-chat fork.
// Usage: node "<this file>" <tool.mjs> [args...]. The tool runs in the caller's cwd, so a script's
// relative arguments mean what they meant before. The config repo is CLAUDE_CONFIG_DIR when set,
// else ~/.claude, through realpath (a tool's entry-point guard compares real paths).
// Exit code is the tool's own; 2 when the config repo or the tool is missing or could not start.

function resolveConfigRoot() {
  const fromEnv = process.env.CLAUDE_CONFIG_DIR;
  const candidate = fromEnv?.trim() ? fromEnv : path.join(os.homedir(), '.claude');
  try {
    return fs.realpathSync(candidate);
  } catch {
    return candidate;
  }
}

const [tool, ...args] = process.argv.slice(2);
if (!tool) {
  console.error('config-tool: usage: node config-tool.mjs <tool.mjs> [args...]');
  process.exit(2);
}
const script = path.join(resolveConfigRoot(), 'tools', 'tools', path.basename(tool));
if (!fs.existsSync(script)) {
  console.error(
    `config-tool: ${script} not found (set CLAUDE_CONFIG_DIR to the claude-config repo)`,
  );
  process.exit(2);
}
const result = spawnSync(process.execPath, [script, ...args], {
  stdio: 'inherit',
  env: process.env,
});
if (result.error) console.error(`config-tool: could not run ${script}: ${result.error.message}`);
process.exit(result.status ?? 2);

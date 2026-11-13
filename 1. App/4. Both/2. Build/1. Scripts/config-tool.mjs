import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Runs one shared claude-config tool (`<config repo>/tools/tools/<tool.mjs>`) for a package.json
// script. A tool is named by its bare file name: it is looked up at `tools/tools/<tool>` first, then
// in the `<topic>-tools/` folders and each topic's own sub-folders (two levels and no deeper; `lib`,
// `node_modules`, `common` and dot folders are skipped at both), and exactly one match wins;
// `<topic>-tools/<tool>` or `<topic>-tools/<sub>/<tool>` is honoured when that file exists, and two
// folders holding the same name is an error that lists them. The
// same rule is `tools/tools/common/find-tool.mjs` in the config repo; this copy cannot import it
// before it has found the repo, so change both together. Yarn's shell expands `$CLAUDE_CONFIG_DIR` in a script, but npm on Windows runs scripts
// through cmd.exe, which does not, and VS Code's NPM Scripts view picks npm here because the
// workspace root has no yarn.lock. Resolving the path in Node works under both. The same shim lives
// in Image AI and the claude-code-chat fork.
// Usage: node "<this file>" <tool.mjs> [args...]. The tool runs in the caller's cwd, so a script's
// relative arguments mean what they meant before. The config repo is CLAUDE_CONFIG_DIR when set,
// else ~/.claude, through realpath (a tool's entry-point guard compares real paths).
// Exit code is the tool's own; 2 when the config repo or the tool is missing, the name is ambiguous
// or the tool could not start.

function resolveConfigRoot() {
  const fromEnv = process.env.CLAUDE_CONFIG_DIR;
  const candidate = fromEnv?.trim() ? fromEnv : path.join(os.homedir(), '.claude');
  try {
    return fs.realpathSync(candidate);
  } catch {
    return candidate;
  }
}

const SKIPPED = new Set(['lib', 'node_modules', 'common']);
const isFile = (p) => fs.existsSync(p) && fs.statSync(p).isFile();

/** Names of the folders directly under `dir` that may hold tools, sorted. */
function subFolders(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => (e.isDirectory() || e.isSymbolicLink()) && !e.name.startsWith('.'))
    .filter((e) => !SKIPPED.has(e.name))
    .map((e) => e.name)
    .sort();
}

/** `{ script }`, or `{ error }` (with the top-level path it would have had) for a miss or a tie. */
function findTool(configRoot, name) {
  const toolsDir = path.join(configRoot, 'tools', 'tools');
  const parts = name.replaceAll('\\', '/').split('/').filter(Boolean);
  const base = parts.at(-1) ?? '';
  const topLevel = path.join(toolsDir, base);
  if (!base || base === '.' || base === '..') return { error: `${topLevel} not found` };
  const folders = parts.slice(0, -1);
  const direct =
    folders.length >= 1 && folders.length <= 2 && !folders.some((s) => s === '.' || s === '..');
  if (direct && isFile(path.join(toolsDir, ...folders, base))) {
    return { script: path.join(toolsDir, ...folders, base) };
  }
  if (isFile(topLevel)) return { script: topLevel };
  // A topic's own file, then its sub-folders', topics and sub-folders in name order.
  const hits = subFolders(toolsDir)
    .flatMap((topic) => [
      path.join(toolsDir, topic, base),
      ...subFolders(path.join(toolsDir, topic)).map((sub) => path.join(toolsDir, topic, sub, base)),
    ])
    .filter(isFile);
  if (hits.length === 1) return { script: hits[0] };
  if (hits.length > 1) return { error: `${base} is ambiguous: ${hits.join(', ')}` };
  return { error: `${topLevel} not found` };
}

const [tool, ...args] = process.argv.slice(2);
if (!tool) {
  console.error('config-tool: usage: node config-tool.mjs <tool.mjs> [args...]');
  process.exit(2);
}
const found = findTool(resolveConfigRoot(), tool);
if (found.error) {
  console.error(`config-tool: ${found.error} (set CLAUDE_CONFIG_DIR to the claude-config repo)`);
  process.exit(2);
}
const script = found.script;
const result = spawnSync(process.execPath, [script, ...args], {
  stdio: 'inherit',
  env: process.env,
});
if (result.error) console.error(`config-tool: could not run ${script}: ${result.error.message}`);
process.exit(result.status ?? 2);

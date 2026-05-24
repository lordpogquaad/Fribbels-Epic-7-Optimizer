import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';
import { dependencies } from '../../../2. Frontend/1. Source/package.json';

const nodeModulesPath = path.join(__dirname, '..', '..', '..', '2. Frontend', '1. Source', 'node_modules');

if (
  Object.keys(dependencies || {}).length > 0 &&
  fs.existsSync(nodeModulesPath)
) {
  const electronRebuildCmd =
    '../node_modules/.bin/electron-rebuild --parallel --force --types prod,dev,optional --module-dir .';
  const cmd =
    process.platform === 'win32'
      ? electronRebuildCmd.replace(/\//g, '\\')
      : electronRebuildCmd;
  execSync(cmd, {
    cwd: path.join(__dirname, '..', '..', '..', '2. Frontend', '1. Source'),
    stdio: 'inherit',
  });
}

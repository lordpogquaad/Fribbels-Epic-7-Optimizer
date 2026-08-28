import fs from 'fs';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { dependencies } from '../../../package.json';

if (dependencies) {
  const dependenciesKeys = Object.keys(dependencies);
  const nativeDeps = fs
    .readdirSync('node_modules')
    .filter((folder) => fs.existsSync(`node_modules/${folder}/binding.gyp`));
  // No native packages installed at all → nothing to check. Without this guard the
  // `npm ls` below runs with no package filter, lists EVERY root dependency, and the
  // script wrongly exits 1 on a clean tree (measured 2026-08-28 — broke postinstall).
  if (nativeDeps.length === 0) process.exit(0);
  try {
    // Find the reason for why the dependency is installed. If it is installed
    // because of a devDependency then that is okay. Warn when it is installed
    // because of a dependency
    const { dependencies: dependenciesObject } = JSON.parse(
      execSync(`npm ls ${nativeDeps.join(' ')} --json`).toString(),
    );
    const rootDependencies = Object.keys(dependenciesObject);
    const filteredRootDependencies = rootDependencies.filter((rootDependency) =>
      dependenciesKeys.includes(rootDependency),
    );
    if (filteredRootDependencies.length > 0) {
      const plural = filteredRootDependencies.length > 1;
      console.log(`
 ${chalk.whiteBright.bgYellow.bold(
   'Webpack does not work with native dependencies.',
 )}
${chalk.bold(filteredRootDependencies.join(', '))} ${
        plural ? 'are native dependencies' : 'is a native dependency'
      } and must NOT live in the root manifest (webpack can't bundle native deps).
 Remove it from the root "1. App/package.json":
${chalk.whiteBright.bgGreen.bold('yarn remove your-package')}
 ${chalk.bold(
   'Add it to the renderer manifest instead — 2. Frontend/1. Source/package.json —',
 )}
 ${chalk.bold('then reinstall via 1. Master/2. PS1/install_frontend.ps1.')}
 `);
      process.exit(1);
    }
  } catch {
    console.log('Native dependencies could not be checked');
  }
}

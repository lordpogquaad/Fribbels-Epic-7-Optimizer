// Read-only drift check for /audit-ui. Exit 0 = both checks ran, findings or not; exit 1 = a check
// could not run. Reports counts and the first few names, so the output stays small.
// 1. Assets: 1. HTML/assets is a flat copy of 3. ASSETS/1. PNG, and copy-assets never removes a file,
//    so a name only in the copy is stale, and a name only in the source was never copied.
// 2. Locales: every translation.json under locales/ except dev/ should hold the keys en/ holds.
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '../../../..');
const sourceRoot = path.join(repoRoot, '1. App/2. Frontend/1. Source');
const pngRoot = path.join(sourceRoot, '3. ASSETS/1. PNG');
const assetsRoot = path.join(sourceRoot, '1. HTML/assets');
const localesRoot = path.join(sourceRoot, '6. JSON/3. TRANSLATION/locales');
const sampleSize = 10;

const byName = (a, b) => a.localeCompare(b);

const filesUnder = (dir) =>
  fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);

const keysOf = (value, prefix = '') =>
  Object.entries(value).flatMap(([key, child]) => {
    const name = prefix ? `${prefix}.${key}` : key;
    return child !== null && typeof child === 'object' ? keysOf(child, name) : [name];
  });

const readKeys = (locale) =>
  new Set(
    keysOf(JSON.parse(fs.readFileSync(path.join(localesRoot, locale, 'translation.json'), 'utf8'))),
  );

const show = (label, names) => {
  console.log(`${label}: ${names.length}`);
  for (const name of names.slice(0, sampleSize)) console.log(`  ${name}`);
};

const checkAssets = () => {
  const source = new Set(filesUnder(pngRoot));
  const copy = new Set(filesUnder(assetsRoot));
  console.log(`assets: ${source.size} source names, ${copy.size} copied names`);
  show('stale in 1. HTML/assets', [...copy].filter((name) => !source.has(name)).sort(byName));
  show('never copied', [...source].filter((name) => !copy.has(name)).sort(byName));
};

const checkLocales = () => {
  const reference = readKeys('en');
  console.log(`locales: en holds ${reference.size} keys`);
  const locales = fs
    .readdirSync(localesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !['dev', 'en'].includes(entry.name))
    .map((entry) => entry.name);
  for (const locale of locales) {
    const keys = readKeys(locale);
    show(`${locale} missing`, [...reference].filter((key) => !keys.has(key)).sort(byName));
    show(`${locale} extra`, [...keys].filter((key) => !reference.has(key)).sort(byName));
  }
};

let failed = false;
for (const check of [checkAssets, checkLocales]) {
  try {
    check();
  } catch (error) {
    failed = true;
    console.error(`${check.name} could not run: ${error.code ?? error.name}`);
  }
}
process.exit(failed ? 1 : 0);

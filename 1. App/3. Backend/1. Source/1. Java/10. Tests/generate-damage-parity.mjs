// Regenerates damageMultipliersParity.json (read by DamageMultipliersParityTest) by running the
// REAL renderer code in Node: DamageCalc.getMultipliers from damageCalc.js, over the skills that
// heroData.js processHeroSkill builds from herodata.json. Run it when a hero's skills change.
//
//   node generate-damage-parity.mjs            compare what it would write with the fixture, exit 1 on a diff
//   node generate-damage-parity.mjs --write    rewrite the fixture
//   node generate-damage-parity.mjs "Karin" "Abigail" ...   use these heroes instead of the fixture's
//
// The heroes default to the ones already in the fixture. The cases per hero are fixed by rule:
// no options; each skill at each of its options (the other skills on their first option); then the
// "b37" shapes that used to diverge (stale, empty and null effects, partial skillOptions, a stale
// name containing a hit-type word, an empty skillOptions object).
//
// damageCalc.js and heroData.js are ES modules written for webpack and jQuery, so they are not
// imported: damageCalc.js is evaluated with its HeroData import replaced by a stub, and
// processHeroSkill is cut out of heroData.js by brace matching. If either file changes shape
// enough that this stops working, it fails loudly instead of producing a plausible fixture.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..', '..', '..', '..'); // 1. App
const services = path.join(app, '2. Frontend', '1. Source', '4. JS', '6. Shared', '3. Services');
const heroDataJson = path.join(
  app,
  '2. Frontend',
  '1. Source',
  '6. JSON',
  '2. CACHE',
  'cache',
  'herodata.json',
);
const fixturePath = process.env.PARITY_FIXTURE || path.join(here, 'damageMultipliersParity.json');

// The fields DamageMultipliersParityTest compares, in the fixture's order.
const FIELDS = [
  'rate',
  'pow',
  'targets',
  'selfHpScaling',
  'selfAtkScaling',
  'selfDefScaling',
  'selfSpdScaling',
  'increasedValue',
  'extraSelfHpScaling',
  'extraSelfDefScaling',
  'extraSelfAtkScaling',
  'cdmgIncrease',
  'penetration',
  'hitMulti',
  'support',
  'crit',
];
const SKILLS = ['S1', 'S2', 'S3'];

function fail(message) {
  console.error(`generate-damage-parity: ${message}`);
  process.exit(2);
}

/** Source text of a top-level `function name(` declaration, by brace matching. */
function sliceFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) fail(`function ${name} not found in heroData.js`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return fail(`unbalanced braces after function ${name}`);
}

const heroDataSource = fs.readFileSync(path.join(services, 'heroData.js'), 'utf8');
// eslint-disable-next-line no-new-func
const processHeroSkill = new Function(
  `${sliceFunction(heroDataSource, 'processHeroSkill')}; return processHeroSkill;`,
)();

const rawHeroes = JSON.parse(fs.readFileSync(heroDataJson, 'utf8'));
const processed = new Map();

/** The hero's skills as the renderer holds them after loading: every skill has options. */
function processedSkills(name) {
  if (!processed.has(name)) {
    const raw = rawHeroes[name];
    if (!raw) fail(`"${name}" is not in herodata.json`);
    const skills = structuredClone(
      raw.skills || {
        S1: { hitTypes: ['normal'], targets: 0, rate: 0, pow: 0, options: [] },
        S2: { hitTypes: ['normal'], targets: 0, rate: 0, pow: 0, options: [] },
        S3: { hitTypes: ['normal'], targets: 0, rate: 0, pow: 0, options: [] },
      },
    );
    SKILLS.forEach((skill) => processHeroSkill(skills, skill));
    processed.set(name, skills);
  }
  return processed.get(name);
}

const damageCalcSource = fs.readFileSync(path.join(services, 'damageCalc.js'), 'utf8');
const importLine = "import HeroData from './heroData';";
if (
  !damageCalcSource.includes(importLine) ||
  !damageCalcSource.includes('export default DamageCalc;')
) {
  fail(
    'damageCalc.js no longer has the HeroData import or the default export this script rewrites',
  );
}
const damageCalcRunnable = damageCalcSource
  .replace(importLine, '')
  .replace('export default DamageCalc;', 'return DamageCalc;');
const heroDataStub = {
  getHeroExtraInfo: (name) => (rawHeroes[name] ? { skills: processedSkills(name) } : null),
};
// eslint-disable-next-line no-new-func
const DamageCalc = new Function('HeroData', damageCalcRunnable)(heroDataStub);

function jsMultipliers(name, skillOptions, full) {
  const hero = { name, skillOptions: structuredClone(skillOptions) }; // getMultipliers fills gaps in place
  const result = DamageCalc.getMultipliers(hero);
  if (!result) fail(`getMultipliers returned nothing for ${name}`);
  // The first fixture cases keep the 16 compared fields; the b37 ones keep every field JS returns, in its order
  // (the nine fields Java never reads are in them). Both are reproduced as found.
  if (full) return { ...result };
  return Object.fromEntries(FIELDS.map((field) => [field, result[field]]));
}

function casesFor(name, skills) {
  const first = Object.fromEntries(SKILLS.map((skill) => [skill, skills[skill][0].name]));
  const withEffects = (overrides) =>
    Object.fromEntries(
      SKILLS.map((skill) => {
        if (skill in overrides) return [skill, overrides[skill]];
        return [skill, { skillEffect: first[skill] }];
      }),
    );
  const cases = [{ label: 'no options', skillOptions: null }];

  SKILLS.forEach((skill) => {
    skills[skill].forEach((option) => {
      cases.push({
        label: `${skill} = ${option.name}`,
        skillOptions: withEffects({ [skill]: { skillEffect: option.name } }),
      });
    });
  });
  SKILLS.forEach((skill) => {
    cases.push({
      label: `b37 stale ${skill} effect`,
      skillOptions: withEffects({ [skill]: { skillEffect: `${skill} gone` } }),
    });
    cases.push({ label: `b37 empty ${skill} effect`, skillOptions: withEffects({ [skill]: {} }) });
    cases.push({ label: `b37 null ${skill}`, skillOptions: withEffects({ [skill]: null }) });
    cases.push({
      label: `b37 partial: ${skill} only`,
      skillOptions: { [skill]: { skillEffect: first[skill] } },
    });
  });
  cases.push({
    label: 'b37 stale name with hit word',
    skillOptions: withEffects({
      S1: { skillEffect: 'S1 normal gone' },
      S3: { skillEffect: 'S3 crit gone' },
    }),
  });
  cases.push({ label: 'b37 empty skillOptions object', skillOptions: {} });

  return cases.map((c) => ({
    ...c,
    js: jsMultipliers(name, c.skillOptions, c.label.startsWith('b37 ')),
  }));
}

const existing = fs.existsSync(fixturePath)
  ? JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
  : null;
const names = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const heroNames = names.length ? names : existing?.heroes.map((hero) => hero.name);
if (!heroNames?.length) fail('no fixture to take the hero names from; pass them as arguments');

const generated = {
  source:
    existing?.source ??
    'JS DamageCalc.getMultipliers over herodata.json (generate-damage-parity.mjs)',
  heroes: heroNames.map((name) => {
    const skills = processedSkills(name);
    return {
      name,
      skills: Object.fromEntries(SKILLS.map((skill) => [skill, skills[skill].options])),
      cases: casesFor(
        name,
        Object.fromEntries(SKILLS.map((skill) => [skill, skills[skill].options])),
      ),
    };
  }),
};
const text = JSON.stringify(generated);

if (process.argv.includes('--write')) {
  fs.writeFileSync(fixturePath, text);
  console.log(`wrote ${fixturePath} (${generated.heroes.length} heroes)`);
} else {
  const current = fs.existsSync(fixturePath) ? fs.readFileSync(fixturePath, 'utf8') : '';
  if (current === text) {
    console.log('fixture is up to date');
  } else {
    // Say where they first differ, so a stale fixture is easy to find.
    let i = 0;
    while (i < text.length && text[i] === current[i]) i += 1;
    console.log(`fixture differs from a fresh run, first at character ${i}:`);
    console.log(`  fixture:   ...${current.slice(Math.max(0, i - 60), i + 80)}`);
    console.log(`  generated: ...${text.slice(Math.max(0, i - 60), i + 80)}`);
    process.exit(1);
  }
}

import tseslint from 'typescript-eslint';
import regexp from 'eslint-plugin-regexp';
import promise from 'eslint-plugin-promise';
import nodePlugin from 'eslint-plugin-n';
import base from './eslint.config.mjs';

// REPORT-ONLY strict lint: `yarn lint:strict`. Not part of `yarn lint` or any gate; the gating
// `lint` script (eslint.config.mjs) is unaffected. Same ignores as the base config; findings are
// triaged by hand, so every rule here may be noisy on a given day.
//
// Layers: the base config, type-aware typescript-eslint rules over JS (type info from
// jsconfig.strict.json: allowJs + strict, checkJs off), eslint-plugin-regexp, eslint-plugin-promise,
// eslint-plugin-n (Node/Electron code only) and a few core rules the base set leaves off. The
// no-unsafe-* family is left out because untyped JS is `any` everywhere. The base config keeps
// no-undef off and exempts unused arguments and empty catch blocks; this lane turns those back on,
// so it shows what the gating lint hides.
// Report-only: the config repo keeps its strict rules at 'warn' and omits --max-warnings, so ESLint
// exits 0. Here the recommended presets ship some 'error' rules, so the export demotes them all.
const jsFiles = ['**/*.{js,mjs,cjs}'];

// Node/Electron code: eslint-plugin-n fits here. The renderer is a bundled jQuery app that runs in
// a browser-like window; Node resolution rules would only report bundler-resolved imports there.
const electronMainFiles = ['5. Dev Only/**/*.{js,mjs,cjs}'];
const nodeFiles = ['4. Both/**/*.{js,mjs,cjs}', ...electronMainFiles, '*.{js,mjs,cjs}'];

const typeAwareRules = {
  '@typescript-eslint/await-thenable': 'warn',
  '@typescript-eslint/no-array-delete': 'warn',
  '@typescript-eslint/no-base-to-string': 'warn',
  '@typescript-eslint/no-floating-promises': 'warn',
  '@typescript-eslint/no-for-in-array': 'warn',
  '@typescript-eslint/no-implied-eval': 'warn',
  '@typescript-eslint/no-meaningless-void-operator': 'warn',
  '@typescript-eslint/no-misused-promises': 'warn',
  '@typescript-eslint/no-misused-spread': 'warn',
  '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'warn',
  '@typescript-eslint/no-unnecessary-condition': 'warn',
  '@typescript-eslint/only-throw-error': 'warn',
  '@typescript-eslint/prefer-promise-reject-errors': 'warn',
  '@typescript-eslint/require-await': 'warn',
  '@typescript-eslint/restrict-plus-operands': 'warn',
  '@typescript-eslint/unbound-method': 'warn',
};

const layers = [
  ...base,
  {
    files: jsFiles,
    plugins: { '@typescript-eslint': tseslint.plugin },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./jsconfig.strict.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: typeAwareRules,
  },
  { ...regexp.configs['flat/recommended'], files: jsFiles },
  {
    files: jsFiles,
    rules: {
      'regexp/no-super-linear-move': 'warn',
      'regexp/strict': 'warn',
      // Pure style rewrites (no behavior change).
      'regexp/use-ignore-case': 'off',
      'regexp/prefer-w': 'off',
      'regexp/prefer-d': 'off',
      'regexp/prefer-range': 'off',
      'regexp/match-any': 'off',
      'regexp/no-useless-character-class': 'off',
      'regexp/no-useless-non-capturing-group': 'off',
      'regexp/no-useless-lazy': 'off',
      'regexp/no-unused-capturing-group': 'off',
      'regexp/prefer-predefined-assertion': 'off',
    },
  },
  { ...promise.configs['flat/recommended'], files: jsFiles },
  { ...nodePlugin.configs['flat/recommended-module'], files: nodeFiles },
  // These files run on Electron's Node, not the tooling Node that `engines` describes.
  { files: electronMainFiles, settings: { n: { version: '>=24.22.0' } } },
  {
    files: jsFiles,
    rules: {
      'no-undef': 'warn',
      'no-unused-vars': ['warn', { args: 'after-used', varsIgnorePattern: '^_' }],
      'no-empty': ['warn', { allowEmptyCatch: false }],
      'array-callback-return': 'warn',
      'no-self-compare': 'warn',
      'no-unmodified-loop-condition': 'warn',
      'no-unreachable-loop': 'warn',
      'require-atomic-updates': 'warn',
      // `(res)`/`(ok)` for resolve is a naming style, not a bug.
      'promise/param-names': 'off',
      'promise/catch-or-return': ['warn', { allowThen: true, allowFinally: true }],
      'promise/always-return': ['warn', { ignoreLastCallback: true }],
    },
  },
  {
    // Every inline mask must still match a finding, so a stale `eslint-disable` shows up.
    linterOptions: { reportUnusedDisableDirectives: 'warn' },
  },
];

const demoteSetting = (setting) => {
  if (Array.isArray(setting)) return [demoteSetting(setting[0]), ...setting.slice(1)];
  return setting === 'error' || setting === 2 ? 'warn' : setting;
};

// Report-only: no rule may reach 'error' severity.
export default layers.map((entry) =>
  entry.rules
    ? {
        ...entry,
        rules: Object.fromEntries(
          Object.entries(entry.rules).map(([name, setting]) => [name, demoteSetting(setting)]),
        ),
      }
    : entry,
);

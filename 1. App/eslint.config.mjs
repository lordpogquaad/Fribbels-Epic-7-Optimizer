// Flat ESLint config (ESLint 10 dropped .eslintrc support).
// Deliberately minimal + vanilla-JS focused: this is a jQuery/Electron app, not React,
// so the old airbnb/erb/React ruleset was removed. Goal: catch real bugs, not style noise
// (Prettier owns formatting). See project memory "modernization 2026".
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  // ---- Ignored paths (ESLint's own ignores; the deprecated .eslintignore file is
  // gone — Prettier/Stylelint use .prettierignore via --ignore-path) ----
  globalIgnores([
    '**/node_modules/**',
    '2. Frontend/1. Source/node_modules/**',
    '**/renderer.dev.js', // generated webpack bundle (huge)
    '**/main.prod.js', // generated webpack prod bundle (NOT webpack.config.main.prod.js)
    '**/renderer.prod.js', // generated webpack prod bundle (NOT the config of the same suffix)
    '2. Frontend/1. Source/8. DIST/**', // prod build output
    'release/**', // electron-builder output
    '3. Backend/**', // Java backend
    '2. Personal/**', // trash / personal
    '_pre-modernize-backup/**', // pre-change manifest backups
    '**/*.min.js',
  ]),

  // ---- JavaScript (renderer + main process + build tooling) ----
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        // Do NOT add globals.jquery here: the source files already declare `$`/`jQuery`
        // via per-file `/* global $ */` comments (~15 files), and declaring them here too
        // makes no-redeclare fire in every one of those files. no-undef is off anyway, so
        // jQuery does not need a central global declaration.
      },
    },
    rules: {
      // The renderer is a global-heavy jQuery app (UI modules share implicit globals
      // loaded via app.html <script> tags + init.js), so no-undef is impractical here.
      'no-undef': 'off',
      'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-console': 'off',
    },
  },

  // ---- TypeScript (.ts/.tsx — minimal, non-type-checked) ----
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // ---- Disable all formatting rules Prettier owns (keep last) ----
  prettier,
]);

// Report-only import-graph check, run from "1. App/" with the roots passed on the command line:
//   yarn depcruise --config .dependency-cruiser.cjs "2. Frontend/1. Source/4. JS" "5. Dev Only" "4. Both"
// The renderer's packages live in "2. Frontend/1. Source/node_modules" (a second manifest); Node
// resolution reaches it by walking up from each renderer file. "5. Dev Only" files do not, so their
// imports of renderer packages show as unresolvable.
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'warn',
      comment:
        'A require/import cycle; usually a module that should be split or a leaf that should move.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'info',
      comment:
        'A module nothing imports and that imports nothing. Entry points are exempt: the webpack entry, the files app.html loads with <script> tags, the build scripts and the webpack configs.',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)[.][^/]+[.](?:js|cjs|mjs)$',
          '^5. Dev Only/(LogControl|main[.]dev)[.]js$',
          '^4. Both/',
          '^2. Frontend/1. Source/4. JS/6. Shared/1. Core/init[.]js$',
          '^2. Frontend/1. Source/4. JS/7. Gear Analysis Tab/',
        ],
      },
      to: {},
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      comment:
        'An import that resolves to nothing: a typo, a deleted file or an uninstalled package.',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'no-non-package-json',
      severity: 'info',
      comment:
        'An import of a package that the nearest package.json does not declare. For a renderer file that is "2. Frontend/1. Source/package.json", so a package only "1. App/package.json" declares shows here; read it as a list of the split between the two manifests, not as defects.',
      from: {},
      to: { dependencyTypes: ['npm-no-pkg', 'npm-unknown'] },
    },
  ],
  options: {
    doNotFollow: { path: ['node_modules'] },
    exclude: {
      path: [
        '2. Frontend/1. Source/8. DIST',
        '2. Frontend/1. Source/(main[.]prod|renderer[.]dev)[.]js$',
        '^release/',
      ],
    },
    moduleSystems: ['es6', 'cjs'],
    tsPreCompilationDeps: false,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      mainFields: ['module', 'main'],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
};

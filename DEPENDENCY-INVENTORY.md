# Dependency & Config Manifest Inventory — Fribbels Epic 7 Optimizer

> # ⛔ SUPERSEDED — historical snapshot, do NOT trust the versions below (2026-06-21)
>
> This inventory is a **frozen point-in-time snapshot taken 2026-06-16, mid-modernization**, when the
> manifests were still full of alpha/beta/rc/canary pins. The modernization **completed afterward**, so
> most version numbers, dep lists, and runtime pins here are now **wrong**. Notably:
>
> - **Pre-release pins were stabilized.** e.g. electron `43-beta`→`^42.4.1`, electron-builder
>   `27-alpha`→`^26.15.3`, electron-updater `7-alpha`→`^6.8.9`, `@babel/core` `8-alpha`→`^8.0.1`,
>   prettier `4-alpha`→`^3.8.4`, core-js `4-alpha`→`^3.49.0`. (All deps are now on latest **stable**.)
> - **The React / Redux / Jest / enzyme / testcafe stack listed here was REMOVED** (2026-06-16) — the
>   renderer is jQuery + AG-Grid, no React. Ignore every react*/redux*/enzyme*/testcafe*/jest* row, the
>   DLL webpack config, and the airbnb/`.babelrc`-era ESLint entries.
> - **Backend moved Java 21 → Java 25** (Temurin `jdk-25.0.3+9`) and **Maven 3.8.8 → 3.9.16**, both now
>   repo-bundled; `build_backend.ps1` no longer uses the redhat.java extension JDK path and now runs the
>   test suite (no `-Dmaven.test.skip`).
> - The renderer manifest **relocated** to `2. Frontend/1. Source/package.json`; the `package.json`
>   `build` (electron-builder) config was rewritten for the numbered layout (2026-06-21).
>
> **Authoritative, live sources of truth instead of this file:**
> [1. App/package.json](1.%20App/package.json) · [2. Frontend/1. Source/package.json](1.%20App/2.%20Frontend/1.%20Source/package.json) ·
> [pom.xml](1.%20App/3.%20Backend/1.%20Source/3.%20XML/pom.xml) · [build_backend.ps1](1.%20App/1.%20Master/2.%20PS1/build_backend.ps1).
> For the modernization narrative see the agent memory (`project_modernization_2026`) and
> `C:\Users\Marcus\.claude\plans\Bugs\Change Logs.md`. Kept only as historical reference — a fresh
> inventory should be generated from the live manifests above, not patched from here.

This document inventories **every dependency/version manifest and config file** in the Fribbels Epic 7 Optimizer repo (repo root: `F:\Epic Seven Screenshots Only\New folder\Gear simulator files\Fribbels-Epic-7-Optimizer`), excluding `node_modules/`, `target/`, `dist/`, and the generated `renderer.dev.js`. It records each file's purpose and its **currently pinned** versions so a planning agent can decide what to bump. **No "latest" lookups were performed** — only the versions present in the repo today are recorded. Note that the app uses an unusual numbered/spaced folder layout (e.g. `1. App`, `4. Both`); links below URL-encode the spaces.

> ## ✅ Modernization completed this session (2026-06-16) — app builds & runs
>
> Verified working after these changes: app launches, renderer compiles, an optimizer run, the Gear tab, and hero selection all work. A few per-file entries further below predate these changes; the affected ones are corrected inline.
>
> - **Yarn 1.22.22 → 4.17.0** via Corepack (npm-global yarn removed). Added `1. App/.yarnrc.yml` (`nodeLinker: node-modules`, `enableScripts`, git-repo approval, `npmMinimalAgeGate: 0`); `1. App/yarn.lock` regenerated in Berry format.
> - **AG-Grid v32 (scoped `@ag-grid-community/*`) → 35.3.1 (monolithic `ag-grid-community`).** `inputHandler.js` now uses `AllCommunityModule` + `provideGlobalGridOptions({ theme: 'legacy' })`; `columnApi.*` calls migrated to `api.*`; dark theme preserved via `--ag-*-background-color` vars in `darktheme.css`; all 5 `onRowSelected` handlers fixed (`event.node.selected` → `event.node.isSelected()`) across heroes/gear/optimizer/multi grids.
> - **Babel 7 → 8** (`@babel/core` 8.0.0). `babel.config.cjs` fully migrated: removed the 7 now-stable `plugin-proposal-*` + `plugin-syntax-{dynamic-import,import-meta}`; dropped the unused `plugin-proposal-pipeline-operator`; `decorators` `legacy:true` → `version:'legacy'`; per-plugin `loose` → top-level `assumptions`. The matching obsolete `@babel/plugin-*` devDeps were removed from `1. App/package.json`.
> - **Webpack configs renamed `.babel.js` → `.js`** (renderer.dev / renderer.prod / main.prod / renderer.dev.dll — they were always CommonJS). Fixes webpack-cli 7 failing to load them through the broken `@babel/register@8` hook. Updated the 4 npm `--config` script paths, the dll config's internal `require`, and converted `webpack.config.eslint.js` to a plain CJS re-export.
> - **tsconfig.json + tsconfig.eslint.json**: added `skipLibCheck: true` (silences node_modules `.d.ts` type drift from the bleeding-edge dep mix).
>
> ### Still on pre-release / conflicting pins → for the plan agent (unchanged this session)
>
> - **Dual Babel 7/8 install**: build uses Babel 8, but test/lint tooling (`istanbul-lib-instrument` jest-coverage, `eslint-plugin-react-hooks`, deprecated `babel-eslint@11-beta`, `@types/babel__*`) still pulls Babel 7 → both coexist.
> - **React stack conflict**: `react@19.3-canary` vs `enzyme-adapter-react-16` (React 16) vs `connected-react-router` (wants react-router 6, repo on 7).
> - Other alpha/beta/rc pins: `electron@43-beta`, `electron-builder@27-alpha`, `electron-updater@7-alpha`, `prettier@4-alpha`, `core-js@4-alpha`, `babel-eslint@11-beta`, `typescript@6`, `eslint@10`, `stylelint@17`.

## Summary Table

| Ecosystem                   | Manifest file(s)                                                                                                                                                                                                              | What it controls                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Node/JS — Build tooling     | [1. App/package.json](1.%20App/package.json)                                                                                                                                                                                  | Electron shell, webpack/Babel/ESLint/Jest/electron-builder build & package pipeline, main-process runtime libs |
| Node/JS — Runtime deps      | [1. App/2. Frontend/1. Source/package.json](1.%20App/2.%20Frontend/1.%20Source/package.json)                                                                            | Renderer/UI runtime feature libraries (ag-grid, jquery, echarts, i18next, axios, jimp, etc.)                   |
| Package-manager & lockfiles | [.yarnrc.yml](1.%20App/.yarnrc.yml), [yarn.lock](1.%20App/yarn.lock), [package-lock.json](1.%20App/package-lock.json)                                                                                | Yarn 4 config + resolved dependency graphs                                                                     |
| Java / Maven                | [pom.xml](1.%20App/3.%20Backend/1.%20Source/3.%20XML/pom.xml) (+ bin copy), 2× settings.xml                                                                                                                                   | Backend JAR build, Java 21, Maven plugin/dependency versions                                                   |
| Python                      | [scanner.py](1.%20App/2.%20Frontend/1.%20Source/7.%20PY/1.%20Scanner/1.%20Core/scanner.py), vendored Scapy + dead trash copy                                                                                                  | Gear-scanner runtime (Scapy 2.5.0, user-supplied Python)                                                       |
| Runtimes & CI               | [build_backend.ps1](1.%20App/1.%20Master/2.%20PS1/build_backend.ps1), [start-dev.bat](1.%20App/1.%20Master/1.%20BAT/start-dev.bat), [install_frontend.ps1](1.%20App/1.%20Master/2.%20PS1/install_frontend.ps1), dead Scapy CI | JDK 21.0.10 / Maven 3.8.8 pins; launch flow; (third-party CI in trash)                                         |
| Build-tooling configs       | babel.config.cjs, 6× webpack configs, 2× tsconfig, 3× eslintrc                                                                                                                                                                | Transpile/bundle targets, TS target ES2018, lint rules                                                         |
| Other                       | dev-app-update.yml, 2× Gear.iml, README.md                                                                                                                                                                                    | Update feed, IntelliJ library pins (stale), stated Java requirement                                            |

---

## (a) Node/JS — Build tooling (`1. App`)

### [1. App/package.json](1.%20App/package.json)

**Root/build-tooling manifest** for the Electron app (`name: pog-e7-optimizer`, `productName: Pog E7 Optimizer`, `v1.0.0`), derived from electron-react-boilerplate. `main` → `./5. Dev Only/main.dev.js`. The bulk is build/dev tooling (webpack + dev-server, Babel, ESLint/Prettier/Stylelint, Jest+enzyme+testcafe, electron-builder packaging for win/mac/linux). `dependencies` are Electron-main-process runtime libs; `devDependencies` are build tooling. Scripts: `build`, `dev`, `package`, `lint`, `test`. `build.publish` targets GitHub `RexQian/Fribbels-Epic-7-Optimizer`. **No `engines` field**; `browserslist` is an empty array `[]`.

**Key pinned versions — Electron/packaging (devDeps):**

| Name                        | Version                        |
| --------------------------- | ------------------------------ |
| packageManager              | `yarn@4.17.0+sha512.c2957de2…` |
| engines                     | **ABSENT**                     |
| main                        | `./5. Dev Only/main.dev.js`    |
| electron                    | `^43.0.0-beta.3` ⚠             |
| electron-builder            | `^27.0.0-alpha.3` ⚠            |
| electron-packager           | `^17.1.2`                      |
| electron-rebuild            | `^3.2.9`                       |
| electron-installer-windows  | `^3.0.0`                       |
| electron-devtools-installer | `^4.0.0`                       |

**Key pinned versions — webpack/Babel (devDeps):**

| Name                                            | Version             |
| ----------------------------------------------- | ------------------- |
| webpack                                         | `^5.107.2`          |
| webpack-cli                                     | `^7.0.3`            |
| webpack-dev-server                              | `^5.2.5`            |
| webpack-merge                                   | `^6.0.1`            |
| webpack-bundle-analyzer                         | `^5.3.0`            |
| @babel/core                                     | `^8.0.0-alpha.17` ⚠ |
| @babel/preset-env                               | `^8.0.0-rc.6` ⚠     |
| @babel/preset-react                             | `^8.0.0-rc.6` ⚠     |
| @babel/preset-typescript                        | `^8.0.0-rc.6` ⚠     |
| @babel/register                                 | `^8.0.0-rc.6` ⚠     |
| babel-loader                                    | `^10.1.1`           |
| babel-jest                                      | `^30.4.1`           |
| babel-eslint                                    | `^11.0.0-beta.2` ⚠  |
| babel-plugin-dev-expression                     | `^0.2.3`            |
| babel-plugin-transform-react-remove-prop-types  | `^0.4.24`           |
| @babel/plugin-proposal-decorators               | `^8.0.0-rc.6` ⚠     |
| @babel/plugin-transform-react-constant-elements | `^8.0.0-rc.6` ⚠     |
| @babel/plugin-transform-react-inline-elements   | `^8.0.0-rc.6` ⚠     |

> Note (updated this session): the remaining `@babel/plugin-proposal-*` devDeps are decorators, do-expressions, export-default-from, function-bind, function-sent, throw-expressions (all `^8.0.0-rc.6`), plus assorted `@types/*`. The Babel-7 stragglers were **REMOVED** this session — `plugin-proposal-{class-properties, export-namespace-from, json-strings, logical-assignment-operators, nullish-coalescing-operator, numeric-separator, optional-chaining, pipeline-operator}` and `plugin-syntax-{dynamic-import, import-meta}` — all now stable in Babel 8 / preset-env.

**Key pinned versions — main-process runtime (deps):**

| Name                               | Version                              |
| ---------------------------------- | ------------------------------------ |
| react                              | `^19.3.0-canary-fef12a01-20260413` ⚠ |
| react-dom                          | `^19.3.0-canary-fef12a01-20260413` ⚠ |
| react-redux                        | `^9.3.0`                             |
| react-router-dom                   | `^7.17.0`                            |
| redux                              | `^5.0.1`                             |
| redux-thunk                        | `^3.1.0`                             |
| @reduxjs/toolkit                   | `^2.12.0`                            |
| connected-react-router             | `^7.0.0-alpha.0` ⚠                   |
| history                            | `^5.3.0`                             |
| electron-log                       | `^5.4.4`                             |
| electron-debug                     | `^4.1.0`                             |
| electron-updater                   | `^7.0.0-alpha.2` ⚠                   |
| python-shell                       | `^5.0.0`                             |
| chokidar                           | `^5.0.0`                             |
| watchpack                          | `^2.5.2`                             |
| find-process                       | `^2.1.1`                             |
| network                            | `^0.7.0`                             |
| node-abi                           | `^4.31.0`                            |
| body-parser                        | `^2.3.0`                             |
| regenerator-runtime                | `^0.14.1`                            |
| source-map-support                 | `^0.5.21`                            |
| i18next                            | `^26.3.1`                            |
| i18next-browser-languagedetector   | `^8.2.1`                             |
| i18next-electron-language-detector | `^0.0.10`                            |
| i18nextify                         | `^5.0.0`                             |

**Key pinned versions — lint/test/CSS tooling (devDeps):**

| Name                                          | Version                                    |
| --------------------------------------------- | ------------------------------------------ |
| typescript                                    | `^6.0.3`                                   |
| eslint                                        | `^10.5.0`                                  |
| eslint-config-airbnb                          | `^19.0.4`                                  |
| eslint-config-airbnb-typescript               | `^18.0.0`                                  |
| eslint-config-erb                             | `^4.1.0`                                   |
| eslint-config-prettier                        | `^10.1.8`                                  |
| eslint-import-resolver-webpack                | `^0.13.11`                                 |
| eslint-plugin-compat                          | `^7.0.2`                                   |
| eslint-plugin-import                          | `^2.32.0`                                  |
| eslint-plugin-jest                            | `^29.15.2`                                 |
| eslint-plugin-jsx-a11y                        | `6.10.2`                                   |
| eslint-plugin-prettier                        | `^5.5.6`                                   |
| eslint-plugin-promise                         | `^7.3.0`                                   |
| eslint-plugin-react                           | `^7.37.5`                                  |
| eslint-plugin-react-hooks                     | `^7.1.1`                                   |
| eslint-plugin-testcafe                        | `^0.2.1`                                   |
| @typescript-eslint/eslint-plugin              | `^8.61.2-alpha.2` ⚠                        |
| @typescript-eslint/parser                     | `^8.61.2-alpha.2` ⚠                        |
| prettier                                      | `^4.0.0-alpha.13` ⚠                        |
| stylelint                                     | `^17.13.0`                                 |
| stylelint-config-prettier                     | `^9.0.5`                                   |
| stylelint-config-standard                     | `^40.0.0`                                  |
| sass                                          | `^1.101.0`                                 |
| sass-loader                                   | `^17.0.0`                                  |
| css-loader                                    | `^7.1.4`                                   |
| css-minimizer-webpack-plugin                  | `^8.0.0`                                   |
| style-loader                                  | `^4.0.0`                                   |
| mini-css-extract-plugin                       | `^2.10.2`                                  |
| file-loader                                   | `^6.2.0`                                   |
| url-loader                                    | `^4.1.1`                                   |
| @teamsupercell/typings-for-css-modules-loader | `^2.5.2`                                   |
| terser-webpack-plugin                         | `^5.6.1`                                   |
| identity-obj-proxy                            | `^3.0.0`                                   |
| jest                                          | `^30.4.2`                                  |
| react-test-renderer                           | `^19.3.0-canary-fef12a01-20260413` ⚠       |
| enzyme                                        | `^3.11.0`                                  |
| enzyme-adapter-react-16                       | `^1.15.8` (⚠ React-16 adapter vs React 19) |
| enzyme-to-json                                | `^3.6.2`                                   |
| testcafe                                      | `^3.7.4`                                   |
| testcafe-browser-provider-electron            | `^0.0.21`                                  |
| testcafe-react-selectors                      | `^5.0.3`                                   |
| @amilajack/testcafe-browser-provider-electron | `^0.0.15-alpha.1` ⚠                        |
| redux-logger                                  | `^3.0.6`                                   |
| core-js                                       | `^4.0.0-alpha.1` ⚠                         |
| cross-env                                     | `^10.1.0`                                  |
| concurrently                                  | `^10.0.3`                                  |
| detect-port                                   | `^2.1.0`                                   |
| rimraf                                        | `^6.1.3`                                   |
| chalk                                         | `^5.6.2`                                   |
| husky                                         | `^9.1.7`                                   |
| lint-staged                                   | `^17.0.7`                                  |
| opencollective-postinstall                    | `^2.0.3`                                   |
| @types/node                                   | `25.9.3`                                   |
| @types/react                                  | `^19.2.17`                                 |
| @types/react-dom                              | `^19.2.3`                                  |
| @types/jest                                   | `^30.0.0`                                  |
| @types/webpack                                | `^5.28.5`                                  |

**How to update:** edit `1. App/package.json`, then reinstall via the project's Yarn 4 flow (`yarn install` in `1. App`, governed by `.yarnrc.yml` + the `yarn@4.17.0` `packageManager` pin). Native modules are rebuilt via `electron-rebuild`. Per memory, the app normally runs from source via `start-dev.bat`.

---

## (b) Node/JS — Runtime deps (`2. Frontend`)

### [1. App/2. Frontend/1. Source/package.json](1.%20App/2.%20Frontend/1.%20Source/package.json)

**Renderer/source RUNTIME manifest** (`name: poge7optimizer`, `productName: Pog E7 Optimizer`, `v1.12.0`, license MIT, `main: ./main.prod.js`) — lives next to the renderer source/`node_modules` (moved here from the old `6. JSON\1. LOCK\2. JSON\` location on 2026-06-19). Holds the actual UI/feature libraries loaded by the renderer. Almost entirely runtime dependencies (**no `devDependencies` block**). Only scripts are `electron-rebuild` and a `postinstall` that runs it. This set is what the renderer bundle (`renderer.dev.js`) is built from; `webpack.config.base.js` reads its `dependencies` to compute externals. Build tooling (webpack/babel/electron-builder) lives entirely in the root manifest, not here.

**Key pinned versions:**

| Name                             | Version                    |
| -------------------------------- | -------------------------- |
| ag-grid-community                | `35.3.1` (pinned, exact)   |
| jquery                           | `^4.0.0-rc.2` ⚠            |
| echarts                          | `^6.1.0`                   |
| i18next                          | `^26.3.1`                  |
| i18next-browser-languagedetector | `^8.2.1`                   |
| i18next-chained-backend          | `^5.0.5`                   |
| i18next-http-backend             | `^4.0.0`                   |
| i18next-localstorage-backend     | `^4.3.1`                   |
| uuid                             | `^14.0.0`                  |
| sweetalert2                      | `^11.26.25`                |
| sortablejs                       | `^1.15.7`                  |
| node-fetch                       | `^4.0.0-beta.4` ⚠          |
| express                          | `^5.2.1`                   |
| jimp                             | `^1.6.1`                   |
| axios                            | `^1.18.0`                  |
| @electron/remote                 | `^2.1.3`                   |
| @fontsource/fira-sans-condensed  | `^5.2.7`                   |
| @fortawesome/fontawesome-free    | `^7.2.0`                   |
| animate.css                      | `^4.1.1`                   |
| awesome-notifications            | `^3.1.3`                   |
| multiple-select                  | `^2.3.1`                   |
| pretty-checkbox                  | `^3.0.3`                   |
| rangeslider-js                   | `^3.2.5`                   |
| server                           | `1.1.0-alpha.9` (pinned) ⚠ |
| string-similarity                | `^4.0.4`                   |
| tinygradient                     | `^2.0.1`                   |
| tippy.js                         | `^6.3.7`                   |
| tree-kill                        | `^1.2.2`                   |
| kill-port                        | `^2.0.1`                   |
| kill-port-process                | `^4.0.2`                   |
| update-electron-app              | `^3.2.0`                   |
| packageManager                   | **ABSENT**                 |
| engines                          | **ABSENT**                 |

**How to update:** edit this manifest, then reinstall its dependencies. Per `install_frontend.ps1`, it is installed in place with `npm install --ignore-scripts --legacy-peer-deps` (the transient `package-lock.json` is removed afterward; no persistent renderer lockfile is kept). Per memory, this install step is not normally required since the app runs from source.

---

## (c) Package-manager & lockfiles

### [1. App/.yarnrc.yml](1.%20App/.yarnrc.yml)

Yarn (Berry) config for the main app. Sets `nodeLinker: node-modules` (classic layout, not PnP), enables install scripts, allows all git repos, and disables the npm minimal-age gate. **No `yarnPath`** — the Yarn version is pinned via the `packageManager` field in the sibling `package.json`.

| Name                                    | Version        |
| --------------------------------------- | -------------- |
| nodeLinker                              | `node-modules` |
| yarn (from package.json packageManager) | `4.17.0`       |
| enableScripts                           | `true`         |
| npmMinimalAgeGate                       | `0`            |

### [1. App/yarn.lock](1.%20App/yarn.lock)

**Active** Yarn 4 (Berry) lockfile for the main app. Modern Berry format. This is the primary, current lockfile.

| Name                               | Version         |
| ---------------------------------- | --------------- |
| `__metadata.version` (lock format) | `10` (Yarn 4.x) |
| `__metadata.cacheKey`              | `10c0`          |

### [1. App/package-lock.json](1.%20App/package-lock.json)

**EMPTY (0 bytes)** npm lockfile colocated with the main app. Contributes no resolution data; stale/unused placeholder — the app is managed by Yarn 4.

| Name            | Version                |
| --------------- | ---------------------- |
| lockfileVersion | (none — file is empty) |

### Archival frontend lockfiles (removed)

The legacy Yarn 1 + npm archival lockfiles formerly described under `…\6. JSON\1. LOCK\1. LOCK\` no longer exist, and the `6. JSON\1. LOCK\` folder itself was removed when the renderer manifest moved to `2. Frontend\1. Source\package.json` (2026-06-19). The renderer keeps **no persistent lockfile** — `install_frontend.ps1` removes the transient `package-lock.json` after each install.

> Not found anywhere outside node_modules: `pnpm-lock.yaml`, `.yarnrc` (classic), `.npmrc`, `.pnpmrc`. No pnpm usage.

**How to update:** regenerate lockfiles by reinstalling after editing the corresponding manifest — `yarn install` in `1. App` regenerates `1. App/yarn.lock`. The empty `1. App/package-lock.json` can be left alone or removed as cleanup; it is not operative.

---

## (d) Java / Maven

### [1. App/3. Backend/1. Source/3. XML/pom.xml](1.%20App/3.%20Backend/1.%20Source/3.%20XML/pom.xml)

**Primary Maven build** for the Java backend (`groupId=fribbels`, `artifactId=backend`). Produces `backend-1.0.2-jar-with-dependencies.jar` via maven-assembly-plugin (`mainClass com.fribbels.Main`). Non-standard layout: build dir `../target`, sourceDirectory `../1. Java`. The compiler plugin **excludes** the numbered source subfolders, so only the `com/fribbels` package tree is compiled (matches the dual-source-tree memory note).

| Name                                        | Version         |
| ------------------------------------------- | --------------- |
| project.version                             | `1.0.2`         |
| maven.compiler source/target/release (Java) | `21`            |
| com.google.code.gson:gson                   | `2.14.0`        |
| com.fasterxml.jackson.jr:jackson-jr-all     | `2.22.0`        |
| com.google.guava:guava                      | `33.6.0-jre`    |
| org.apache.commons:commons-collections4     | `4.5.0`         |
| commons-io:commons-io                       | `2.22.0`        |
| org.apache.commons:commons-lang3            | `3.20.0`        |
| org.junit.jupiter:junit-jupiter-api (test)  | `6.1.0`         |
| org.bytedeco:javacpp (test)                 | `1.5.13`        |
| org.bytedeco:leptonica (test)               | `1.87.0-1.5.13` |
| org.bytedeco:tesseract (test)               | `5.5.2-1.5.13`  |
| org.projectlombok:lombok (provided)         | `1.18.46`       |
| com.aparapi:aparapi                         | `3.0.2`         |
| com.aparapi:aparapi-jni                     | `1.4.3`         |
| maven-resources-plugin                      | `3.2.0`         |
| maven-compiler-plugin                       | `3.13.0`        |
| maven-surefire-plugin                       | `3.2.5`         |
| maven-assembly-plugin                       | `3.7.1`         |

### [1. App/3. Backend/1. Source/3. XML/bin/pom.xml](1.%20App/3.%20Backend/1.%20Source/3.%20XML/bin/pom.xml)

**Eclipse/m2e build-output copy** of the primary pom (lives under a `bin/` output dir). **Byte-identical** to the parent `../pom.xml` — not a distinct module; treat as generated/ignorable.

| Name               | Version                   |
| ------------------ | ------------------------- |
| project.version    | `1.0.2`                   |
| Java release       | `21`                      |
| (all deps/plugins) | identical to `../pom.xml` |

### [1. App/3. Backend/2. Apache Maven/3. Conf/1. Settings/settings.xml](1.%20App/3.%20Backend/2.%20Apache%20Maven/3.%20Conf/1.%20Settings/settings.xml)

Maven `settings.xml` — **unmodified stock Apache Maven 3.8.8 default**. Only non-default content is the standard `maven-default-http-blocker` mirror. No localRepository override, no servers/proxies/profiles.

| Name               | Version          |
| ------------------ | ---------------- |
| settings schema    | `SETTINGS/1.2.0` |
| bundled with Maven | `3.8.8`          |

### [1. App/3. Backend/2. Apache Maven/apache-maven-3.8.8/conf/settings.xml](1.%20App/3.%20Backend/2.%20Apache%20Maven/apache-maven-3.8.8/conf/settings.xml)

Default global `settings.xml` shipped inside the extracted Apache Maven 3.8.8 distribution (downloaded by `build_backend.ps1`). **Byte-identical** to the copy above.

| Name               | Version          |
| ------------------ | ---------------- |
| settings schema    | `SETTINGS/1.2.0` |
| Maven distribution | `3.8.8`          |

> Gradle: **NONE** — this project is Maven-only (no `*.gradle`, no gradle wrapper).

**How to update:** edit version properties/dependency/plugin versions in `1. App/3. Backend/1. Source/3. XML/pom.xml`, then rebuild with `build_backend.ps1` (runs `mvn clean package -Dmaven.test.skip=true`). The `bin/pom.xml` copy and the stock `settings.xml` files generally need no manual edits.

---

## (e) Python

There is **no standard Python dependency manifest** for the project itself (no `requirements.txt`, `pyproject.toml`, `Pipfile`, `poetry.lock`, `environment.yml`, `.python-version`). Python is barely used.

### [1. App/2. Frontend/1. Source/7. PY/1. Scanner/1. Core/scanner.py](1.%20App/2.%20Frontend/1.%20Source/7.%20PY/1.%20Scanner/1.%20Core/scanner.py)

The **only first-party Python script** — the gear auto-importer/scanner. Sniffs Epic Seven game traffic (TCP 5222/3333) via Scapy and prints captured packet hex to stdout for the Electron app to parse. No accompanying dependency file.

| Name                                 | Version                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| scapy (vendored at `7. PY/2. Scapy`) | imported via `from scapy.all import *`; no pin in script (resolves to 2.5.0) |

Runtime requirement: Scapy (vendored), an installed Python interpreter, and a packet-capture driver (Npcap/Wireshark/libpcap). The Electron app spawns the user's own `py`/`python`/`python3`. Compiled `.pyc` artifacts (`cpython-314`) indicate the user has run it under Python 3.14, but that is not a declared pin.

### [1. App/2. Frontend/1. Source/7. PY/2. Scapy/1. Core/**init**.py](1.%20App/2.%20Frontend/1.%20Source/7.%20PY/2.%20Scapy/1.%20Core/__init__.py)

**Vendored Scapy package init** — establishes the bundled Scapy version via its embedded `git_archive_id` (`9473f77d8b v2.5.0`). Renumbered folder layout, no standalone VERSION file.

| Name                                 | Version |
| ------------------------------------ | ------- |
| scapy (vendored, used by scanner.py) | `2.5.0` |

#### Dead Scapy source copy (trash, gitignored via `/2. Personal/`)

These belong to a dead/vendored upstream Scapy source tree under `2. Personal\lib Trash Folder\py dead\` — **not the optimizer's own manifests**. Recorded for completeness only.

- [2. Personal/lib Trash Folder/py dead/setup.py](2.%20Personal/lib%20Trash%20Folder/py%20dead/setup.py) — Scapy packaging. `version` is dynamic (`scapy.VERSION` → 2.5.0). `python_requires='>=2.7, !=3.0.*, !=3.1.*, !=3.2.*, !=3.3.*, <4'`. Optional extras only (cryptography `>=2.0`, sphinx `>=3.0.0`, sphinx_rtd_theme `>=0.4.3`, tox `>=3.0.0`, ipython/pyx/matplotlib unpinned). License GPL-2.0-only.
- [2. Personal/lib Trash Folder/py dead/setup.cfg](2.%20Personal/lib%20Trash%20Folder/py%20dead/setup.cfg) — no version/dependency declarations; only bdist_wheel/sdist/coverage config.
- [2. Personal/lib Trash Folder/py dead/tox.ini](2.%20Personal/lib%20Trash%20Folder/py%20dead/tox.ini) — test-env deps (setuptools `>=18.5`, mock/ipython/cryptography/coverage/python-can unpinned, brotli/zstandard non-win32). Interpreter matrix py27/34-310 + PyPy; `minversion=2.9`.
- [2. Personal/lib Trash Folder/py dead/.readthedocs.yml](2.%20Personal/lib%20Trash%20Folder/py%20dead/.readthedocs.yml) — docs build pins Python `3.9`, installs `.` with `docs` extra, OS ubuntu-20.04.

**How to update:** there is nothing to "bump" via a package manager — the scanner relies on a vendored Scapy (2.5.0) and the user's own Python install. To upgrade Scapy, replace the vendored tree under `7. PY/2. Scapy` (and update the embedded version). The `py dead` trash copy can be ignored.

---

## (f) Runtimes & CI

The project has **no first-party CI** — the repo's own `.github/` holds only Copilot chatmode/instruction `.md` files (no workflows). No GitLab/Azure/Docker. Runtime version pins live in the build scripts below. No `.nvmrc`, `.node-version`, `.tool-versions`, `.java-version`, `.sdkmanrc`, `mise.toml`, or Volta config exist outside node_modules.

### [1. App/1. Master/2. PS1/build_backend.ps1](1.%20App/1.%20Master/2.%20PS1/build_backend.ps1)

Backend build script. Pins `JAVA_HOME` to the JDK bundled with the VS Code Red Hat Java extension, auto-downloads/extracts Apache Maven 3.8.8 if `mvn.cmd` is missing, runs `mvn clean package -Dmaven.test.skip=true`, then copies the resulting JAR to `1. Master\3. Jar\backend.jar` and mirrors into `2. Class\1. JARs`.

| Name                   | Version                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| Pinned JDK (JAVA_HOME) | `21.0.10` (`F:\VSCode-Data\extensions\redhat.java-1.54.0-win32-x64\jre\21.0.10-win32-x86_64`)            |
| Apache Maven           | `3.8.8` (from `https://archive.apache.org/dist/maven/maven-3/3.8.8/binaries/apache-maven-3.8.8-bin.zip`) |
| backend jar output     | `backend-1.0.2`                                                                                          |

> JDK path is tied to redhat.java extension **1.54.0**; the script errors with a maintenance reminder if that path no longer exists. **Version mismatch:** the pom builds `1.0.2` but the archive copy is renamed to `1.0.1`.

### [1. App/1. Master/1. BAT/start-dev.bat](1.%20App/1.%20Master/1.%20BAT/start-dev.bat)

Dev launcher for the Electron frontend (`yarn dev`). Also pins `JAVA_HOME` (the backend jar runs as a Java child process at runtime) and prepends Node/npm-global dirs to PATH.

| Name                   | Version                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| Pinned JDK (JAVA_HOME) | `21.0.10` (same path as build_backend.ps1)                         |
| Node path              | `E:\Node` (+ `F:\VSCode-Data\npm-global`, `%APPDATA%\npm` on PATH) |

### [1. App/1. Master/2. PS1/install_frontend.ps1](1.%20App/1.%20Master/2.%20PS1/install_frontend.ps1)

Frontend dependency installer (npm). Runs `npm install --ignore-scripts --legacy-peer-deps` in the Source dir against the canonical in-place `2. Frontend/1. Source/package.json`, then removes the transient `package-lock.json` and any stray electron peer-dep stub. No JDK/Maven involved.

| Name              | Version                               |
| ----------------- | ------------------------------------- |
| npm install flags | `--ignore-scripts --legacy-peer-deps` |

#### Dead Scapy CI (third-party, trash folder — NOT this project's CI)

- [2. Personal/lib Trash Folder/py dead/.github/workflows/unittests.yml](2.%20Personal/lib%20Trash%20Folder/py%20dead/.github/workflows/unittests.yml) — runners ubuntu-latest/ubuntu-20.04/macos-12; Python matrix 3.7–3.10, 2.7, pypy2.7/3.9; `actions/checkout@v3`, `actions/setup-python@v4`, `codecov/codecov-action@v2`, `github/codeql-action@v2`.
- [2. Personal/lib Trash Folder/py dead/.travis.yml](2.%20Personal/lib%20Trash%20Folder/py%20dead/.travis.yml) — `dist: bionic` (Ubuntu 18.04), python `3.8`.
- [2. Personal/lib Trash Folder/py dead/.appveyor.yml](2.%20Personal/lib%20Trash%20Folder/py%20dead/.appveyor.yml) — Windows Python 2.7.x x64 (TOXENV py27-windows) and 3.7.x x64 (py37-windows); installs npcap/winpcap/wireshark via choco.

**How to update:** to change the JDK, update the `redhat.java-<version>` path in **both** `build_backend.ps1` and `start-dev.bat` (currently pinned to extension 1.54.0 / JDK 21.0.10). To change Maven, update the download URL/version in `build_backend.ps1`. The dead Scapy CI files are third-party trash and should not be touched.

---

## (g) Build-tooling configs

All real build configs live under `1. App/` (root + `4. Both/1. Webpack/` + `4. Both/2. Build/1. Scripts/`). No standalone `.babelrc`, `.browserslistrc`, `.prettierrc`, `.stylelintrc`, or flat `eslint.config.*` exist outside node_modules. The strongest explicit JS-version pin in the repo is the TypeScript `target: ES2018`.

### [1. App/babel.config.cjs](1.%20App/babel.config.cjs)

Babel transpilation config (ERB style). Presets: `@babel/preset-env` (+ preset-typescript, preset-react). Remaining proposal plugins: function-bind, export-default-from, do-expressions, decorators (`version:'legacy'`), function-sent, throw-expressions. Splits dev vs prod plugins. CommonJS module format. The **only** JS-target lever is the **empty** `browserslist` in `package.json`, so preset-env falls back to its default. **Migrated to Babel 8 this session**: removed now-stable proposal/syntax plugins, dropped unused pipeline, `decorators` `legacy:true` → `version:'legacy'`, and per-plugin `loose` → top-level `assumptions` (`setPublicClassFields` + `privateFieldsAsProperties`). No explicit version pins of its own.

### [1. App/4. Both/2. Build/1. Scripts/BabelRegister.js](1.%20App/4.%20Both/2.%20Build/1.%20Scripts/BabelRegister.js)

Runtime Babel hook (`@babel/register`). The webpack configs no longer rely on it (renamed `.babel.js` → `.js`, loaded natively as CommonJS this session); `@babel/register@8` is still preloaded via `node -r @babel/register` for the build helper scripts (CheckPortInUse.js, CheckNativeDep.js). Extensions: `.es6/.es/.jsx/.js/.mjs/.ts/.tsx`. No version/target pins — inherits `babel.config.cjs`.

### [1. App/4. Both/1. Webpack/webpack.config.base.js](1.%20App/4.%20Both/1.%20Webpack/webpack.config.base.js)

Shared base webpack config. `babel-loader` for `.tsx?`; externals derived from the **renderer** manifest (`2. Frontend/1. Source/package.json`); resolve `.js/.jsx/.json/.ts/.tsx`; `EnvironmentPlugin NODE_ENV=production`. Webpack 5 (no version literal in file; target controlled by babel).

### [1. App/4. Both/1. Webpack/webpack.config.renderer.dev.js](1.%20App/4.%20Both/1.%20Webpack/webpack.config.renderer.dev.js)

Development renderer build + HMR. `mode=development`, `target=electron-renderer`, `devtool=inline-source-map`, port **1212** (PORT env override), `writeToDisk` for `renderer.dev.js`, DllReferencePlugin. JS target inherited from babel.

### [1. App/4. Both/1. Webpack/webpack.config.renderer.dev.dll.js](1.%20App/4.%20Both/1.%20Webpack/webpack.config.renderer.dev.dll.js)

Builds the renderer DLL (DllPlugin) for faster dev rebuilds. `mode=development`, `target=electron-renderer`, entry = `Object.keys(dependencies)` from `1. App/package.json`, externals fsevents+crypto-browserify. No ES/browser target pins.

### [1. App/4. Both/1. Webpack/webpack.config.renderer.prod.js](1.%20App/4.%20Both/1.%20Webpack/webpack.config.renderer.prod.js)

Production renderer build. `mode=production`, target `electron-renderer`/`electron-preload` (env-dependent), entry includes core-js + regenerator-runtime + index.tsx, output `renderer.prod.js` to `8. DIST`. TerserPlugin + CssMinimizerPlugin + MiniCssExtractPlugin. No explicit browserslist/ES target — relies on babel + core-js polyfilling.

### [1. App/4. Both/1. Webpack/webpack.config.main.prod.js](1.%20App/4.%20Both/1.%20Webpack/webpack.config.main.prod.js)

Production build for the Electron MAIN process. `mode=production`, `target=electron-main`, entry `./5. Dev Only/main.dev.js`, output `./2. Frontend/1. Source/main.prod.js`, TerserPlugin minify. No ES/browser target pins.

### [1. App/4. Both/1. Webpack/webpack.config.eslint.js](1.%20App/4.%20Both/1.%20Webpack/webpack.config.eslint.js)

ESLint resolver shim. **Converted to a plain CJS re-export this session** (`module.exports = require('./webpack.config.renderer.dev.js')`) — no longer imports `@babel/register`, since the dev config is now plain CommonJS. No own version pins. **Note:** `.eslintrc.js` references it as `./configs/webpack.config.eslint.js` but the file actually lives in `4. Both/1. Webpack/` — path looks stale/mismatched.

### [1. App/tsconfig.json](1.%20App/tsconfig.json)

Primary TypeScript compiler config (noEmit type-checking). `jsx=react`, `strict=true`, `allowJs`, `esModuleInterop`, `resolveJsonModule`, extra `noUnused*` checks. **Strongest explicit JS-version pin in the repo.**

| Name               | Version                     |
| ------------------ | --------------------------- |
| target             | `ES2018`                    |
| lib                | `["dom","esnext"]`          |
| module             | `CommonJS`                  |
| moduleResolution   | `node`                      |
| jsx                | `react`                     |
| ignoreDeprecations | `6.0`                       |
| skipLibCheck       | `true` (added this session) |

### [1. App/tsconfig.eslint.json](1.%20App/tsconfig.eslint.json)

TS config variant for ESLint type-aware linting (referenced via `parserOptions.project`). Same `compilerOptions` as `tsconfig.json` (duplicate, no `extends`).

| Name               | Version                     |
| ------------------ | --------------------------- |
| target             | `ES2018`                    |
| lib                | `["dom","esnext"]`          |
| module             | `CommonJS`                  |
| moduleResolution   | `node`                      |
| jsx                | `react`                     |
| ignoreDeprecations | `6.0`                       |
| skipLibCheck       | `true` (added this session) |

### [1. App/.eslintrc.js](1.%20App/.eslintrc.js)

Root ESLint config. Extends `erb/typescript`. `import/no-extraneous-dependencies` off. Resolver: node + webpack. TS parser for `.ts/.tsx`.

| Name                      | Version                  |
| ------------------------- | ------------------------ |
| parserOptions.ecmaVersion | `2020`                   |
| sourceType                | `module`                 |
| parserOptions.project     | `./tsconfig.eslint.json` |

> **Mismatch:** ESLint `ecmaVersion 2020` vs tsconfig `target ES2018`. Webpack resolver path `configs/webpack.config.eslint.js` does not match the actual file location — likely stale.

### [1. App/4. Both/1. Webpack/.eslintrc](1.%20App/4.%20Both/1.%20Webpack/.eslintrc)

ESLint override for the webpack-config folder. Turns off `no-console`, `global-require`, `import/no-dynamic-require`. Rules-only; no version pins.

### [1. App/4. Both/2. Build/1. Scripts/.eslintrc](1.%20App/4.%20Both/2.%20Build/1.%20Scripts/.eslintrc)

ESLint override for the build-scripts folder. Turns off `no-console`, `global-require`, `import/no-dynamic-require`, `import/no-extraneous-dependencies`. Rules-only; no version pins.

**How to update:** these configs reference tooling whose versions are pinned in `1. App/package.json` (babel/webpack/typescript/eslint families) — bump there and reinstall. Target/lib changes are made directly in `tsconfig.json`/`tsconfig.eslint.json`; ECMA target for runtime output is governed by the (currently empty) `browserslist` + babel preset-env.

---

## (h) Other

### [2. Personal/lib Trash Folder/dev-app-update.yml](2.%20Personal/lib%20Trash%20Folder/dev-app-update.yml)

electron-updater dev feed descriptor (`app-update.yml` family). Points the auto-updater at a GitHub release feed. **No declared software version**, but it is an update-channel manifest. Lives in a **gitignored** trash folder (`/2. Personal/`) — likely stale; the active publish config is inlined in `1. App\package.json` `build.publish`. No `latest.yml`/`latest-mac.yml`/`latest-linux.yml` exist (those are build-generated).

| Name                | Version                               |
| ------------------- | ------------------------------------- |
| provider            | `github`                              |
| owner/repo          | `RexQian / Fribbels-Epic-7-Optimizer` |
| updaterCacheDirName | `poge7optimizer-updater`              |

### [1. App/3. Backend/1. Source/3. XML/Gear.iml](1.%20App/3.%20Backend/1.%20Source/3.%20XML/Gear.iml)

IntelliJ IDEA module file pinning Java library versions directly — **NOT** the Maven pom, and the versions **DISAGREE** with the pom (stale/divergent).

| Name                               | Version                   | vs pom.xml                    |
| ---------------------------------- | ------------------------- | ----------------------------- |
| JUnit5 (jupiter/api/params/engine) | `5.4.2`, platform `1.4.2` | pom junit-jupiter-api `6.1.0` |
| apiguardian-api                    | `1.0.0`                   | —                             |
| opentest4j                         | `1.1.1`                   | —                             |
| com.google.code.gson:gson          | `2.8.6`                   | pom `2.14.0`                  |
| org.openpnp:opencv                 | `3.4.2-1`                 | pom has no opencv             |
| commons-io:commons-io              | `2.7`                     | pom `2.22.0`                  |
| org.bytedeco:tesseract-platform    | `4.0.0-1.5`               | pom tesseract `5.5.2-1.5.13`  |

### [1. App/3. Backend/1. Source/3. XML/bin/Gear.iml](1.%20App/3.%20Backend/1.%20Source/3.%20XML/bin/Gear.iml)

Duplicate IntelliJ `.iml` in the `bin/` output mirror — **byte-identical** version pins to the parent `Gear.iml`. Same stale-version caveat.

| Name                          | Version           |
| ----------------------------- | ----------------- |
| JUnit5 / platform             | `5.4.2` / `1.4.2` |
| gson                          | `2.8.6`           |
| opencv (org.openpnp)          | `3.4.2-1`         |
| commons-io                    | `2.7`             |
| tesseract-platform (bytedeco) | `4.0.0-1.5`       |

### [2. Personal/README.md](2.%20Personal/README.md)

Project README stating a required runtime version in prose (no shields.io badges). The ko-kr localized README (`localization\ko-kr\1. App\README.md`) repeats the same requirement.

| Name                      | Version                 |
| ------------------------- | ----------------------- |
| Java (stated requirement) | `8+` (64-bit)           |
| OS                        | 64-bit Windows or macOS |

> **Mismatch:** README states "Java 8+" but the actual build target is **Java 21** (`maven.compiler.release=21`).

**How to update:** `Gear.iml` files are IntelliJ artifacts — either delete/regenerate them in the IDE or align their library entries with `pom.xml` (the authoritative source). `dev-app-update.yml` is a stale dev artifact in a gitignored folder. Update the README's stated Java requirement to match the actual Java 21 build target.

---

## ⚠ Watch — bleeding-edge / pre-release & mismatches

**Pre-release pins (alpha / beta / rc / canary / esm) — root build manifest (`1. App/package.json`):**

- `electron ^43.0.0-beta.3`, `electron-builder ^27.0.0-alpha.3`, `electron-updater ^7.0.0-alpha.2`
- `@babel/core ^8.0.0-alpha.17` and the entire `@babel/preset-*` / `@babel/plugin-*` 8.x family on `rc.6` / `alpha` / `esm.4`
- `babel-eslint ^11.0.0-beta.2`
- `react`, `react-dom`, `react-test-renderer` → `^19.3.0-canary-fef12a01-20260413`
- `connected-react-router ^7.0.0-alpha.0`
- `prettier ^4.0.0-alpha.13`
- `@typescript-eslint/eslint-plugin` & `parser ^8.61.2-alpha.2`
- `core-js ^4.0.0-alpha.1`
- `@amilajack/testcafe-browser-provider-electron ^0.0.15-alpha.1`

**Pre-release pins — renderer runtime manifest (`2. Frontend/1. Source/package.json`):**

- `jquery ^4.0.0-rc.2`, `node-fetch ^4.0.0-beta.4`, `server 1.1.0-alpha.9`
- bleeding-edge stable majors: `uuid ^14.0.0`, `ag-grid-community 35.3.1` (exact pin), `echarts ^6.1.0`, `express ^5.2.1`

**Known mismatches to flag for the planner:**

- **Java requirement mismatch:** README says "Java 8+" but pom compiles to **Java 21**.
- **Backend jar version mismatch:** pom builds `backend-1.0.2`, but `build_backend.ps1` renames the archive copy to `1.0.1`.
- **Stale `Gear.iml` library versions** diverge from the authoritative pom (gson 2.8.6 vs 2.14.0; commons-io 2.7 vs 2.22.0; JUnit 5.4.2 vs jupiter-api 6.1.0; opencv present in .iml but absent from pom).
- **enzyme-adapter-react-16** (`^1.15.8`) is a React-16 test adapter while React is pinned to 19 canary — adapter/React major mismatch.
- **TS target ES2018 vs ESLint ecmaVersion 2020** — slight inconsistency.
- **Empty `browserslist`** in `1. App/package.json` means babel preset-env falls back to default (full ES5) — no intentional target.
- **Empty `1. App/package-lock.json`** (0 bytes) coexists with the active Yarn 4 lockfile — stale.
- **Stale eslint webpack-resolver path** (`configs/webpack.config.eslint.js`) does not match the actual file location.
- **No `engines` field** in either first-party manifest; runtime versions (JDK 21.0.10, Node, Maven 3.8.8) are pinned only in the PS1/BAT scripts and tied to the redhat.java extension **1.54.0** path.

---

## Verification Checklist

Tick each manifest once you've confirmed its pins are intentional / up to date:

**Node/JS — Build tooling**

- [ ] `1. App/package.json` (root build/electron manifest)

**Node/JS — Runtime deps**

- [ ] `1. App/2. Frontend/1. Source/package.json` (renderer runtime)

**Package-manager & lockfiles**

- [ ] `1. App/.yarnrc.yml`
- [ ] `1. App/yarn.lock` (active, Berry v10)
- [ ] `1. App/package-lock.json` (empty — decide keep/remove)

**Java / Maven**

- [ ] `1. App/3. Backend/1. Source/3. XML/pom.xml` (authoritative)
- [ ] `1. App/3. Backend/1. Source/3. XML/bin/pom.xml` (generated copy — ignore/regenerate)
- [ ] `1. App/3. Backend/2. Apache Maven/3. Conf/1. Settings/settings.xml` (stock)
- [ ] `1. App/3. Backend/2. Apache Maven/apache-maven-3.8.8/conf/settings.xml` (stock)

**Python**

- [ ] `1. App/2. Frontend/1. Source/7. PY/1. Scanner/1. Core/scanner.py` (scanner script)
- [ ] `1. App/2. Frontend/1. Source/7. PY/2. Scapy/1. Core/__init__.py` (vendored Scapy 2.5.0)
- [ ] `2. Personal/lib Trash Folder/py dead/*` (dead Scapy — confirm ignorable)

**Runtimes & CI**

- [ ] `1. App/1. Master/2. PS1/build_backend.ps1` (JDK 21.0.10 / Maven 3.8.8 pins)
- [ ] `1. App/1. Master/1. BAT/start-dev.bat` (JDK / Node path pins)
- [ ] `1. App/1. Master/2. PS1/install_frontend.ps1` (npm install flags)
- [ ] dead Scapy CI files (third-party — confirm ignorable)

**Build-tooling configs**

- [ ] `1. App/babel.config.cjs`
- [ ] `1. App/4. Both/2. Build/1. Scripts/BabelRegister.js`
- [ ] `1. App/4. Both/1. Webpack/webpack.config.base.js`
- [ ] `1. App/4. Both/1. Webpack/webpack.config.renderer.dev.js`
- [ ] `1. App/4. Both/1. Webpack/webpack.config.renderer.dev.dll.js`
- [ ] `1. App/4. Both/1. Webpack/webpack.config.renderer.prod.js`
- [ ] `1. App/4. Both/1. Webpack/webpack.config.main.prod.js`
- [ ] `1. App/4. Both/1. Webpack/webpack.config.eslint.js`
- [ ] `1. App/tsconfig.json`
- [ ] `1. App/tsconfig.eslint.json`
- [ ] `1. App/.eslintrc.js`
- [ ] `1. App/4. Both/1. Webpack/.eslintrc`
- [ ] `1. App/4. Both/2. Build/1. Scripts/.eslintrc`

**Other**

- [ ] `2. Personal/lib Trash Folder/dev-app-update.yml` (stale dev feed)
- [ ] `1. App/3. Backend/1. Source/3. XML/Gear.iml` (stale vs pom)
- [ ] `1. App/3. Backend/1. Source/3. XML/bin/Gear.iml` (stale vs pom)
- [ ] `2. Personal/README.md` (Java requirement vs actual Java 21)

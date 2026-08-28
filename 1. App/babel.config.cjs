/**
 * Babel config — consumed ONLY by `node -r @babel/register`, to transpile the two ESM
 * build-helper scripts (4. Both/2. Build/1. Scripts/CheckPortInUse.js + CheckNativeDep.js)
 * down to CommonJS at runtime. preset-env's module transform (auto → CJS under the
 * CommonJS caller) is all that's needed.
 *
 * The renderer is bundled by webpack 5 (no babel-loader) and runs in Electron's modern
 * Chromium, so no other Babel presets/plugins are required.
 */
module.exports = {
  presets: [require('@babel/preset-env')],
};

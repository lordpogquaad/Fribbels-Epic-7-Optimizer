const path = require('node:path');
const fs = require('node:fs');

// Production webpack emits `.js.map` files in two spots: renderer maps land in
// `8. DIST`, the main-process map lands in the Source root. Delete both with a
// plain readdir+unlink (non-recursive, top-level only). node:fs avoids the
// cross-platform glob footgun where path.join's Windows backslashes were treated
// as escape characters and silently matched nothing.
const targetDirs = [
  path.join(__dirname, '../../../2. Frontend/1. Source/8. DIST'),
  path.join(__dirname, '../../../2. Frontend/1. Source'),
];

module.exports = function deleteSourceMaps() {
  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      if (entry.endsWith('.js.map')) {
        fs.rmSync(path.join(dir, entry), { force: true });
      }
    }
  }
};

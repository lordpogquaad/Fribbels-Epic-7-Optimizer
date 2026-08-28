const path = require('node:path');
const fs = require('node:fs');

const srcDir = path.join(
  __dirname,
  '../../../2. Frontend/1. Source/3. ASSETS/1. PNG',
);
const destDir = path.join(
  __dirname,
  '../../../2. Frontend/1. Source/1. HTML/assets',
);

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

let added = 0;
let updated = 0;
let skipped = 0;

function copyFlat(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      copyFlat(fullPath);
    } else if (/\.(png|jpg|ico|gif|webp)$/i.test(entry.name)) {
      const dest = path.join(destDir, entry.name);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(fullPath, dest);
        added++;
        continue;
      }
      // Cheap size+mtime staleness check (no hashing — ~1,750 files on every
      // build). copyFileSync preserves the source mtime on the copy, so a
      // synced-but-unchanged source keeps dest.mtimeMs >= src.mtimeMs and the
      // next build reports it skipped rather than re-copied.
      const srcStat = fs.statSync(fullPath);
      const destStat = fs.statSync(dest);
      if (srcStat.size !== destStat.size || srcStat.mtimeMs > destStat.mtimeMs) {
        fs.copyFileSync(fullPath, dest);
        updated++;
      } else {
        skipped++;
      }
    }
  }
}

copyFlat(srcDir);
// Build-time Node script (can't read the renderer LogControl); E7_BUILD_QUIET silences
// routine build chatter — see 5. Dev Only/LogControl.js header.
if (!process.env.E7_BUILD_QUIET) {
  console.log(
    `CopyAssets: ${added} new, ${updated} updated, ${skipped} skipped (unchanged) → ${destDir}`,
  );
}

import fs from 'node:fs';
import Files from '../1. Core/files';

// ---------------------------------------------------------------------------
// Tiny JSON disk cache shared by the RTA / community / Stove services.  Stores
// files under the app cache dir (cache/<fileName>) using the same Files helper
// HeroData uses.  Best-effort: any fs error (missing dir, permissions, bad JSON)
// degrades silently to a live fetch.  TTL/keying is the caller's responsibility.
// ---------------------------------------------------------------------------

function _filePath(fileName) {
  return `${Files.getCachePath()}/cache/${fileName}`;
}

export function readDiskCache(fileName) {
  try {
    return JSON.parse(Files.readFileSync(_filePath(fileName)));
  } catch {
    return null; // no/invalid cache
  }
}

export function writeDiskCache(fileName, obj) {
  try {
    // Ensure the cache/ subdir exists (Files.saveFile won't create parents).
    fs.mkdirSync(Files.path(`${Files.getCachePath()}/cache`), {
      recursive: true,
    });
    Files.saveFile(_filePath(fileName), JSON.stringify(obj));
  } catch {
    // best-effort; the disk cache is an optimization only
  }
}

/**
 * ArchetypeStore — file-backed singleton for persisting user archetype
 * definitions. Saves to Documents/FribbelsOptimizerSaves/e7-archetypes.json,
 * the same folder used by the main optimizer saves. This ensures archetypes
 * survive app restarts, force-reloads, and Electron dev-mode localStorage clears.
 * Falls back to DEFAULT_ARCHETYPES on first run or after a reset.
 *
 * Dispatches a global CustomEvent 'archetypesChanged' after any mutation; the
 * items grid (itemsGrid.js) listens for it to repopulate its group filter and
 * refresh its score cells.
 */

import { DEFAULT_ARCHETYPES } from './defaultArchetypes.js';

const _remote = require('@electron/remote');
const _fs = require('node:fs');
const _path = require('node:path');

// Diagnostic logging uses the central Log utility (Log.debug, gated by window.__optDebug; see 5. Dev Only/LogControl.js).

// Compute paths ONCE at module load time — same pattern as saves.js so that
// remote.app.getPath() is never called lazily (which can fail silently in
// some Electron HMR scenarios).
const _DOCS_PATH = _remote.app.getPath('documents');
const _SAVES_DIR = _path.join(_DOCS_PATH, 'FribbelsOptimizerSaves');
const _FILE_PATH = _path.join(_SAVES_DIR, 'e7-archetypes.json');
Log.debug('[ArchetypeStore] module loaded | file:', _FILE_PATH);

let _cache = null;

function _dispatch() {
  globalThis.dispatchEvent(new CustomEvent('archetypesChanged'));
}

function _save(archetypes) {
  _cache = archetypes; // always update in-memory cache first
  Log.debug(
    '[ArchetypeStore] _save → writing',
    archetypes.length,
    'archetypes to:',
    _FILE_PATH,
  );
  try {
    if (!_fs.existsSync(_SAVES_DIR)) {
      _fs.mkdirSync(_SAVES_DIR, { recursive: true });
    }
    _fs.writeFileSync(_FILE_PATH, JSON.stringify(archetypes), 'utf8');
    Log.debug('[ArchetypeStore] _save → write OK');
  } catch (e) {
    Log.error('[ArchetypeStore] File write FAILED:', e);
  }
}

const ArchetypeStore = {
  /**
   * Load archetypes from Documents/FribbelsOptimizerSaves/e7-archetypes.json.
   * Caches the parsed result in _cache and returns the cached reference.
   * @returns {object[]}
   */
  loadArchetypes() {
    const _isValid = (parsed) =>
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every(
        (a) =>
          typeof a.id === 'string' &&
          a.id.length > 0 &&
          Array.isArray(a.substats),
      );

    // Try the save file (same folder as autosave.json)
    try {
      Log.debug(
        '[ArchetypeStore] loadArchetypes → looking for:',
        _FILE_PATH,
        '| exists:',
        _fs.existsSync(_FILE_PATH),
      );
      if (_fs.existsSync(_FILE_PATH)) {
        const raw = _fs.readFileSync(_FILE_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        if (_isValid(parsed)) {
          Log.debug(
            '[ArchetypeStore] loadArchetypes → loaded',
            parsed.length,
            'archetypes from file',
          );
          _cache = parsed;
          return _cache;
        }
        Log.warn(
          '[ArchetypeStore] loadArchetypes → file exists but failed validation, seeding defaults',
        );
      }
    } catch (e) {
      Log.error('[ArchetypeStore] File read FAILED:', e);
    }

    // First run or corrupt data — seed with defaults and save
    _save(DEFAULT_ARCHETYPES.map((a) => structuredClone(a)));
    return _cache;
  },

  /**
   * Get archetypes, loading from storage on first call (lazy init).
   * @returns {object[]}
   */
  getArchetypes() {
    if (!_cache) {
      this.loadArchetypes();
    }
    return _cache;
  },

  /**
   * Persist the provided archetypes array and notify listeners.
   * If the input is corrupt or empty, falls back to DEFAULT_ARCHETYPES.
   * @param {object[]} archetypes
   */
  saveArchetypes(archetypes) {
    // Only reject if the data is clearly corrupt (empty IDs were the corruption signal).
    // Allow archetypes with empty substats so newly added rows can be saved.
    const isValidInput =
      Array.isArray(archetypes) &&
      archetypes.length > 0 &&
      archetypes.every((a) => typeof a.id === 'string' && a.id.length > 0);
    if (!isValidInput) {
      Log.error(
        '[ArchetypeStore] saveArchetypes: invalid/empty input — falling back to DEFAULT_ARCHETYPES! Input was:',
        archetypes,
      );
    }
    const toSave = isValidInput
      ? archetypes
      : DEFAULT_ARCHETYPES.map((a) => structuredClone(a));
    _save(toSave);
    _dispatch();
  },

  /**
   * Reset to the built-in defaults, persist, and notify.
   * Writes a timestamped backup of the current archetypes first so the user
   * can always recover via Import JSON if the reset was accidental.
   */
  resetToDefaults() {
    // Backup current archetypes before overwriting
    if (_cache && _cache.length > 0) {
      try {
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = _path.join(
          _SAVES_DIR,
          `e7-archetypes-backup-${ts}.json`,
        );
        _fs.writeFileSync(backupPath, JSON.stringify(_cache), 'utf8');
        Log.debug(
          '[ArchetypeStore] resetToDefaults → backup written to:',
          backupPath,
        );
      } catch (e) {
        Log.warn('[ArchetypeStore] resetToDefaults → backup FAILED:', e);
      }
    }
    _save(DEFAULT_ARCHETYPES.map((a) => structuredClone(a)));
    _dispatch();
  },

  /**
   * Append a new archetype and persist.
   * @param {object} archetype
   */
  addArchetype(archetype) {
    const archetypes = this.getArchetypes().slice();
    archetypes.push(archetype);
    _save(archetypes);
    _dispatch();
  },

  /**
   * Update fields on an existing archetype by id, then persist.
   * @param {string} id      - Archetype id to update
   * @param {object} changes - Partial object merged into the archetype
   */
  updateArchetype(id, changes) {
    const archetypes = this.getArchetypes().map((a) =>
      a.id === id ? { ...a, ...changes } : a,
    );
    _save(archetypes);
    _dispatch();
  },

  /**
   * Remove an archetype by id and persist.
   * @param {string} id
   */
  removeArchetype(id) {
    const archetypes = this.getArchetypes().filter((a) => a.id !== id);
    _save(archetypes);
    _dispatch();
  },
};

export default ArchetypeStore;

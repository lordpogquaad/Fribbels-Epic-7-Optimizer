/**
 * ArchetypeStore — file-backed singleton for persisting user archetype
 * definitions. Saves to Documents/FribbelsOptimizerSaves/e7-archetypes.json,
 * the same folder used by the main optimizer saves. This ensures archetypes
 * survive app restarts, force-reloads, and Electron dev-mode localStorage clears.
 * Falls back to DEFAULT_ARCHETYPES on first run or after a reset.
 *
 * Dispatches a global CustomEvent 'archetypesChanged' after any mutation so
 * that the items grid and enhancing tab can refresh their displays.
 */

import { DEFAULT_ARCHETYPES } from './defaultArchetypes.js';

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
const _remote = require('@electron/remote');
const _fs     = require('fs');
const _path   = require('path');

// Compute paths ONCE at module load time — same pattern as saves.js so that
// remote.app.getPath() is never called lazily (which can fail silently in
// some Electron HMR scenarios).
const _DOCS_PATH  = _remote.app.getPath('documents');
const _SAVES_DIR  = _path.join(_DOCS_PATH, 'FribbelsOptimizerSaves');
const _FILE_PATH  = _path.join(_SAVES_DIR, 'e7-archetypes.json');
console.log('[ArchetypeStore] module loaded | file:', _FILE_PATH);

let _cache = null;

function _dispatch() {
    window.dispatchEvent(new CustomEvent('archetypesChanged'));
}

function _save(archetypes) {
    _cache = archetypes; // always update in-memory cache first
    console.log('[ArchetypeStore] _save → writing', archetypes.length, 'archetypes to:', _FILE_PATH);
    try {
        if (!_fs.existsSync(_SAVES_DIR)) {
            _fs.mkdirSync(_SAVES_DIR, { recursive: true });
        }
        _fs.writeFileSync(_FILE_PATH, JSON.stringify(archetypes), 'utf8');
        console.log('[ArchetypeStore] _save → write OK');
    } catch (e) {
        console.error('[ArchetypeStore] File write FAILED:', e);
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
            parsed.every((a) =>
                typeof a.id === 'string' && a.id.length > 0 &&
                Array.isArray(a.substats)
            );

        // Try the save file (same folder as autosave.json)
        try {
            console.log('[ArchetypeStore] loadArchetypes → looking for:', _FILE_PATH, '| exists:', _fs.existsSync(_FILE_PATH));
            if (_fs.existsSync(_FILE_PATH)) {
                const raw = _fs.readFileSync(_FILE_PATH, 'utf8');
                const parsed = JSON.parse(raw);
                if (_isValid(parsed)) {
                    console.log('[ArchetypeStore] loadArchetypes → loaded', parsed.length, 'archetypes from file');
                    _cache = parsed;
                    return _cache;
                }
                console.warn('[ArchetypeStore] loadArchetypes → file exists but failed validation, seeding defaults');
            }
        } catch (e) {
            console.error('[ArchetypeStore] File read FAILED:', e);
        }

        // First run or corrupt data — seed with defaults and save
        _save(DEFAULT_ARCHETYPES.map((a) => JSON.parse(JSON.stringify(a))));
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
            archetypes.every((a) =>
                typeof a.id === 'string' && a.id.length > 0,
            );
        if (!isValidInput) {
            console.error('[ArchetypeStore] saveArchetypes: invalid/empty input — falling back to DEFAULT_ARCHETYPES! Input was:', archetypes);
        }
        const toSave = isValidInput
            ? archetypes
            : DEFAULT_ARCHETYPES.map((a) => JSON.parse(JSON.stringify(a)));
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
                const backupPath = _path.join(_SAVES_DIR, `e7-archetypes-backup-${ts}.json`);
                _fs.writeFileSync(backupPath, JSON.stringify(_cache), 'utf8');
                console.log('[ArchetypeStore] resetToDefaults → backup written to:', backupPath);
            } catch (e) {
                console.warn('[ArchetypeStore] resetToDefaults → backup FAILED:', e);
            }
        }
        _save(DEFAULT_ARCHETYPES.map((a) => JSON.parse(JSON.stringify(a))));
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

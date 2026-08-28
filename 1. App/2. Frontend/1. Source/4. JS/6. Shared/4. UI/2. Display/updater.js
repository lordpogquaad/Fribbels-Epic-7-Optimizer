/* global Dialog */

const remote = require('@electron/remote');

// Single source of truth: the packaged app version from 1. App/package.json,
// surfaced to the renderer via @electron/remote (app.getVersion()). This keeps
// the displayed version + the update-check comparison from drifting out of sync
// with the manifest. Falls back to a literal only if remote is unavailable.
const currentVersion = (() => {
  try {
    return remote.app.getVersion();
  } catch {
    return '1.12.0';
  }
})();

global.TEST = false;

/** ******************************************************************************************
    Release checklist:
    - update changelog
    - set TEST = false
    - package jar
    - update version here
    - update version in app package.json
    - update repo in project package.json
    - yarn package

    Patch update checklist
    - Update server temp unit ids
    - Update server temp items
    - Scan artifact ids, update artifact file
    - Download unit images
    - Upload herodata copy to server
    - Skill multipliers

******************************************************************************************** */

/** ******************************************************************************************
    TODO:
    - Update grid initialization with languages
******************************************************************************************** */

const Updater = {
  getCurrentVersion: () => {
    return currentVersion;
  },
  showNewFeatures: (version) => {
    const v = version || currentVersion;
    Dialog.showNewFeatures(
      `
<h2>
    New in v${v}
</h2>
<ul class="newFeatures">
    <li>Major under-the-hood modernization — now on the latest Electron runtime and Java 25 for better stability and performance</li>
    <li>Refreshed all app dependencies and build tooling</li>
    <li>Deleting a filter preset now asks for confirmation, so a misclick won't lose it</li>
    <li>Numerous bug fixes and cleanup across the optimizer, importer, and gear tools</li>
</ul>
`,
    );
  },

  // This fork has no auto-updater (private repo, no publish feed — see
  // .claude/memory/repo-lineage.md). Only populates the "Current version" label;
  // updates arrive by pulling upstream game data and rebuilding.
  displayVersion: () => {
    const version = document.getElementById('version');
    version.innerText = `: v${currentVersion}`;
  },
};

export default Updater;

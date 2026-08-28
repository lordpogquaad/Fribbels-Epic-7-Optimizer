import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as remote from '@electron/remote';

/* global Settings */

const Files = {
  listFilesInFolder: (filePath) => {
    const files = fs.readdirSync(Files.path(filePath));

    return files;
  },

  readFile: (filePath) => {
    return new Promise((resolve, reject) => {
      fs.readFile(Files.path(filePath), 'utf8', function read(err, data) {
        if (err) {
          return reject(err);
        }

        resolve(data);
      });
    });
  },

  readFileSync: (filePath) => {
    const data = fs.readFileSync(Files.path(filePath), 'utf8');

    return data;
  },

  saveFile: (filePath, text) => {
    fs.writeFileSync(Files.path(filePath), text);
  },

  createFolder: (folder) => {
    if (!fs.existsSync(Files.path(folder))) {
      fs.mkdirSync(Files.path(folder));
    }

    if (!fs.existsSync(Files.path(`${folder}/empty-save.json`))) {
      Files.saveFile(`${folder}/empty-save.json`, '{"heroes":[],"items":[]}');
    }

    if (!fs.existsSync(Files.path(`${folder}/autosave.json`))) {
      Files.saveFile(`${folder}/autosave.json`, '{"heroes":[],"items":[]}');
    }

    if (!fs.existsSync(Files.path(`${folder}/settings.ini`))) {
      Files.saveFile(
        `${folder}/settings.ini`,
        JSON.stringify(Settings.getDefaultSettings()),
      );
    }
  },

  isMac: () => {
    return os.platform() === 'darwin';
  },

  // App code uses '/' separators internally; Windows needs '\', Mac keeps '/'.
  path: (filePath) => {
    return Files.isMac() ? filePath : filePath.replaceAll('/', '\\');
  },

  getRootPath: () => {
    // Packaged paths use app.getAppPath()/exe location.
    // Dev paths use __dirname which webpack sets to the bundle output dir:
    // .../1. App/2. Frontend/1. Source/ — 3 levels up reaches the project root.
    if (os.platform() === 'darwin') {
      if (__dirname.includes('app.asar')) {
        return path.resolve(remote.app.getAppPath(), '../../');
      }
      return path.resolve(__dirname, '../../..');
    }

    if (__dirname.includes('app.asar')) {
      return path.dirname(remote.app.getPath('exe'));
    }
    return path.resolve(__dirname, '../../..');
  },

  getDataPath: () => {
    if (os.platform() === 'darwin') {
      if (__dirname.includes('app.asar')) {
        return path.resolve(remote.app.getAppPath(), '../../1. Master/2. Data');
      }
      return `${Files.getRootPath()}/1. App/1. Master/2. Data`;
    }

    if (__dirname.includes('app.asar')) {
      return path.join(
        path.dirname(remote.app.getPath('exe')),
        '1. Master',
        '2. Data',
      );
    }
    return `${Files.getRootPath()}/1. App/1. Master/2. Data`;
  },

  getJarPath: () => {
    if (os.platform() === 'darwin') {
      if (__dirname.includes('app.asar')) {
        return path.resolve(remote.app.getAppPath(), '../../1. Master/3. Jar');
      }
      return `${Files.getRootPath()}/1. App/1. Master/3. Jar`;
    }

    if (__dirname.includes('app.asar')) {
      return path.join(
        path.dirname(remote.app.getPath('exe')),
        '1. Master',
        '3. Jar',
      );
    }
    return `${Files.getRootPath()}/1. App/1. Master/3. Jar`;
  },

  getLocalesPath: () => {
    const localesSubpath =
      '2. Frontend/1. Source/6. JSON/3. TRANSLATION/locales';
    if (os.platform() === 'darwin') {
      if (__dirname.includes('app.asar')) {
        return path.resolve(remote.app.getAppPath(), `../../${localesSubpath}`);
      }
      return `${Files.getRootPath()}/1. App/${localesSubpath}`;
    }

    if (__dirname.includes('app.asar')) {
      return path.join(
        path.dirname(remote.app.getPath('exe')),
        '2. Frontend',
        '1. Source',
        '6. JSON',
        '3. TRANSLATION',
        'locales',
      );
    }
    return `${Files.getRootPath()}/1. App/${localesSubpath}`;
  },

  // The directory CopyAssets.js flattens hero/UI PNGs into, and that app.html's
  // relative './assets/...' src attributes resolve against at runtime.
  getAssetsPath: () => {
    const assetsSubpath = '2. Frontend/1. Source/1. HTML/assets';
    if (os.platform() === 'darwin') {
      if (__dirname.includes('app.asar')) {
        return path.resolve(remote.app.getAppPath(), `../../${assetsSubpath}`);
      }
      return `${Files.getRootPath()}/1. App/${assetsSubpath}`;
    }

    if (__dirname.includes('app.asar')) {
      return path.join(
        path.dirname(remote.app.getPath('exe')),
        '2. Frontend',
        '1. Source',
        '1. HTML',
        'assets',
      );
    }
    return `${Files.getRootPath()}/1. App/${assetsSubpath}`;
  },

  getScannerPyPath: () => {
    const pySubpath =
      '2. Frontend/1. Source/7. PY/1. Scanner/1. Core/scanner.py';
    if (os.platform() === 'darwin') {
      if (__dirname.includes('app.asar')) {
        return path.resolve(remote.app.getAppPath(), `../../${pySubpath}`);
      }
      return `${Files.getRootPath()}/1. App/${pySubpath}`;
    }
    if (__dirname.includes('app.asar')) {
      return path.join(
        path.dirname(remote.app.getPath('exe')),
        '2. Frontend',
        '1. Source',
        '7. PY',
        '1. Scanner',
        '1. Core',
        'scanner.py',
      );
    }
    return `${Files.getRootPath()}/1. App/${pySubpath}`;
  },

  getCachePath: () => {
    const cacheSubpath = '2. Frontend/1. Source/6. JSON/2. CACHE';
    if (os.platform() === 'darwin') {
      if (__dirname.includes('app.asar')) {
        return path.resolve(remote.app.getAppPath(), `../../${cacheSubpath}`);
      }
      return `${Files.getRootPath()}/1. App/${cacheSubpath}`;
    }

    if (__dirname.includes('app.asar')) {
      return path.join(
        path.dirname(remote.app.getPath('exe')),
        '2. Frontend',
        '1. Source',
        '6. JSON',
        '2. CACHE',
      );
    }
    return `${Files.getRootPath()}/1. App/${cacheSubpath}`;
  },
};

export default Files;

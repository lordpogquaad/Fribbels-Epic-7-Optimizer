import fs from 'fs';
import os from 'os';
import path from 'path';
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
            Files.saveFile(
                `${folder}/empty-save.json`,
                '{"heroes":[],"items":[]}',
            );
        }

        if (!fs.existsSync(Files.path(`${folder}/autosave.json`))) {
            Files.saveFile(
                `${folder}/autosave.json`,
                '{"heroes":[],"items":[]}',
            );
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

    path: (filePath) => {
        return Files.isMac()
            ? filePath.replace(/\//g, '/')
            : filePath.replace(/\//g, '\\');
    },

    getRootPath: () => {
        if (os.platform() === 'darwin') {
            if (__dirname.includes('app.asar')) {
                return path.resolve(remote.app.getAppPath(), '../../');
            }
            return path.resolve(remote.app.getAppPath(), '../');
        }

        if (__dirname.includes('app.asar')) {
            return path.dirname(remote.app.getPath('exe'));
        }
        return path.resolve(remote.app.getAppPath(), '../../..');
    },

    getDataPath: () => {
        if (os.platform() === 'darwin') {
            if (__dirname.includes('app.asar')) {
                return path.resolve(
                    remote.app.getAppPath(),
                    '../../1. Master/2. Data',
                );
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
};

export default Files;

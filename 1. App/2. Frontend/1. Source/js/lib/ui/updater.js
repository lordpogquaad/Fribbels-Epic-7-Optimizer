/* global Dialog, Notifier, i18next, Subprocess, HeroData */

const { ipcRenderer } = require('electron');

global.ipcRenderer = ipcRenderer;
const currentVersion = '1.10.0';

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
    showNewFeatures: () => {
        Dialog.showNewFeatures(
            `
<h2>
    New in v1.10.0
</h2>
<ul class="newFeatures">
    <li>Added new Riposte and Reversal Sets</li>
    <li>Added support for defense stat artifacts</li>
    <li>Fixed various bugs</li>
</ul>
`
        );
    },

    checkForUpdates: async () => {
        //
        // try {
        //     const latestData = await fetch('https://api.github.com/repos/fribbels/Fribbels-Epic-7-Optimizer/releases/latest')
        //     const latestDataText = await latestData.text();
        //     const latestDataJson = JSON.parse(latestDataText);
        //     const latestVersion = latestDataJson.tag_name;

        //     if (latestVersion != currentVersion) {
        //         const shell = require('electron').shell;

        //         // assuming $ is jQuery
        //         $(document).on('click', 'a[href^="http"]', function(event) {
        //             event.preventDefault();
        //             shell.openExternal(this.href);
        //         });

        //         Dialog.htmlSuccessDisableOutsideClick(i18next.t("New version available: <a href='https://github.com/fribbels/Fribbels-Epic-7-Optimizer/releases'>") + latestVersion + "<a>");
        //     }

        //     // console.error(latestDataJson);
        // } catch (e) {
        //     console.error(e)
        // }

        const version = document.getElementById('version');
        version.innerText = `: v${currentVersion}`;

        ipcRenderer.on('update_available', () => {
            Notifier.info(i18next.t('New version available, downloading now'));
        });
        ipcRenderer.on('update-not-available', () => {});
        ipcRenderer.on('test', () => {});
        ipcRenderer.on('check', (_event, data) => {
            try {
                if (typeof data === 'string' || data instanceof String) {
                    const response = JSON.parse(data);
                    const updateVersion = response.updateInfo.version;

                    if (currentVersion === updateVersion) {
                        Notifier.info(i18next.t('No new updates found'));
                    }
                } else {
                    const response = data;
                    const updateVersion = response.updateInfo.version;

                    if (currentVersion === updateVersion) {
                        Notifier.info(i18next.t('No new updates found'));
                    }
                }
            } catch (_e) {
                Notifier.info(i18next.t('No new updates found'));
            }
        });
        ipcRenderer.on('update_downloaded', async () => {
            const response = await Dialog.updatePrompt(
                'Update downloaded. It will be installed on restart. Restart app now?'
            );

            if (response === 'restart') {
                await Subprocess.kill();
                ipcRenderer.send('restart_app');
            }
        });

        document
            .getElementById('checkForUpdatesSubmit')
            .addEventListener('click', async () => {
                Notifier.info(i18next.t('Checking for updates'));

                try {
                    await HeroData.initialize();
                } catch (_e) {
                    // ignore
                }

                ipcRenderer.send('check');
            });
    },
};

export default Updater;

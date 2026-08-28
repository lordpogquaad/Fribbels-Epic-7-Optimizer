/* global Scanner, Files, Settings, Notifier, Dialog, i18next, $, ItemAugmenter, Api, HeroesTab, Saves */
const fs = require('node:fs');
const remote = require('@electron/remote');

const { dialog } = remote;
const currentWindow = remote.getCurrentWindow();

function isEpermError(e) {
  return e !== null && JSON.stringify(e).includes('EPERM');
}

const Importer = {
  addEventListener: () => {
    const coll = document.getElementsByClassName('collapsible');

    Array.from(coll).forEach((el) => {
      el.addEventListener('click', function collHandler() {
        const disable = document.getElementsByClassName('collapsible');
        Array.from(disable).forEach((item) => {
          if (item === this) {
            return;
          }
          item.classList.remove('active');
          const itemContent = item.nextElementSibling;
          itemContent.style.display = 'none';
        });

        this.classList.toggle('active');
        const content = this.nextElementSibling;
        if (content.style.display === 'block') {
          content.style.display = 'none';
        } else {
          content.style.display = 'block';
        }
      });
    });

    document.querySelectorAll('[id=loadIngameGearStart]').forEach((x) =>
      x.addEventListener('click', async () => {
        Scanner.start('items');
      }),
    );

    document.querySelectorAll('[id=loadIngameGearHeroesStart]').forEach((x) =>
      x.addEventListener('click', async () => {
        Scanner.start('heroes');
      }),
    );

    document
      .querySelectorAll('[id=loadIngameGearEnd], [id=loadIngameGearHeroesEnd]')
      .forEach((x) =>
        x.addEventListener('click', async () => {
          Scanner.end();
        }),
      );

    const handleSaveExportOutputClick = async () => {
      const output = document.getElementById('exportOutputText').value;

      if (!output || output.length === 0) {
        Notifier.error('Nothing to export yet, please select a folder');
        return;
      }

      if (output.includes('Reading screenshots in progress...')) {
        Notifier.error('Screenshot reading in progress, please wait');
        return;
      }

      const options = {
        title: 'Save file',
        defaultPath: Files.path(`${Settings.getDefaultPath()}/gear.txt`),
        buttonLabel: 'Save file',
        filters: [{ name: 'TEXT', extensions: ['txt'] }],
      };
      const filename = dialog.showSaveDialogSync(currentWindow, options);
      if (!filename) return;

      const handleWriteCallback = (err) => {
        if (err) {
          if (isEpermError(err)) {
            Dialog.error(
              'Unable to save file. Please try disabling your antivirus, or add the app as an exception, then restarting the app in admin mode. Check if your saves folder is under OneDrive on the Settings tab, and if so, change it to somewhere else.',
            );
          } else {
            Notifier.error(
              `${i18next.t('Unable to write file') + filename} - ${err}`,
            );
          }
          return;
        }
        $('#screenshotExportOutputText').text(
          `${i18next.t('Exported data to')} ${filename}`,
        );
      };

      fs.writeFile(Files.path(filename), output, handleWriteCallback);
    };

    document
      .getElementById('saveExportOutput')
      .addEventListener('click', handleSaveExportOutputClick);

    const handleSaveLoadFromGameExportClick = async () => {
      const output = document.querySelector('.scanExportOutputText').value;

      if (!output || output.length === 0) {
        Notifier.error(
          'Nothing to export yet, please follow the steps to import gear',
        );
        return;
      }

      if (
        output.includes('Started scanning') ||
        output.includes('Reading items')
      ) {
        Notifier.error('Item reading in progress, please wait');
        return;
      }

      if (output.includes('Exported data to')) {
        Notifier.error(
          "The gear data was already exported. Please use the 'Merge data' button to import, or scan again.",
        );
        return;
      }

      const options = {
        title: 'Save file',
        defaultPath: Files.path(`${Settings.getDefaultPath()}/gear.txt`),
        buttonLabel: 'Save file',
        filters: [{ name: 'TEXT', extensions: ['txt'] }],
      };

      const filename = dialog.showSaveDialogSync(currentWindow, options);
      if (!filename) return;

      const handleWriteCallback = (err) => {
        if (err) {
          if (isEpermError(err)) {
            Dialog.error(
              'Unable to save file. Please try disabling your antivirus, or add the app as an exception, then restarting the app in admin mode. Check if your saves folder is under OneDrive on the Settings tab, and if so, change it to somewhere else.',
            );
          } else {
            Notifier.error(
              `${i18next.t('Unable to write file') + filename} - ${err}`,
            );
          }
          return;
        }
        const exportedMessage = `${i18next.t('Exported data to')} ${filename}`;
        document.querySelectorAll('.scanExportOutputText').forEach((el) => {
          el.value = exportedMessage;
        });
      };

      fs.writeFile(Files.path(filename), output, handleWriteCallback);
    };

    document
      .querySelectorAll('.saveLoadFromGameExportBtn')
      .forEach((x) =>
        x.addEventListener('click', handleSaveLoadFromGameExportClick),
      );

    document
      .getElementById('importScreenshotsFileSelect')
      .addEventListener('click', async () => {
        const options = {
          title: 'Load file',
          defaultPath: Files.path(`${Settings.getDefaultPath()}/gear.txt`),
          buttonLabel: 'Load file',
          filters: [{ name: 'TEXT', extensions: ['txt'] }],
        };
        const filenames = dialog.showOpenDialogSync(currentWindow, options);

        if (!filenames || filenames.length < 1) {
          return;
        }

        const path = filenames[0];

        const data = Files.readFileSync(Files.path(path));

        try {
          $('#importScreenshotsOutputText').text(i18next.t('Parsing data..'));

          const parsedData = JSON.parse(data);
          const { items } = parsedData;

          ItemAugmenter.augment(items);

          await Api.mergeItems(items, 0);

          $('#importScreenshotsOutputText').text(
            `${i18next.t('Merged')} ${items.length} ${i18next.t(
              'items from',
            )} ${path}`,
          );
        } catch (e) {
          Dialog.htmlError(
            i18next.t(
              'Error occurred while parsing gear. The file may be corrupted or incomplete. Try re-exporting or re-scanning your gear.',
            ) + e,
          );
        }
      });

    document
      .getElementById('importAppendFileSelect')
      .addEventListener('click', async () => {
        const options = {
          title: 'Load file',
          defaultPath: Files.path(`${Settings.getDefaultPath()}/gear.txt`),
          buttonLabel: 'Load file',
          filters: [{ name: 'TEXT', extensions: ['txt'] }],
        };
        const filenames = dialog.showOpenDialogSync(currentWindow, options);

        if (!filenames || filenames.length < 1) {
          return;
        }

        const path = filenames[0];

        const data = Files.readFileSync(Files.path(path));

        try {
          $('#importAppendOutputText').text(i18next.t('Parsing data..'));

          const parsedData = JSON.parse(data);
          const { items } = parsedData;

          ItemAugmenter.augment(items);

          const confirmed = await Dialog.confirmation(
            'Add new items to your existing items? This can cause duplicate items if screenshots include existing gear. Use this only for the screenshot importer. If you want to update your existing gear with new screenshots, use the Merge option instead.',
          );
          if (!confirmed) {
            return;
          }

          await Api.addItems(items);

          $('#importAppendOutputText').text(
            `${i18next.t('Appended')} ${items.length} ${i18next.t(
              'items from',
            )} ${path}`,
          );
        } catch (e) {
          Dialog.htmlError(
            i18next.t(
              'Error occurred while parsing gear. The file may be corrupted or incomplete. Try re-exporting or re-scanning your gear.',
            ) + e,
          );
        }
      });

    document
      .getElementById('importMergeFileSelect')
      .addEventListener('click', async () => {
        const enhanceLimit = Number.parseInt(
          document.querySelector(
            'input[name="gearImporterEnhanceRadio"]:checked',
          ).value,
          10,
        );
        const options = {
          title: 'Load file',
          defaultPath: Files.path(`${Settings.getDefaultPath()}/gear.txt`),
          buttonLabel: 'Load file',
          filters: [{ name: 'TEXT', extensions: ['txt'] }],
        };
        const filenames = dialog.showOpenDialogSync(currentWindow, options);

        if (!filenames || filenames.length < 1) {
          return;
        }

        const path = filenames[0];

        try {
          const data = Files.readFileSync(Files.path(path));
          $('#importMergeOutputText').text(i18next.t('Parsing data..'));

          const parsedData = JSON.parse(data);
          const { items } = parsedData;

          ItemAugmenter.augment(items);

          await Api.mergeItems(items, enhanceLimit);

          $('#importMergeOutputText').text(
            `${i18next.t('Merged')} ${items.length} ${i18next.t(
              'items from',
            )} ${path}`,
          );

          Saves.autoSave();
        } catch (e) {
          Dialog.htmlError(
            i18next.t(
              'Error occurred while parsing gear. The file may be corrupted or incomplete. Try re-exporting or re-scanning your gear.',
            ) + e,
          );
        }
      });

    document
      .getElementById('importMergeHeroesFileSelect')
      .addEventListener('click', async () => {
        const enhanceLimit = Number.parseInt(
          document.querySelector(
            'input[name="heroImporterEnhanceRadio"]:checked',
          ).value,
          10,
        );
        const heroFilter = document.querySelector(
          'input[name="heroImporterHeroRadio"]:checked',
        ).value;

        const options = {
          title: 'Load file',
          defaultPath: Files.path(`${Settings.getDefaultPath()}/gear.txt`),
          buttonLabel: 'Load file',
          filters: [{ name: 'TEXT', extensions: ['txt'] }],
        };
        const filenames = dialog.showOpenDialogSync(currentWindow, options);

        if (!filenames || filenames.length < 1) {
          return;
        }

        const path = filenames[0];

        $('#importMergeHeroesOutputText').text(i18next.t('Opening file..'));

        try {
          const data = fs.readFileSync(Files.path(path), {
            encoding: 'utf8',
            flag: 'r',
          });

          $('#importMergeHeroesOutputText').text(i18next.t('Parsing data..'));

          const parsedData = JSON.parse(data);
          const items = parsedData.items || [];
          const heroes = parsedData.heroes || [];
          const filteredHeroes = [];

          heroes.forEach((hero) => {
            const heroName = hero.name;
            const newHero = HeroesTab.getNewHeroByName(heroName);
            if (!newHero) {
              return;
            }

            newHero.rarity = newHero.data.rarity;
            newHero.attribute = newHero.data.attribute;
            newHero.role = newHero.data.role;
            newHero.path = heroName;
            newHero.stars = hero.stars;
            newHero.skills = {
              S1: newHero.data.skills.S1.options,
              S2: newHero.data.skills.S2.options,
              S3: newHero.data.skills.S3.options,
            };

            hero.data = newHero;
            filteredHeroes.push(hero);
          });

          ItemAugmenter.augment(items);

          const confirmed = await Dialog.confirmation(
            "Are you sure you want to overwrite the optimizer's hero data with ingame hero data?",
          );
          if (!confirmed) {
            return;
          }

          await Api.mergeHeroes(
            items,
            filteredHeroes,
            enhanceLimit,
            heroFilter,
          );

          $('#importMergeHeroesOutputText').text(
            `${i18next.t('Merged')} ${items.length} ${i18next.t(
              'items from',
            )} ${path}`,
          );

          Saves.autoSave();
        } catch (e) {
          Dialog.htmlError(
            i18next.t(
              'Error occurred while parsing gear. The file may be corrupted or incomplete. Try re-exporting or re-scanning your gear.',
            ) + e,
          );
        }
      });

    document
      .getElementById('eraseButton')
      .addEventListener('click', async () => {
        const response = await Dialog.erasePrompt(
          i18next.t('Erase all heroes/gear/builds from optimizer?'),
        );

        if (response === 'yes') {
          await Api.setItems([]);
          await Api.setHeroes([]);

          Notifier.info(i18next.t('Finished erasing data'));
        }
      });
  },
};
export default Importer;

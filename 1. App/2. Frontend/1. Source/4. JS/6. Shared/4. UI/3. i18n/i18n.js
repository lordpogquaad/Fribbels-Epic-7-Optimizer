/* global Files, i18next, translateElement */

const I18n = {
  initialize: async () => {
    const localesPath = Files.getLocalesPath();
    const locales = ['en', 'zh', 'ko', 'zh-TW', 'fr', 'ja', 'ru'];
    for (const locale of locales) {
      globalThis.require(
        Files.path(localesPath + '/' + locale + '/gridlocale.js'),
      );
    }

    globalThis.i18next
      .use(globalThis.i18nextHttpBackend)
      .use(globalThis.i18nextBrowserLanguageDetector)
      .init({
        debug: false,
        preload: ['en', 'zh', 'zh-TW', 'fr', 'ko', 'ja', 'ru', 'dev'],
        detection: {
          // order and from where user language should be detected
          order: [
            'querystring',
            'cookie',
            'sessionStorage',
            'navigator',
            'htmlTag',
            'path',
            'subdomain',
          ],

          // keys or params to lookup language from
          lookupQuerystring: 'lng',
          lookupCookie: 'i18next',
          // lookupLocalStorage: 'i18nextLng',
          lookupSessionStorage: 'i18nextLng',
          lookupFromPathIndex: 0,
          lookupFromSubdomainIndex: 0,

          // cache user language on
          caches: ['cookie'],
          excludeCacheFor: ['cimode'],
          htmlTag: document.documentElement,
        },
        ignoreIds: [
          'loadFromGameExportOutputText',
          'loadFromGameHeroesExportOutputText',
          'exportOutputText',
        ],
        translateAttributes: [
          'placeholder',
          'title',
          'alt',
          'value#input.type=button',
          'value#input.type=submit',
          'data-content',
        ],
        saveMissing: true,
        saveMissingTo: 'current',
        fallbackLng: false,
        keySeparator: false,
        nsSeparator: false,
        pluralSeparator: false,
        contextSeparator: false,
        backend: {
          loadPath: Files.path(Files.getLocalesPath() + '/{{lng}}/{{ns}}.json'),
          addPath: Files.path(
            Files.getLocalesPath() + '/{{lng}}/{{ns}}.missing.json',
          ),
        },
      });

    globalThis.i18next.on('languageChanged initialized reloadResources', () => {
      if (!i18next.isInitialized || i18next.language === 'en') return;

      const untransTexts = [];
      document.querySelectorAll('[data-t]').forEach((el) => {
        const tmpText = translateElement(el);
        if (tmpText.untransString.length !== 0) {
          untransTexts.push(tmpText);
        }
      });
      Log.debug(
        'there has untranslated strings in data-t type',
        untransTexts,
      );
    });
  },
};

export default I18n;

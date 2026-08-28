/* global $, i18next, Assets, Settings */

let addHeroSelectorOpen = false;

const Selectors = {
  initialize: () => {
    const selectAllMultipleSelectOptions = {
      maxHeight: 450,
      showClear: true,
      hideOptgroupCheckboxes: true,
      minimumCountSelected: 99,
      displayTitle: false,
      displayValues: true,
      selectAll: true,
    };

    const assetsBySet = Assets.getAssetsBySet();
    const groupSelectMultipleSelectOptions = {
      maxHeight: 600,
      showClear: true,
      minimumCountSelected: 99,
      displayTitle: false,
      displayValues: true,
      selectAll: false,
      textTemplate(el) {
        const assetKey = `${el[0].value}Set`;

        if (Object.keys(assetsBySet).includes(assetKey)) {
          const asset = assetsBySet[assetKey];
          return `<div class="selectorSetContainer"><img class="selectorSetImage" src="${asset}"></img><div class="selectorSetText">${el.html()}</div><span class="selectorSetCount" data-set-key="${assetKey}" data-set-index=""></span></div>`;
        }

        return el.html();
      },
      styler() {
        return '';
      },
    };
    const enhanceOptions = {
      maxHeight: 500,
      showClear: false,
      minimumCountSelected: 99,
      displayTitle: true,
      selectAll: false,
    };
    const excludeEquippedSelectOptions = {
      maxHeight: 450,
      showClear: true,
      hideOptgroupCheckboxes: true,
      minimumCountSelected: 99,
      displayTitle: true,
      selectAll: false,
      filter: true,
    };
    const heroSelectorOptions = {
      filter: true,
      filterAcceptOnEnter: true,
    };
    const addHeroSelectorOptions = {
      filter: true,
      filterAcceptOnEnter: true,

      onOpen() {
        if (!addHeroSelectorOpen) {
          $('#addHeroesSelector').multipleSelect('refresh');
        }
        addHeroSelectorOpen = true;
      },
    };
    $('#inputSet1').multipleSelect({
      ...groupSelectMultipleSelectOptions,
      placeholder: i18next.t('4 or 2 piece sets'),
    });
    $('#inputSet2').multipleSelect({
      ...groupSelectMultipleSelectOptions,
      placeholder: i18next.t('2 piece sets'),
    });
    $('#inputSet3').multipleSelect({
      ...groupSelectMultipleSelectOptions,
      placeholder: i18next.t('2 piece sets'),
    });
    $('#inputNecklaceStat').multipleSelect({
      ...selectAllMultipleSelectOptions,
      placeholder: i18next.t('Necklace'),
      textTemplate(el) {
        return `<span class="mainStatRow">${el.html()}<span class="mainStatCount" data-main-type="${el[0].value}" data-slot="Necklace" data-set-index=""></span></span>`;
      },
      formatSelectAll() {
        return i18next.t('[Select all]');
      },
    });
    $('#inputRingStat').multipleSelect({
      ...selectAllMultipleSelectOptions,
      placeholder: i18next.t('Ring'),
      textTemplate(el) {
        return `<span class="mainStatRow">${el.html()}<span class="mainStatCount" data-main-type="${el[0].value}" data-slot="Ring" data-set-index=""></span></span>`;
      },
      formatSelectAll() {
        return i18next.t('[Select all]');
      },
    });
    $('#inputBootsStat').multipleSelect({
      ...selectAllMultipleSelectOptions,
      placeholder: i18next.t('Boots'),
      textTemplate(el) {
        return `<span class="mainStatRow">${el.html()}<span class="mainStatCount" data-main-type="${el[0].value}" data-slot="Boots" data-set-index=""></span></span>`;
      },
      formatSelectAll() {
        return i18next.t('[Select all]');
      },
    });
    $('#inputExcludeSet').multipleSelect({
      ...groupSelectMultipleSelectOptions,
      placeholder: i18next.t('Exclude sets'),
    });
    $('#inputHeroAdd').multipleSelect({
      ...heroSelectorOptions,
      placeholder: i18next.t('Hero'),
    });
    $('#addHeroesSelector').multipleSelect({
      ...addHeroSelectorOptions,
      placeholder: i18next.t('Hero'),
    });

    $('#optionsExcludeGearFrom').multipleSelect({
      ...excludeEquippedSelectOptions,
      placeholder: i18next.t('Exclude equipped'),
      selectAll: true,
      formatSelectAll() {
        return i18next.t('[Select all]');
      },
    });
    $('#optionsEnhanceLimit').multipleSelect({
      ...enhanceOptions,
      placeholder: i18next.t('Minimum enhance'),
      selectAll: false,
    });

    $('#optionsS1').multipleSelect({
      ...excludeEquippedSelectOptions,
      placeholder: i18next.t('Exclude equipped'),
      selectAll: true,
      formatSelectAll() {
        return i18next.t('[Select all]');
      },
    });
    $('#optionsS2').multipleSelect({
      ...excludeEquippedSelectOptions,
      placeholder: i18next.t('Exclude equipped'),
      selectAll: true,
      formatSelectAll() {
        return i18next.t('[Select all]');
      },
    });
    $('#optionsS3').multipleSelect({
      ...excludeEquippedSelectOptions,
      placeholder: i18next.t('Exclude equipped'),
      selectAll: true,
      formatSelectAll() {
        return i18next.t('[Select all]');
      },
    });
  },

  refreshMultiHeroSelector: (id) => {
    const selects = $(`#${id}`).multipleSelect('getSelects');
    $(`#${id}`).multipleSelect('refresh');
    $(`#${id}`).multipleSelect('setSelects', selects);
  },

  setMultiHeroSelector: (id) => {
    const heroSelectorOptions = {
      filter: true,
      filterAcceptOnEnter: true,
    };
    $(`#${id}`).multipleSelect({
      ...heroSelectorOptions,
      placeholder: i18next.t('Hero'),
    });
  },

  refreshAllowGearFrom: (index) => {
    const idx = index == null ? '' : index;
    const selects = Settings.getExcludeSelects();
    $(`#optionsExcludeGearFrom${idx}`).multipleSelect('refresh');
    $(`#optionsExcludeGearFrom${idx}`).multipleSelect('setSelects', selects);
  },

  refreshInputHeroAdd: () => {
    $('#inputHeroAdd').multipleSelect('refresh');
  },

  getExcludeGearFrom: (index) => {
    const idx = index == null ? '' : index;
    const exclude = $(`#optionsExcludeGearFrom${idx}`).multipleSelect(
      'getSelects',
    );

    return exclude;
  },

  getEnhanceLimit: (index) => {
    const idx = index == null ? '' : index;
    const enhanceLimit = $(`#optionsEnhanceLimit${idx}`).multipleSelect(
      'getSelects',
    );

    return enhanceLimit;
  },

  getGearMainFilters: (index) => {
    const idx = index == null ? '' : index;
    const inputNecklaceStat = $(`#inputNecklaceStat${idx}`).multipleSelect(
      'getSelects',
    );
    const inputRingStat = $(`#inputRingStat${idx}`).multipleSelect(
      'getSelects',
    );
    const inputBootsStat = $(`#inputBootsStat${idx}`).multipleSelect(
      'getSelects',
    );

    return [inputNecklaceStat, inputRingStat, inputBootsStat];
  },

  getSetFilters: (index) => {
    const idx = index == null ? '' : index;
    const inputSet1 = $(`#inputSet1${idx}`)
      .multipleSelect('getSelects')
      .map((x) => `${x}Set`);
    const inputSet2 = $(`#inputSet2${idx}`)
      .multipleSelect('getSelects')
      .map((x) => `${x}Set`);
    const inputSet3 = $(`#inputSet3${idx}`)
      .multipleSelect('getSelects')
      .map((x) => `${x}Set`);
    const inputExcludeSet = $(`#inputExcludeSet${idx}`)
      .multipleSelect('getSelects')
      .map((x) => `${x}Set`);

    return {
      sets: [inputSet1, inputSet2, inputSet3],
      exclude: inputExcludeSet,
    };
  },

  clearGearMainAndSets: () => {
    $('#inputSet1').multipleSelect('uncheckAll');
    $('#inputSet2').multipleSelect('uncheckAll');
    $('#inputSet3').multipleSelect('uncheckAll');
    $('#inputNecklaceStat').multipleSelect('uncheckAll');
    $('#inputRingStat').multipleSelect('uncheckAll');
    $('#inputBootsStat').multipleSelect('uncheckAll');
    $('#inputExcludeSet').multipleSelect('uncheckAll');
  },

  setGearMainAndSetsFromRequest: (request, index) => {
    [
      'inputSet1',
      'inputSet2',
      'inputSet3',
      'inputExcludeSet',
      'inputNecklaceStat',
      'inputRingStat',
      'inputBootsStat',
    ].forEach((id) => $(`#${id}${index}`).multipleSelect('close'));

    const toSetKey = (x) => (x ? String(x).replace('Set', '') : x);
    $(`#inputSet1${index}`).multipleSelect(
      'setSelects',
      (request.inputSetsOne || []).map(toSetKey),
    );
    $(`#inputSet2${index}`).multipleSelect(
      'setSelects',
      (request.inputSetsTwo || []).map(toSetKey),
    );
    $(`#inputSet3${index}`).multipleSelect(
      'setSelects',
      (request.inputSetsThree || []).map(toSetKey),
    );
    $(`#inputExcludeSet${index}`).multipleSelect(
      'setSelects',
      (request.inputExcludeSet || []).map(toSetKey),
    );
    $(`#inputNecklaceStat${index}`).multipleSelect(
      'setSelects',
      request.inputNecklaceStat || [],
    );
    $(`#inputRingStat${index}`).multipleSelect(
      'setSelects',
      request.inputRingStat || [],
    );
    $(`#inputBootsStat${index}`).multipleSelect(
      'setSelects',
      request.inputBootsStat || [],
    );
  },
};

export default Selectors;

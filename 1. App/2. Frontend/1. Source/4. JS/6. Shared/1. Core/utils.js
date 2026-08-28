const stringSimilarity = require('string-similarity');

const Utils = {
  sortByAttribute: (arr, attribute) => {
    arr.sort((a, b) => {
      if (a[attribute] < b[attribute]) {
        return -1;
      }
      if (a[attribute] > b[attribute]) {
        return 1;
      }
      return 0;
    });
  },

  stringDistance: (str1, str2) => {
    return stringSimilarity.compareTwoStrings(str1, str2);
  },

  round10ths: (number) => {
    return Math.round(number * 10) / 10;
  },

  round100ths: (number) => {
    return Math.round(number * 100) / 100;
  },

  isFlat: (text) => {
    return text === 'Health' || text === 'Defense' || text === 'Attack';
  },
};

export default Utils;

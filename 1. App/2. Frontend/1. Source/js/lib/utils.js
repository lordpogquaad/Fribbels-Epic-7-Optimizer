/* global $ */

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

    customFilter: (label, text, originalLabel, originalText) => {
        let index = 0;
        let targetText = text;
        let targetLabel = label;

        if ($('input').prop('checked')) {
            targetText = originalText.toLowerCase();
            targetLabel = originalLabel.toLowerCase();
        }

        targetText = targetText.toLowerCase();
        targetLabel = targetLabel.toLowerCase();

        if (targetText[0] !== targetLabel[0]) {
            return false;
        }

        for (let i = 0; i < targetText.length; i += 1) {
            //
            const letter = targetText[i];
            let found = false;

            for (let j = index; j < targetLabel.length; j += 1) {
                // briar w
                const letterMatch = targetLabel[j];

                if (letter === letterMatch) {
                    found = true;
                    index = j + 1;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }
        return true;
    },
};

export default Utils;

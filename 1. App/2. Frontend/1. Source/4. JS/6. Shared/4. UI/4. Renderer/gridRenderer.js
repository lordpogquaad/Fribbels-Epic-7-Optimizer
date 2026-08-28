/* global Constants, Assets, heroesGrid, optimizerGrid, buildsGrid, itemsGrid */

import {
  FOUR_PIECE_CODES,
  SET_CODE_TO_DISPLAY,
} from '../../3. Services/setData';

export default {
  // [0, 0, 4, 2, 0, ...]
  renderSets: (setCounters, iconClass) => {
    return renderSets(setCounters, iconClass);
  },

  renderStar: (value) => {
    return renderStar(value);
  },

  arrowKeyNavigator: (binding, gridName, callback, customGridGetter) => {
    return navigateToNextCell(binding, gridName, callback, customGridGetter);
  },
};

function renderSets(setCounters, effectiveIconClass = 'optimizerSetIcon') {
  if (!setCounters) return undefined;

  const sets = [];
  for (let i = 0; i < setCounters.length; i += 1) {
    const setsFound = Math.floor(
      setCounters[i] / Constants.piecesBySetIndex[i],
    );
    for (let j = 0; j < setsFound; j += 1) {
      sets.push(Constants.setsByIndex[i]);
    }
  }

  sets.sort((a, b) => {
    if (fourPieceSets.has(a)) {
      return -1;
    }
    if (fourPieceSets.has(b)) {
      return 1;
    }
    return a.localeCompare(b);
  });

  const images = sets.map(
    (x) =>
      `<img class="${effectiveIconClass} " src=${Assets.getSetAsset(x)}></img>`,
  );
  return images.join('');
}

// Derived from setData (the single source of truth shared with rtaStats /
// communityBuilds / statPreview) so it can't drift. Used only for membership.
const fourPieceSets = new Set(
  [...FOUR_PIECE_CODES].map((code) => `${SET_CODE_TO_DISPLAY[code]}Set`),
);

function renderStar(value) {
  if (!value) return undefined;

  if (value === 'star') {
    return `<img class="optimizerStarIcon" src=${Assets.getStar()}></img>`;
  }
  return undefined;
}

// define some handy keycode constants
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;

function navigateToNextCell(_binding, gridName, callback, customGridGetter) {
  return function navigateCallback(params) {
    let grid;
    if (gridName === 'heroesGrid') {
      grid = heroesGrid;
    } else if (gridName === 'optimizerGrid') {
      grid = optimizerGrid;
    } else if (gridName === 'buildsGrid') {
      grid = buildsGrid;
    } else if (gridName === 'itemsGrid') {
      grid = itemsGrid;
    } else if (gridName === 'multiGrid') {
      grid = customGridGetter.call();
    }
    if (!grid) {
      Log.warn(`!GRID ${gridName}`, params, grid);
      return null;
    }

    const previousCell = params.previousCellPosition;
    const suggestedNextCell = params.nextCellPosition;
    let nextRowIndex;
    let renderedRowCount;

    switch (params.key) {
      case KEY_DOWN:
        // return the cell below
        nextRowIndex = previousCell.rowIndex + 1;
        renderedRowCount = grid.gridOptions.api.getModel().getRowCount();
        if (nextRowIndex >= renderedRowCount) {
          return null;
        } // returning null means don't navigate

        {
          const downSelectedNode =
            grid.gridOptions.api.getDisplayedRowAtIndex(nextRowIndex);
          downSelectedNode?.setSelected(true);

          if (callback) {
            callback(downSelectedNode);
          }
        }
        return {
          rowIndex: nextRowIndex,
          column: previousCell.column,
          floating: previousCell.floating,
        };
      case KEY_UP:
        // return the cell above
        nextRowIndex = previousCell.rowIndex - 1;
        if (nextRowIndex <= -1) {
          return null;
        } // returning null means don't navigate

        {
          const upSelectedNode =
            grid.gridOptions.api.getDisplayedRowAtIndex(nextRowIndex);
          upSelectedNode?.setSelected(true);

          if (callback) {
            callback(upSelectedNode);
          }
        }
        return {
          rowIndex: nextRowIndex,
          column: previousCell.column,
          floating: previousCell.floating,
        };
      case KEY_LEFT:
      case KEY_RIGHT:
        return suggestedNextCell;
      default:
        throw new Error(
          'this will never happen, navigation is always one of the 4 keys above',
        );
    }
  };
}

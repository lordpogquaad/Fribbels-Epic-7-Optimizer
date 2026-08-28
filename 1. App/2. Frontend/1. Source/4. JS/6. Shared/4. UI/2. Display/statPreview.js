/* global $, Constants, Assets */

import {
  FOUR_PIECE_CODES,
  SET_CODE_TO_DISPLAY,
} from '../../3. Services/setData';

// 4-piece set display-name keys, derived from setData (the single source of truth,
// shared with rtaStats/communityBuilds) so this can't drift. Used only to sort
// 4-piece sets first in the preview, so membership — not order — is what matters.
const fourPieceSets = [...FOUR_PIECE_CODES].map(
  (code) => `${SET_CODE_TO_DISPLAY[code]}Set`,
);

function renderSets(equipment, name, isAfter) {
  if (!equipment) return '';

  let setCounters;

  if (isAfter) {
    setCounters = equipment;
  } else {
    const setNames = Object.values(equipment).map((x) => x.set);
    setCounters = [
      Math.floor(setNames.filter((x) => x === 'HealthSet').length),
      Math.floor(setNames.filter((x) => x === 'DefenseSet').length),
      Math.floor(setNames.filter((x) => x === 'AttackSet').length),
      Math.floor(setNames.filter((x) => x === 'SpeedSet').length),
      Math.floor(setNames.filter((x) => x === 'CriticalSet').length),
      Math.floor(setNames.filter((x) => x === 'HitSet').length),
      Math.floor(setNames.filter((x) => x === 'DestructionSet').length),
      Math.floor(setNames.filter((x) => x === 'LifestealSet').length),
      Math.floor(setNames.filter((x) => x === 'CounterSet').length),
      Math.floor(setNames.filter((x) => x === 'ResistSet').length),
      Math.floor(setNames.filter((x) => x === 'UnitySet').length),
      Math.floor(setNames.filter((x) => x === 'RageSet').length),
      Math.floor(setNames.filter((x) => x === 'ImmunitySet').length),
      Math.floor(setNames.filter((x) => x === 'PenetrationSet').length),
      Math.floor(setNames.filter((x) => x === 'RevengeSet').length),
      Math.floor(setNames.filter((x) => x === 'InjurySet').length),
      Math.floor(setNames.filter((x) => x === 'ProtectionSet').length),
      Math.floor(setNames.filter((x) => x === 'TorrentSet').length),
      Math.floor(setNames.filter((x) => x === 'ReversalSet').length),
      Math.floor(setNames.filter((x) => x === 'RiposteSet').length),
      Math.floor(setNames.filter((x) => x === 'WarfareSet').length),
      Math.floor(setNames.filter((x) => x === 'PursuitSet').length),
      Math.floor(setNames.filter((x) => x === 'FervorSet').length),
      Math.floor(setNames.filter((x) => x === 'WeakeningSet').length),
    ];
  }

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
    if (fourPieceSets.includes(a)) {
      return -1;
    }
    if (fourPieceSets.includes(b)) {
      return 1;
    }
    return a.localeCompare(b);
  });

  const images = sets.map(
    (x) => `<img class="optimizerSetIcon" src=${Assets.getSetAsset(x)}></img>`,
  );
  return images.join('');
}

function renderDiff(before, after, field) {
  const value = after[field] - before[field];
  let text = Math.abs(value);
  const id = field === 'score' ? '#gsStatDiff' : `#${field}StatDiff`;
  const elem = $(id);

  if (value > 0) {
    text += ' \u25B2';
    elem.addClass('up');
    elem.removeClass('down');
  } else if (value < 0) {
    text += ' \u25BC';
    elem.addClass('down');
    elem.removeClass('up');
  } else {
    text = '';
    elem.removeClass('up');
    elem.removeClass('down');
  }

  $(id).text(text);
}

const StatPreview = {
  draw: (before, after) => {
    $('#atkStatBefore').text(before.atk);
    $('#defStatBefore').text(before.def);
    $('#hpStatBefore').text(before.hp);
    $('#spdStatBefore').text(before.spd);
    $('#crStatBefore').text(before.cr);
    $('#cdStatBefore').text(before.cd);
    $('#effStatBefore').text(before.eff);
    $('#resStatBefore').text(before.res);
    $('#gsStatBefore').text(before.score);

    $('#atkStatAfter').text(after.atk);
    $('#defStatAfter').text(after.def);
    $('#hpStatAfter').text(after.hp);
    $('#spdStatAfter').text(after.spd);
    $('#crStatAfter').text(after.cr);
    $('#cdStatAfter').text(after.cd);
    $('#effStatAfter').text(after.eff);
    $('#resStatAfter').text(after.res);
    $('#gsStatAfter').text(after.score);

    renderDiff(before, after, 'atk');
    renderDiff(before, after, 'def');
    renderDiff(before, after, 'hp');
    renderDiff(before, after, 'spd');
    renderDiff(before, after, 'cr');
    renderDiff(before, after, 'cd');
    renderDiff(before, after, 'eff');
    renderDiff(before, after, 'res');
    renderDiff(before, after, 'score');

    // HeroStats grid rows have .sets (int[24]); hero objects have .equipment (items map).
    const beforeIsCountArray = before.sets != null;
    const afterIsCountArray = after.sets != null;
    $('#setBefore').html(
      renderSets(
        beforeIsCountArray ? before.sets : before.equipment,
        'previewSet',
        beforeIsCountArray,
      ),
    );
    $('#setAfter').html(
      renderSets(
        afterIsCountArray ? after.sets : after.equipment,
        'previewSet',
        afterIsCountArray,
      ),
    );
  },
};

export default StatPreview;

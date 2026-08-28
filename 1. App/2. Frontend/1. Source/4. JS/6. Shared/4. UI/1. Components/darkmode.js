/* global $, OptimizerGrid, ItemsGrid, HeroesGrid, MultiOptimizerTab */

let dark = false;

/*
Handles the toggle between light/dark mode. Switches the CSS and each changed asset.
*/

// Stat filter-icon ids share a base name; the icon exists as `<base>_dt.png` (dark)
// and `<base>dark.png` (light). Both #mainStat… and #subStat… variants are swapped.
const STAT_ICONS = [
  ['AttackPercent', 'statatkpercent'],
  ['Cd', 'statcd'],
  ['Attack', 'statatk'],
  ['Cr', 'statcr'],
  ['HealthPercent', 'stathppercent'],
  ['Eff', 'stateff'],
  ['Health', 'stathp'],
  ['EffRes', 'statres'],
  ['Speed', 'statspd'],
  ['Defense', 'statdef'],
  ['DefensePercent', 'statdefpercent'],
];

// Non-stat toggle icons: `<base>_dt.png` (dark) and `<base>.png` (light).
const TOGGLE_ICONS = [
  ['#clearAllFilterIcon', 'trash'],
  ['#clearSubstatsFilterIcon', 'trash'],
  ['#duplicateFilterIcon', 'copy'],
  ['#unequippedFilterIcon', 'unequipped'],
  ['img.tooltipImageLeft', 'tooltip'],
  ['img.tooltipImageRight', 'tooltip'],
  ['#donateBadge', 'badgedonate'],
];

const DarkMode = {
  isDark: () => {
    return dark;
  },

  toggle: () => {
    dark = document.getElementById('darkSlider').checked;
    $('#darkThemeCss').prop('disabled', !dark);

    // Stat icons: dark uses the `_dt` variant, light the `…dark` variant.
    const statSuffix = dark ? '_dt' : 'dark';
    STAT_ICONS.forEach(([key, base]) => {
      const src = `./assets/${base}${statSuffix}.png`;
      $(`#mainStat${key}FilterIcon`).attr('src', src);
      $(`#subStat${key}FilterIcon`).attr('src', src);
    });

    // Other toggle icons: dark uses `_dt`, light the plain variant.
    const toggleSuffix = dark ? '_dt' : '';
    TOGGLE_ICONS.forEach(([selector, base]) => {
      $(selector).attr('src', `./assets/${base}${toggleSuffix}.png`);
    });

    OptimizerGrid.toggleDarkMode(dark);
    ItemsGrid.toggleDarkMode(dark);
    HeroesGrid.toggleDarkMode(dark);
    MultiOptimizerTab.toggleDarkMode(dark);
  },

  initialize: () => {
    document.getElementById('darkSlider').addEventListener('click', () => {
      DarkMode.toggle();
    });
  },
};

export default DarkMode;

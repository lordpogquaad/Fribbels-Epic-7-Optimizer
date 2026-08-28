/* global I18n, Dialog,
   OptimizerGrid, ItemsTab, ItemsGrid, HeroesTab, HeroesGrid,
   MultiOptimizerTab, ColorPicker, DarkMode, $, electron */

import Files from './files';
import OptimizerTab from '../../1. Optimizer & Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/optimizerTab';
import EnhancingTab from '../../2. Gear & Enhancing Tab/2. Enhancing Tab/enhancingTab';
import {
  Gears,
  Sets,
  Ranks,
  Stats,
} from '../../2. Gear & Enhancing Tab/3. Gear/enums';
import ForceFilter from '../../2. Gear & Enhancing Tab/1. Gear Tab/forceFilter';
import GearRating from '../../2. Gear & Enhancing Tab/2. Enhancing Tab/gearRating';
import ArchetypeStore from '../../5. Archetype Tab/archetypeStore';
import ArchetypeScorer from '../../5. Archetype Tab/archetypeScorer';
import FlatStatCalibration from '../../2. Gear & Enhancing Tab/3. Gear/flatStatCalibration';
import ArchetypeTab from '../../5. Archetype Tab/archetypeTab';
import HeroData from '../3. Services/heroData';
import HtmlGenerator from '../4. UI/2. Display/htmlGenerator';
import Importer from '../../4. Importer Tab/2. Importer/importer';
import ItemAugmenter from '../../2. Gear & Enhancing Tab/3. Gear/itemAugmenter';
import ItemSerializer from '../../2. Gear & Enhancing Tab/3. Gear/itemSerializer';
import ItemSimulator from '../../2. Gear & Enhancing Tab/2. Enhancing Tab/itemSimulator';
import Locator from '../../2. Gear & Enhancing Tab/1. Gear Tab/locator';
import ModificationFilter from '../../2. Gear & Enhancing Tab/1. Gear Tab/modificationFilter';
import Notifier from '../4. UI/1. Components/notifier';
import PriorityFilter from '../../1. Optimizer & Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/priorityFilter';
import HeroGearMatcher from '../../2. Gear & Enhancing Tab/1. Gear Tab/heroGearMatcher';
import Reforge from '../../2. Gear & Enhancing Tab/3. Gear/reforge';
import Saves from '../../4. Importer Tab/3. Saves/saves';
import Scanner from '../../4. Importer Tab/1. Scanner/scanner';
import Selectors from '../4. UI/2. Display/selectors';
import Settings from '../4. UI/1. Components/settings';
import StatPreview from '../4. UI/2. Display/statPreview';
import Subprocess from '../3. Services/subprocess';
import Tooltip from '../4. UI/1. Components/tooltip';
import Updater from '../4. UI/2. Display/updater';
import Utils from './utils';
import Stat from '../2. Models/stat';
import Item from '../2. Models/item';
import OptimizationRequest from '../2. Models/optimizationRequest';

process.env.ELECTRON_NO_ATTACH_CONSOLE = true;

// Error console echo + the benign-port skip + the Notifier popup for real errors
// are now handled centrally by Log.error (see 5. Dev Only/LogControl.js). The old
// console.error monkey-patch was removed so console.error is never reassigned.
globalThis.Files = Files;
globalThis.I18n = require('../4. UI/3. i18n/i18n').default;

globalThis.Assets = require('../4. UI/1. Components/assets').default;

globalThis.Path = globalThis.require('path');
globalThis.Constants =
  require('../../2. Gear & Enhancing Tab/3. Gear/constants').default;
globalThis.Api = require('../3. Services/api').default;
globalThis.Dialog = require('../4. UI/1. Components/dialog').default;

globalThis.Reforge = Reforge;

globalThis.Utils = Utils;
globalThis.DarkMode = require('../4. UI/1. Components/darkmode').default;
globalThis.GridRenderer = require('../4. UI/4. Renderer/gridRenderer').default;

globalThis.Updater = Updater;

globalThis.StatPreview = StatPreview;
globalThis.Artifact = require('../3. Services/artifact').default;
globalThis.ColorPicker = require('../4. UI/1. Components/colorPicker').default;

// Tab
globalThis.HeroesTab = require('../../3. Hero Tab/heroesTab').default;

globalThis.OptimizerTab = OptimizerTab;
globalThis.MultiOptimizerTab = require('../../1. Optimizer & Multi-Hero Optimizer Tab/2. Multi-Hero Optimizer Tab/multiOptimizerTab');
globalThis.ItemsTab =
  require('../../2. Gear & Enhancing Tab/1. Gear Tab/itemsTab').default;

globalThis.EnhancingTab = EnhancingTab;

// Grid
globalThis.HeroesGrid = require('../../3. Hero Tab/heroesGrid');
globalThis.OptimizerGrid =
  require('../../1. Optimizer & Multi-Hero Optimizer Tab/1. Optimizer/1. Optimizer/optimizerGrid').default;
globalThis.ItemsGrid = require('../../2. Gear & Enhancing Tab/1. Gear Tab/itemsGrid');

globalThis.ModificationFilter = ModificationFilter;

globalThis.Subprocess = Subprocess;

globalThis.Selectors = Selectors;
globalThis.Settings = Settings;

globalThis.ForceFilter = ForceFilter;
globalThis.PriorityFilter = PriorityFilter;
globalThis.HeroGearMatcher = HeroGearMatcher;
// AG-Grid — the monolithic `ag-grid-community` package (exact version pinned in package.json). The
// modular `@ag-grid-community/*` packages were discontinued at v32, so being on the latest version
// means importing from this one package. AllCommunityModule registers every community feature in
// one shot (cell renderers, cell styles, value getters/formatters, tooltips, pagination, both row
// models, row selection, etc.) so no individual feature can throw a "module not registered" error.
const {
  ModuleRegistry,
  AllCommunityModule,
  createGrid,
  provideGlobalGridOptions,
} = require('ag-grid-community');

ModuleRegistry.registerModules([AllCommunityModule]);

// Keep the legacy CSS-file themes (ag-theme-balham loaded via <link> in app.html, dark-tuned by
// darktheme.css). AG-Grid v33 made the JS Theming API the default and treats loaded CSS themes as
// a conflict unless you opt back in with theme:'legacy'.
provideGlobalGridOptions({ theme: 'legacy' });

// Wrap createGrid so callers can continue using grid.gridOptions.api.xxx()
globalThis.createGridCompat = (el, opts) => {
  const api = createGrid(el, opts);
  return { gridOptions: { api } };
};
globalThis.electron = require('electron');

globalThis.Gears = Gears;
globalThis.Sets = Sets;
globalThis.Ranks = Ranks;
globalThis.Stats = Stats;
globalThis.Stat = Stat;
globalThis.Item = Item;

globalThis.GearRating = GearRating;
globalThis.ArchetypeStore = ArchetypeStore;
globalThis.ArchetypeScorer = ArchetypeScorer;
globalThis.ArchetypeTab = ArchetypeTab;
globalThis.FlatStatCalibration = FlatStatCalibration;
globalThis.OptimizationRequest = OptimizationRequest;

globalThis.Importer = Importer;
globalThis.ItemAugmenter = ItemAugmenter;
globalThis.Locator = Locator;

globalThis.ItemSerializer = ItemSerializer;
globalThis.Tooltip = Tooltip;

globalThis.HeroData = HeroData;

globalThis.HtmlGenerator = HtmlGenerator;
globalThis.fs = require('node:fs');

globalThis.Notifier = Notifier;

globalThis.Saves = Saves;

globalThis.Scanner = Scanner;
globalThis.DamageCalc = require('../3. Services/damageCalc').default;

globalThis.ItemSimulator = ItemSimulator;

function setupLinks() {
  $('body').on('click', 'a', (event) => {
    event.preventDefault();
    const link = event.target.href;
    electron.shell.openExternal(link);
  });

  $('#discordBadge').on('click', () => {
    electron.shell.openExternal('https://discord.gg/rDmB4Un7qg');
  });

  $('#donateBadge').on('click', () => {
    electron.shell.openExternal('https://www.buymeacoffee.com/fribbels');
  });

  $('#githubBadge').on('click', () => {
    electron.shell.openExternal(
      'https://github.com/fribbels/Fribbels-Epic-7-Optimizer',
    );
  });

  $('#coffeeImage').on('click', () => {
    electron.shell.openExternal('https://www.buymeacoffee.com/fribbels');
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  setupLinks();

  await I18n.initialize();

  Subprocess.initialize(async () => {
    Notifier.initialize();
    Dialog.initialize();
    Selectors.initialize();

    // Load archetypes BEFORE Settings.initialize() so the _cache is populated
    // before any legacy settingArchetypes code (now removed) could interfere.
    ArchetypeStore.loadArchetypes(); // load from Documents/FribbelsOptimizerSaves/e7-archetypes.json
    await Settings.initialize();
    // HeroData.initialize() must run BEFORE the tab inits below: both
    // HeroesTab.initialize() (hero selector) and ItemsTab.initialize() (Hero Matcher)
    // build their dropdowns from HeroData.getAllHeroData() at init, which returns an
    // empty {} until this populates it (from the local cache file, or the S3 override).
    // Settings.initialize() stays just above because HeroData reads Settings.getUseLocalCache().
    await HeroData.initialize();

    OptimizerTab.initialize();
    OptimizerGrid.initialize();
    ItemsTab.initialize();
    ItemsGrid.initialize();
    HeroesTab.initialize();
    HeroesGrid.initialize();

    Saves.initialize();
    await Saves.loadAutoSave();
    MultiOptimizerTab.initialize();

    Tooltip.initialize();
    ColorPicker.initialize();
    EnhancingTab.initialize();
    ArchetypeTab.initialize();
  });
  Scanner.initialize();
  Updater.displayVersion();
  DarkMode.initialize();

  Importer.addEventListener();
});

/* global I18n, Dialog,
   OptimizerGrid, ItemsTab, ItemsGrid, HeroesTab, HeroesGrid,
   MultiOptimizerTab, ColorPicker, DarkMode, $, electron */

import Files from './files';
import OptimizerTab from './tabs/optimizerTab';
import EnhancingTab from './tabs/enhancingTab';
import { Gears, Sets, Ranks, Stats, Heroes } from './enums';
import ForceFilter from './filters/forceFilter';
import GearRating from './gear/gearRating';
import ArchetypeStore from './gear/archetypeStore';
import ArchetypeScorer from './gear/archetypeScorer';
import FlatStatCalibration from './gear/flatStatCalibration';
import ArchetypeTab from './tabs/archetypeTab';
import HeroData from './services/heroData';
import HtmlGenerator from './ui/htmlGenerator';
import Importer from './data/importer';
import ItemAugmenter from './gear/itemAugmenter';
import ItemSerializer from './gear/itemSerializer';
import ItemSimulator from './gear/itemSimulator';
import Locator from './filters/locator';
import MainStatFixer from './gear/mainStatFixer';
import ModificationFilter from './filters/modificationFilter';
import Notifier from './ui/notifier';
import PriorityFilter from './gear/priorityFilter';
import HeroGearMatcher from './gear/heroGearMatcher';
import Reforge from './gear/reforge';
import Saves from './data/saves';
import Scanner from './data/scanner';
import Selectors from './ui/selectors';
import Settings from './ui/settings';
import StatPreview from './ui/statPreview';
import Subprocess from './services/subprocess';
import Tooltip from './ui/tooltip';
import Updater from './ui/updater';
import Utils from './utils';
import Logger from './logger';
import Stat from './models/stat';
import Item from './models/item';
import OptimizationRequest from './models/optimizationRequest';

process.env.ELECTRON_NO_ATTACH_CONSOLE = true;

/* eslint-disable no-console */
(function consoleErrorOverride() {
    const original = console.error;
    console.error = function consoleErrorHandler(...args) {
        if (args.length > 0) {
            // Ignore benign "port not found" error that occurs on first launch
            // when kill-port-process checks port 8130 and nothing is running yet
            if (
                typeof args[0] === 'string' &&
                args[0].includes('Failed to get pid of port')
            ) {
                return;
            }
            original.apply(console, args);
            console.trace();
            Notifier.error(args[0]);
        }
    };
})();
/* eslint-enable no-console */
global.Files = Files;
global.Logger = Logger;
global.I18n = require('./i18n/i18n').default;

global.Assets = require('./ui/assets').default;

global.Path = window.require('path');
global.Constants = require('./constants').default;
global.Api = require('./services/api').default;
global.Dialog = require('./ui/dialog').default;

global.Reforge = Reforge;

global.Utils = Utils;
global.DarkMode = require('./ui/darkmode').default;
global.GridRenderer = require('./renderer/gridRenderer').default;

global.Updater = Updater;

global.StatPreview = StatPreview;
global.Artifact = require('./services/artifact').default;
global.ColorPicker = require('./ui/colorPicker').default;

// Tab
global.HeroesTab = require('./tabs/heroesTab').default;

global.OptimizerTab = OptimizerTab;
global.MultiOptimizerTab = require('./tabs/multiOptimizerTab');
global.ItemsTab = require('./tabs/itemsTab').default;

global.EnhancingTab = EnhancingTab;

// Grid
global.HeroesGrid = require('./grids/heroesGrid');
global.OptimizerGrid = require('./grids/optimizerGrid').default;
global.ItemsGrid = require('./grids/itemsGrid');

global.ModificationFilter = ModificationFilter;

global.Subprocess = Subprocess;

global.Selectors = Selectors;
global.Settings = Settings;

global.ForceFilter = ForceFilter;
global.PriorityFilter = PriorityFilter;
global.HeroGearMatcher = HeroGearMatcher;
const { ModuleRegistry, Grid } = require('@ag-grid-community/core');
const {
    ClientSideRowModelModule,
} = require('@ag-grid-community/client-side-row-model');
const {
    InfiniteRowModelModule,
} = require('@ag-grid-community/infinite-row-model');

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    InfiniteRowModelModule,
]);
global.Grid = Grid;
global.electron = require('electron');

global.Gears = Gears;
global.Sets = Sets;
global.Ranks = Ranks;
global.Stats = Stats;
global.Heroes = Heroes;
global.Stat = Stat;
global.Item = Item;

global.MainStatFixer = MainStatFixer;

global.GearRating = GearRating;
global.ArchetypeStore = ArchetypeStore;
global.ArchetypeScorer = ArchetypeScorer;
global.ArchetypeTab = ArchetypeTab;
global.FlatStatCalibration = FlatStatCalibration;
global.OptimizationRequest = OptimizationRequest;

global.Importer = Importer;
global.ItemAugmenter = ItemAugmenter;
global.Locator = Locator;
// global.Optimizer = require('./optimizer');
// global.GearCalculator = require('./gearCalculator');
global.ItemSerializer = ItemSerializer;
global.Tooltip = Tooltip;
// global.Backend = require('../backend');
global.Files = Files;

global.HeroData = HeroData;
// global.HeroManager = require('./heroManager');
global.HtmlGenerator = HtmlGenerator;
global.fs = require('fs');

global.Notifier = Notifier;

global.Saves = Saves;

global.Scanner = Scanner;
global.DamageCalc = require('./services/damageCalc').default;

global.ItemSimulator = ItemSimulator;

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
    Logger.initialize();

    await I18n.initialize();

    Subprocess.initialize(async () => {
        await HeroData.initialize();

        Notifier.initialize();
        Dialog.initialize();
        Selectors.initialize();

        OptimizerTab.initialize();
        OptimizerGrid.initialize();
        ItemsTab.initialize();
        ItemsGrid.initialize();
        HeroesTab.initialize();
        HeroesGrid.initialize();

        // Load archetypes BEFORE Settings.initialize() so the _cache is populated
        // before any legacy settingArchetypes code (now removed) could interfere.
        ArchetypeStore.loadArchetypes(); // load from Documents/FribbelsOptimizerSaves/e7-archetypes.json
        await Settings.initialize();
        Saves.initialize();
        await Saves.loadAutoSave();
        MultiOptimizerTab.initialize();

        Tooltip.initialize();
        ColorPicker.initialize();
        EnhancingTab.initialize();
        ArchetypeTab.initialize();
    });
    Scanner.initialize();
    Updater.checkForUpdates();
    DarkMode.initialize();

    Importer.addEventListener();
});

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./2. Frontend/1. Source/main.prod.js` using webpack. This gives us some performance wins.
 */
const path = require('node:path');

const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');

// In dev __dirname is '5. Dev Only/' (1 level below app root).
// In prod webpack compiles this to '2. Frontend/1. Source/main.prod.js' (2 levels below).
const appRoot =
  process.env.NODE_ENV === 'development'
    ? path.resolve(__dirname, '..')
    : path.resolve(__dirname, '../..');

const frontendModules = path.join(
  appRoot,
  '2. Frontend',
  '1. Source',
  'node_modules',
);
const remoteMain = require(
  path.join(frontendModules, '@electron', 'remote', 'main'),
);

const isMac = process.platform === 'darwin';
let closed = false;

// Match build.appId
app.setAppUserModelId('com.lordpogquaad.poge7optimizer');
app.setAsDefaultProtocolClient('com.lordpogquaad.poge7optimizer');

const template = [
  {
    label: 'File',
    submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
  },

  {
    label: 'View',
    submenu: [
      {
        role: 'toggledevtools',
      },
      {
        type: 'separator',
      },
      {
        role: 'reload',
      },
      {
        role: 'forcereload',
      },
      {
        type: 'separator',
      },
      {
        role: 'resetzoom',
      },
      {
        role: 'zoomin',
      },
      {
        role: 'zoomout',
      },
      {
        type: 'separator',
      },
      {
        role: 'togglefullscreen',
      },
    ],
  },
  {
    role: 'window',
    submenu: [
      {
        role: 'minimize',
      },
      {
        role: 'close',
      },
    ],
  },

  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: async () => {
          await shell.openExternal(
            'https://github.com/RexQian/Fribbels-Epic-7-Optimizer',
          );
        },
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

let mainWindow = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  // Keep the F12 / reload shortcuts, but don't let electron-debug auto-open an
  // (untitled) DevTools window — createWindow opens it with a clean title instead.
  require('electron-debug').default({ showDevTools: false });
}

const createWindow = async () => {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'resources')
    : path.join(appRoot, '2. Frontend', '1. Source', '1. HTML', 'assets');

  const getAssetPath = (assetPath) => {
    return path.join(RESOURCES_PATH, assetPath);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1400,
    height: 1000,
    icon: getAssetPath('icon.png'),
    webPreferences:
      (process.env.NODE_ENV === 'development' ||
        process.env.E2E_BUILD === 'true') &&
      process.env.ERB_SECURE !== 'true'
        ? {
            nodeIntegration: true,
            contextIsolation: false,
          }
        : {
            preload: path.join(
              appRoot,
              '2. Frontend/1. Source/8. DIST/renderer.prod.js',
            ),
            nodeIntegration: true,
            contextIsolation: false,
          },
  });

  remoteMain.initialize();
  remoteMain.enable(mainWindow.webContents);

  mainWindow.loadURL(
    `file://${path.join(appRoot, '2. Frontend/1. Source/1. HTML/app.html')}`,
  );

  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }

    // Auto-open DevTools in dev with a clean window title. Electron 42's `title`
    // option (undocked/detach only) overrides Chromium's default
    // "Developer Tools - <file:// URL>". Guarded so a page reload won't re-open it.
    if (
      (process.env.NODE_ENV === 'development' ||
        process.env.DEBUG_PROD === 'true') &&
      !mainWindow.webContents.isDevToolsOpened()
    ) {
      mainWindow.webContents.openDevTools({
        mode: 'undocked',
        title: 'Developer Tools',
      });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('resize', () => {
    mainWindow.webContents.send('resize');
  });

  mainWindow.on('resized', () => {
    mainWindow.webContents.send('resized');
  });

  mainWindow.on('close', (e) => {
    if (!closed) {
      e.preventDefault();
      mainWindow.webContents.send('app-close');
    }
  });

  ipcMain.on('closed', () => {
    closed = true;
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

if (process.env.E2E_BUILD === 'true') {
  app.whenReady().then(createWindow);
} else {
  app.on('ready', createWindow);
}

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

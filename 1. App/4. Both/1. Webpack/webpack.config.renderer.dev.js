/**
 * Build config for development electron renderer process that uses
 * Hot-Module-Replacement
 *
 * https://webpack.js.org/concepts/hot-module-replacement/
 */

const path = require('node:path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const { spawn } = require('node:child_process');
const baseConfig = require('./webpack.config.base.js');
const CheckNodeEnv = require('../2. Build/1. Scripts/CheckNodeEnv.js');

// When an ESLint server is running, we can't set the NODE_ENV so we'll check if it's
// at the dev webpack config is not accidentally run in a production environment
if (process.env.NODE_ENV === 'production') {
  CheckNodeEnv('development');
}

const port = process.env.PORT || 1212;
const publicPath = `http://localhost:${port}/dist`;

module.exports = merge(baseConfig, {
  devtool: 'inline-source-map',

  mode: 'development',

  // Webpack 5 persistent filesystem cache — replaces the old dev DLL. Caches compiled
  // modules (incl. node_modules deps) under node_modules/.cache/webpack, so incremental
  // dev rebuilds stay fast without a separate build-dll step.
  cache: {
    type: 'filesystem',
    buildDependencies: { config: [__filename] },
  },

  target: 'electron-renderer',

  entry: [
    'core-js',
    'regenerator-runtime/runtime',
    require.resolve('../../2. Frontend/1. Source/4. JS/6. Shared/1. Core/init.js'),
  ],

  output: {
    publicPath: `http://localhost:${port}/dist/`,
    filename: 'renderer.dev.js',
    path: path.join(__dirname, '../..', '2. Frontend', '1. Source'),
  },

  module: {
    rules: [
      {
        test: /\.global\.css$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      // Fonts — webpack 5 asset modules (replaces url-loader / file-loader)
      {
        test: /\.(woff|woff2|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        type: 'asset',
        parser: {
          dataUrlCondition: { maxSize: 10000 },
        },
      },
      // SVG
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        type: 'asset',
        parser: {
          dataUrlCondition: { maxSize: 10000 },
        },
      },
      // Common Image Formats
      {
        test: /\.(?:ico|gif|png|jpg|jpeg|webp)$/,
        type: 'asset',
      },
    ],
  },
  resolve: {},
  plugins: [
    /**
     * Create global constants which can be configured at compile time.
     *
     * Useful for allowing different behaviour between development builds and
     * release builds
     *
     * NODE_ENV should be production so that modules do not perform certain
     * development checks
     *
     * By default, use 'development' as NODE_ENV. This can be overriden with
     * 'staging', for example, by changing the ENV variables in the npm scripts
     */
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development',
    }),
  ],

  node: {
    __dirname: false,
    __filename: false,
  },

  optimization: {
    emitOnErrors: false,
  },

  // Compiler watch tuning. These used to sit under devServer.watchFiles.options with no
  // `paths`, which webpack-dev-server 5 silently tolerated and v6 (chokidar 5) rejects with
  // "Non-string provided as watch path". They are webpack watchOptions, not dev-server file
  // watches, so this is where they belong.
  watchOptions: {
    aggregateTimeout: 300,
    ignored: /node_modules/,
    poll: 100,
  },

  devServer: {
    port,
    hot: true,
    compress: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    client: {
      webSocketURL: `ws://localhost:${port}/ws`,
    },
    historyApiFallback: {
      verbose: true,
      disableDotRule: false,
    },
    devMiddleware: {
      publicPath,
      writeToDisk: (filePath) => filePath.endsWith('renderer.dev.js'),
    },
    setupMiddlewares(middlewares, devServer) {
      if (process.env.START_HOT) {
        if (!process.env.E7_BUILD_QUIET) console.log('Starting Main Process...');
        let mainProcess = null;
        devServer.compiler.hooks.done.tap('StartMainProcess', (stats) => {
          if (!mainProcess && !stats.hasErrors()) {
            // Delete ELECTRON_RUN_AS_NODE so Electron doesn't run in
            // pure Node mode (set by Claude Code CLI and similar Electron hosts).
            const spawnEnv = { ...process.env };
            delete spawnEnv.ELECTRON_RUN_AS_NODE;
            mainProcess = spawn('npm', ['run', 'start-main-dev'], {
              shell: true,
              env: spawnEnv,
              stdio: 'inherit',
            })
              .on('close', (code) => process.exit(code))
              .on('error', (spawnError) => console.error(spawnError));
          }
        });
      }
      return middlewares;
    },
  },
});

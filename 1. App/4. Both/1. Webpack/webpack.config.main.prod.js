/**
 * Webpack config for production electron main process
 */

const path = require('node:path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const baseConfig = require('./webpack.config.base.js');
const CheckNodeEnv = require('../2. Build/1. Scripts/CheckNodeEnv.js');
const DeleteSourceMaps = require('../2. Build/1. Scripts/DeleteSourceMaps.js');

CheckNodeEnv('production');
DeleteSourceMaps();

module.exports = merge(baseConfig, {
  devtool: false,

  mode: 'production',

  target: 'electron-main',

  entry: './5. Dev Only/main.dev.js',

  output: {
    path: path.join(__dirname, '../..'),
    filename: './2. Frontend/1. Source/main.prod.js',
  },

  optimization: {
    minimizer: process.env.E2E_BUILD
      ? []
      : [
          new TerserPlugin({
            parallel: true,
          }),
        ],
  },

  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode:
        process.env.OPEN_ANALYZER === 'true' ? 'server' : 'disabled',
      openAnalyzer: process.env.OPEN_ANALYZER === 'true',
    }),

    /**
     * Create global constants which can be configured at compile time.
     *
     * Useful for allowing different behaviour between development builds and
     * release builds
     *
     * NODE_ENV should be production so that modules do not perform certain
     * development checks
     */
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
      DEBUG_PROD: false,
      START_MINIMIZED: false,
      E2E_BUILD: false,
    }),
  ],

  /**
   * Disables webpack processing of __dirname and __filename.
   * If you run the bundle in node.js it falls back to these values of node.js.
   * https://github.com/webpack/webpack/issues/2010
   */
  node: {
    __dirname: false,
    __filename: false,
  },
});

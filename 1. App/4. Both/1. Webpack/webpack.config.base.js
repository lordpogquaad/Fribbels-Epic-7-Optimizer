/**
 * Base webpack config used across other specific configs
 */

const path = require('node:path');
const webpack = require('webpack');
const {
  dependencies: externals,
} = require('../../2. Frontend/1. Source/package.json');

module.exports = {
  externals: Object.keys(externals || {}),

  output: {
    path: path.join(__dirname, '../..', '2. Frontend', '1. Source'),
    // https://github.com/webpack/webpack/issues/1114
    library: {
      type: 'commonjs2',
    },
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.js', '.json'],
    modules: [
      path.join(__dirname, '../..', '2. Frontend', '1. Source'),
      path.join(__dirname, '../..', '2. Frontend', '1. Source', 'node_modules'),
      'node_modules',
    ],
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
    }),
  ],

  optimization: {
    moduleIds: 'named',
  },
};

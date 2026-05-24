/**
 * Builds the DLL for development electron renderer process
 */

const webpack = require('webpack');
const path = require('path');
const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config.base.js');
const { dependencies } = require('../../package.json');
const CheckNodeEnv = require('../2. Build/scripts/CheckNodeEnv.js');

CheckNodeEnv('development');

const dist = path.join(__dirname, '../..', '2. Frontend', '3. DLL');

module.exports = merge(baseConfig, {
    context: path.join(__dirname, '../..'),

    devtool: 'eval',

    mode: 'development',

    target: 'electron-renderer',

    externals: ['fsevents', 'crypto-browserify'],

    /**
     * Use `module` from `webpack.config.renderer.dev.js`
     */
    module: require('./webpack.config.renderer.dev.babel.js').module,

    entry: {
        renderer: Object.keys(dependencies || {}),
    },

    output: {
        library: {
            name: 'renderer',
            type: 'var',
        },
        path: dist,
        filename: '[name].dev.dll.js',
    },

    plugins: [
        new webpack.DllPlugin({
            path: path.join(dist, '[name].json'),
            name: '[name]',
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
            NODE_ENV: 'development',
        }),

        new webpack.LoaderOptionsPlugin({
            debug: true,
            options: {
                context: path.join(
                    __dirname,
                    '../..',
                    '2. Frontend',
                    '1. Source'
                ),
                output: {
                    path: path.join(
                        __dirname,
                        '../..',
                        '2. Frontend',
                        '3. DLL'
                    ),
                },
            },
        }),
    ],
});

const path = require('path');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
module.exports = (dir) => {
  return {
    entry: {
      tests: path.join(dir, 'dist', 'test', 'unit', 'all.js')
    },
    output: {
      path: path.join(dir, 'dist', 'test', 'unit'),
      filename: 'all.bundle.js'
    },
    target: 'node',
    node: false,
    externals: [
      // in order to ignore all modules in node_modules folder
      nodeExternals({
        modulesDir: path.join(__dirname, '..', '..', 'node_modules')
      }),
      nodeExternals({ modulesDir: path.join(dir, 'node_modules') })
    ],
    module: {
      rules: [
        {
          test: /\.js$/,
          use: ['source-map-loader'],
          enforce: 'pre'
        },
        { test: /\.xml$/, loader: 'raw-loader' }
      ]
    },
    mode: 'development',
    resolve: {
      alias: {
        'isomorphic-fetch': 'node-fetch',
        sqlite3: require.resolve('sqlite3')
      }
    },
    plugins: [
      new webpack.BannerPlugin({
        banner: 'require("source-map-support").install();',
        raw: true,
        entryOnly: false
      })
    ],
    devtool: 'inline-source-map'
  };
};

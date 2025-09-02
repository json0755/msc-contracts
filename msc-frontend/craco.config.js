const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add fallbacks for Node.js modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "buffer": require.resolve("buffer"),
        "stream": require.resolve("stream-browserify"),
        "crypto": require.resolve("crypto-browserify"),
        "process": require.resolve("process/browser.js"),
        "util": require.resolve("util"),
        "assert": require.resolve("assert"),
        "http": false,
        "https": false,
        "os": false,
        "url": false,
        "zlib": false,
        "fs": false,
        "net": false,
        "path": false,
        "querystring": false,
        "readline": false,
        "child_process": false
      };

      // Add plugins for global variables
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser.js',
        }),
      ];

      return webpackConfig;
    },
  },
};
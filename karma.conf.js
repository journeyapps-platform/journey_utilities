const isTravis = 'CI' in process.env;
module.exports = function (basepath) {
  return function (config) {
    config.set({
      basePath: basepath,
      plugins: [
        'karma-webpack',
        'karma-sourcemap-loader',
        'karma-jasmine',
        'karma-chrome-launcher',
        'karma-firefox-launcher'
      ],
      frameworks: ['webpack', 'sourcemap', 'jasmine'],
      preprocessors: {
        // All the tests are loaded via this. We preprocess with webpack.
        'dist/test/unit/all.js': ['webpack', 'sourcemap'],
        'test/dist/all.js': ['webpack', 'sourcemap']
      },
      files: [
        // Fixtures first
        { pattern: 'dist/test/fixtures/**/*.xml', included: false },
        { pattern: 'dist/test/fixtures/**/*.json', included: false },
        { pattern: 'test/fixtures/**/*.xml', included: false },
        { pattern: 'test/fixtures/**/*.json', included: false },
        // Bootstrap
        'dist/test/unit/all.js',
        'test/dist/all.js'
      ],
      webpack: {
        module: {
          rules: [
            {
              test: /\.xml$/,
              loader: 'raw-loader'
            }
          ]
        },
        node: {},
        externals: ['websql', 'fs', 'path'],
        devtool: 'inline-source-map'
      },
      webpackServer: {
        stats: 'errors-only'
      },
      frameworks: ['jasmine'],

      // web server port
      listenAddress: '127.0.0.1',
      hostname: '127.0.0.1',
      port: 8080,
      // cli runner port
      runnerPort: 9100,
      autoWatch: true,
      colors: true,
      reporters: ['progress'],
      // If browser does not capture in given timeout [ms], kill it
      captureTimeout: 10000,
      browsers: ['Chrome']
    });

    //only do this stuff if we are in travis
    if (isTravis) {
      config.set({
        reporters: ['dots'],
        browsers: ['TravisChrome', 'Firefox'],
        customLaunchers: {
          TravisChrome: {
            base: 'Chrome',
            flags: [
              '--unlimited-storage',
              // Chrome doesn't run well in xvfb without this flag - "no output captured"
              '--no-sandbox'
            ]
          }
        }
      });
    }
  };
};

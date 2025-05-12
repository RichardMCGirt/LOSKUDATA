const path = require('path-browserify');

module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    path: require.resolve('path-browserify'),
    http: require.resolve('stream-http'),
    os: require.resolve('os-browserify/browser')
  };
  return config;
};

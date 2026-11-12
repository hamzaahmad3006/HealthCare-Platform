const { generateApiConfig } = require('./scripts/configure-api');

module.exports = function (api) {
  // React Native's bundle command sets NODE_ENV from --dev before transforming.
  // Validate here too: Metro config can be loaded before that flag is applied.
  generateApiConfig({ production: api.env('production') });
  return { presets: ['module:@react-native/babel-preset'] };
};

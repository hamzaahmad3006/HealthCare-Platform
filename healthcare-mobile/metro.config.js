const { generateApiConfig } = require('./scripts/configure-api');

// Also covers direct native/IDE builds that do not run npm lifecycle scripts.
generateApiConfig({ production: process.env.NODE_ENV === 'production' });

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

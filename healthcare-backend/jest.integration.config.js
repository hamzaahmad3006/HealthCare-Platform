const base = require('./jest.config');
module.exports = {
  ...base,
  testMatch: ['**/tests/integration/**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/integration/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testTimeout: 30000,
  maxWorkers: 1,
};

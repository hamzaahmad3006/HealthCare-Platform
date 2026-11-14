module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native(?:-[^/]+)?|@react-native[^/]*/[^/]+|@react-navigation/[^/]+|react-redux|immer|redux|redux-thunk|reselect)/)',
  ],
};

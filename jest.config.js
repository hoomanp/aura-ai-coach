module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  globals: {
    '__DEV__': true,
  },
};

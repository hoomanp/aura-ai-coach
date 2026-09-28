module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  modulePathIgnorePatterns: ['<rootDir>/.worktrees'],
  testPathIgnorePatterns: ['<rootDir>/.worktrees'],
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

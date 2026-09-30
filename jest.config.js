module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  modulePathIgnorePatterns: ['<rootDir>/.worktrees'],
  testPathIgnorePatterns: ['<rootDir>/.worktrees'],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^@expo/vector-icons$': '<rootDir>/__mocks__/vector-icons.js',
    '^@expo/vector-icons/(.*)$': '<rootDir>/__mocks__/vector-icons.js',
    '^victory-native$': '<rootDir>/__mocks__/victory-native.js',
    '^@react-navigation/native$': '<rootDir>/__mocks__/react-navigation-native.js',
    '^@react-navigation/bottom-tabs$': '<rootDir>/__mocks__/react-navigation-bottom-tabs.js',
    '^expo-status-bar$': '<rootDir>/__mocks__/expo-status-bar.js',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },
  globals: {
    '__DEV__': true,
  },
};

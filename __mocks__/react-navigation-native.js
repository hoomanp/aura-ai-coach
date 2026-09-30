const React = require('react');

const NavigationContainer = ({ children }) => React.createElement('NavigationContainer', null, children);

module.exports = {
  NavigationContainer,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
};

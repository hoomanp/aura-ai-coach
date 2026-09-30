const React = require('react');

const createBottomTabNavigator = () => {
  const Navigator = ({ children }) => React.createElement('TabNavigator', null, children);
  Navigator.displayName = 'TabNavigator';
  const Screen = (props) => React.createElement('TabScreen', props, null);
  Screen.displayName = 'TabScreen';
  return {
    Navigator,
    Screen,
  };
};

module.exports = {
  createBottomTabNavigator,
};

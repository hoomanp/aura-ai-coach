const React = require('react');

const mockIcon = (name) => {
  const Icon = (props) => React.createElement('Icon', { ...props, name });
  Icon.displayName = name;
  return Icon;
};

const Ionicons = mockIcon('Ionicons');

module.exports = {
  Ionicons,
  default: Ionicons,
};

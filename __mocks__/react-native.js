const React = require('react');

const Platform = {
  OS: 'ios',
  select: jest.fn(obj => obj.ios),
};

const createMockComponent = (name) => {
  const Component = (props) => {
    return React.createElement(name, props, props ? props.children : null);
  };
  Component.displayName = name;
  return Component;
};

module.exports = {
  Platform,
  View: createMockComponent('View'),
  Text: createMockComponent('Text'),
  TouchableOpacity: createMockComponent('TouchableOpacity'),
  Modal: createMockComponent('Modal'),
  ScrollView: createMockComponent('ScrollView'),
  SafeAreaView: createMockComponent('SafeAreaView'),
  TextInput: createMockComponent('TextInput'),
  ActivityIndicator: createMockComponent('ActivityIndicator'),
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => (Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : (style || {})),
  },
};

const React = require('react');

const mockVictory = (name) => {
  const Comp = (props) => React.createElement(name, props, props ? props.children : null);
  Comp.displayName = name;
  return Comp;
};

module.exports = {
  VictoryChart: mockVictory('VictoryChart'),
  VictoryLine: mockVictory('VictoryLine'),
  VictoryBar: mockVictory('VictoryBar'),
  VictoryArea: mockVictory('VictoryArea'),
  VictoryAxis: mockVictory('VictoryAxis'),
  VictoryVoronoiContainer: mockVictory('VictoryVoronoiContainer'),
  VictoryTooltip: mockVictory('VictoryTooltip'),
};

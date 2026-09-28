declare module 'victory-native' {
  import * as React from 'react';
  export const VictoryChart: React.ComponentType<any>;
  export const VictoryLine: React.ComponentType<any>;
  export const VictoryBar: React.ComponentType<any>;
  export const VictoryArea: React.ComponentType<any>;
  export const VictoryAxis: React.ComponentType<any>;
  export const VictoryVoronoiContainer: React.ComponentType<any>;
  export const VictoryTooltip: React.ComponentType<any>;
}

declare module 'victory-core' {
  export interface CallbackArgs {
    datum?: any;
    [key: string]: any;
  }
}

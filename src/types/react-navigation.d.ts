declare module '@react-navigation/native' {
  import * as React from 'react';
  export const NavigationContainer: React.ComponentType<{
    children?: React.ReactNode;
    [key: string]: any;
  }>;
  export function useNavigation<T = any>(): T;
  export function useRoute<T = any>(): T;
  export function useIsFocused(): boolean;
}

declare module '@react-navigation/bottom-tabs' {
  import * as React from 'react';
  export function createBottomTabNavigator<T extends Record<string, object | undefined> = any>(): {
    Navigator: React.ComponentType<any>;
    Screen: React.ComponentType<any>;
    Group: React.ComponentType<any>;
  };
}

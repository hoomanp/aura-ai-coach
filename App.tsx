import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { AICoachScreen } from './src/screens/AICoachScreen';
import { Colors } from './src/theme/Theme';

export type RootTabParamList = {
  Dashboard: undefined;
  History: undefined;
  'AI Coach': undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  Dashboard: 'heart',
  History: 'bar-chart',
  'AI Coach': 'chatbubble-ellipses',
};

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
          ),
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          headerShown: false,
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="AI Coach" component={AICoachScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

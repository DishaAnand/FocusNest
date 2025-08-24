// App.tsx
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import HomeScreen from './src/screens/HomeScreen';
import TimerScreen from './src/screens/TimerScreen';
import ProgressScreen from './src/screens/ProgressScreeen'; // ✅ correct import

Ionicons.loadFont();
const Tab = createBottomTabNavigator();

// Nav theme -> ensures consistent bg as a fallback too
// const navTheme = {
//   ...DefaultTheme,
//   colors: { ...DefaultTheme.colors, background: theme.bg },
// };

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer >
        <Tab.Navigator
          screenOptions={({ route }) => ({
            // consistent screen background

            tabBarIcon: ({ color, size }) => {
              let iconName: string = 'ellipse-outline';
              if (route.name === 'Home') iconName = 'list';
              else if (route.name === 'Timer') iconName = 'time';
              else if (route.name === 'Progress') iconName = 'stats-chart';
              return <Ionicons name={iconName} size={size} color={color} />;
            },

            tabBarActiveTintColor: '#2b7a78',
            tabBarInactiveTintColor: '#87c5c3',
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#fff', // or theme.card
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              height: 70,
              borderTopWidth: 0,
              elevation: 8,
            },
            tabBarLabelStyle: { fontSize: 12, paddingBottom: 4 },
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Timer" component={TimerScreen} />
          <Tab.Screen name="Progress" component={ProgressScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;

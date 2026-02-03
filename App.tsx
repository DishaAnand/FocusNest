import React, { useState, useEffect } from 'react';
import { Linking, Modal } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import HomeScreen from './src/screens/HomeScreen';
import TimerScreen from './src/screens/TimerScreen';
import ProgressScreen from './src/screens/ProgressScreeen';
import SettingsScreen from './src/screens/SettingsScreen';
import JoinScreen from './src/screens/JoinScreen';

import { ThemeProvider, useAppTheme } from './src/theme/ThemeProvider';

Ionicons.loadFont();
const Tab = createBottomTabNavigator();

function RootTabs() {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: string = 'ellipse-outline';
          if (route.name === 'Home') iconName = 'list';
          else if (route.name === 'Timer') iconName = 'time';
          else if (route.name === 'Progress') iconName = 'stats-chart';
          else if (route.name === 'Settings') iconName = 'settings';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
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
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AppRoot() {
  const { navTheme } = useAppTheme();
  const [joinSessionId, setJoinSessionId] = useState<string | null>(null);
  const [joinedSuccessfully, setJoinedSuccessfully] = useState(false);

  // Extracts session ID from deep link URL
  // focushaven://buddy/abc123 → "abc123"
  const extractSessionId = (url: string): string | null => {
    const match = url.match(/focushaven:\/\/buddy\/(.+)/);
    return match ? match[1] : null;
  };

  // Handles the deep link URL
  const handleDeepLink = (url: string) => {
    const sessionId = extractSessionId(url);
    if (sessionId) {
      setJoinSessionId(sessionId);
      setJoinedSuccessfully(false);
    }
  };

  useEffect(() => {
    // Case 1: App was closed, user taps link → app opens fresh
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Case 2: App was in background, user taps link → app comes to foreground
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer theme={navTheme}>
      <RootTabs />

      {/* Deep link Join Modal */}
      <Modal
        visible={joinSessionId !== null && !joinedSuccessfully}
        animationType="slide"
        onRequestClose={() => setJoinSessionId(null)}
      >
        {joinSessionId && (
          <JoinScreen
            sessionId={joinSessionId}
            onBack={() => setJoinSessionId(null)}
            onJoined={() => setJoinedSuccessfully(true)}
          />
        )}
      </Modal>
    </NavigationContainer>
  );
}

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppRoot />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
};

export default App;
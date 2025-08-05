import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; 
Ionicons.loadFont();
import HomeScreen from './screens/HomeScreen';

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HomeScreen />
    </GestureHandlerRootView>
  );
};

export default App;
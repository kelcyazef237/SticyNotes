/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import NoteDetailScreen from './src/screens/NoteDetailScreen';
import { theme } from './src/utils/theme';

// Create the navigator
// Define app routes for type safety
type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  NoteDetail: { noteId?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.ReactElement {
  // Register vector icons for the entire app
  useEffect(() => {
    // Any app-level setup can go here
  }, []);

  return (
    <NavigationContainer>
      <StatusBar 
        backgroundColor={theme.colors.primary}
        barStyle="light-content" 
      />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.white },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;

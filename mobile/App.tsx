import { enableScreens } from 'react-native-screens';
enableScreens();

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types/navigation';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import { SafeAreaProvider } from 'react-native-safe-area-context';


import Landing from './screens/Landing';
import Login from './screens/Login';
import Signup from './screens/Signup';
import Home from './screens/Home';
import CompleteProfileScreen from './screens/CompleteProfile';


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {

  useEffect(() => {
    if (Platform.OS === 'android') {
      changeNavigationBarColor('#000000', true, true);
    }
  }, []);


  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Landing" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Landing" component={Landing} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Signup" component={Signup} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

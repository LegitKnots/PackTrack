"use client"

import { enableScreens } from "react-native-screens"
enableScreens()

import { useEffect } from "react"
import { Platform } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import type { RootStackParamList } from "./types/navigation"
import changeNavigationBarColor from "react-native-navigation-bar-color"
import { SafeAreaProvider } from "react-native-safe-area-context"
import "react-native-get-random-values"

import Landing from "./screens/Landing"
import Login from "./screens/Login"
import Signup from "./screens/Signup"
import HomeNavigation from "./screens/HomeNavigation"
import CompleteProfileScreen from "./screens/CompleteProfile"
import RouteDetailsScreen from "./screens/RouteDetailsScreen"
import DrivingDirectionsScreen from "./screens/DrivingDirectionsScreen"
import EditRoute from "./screens/EditRoute"
import PackDetailsScreen from "./screens/PackDetailsScreen"
import PackMembersScreen from "./screens/PackMembersScreen"
import PackSettingsScreen from "./screens/PackSettingsScreen"
import PackChatScreen from "./screens/PackChatScreen"

import { GestureHandlerRootView } from "react-native-gesture-handler"

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  useEffect(() => {
    if (Platform.OS === "android") {
      changeNavigationBarColor("#000000", true, true)
    }
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Landing" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Landing" component={Landing} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Signup" component={Signup} />
            <Stack.Screen name="HomeNavigation" component={HomeNavigation} />
            <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
            <Stack.Screen name="Drive" component={DrivingDirectionsScreen} />
            <Stack.Screen name="RouteDetails" component={RouteDetailsScreen} />
            <Stack.Screen name="EditRoute" component={EditRoute} />
            <Stack.Screen name="PackDetails" component={PackDetailsScreen} />
            <Stack.Screen name="PackMembers" component={PackMembersScreen} />
            <Stack.Screen name="PackSettings" component={PackSettingsScreen} />
            <Stack.Screen name="PackChat" component={PackChatScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

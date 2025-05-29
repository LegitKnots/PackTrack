"use client"

import { enableScreens } from "react-native-screens"
enableScreens()

import { useEffect } from "react"
import { Platform } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import changeNavigationBarColor from "react-native-navigation-bar-color"
import { SafeAreaProvider } from "react-native-safe-area-context"
import "react-native-get-random-values"

import Landing from "./screens/Landing"
import Login from "./screens/Login"
import Signup from "./screens/Signup"
import HomeNavigation from "./screens/HomeNavigation"
import HomeScreen from "./screens/HomeScreen"
import CompleteProfileScreen from "./screens/CompleteProfile"
import RouteDetailsScreen from "./screens/RouteDetailsScreen"
import DrivingDirectionsScreen from "./screens/DrivingDirectionsScreen"
import EditRoute from "./screens/EditRoute"
import PackDetailsScreen from "./screens/PackDetailsScreen"
import PackMembersScreen from "./screens/PackMembersScreen"
import PackSettingsScreen from "./screens/PackSettingsScreen"
import PackChatScreen from "./screens/PackChatScreen"
import SettingsScreen from "./screens/SettingsScreen"
import AccountSettingsScreen from "./screens/AccountSettingsScreen"
import AppearanceSettingsScreen from "./screens/AppearanceSettingsScreen"
import PersonalizationSettingsScreen from "./screens/PersonalizationSettingsScreen"
import PrivacySettingsScreen from "./screens/PrivacySettingsScreen"
import NotificationSettingsScreen from "./screens/NotificationSettingsScreen"
import EditProfileScreen from "./screens/EditProfileScreen"

import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SettingsProvider } from "./context/SettingsContext"
import { AuthProvider } from "./context/AuthContext"
import type { RootStackParamList } from "./types/navigation"

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
        <SettingsProvider>
          <AuthProvider>
            <NavigationContainer>
              <Stack.Navigator initialRouteName="Landing" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Landing" component={Landing} />
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name="Signup" component={Signup} />
                <Stack.Screen name="HomeNavigation" component={HomeNavigation} />
                <Stack.Screen name="Dashboard" component={HomeScreen} />
                <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
                <Stack.Screen name="Drive" component={DrivingDirectionsScreen} />
                <Stack.Screen name="RouteDetails" component={RouteDetailsScreen} />
                <Stack.Screen name="EditRoute" component={EditRoute} />
                <Stack.Screen name="PackDetails" component={PackDetailsScreen} />
                <Stack.Screen name="PackMembers" component={PackMembersScreen} />
                <Stack.Screen name="PackSettings" component={PackSettingsScreen} />
                <Stack.Screen name="PackChat" component={PackChatScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
                <Stack.Screen name="AppearanceSettings" component={AppearanceSettingsScreen} />
                <Stack.Screen name="PersonalizationSettings" component={PersonalizationSettingsScreen} />
                <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
                <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
                <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </AuthProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

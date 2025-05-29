"use client"

import type React from "react"
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert, Linking, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { styles } from "../styles/SettingsScreen.styles"
import { useSettings } from "../context/SettingsContext"

interface SettingItemProps {
  title: string
  subtitle?: string
  icon: string
  onPress: () => void
  showArrow?: boolean
}

const SettingItem = ({ title, subtitle, icon, onPress, showArrow = true }: SettingItemProps) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingItemLeft}>
      <MaterialIcons name={icon as any} size={24} color="#f3631a" style={styles.settingIcon} />
      <View style={styles.settingItemContent}>
        <Text style={styles.settingItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingItemSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    {showArrow && (
      <View style={styles.settingItemRight}>
        <MaterialIcons name="chevron-right" size={24} color="#666" />
      </View>
    )}
  </TouchableOpacity>
)

const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.settingSection}>
    <Text style={styles.settingSectionTitle}>{title}</Text>
    {children}
  </View>
)

export default function SettingsScreen() {
  const navigation = useNavigation()
  const { resetSettings, isLoading } = useSettings()

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["token", "userId", "user"])
          navigation.navigate("Landing" as never)
        },
      },
    ])
  }

  const handleResetSettings = () => {
    Alert.alert("Reset Settings", "This will reset all settings to their default values. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          await resetSettings()
          Alert.alert("Settings Reset", "All settings have been reset to default values.")
        },
      },
    ])
  }

  const openURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
      } else {
        Alert.alert("Error", "Unable to open this link")
      }
    } catch (error) {
      console.error("Error opening URL:", error)
      Alert.alert("Error", "Unable to open this link")
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Settings...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity onPress={handleResetSettings} style={styles.resetButton}>
          <MaterialIcons name="refresh" size={20} color="#f3631a" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Settings Categories */}
        <SettingSection title="Settings">
          <SettingItem
            icon="account-circle"
            title="Account"
            subtitle="Security, email, password"
            onPress={() => navigation.navigate("AccountSettings" as never)}
          />
          <SettingItem
            icon="palette"
            title="Appearance"
            subtitle="Theme, font size, display"
            onPress={() => navigation.navigate("AppearanceSettings" as never)}
          />
          <SettingItem
            icon="dashboard"
            title="Personalization"
            subtitle="Dashboard, weather, units"
            onPress={() => navigation.navigate("PersonalizationSettings" as never)}
          />
          <SettingItem
            icon="privacy-tip"
            title="Privacy"
            subtitle="Profile visibility, sharing"
            onPress={() => navigation.navigate("PrivacySettings" as never)}
          />
          <SettingItem
            icon="notifications"
            title="Notifications"
            subtitle="Push, email, alerts"
            onPress={() => navigation.navigate("NotificationSettings" as never)}
          />
        </SettingSection>

        {/* Support */}
        <SettingSection title="Support">
          <SettingItem
            icon="help"
            title="Help Center"
            subtitle="Get help and support"
            onPress={() => openURL("https://packtrack.app/help")}
          />
          <SettingItem
            icon="support-agent"
            title="Contact Support"
            subtitle="Get in touch with our team"
            onPress={() => openURL("mailto:support@packtrack.app")}
          />
          <SettingItem
            icon="bug-report"
            title="Report a Bug"
            subtitle="Help us improve the app"
            onPress={() => openURL("https://packtrack.app/bug-report")}
          />
          <SettingItem
            icon="star-rate"
            title="Rate the App"
            subtitle="Leave a review in the app store"
            onPress={() => {
              const storeUrl =
                Platform.OS === "ios"
                  ? "https://apps.apple.com/app/packtrack"
                  : "https://play.google.com/store/apps/details?id=com.packtrack"
              openURL(storeUrl)
            }}
          />
        </SettingSection>

        {/* About */}
        <SettingSection title="About">
          <SettingItem icon="info" title="Version" subtitle="1.0.0" onPress={() => {}} showArrow={false} />
          <SettingItem
            icon="description"
            title="Terms of Service"
            onPress={() => openURL("https://packtrack.app/terms")}
          />
          <SettingItem
            icon="privacy-tip"
            title="Privacy Policy"
            onPress={() => openURL("https://packtrack.app/privacy")}
          />
          <SettingItem
            icon="code"
            title="Open Source Licenses"
            onPress={() => openURL("https://packtrack.app/licenses")}
          />
        </SettingSection>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

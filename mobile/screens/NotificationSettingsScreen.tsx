"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  StatusBar,
  Platform,
  PermissionsAndroid,
  Linking,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import notifee, { AuthorizationStatus } from "@notifee/react-native"
import { styles } from "../styles/SettingsScreen.styles"
import { useSettings } from "../context/SettingsContext"

interface SettingItemProps {
  title: string
  subtitle?: string
  value?: string
  onPress?: () => void
  type?: "arrow" | "switch" | "value"
  switchValue?: boolean
  onSwitchChange?: (value: boolean) => void
  icon?: string
  disabled?: boolean
}

const SettingItem = ({
  title,
  subtitle,
  value,
  onPress,
  type = "arrow",
  switchValue,
  onSwitchChange,
  icon,
  disabled = false,
}: SettingItemProps) => (
  <TouchableOpacity
    style={[styles.settingItem, disabled && styles.settingItemDisabled]}
    onPress={onPress}
    disabled={type === "switch" || disabled}
  >
    <View style={styles.settingItemLeft}>
      {icon && (
        <MaterialIcons name={icon as any} size={20} color={disabled ? "#666" : "#f3631a"} style={styles.settingIcon} />
      )}
      <View style={styles.settingItemContent}>
        <Text style={[styles.settingItemTitle, disabled && styles.settingItemTitleDisabled]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingItemSubtitle, disabled && styles.settingItemSubtitleDisabled]}>{subtitle}</Text>
        )}
      </View>
    </View>
    <View style={styles.settingItemRight}>
      {type === "switch" && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: "#767577", true: "#f3631a" }}
          thumbColor={switchValue ? "#fff" : "#f4f3f4"}
          disabled={disabled}
        />
      )}
      {type === "value" && (
        <Text style={[styles.settingItemValue, disabled && styles.settingItemValueDisabled]}>{value}</Text>
      )}
      {type === "arrow" && <MaterialIcons name="chevron-right" size={24} color={disabled ? "#444" : "#666"} />}
    </View>
  </TouchableOpacity>
)

const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.settingSection}>
    <Text style={styles.settingSectionTitle}>{title}</Text>
    {children}
  </View>
)

export default function NotificationSettingsScreen() {
  const navigation = useNavigation()
  const { settings, updateSetting } = useSettings()
  const [notificationPermission, setNotificationPermission] = useState<boolean | undefined>(false)

  useEffect(() => {
    checkNotificationPermission()
  }, [])

  const checkNotificationPermission = async () => {
    try {
      const settings = await notifee.getNotificationSettings()
      const granted = settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED
      setNotificationPermission(granted)
    } catch (error) {
      console.error("Error checking notification permission:", error)
      setNotificationPermission(false)
    }
  }

  const requestNotificationPermission = async () => {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS, {
          title: "Notification Permission",
          message: "PackTrack needs notification permission to send you updates about your packs and routes.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        })
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED
        setNotificationPermission(isGranted)
        return isGranted
      } else {
        const settings = await notifee.requestPermission()
        const granted = settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED
        setNotificationPermission(granted)
        return granted
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      setNotificationPermission(false)
      return false
    }
  }

  const handlePushNotificationToggle = async (value: boolean) => {
    if (value) {
      if (!notificationPermission) {
        const granted = await requestNotificationPermission()
        if (granted) {
          await notifee.displayNotification({
            title: "Notifications enabled!",
            body: "You will now receive push alerts.",
            android: {
              channelId: 'default',
            },
          })
          await updateSetting("notifications", "push", true)
        } else {
          await updateSetting("notifications", "push", false)
        }
      } else {
        await updateSetting("notifications", "push", true)
      }
    } else {
      await updateSetting("notifications", "push", false)
    }
  }

  const openAppSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:")
    } else {
      Linking.openSettings()
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.resetButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SettingSection title="Push Notifications">
          <SettingItem
            icon="notifications"
            title="Push Notifications"
            subtitle={notificationPermission ? "Permission granted" : "Permission required"}
            type="switch"
            switchValue={settings.notifications.push}
            onSwitchChange={handlePushNotificationToggle}
          />
          {!notificationPermission && (
            <SettingItem
              icon="settings"
              title="Open App Settings"
              subtitle="Grant notification permission in settings"
              type="arrow"
              onPress={openAppSettings}
            />
          )}
        </SettingSection>

        <SettingSection title="Email Notifications">
          <SettingItem
            icon="email"
            title="Email Notifications"
            subtitle="Receive notifications via email"
            type="switch"
            switchValue={settings.notifications.email}
            onSwitchChange={(value) => updateSetting("notifications", "email", value)}
          />
        </SettingSection>

        <SettingSection title="Notification Types">
          <SettingItem
            icon="group"
            title="Pack Updates"
            subtitle="Notifications about pack activities"
            type="switch"
            switchValue={settings.notifications.packUpdates}
            onSwitchChange={(value) => updateSetting("notifications", "packUpdates", value)}
            disabled={!settings.notifications.push && !settings.notifications.email}
          />
          <SettingItem
            icon="route"
            title="Route Alerts"
            subtitle="Notifications about route changes"
            type="switch"
            switchValue={settings.notifications.routeAlerts}
            onSwitchChange={(value) => updateSetting("notifications", "routeAlerts", value)}
            disabled={!settings.notifications.push && !settings.notifications.email}
          />
          <SettingItem
            icon="warning"
            title="Weather Alerts"
            subtitle="Severe weather notifications"
            type="switch"
            switchValue={settings.notifications.weatherAlerts}
            onSwitchChange={(value) => updateSetting("notifications", "weatherAlerts", value)}
            disabled={!settings.notifications.push && !settings.notifications.email}
          />
        </SettingSection>
      </ScrollView>
    </SafeAreaView>
  )
}

"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Appearance, type ColorSchemeName } from "react-native"

export interface SettingsState {
  theme: "light" | "dark" | "system"
  notifications: {
    push: boolean
    email: boolean
    packUpdates: boolean
    routeAlerts: boolean
    weatherAlerts: boolean
  }
  dashboard: {
    rainForecast: "1" | "2" | "6" | "12" | "24"
    showHumidity: boolean
    showWind: boolean
    showPrecipitation: boolean
    temperatureUnit: "F" | "C"
    distanceUnit: "miles" | "km"
  }
  privacy: {
    profileVisibility: "public" | "friends" | "private"
    locationSharing: boolean
    activitySharing: boolean
    showOnlineStatus: boolean
  }
  security: {
    biometricLogin: boolean
    twoFactorAuth: boolean
    sessionTimeout: "15" | "30" | "60" | "never"
  }
  accessibility: {
    fontSize: "small" | "medium" | "large"
    highContrast: boolean
    reduceMotion: boolean
    voiceOver: boolean
  }
}

interface SettingsContextType {
  settings: SettingsState
  updateSetting: (section: keyof SettingsState, key: string, value: any) => Promise<void>
  resetSettings: () => Promise<void>
  isLoading: boolean
  currentTheme: ColorSchemeName
  effectiveTheme: "light" | "dark"
}

const defaultSettings: SettingsState = {
  theme: "system",
  notifications: {
    push: true,
    email: false,
    packUpdates: true,
    routeAlerts: true,
    weatherAlerts: false,
  },
  dashboard: {
    rainForecast: "24",
    showHumidity: true,
    showWind: true,
    showPrecipitation: true,
    temperatureUnit: "F",
    distanceUnit: "miles",
  },
  privacy: {
    profileVisibility: "public",
    locationSharing: true,
    activitySharing: true,
    showOnlineStatus: true,
  },
  security: {
    biometricLogin: false,
    twoFactorAuth: false,
    sessionTimeout: "30",
  },
  accessibility: {
    fontSize: "medium",
    highContrast: false,
    reduceMotion: false,
    voiceOver: false,
  },
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    // Provide fallback instead of throwing error
    console.warn("useSettings called outside of SettingsProvider, using defaults")
    return {
      settings: defaultSettings,
      updateSetting: async () => {},
      resetSettings: async () => {},
      isLoading: false,
      currentTheme: "dark" as ColorSchemeName,
      effectiveTheme: "dark" as "light" | "dark",
    }
  }
  return context
}

interface SettingsProviderProps {
  children: ReactNode
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTheme, setCurrentTheme] = useState<ColorSchemeName>(Appearance.getColorScheme())

  // Calculate effective theme based on settings and system
  const effectiveTheme: "light" | "dark" =
    settings.theme === "system" ? (currentTheme === "light" ? "light" : "dark") : settings.theme

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setCurrentTheme(colorScheme)
    })
    return () => subscription?.remove()
  }, [])

  // Load settings from AsyncStorage on app start
  useEffect(() => {
    loadSettings()
  }, [])

  // Save individual setting keys to AsyncStorage
  const saveIndividualSettings = async (newSettings: SettingsState) => {
    try {
      const settingsToSave: [string, string][] = [
        ["app_theme", newSettings.theme],
        ["notifications_push", newSettings.notifications.push.toString()],
        ["notifications_email", newSettings.notifications.email.toString()],
        ["notifications_pack_updates", newSettings.notifications.packUpdates.toString()],
        ["notifications_route_alerts", newSettings.notifications.routeAlerts.toString()],
        ["notifications_weather_alerts", newSettings.notifications.weatherAlerts.toString()],
        ["dashboard_rain_forecast", newSettings.dashboard.rainForecast],
        ["dashboard_show_humidity", newSettings.dashboard.showHumidity.toString()],
        ["dashboard_show_wind", newSettings.dashboard.showWind.toString()],
        ["dashboard_show_precipitation", newSettings.dashboard.showPrecipitation.toString()],
        ["dashboard_temperature_unit", newSettings.dashboard.temperatureUnit],
        ["dashboard_distance_unit", newSettings.dashboard.distanceUnit],
        ["privacy_profile_visibility", newSettings.privacy.profileVisibility],
        ["privacy_location_sharing", newSettings.privacy.locationSharing.toString()],
        ["privacy_activity_sharing", newSettings.privacy.activitySharing.toString()],
        ["privacy_show_online_status", newSettings.privacy.showOnlineStatus.toString()],
        ["security_biometric_login", newSettings.security.biometricLogin.toString()],
        ["security_two_factor_auth", newSettings.security.twoFactorAuth.toString()],
        ["security_session_timeout", newSettings.security.sessionTimeout],
        ["accessibility_font_size", newSettings.accessibility.fontSize],
        ["accessibility_high_contrast", newSettings.accessibility.highContrast.toString()],
        ["accessibility_reduce_motion", newSettings.accessibility.reduceMotion.toString()],
        ["accessibility_voice_over", newSettings.accessibility.voiceOver.toString()],
      ]

      await AsyncStorage.multiSet(settingsToSave)

      // Also save complete settings object as backup
      await AsyncStorage.setItem("app_settings_complete", JSON.stringify(newSettings))
    } catch (error) {
      console.error("Error saving settings:", error)
    }
  }

  const loadSettings = async () => {
    try {
      // Try to load individual settings first
      const keys = [
        "app_theme",
        "notifications_push",
        "notifications_email",
        "notifications_pack_updates",
        "notifications_route_alerts",
        "notifications_weather_alerts",
        "dashboard_rain_forecast",
        "dashboard_show_humidity",
        "dashboard_show_wind",
        "dashboard_show_precipitation",
        "dashboard_temperature_unit",
        "dashboard_distance_unit",
        "privacy_profile_visibility",
        "privacy_location_sharing",
        "privacy_activity_sharing",
        "privacy_show_online_status",
        "security_biometric_login",
        "security_two_factor_auth",
        "security_session_timeout",
        "accessibility_font_size",
        "accessibility_high_contrast",
        "accessibility_reduce_motion",
        "accessibility_voice_over",
      ]

      const values = await AsyncStorage.multiGet(keys)
      const settingsMap = new Map(values)

      // Build settings object from individual keys
      const loadedSettings: SettingsState = {
        theme: (settingsMap.get("app_theme") as any) || defaultSettings.theme,
        notifications: {
          push: settingsMap.get("notifications_push") === "true" || defaultSettings.notifications.push,
          email: settingsMap.get("notifications_email") === "true" || defaultSettings.notifications.email,
          packUpdates:
            settingsMap.get("notifications_pack_updates") === "true" || defaultSettings.notifications.packUpdates,
          routeAlerts:
            settingsMap.get("notifications_route_alerts") === "true" || defaultSettings.notifications.routeAlerts,
          weatherAlerts:
            settingsMap.get("notifications_weather_alerts") === "true" || defaultSettings.notifications.weatherAlerts,
        },
        dashboard: {
          rainForecast: (settingsMap.get("dashboard_rain_forecast") as any) || defaultSettings.dashboard.rainForecast,
          showHumidity: settingsMap.get("dashboard_show_humidity") === "true" || defaultSettings.dashboard.showHumidity,
          showWind: settingsMap.get("dashboard_show_wind") === "true" || defaultSettings.dashboard.showWind,
          showPrecipitation:
            settingsMap.get("dashboard_show_precipitation") === "true" || defaultSettings.dashboard.showPrecipitation,
          temperatureUnit:
            (settingsMap.get("dashboard_temperature_unit") as any) || defaultSettings.dashboard.temperatureUnit,
          distanceUnit: (settingsMap.get("dashboard_distance_unit") as any) || defaultSettings.dashboard.distanceUnit,
        },
        privacy: {
          profileVisibility:
            (settingsMap.get("privacy_profile_visibility") as any) || defaultSettings.privacy.profileVisibility,
          locationSharing:
            settingsMap.get("privacy_location_sharing") === "true" || defaultSettings.privacy.locationSharing,
          activitySharing:
            settingsMap.get("privacy_activity_sharing") === "true" || defaultSettings.privacy.activitySharing,
          showOnlineStatus:
            settingsMap.get("privacy_show_online_status") === "true" || defaultSettings.privacy.showOnlineStatus,
        },
        security: {
          biometricLogin:
            settingsMap.get("security_biometric_login") === "true" || defaultSettings.security.biometricLogin,
          twoFactorAuth:
            settingsMap.get("security_two_factor_auth") === "true" || defaultSettings.security.twoFactorAuth,
          sessionTimeout:
            (settingsMap.get("security_session_timeout") as any) || defaultSettings.security.sessionTimeout,
        },
        accessibility: {
          fontSize: (settingsMap.get("accessibility_font_size") as any) || defaultSettings.accessibility.fontSize,
          highContrast:
            settingsMap.get("accessibility_high_contrast") === "true" || defaultSettings.accessibility.highContrast,
          reduceMotion:
            settingsMap.get("accessibility_reduce_motion") === "true" || defaultSettings.accessibility.reduceMotion,
          voiceOver: settingsMap.get("accessibility_voice_over") === "true" || defaultSettings.accessibility.voiceOver,
        },
      }

      setSettings(loadedSettings)
    } catch (error) {
      console.error("Error loading settings:", error)
      // Fallback to complete settings object
      try {
        const savedSettings = await AsyncStorage.getItem("app_settings_complete")
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings) as Partial<SettingsState>
          const mergedSettings: SettingsState = {
            theme: parsedSettings.theme || defaultSettings.theme,
            notifications: { ...defaultSettings.notifications, ...parsedSettings.notifications },
            dashboard: { ...defaultSettings.dashboard, ...parsedSettings.dashboard },
            privacy: { ...defaultSettings.privacy, ...parsedSettings.privacy },
            security: { ...defaultSettings.security, ...parsedSettings.security },
            accessibility: { ...defaultSettings.accessibility, ...parsedSettings.accessibility },
          }
          setSettings(mergedSettings)
        }
      } catch (fallbackError) {
        console.error("Error loading fallback settings:", fallbackError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const updateSetting = async (section: keyof SettingsState, key: string, value: any) => {
    try {
      const currentSection = settings[section]
      if (typeof currentSection === "object" && currentSection !== null) {
        const newSettings = {
          ...settings,
          [section]: {
            ...currentSection,
            [key]: value,
          },
        }
        setSettings(newSettings)
        await saveIndividualSettings(newSettings)
      } else {
        // Handle top-level settings like theme
        const newSettings = {
          ...settings,
          [section]: value,
        }
        setSettings(newSettings)
        await saveIndividualSettings(newSettings)
      }
    } catch (error) {
      console.error("Error updating setting:", error)
    }
  }

  const resetSettings = async () => {
    try {
      // Clear all individual setting keys
      const keys = [
        "app_theme",
        "notifications_push",
        "notifications_email",
        "notifications_pack_updates",
        "notifications_route_alerts",
        "notifications_weather_alerts",
        "dashboard_rain_forecast",
        "dashboard_show_humidity",
        "dashboard_show_wind",
        "dashboard_show_precipitation",
        "dashboard_temperature_unit",
        "dashboard_distance_unit",
        "privacy_profile_visibility",
        "privacy_location_sharing",
        "privacy_activity_sharing",
        "privacy_show_online_status",
        "security_biometric_login",
        "security_two_factor_auth",
        "security_session_timeout",
        "accessibility_font_size",
        "accessibility_high_contrast",
        "accessibility_reduce_motion",
        "accessibility_voice_over",
        "app_settings_complete",
      ]

      await AsyncStorage.multiRemove(keys)
      setSettings(defaultSettings)
      await saveIndividualSettings(defaultSettings)
    } catch (error) {
      console.error("Error resetting settings:", error)
    }
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        resetSettings,
        isLoading,
        currentTheme,
        effectiveTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

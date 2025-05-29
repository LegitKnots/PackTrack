"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, TouchableOpacity, ScrollView, Switch, StatusBar } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
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
}: SettingItemProps) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={type === "switch"}>
    <View style={styles.settingItemLeft}>
      {icon && <MaterialIcons name={icon as any} size={20} color="#f3631a" style={styles.settingIcon} />}
      <View style={styles.settingItemContent}>
        <Text style={styles.settingItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingItemSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    <View style={styles.settingItemRight}>
      {type === "switch" && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: "#767577", true: "#f3631a" }}
          thumbColor={switchValue ? "#fff" : "#f4f3f4"}
        />
      )}
      {type === "value" && <Text style={styles.settingItemValue}>{value}</Text>}
      {type === "arrow" && <MaterialIcons name="chevron-right" size={24} color="#666" />}
    </View>
  </TouchableOpacity>
)

const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.settingSection}>
    <Text style={styles.settingSectionTitle}>{title}</Text>
    {children}
  </View>
)

export default function PersonalizationSettingsScreen() {
  const navigation = useNavigation()
  const { settings, updateSetting } = useSettings()
  const [activeSection, setActiveSection] = useState<string | null>(null)

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Personalization</Text>
        <View style={styles.resetButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Weather */}
        <SettingSection title="Weather">
          <SettingItem
            icon="schedule"
            title="Rain Forecast Period"
            subtitle="Show precipitation chance for next"
            value={`${settings.dashboard.rainForecast} hour${settings.dashboard.rainForecast !== "1" ? "s" : ""}`}
            type="value"
            onPress={() => setActiveSection("rainForecast")}
          />
          <SettingItem
            icon="water-drop"
            title="Show Humidity"
            subtitle="Display humidity in weather section"
            type="switch"
            switchValue={settings.dashboard.showHumidity}
            onSwitchChange={(value) => updateSetting("dashboard", "showHumidity", value)}
          />
          <SettingItem
            icon="air"
            title="Show Wind Speed"
            subtitle="Display wind speed in weather section"
            type="switch"
            switchValue={settings.dashboard.showWind}
            onSwitchChange={(value) => updateSetting("dashboard", "showWind", value)}
          />
          <SettingItem
            icon="grain"
            title="Show Precipitation"
            subtitle="Display precipitation chance in weather"
            type="switch"
            switchValue={settings.dashboard.showPrecipitation}
            onSwitchChange={(value) => updateSetting("dashboard", "showPrecipitation", value)}
          />
        </SettingSection>

        {/* Units */}
        <SettingSection title="Units">
          <SettingItem
            icon="thermostat"
            title="Temperature Unit"
            subtitle="Display temperature in"
            value={`°${settings.dashboard.temperatureUnit}`}
            type="value"
            onPress={() => setActiveSection("temperatureUnit")}
          />
          <SettingItem
            icon="straighten"
            title="Distance Unit"
            subtitle="Display distances in"
            value={settings.dashboard.distanceUnit}
            type="value"
            onPress={() => setActiveSection("distanceUnit")}
          />
        </SettingSection>
      </ScrollView>

      {/* Rain Forecast Modal */}
      {activeSection === "rainForecast" && (
        <View style={styles.selectionModal}>
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionTitle}>Rain Forecast Period</Text>
            <TouchableOpacity onPress={() => setActiveSection(null)}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {["1", "2", "6", "12", "24"].map((period) => (
            <TouchableOpacity
              key={period}
              style={styles.selectionOption}
              onPress={() => {
                updateSetting("dashboard", "rainForecast", period)
                setActiveSection(null)
              }}
            >
              <Text style={styles.selectionOptionText}>
                {period} hour{period !== "1" ? "s" : ""}
              </Text>
              {settings.dashboard.rainForecast === period && <MaterialIcons name="check" size={20} color="#f3631a" />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Temperature Unit Modal */}
      {activeSection === "temperatureUnit" && (
        <View style={styles.selectionModal}>
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionTitle}>Temperature Unit</Text>
            <TouchableOpacity onPress={() => setActiveSection(null)}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {[
            { value: "F", label: "°F", description: "Fahrenheit" },
            { value: "C", label: "°C", description: "Celsius" },
          ].map((unit) => (
            <TouchableOpacity
              key={unit.value}
              style={styles.selectionOption}
              onPress={() => {
                updateSetting("dashboard", "temperatureUnit", unit.value)
                setActiveSection(null)
              }}
            >
              <View>
                <Text style={styles.selectionOptionText}>{unit.label}</Text>
                <Text style={styles.selectionOptionDescription}>{unit.description}</Text>
              </View>
              {settings.dashboard.temperatureUnit === unit.value && (
                <MaterialIcons name="check" size={20} color="#f3631a" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Distance Unit Modal */}
      {activeSection === "distanceUnit" && (
        <View style={styles.selectionModal}>
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionTitle}>Distance Unit</Text>
            <TouchableOpacity onPress={() => setActiveSection(null)}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {[
            { value: "miles", label: "Miles", description: "Imperial system" },
            { value: "km", label: "Kilometers", description: "Metric system" },
          ].map((unit) => (
            <TouchableOpacity
              key={unit.value}
              style={styles.selectionOption}
              onPress={() => {
                updateSetting("dashboard", "distanceUnit", unit.value)
                setActiveSection(null)
              }}
            >
              <View>
                <Text style={styles.selectionOptionText}>{unit.label}</Text>
                <Text style={styles.selectionOptionDescription}>{unit.description}</Text>
              </View>
              {settings.dashboard.distanceUnit === unit.value && (
                <MaterialIcons name="check" size={20} color="#f3631a" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  )
}

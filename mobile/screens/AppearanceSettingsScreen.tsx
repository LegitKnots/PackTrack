"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, TouchableOpacity, ScrollView, Switch } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import { styles } from "../styles/SettingsScreen.styles"
import { useSettings } from "../context/SettingsContext"
import Header from "../components/Header"

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

export default function AppearanceSettingsScreen() {
  const navigation = useNavigation()
  const { settings, updateSetting, effectiveTheme } = useSettings()
  const [activeSection, setActiveSection] = useState<string | null>(null)

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Header title="Appearance" onBackPress={() => navigation.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Theme */}
        <SettingSection title="Theme">
          <SettingItem
            icon="palette"
            title="App Theme"
            subtitle={`Currently using ${effectiveTheme} theme`}
            value={settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1)}
            type="value"
            onPress={() => setActiveSection("theme")}
          />
        </SettingSection>

        {/* Text & Display */}
        <SettingSection title="Text & Display">
          <SettingItem
            icon="text-fields"
            title="Font Size"
            subtitle="Affects text size throughout the app"
            value={settings.accessibility.fontSize.charAt(0).toUpperCase() + settings.accessibility.fontSize.slice(1)}
            type="value"
            onPress={() => setActiveSection("fontSize")}
          />
          <SettingItem
            icon="contrast"
            title="High Contrast"
            subtitle="Improves text readability"
            type="switch"
            switchValue={settings.accessibility.highContrast}
            onSwitchChange={(value) => updateSetting("accessibility", "highContrast", value)}
          />
          <SettingItem
            icon="motion-photos-off"
            title="Reduce Motion"
            subtitle="Minimize animations and transitions"
            type="switch"
            switchValue={settings.accessibility.reduceMotion}
            onSwitchChange={(value) => updateSetting("accessibility", "reduceMotion", value)}
          />
        </SettingSection>
      </ScrollView>

      {/* Theme Selection Modal */}
      {activeSection === "theme" && (
        <View style={styles.selectionModal}>
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionTitle}>Choose Theme</Text>
            <TouchableOpacity onPress={() => setActiveSection(null)}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {[
            { value: "light", label: "Light", description: "Light theme" },
            { value: "dark", label: "Dark", description: "Dark theme" },
            { value: "system", label: "System", description: "Follow system setting" },
          ].map((theme) => (
            <TouchableOpacity
              key={theme.value}
              style={styles.selectionOption}
              onPress={() => {
                updateSetting("theme", "theme", theme.value)
                setActiveSection(null)
              }}
            >
              <View>
                <Text style={styles.selectionOptionText}>{theme.label}</Text>
                <Text style={styles.selectionOptionDescription}>{theme.description}</Text>
              </View>
              {settings.theme === theme.value && <MaterialIcons name="check" size={20} color="#f3631a" />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Font Size Selection Modal */}
      {activeSection === "fontSize" && (
        <View style={styles.selectionModal}>
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionTitle}>Font Size</Text>
            <TouchableOpacity onPress={() => setActiveSection(null)}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {[
            { value: "small", label: "Small", description: "Compact text" },
            { value: "medium", label: "Medium", description: "Default size" },
            { value: "large", label: "Large", description: "Easier to read" },
          ].map((size) => (
            <TouchableOpacity
              key={size.value}
              style={styles.selectionOption}
              onPress={() => {
                updateSetting("accessibility", "fontSize", size.value)
                setActiveSection(null)
              }}
            >
              <View>
                <Text style={styles.selectionOptionText}>{size.label}</Text>
                <Text style={styles.selectionOptionDescription}>{size.description}</Text>
              </View>
              {settings.accessibility.fontSize === size.value && (
                <MaterialIcons name="check" size={20} color="#f3631a" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  )
}

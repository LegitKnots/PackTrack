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

export default function PrivacySettingsScreen() {
  const navigation = useNavigation()
  const { settings, updateSetting } = useSettings()
  const [activeSection, setActiveSection] = useState<string | null>(null)

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Header title="Privacy" onBackPress={() => navigation.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <SettingSection title="Profile">
          <SettingItem
            icon="visibility"
            title="Profile Visibility"
            subtitle="Who can see your profile"
            value={
              settings.privacy.profileVisibility.charAt(0).toUpperCase() + settings.privacy.profileVisibility.slice(1)
            }
            type="value"
            onPress={() => setActiveSection("profileVisibility")}
          />
        </SettingSection>

        {/* Sharing */}
        <SettingSection title="Sharing">
          <SettingItem
            icon="location-on"
            title="Location Sharing"
            subtitle="Share your location with pack members"
            type="switch"
            switchValue={settings.privacy.locationSharing}
            onSwitchChange={(value) => updateSetting("privacy", "locationSharing", value)}
          />
          <SettingItem
            icon="share"
            title="Activity Sharing"
            subtitle="Share your activities publicly"
            type="switch"
            switchValue={settings.privacy.activitySharing}
            onSwitchChange={(value) => updateSetting("privacy", "activitySharing", value)}
          />
          <SettingItem
            icon="circle"
            title="Show Online Status"
            subtitle="Let others see when you're online"
            type="switch"
            switchValue={settings.privacy.showOnlineStatus}
            onSwitchChange={(value) => updateSetting("privacy", "showOnlineStatus", value)}
          />
        </SettingSection>
      </ScrollView>

      {/* Profile Visibility Modal */}
      {activeSection === "profileVisibility" && (
        <View style={styles.selectionModal}>
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionTitle}>Profile Visibility</Text>
            <TouchableOpacity onPress={() => setActiveSection(null)}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {[
            { value: "public", label: "Public", description: "Anyone can see your profile" },
            { value: "friends", label: "Friends", description: "Only pack members can see" },
            { value: "private", label: "Private", description: "Only you can see your profile" },
          ].map((visibility) => (
            <TouchableOpacity
              key={visibility.value}
              style={styles.selectionOption}
              onPress={() => {
                updateSetting("privacy", "profileVisibility", visibility.value)
                setActiveSection(null)
              }}
            >
              <View>
                <Text style={styles.selectionOptionText}>{visibility.label}</Text>
                <Text style={styles.selectionOptionDescription}>{visibility.description}</Text>
              </View>
              {settings.privacy.profileVisibility === visibility.value && (
                <MaterialIcons name="check" size={20} color="#f3631a" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  )
}

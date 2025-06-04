"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert } from "react-native"
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

export default function AccountSettingsScreen() {
  const navigation = useNavigation()
  const { settings, updateSetting } = useSettings()
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const handleDeleteAccount = () => {
    Alert.alert("Delete Account", "This action cannot be undone. All your data will be permanently deleted.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete Account",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Final Confirmation",
            "Are you absolutely sure? This will permanently delete your account and all associated data.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Yes, Delete",
                style: "destructive",
                onPress: () => {
                  // TODO: Implement account deletion API call
                  Alert.alert("Account Deletion", "Account deletion request has been submitted.")
                },
              },
            ],
          )
        },
      },
    ])
  }

  const handleExportData = () => {
    Alert.alert("Export Data", "Your data export will be prepared and sent to your email address.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Export",
        onPress: () => {
          // TODO: Implement data export API call
          Alert.alert("Export Started", "Your data export has been initiated. You'll receive an email shortly.")
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Header title="Account" onBackPress={() => navigation.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <SettingSection title="Profile">
          <SettingItem
            icon="edit"
            title="Edit Profile"
            subtitle="Update your profile information"
            type="arrow"
            onPress={() => navigation.navigate("EditProfile" as never)}
          />
          <SettingItem
            icon="email"
            title="Change Email"
            subtitle="Update your email address"
            type="arrow"
            onPress={() => Alert.alert("Change Email", "This feature will be available in a future update.")}
          />
        </SettingSection>

        {/* Security */}
        <SettingSection title="Security">
          <SettingItem
            icon="security"
            title="Two-Factor Authentication"
            subtitle="Add an extra layer of security"
            type="switch"
            switchValue={settings.security.twoFactorAuth}
            onSwitchChange={(value) => updateSetting("security", "twoFactorAuth", value)}
          />
          <SettingItem
            icon="timer"
            title="Session Timeout"
            subtitle="Auto-logout after inactivity"
            value={settings.security.sessionTimeout === "never" ? "Never" : `${settings.security.sessionTimeout} min`}
            type="value"
            onPress={() => setActiveSection("sessionTimeout")}
          />
          <SettingItem
            icon="lock"
            title="Change Password"
            subtitle="Update your account password"
            type="arrow"
            onPress={() => Alert.alert("Change Password", "This feature will be available in a future update.")}
          />
        </SettingSection>

        {/* Data */}
        <SettingSection title="Data">
          <SettingItem
            icon="download"
            title="Export Data"
            subtitle="Download your account data"
            type="arrow"
            onPress={handleExportData}
          />
          <SettingItem
            icon="pause-circle"
            title="Deactivate Account"
            subtitle="Temporarily disable your account"
            type="arrow"
            onPress={() => Alert.alert("Deactivate Account", "This feature will be available in a future update.")}
          />
          <SettingItem
            icon="delete-forever"
            title="Delete Account"
            subtitle="Permanently delete your account"
            type="arrow"
            onPress={handleDeleteAccount}
          />
        </SettingSection>
      </ScrollView>

      {/* Session Timeout Modal */}
      {activeSection === "sessionTimeout" && (
        <View style={styles.selectionModal}>
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionTitle}>Session Timeout</Text>
            <TouchableOpacity onPress={() => setActiveSection(null)}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {[
            { value: "15", label: "15 minutes", description: "High security" },
            { value: "30", label: "30 minutes", description: "Recommended" },
            { value: "60", label: "1 hour", description: "Balanced" },
            { value: "never", label: "Never", description: "Stay logged in" },
          ].map((timeout) => (
            <TouchableOpacity
              key={timeout.value}
              style={styles.selectionOption}
              onPress={() => {
                updateSetting("security", "sessionTimeout", timeout.value)
                setActiveSection(null)
              }}
            >
              <View>
                <Text style={styles.selectionOptionText}>{timeout.label}</Text>
                <Text style={styles.selectionOptionDescription}>{timeout.description}</Text>
              </View>
              {settings.security.sessionTimeout === timeout.value && (
                <MaterialIcons name="check" size={20} color="#f3631a" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  )
}

"use client"

import { useEffect, useState } from "react"
import { View, Text, Dimensions, ActivityIndicator, TouchableOpacity, Image, ScrollView } from "react-native"
import { launchImageLibrary, type ImagePickerResponse, type MediaType } from "react-native-image-picker"
import { styles } from "../styles/ProfileScreen.styles"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { SERVER_URI } from "../config"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"

const { width } = Dimensions.get("window")

interface CustomModalProps {
  visible: boolean
  title: string
  message: string
  buttons: Array<{
    text: string
    onPress: () => void
    style?: "default" | "cancel" | "destructive"
  }>
  onClose: () => void
}

const CustomModal = ({ visible, title, message, buttons, onClose }: CustomModalProps) => {
  if (!visible) return null

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={styles.modalMessage}>{message}</Text>
        <View style={styles.modalButtons}>
          {buttons.map((button, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.modalButton,
                button.style === "cancel" && styles.modalButtonCancel,
                button.style === "destructive" && styles.modalButtonDestructive,
              ]}
              onPress={button.onPress}
            >
              <Text
                style={[
                  styles.modalButtonText,
                  button.style === "cancel" && styles.modalButtonTextCancel,
                  button.style === "destructive" && styles.modalButtonTextDestructive,
                ]}
              >
                {button.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  )
}

export default function ProfileScreen() {
  const navigation = useNavigation()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    buttons: [] as Array<{
      text: string
      onPress: () => void
      style?: "default" | "cancel" | "destructive"
    }>,
  })

  const showCustomModal = (title: string, message: string, buttons: typeof modalConfig.buttons) => {
    setModalConfig({ title, message, buttons })
    setShowModal(true)
  }

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token")
      const userId = await AsyncStorage.getItem("userId")

      if (!token || !userId) {
        setError("You are not logged in.")
        return
      }

      const res = await fetch(`${SERVER_URI}/api/users/${userId}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        throw new Error(text)
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch user data")
      }

      setUserData(data.user)
    } catch (err: any) {
      console.error("Profile error:", err.message)
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const updateProfilePicture = async () => {
    const options = {
      mediaType: "photo" as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    }

    launchImageLibrary(options, async (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return
      }

      if (response.assets && response.assets[0]) {
        try {
          setUploading(true)
          const token = await AsyncStorage.getItem("token")
          const userId = await AsyncStorage.getItem("userId")

          if (!token || !userId) {
            showCustomModal("Error", "You are not logged in.", [{ text: "OK", onPress: () => setShowModal(false) }])
            return
          }

          const formData = new FormData()
          formData.append("profilePicture", {
            uri: response.assets[0].uri,
            type: "image/jpeg",
            name: "profile.jpg",
          } as any)

          const uploadResponse = await fetch(`${SERVER_URI}/api/users/${userId}/profile-picture`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
            body: formData,
          })

          const uploadData = await uploadResponse.json()

          if (!uploadResponse.ok) {
            throw new Error(uploadData.message || "Upload failed")
          }

          setUserData((prev: any) => ({
            ...prev,
            profilePicUrl: uploadData.profilePicUrl,
          }))

          showCustomModal("Success", "Profile picture updated!", [{ text: "OK", onPress: () => setShowModal(false) }])
        } catch (error: any) {
          console.error("Profile picture upload error:", error)
          showCustomModal("Upload Error", error.message || "Failed to upload profile picture", [
            { text: "OK", onPress: () => setShowModal(false) },
          ])
        } finally {
          setUploading(false)
        }
      }
    })
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#f3631a" size="large" />
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    )
  }

  const profileImageUri = userData.profilePicUrl || null

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {userData.username ? userData.username.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.username}>@{userData.username || "User"}</Text>
          <Text style={styles.bio}>{userData.bio || "No bio yet."}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("EditProfile" as never)}>
              <MaterialIcons name="edit" size={16} color="#fff" />
              <Text style={styles.editText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate("Settings" as never)}>
              <MaterialIcons name="settings" size={16} color="#f3631a" />
              <Text style={styles.settingsText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <MaterialIcons name="person" size={20} color="#f3631a" />
            <Text style={styles.infoItem}>
              <Text style={styles.label}>Name:</Text> {userData.fullname}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <MaterialIcons name="motorcycle" size={20} color="#f3631a" />
            <Text style={styles.infoItem}>
              <Text style={styles.label}>Bike:</Text> {userData.bike || "N/A"}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <MaterialIcons name="location-on" size={20} color="#f3631a" />
            <Text style={styles.infoItem}>
              <Text style={styles.label}>Location:</Text> {userData.location || "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.statsSectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialIcons name="group" size={24} color="#f3631a" />
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Packs Joined</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="route" size={24} color="#f3631a" />
              <Text style={styles.statNumber}>847</Text>
              <Text style={styles.statLabel}>Miles Ridden</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="emoji-events" size={24} color="#f3631a" />
              <Text style={styles.statNumber}>23</Text>
              <Text style={styles.statLabel}>Achievements</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="star" size={24} color="#f3631a" />
              <Text style={styles.statNumber}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <CustomModal
        visible={showModal}
        title={modalConfig.title}
        message={modalConfig.message}
        buttons={modalConfig.buttons}
        onClose={() => setShowModal(false)}
      />
    </SafeAreaView>
  )
}

"use client"

import { useEffect, useState } from "react"
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator } from "react-native"
import { launchImageLibrary, type ImagePickerResponse } from "react-native-image-picker"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import { styles } from "../styles/EditProfileScreen.styles"
import { SERVER_URI } from "../config"
import Header from "../components/Header"

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

export default function EditProfileScreen() {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
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

  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    bio: "",
    bike: "",
    location: "",
    profilePicture: null as any,
    profilePicUrl: "",
  })

  const showCustomModal = (title: string, message: string, buttons: typeof modalConfig.buttons) => {
    setModalConfig({ title, message, buttons })
    setShowModal(true)
  }

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token")
      const userId = await AsyncStorage.getItem("userId")

      const res = await fetch(`${SERVER_URI}/api/users/${userId}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const text = await res.text()
      const data = JSON.parse(text)
      if (!res.ok) throw new Error(data.message)

      const user = data.user
      setFormData({
        fullname: user.fullname || "",
        username: user.username || "",
        bio: user.bio || "",
        bike: user.bike || "",
        location: user.location || "",
        profilePicture: null,
        profilePicUrl: user.profilePicUrl || "",
      })
    } catch (err: any) {
      console.error("Profile fetch error:", err.message)
      showCustomModal("Error", err.message || "Failed to load profile", [
        {
          text: "OK",
          onPress: () => {
            setShowModal(false)
            navigation.goBack()
          },
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const selectProfilePicture = () => {
    launchImageLibrary({ mediaType: "photo" }, (response: ImagePickerResponse) => {
      if (response.assets?.[0]) {
        setFormData((prev) => ({
          ...prev,
          profilePicture: response.assets![0],
          profilePicUrl: "",
        }))
      }
    })
  }

  const uploadProfilePicture = async (): Promise<string | null> => {
    if (!formData.profilePicture?.uri) return null
    try {
      setUploading(true)
      const token = await AsyncStorage.getItem("token")
      const userId = await AsyncStorage.getItem("userId")

      const imageData = new FormData()
      imageData.append("profilePicture", {
        uri: formData.profilePicture.uri,
        type: "image/jpeg",
        name: "profile.jpg",
      } as any)

      const res = await fetch(`${SERVER_URI}/api/users/${userId}/profile-picture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: imageData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      return data.profilePicUrl
    } catch (err) {
      console.error("Upload error", err)
      return null
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async () => {
    if (!formData.fullname || !formData.username) {
      showCustomModal("Validation Error", "Full name and username are required.", [
        { text: "OK", onPress: () => setShowModal(false) },
      ])
      return
    }

    try {
      setSaving(true)
      const token = await AsyncStorage.getItem("token")
      const userId = await AsyncStorage.getItem("userId")

      let profilePicUrl = formData.profilePicUrl
      if (formData.profilePicture?.uri) {
        const uploaded = await uploadProfilePicture()
        if (!uploaded) return
        profilePicUrl = uploaded
      }

      const res = await fetch(`${SERVER_URI}/api/users/${userId}/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullname: formData.fullname,
          username: formData.username,
          bio: formData.bio,
          bike: formData.bike,
          location: formData.location,
          ...(profilePicUrl && { profilePicUrl }),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      showCustomModal("Success", "Profile updated successfully!", [
        {
          text: "OK",
          onPress: () => {
            setShowModal(false)
            navigation.goBack()
          },
        },
      ])
    } catch (err: any) {
      console.error("Save error:", err)
      showCustomModal("Error", err.message || "Failed to update profile", [
        { text: "OK", onPress: () => setShowModal(false) },
      ])
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const profileImageUri = formData.profilePicUrl || null

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Header title="Edit Profile" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f3631a" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Header title="Edit Profile" onBackPress={() => navigation.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profilePictureSection}>
          <TouchableOpacity onPress={selectProfilePicture} disabled={uploading}>
            <View style={styles.avatarContainer}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialIcons name="person" size={40} color="#666" />
                </View>
              )}
              <View style={styles.editAvatarButton}>
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name="camera-alt" size={16} color="#fff" />
                )}
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </View>

        <View style={styles.formSection}>
          {["fullname", "username", "bio", "bike", "location"].map((field) => (
            <View style={styles.inputGroup} key={field}>
              <Text style={styles.label}>
                {field.charAt(0).toUpperCase() + field.slice(1)}
                {(field === "fullname" || field === "username") && <Text style={styles.required}>*</Text>}
              </Text>
              <TextInput
                style={[styles.input, field === "bio" && styles.bioInput]}
                value={(formData as any)[field]}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, [field]: text }))}
                placeholder={`Enter your ${field}`}
                placeholderTextColor="#666"
                multiline={field === "bio"}
                numberOfLines={field === "bio" ? 3 : 1}
                textAlignVertical={field === "bio" ? "top" : "center"}
                autoCapitalize="none"
              />
            </View>
          ))}
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={saveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="save" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
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

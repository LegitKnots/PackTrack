"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ScrollView,
} from "react-native"
import { launchImageLibrary, type ImagePickerResponse, type MediaType } from "react-native-image-picker"
import { styles } from "../styles/CreateProfile.styles"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../types/navigation"
import { SERVER_URI } from "../config"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"

type Props = NativeStackScreenProps<RootStackParamList, "CompleteProfile">

export default function CompleteProfile({ route, navigation }: Props) {
  const { userId, token } = route.params

  const [form, setForm] = useState({
    username: "",
    bike: "",
    location: "",
    bio: "",
  })

  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const selectImage = () => {
    const options = {
      mediaType: "photo" as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    }

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return
      }

      if (response.assets && response.assets[0]) {
        setProfileImage(response.assets[0].uri || null)
      }
    })
  }

  const uploadProfilePicture = async (): Promise<string | null> => {
    if (!profileImage) return null

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("profilePicture", {
        uri: profileImage,
        type: "image/jpeg",
        name: "profile.jpg",
      } as any)

      const response = await fetch(`${SERVER_URI}/api/users/${userId}/profile-picture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Upload failed")
      }

      return data.profilePicUrl
    } catch (error: any) {
      console.error("Profile picture upload error:", error)
      Alert.alert("Upload Error", error.message || "Failed to upload profile picture")
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.username || !form.bike) {
      Alert.alert("Please add at least your username and bike")
      return
    }

    try {
      // Upload profile picture first if selected
      let profilePicUrl = null
      if (profileImage) {
        profilePicUrl = await uploadProfilePicture()
        if (!profilePicUrl) {
          return // Upload failed, don't continue
        }
      }

      // Update profile with form data
      const profileData = {
        ...form,
        ...(profilePicUrl && { profilePicUrl }),
      }

      const res = await fetch(`${SERVER_URI}/api/users/${userId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      })

      const data = await res.json()

      if (!res.ok) {
        Alert.alert("Update failed", data.message || "Unknown error")
        return
      }

      Alert.alert("Success", "Profile updated!")
      navigation.navigate("HomeNavigation")
    } catch (err) {
      console.error("Profile update error:", err)
      Alert.alert("Error", "Something went wrong")
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Set Up A Profile</Text>

        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <TouchableOpacity style={styles.profilePictureContainer} onPress={selectImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profilePicture} />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <MaterialIcons name="add-a-photo" size={40} color="#aaa" />
                <Text style={styles.profilePictureText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          {profileImage && (
            <TouchableOpacity style={styles.changePhotoButton} onPress={selectImage}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#aaa"
          value={form.username}
          onChangeText={(text) => handleChange("username", text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Bike"
          placeholderTextColor="#aaa"
          value={form.bike}
          onChangeText={(text) => handleChange("bike", text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Bio (Optional)"
          placeholderTextColor="#aaa"
          value={form.bio}
          multiline
          numberOfLines={3}
          onChangeText={(text) => handleChange("bio", text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Location (Optional)"
          placeholderTextColor="#aaa"
          value={form.location}
          onChangeText={(text) => handleChange("location", text)}
        />

        <TouchableOpacity
          style={[styles.button, uploading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>{uploading ? "Uploading..." : "Save & Continue"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

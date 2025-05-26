"use client"

import { useEffect, useState } from "react"
import { View, Text, Dimensions, ActivityIndicator, TouchableOpacity, Image, Alert } from "react-native"
import { launchImageLibrary, type ImagePickerResponse, type MediaType } from "react-native-image-picker"
import { styles } from "../styles/ProfileScreen.styles"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { SERVER_URI } from "../config"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"

const { width } = Dimensions.get("window")

export default function ProfileScreen() {
  const navigation = useNavigation()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

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
            Alert.alert("Error", "You are not logged in.")
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

          // Update local state with new profile picture
          setUserData((prev: any) => ({
            ...prev,
            profilePicUrl: uploadData.profilePicUrl,
          }))

          Alert.alert("Success", "Profile picture updated!")
        } catch (error: any) {
          console.error("Profile picture upload error:", error)
          Alert.alert("Upload Error", error.message || "Failed to upload profile picture")
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

  const profileImageUri = userData.profilePicUrl ? `${SERVER_URI}${userData.profilePicUrl}` : null

  return (
    <SafeAreaView style={styles.container}>
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
          <TouchableOpacity style={styles.editAvatarButton} onPress={updateProfilePicture} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="edit" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.username}>@{userData.username || "User"}</Text>
        <Text style={styles.bio}>{userData.bio || "No bio yet."}</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("CompleteProfile" as never)}>
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoItem}>
          <Text style={styles.label}>Name:</Text> {userData.fullname}
        </Text>
        <Text style={styles.infoItem}>
          <Text style={styles.label}>Bike:</Text> {userData.bike || "N/A"}
        </Text>
        <Text style={styles.infoItem}>
          <Text style={styles.label}>Location:</Text> {userData.location || "N/A"}
        </Text>
      </View>
    </SafeAreaView>
  )
}

"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { ChevronLeft, Camera, X, Plus } from "lucide-react-native"
import { launchImageLibrary } from "react-native-image-picker"
import { SERVER_URI, PRIMARY_APP_COLOR } from "../config"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../types/navigation"
import { useSafeAreaInsets } from "react-native-safe-area-context"

type PackSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "PackSettings">
type PackSettingsScreenRouteProp = RouteProp<RootStackParamList, "PackSettings">

export default function PackSettingsScreen() {
  const navigation = useNavigation<PackSettingsScreenNavigationProp>()
  const route = useRoute<PackSettingsScreenRouteProp>()
  const { pack } = route.params
  const insets = useSafeAreaInsets()

  const [name, setName] = useState(pack.name)
  const [description, setDescription] = useState(pack.description || "")
  const [visibility, setVisibility] = useState<"private" | "public">(pack.visibility)
  const [hasChat, setHasChat] = useState(pack.options?.hasChat || false)
  const [tags, setTags] = useState<string[]>(pack.tags || [])
  const [currentTag, setCurrentTag] = useState("")
  const [image, setImage] = useState<{ uri: string; type: string; name: string } | null>(
    pack.imageUrl ? { uri: pack.imageUrl, type: "image/jpeg", name: "pack-image.jpg" } : null,
  )
  const [loading, setLoading] = useState(false)

  const popularTags = [
    "Cycling",
    "Mountain Biking",
    "Road Biking",
    "Gravel",
    "Racing",
    "Casual",
    "Training",
    "Commuting",
    "Weekend",
    "Local",
  ]

  const selectImage = async () => {
    const result = await launchImageLibrary({
      mediaType: "photo",
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    })

    if (result.assets && result.assets.length > 0) {
      const selectedAsset = result.assets[0]
      if (selectedAsset.uri && selectedAsset.type) {
        setImage({
          uri: selectedAsset.uri,
          type: selectedAsset.type,
          name: selectedAsset.fileName || `image-${Date.now()}.jpg`,
        })
      }
    }
  }

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()])
      setCurrentTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const addPopularTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag])
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Pack name is required")
      return
    }

    setLoading(true)

    try {
      const token = await AsyncStorage.getItem("token")
      if (!token) {
        Alert.alert("Error", "You need to be logged in")
        return
      }

      // Create form data for image upload
      const formData = new FormData()
      formData.append("name", name)
      formData.append("description", description)
      formData.append("visibility", visibility)
      formData.append("options", JSON.stringify({ hasChat }))

      if (visibility === "public" && tags.length > 0) {
        formData.append("tags", JSON.stringify(tags))
      }

      if (image && image.uri !== pack.imageUrl) {
        formData.append("image", {
          uri: image.uri,
          type: image.type,
          name: image.name,
        } as any)
      }

      const res = await fetch(`${SERVER_URI}/api/packs/${pack.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to update pack")
      }

      Alert.alert("Success", "Pack updated successfully")
      navigation.goBack()
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Status bar background fill */}
      <View style={[styles.statusBarFill, { height: insets.top }]} />

      {/* Header positioned right under dynamic island */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Pack</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.imageSelector} onPress={selectImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.selectedImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Camera color="#aaa" size={40} />
              <Text style={styles.imagePlaceholderText}>Add Pack Image</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Pack Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter pack name"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your pack"
          placeholderTextColor="#aaa"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Visibility</Text>
        <View style={styles.visibilitySelector}>
          <TouchableOpacity
            style={[styles.visibilityOption, visibility === "private" && styles.visibilityOptionSelected]}
            onPress={() => setVisibility("private")}
          >
            <Text style={[styles.visibilityText, visibility === "private" && styles.visibilityTextSelected]}>
              Private
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.visibilityOption, visibility === "public" && styles.visibilityOptionSelected]}
            onPress={() => setVisibility("public")}
          >
            <Text style={[styles.visibilityText, visibility === "public" && styles.visibilityTextSelected]}>
              Public
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Enable Chat</Text>
          <Switch
            value={hasChat}
            onValueChange={setHasChat}
            trackColor={{ false: "#444", true: PRIMARY_APP_COLOR }}
            thumbColor="white"
          />
        </View>

        {visibility === "public" && (
          <View style={styles.tagsSection}>
            <Text style={styles.label}>Tags (for public packs)</Text>
            <Text style={styles.tagsHelper}>Add tags to help others find your pack</Text>

            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="Add a tag"
                placeholderTextColor="#aaa"
                value={currentTag}
                onChangeText={setCurrentTag}
                onSubmitEditing={addTag}
              />
              <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
                <Plus color="white" size={20} />
              </TouchableOpacity>
            </View>

            {tags.length > 0 && (
              <View style={styles.selectedTags}>
                {tags.map((tag) => (
                  <View key={tag} style={styles.tagBadge}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity style={styles.removeTagButton} onPress={() => removeTag(tag)}>
                      <X color="white" size={12} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.popularTagsLabel}>Popular Tags</Text>
            <View style={styles.popularTagsContainer}>
              {popularTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.popularTag, tags.includes(tag) && styles.popularTagSelected]}
                  onPress={() => addPopularTag(tag)}
                  disabled={tags.includes(tag)}
                >
                  <Text style={[styles.popularTagText, tags.includes(tag) && styles.popularTagTextSelected]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  statusBarFill: {
    backgroundColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1a1a1a",
    height: 60,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  imageSelector: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 24,
    overflow: "hidden",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 8,
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  label: {
    color: "white",
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#2a2a2a",
    color: "white",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  visibilitySelector: {
    flexDirection: "row",
    marginBottom: 16,
  },
  visibilityOption: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    paddingVertical: 12,
    alignItems: "center",
    marginRight: 8,
    borderRadius: 8,
  },
  visibilityOptionSelected: {
    backgroundColor: PRIMARY_APP_COLOR,
  },
  visibilityText: {
    color: "#ddd",
    fontSize: 16,
  },
  visibilityTextSelected: {
    color: "white",
    fontWeight: "500",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2a2a2a",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  toggleLabel: {
    color: "white",
    fontSize: 16,
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsHelper: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 8,
  },
  tagInputContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    color: "white",
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    fontSize: 16,
  },
  addTagButton: {
    backgroundColor: PRIMARY_APP_COLOR,
    width: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  selectedTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  tagBadge: {
    backgroundColor: "#444",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: "white",
    fontSize: 14,
    marginRight: 4,
  },
  removeTagButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  popularTagsLabel: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 8,
  },
  popularTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  popularTag: {
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  popularTagSelected: {
    backgroundColor: "#444",
    opacity: 0.6,
  },
  popularTagText: {
    color: "#ddd",
    fontSize: 14,
  },
  popularTagTextSelected: {
    color: "#aaa",
  },
  saveButton: {
    backgroundColor: PRIMARY_APP_COLOR,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})

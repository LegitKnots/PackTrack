"use client"

import { useState } from "react"
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from "react-native"
import { X, Camera, Plus } from "lucide-react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { launchImageLibrary } from "react-native-image-picker"
import { SERVER_URI, PRIMARY_APP_COLOR } from "../config"
import type { PackDetails } from "../types/Pack"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Header from "./Header"

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

interface CreatePackModalProps {
  visible: boolean
  onClose: () => void
  onCreate: (pack: PackDetails) => void
}

export default function CreatePackModal({ visible, onClose, onCreate }: CreatePackModalProps) {
  const insets = useSafeAreaInsets()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"private" | "public">("private")
  const [hasChat, setHasChat] = useState(true)
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [image, setImage] = useState<{ uri: string; type: string; name: string } | null>(null)
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

  const resetForm = () => {
    setName("")
    setDescription("")
    setVisibility("private")
    setHasChat(true)
    setTags([])
    setCurrentTag("")
    setImage(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

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

      if (image) {
        formData.append("image", {
          uri: image.uri,
          type: image.type,
          name: image.name,
        } as any)
      }

      const res = await fetch(`${SERVER_URI}/api/packs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to create pack")
      }

      onCreate(data)
      resetForm()
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

        {/* Status bar background fill */}
        <View style={[styles.statusBarFill, { height: insets.top }]} />

             <Header
               title="Create New Pack"
               showBackButton
               leftIcon="close"
               onBackPress={() => onClose()}
               />
       

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
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
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.createButtonText}>Create Pack</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  statusBarFill: {
    backgroundColor: "#1a1a1a", // Same as header background
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    backgroundColor: "#1a1a1a",
    minHeight: 70,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    right: 20,
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    backgroundColor: "#121212",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  imageSelector: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignSelf: "center",
    marginBottom: 32,
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
    fontSize: 14,
    marginTop: 8,
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  label: {
    color: "white",
    fontSize: 18,
    marginBottom: 12,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#2a2a2a",
    color: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    fontSize: 16,
    minHeight: 52,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  visibilitySelector: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 12,
  },
  visibilityOption: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 12,
    minHeight: 52,
    justifyContent: "center",
  },
  visibilityOptionSelected: {
    backgroundColor: PRIMARY_APP_COLOR,
  },
  visibilityText: {
    color: "#ddd",
    fontSize: 16,
    fontWeight: "500",
  },
  visibilityTextSelected: {
    color: "white",
    fontWeight: "600",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2a2a2a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    minHeight: 52,
  },
  toggleLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  tagsSection: {
    marginBottom: 20,
  },
  tagsHelper: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 12,
  },
  tagInputContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  tagInput: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    color: "white",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 52,
  },
  addTagButton: {
    backgroundColor: PRIMARY_APP_COLOR,
    width: 52,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    minHeight: 52,
  },
  selectedTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
    gap: 8,
  },
  tagBadge: {
    backgroundColor: "#444",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    color: "white",
    fontSize: 14,
    marginRight: 6,
  },
  removeTagButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  popularTagsLabel: {
    color: "#aaa",
    fontSize: 16,
    marginBottom: 12,
  },
  popularTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  popularTag: {
    backgroundColor: "#333",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
  createButton: {
    backgroundColor: PRIMARY_APP_COLOR,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    minHeight: 56,
    justifyContent: "center",
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
})

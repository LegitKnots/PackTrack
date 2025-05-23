import React, { useState } from "react"
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
} from "react-native"
import { X, Camera, Plus, Trash2 } from "lucide-react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { launchImageLibrary } from "react-native-image-picker"
import { SERVER_URI, PRIMARY_APP_COLOR } from "../config"
import type { PackDetails } from "../types/Pack"

interface CreatePackModalProps {
  visible: boolean
  onClose: () => void
  onCreate: (pack: PackDetails) => void
}

export default function CreatePackModal({ visible, onClose, onCreate }: CreatePackModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"private" | "public">("private")
  const [hasChat, setHasChat] = useState(true)
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [image, setImage] = useState<{ uri: string; type: string; name: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const popularTags = [
    "Cycling", "Mountain Biking", "Road Biking", "Gravel", "Racing", 
    "Casual", "Training", "Commuting", "Weekend", "Local"
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create New Pack</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X color="white" size={24} />
          </TouchableOpacity>
        </View>

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    backgroundColor: "#1a1a1a",
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    right: 16,
    padding: 4,
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
  createButton: {
    backgroundColor: PRIMARY_APP_COLOR,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 40,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})

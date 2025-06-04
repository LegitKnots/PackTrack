"use client"

import { useState, useCallback } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
  Image,
  Share,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import QRCode from "react-native-qrcode-svg"
import { styles } from "../styles/PackDetailsScreen.styles"
import { SERVER_URI } from "../config"
import type { PackDetailsRouteProp } from "../types/navigation"
import type { PackDetails, PackMember } from "../types/Pack"
import Header from "../components/Header"

export default function PackDetailsScreen() {
  const navigation = useNavigation()
  const route = useRoute<PackDetailsRouteProp>()
  const packParam = route.params?.pack || route.params?.packId

  const [pack, setPack] = useState<PackDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showCreateRouteModal, setShowCreateRouteModal] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    visibility: "private" as "public" | "private",
    hasChat: false,
    tags: [] as string[],
  })
  const [newTag, setNewTag] = useState("")
  const [isOwner, setIsOwner] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const fetchPackDetails = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem("token")
      const userId = await AsyncStorage.getItem("userId")
      setCurrentUserId(userId)

      if (!token) {
        Alert.alert("Error", "Authentication required")
        return
      }

      let packId: string
      if (typeof packParam === "string") {
        packId = packParam
      } else if (packParam && typeof packParam === "object" && "id" in packParam) {
        packId = packParam.id
      } else {
        Alert.alert("Error", "Invalid pack data")
        return
      }

      const response = await fetch(`${SERVER_URI}/api/packs/${packId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch pack details")
      }

      const packData = await response.json()
      setPack(packData)
      setIsOwner(packData.createdBy === userId)
      setEditForm({
        name: packData.name || "",
        description: packData.description || "",
        visibility: packData.visibility || "private",
        hasChat: packData.options?.hasChat || false,
        tags: packData.tags || [],
      })
    } catch (error: any) {
      console.error("Error fetching pack details:", error)
      Alert.alert("Error", error.message || "Failed to load pack details")
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchPackDetails()
    }, [packParam]),
  )

  const handleEditPack = async () => {
    if (!pack || !editForm.name.trim()) {
      Alert.alert("Error", "Pack name is required")
      return
    }

    try {
      const token = await AsyncStorage.getItem("token")
      const response = await fetch(`${SERVER_URI}/api/packs/${pack.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim(),
          visibility: editForm.visibility,
          options: { hasChat: editForm.hasChat },
          tags: editForm.tags,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update pack")
      }

      const updatedPack = await response.json()
      setPack(updatedPack)
      setShowEditModal(false)
      Alert.alert("Success", "Pack updated successfully")
    } catch (error: any) {
      console.error("Error updating pack:", error)
      Alert.alert("Error", error.message || "Failed to update pack")
    }
  }

  const handleLeavePack = () => {
    Alert.alert("Leave Pack", "Are you sure you want to leave this pack?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token")
            const response = await fetch(`${SERVER_URI}/api/packs/${pack?.id}/leave`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || "Failed to leave pack")
            }

            Alert.alert("Success", "You have left the pack")
            navigation.goBack()
          } catch (error: any) {
            console.error("Error leaving pack:", error)
            Alert.alert("Error", error.message || "Failed to leave pack")
          }
        },
      },
    ])
  }

  const handleDeletePack = () => {
    Alert.alert("Delete Pack", "Are you sure you want to delete this pack? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token")
            const response = await fetch(`${SERVER_URI}/api/packs/${pack?.id}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || "Failed to delete pack")
            }

            Alert.alert("Success", "Pack deleted successfully")
            navigation.goBack()
          } catch (error: any) {
            console.error("Error deleting pack:", error)
            Alert.alert("Error", error.message || "Failed to delete pack")
          }
        },
      },
    ])
  }

  const handleShare = async () => {
    if (!pack?.shareCode) {
      Alert.alert("Error", "Share code not available")
      return
    }

    const shareUrl = `https://packtrack.app/share?type=pack&shareCode=${pack.shareCode}`
    const message = `Join my pack "${pack.name}" on PackTrack! ${shareUrl}`

    try {
      await Share.share({
        message,
        url: shareUrl,
        title: `Join ${pack.name} on PackTrack`,
      })
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !editForm.tags.includes(newTag.trim())) {
      setEditForm((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setEditForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const renderMember = (member: PackMember) => (
    <View key={member.id} style={styles.memberItem}>
      {member.profilePicUrl ? (
        <Image source={{ uri: member.profilePicUrl }} style={styles.memberAvatar} />
      ) : (
        <View style={[styles.memberAvatar, styles.memberAvatarPlaceholder]}>
          <Text style={styles.memberAvatarText}>{member.fullname ? member.fullname.charAt(0).toUpperCase() : "?"}</Text>
        </View>
      )}
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.fullname || member.username || "Unknown"}</Text>
        {member.username && <Text style={styles.memberUsername}>@{member.username}</Text>}
      </View>
      {member.id === pack?.createdBy && (
        <View style={styles.ownerBadge}>
          <Text style={styles.ownerBadgeText}>Owner</Text>
        </View>
      )}
    </View>
  )

  const renderMenuModal = () => (
    <Modal visible={showMenuModal} transparent animationType="fade" onRequestClose={() => setShowMenuModal(false)}>
      <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowMenuModal(false)}>
        <View style={styles.menuModal}>
          {isOwner && (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenuModal(false)
                  setShowEditModal(true)
                }}
              >
                <MaterialIcons name="edit" size={20} color="#fff" />
                <Text style={styles.menuItemText}>Edit Pack</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenuModal(false)
                  navigation.navigate("PackSettings" as never, { pack })
                }}
              >
                <MaterialIcons name="settings" size={20} color="#fff" />
                <Text style={styles.menuItemText}>Pack Settings</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowMenuModal(false)
              navigation.navigate("PackMembers" as never, { pack })
            }}
          >
            <MaterialIcons name="group" size={20} color="#fff" />
            <Text style={styles.menuItemText}>View Members</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowMenuModal(false)
              setShowShareModal(true)
            }}
          >
            <MaterialIcons name="share" size={20} color="#fff" />
            <Text style={styles.menuItemText}>Share Pack</Text>
          </TouchableOpacity>
          {!isOwner && (
            <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={handleLeavePack}>
              <MaterialIcons name="exit-to-app" size={20} color="#ff4444" />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Leave Pack</Text>
            </TouchableOpacity>
          )}
          {isOwner && (
            <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={handleDeletePack}>
              <MaterialIcons name="delete" size={20} color="#ff4444" />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete Pack</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Header title="Pack Details" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f3631a" />
          <Text style={styles.loadingText}>Loading pack details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!pack) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Header title="Pack Details" onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Pack not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Header
        title={pack.name || "Pack Details"}
        onBackPress={() => navigation.goBack()}
        rightIcon="menu"
        onRightPress={() => setShowMenuModal(true)}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pack Header */}
        <View style={styles.packHeader}>
          {pack.imageUrl ? (
            <Image source={{ uri: pack.imageUrl }} style={styles.packImage} />
          ) : (
            <View style={[styles.packImage, styles.packImagePlaceholder]}>
              <Text style={styles.packImagePlaceholderText}>{pack.name ? pack.name.charAt(0).toUpperCase() : "P"}</Text>
            </View>
          )}
          <View style={styles.packInfo}>
            <Text style={styles.packName}>{pack.name}</Text>
            <Text style={styles.packDescription}>{pack.description || "No description"}</Text>
            <View style={styles.packMeta}>
              <Text style={styles.packMembers}>{pack.members?.length || 0} members</Text>
              {pack.visibility === "public" && (
                <View style={styles.publicBadge}>
                  <Text style={styles.publicBadgeText}>Public</Text>
                </View>
              )}
              {pack.options?.hasChat && (
                <View style={styles.chatBadge}>
                  <Text style={styles.chatBadgeText}>Chat</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Tags */}
        {pack.tags && pack.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {pack.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {pack.options?.hasChat && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("PackChat" as never, { pack })}
            >
              <MaterialIcons name="chat" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Open Chat</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("PackMembers" as never, { pack })}
          >
            <MaterialIcons name="group" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>View Members</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Members */}
        <View style={styles.membersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Members</Text>
            <TouchableOpacity onPress={() => navigation.navigate("PackMembers" as never, { pack })}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {pack.members && pack.members.length > 0 ? (
            pack.members.slice(0, 5).map(renderMember)
          ) : (
            <Text style={styles.emptyText}>No members yet</Text>
          )}
        </View>

        {/* Routes */}
        <View style={styles.routesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Routes</Text>
            <TouchableOpacity onPress={() => setShowCreateRouteModal(true)}>
              <MaterialIcons name="add" size={24} color="#f3631a" />
            </TouchableOpacity>
          </View>
          {pack.routes && pack.routes.length > 0 ? (
            pack.routes.map((route) => (
              <TouchableOpacity
                key={route.id}
                style={styles.routeItem}
                onPress={() => navigation.navigate("RouteDetails" as never, { route })}
              >
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <Text style={styles.routeDistance}>{route.distance} miles</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No routes yet</Text>
          )}
        </View>
      </ScrollView>

      {/* Share Modal */}
      <Modal visible={showShareModal} transparent animationType="slide" onRequestClose={() => setShowShareModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.shareModal}>
            <View style={styles.shareHeader}>
              <Text style={styles.shareTitle}>Share Pack</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {pack.shareCode && (
              <View style={styles.qrContainer}>
                <QRCode
                  value={`https://packtrack.app/share?type=pack&shareCode=${pack.shareCode}`}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </View>
            )}

            <View style={styles.shareActions}>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <MaterialIcons name="share" size={20} color="#fff" />
                <Text style={styles.shareButtonText}>Share Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>Edit Pack</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editContent}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.name}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, name: text }))}
                placeholder="Pack name"
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={editForm.description}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, description: text }))}
                placeholder="Pack description"
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Visibility</Text>
              <View style={styles.visibilityContainer}>
                <TouchableOpacity
                  style={[
                    styles.visibilityOption,
                    editForm.visibility === "private" && styles.visibilityOptionSelected,
                  ]}
                  onPress={() => setEditForm((prev) => ({ ...prev, visibility: "private" }))}
                >
                  <Text style={styles.visibilityText}>Private</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.visibilityOption, editForm.visibility === "public" && styles.visibilityOptionSelected]}
                  onPress={() => setEditForm((prev) => ({ ...prev, visibility: "public" }))}
                >
                  <Text style={styles.visibilityText}>Public</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.inputLabel}>Enable Chat</Text>
                <Switch
                  value={editForm.hasChat}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, hasChat: value }))}
                  trackColor={{ false: "#767577", true: "#f3631a" }}
                  thumbColor="#fff"
                />
              </View>

              <Text style={styles.inputLabel}>Tags</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholder="Add a tag"
                  placeholderTextColor="#666"
                  onSubmitEditing={addTag}
                />
                <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
                  <MaterialIcons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {editForm.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {editForm.tags.map((tag, index) => (
                    <View key={index} style={styles.editTag}>
                      <Text style={styles.editTagText}>{tag}</Text>
                      <TouchableOpacity onPress={() => removeTag(tag)}>
                        <MaterialIcons name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleEditPack}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {renderMenuModal()}
    </SafeAreaView>
  )
}

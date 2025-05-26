"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  FlatList,
} from "react-native"
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  ChevronLeft,
  MoreHorizontal,
  Users,
  Map,
  MessageSquare,
  Share2,
  Settings,
  Plus,
  X,
  Search,
} from "lucide-react-native"
import QRCode from "react-native-qrcode-svg"
import Brightness from "react-native-screen-brightness"
import { SERVER_URI, PRIMARY_APP_COLOR } from "../config"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../types/navigation"
import type { PackDetails } from "../types/Pack"
import type { RouteType } from "../types/navigation"
import {styles} from "../styles/PackDetailsScreen.styles"

type PackDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "PackDetails">
type PackDetailsScreenRouteProp = RouteProp<RootStackParamList, "PackDetails">

export default function PackDetailsScreen() {
  const navigation = useNavigation<PackDetailsScreenNavigationProp>()
  const route = useRoute<PackDetailsScreenRouteProp>()
  const { pack: initialPack } = route.params

  const [pack, setPack] = useState<PackDetails>(initialPack)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false)
  const [addRouteModalVisible, setAddRouteModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [isMember, setIsMember] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [shareLink, setShareLink] = useState("")
  const [originalBrightness, setOriginalBrightness] = useState<number | null>(null)
  const [packRoutes, setPackRoutes] = useState<RouteType[]>([])
  const [loadingRoutes, setLoadingRoutes] = useState(false)

  useFocusEffect(
    useCallback(() => {
      fetchPackDetails()
      checkUserRole()
    }, []),
  )

  const checkUserRole = async () => {
    const currentUserId = await AsyncStorage.getItem("userId")
    setUserId(currentUserId)

    if (currentUserId) {
      setIsOwner(pack.owner === currentUserId)
      setIsMember(pack.members.includes(currentUserId))
    }
  }

  const fetchPackDetails = async () => {
    try {
      setRefreshing(true)
      const token = await AsyncStorage.getItem("token")

      if (!token) {
        Alert.alert("Authentication Error", "Missing token")
        return
      }

      const res = await fetch(`${SERVER_URI}/api/packs/${pack.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch pack details")
      }

      setPack(data)
      fetchPackRoutes(data.id)
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to fetch pack details")
    } finally {
      setRefreshing(false)
    }
  }

  const fetchPackRoutes = async (packId: string) => {
    try {
      setLoadingRoutes(true)
      const token = await AsyncStorage.getItem("token")

      if (!token) return

      const res = await fetch(`${SERVER_URI}/api/packs/${packId}/routes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch pack routes")
      }

      setPackRoutes(data)
    } catch (err: any) {
      console.error("Error fetching pack routes:", err.message)
    } finally {
      setLoadingRoutes(false)
    }
  }

  const handleShare = async () => {
    const currentUserId = await AsyncStorage.getItem("userId")
    const shareCode = pack.shareCode || "unknown"
    const link = `${SERVER_URI}/share?type=pack&shareCode=${shareCode}&ref=${currentUserId}`
    setShareLink(link)
    setShareModalVisible(true)
  }

  // Handle brightness when share modal is opened/closed
  useEffect(() => {
    const manageBrightness = async () => {
      try {
        if (shareModalVisible) {
          // Save current brightness and set to maximum
          const currentBrightness = await Brightness.getBrightness()
          setOriginalBrightness(currentBrightness)
          await Brightness.setBrightness(1)
        } else if (originalBrightness !== null) {
          // Restore original brightness when modal is closed
          await Brightness.setBrightness(originalBrightness)
          setOriginalBrightness(null)
        }
      } catch (error) {
        console.error("Failed to manage screen brightness:", error)
      }
    }

    manageBrightness()
  }, [shareModalVisible])

  const handleLeavePack = async () => {
    Alert.alert("Leave Pack", "Are you sure you want to leave this pack?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true)
            const token = await AsyncStorage.getItem("token")

            if (!token) {
              Alert.alert("Authentication Error", "Missing token")
              return
            }

            const res = await fetch(`${SERVER_URI}/api/packs/${pack.id}/leave`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            })

            const data = await res.json()

            if (!res.ok) {
              throw new Error(data.message || "Failed to leave pack")
            }

            Alert.alert("Success", "You have left the pack")
            navigation.goBack()
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to leave pack")
          } finally {
            setLoading(false)
          }
        },
      },
    ])
  }

  const handleDeletePack = async () => {
    Alert.alert("Delete Pack", "Are you sure you want to delete this pack? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true)
            const token = await AsyncStorage.getItem("token")

            if (!token) {
              Alert.alert("Authentication Error", "Missing token")
              return
            }

            const res = await fetch(`${SERVER_URI}/api/packs/${pack.id}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            })

            if (!res.ok) {
              const data = await res.json()
              throw new Error(data.message || "Failed to delete pack")
            }

            Alert.alert("Success", "Pack deleted successfully")
            navigation.goBack()
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to delete pack")
          } finally {
            setLoading(false)
          }
        },
      },
    ])
  }

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)

    try {
      const token = await AsyncStorage.getItem("token")

      if (!token) {
        Alert.alert("Authentication Error", "Missing token")
        return
      }

      const res = await fetch(`${SERVER_URI}/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to search users")
      }

      // Filter out users who are already members
      const filteredResults = data.filter((user: any) => !pack.members.includes(user.id))
      setSearchResults(filteredResults)
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to search users")
    } finally {
      setIsSearching(false)
    }
  }

  const inviteUser = async (userId: string) => {
    try {
      const token = await AsyncStorage.getItem("token")

      if (!token) {
        Alert.alert("Authentication Error", "Missing token")
        return
      }

      const res = await fetch(`${SERVER_URI}/api/packs/${pack.id}/invite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to invite user")
      }

      Alert.alert("Success", "Invitation sent successfully")
      setSearchResults(searchResults.filter((user) => user.id !== userId))
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to invite user")
    }
  }

  const searchRoutes = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)

    try {
      const token = await AsyncStorage.getItem("token")

      if (!token) {
        Alert.alert("Authentication Error", "Missing token")
        return
      }

      const res = await fetch(`${SERVER_URI}/api/routes/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to search routes")
      }

      // Filter out routes that are already in the pack
      const packRouteIds = packRoutes.map((route) => route.id || route._id)
      const filteredResults = data.filter(
        (route: RouteType) => !packRouteIds.includes(route.id) && !packRouteIds.includes(route._id),
      )

      setSearchResults(filteredResults)
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to search routes")
    } finally {
      setIsSearching(false)
    }
  }

  const addRouteToPack = async (routeId: string) => {
    try {
      const token = await AsyncStorage.getItem("token")

      if (!token) {
        Alert.alert("Authentication Error", "Missing token")
        return
      }

      const res = await fetch(`${SERVER_URI}/api/packs/${pack.id}/routes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ routeId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to add route to pack")
      }

      Alert.alert("Success", "Route added to pack successfully")
      fetchPackRoutes(pack.id)
      setSearchResults(searchResults.filter((route) => route.id !== routeId && route._id !== routeId))
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to add route to pack")
    }
  }

  const renderRouteCard = (route: RouteType) => (
    <TouchableOpacity style={styles.routeCard} onPress={() => navigation.navigate("RouteDetails", { route })}>
      <Text style={styles.routeName} numberOfLines={1}>
        {route.name || "Unnamed Route"}
      </Text>
      <Text style={styles.routeDetail} numberOfLines={1}>
        {route.waypoints?.[0]?.label || "Unknown"} → {route.waypoints?.[route.waypoints.length - 1]?.label || "Unknown"}
      </Text>
      <Text style={styles.routeDistance}>{route.distance || "—"}</Text>
    </TouchableOpacity>
  )

  const renderShareModal = () => (
    <Modal visible={shareModalVisible} animationType="slide">
      <View style={styles.shareModalContainer}>
        <View style={styles.shareModalHeader}>
          <TouchableOpacity onPress={() => setShareModalVisible(false)} style={styles.closeShareButton}>
            <X color="white" size={24} />
          </TouchableOpacity>
          <Text style={styles.shareModalTitle}>{pack.name}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.qrContainer}>
          <QRCode value={shareLink} size={200} color="black" backgroundColor="white" logoBackgroundColor="white" />
        </View>

        <View style={styles.linkContainer}>
          <TouchableOpacity style={styles.linkBox} onPress={() => {}}>
            <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="middle">
              {shareLink}
            </Text>
          </TouchableOpacity>
          <Text style={styles.shareInstructions}>Share this QR code with others to let them join this pack.</Text>
        </View>
      </View>
    </Modal>
  )

  const renderAddMemberModal = () => (
    <Modal visible={addMemberModalVisible} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setAddMemberModalVisible(false)} style={styles.closeModalButton}>
            <X color="white" size={24} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Members</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search users by name or username"
              placeholderTextColor="#aaa"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchUsers}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchButton} onPress={searchUsers}>
              <Search color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_APP_COLOR} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.userItem}>
                <View style={styles.userInfo}>
                  {item.profileImage ? (
                    <Image source={{ uri: item.profileImage }} style={styles.userAvatar} />
                  ) : (
                    <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
                      <Text style={styles.userAvatarText}>
                        {item.username?.charAt(0) || item.fullname?.charAt(0) || "U"}
                      </Text>
                    </View>
                  )}
                  <View>
                    <Text style={styles.userName}>{item.fullname || "Unknown"}</Text>
                    <Text style={styles.userUsername}>@{item.username || "user"}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.inviteButton} onPress={() => inviteUser(item.id)}>
                  <Text style={styles.inviteButtonText}>Invite</Text>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : searchQuery ? (
          <View style={styles.emptyResults}>
            <Text style={styles.emptyResultsText}>No users found</Text>
            <Text style={styles.emptyResultsSubtext}>Try a different search term</Text>
          </View>
        ) : (
          <View style={styles.emptyResults}>
            <Text style={styles.emptyResultsText}>Search for users</Text>
            <Text style={styles.emptyResultsSubtext}>Find users by name or username to invite them to your pack</Text>
          </View>
        )}
      </View>
    </Modal>
  )

  const renderAddRouteModal = () => (
    <Modal visible={addRouteModalVisible} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setAddRouteModalVisible(false)} style={styles.closeModalButton}>
            <X color="white" size={24} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Routes</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search routes by name"
              placeholderTextColor="#aaa"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchRoutes}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchButton} onPress={searchRoutes}>
              <Search color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_APP_COLOR} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id || item._id}
            renderItem={({ item }) => (
              <View style={styles.routeItem}>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeItemName} numberOfLines={1}>
                    {item.name || "Unnamed Route"}
                  </Text>
                  <Text style={styles.routeItemDetail} numberOfLines={1}>
                    {item.waypoints?.[0]?.label || "Unknown"} →{" "}
                    {item.waypoints?.[item.waypoints.length - 1]?.label || "Unknown"}
                  </Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={() => addRouteToPack(item.id || item._id)}>
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : searchQuery ? (
          <View style={styles.emptyResults}>
            <Text style={styles.emptyResultsText}>No routes found</Text>
            <Text style={styles.emptyResultsSubtext}>Try a different search term</Text>
          </View>
        ) : (
          <View style={styles.emptyResults}>
            <Text style={styles.emptyResultsText}>Search for routes</Text>
            <Text style={styles.emptyResultsSubtext}>Find routes to add to your pack</Text>
          </View>
        )}
      </View>
    </Modal>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="white" size={26} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pack.name}</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <MoreHorizontal color="white" size={24} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchPackDetails} tintColor={PRIMARY_APP_COLOR} />
        }
      >
        {/* Pack Image */}
        <View style={styles.packImageContainer}>
          {pack.imageUrl ? (
            <Image source={{ uri: pack.imageUrl }} style={styles.packImage} />
          ) : (
            <View style={[styles.packImage, styles.packImagePlaceholder]}>
              <Text style={styles.packImageText}>{pack.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Pack Details */}
        <View style={styles.packDetails}>
          <Text style={styles.packName}>{pack.name}</Text>

          <View style={styles.packMeta}>
            <Text style={styles.memberCount}>{pack.members.length} members</Text>
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

          {pack.description && <Text style={styles.description}>{pack.description}</Text>}

          {pack.tags && pack.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {pack.tags.map((tag:any, index:any) => (
                <View key={index} style={styles.tagBadge}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("PackMembers", { packId: pack.id })}
          >
            <Users color={PRIMARY_APP_COLOR} size={24} />
            <Text style={styles.actionButtonText}>Members</Text>
          </TouchableOpacity>

          {pack.options?.hasChat && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("PackChat", { packId: pack.id })}
            >
              <MessageSquare color={PRIMARY_APP_COLOR} size={24} />
              <Text style={styles.actionButtonText}>Chat</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Share2 color={PRIMARY_APP_COLOR} size={24} />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>

          {isOwner && (
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("PackSettings", { pack })}>
              <Settings color={PRIMARY_APP_COLOR} size={24} />
              <Text style={styles.actionButtonText}>Settings</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Pack Routes */}
        <View style={styles.routesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Routes</Text>
            {isMember && (
              <TouchableOpacity style={styles.addRouteButton} onPress={() => setAddRouteModalVisible(true)}>
                <Plus color="white" size={16} />
                <Text style={styles.addRouteButtonText}>Add Route</Text>
              </TouchableOpacity>
            )}
          </View>

          {loadingRoutes ? (
            <ActivityIndicator size="small" color={PRIMARY_APP_COLOR} style={{ marginTop: 20 }} />
          ) : packRoutes.length > 0 ? (
            packRoutes.map((route) => renderRouteCard(route))
          ) : (
            <View style={styles.emptyRoutes}>
              <Map color="#aaa" size={40} />
              <Text style={styles.emptyRoutesText}>No routes yet</Text>
              {isMember && (
                <Text style={styles.emptyRoutesSubtext}>Add routes to this pack to collaborate with other members</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Menu Modal */}
      <Modal visible={menuVisible} animationType="slide" transparent>
        <View style={styles.menuOverlay}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setMenuVisible(false)}>
              <X color="white" size={24} />
            </TouchableOpacity>

            {isOwner && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false)
                    setAddMemberModalVisible(true)
                  }}
                >
                  <Text style={styles.menuText}>Add Members</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false)
                    navigation.navigate("PackSettings", { pack })
                  }}
                >
                  <Text style={styles.menuText}>Edit Pack</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false)
                    handleDeletePack()
                  }}
                >
                  <Text style={[styles.menuText, { color: "#ff4444" }]}>Delete Pack</Text>
                </TouchableOpacity>
              </>
            )}

            {!isOwner && isMember && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false)
                  handleLeavePack()
                }}
              >
                <Text style={[styles.menuText, { color: "#ff4444" }]}>Leave Pack</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false)
                handleShare()
              }}
            >
              <Text style={styles.menuText}>Share Pack</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      {renderShareModal()}

      {/* Add Member Modal */}
      {renderAddMemberModal()}

      {/* Add Route Modal */}
      {renderAddRouteModal()}
    </View>
  )
}
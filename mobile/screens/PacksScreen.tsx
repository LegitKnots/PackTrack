import React, { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Image,
  RefreshControl,
} from "react-native"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Search, Camera, Plus, Filter } from "lucide-react-native"
import { SERVER_URI, PRIMARY_APP_COLOR } from "../config"
import { styles as globalStyles } from "../styles/RoutesScreen.styles"
import CreatePackModal from "../components/CreatePackModal"
import QRCodeScanner from "../components/QRCodeScanner"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../types/navigation"
import type { PackDetails } from "../types/Pack"

type PacksScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>

export default function PacksScreen() {
  const navigation = useNavigation<PacksScreenNavigationProp>()
  const [activeTab, setActiveTab] = useState<"my" | "find">("my")
  const [modalVisible, setModalVisible] = useState(false)
  const [myPacks, setMyPacks] = useState<PackDetails[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<PackDetails[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [scannerVisible, setScannerVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [filters, setFilters] = useState({
    tags: [] as string[],
    hasChat: null as boolean | null,
  })
  const [popularTags, setPopularTags] = useState<string[]>([
    "Cycling", "Mountain Biking", "Road Biking", "Gravel", "Racing", 
    "Casual", "Training", "Commuting", "Weekend", "Local"
  ])

  useFocusEffect(
    useCallback(() => {
      fetchPacks()
    }, []),
  )

  const fetchPacks = async () => {
    try {
      setRefreshing(true)
      const token = await AsyncStorage.getItem("token")
      if (!token) return Alert.alert("Authentication Error", "Missing token")

      const res = await fetch(`${SERVER_URI}/api/packs/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message || "Failed to fetch packs")

      setMyPacks(data)
    } catch (err: any) {
      Alert.alert("Error Fetching Packs", err.message)
    } finally {
      setRefreshing(false)
    }
  }

  const handleCreatePack = (newPack: PackDetails) => {
    setMyPacks((prev) => [...prev, newPack])
    setModalVisible(false)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() && !filters.tags.length && filters.hasChat === null) {
      setSearchResults([])
      return
    }

    setIsSearching(true)

    try {
      const token = await AsyncStorage.getItem("token")
      if (!token) {
        Alert.alert("Authentication Error", "You need to be logged in to search")
        return
      }

      // Build query parameters
      let queryParams = `q=${encodeURIComponent(searchQuery)}`
      
      if (filters.tags.length > 0) {
        queryParams += `&tags=${encodeURIComponent(filters.tags.join(","))}`
      }
      
      if (filters.hasChat !== null) {
        queryParams += `&hasChat=${filters.hasChat}`
      }

      const res = await fetch(`${SERVER_URI}/api/packs/search?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Search failed")

      setSearchResults(data)
    } catch (err: any) {
      Alert.alert("Search Error", err.message)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleQRCodeScanned = async (value: string) => {
    setScannerVisible(false)

    try {
      // Extract share code from QR code
      const shareCodeMatch = value.match(/shareCode=([^&]+)/)
      if (!shareCodeMatch || !shareCodeMatch[1]) {
        Alert.alert("Error", "Invalid QR code format")
        return
      }

      const shareCode = shareCodeMatch[1]
      const token = await AsyncStorage.getItem("token")
      
      if (!token) {
        Alert.alert("Authentication Error", "You need to be logged in to join a pack")
        return
      }

      // First, get the pack details
      const detailsRes = await fetch(`${SERVER_URI}/api/packs/shared/${shareCode}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const packData = await detailsRes.json()
      
      if (!detailsRes.ok) {
        throw new Error(packData.error || "Failed to fetch pack details")
      }

      // Show confirmation dialog
      Alert.alert(
        "Join Pack",
        `Would you like to join "${packData.name}"?`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Join",
            onPress: async () => {
              try {
                const joinRes = await fetch(`${SERVER_URI}/api/packs/${packData.id}/join`, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                })

                const joinData = await joinRes.json()
                
                if (!joinRes.ok) {
                  throw new Error(joinData.error || "Failed to join pack")
                }

                Alert.alert("Success", "You have joined the pack successfully!")
                fetchPacks() // Refresh packs list
              } catch (err: any) {
                Alert.alert("Error", err.message || "Failed to join pack")
              }
            }
          }
        ]
      )
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to process QR code")
    }
  }

  const renderPackCard = (pack: PackDetails) => (
    <TouchableOpacity
      style={styles.packCard}
      onPress={() => navigation.navigate("PackDetails", { pack })}
      key={pack.id}
    >
      <View style={styles.packCardContent}>
        {pack.imageUrl ? (
          <Image source={{ uri: pack.imageUrl }} style={styles.packImage} />
        ) : (
          <View style={[styles.packImage, styles.packImagePlaceholder]}>
            <Text style={styles.packImagePlaceholderText}>{pack.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.packInfo}>
          <Text style={styles.packName} numberOfLines={1}>
            {pack.name || "Unnamed Pack"}
          </Text>
          <Text style={styles.packDescription} numberOfLines={2}>
            {pack.description || "No description"}
          </Text>
          <View style={styles.packMeta}>
            <Text style={styles.packMembers}>{pack.members.length} members</Text>
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
          {pack.tags && pack.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {pack.tags.slice(0, 3).map((tag:any, index:any) => (
                <View key={index} style={styles.tagBadge}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {pack.tags.length > 3 && (
                <Text style={styles.moreTags}>+{pack.tags.length - 3}</Text>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )

  const toggleTag = (tag: string) => {
    setFilters(prev => {
      const currentTags = [...prev.tags]
      const tagIndex = currentTags.indexOf(tag)
      
      if (tagIndex >= 0) {
        currentTags.splice(tagIndex, 1)
      } else {
        currentTags.push(tag)
      }
      
      return {
        ...prev,
        tags: currentTags
      }
    })
  }

  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.filterModalOverlay}>
        <View style={styles.filterModalContent}>
          <Text style={styles.filterModalTitle}>Filter Packs</Text>
          
          <Text style={styles.filterSectionTitle}>Tags</Text>
          <View style={styles.tagsGrid}>
            {popularTags.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.filterTagBadge,
                  filters.tags.includes(tag) && styles.filterTagBadgeSelected
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text 
                  style={[
                    styles.filterTagText,
                    filters.tags.includes(tag) && styles.filterTagTextSelected
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.filterSectionTitle}>Chat</Text>
          <View style={styles.chatFilterOptions}>
            <TouchableOpacity
              style={[
                styles.chatFilterOption,
                filters.hasChat === null && styles.chatFilterOptionSelected
              ]}
              onPress={() => setFilters(prev => ({ ...prev, hasChat: null }))}
            >
              <Text style={styles.chatFilterText}>Any</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.chatFilterOption,
                filters.hasChat === true && styles.chatFilterOptionSelected
              ]}
              onPress={() => setFilters(prev => ({ ...prev, hasChat: true }))}
            >
              <Text style={styles.chatFilterText}>With Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.chatFilterOption,
                filters.hasChat === false && styles.chatFilterOptionSelected
              ]}
              onPress={() => setFilters(prev => ({ ...prev, hasChat: false }))}
            >
              <Text style={styles.chatFilterText}>No Chat</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterActions}>
            <TouchableOpacity
              style={styles.filterClearButton}
              onPress={() => setFilters({ tags: [], hasChat: null })}
            >
              <Text style={styles.filterClearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterApplyButton}
              onPress={() => {
                setFilterModalVisible(false)
                handleSearch()
              }}
            >
              <Text style={styles.filterApplyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.filterCloseButton}
            onPress={() => setFilterModalVisible(false)}
          >
            <Text style={styles.filterCloseButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.tabs}>
        <TouchableOpacity style={globalStyles.tab} onPress={() => setActiveTab("my")}>
          <Text style={[globalStyles.tabText, activeTab === "my" && globalStyles.activeTabText]}>My Packs</Text>
          {activeTab === "my" && <View style={globalStyles.underline} />}
        </TouchableOpacity>

        <TouchableOpacity style={globalStyles.tab} onPress={() => setActiveTab("find")}>
          <Text style={[globalStyles.tabText, activeTab === "find" && globalStyles.activeTabText]}>Find Packs</Text>
          {activeTab === "find" && <View style={globalStyles.underline} />}
        </TouchableOpacity>
      </View>

      <View style={globalStyles.content}>
        {activeTab === "my" ? (
          <View style={{ flex: 1 }}>
            <View style={globalStyles.plusBtnRow}>
              <TouchableOpacity style={globalStyles.plusBtn} onPress={() => setModalVisible(true)}>
                <Text style={globalStyles.plusIcon}>+</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={fetchPacks} tintColor={PRIMARY_APP_COLOR} />
              }
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {myPacks.length > 0 ? (
                myPacks.map((pack) => renderPackCard(pack))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>You haven't joined any packs yet.</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Create a new pack or join an existing one to get started.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => setModalVisible(true)}
                  >
                    <Plus color="white" size={16} />
                    <Text style={styles.emptyStateButtonText}>Create Pack</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search packs by name or description"
                  placeholderTextColor="#aaa"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                  <Search color="#fff" size={20} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={[
                  styles.filterButton, 
                  (filters.tags.length > 0 || filters.hasChat !== null) && styles.filterButtonActive
                ]} 
                onPress={() => setFilterModalVisible(true)}
              >
                <Filter color="#fff" size={20} />
                {(filters.tags.length > 0 || filters.hasChat !== null) && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>
                      {filters.tags.length + (filters.hasChat !== null ? 1 : 0)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cameraButton} onPress={() => setScannerVisible(true)}>
                <Camera color="#fff" size={20} />
              </TouchableOpacity>
            </View>

            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f3631a" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {searchResults.map((pack) => renderPackCard(pack))}
              </ScrollView>
            ) : searchQuery || filters.tags.length > 0 || filters.hasChat !== null ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No packs found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Try different search terms or filters
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Find packs to join</Text>
                <Text style={styles.emptyStateSubtext}>
                  Search by name, description, or scan a QR code to join a pack
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => setScannerVisible(true)}
                >
                  <Camera color="white" size={16} />
                  <Text style={styles.emptyStateButtonText}>Scan QR Code</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      <CreatePackModal visible={modalVisible} onClose={() => setModalVisible(false)} onCreate={handleCreatePack} />

      {/* QR Code Scanner Modal */}
      {scannerVisible && (
        <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
          <QRCodeScanner onClose={() => setScannerVisible(false)} onCodeScanned={handleQRCodeScanned} />
        </Modal>
      )}

      {/* Filter Modal */}
      {renderFilterModal()}
    </View>
  )
}

const styles = StyleSheet.create({
  packCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  packCardContent: {
    flexDirection: "row",
  },
  packImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  packImagePlaceholder: {
    backgroundColor: PRIMARY_APP_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  packImagePlaceholderText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  packInfo: {
    flex: 1,
  },
  packName: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  packDescription: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 8,
  },
  packMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  packMembers: {
    color: "#aaa",
    fontSize: 12,
    marginRight: 8,
  },
  publicBadge: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  publicBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "500",
  },
  chatBadge: {
    backgroundColor: "#1976d2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chatBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "500",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  tagBadge: {
    backgroundColor: "#333",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    color: "#ddd",
    fontSize: 10,
  },
  moreTags: {
    color: "#aaa",
    fontSize: 10,
    alignSelf: "center",
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 16,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  searchButton: {
    padding: 10,
  },
  filterButton: {
    backgroundColor: "#2a2a2a",
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
    position: "relative",
  },
  filterButtonActive: {
    backgroundColor: PRIMARY_APP_COLOR,
  },
  filterBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "white",
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: PRIMARY_APP_COLOR,
    fontSize: 10,
    fontWeight: "bold",
  },
  cameraButton: {
    backgroundColor: "#2a2a2a",
    padding: 10,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#aaa",
    marginTop: 10,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyStateText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: PRIMARY_APP_COLOR,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  filterModalContent: {
    backgroundColor: "#1e1e1e",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  filterModalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  filterSectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    marginTop: 8,
  },
  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  filterTagBadge: {
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  filterTagBadgeSelected: {
    backgroundColor: PRIMARY_APP_COLOR,
  },
  filterTagText: {
    color: "#ddd",
    fontSize: 12,
  },
  filterTagTextSelected: {
    color: "white",
    fontWeight: "500",
  },
  chatFilterOptions: {
    flexDirection: "row",
    marginBottom: 24,
  },
  chatFilterOption: {
    flex: 1,
    backgroundColor: "#333",
    paddingVertical: 10,
    alignItems: "center",
    marginRight: 8,
    borderRadius: 8,
  },
  chatFilterOptionSelected: {
    backgroundColor: PRIMARY_APP_COLOR,
  },
  chatFilterText: {
    color: "white",
    fontSize: 14,
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  filterClearButton: {
    flex: 1,
    backgroundColor: "#333",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginRight: 8,
  },
  filterClearButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  filterApplyButton: {
    flex: 2,
    backgroundColor: PRIMARY_APP_COLOR,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  filterApplyButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  filterCloseButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  filterCloseButtonText: {
    color: "#aaa",
    fontSize: 14,
  },
})

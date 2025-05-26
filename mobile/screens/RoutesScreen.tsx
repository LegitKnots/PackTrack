"use client"

import { useState, useCallback } from "react"
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
  RefreshControl,
} from "react-native"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Search, Camera } from "lucide-react-native"
import CreateRouteModal from "../components/CreateRouteModal"
import QRCodeScanner from "../components/QRCodeScanner"
import { SERVER_URI } from "../config"
import { styles as globalStyles } from "../styles/RoutesScreen.styles"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList, RouteType } from "../types/navigation"

type RoutesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>

export default function RoutesScreen() {
  const navigation = useNavigation<RoutesScreenNavigationProp>()
  const [activeTab, setActiveTab] = useState<"my" | "find">("my")
  const [modalVisible, setModalVisible] = useState(false)
  const [myRoutes, setMyRoutes] = useState<RouteType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<RouteType[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [scannerVisible, setScannerVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useFocusEffect(
    useCallback(() => {
      fetchRoutes()
    }, []),
  )

  const fetchRoutes = async () => {
    try {
      const token = await AsyncStorage.getItem("token")
      if (!token) return Alert.alert("Authentication Error", "Missing token")

      // Get userId directly from AsyncStorage instead of decoding the token
      const userId = await AsyncStorage.getItem("userId")
      if (!userId) throw new Error("User ID not found in storage")

      const res = await fetch(`${SERVER_URI}/api/routes/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        throw new Error(text)
      }

      if (!res.ok) throw new Error(data.message || "Failed to fetch routes")

      setMyRoutes(data)
    } catch (err: any) {
      Alert.alert("Error Fetching Routes", err.message)
    } finally {
      setRefreshing(false)
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchRoutes()
  }, [])

  const handleCreateRoute = (newRoute: RouteType) => {
    setMyRoutes((prev) => [...prev, newRoute])
    setModalVisible(false)
  }

  const renderRouteCard = (route: RouteType) => (
    <TouchableOpacity style={globalStyles.routeCard} onPress={() => navigation.navigate("RouteDetails", { route })}>
      <Text style={globalStyles.routeName} numberOfLines={1}>
        {route.name || "Unnamed"}
      </Text>
      <Text style={globalStyles.routeText} numberOfLines={1}>
        {route.waypoints?.[0]?.label || "Unknown"}
      </Text>
      <Text style={globalStyles.routeText} numberOfLines={1}>
        {route.waypoints?.[1]?.label || "Unknown"}
      </Text>
      <Text style={globalStyles.distance}>{route.distance || "—"}</Text>
    </TouchableOpacity>
  )

  // Function to extract share code from URL
  const extractShareCode = (url: string): string | null => {
    try {
      // Look for the shareCode parameter in the URL
      const shareCodeRegex = /shareCode=([^&]+)/
      const match = url.match(shareCodeRegex)

      if (match && match[1]) {
        return match[1]
      }
      return null
    } catch (err) {
      console.error("Error extracting share code:", err)
      return null
    }
  }

  const handleQRCodeScanned = (value: string) => {
    setScannerVisible(false)

    try {
      // Check if the value is a share link
      if (value.includes("/share?type=route&shareCode=")) {
        // Extract the share code from the URL
        const shareCode = extractShareCode(value)

        if (shareCode) {
          // Format the search query with the share code
          const formattedQuery = `search="${shareCode}"`
          setSearchQuery(formattedQuery)

          // Switch to the find tab if not already there
          if (activeTab !== "find") {
            setActiveTab("find")
          }

          // Trigger the search with the formatted query
          handleSearchWithShareCode(shareCode)
        } else {
          Alert.alert("Error", "Invalid QR code: No share code found")
        }
      } else {
        // If it's not a share link, just use the value as is
        setSearchQuery(value)

        // Switch to the find tab if not already there
        if (activeTab !== "find") {
          setActiveTab("find")
        }

        handleSearch()
      }
    } catch (err) {
      console.error("Error parsing QR code:", err)
      Alert.alert("Error", "Invalid QR code format")
    }
  }

  // Add a new function to handle searching with a share code
  const handleSearchWithShareCode = async (shareCode: string) => {
    setIsSearching(true)

    try {
      const token = await AsyncStorage.getItem("token")
      if (!token) {
        Alert.alert("Authentication Error", "You need to be logged in to view shared routes")
        return
      }

      // Use the new endpoint for searching by share code with quotes
      const res = await fetch(`${SERVER_URI}/api/search/routes?shareCode="${shareCode}"`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch shared route")

      // Navigate to the route details screen with the fetched route
      navigation.navigate("RouteDetails", { route: data })
    } catch (err: any) {
      Alert.alert("Error", err.message || "Invalid share code")
    } finally {
      setIsSearching(false)
    }
  }

  // Update the handleSearch function to use the new endpoint
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)

    try {
      // Check if the search query is a formatted share code
      const shareCodeMatch = searchQuery.match(/search="(.*?)"/)
      if (shareCodeMatch && shareCodeMatch[1]) {
        // If it's a share code format, use the extracted code
        handleSearchWithShareCode(shareCodeMatch[1])
        return
      }

      // Check if the search query is a share link
      if (searchQuery.includes("/share?type=route&shareCode=")) {
        const shareCode = extractShareCode(searchQuery)
        if (shareCode) {
          handleSearchWithShareCode(shareCode)
          return
        }
      }

      // Otherwise search for routes by name/description using the new endpoint
      const token = await AsyncStorage.getItem("token")
      if (!token) {
        Alert.alert("Authentication Error", "You need to be logged in to search")
        return
      }

      const res = await fetch(`${SERVER_URI}/api/search/routes?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Search failed")

      // If the response is an array, it's a list of routes
      if (Array.isArray(data)) {
        setSearchResults(data)
      }
      // If it's a single route object, navigate directly to it
      else if (data.id) {
        navigation.navigate("RouteDetails", { route: data })
      }
      // Otherwise, show no results
      else {
        setSearchResults([])
      }
    } catch (err: any) {
      Alert.alert("Search Error", err.message)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.tabs}>
        <TouchableOpacity style={globalStyles.tab} onPress={() => setActiveTab("my")}>
          <Text style={[globalStyles.tabText, activeTab === "my" && globalStyles.activeTabText]}>My Routes</Text>
          {activeTab === "my" && <View style={globalStyles.underline} />}
        </TouchableOpacity>

        <TouchableOpacity style={globalStyles.tab} onPress={() => setActiveTab("find")}>
          <Text style={[globalStyles.tabText, activeTab === "find" && globalStyles.activeTabText]}>Find Routes</Text>
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

            {refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f3631a" />
                <Text style={styles.loadingText}>Loading routes...</Text>
              </View>
            ) : (
              <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#f3631a"]} />}
              >
                {myRoutes.length > 0 ? (
                  myRoutes.map((route) => <View key={route._id || route.id}>{renderRouteCard(route)}</View>)
                ) : (
                  <Text style={globalStyles.placeholder}>
                    You don't have any routes yet. Create one by tapping the + button.
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search routes or enter share link"
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
              <ScrollView>
                {searchResults.map((route) => (
                  <View key={route._id || route.id}>{renderRouteCard(route)}</View>
                ))}
              </ScrollView>
            ) : searchQuery ? (
              <Text style={styles.noResultsText}>No routes found. Try a different search term.</Text>
            ) : (
              <Text style={globalStyles.placeholder}>Search for routes by name or description, or scan a QR code.</Text>
            )}
          </View>
        )}
      </View>

      <CreateRouteModal visible={modalVisible} onClose={() => setModalVisible(false)} onCreate={handleCreateRoute} />

      {/* QR Code Scanner Modal */}
      {scannerVisible && (
        <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
          <QRCodeScanner onClose={() => setScannerVisible(false)} onCodeScanned={handleQRCodeScanned} />
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
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
  noResultsText: {
    color: "#aaa",
    textAlign: "center",
    marginTop: 40,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
})

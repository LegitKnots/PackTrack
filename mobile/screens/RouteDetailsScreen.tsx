"use client"

import React, { useLayoutEffect, useState, useEffect, useRef } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, Image, Clipboard, Dimensions } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import MapView, { Polyline, Marker } from "react-native-maps"
import { useNavigation, useRoute } from "@react-navigation/native"
import { MoreHorizontal, ChevronLeft, X, Copy, Check } from "lucide-react-native"
import { jwtDecode } from "jwt-decode"
import polyline from "@mapbox/polyline"
import QRCode from "react-native-qrcode-svg"
import Brightness from "react-native-screen-brightness"
import { GOOGLE_MAPS_APIKEY, PRIMARY_APP_COLOR, SERVER_URI } from "../config"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RouteDetailsRouteProp, RootStackParamList, RouteType } from "../types/navigation"

type RouteDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, "RouteDetails">

const { width } = Dimensions.get("window")

export default function RouteDetailsScreen() {
  const navigation = useNavigation<RouteDetailsNavigationProp>()
  const route = useRoute<RouteDetailsRouteProp>()
  const routeData = route.params.route

  const [menuVisible, setMenuVisible] = useState(false)
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const [isCollaborator, setIsCollaborator] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [shareLink, setShareLink] = useState("")
  const [copied, setCopied] = useState(false)
  const [routeIsShared, setRouteIsShared] = useState(routeData.isShared || false)
  const [originalBrightness, setOriginalBrightness] = useState<number | null>(null)
  const mapRef = useRef<MapView | null>(null)
  const [decodedPath, setDecodedPath] = useState<{ latitude: number; longitude: number }[]>([])

  useLayoutEffect(() => {
    const checkUserRole = async () => {
      const token = await AsyncStorage.getItem("token")
      if (!token) return
      const decoded: any = jwtDecode(token)
      const userId = decoded?.userId
      setUserId(userId)
      setIsCreator(routeData.createdBy === userId)
      setIsCollaborator(routeData.collaborators?.includes(userId) || false)
    }
    checkUserRole()
  }, [routeData.createdBy, routeData.collaborators])

  useEffect(() => {
    const fetchPolyline = async () => {
      if (!Array.isArray(routeData.waypoints) || routeData.waypoints.length < 2) return

      const origin = `${routeData.waypoints[0].lat},${routeData.waypoints[0].lng}`
      const destination = `${routeData.waypoints[routeData.waypoints.length - 1].lat},${routeData.waypoints[routeData.waypoints.length - 1].lng}`
      const waypoints = routeData.waypoints
        .slice(1, -1)
        .map((wp) => `${wp.lat},${wp.lng}`)
        .join("|")
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_APIKEY}${waypoints ? `&waypoints=${waypoints}` : ""}`

      try {
        const res = await fetch(url)
        const data = await res.json()

        if (data.routes?.[0]?.overview_polyline?.points) {
          const decoded = polyline.decode(data.routes[0].overview_polyline.points)
          const coords = decoded.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))
          setDecodedPath(coords)

          if (coords.length > 0 && mapRef.current) {
            mapRef.current.fitToCoordinates(coords, {
              edgePadding: { top: 50, bottom: 50, left: 50, right: 50 },
              animated: true,
            })
          }
        }
      } catch (err) {
        console.error("Failed to fetch polyline", err)
      }
    }

    fetchPolyline()
  }, [routeData.waypoints])

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

  const handleDelete = async () => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this route?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setIsDeleting(true)
            const token = await AsyncStorage.getItem("token")
            if (!token) {
              Alert.alert("Error", "You need to be logged in")
              return
            }

            const routeId = routeData._id || routeData.id
            if (!routeId) {
              Alert.alert("Error", "Route ID not found")
              return
            }

            const res = await fetch(`${SERVER_URI}/api/routes/${routeId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            })

            if (!res.ok) {
              const errorData = await res.json()
              throw new Error(errorData.message || "Failed to delete route")
            }

            Alert.alert("Success", "Route deleted successfully")
            navigation.goBack()
          } catch (err: any) {
            Alert.alert("Error", err.message || "Something went wrong")
          } finally {
            setIsDeleting(false)
          }
        },
      },
    ])
  }

  const handleShare = async () => {
    if (!routeIsShared) {
      Alert.alert("Enable Sharing", "This route is not currently shared. Would you like to enable sharing?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Proceed",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token")
              const routeId = routeData._id || routeData.id

              if (!token || !routeId) {
                Alert.alert("Error", "Missing authentication or route information")
                return
              }

              const res = await fetch(`${SERVER_URI}/api/routes/${routeId}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isShared: true }),
              })

              if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.message || "Failed to update route")
              }

              setRouteIsShared(true)
              showShareModal()
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to enable sharing")
            }
          },
        },
      ])
    } else {
      showShareModal()
    }
  }

  const showShareModal = async () => {
    const currentUserId = await AsyncStorage.getItem("userId")
    const shareCode = routeData.shareCode || "unknown"
    const link = `${SERVER_URI}/share?type=route&shareCode=${shareCode}&ref=${currentUserId}`
    setShareLink(link)
    setShareModalVisible(true)
  }

  const copyToClipboard = () => {
    Clipboard.setString(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEdit = () => {
    navigation.navigate("EditRoute", { route: routeData })
    setMenuVisible(false)
  }

  return (
    <View style={styles.container}>
      {/* Top Nav Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="white" size={26} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{routeData.name}</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <MoreHorizontal color="white" size={24} />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={false}
        showsMyLocationButton={false}
        scrollEnabled={false}
        zoomEnabled={false}
        initialRegion={{
          latitude: routeData.waypoints?.[0]?.lat || 37.78825,
          longitude: routeData.waypoints?.[0]?.lng || -122.4324,
          latitudeDelta: 0.0,
          longitudeDelta: 0.0,
        }}
      >
        {/* Polyline */}
        {decodedPath.length > 0 && (
          <Polyline coordinates={decodedPath} strokeColor={PRIMARY_APP_COLOR} strokeWidth={4} />
        )}

        {/* Start marker at the beginning of the polyline */}
        {decodedPath.length > 0 && (
          <Marker coordinate={decodedPath[0]} anchor={{ x: 0.1, y: 0.8 }}>
            <Image
              source={require("../src/img/icons/start.png")}
              style={{ width: 30, height: 30, resizeMode: "contain" }}
            />
          </Marker>
        )}

        {/* End marker at the end of the polyline */}
        {decodedPath.length > 1 && (
          <Marker coordinate={decodedPath[decodedPath.length - 1]} anchor={{ x: 0.1, y: 0.8 }}>
            <Image
              source={require("../src/img/icons/end.png")}
              style={{ width: 30, height: 30, resizeMode: "contain" }}
            />
          </Marker>
        )}
      </MapView>

      {/* Route Details */}
      <View style={styles.details}>
        <Text style={styles.detailText}>Description: {routeData.description || "—"}</Text>
        <Text style={styles.detailText}>Distance: {routeData.distance || "—"}</Text>
        <Text style={styles.detailText}>Start: {routeData.waypoints?.[0]?.label || "—"}</Text>
        <Text style={styles.detailText}>
          End: {routeData.waypoints?.[routeData.waypoints.length - 1]?.label || "—"}
        </Text>
      </View>
      <View>
        <TouchableOpacity>
          <Text>Ride Route</Text>
        </TouchableOpacity>
      </View>

      {/* 3-Dots Menu */}
      <Modal visible={menuVisible} animationType="slide" transparent>
        <View style={styles.menuOverlay}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setMenuVisible(false)}>
              <X color="white" size={24} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
              <Text style={styles.menuText}>Share</Text>
            </TouchableOpacity>
            {(isCreator || isCollaborator) && (
              <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
                <Text style={styles.menuText}>Edit</Text>
              </TouchableOpacity>
            )}
            {isCreator && (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={handleDelete} disabled={isDeleting}>
                  <Text style={[styles.menuText, { color: "#ff4444" }]}>{isDeleting ? "Deleting..." : "Delete"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <Text style={styles.menuText}>Collaborators</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal visible={shareModalVisible} animationType="slide">
        <View style={styles.shareModalContainer}>
          <View style={styles.shareModalHeader}>
            <TouchableOpacity onPress={() => setShareModalVisible(false)} style={styles.closeShareButton}>
              <X color="white" size={24} />
            </TouchableOpacity>
            <Text style={styles.shareModalTitle}>{routeData.name}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.qrContainer}>
            <QRCode
              value={shareLink}
              size={width * 0.7}
              color="black"
              backgroundColor="white"
              logoBackgroundColor="white"
            />
          </View>

          <View style={styles.linkContainer}>
            <TouchableOpacity style={styles.linkBox} onPress={copyToClipboard} activeOpacity={0.7}>
              {copied ? (
                <View style={styles.copiedContainer}>
                  <Check color="#4CAF50" size={20} />
                  <Text style={styles.copiedText}>Copied!</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="middle">
                    {shareLink}
                  </Text>
                  <Copy color="#aaa" size={20} style={styles.copyIcon} />
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.shareInstructions}>
              Share this QR code or link with others to let them view and use this route.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  navBar: {
    height: 60,
    backgroundColor: "#1e1e1e",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navTitle: { color: "white", fontSize: 18, fontWeight: "bold" },
  map: { height: 200, width: "100%" },
  details: { padding: 16 },
  detailText: { color: "white", fontSize: 16, marginBottom: 10 },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  menuContainer: {
    backgroundColor: "#1e1e1e",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  menuItem: { paddingVertical: 12 },
  menuText: { fontSize: 18, color: "white" },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 20,
    zIndex: 1,
  },
  // Share Modal Styles
  shareModalContainer: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 16,
  },
  shareModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingTop: 10,
  },
  shareModalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  closeShareButton: {
    padding: 8,
  },
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 30,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    alignSelf: "center",
  },
  linkContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  linkBox: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 16,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  linkText: {
    color: "white",
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  copyIcon: {
    marginLeft: 10,
  },
  copiedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  copiedText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  shareInstructions: {
    color: "#aaa",
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
  },
})

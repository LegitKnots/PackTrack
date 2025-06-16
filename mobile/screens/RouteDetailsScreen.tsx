"use client"

import { useLayoutEffect, useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Image,
  Clipboard,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Share,
  Linking,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import MapView, { Polyline, Marker } from "react-native-maps"
import { useNavigation, useRoute } from "@react-navigation/native"
import {
  X,
  Copy,
  Check,
  Navigation,
  Clock,
  MapPin,
  Users,
  Heart,
  HeartOff,
  Download,
  Star,
  MessageCircle,
  Camera,
  ImageIcon,
  Plus,
  Send,
} from "lucide-react-native"
import { jwtDecode } from "jwt-decode"
import polyline from "@mapbox/polyline"
import QRCode from "react-native-qrcode-svg"
import Brightness from "react-native-screen-brightness"
import { launchImageLibrary, launchCamera, type ImagePickerResponse } from "react-native-image-picker"
import { GOOGLE_MAPS_APIKEY, PRIMARY_APP_COLOR, SERVER_URI } from "../config"
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteDetailsRouteProp, RootStackParamList } from "../types/navigation"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Header from "../components/Header"
import { SlideUpModal, slideUpModalStyles } from "../components/SlideUpModal"

type RouteDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, "RouteDetails">

const { width, height } = Dimensions.get("window")

interface RouteStats {
  totalDistance: string
  estimatedTime: string
  elevationGain: string
  difficulty: string
  waypoints: number
}

interface Comment {
  id: string
  userId: string
  username: string
  text: string
  createdAt: string
  rating?: number
}

interface RoutePhoto {
  id: string
  userId: string
  username: string
  imageUrl: string
  caption?: string
  createdAt: string
}

export default function RouteDetailsScreen() {
  const navigation = useNavigation<RouteDetailsNavigationProp>()
  const route = useRoute<RouteDetailsRouteProp>()
  const routeData = route.params.route
  const insets = useSafeAreaInsets()
  const scrollViewRef = useRef<ScrollView>(null)
  const commentInputRef = useRef<TextInput>(null)

  // Existing state
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

  // New state for enhanced features
  const [loading, setLoading] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsVisible, setCommentsVisible] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [userRating, setUserRating] = useState(0)
  const [averageRating, setAverageRating] = useState(0)
  const [totalRatings, setTotalRatings] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [collaboratorsModalVisible, setCollaboratorsModalVisible] = useState(false)
  const [collaborators, setCollaborators] = useState<any[]>([])

  // Photo state
  const [routePhotos, setRoutePhotos] = useState<RoutePhoto[]>([])
  const [photoUploadModalVisible, setPhotoUploadModalVisible] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false)

  // Comment state
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [commentInputFocused, setCommentInputFocused] = useState(false)

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height)
      if (commentInputFocused) {
        // Scroll to comment section when keyboard appears
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }, 100)
      }
    })
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0)
    })

    return () => {
      keyboardDidHideListener.remove()
      keyboardDidShowListener.remove()
    }
  }, [commentInputFocused])

  useLayoutEffect(() => {
    const checkUserRole = async () => {
      const token = await AsyncStorage.getItem("token")
      if (!token) return
      const decoded: any = jwtDecode(token)
      const userId = decoded?.userId
      setUserId(userId)
      setIsCreator(routeData.createdBy === userId)
      setIsCollaborator(routeData.collaborators?.includes(userId) || false)

      // Check if route is favorited
      checkFavoriteStatus(userId)
    }
    checkUserRole()
  }, [routeData.createdBy, routeData.collaborators])

  useEffect(() => {
    fetchRouteDetails()
    fetchPolyline()
    fetchRoutePhotos()
  }, [routeData])

  const checkFavoriteStatus = async (userId: string) => {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await fetch(`${SERVER_URI}/api/users/${userId}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const favorites = await response.json()
      setIsFavorited(favorites.some((fav: any) => fav.routeId === routeData._id))
    } catch (error) {
      console.error("Error checking favorite status:", error)
    }
  }

  const fetchRouteDetails = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem("token")
      const routeId = routeData._id || routeData.id

      // Fetch route statistics
      const statsResponse = await fetch(`${SERVER_URI}/api/routes/${routeId}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (statsResponse.ok) {
        const stats = await statsResponse.json()
        setRouteStats(stats)
      }

      // Fetch comments and ratings
      const commentsResponse = await fetch(`${SERVER_URI}/api/routes/${routeId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json()
        setComments(commentsData.comments)
        setAverageRating(commentsData.averageRating)
        setTotalRatings(commentsData.totalRatings)

        // Find user's rating
        const userComment = commentsData.comments.find((c: Comment) => c.userId === userId)
        if (userComment?.rating) {
          setUserRating(userComment.rating)
        }
      }

      // Fetch collaborators if user is creator
      if (isCreator) {
        const collabResponse = await fetch(`${SERVER_URI}/api/routes/${routeId}/collaborators`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (collabResponse.ok) {
          const collabData = await collabResponse.json()
          setCollaborators(collabData)
        }
      }
    } catch (error) {
      console.error("Error fetching route details:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoutePhotos = async () => {
    try {
      const token = await AsyncStorage.getItem("token")
      const routeId = routeData._id || routeData.id

      const response = await fetch(`${SERVER_URI}/api/routes/${routeId}/photos`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const photos = await response.json()
        setRoutePhotos(photos)
      }
    } catch (error) {
      console.error("Error fetching route photos:", error)
    }
  }

  const fetchPolyline = async () => {
    if (!Array.isArray(routeData.waypoints) || routeData.waypoints.length < 2) return

    const origin = `${routeData.waypoints[0].lat},${routeData.waypoints[0].lng}`
    const destination = `${
      routeData.waypoints[routeData.waypoints.length - 1].lat
    },${routeData.waypoints[routeData.waypoints.length - 1].lng}`
    const waypoints = routeData.waypoints
      .slice(1, -1)
      .map((wp) => `${wp.lat},${wp.lng}`)
      .join("|")
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_APIKEY}${
      waypoints ? `&waypoints=${waypoints}` : ""
    }`

    try {
      const res = await fetch(url)
      const data = await res.json()

      if (data.routes?.[0]?.overview_polyline?.points) {
        const decoded = polyline.decode(data.routes[0].overview_polyline.points)
        const coords = decoded.map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng,
        }))
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

  // Handle brightness when share modal is opened/closed
  useEffect(() => {
    const manageBrightness = async () => {
      try {
        if (shareModalVisible) {
          const currentBrightness = await Brightness.getBrightness()
          setOriginalBrightness(currentBrightness)
          await Brightness.setBrightness(1)
        } else if (originalBrightness !== null) {
          await Brightness.setBrightness(originalBrightness)
          setOriginalBrightness(null)
        }
      } catch (error) {
        console.error("Failed to manage screen brightness:", error)
      }
    }

    manageBrightness()
  }, [shareModalVisible])

  const handlePhotoUpload = () => {
    setPhotoUploadModalVisible(true)
  }

  const selectPhotoFromLibrary = () => {
    const options = {
      mediaType: "photo" as const,
    }

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      setPhotoUploadModalVisible(false)
      if (response.assets && response.assets[0]) {
        uploadPhoto(response.assets[0])
      }
    })
  }

  const takePhotoWithCamera = () => {
    const options = {
      mediaType: "photo" as const,
    }

    launchCamera(options, (response: ImagePickerResponse) => {
      setPhotoUploadModalVisible(false)
      if (response.assets && response.assets[0]) {
        uploadPhoto(response.assets[0])
      }
    })
  }

  const uploadPhoto = async (photo: any) => {
    try {
      setIsUploadingPhoto(true)
      const token = await AsyncStorage.getItem("token")
      const routeId = routeData._id || routeData.id

      const formData = new FormData()
      formData.append("photo", {
        uri: photo.uri,
        type: photo.type,
        name: photo.fileName || "route-photo.jpg",
      } as any)

      const response = await fetch(`${SERVER_URI}/api/routes/${routeId}/photos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      })

      if (response.ok) {
        Alert.alert("Success", "Photo uploaded successfully!")
        fetchRoutePhotos() // Refresh photos
      } else {
        throw new Error("Failed to upload photo")
      }
    } catch (error) {
      console.error("Error uploading photo:", error)
      Alert.alert("Error", "Failed to upload photo")
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const openPhotoViewer = (index: number) => {
    setSelectedPhotoIndex(index)
    setPhotoViewerVisible(true)
  }

  const handleCommentInputFocus = () => {
    setCommentInputFocused(true)
    // Small delay to ensure keyboard is showing
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 300)
  }

  const handleCommentInputBlur = () => {
    setCommentInputFocused(false)
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    try {
      setIsSubmittingComment(true)
      const token = await AsyncStorage.getItem("token")
      const routeId = routeData._id || routeData.id

      const response = await fetch(`${SERVER_URI}/api/routes/${routeId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: newComment }),
      })

      if (response.ok) {
        setNewComment("")
        commentInputRef.current?.blur()
        fetchRouteDetails() // Refresh comments
        Alert.alert("Success", "Comment posted successfully!")
      } else {
        throw new Error("Failed to post comment")
      }
    } catch (error) {
      console.error("Error posting comment:", error)
      Alert.alert("Error", "Failed to post comment")
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleFavorite = async () => {
    try {
      const token = await AsyncStorage.getItem("token")
      const routeId = routeData._id || routeData.id

      const response = await fetch(`${SERVER_URI}/api/routes/${routeId}/favorite`, {
        method: isFavorited ? "DELETE" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setIsFavorited(!isFavorited)
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      Alert.alert("Error", "Failed to update favorite status")
    }
  }

  const handleStartNavigation = async () => {
    try {
      setIsNavigating(true)
      const startPoint = routeData.waypoints[0]
      const endPoint = routeData.waypoints[routeData.waypoints.length - 1]

      // Try to open in Google Maps first
      const googleMapsUrl = `https://www.google.com/maps/dir/${startPoint.lat},${startPoint.lng}/${endPoint.lat},${endPoint.lng}`
      const appleMapsUrl = `http://maps.apple.com/?saddr=${startPoint.lat},${startPoint.lng}&daddr=${endPoint.lat},${endPoint.lng}`

      const canOpen = await Linking.canOpenURL(appleMapsUrl)
      if (canOpen) {
        await Linking.openURL(appleMapsUrl)
      } else {
        // Fallback to Apple Maps on iOS
        await Linking.openURL(googleMapsUrl)
      }
    } catch (error) {
      console.error("Error starting navigation:", error)
      Alert.alert("Error", "Failed to start navigation")
    } finally {
      setIsNavigating(false)
    }
  }

  const handleDownloadRoute = async () => {
    try {
      setIsDownloading(true)
      setDownloadProgress(0)

      const token = await AsyncStorage.getItem("token")
      const routeId = routeData._id || routeData.id

      // Simulate download progress
      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch(`${SERVER_URI}/api/routes/${routeId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const routeData = await response.json()
        // Store route data locally
        await AsyncStorage.setItem(`offline_route_${routeId}`, JSON.stringify(routeData))
        setDownloadProgress(100)

        setTimeout(() => {
          Alert.alert("Success", "Route downloaded for offline use")
          setIsDownloading(false)
          setDownloadProgress(0)
        }, 500)
      }
    } catch (error) {
      console.error("Error downloading route:", error)
      Alert.alert("Error", "Failed to download route")
      setIsDownloading(false)
      setDownloadProgress(0)
    }
  }

  const handleRating = async (rating: number) => {
    try {
      const token = await AsyncStorage.getItem("token")
      const routeId = routeData._id || routeData.id

      const response = await fetch(`${SERVER_URI}/api/routes/${routeId}/rate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      })

      if (response.ok) {
        setUserRating(rating)
        // Refresh ratings
        fetchRouteDetails()
      }
    } catch (error) {
      console.error("Error rating route:", error)
      Alert.alert("Error", "Failed to submit rating")
    }
  }

  const handleNativeShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out this route: ${routeData.name}\n${shareLink}`,
        url: shareLink,
        title: routeData.name,
      })
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

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

  const renderStars = (rating: number, onPress?: (rating: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => onPress?.(star)} disabled={!onPress}>
            <Star
              size={16}
              color={star <= rating ? "#FFD700" : "#666"}
              fill={star <= rating ? "#FFD700" : "transparent"}
            />
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  const renderPhotoItem = ({ item, index }: { item: RoutePhoto; index: number }) => (
    <TouchableOpacity style={styles.photoItem} onPress={() => openPhotoViewer(index)}>
      <Image source={{ uri: item.imageUrl }} style={styles.photoThumbnail} />
      <View style={styles.photoOverlay}>
        <Text style={styles.photoUsername}>{item.username}</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <Header
        title={routeData.name}
        showBackButton
        onBackPress={() => navigation.goBack()}
        rightIcon="menu"
        onRightPress={() => setMenuVisible(true)}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: keyboardHeight }}
      >
        {/* Map */}
        <View pointerEvents="none">
          <MapView
            ref={mapRef}
            style={styles.map}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            showsScale={false}
            showsBuildings={false}
            showsIndoors={false}
            toolbarEnabled={false}
            initialRegion={{
              latitude: routeData.waypoints?.[0]?.lat || 37.78825,
              longitude: routeData.waypoints?.[0]?.lng || -122.4324,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {/* Polyline */}
            {decodedPath.length > 0 && (
              <Polyline coordinates={decodedPath} strokeColor={PRIMARY_APP_COLOR} strokeWidth={4} />
            )}

            {/* Start marker */}
            {decodedPath.length > 0 && (
              <Marker coordinate={decodedPath[0]} anchor={{ x: 0.1, y: 0.8 }}>
                <Image
                  source={require("../src/img/icons/start.png")}
                  style={{ width: 30, height: 30, resizeMode: "contain" }}
                />
              </Marker>
            )}

            {/* End marker */}
            {decodedPath.length > 1 && (
              <Marker coordinate={decodedPath[decodedPath.length - 1]} anchor={{ x: 0.1, y: 0.8 }}>
                <Image
                  source={require("../src/img/icons/end.png")}
                  style={{ width: 30, height: 30, resizeMode: "contain" }}
                />
              </Marker>
            )}
          </MapView>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleStartNavigation}
            disabled={isNavigating}
          >
            {isNavigating ? <ActivityIndicator color="white" size="small" /> : <Navigation color="white" size={20} />}
            <Text style={styles.actionButtonText}>{isNavigating ? "Starting..." : "Navigate"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleFavorite}>
            {isFavorited ? (
              <Heart color={PRIMARY_APP_COLOR} size={20} fill={PRIMARY_APP_COLOR} />
            ) : (
              <HeartOff color="white" size={20} />
            )}
            <Text style={styles.actionButtonText}>{isFavorited ? "Favorited" : "Favorite"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleDownloadRoute} disabled={isDownloading}>
            {isDownloading ? (
              <View style={styles.downloadProgress}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.progressText}>{downloadProgress}%</Text>
              </View>
            ) : (
              <>
                <Download color="white" size={20} />
                <Text style={styles.actionButtonText}>Download</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Route Stats */}
        {routeStats && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Route Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <MapPin color={PRIMARY_APP_COLOR} size={20} />
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>{routeStats.totalDistance}</Text>
              </View>
              <View style={styles.statItem}>
                <Clock color={PRIMARY_APP_COLOR} size={20} />
                <Text style={styles.statLabel}>Est. Time</Text>
                <Text style={styles.statValue}>{routeStats.estimatedTime}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>⛰️</Text>
                <Text style={styles.statLabel}>Elevation</Text>
                <Text style={styles.statValue}>{routeStats.elevationGain}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>📊</Text>
                <Text style={styles.statLabel}>Difficulty</Text>
                <Text style={styles.statValue}>{routeStats.difficulty}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Route Details */}
        <View style={styles.details}>
          <Text style={styles.sectionTitle}>Route Details</Text>
          <Text style={styles.detailText}>Description: {routeData.description || "—"}</Text>
          <Text style={styles.detailText}>Distance: {routeData.distance || "—"}</Text>
          <Text style={styles.detailText}>Start: {routeData.waypoints?.[0]?.label || "—"}</Text>
          <Text style={styles.detailText}>
            End: {routeData.waypoints?.[routeData.waypoints.length - 1]?.label || "—"}
          </Text>
          <View style={styles.ratingRow}>
            <Star size={16} color="#FFD700" fill="#FFD700" />
            <Text style={styles.ratingText}>
              {totalRatings > 0 ? `${averageRating.toFixed(1)} (${totalRatings} reviews)` : "No reviews"}
            </Text>
          </View>
        </View>

        {/* User Rating Section - Only show if user wants to rate */}
        <View style={styles.userRatingSection}>
          <Text style={styles.ratingLabel}>Rate this route:</Text>
          {renderStars(userRating, handleRating)}
        </View>

        {/* Photo Upload Section */}
        <View style={styles.photoUploadSection}>
          <View style={styles.photoUploadHeader}>
            <Text style={styles.sectionTitle}>Share a Photo</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={handlePhotoUpload} disabled={isUploadingPhoto}>
              {isUploadingPhoto ? <ActivityIndicator color="white" size="small" /> : <Plus color="white" size={20} />}
              <Text style={styles.uploadButtonText}>{isUploadingPhoto ? "Uploading..." : "Add Photo"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Route Photos */}
        {routePhotos.length > 0 && (
          <View style={styles.photosSection}>
            <Text style={styles.sectionTitle}>Photos ({routePhotos.length})</Text>
            <FlatList
              data={routePhotos}
              renderItem={renderPhotoItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosList}
            />
          </View>
        )}

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <TouchableOpacity style={styles.commentsHeader} onPress={() => setCommentsVisible(!commentsVisible)}>
            <MessageCircle color="white" size={20} />
            <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>
          </TouchableOpacity>

          {commentsVisible && (
            <View style={styles.commentsContainer}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Text style={styles.commentUser}>{comment.username}</Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  <Text style={styles.commentDate}>{new Date(comment.createdAt).toLocaleDateString()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Add Comment Section */}
        <View style={styles.addCommentSection}>
          <Text style={styles.sectionTitle}>Add a Comment</Text>
          <View style={styles.commentInputContainer}>
            <TextInput
              ref={commentInputRef}
              style={styles.commentInput}
              placeholder="Share your thoughts about this route..."
              placeholderTextColor="#666"
              value={newComment}
              onChangeText={setNewComment}
              onFocus={handleCommentInputFocus}
              onBlur={handleCommentInputBlur}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.submitCommentButton, !newComment.trim() && styles.submitCommentButtonDisabled]}
              onPress={handleSubmitComment}
              disabled={!newComment.trim() || isSubmittingComment}
            >
              {isSubmittingComment ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Send color="white" size={20} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.characterCount}>{newComment.length}/500</Text>
        </View>
      </ScrollView>

      {/* Photo Upload Modal */}
      <SlideUpModal visible={photoUploadModalVisible} onClose={() => setPhotoUploadModalVisible(false)}>
        <Text style={slideUpModalStyles.modalTitle}>Add Photo</Text>

        <TouchableOpacity style={slideUpModalStyles.modalOption} onPress={takePhotoWithCamera}>
          <Camera color="white" size={24} />
          <Text style={slideUpModalStyles.modalOptionText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={slideUpModalStyles.modalOption} onPress={selectPhotoFromLibrary}>
          <ImageIcon color="white" size={24} />
          <Text style={slideUpModalStyles.modalOptionText}>Choose from Library</Text>
        </TouchableOpacity>

        <TouchableOpacity style={slideUpModalStyles.modalCancelButton} onPress={() => setPhotoUploadModalVisible(false)}>
          <Text style={slideUpModalStyles.modalCancelText}>Cancel</Text>
        </TouchableOpacity>
      </SlideUpModal>

      {/* Photo Viewer Modal */}
      <Modal visible={photoViewerVisible} animationType="fade">
        <View style={styles.photoViewerContainer}>
          <TouchableOpacity style={styles.photoViewerClose} onPress={() => setPhotoViewerVisible(false)}>
            <X color="white" size={30} />
          </TouchableOpacity>

          {routePhotos[selectedPhotoIndex] && (
            <View style={styles.photoViewerContent}>
              <Image
                source={{ uri: routePhotos[selectedPhotoIndex].imageUrl }}
                style={styles.fullScreenPhoto}
                resizeMode="contain"
              />
              <View style={styles.photoViewerInfo}>
                <Text style={styles.photoViewerUsername}>{routePhotos[selectedPhotoIndex].username}</Text>
                <Text style={styles.photoViewerDate}>
                  {new Date(routePhotos[selectedPhotoIndex].createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* 3-Dots Menu */}
      <SlideUpModal visible={menuVisible} onClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={slideUpModalStyles.modalOption} onPress={handleShare}>
          <Text style={slideUpModalStyles.modalOptionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={slideUpModalStyles.modalOption} onPress={handleNativeShare}>
          <Text style={slideUpModalStyles.modalOptionText}>Share via...</Text>
        </TouchableOpacity>

        {(isCreator || isCollaborator) && (
          <TouchableOpacity style={slideUpModalStyles.modalOption} onPress={handleEdit}>
            <Text style={slideUpModalStyles.modalOptionText}>Edit</Text>
          </TouchableOpacity>
        )}

        {isCreator && (
          <>
            <TouchableOpacity
              style={slideUpModalStyles.modalOption}
              onPress={() => {
                setMenuVisible(false)
                setCollaboratorsModalVisible(true)
              }}
            >
              <Text style={slideUpModalStyles.modalOptionText}>Manage Collaborators</Text>
            </TouchableOpacity>

            <TouchableOpacity style={slideUpModalStyles.modalOption} onPress={handleDelete} disabled={isDeleting}>
              <Text style={[slideUpModalStyles.modalOptionText, { color: "#ff4444" }]}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={slideUpModalStyles.modalCancelButton} onPress={() => setMenuVisible(false)}>
          <Text style={slideUpModalStyles.modalCancelText}>Cancel</Text>
        </TouchableOpacity>
      </SlideUpModal>

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

      {/* Collaborators Modal */}
      <SlideUpModal visible={collaboratorsModalVisible} onClose={() => setCollaboratorsModalVisible(false)}>
        <Text style={slideUpModalStyles.modalTitle}>Collaborators</Text>

        <ScrollView style={styles.collaboratorsList}>
          {collaborators.map((collaborator) => (
            <View key={collaborator.id} style={styles.collaboratorItem}>
              <View style={styles.collaboratorInfo}>
                <Text style={styles.collaboratorName}>{collaborator.username}</Text>
                <Text style={styles.collaboratorEmail}>{collaborator.email}</Text>
              </View>
              <TouchableOpacity style={styles.removeButton}>
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.addCollaboratorButton}>
          <Users color="white" size={20} />
          <Text style={styles.addCollaboratorText}>Add Collaborator</Text>
        </TouchableOpacity>

        <TouchableOpacity style={slideUpModalStyles.modalCancelButton} onPress={() => setCollaboratorsModalVisible(false)}>
          <Text style={slideUpModalStyles.modalCancelText}>Close</Text>
        </TouchableOpacity>
      </SlideUpModal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={PRIMARY_APP_COLOR} />
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  scrollView: {
    flex: 1,
  },
  map: {
    height: 250,
    width: "100%",
  },
  actionButtons: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a2a2a",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: PRIMARY_APP_COLOR,
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  downloadProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressText: {
    color: "white",
    fontSize: 12,
  },
  statsContainer: {
    padding: 16,
    backgroundColor: "#121212",
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    padding: 16,
    borderRadius: 8,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statLabel: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 4,
  },
  statValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 2,
  },
  details: {
    padding: 16,
    backgroundColor: "#121212",
  },
  detailText: {
    color: "white",
    fontSize: 16,
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  ratingText: {
    color: "white",
    fontSize: 16,
  },
  userRatingSection: {
    padding: 16,
    backgroundColor: "#121212",
    alignItems: "flex-start",
  },
  ratingLabel: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 4,
  },
  photoUploadSection: {
    padding: 16,
    backgroundColor: "#121212",
  },
  photoUploadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY_APP_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  photosSection: {
    padding: 16,
    backgroundColor: "#121212",
  },
  photosList: {
    paddingRight: 16,
  },
  photoItem: {
    marginRight: 12,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  photoThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  photoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 8,
  },
  photoUsername: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  commentsSection: {
    padding: 16,
    backgroundColor: "#121212",
  },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  commentsContainer: {
    marginTop: 12,
    gap: 12,
  },
  commentItem: {
    backgroundColor: "#2a2a2a",
    padding: 12,
    borderRadius: 8,
  },
  commentUser: {
    color: PRIMARY_APP_COLOR,
    fontSize: 14,
    fontWeight: "bold",
  },
  commentText: {
    color: "white",
    fontSize: 14,
    marginTop: 4,
  },
  commentDate: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 4,
  },
  addCommentSection: {
    padding: 16,
    backgroundColor: "#121212",
    marginBottom: 20,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "white",
    fontSize: 16,
    maxHeight: 100,
    textAlignVertical: "top",
  },
  submitCommentButton: {
    backgroundColor: PRIMARY_APP_COLOR,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  submitCommentButtonDisabled: {
    backgroundColor: "#666",
  },
  characterCount: {
    color: "#666",
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  photoViewerContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  photoViewerClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
  photoViewerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  fullScreenPhoto: {
    width: width,
    height: height * 0.8,
  },
  photoViewerInfo: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 16,
    borderRadius: 8,
  },
  photoViewerUsername: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  photoViewerDate: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 4,
  },
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
  collaboratorsList: {
    maxHeight: height * 0.4,
    marginBottom: 20,
  },
  collaboratorItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  collaboratorInfo: {
    flex: 1,
  },
  collaboratorName: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  collaboratorEmail: {
    color: "#aaa",
    fontSize: 14,
  },
  removeButton: {
    backgroundColor: "#ff4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  addCollaboratorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY_APP_COLOR,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  addCollaboratorText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
})

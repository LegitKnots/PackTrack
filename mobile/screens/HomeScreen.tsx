"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { View, Text, Dimensions, TouchableOpacity, ScrollView, RefreshControl, Animated, Modal } from "react-native"

import { styles } from "../styles/HomeScreen.styles"

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import type { NavigationProp } from "@react-navigation/native"
import { useAuth } from "../context/AuthContext"
import { SERVER_URI } from "../config"

const { width } = Dimensions.get("window")

// Type definitions
interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  color?: string
  loading?: boolean
}

interface UpcomingRide {
  id: string
  destination: string
  time: string
  pack: string
  packId: string
  routeId?: string
}

interface RecentActivity {
  id: string
  action: string
  pack: string
  time: string
  type: "join" | "leave" | "message" | "route" | "location"
}

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  data: any
  read: boolean
  createdAt: any
  updatedAt?: any
}

interface NotificationResponse {
  notifications: Notification[]
  pagination: {
    total: number
    unread: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

interface Pack {
  id: string
  name: string
  description: string
  members: string[]
  routes: any[]
}

interface Route {
  id: string
  name: string
  distance?: string
  packId?: string
}

interface CustomModalProps {
  visible: boolean
  title: string
  message: string
  buttons: Array<{
    text: string
    onPress: () => void
    style?: "default" | "cancel" | "destructive"
  }>
  onClose: () => void
}

interface DashboardData {
  activePacks: number
  totalRoutes: number
  milesThisWeek: number
  upcomingRides: UpcomingRide[]
  recentActivity: RecentActivity[]
  notifications: Notification[]
  notificationPagination: {
    total: number
    unread: number
    hasMore: boolean
  }
  weather: {
    temp: number
    condition: string
    icon: string
    humidity: number
    windSpeed: number
    feelsLike: number
    precipitation: number
  }
}

const CustomModal: React.FC<CustomModalProps> = ({ visible, title, message, buttons, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalButtonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalButton,
                  button.style === "destructive"
                    ? styles.modalButtonDestructive
                    : button.style === "cancel"
                      ? styles.modalButtonSecondary
                      : styles.modalButtonPrimary,
                ]}
                onPress={() => {
                  button.onPress()
                  onClose()
                }}
              >
                <Text style={styles.modalButtonText}>{button.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NavigationProp<any>>()
  const { user, token } = useAuth()
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [notificationsLoading, setNotificationsLoading] = useState<boolean>(false)
  const [fadeAnim] = useState(new Animated.Value(0))

  // Custom modal state
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [modalConfig, setModalConfig] = useState<{
    title: string
    message: string
    buttons: Array<{
      text: string
      onPress: () => void
      style?: "default" | "cancel" | "destructive"
    }>
  }>({
    title: "",
    message: "",
    buttons: [],
  })

  // Dashboard data states
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    activePacks: 0,
    totalRoutes: 0,
    milesThisWeek: 0,
    upcomingRides: [],
    recentActivity: [],
    notifications: [],
    notificationPagination: {
      total: 0,
      unread: 0,
      hasMore: false,
    },
    weather: {
      temp: 0,
      condition: "Loading...",
      icon: "⏳",
      humidity: 0,
      windSpeed: 0,
      feelsLike: 0,
      precipitation: 0,
    },
  })

  const showCustomAlert = (
    title: string,
    message: string,
    buttons: Array<{
      text: string
      onPress: () => void
      style?: "default" | "cancel" | "destructive"
    }>,
  ) => {
    setModalConfig({ title, message, buttons })
    setModalVisible(true)
  }

  const fetchWeatherData = async () => {
    try {
      // Using a free weather API (OpenWeatherMap or similar)
      // You'll need to add your weather API key to your config
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=San Francisco&appid=YOUR_API_KEY&units=imperial`,
      )

      if (response.ok) {
        const data = await response.json()
        return {
          temp: Math.round(data.main.temp),
          condition: data.weather[0].main,
          icon: getWeatherIcon(data.weather[0].main),
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed),
          feelsLike: Math.round(data.main.feels_like),
          precipitation: data.rain ? Math.round(data.rain["1h"] || 0) : 0,
        }
      }
    } catch (error) {
      console.error("Weather fetch error:", error)
    }

    // Fallback to current time-based weather
    const hour = new Date().getHours()
    return {
      temp: 72,
      condition: hour > 6 && hour < 18 ? "Sunny" : "Clear",
      icon: hour > 6 && hour < 18 ? "☀️" : "🌙",
      humidity: 65,
      windSpeed: 8,
      feelsLike: 75,
      precipitation: 0,
    }
  }

  const getWeatherIcon = (condition: string): string => {
    const icons: { [key: string]: string } = {
      Clear: "☀️",
      Clouds: "☁️",
      Rain: "🌧️",
      Snow: "❄️",
      Thunderstorm: "⛈️",
      Drizzle: "🌦️",
      Mist: "🌫️",
      Fog: "🌫️",
    }
    return icons[condition] || "☀️"
  }

  const fetchUserPacks = async (): Promise<Pack[]> => {
    if (!user || !token) return []

    try {
      const response = await fetch(`${SERVER_URI}/api/users/${user.id}/packs`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data.packs || []
      }
    } catch (error) {
      console.error("Error fetching user packs:", error)
    }
    return []
  }

  const fetchUserRoutes = async (): Promise<Route[]> => {
    if (!user || !token) return []

    try {
      const response = await fetch(`${SERVER_URI}/api/users/${user.id}/routes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data.routes || []
      }
    } catch (error) {
      console.error("Error fetching user routes:", error)
    }
    return []
  }

  const fetchNotifications = async (limit = 10, offset = 0): Promise<NotificationResponse> => {
    if (!user || !token) {
      return {
        notifications: [],
        pagination: { total: 0, unread: 0, limit, offset, hasMore: false },
      }
    }

    try {
      const response = await fetch(`${SERVER_URI}/api/users/${user.id}/notifications?limit=${limit}&offset=${offset}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data: NotificationResponse = await response.json()
        return data
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }

    return {
      notifications: [],
      pagination: { total: 0, unread: 0, limit, offset, hasMore: false },
    }
  }

  const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
    if (!user || !token) return false

    try {
      const response = await fetch(`${SERVER_URI}/api/users/${user.id}/notifications/${notificationId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ read: true }),
      })

      if (response.ok) {
        // Update local state
        setDashboardData((prev) => ({
          ...prev,
          notifications: prev.notifications.map((notif) =>
            notif.id === notificationId ? { ...notif, read: true } : notif,
          ),
          notificationPagination: {
            ...prev.notificationPagination,
            unread: Math.max(0, prev.notificationPagination.unread - 1),
          },
        }))
        return true
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
    return false
  }

  const markAllNotificationsAsRead = async (): Promise<boolean> => {
    if (!user || !token) return false

    try {
      setNotificationsLoading(true)
      const response = await fetch(`${SERVER_URI}/api/users/${user.id}/notifications/mark-all-read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()

        // Update local state
        setDashboardData((prev) => ({
          ...prev,
          notifications: prev.notifications.map((notif) => ({ ...notif, read: true })),
          notificationPagination: {
            ...prev.notificationPagination,
            unread: 0,
          },
        }))

        showCustomAlert("Success", `${result.updatedCount} notifications marked as read`, [
          { text: "OK", onPress: () => {} },
        ])
        return true
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      showCustomAlert("Error", "Failed to mark notifications as read", [{ text: "OK", onPress: () => {} }])
    } finally {
      setNotificationsLoading(false)
    }
    return false
  }

  const deleteNotification = async (notificationId: string): Promise<boolean> => {
    if (!user || !token) return false

    try {
      const response = await fetch(`${SERVER_URI}/api/users/${user.id}/notifications/${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Update local state
        setDashboardData((prev) => {
          const deletedNotification = prev.notifications.find((n) => n.id === notificationId)
          const wasUnread = deletedNotification && !deletedNotification.read

          return {
            ...prev,
            notifications: prev.notifications.filter((notif) => notif.id !== notificationId),
            notificationPagination: {
              ...prev.notificationPagination,
              total: Math.max(0, prev.notificationPagination.total - 1),
              unread: wasUnread
                ? Math.max(0, prev.notificationPagination.unread - 1)
                : prev.notificationPagination.unread,
            },
          }
        })
        return true
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
    return false
  }

  const deleteAllNotifications = async (readOnly = false): Promise<boolean> => {
    if (!user || !token) return false

    try {
      setNotificationsLoading(true)
      const response = await fetch(
        `${SERVER_URI}/api/users/${user.id}/notifications${readOnly ? "?readOnly=true" : ""}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (response.ok) {
        const result = await response.json()

        // Update local state
        setDashboardData((prev) => ({
          ...prev,
          notifications: readOnly ? prev.notifications.filter((n) => !n.read) : [],
          notificationPagination: {
            total: readOnly ? prev.notificationPagination.unread : 0,
            unread: readOnly ? prev.notificationPagination.unread : 0,
            hasMore: false,
          },
        }))

        showCustomAlert("Success", `${result.deletedCount} notifications deleted`, [{ text: "OK", onPress: () => {} }])
        return true
      }
    } catch (error) {
      console.error("Error deleting notifications:", error)
      showCustomAlert("Error", "Failed to delete notifications", [{ text: "OK", onPress: () => {} }])
    } finally {
      setNotificationsLoading(false)
    }
    return false
  }

  const loadMoreNotifications = async (): Promise<void> => {
    if (!dashboardData.notificationPagination.hasMore || notificationsLoading) return

    try {
      setNotificationsLoading(true)
      const response = await fetchNotifications(10, dashboardData.notifications.length)

      setDashboardData((prev) => ({
        ...prev,
        notifications: [...prev.notifications, ...response.notifications],
        notificationPagination: response.pagination,
      }))
    } catch (error) {
      console.error("Error loading more notifications:", error)
    } finally {
      setNotificationsLoading(false)
    }
  }

  const generateRecentActivity = (packs: Pack[], routes: Route[]): RecentActivity[] => {
    const activities: RecentActivity[] = []

    // Add recent pack joins (last 3 packs)
    packs.slice(-3).forEach((pack, index) => {
      activities.push({
        id: `pack-${pack.id}`,
        action: "Joined",
        pack: pack.name,
        time: `${index + 1}d ago`,
        type: "join",
      })
    })

    // Add recent routes (last 2 routes)
    routes.slice(-2).forEach((route, index) => {
      activities.push({
        id: `route-${route.id}`,
        action: "Created route",
        pack: route.name,
        time: `${index + 2}h ago`,
        type: "route",
      })
    })

    return activities.slice(0, 5) // Limit to 5 activities
  }

  const calculateStats = (packs: Pack[], routes: Route[]) => {
    // Calculate estimated miles (rough calculation based on routes)
    const estimatedMiles = routes.length * 15 // Assume average 15 miles per route

    return {
      milesThisWeek: Math.round(estimatedMiles * 0.3), // Rough weekly estimate
    }
  }

  const loadDashboardData = useCallback(async () => {
    if (!user || !token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Fetch all data in parallel
      const [packs, routes, notificationResponse, weather] = await Promise.all([
        fetchUserPacks(),
        fetchUserRoutes(),
        fetchNotifications(10, 0),
        fetchWeatherData(),
      ])

      const stats = calculateStats(packs, routes)
      const recentActivity = generateRecentActivity(packs, routes)

      // Generate upcoming rides from packs (simplified)
      const upcomingRides: UpcomingRide[] = packs.slice(0, 3).map((pack, index) => ({
        id: `ride-${pack.id}`,
        destination: `${pack.name} Meetup`,
        time: `${2 + index}:00 PM`,
        pack: pack.name,
        packId: pack.id,
      }))

      setDashboardData({
        activePacks: packs.length,
        totalRoutes: routes.length,
        milesThisWeek: stats.milesThisWeek,
        upcomingRides,
        recentActivity,
        notifications: notificationResponse.notifications,
        notificationPagination: notificationResponse.pagination,
        weather,
      })

      // Animate dashboard entrance
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start()
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      showCustomAlert("Error", "Failed to load dashboard data. Please try again.", [{ text: "OK", onPress: () => {} }])
    } finally {
      setLoading(false)
    }
  }, [user, token, fadeAnim])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const greeting = (): string => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, color = "#f3631a", loading = false }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{loading ? "..." : value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  )

  const handleRidePress = (ride: UpcomingRide) => {
    ;(navigation as any).navigate("PackDetails", { packId: ride.packId })
  }

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markNotificationAsRead(notification.id)
    }

    // Navigate based on notification type
    try {
      const data = JSON.parse(notification.data)
      if (data.packId) {
        ;(navigation as any).navigate("PackDetails", { packId: data.packId })
      } else if (data.routeId) {
        ;(navigation as any).navigate("RouteDetails", { routeId: data.routeId })
      }
    } catch (error) {
      console.error("Error parsing notification data:", error)
    }
  }

  const handleNotificationLongPress = (notification: Notification) => {
    showCustomAlert("Notification Options", "What would you like to do with this notification?", [
      { text: "Cancel", onPress: () => {}, style: "cancel" },
      {
        text: notification.read ? "Mark as Unread" : "Mark as Read",
        onPress: () => markNotificationAsRead(notification.id),
      },
      {
        text: "Delete",
        onPress: () => deleteNotification(notification.id),
        style: "destructive",
      },
    ])
  }

  const handleNotificationMenuPress = () => {
    const hasUnread = dashboardData.notificationPagination.unread > 0
    const hasRead = dashboardData.notifications.some((n) => n.read)

    showCustomAlert("Notification Actions", "Choose an action for your notifications", [
      { text: "Cancel", onPress: () => {}, style: "cancel" },
      ...(hasUnread
        ? [
            {
              text: "Mark All Read",
              onPress: markAllNotificationsAsRead,
            },
          ]
        : []),
      ...(hasRead
        ? [
            {
              text: "Delete Read",
              onPress: () => deleteAllNotifications(true),
              style: "destructive" as const,
            },
          ]
        : []),
      {
        text: "Delete All",
        onPress: () => {
          showCustomAlert(
            "Confirm Delete All",
            "Are you sure you want to delete all notifications? This cannot be undone.",
            [
              { text: "Cancel", onPress: () => {}, style: "cancel" },
              {
                text: "Delete All",
                onPress: () => deleteAllNotifications(false),
                style: "destructive",
              },
            ],
          )
        },
        style: "destructive" as const,
      },
    ])
  }

  const getNotificationIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
      pack_invite: "👥",
      route_update: "🗺️",
      message: "💬",
      location_update: "📍",
      pack_join: "🎉",
      default: "🔔",
    }
    return icons[type] || icons.default
  }

  const formatNotificationTime = (createdAt: any): string => {
    try {
      const date = new Date(createdAt.seconds ? createdAt.seconds * 1000 : createdAt)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString()
    } catch (error) {
      return "Recently"
    }
  }

  const allNotifications = dashboardData.notifications
  const unreadCount = dashboardData.notificationPagination.unread

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Please log in to view your dashboard</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f3631a" />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.greeting}>
              {greeting()}, <Text style={styles.name}>{user.fullname || user.email}</Text>
            </Text>
            <Text style={styles.subtitle}>Ready for your next adventure?</Text>
          </View>

          {/* Weather Section - Enhanced */}
          <View style={styles.weatherSection}>
            <View style={styles.weatherMain}>
              <Text style={styles.weatherIconLarge}>{dashboardData.weather.icon}</Text>
              <View style={styles.weatherInfo}>
                <Text style={styles.weatherTempLarge}>{dashboardData.weather.temp}°F</Text>
                <Text style={styles.weatherConditionLarge}>{dashboardData.weather.condition}</Text>
              </View>
            </View>
            <View style={styles.weatherDetails}>
              <View style={styles.weatherDetailItem}>
                <Text style={styles.weatherDetailIcon}>💧</Text>
                <Text style={styles.weatherDetailLabel}>Humidity</Text>
                <Text style={styles.weatherDetailValue}>{dashboardData.weather.humidity}%</Text>
              </View>
              <View style={styles.weatherDetailItem}>
                <Text style={styles.weatherDetailIcon}>💨</Text>
                <Text style={styles.weatherDetailLabel}>Wind</Text>
                <Text style={styles.weatherDetailValue}>{dashboardData.weather.windSpeed} mph</Text>
              </View>
              <View style={styles.weatherDetailItem}>
                <Text style={styles.weatherDetailIcon}>🌧️</Text>
                <Text style={styles.weatherDetailLabel}>Rain</Text>
                <Text style={styles.weatherDetailValue}>{dashboardData.weather.precipitation}%</Text>
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <StatCard
              title="Active Packs"
              value={dashboardData.activePacks}
              subtitle="Currently joined"
              color="#4CAF50"
              loading={loading}
            />
            <StatCard
              title="Miles This Week"
              value={dashboardData.milesThisWeek}
              subtitle={dashboardData.milesThisWeek > 100 ? "Great job!" : "Keep going!"}
              color="#2196F3"
              loading={loading}
            />
          </View>

          {/* Upcoming Rides - Moved above notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Activities</Text>
            {dashboardData.upcomingRides.length > 0 ? (
              dashboardData.upcomingRides.map((ride) => (
                <TouchableOpacity key={ride.id} style={styles.rideCard} onPress={() => handleRidePress(ride)}>
                  <View style={styles.rideInfo}>
                    <Text style={styles.rideDestination}>{ride.destination}</Text>
                    <Text style={styles.ridePack}>with {ride.pack}</Text>
                  </View>
                  <View style={styles.rideTime}>
                    <Text style={styles.rideTimeText}>{ride.time}</Text>
                    <Text style={styles.rideArrow}>→</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📅</Text>
                <Text style={styles.emptyStateText}>No upcoming activities</Text>
                <Text style={styles.emptyStateSubtext}>Join a pack to get started!</Text>
              </View>
            )}
          </View>

          {/* Notifications Section - Moved below upcoming activities */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Notifications {unreadCount > 0 && `(${unreadCount})`}</Text>
              <TouchableOpacity onPress={handleNotificationMenuPress} style={styles.markAllReadButton}>
                <Text style={styles.markAllReadText}>⋯</Text>
              </TouchableOpacity>
            </View>

            {allNotifications.length > 0 ? (
              <>
                {allNotifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[styles.notificationCard, !notification.read && styles.notificationCardUnread]}
                    onPress={() => handleNotificationPress(notification)}
                    onLongPress={() => handleNotificationLongPress(notification)}
                  >
                    <View style={styles.notificationIcon}>
                      <Text style={styles.notificationIconText}>{getNotificationIcon(notification.type)}</Text>
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      <Text style={styles.notificationText} numberOfLines={2}>
                        {typeof notification.data === "string" ? notification.data : JSON.stringify(notification.data)}
                      </Text>
                      <Text style={styles.notificationTime}>{formatNotificationTime(notification.createdAt)}</Text>
                    </View>
                    {!notification.read && <View style={styles.notificationIndicator} />}
                  </TouchableOpacity>
                ))}

                {dashboardData.notificationPagination.hasMore && (
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={loadMoreNotifications}
                    disabled={notificationsLoading}
                  >
                    <Text style={styles.viewAllText}>
                      {notificationsLoading
                        ? "Loading..."
                        : `Load more (${dashboardData.notificationPagination.total - allNotifications.length} remaining)`}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🔔</Text>
                <Text style={styles.emptyStateText}>No notifications</Text>
                <Text style={styles.emptyStateSubtext}>You're all caught up!</Text>
              </View>
            )}
          </View>

          {/* Recent Activity */}
          {dashboardData.recentActivity.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {dashboardData.recentActivity.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={styles.activityDot} />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>
                      <Text style={styles.activityAction}>{activity.action}</Text>{" "}
                      <Text style={styles.activityPack}>{activity.pack}</Text>
                    </Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Custom Modal */}
      <CustomModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        buttons={modalConfig.buttons}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  )
}

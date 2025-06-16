"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Switch,
} from "react-native"
import { styles } from "../styles/EditRoute.styles"
import { useNavigation, useRoute } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { SafeAreaView } from "react-native-safe-area-context"
import { SERVER_URI, GOOGLE_MAPS_APIKEY, PRIMARY_APP_COLOR } from "../config"
import type { EditRouteRouteProp } from "../types/navigation"
import Header from "../components/Header"
import { Plus, X, MapPin, Navigation, Flag } from "lucide-react-native"

interface Waypoint {
  label: string
  lat: number
  lng: number
  order: number
}

export default function EditRoute() {
  const navigation = useNavigation()
  const route = useRoute<EditRouteRouteProp>()
  const routeData = route.params.route

  const [name, setName] = useState(routeData.name || "")
  const [description, setDescription] = useState(routeData.description || "")
  const [visibility, setVisibility] = useState(routeData.visibility || "private")
  const [loading, setLoading] = useState(false)
  const [showSearchType, setShowSearchType] = useState<"start" | "waypoint" | "end" | number | null>(null)
  const [startPoint, setStartPoint] = useState(routeData.waypoints?.[0] || null)
  const [endPoint, setEndPoint] = useState(routeData.waypoints?.[routeData.waypoints.length - 1] || null)
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // Waypoints state (excluding start and end)
  const [waypoints, setWaypoints] = useState<Waypoint[]>(routeData.waypoints?.slice(1, -1) || [])

  // Input mode state
  const [inputMode, setInputMode] = useState<"search" | "coordinates">("search")
  const [startLat, setStartLat] = useState(routeData.waypoints?.[0]?.lat?.toString() || "")
  const [startLng, setStartLng] = useState(routeData.waypoints?.[0]?.lng?.toString() || "")
  const [endLat, setEndLat] = useState(routeData.waypoints?.[routeData.waypoints.length - 1]?.lat?.toString() || "")
  const [endLng, setEndLng] = useState(routeData.waypoints?.[routeData.waypoints.length - 1]?.lng?.toString() || "")
  const [startLabel, setStartLabel] = useState(routeData.waypoints?.[0]?.label || "Start Point")
  const [endLabel, setEndLabel] = useState(routeData.waypoints?.[routeData.waypoints.length - 1]?.label || "End Point")

  // Waypoint coordinate states
  const [waypointCoords, setWaypointCoords] = useState<{ [key: number]: { lat: string; lng: string; label: string } }>(
    {},
  )

  // Waypoint name states for search mode
  const [waypointNames, setWaypointNames] = useState<{ [key: number]: string }>({})

  // Initialize waypoint coordinates and names
  useEffect(() => {
    const coords: { [key: number]: { lat: string; lng: string; label: string } } = {}
    const names: { [key: number]: string } = {}
    waypoints.forEach((wp, index) => {
      coords[index] = {
        lat: wp.lat.toString(),
        lng: wp.lng.toString(),
        label: wp.label,
      }
      names[index] = wp.label
    })
    setWaypointCoords(coords)
    setWaypointNames(names)
  }, [])

  const toggleInputMode = () => {
    if (inputMode === "search") {
      setStartLat(startPoint?.lat?.toString() || "")
      setStartLng(startPoint?.lng?.toString() || "")
      setEndLat(endPoint?.lat?.toString() || "")
      setEndLng(endPoint?.lng?.toString() || "")
      setStartLabel(startPoint?.label || "Start Point")
      setEndLabel(endPoint?.label || "End Point")

      const coords: { [key: number]: { lat: string; lng: string; label: string } } = {}
      waypoints.forEach((wp, index) => {
        coords[index] = {
          lat: wp.lat.toString(),
          lng: wp.lng.toString(),
          label: wp.label,
        }
      })
      setWaypointCoords(coords)
      setInputMode("coordinates")
    } else {
      setInputMode("search")
    }
  }

  const addWaypoint = () => {
    const newWaypoint: Waypoint = {
      label: `Waypoint ${waypoints.length + 1}`,
      lat: 0,
      lng: 0,
      order: waypoints.length + 1,
    }
    setWaypoints([...waypoints, newWaypoint])

    setWaypointCoords((prev) => ({
      ...prev,
      [waypoints.length]: {
        lat: "",
        lng: "",
        label: `Waypoint ${waypoints.length + 1}`,
      },
    }))

    setWaypointNames((prev) => ({
      ...prev,
      [waypoints.length]: `Waypoint ${waypoints.length + 1}`,
    }))
  }

  const removeWaypoint = (index: number) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index)
    setWaypoints(newWaypoints)

    const newCoords: { [key: number]: { lat: string; lng: string; label: string } } = {}
    const newNames: { [key: number]: string } = {}
    newWaypoints.forEach((wp, i) => {
      if (waypointCoords[i < index ? i : i + 1]) {
        newCoords[i] = waypointCoords[i < index ? i : i + 1]
      }
      if (waypointNames[i < index ? i : i + 1]) {
        newNames[i] = waypointNames[i < index ? i : i + 1]
      }
    })
    setWaypointCoords(newCoords)
    setWaypointNames(newNames)
  }

  const updateWaypointCoord = (index: number, field: "lat" | "lng" | "label", value: string) => {
    setWaypointCoords((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value,
      },
    }))
  }

  const updateWaypointName = (index: number, name: string) => {
    setWaypointNames((prev) => ({
      ...prev,
      [index]: name,
    }))
  }

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setLoadingSuggestions(false)
      return
    }

    setLoadingSuggestions(true)
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            query,
          )}&key=${GOOGLE_MAPS_APIKEY}&sessiontoken=${Date.now()}&components=country:us`,
        )
        const json = await res.json()
        setSuggestions(json.predictions || [])
      } catch (err) {
        console.error("Places fetch failed:", err)
        setSuggestions([])
      } finally {
        setLoadingSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [query])

  const handleSelect = async (placeId: string, fallbackLabel: string) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_APIKEY}&sessiontoken=${Date.now()}`,
      )
      const json = await res.json()
      const details = json.result

      if (details?.geometry?.location) {
        const point = {
          label: details.name || fallbackLabel,
          lat: details.geometry.location.lat,
          lng: details.geometry.location.lng,
          order: 0,
        }

        if (showSearchType === "start") {
          setStartPoint(point)
          setStartLat(point.lat.toString())
          setStartLng(point.lng.toString())
          setStartLabel(point.label)
        } else if (showSearchType === "end") {
          setEndPoint(point)
          setEndLat(point.lat.toString())
          setEndLng(point.lng.toString())
          setEndLabel(point.label)
        } else if (typeof showSearchType === "number") {
          const newWaypoints = [...waypoints]
          newWaypoints[showSearchType] = {
            ...point,
            order: showSearchType + 1,
          }
          setWaypoints(newWaypoints)

          setWaypointCoords((prev) => ({
            ...prev,
            [showSearchType]: {
              lat: point.lat.toString(),
              lng: point.lng.toString(),
              label: point.label,
            },
          }))
        }

        setQuery("")
        setSuggestions([])
        setShowSearchType(null)
      }
    } catch (err) {
      console.error("Error fetching place details:", err)
      Alert.alert("Error", "Failed to get location details")
    }
  }

  const getDistanceInMiles = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3958.8
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Number.parseFloat((R * c).toFixed(2))
  }

  const handleSubmit = async () => {
    let finalStartPoint = startPoint
    let finalEndPoint = endPoint
    let finalWaypoints = waypoints

    if (inputMode === "coordinates") {
      const startLatNum = Number.parseFloat(startLat)
      const startLngNum = Number.parseFloat(startLng)
      const endLatNum = Number.parseFloat(endLat)
      const endLngNum = Number.parseFloat(endLng)

      if (isNaN(startLatNum) || isNaN(startLngNum) || isNaN(endLatNum) || isNaN(endLngNum)) {
        Alert.alert("Error", "Please enter valid coordinates for start and end points")
        return
      }

      finalStartPoint = {
        label: startLabel || "Start Point",
        lat: startLatNum,
        lng: startLngNum,
        order: 0,
      }

      finalEndPoint = {
        label: endLabel || "End Point",
        lat: endLatNum,
        lng: endLngNum,
        order: waypoints.length + 1,
      }

      finalWaypoints = waypoints.map((wp, index) => {
        const coords = waypointCoords[index]
        if (coords) {
          const lat = Number.parseFloat(coords.lat)
          const lng = Number.parseFloat(coords.lng)

          if (isNaN(lat) || isNaN(lng)) {
            throw new Error(`Invalid coordinates for waypoint ${index + 1}`)
          }

          return {
            label: coords.label || `Waypoint ${index + 1}`,
            lat,
            lng,
            order: index + 1,
          }
        }
        return wp
      })
    } else {
      // In search mode, update waypoint labels from names
      finalWaypoints = waypoints.map((wp, index) => ({
        ...wp,
        label: waypointNames[index] || wp.label,
      }))
    }

    if (!name || !finalStartPoint || !finalEndPoint) {
      Alert.alert("Error", "Name, start point, and end point are required")
      return
    }

    setLoading(true)

    try {
      const token = await AsyncStorage.getItem("token")
      const userId = await AsyncStorage.getItem("userId")

      if (!token || !userId) {
        Alert.alert("Error", "You need to be logged in")
        return
      }

      const distance = getDistanceInMiles(
        finalStartPoint.lat,
        finalStartPoint.lng,
        finalEndPoint.lat,
        finalEndPoint.lng,
      )

      const allWaypoints = [
        { ...finalStartPoint, order: 0 },
        ...finalWaypoints.map((wp, index) => ({ ...wp, order: index + 1 })),
        { ...finalEndPoint, order: finalWaypoints.length + 1 },
      ]

      const payload = {
        name,
        description,
        visibility,
        distance,
        waypoints: allWaypoints,
      }

      const res = await fetch(`${SERVER_URI}/api/routes/${routeData._id || routeData.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        throw new Error(text)
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to update route")
      }

      Alert.alert("Success", "Route updated successfully")
      navigation.goBack()
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const getSearchTypeLabel = () => {
    if (showSearchType === "start") return "start"
    if (showSearchType === "end") return "end"
    if (typeof showSearchType === "number") return `waypoint ${showSearchType + 1}`
    return ""
  }

  const renderPlacesModal = () => (
    <Modal visible={showSearchType !== null} animationType="slide">
      <View style={styles.modalContainer}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
          Search for {getSearchTypeLabel()} location
        </Text>

        <TextInput
          placeholder={`Search for ${getSearchTypeLabel()} location`}
          placeholderTextColor="#5e5e5e"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          autoFocus
        />

        {query.length > 1 &&
          (loadingSuggestions ? (
            <Text style={styles.loadingText}>Searching...</Text>
          ) : suggestions.length > 0 ? (
            <ScrollView>
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={item.place_id}
                  onPress={() => handleSelect(item.place_id, item.description)}
                  style={styles.suggestionItem}
                >
                  <Text style={styles.suggestionText}>{item.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.loadingText}>No results found.</Text>
          ))}

        <TouchableOpacity onPress={() => setShowSearchType(null)} style={styles.modalCancelButton}>
          <Text style={styles.modalCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )

  const renderLocationCard = (type: "start" | "waypoint" | "end", index?: number) => {
    const isWaypoint = type === "waypoint" && index !== undefined
    const point = type === "start" ? startPoint : type === "end" ? endPoint : waypoints[index!]

    const handleLocationPress = () => {
      console.log("Location pressed:", type, index) // Debug log
      if (type === "waypoint" && index !== undefined) {
        setShowSearchType(index)
      } else {
        setShowSearchType(type)
      }
    }

    return (
      <View style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <View style={styles.locationTitle}>
            {type === "start" && <Navigation color="#4CAF50" size={20} />}
            {type === "waypoint" && <MapPin color={PRIMARY_APP_COLOR} size={20} />}
            {type === "end" && <Flag color="#f44336" size={20} />}
            <Text style={styles.locationTitleText}>
              {type === "start" ? "Start Point" : type === "end" ? "End Point" : `Waypoint ${(index || 0) + 1}`}
            </Text>
          </View>
          {isWaypoint && (
            <TouchableOpacity onPress={() => removeWaypoint(index!)} style={styles.removeButton}>
              <X color="#ff4444" size={18} />
            </TouchableOpacity>
          )}
        </View>

        {inputMode === "search" ? (
          <>
            {isWaypoint && (
              <TextInput
                style={styles.waypointNameInput}
                value={waypointNames[index!] || ""}
                onChangeText={(text) => updateWaypointName(index!, text)}
                placeholder="Waypoint name"
                placeholderTextColor="#aaa"
              />
            )}
            <TouchableOpacity style={styles.input} onPress={handleLocationPress}>
              <Text style={{ color: point?.label ? "#fff" : "#aaa" }}>
                {point?.label || `Select ${type === "start" ? "start" : type === "end" ? "end" : "waypoint"} location`}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={type === "start" ? startLabel : type === "end" ? endLabel : waypointCoords[index!]?.label || ""}
              onChangeText={(text) => {
                if (type === "start") setStartLabel(text)
                else if (type === "end") setEndLabel(text)
                else updateWaypointCoord(index!, "label", text)
              }}
              placeholder="Location Label"
              placeholderTextColor="#aaa"
            />

            <View style={styles.coordinateContainer}>
              <View style={styles.coordinateField}>
                <Text style={styles.coordinateLabel}>Latitude</Text>
                <TextInput
                  style={styles.coordinateInput}
                  value={type === "start" ? startLat : type === "end" ? endLat : waypointCoords[index!]?.lat || ""}
                  onChangeText={(text) => {
                    if (type === "start") setStartLat(text)
                    else if (type === "end") setEndLat(text)
                    else updateWaypointCoord(index!, "lat", text)
                  }}
                  placeholder="Latitude"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.coordinateField}>
                <Text style={styles.coordinateLabel}>Longitude</Text>
                <TextInput
                  style={styles.coordinateInput}
                  value={type === "start" ? startLng : type === "end" ? endLng : waypointCoords[index!]?.lng || ""}
                  onChangeText={(text) => {
                    if (type === "start") setStartLng(text)
                    else if (type === "end") setEndLng(text)
                    else updateWaypointCoord(index!, "lng", text)
                  }}
                  placeholder="Longitude"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Header title="Edit Route" onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.content}>
          <Text style={styles.label}>Route Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Route Name"
            placeholderTextColor="#aaa"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description (optional)"
            placeholderTextColor="#aaa"
            multiline
          />

          {/* Input Mode Toggle */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Input Mode:</Text>
            <View style={styles.toggleOptions}>
              <Text style={[styles.toggleText, inputMode === "search" && styles.activeToggleText]}>Search</Text>
              <Switch
                value={inputMode === "coordinates"}
                onValueChange={toggleInputMode}
                trackColor={{ false: "#333", true: PRIMARY_APP_COLOR }}
                thumbColor="#fff"
              />
              <Text style={[styles.toggleText, inputMode === "coordinates" && styles.activeToggleText]}>
                Coordinates
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Route Points</Text>

          {renderLocationCard("start")}

          {waypoints.map((_, index) => renderLocationCard("waypoint", index))}

          <TouchableOpacity style={styles.addWaypointButton} onPress={addWaypoint}>
            <View style={styles.addWaypointContent}>
              <Plus color="#fff" size={20} />
              <Text style={styles.addWaypointText}>Add Waypoint</Text>
            </View>
          </TouchableOpacity>

          {renderLocationCard("end")}

          <Text style={styles.label}>Visibility</Text>
          <View style={styles.visibilityContainer}>
            <TouchableOpacity
              style={[styles.visibilityOption, visibility === "private" && styles.selectedVisibility]}
              onPress={() => setVisibility("private")}
            >
              <Text style={styles.visibilityText}>Private</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.visibilityOption, visibility === "public" && styles.selectedVisibility]}
              onPress={() => setVisibility("public")}
            >
              <Text style={styles.visibilityText}>Public</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.saveButtonText}>{loading ? "Saving..." : "Save Changes"}</Text>
          </TouchableOpacity>
        </ScrollView>

        {renderPlacesModal()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

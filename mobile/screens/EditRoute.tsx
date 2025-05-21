"use client"

import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Switch,
} from "react-native"
import { styles } from '../styles/EditRoute.styles';
import { useNavigation, useRoute } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { ChevronLeft } from "lucide-react-native"
import { SERVER_URI, GOOGLE_MAPS_APIKEY, PRIMARY_APP_COLOR } from "../config"
import type { EditRouteRouteProp } from "../types/navigation"

export default function EditRoute() {
  const navigation = useNavigation()
  const route = useRoute<EditRouteRouteProp>()
  const routeData = route.params.route

  const [name, setName] = useState(routeData.name || "")
  const [description, setDescription] = useState(routeData.description || "")
  const [visibility, setVisibility] = useState(routeData.visibility || "private")
  const [loading, setLoading] = useState(false)
  const [showSearchType, setShowSearchType] = useState<"start" | "end" | null>(null)
  const [startPoint, setStartPoint] = useState(routeData.waypoints?.[0] || null)
  const [endPoint, setEndPoint] = useState(routeData.waypoints?.[1] || null)
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [inputRef, setInputRef] = useState<TextInput | null>(null)

  // New state for coordinate input mode
  const [inputMode, setInputMode] = useState<"search" | "coordinates">("search")
  const [startLat, setStartLat] = useState(routeData.waypoints?.[0]?.lat?.toString() || "")
  const [startLng, setStartLng] = useState(routeData.waypoints?.[0]?.lng?.toString() || "")
  const [endLat, setEndLat] = useState(routeData.waypoints?.[1]?.lat?.toString() || "")
  const [endLng, setEndLng] = useState(routeData.waypoints?.[1]?.lng?.toString() || "")

  // New state for labels in coordinate mode
  const [startLabel, setStartLabel] = useState(routeData.waypoints?.[0]?.label || "Start Point")
  const [endLabel, setEndLabel] = useState(routeData.waypoints?.[1]?.label || "End Point")

  // Toggle between search and coordinate input modes
  const toggleInputMode = () => {
    if (inputMode === "search") {
      // Update coordinate fields when switching to coordinate mode
      setStartLat(startPoint?.lat?.toString() || "")
      setStartLng(startPoint?.lng?.toString() || "")
      setEndLat(endPoint?.lat?.toString() || "")
      setEndLng(endPoint?.lng?.toString() || "")
      setStartLabel(startPoint?.label || "Start Point")
      setEndLabel(endPoint?.label || "End Point")
      setInputMode("coordinates")
    } else {
      setInputMode("search")
    }
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
          order: showSearchType === "start" ? 0 : 1,
        }

        if (showSearchType === "start") {
          setStartPoint(point)
          setStartLat(point.lat.toString())
          setStartLng(point.lng.toString())
          setStartLabel(point.label)
        } else {
          setEndPoint(point)
          setEndLat(point.lat.toString())
          setEndLng(point.lng.toString())
          setEndLabel(point.label)
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

    // If in coordinate mode, create points from the lat/lng inputs
    if (inputMode === "coordinates") {
      const startLatNum = Number.parseFloat(startLat)
      const startLngNum = Number.parseFloat(startLng)
      const endLatNum = Number.parseFloat(endLat)
      const endLngNum = Number.parseFloat(endLng)

      // Validate coordinates
      if (isNaN(startLatNum) || isNaN(startLngNum) || isNaN(endLatNum) || isNaN(endLngNum)) {
        Alert.alert("Error", "Please enter valid coordinates")
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
        order: 1,
      }
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

      const payload = {
        name,
        description,
        visibility,
        distance,
        waypoints: [
          { ...finalStartPoint, order: 0 },
          { ...finalEndPoint, order: 1 },
        ],
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

  const renderPlacesModal = () => (
    <Modal visible={!!showSearchType} animationType="slide">
      <View style={styles.modalContainer}>
        <TextInput
          ref={setInputRef}
          placeholder={`Search for ${showSearchType} location`}
          placeholderTextColor="#5e5e5e"
          value={query}
          onChangeText={setQuery}
          style={styles.input}
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

        <TouchableOpacity onPress={() => setShowSearchType(null)} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="white" size={26} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Route</Text>
        <View style={{ width: 26 }} />
      </View>

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
          style={[styles.input, { height: 80 }]}
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
            <Text style={[styles.toggleText, inputMode === "coordinates" && styles.activeToggleText]}>Coordinates</Text>
          </View>
        </View>

        {inputMode === "search" ? (
          <>
            <Text style={styles.label}>Start Point</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowSearchType("start")}>
              <Text style={{ color: startPoint ? "#fff" : "#aaa" }}>{startPoint?.label || "Select Start Point"}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>End Point</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowSearchType("end")}>
              <Text style={{ color: endPoint ? "#fff" : "#aaa" }}>{endPoint?.label || "Select End Point"}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Start Point</Text>
            <TextInput
              style={styles.input}
              value={startLabel}
              onChangeText={setStartLabel}
              placeholder="Start Point Label"
              placeholderTextColor="#aaa"
            />

            <View style={styles.coordinateContainer}>
              <View style={styles.coordinateField}>
                <Text style={styles.coordinateLabel}>Latitude</Text>
                <TextInput
                  style={styles.coordinateInput}
                  value={startLat}
                  onChangeText={setStartLat}
                  placeholder="Latitude"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.coordinateField}>
                <Text style={styles.coordinateLabel}>Longitude</Text>
                <TextInput
                  style={styles.coordinateInput}
                  value={startLng}
                  onChangeText={setStartLng}
                  placeholder="Longitude"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.label}>End Point</Text>
            <TextInput
              style={styles.input}
              value={endLabel}
              onChangeText={setEndLabel}
              placeholder="End Point Label"
              placeholderTextColor="#aaa"
            />

            <View style={styles.coordinateContainer}>
              <View style={styles.coordinateField}>
                <Text style={styles.coordinateLabel}>Latitude</Text>
                <TextInput
                  style={styles.coordinateInput}
                  value={endLat}
                  onChangeText={setEndLat}
                  placeholder="Latitude"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.coordinateField}>
                <Text style={styles.coordinateLabel}>Longitude</Text>
                <TextInput
                  style={styles.coordinateInput}
                  value={endLng}
                  onChangeText={setEndLng}
                  placeholder="Longitude"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </>
        )}

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

      {showSearchType && renderPlacesModal()}
    </KeyboardAvoidingView>
  )
}
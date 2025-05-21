"use client"

import React, { useState, useEffect } from "react"
import { Modal, View, Text, TextInput, TouchableOpacity, FlatList, Alert, Switch } from "react-native"
import { styles } from "../styles/CreateModal.styles"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { SERVER_URI, GOOGLE_MAPS_APIKEY } from "../config"
import { v4 as uuidv4 } from "uuid"

interface CreateRouteModalProps {
  visible: boolean
  onClose: () => void
  onCreate: (route: any) => void
}

export default function CreateRouteModal({ visible, onClose, onCreate }: CreateRouteModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startPoint, setStartPoint] = useState<any>(null)
  const [endPoint, setEndPoint] = useState<any>(null)
  const [startLat, setStartLat] = useState("")
  const [startLng, setStartLng] = useState("")
  const [endLat, setEndLat] = useState("")
  const [endLng, setEndLng] = useState("")
  const [visibility, setVisibility] = useState<"private" | "public">("private")
  const [showSearchType, setShowSearchType] = useState<"start" | "end" | null>(null)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [inputRef, setInputRef] = useState<TextInput | null>(null)
  const [method, setMethod] = useState<"Search" | "Coordinates">("Search")

  const sessionToken = uuidv4()

  const toggleMethod = () => setMethod((prev) => (prev === "Search" ? "Coordinates" : "Search"))

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
          )}&key=${GOOGLE_MAPS_APIKEY}&sessiontoken=${sessionToken}&components=country:us`,
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

  useEffect(() => {
    if (showSearchType && inputRef) {
      const timeout = setTimeout(() => inputRef.focus(), 300)
      return () => clearTimeout(timeout)
    }
  }, [showSearchType, inputRef])

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

  const handleSelect = async (placeId: string, fallbackLabel: string) => {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_APIKEY}&sessiontoken=${sessionToken}`,
    )
    const json = await res.json()
    const details = json.result

    if (details?.geometry?.location) {
      const point = {
        label: details.name || fallbackLabel,
        lat: details.geometry.location.lat,
        lng: details.geometry.location.lng,
      }

      showSearchType === "start" ? setStartPoint(point) : setEndPoint(point)
      setQuery("")
      setSuggestions([])
      setShowSearchType(null)
    }
  }

  const handleSubmit = async () => {
    let finalStart = startPoint
    let finalEnd = endPoint

    if (method === "Coordinates") {
      const lat1 = Number.parseFloat(startLat)
      const lng1 = Number.parseFloat(startLng)
      const lat2 = Number.parseFloat(endLat)
      const lng2 = Number.parseFloat(endLng)

      if ([lat1, lng1, lat2, lng2].some(isNaN)) {
        Alert.alert("Error", "Please enter valid coordinates.")
        return
      }

      finalStart = { label: "Start", lat: lat1, lng: lng1 }
      finalEnd = { label: "End", lat: lat2, lng: lng2 }
    }

    if (!name || !finalStart || !finalEnd) {
      Alert.alert("Error", "All fields are required.")
      return
    }

    const distance = getDistanceInMiles(finalStart.lat, finalStart.lng, finalEnd.lat, finalEnd.lng)
    setLoading(true)

    try {
      const token = await AsyncStorage.getItem("token")
      const userId = await AsyncStorage.getItem("userId")
      const payload = {
        name,
        description,
        visibility,
        createdBy: userId,
        distance,
        waypoints: [
          { ...finalStart, order: 0 },
          { ...finalEnd, order: 1 },
        ],
      }

      const res = await fetch(`${SERVER_URI}/api/routes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const text = await res.text()
      const data = JSON.parse(text)
      if (!res.ok) throw new Error(data.message || "Failed to create route")

      onCreate(data)
      setName("")
      setDescription("")
      setStartPoint(null)
      setEndPoint(null)
      setStartLat("")
      setStartLng("")
      setEndLat("")
      setEndLng("")
      setVisibility("private")
      onClose()
    } catch (err: any) {
      Alert.alert("Error", err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderPlacesModal = () => (
    <Modal visible={!!showSearchType} animationType="slide">
      <View style={styles.searchModalContainer}>
        <Text style={styles.modalHeader}>Search for {showSearchType} location</Text>
        <TextInput
          ref={setInputRef}
          placeholder="Enter location name"
          placeholderTextColor="#5e5e5e"
          value={query}
          onChangeText={setQuery}
          style={styles.input}
        />

        {query.length > 1 &&
          (loadingSuggestions ? (
            <Text style={styles.searchingText}>Searching...</Text>
          ) : suggestions.length > 0 ? (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item.place_id, item.description)}
                  style={styles.suggestionItem}
                >
                  <Text style={styles.suggestionText}>{item.description}</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text style={styles.searchingText}>No results found.</Text>
          ))}

        <TouchableOpacity
          onPress={() => setShowSearchType(null)}
          style={{
            padding: 12,
            borderRadius: 8,
            alignItems: "center",
            marginTop: 20,
          }}
        >
          <Text style={{ color: "#f3631a", fontSize: 16, fontWeight: "500" }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.header}>New Route</Text>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Input Mode</Text>
          <View style={styles.toggleOptions}>
            <Text style={[styles.toggleText, method === "Search" && styles.activeToggleText]}>Search</Text>
            <Switch
              value={method === "Coordinates"}
              onValueChange={toggleMethod}
              trackColor={{ false: "#333", true: "#f3631a" }}
              thumbColor="#fff"
            />
            <Text style={[styles.toggleText, method === "Coordinates" && styles.activeToggleText]}>Coordinates</Text>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {method === "Search" ? (
          <>
            <Text style={styles.subLabel}>Start Point</Text>
            <TouchableOpacity onPress={() => setShowSearchType("start")} style={styles.compactInput}>
              <Text style={{ color: startPoint ? "#fff" : "#aaa" }}>
                {startPoint?.label || "Select start location"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.subLabel}>End Point</Text>
            <TouchableOpacity onPress={() => setShowSearchType("end")} style={styles.compactInput}>
              <Text style={{ color: endPoint ? "#fff" : "#aaa" }}>{endPoint?.label || "Select end location"}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subLabel}>Start Point</Text>
            <TextInput
              placeholder="Start Label"
              value={startPoint?.label || ""}
              onChangeText={(text) => setStartPoint((prev:any) => ({ ...prev, label: text }))}
              style={styles.compactInput}
              placeholderTextColor="#aaa"
            />
            <View style={styles.coordinateContainer}>
              <View style={styles.coordinateField}>
                <Text style={styles.coordinateLabel}>Latitude</Text>
                <TextInput
                  placeholder="Lat"
                  value={startLat}
                  onChangeText={setStartLat}
                  keyboardType="numeric"
                  style={styles.coordinateInput}
                  placeholderTextColor="#aaa"
                />
              </View>
              <View style={styles.coordinateField}>
                <Text style={styles.coordinateLabel}>Longitude</Text>
                <TextInput
                  placeholder="Lng"
                  value={startLng}
                  onChangeText={setStartLng}
                  keyboardType="numeric"
                  style={styles.coordinateInput}
                  placeholderTextColor="#aaa"
                />
              </View>
            </View>

            <Text style={styles.subLabel}>End Point</Text>
            <TextInput
              placeholder="End Label"
              value={endPoint?.label || ""}
              onChangeText={(text) => setEndPoint((prev:any) => ({ ...prev, label: text }))}
              style={styles.compactInput}
              placeholderTextColor="#aaa"
            />
            <View style={styles.coordinateContainer}>
              <View style={styles.coordinateField}>
                <Text style={styles.coordinateLabel}>Latitude</Text>
                <TextInput
                  placeholder="Lat"
                  value={endLat}
                  onChangeText={setEndLat}
                  keyboardType="numeric"
                  style={styles.coordinateInput}
                  placeholderTextColor="#aaa"
                />
              </View>
              <View style={styles.coordinateField}>
                <Text style={styles.coordinateLabel}>Longitude</Text>
                <TextInput
                  placeholder="Lng"
                  value={endLng}
                  onChangeText={setEndLng}
                  keyboardType="numeric"
                  style={styles.coordinateInput}
                  placeholderTextColor="#aaa"
                />
              </View>
            </View>
          </>
        )}

        <View style={styles.sectionDivider} />

        <Text style={styles.subLabel}>Route Details</Text>
        <TextInput
          placeholder="Route Name"
          value={name}
          onChangeText={setName}
          style={styles.compactInput}
          placeholderTextColor="#aaa"
        />
        <TextInput
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          style={[styles.compactInput, { height: 60 }]}
          multiline
          placeholderTextColor="#aaa"
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={onClose} style={styles.buttonCancel}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit} style={styles.buttonPrimary} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Creating..." : "Create"}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {showSearchType && renderPlacesModal()}
    </Modal>
  )
}

import React, { useLayoutEffect, useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Image
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import MapView, { Polyline, Marker } from 'react-native-maps'
import { useNavigation, useRoute } from '@react-navigation/native'
import { MoreHorizontal, ChevronLeft, X } from 'lucide-react-native'
import { jwtDecode } from 'jwt-decode'
import polyline from '@mapbox/polyline'
import { GOOGLE_MAPS_APIKEY, PRIMARY_APP_COLOR } from '../config'

export default function RouteDetailsScreen() {
  const navigation = useNavigation()
  const routeParams = useRoute().params as { route: any }
  const routeData = routeParams.route

  const [menuVisible, setMenuVisible] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const [isCollaborator, setIsCollaborator] = useState(false)
  const mapRef = useRef<MapView | null>(null)
  const [decodedPath, setDecodedPath] = useState<{ latitude: number; longitude: number }[]>([])

  useLayoutEffect(() => {
    const checkUserRole = async () => {
      const token = await AsyncStorage.getItem('token')
      if (!token) return
      const decoded: any = jwtDecode(token)
      const userId = decoded?.userID
      setIsCreator(routeData.createdBy === userId)
      setIsCollaborator(routeData.collaborators?.includes(userId))
    }
    checkUserRole()
  }, [])

  useEffect(() => {
    const fetchPolyline = async () => {
      if (!Array.isArray(routeData.waypoints) || routeData.waypoints.length < 2) return

      const origin = `${routeData.waypoints[0].lat},${routeData.waypoints[0].lng}`
      const destination = `${routeData.waypoints.at(-1).lat},${routeData.waypoints.at(-1).lng}`
      const waypoints = routeData.waypoints.slice(1, -1).map((wp: any) => `${wp.lat},${wp.lng}`).join('|')
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_APIKEY}${waypoints ? `&waypoints=${waypoints}` : ''}`

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
        console.error('Failed to fetch polyline', err)
      }
    }

    fetchPolyline()
  }, [routeData.waypoints])

  const handleDelete = () => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this route?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { } },
    ])
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
              source={require('../src/img/icons/start.png')}
              style={{ width: 30, height: 30, resizeMode: 'contain' }}
            />
          </Marker>
        )}

        {/* End marker at the end of the polyline */}
        {decodedPath.length > 1 && (
          <Marker coordinate={decodedPath[decodedPath.length - 1]} anchor={{ x: 0.1, y: 0.8 }}>
            <Image
              source={require('../src/img/icons/end.png')}
              style={{ width: 30, height: 30, resizeMode: 'contain' }}
            />
          </Marker>
        )}
      </MapView>


      {/* Route Details */}
      <View style={styles.details}>
        <Text style={styles.detailText}>Description: {routeData.description || '—'}</Text>
        <Text style={styles.detailText}>Distance: {routeData.distance || '—'}</Text>
        <Text style={styles.detailText}>Start: {routeData.waypoints?.[0]?.label || '—'}</Text>
        <Text style={styles.detailText}>End: {routeData.waypoints?.[1]?.label || '—'}</Text>
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

            <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>Share</Text></TouchableOpacity>
            {(isCreator || isCollaborator) && <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>Edit</Text></TouchableOpacity>}
            {isCreator && (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                  <Text style={[styles.menuText, { color: '#ff4444' }]}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <Text style={styles.menuText}>Collaborators</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  navBar: {
    height: 60, backgroundColor: '#1e1e1e',
    paddingHorizontal: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  navTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  map: { height: 200, width: '100%' },
  details: { padding: 16 },
  detailText: { color: 'white', fontSize: 16, marginBottom: 10 },
  menuOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end'
  },
  menuContainer: {
    backgroundColor: '#1e1e1e', padding: 20,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  menuItem: { paddingVertical: 12 },
  menuText: { fontSize: 18, color: 'white' },
  closeButton: {
    position: 'absolute', top: 10, right: 20, zIndex: 1
  },
})

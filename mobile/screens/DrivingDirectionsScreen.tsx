// NavigationScreen.tsx

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, {
  Marker,
  Polyline,
  Region,
  LatLng,
  UserLocationChangeEvent,
} from 'react-native-maps';

const { width, height } = Dimensions.get('window');

function getDistance(a: LatLng, b: LatLng): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const sinDlat = Math.sin(dLat / 2);
  const sinDlon = Math.sin(dLon / 2);
  const h =
    sinDlat * sinDlat +
    sinDlon * sinDlon * Math.cos(lat1) * Math.cos(toRad(b.latitude));
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

const INITIAL_REGION: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

const ORIGIN: LatLng = { latitude: 37.7749, longitude: -122.4194 };
const DEST: LatLng   = { latitude: 37.7739, longitude: -122.4313 };

// Your public Mapbox token
const MAPBOX_TOKEN = 'pk.eyJ1IjoicmVhbGtub3RzIiwiYSI6ImNtYW9uc3c0bDA5djQybHE4ZzBxYWlzYnQifQ.nIDhH3d6t-t-7MFMN-VEZg';

type Step = {
  instruction: string;
  location: LatLng;
};

export default function NavigationScreen() {
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const mapRef = useRef<MapView>(null);

  // Fetch route & steps
  useEffect(() => {
    (async () => {
      try {
        const url =
          'https://api.mapbox.com/directions/v5/mapbox/driving/' +
          `${ORIGIN.longitude},${ORIGIN.latitude};${DEST.longitude},${DEST.latitude}` +
          `?geometries=geojson&steps=true&overview=full&access_token=${MAPBOX_TOKEN}`;

        const res = await fetch(url);
        const json = await res.json();
        if (!json.routes?.length) {
          Alert.alert('Error', 'No route returned');
          return;
        }

        // Polyline
        const coords = json.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => ({
            latitude: lat,
            longitude: lng,
          })
        );
        setRouteCoords(coords);

        // Steps
        const all: Step[] = [];
        json.routes[0].legs.forEach((leg: any) =>
          leg.steps.forEach((st: any) =>
            all.push({
              instruction: st.maneuver.instruction,
              location: {
                latitude: st.maneuver.location[1],
                longitude: st.maneuver.location[0],
              },
            })
          )
        );
        setSteps(all);
      } catch (err) {
        console.error(err);
        Alert.alert('Network error', 'Could not fetch directions');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Advance when user gets close enough
  const onUserLocationChange = (e: UserLocationChangeEvent) => {
    const coord = e.nativeEvent.coordinate;
    if (!coord) {return;}
    // strip extras:
    const loc: LatLng = {
      latitude: coord.latitude,
      longitude: coord.longitude,
    };
    let idx = currentStep;
    while (idx < steps.length && getDistance(loc, steps[idx].location) < 30) {
      idx++;
    }
    if (idx !== currentStep) {
      setCurrentStep(idx);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f3631a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        followsUserLocation
        onUserLocationChange={onUserLocationChange}
      >
        <Polyline
          coordinates={routeCoords}
          strokeColor="#f3631a"
          strokeWidth={4}
        />
        {steps.map((s, i) => (
          <Marker
            key={i}
            coordinate={s.location}
            title={`${i + 1}`}
            pinColor={i === currentStep ? 'blue' : 'gray'}
          />
        ))}
      </MapView>
      <View style={styles.instruction}>
        <Text style={styles.instructionText}>
          {currentStep < steps.length
            ? steps[currentStep].instruction
            : "You've arrived 🎉"}
        </Text>
        {currentStep < steps.length && (
          <Text style={styles.stepCount}>
            Step {currentStep + 1} of {steps.length}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  instruction: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
  },
  instructionText: { color: '#fff', fontSize: 16, marginBottom: 4 },
  stepCount: { color: '#aaa', fontSize: 12, textAlign: 'right' },
});

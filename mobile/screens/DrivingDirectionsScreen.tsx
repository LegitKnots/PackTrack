import React, { useEffect, useRef, useState } from 'react';
import {
  PermissionsAndroid,
  Platform,
  View,
  Text,
  Image,
} from 'react-native';
import { styles } from '../styles/DrivingDirections.styles';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import MapViewDirections from 'react-native-maps-directions';
import { GOOGLE_MAPS_APIKEY } from '../config';

function calculateBearing(start: { latitude: number; longitude: number }, end: { latitude: number; longitude: number }) {
  const lat1 = (start.latitude * Math.PI) / 180;
  const lon1 = (start.longitude * Math.PI) / 180;
  const lat2 = (end.latitude * Math.PI) / 180;
  const lon2 = (end.longitude * Math.PI) / 180;

  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

function getClosestPointOnPath(
  path: { latitude: number; longitude: number }[],
  point: { latitude: number; longitude: number }
) {
  let closest = path[0];
  let minDist = Number.MAX_VALUE;
  let index = 0;

  for (let i = 0; i < path.length; i++) {
    const dx = path[i].latitude - point.latitude;
    const dy = path[i].longitude - point.longitude;
    const dist = dx * dx + dy * dy;
    if (dist < minDist) {
      minDist = dist;
      closest = path[i];
      index = i;
    }
  }

  return { snapped: closest, index };
}

export default function DrivingDirectionsScreen() {
  const [rawPosition, setRawPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [snappedPosition, setSnappedPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routePath, setRoutePath] = useState<{ latitude: number; longitude: number }[]>([]);
  const [trimmedPath, setTrimmedPath] = useState<{ latitude: number; longitude: number }[]>([]);
  const [routeHeading, setRouteHeading] = useState<number>(0);
  const [routeReady, setRouteReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapRef = useRef<MapView | null>(null);
  const lastHeadingRef = useRef<number>(0);

  const destination = {
    latitude: 33.7490,
    longitude: -84.3880,
  };

  useEffect(() => {
    let watchId: number;

    const startTracking = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            setError('Location permission denied');
            return;
          }
        }

        watchId = Geolocation.watchPosition(
          (position) => {
            const { latitude, longitude, heading, speed } = position.coords;
            const gpsCoords = { latitude, longitude };
            setRawPosition(gpsCoords);

            if (routePath.length >= 2) {
              const { snapped, index } = getClosestPointOnPath(routePath, gpsCoords);
              setSnappedPosition(snapped);
              setTrimmedPath(routePath.slice(index));

              const nextPoint = routePath[index + 1] ?? destination;
              const fallbackHeading = calculateBearing(snapped, nextPoint);
              const gpsHeading = (heading && speed && speed > 0.5) ? heading : fallbackHeading;

              // Smooth wraparound at 0/360
              const last = lastHeadingRef.current;
              const delta = Math.abs(gpsHeading - last);
              const headingSmoothed = delta > 5 ? gpsHeading : last;
              lastHeadingRef.current = headingSmoothed;

              if (routeReady && mapRef.current) {
                mapRef.current.animateCamera(
                  {
                    center: snapped,
                    heading: headingSmoothed,
                    pitch: 60,
                    zoom: 18,
                    altitude: 300,
                  },
                  { duration: 500 }
                );
              }
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            setError('Failed to get location: ' + error.message);
          },
          {
            enableHighAccuracy: true,
            distanceFilter: 1,
            interval: 2000,
            fastestInterval: 1000,
          }
        );
      } catch (err) {
        console.error('Permission error:', err);
        setError('Unexpected error occurred.');
      }
    };

    startTracking();

    return () => {
      if (watchId !== undefined) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [routePath, routeReady]);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={{ flex: 1 }}
      initialRegion={{
        latitude: destination.latitude,
        longitude: destination.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      showsUserLocation={false}
      followsUserLocation={false}
      showsMyLocationButton={false}
      showsTraffic={true}
      pitchEnabled={true}
      rotateEnabled={true}
      userInterfaceStyle="dark"
    >
      {snappedPosition && (
        <Marker
          coordinate={snappedPosition}
          anchor={{ x: 0.5, y: 0.5 }}
          flat={true}
          rotation={lastHeadingRef.current}
        >
          <Image
            source={require('../assets/gps-arrow-default.png')}
            style={{ width: 40, height: 40, }}
            resizeMode="contain"
          />
        </Marker>
      )}

      {/* Route ahead */}
      <Polyline
        coordinates={trimmedPath.length > 0 ? trimmedPath : routePath}
        strokeColor="blue"
        strokeWidth={6}
      />

      <Marker coordinate={destination} title="Destination" />

      <MapViewDirections
        origin={rawPosition ?? destination}
        destination={destination}
        apikey={GOOGLE_MAPS_APIKEY}
        strokeWidth={0}
        strokeColor="transparent"
        optimizeWaypoints={true}
        onError={(err) => {
          console.warn('Directions error:', err);
          setError('Could not load directions');
        }}
        onReady={(result) => {
          const coords = [...result.coordinates];
          setRoutePath(coords);

          if (!routeReady) {
            mapRef.current?.fitToCoordinates(coords, {
              edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
              animated: true,
            });
            setRouteReady(true);
          }
        }}
      />
    </MapView>
  );
}
import React, { useEffect, useState, useRef } from 'react';
import { PermissionsAndroid, Platform, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Geolocation from 'react-native-geolocation-service';

const GOOGLE_MAPS_APIKEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

export default function GPSMapScreen() {
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destination] = useState({ latitude: 24.8949, longitude: 67.0740 }); // e.g. Pakistan Air Force Museum
  const mapRef = useRef<MapView | null>(null);

  // Ask location permission
  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('Location permission denied');
        }
      }
    };

    requestLocationPermission();
  }, []);

  // Track user position
  useEffect(() => {
    const watchId = Geolocation.watchPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setOrigin({ latitude, longitude });

        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      },
      error => console.error(error),
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 3000,
        fastestInterval: 2000,
      }
    );

    return () => {
      Geolocation.clearWatch(watchId);
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        showsUserLocation={true}
        followsUserLocation={true}
        initialRegion={{
          latitude: origin?.latitude || 24.8607,
          longitude: origin?.longitude || 67.0011,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {origin && (
          <>
            <Marker coordinate={origin} title="You" pinColor="blue" />
            <Marker coordinate={destination} title="Destination" />

            <MapViewDirections
              origin={origin}
              destination={destination}
              apikey={GOOGLE_MAPS_APIKEY}
              strokeColor="orange"
              strokeWidth={4}
            />
          </>
        )}
      </MapView>
    </View>
  );
}

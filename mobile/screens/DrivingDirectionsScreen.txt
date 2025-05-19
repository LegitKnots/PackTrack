import React from 'react';
import {StyleSheet, View, Platform} from 'react-native';
import NavigationView from '@pawan-pk/react-native-mapbox-navigation';

// Replace with your Mapbox access token
const MAPBOX_TOKEN =
  'pk.eyJ1IjoicmVhbGtub3RzIiwiYSI6ImNtYW9uc3c0bDA5djQybHE4ZzBxYWlzYnQifQ.nIDhH3d6t-t-7MFMN-VEZg';

// Sample origin and destination coordinates
const ORIGIN = {
  latitude: 37.7749,
  longitude: -122.4194,
  title: 'Start', // optional
};
const DESTINATION = {
  latitude: 37.7739,
  longitude: -122.4313,
  title: 'End Point', // optional
};

export default function NavigationScreen() {
  return (
    <View style={styles.container}>
      <NavigationView
        style={styles.map}
        startOrigin={ORIGIN}
        destination={DESTINATION}
        //accessToken={MAPBOX_TOKEN}
        //simulateRoute={false} // Set true to simulate navigation
        //showAlternative={true} // Show alternative routes
        showsEndOfRouteFeedback={true}
        language="en"
        distanceUnit="imperial"
        onLocationChange={(event: any) => {
          // event.nativeEvent: { coords: {latitude, longitude, speed, heading}, }
          console.log('Location update:', event.nativeEvent.coords);
        }}
        onError={(msg: any) => console.warn('Navigation error:', msg)}
        onArriveDestination={() => console.log('Arrived at destination')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  map: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 0 : 0,
  },
});

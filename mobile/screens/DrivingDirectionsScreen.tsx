import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';

export default function NavigationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        🚧 Sorry, due to Google API limitations, this feature is not yet available.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  map: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 0 : 0,
  },
})

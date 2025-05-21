import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

type PackChatScreenRouteProp = RouteProp<RootStackParamList, 'PackChat'>;

export default function PackChatScreen() {
  const route = useRoute<PackChatScreenRouteProp>();
  const { packId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pack Chat</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
      <Text style={styles.packId}>Pack ID: {packId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 24,
  },
  packId: {
    fontSize: 14,
    color: '#666',
  },
});

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { styles } from '../styles/CreateModal.styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URI, GOOGLE_MAPS_APIKEY } from '../config';
import { v4 as uuidv4 } from 'uuid';

interface CreateRouteModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (route: any) => void;
}

export default function CreateRouteModal({
  visible,
  onClose,
  onCreate,
}: CreateRouteModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startPoint, setStartPoint] = useState<any>(null);
  const [endPoint, setEndPoint] = useState<any>(null);
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [showSearchType, setShowSearchType] = useState<'start' | 'end' | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [inputRef, setInputRef] = useState<TextInput | null>(null);

  const sessionToken = uuidv4();

  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            query
          )}&key=${GOOGLE_MAPS_APIKEY}&sessiontoken=${sessionToken}&components=country:us`
        );
        const json = await res.json();
        setSuggestions(json.predictions || []);
      } catch (err) {
        console.error('Places fetch failed:', err);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (showSearchType && inputRef) {
      const timeout = setTimeout(() => {
        inputRef.focus();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [showSearchType, inputRef]);

  const getDistanceInMiles = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 3958.8; // miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  };

  const handleSelect = async (placeId: string, fallbackLabel: string) => {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_APIKEY}&sessiontoken=${sessionToken}`
    );
    const json = await res.json();
    const details = json.result;

    if (details?.geometry?.location) {
      const point = {
        label: details.name || fallbackLabel,
        lat: details.geometry.location.lat,
        lng: details.geometry.location.lng,
      };

      if (showSearchType === 'start') setStartPoint(point);
      else if (showSearchType === 'end') setEndPoint(point);

      setQuery('');
      setSuggestions([]);
      setShowSearchType(null);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !startPoint || !endPoint) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    const distance = getDistanceInMiles(
      startPoint.lat,
      startPoint.lng,
      endPoint.lat,
      endPoint.lng
    );

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');

      const payload = {
        name,
        description,
        visibility,
        createdBy: userId,
        distance,
        waypoints: [
          { lat: startPoint.lat, lng: startPoint.lng, label: startPoint.label, order: 0 },
          { lat: endPoint.lat, lng: endPoint.lng, label: endPoint.label, order: 1 },
        ],
      };

      const res = await fetch(`${SERVER_URI}/api/routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = JSON.parse(text);

      if (!res.ok) throw new Error(data.message || 'Failed to create route');

      onCreate(data);
      setName('');
      setDescription('');
      setStartPoint(null);
      setEndPoint(null);
      setVisibility('private');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPlacesModal = () => (
    <Modal visible={!!showSearchType} animationType="slide">
      <View style={{ flex: 1, backgroundColor: '#1e1e1e', padding: 16 }}>
        <TextInput
          ref={setInputRef}
          placeholder={`Search for ${showSearchType} location`}
          placeholderTextColor="#5e5e5e"
          value={query}
          onChangeText={setQuery}
          style={{
            height: 48,
            borderColor: '#ccc',
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            fontSize: 16,
            color: '#ccc',
            marginBottom: 12,
          }}
        />

        {query.length > 1 ? (
          loadingSuggestions ? (
            <Text style={{ color: '#777', textAlign: 'center', marginTop: 24, fontSize: 16 }}>
              Searching for places...
            </Text>
          ) : suggestions.length > 0 ? (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item.place_id, item.description)}
                  style={{
                    paddingVertical: 12,
                    borderBottomColor: '#eee',
                    borderBottomWidth: 1,
                  }}
                >
                  <Text style={{ fontSize: 16, color: '#ccc' }}>{item.description}</Text>
                </TouchableOpacity>
              )}
              style={{ marginBottom: 60 }}
            />
          ) : (
            <Text style={{ color: '#777', textAlign: 'center', marginTop: 24, fontSize: 16 }}>
              No results found.
            </Text>
          )
        ) : null}

        <TouchableOpacity
          onPress={() => setShowSearchType(null)}
          style={{
            position: 'absolute',
            bottom: 24,
            alignSelf: 'center',
            backgroundColor: '#2a2a2a',
            paddingVertical: 4,
            paddingHorizontal: 20,
            borderRadius: 5,
          }}
        >
          <Text style={{ color: '#f3631a', fontSize: 16 }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.header}>New Route</Text>

        <TouchableOpacity onPress={() => setShowSearchType('start')} style={styles.input}>
          <Text style={{ color: startPoint ? '#fff' : '#aaa' }}>
            {startPoint?.label || 'Start Point'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowSearchType('end')} style={styles.input}>
          <Text style={{ color: endPoint ? '#fff' : '#aaa' }}>
            {endPoint?.label || 'End Point'}
          </Text>
        </TouchableOpacity>

        <TextInput
          placeholder="Route Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholderTextColor="#aaa"
        />

        <TextInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, { height: 80 }]}
          multiline
          placeholderTextColor="#aaa"
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={handleSubmit} style={styles.buttonPrimary} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.buttonCancel}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showSearchType && renderPlacesModal()}
    </Modal>
  );
}

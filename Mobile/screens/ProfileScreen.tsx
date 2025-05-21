import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { styles } from '../styles/ProfileScreen.styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { SERVER_URI } from '../config';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');

      if (!token || !userId) {
        setError('You are not logged in.');
        return;
      }

      const res = await fetch(`${SERVER_URI}/api/users/${userId}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(text);
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch user data');
      }

      setUserData(data.user);
    } catch (err: any) {
      console.error('Profile error:', err.message);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#f3631a" size="large" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSection}>
        <Image
          source={require('../src/img/logo.png')}
          style={styles.avatar}
        />
        <Text style={styles.username}>@{userData.username || 'User'}</Text>
        <Text style={styles.bio}>{userData.bio || 'No bio yet.'}</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('CompleteProfile' as never)}>
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoItem}>
          <Text style={styles.label}>Name:</Text> {userData.fullname}
        </Text>
        <Text style={styles.infoItem}>
          <Text style={styles.label}>Bike:</Text> {userData.bike || 'N/A'}
        </Text>
        <Text style={styles.infoItem}>
          <Text style={styles.label}>Location:</Text> {userData.location || 'N/A'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { SERVER_URI } from '../config';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'CompleteProfile'>;

export default function CompleteProfile({ route, navigation }: Props) {
  const { userId, token } = route.params;

  const [form, setForm] = useState({
    username: '',
    bike: '',
    location: '',
    bio: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.username || !form.bike) {
      Alert.alert('Please add at least your username and bike');
      return;
    }

    try {
      const res = await fetch(`${SERVER_URI}/api/users/${userId}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Update failed', data.message || 'Unknown error');
        return;
      }

      Alert.alert('Success', 'Profile updated!');
      navigation.navigate('Home');
    } catch (err) {
      console.error('Profile update error:', err);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Set Up A Profile</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#aaa"
        value={form.username}
        onChangeText={(text) => handleChange('username', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Bike"
        placeholderTextColor="#aaa"
        value={form.bike}
        onChangeText={(text) => handleChange('bike', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Bio (Optional)"
        placeholderTextColor="#aaa"
        value={form.bio}
        onChangeText={(text) => handleChange('bio', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Location (Optional)"
        placeholderTextColor="#aaa"
        value={form.location}
        onChangeText={(text) => handleChange('location', text)}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Save & Continue</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f3631a',
    marginBottom: 30,
  },
  input: {
    color: '#fff',
    backgroundColor: '#2c2c2c',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    width: width * 0.85,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#f3631a',
    paddingVertical: 15,
    width: width * 0.65,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

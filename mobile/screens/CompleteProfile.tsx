import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { styles }  from '../styles/CreateProfile.styles';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { SERVER_URI } from '../config';


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
      navigation.navigate('HomeNavigation');
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


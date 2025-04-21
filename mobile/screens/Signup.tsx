import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { styles } from '../styles/Signup.styles';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { SERVER_URI } from '../config';

// ✅ Typed navigation hook
type SignupScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'Signup'>;

export default function SignupScreen() {
  const navigation = useNavigation<SignupScreenNavProp>();
  const [form, setForm] = useState({
    fullname: '',
    email: '',
    password: '',
    verifyPassword: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignup = async () => {
    const { fullname, email, password, verifyPassword } = form;

    if (!fullname || !email || !password || !verifyPassword) {
      Alert.alert('Please fill in all fields');
      return;
    }

    if (password !== verifyPassword) {
      Alert.alert('Passwords do not match');
      return;
    }

    try {
      const res = await fetch(`${SERVER_URI}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullname, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Signup Failed', data.message || 'Unknown error');
        return;
      }

      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('email', email);
      await AsyncStorage.setItem('userId', data.user.id);

      navigation.navigate('CompleteProfile', {
        userId: data.user.id,
        token: data.token,
      });
    } catch (err) {
      console.error('Signup error:', err);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Create Account</Text>

      <View style={styles.formView}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#aaa"
          value={form.fullname}
          onChangeText={(text) => handleChange('fullname', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          onChangeText={(text) => handleChange('email', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={form.password}
          onChangeText={(text) => handleChange('password', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={form.verifyPassword}
          onChangeText={(text) => handleChange('verifyPassword', text)}
        />

        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.switchText}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
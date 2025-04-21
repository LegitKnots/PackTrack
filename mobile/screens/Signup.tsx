import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { SERVER_URI } from '../config';

const { width } = Dimensions.get('window');

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#f3631a',
    marginBottom: 20,
  },
  formView: {
    alignItems: 'center',
    width: '100%',
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
    width: width * 0.7,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    marginTop: 25,
    color: '#aaa',
    fontSize: 14,
  },
});

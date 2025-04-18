import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { SERVER_URI } from '../config';

const { width } = Dimensions.get('window');

export default function SignupScreen() {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    verifyPassword: '',
    phone: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignup = async () => {
    if(form.password !== form.verifyPassword){
      Alert.alert('Passwords do not match');
    }
    try {
      const res = await fetch(`${SERVER_URI}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Signup Failed', data.message || 'Unknown error');
        return;
      }

      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('email', form.email);
      navigation.navigate('Home' as never);
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
      <Text style={styles.title}>Create an</Text>
      <Text style={styles.title}>Account</Text>


      <View style={styles.formView}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#aaa"
          value={form.name}
          onChangeText={(text) => handleChange('name', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          value={form.email}
          onChangeText={(text) => handleChange('email', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor="#aaa"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(text) => handleChange('phone', text)}
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
          placeholder="Verify Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={form.verifyPassword}
          onChangeText={(text) => handleChange('verifyPassword', text)}
        />

        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
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
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#f3631a',
    marginBottom: 0,
  },
  formView: {
    marginTop: 50,
    alignItems: 'center',
  },
  input: {
    color: '#fff',
    backgroundColor: '#2c2c2c',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    width: width * 0.75,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#f3631a',
    paddingVertical: 15,
    width: width * 0.65,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    marginTop: 20,
    color: '#aaa',
  },
});

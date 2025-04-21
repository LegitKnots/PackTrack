import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { SERVER_URI } from '../config';

const { width } = Dimensions.get('window');

export default function Login() {
  const [step, setStep] = useState<'login' | 'mfa'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter both email and password');
      return;
    }

    try {
      const res = await fetch(`${SERVER_URI}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.message === 'Login successful') {
          await AsyncStorage.setItem('token', data.token);
          await AsyncStorage.setItem('userId', data.user.id);
          await AsyncStorage.setItem('email', data.user.email);
          await AsyncStorage.setItem('fullname', data.user.fullname);


          navigation.navigate('Home' as never);
        } else if (data.message === 'MFA required') {
          setToken(data.tempToken);
          setStep('mfa');
        } else {
          Alert.alert('Unknown response', data.message);
        }
      } else {
        Alert.alert('Login failed', data.message || 'Unknown error');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Network error', 'Unable to reach server');
    }
  };

  const handleVerify = async () => {
    if (!otp) {
      Alert.alert('Enter code', 'Please enter the code you received');
      return;
    }

    try {
      const res = await fetch(`${SERVER_URI}/api/verify-mfa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, token }),
      });

      const data = await res.json();

      if (res.ok && data.message === 'MFA verified') {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('userId', data.user.id);
        await AsyncStorage.setItem('email', data.user.email);

        navigation.navigate('Home' as never);
      } else {
        Alert.alert('Invalid code', data.message || 'Try again');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Login</Text>

      <View style={styles.formView}>
        {step === 'login' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity onPress={handleLogin} style={styles.loginBtn}>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Signup' as never)}>
              <Text style={styles.switchText}>New to PackTrack? Sign up!</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>Enter the 6-digit code sent to your device</Text>
            <TextInput
              style={styles.input}
              placeholder="MFA Code"
              placeholderTextColor="#aaa"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity onPress={handleVerify} style={styles.loginBtn}>
              <Text style={styles.loginText}>Verify</Text>
            </TouchableOpacity>
          </>
        )}
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
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#f3631a',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  formView: {
    marginTop: 80,
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
  loginBtn: {
    backgroundColor: '#f3631a',
    paddingVertical: 15,
    width: width * 0.65,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    marginTop: 20,
    color: '#aaa',
  },
});

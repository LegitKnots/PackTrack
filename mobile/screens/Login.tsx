"use client"

import React, { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from "react-native"

import { styles } from "../styles/Login.styles"

import AsyncStorage from "@react-native-async-storage/async-storage"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../context/AuthContext"
import { SERVER_URI } from "../config"

export default function Login() {
  const [step, setStep] = useState<"login" | "mfa">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [tempToken, setTempToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigation = useNavigation()
  const { login, refreshUser } = useAuth() // Moved useAuth hook to the top

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter both email and password")
      return
    }

    setIsLoading(true)
    try {
      const result = await login(email, password)

      if (result.success) {
        // Login successful, AuthContext will handle navigation
        navigation.navigate("HomeNavigation" as never)
      } else if (result.requiresMFA) {
        // MFA required
        setTempToken(result.tempToken || "")
        setStep("mfa")
      } else {
        Alert.alert("Login failed", result.message || "Unknown error")
      }
    } catch (err) {
      console.error("Login error:", err)
      Alert.alert("Network error", "Unable to reach server")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!otp) {
      Alert.alert("Enter code", "Please enter the code you received")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`${SERVER_URI}/api/verify-mfa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, token: tempToken }),
      })

      const data = await res.json()

      if (res.ok && data.message === "MFA verified") {
        // Store auth data
        await AsyncStorage.setItem("token", data.token)
        await AsyncStorage.setItem("userId", data.user.id)
        await AsyncStorage.setItem("email", data.user.email)
        await AsyncStorage.setItem("fullname", data.user.fullname)

        if (data.user.username) {
          await AsyncStorage.setItem("username", data.user.username)
        }

        // Manually update AuthContext state
        await refreshUser()

        navigation.navigate("HomeNavigation" as never)
      } else {
        Alert.alert("Invalid code", data.message || "Try again")
      }
    } catch (err) {
      console.error("MFA verification error:", err)
      Alert.alert("Error", "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text style={styles.title}>Login</Text>

      <View style={styles.formView}>
        {step === "login" ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={handleLogin}
              style={[styles.loginBtn, isLoading && { opacity: 0.6 }]}
              disabled={isLoading}
            >
              <Text style={styles.loginText}>{isLoading ? "Logging in..." : "Login"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("Signup" as never)}>
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
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={handleVerify}
              style={[styles.loginBtn, isLoading && { opacity: 0.6 }]}
              disabled={isLoading}
            >
              <Text style={styles.loginText}>{isLoading ? "Verifying..." : "Verify"}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

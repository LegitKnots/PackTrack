"use client"

import { useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { SERVER_URI } from "../config"
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from "react-native"

import { styles } from "../styles/Landing.styles"
import { useNavigation } from "@react-navigation/native"
import type { LandingScreenNavProp } from "../types/navigation"

const logo = require("../src/img/logo.png")

export default function Landing() {
  const navigation = useNavigation<LandingScreenNavProp>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem("token")
        const userId = await AsyncStorage.getItem("userId")

        if (!token || !userId) {
          setIsLoading(false)
          return
        }

        const res = await fetch(`${SERVER_URI}/api/users/${userId}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.ok) {
          navigation.navigate("HomeNavigation")
        } else {
          // Token invalid or expired
          setIsLoading(false)
        }
      } catch (err) {
        console.warn("Auto-login failed:", err)
        setIsLoading(false)
      }
    }

    checkToken()
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PackTrack</Text>
      <Image source={logo} style={styles.landingIcon} />
      <Text style={styles.subtitle}>Every ride, in sync.</Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      ) : (
        <View style={styles.btnsView}>
          <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.loginBtn}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Signup")} style={styles.signupBtn}>
            <Text style={styles.signupText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { SERVER_URI } from "../config"

interface User {
  _id: string
  id: string
  email: string
  fullname: string
  username?: string
  profilePicUrl?: string
  bio?: string
  bike?: string
  location?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string; requiresMFA?: boolean; tempToken?: string }>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  refreshUser: () => Promise<void>
  setAuthData: (token: string, user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!(user && token)

  useEffect(() => {
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token")
      const storedUserId = await AsyncStorage.getItem("userId")

      if (storedToken && storedUserId) {
        setToken(storedToken)

        // Fetch user profile
        const response = await fetch(`${SERVER_URI}/api/users/${storedUserId}/profile`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          // Token might be invalid, clear storage
          await clearAuthData()
        }
      }
    } catch (error) {
      console.error("Error checking auth state:", error)
      await clearAuthData()
    } finally {
      setIsLoading(false)
    }
  }

  const clearAuthData = async () => {
    await AsyncStorage.multiRemove(["token", "userId", "email", "fullname", "username"])
    setUser(null)
    setToken(null)
  }

  const setAuthData = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${SERVER_URI}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.message === "Login successful") {
          // Store auth data
          await AsyncStorage.setItem("token", data.token)
          await AsyncStorage.setItem("userId", data.user.id)
          await AsyncStorage.setItem("email", data.user.email)
          await AsyncStorage.setItem("fullname", data.user.fullname)

          if (data.user.username) {
            await AsyncStorage.setItem("username", data.user.username)
          }

          // Update context state immediately
          setToken(data.token)
          setUser(data.user)

          return { success: true }
        } else if (data.message === "MFA required") {
          return {
            success: false,
            requiresMFA: true,
            tempToken: data.tempToken,
            message: "MFA verification required",
          }
        }
      }

      return { success: false, message: data.message || "Login failed" }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, message: "Network error. Please try again." }
    }
  }

  const logout = async () => {
    await clearAuthData()
  }

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null))
  }

  const refreshUser = async () => {
    const storedToken = await AsyncStorage.getItem("token")
    const storedUserId = await AsyncStorage.getItem("userId")

    if (!storedToken || !storedUserId) return

    try {
      const response = await fetch(`${SERVER_URI}/api/users/${storedUserId}/profile`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setToken(storedToken)
        setUser(data.user)
      } else {
        await clearAuthData()
      }
    } catch (error) {
      console.error("Error refreshing user:", error)
      await clearAuthData()
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    refreshUser,
    setAuthData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

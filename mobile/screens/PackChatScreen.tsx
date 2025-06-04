"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation, useRoute } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import { styles } from "../styles/PackChatScreen.styles"
import { SERVER_URI } from "../config"
import type { PackChatRouteProp } from "../types/navigation"
import Header from "../components/Header"

interface Message {
  id: string
  text: string
  userId: string
  username: string
  fullname: string
  timestamp: any
  type: "message" | "system"
}

export default function PackChatScreen() {
  const navigation = useNavigation()
  const route = useRoute<PackChatRouteProp>()
  const pack = route.params.pack

  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    const initializeChat = async () => {
      const userId = await AsyncStorage.getItem("userId")
      setCurrentUserId(userId)
      await fetchMessages()
    }

    initializeChat()
  }, [])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem("token")

      if (!token) {
        Alert.alert("Error", "Authentication required")
        return
      }

      const response = await fetch(`${SERVER_URI}/api/packs/${pack.id}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch messages")
      }

      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error: any) {
      console.error("Error fetching messages:", error)
      Alert.alert("Error", error.message || "Failed to load messages")
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    const messageText = newMessage.trim()
    setNewMessage("")
    setSending(true)

    try {
      const token = await AsyncStorage.getItem("token")

      if (!token) {
        Alert.alert("Error", "Authentication required")
        return
      }

      const response = await fetch(`${SERVER_URI}/api/packs/${pack.id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: messageText,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to send message")
      }

      const newMsg = await response.json()
      setMessages((prev) => [...prev, newMsg])

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    } catch (error: any) {
      console.error("Error sending message:", error)
      Alert.alert("Error", error.message || "Failed to send message")
      setNewMessage(messageText) // Restore message on error
    } finally {
      setSending(false)
    }
  }

  const formatTimestamp = (timestamp: any): string => {
    try {
      const date = new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString()
    } catch (error) {
      return "Recently"
    }
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.userId === currentUserId
    const isSystemMessage = item.type === "system"

    if (isSystemMessage) {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      )
    }

    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
        <View style={[styles.messageBubble, isOwnMessage && styles.ownMessageBubble]}>
          {!isOwnMessage && <Text style={styles.senderName}>{item.fullname || item.username || "Unknown"}</Text>}
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>{item.text}</Text>
          <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Header title={`${pack.name} Chat`} onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f3631a" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Header title={`${pack.name} Chat`} onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView style={styles.chatContainer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#666"
            multiline
            maxLength={500}
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

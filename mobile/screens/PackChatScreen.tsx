"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { View, Text, TouchableOpacity, Platform, Alert, ActivityIndicator, Animated, StatusBar } from "react-native"
import {
  GiftedChat,
  type IMessage,
  type User,
  Send,
  Bubble,
  InputToolbar,
  Composer,
  Avatar,
} from "react-native-gifted-chat"
import { ChevronLeft, Info, Send as SendIcon, Reply } from "lucide-react-native"
import { useRoute, useNavigation } from "@react-navigation/native"
import io, { type Socket } from "socket.io-client"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../types/navigation"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import { SERVER_URI } from "../config"
import { useAuth } from "../context/AuthContext"
import { styles } from "../styles/PackChatScreen.styles"
import { PanGestureHandler, State } from "react-native-gesture-handler"
import { useSafeAreaInsets } from "react-native-safe-area-context"

MaterialIcons.loadFont()

type PackChatScreenRouteProp = RouteProp<RootStackParamList, "PackChat">

interface ServerMessage {
  id: string
  userId: string
  content: string
  type: string
  createdAt: string | { seconds: number; nanoseconds: number } | { _seconds: number; _nanoseconds: number }
  user: {
    id: string
    username: string
    profilePicUrl?: string
  }
}

interface TypingUser {
  userId: string
  username: string
  isTyping: boolean
}

export default function PackChatScreen() {
  const route = useRoute<PackChatScreenRouteProp>()
  const navigation = useNavigation()
  const { packId } = route.params
  const { user, token } = useAuth()
  const insets = useSafeAreaInsets()

  const [messages, setMessages] = useState<IMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [packName, setPackName] = useState<string>("Pack Chat")
  const [replyingTo, setReplyingTo] = useState<IMessage | null>(null)

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const swipeAnimations = useRef<{ [key: string]: Animated.Value }>({})

  useEffect(() => {
    if (!user || !token) {
      Alert.alert("Error", "Please log in again")
      navigation.goBack()
      return
    }

    initializeChat()
    return () => {
      if (socket) {
        socket.disconnect()
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [user, token])

  const getSwipeAnimation = (messageId: string) => {
    if (!swipeAnimations.current[messageId]) {
      swipeAnimations.current[messageId] = new Animated.Value(0)
    }
    return swipeAnimations.current[messageId]
  }

  const convertFirebaseTimestamp = (
    timestamp: string | { seconds: number; nanoseconds: number } | { _seconds: number; _nanoseconds: number },
  ): Date => {
    try {
      if (typeof timestamp === "string") {
        const date = new Date(timestamp)
        if (!isNaN(date.getTime())) {
          return date
        }
      }

      if (timestamp && typeof timestamp === "object") {
        const seconds = (timestamp as any).seconds || (timestamp as any)._seconds
        const nanoseconds = (timestamp as any).nanoseconds || (timestamp as any)._nanoseconds

        if (typeof seconds === "number") {
          return new Date(seconds * 1000 + (nanoseconds || 0) / 1000000)
        }
      }

      console.warn("Invalid timestamp format:", timestamp)
      return new Date()
    } catch (error) {
      console.error("Error converting timestamp:", error, timestamp)
      return new Date()
    }
  }

  const convertToGiftedChatMessage = (serverMessage: ServerMessage): IMessage => {
    return {
      _id: serverMessage.id,
      text: serverMessage.content,
      createdAt: convertFirebaseTimestamp(serverMessage.createdAt),
      user: {
        _id: serverMessage.userId,
        name: serverMessage.user?.username || "Unknown User",
        avatar:
          serverMessage.user?.profilePicUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(serverMessage.user?.username || "U")}&background=f3631a&color=fff&size=128`,
      },
    }
  }

  const initializeChat = async () => {
    try {
      if (!token || !user) return

      const socketInstance = io(SERVER_URI, {
        transports: ["websocket"],
        auth: {
          token: token,
          userId: user.id || user._id,
        },
      })

      socketInstance.on("connect", () => {
        console.log("Connected to chat server")
        socketInstance.emit("join-pack", packId)
      })

      socketInstance.on("new-message", (message: ServerMessage) => {
        if (message.userId !== (user.id || user._id)) {
          const giftedMessage = convertToGiftedChatMessage(message)
          setMessages((previousMessages) => GiftedChat.append(previousMessages, [giftedMessage]))
        }
      })

      socketInstance.on("typing-users", (users: TypingUser[]) => {
        const filteredUsers = users.filter((u) => u.userId !== (user.id || user._id))
        setTypingUsers(filteredUsers)
      })

      socketInstance.on("error", (error: { message: string }) => {
        console.error("Socket error:", error)
        Alert.alert("Connection Error", error.message)
      })

      socketInstance.on("connect_error", (error) => {
        console.error("Socket connection error:", error)
        Alert.alert("Connection Error", "Failed to connect to chat server")
      })

      setSocket(socketInstance)

      await loadMessages()
      await fetchPackDetails()
    } catch (error) {
      console.error("Error initializing chat:", error)
      Alert.alert("Error", "Failed to initialize chat")
    }
  }

  const loadMessages = async () => {
    try {
      if (!token) return

      const response = await fetch(`${SERVER_URI}/api/chat/pack/${packId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const serverMessages: ServerMessage[] = data.messages || []
        const giftedMessages = serverMessages.map(convertToGiftedChatMessage).reverse()
        setMessages(giftedMessages)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to load messages")
      }
    } catch (error) {
      console.error("Error loading messages:", error)
      Alert.alert("Error", "Failed to load messages")
    } finally {
      setLoading(false)
    }
  }

  const fetchPackDetails = async () => {
    try {
      if (!token) return

      const response = await fetch(`${SERVER_URI}/api/packs/${packId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const packData = await response.json()
        setPackName(packData.name || "Pack Chat")
      }
    } catch (error) {
      console.error("Error fetching pack details:", error)
    }
  }

  const handleSwipeGesture = (event: any, message: IMessage) => {
    const { translationX, state } = event.nativeEvent
    const isCurrentUser = message.user._id === currentUser._id
    const swipeThreshold = 50
    const maxSwipe = 80
    const messageId = message._id.toString()
    const swipeAnim = getSwipeAnimation(messageId)

    if (state === State.ACTIVE) {
      // Calculate the appropriate translation based on user and swipe direction
      let clampedTranslation = 0

      if (isCurrentUser) {
        // For current user messages: only allow left swipes (negative values)
        clampedTranslation = Math.max(-maxSwipe, Math.min(0, translationX))
      } else {
        // For other user messages: only allow right swipes (positive values)
        clampedTranslation = Math.max(0, Math.min(maxSwipe, translationX))
      }

      swipeAnim.setValue(clampedTranslation)
    }

    if (state === State.END) {
      // Animate back to original position
      Animated.spring(swipeAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start()

      // Check if swipe threshold was met
      const shouldTriggerReply = isCurrentUser
        ? translationX < -swipeThreshold // Swipe left for current user messages
        : translationX > swipeThreshold // Swipe right for other user messages

      if (shouldTriggerReply) {
        setReplyingTo(message)
      }
    }
  }

  const cancelReply = () => {
    setReplyingTo(null)
  }

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      if (sending || !socket || !token || newMessages.length === 0) return

      setSending(true)
      const message = newMessages[0]

      try {
        const messageData: any = {
          content: message.text,
          type: "text",
        }

        // Add reply reference if replying to a message
        if (replyingTo) {
          messageData.replyTo = replyingTo._id
          messageData.replyToText = replyingTo.text
          messageData.replyToUser = replyingTo.user.name
        }

        const response = await fetch(`${SERVER_URI}/api/chat/pack/${packId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(messageData),
        })

        if (response.ok) {
          const serverMessage = await response.json()
          const giftedMessage = convertToGiftedChatMessage(serverMessage)

          setMessages((previousMessages) => GiftedChat.append(previousMessages, [giftedMessage]))

          socket.emit("send-message", {
            packId,
            content: message.text,
            replyTo: replyingTo?._id,
          })

          // Clear reply state
          setReplyingTo(null)

          socket.emit("typing", packId)
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
          }
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to send message")
        }
      } catch (error) {
        console.error("Error sending message:", error)
        Alert.alert("Error", "Failed to send message")
      } finally {
        setSending(false)
      }
    },
    [sending, socket, token, packId, replyingTo],
  )

  const onInputTextChanged = (text: string) => {
    if (text === "") return
    if (!socket || !user) return

    if (text.trim().length > 0) {
      socket.emit("typing", packId)

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing", packId)
      }, 2000)
    } else {
      socket.emit("typing", packId)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }

  const renderBubble = (props: any) => {
    const isCurrentUser = props.currentMessage?.user?._id === currentUser._id
    const message = props.currentMessage
    const messageId = message._id.toString()
    const swipeAnim = getSwipeAnimation(messageId)

    if (isCurrentUser) {
      // Custom wrapper for current user messages with swipe gesture
      return (
        <View style={styles.rightMessageWrapper}>
          <PanGestureHandler
            onGestureEvent={(event) => handleSwipeGesture(event, message)}
            onHandlerStateChange={(event) => handleSwipeGesture(event, message)}
            activeOffsetX={[-10, 10]}
            failOffsetY={[-5, 5]}
          >
            <Animated.View
              style={{
                transform: [{ translateX: swipeAnim }],
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Animated.View
                style={{
                  opacity: swipeAnim.interpolate({
                    inputRange: [-80, -30, 0],
                    outputRange: [1, 0.5, 0],
                    extrapolate: "clamp",
                  }),
                  marginRight: 8,
                }}
              >
                <Reply size={20} color="#f3631a" />
              </Animated.View>
              <Bubble
                {...props}
                wrapperStyle={{
                  right: {
                    backgroundColor: "#f3631a",
                    marginRight: 0,
                  },
                }}
                containerStyle={{
                  right: {
                    marginRight: 0,
                  },
                }}
                textStyle={{
                  right: {
                    color: "#fff",
                  },
                }}
                timeTextStyle={{
                  right: {
                    color: "rgba(255, 255, 255, 0.7)",
                  },
                }}
              />
            </Animated.View>
          </PanGestureHandler>
        </View>
      )
    }

    // Default bubble for other users with swipe gesture
    return (
      <PanGestureHandler
        onGestureEvent={(event) => handleSwipeGesture(event, message)}
        onHandlerStateChange={(event) => handleSwipeGesture(event, message)}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-5, 5]}
      >
        <Animated.View
          style={{
            transform: [{ translateX: swipeAnim }],
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Bubble
            {...props}
            wrapperStyle={{
              left: {
                backgroundColor: "#2a2a2a",
              },
            }}
            textStyle={{
              left: {
                color: "#fff",
              },
            }}
            timeTextStyle={{
              left: {
                color: "#666",
              },
            }}
          />
          <Animated.View
            style={{
              opacity: swipeAnim.interpolate({
                inputRange: [0, 30, 80],
                outputRange: [0, 0.5, 1],
                extrapolate: "clamp",
              }),
              marginLeft: 8,
            }}
          >
            <Reply size={20} color="#f3631a" />
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    )
  }

  const renderInputToolbar = (props: any) => {
    return (
      <View>
        {replyingTo && (
          <View style={styles.replyContainer}>
            <View style={styles.replyContent}>
              <Text style={styles.replyLabel}>Replying to {replyingTo.user.name}</Text>
              <Text style={styles.replyText} numberOfLines={1}>
                {replyingTo.text}
              </Text>
            </View>
            <TouchableOpacity onPress={cancelReply} style={styles.cancelReplyButton}>
              <Text style={styles.cancelReplyText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        <InputToolbar {...props} containerStyle={styles.inputToolbar} primaryStyle={styles.inputPrimary} />
      </View>
    )
  }

  const renderComposer = (props: any) => {
    return <Composer {...props} textInputStyle={styles.textInput} placeholderTextColor="#666" />
  }

  const renderSend = (props: any) => {
    return (
      <Send {...props} containerStyle={styles.sendContainer}>
        <View style={[styles.sendButton, sending && styles.sendButtonDisabled]}>
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <SendIcon size={20} color="#fff" />}
        </View>
      </Send>
    )
  }

  const renderFooter = () => {
    if (typingUsers.length === 0) return null

    const typingText =
      typingUsers.length === 1
        ? `${typingUsers[0].username} is typing...`
        : `${typingUsers.length} people are typing...`

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <Text style={styles.typingText}>{typingText}</Text>
          <View style={styles.typingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        </View>
      </View>
    )
  }

  const renderAvatar = (props: any) => {
    const isCurrentUser = props.currentMessage?.user?._id === currentUser._id

    // Don't render avatar for current user
    if (isCurrentUser) {
      return null
    }

    // Use default Avatar component for other users
    return (
      <Avatar
        {...props}
        imageStyle={{
          left: {
            width: 32,
            height: 32,
            borderRadius: 16,
          },
        }}
        containerStyle={{
          left: {
            marginRight: 8,
          },
        }}
      />
    )
  }

  const currentUser: User = {
    _id: user?.id || user?._id || "",
    name: user?.username || "You",
    avatar: user?.profilePicUrl || undefined,
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        {/* Status bar background fill */}
        <View style={[styles.statusBarFill, { height: insets.top }]} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f3631a" />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Status bar background fill */}
      <View style={[styles.statusBarFill, { height: insets.top }]} />

      {/* Header positioned right under dynamic island */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{packName}</Text>
        <TouchableOpacity style={styles.infoButton}>
          <Info size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Chat Content */}
      <View style={styles.chatContainer}>
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={currentUser}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderComposer={renderComposer}
          renderSend={renderSend}
          renderChatFooter={renderFooter}
          renderAvatar={renderAvatar}
          onInputTextChanged={onInputTextChanged}
          alwaysShowSend
          keyboardShouldPersistTaps="always"
          showUserAvatar={true}
          showAvatarForEveryMessage={true}
          renderAvatarOnTop={false}
          inverted={true}
          bottomOffset={Platform.OS === "ios" ? Math.max(insets.bottom, 8) : 8}
          minInputToolbarHeight={60}
          messagesContainerStyle={styles.messagesContainer}
          textInputProps={{
            returnKeyType: "send",
            blurOnSubmit: false,
            multiline: true,
            numberOfLines: 4,
          }}
        />
      </View>
    </View>
  )
}

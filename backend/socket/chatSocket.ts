import type { Server as HttpServer } from "http"
import { Server as SocketIOServer, type Socket } from "socket.io"
import jwt from "jsonwebtoken"
import { collections } from "../config/firebase"

interface User {
  uid: string
  email: string
  username: string
}

interface TypingUser {
  userId: string
  username: string
  timestamp: number
}

// Store typing status by pack ID
const typingUsers: Record<string, Record<string, TypingUser>> = {}

// Clean up typing indicators after timeout
const TYPING_TIMEOUT = 3000 // 3 seconds

export const initializeChatSocket = (server: HttpServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*", // In production, restrict this to your app's domain
      methods: ["GET", "POST"],
    },
  })

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      const userId = socket.handshake.auth.userId

      if (!token || !userId) {
        return next(new Error("Authentication error: No token or userId provided"))
      }

      try {
        // Verify the JWT token (replace 'your-secret-key' with your actual secret)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any

        // Get user data from database
        const userDoc = await collections.users.doc(userId).get()

        if (!userDoc.exists) {
          return next(new Error("Authentication error: User not found"))
        }

        const userData = userDoc.data()

        // Attach user data to socket
        socket.data.user = {
          uid: userId,
          email: userData?.email || "",
          username: userData?.username || userData?.fullname || "Unknown User",
        }

        next()
      } catch (tokenError: any) {
        console.error("Socket token verification error:", tokenError.message)
        next(new Error("Authentication error: Invalid token"))
      }
    } catch (error) {
      console.error("Socket authentication error:", error)
      next(new Error("Internal server error during authentication"))
    }
  })

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as User
    console.log(`User connected: ${user.username} (${user.uid})`)

    // Join a pack's chat room
    socket.on("join-pack", async (packId: string) => {
      try {
        // Verify user is a member of the pack
        const packDoc = await collections.packs.doc(packId).get()

        if (!packDoc.exists) {
          socket.emit("error", { message: "Pack not found" })
          return
        }

        const packData = packDoc.data()
        const isMember =
          packData?.members?.includes(user.uid) || packData?.admins?.includes(user.uid) || packData?.owner === user.uid

        if (!isMember) {
          socket.emit("error", { message: "You are not a member of this pack" })
          return
        }

        socket.join(packId)
        console.log(`User ${user.username} joined pack: ${packId}`)

        // Initialize typing users for this pack if needed
        if (!typingUsers[packId]) {
          typingUsers[packId] = {}
        }
      } catch (error) {
        console.error("Error joining pack:", error)
        socket.emit("error", { message: "Failed to join pack" })
      }
    })

    // Handle new messages
    socket.on("send-message", async (data: { packId: string; content: string }) => {
      try {
        const { packId, content } = data

        if (!packId || !content.trim()) {
          socket.emit("error", { message: "Invalid message data" })
          return
        }

        // Remove user from typing list
        if (typingUsers[packId] && typingUsers[packId][user.uid]) {
          delete typingUsers[packId][user.uid]
          emitTypingUsers(packId)
        }

        // The message is already saved via the REST API, just broadcast to other users
        socket.to(packId).emit("new-message", {
          id: Date.now().toString(), // Temporary ID, real one comes from API
          content,
          userId: user.uid,
          createdAt: new Date().toISOString(),
          user: {
            id: user.uid,
            username: user.username,
          },
        })
      } catch (error) {
        console.error("Error handling message:", error)
        socket.emit("error", { message: "Failed to process message" })
      }
    })

    // Handle typing status
    socket.on("typing", (packId: string) => {
      if (!typingUsers[packId]) {
        typingUsers[packId] = {}
      }

      // Add or update user in typing list
      typingUsers[packId][user.uid] = {
        userId: user.uid,
        username: user.username,
        timestamp: Date.now(),
      }

      // Broadcast typing users
      emitTypingUsers(packId)

      // Set timeout to remove user from typing list
      setTimeout(() => {
        if (typingUsers[packId] && typingUsers[packId][user.uid]) {
          const elapsed = Date.now() - typingUsers[packId][user.uid].timestamp

          if (elapsed >= TYPING_TIMEOUT) {
            delete typingUsers[packId][user.uid]
            emitTypingUsers(packId)
          }
        }
      }, TYPING_TIMEOUT)
    })

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${user.username} (${user.uid})`)

      // Remove user from all typing lists
      Object.keys(typingUsers).forEach((packId) => {
        if (typingUsers[packId][user.uid]) {
          delete typingUsers[packId][user.uid]
          emitTypingUsers(packId)
        }
      })
    })
  })

  // Helper function to emit typing users
  function emitTypingUsers(packId: string) {
    const typingList = Object.values(typingUsers[packId] || {})
    io.to(packId).emit("typing-users", typingList)
  }

  // Periodically clean up stale typing indicators
  setInterval(() => {
    const now = Date.now()
    let changes = false

    Object.keys(typingUsers).forEach((packId) => {
      Object.keys(typingUsers[packId]).forEach((uid) => {
        const elapsed = now - typingUsers[packId][uid].timestamp

        if (elapsed >= TYPING_TIMEOUT) {
          delete typingUsers[packId][uid]
          changes = true
        }
      })

      if (changes) {
        emitTypingUsers(packId)
      }
    })
  }, 1000) // Check every second

  return io
}

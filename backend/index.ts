import dotenv from "dotenv"
dotenv.config()

import express from "express"
import cors from "cors"
import { createServer } from "http"
import "./config/firebase"

// Import routes
import authRoute from "./routes/auth"
import userRoute from "./routes/user"
import routeRoute from "./routes/route"
import packRoute from "./routes/pack"
import searchRoute from "./routes/search"
import chatRoute from "./routes/chat"
import shareLinkHandler from "./handlers/share"

// Import socket handler
import { initializeChatSocket } from "./socket/chatSocket"

const app = express()
const server = createServer(app)
const PORT = Number.parseInt(process.env.PORT || "3001", 10)

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use("/api", authRoute)
app.use("/api/users", userRoute)
app.use("/api/routes", routeRoute)
app.use("/api/packs", packRoute)
app.use("/api/search", searchRoute)
app.use("/api/chat", chatRoute)

app.use("/share", shareLinkHandler)

// Health check route
app.get("/", (_req, res) => {
  res.send("🚀 Backend running with real-time chat")
})

// Initialize Socket.IO after all middleware and routes
const io = initializeChatSocket(server)

// Development mode flag
const isDevelopment = process.env.NODE_ENV !== "production"
if (isDevelopment) {
  console.log("⚠️ Running in DEVELOPMENT mode - authentication may be relaxed")
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Server listening on http://0.0.0.0:${PORT}`)
  console.log("🔌 Socket.IO initialized for real-time chat")
})

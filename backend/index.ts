import dotenv from "dotenv"
import express from "express"
import cors from "cors"
import "./config/firebase"

// Import routes
import authRoute from "./routes/auth"
import userRoute from "./routes/user"
import routeRoute from "./routes/route"
import packRoute from "./routes/pack"
import searchRoute from "./routes/search"
import shareLinkHandler from "./handlers/share"

// Initialize environment variables
dotenv.config()

const app = express()
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

app.use("/share", shareLinkHandler)

// Health check route
app.get("/", (_req, res) => {
  res.send("🚀 Backend running")
})


app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Server listening on http://0.0.0.0:${PORT} (with potential database issues)`)
})


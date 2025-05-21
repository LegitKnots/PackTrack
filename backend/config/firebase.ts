import admin from "firebase-admin"
import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"
import fs from "fs"
import path from "path"

// Initialize Firebase Admin SDK
let serviceAccount

// Try to load service account from file first
try {
  const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json")
  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = require(serviceAccountPath)
  }
} catch (error) {
  console.warn("Could not load service account from file:", error)
}

// If no service account from file, try environment variables
if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  } catch (error) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT env variable:", error)
  }
}

// Validate service account has required fields
if (!serviceAccount || !serviceAccount.project_id) {
  console.error("Service account is missing required fields. Check your configuration.")
  // Provide a fallback for development if needed
  if (process.env.NODE_ENV === "development") {
    console.warn("Using fallback configuration for development")
    serviceAccount = {
      project_id: process.env.FIREBASE_PROJECT_ID || "packtrack-dev",
      client_email: process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk@packtrack-dev.iam.gserviceaccount.com",
      private_key: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }
  }
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`,
    })
    console.log("Firebase Admin SDK initialized successfully")
  } catch (error) {
    console.error("Firebase initialization error:", error)
    throw error
  }
}

const db = getFirestore()
const auth = admin.auth()
const storage = getStorage().bucket()

// Collection references
const collections = {
  users: db.collection("users"),
  routes: db.collection("routes"),
  packs: db.collection("packs"),
  rides: db.collection("rides"),
  invitations: db.collection("invitations"),
  accessLogs: db.collection("accessLogs"),
}

export { db, auth, storage, collections }

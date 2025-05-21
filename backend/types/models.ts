import type { Timestamp } from "firebase-admin/firestore"

export interface User {
  id: string
  username?: string
  email: string
  passwordHash: string
  mfaEnabled: boolean
  mfaSecret?: string
  fullname?: string
  packs?: string[] // Array of pack IDs
  bike?: string
  bio?: string
  location?: string
  profilePicUrl?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Route {
  id: string
  name: string
  description?: string
  tags: string[]
  createdBy: string // User ID
  collaborators: string[] // Array of user IDs
  packId?: string
  waypoints: Waypoint[]
  distance?: string
  visibility: "public" | "private"
  isShared: boolean
  shareCode?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Waypoint {
  lat: number
  lng: number
  label?: string
  order: number
}

export interface Pack {
  id: string
  name: string
  description?: string
  createdBy: string // User ID
  members: string[] // Array of user IDs
  admins?: string[] // Array of user IDs
  routes: string[] // Array of route IDs
  chatEnabled: boolean
  imageURI?: string
  tags?: PackTag[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface PackTag {
  tagName: string
}

export interface Location {
  userId: string
  packId?: string
  lat: number
  lng: number
  timestamp: number
}

export interface AccessLog {
  userId: string
  time: number
  ip?: string
  userAgent?: string
}

export interface MfaCode {
  code: string
  expiresAt: number
}

export interface MfaCodes {
  [email: string]: MfaCode
}

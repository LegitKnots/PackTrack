import type { Request, Response } from "express"
import { collections } from "../config/firebase"
import { hashPassword, comparePassword } from "../utils/password"
import { generateToken, generateTempToken } from "../utils/tokens"
import type { User, MfaCodes } from "../types/models"
import { Timestamp } from "firebase-admin/firestore"
import { v4 as uuidv4 } from "uuid"

// Temporary in-memory store for MFA codes
const mfaCodes: MfaCodes = {}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" })
      return
    }

    // Find user by email
    const userSnapshot = await collections.users.where("email", "==", email).limit(1).get()

    if (userSnapshot.empty) {
      res.status(401).json({ message: "Invalid email" })
      return
    }

    const userDoc = userSnapshot.docs[0]
    const user = { id: userDoc.id, ...userDoc.data() } as User

    // Validate password
    const isValid = await comparePassword(password, user.passwordHash)
    if (!isValid) {
      res.status(401).json({ message: "Invalid password" })
      return
    }

    // Handle MFA if enabled
    if (user.mfaEnabled) {
      const code = Math.floor(100000 + Math.random() * 900000).toString()

      // Store code with expiration (5 minutes)
      mfaCodes[email] = {
        code,
        expiresAt: Date.now() + 5 * 60 * 1000,
      }

      console.log(`🔐 MFA code for ${email}: ${code}`)

      // Create a temporary token
      const tempToken = generateTempToken(user.id, email)

      res.status(200).json({
        message: "MFA required",
        tempToken,
      })
      return
    }

    // Create JWT token
    const token = generateToken(user.id, email)


    // Log access
    try {
      await collections.accessLogs.add({
        userId: user.id,
        time: Date.now(),
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      })
    } catch (error) {
      console.warn("Could not log access:", error)
    }

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
      },
    })
  } catch (error: any) {
    console.error("Login error with email/password:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const verifyMFA = async (req: Request, res: Response): Promise<void> => {
  try {
    const { otp, email } = req.body

    if (!otp || !email) {
      res.status(400).json({ message: "OTP and email are required" })
      return
    }

    // Check if MFA code exists and is valid
    const mfaData = mfaCodes[email]
    if (!mfaData) {
      res.status(401).json({ message: "No MFA code found" })
      return
    }

    // Check if code is expired
    if (Date.now() > mfaData.expiresAt) {
      delete mfaCodes[email]
      res.status(401).json({ message: "MFA code expired" })
      return
    }

    // Verify the OTP
    if (otp === mfaData.code) {
      delete mfaCodes[email]

      // Find user by email
      const userSnapshot = await collections.users.where("email", "==", email).limit(1).get()

      if (userSnapshot.empty) {
        res.status(401).json({ message: "User not found" })
        return
      }

      const userDoc = userSnapshot.docs[0]
      const user = { id: userDoc.id, ...userDoc.data() } as User

      // Create a full authentication token
      const token = generateToken(user.id, email)

      // Log access
      try {
        await collections.accessLogs.add({
          userId: user.id,
          time: Date.now(),
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        })
      } catch (error) {
        console.warn("Could not log access:", error)
      }

      res.status(200).json({
        message: "MFA verified",
        token,
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
        },
      })
    } else {
      res.status(401).json({ message: "Invalid code" })
    }
  } catch (error: any) {
    console.error("MFA verification error:", error)
    res.status(403).json({ message: "Invalid token" })
  }
}

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullname, email, password } = req.body

    if (!fullname || !email || !password) {
      res.status(400).json({ message: "Full name, email, and password are required." })
      return
    }

    // Check if user already exists
    const existingUser = await collections.users.where("email", "==", email).limit(1).get()

    if (!existingUser.empty) {
      res.status(400).json({ message: "Email already registered" })
      return
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Generate a unique ID for the user
    const userId = uuidv4()

    // Create user in Firestore
    const now = Timestamp.now()
    const newUser: User = {
      id: userId,
      email,
      fullname,
      passwordHash,
      mfaEnabled: false,
      packs: [],
      createdAt: now,
      updatedAt: now,
    }

    // Save user to Firestore
    await collections.users.doc(userId).set(newUser)

    // Create JWT token
    const token = generateToken(userId, email)

    res.status(201).json({
      message: "Signup successful",
      token,
      user: {
        id: userId,
        email,
        fullname,
      },
    })
  } catch (error: any) {
    console.error("Signup error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

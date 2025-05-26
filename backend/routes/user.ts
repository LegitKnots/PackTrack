import { Router, Request, Response, NextFunction, RequestHandler } from "express"
import { updateProfile, getUserProfile } from "../controllers/userController"
import auth from "../middleware/auth"
import type { AuthRequest } from "../types/express"

import multer from "multer"
import path from "path"
import fs from "fs"
import { collections } from "../config/firebase"
import { Timestamp } from "firebase-admin/firestore"

const router = Router()

// Helper to wrap async route handlers and catch errors
const asyncHandler = (
  fn: (req: AuthRequest, res: Response) => Promise<any>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as AuthRequest, res)).catch(next)
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/profiles")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Only image files are allowed"))
    }
  },
})


// Upload profile picture
router.post(
  "/:userId/profile-picture",
  auth as RequestHandler,
  upload.single("profilePicture"),
  asyncHandler(async (req, res) => {
    try {
      const { userId } = req.params

      // Verify user is updating their own profile
      if (req.user?.uid !== userId) {
        return res.status(403).json({ message: "Unauthorized to update this profile" })
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" })
      }

      // Get the file URL (in production, you'd upload to cloud storage)
      const profilePicUrl = `/uploads/profiles/${req.file.filename}`

      // Update user profile with new picture URL
      const userRef = collections.users.doc(userId)
      await userRef.update({
        profilePicUrl,
        updatedAt: Timestamp.now(),
      })

      res.json({
        message: "Profile picture updated successfully",
        profilePicUrl,
      })
    } catch (error: any) {
      console.error("Profile picture upload error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }),
)

// GET /api/users/:userId/profile
router.get(
  "/:userId/profile",
  auth as RequestHandler,
  asyncHandler(getUserProfile)
)

// PATCH /api/users/:userId/profile
router.patch(
  "/:userId/profile",
  auth as RequestHandler,
  asyncHandler(updateProfile)
)

export default router
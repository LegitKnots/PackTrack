import { Router, RequestHandler, Response } from "express"
import { updateProfile, getUserProfile } from "../controllers/userController"
import auth from "../middleware/auth"
import type { AuthRequest } from "../types/express"
import multer from "multer"
import admin from "firebase-admin"
import { collections } from "../config/firebase"
import { Timestamp } from "firebase-admin/firestore"

const router = Router()

// Helper to wrap async route handlers and catch errors
const asyncHandler = (
  fn: (req: AuthRequest, res: Response) => Promise<any>
): RequestHandler => (req, res, next) => {
  Promise.resolve(fn(req as AuthRequest, res)).catch(next)
}

// Configure multer to use memory storage for direct upload to Firebase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/
    const isAllowed = allowedTypes.test(file.mimetype.toLowerCase())
    if (isAllowed) cb(null, true)
    else cb(new Error("Only image files are allowed"))
  },
})

// POST /api/users/:userId/profile-picture
router.post(
  "/:userId/profile-picture",
  auth as RequestHandler,
  upload.single("profilePicture"),
  asyncHandler(async (req, res) => {
    const { userId } = req.params

    // Ensure user owns the profile
    if (req.user?.uid !== userId) {
      return res.status(403).json({ message: "Unauthorized to update this profile" })
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    // Upload file buffer to Firebase Storage
    const bucket = admin.storage().bucket()
    const timestamp = Date.now()
    const safeName = req.file.originalname.replace(/\s+/g, "_")
    const remotePath = `profilePics/${userId}_${timestamp}_${safeName}`
    const file = bucket.file(remotePath)

    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
      public: true,
      validation: "md5",
    })
    await file.makePublic()

    const profilePicUrl = file.publicUrl()

    // Update user document
    await collections.users.doc(userId).update({
      profilePicUrl,
      updatedAt: Timestamp.now(),
    })

    res.json({
      message: "Profile picture updated successfully",
      profilePicUrl,
    })
  })
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

// PUT /api/users/:userId/profile
router.put(
  "/:userId/profile",
  auth as RequestHandler,
  asyncHandler(updateProfile)
)

export default router

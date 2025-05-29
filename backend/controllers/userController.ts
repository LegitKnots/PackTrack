import type { Response } from "express"
import { collections } from "../config/firebase"
import type { User } from "../types/models"
import type { AuthRequest } from "../types/express"
import { Timestamp } from "firebase-admin/firestore"

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params
    console.log(req.body)
    const { username, bio, bike, location } = req.body

    // Verify user is updating their own profile
    if (req.user?.uid !== userId) {
      res.status(403).json({ message: "Unauthorized to update this profile" })
      return
    }

    if (!username || !bike) {
      res.status(400).json({ message: "Username and bike are required." })
      return
    }

    // Check for duplicate username - modified to avoid needing a composite index
    const usernameSnapshot = await collections.users.where("username", "==", username).limit(10).get()

    // Manually filter out the current user
    const isDuplicate = usernameSnapshot.docs.some((doc) => doc.id !== userId)

    if (isDuplicate) {
      res.status(400).json({ message: "Username already taken." })
      return
    }

    // Update user profile
    const userRef = collections.users.doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      res.status(404).json({ message: "User not found." })
      return
    }

    // Update the user document
    await userRef.update({
      username,
      bio: bio || "",
      bike: bike || "",
      location: location || "",
      updatedAt: Timestamp.now(),
    })

    // Get the updated user
    const updatedUserDoc = await userRef.get()
    const updatedUserData = updatedUserDoc.data()

    if (!updatedUserData) {
      res.status(404).json({ message: "User data not found after update." })
      return
    }

    const updatedUser = { id: updatedUserDoc.id, ...updatedUserData } as User

    res.json({
      message: "Profile updated successfully.",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio || "",
        bike: updatedUser.bike || "",
        location: updatedUser.location || "",
        profilePicUrl: updatedUser.profilePicUrl || "",
      },
    })
  } catch (error: any) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params

    const userDoc = await collections.users.doc(userId).get()

    if (!userDoc.exists) {
      res.status(404).json({ message: "User not found" })
      return
    }

    const userData = userDoc.data()

    if (!userData) {
      res.status(404).json({ message: "User data not found" })
      return
    }

    const user = { id: userDoc.id, ...userData } as User

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        username: user.username,
        bio: user.bio,
        bike: user.bike,
        location: user.location,
        profilePicUrl: user.profilePicUrl || ''
      },
    })
  } catch (error: any) {
    console.error("🚨 Error in getUserProfile:", error)
    res.status(500).json({ message: "Server error" })
  }
}

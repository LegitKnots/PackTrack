import type { Response, NextFunction } from "express"
import { verifyToken } from "../utils/tokens"
import { collections } from "../config/firebase"
import type { AuthRequest } from "../types/express"

export default async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization || ""

  if (!authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing or invalid token." })
    return
  }

  const token = authHeader.split(" ")[1]

  try {
    const payload = verifyToken(token)

    if (!payload) {
      res.status(401).json({ message: "Invalid or expired token." })
      return
    }

    // Check if token is temporary (for MFA)
    if (payload.isTemp) {
      res.status(401).json({ message: "Temporary token. Complete MFA verification." })
      return
    }

    // Verify user exists
    const userDoc = await collections.users.doc(payload.userId).get()

    if (!userDoc.exists) {
      res.status(401).json({ message: "User not found." })
      return
    }

    // Set user in request
    req.user = {
      uid: payload.userId,
      email: payload.email,
    }

    next()
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token." })
  }
}

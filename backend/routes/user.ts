import { Router, Request, Response, NextFunction, RequestHandler } from "express"
import { updateProfile, getUserProfile } from "../controllers/userController"
import auth from "../middleware/auth"
import type { AuthRequest } from "../types/express"

const router = Router()

// Helper to wrap async route handlers and catch errors
const asyncHandler = (
  fn: (req: AuthRequest, res: Response) => Promise<any>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as AuthRequest, res)).catch(next)
  }
}

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
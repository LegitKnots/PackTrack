import { Router } from "express"
import { login, verifyMFA, signup } from "../controllers/authController"

const router = Router()

router.post("/login", login)
router.post("/verify-mfa", verifyMFA)
router.post("/signup", signup)

export default router

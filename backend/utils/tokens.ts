import jwt from "jsonwebtoken"

// Secret key for JWT - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

// Token expiration time
const TOKEN_EXPIRY = "24h" // 24 hours

interface TokenPayload {
  userId: string
  email: string
  isTemp?: boolean
}

export const generateToken = (userId: string, email: string): string => {
  const payload: TokenPayload = {
    userId,
    email,
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

export const generateTempToken = (userId: string, email: string): string => {
  const payload: TokenPayload = {
    userId,
    email,
    isTemp: true,
  }

  // Temporary tokens expire in 5 minutes
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "5m" })
}

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch (error) {
    return null
  }
}

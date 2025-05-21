import type { Request, Response, NextFunction } from "express"

declare global {
  namespace Express {
    interface Multer {
      File: {
        fieldname: string
        originalname: string
        encoding: string
        mimetype: string
        size: number
        destination: string
        filename: string
        path: string
        buffer: Buffer
      }
    }
  }
}

export interface AuthUser {
  uid: string
  email?: string
  name?: string
  role?: string
}

export interface AuthRequest extends Request {
  user?: AuthUser
  file?: Express.Multer.File
  files?: { [fieldname: string]: Express.Multer.File[] }
}

export type AuthRequestHandler = (req: AuthRequest, res: Response, next: NextFunction) => Promise<void> | void

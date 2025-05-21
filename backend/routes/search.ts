import { Router, Request, Response, NextFunction, RequestHandler } from "express"
import { collections } from "../config/firebase"
import auth from "../middleware/auth"
import type { AuthRequest } from "../types/express.d"

const router = Router()

// Wrap async handlers and forward errors
type AsyncFn = (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>
const asyncHandler = (fn: AsyncFn): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as AuthRequest, res, next)).catch(next)
  }
}

// GET /api/search/packs - Search for packs
router.get(
  "/packs",
  auth as RequestHandler,
  asyncHandler(async (req, res, next) => {
    const authReq = req as AuthRequest
    const q = authReq.query.q as string | undefined
    const tags = authReq.query.tags as string | undefined
    const hasChat = authReq.query.hasChat as string | undefined

    if (!authReq.user?.uid) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const packsSnapshot = await collections.packs.where("visibility", "==", "public").get()
    let packs = packsSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      description: doc.data().description,
      tags: doc.data().tags,
      options: doc.data().options,
      ...doc.data()
    }))

    if (q) {
      const searchQuery = q.toLowerCase()
      packs = packs.filter((pack) => {
        const name = (pack.name as string)?.toLowerCase() || ""
        const description = (pack.description as string)?.toLowerCase() || ""
        return name.includes(searchQuery) || description.includes(searchQuery)
      })
    }

    if (tags) {
      const tagList = tags.split(",")
      packs = packs.filter((pack) =>
        (pack.tags as string[] | undefined)?.some((tag) => tagList.includes(tag))
      )
    }

    if (hasChat !== undefined) {
      const chatEnabled = hasChat === "true"
      packs = packs.filter((pack) => pack.options?.hasChat === chatEnabled)
    }

    res.status(200).json(packs)
  })
)

// GET /api/search/users - Search for users
router.get(
  "/users",
  auth as RequestHandler,
  asyncHandler(async (req, res, next) => {
    const authReq = req as AuthRequest
    const q = authReq.query.q as string | undefined

    if (!authReq.user?.uid) {
      return res.status(401).json({ error: "Authentication required" })
    }

    if (!q) {
      return res.status(400).json({ error: "Search query is required" })
    }

    const searchQuery = q.toLowerCase()
    const usersSnapshot = await collections.users.limit(50).get()
    const users: Array<{ id: string; fullname: string; username: string; profileImage?: string }> = []

    usersSnapshot.forEach((doc) => {
      const data = doc.data()
      const fullname = (data.fullname as string)?.toLowerCase() || ""
      const username = (data.username as string)?.toLowerCase() || ""

      if (fullname.includes(searchQuery) || username.includes(searchQuery)) {
        users.push({
          id: doc.id,
          fullname: data.fullname as string,
          username: data.username as string,
          profileImage: data.profileImage as string,
        })
      }
    })

    res.status(200).json(users)
  })
)

// GET /api/search/packs/shared/:shareCode - Get a pack by share code
router.get(
  "/packs/shared/:shareCode",
  auth as RequestHandler,
  asyncHandler(async (req, res, next) => {
    const authReq = req as AuthRequest
    const { shareCode } = authReq.params

    if (!authReq.user?.uid) {
      return res.status(401).json({ error: "Authentication required" })
    }

    if (!shareCode) {
      return res.status(400).json({ error: "Share code is required" })
    }

    const snapshot = await collections.packs.where("shareCode", "==", shareCode).limit(1).get()
    if (snapshot.empty) {
      return res.status(404).json({ error: "Pack not found" })
    }

    const doc = snapshot.docs[0]
    const data = doc.data()
    const isMember = (data.members as string[]).includes(authReq.user.uid)

    res.status(200).json({ id: doc.id, ...data, isMember })
  })
)

export default router

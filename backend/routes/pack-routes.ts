import { Router, Request, Response, NextFunction, RequestHandler } from "express"
import { collections } from "../config/firebase"
import auth from "../middleware/auth"
import { Timestamp } from "firebase-admin/firestore"
import type { AuthRequest } from "../types/express.d"

const router = Router()

// Async wrapper to forward errors
type AsyncFn = (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>
const asyncHandler = (fn: AsyncFn): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as AuthRequest, res, next)).catch(next)
  }
}

// GET /api/packs/:packId/routes - Get all routes for a pack
router.get(
  "/:packId/routes",
  auth as RequestHandler,
  asyncHandler(async (req, res, next) => {
    const authReq = req as AuthRequest
    const { packId } = authReq.params

    if (!authReq.user?.uid) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const packDoc = await collections.packs.doc(packId).get()
    if (!packDoc.exists) {
      return res.status(404).json({ error: "Pack not found" })
    }

    const packData = packDoc.data()!
    if (!packData.members.includes(authReq.user.uid) && packData.visibility !== "public") {
      return res.status(403).json({ error: "You don't have access to this pack" })
    }

    const snapshot = await collections.routes
      .where("packId", "==", packId)
      .orderBy("createdAt", "desc")
      .get()

    const routes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    res.status(200).json(routes)
  })
)

// POST /api/packs/:packId/routes/:routeId - Add a route to a pack
router.post(
  "/:packId/routes/:routeId",
  auth as RequestHandler,
  asyncHandler(async (req, res, next) => {
    const authReq = req as AuthRequest
    const { packId, routeId } = authReq.params

    if (!authReq.user?.uid) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const packDoc = await collections.packs.doc(packId).get()
    if (!packDoc.exists) {
      return res.status(404).json({ error: "Pack not found" })
    }

    const packData = packDoc.data()!
    if (!packData.members.includes(authReq.user.uid)) {
      return res.status(403).json({ error: "You must be a member to add routes to this pack" })
    }

    const routeDoc = await collections.routes.doc(routeId).get()
    if (!routeDoc.exists) {
      return res.status(404).json({ error: "Route not found" })
    }

    const routeData = routeDoc.data()!
    if (routeData.createdBy !== authReq.user.uid && !(routeData.collaborators || []).includes(authReq.user.uid)) {
      return res.status(403).json({ error: "You don't have permission to share this route" })
    }

    await collections.routes.doc(routeId).update({
      packId,
      updatedAt: Timestamp.now(),
    })

    res.status(200).json({ message: "Route added to pack successfully" })
  })
)

// DELETE /api/packs/:packId/routes/:routeId - Remove a route from a pack
router.delete(
  "/:packId/routes/:routeId",
  auth as RequestHandler,
  asyncHandler(async (req, res, next) => {
    const authReq = req as AuthRequest
    const { packId, routeId } = authReq.params

    if (!authReq.user?.uid) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const packDoc = await collections.packs.doc(packId).get()
    if (!packDoc.exists) {
      return res.status(404).json({ error: "Pack not found" })
    }

    const routeDoc = await collections.routes.doc(routeId).get()
    if (!routeDoc.exists) {
      return res.status(404).json({ error: "Route not found" })
    }

    const routeData = routeDoc.data()!
    if (routeData.packId !== packId) {
      return res.status(400).json({ error: "This route is not part of this pack" })
    }

    const packData = packDoc.data()!
    const isPackOwner = packData.owner === authReq.user.uid
    const isRouteCreator = routeData.createdBy === authReq.user.uid
    if (!isPackOwner && !isRouteCreator) {
      return res.status(403).json({ error: "You don't have permission to remove this route" })
    }

    await collections.routes.doc(routeId).update({ packId: null, updatedAt: Timestamp.now() })
    res.status(200).json({ message: "Route removed from pack successfully" })
  })
)

export default router

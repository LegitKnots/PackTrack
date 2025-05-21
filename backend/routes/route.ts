import { Router, Request, Response, NextFunction, RequestHandler } from "express"
import { v4 as uuidv4 } from "uuid"
import { collections } from "../config/firebase"
import auth from "../middleware/auth"
import { Timestamp } from "firebase-admin/firestore"
import type { Route as RouteModel, Waypoint } from "../types/models"
import type { AuthRequest } from "../types/express.d"

const router = Router()

// Async wrapper to forward errors
type AsyncFn = (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>
const asyncHandler = (fn: AsyncFn): RequestHandler => {
  return (req, res, next) => Promise.resolve(fn(req as AuthRequest, res, next)).catch(next)
}

// POST /api/routes - Create a new route
router.post(
  "/",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest
    const uid = authReq.user?.uid
    if (!uid) {
      return res.status(401).json({ error: "Authentication required." })
    }

    const { name, description, tags = [], waypoints, distance, collaborators = [], visibility = "private", packId = null } = authReq.body
    if (!name || !Array.isArray(waypoints) || waypoints.length === 0) {
      return res.status(400).json({ error: "Name and waypoints are required." })
    }

    const now = Timestamp.now()
    const newRoute: RouteModel = {
      id: "",
      name,
      description,
      tags,
      createdBy: uid,
      collaborators,
      waypoints: waypoints as Waypoint[],
      distance,
      visibility: visibility as "public" | "private",
      packId,
      isShared: visibility === "public",
      shareCode: uuidv4(),
      createdAt: now,
      updatedAt: now,
    }

    const routeRef = await collections.routes.add(newRoute)
    await routeRef.update({ id: routeRef.id })
    const routeDoc = await routeRef.get()
    res.status(201).json({ id: routeRef.id, ...routeDoc.data() })
  })
)

// GET /api/routes/user/:userId - Get routes for a user
router.get(
  "/user/:userId",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest
    const uid = authReq.user?.uid
    if (!uid) {
      return res.status(401).json({ error: "Authentication required." })
    }

    const { userId } = authReq.params
    if (uid !== userId) {
      return res.status(403).json({ error: "User ID mismatch or unauthorized." })
    }

    const snapshot = await collections.routes
      .where("createdBy", "==", userId)
      .orderBy("createdAt", "desc")
      .get()

    const routes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    res.status(200).json(routes)
  })
)

// PATCH /api/routes/:id - Update a route
router.patch(
  "/:id",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest
    const uid = authReq.user?.uid
    if (!uid) {
      return res.status(401).json({ error: "Authentication required." })
    }

    const { id } = authReq.params
    const docRef = collections.routes.doc(id)
    const routeDoc = await docRef.get()
    if (!routeDoc.exists) {
      return res.status(404).json({ error: "Route not found." })
    }

    const routeData = routeDoc.data() as RouteModel
    if (routeData.createdBy !== uid && !routeData.collaborators.includes(uid)) {
      return res.status(403).json({ error: "Unauthorized to edit this route." })
    }

    const { name, description, tags, waypoints, distance, collaborators, visibility, packId, isShared } = authReq.body
    if (name && (!Array.isArray(waypoints) || waypoints.length === 0)) {
      return res.status(400).json({ error: "Waypoints must be a non-empty array." })
    }

    const updateData: Partial<RouteModel> = { updatedAt: Timestamp.now() }
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (tags !== undefined) updateData.tags = tags
    if (waypoints !== undefined) updateData.waypoints = waypoints
    if (distance !== undefined) updateData.distance = distance
    if (isShared !== undefined) updateData.isShared = isShared
    if (collaborators !== undefined) updateData.collaborators = collaborators
    if (visibility !== undefined) {
      updateData.visibility = visibility
      updateData.isShared = visibility === "public"
    }
    if (packId !== undefined) updateData.packId = packId

    await docRef.update(updateData)
    const updatedDoc = await docRef.get()
    res.status(200).json({ id, ...updatedDoc.data() })
  })
)

// DELETE /api/routes/:id - Delete a route
router.delete(
  "/:id",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest
    const uid = authReq.user?.uid
    if (!uid) {
      return res.status(401).json({ error: "Authentication required." })
    }

    const { id } = authReq.params
    const docRef = collections.routes.doc(id)
    const routeDoc = await docRef.get()
    if (!routeDoc.exists) {
      return res.status(404).json({ error: "Route not found." })
    }

    const routeData = routeDoc.data() as RouteModel
    if (routeData.createdBy !== uid) {
      return res.status(403).json({ error: "Unauthorized to delete this route." })
    }

    await docRef.delete()
    res.status(200).json({ message: "Route deleted successfully." })
  })
)

export default router

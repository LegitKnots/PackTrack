import { Router, Request, Response, NextFunction, RequestHandler } from "express"
import { v4 as uuidv4 } from "uuid"
import multer from "multer"
import { collections, storage } from "../config/firebase"
import auth from "../middleware/auth"
import { Timestamp } from "firebase-admin/firestore"
import admin from "firebase-admin"
import type { AuthRequest } from "../types/express.d"

const router = Router()

// Configure multer for memory storage (needed for Firebase Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

// Wrapper to turn async route handlers into Express.RequestHandler
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>
const asyncHandler = (fn: AsyncHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// GET /api/packs - Get all packs for the current user
router.get(
  "/",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest
    if (!authReq.user?.uid) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const packsSnapshot = await collections.packs
      .where("members", "array-contains", authReq.user.uid)
      .orderBy("updatedAt", "desc")
      .get()

    const packs = packsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    res.status(200).json(packs)
  }),
)

// GET /api/packs/:id - Get a specific pack
router.get(
  "/:id",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest
    const { id } = req.params
    if (!authReq.user?.uid) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const packDoc = await collections.packs.doc(id).get()
    if (!packDoc.exists) {
      return res.status(404).json({ error: "Pack not found" })
    }

    const packData = packDoc.data()
    if (!packData?.members.includes(authReq.user.uid) && packData?.visibility !== "public") {
      return res.status(403).json({ error: "You don't have access to this pack" })
    }

    res.status(200).json({ id: packDoc.id, ...packData })
  }),
)

// POST /api/packs - Create a new pack
router.post(
  "/",
  auth as RequestHandler,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest
    if (!authReq.user?.uid) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const { name, description, visibility, tags, options } = req.body
    if (!name) {
      return res.status(400).json({ error: "Pack name is required" })
    }

    let imageUrl: string | null = null
    if (req.file) {
      const fileName = `packs/${authReq.user.uid}/${Date.now()}-${req.file.originalname}`
      const fileUpload = storage.file(fileName)
      await fileUpload.save(req.file.buffer, { metadata: { contentType: req.file.mimetype } })
      await fileUpload.makePublic()
      imageUrl = `https://storage.googleapis.com/${storage.name}/${fileName}`
    }

    const now = Timestamp.now()
    const shareCode = uuidv4()
    let parsedOptions: any = options
    if (typeof options === "string") {
      try { parsedOptions = JSON.parse(options) } catch { parsedOptions = { hasChat: false } }
    }

    let parsedTags: any[] = tags
    if (typeof tags === "string") {
      try { parsedTags = JSON.parse(tags) } catch { parsedTags = [] }
    }

    const newPack = {
      name,
      description: description || "",
      owner: authReq.user.uid,
      members: [authReq.user.uid],
      visibility: visibility || "private",
      imageUrl,
      shareCode,
      tags: parsedTags || [],
      options: parsedOptions || { hasChat: false },
      createdAt: now,
      updatedAt: now,
    }

    const packRef = await collections.packs.add(newPack)
    await packRef.update({ id: packRef.id })
    res.status(201).json({ id: packRef.id, ...newPack })
  }),
)

// PATCH /api/packs/:id - Update a pack
router.patch(
  "/:id",
  auth as RequestHandler,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest
    const { id } = req.params
    if (!authReq.user?.uid) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const packDoc = await collections.packs.doc(id).get()
    if (!packDoc.exists) {
      return res.status(404).json({ error: "Pack not found" })
    }

    const packData = packDoc.data()
    if (packData?.owner !== authReq.user.uid) {
      return res.status(403).json({ error: "Only the pack owner can update it" })
    }

    const { name, description, visibility, tags, options } = req.body
    let imageUrl = packData?.imageUrl
    if (req.file) {
      const fileName = `packs/${authReq.user.uid}/${Date.now()}-${req.file.originalname}`
      const fileUpload = storage.file(fileName)
      await fileUpload.save(req.file.buffer, { metadata: { contentType: req.file.mimetype } })
      await fileUpload.makePublic()
      imageUrl = `https://storage.googleapis.com/${storage.name}/${fileName}`
      if (packData?.imageUrl) {
        const oldPath = packData.imageUrl.split(`${storage.name}/`)[1]
        if (oldPath) await storage.file(oldPath).delete()
      }
    }

    let parsedOptions: any = options
    if (typeof options === "string") {
      try { parsedOptions = JSON.parse(options) } catch { parsedOptions = packData?.options || { hasChat: false } }
    }

    let parsedTags: any[] = tags
    if (typeof tags === "string") {
      try { parsedTags = JSON.parse(tags) } catch { parsedTags = packData?.tags || [] }
    }

    const updateData: Record<string, any> = { updatedAt: Timestamp.now() }
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (visibility) updateData.visibility = visibility
    if (parsedTags) updateData.tags = parsedTags
    if (parsedOptions) updateData.options = parsedOptions
    if (imageUrl) updateData.imageUrl = imageUrl

    await collections.packs.doc(id).update(updateData)
    const updated = await collections.packs.doc(id).get()
    res.status(200).json({ id: updated.id, ...updated.data() })
  }),
)

// DELETE /api/packs/:id - Delete a pack
router.delete(
  "/:id",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest
    const { id } = req.params
    if (!authReq.user?.uid) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const packDoc = await collections.packs.doc(id).get()
    if (!packDoc.exists) {
      return res.status(404).json({ error: "Pack not found" })
    }

    const packData = packDoc.data()
    if (packData?.owner !== authReq.user.uid) {
      return res.status(403).json({ error: "Only the pack owner can delete it" })
    }

    if (packData?.imageUrl) {
      try {
        const path = packData.imageUrl.split(`${storage.name}/`)[1]
        if (path) await storage.file(path).delete()
      } catch (err) {
        console.error("Error deleting pack image:", err)
      }
    }

    await collections.packs.doc(id).delete()
    res.status(200).json({ message: "Pack deleted successfully" })
  }),
)

// POST /api/packs/:id/join - Join a pack
router.post(
  "/:id/join",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest
    const { id } = req.params
    if (!authReq.user?.uid) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const packDoc = await collections.packs.doc(id).get()
    if (!packDoc.exists) {
      return res.status(404).json({ error: "Pack not found" })
    }

    const packData = packDoc.data()
    if (packData?.members.includes(authReq.user.uid)) {
      return res.status(400).json({ error: "Already a member" })
    }

    if (packData?.visibility === "private") {
      const inviteSnap = await collections.invitations
        .where("packId", "==", id)
        .where("userId", "==", authReq.user.uid)
        .where("status", "==", "pending")
        .limit(1)
        .get()
      if (inviteSnap.empty) {
        return res.status(403).json({ error: "Invitation required" })
      }
      await inviteSnap.docs[0].ref.update({ status: "accepted", updatedAt: Timestamp.now() })
    }

    await collections.packs.doc(id).update({
      members: admin.firestore.FieldValue.arrayUnion(authReq.user.uid),
      updatedAt: Timestamp.now(),
    })

    res.status(200).json({ message: "Successfully joined the pack" })
  }),
)

// POST /api/packs/:id/leave - Leave a pack
router.post(
  "/:id/leave",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest
    const { id } = req.params
    if (!authReq.user?.uid) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const packDoc = await collections.packs.doc(id).get()
    if (!packDoc.exists) {
      return res.status(404).json({ error: "Pack not found" })
    }

    const packData = packDoc.data()
    if (!packData?.members.includes(authReq.user.uid)) {
      return res.status(400).json({ error: "Not a member" })
    }

    if (packData?.owner === authReq.user.uid) {
      return res.status(400).json({ error: "Owner cannot leave" })
    }

    await collections.packs.doc(id).update({
      members: admin.firestore.FieldValue.arrayRemove(authReq.user.uid),
      updatedAt: Timestamp.now(),
    })

    res.status(200).json({ message: "Successfully left the pack" })
  }),
)

export default router

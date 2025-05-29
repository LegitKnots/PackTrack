import { Router, type Request, type Response, type NextFunction, type RequestHandler } from "express"
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
  "/user",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest
    if (!authReq.user?.uid) {
      return res.status(401).json({ error: "Authentication required" })
    }

    // fetch packs where the user is a member
    const packsSnapshot = await collections.packs
      .where("members", "array-contains", authReq.user.uid)
      .orderBy("updatedAt", "desc")
      .get()

    // if no docs, respond with “no packs”
    if (packsSnapshot.empty) {
      return res.status(200).json({ message: "no packs" })
    }

    // otherwise map and return
    const packs = packsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    return res.status(200).json(packs)
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
      try {
        parsedOptions = JSON.parse(options)
      } catch {
        parsedOptions = { hasChat: false }
      }
    }

    let parsedTags: any[] = tags
    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags)
      } catch {
        parsedTags = []
      }
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
      try {
        parsedOptions = JSON.parse(options)
      } catch {
        parsedOptions = packData?.options || { hasChat: false }
      }
    }

    let parsedTags: any[] = tags
    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags)
      } catch {
        parsedTags = packData?.tags || []
      }
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

// POST /api/packs/:id/join
router.post(
  "/:id/join",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest
    const packId = req.params.id
    const userId = authReq.user?.uid

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" })
    }

    // 1️⃣ Load pack
    const packRef = collections.packs.doc(packId)
    const packSnap = await packRef.get()
    if (!packSnap.exists) {
      return res.status(404).json({ error: "Pack not found" })
    }
    const packData = packSnap.data()!

    // 2️⃣ Already a member?
    if (packData.members.includes(userId)) {
      return res.status(400).json({ error: "Already a member" })
    }

    // 3️⃣ If private, verify invitation...
    if (packData.visibility === "private") {
      const inviteSnap = await collections.invitations
        .where("packId", "==", packId)
        .where("userId", "==", userId)
        .where("status", "==", "pending")
        .limit(1)
        .get()
      if (inviteSnap.empty) {
        return res.status(403).json({ error: "Invitation required" })
      }
      await inviteSnap.docs[0].ref.update({
        status: "accepted",
        updatedAt: Timestamp.now(),
      })
    }

    // 4️⃣ Add user to pack.members
    await packRef.update({
      members: admin.firestore.FieldValue.arrayUnion(userId),
      updatedAt: Timestamp.now(),
    })

    // 5️⃣ ALSO add packId → user.packs (must match your Firestore field!)
    await collections.users.doc(userId).update({
      packs: admin.firestore.FieldValue.arrayUnion(packId),
      updatedAt: Timestamp.now(),
    })

    return res.status(200).json({ message: "Successfully joined the pack" })
  })
)

// POST /api/packs/:id/leave
router.post(
  "/:id/leave",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest
    const packId = req.params.id
    const userId = authReq.user?.uid

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" })
    }

    // 1️⃣ Load pack
    const packRef = collections.packs.doc(packId)
    const packSnap = await packRef.get()
    if (!packSnap.exists) {
      return res.status(404).json({ error: "Pack not found" })
    }
    const packData = packSnap.data()!

    // 2️⃣ Not a member?
    if (!packData.members.includes(userId)) {
      return res.status(400).json({ error: "Not a member" })
    }
    // 3️⃣ Owner cannot leave
    if (packData.owner === userId) {
      return res.status(400).json({ error: "Owner cannot leave" })
    }

    // 4️⃣ Remove from pack.members
    await packRef.update({
      members: admin.firestore.FieldValue.arrayRemove(userId),
      updatedAt: Timestamp.now(),
    })

    // 5️⃣ ALSO remove from user.packs
    await collections.users.doc(userId).update({
      packs: admin.firestore.FieldValue.arrayRemove(packId),
      updatedAt: Timestamp.now(),
    })

    return res.status(200).json({ message: "Successfully left the pack" })
  })
)

// GET /api/packs/:id/routes - Get all routes for a specific pack
router.get(
  "/:id/routes",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest
    const { id } = req.params

    if (!authReq.user?.uid) {
      return res.status(401).json({ error: "Authentication required" })
    }

    // First check if the pack exists and user has access
    const packDoc = await collections.packs.doc(id).get()
    if (!packDoc.exists) {
      return res.status(404).json({ error: "Pack not found" })
    }

    const packData = packDoc.data()
    // Check if user is a member or if the pack is public
    if (!packData?.members.includes(authReq.user.uid) && packData?.visibility !== "public") {
      return res.status(403).json({ error: "You don't have access to this pack" })
    }

    // Get all routes associated with this pack
    const routesSnapshot = await collections.routes.where("packId", "==", id).orderBy("updatedAt", "desc").get()

    if (routesSnapshot.empty) {
      return res.status(200).json([])
    }

    // Map the routes data
    const routes = routesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return res.status(200).json(routes)
  }),
)

// GET /api/packs/:id/members - Get all members of a specific pack
router.get(
  "/:id/members",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest
    const { id } = req.params

    if (!authReq.user?.uid) {
      return res.status(401).json({ error: "Authentication required" })
    }

    // First check if the pack exists and user has access
    const packDoc = await collections.packs.doc(id).get()
    if (!packDoc.exists) {
      return res.status(404).json({ error: "Pack not found" })
    }

    const packData = packDoc.data()
    // Check if user is a member or if the pack is public
    if (!packData?.members.includes(authReq.user.uid) && packData?.visibility !== "public") {
      return res.status(403).json({ error: "You don't have access to this pack" })
    }

    // Get user details for each member
    const memberPromises = packData.members.map(async (memberId: string) => {
      try {
        const userDoc = await collections.users.doc(memberId).get()
        if (!userDoc.exists) return null

        const userData = userDoc.data()
        return {
          id: memberId,
          fullname: userData?.fullname || "Unknown User",
          username: userData?.username || "unknown",
          profileImage: userData?.profilePicUrl || null,
          isOwner: memberId === packData.owner,
        }
      } catch (error) {
        console.error(`Error fetching user ${memberId}:`, error)
        return null
      }
    })

    const members = (await Promise.all(memberPromises)).filter((member) => member !== null)

    return res.status(200).json(members)
  }),
)

// POST /api/packs/join/:shareCode - Join a pack using share code
router.post(
  "/join/:shareCode",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest
    const { shareCode } = req.params

    if (!authReq.user?.uid) {
      return res.status(401).json({ error: "Authentication required" })
    }

    if (!shareCode) {
      return res.status(400).json({ error: "Share code is required" })
    }

    // Find pack by share code
    const packsSnapshot = await collections.packs.where("shareCode", "==", shareCode).limit(1).get()

    if (packsSnapshot.empty) {
      return res.status(404).json({ error: "Invalid share code" })
    }

    const packDoc = packsSnapshot.docs[0]
    const packData = packDoc.data()

    // Check if user is already a member
    if (packData?.members.includes(authReq.user.uid)) {
      return res.status(400).json({ error: "You are already a member of this pack" })
    }

    // For private packs, verify share code access
    if (packData?.visibility === "private") {
      // Additional validation could be added here if needed
      // For now, having the share code is sufficient for private packs
    }

    // Add user to pack members
    await collections.packs.doc(packDoc.id).update({
      members: admin.firestore.FieldValue.arrayUnion(authReq.user.uid),
      updatedAt: Timestamp.now(),
    })

    // Create notification for pack owner
    try {
      const userDoc = await collections.users.doc(authReq.user.uid).get()
      const userData = userDoc.data()
      const userName = userData?.fullname || userData?.username || "A user"

      await collections.notifications.add({
        userId: packData.owner,
        type: "pack_update",
        title: "New Pack Member",
        message: `${userName} has joined ${packData.name}`,
        data: {
          packId: packDoc.id,
          newMemberId: authReq.user.uid,
        },
        read: false,
        createdAt: Timestamp.now(),
      })
    } catch (error) {
      console.error("Error creating notification:", error)
      // Don't fail the join operation if notification fails
    }

    return res.status(200).json({
      message: "Successfully joined the pack",
      pack: {
        id: packDoc.id,
        name: packData.name,
        description: packData.description,
        imageUrl: packData.imageUrl,
      },
    })
  }),
)

export default router

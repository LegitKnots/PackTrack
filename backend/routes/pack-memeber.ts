import { Router, Request, Response, NextFunction, RequestHandler } from "express"
import { collections } from "../config/firebase"
import auth from "../middleware/auth"
import { Timestamp } from "firebase-admin/firestore"
import admin from "firebase-admin"
import type { AuthRequest } from "../types/express.d"

const router = Router()

// Async wrapper to forward errors
type AsyncFn = (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>
const asyncHandler = (fn: AsyncFn): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as AuthRequest, res, next)).catch(next)
  }
}

// GET /api/packs/:packId/members - Get all members of a pack
router.get(
  "/:packId/members",
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

    const memberIds = packData.members || []
    const members = (
      await Promise.all(
        memberIds.map(async (memberId: string) => {
          const userDoc = await collections.users.doc(memberId).get()
          if (!userDoc.exists) return null
          const data = userDoc.data()!
          return {
            id: memberId,
            username: data.username,
            fullname: data.fullname,
            profileImage: data.profileImage,
            isOwner: memberId === packData.owner,
          }
        })
      )
    ).filter(Boolean)

    res.status(200).json(members)
  })
)

// POST /api/packs/:packId/invite - Invite a user to a pack
router.post(
  "/:packId/invite",
  auth as RequestHandler,
  asyncHandler(async (req, res, next) => {
    const authReq = req as AuthRequest
    const { packId } = authReq.params
    const { userId } = authReq.body

    if (!authReq.user?.uid) {
      return res.status(401).json({ error: "Authentication required" })
    }
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" })
    }

    const packDoc = await collections.packs.doc(packId).get()
    if (!packDoc.exists) {
      return res.status(404).json({ error: "Pack not found" })
    }

    const packData = packDoc.data()!
    if (!packData.members.includes(authReq.user.uid)) {
      return res.status(403).json({ error: "You must be a member to invite others" })
    }
    if (packData.members.includes(userId)) {
      return res.status(400).json({ error: "User is already a member of this pack" })
    }

    const now = Timestamp.now()
    await collections.invitations.add({
      packId,
      packName: packData.name,
      userId,
      invitedBy: authReq.user.uid,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })

    res.status(200).json({ message: "Invitation sent successfully" })
  })
)

// DELETE /api/packs/:packId/members/:userId - Remove a member from a pack
router.delete(
  "/:packId/members/:userId",
  auth as RequestHandler,
  asyncHandler(async (req, res, next) => {
    const authReq = req as AuthRequest
    const { packId, userId } = authReq.params

    if (!authReq.user?.uid) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const packDoc = await collections.packs.doc(packId).get()
    if (!packDoc.exists) {
      return res.status(404).json({ error: "Pack not found" })
    }

    const packData = packDoc.data()!
    if (packData.owner !== authReq.user.uid) {
      return res.status(403).json({ error: "Only the pack owner can remove members" })
    }
    if (!packData.members.includes(userId)) {
      return res.status(400).json({ error: "User is not a member of this pack" })
    }
    if (userId === packData.owner) {
      return res.status(400).json({ error: "Cannot remove the pack owner" })
    }

    await collections.packs.doc(packId).update({
      members: admin.firestore.FieldValue.arrayRemove(userId),
      updatedAt: Timestamp.now(),
    })

    res.status(200).json({ message: "Member removed successfully" })
  })
)

export default router

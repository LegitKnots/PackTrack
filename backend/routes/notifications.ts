import { Router, type Response, type RequestHandler } from "express"
import { collections } from "../config/firebase"
import { Timestamp } from "firebase-admin/firestore"
import auth from "../middleware/auth"
import type { AuthRequest } from "../types/express"
import type { Notifications } from "../types/models"

const router = Router()

// Helper to wrap async route handlers and catch errors
const asyncHandler = (fn: (req: AuthRequest, res: Response) => Promise<any>): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as AuthRequest, res)).catch(next)
  }
}

// GET /api/users/:userId/notifications - Get all notifications for a user
router.get(
  "/:userId/notifications",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    try {
      const { userId } = req.params
      const { limit = "20", offset = "0", unreadOnly = "false" } = req.query

      // Verify user is accessing their own notifications
      if (req.user?.uid !== userId) {
        return res.status(403).json({ message: "Unauthorized to access these notifications" })
      }

      let query = collections.notifications.where("userId", "==", userId).orderBy("createdAt", "desc")

      // Filter for unread only if requested
      if (unreadOnly === "true") {
        query = query.where("read", "==", false)
      }

      // Apply pagination
      const limitNum = Number.parseInt(limit as string)
      const offsetNum = Number.parseInt(offset as string)

      if (offsetNum > 0) {
        const offsetSnapshot = await collections.notifications
          .where("userId", "==", userId)
          .orderBy("createdAt", "desc")
          .limit(offsetNum)
          .get()

        if (!offsetSnapshot.empty) {
          const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1]
          query = query.startAfter(lastDoc)
        }
      }

      const snapshot = await query.limit(limitNum).get()

      const notifications: Notifications[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Notifications,
      )

      // Get total count and unread count
      const totalSnapshot = await collections.notifications.where("userId", "==", userId).get()

      const unreadSnapshot = await collections.notifications
        .where("userId", "==", userId)
        .where("read", "==", false)
        .get()

      res.json({
        notifications,
        pagination: {
          total: totalSnapshot.size,
          unread: unreadSnapshot.size,
          limit: limitNum,
          offset: offsetNum,
          hasMore: snapshot.size === limitNum,
        },
      })
    } catch (error: any) {
      console.error("Get notifications error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }),
)

// PUT /api/users/:userId/notifications/:notificationId - Update notification read status
router.put(
  "/:userId/notifications/:notificationId",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    try {
      const { userId, notificationId } = req.params
      const { read } = req.body

      // Verify user is updating their own notification
      if (req.user?.uid !== userId) {
        return res.status(403).json({ message: "Unauthorized to update this notification" })
      }

      if (typeof read !== "boolean") {
        return res.status(400).json({ message: "Read status must be a boolean" })
      }

      const notificationRef = collections.notifications.doc(notificationId)
      const notificationDoc = await notificationRef.get()

      if (!notificationDoc.exists) {
        return res.status(404).json({ message: "Notification not found" })
      }

      const notificationData = notificationDoc.data() as Notifications

      // Verify the notification belongs to the user
      if (notificationData.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to update this notification" })
      }

      // Update the notification
      await notificationRef.update({
        read,
        updatedAt: Timestamp.now(),
      })

      // Get the updated notification
      const updatedDoc = await notificationRef.get()
      const updatedNotification = {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      } as Notifications

      res.json({
        message: "Notification updated successfully",
        notification: updatedNotification,
      })
    } catch (error: any) {
      console.error("Update notification error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }),
)

// PUT /api/users/:userId/notifications/mark-all-read - Mark all notifications as read
router.put(
  "/:userId/notifications/mark-all-read",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    try {
      const { userId } = req.params

      // Verify user is updating their own notifications
      if (req.user?.uid !== userId) {
        return res.status(403).json({ message: "Unauthorized to update these notifications" })
      }

      // Get all unread notifications for the user
      const unreadSnapshot = await collections.notifications
        .where("userId", "==", userId)
        .where("read", "==", false)
        .get()

      if (unreadSnapshot.empty) {
        return res.json({
          message: "No unread notifications to update",
          updatedCount: 0,
        })
      }

      // Batch update all unread notifications
      const batch = collections.notifications.firestore.batch()
      const updateTime = Timestamp.now()

      unreadSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          read: true,
          updatedAt: updateTime,
        })
      })

      await batch.commit()

      res.json({
        message: "All notifications marked as read",
        updatedCount: unreadSnapshot.size,
      })
    } catch (error: any) {
      console.error("Mark all read error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }),
)

// DELETE /api/users/:userId/notifications/:notificationId - Delete a specific notification
router.delete(
  "/:userId/notifications/:notificationId",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    try {
      const { userId, notificationId } = req.params

      // Verify user is deleting their own notification
      if (req.user?.uid !== userId) {
        return res.status(403).json({ message: "Unauthorized to delete this notification" })
      }

      const notificationRef = collections.notifications.doc(notificationId)
      const notificationDoc = await notificationRef.get()

      if (!notificationDoc.exists) {
        return res.status(404).json({ message: "Notification not found" })
      }

      const notificationData = notificationDoc.data() as Notifications

      // Verify the notification belongs to the user
      if (notificationData.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to delete this notification" })
      }

      // Delete the notification
      await notificationRef.delete()

      res.json({
        message: "Notification deleted successfully",
        deletedId: notificationId,
      })
    } catch (error: any) {
      console.error("Delete notification error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }),
)

// DELETE /api/users/:userId/notifications - Delete all notifications for a user
router.delete(
  "/:userId/notifications",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    try {
      const { userId } = req.params
      const { readOnly = "false" } = req.query

      // Verify user is deleting their own notifications
      if (req.user?.uid !== userId) {
        return res.status(403).json({ message: "Unauthorized to delete these notifications" })
      }

      let query = collections.notifications.where("userId", "==", userId)

      // If readOnly is true, only delete read notifications
      if (readOnly === "true") {
        query = query.where("read", "==", true)
      }

      const snapshot = await query.get()

      if (snapshot.empty) {
        return res.json({
          message: readOnly === "true" ? "No read notifications to delete" : "No notifications to delete",
          deletedCount: 0,
        })
      }

      // Batch delete all matching notifications
      const batch = collections.notifications.firestore.batch()

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })

      await batch.commit()

      res.json({
        message: readOnly === "true" ? "All read notifications deleted" : "All notifications deleted",
        deletedCount: snapshot.size,
      })
    } catch (error: any) {
      console.error("Delete all notifications error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }),
)

// POST /api/users/:userId/notifications - Create a new notification (for testing/admin use)
router.post(
  "/:userId/notifications",
  auth as RequestHandler,
  asyncHandler(async (req, res) => {
    try {
      const { userId } = req.params
      const { type, title, data, read = false } = req.body

      // Basic validation
      if (!type || !title) {
        return res.status(400).json({ message: "Type and title are required" })
      }

      // Create the notification
      const notificationData: Omit<Notifications, "id"> = {
        userId,
        type,
        title,
        data: data || "",
        read,
        createdAt: Timestamp.now(),
      }

      const docRef = await collections.notifications.add(notificationData)
      const newDoc = await docRef.get()

      const newNotification = {
        id: newDoc.id,
        ...newDoc.data(),
      } as Notifications

      res.status(201).json({
        message: "Notification created successfully",
        notification: newNotification,
      })
    } catch (error: any) {
      console.error("Create notification error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }),
)

export default router

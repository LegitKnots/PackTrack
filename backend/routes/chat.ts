import express, { RequestHandler } from "express";
import { collections } from "../config/firebase";
import auth from "../middleware/auth";
import type { AuthRequest } from "../types/express.d";

const router = express.Router();

// Mount auth middleware
router.use(auth as RequestHandler);

// --- Domain Types ---
interface Message {
  userId: string;
  content: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  edited: boolean;
}

interface Pack {
  members: string[];
  admins?: string[];
  owner: string;
  options?: { hasChat: boolean };
}

type NewMessage = Omit<Message, "updatedAt">;

interface UserInfo {
  id: string;
  username: string;
  profilePicUrl?: string;
}
// -------------------

/**
 * GET /pack/:packId/messages
 */
const getMessages: RequestHandler = async (req, res, next) => {
  try {
    const { user } = req as AuthRequest;
    const userId = user?.uid;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { packId } = req.params;
    const limitNum = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const before = req.query.before ? new Date(req.query.before as string) : undefined;

    const packSnap = await collections.packs.doc(packId).get();
    if (!packSnap.exists) {
      res.status(404).json({ error: "Pack not found" });
      return;
    }

    const packData = packSnap.data() as Pack;
    const isMember =
      packData.members.includes(userId) ||
      packData.admins?.includes(userId) ||
      packData.owner === userId;
    if (!isMember) {
      res.status(403).json({ error: "Not a member" });
      return;
    }

    let q = collections.packs
      .doc(packId)
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(limitNum);
    if (before) q = q.where("createdAt", "<", before);

    const snap = await q.get();
    if (snap.empty) {
      res.json({ messages: [], users: {} });
      return;
    }

    const messages = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Message) }));

    const userIds = Array.from(new Set(messages.map(m => m.userId)));
    const userDocs = await Promise.all(userIds.map(id => collections.users.doc(id).get()));
    const users: Record<string, UserInfo> = {};
    userDocs.forEach(d => {
      if (!d.exists) return;
      const u = d.data() as Partial<UserInfo>;
      users[d.id] = {
        id: d.id,
        username: u.username || "Unknown",
        profilePicUrl: u.profilePicUrl,
      };
    });

    res.json({ messages: messages.reverse(), users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

/**
 * POST /pack/:packId/messages
 */
const postMessage: RequestHandler = async (req, res, next) => {
  try {
    const { user } = req as AuthRequest;
    const userId = user?.uid;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { packId } = req.params;
    const { content, type = "text" } = req.body;
    if (!content || typeof content !== "string" || !content.trim()) {
      res.status(400).json({ error: "Message content is required" });
      return;
    }

    const packSnap = await collections.packs.doc(packId).get();
    if (!packSnap.exists) {
      res.status(404).json({ error: "Pack not found" });
      return;
    }

    const pack = packSnap.data() as Pack;
    const isMember =
      pack.members.includes(userId) ||
      pack.admins?.includes(userId) ||
      pack.owner === userId;
    if (!isMember) {
      res.status(403).json({ error: "Not a member" });
      return;
    }
    if (!pack.options?.hasChat) {
      res.status(403).json({ error: "Chat disabled"});
      return;
    }

    const messageData: NewMessage = {
      userId,
      content: content.trim(),
      type,
      createdAt: new Date(),
      edited: false,
    };

    const ref = await collections.packs
      .doc(packId)
      .collection("messages")
      .add({ ...messageData, updatedAt: new Date() });

    const userSnap = await collections.users.doc(userId).get();
    const u = (userSnap.data() || {}) as Partial<UserInfo>;
    const responseMessage = {
      id: ref.id,
      ...messageData,
      updatedAt: new Date(),
      user: {
        id: userId,
        username: u.username || "Unknown",
        profilePicUrl: u.profilePicUrl,
      },
    };

    res.status(201).json(responseMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

/**
 * DELETE /pack/:packId/messages/:messageId
 */
const deleteMessage: RequestHandler = async (req, res, next) => {
  try {
    const { user } = req as AuthRequest;
    const userId = user?.uid;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { packId, messageId } = req.params;
    const msgRef = collections.packs.doc(packId).collection("messages").doc(messageId);
    const msgSnap = await msgRef.get();
    if (!msgSnap.exists) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    const msg = msgSnap.data() as Message;
    const packSnap = await collections.packs.doc(packId).get();
    const pack = packSnap.data() as Pack;
    const isOwner = msg.userId === userId;
    const isAdmin = pack.owner === userId || pack.admins?.includes(userId) === true;
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    await msgRef.delete();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete message" });
  }
};

// Mount routes
router.get("/pack/:packId/messages", getMessages);
router.post("/pack/:packId/messages", postMessage);
router.delete("/pack/:packId/messages/:messageId", deleteMessage);

export default router;

import express, { RequestHandler, Router } from "express";
import { collections } from "../config/firebase";
import auth from "../middleware/auth";
import type { AuthRequest } from "../types/express.d";

const router: Router = express.Router();

// Mount auth middleware for all search routes
router.use(auth as RequestHandler);

/**
 * GET /api/search/packs - Search for packs
 */
const searchPacks: RequestHandler = async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const uid = user?.uid;
    if (!uid) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const q = (req.query.q as string | undefined)?.trim();
    const tags = (req.query.tags as string | undefined)?.trim();
    const hasChat = req.query.hasChat as string | undefined;

    console.log("Search params:", { q, tags, hasChat });

    // Fetch public packs and user’s private packs
    const [publicSnap, userSnap] = await Promise.all([
      collections.packs.where("visibility", "==", "public").get(),
      collections.packs.where("members", "array-contains", uid).get(),
    ]);

    const allMap = new Map<string, any>();
    publicSnap.docs.forEach(doc => allMap.set(doc.id, { id: doc.id, ...doc.data() }));
    userSnap.docs.forEach(doc => allMap.set(doc.id, { id: doc.id, ...doc.data() }));
    let packs = Array.from(allMap.values());

    console.log(`Found ${packs.length} total packs before filtering`);

    // Text search
    if (q) {
      const searchLower = q.toLowerCase();
      packs = packs.filter(pack => {
        const name = (pack.name as string)?.toLowerCase() || "";
        const desc = (pack.description as string)?.toLowerCase() || "";
        const tagsText = (pack.tags as string[])
          ? pack.tags.join(" ").toLowerCase()
          : "";
        return (
          name.includes(searchLower) ||
          desc.includes(searchLower) ||
          tagsText.includes(searchLower)
        );
      });
      console.log(`After text search: ${packs.length} packs`);
    }

    // Filter by tags
    if (tags) {
      const tagList = tags.split(",").map(t => t.toLowerCase());
      packs = packs.filter(pack => {
        if (!Array.isArray(pack.tags)) return false;
        return (pack.tags as string[]).some(tag =>
          tagList.some(filterTag => tag.toLowerCase().includes(filterTag))
        );
      });
      console.log(`After tag filter: ${packs.length} packs`);
    }

    // Filter by chat option
    if (hasChat !== undefined) {
      const enabled = hasChat === "true";
      packs = packs.filter(pack => pack.options?.hasChat === enabled);
      console.log(`After chat filter: ${packs.length} packs`);
    }

    // Sort: member packs first, then by updatedAt descending
    packs.sort((a, b) => {
      const aMember = (a.members as string[]).includes(uid) ? 1 : 0;
      const bMember = (b.members as string[]).includes(uid) ? 1 : 0;
      if (aMember !== bMember) return bMember - aMember;

      const aTime = (a.updatedAt as any)?.toMillis?.() || 0;
      const bTime = (b.updatedAt as any)?.toMillis?.() || 0;
      return bTime - aTime;
    });

    console.log(`Returning ${packs.length} packs`);
    res.status(200).json(packs);
  } catch (err) {
    console.error("Error searching packs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/search/users - Search for users
 */
const searchUsers: RequestHandler = async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const uid = user?.uid;
    if (!uid) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const q = (req.query.q as string | undefined)?.trim();
    if (!q) {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    const searchLower = q.toLowerCase();

    const usersSnap = await collections.users.limit(50).get();
    const results: Array<{ id: string; fullname?: string; username?: string; profileImage?: string }> = [];

    usersSnap.docs.forEach(doc => {
      const data = doc.data();
      const full = (data.fullname as string)?.toLowerCase() || "";
      const uname = (data.username as string)?.toLowerCase() || "";
      if (full.includes(searchLower) || uname.includes(searchLower)) {
        results.push({
          id: doc.id,
          fullname: data.fullname,
          username: data.username,
          profileImage: data.profileImage,
        });
      }
    });

    res.status(200).json(results);
  } catch (err) {
    console.error("Error searching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/search/packs/shared/:shareCode - Get a pack by share code
 */
const getSharedPack: RequestHandler = async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const uid = user?.uid;
    if (!uid) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { shareCode } = req.params;
    if (!shareCode) {
      res.status(400).json({ error: "Share code is required" });
      return;
    }

    console.log("Looking for pack with share code:", shareCode);
    const snap = await collections.packs.where("shareCode", "==", shareCode).limit(1).get();
    if (snap.empty) {
      console.log("No pack found with share code:", shareCode);
      res.status(404).json({ error: "Pack not found" });
      return;
    }

    const doc = snap.docs[0];
    const data = doc.data();
    const isMember = Array.isArray(data.members) ? (data.members as string[]).includes(uid) : false;

    res.status(200).json({ id: doc.id, ...data, isMember });
  } catch (err) {
    console.error("Error fetching shared pack:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mount routes
router.get("/packs", searchPacks);
router.get("/users", searchUsers);
router.get("/packs/shared/:shareCode", getSharedPack);

export default router;

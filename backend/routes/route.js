const express = require("express");
const router = express.Router();
const Route = require("../models/Route");
const { v4: uuidv4 } = require("uuid");
const requireAuth = require("../middleware/auth");

// POST /api/routes - Create a new route
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      name,
      description,
      tags = [],
      waypoints,
      distance,
      collaborators = [],
      visibility = "private",
      packId,
      createdBy,
    } = req.body;

    console.log(req.body);

    if (
      !name ||
      !waypoints ||
      !Array.isArray(waypoints) ||
      waypoints.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "Name and waypoints are required." });
    }

    const route = new Route({
      name,
      description,
      tags,
      createdBy: createdBy,
      collaborators,
      waypoints,
      distance,
      visibility,
      packId,
      isShared: visibility === "public",
      shareCode: uuidv4(),
    });

    await route.save();
    res.status(201).json(route);
  } catch (err) {
    console.error("Route creation error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get('/user/:userId', requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
  
      if (!req.user || req.user.userID !== userId) {
        return res.status(403).json({ message: 'User ID mismatch or unauthorized.' });
      }
  
      const routes = await Route.find({ createdBy: userId }).sort({ createdAt: -1 });
      res.json(routes);
    } catch (err) {
      console.error('Error fetching user routes:', err);
      res.status(500).json({ message: 'Internal server error.' });
    }
  });
  

module.exports = router;

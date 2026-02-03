const express = require("express");
const router = express.Router();
const mlService = require("../services/ml.service");
const { authenticateToken } = require("../middleware/auth.middleware");

router.post("/search", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "family") {
      return res.status(403).json({
        message: "Forbidden: Only families can search for caregivers.",
      });
    }

    const filters = {
      district: req.body.district || "",
      careCategory: req.body.careCategory || "",
      serviceType: req.body.serviceType || "",
      timePeriod: req.body.timePeriod || "",
      needs: req.body.needs || "",
    };

    console.log("Searching with filters:", filters);

    const matches = await mlService.getPredictions(filters);

    console.log(`Found ${matches.length} matches`);
    return res.status(200).json({ matches });
  } catch (err) {
    console.error("Matching search error:", err);
    return res.status(500).json({
      message: "Search failed.",
      error: err.message,
    });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/auth.middleware");
const profileService = require("../services/profile.service");

router.use(authenticateToken);

//GET /api/profile/me
router.get("/me", async (req, res) => {
  try {
    const data = await profileService.getMyProfile(req.user.user_id, req.user.role);
    res.status(200).json(data);
  } catch (err) {
    console.error("Get profile error:", err.message);
    res.status(400).json({ message: err.message });
  }
});

//PUT /api/profile/me
router.put("/me", async (req, res) => {
  try {
    const updated = await profileService.updateMyProfile(req.user.user_id, req.user.role, req.body);
    res.status(200).json({ message: "Profile updated.", profile: updated });
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(400).json({ message: err.message });
  }
});

//PUT /api/profile/deactivate
 
router.put("/deactivate", async (req, res) => {
  try {
    await profileService.deactivateAccount(req.user.user_id);
    res.status(200).json({ message: "Account deactivated." });
  } catch (err) {
    console.error("Deactivate error:", err.message);
    res.status(400).json({ message: err.message });
  }
});

//DELETE /api/profile/delete

router.delete("/delete", async (req, res) => {
  try {
    await profileService.deleteAccount(req.user.user_id);
    res.status(200).json({ message: "Account deleted permanently." });
  } catch (err) {
    console.error("Delete error:", err.message);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;

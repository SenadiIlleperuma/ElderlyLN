const express = require("express");
const router = express.Router();
const profileService = require("../services/profile.service");
const { authenticateToken } = require("../middleware/auth.middleware");

router.use(authenticateToken);

// returns profile by role
async function getMe(req) {
  if (req.user.role === "family") return await profileService.getMyFamilyProfile(req.user.user_id);
  if (req.user.role === "caregiver") return await profileService.getMyCaregiverProfile(req.user.user_id);
  throw new Error("Unsupported role.");
}

async function updateMe(req) {
  if (req.user.role === "family") return await profileService.updateMyFamilyProfile(req.user.user_id, req.body);
  if (req.user.role === "caregiver") return await profileService.updateMyCaregiverProfile(req.user.user_id, req.body);
  throw new Error("Unsupported role.");
}


// GET /api/profile/me
router.get("/me", async (req, res) => {
  try {
    const me = await getMe(req);
    res.json(me);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// PUT /api/profile/me
router.put("/me", async (req, res) => {
  try {
    const updated = await updateMe(req);
    res.json({ message: "Profile updated", result: updated });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// PUT /api/profile/deactivate
router.put("/deactivate", async (req, res) => {
  try {
    const r = await profileService.deactivateMyAccount(req.user.user_id);
    res.json({ message: "Account deactivated", result: r });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// PUT /api/profile/reactivate
router.put("/reactivate", async (req, res) => {
  try {
    const r = await profileService.reactivateMyAccount(req.user.user_id);
    res.json({ message: "Account reactivated", result: r });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// DELETE /api/profile/delete
router.delete("/delete", async (req, res) => {
  try {
    const r = await profileService.deleteMyAccountPermanently(req.user.user_id);
    res.json({ message: "Account deleted", result: r });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});


router.get("/family/me", async (req, res) => {
  try {
    if (req.user.role !== "family") return res.status(403).json({ message: "Forbidden" });
    const me = await profileService.getMyFamilyProfile(req.user.user_id);
    res.json(me);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.put("/family/me", async (req, res) => {
  try {
    if (req.user.role !== "family") return res.status(403).json({ message: "Forbidden" });
    const updated = await profileService.updateMyFamilyProfile(req.user.user_id, req.body);
    res.json({ message: "Profile updated", result: updated });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.get("/caregiver/me", async (req, res) => {
  try {
    if (req.user.role !== "caregiver") return res.status(403).json({ message: "Forbidden" });
    const me = await profileService.getMyCaregiverProfile(req.user.user_id);
    res.json(me);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.put("/caregiver/me", async (req, res) => {
  try {
    if (req.user.role !== "caregiver") return res.status(403).json({ message: "Forbidden" });
    const updated = await profileService.updateMyCaregiverProfile(req.user.user_id, req.body);
    res.json({ message: "Profile updated", result: updated });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.put("/account/deactivate", async (req, res) => {
  try {
    const r = await profileService.deactivateMyAccount(req.user.user_id);
    res.json({ message: "Account deactivated", result: r });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.put("/account/reactivate", async (req, res) => {
  try {
    const r = await profileService.reactivateMyAccount(req.user.user_id);
    res.json({ message: "Account reactivated", result: r });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.delete("/account/delete", async (req, res) => {
  try {
    const r = await profileService.deleteMyAccountPermanently(req.user.user_id);
    res.json({ message: "Account deleted", result: r });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

module.exports = router;

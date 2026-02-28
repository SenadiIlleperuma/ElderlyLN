// routes/profile.route.js
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


// FAMILY ROUTES
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

// CAREGIVER ROUTES
router.get("/caregiver/me", async (req, res) => {
  try {
    if (req.user.role !== "caregiver") return res.status(403).json({ message: "Forbidden" });

    console.log("[GET /profile/caregiver/me] user_id:", req.user.user_id, "role:", req.user.role);

    const me = await profileService.getMyCaregiverProfile(req.user.user_id);


    console.log("[GET /profile/caregiver/me] caregiver_id:", me?.caregiver_id, "profile_status:", me?.profile_status);

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

// caregiver verification status route
router.get("/caregiver/verificationStatus", async (req, res) => {
  try {
    if (req.user.role !== "caregiver") return res.status(403).json({ message: "Forbidden" });
    const r = await profileService.getMyCaregiverVerificationStatus(req.user.user_id);
    res.json(r);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// caregiver documents (list, add/upload, submit for verification)
router.get("/caregiver/documents", async (req, res) => {
  try {
    if (req.user.role !== "caregiver") return res.status(403).json({ message: "Forbidden" });
    const docs = await profileService.listMyCaregiverDocuments(req.user.user_id);
    res.json(docs);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// add/upload a document 
router.post("/caregiver/documents", async (req, res) => {
  try {
    if (req.user.role !== "caregiver") return res.status(403).json({ message: "Forbidden" });

    const {
      document_type,
      file_url,
      file_name,
      file_size_kb,
      mime_type,
    } = req.body;

    if (!document_type || !file_url || !file_name) {
      return res.status(400).json({ message: "document_type, file_url, file_name are required." });
    }

    const saved = await profileService.addMyCaregiverDocument(req.user.user_id, {
      document_type,
      file_url,
      file_name,
      file_size_kb: file_size_kb ?? null,
      mime_type: mime_type ?? null,
    });

    res.status(201).json({ message: "Document saved", result: saved });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// submit profile for verification
router.put("/caregiver/submitVerification", async (req, res) => {
  try {
    if (req.user.role !== "caregiver") return res.status(403).json({ message: "Forbidden" });

    const r = await profileService.submitMyCaregiverForVerification(req.user.user_id);
    res.json({ message: "Submitted for verification", result: r });
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
const express = require("express");
const router = express.Router();
const profileService = require("../services/profile.service");
const { authenticateToken } = require("../middleware/auth.middleware");
const { caregiverProfileImageUpload } = require("../utils/upload");

router.use(authenticateToken);

// Helper function to get the authenticated user's profile based on their role
async function getMe(req) {
  if (req.user.role === "family") {
    return await profileService.getMyFamilyProfile(req.user.user_id);
  }
  if (req.user.role === "caregiver") {
    return await profileService.getMyCaregiverProfile(req.user.user_id);
  }
  throw new Error("Unsupported role.");
}

async function updateMe(req) {
  if (req.user.role === "family") {
    return await profileService.updateMyFamilyProfile(req.user.user_id, req.body);
  }
  if (req.user.role === "caregiver") {
    return await profileService.updateMyCaregiverProfile(req.user.user_id, req.body);
  }
  throw new Error("Unsupported role.");
}

router.get("/me", async (req, res) => {
  try {
    const me = await getMe(req);
    return res.json(me);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

router.put("/me", async (req, res) => {
  try {
    const updated = await updateMe(req);
    return res.json({ message: "Profile updated", result: updated });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

router.get("/family/me", async (req, res) => {
  try {
    if (req.user.role !== "family") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const me = await profileService.getMyFamilyProfile(req.user.user_id);
    return res.json(me);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

router.put("/family/me", async (req, res) => {
  try {
    if (req.user.role !== "family") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const updated = await profileService.updateMyFamilyProfile(req.user.user_id, req.body);
    return res.json({ message: "Profile updated", result: updated });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

router.get("/caregiver/me", async (req, res) => {
  try {
    if (req.user.role !== "caregiver") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const me = await profileService.getMyCaregiverProfile(req.user.user_id);
    return res.json(me);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

router.put("/caregiver/me", async (req, res) => {
  try {
    if (req.user.role !== "caregiver") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const updated = await profileService.updateMyCaregiverProfile(req.user.user_id, req.body);
    return res.json({ message: "Profile updated", result: updated });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

router.get("/caregiver/:caregiverId", async (req, res) => {
  try {
    // Public caregiver viewing is limited to authenticated roles  that are part of the system flow
    if (req.user.role !== "family" && req.user.role !== "admin" && req.user.role !== "caregiver") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const caregiverId = String(req.params.caregiverId || "").trim();
    if (!caregiverId) {
      return res.status(400).json({ message: "Invalid caregiver id." });
    }

    const caregiver = await profileService.getCaregiverPublicProfileById(caregiverId);
    return res.json(caregiver);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

router.post("/caregiver/profileImage", (req, res) => {
  if (req.user.role !== "caregiver") {
    return res.status(403).json({ message: "Forbidden: caregiver only." });
  }

  // File upload is handled here, from the upload middleware can be returned properly
  caregiverProfileImageUpload.single("file")(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ message: "Profile image file is required (field name: file)." });
      }

      const result = await profileService.saveMyCaregiverProfileImage(req.user.user_id, req.file);

      return res.status(201).json({
        message: "Profile image uploaded successfully.",
        result,
      });
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }
  });
});

router.delete("/caregiver/profileImage", async (req, res) => {
  try {
    if (req.user.role !== "caregiver") {
      return res.status(403).json({ message: "Forbidden: caregiver only." });
    }

    const result = await profileService.removeMyCaregiverProfileImage(req.user.user_id);

    return res.json({
      message: "Profile image removed successfully.",
      result,
    });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

router.get("/caregiver/verificationStatus", async (req, res) => {
  try {
    // Used for checking the verification status of the authenticated caregiver
    if (req.user.role !== "caregiver") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const r = await profileService.getMyCaregiverVerificationStatus(req.user.user_id);
    return res.json(r);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

router.get("/caregiver/documents", async (req, res) => {
  try {
    if (req.user.role !== "caregiver") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const docs = await profileService.listMyCaregiverDocuments(req.user.user_id);
    return res.json(docs);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

router.post("/caregiver/documents", async (req, res) => {
  try {
    if (req.user.role !== "caregiver") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { document_type, file_url, file_name, file_size_kb, mime_type } = req.body;

    // This saves the document information for the authenticated caregiver
    if (!document_type || !file_url || !file_name) {
      return res
        .status(400)
        .json({ message: "document_type, file_url, file_name are required." });
    }

    const saved = await profileService.addMyCaregiverDocument(req.user.user_id, {
      document_type,
      file_url,
      file_name,
      file_size_kb: file_size_kb ?? null,
      mime_type: mime_type ?? null,
    });

    return res.status(201).json({ message: "Document saved", result: saved });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

router.put("/caregiver/submitVerification", async (req, res) => {
  try {
    // Moves caregiver profile into the verification process
    if (req.user.role !== "caregiver") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const r = await profileService.submitMyCaregiverForVerification(req.user.user_id);
    return res.json({ message: "Submitted for verification", result: r });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

router.put("/account/deactivate", async (req, res) => {
  try {
    const r = await profileService.deactivateMyAccount(req.user.user_id);
    return res.json({ message: "Account deactivated", result: r });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

router.put("/account/reactivate", async (req, res) => {
  try {
    const r = await profileService.reactivateMyAccount(req.user.user_id);
    return res.json({ message: "Account reactivated", result: r });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

router.delete("/account/delete", async (req, res) => {
  try {
    // Permanent account deletion
    const r = await profileService.deleteMyAccountPermanently(req.user.user_id);
    return res.json({ message: "Account deleted", result: r });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

module.exports = router;
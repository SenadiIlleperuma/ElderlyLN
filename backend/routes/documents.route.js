const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/auth.middleware");
const documentsService = require("../services/documents.service");
const { caregiverDocUpload } = require("../utils/upload");

router.use(authenticateToken);

// POST /api/documents/caregiver/upload
router.post("/caregiver/upload", (req, res) => {
  if (req.user.role !== "caregiver") {
    return res.status(403).json({ message: "Forbidden: caregiver only." });
  }

  caregiverDocUpload.single("file")(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const { document_type } = req.body;

      if (!document_type) {
        return res.status(400).json({ message: "document_type is required." });
      }

      if (!req.file) {
        return res.status(400).json({ message: "File is required (field name: file)." });
      }

      const result = await documentsService.saveCaregiverDocument({
        userId: req.user.user_id,
        documentType: document_type,
        file: req.file,
      });

      return res.status(201).json({
        message: "Uploaded successfully",
        result,
      });
    } catch (e) {
      console.error("Upload caregiver document error:", e);
      return res.status(400).json({ message: e.message });
    }
  });
});

// GET /api/documents/caregiver/me
router.get("/caregiver/me", async (req, res) => {
  try {
    if (req.user.role !== "caregiver") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await documentsService.listMyCaregiverDocuments(req.user.user_id);
    return res.json(result);
  } catch (e) {
    console.error("List my caregiver documents error:", e);
    return res.status(400).json({ message: e.message });
  }
});

// POST /api/documents/caregiver/submit
router.post("/caregiver/submit", async (req, res) => {
  try {
    if (req.user.role !== "caregiver") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await documentsService.submitForVerification(req.user.user_id);
    return res.json({
      message: "Submitted for verification",
      result,
    });
  } catch (e) {
    console.error("Submit for verification error:", e);
    return res.status(400).json({ message: e.message });
  }
});

// ADMIN: GET /api/documents/admin/caregiver/:caregiverId
router.get("/admin/caregiver/:caregiverId", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await documentsService.listCaregiverDocumentsByCaregiverId(
      req.params.caregiverId
    );
    return res.json(result);
  } catch (e) {
    console.error("Admin list caregiver documents error:", e);
    return res.status(400).json({ message: e.message });
  }
});

module.exports = router;
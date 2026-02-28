const express = require("express");
const router = express.Router();
const governanceService = require("../services/governance.service");
const { authenticateToken } = require("../middleware/auth.middleware");

router.use(authenticateToken);

// FAMILY/CAREGIVER: FILE COMPLAINT
// POST /api/governance/fileComplaint
router.post("/fileComplaint", async (req, res) => {
  try {
    const { bookingId, reason } = req.body;

    if (!bookingId || !reason) {
      return res.status(400).json({ message: "Booking ID and reason are required to file a complaint." });
    }

    const result = await governanceService.fileComplaint(
      req.user.user_id,
      bookingId,
      reason,
      req.user.role
    );

    res.status(201).json({ message: "Complaint filed successfully.", result });
  } catch (error) {
    console.error("Complaint filing error:", error.message);
    res.status(400).json({ message: error.message });
  }
});

// ADMIN: DASHBOARD STATS
// GET /api/governance/admin/stats
router.get("/admin/stats", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Only admin users can view admin stats." });
    }

    const stats = await governanceService.getAdminStats();
    res.json(stats);
  } catch (error) {
    console.error("Admin stats error:", error.message);
    res.status(400).json({ message: error.message });
  }
});

// ADMIN: VERIFICATION QUEUE
// GET /api/governance/admin/verificationQueue
router.get("/admin/verificationQueue", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Only admin users can view verification queue." });
    }

    const rows = await governanceService.getVerificationQueue();
    res.json(rows);
  } catch (error) {
    console.error("Verification queue error:", error.message);
    res.status(400).json({ message: error.message });
  }
});

// ADMIN: CAREGIVER VERIFICATION DETAILS
// GET /api/governance/admin/caregiver/:caregiverId
router.get("/admin/caregiver/:caregiverId", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Only admin users can view caregiver verification details." });
    }

    const { caregiverId } = req.params;
    const data = await governanceService.getCaregiverVerificationDetails(caregiverId);
    res.json(data);
  } catch (error) {
    console.error("Caregiver details error:", error.message);
    res.status(400).json({ message: error.message });
  }
});

// ADMIN: APPROVE / REJECT caregiver
// PUT /api/governance/admin/caregiver/:caregiverId/status
router.put("/admin/caregiver/:caregiverId/status", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Only admin users can verify caregivers." });
    }

    const { caregiverId } = req.params;
    const { newStatus, note } = req.body;

    if (!newStatus) {
      return res.status(400).json({ message: "newStatus is required." });
    }

    const result = await governanceService.updateCaregiverStatus(
      caregiverId,
      req.user.user_id,
      newStatus,
      note || null
    );

    res.json({ message: "Caregiver status updated.", result });
  } catch (error) {
    console.error("Update caregiver status error:", error.message);
    res.status(400).json({ message: error.message });
  }
});

// ADMIN: LIST COMPLAINTS
// GET /api/governance/complaints
router.get("/complaints", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Only admin users can view complaints." });
    }

    const rows = await governanceService.listComplaintsForAdmin();
    res.json(rows);
  } catch (error) {
    console.error("List complaints error:", error.message);
    res.status(400).json({ message: error.message });
  }
});

// ADMIN: RESOLVE COMPLAINT
// PUT /api/governance/resolveComplaint/:complaintId
router.put("/resolveComplaint/:complaintId", async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { resolutionNote, newStatus } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Only admin users can resolve complaints." });
    }

    if (!resolutionNote || !newStatus) {
      return res.status(400).json({ message: "Resolution note and newStatus are required." });
    }

    const result = await governanceService.resolveComplaint(
      complaintId,
      req.user.user_id,
      resolutionNote,
      newStatus
    );

    res.status(200).json({ message: "Complaint resolved successfully.", result });
  } catch (error) {
    console.error("Complaint resolution error:", error.message);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
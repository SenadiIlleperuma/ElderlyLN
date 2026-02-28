const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "caregiver-docs");

// Ensures upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeBase = path
      .basename(file.originalname || "file", ext)
      .replace(/[^\w\-]+/g, "_")
      .slice(0, 50);

    const unique = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}_${safeBase}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only PDF, JPG, and PNG files are allowed."));
  }
  cb(null, true);
}

const caregiverDocUpload = multer({
  storage: multer.memoryStorage(), 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, 
});

module.exports = { caregiverDocUpload };
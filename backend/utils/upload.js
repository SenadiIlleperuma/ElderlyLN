const multer = require("multer");

function caregiverDocFileFilter(req, file, cb) {
  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only PDF, JPG, and PNG files are allowed."));
  }
  cb(null, true);
}

function caregiverProfileImageFilter(req, file, cb) {
  const allowed = ["image/jpeg", "image/png"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPG and PNG images are allowed for profile image."));
  }
  cb(null, true);
}

const caregiverDocUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: caregiverDocFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const caregiverProfileImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: caregiverProfileImageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = {
  caregiverDocUpload,
  caregiverProfileImageUpload,
};
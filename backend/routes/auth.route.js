const express = require("express");
const router = express.Router();
const authService = require("../services/auth.service");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth.middleware");

// Helpers
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").toLowerCase());

const normalizePhoneLK = (phone) =>
  String(phone || "").replace(/\s+/g, "").replace(/-/g, "");

const isValidPhoneLK = (phone) => /^[0-9]{10}$/.test(phone);

const validatePassword = (pw) => {
  if (!pw || pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Password must include at least 1 uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Password must include at least 1 lowercase letter.";
  if (!/[0-9]/.test(pw)) return "Password must include at least 1 number.";
  return null;
};

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { role, email, password, phone_no, full_name, district } = req.body;

    if (!role || !email || !password || !phone_no || !full_name || !district) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (!["caregiver", "family", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email address." });
    }

    const phone = normalizePhoneLK(phone_no);
    if (!isValidPhoneLK(phone)) {
      return res.status(400).json({ message: "Invalid phone number. Use 10 digits (e.g., 07XXXXXXXX)." });
    }

    const pwErr = validatePassword(password);
    if (pwErr) {
      return res.status(400).json({ message: pwErr });
    }

    const newUser = await authService.registerUser(
      role,
      String(email).trim().toLowerCase(),
      password,
      phone,
      String(full_name).trim(),
      String(district).trim()
    );

    return res.status(201).json({
      message: "User registered successfully. Please login.",
      user: newUser,
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(400).json({ message: error.message || "Registration failed." });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
    if (!isValidEmail(email)) return res.status(400).json({ message: "Invalid email address." });

    const loginData = await authService.loginUser(String(email).trim().toLowerCase(), password);

    return res.status(200).json({
      message: "Login successful.",
      ...loginData,
    });
  } catch (error) {
    return res.status(401).json({ message: error.message || "Authentication failed. Invalid credentials." });
  }
});

// ME
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const u = await db.query(
      `SELECT user_id, email, role, phone_no
       FROM "user"
       WHERE user_id = $1`,
      [userId]
    );

    if (!u.rows[0]) return res.status(404).json({ message: "User not found" });

    const user = u.rows[0];

    let profile = { full_name: null, district: null };

    if (user.role === "family") {
      const p = await db.query(`SELECT full_name, district FROM family WHERE user_fk = $1`, [userId]);
      if (p.rows[0]) profile = p.rows[0];
    } else if (user.role === "caregiver") {
      const p = await db.query(`SELECT full_name, district FROM caregiver WHERE user_fk = $1`, [userId]);
      if (p.rows[0]) profile = p.rows[0];
    }

    return res.json({
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      phone_no: user.phone_no,
      full_name: profile.full_name,
      district: profile.district,
    });
  } catch (e) {
    console.error("auth/me error:", e);
    return res.status(500).json({ message: "Failed to load profile" });
  }
});

module.exports = router;

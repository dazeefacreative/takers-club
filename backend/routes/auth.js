const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const db       = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// Shoppers never sign in (guest checkout only). There is no public
// registration — create the store owner's account with scripts/create-admin.js.

// ─── POST /api/auth/login ─────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
    if (!rows.length) return res.status(401).json({ error: "Invalid credentials" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user.id);
    res.json({
      token,
      user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────
router.get("/me", authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// ─── PUT /api/auth/profile ────────────────────────────────────
router.put("/profile", authenticate, async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;
    await db.query(
      "UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?",
      [first_name, last_name, phone, req.user.id]
    );
    res.json({ message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

// ─── PUT /api/auth/change-password ───────────────────────────
router.put("/change-password", authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const [rows] = await db.query("SELECT password_hash FROM users WHERE id = ?", [req.user.id]);
    const valid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: "Current password is incorrect" });
    if (new_password.length < 8) return res.status(400).json({ error: "New password too short" });

    const hash = await bcrypt.hash(new_password, 12);
    await db.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, req.user.id]);
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ error: "Password change failed" });
  }
});

module.exports = router;

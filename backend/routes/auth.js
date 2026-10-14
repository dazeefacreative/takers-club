const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const db       = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// Shoppers never sign in (guest checkout only). There is no public
// registration. The first admin is created once via /admin/setup (needs the
// ADMIN_SETUP_TOKEN env var); after that, admins add others from Admin → Admins.
// scripts/create-admin.js remains as a terminal fallback.

const MIN_PASSWORD = 10;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const adminCount = async () => {
  const [[row]] = await db.query("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'");
  return row.count;
};

// Constant-time comparison so the setup code can't be guessed byte by byte
const tokenMatches = (given, expected) => {
  const a = Buffer.from(String(given || ""));
  const b = Buffer.from(String(expected || ""));
  return a.length === b.length && require("crypto").timingSafeEqual(a, b);
};

// ─── GET /api/auth/setup-status ───────────────────────────────
// Lets the login page offer first-time setup only while it's possible.
router.get("/setup-status", async (req, res) => {
  try {
    const configured = !!process.env.ADMIN_SETUP_TOKEN;
    res.json({ needsSetup: (await adminCount()) === 0, setupEnabled: configured });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not check setup status" });
  }
});

// ─── POST /api/auth/setup ─────────────────────────────────────
// One-time creation of the FIRST admin. Disabled for good once any admin
// exists, and always requires the ADMIN_SETUP_TOKEN set in the server env.
router.post("/setup", async (req, res) => {
  try {
    const { setup_code, first_name, last_name, email, password } = req.body;

    if (!process.env.ADMIN_SETUP_TOKEN) {
      return res.status(403).json({ error: "Setup is disabled. Add ADMIN_SETUP_TOKEN to the server's environment variables first." });
    }
    if ((await adminCount()) > 0) {
      return res.status(403).json({ error: "An admin already exists. Sign in instead." });
    }
    if (!tokenMatches(setup_code, process.env.ADMIN_SETUP_TOKEN)) {
      return res.status(401).json({ error: "Setup code is incorrect." });
    }
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (!emailPattern.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (password.length < MIN_PASSWORD) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters.` });
    }

    const hash = await bcrypt.hash(password, 12);
    const cleanEmail = email.trim().toLowerCase();
    await db.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role)
       VALUES (?, ?, ?, ?, 'admin')
       ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name),
                               password_hash = VALUES(password_hash), role = 'admin'`,
      [first_name.trim(), last_name.trim(), cleanEmail, hash]
    );
    const [[user]] = await db.query("SELECT id, first_name, last_name, email, role FROM users WHERE email = ?", [cleanEmail]);

    res.status(201).json({ token: signToken(user.id), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Setup failed" });
  }
});

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

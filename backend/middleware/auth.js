const jwt = require("jsonwebtoken");
const db  = require("../config/db");

// Verifies JWT — attaches req.user on success
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await db.query(
      "SELECT id, first_name, last_name, email, role FROM users WHERE id = ?",
      [decoded.id]
    );

    if (!rows.length) return res.status(401).json({ error: "User not found" });

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Optional auth — attaches req.user if token present, doesn't fail if absent
const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      const token = header.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [rows] = await db.query(
        "SELECT id, first_name, last_name, email, role FROM users WHERE id = ?",
        [decoded.id]
      );
      if (rows.length) req.user = rows[0];
    }
  } catch (_) { /* token invalid — continue as guest */ }
  next();
};

// Admin-only guard (use after authenticate)
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

module.exports = { authenticate, optionalAuth, adminOnly };

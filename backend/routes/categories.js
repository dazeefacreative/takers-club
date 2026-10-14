const express = require("express");
const db = require("../config/db");
const { authenticate, adminOnly } = require("../middleware/auth");
const router = express.Router();

router.get("/", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM categories ORDER BY name");
  res.json(rows);
});

router.post("/", authenticate, adminOnly, async (req, res) => {
  try {
    const { name, slug, subtitle, image_url } = req.body;
    const [r] = await db.query(
      "INSERT INTO categories (name, slug, subtitle, image_url) VALUES (?,?,?,?)",
      [name, slug, subtitle, image_url]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    res.status(500).json({ error: "Failed to create category" });
  }
});

module.exports = router;

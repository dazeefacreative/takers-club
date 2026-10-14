const express = require("express");
const db = require("../config/db");
const router = express.Router();

router.get("/", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM colors ORDER BY name");
  res.json(rows);
});

module.exports = router;

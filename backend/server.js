require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// ─── Safety net ──────────────────────────────────────────────
// A rejected promise inside an async route handler that isn't
// try/caught (Express 4 doesn't auto-catch those) would otherwise
// crash the whole Node process on some Node versions. Log instead.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

// ─── CORS ────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  // tolerate stray spaces and trailing slashes ("https://site.com/") in the env value
  .map((url) => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// ─── Body parsers ────────────────────────────────────────────
// NOTE: payment/webhook route needs raw body — register it BEFORE json()
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static uploads ─────────────────────────────────────────
// Uploaded files are saved under a random filename per upload (see
// middleware/uploadVideo.js, upload.js), so a given URL's content never
// changes — safe to let browsers cache it forever. A new admin upload
// always gets a new URL, so this can't serve stale content.
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  maxAge: "1y",
  immutable: true,
}));

// ─── Routes ──────────────────────────────────────────────────
app.use("/api/auth",       require("./routes/auth"));
app.use("/api/products",   require("./routes/products"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/colors",     require("./routes/colors"));
app.use("/api/payment",    require("./routes/payment"));
app.use("/api/settings",             require("./routes/settings"));
app.use("/api/admin",                require("./routes/admin"));

// ─── Health check ─────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV });
});

// ─── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Error handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// ─── IMPORTANT: Namecheap Passenger needs module.exports ─────
// Do NOT call app.listen() — Passenger manages the port.
module.exports = app;

// Local dev only
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Dev server running on http://localhost:${PORT}`));
}

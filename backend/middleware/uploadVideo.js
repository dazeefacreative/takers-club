const multer = require("multer");
const fs     = require("fs");
const path   = require("path");
const crypto = require("crypto");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage so we can pick the extension from the verified mimetype
// before writing to disk (matches the pattern in middleware/upload.js).
const storage = multer.memoryStorage();

const MIME_EXT = { "video/webm": "webm", "video/mp4": "mp4" };

const fileFilter = (req, file, cb) => {
  if (MIME_EXT[file.mimetype]) return cb(null, true);
  cb(new Error("Only webm and mp4 videos are allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Middleware that runs after multer: writes the uploaded video buffer to disk
// under a random filename. Attaches .filename to the file (mirrors upload.js).
const saveVideo = (req, res, next) => {
  if (!req.file) return next();
  try {
    const ext      = MIME_EXT[req.file.mimetype];
    const filename = `${crypto.randomBytes(16).toString("hex")}.${ext}`;
    const dest     = path.join(uploadDir, filename);

    fs.writeFileSync(dest, req.file.buffer);

    req.file.filename = filename;
    req.file.path     = dest;
    next();
  } catch (err) {
    console.error("Video save error:", err);
    next(err);
  }
};

// Convenience: returns [multer middleware, saver] as an array for use in routes
upload.withSave = (fieldName) => [
  upload.single(fieldName),
  saveVideo,
];

module.exports = upload;

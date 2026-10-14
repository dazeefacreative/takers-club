const multer = require("multer");
const fs     = require("fs");
const path   = require("path");
const crypto = require("crypto");
const { compressToLimit } = require("../utils/compressImage");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage so Sharp can process the buffer before saving
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Only jpg, jpeg, png, and webp images are allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 12 * 1024 * 1024 }, // 12MB raw upload limit before compression (Sharp compresses every image down to 500KB regardless of input size)
});

// Middleware that runs after multer: compresses each uploaded file with Sharp
// and writes the result to disk as a WebP. Attaches .filename to each file.
const compressImages = async (req, res, next) => {
  if (!req.files || !req.files.length) return next();
  try {
    await Promise.all(req.files.map(async (file) => {
      const name     = crypto.randomBytes(16).toString("hex");
      const filename = `${name}.webp`;
      const dest     = path.join(uploadDir, filename);

      const output = await compressToLimit(file.buffer, { maxBytes: 500 * 1024, maxWidth: 900 });
      fs.writeFileSync(dest, output);

      file.filename = filename;
      file.path     = dest;
    }));
    next();
  } catch (err) {
    console.error("Image compression error:", err);
    next(err);
  }
};

// Convenience: returns [multer middleware, compressor] as an array for use in routes
upload.withCompression = (fieldName, maxCount) => [
  upload.array(fieldName, maxCount),
  compressImages,
];

module.exports = upload;

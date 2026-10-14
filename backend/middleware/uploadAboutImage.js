const multer = require("multer");
const sharp  = require("sharp");
const fs     = require("fs");
const path   = require("path");
const crypto = require("crypto");
const { compressToLimit } = require("../utils/compressImage");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

const RATIO = 3 / 2; // About-section slideshow images are fixed at 3:2
const RATIO_LABEL = "3:2";
const TOLERANCE = 0.08;

// Middleware that runs after multer: validates the file's aspect ratio,
// then compresses it to WebP capped at 500KB.
const processAboutImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const { width, height } = await sharp(req.file.buffer).metadata();
    const actualRatio = width / height;
    if (Math.abs(actualRatio - RATIO) > TOLERANCE) {
      return res.status(400).json({
        error: `Image must be ${RATIO_LABEL} — got ${width}x${height}.`,
      });
    }

    const filename = `${crypto.randomBytes(16).toString("hex")}.webp`;
    const dest      = path.join(uploadDir, filename);

    const output = await compressToLimit(req.file.buffer, { maxBytes: 500 * 1024, maxWidth: 1200 });
    fs.writeFileSync(dest, output);

    req.file.filename = filename;
    req.file.path     = dest;
    next();
  } catch (err) {
    console.error("About image processing error:", err);
    next(err);
  }
};

// Convenience: returns [multer middleware, processor] as an array for use in routes
upload.withValidation = (fieldName) => [
  upload.single(fieldName),
  processAboutImage,
];

module.exports = upload;

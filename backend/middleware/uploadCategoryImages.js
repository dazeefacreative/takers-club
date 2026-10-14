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

// hoodies are square (1:1); baseball caps and shirts are wide banners (3:1)
const ASPECT_RULES = {
  hoodies:      { ratio: 1, label: "square (1:1)" },
  "baseball-caps": { ratio: 3, label: "wide (3:1)" },
  shirts:       { ratio: 3, label: "wide (3:1)" },
};
const TOLERANCE = 0.08;

// Middleware that runs after multer: validates the file's aspect ratio
// against the category's rule, then compresses it to WebP capped at 500KB.
const processCategoryImage = async (req, res, next) => {
  if (!req.file) return next();

  const rule = ASPECT_RULES[req.params.slug];
  if (!rule) return res.status(400).json({ error: "Unknown category" });

  try {
    const { width, height } = await sharp(req.file.buffer).metadata();
    const actualRatio = width / height;
    if (Math.abs(actualRatio - rule.ratio) > TOLERANCE) {
      return res.status(400).json({
        error: `Image must be ${rule.label} — got ${width}x${height}.`,
      });
    }

    const filename = `${crypto.randomBytes(16).toString("hex")}.webp`;
    const dest      = path.join(uploadDir, filename);

    const output = await compressToLimit(req.file.buffer, { maxBytes: 500 * 1024, maxWidth: 1400 });
    fs.writeFileSync(dest, output);

    req.file.filename = filename;
    req.file.path     = dest;
    next();
  } catch (err) {
    console.error("Category image processing error:", err);
    next(err);
  }
};

// Convenience: returns [multer middleware, processor] as an array for use in routes
upload.withValidation = (fieldName) => [
  upload.single(fieldName),
  processCategoryImage,
];

module.exports = upload;

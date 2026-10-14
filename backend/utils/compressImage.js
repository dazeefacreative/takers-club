const sharp = require("sharp");

// Compresses an image buffer to WebP, iteratively lowering quality and then
// dimensions until the result fits under maxBytes. Used everywhere an
// uploaded image needs a guaranteed max output size regardless of how large
// the original file was.
async function compressToLimit(buffer, { maxBytes = 500 * 1024, maxWidth = 1200 } = {}) {
  let width = maxWidth;
  let quality = 82;

  let output = await sharp(buffer).resize({ width, withoutEnlargement: true }).webp({ quality }).toBuffer();

  while (output.length > maxBytes && quality > 35) {
    quality -= 10;
    output = await sharp(buffer).resize({ width, withoutEnlargement: true }).webp({ quality }).toBuffer();
  }

  while (output.length > maxBytes && width > 400) {
    width = Math.round(width * 0.85);
    output = await sharp(buffer).resize({ width, withoutEnlargement: true }).webp({ quality }).toBuffer();
  }

  return output;
}

module.exports = { compressToLimit };

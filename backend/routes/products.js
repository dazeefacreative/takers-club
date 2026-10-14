const express  = require("express");
const fs       = require("fs");
const path     = require("path");
const slugify  = require("slugify");
const db       = require("../config/db");
const { authenticate, adminOnly } = require("../middleware/auth");
const upload   = require("../middleware/upload");

const router = express.Router();

// Maps common MySQL error codes to admin-facing messages, so a bad request
// (invalid category, duplicate name, oversized field, etc.) tells the admin
// what to fix instead of a generic "failed" message. Returns null for
// anything not worth surfacing directly, which falls back to a 500.
function friendlyProductError(err) {
  switch (err.code) {
    case "ER_DUP_ENTRY":
      return "A product with this name already exists. Try a different name.";
    case "ER_NO_REFERENCED_ROW_2":
    case "ER_NO_REFERENCED_ROW":
      return "The selected category no longer exists. Refresh the page and try again.";
    case "ER_BAD_NULL_ERROR":
      return "A required field is missing.";
    case "ER_DATA_TOO_LONG":
      return "One of the fields is too long.";
    case "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD":
    case "WARN_DATA_TRUNCATED":
      return "One of the fields has an invalid value. Check the price and tag.";
    default:
      return null;
  }
}

// ─── GET /api/products — public list ─────────────────────────
router.get("/", async (req, res) => {
  try {
    const { category, tag, search, limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = "p.is_active = 1";

    if (category) { where += " AND c.slug = ?"; params.push(category); }
    if (tag)      { where += " AND p.tag = ?";  params.push(tag); }
    if (search)   { where += " AND p.name LIKE ?"; params.push(`%${search}%`); }

    const [products] = await db.query(`
      SELECT p.id, p.name, p.slug, p.price, p.tag,
             c.name AS category, c.slug AS category_slug,
             (SELECT image_url FROM product_images
              WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE ${where}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, Number(limit), Number(offset)]);

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${where}`, params
    );

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ─── GET /api/products/:slug — single product ─────────────────
router.get("/:slug", async (req, res) => {
  try {
    const [[product]] = await db.query(`
      SELECT p.*, c.name AS category, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.slug = ? AND p.is_active = 1
    `, [req.params.slug]);

    if (!product) return res.status(404).json({ error: "Product not found" });

    const [images] = await db.query(
      "SELECT id, image_url, is_primary FROM product_images WHERE product_id = ? ORDER BY display_order",
      [product.id]
    );

    const [sizes] = await db.query(
      `SELECT ps.size, ps.stock_quantity, c.hex_code
       FROM product_sizes ps
       LEFT JOIN colors c ON c.name = ps.size
       WHERE ps.product_id = ? ORDER BY ps.id`,
      [product.id]
    );

    res.json({ ...product, images, sizes });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// ─── POST /api/products — admin create ───────────────────────
router.post("/", authenticate, adminOnly, ...upload.withCompression("images", 8), async (req, res) => {
  const { name, description, price, category_id, tag, sizes } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Product name is required." });
  }
  if (price === undefined || price === null || price === "" || isNaN(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ error: "A valid price is required." });
  }
  if (!req.files || !req.files.length) {
    return res.status(400).json({ error: "Add at least one product image before publishing." });
  }

  let parsedSizes = [];
  if (sizes) {
    try {
      parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
    } catch {
      return res.status(400).json({ error: "Invalid size data." });
    }
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const slug = slugify(name, { lower: true, strict: true });
    const [result] = await conn.query(
      "INSERT INTO products (name, slug, description, price, category_id, tag) VALUES (?, ?, ?, ?, ?, ?)",
      [name, slug, description, price, category_id || null, tag || null]
    );
    const productId = result.insertId;

    // Images
    if (req.files && req.files.length) {
      for (let i = 0; i < req.files.length; i++) {
        await conn.query(
          "INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)",
          [productId, `/uploads/${req.files[i].filename}`, i === 0 ? 1 : 0, i]
        );
      }
    }

    // Sizes e.g. sizes = [{"size":"S","stock":10},{"size":"M","stock":5}]
    // or, for color-based categories, [{"size":"Black","stock":10,"hex":"#000000"}] —
    // a `hex` means this row is a color, so upsert it into the reusable
    // colors registry before recording the stock.
    for (const s of parsedSizes) {
      if (s.hex) {
        await conn.query(
          "INSERT INTO colors (name, hex_code) VALUES (?, ?) ON DUPLICATE KEY UPDATE hex_code = VALUES(hex_code)",
          [s.size, s.hex]
        );
      }
      await conn.query(
        "INSERT INTO product_sizes (product_id, size, stock_quantity) VALUES (?, ?, ?)",
        [productId, s.size, s.stock || 0]
      );
    }

    await conn.commit();
    res.status(201).json({ id: productId, slug, message: "Product created" });
  } catch (err) {
    await conn.rollback();
    const friendly = friendlyProductError(err);
    if (friendly) return res.status(400).json({ error: friendly });
    console.error(err);
    res.status(500).json({ error: "Failed to create product" });
  } finally {
    conn.release();
  }
});

// ─── PUT /api/products/:id — admin update ────────────────────
router.put("/:id", authenticate, adminOnly, ...upload.withCompression("images", 8), async (req, res) => {
  const { name, description, price, category_id, tag, is_active, sizes } = req.body;

  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: "Product name cannot be empty." });
  }
  if (price !== undefined && (price === "" || isNaN(Number(price)) || Number(price) < 0)) {
    return res.status(400).json({ error: "A valid price is required." });
  }

  let parsedSizes = [];
  if (sizes) {
    try {
      parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
    } catch {
      return res.status(400).json({ error: "Invalid size data." });
    }
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const slug = name ? slugify(name, { lower: true, strict: true }) : undefined;

    const fields = [];
    const params = [];
    if (name !== undefined)        { fields.push("name = ?");        params.push(name); }
    if (slug !== undefined)        { fields.push("slug = ?");        params.push(slug); }
    if (description !== undefined) { fields.push("description = ?"); params.push(description); }
    if (price !== undefined)       { fields.push("price = ?");       params.push(price); }
    if (category_id !== undefined) { fields.push("category_id = ?"); params.push(category_id || null); }
    if (tag !== undefined)         { fields.push("tag = ?");         params.push(tag || null); }
    if (is_active !== undefined) {
      fields.push("is_active = ?");
      params.push((is_active === false || is_active === "false" || is_active === "0" || is_active === 0) ? 0 : 1);
    }

    if (fields.length) {
      await conn.query(
        `UPDATE products SET ${fields.join(", ")} WHERE id = ?`,
        [...params, req.params.id]
      );
    }

    if (req.files && req.files.length) {
      // Get next display order
      const [[{ maxOrder }]] = await conn.query(
        "SELECT COALESCE(MAX(display_order), -1) AS maxOrder FROM product_images WHERE product_id = ?",
        [req.params.id]
      );
      for (let i = 0; i < req.files.length; i++) {
        await conn.query(
          "INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, 0, ?)",
          [req.params.id, `/uploads/${req.files[i].filename}`, maxOrder + i + 1]
        );
      }
    }

    for (const s of parsedSizes) {
      if (s.hex) {
        await conn.query(
          "INSERT INTO colors (name, hex_code) VALUES (?, ?) ON DUPLICATE KEY UPDATE hex_code = VALUES(hex_code)",
          [s.size, s.hex]
        );
      }
      await conn.query(
        `INSERT INTO product_sizes (product_id, size, stock_quantity) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE stock_quantity = ?`,
        [req.params.id, s.size, s.stock, s.stock]
      );
    }

    await conn.commit();
    res.json({ message: "Product updated" });
  } catch (err) {
    await conn.rollback();
    const friendly = friendlyProductError(err);
    if (friendly) return res.status(400).json({ error: friendly });
    console.error(err);
    res.status(500).json({ error: "Failed to update product" });
  } finally {
    conn.release();
  }
});

// ─── DELETE /api/products/:productId/images/:imageId — admin remove one image ──
router.delete("/:productId/images/:imageId", authenticate, adminOnly, async (req, res) => {
  try {
    const [[image]] = await db.query(
      "SELECT * FROM product_images WHERE id = ? AND product_id = ?",
      [req.params.imageId, req.params.productId]
    );
    if (!image) return res.status(404).json({ error: "Image not found" });

    const [[{ count }]] = await db.query(
      "SELECT COUNT(*) AS count FROM product_images WHERE product_id = ?",
      [req.params.productId]
    );
    if (count <= 1) {
      return res.status(400).json({ error: "Products must have at least one image. Upload a replacement before removing this one." });
    }

    await db.query("DELETE FROM product_images WHERE id = ?", [image.id]);

    const filePath = path.join(__dirname, "..", image.image_url);
    fs.unlink(filePath, () => {}); // best-effort, don't fail the request if missing

    if (image.is_primary) {
      const [[next]] = await db.query(
        "SELECT id FROM product_images WHERE product_id = ? ORDER BY display_order LIMIT 1",
        [req.params.productId]
      );
      if (next) {
        await db.query("UPDATE product_images SET is_primary = 1 WHERE id = ?", [next.id]);
      }
    }

    res.json({ message: "Image removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove image" });
  }
});

// ─── DELETE /api/products/:id — admin soft delete ────────────
router.delete("/:id", authenticate, adminOnly, async (req, res) => {
  try {
    await db.query("UPDATE products SET is_active = 0 WHERE id = ?", [req.params.id]);
    res.json({ message: "Product deactivated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;

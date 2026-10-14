const express = require("express");
const db = require("../config/db");
const { authenticate, adminOnly } = require("../middleware/auth");
const router = express.Router();

// All admin routes require auth + admin role
router.use(authenticate, adminOnly);

// ─── GET /api/admin/stats ─────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const [[revenue]]   = await db.query("SELECT COALESCE(SUM(total), 0) AS total FROM orders WHERE status = 'paid'");
    const [[orders]]    = await db.query("SELECT COUNT(*) AS count FROM orders");
    // Guest-checkout store: a "customer" is a distinct email with at least one paid order
    const [[customers]] = await db.query("SELECT COUNT(DISTINCT LOWER(email)) AS count FROM orders WHERE status = 'paid'");
    const [[products]]  = await db.query("SELECT COUNT(*) AS count FROM products WHERE is_active = 1");

    // Recent orders
    const [recentOrders] = await db.query(`
      SELECT order_number, first_name, last_name, email, total, status, created_at
      FROM orders ORDER BY created_at DESC LIMIT 10
    `);

    // Revenue by month (last 6 months)
    const [monthlyRevenue] = await db.query(`
      SELECT DATE_FORMAT(paid_at, '%Y-%m') AS month,
             SUM(total) AS revenue,
             COUNT(*) AS order_count
      FROM orders
      WHERE status = 'paid' AND paid_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY month
    `);

    res.json({
      revenue: revenue.total,
      orders: orders.count,
      customers: customers.count,
      products: products.count,
      recentOrders,
      monthlyRevenue,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stats fetch failed" });
  }
});

// ─── GET /api/admin/orders ────────────────────────────────────
router.get("/orders", async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  let where = "1=1";
  const params = [];
  if (status) { where += " AND status = ?"; params.push(status); }

  const [orders] = await db.query(
    `SELECT * FROM orders WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  if (orders.length) {
    const orderIds = orders.map((o) => o.id);
    const [items] = await db.query(
      `SELECT * FROM order_items WHERE order_id IN (${orderIds.map(() => "?").join(",")})`,
      orderIds
    );
    const itemsByOrder = {};
    for (const item of items) {
      (itemsByOrder[item.order_id] ||= []).push(item);
    }
    for (const order of orders) order.items = itemsByOrder[order.id] || [];
  }

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM orders WHERE ${where}`, params);
  res.json({ orders, total, page: Number(page) });
});

// ─── GET /api/admin/orders/:id ────────────────────────────────
router.get("/orders/:id", async (req, res) => {
  const [[order]] = await db.query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
  if (!order) return res.status(404).json({ error: "Not found" });
  const [items] = await db.query("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
  res.json({ ...order, items });
});

// ─── PUT /api/admin/orders/:id/status ────────────────────────
router.put("/orders/:id/status", async (req, res) => {
  const { status } = req.body;
  const allowed = ["pending","paid","processing","shipped","delivered","cancelled","refunded"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });
  await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id]);
  res.json({ message: "Status updated" });
});

// ─── GET /api/admin/products — full list incl. inactive ──────
router.get("/products", async (req, res) => {
  const [products] = await db.query(`
    SELECT p.id, p.name, p.slug, p.price, p.tag, p.is_active,
           c.name AS category, c.slug AS category_slug,
           (SELECT image_url FROM product_images
            WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ORDER BY p.created_at DESC
  `);
  res.json({ products });
});

// ─── GET /api/admin/products/:id — full product for editing ──
router.get("/products/:id", async (req, res) => {
  const [[product]] = await db.query(
    "SELECT * FROM products WHERE id = ?",
    [req.params.id]
  );
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
});

// ─── GET /api/admin/customers ─────────────────────────────────
router.get("/customers", async (req, res) => {
  // No customer accounts — group paid guest orders by email, using the
  // name/phone from each customer's most recent order.
  const [rows] = await db.query(`
    SELECT LOWER(o.email) AS email,
           SUBSTRING_INDEX(GROUP_CONCAT(o.first_name ORDER BY o.created_at DESC SEPARATOR '\n'), '\n', 1) AS first_name,
           SUBSTRING_INDEX(GROUP_CONCAT(o.last_name  ORDER BY o.created_at DESC SEPARATOR '\n'), '\n', 1) AS last_name,
           SUBSTRING_INDEX(GROUP_CONCAT(COALESCE(o.phone, '') ORDER BY o.created_at DESC SEPARATOR '\n'), '\n', 1) AS phone,
           MIN(o.created_at) AS created_at,
           COUNT(o.id) AS order_count,
           COALESCE(SUM(o.total), 0) AS total_spent
    FROM orders o
    WHERE o.status = 'paid'
    GROUP BY LOWER(o.email)
    ORDER BY MAX(o.created_at) DESC
  `);
  res.json(rows);
});

module.exports = router;

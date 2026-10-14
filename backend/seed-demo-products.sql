-- ============================================================
-- TAKERS CLUB — Demo products (optional)
-- Run AFTER schema.sql. Loads the 7 pieces from the landing-page design
-- so the storefront isn't empty. Images ship in backend/uploads/seed-*.webp.
--
-- Prices are PLACEHOLDERS (₦45,000) — edit them in Admin → Products,
-- along with stock, before launch.
-- ============================================================

INSERT INTO products (name, slug, description, price, category_id, tag) VALUES
  ('Crown Pullover Hoodie', 'crown-pullover-hoodie',
   'Heavyweight black pullover hoodie with the embroidered Takers Club wordmark. Relaxed unisex fit, kangaroo pocket and ribbed cuffs.',
   45000, (SELECT id FROM categories WHERE slug = 'hoodies'), 'New'),
  ('Crown Takeover Exclusive Cyan Shirt', 'crown-takeover-exclusive-cyan-shirt',
   'Oversized sky-blue tee with the Takers Club chest print, TC sleeve mark and woven hem label. 100% cotton.',
   45000, (SELECT id FROM categories WHERE slug = 'shirts'), 'New'),
  ('Crown Takeover Exclusive Cream Shirt', 'crown-takeover-exclusive-cream-shirt',
   'Oversized cream tee with the Takers Club chest print, TC sleeve mark and woven hem label. 100% cotton.',
   45000, (SELECT id FROM categories WHERE slug = 'shirts'), NULL),
  ('Crown Takeover Exclusive White Shirt', 'crown-takeover-exclusive-white-shirt',
   'Oversized white tee with the Takers Club chest print, TC sleeve mark and woven hem label. 100% cotton.',
   45000, (SELECT id FROM categories WHERE slug = 'shirts'), NULL),
  ('Pure Class Shirt Authentic', 'pure-class-shirt-authentic',
   'The essential white Takers Club tee. Boxy drop-shoulder fit with a bold front wordmark. 100% cotton.',
   45000, (SELECT id FROM categories WHERE slug = 'shirts'), 'Bestseller'),
  ('Baseball Original Edition Face Cap', 'baseball-original-edition-face-cap',
   'Washed beige six-panel cap with an embroidered Takers Club wordmark and adjustable strap.',
   45000, (SELECT id FROM categories WHERE slug = 'baseball-caps'), NULL),
  ('Baseball Original Edition Black Face Cap', 'baseball-original-edition-black-face-cap',
   'Black six-panel cap with raised white Takers Club embroidery, TC side mark and adjustable strap.',
   45000, (SELECT id FROM categories WHERE slug = 'baseball-caps'), 'Limited');

INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT p.id, i.image_url, 1, 0
FROM products p
JOIN (
  SELECT 'crown-pullover-hoodie' AS slug, '/uploads/seed-hoodie-black.webp' AS image_url
  UNION ALL SELECT 'crown-takeover-exclusive-cyan-shirt',      '/uploads/seed-tee-cyan.webp'
  UNION ALL SELECT 'crown-takeover-exclusive-cream-shirt',     '/uploads/seed-tee-cream.webp'
  UNION ALL SELECT 'crown-takeover-exclusive-white-shirt',     '/uploads/seed-tee-white-angle.webp'
  UNION ALL SELECT 'pure-class-shirt-authentic',               '/uploads/seed-tee-white-front.webp'
  UNION ALL SELECT 'baseball-original-edition-face-cap',       '/uploads/seed-cap-beige.webp'
  UNION ALL SELECT 'baseball-original-edition-black-face-cap', '/uploads/seed-cap-black.webp'
) i ON i.slug = p.slug;

-- Shirts and hoodies sell by size (10 of each, placeholder stock)
INSERT INTO product_sizes (product_id, size, stock_quantity)
SELECT p.id, s.size, 10
FROM products p
JOIN categories c ON c.id = p.category_id AND c.slug IN ('hoodies', 'shirts')
CROSS JOIN (
  SELECT 'S' AS size UNION ALL SELECT 'M' UNION ALL SELECT 'L' UNION ALL SELECT 'XL' UNION ALL SELECT 'XXL'
) s
WHERE p.slug IN (
  'crown-pullover-hoodie', 'crown-takeover-exclusive-cyan-shirt', 'crown-takeover-exclusive-cream-shirt',
  'crown-takeover-exclusive-white-shirt', 'pure-class-shirt-authentic'
);

-- Caps sell by color (the "size" column holds the color name)
INSERT INTO product_sizes (product_id, size, stock_quantity)
SELECT id, 'Beige', 10 FROM products WHERE slug = 'baseball-original-edition-face-cap'
UNION ALL
SELECT id, 'Black', 10 FROM products WHERE slug = 'baseball-original-edition-black-face-cap';

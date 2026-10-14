// Creates (or resets) the store owner's admin login. There is no public
// sign-up — shoppers check out as guests — so this is the only way in.
//
// Usage (from the backend folder, with .env configured):
//   node scripts/create-admin.js owner@takersclub.store "a-strong-password" "First" "Last"
require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("../config/db");

(async () => {
  const [email, password, firstName = "Store", lastName = "Admin"] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: node scripts/create-admin.js <email> <password> ["First"] ["Last"]');
    process.exit(1);
  }
  if (password.length < 10) {
    console.error("Use a password of at least 10 characters.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  await db.query(
    `INSERT INTO users (first_name, last_name, email, password_hash, role)
     VALUES (?, ?, ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin'`,
    [firstName, lastName, email.toLowerCase(), hash]
  );
  console.log(`Admin ready: ${email.toLowerCase()} — sign in at /admin/login`);
  await db.end();
})().catch((err) => {
  console.error("Failed to create admin:", err.message);
  process.exit(1);
});

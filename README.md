# Takers Club — Full Stack E-commerce

Streetwear store for Takers Club ("Wear your own crown."). React + Vite + Tailwind frontend, Express + MySQL backend, Paystack payments.

**Guest checkout only.** Shoppers never sign in or sign up. The cart lives in the browser, and checkout takes an email, phone number and delivery address. The only login is the store owner's admin account at `/admin/login`.

## Quick Start (Local Development)

### 1. Database
- Start MySQL (XAMPP / WAMP / Homebrew)
- Uncomment the `CREATE DATABASE` / `USE` lines at the top of `backend/schema.sql`, then run it in phpMyAdmin or the MySQL CLI
- Optional: run `backend/seed-demo-products.sql` to load the 7 demo products from the design. Prices are ₦45,000 placeholders.

### 2. Backend
```bash
cd backend
cp .env.example .env  # fill in DB, JWT_SECRET, PAYSTACK_SECRET_KEY, SMTP
npm install
node server.js        # runs on http://localhost:3001 (PORT in .env)
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev           # runs on http://localhost:5180
```
Vite proxies `/api` and `/uploads` to http://localhost:3001. Keep `VITE_API_URL` unset in `frontend/.env.local` so local dev uses the local backend.

### 4. Create the store owner's admin login
There is no public sign-up. Create the admin account from the backend folder:
```bash
node scripts/create-admin.js owner@takersclub.store "a-strong-password" "First" "Last"
```
Run it again with the same email to reset the password.

## Store identity
Brand name, contact email, phone, Instagram and shipping rules are in `frontend/src/lib/brand.ts`. The phone number and Instagram link stay hidden until they're filled in. If you change the shipping fee or the free-shipping threshold, change them in `backend/routes/payment.js` too.

## Routes
| URL | Description |
|-----|-------------|
| / | Homepage (hero + "Fresh in the fold" grid) |
| /shop | All products |
| /shop/:category | `hoodies`, `shirts`, `baseball-caps` |
| /product/:slug | Product detail |
| /cart | Cart (stored in the browser) |
| /checkout | Guest checkout → Paystack |
| /payment/success | After Paystack payment |
| /about, /contact | Brand pages |
| /shipping, /returns, /privacy-policy, /terms-of-service | Policies |
| /admin/login | Store owner sign in |
| /admin | Admin dashboard |
| /admin/products | Manage products (caps sell by colour, everything else by size) |
| /admin/orders | Manage orders |
| /admin/customers | Customers grouped by email from paid orders |
| /admin/settings | Optional homepage hero video |

## Paystack Test Card
- Number: `4084084084084081`
- Expiry: Any future date
- CVV: Any 3 digits

## Production Deployment
To update the live site, open cPanel Terminal and run:
```bash
cd ~/takersclub-api && git pull origin main && bash deploy.sh
```
`deploy.sh` installs packages (after the first run it only installs what changed), builds the storefront into `public_html` and restarts the API.

Hosted on Namecheap (cPanel): a static frontend build, a Node/Passenger backend app and MySQL. See [NAMECHEAP_DEPLOY.md](NAMECHEAP_DEPLOY.md). Before deploying, update the cPanel username and paths in `.cpanel.yml` and the domain in `frontend/.env.production`.

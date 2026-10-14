# Deploying Takers Club to Namecheap (cPanel)

> Domain: `takersclub.store` (frontend) and `api.takersclub.store` (backend API).

Target layout:
- **Frontend** (static build) → `takersclub.store`, served from `public_html`
- **Backend** (Node/Express via Passenger) → `api.takersclub.store`
- **Database** → cPanel MySQL

Do these in order — later steps depend on earlier ones.

---

## 1. Point the domain at Namecheap hosting

Skip this if `takersclub.store` was already registered through Namecheap and the hosting was bought under the same account (it's usually pre-wired).

- cPanel home page → top right shows your **Shared IP**.
- In Namecheap **Domain List → Manage → Nameservers**, set to Namecheap's default (`Namecheap BasicDNS`) if not already, and add/confirm:
  - `A` record: `@` → shared IP
  - `A` record: `www` → shared IP
- DNS propagation can take a few hours. You can proceed with the steps below in the meantime.

## 2. Create the `api` subdomain

cPanel → **Domains** → **Create A New Domain**:
- Domain: `api.takersclub.store`
- Uncheck "Share document root" — give it its own folder, e.g. `/home/<user>/api.takersclub.store`

## 3. Database

cPanel → **MySQL® Database Wizard**:
1. Create database, suffix `takers_club` → full name will be `<cpaneluser>_takers_club`.
2. Create a user with a strong password → full name `<cpaneluser>_<something>`.
3. Add user to database with **ALL PRIVILEGES**.

Import the schema — cPanel → **phpMyAdmin**:
1. Select the new database in the left sidebar.
2. **Import** tab → choose `backend/schema.sql` from this repo → Go.
   (The `CREATE DATABASE`/`USE` lines are already commented out in that file — cPanel DB users can't run those, and you've already selected the DB.)
3. Optional: import `backend/seed-demo-products.sql` the same way to load the 7 demo products (placeholder prices — edit in Admin before launch). Upload `backend/uploads/seed-*.webp` along with the code so their images resolve.

## 4. Backend — Node.js App (Passenger)

cPanel → **Setup Node.js App** → **Create Application**:
- Node.js version: latest available 18.x or 20.x
- Application mode: **Production**
- Application root: `api.takersclub.store` (or a separate folder like `takersclub-api`, doesn't have to match the subdomain's docroot)
- Application URL: `api.takersclub.store`
- Application startup file: `server.js`
- Click **Create**

Get the code onto the server. Easiest path is a GitHub repo for this project (create one, e.g. `takers-club`):
- cPanel → **Git™ Version Control** → **Create**:
  - Clone URL: `https://github.com/<your-account>/takers-club.git`
  - Repository path: same folder you set as the Node app's application root
- After cloning, cPanel's file structure will have `backend/` and `frontend/` at the repo root — but the Node.js App was pointed at the app root itself, not `backend/`. **Set the Node app's "Application root" to `<repo-folder>/backend`** (edit the app in Setup Node.js App and update the path), so Passenger runs `backend/server.js` directly.

Back in **Setup Node.js App**, open the app and:
- **Environment variables** — add every key from `backend/.env.example`, filled in with real production values (DB creds from step 3, JWT secret — generate a long random string, Paystack **live** secret key, SMTP creds, etc). Do **not** upload a `.env` file — cPanel injects these directly into `process.env`, which is what `server.js`/`dotenv` already expects.
- Click **Run NPM Install** (installs `node_modules` fresh on the server's architecture — required for native deps like `sharp` and `bcryptjs`, don't copy `node_modules` from your machine).
- Click **Restart**.
- Create the store owner's admin login (there is no public sign-up): cPanel → **Terminal**, activate the Node app's environment (the command is shown at the top of the Setup Node.js App page), then from `backend/` run
  `node scripts/create-admin.js owner@takersclub.store "a-strong-password" "First" "Last"`

Check `backend/uploads/` exists and is writable inside the app root (it's where product/hero images land — persists across restarts since it's just a folder on disk, but back it up periodically).

Sanity check: visit `https://api.takersclub.store/api/health` → should return `{"status":"ok","env":"production"}`.

## 5. Frontend — static build

Build locally (or in a GitHub Action) with the production API URL baked in:
```bash
cd frontend
npm install
npm run build      # reads frontend/.env.production → VITE_API_URL=https://api.takersclub.store/api
```
This produces `frontend/dist/`, including the `.htaccess` (SPA rewrite + asset caching) copied in from `frontend/public/`.

Upload the **contents** of `dist/` (not the folder itself) into `public_html` on the server — cPanel **File Manager** → upload a zip of `dist/*` → extract into `public_html`, or use an FTP client pointed at the account.

Sanity check: visit `https://takersclub.store` → site loads, and browser devtools Network tab shows API calls going to `api.takersclub.store`.

## 6. SSL

cPanel → **SSL/TLS Status** → select both `takersclub.store` and `api.takersclub.store` → **Run AutoSSL**. Free Let's Encrypt certs, auto-renewing.

## 7. Paystack dashboard

Paystack dashboard → Settings → API Keys & Webhooks:
- Switch to **live** keys once ready to accept real payments (set `PAYSTACK_SECRET_KEY` in the Node app's env vars).
- Webhook URL → `https://api.takersclub.store/api/payment/webhook`

## 8. Email

If using Namecheap Private Email instead of Gmail: cPanel → **Email Accounts** → create e.g. `orders@takersclub.store`, then set `SMTP_USER`/`SMTP_PASS`/`SMTP_FROM` in the Node app's env vars (`SMTP_HOST=mail.takersclub.store` is already the default in `.env.example`).

## 9. Smoke test checklist

- [ ] `https://api.takersclub.store/api/health` returns ok
- [ ] Homepage loads at `https://takersclub.store`, images/video load
- [ ] Admin login works at `/admin/login` (shoppers have no login — guest checkout only)
- [ ] Add to cart → checkout → Paystack test card `4084084084084081` completes → order shows as paid
- [ ] Order receipt + admin alert emails arrive
- [ ] `/admin` dashboard loads, product/image upload works (writes to `backend/uploads`)
- [ ] Deep-link refresh (e.g. reload on `/shop/hoodies`) doesn't 404 — confirms `.htaccess` rewrite is active

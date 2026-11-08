# Copilot instructions for Takers Club

## Project architecture
- Frontend: Vite + React + TypeScript in `frontend/`
- Backend: Express + Node.js API in `backend/`
- Static deployment: frontend build is published to `public_html` on Namecheap
- Node app deployment: backend runs as a Node.js App on Namecheap and serves the API at the `api` subdomain
- Database: MySQL

## Local workflow
1. Start the backend from `backend/`:
   - `npm install`
   - `PORT=3001 node server.js`
2. Start the frontend from `frontend/`:
   - `npm install`
   - `npm run dev -- --host 0.0.0.0`
3. Frontend proxy uses `http://localhost:3001` for `/api` and `/uploads`

## Production deployment
- Backend is deployed as a Namecheap Node.js App and uses environment variables from the hosting panel.
- Frontend is built with Vite and uploaded to `public_html`.
- `API_BASE_URL` / `VITE_API_URL` should point to `https://api.takersclub.store/api` in production.
- Keep the `backend/uploads` directory writable and backed up periodically.

## Important conventions
- Do not call `app.listen()` in production code; Passenger manages Node app lifecycle.
- Use `PORT` only for local development.
- Keep the API and static frontend separate; all production API calls should go to the API subdomain.
- Maintain guest-checkout-only storefront behavior unless specifically asked to change it.

#!/bin/bash
# Takers Club — production deploy, run from cPanel Terminal:
#
#   cd ~/takersclub-api && git pull origin main && bash deploy.sh
#
# Installs backend + frontend packages (incremental after the first run),
# builds the storefront into public_html, and restarts the API.
set -euo pipefail

APP_DIR="$HOME/takersclub-api"
PUBLIC_DIR="$HOME/public_html"
NODE_DIR=/opt/alt/alt-nodejs20/root/usr/bin

# Node 20 on PATH, so packages whose install scripts call plain "node"
# (e.g. @tailwindcss/oxide) can find it.
export PATH="$NODE_DIR:$PATH"

echo "==> Backend: installing packages"
# Use the Node.js app's own environment so packages land in the venv that
# cPanel symlinks to backend/node_modules.
VENV_ACTIVATE=$(ls -d "$HOME"/nodevenv/takersclub-api/backend/*/bin/activate | head -n 1)
(
  set +u  # the activate script references unset variables
  source "$VENV_ACTIVATE"
  cd "$APP_DIR/backend"
  npm install --omit=dev --no-audit --no-fund
)

echo "==> Frontend: installing packages"
cd "$APP_DIR/frontend"
"$NODE_DIR/npm" install --no-audit --no-fund

echo "==> Frontend: building (API: $(grep VITE_API_URL .env.production | cut -d= -f2))"
"$NODE_DIR/npm" run build

echo "==> Publishing to $PUBLIC_DIR"
cp -r dist/. "$PUBLIC_DIR/"

echo "==> Restarting API"
mkdir -p "$APP_DIR/backend/tmp"
touch "$APP_DIR/backend/tmp/restart.txt"

echo "==> Done. Live at https://takersclub.store"

#!/usr/bin/env bash
# Profiles (Ledgerline) — one-time VPS bootstrap (Ubuntu, shared Bluehost box).
#
# Sets up infra ONLY (docker, nginx, certbot, repo, .env, TLS). It does NOT build
# images on the box — that browns out the VPS. After this, run `bash deploy/ship.sh`
# from your dev machine to build off-box, ship, and start the stack.
#
# Stack (prod, no staging on the VPS — RAM/disk is tight):
#   web (Next.js)  -> 127.0.0.1:8900
#   api (FastAPI)  -> 127.0.0.1:8901   (also serves /api/health and /api/media)
#   db  (Postgres) -> internal only (compose network)
# nginx routes  /api -> :8901  and  / -> :8900  for $DOMAIN, with Let's Encrypt TLS.
#
# Usage (on the VPS, as root):  bash /opt/profiles/deploy/install-vps.sh profiles.wetreadwell.com
# Safe to re-run: clones-or-pulls, keeps an existing .env, only adds OUR nginx site.
set -euo pipefail

DOMAIN="${1:-profiles.wetreadwell.com}"
REPO_URL="https://github.com/HDLC01/Profiles.git"
APP_DIR="/opt/profiles"
SITE="profiles"

echo "==============================================================="
echo " Profiles (Ledgerline) — bootstrapping $DOMAIN"
echo "==============================================================="

echo "[1/5] Ensuring git, nginx, certbot, ufw, docker..."
apt-get update -y
apt-get install -y ca-certificates curl git nginx certbot python3-certbot-nginx ufw
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
fi

echo "[2/5] Firewall (ufw allow 22/80/443)..."
ufw allow 22/tcp || true; ufw allow 80/tcp || true; ufw allow 443/tcp || true; ufw --force enable || true

echo "[3/5] Sync repo at $APP_DIR..."
if [[ -d "$APP_DIR/.git" ]]; then cd "$APP_DIR" && git pull --ff-only; else git clone "$REPO_URL" "$APP_DIR" && cd "$APP_DIR"; fi

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "[4/5] Creating .env template — FILL IT IN, then run deploy/ship.sh from your dev machine..."
  cat > "$APP_DIR/.env" <<'EOF'
# Profiles (Ledgerline) — production env (root level; consumed by docker-compose)
POSTGRES_DB=profiles
POSTGRES_USER=profiles
POSTGRES_PASSWORD=
ADMIN_EMAILS=hanz@wetreadwell.com,kyle@wetreadwell.com
ASSESS_BASE_URL=https://assess.wetreadwell.com
MEDIA_ROOT=/app/media

# Clerk (same value for both; publishable is public, secret is server-only).
# For real prod, create a Clerk PRODUCTION instance; a dev instance also works.
CLERK_PUBLISHABLE_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Booking (optional)
NEXT_PUBLIC_CALENDLY_URL=
EOF
  echo "  >>> Edit $APP_DIR/.env (POSTGRES_PASSWORD + CLERK_* keys), then run deploy/ship.sh."
else
  echo "[4/5] .env exists, keeping it"
fi

echo "[5/5] nginx reverse proxy for $DOMAIN (+ TLS)..."
cat > "/etc/nginx/sites-available/$SITE" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ { root /var/www/html; }

    # API + media -> FastAPI container
    location /api/ {
        proxy_pass http://127.0.0.1:8901;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        client_max_body_size 60M;   # candidate photo / intro-video uploads
    }

    # Everything else -> Next.js web container
    location / {
        proxy_pass http://127.0.0.1:8900;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
ln -sf "/etc/nginx/sites-available/$SITE" "/etc/nginx/sites-enabled/$SITE"
nginx -t && systemctl reload nginx
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m hanz@wetreadwell.com --redirect || echo "  (certbot will succeed once DNS for $DOMAIN points here)"
systemctl reload nginx

echo ""
echo "==============================================================="
echo " ✓ Bootstrap done for $DOMAIN"
echo "   Next: fill $APP_DIR/.env, then run  bash deploy/ship.sh  from your dev machine."
echo "==============================================================="

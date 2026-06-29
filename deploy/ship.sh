#!/usr/bin/env bash
# Off-box deploy for Profiles (Ledgerline / Cloud Accountant Staffing).
#
# WHY off-box: the VPS is a single core / 2 GB box shared with ~13 other
# containers. Building images ON it browns out every site. So we build HERE,
# ship the images over SSH, and the VPS only loads + restarts (no build).
#
# Prereqs: local Docker running; SSH key at ~/.ssh/treadwell_vps; the VPS already
# bootstrapped once via deploy/install-vps.sh (repo at /opt/profiles + .env + nginx).
# Usage:   bash deploy/ship.sh
set -euo pipefail

VPS_HOST="${VPS_HOST:-50.6.110.215}"
VPS_USER="${VPS_USER:-root}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/treadwell_vps}"
APP_DIR="/opt/profiles"
SSH=(ssh -i "$SSH_KEY" -o ConnectTimeout=20 "${VPS_USER}@${VPS_HOST}")

cd "$(dirname "$0")/.."

# The Clerk PUBLISHABLE key is public and is inlined into the web bundle at build
# time, so it must be passed as a build arg. Read it from .env if not exported.
PK="${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-$(grep -m1 '^CLERK_PUBLISHABLE_KEY=' .env 2>/dev/null | cut -d= -f2-)}"
if [[ -z "$PK" ]]; then echo "!! NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_PUBLISHABLE_KEY not set"; exit 1; fi

echo "==> Building images locally (linux/amd64) — off the prod box…"
docker build --platform linux/amd64 -t profiles-api:latest ./backend
docker build --platform linux/amd64 --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$PK" -t profiles-web:latest ./frontend

echo "==> Saving + shipping images over SSH…"
docker save profiles-web:latest profiles-api:latest \
  | gzip \
  | "${SSH[@]}" "cat > /tmp/profiles-images.tar.gz"

echo "==> Loading images + restarting prod stack (NO on-box build)…"
"${SSH[@]}" "set -euo pipefail
  cd $APP_DIR
  git pull --ff-only
  gunzip -c /tmp/profiles-images.tar.gz | docker load
  rm -f /tmp/profiles-images.tar.gz
  docker compose --profile full up -d
  for i in \$(seq 1 24); do
    if curl -fsS http://localhost:8901/api/health >/dev/null; then echo '   api healthy'; exit 0; fi
    sleep 5
  done
  echo '   post-deploy healthcheck failed'; exit 1
"
echo "==> Done — profiles.wetreadwell.com is on the freshly-shipped image."

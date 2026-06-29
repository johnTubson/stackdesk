#!/usr/bin/env bash
# Build and start StackDesk on the Oracle VM.
# Run from the repo root after creating .env.production:
#   cp .env.production.example .env.production
#   # edit SESSION_SECRET
#   bash scripts/oracle/deploy.sh
#
# With HTTPS (domain required):
#   bash scripts/oracle/deploy.sh --https

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="docker-compose.prod.yml"
COMPOSE_ARGS=(-f "$COMPOSE_FILE")

if [[ ! -f .env.production ]]; then
  echo "Missing .env.production — copy .env.production.example and set SESSION_SECRET."
  exit 1
fi

if [[ "${1:-}" == "--https" ]]; then
  if ! grep -q '^DOMAIN=' .env.production; then
    echo "Set DOMAIN=your.domain.com in .env.production for HTTPS."
    exit 1
  fi
  COMPOSE_ARGS+=(--profile https)
  echo "==> Deploying with Caddy HTTPS..."
else
  echo "==> Deploying on port 3000 (HTTP)..."
fi

docker compose "${COMPOSE_ARGS[@]}" up -d --build

echo ""
echo "StackDesk is running."
if [[ "${1:-}" == "--https" ]]; then
  DOMAIN="$(grep '^DOMAIN=' .env.production | cut -d= -f2-)"
  echo "  https://${DOMAIN}"
else
  echo "  http://<your-vm-public-ip>:3000"
fi
echo ""
echo "Demo login: admin@stackdesk.demo / demo1234"

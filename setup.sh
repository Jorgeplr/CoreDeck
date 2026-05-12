#!/usr/bin/env bash
set -euo pipefail

# ─── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}  →${NC} $*"; }
success() { echo -e "${GREEN}  ✓${NC} $*"; }
warn()    { echo -e "${YELLOW}  !${NC} $*"; }
error()   { echo -e "${RED}  ✗${NC} $*"; exit 1; }
header()  { echo -e "\n${BOLD}${CYAN}$*${NC}"; }

# ─── Banner ────────────────────────────────────────────────────────────────────
echo -e "${BOLD}"
echo "  ╔═══════════════════════════════╗"
echo "  ║       CoreDesk  Setup         ║"
echo "  ╚═══════════════════════════════╝"
echo -e "${NC}"

# ─── 1. Check dependencies ─────────────────────────────────────────────────────
header "1/6  Checking dependencies"

command -v docker  >/dev/null 2>&1 || error "docker not found — install Docker Desktop first"
command -v bun     >/dev/null 2>&1 || error "bun not found — install from https://bun.sh"

success "docker $(docker --version | awk '{print $3}' | tr -d ',')"
success "bun    $(bun --version)"

# ─── 2. Environment files ──────────────────────────────────────────────────────
header "2/6  Environment files"

if [ ! -f packages/api/.env ]; then
  cp packages/api/.env.example packages/api/.env
  # Fix the DB ports to match docker-compose (3308 + 3309)
  if command -v sed >/dev/null 2>&1; then
    sed -i.bak \
      's|localhost:3306/coredesk"|localhost:3308/coredesk"|g' \
      packages/api/.env
    sed -i.bak \
      's|localhost:3307/coredesk_shadow"|localhost:3309/coredesk_shadow"|g' \
      packages/api/.env && rm -f packages/api/.env.bak
  fi
  warn "Created packages/api/.env from example — edit SMTP_PASS if you want emails"
else
  success "packages/api/.env already exists"
fi

if [ ! -f packages/app/.env ]; then
  cp packages/app/.env.example packages/app/.env 2>/dev/null || \
    echo 'VITE_API_URL=http://localhost:3001' > packages/app/.env
  success "Created packages/app/.env"
else
  success "packages/app/.env already exists"
fi

# ─── 3. Docker containers ──────────────────────────────────────────────────────
header "3/6  Starting Docker containers"

docker compose up -d
success "Containers started (mysql :3308, mysql_shadow :3309)"

# ─── 4. Wait for MySQL ─────────────────────────────────────────────────────────
header "4/6  Waiting for MySQL to be ready"

MAX=40; WAITED=0
info "Polling coredesk_mysql health (up to ${MAX}s)..."
until docker exec coredesk_mysql mysqladmin ping -h localhost --silent 2>/dev/null; do
  WAITED=$((WAITED + 1))
  [ "$WAITED" -ge "$MAX" ] && error "MySQL did not become healthy in ${MAX}s"
  printf "."
  sleep 1
done
echo ""
success "MySQL is healthy (${WAITED}s)"

# ─── 5. Install dependencies ───────────────────────────────────────────────────
header "5/6  Installing dependencies"

info "packages/api..."
(cd packages/api && bun install --frozen-lockfile 2>/dev/null || bun install)
success "API dependencies installed"

info "packages/app..."
(cd packages/app && bun install --frozen-lockfile 2>/dev/null || bun install)
success "App dependencies installed"

# ─── 6. Database: push schema + seed ──────────────────────────────────────────
header "6/6  Database"

info "Pushing schema (prisma db push)..."
(cd packages/api && bunx prisma db push --accept-data-loss --skip-generate 2>&1 | tail -5)
success "Schema synced"

info "Generating Prisma client..."
(cd packages/api && bunx prisma generate 2>&1 | tail -3)
success "Prisma client generated"

info "Running seed..."
(cd packages/api && bunx prisma db seed)
success "Database seeded"

# ─── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}  ✅  CoreDesk is ready!${NC}"
echo ""
echo -e "  ${BOLD}Start dev servers (two terminals):${NC}"
echo -e "    ${CYAN}cd packages/api && bun dev${NC}   →  API on http://localhost:3001"
echo -e "    ${CYAN}cd packages/app && bun dev${NC}   →  App on http://localhost:5174"
echo ""
echo -e "  ${BOLD}Test accounts:${NC}"
echo -e "    admin@coredesk.app   ${YELLOW}CoreDesk@2024!${NC}  (Owner)"
echo -e "    jorge@coredesk.app   ${YELLOW}Test@1234!${NC}      (Admin)"
echo -e "    ana@coredesk.app     ${YELLOW}Test@1234!${NC}      (Member)"
echo -e "    dev@coredesk.app     ${YELLOW}Test@1234!${NC}      (Viewer)"
echo ""
echo -e "  ${BOLD}Group:${NC} CoreDesk Dev  •  Invite code: ${YELLOW}DEVTEAM${NC}"
echo ""

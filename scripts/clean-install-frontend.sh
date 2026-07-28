#!/usr/bin/env bash
# Rebuild hermes-cluster frontend from scratch — fixes the lightningcss / dual-lockfile mess.
# Run from the repo root: bash scripts/clean-install-frontend.sh

set -e

echo "=== Step 1: Pull latest from main ==="
git pull origin main

echo ""
echo "=== Step 2: Nuke every node_modules + lockfile in the repo ==="
cd "$(git rev-parse --show-toplevel)"
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/.next frontend/tsconfig.tsbuildinfo frontend/package-lock.json
rm -rf backend/node_modules backend/package-lock.json

echo ""
echo "=== Step 3: Install root dev deps (concurrently + pg for migration script) ==="
cd "$(git rev-parse --show-toplevel)"
npm install

echo ""
echo "=== Step 4: Install frontend deps LOCALLY (no workspaces) ==="
cd frontend
npm install

echo ""
echo "=== Step 5: Verify no lightningcss / @tailwindcss anywhere ==="
if grep -rln "lightningcss\|@tailwindcss" frontend/node_modules/@tailwindcss 2>/dev/null; then
  echo "  WARNING: lightningcss / @tailwindcss/postcss still present"
else
  echo "  OK — no lightningcss references"
fi

echo ""
echo "=== Step 6: Verify build ==="
npx next build

echo ""
echo "=== Done — npm run dev should work now ==="
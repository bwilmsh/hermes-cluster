#!/usr/bin/env bash
# Rebuild hermes-cluster frontend from scratch — fixes the lightningcss / dual-lockfile mess.
# Run from the repo root: bash scripts/clean-install-frontend.sh
#
# This script nukes ALL node_modules and lockfiles, then reinstalls from scratch.
# It's the nuclear option for fixing:
#   - lightningcss native binary errors (leftover from Tailwind v4)
#   - dual-lockfile confusion (root workspaces hoisting deps wrong)
#   - stale @tailwindcss/postcss references
#
# After running this, `npm run dev` should work cleanly.

set -e

echo "=== Step 1: Pull latest from main ==="
git pull origin main

echo ""
echo "=== Step 2: Nuke EVERY node_modules + lockfile + build cache ==="
cd "$(git rev-parse --show-toplevel)"
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/.next frontend/tsconfig.tsbuildinfo frontend/package-lock.json
rm -rf backend/node_modules backend/package-lock.json

echo ""
echo "=== Step 3: Nuke any stale PostCSS config (Tailwind v4 used .mjs) ==="
rm -f frontend/postcss.config.mjs frontend/postcss.config.ts
# Confirm the correct postcss.config.js exists
if [ ! -f frontend/postcss.config.js ]; then
  echo '  Creating frontend/postcss.config.js (Tailwind v3 + autoprefixer)'
  cat > frontend/postcss.config.js <<'PCONFIG'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
PCONFIG
fi

echo ""
echo "=== Step 4: Install root dev deps (concurrently + pg for migration script) ==="
cd "$(git rev-parse --show-toplevel)"
npm install

echo ""
echo "=== Step 5: Install frontend deps LOCALLY (no workspaces) ==="
cd frontend
npm install --legacy-peer-deps

echo ""
echo "=== Step 6: Verify no lightningcss / @tailwindcss/postcss anywhere ==="
if [ -d node_modules/@tailwindcss/postcss ] || [ -d node_modules/lightningcss ]; then
  echo "  WARNING: lightningcss / @tailwindcss/postcss still present — removing"
  rm -rf node_modules/@tailwindcss/postcss node_modules/lightningcss
  # Rebuild tailwindcss to ensure v3 is intact
  npm install tailwindcss@3 --legacy-peer-deps
else
  echo "  OK — no lightningcss references"
fi

echo ""
echo "=== Step 7: Verify build ==="
npx next build

echo ""
echo "=== Done — npm run dev should work now ==="
echo ""
echo "If you still see lightningcss errors, run:"
echo "  rm -rf node_modules package-lock.json frontend/node_modules frontend/.next"
echo "  cd frontend && npm install --legacy-peer-deps"

#!/usr/bin/env bash
# PARBAUGHS deploy script (Goal 2 A12 Operational — deploy automation).
#
# Usage:
#   ./scripts/deploy.sh --dry-run        # validation pass, no deploy
#   ./scripts/deploy.sh --pages          # GitHub Pages only (no Cloud Functions)
#   ./scripts/deploy.sh --functions      # Cloud Functions only (AMD-018 gate 1)
#   ./scripts/deploy.sh --rules          # Firestore rules only (AMD-018 gate 2)
#
# AMD-018 gates this script BLOCKS — the agent runs --dry-run as far as possible
# but actual `firebase deploy` requires Founder pre-authorization in
# task-queue/founder/. This script enforces that by reading FOUNDER_AUTH_TS
# from env and aborting if absent.

set -euo pipefail

cd "$(dirname "$0")/.."

DRY_RUN=0
TARGET_PAGES=0
TARGET_FUNCTIONS=0
TARGET_RULES=0
VERSION=""
PROJECT="production"  # default; --target=staging selects parbaughs-staging

for arg in "$@"; do
  case "$arg" in
    --dry-run)         DRY_RUN=1 ;;
    --pages)           TARGET_PAGES=1 ;;
    --functions)       TARGET_FUNCTIONS=1 ;;
    --rules)           TARGET_RULES=1 ;;
    --version=*)       VERSION="${arg#*=}" ;;
    --target=staging)  PROJECT="staging" ;;
    --target=production) PROJECT="production" ;;
    *)
      echo "Unknown arg: $arg"
      exit 2
      ;;
  esac
done

echo "Deploy target: $PROJECT"

if [ "$TARGET_PAGES" = "0" ] && [ "$TARGET_FUNCTIONS" = "0" ] && [ "$TARGET_RULES" = "0" ]; then
  echo "Pick at least one target: --pages --functions --rules"
  exit 2
fi

# ------------------------------------------------------------
# Pre-deploy validation
# ------------------------------------------------------------

echo "==== PRE-DEPLOY VALIDATION ===="

echo "Working tree clean?"
if ! git diff --quiet HEAD; then
  echo "  FAIL: working tree dirty. Commit or stash before deploy."
  exit 3
fi
echo "  OK"

echo "On main branch?"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "  FAIL: on $BRANCH, not main. Deploys must happen from main."
  exit 3
fi
echo "  OK ($BRANCH)"

echo "Lint passes?"
if ! npm run lint --silent 2>&1 | tail -5; then
  echo "  FAIL: lint has errors (warnings OK). Fix before deploy."
  exit 3
fi
echo "  OK"

echo "Unit tests pass?"
if ! npm run test:unit --silent; then
  echo "  FAIL: unit tests broken. Fix before deploy."
  exit 3
fi
echo "  OK"

echo "Bundle build clean?"
if ! npm run build --silent; then
  echo "  FAIL: build broken."
  exit 3
fi
echo "  OK"

echo "Bundle scan finds no secrets?"
if ! npm run bundle:scan --silent; then
  echo "  FAIL: bundle scan found CRITICAL/HIGH findings. Review and fix."
  exit 3
fi
echo "  OK"

# Smoke test (fast subset).
echo "Smoke tests pass?"
if ! npm run smoke --silent; then
  echo "  FAIL: smoke tests failing. Fix or document override in task-queue/founder/."
  exit 3
fi
echo "  OK"

# Snapshot deploy version + timestamp.
DEPLOY_TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
PKG_VERSION=$(node -p "require('./package.json').version")
COMMIT_SHA=$(git rev-parse HEAD)

mkdir -p .claude/state/deploys
DEPLOY_LOG=".claude/state/deploys/${DEPLOY_TS//[:.]/-}.json"
cat > "$DEPLOY_LOG" <<EOF
{
  "timestamp": "$DEPLOY_TS",
  "version": "${VERSION:-$PKG_VERSION}",
  "commit": "$COMMIT_SHA",
  "targets": {
    "pages": $([ "$TARGET_PAGES" = "1" ] && echo true || echo false),
    "functions": $([ "$TARGET_FUNCTIONS" = "1" ] && echo true || echo false),
    "rules": $([ "$TARGET_RULES" = "1" ] && echo true || echo false)
  },
  "dry_run": $([ "$DRY_RUN" = "1" ] && echo true || echo false),
  "status": "pre-deploy-OK"
}
EOF

# ------------------------------------------------------------
# AMD-018 gate enforcement
# ------------------------------------------------------------

if [ "$DRY_RUN" = "0" ]; then
  if [ "$TARGET_FUNCTIONS" = "1" ] || [ "$TARGET_RULES" = "1" ]; then
    if [ -z "${FOUNDER_AUTH_TS:-}" ]; then
      echo ""
      echo "AMD-018 BLOCK: Cloud Functions and Firestore rules deploys require"
      echo "Founder pre-authorization. Set FOUNDER_AUTH_TS env var to proceed."
      echo "(See task-queue/founder/ for the authorization file pattern.)"
      exit 4
    fi
    echo "FOUNDER_AUTH_TS=$FOUNDER_AUTH_TS accepted"
  fi
fi

# ------------------------------------------------------------
# Execute deploy (or dry-run)
# ------------------------------------------------------------

if [ "$DRY_RUN" = "1" ]; then
  echo ""
  echo "==== DRY RUN COMPLETE ===="
  echo "All validation passed. To actually deploy, re-run without --dry-run."
  echo "Log: $DEPLOY_LOG"
  exit 0
fi

if [ "$TARGET_PAGES" = "1" ]; then
  echo ""
  echo "==== DEPLOY: GitHub Pages ===="
  # vite build already done above; push dist/ to gh-pages branch via standard flow
  # (this assumes existing gh-pages workflow handles the actual publish)
  git push origin main
  echo "  Pushed to origin/main; GitHub Action will publish to gh-pages."
fi

if [ "$TARGET_FUNCTIONS" = "1" ]; then
  echo ""
  echo "==== DEPLOY: Cloud Functions ===="
  firebase deploy --only functions
fi

if [ "$TARGET_RULES" = "1" ]; then
  echo ""
  echo "==== DEPLOY: Firestore rules ===="
  firebase deploy --only firestore:rules
fi

# Update deploy log with success.
python -c "
import json
d = json.load(open('$DEPLOY_LOG'))
d['status'] = 'deployed'
d['completed_at'] = '$(date -u +%Y-%m-%dT%H:%M:%SZ)'
json.dump(d, open('$DEPLOY_LOG', 'w'), indent=2)
"

echo ""
echo "==== DEPLOY COMPLETE ===="
echo "Log: $DEPLOY_LOG"
echo "Caddy Notes reminder: update src/pages/caddynotes.js with member-visible changes."

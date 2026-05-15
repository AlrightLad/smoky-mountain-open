#!/usr/bin/env bash
# scaffold-from-templates.sh — bootstrap docs/reports/ from tracked templates.
#
# R2 remediation (2026-05-15): the dashboard regen pipeline depends on
# pre-existing HTML scaffolds at docs/reports/*.html. Those scaffolds were
# gitignored per Founder directive (local-only dashboards) but had no
# durable source — when on-disk files vanished, regen could not bootstrap.
#
# This script copies tracked templates/dashboards/*.template.html →
# docs/reports/*.html (and the same for _assets/). Idempotent by design:
# files that already exist are NOT overwritten. To force re-scaffold,
# pass --force.
#
# Wired into regen-all.{sh,ps1} before any regen step.
#
# Exit codes:
#   0  scaffolded what was needed (or nothing was needed)
#   1  templates directory missing or unreadable
#   2  destination not writable

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATES="$REPO_ROOT/templates/dashboards"
DEST="$REPO_ROOT/docs/reports"

FORCE=0
for arg in "$@"; do
    case "$arg" in
        --force) FORCE=1 ;;
        --help|-h)
            sed -n '2,20p' "${BASH_SOURCE[0]}"
            exit 0
            ;;
    esac
done

if [ ! -d "$TEMPLATES" ]; then
    echo "[scaffold-from-templates] FAIL templates directory missing: $TEMPLATES" >&2
    echo "[scaffold-from-templates]      run from repo root or check git status" >&2
    exit 1
fi

mkdir -p "$DEST"

SCAFFOLDED=0
SKIPPED=0

# Copy each *.template.html → corresponding *.html in DEST.
for template in "$TEMPLATES"/*.template.html; do
    [ -f "$template" ] || continue
    fname="$(basename "$template" .template.html).html"
    dest_file="$DEST/$fname"
    if [ -f "$dest_file" ] && [ "$FORCE" -eq 0 ]; then
        SKIPPED=$((SKIPPED + 1))
        continue
    fi
    cp "$template" "$dest_file"
    SCAFFOLDED=$((SCAFFOLDED + 1))
    echo "[scaffold-from-templates] scaffolded $fname"
done

# Mirror _assets/ — required by every dashboard HTML.
if [ -d "$TEMPLATES/_assets" ]; then
    if [ ! -d "$DEST/_assets" ] || [ "$FORCE" -eq 1 ]; then
        mkdir -p "$DEST/_assets"
        cp -r "$TEMPLATES/_assets/." "$DEST/_assets/"
        echo "[scaffold-from-templates] scaffolded _assets/"
        SCAFFOLDED=$((SCAFFOLDED + 1))
    else
        SKIPPED=$((SKIPPED + 1))
    fi
fi

echo "[scaffold-from-templates] done: scaffolded=$SCAFFOLDED skipped=$SKIPPED"
exit 0

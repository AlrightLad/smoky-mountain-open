#!/usr/bin/env bash
# Hook 13 (ECC GAP-FILL, Founder-approved 2026-05-21) — design-quality edit-time check.
#
# Adopts ECC's design-quality-check pattern, scoped to PARBAUGHS:
#   - Fires after Edit/Write on .css / .html / .jsx / .tsx / .vue / .svelte
#   - Scans for AI-generated-template markers + nudges toward P7 9.5/10 bar
#   - WARN only — non-blocking
#
# Patterns flagged (calibrated for PARBAUGHS Clubhouse tokens):
#   - Generic "Get Started" / "Learn More" copy (when not in legitimate landing context)
#   - bg-blue-{500,600,700} / text-gray-{500,600,700} (Tailwind tokens — we use Clubhouse)
#   - Generic centered hero with "Welcome to" headline
#   - Default Inter / Roboto / system-ui without explicit token reference
#
# Why: AI tooling defaults to generic visual patterns. Surface them at edit time
# so the agent can recalibrate vs Clubhouse + P7 reference set.

set -euo pipefail

source "$(dirname "$0")/lib/parse-payload.sh"

file="$(parse_payload '.tool_input.file_path')"
[[ -z "$file" ]] && exit 0

normalized="${file//\\//}"

case "$normalized" in
    *.css|*.html|*.jsx|*.tsx|*.vue|*.svelte|*.scss) ;;
    *) exit 0 ;;
esac

case "$normalized" in
    */node_modules/*|*/dist/*|*/build/*) exit 0 ;;
    */.claude/*|*/docs/reports/*) exit 0 ;;  # generated dashboards, not member-facing
esac

if [[ "$file" == /* ]] || [[ "$file" == [A-Z]:* ]]; then
    abs_file="$file"
else
    abs_file="$(pwd)/$file"
fi
[[ ! -f "$abs_file" ]] && exit 0

warnings=()

# 1. Tailwind-stock colors (we use Clubhouse tokens, not Tailwind defaults)
matches=$(grep -nE '(bg|text|border)-(blue|red|green|yellow|gray|slate|zinc)-(400|500|600|700)' "$abs_file" | head -3) || true
if [ -n "$matches" ]; then
    warnings+=("Tailwind-default color tokens detected (PARBAUGHS uses Clubhouse --pb-* tokens):")
    while IFS= read -r line; do warnings+=("  $line"); done <<< "$matches"
fi

# 2. Generic AI-template copy
matches=$(grep -nE '\b(Get Started|Learn More|Click Here|Welcome to)\b' "$abs_file" | head -2) || true
if [ -n "$matches" ]; then
    warnings+=("Generic AI-template copy detected (rewrite with PARBAUGHS voice - see docs/CADDY_NOTES_STYLE.md):")
    while IFS= read -r line; do warnings+=("  $line"); done <<< "$matches"
fi

# 3. Default font without explicit token
matches=$(grep -nE 'font-family:\s*(Inter|Roboto|system-ui|-apple-system|sans-serif)' "$abs_file" | grep -v 'var(--font-' | head -2) || true
if [ -n "$matches" ]; then
    warnings+=("Default font-family without token reference (use var(--font-display|body|mono)):")
    while IFS= read -r line; do warnings+=("  $line"); done <<< "$matches"
fi

# 4. Hardcoded #000 / #fff (CLAUDE.md ban: 'No hardcoded colors except Visual Reference')
matches=$(grep -nE '#000(000)?\b|#fff(fff)?\b' "$abs_file" | grep -v 'rgba\|--accent' | head -2) || true
if [ -n "$matches" ]; then
    warnings+=("Hardcoded #000/#fff (CLAUDE.md: use Clubhouse tokens; Visual Reference is the only exception):")
    while IFS= read -r line; do warnings+=("  $line"); done <<< "$matches"
fi

[[ ${#warnings[@]} -eq 0 ]] && exit 0

echo "" >&2
echo "[hook-13 design-quality] $normalized — patterns that drift from P7 9.5/10 bar:" >&2
for w in "${warnings[@]}"; do echo "  $w" >&2; done
echo "  (warning only — ESLint + visual-audit handle the hard gates)" >&2

exit 0

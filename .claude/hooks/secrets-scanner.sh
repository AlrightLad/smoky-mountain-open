#!/usr/bin/env bash
# Hook 7 — Secrets scanner.
# Pattern-matches credentials / API keys / PII in any file write.
# Warn-on-suspicion: prints stderr warning but doesn't block (allows true positives in
# documentation discussing credential patterns, with explicit Founder acknowledgment).

set -euo pipefail

source "$(dirname "$0")/lib/parse-payload.sh"

file="$(parse_payload '.tool_input.file_path')"
content="$(parse_payload '.tool_input.content')"
new_string="$(parse_payload '.tool_input.new_string')"
[[ -z "$file" ]] && exit 0

# Skip if writing to known-safe paths
case "$file" in
  *.md|*.txt) skip_md=1 ;;
  *) skip_md=0 ;;
esac

# Collect payload to scan
payload="${content}${new_string}"
[[ -z "$payload" ]] && exit 0

# Patterns to detect (each line is a regex)
suspicious=0
hits=""

# AWS access key pattern
if echo "$payload" | grep -qE 'AKIA[0-9A-Z]{16}'; then
  suspicious=1
  hits="${hits}\n  - AWS access key pattern (AKIA...)"
fi

# AWS secret access key pattern (40-char base64-like)
if echo "$payload" | grep -qE 'aws_secret_access_key[[:space:]]*[:=][[:space:]]*["'\''][^"'\'']{40}'; then
  suspicious=1
  hits="${hits}\n  - AWS secret access key assignment"
fi

# Google API key pattern (39-char alphanumeric)
if echo "$payload" | grep -qE 'AIza[0-9A-Za-z_-]{35}'; then
  suspicious=1
  hits="${hits}\n  - Google API key pattern (AIza...)"
fi

# Firebase service account JSON markers
if echo "$payload" | grep -qE '"private_key"[[:space:]]*:[[:space:]]*"-----BEGIN PRIVATE KEY-----'; then
  suspicious=1
  hits="${hits}\n  - Firebase service account private key"
fi

# Generic private key markers
if echo "$payload" | grep -qE '-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----'; then
  suspicious=1
  hits="${hits}\n  - PEM-format private key marker"
fi

# Stripe live secret key pattern
if echo "$payload" | grep -qE 'sk_live_[0-9a-zA-Z]{24,}'; then
  suspicious=1
  hits="${hits}\n  - Stripe live secret key (sk_live_)"
fi

# GitHub PAT pattern (modern)
if echo "$payload" | grep -qE 'ghp_[0-9A-Za-z]{36}|github_pat_[0-9A-Za-z_]{82}'; then
  suspicious=1
  hits="${hits}\n  - GitHub personal access token"
fi

# JWT-shaped tokens with suspicious length
if echo "$payload" | grep -qE 'eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}'; then
  suspicious=1
  hits="${hits}\n  - JWT-shaped token (could be a signed credential)"
fi

# Skip warning for .md/.txt where credential PATTERN may be documented (not actual)
if [[ $suspicious -eq 1 && $skip_md -eq 1 ]]; then
  # Print less-severe note for docs context but don't block
  {
    echo ""
    echo "─────────────────────────────────────────────────────────"
    echo "SECRETS SCANNER — pattern match in documentation file"
    echo "─────────────────────────────────────────────────────────"
    echo "  $file"
    echo -e "$hits"
    echo ""
    echo "If documenting a credential pattern intentionally, OK to proceed."
    echo "If this is a real credential accidentally leaking into docs, ABORT."
  } >&2
  exit 0
fi

if [[ $suspicious -eq 1 ]]; then
  {
    echo ""
    echo "─────────────────────────────────────────────────────────"
    echo "SECRETS SCANNER — suspected credential in write payload"
    echo "─────────────────────────────────────────────────────────"
    echo ""
    echo "  $file"
    echo -e "$hits"
    echo ""
    echo "Write blocked. Review payload; if false positive, document and proceed"
    echo "with --no-verify (Founder approval required)."
  } >&2
  exit 2
fi

exit 0

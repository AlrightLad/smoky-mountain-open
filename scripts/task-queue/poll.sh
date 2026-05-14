#!/usr/bin/env bash
# scripts/task-queue/poll.sh
#
# CLI for inter-agent task-queue inspection + lifecycle (AMD-022).
#
# USAGE
#   poll.sh list <agent>          # list queued tasks for agent
#   poll.sh list                  # list all queued tasks across all agents
#   poll.sh show <path>           # render task file with frontmatter parsed
#   poll.sh validate <path>       # validate task-file shape (frontmatter + sections)
#   poll.sh complete <path>       # mark task completed + move to completed/
#   poll.sh reject <path> <reason># mark task rejected + move + write notification
#   poll.sh claim <path>          # set status: in_progress (use before starting work)
#
# Filenames passed to show/validate/complete/reject/claim can be relative
# to .claude/state/task-queue/ or absolute paths.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
QUEUE_ROOT="$REPO_ROOT/.claude/state/task-queue"
KNOWN_AGENTS=(main dashboard main-flows test-qa security founder)

# ── Helpers ──────────────────────────────────────────────────────────────────
die() { echo "ERROR: $*" >&2; exit 1; }

abspath() {
    local p="$1"
    if [[ "$p" = /* ]] || [[ "$p" =~ ^[A-Za-z]: ]]; then
        echo "$p"
    elif [ -e "$QUEUE_ROOT/$p" ]; then
        echo "$QUEUE_ROOT/$p"
    elif [ -e "$REPO_ROOT/$p" ]; then
        echo "$REPO_ROOT/$p"
    elif [ -e "$p" ]; then
        (cd "$(dirname "$p")" && echo "$PWD/$(basename "$p")")
    else
        echo "$p"
    fi
}

parse_field() {
    local file="$1" field="$2"
    awk -v fld="$field" '
        /^---$/ { fm = !fm; next }
        fm && $1 ~ "^"fld":$" { sub("^[^:]*:[[:space:]]*","",$0); print; exit }
    ' "$file"
}

# ── Commands ─────────────────────────────────────────────────────────────────

cmd_list() {
    local agent="${1:-}"
    local dirs=()
    if [ -n "$agent" ]; then
        case " ${KNOWN_AGENTS[*]} " in
            *" $agent "*) dirs=("$QUEUE_ROOT/$agent") ;;
            *) die "unknown agent '$agent'. one of: ${KNOWN_AGENTS[*]}" ;;
        esac
    else
        for a in "${KNOWN_AGENTS[@]}"; do dirs+=("$QUEUE_ROOT/$a"); done
    fi
    local any=0
    for d in "${dirs[@]}"; do
        [ -d "$d" ] || continue
        local agent_name="$(basename "$d")"
        for f in "$d"/*.md; do
            [ "$f" = "$d/*.md" ] && continue
            [ "$(basename "$f")" = "README.md" ] && continue
            any=1
            local id="$(parse_field "$f" task_id)"
            local prio="$(parse_field "$f" priority)"
            local status="$(parse_field "$f" status)"
            local from="$(parse_field "$f" from_agent)"
            printf '  [%-7s] %-9s %-12s %s  (from: %s)\n' \
                "${prio:-?}" "${status:-?}" "$agent_name" "${id:-$(basename "$f")}" "${from:-?}"
        done
    done
    [ "$any" -eq 0 ] && echo "  (queue empty)"
}

cmd_show() {
    local f
    f="$(abspath "${1:?usage: show <path>}")"
    [ -f "$f" ] || die "file not found: $f"
    awk '
        /^---$/ { fm=!fm; print; next }
        { print }
    ' "$f"
}

cmd_validate() {
    local f
    f="$(abspath "${1:?usage: validate <path>}")"
    [ -f "$f" ] || die "file not found: $f"

    local errs=0
    require_field() {
        local v
        v="$(parse_field "$f" "$1")"
        if [ -z "$v" ]; then
            echo "FAIL missing frontmatter field: $1"
            errs=$((errs+1))
        fi
    }
    require_field task_id
    require_field from_agent
    require_field to_agent
    require_field created_at
    require_field priority
    require_field type
    require_field status

    # status must be one of the four valid values
    local s
    s="$(parse_field "$f" status)"
    case "$s" in
        queued|in_progress|completed|rejected) ;;
        *) echo "FAIL invalid status '$s' (must be queued|in_progress|completed|rejected)"; errs=$((errs+1)) ;;
    esac

    # priority must be one of CRITICAL|HIGH|MEDIUM|LOW
    local p
    p="$(parse_field "$f" priority)"
    case "$p" in
        CRITICAL|HIGH|MEDIUM|LOW) ;;
        *) echo "FAIL invalid priority '$p' (must be CRITICAL|HIGH|MEDIUM|LOW)"; errs=$((errs+1)) ;;
    esac

    # from_agent != to_agent
    local fa ta
    fa="$(parse_field "$f" from_agent)"
    ta="$(parse_field "$f" to_agent)"
    if [ -n "$fa" ] && [ "$fa" = "$ta" ]; then
        echo "FAIL from_agent must not equal to_agent"
        errs=$((errs+1))
    fi

    # body must include ## Task and ## Acceptance criteria
    for section in "## Task" "## Acceptance criteria"; do
        if ! grep -qE "^${section}( |$)" "$f"; then
            echo "FAIL missing section: $section"
            errs=$((errs+1))
        fi
    done

    # to_agent must match containing directory
    local parent
    parent="$(basename "$(dirname "$f")")"
    if [ -n "$ta" ] && [ "$ta" != "$parent" ] && [ "$parent" != "completed" ] && [ "$parent" != "founder" ]; then
        echo "WARN to_agent '$ta' does not match parent dir '$parent'"
    fi

    if [ "$errs" -eq 0 ]; then
        echo "OK $f passes shape validation"
        return 0
    else
        echo "FAIL $errs error(s)"
        return 1
    fi
}

cmd_claim() {
    local f
    f="$(abspath "${1:?usage: claim <path>}")"
    [ -f "$f" ] || die "file not found: $f"
    if grep -qE '^status: in_progress' "$f"; then
        echo "already in_progress: $f"
        return 0
    fi
    sed -i.bak -E 's/^status:.*/status: in_progress/' "$f" && rm -f "${f}.bak"
    echo "claimed: $f"
}

cmd_complete() {
    local f
    f="$(abspath "${1:?usage: complete <path>}")"
    [ -f "$f" ] || die "file not found: $f"
    sed -i.bak -E 's/^status:.*/status: completed/' "$f" && rm -f "${f}.bak"
    local dest="$QUEUE_ROOT/completed/$(basename "$f")"
    mkdir -p "$QUEUE_ROOT/completed"
    mv "$f" "$dest"
    echo "completed: $dest"
}

cmd_reject() {
    local f reason
    f="$(abspath "${1:?usage: reject <path> <reason>}")"
    shift
    reason="${*:?reason required as second arg}"
    [ -f "$f" ] || die "file not found: $f"
    sed -i.bak -E 's/^status:.*/status: rejected/' "$f" && rm -f "${f}.bak"
    # Append rejection finding if not already present
    if ! grep -qE '^## Findings' "$f"; then
        printf '\n## Findings\n\nRejected: %s\n' "$reason" >> "$f"
    fi
    local dest="$QUEUE_ROOT/completed/$(basename "$f")"
    mkdir -p "$QUEUE_ROOT/completed"
    mv "$f" "$dest"
    echo "rejected: $dest"
    echo "reason: $reason"
}

# ── Dispatch ─────────────────────────────────────────────────────────────────

case "${1:-}" in
    list)     shift; cmd_list "$@" ;;
    show)     shift; cmd_show "$@" ;;
    validate) shift; cmd_validate "$@" ;;
    claim)    shift; cmd_claim "$@" ;;
    complete) shift; cmd_complete "$@" ;;
    reject)   shift; cmd_reject "$@" ;;
    "" | help | --help | -h)
        cat <<EOF
usage: poll.sh <command> [args]

commands:
  list [agent]              list queued tasks (filter to one agent if given)
  show <path>               render task file
  validate <path>           validate task-file shape
  claim <path>              set status: in_progress (claim task)
  complete <path>           mark completed + move to completed/
  reject <path> <reason>    mark rejected + move + record reason

agents: ${KNOWN_AGENTS[*]}
EOF
        ;;
    *) die "unknown command '$1'. run with --help." ;;
esac

# CRON_CONFIGURATION.md

> **Status:** Governance v7 reference. Locked Founder ratification 2026-05-12.
> **Purpose:** GitHub Actions cron configuration for headless orchestration team operation. Setup walkthrough + secrets + monitoring.

---

## 0 — Why GitHub Actions

Reasons GitHub Actions is the chosen scheduler:

| Factor | GitHub Actions | Local cron (Windows Task Scheduler) | Cloud server cron |
|---|---|---|---|
| Machine-on required | No | Yes (your dev machine) | Yes (must maintain server) |
| Cost | Free for public repos; 2000 min/mo free for private | Free | Variable |
| Integration with repo | Native | Manual | Manual |
| Logging/observability | Built-in (Actions UI) | Local logs only | Server logs |
| Reliability | Microsoft-managed | Your machine uptime | Your server uptime |
| Secret management | Built-in GitHub Secrets | Local env vars | Server secrets |

GitHub Actions is the cleanest fit. The repo is already on GitHub (`AlrightLad/smoky-mountain-open`).

---

## 1 — Workflow files

Three workflow files go in `.github/workflows/`:

### 1.1 heartbeat.yml — every 4 hours
### 1.2 ship-cycle.yml — daily 11:00 UTC
### 1.3 proactive-cycle.yml — weekly Monday 01:00 UTC

Full contents below. Copy to `.github/workflows/` directory.

---

## 2 — Required GitHub Secrets

Set these in repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Purpose | Source |
|---|---|---|
| `ANTHROPIC_API_KEY` | Authenticates Claude Code invocations | https://console.anthropic.com/settings/keys |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Allows Firebase admin SDK operations in cycles | Firebase Console → Project settings → Service accounts → Generate key |
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions; no manual setup | Built-in |

**CRITICAL:** Per Founder preferences, NEVER commit secrets to repo. GitHub Secrets only.

---

## 3 — Workflow file: heartbeat.yml

```yaml
name: Heartbeat Cycle

on:
  schedule:
    - cron: '0 */4 * * *'   # Every 4 hours UTC
  workflow_dispatch:          # Manual trigger for testing

permissions:
  contents: write             # Allow writing state files + journal
  pull-requests: write        # Allow opening PRs for high-priority bugs

jobs:
  heartbeat:
    runs-on: ubuntu-latest
    timeout-minutes: 40       # Hard kill at 40 min (cycle cap is 30; this is safety margin)
    
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4
        with:
          fetch-depth: 2      # Need previous commit for diff comparisons
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Check cron-paused state
        id: pause_check
        run: |
          if [ -f .claude/state/cron-paused.json ]; then
            echo "paused=true" >> $GITHUB_OUTPUT
            echo "Cron is paused. Exiting."
            exit 0
          fi
          echo "paused=false" >> $GITHUB_OUTPUT
      
      - name: Acquire cycle lock
        if: steps.pause_check.outputs.paused == 'false'
        run: bash .claude/scripts/acquire-lock.sh heartbeat
      
      - name: Run heartbeat cycle
        if: steps.pause_check.outputs.paused == 'false'
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          FIREBASE_SERVICE_ACCOUNT_KEY: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_KEY }}
          CYCLE_TYPE: heartbeat
          CYCLE_TOKEN_CAP: 40000
          CYCLE_DURATION_CAP: 1800   # 30 min in seconds
        run: bash .claude/scripts/cron-heartbeat.sh
      
      - name: Release cycle lock
        if: always() && steps.pause_check.outputs.paused == 'false'
        run: bash .claude/scripts/release-lock.sh heartbeat
      
      - name: Commit state changes
        if: steps.pause_check.outputs.paused == 'false'
        run: |
          git config user.name "Parbaughs Orchestration"
          git config user.email "orchestration@parbaughs.local"
          git add .claude/state/ docs/agents/SESSION_JOURNAL.md
          git diff --staged --quiet || git commit -m "chore(cycle): heartbeat $(date -u +%Y-%m-%dT%H:%M:%SZ)"
          git push
```

---

## 4 — Workflow file: ship-cycle.yml

```yaml
name: Ship Cycle (Daily)

on:
  schedule:
    - cron: '0 11 * * *'      # 11:00 UTC daily (~6 AM ET)
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

jobs:
  ship:
    runs-on: ubuntu-latest
    timeout-minutes: 150       # 2.5 hours (cycle cap is 2; safety margin)
    
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4
        with:
          fetch-depth: 0       # Full history for ship work
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Check cron-paused state
        id: pause_check
        run: |
          if [ -f .claude/state/cron-paused.json ]; then
            echo "paused=true" >> $GITHUB_OUTPUT
            exit 0
          fi
          echo "paused=false" >> $GITHUB_OUTPUT
      
      - name: Check cycle-config for ship enabled
        if: steps.pause_check.outputs.paused == 'false'
        id: cycle_check
        run: |
          if [ -f .claude/state/cycle-config.json ]; then
            enabled=$(jq -r '.ship.enabled' .claude/state/cycle-config.json 2>/dev/null || echo "true")
            echo "enabled=$enabled" >> $GITHUB_OUTPUT
          else
            echo "enabled=true" >> $GITHUB_OUTPUT
          fi
      
      - name: Acquire cycle lock
        if: steps.pause_check.outputs.paused == 'false' && steps.cycle_check.outputs.enabled == 'true'
        run: bash .claude/scripts/acquire-lock.sh ship
      
      - name: Run ship cycle
        if: steps.pause_check.outputs.paused == 'false' && steps.cycle_check.outputs.enabled == 'true'
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          FIREBASE_SERVICE_ACCOUNT_KEY: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_KEY }}
          CYCLE_TYPE: ship
          CYCLE_TOKEN_CAP: 200000
          CYCLE_DURATION_CAP: 7200   # 2 hours in seconds
        run: bash .claude/scripts/cron-ship.sh
      
      - name: Release cycle lock
        if: always() && steps.pause_check.outputs.paused == 'false' && steps.cycle_check.outputs.enabled == 'true'
        run: bash .claude/scripts/release-lock.sh ship
      
      - name: Commit changes
        if: steps.pause_check.outputs.paused == 'false' && steps.cycle_check.outputs.enabled == 'true'
        run: |
          git config user.name "Parbaughs Orchestration"
          git config user.email "orchestration@parbaughs.local"
          git add .
          git diff --staged --quiet || git commit -m "feat(ship): cycle $(date -u +%Y-%m-%dT%H:%M:%SZ)"
          git push
```

---

## 5 — Workflow file: proactive-cycle.yml

```yaml
name: Proactive Cycle (Weekly)

on:
  schedule:
    - cron: '0 1 * * 1'        # 01:00 UTC Monday (~8 PM ET Sunday)
  workflow_dispatch:

permissions:
  contents: write

jobs:
  proactive:
    runs-on: ubuntu-latest
    timeout-minutes: 100       # 1h40m (cycle cap is 1h30m; safety margin)
    
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Check cron-paused state
        id: pause_check
        run: |
          if [ -f .claude/state/cron-paused.json ]; then
            echo "paused=true" >> $GITHUB_OUTPUT
            exit 0
          fi
          echo "paused=false" >> $GITHUB_OUTPUT
      
      - name: Check cycle-config for proactive enabled
        if: steps.pause_check.outputs.paused == 'false'
        id: cycle_check
        run: |
          if [ -f .claude/state/cycle-config.json ]; then
            enabled=$(jq -r '.proactive.enabled' .claude/state/cycle-config.json 2>/dev/null || echo "true")
            echo "enabled=$enabled" >> $GITHUB_OUTPUT
          else
            echo "enabled=true" >> $GITHUB_OUTPUT
          fi
      
      - name: Acquire cycle lock
        if: steps.pause_check.outputs.paused == 'false' && steps.cycle_check.outputs.enabled == 'true'
        run: bash .claude/scripts/acquire-lock.sh proactive
      
      - name: Run proactive cycle
        if: steps.pause_check.outputs.paused == 'false' && steps.cycle_check.outputs.enabled == 'true'
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          CYCLE_TYPE: proactive
          CYCLE_TOKEN_CAP: 120000
          CYCLE_DURATION_CAP: 5400  # 90 min in seconds
        run: bash .claude/scripts/cron-proactive.sh
      
      - name: Release cycle lock
        if: always() && steps.pause_check.outputs.paused == 'false' && steps.cycle_check.outputs.enabled == 'true'
        run: bash .claude/scripts/release-lock.sh proactive
      
      - name: Notify Founder of new proposals
        if: steps.pause_check.outputs.paused == 'false' && steps.cycle_check.outputs.enabled == 'true'
        run: |
          QUEUE_FILE=".claude/state/proactive-proposals/$(date -u +%Y-%m-%d).md"
          if [ -f "$QUEUE_FILE" ]; then
            PROPOSAL_COUNT=$(grep -c "^### PROP-" "$QUEUE_FILE" || echo "0")
            echo "Proactive cycle generated $PROPOSAL_COUNT proposals."
            echo "Review at: $QUEUE_FILE"
            # Email/webhook notification can be added here (e.g. via GitHub Issue creation)
          fi
      
      - name: Commit proposal queue
        if: steps.pause_check.outputs.paused == 'false' && steps.cycle_check.outputs.enabled == 'true'
        run: |
          git config user.name "Parbaughs Orchestration"
          git config user.email "orchestration@parbaughs.local"
          git add .claude/state/ docs/agents/SESSION_JOURNAL.md
          git diff --staged --quiet || git commit -m "chore(cycle): proactive proposal queue $(date -u +%Y-%m-%dT%H:%M:%SZ)"
          git push
```

---

## 6 — Cron wrapper scripts

These shell scripts live in `.claude/scripts/`. They orchestrate the actual cycle work.

### 6.1 acquire-lock.sh

```bash
#!/bin/bash
set -e

CYCLE_TYPE="$1"
LOCK_FILE=".claude/state/cycle-lock.json"
MAX_STALE_MINUTES=240  # Heartbeat: 4 hours; this is safe stale window

mkdir -p .claude/state

if [ -f "$LOCK_FILE" ]; then
    LOCK_AGE=$(jq -r '.started_at' "$LOCK_FILE" 2>/dev/null || echo "")
    if [ -n "$LOCK_AGE" ]; then
        AGE_SECONDS=$(($(date -u +%s) - $(date -u -d "$LOCK_AGE" +%s)))
        AGE_MINUTES=$((AGE_SECONDS / 60))
        if [ "$AGE_MINUTES" -lt "$MAX_STALE_MINUTES" ]; then
            echo "Previous cycle still running. Lock age: ${AGE_MINUTES} min. Exiting."
            exit 1
        fi
        echo "Stale lock detected (age: ${AGE_MINUTES} min). Clearing."
    fi
fi

cat > "$LOCK_FILE" <<EOF
{
  "cycle_type": "$CYCLE_TYPE",
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "pid": "$$"
}
EOF

echo "Lock acquired for $CYCLE_TYPE cycle."
```

### 6.2 release-lock.sh

```bash
#!/bin/bash
set -e

CYCLE_TYPE="$1"
LOCK_FILE=".claude/state/cycle-lock.json"

if [ -f "$LOCK_FILE" ]; then
    EXISTING_TYPE=$(jq -r '.cycle_type' "$LOCK_FILE" 2>/dev/null || echo "")
    if [ "$EXISTING_TYPE" = "$CYCLE_TYPE" ]; then
        rm "$LOCK_FILE"
        echo "Lock released for $CYCLE_TYPE cycle."
    else
        echo "Lock owned by different cycle ($EXISTING_TYPE). Not releasing."
    fi
fi
```

### 6.3 cron-heartbeat.sh

```bash
#!/bin/bash
set -e

# Invocation wrapper for Claude Code heartbeat cycle.
# Reads HEADLESS_OPERATION_PROTOCOL.md § 3 activities.

CYCLE_ID="heartbeat-$(date -u +%Y%m%d-%H%M)"
JOURNAL=".claude/state/heartbeat/$(date -u +%Y-%m-%d).log"

mkdir -p .claude/state/heartbeat

echo "## Heartbeat — $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$JOURNAL"
echo "" >> "$JOURNAL"

# The actual Claude Code invocation goes here.
# Founder amends this with their preferred Claude Code CLI invocation pattern.
# Recommended invocation: claude-code with a heartbeat-cycle prompt that:
#   1. Reads HEADLESS_OPERATION_PROTOCOL.md § 3 for activity definitions
#   2. Executes each activity in order with respective token budgets
#   3. Writes output to heartbeat journal
#   4. Updates state files
#   5. Respects budget watchdog at 90%/100% thresholds

# Placeholder until Founder configures:
echo "**Cycle ID:** $CYCLE_ID" >> "$JOURNAL"
echo "**Note:** Heartbeat cycle invocation pending Claude Code CLI configuration." >> "$JOURNAL"
echo "" >> "$JOURNAL"

# Append to SESSION_JOURNAL.md
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [HEARTBEAT-CYCLE-START] cycle_id=$CYCLE_ID" >> docs/agents/SESSION_JOURNAL.md
# Cycle work happens here
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [HEARTBEAT-CYCLE-END] cycle_id=$CYCLE_ID" >> docs/agents/SESSION_JOURNAL.md
```

### 6.4 cron-ship.sh

```bash
#!/bin/bash
set -e

CYCLE_ID="ship-$(date -u +%Y%m%d-%H%M)"
JOURNAL="docs/agents/SESSION_JOURNAL.md"

# Invocation wrapper for Claude Code ship cycle.
# Reads HEADLESS_OPERATION_PROTOCOL.md § 4 activities.

# Placeholder until Founder configures Claude Code CLI invocation:
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [SHIP-CYCLE-START] cycle_id=$CYCLE_ID" >> "$JOURNAL"
# Ship work happens here:
# - Pre-cycle setup
# - Ship selection per SHIP_INDEX
# - Pre-flight audit (P1)
# - Decision bubbles
# - Engineer execution
# - Post-push retrospective
# - State persistence

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [SHIP-CYCLE-END] cycle_id=$CYCLE_ID" >> "$JOURNAL"
```

### 6.5 cron-proactive.sh

```bash
#!/bin/bash
set -e

CYCLE_ID="proactive-$(date -u +%Y%m%d-%H%M)"
JOURNAL="docs/agents/SESSION_JOURNAL.md"
QUEUE_FILE=".claude/state/proactive-proposals/$(date -u +%Y-%m-%d).md"

mkdir -p .claude/state/proactive-proposals

# Invocation wrapper for Claude Code proactive cycle.
# Reads PROACTIVE_IMPROVEMENT_PROTOCOL.md activities.

# Placeholder until Founder configures Claude Code CLI invocation:
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [PROACTIVE-CYCLE-START] cycle_id=$CYCLE_ID" >> "$JOURNAL"
# Proactive work happens here:
# - Bug pattern analysis (Lane 2)
# - UI polish scan (Lane 1)
# - Performance scan (Lane 3)
# - Design system extension scan (Lane 4)
# - Proposal queue assembly
# - State persistence

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [PROACTIVE-CYCLE-END] cycle_id=$CYCLE_ID" >> "$JOURNAL"
```

---

## 7 — Founder configuration of Claude Code invocation

The cron wrapper scripts have placeholders for the actual Claude Code CLI invocation. Founder configures this once based on their Claude Code setup.

### 7.1 Claude Code CLI pattern

Per locked memory: Claude Code (claude-code) is the CLI tool. Founder configures invocation with appropriate prompt for each cycle.

Recommended invocation pattern (adapt to actual CLI):

```bash
claude-code run \
  --prompt-file .claude/prompts/heartbeat-cycle.md \
  --token-cap "$CYCLE_TOKEN_CAP" \
  --working-dir . \
  --state-dir .claude/state/ \
  --output-format json \
  > .claude/state/heartbeat/$(date -u +%Y-%m-%d-%H%M).json
```

### 7.2 Cycle prompt files

Create `.claude/prompts/` directory with three prompt files:

- `heartbeat-cycle.md` — instructs Claude Code on heartbeat activities per HEADLESS_OPERATION_PROTOCOL.md § 3
- `ship-cycle.md` — instructs Claude Code on ship cycle activities per § 4
- `proactive-cycle.md` — instructs Claude Code on proactive cycle activities per § 5 + PROACTIVE_IMPROVEMENT_PROTOCOL.md

Each prompt file references the relevant governance docs + state files.

Founder authors these prompts in initial setup OR uses default templates (TBD; can be added to v8 if needed).

---

## 8 — Monitoring + observability

### 8.1 GitHub Actions UI
- Built-in workflow run history
- Per-run logs
- Failure notifications via email (configured in GitHub notification settings)

### 8.2 Session Journal
- Every cycle writes entries
- Founder can `grep` for patterns:
  - `[HEARTBEAT-CYCLE]` — heartbeat history
  - `[SHIP-CYCLE]` — ship history
  - `[PROACTIVE-CYCLE]` — proactive history
  - `[DRIFT-FLAG]` — drift incidents
  - `[HALT-]` — any halt event

### 8.3 Cycle history file
`.claude/state/cycle-history.json` aggregates all cycle outcomes for quick scan:

```json
{
  "cycles": [
    {
      "cycle_id": "heartbeat-20260519-1600",
      "type": "heartbeat",
      "started_at": "2026-05-19T16:00:00Z",
      "ended_at": "2026-05-19T16:18:00Z",
      "duration_seconds": 1080,
      "tokens_consumed": 34000,
      "outcome": "SUCCESS",
      "summary": "Clean. 3 bugs triaged, 1 perf benchmark, 0 drift."
    }
  ]
}
```

### 8.4 Founder dashboard (future enhancement)
Possible v8 addition: simple HTML dashboard reading cycle-history + FIQ + proposal queue for at-a-glance status. Not in v7 scope.

---

## 9 — Initial setup checklist

To enable cron operation, Founder completes:

- [ ] **GitHub Secret: `ANTHROPIC_API_KEY`** added to repo
- [ ] **GitHub Secret: `FIREBASE_SERVICE_ACCOUNT_KEY`** added to repo
- [ ] **Workflow files committed** to `.github/workflows/` (3 files)
- [ ] **Wrapper scripts committed** to `.claude/scripts/` (5 files)
- [ ] **Cron prompt files authored** in `.claude/prompts/` (3 files)
- [ ] **State directories bootstrapped:**
    - [ ] `.claude/state/heartbeat/`
    - [ ] `.claude/state/proactive-proposals/`
    - [ ] `.claude/state/ship-progress/`
    - [ ] `.claude/state/wellness/`
    - [ ] `.claude/state/cycle-config.json` (initial: all enabled)
- [ ] **Test heartbeat cycle manually** via `workflow_dispatch` trigger
- [ ] **Verify state writes correctly** + journal entries appear
- [ ] **Confirm no secrets in commits**

After checklist complete: cron is live. Cycles fire on schedule.

---

## 10 — Pausing + emergency halt

### 10.1 Pause all cron
Create `.claude/state/cron-paused.json`:

```json
{
  "paused": true,
  "paused_at": "2026-05-19T08:00:00Z",
  "paused_by": "Founder",
  "reason": "Family vacation",
  "auto_resume_at": "2026-05-26T08:00:00Z"
}
```

Commit + push. Next cycle wake reads file, exits immediately.

### 10.2 Resume
Delete `cron-paused.json` (or wait for `auto_resume_at`). Commit + push.

### 10.3 Selective disable
Edit `.claude/state/cycle-config.json`:

```json
{
  "heartbeat": {"enabled": true},
  "ship": {"enabled": false},
  "proactive": {"enabled": true}
}
```

Commit + push. Disabled cycle wakes, reads config, exits.

### 10.4 Emergency halt (cycle in progress)
Create `.claude/state/emergency-halt.json`:

```json
{
  "halt": true,
  "halt_at": "2026-05-19T11:30:00Z",
  "reason": "Production issue detected"
}
```

Active cycle checks this every minute. Completes atomic operation, exits.

---

## 11 — Cost monitoring

### 11.1 Anthropic API spend
Founder monitors via Anthropic console: https://console.anthropic.com/settings/usage

Expected weekly cron spend:
- Heartbeat: 42 × 40k = ~1.68M tokens
- Ship: 7 × 200k = ~1.4M tokens
- Proactive: 1 × 120k = ~120k tokens
- **Total: ~3.2M tokens/week**

At Claude Opus pricing, plan accordingly.

### 11.2 Cost threshold integration
Per locked governance, Founder cost-discipline can set thresholds in Admin → Platform settings → Cost thresholds (3i.5). Threshold breach triggers HALT_CRITERIA item 5.


# CRON_CONFIGURATION — Remove fictional 3.5M weekly alert threshold

This draft surfaces a single line edit to CRON_CONFIGURATION.md.

Founder applies via direct edit (no `git mv` needed; this is an in-place
content change to one line).

## What changed

### Line 616 — Weekly token budget alert (REPHRASED)

**v8.1 (REMOVE):**
> - Weekly token budget alert: 3.5M/week expected, alert at 4.5M/week

This hardcoded 4.5M / 3.5M against a fictional cap. The thresholds are
guesses, not measurements.

**v8.2 (NEW):**
> - Weekly token budget alert: whatever the active Anthropic quota is per
>   the most recent `manual-quota-log.ndjson` entry. Alert fires at 90%
>   of the latest paste's `weekly-all` percentage (computed at threshold
>   evaluation, not pre-stored). If no manual paste exists or the latest
>   is > 24h stale, fall back to alerting on telemetry-event volume
>   anomalies (e.g., 2x prior week's daily peak) rather than against a
>   hardcoded number.

## Why this matters

Cron-level alerts that fire against fiction are noise, not signal. The
4.5M / 3.5M numbers had no relationship to Founder's actual Anthropic
quota. Replacing them with the manual-paste-derived percentage means:

1. When Founder has anchored quota recently, the alert is real.
2. When Founder hasn't, the alert falls back to a measurement-derived
   anomaly check rather than a fictional ceiling — no false confidence.
3. When PROP-003 ships, the manual-paste anchor gets replaced by real
   telemetry-derived numbers; the threshold logic is the same.

## Dependency

Same as PAUSE_DISCIPLINE v8.2: pending PROP-003 ship for real
telemetry-derived caps.

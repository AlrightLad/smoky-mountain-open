# REMEDIATION SPEC — Fix snapshot-PASS pattern at root

## PRE-RESEARCH
Audit at .claude/state/audit-report-2026-05-15.md identified 5 remediations
for root-cause durability fixes. Pattern named: snapshot-PASS vs durable-PASS.
Validator passes against state that doesn't survive workspace cleanup.

## GOAL
Fix all 5 durability gaps so future closures are durable, not snapshot-only.

## CONTEXT
- Audit report: .claude/state/audit-report-2026-05-15.md
- Engineering-mindset addendum: .claude/state/lessons-learned/engineering-mindset.md
- Failed scripts: scripts/regen-all.sh, scripts/verify-approval-pipeline.sh,
  scripts/inject-health-banners.py
- Vanished scaffolds: docs/reports/*.html restored from 8eb0a15^ but not
  durably reproducible
- AMD-021 strict closure binding

## CONSTRAINTS
- All AMD-009 through AMD-025 + PROP-006 through PROP-013 + skills binding
- AMD-021 strict closure: root-cause fix, no workarounds
- AMD-009 P5 honest delta
- AMD-018 11-gate push
- NO || true exit-swallowing in scripts post-fix
- NO agent self-authorization of governance ratification

## PRIORITY
P0: Fix R1 + R3 (scaffold reproducibility + banner anchors) — Dashboard
    must render durably from fresh checkout
P1: Fix R4 (mkdir -p pending/ in verify script)
P2: Fix R2 (tracked templates pattern)
P3: Fix R5 (closure validator surfaces hook failures without || true)

## PLAN

### R1 — Scaffold-or-bail (HIGH urgency)
- regen scripts MUST error out if HTML scaffold missing, not silently
  no-op via || true
- Touch: scripts/regen-all.sh, scripts/regen-{dashboard,proposals,amendments,
  escalations,index,ops-views,main-flows}.py
- Each script: if target HTML missing → exit 1 with clear error message
  + scaffold-path hint
- Verify: rm docs/reports/dashboard.html && bash scripts/regen-all.sh
  → expect exit 1 with "scaffold missing at X"

### R2 — Tracked templates
- Create templates/ directory at repo root (tracked)
- Move scaffold authoring into templates/: dashboard.template.html etc.
- Add scripts/scaffold-from-templates.{sh,py} that copies templates →
  docs/reports/ on bootstrap
- Update regen scripts to call scaffold-from-templates if HTML missing
  BEFORE injecting data
- Verify: rm -rf docs/reports/*.html && bash scripts/scaffold-from-
  templates.sh && bash scripts/regen-all.sh → all HTML present + correct

### R3 — Banner-anchor scaffolding (HIGH urgency)
- inject-health-banners.py currently expects anchor markup pre-existing
- Add idempotent scaffold step: if security-banner anchor missing →
  create it; if test-banner anchor missing → create it
- The scaffold must use the SAME anchor format inject-health-banners
  expects → no drift
- Verify: rm docs/reports/dashboard.html && bash scripts/scaffold-from-
  templates.sh && python scripts/inject-health-banners.py → expect
  exit 0 + grep "data-fq-banner-meta=security" returns 1+ hits

### R4 — mkdir -p pending/
- scripts/verify-approval-pipeline.sh fails second run because pending/
  cleaned up after first
- Add: mkdir -p .claude/state/proposals/{pending,approved,rejected,
  applied} at script start
- Make script idempotent: can run N times without intervention
- Verify: bash scripts/verify-approval-pipeline.sh (exit 0) && bash
  scripts/verify-approval-pipeline.sh (exit 0) → both pass

### R5 — Surface hook failures
- Update closure-validator checks (in continuation-discipline skill +
  /goal validator logic where applicable) to run scripts WITHOUT || true
- New Q5 in continuation-discipline: "What in this work depends on
  on-disk state that isn't reproducible from a fresh checkout?"
- If Q5 non-empty → not closure-true; declare snapshot-PASS not durable

## DONE WHEN
- rm -rf docs/reports/*.html && bash scripts/scaffold-from-templates.sh
  && bash scripts/regen-all.sh → all dashboards render with banners
- rm -rf .claude/state/proposals/* && bash scripts/verify-approval-
  pipeline.sh (exit 0)
- git grep "|| true" in scripts/*.sh + scripts/*.ps1 → only intentional
  uses with inline-doc rationale
- continuation-discipline skill includes Q5 reproducibility check
- All R1-R5 atomic commits pushed to origin/main
- Final remediation report at .claude/state/remediation-report-2026-05-
  15.md

## VERIFY
Validator runs:
- bash -c "rm -rf docs/reports/_assets docs/reports/*.html && bash
  scripts/scaffold-from-templates.sh && bash scripts/regen-all.sh &&
  [ -s docs/reports/dashboard.html ] && grep -q 'data-fq-banner-meta=
  security' docs/reports/dashboard.html"
- bash scripts/verify-approval-pipeline.sh && bash scripts/verify-
  approval-pipeline.sh (exit 0 both times)
- Each R has explicit commit + matching verify-from-fresh-state test

## OUTPUT
- Atomic commits per remediation
- New: templates/dashboard.template.html etc.
- New: scripts/scaffold-from-templates.{sh,py}
- Updated: regen scripts (error on missing scaffold)
- Updated: scripts/verify-approval-pipeline.sh (mkdir -p)
- Updated: scripts/inject-health-banners.py (idempotent anchors)
- Updated: continuation-discipline skill (Q5)
- Final: .claude/state/remediation-report-2026-05-15.md

## STOP RULES
- All DONE WHEN met → close
- Real AMD-015 escalation → surface to task-queue/founder/ + continue
- 5+ documented attempts on single remediation → surface + continue others
- 100 turns without DONE → save state + surface

NOT stop conditions: feels done, partial-remediation good enough,
"hooks already firing"

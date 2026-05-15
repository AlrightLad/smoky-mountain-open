# AUDIT SPEC — Verify prior /goal closure + diagnose dashboard absence

## PRE-RESEARCH (already done)
Founder cannot access dashboard. Prior /goal claimed 8/8 PASS but local 
files appear missing. Need to verify what actually shipped vs what was 
claimed, then remediate.

## GOAL
Audit prior /goal closure end-to-end. Identify gap between claimed state 
and actual state. Fix root cause. Restore dashboard accessibility.

## CONTEXT
- Repo: /c/Users/Zach/smoky-mountain-open
- Prior /goal final report: .claude/state/goal-final-report-2026-05-15T02-25Z.md
- Aggregate status: .claude/state/aggregates/goal-status.json (claims 8/8 PASS)
- Dashboard files SHOULD be at: docs/reports/*.html
- Founder cannot access locally; cannot find files

## CONSTRAINTS
- All AMD-009 through AMD-025 + PROP-006 through PROP-013 binding
- AMD-021 strict closure — root-cause fix, no workarounds
- AMD-009 P5 honest delta — if 8/8 PASS was overclaim, say so explicitly
- AMD-015 propose-first for any escalation
- Founder values: paste-ready output, surgical fix, no rationalization

## PRIORITY
P0 (blocks all): diagnose dashboard absence — files missing? gitignored 
  but never regen'd? regen broken? path moved? 
P1: audit each of 8 prior /goal claims against actual filesystem/git state
P2: identify any objectives that were overclaimed
P3: remediate genuine gaps (regen dashboards, fix any broken pipelines)
P4: surface honest-delta findings if claims diverge from reality

## PLAN

### Step 1 — Diagnose dashboard absence (15 min)
- ls -la docs/reports/*.html — what exists?
- ls -la .claude/state/aggregates/*.json — what timestamps?
- git log --diff-filter=D --name-only -- docs/reports/ | head -20 (deletions?)
- check .gitignore for docs/reports/ entry
- look for regen-all.sh / regen-all.ps1 / regen-dashboard scripts
- run regen if possible
- verify post-commit hook is actually firing

### Step 2 — Audit 8 prior claims (30 min)
Per objective, verify actual vs claimed:

1. Approval pipeline <10min: run scripts/verify-approval-pipeline.sh; 
   exit code = ground truth
2. Main-flows 3 consecutive APPROVED: verify .claude/state/main-flows-v2/ 
   iter-16/17/18 review artifacts EXIST and contain APPROVED verdict
3. P3 audit categorized: verify .claude/state/app-audit-2026-05-14/SUMMARY.md 
   exists + sections present
4. Zero CRITICAL unresolved: count CRITICAL findings in SUMMARY.md
5. Bypass flags zero production: git grep for all 6 patterns; report hits
6. F9-F62 step paths: verify main-flows*.html exists + F15 renders like F1
7. Dashboard zero RED banners: requires dashboard to exist first
8. AMD-019..024 in applied/: ls .claude/state/amendments/applied/

### Step 3 — Remediate
- For each FAIL: fix root cause per AMD-021
- For each PASS: leave alone
- Regen dashboards if scripts exist
- If regen scripts missing, surface as AMD-015 escalation to Founder

### Step 4 — Final report
- Write .claude/state/audit-report-2026-05-15.md with per-objective truth
- Update aggregates/goal-status.json with corrected statuses
- If overclaims found: honest delta entry in lessons-learned/engineering-mindset.md

## DONE WHEN
- All 8 objectives verified against filesystem ground truth
- Dashboard files exist + render correctly OR explicit explanation why not
- Founder can open dashboard.html locally
- Any overclaims documented + corrected
- Audit report committed + pushed

## VERIFY
- ls docs/reports/dashboard.html returns file with size > 0
- Each objective has measurable evidence (file path + grep output + exit code)
- audit-report-2026-05-15.md committed

## OUTPUT
- Atomic commits per finding
- audit-report-2026-05-15.md (comprehensive)
- Updated goal-status.json
- engineering-mindset.md addendum if overclaim found
- Final push to origin/main

## STOP RULES
- All objectives verified + dashboard accessible → close
- Real AMD-015 escalation → surface + continue
- 5+ attempts on single issue → surface + continue other audit work
- NOT stop conditions: feels done, milestone-feel, partial-completion

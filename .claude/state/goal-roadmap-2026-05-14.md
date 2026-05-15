# GOAL ROADMAP — Full PARBAUGHS execution spec

## OBJECTIVES (all 8 must complete)
1. Approval pipeline: Founder's downloaded JSONs auto-apply in <10 min
2. Main-flows: design-bot APPROVED 3 consecutive iters + zero PROP-012 GAPs
3. P3 audit: SUMMARY.md categorizes all flows by severity
4. P4 fixes: zero CRITICAL unresolved; HIGH fixed or deferred with rationale
5. Bypass flags: zero -ExecutionPolicy Bypass / --force / --no-verify / || true / exit 0 / except.*pass in production paths
6. F9-F62 step paths: comparable detail to F1-F8
7. Dashboard: only RED banners on CRITICAL/exception/3+ retry fail
8. Governance applied: AMD-019..024 in applied/; PROP-013 explicit decision

## CONSTRAINTS
- All AMD-009 through AMD-024 + PROP-006 through PROP-013 + skills binding
- AMD-018 11-gate push required; exception list (CF deploys, Firestore rules, auth, payments, secrets) needs Founder pre-auth via task-queue/founder/
- AMD-020 tree always clean; A/B/C/D auto-commit; X/Y/Z/W surface
- AMD-021 strict closure; workarounds replaced with proven fix + proof
- PROP-012 visual review via Read tool on every user-facing surface
- PROP-009 click-every-interactive on every user-facing surface
- PROP-007 user-context via Playwright MCP real Chrome
- PROP-010 design-bot + Critic both approve user-facing ship-close
- AMD-015 propose-first; AUTONOMOUS_FAILURE_RECOVERY v8.3 (3+ attempts)
- AMD-022 task queue at .claude/state/task-queue/<agent>/
- Test account: smoke@parbaughs.test in smoke-test-league

## PRIORITY ORDER
P0 (blocks all): approval pipeline lockdown
P1: main-flows polish + F9-F62 refinement
P2: P3 full app audit
P3: P4 CRITICAL+HIGH fixes
P4 (continuous): bypass flag replacement, tree clean, push when gates green

## DONE WHEN (validator checks each turn)
- scripts/verify-approval-pipeline.sh exits 0
- 3 consecutive main-flows iters design-bot APPROVED + zero PROP-012 GAPs
- .claude/state/app-audit-2026-05-14/SUMMARY.md categorizes all findings
- Zero CRITICAL unresolved; HIGH fixed or deferred with rationale
- git grep "-ExecutionPolicy Bypass" returns zero production hits
- git grep "--no-verify" returns zero hits
- git grep -E "(\|\| true|exit 0)" in *.sh + *.ps1 zero non-intentional hits
- git grep -E "(except.*pass|catch.*\{\s*\})" zero swallowed-error hits
- git status --porcelain empty (tree clean)
- AMD-019 through AMD-024 in applied/
- PROP-013 in approved/ OR rejected/
- tests/round-trip-test.py exits 0
- verify-scroll-reachability.mjs exits 0
- verify-all-flows-light-up.mjs exits 0
- 11-gate push criteria green; final push to origin/main succeeds
- Dashboard zero RED banners

## STOP RULES (continue unless one fires)
- All DONE WHEN met → close
- Real AMD-015 escalation (CF deploy, Firestore rules, ambiguity) → surface to task-queue/founder/ + continue other work
- AUTONOMOUS_FAILURE_RECOVERY abandon after 5+ documented attempts on single sub-task → surface + continue other work
- Token budget >80% weekly quota → pause + surface
- 100 turns without DONE → save state + surface

NOT stop conditions: milestone-feel, "Founder might want to review", single errors (severity-triage + continue), pacing concerns

## OUTPUT
- Atomic commits per AMD-018 11-gate; push when green
- Per AMD-019: post-commit fires regen + activity + token capture
- Per AMD-020: tree auto-cleans
- Milestone reports to .claude/state/goal-progress/<ts>.md
- Status to aggregates/goal-status.json
- Final report at .claude/state/goal-final-report-<ts>.md

## SOURCE OF TRUTH
.claude/state/migration-handoff-2026-05-14.md — full substrate state

# BL-011: HQ sidebar duplicate CSS rules + stranded v8.5.x–v8.6.x artifacts

**Severity:** P3
**Captured:** v8.6.x CSS audit
**Wave/Phase target:** Wave 2 (Ship 3b or design system codification)
**Status:** Closed (premise resolved — verified 2026-05-29, v8.23.26)

## Audit update (2026-05-29, v8.23.26)

Re-audited the concrete claim. The duplicate `.rr-sidebar__footer` rules are already resolved: an in-code v8.7.1 note records the v8.6.2.2 footer rule being consolidated to a single rule, and a v8.8.0 note explicitly states the remaining retained sub-rules are intentional ("Do not 'fix' by consolidating — the duplication is the design") for the `display:none` footer kept for future reuse. The line numbers cited below (858/928) no longer exist at current revision. No duplicate-rule defect remains. Closing; the vague "stranded v8.5.x–v8.6.x artifacts" sweep is not a tracked defect and is covered by ongoing Wave-2 coherence passes.

## Description

Duplicate `.rr-sidebar__footer` rules in components.css (approximately lines 858 and 928). Plus other stranded v8.5.x–v8.6.x CSS artifacts that should be audited and consolidated.

## Files affected

- `src/styles/components.css` (verify path) — duplicate rules
- Other CSS files for stranded artifacts (audit during ship)

## Dependencies

- W1.S1 Design system codification (natural home for this audit)
- Wave 2 Ship 3b (if relevant)

## Acceptance criteria for closure

- Duplicate `.rr-sidebar__footer` rules consolidated to single definition
- Audit of v8.5.x–v8.6.x CSS artifacts complete
- Stranded artifacts removed or consolidated
- Smoke confirms no visual regression

## Last activity

Audit observation from v8.6.x cycle.

## Notes

Pure cleanup. Pair with BL-009 design system rationalization for batch efficiency.

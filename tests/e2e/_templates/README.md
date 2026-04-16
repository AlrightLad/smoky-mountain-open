# Playwright Diagnostic Templates

This directory holds templates for using Playwright as a
diagnostic tool — not as a CI test runner. Files here use the
`.example` extension so Playwright doesn't run them during
normal test passes.

## When to use diagnostic mode

Good fit:
- Visible layout bugs (stray elements, missing components,
  misalignment, overflow)
- Cross-page consistency bugs (a value shows X on page A but Y
  on page B for the same user)
- Questions about computed CSS or DOM structure that can't be
  answered by reading source code alone
- Situations where you need DOM inspection but don't want to
  rely on screenshots from a phone

Not a good fit:
- Pure logic bugs — use unit tests, the verify.js harness, or
  DevTools console commands on Firestore
- Data shape bugs — inspect Firestore directly
- Intermittent/timing bugs — needs different diagnostic approach
  than static-state snapshots

## Pattern

1. Create `tests/e2e/flows/DIAG-<bug-name>.spec.js` as a
   temporary file (note the DIAG prefix — excluded from normal
   runs via playwright.config.js if needed, or deleted after
   use)
2. Seed the emulator with fixture data that reproduces the bug.
   If the bug doesn't reproduce on existing fixtures, extend
   them — that extension is often valuable output in itself
3. Script the diagnostic:
   - Login as the affected user
   - Navigate to each affected page
   - Screenshot to `test-results/diag-<name>.png`
   - Extract DOM of suspicious elements: innerHTML, computed
     styles, data attributes
   - Console.log everything clearly for Agent 3 to read back
4. Run: `npx playwright test tests/e2e/flows/DIAG-<bug-name>.spec.js --reporter=list`
5. Diagnose from the output

## Post-diagnosis hygiene — required

Once the bug is diagnosed and fixed:

1. If the pattern used is reusable: rename the DIAG file to
   `tests/e2e/_templates/DIAG-<pattern-name>.spec.js.example`
   so future work can reference it
2. Write proper regression tests in the appropriate
   `tests/e2e/flows/` file that would catch the bug going
   forward
3. Delete the temporary DIAG file from `tests/e2e/flows/` so it
   doesn't run in CI or clutter normal test output
4. Update this README if the pattern taught you something
   generalizable about diagnosing this class of bug

## Reproduction decision tree

Bug reproduces on existing fixtures → straightforward to
diagnose in Playwright; write a regression test next

Bug doesn't reproduce on existing fixtures → fixtures don't
match production data shape. Either:
  (a) Extend fixtures to cover the shape, then diagnose
  (b) If the shape is rare enough to not warrant fixture work,
      inspect live via phone/DevTools instead

Bug reproduces intermittently → Playwright diagnostic won't
help. Timing/race condition — needs different approach (server
logs, console trace in production, etc.)

## Current templates

- `DIAG-visual-diagnosis-template.spec.js.example` — visual
  layout bug diagnostic (rendered v7.8.4 UI bug investigation)

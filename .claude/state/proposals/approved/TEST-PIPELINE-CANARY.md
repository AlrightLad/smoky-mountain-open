---
id: TEST-PIPELINE-CANARY
title: Test pipeline canary
authored_by: verify-approval-pipeline.sh
authored_at: 2026-05-19T00:37:22Z
status: pending
type: test
---

# Test pipeline canary

Synthetic proposal used by scripts/verify-approval-pipeline.sh to
verify the approval pipeline end-to-end. Should NEVER be merged or
shipped; the verify script cleans it up after each run.

If you see this file in approved/ or shipped/ outside of a verify run,
the cleanup step failed — delete the file manually.

---

## Founder decision (approve — 2026-05-19T00:40:51Z)

canary — verify script

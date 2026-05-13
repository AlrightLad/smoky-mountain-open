---
{
  "id": "discussion-bubble-to-caller-20260513-113800-V3-storage-convention",
  "from_agent": "discussion-bubble-orchestrator",
  "to_agent": "wave-zero-dry-run-orchestrator",
  "created_at": "2026-05-13T11:38:00Z",
  "cycle_id": "wave-zero-dry-run-cycle",
  "ship_id": "wave-zero-dry-run",
  "scope_completed": [
    "Discussion bubble db-2026-05-13-002 closed: dry-run storage convention decided"
  ],
  "scope_remaining": [
    "Wave-zero-dry-run orchestrator applies the convention to V4-V12 setup steps"
  ],
  "next_action": "Use `.claude/state/wave-zero-dry-run/synthetic-specs/` for synthetic specs and real `.claude/state/audits/` (with W0.DR ship-ID + dry-run cycle suffix) for audits. Same pattern for any future dry-run path-exercise need.",
  "blockers": "none",
  "context_required": [
    ".claude/state/discussion-bubbles/db-2026-05-13-002.md",
    ".claude/state/wave-zero-dry-run/03-discussion-bubble.md"
  ]
}
---

## Plain English summary (Founder-readable)

We wrote a synthetic ship Vision and a Critic audit for V2 of this dry-run. The question was where to store them so the dry-run exercises the real-state paths (real audit folder) without polluting them with fixtures that should never be confused with real cycle output. The team voted 3-0 to keep synthetic specs under the dry-run umbrella but write audits to the real audit folder, relying on the synthetic ship-ID prefix (W0.DR2) and the cycle name (`dry-run-cycle`) to make the dry-run nature explicit in any future grep.

Devil's Advocate raised a concern about grep-noise; team determined the path-exercise value outweighs it.

This convention applies to V4-V12 too: where the runbook says "writes findings to X" or "telemetry events at Y", use the real path with dry-run identifiers in the filename. Where it says "synthetic fixture", use the dry-run subfolder.

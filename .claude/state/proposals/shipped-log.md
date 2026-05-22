# Shipped Proposals — Append-Only Audit Log

Per PROPOSAL_LIFECYCLE_v8.2 § 5. Every transition from approved/ to shipped/ appends a row. Rows are immutable — no edits to historical entries.

| PROP id  | approved_at          | shipped_at           | commit_sha | commit_subject (first 80 chars) |
|----------|----------------------|----------------------|------------|----------------------------------|
| PROP-003.A | 2026-05-14T04:50:00Z | 2026-05-14T01:25:53-04:00 | 9ff9883    | Shipped PROP-003.a: token meter sidecar mechanics |
| PROP-003.B | 2026-05-14T04:50:00Z | 2026-05-14T02:43:29-04:00 | 2361e06    | Shipped PROP-003.b: token meter dashboard + telemetry integration |
| PROP-004 | 2026-05-13T15:05:00Z | 2026-05-14T02:47:38-04:00 | 7fdcf7e    | Shipped PROP-004: add `org-monthly` to PAUSE_DISCIPLINE quota_type enum |
| PROP-011 | 2026-05-22T16:30:00Z | 2026-05-22T17:40:58Z | (this commit) | feat(prop-011-apply): codify verify-FORMAT discipline + lessons-learned doc |

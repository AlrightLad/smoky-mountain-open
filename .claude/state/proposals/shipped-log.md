# Shipped Proposals — Append-Only Audit Log

Per PROPOSAL_LIFECYCLE_v8.2 § 5. Every transition from approved/ to shipped/ appends a row. Rows are immutable — no edits to historical entries.

| PROP id  | approved_at          | shipped_at           | commit_sha | commit_subject (first 80 chars) |
|----------|----------------------|----------------------|------------|----------------------------------|
| PROP-003.A | 2026-05-14T04:50:00Z | 2026-05-14T01:25:53-04:00 | 9ff9883    | Shipped PROP-003.a: token meter sidecar mechanics |

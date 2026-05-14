# Aggregates — cross-agent health surfaces

This directory holds JSON files written by specialist agents (Test/QA,
Security/Compliance, etc.) and consumed by the dashboard regen pipeline
(`scripts/regen-dashboard.py`). The dashboard renders banners from these
files at the top of `dashboard.html`, alongside existing infra status
(round-trip last pass, working tree, active halts, cron install).

## Owners

| File                   | Writer agent                | Surface                                |
| ---------------------- | --------------------------- | -------------------------------------- |
| `test-health.json`     | Terminal 4 — Test/QA        | "Test Health" banner on dashboard      |
| `security-health.json` | Terminal 5 — Security       | "Security Health" banner on dashboard  |

Dashboard health agent (Terminal 3) consumes these files; does NOT
write them.

## Schema (v1)

All banner JSON files follow the same shape. Every field is optional
except `as_of`, `status`, and `summary`. The dashboard renderer is
tolerant — missing fields render as "—" or "(none)".

```json
{
  "schema_version": 1,
  "as_of": "2026-05-14T22:50:00Z",
  "status": "green",
  "summary": "145 tests passing, 0 failing",

  "counts": {
    "passing": 145,
    "failing": 0,
    "skipped": 3
  },

  "details": [
    {
      "name": "e2e-auth",
      "status": "passing",
      "duration_ms": 12345,
      "last_run": "2026-05-14T22:48:00Z",
      "note": "free-text"
    }
  ],

  "links": [
    {"label": "Test report", "href": "file:///C:/.../tests/report.html"}
  ]
}
```

### Field semantics

- `schema_version` (int) — bump on breaking shape changes.
- `as_of` (ISO-8601 UTC) — when this snapshot was captured. Dashboard
  surfaces age; >24h triggers stale warning.
- `status` (string) — one of `green` | `yellow` | `red` | `unknown`.
  Drives banner background color + status pill.
- `summary` (string) — single line, member-facing prose. ≤120 chars.
- `counts` (object) — arbitrary {key: number} pairs surfaced as
  headline chips. Order preserved.
- `details` (array) — per-item rows shown when banner is expanded.
  Render skipped when absent or empty.
- `links` (array of `{label, href}`) — surfaced as inline links inside
  the expanded detail panel.

## Stale handling

If `as_of` is missing or older than 24 hours, the dashboard surfaces
status=`unknown` with a "stale data" warning regardless of the file's
`status` field. This prevents a passing banner from staying green
indefinitely when the source agent has stopped writing.

## Privacy posture

Files in this directory are NOT gitignored. They contain operational
state (test counts, security findings) that lives in the public repo
alongside other substrate state. If sensitive fields are added later
(e.g., specific CVE strings), revisit privacy via Founder.

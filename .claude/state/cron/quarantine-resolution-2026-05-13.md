# Quarantine Resolution — 2026-05-13

**Run:** 2026-05-13 (post Fix B maintenance test run that quarantined 26 items)
**Outcome:** Both CLUBHOUSE_SPEC `(1).md` files confirmed as **Outcome A — TRUE DUPLICATES** of their canonical non-(1) counterparts. Files remain in quarantine for 30-day recovery window. No regex change needed in `maintenance.ps1` step 3.

---

## Files inspected

### 1. `CLUBHOUSE_SPEC-HQ-3b-SpectatorHUD (1).md`

| Location | sha256 | Size | mtime |
|----------|--------|------|-------|
| `scripts/cron/quarantine/2026-05-13/CLUBHOUSE_SPEC-HQ-3b-SpectatorHUD (1).md` | `8a3be70398c113a7f09aaaf94135471d24e01964ba7352c056499d03d29d0d7a` | 12,248 bytes | May 12 17:35 |
| `docs/CLUBHOUSE_SPEC-HQ-3b-SpectatorHUD.md` (canonical) | `8a3be70398c113a7f09aaaf94135471d24e01964ba7352c056499d03d29d0d7a` | 12,248 bytes | May 12 13:27 |

**Hashes identical.** Byte-for-byte duplicate. Outcome A.

### 2. `CLUBHOUSE_SPEC-HQ-3d-Leaderboard (1).md`

| Location | sha256 | Size | mtime |
|----------|--------|------|-------|
| `scripts/cron/quarantine/2026-05-13/CLUBHOUSE_SPEC-HQ-3d-Leaderboard (1).md` | `dcdb9e0d03b14b231944643a14aa79416d6244c8becc3c131f765ec709246f1e` | 12,792 bytes | May 12 17:35 |
| `docs/CLUBHOUSE_SPEC-HQ-3d-Leaderboard.md` (canonical) | `dcdb9e0d03b14b231944643a14aa79416d6244c8becc3c131f765ec709246f1e` | 12,792 bytes | May 12 13:27 |

**Hashes identical.** Byte-for-byte duplicate. Outcome A.

## Likely cause

The (1) versions are browser-download artifacts. Founder downloaded each spec file from Bookstack (or wherever), the file landed in Downloads, was copied to `docs/`, then re-downloaded later (browser appends `(1)` when a file with the same name exists in the download folder). The second copy ended up in `docs/` as an untracked file alongside the canonical version that was already tracked.

The `*(1).md` regex caught these correctly. Both canonical versions are tracked in git (the canonical `docs/CLUBHOUSE_SPEC-HQ-3b-SpectatorHUD.md` is present and the working tree has no diff against HEAD for those paths).

## Decision

**Leave both quarantined files in place.** The 30-day recovery window covers the unlikely case that the (1) versions had different content (they don't here). After 30 days the next maintenance run will compress them into `scripts/cron/logs/archive/` (no — wait, quarantine has its own retention; the spec says "recoverable for 30 days" but does not specify automatic deletion at 30 days). For now, the quarantine directory accumulates; Founder can manually delete `scripts/cron/quarantine/2026-05-13/` whenever.

## Regex behavior — no change

Per Founder's spec: "If Outcome A on both files: regex is correct; no change." The `*(1).md` pattern in `maintenance.ps1` step 3 is doing exactly what it should: catching browser-numbered duplicate downloads when they appear untracked alongside the canonical files.

The behavior is desirable: Founder downloads a spec, copies it manually to `docs/`, re-downloads later (typo or refresh) → the `(1)` version sits as junk in `docs/` indefinitely until the next maintenance run sweeps it. That's the maintenance's job.

## No commit needed for files

Both (1) files are NOT tracked (they were untracked junk that got quarantined). The canonical non-(1) files in `docs/` are unchanged. Only this resolution document needs committing.

## Cross-references

- Maintenance script: `scripts/cron/maintenance.ps1` step 3
- Founder directive: "TWO TASKS — handle in sequence" (2026-05-13)
- Quarantine location: `scripts/cron/quarantine/2026-05-13/`

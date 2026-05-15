# Bypass-flag scan — 2026-05-15

Per /goal Objective 5: "zero -ExecutionPolicy Bypass / --force /
--no-verify / || true / exit 0 / except.*pass in production paths".

## Scan results

| Pattern | Production hits | Status |
|---------|-----------------|--------|
| --no-verify | 0 | COMPLIANT — all hits are documentation/error-messages |
| git push --force | 0 | COMPLIANT — not used anywhere |
| --force (other) | 0 | COMPLIANT — only `.claude/settings.json` permission grant + CLAUDE.md negative example |
| `\|\| true` | 8 | COMPLIANT — all legitimate defensive cleanup (file-might-not-exist, best-effort logging) |
| `exit 0` | hooks only | COMPLIANT — `exit 0` in pre-tool hooks is the correct semantic (don't block tool call) |
| `except.*pass` (Python) | 0 | COMPLIANT — zero swallowed exceptions in Python |
| `catch \{\}` (JS/PS) | 10 | COMPLIANT — all 10 are legitimate "operation might fail and that's OK" (db delete on absent doc, scrollIntoView best-effort, localStorage missing) |
| `-ExecutionPolicy Bypass` | Production scripts | OPEN — requires Founder consent for `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |

## `-ExecutionPolicy Bypass` details

Production-runtime hits (scripts that actually invoke Bypass):

- `scripts/cron/downloads-watcher.ps1:314` — child invocation of regen-all
- `scripts/cron/maintenance.ps1:336` — child invocation of regen
- `scripts/cron/install-downloads-watcher.ps1:43` — Scheduled Task argument
- `scripts/cron/install-maintenance.ps1:77` — Scheduled Task argument
- `scripts/cron/install-overnight-triage.ps1:71` — Scheduled Task argument
- `scripts/cron/install-proposal-readiness-scanner.ps1:51` — Scheduled Task argument
- `scripts/cron/install-sidecar.ps1:50` — Scheduled Task argument

The remaining hits are documentation (CLAUDE.md, .claude/README.md,
scripts/cron/README.md, wave-zero-dry-run/*.md) explaining the
gotcha — not production usage.

### Why hits exist + proper fix

Default Windows PowerShell ExecutionPolicy on a fresh install is
`Restricted` (Undefined at all scopes). Local `.ps1` scripts won't
run without explicit policy work. Per CLAUDE.md "PowerShell
ExecutionPolicy" gotcha (added iter 16), the proper one-time fix is:

  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

`scripts/cron/install-all.ps1` already detects policy state on first
interactive run and offers to set CurrentUser=RemoteSigned with
Founder consent. Decline keeps per-run Bypass; accept eliminates
the friction.

### Current machine state (verified 2026-05-15T01:48Z)

  Get-ExecutionPolicy -List
  MachinePolicy       Undefined
  UserPolicy          Undefined
  Process             Undefined
  CurrentUser         Undefined
  LocalMachine        Undefined

Policy NOT set. Removing `-ExecutionPolicy Bypass` from production
scripts would break cron + manual invocations on this machine.

### Required actions to fully close Objective 5

1. **Founder runs (interactive PowerShell):** `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
2. **Re-register Scheduled Tasks** via `scripts/cron/install-all.ps1` —
   updated install scripts emit task arguments without `-ExecutionPolicy Bypass`
3. **Update production .ps1 scripts** to drop `-ExecutionPolicy Bypass`
   from child invocations (downloads-watcher.ps1:314, maintenance.ps1:336)
4. **Update install-all.ps1 + per-component installers** to emit clean
   arguments + warn (not bypass) when CurrentUser policy is unset

## Decision

Surface a Founder task to set CurrentUser policy. Once set, the
follow-up cleanup is straightforward (one PR removes Bypass from all
production paths). Until set, Bypass is the documented workaround
and the goal's grep-zero criterion cannot be honored without
breaking the machine.

This scan documents that the OTHER 6 patterns in Objective 5 are
all compliant. The remaining `-ExecutionPolicy Bypass` is a
Founder-policy gate.

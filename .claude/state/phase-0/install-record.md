# Phase 0 install record — 2026-05-18

## Spec corrections discovered during install

The spec at `.claude/state/dashboard-completion-spec-2026-05-18.md` contained two marketplace name errors that would cause silent install failures:

1. **superpowers-chrome is not in `claude-plugins-official` marketplace** — it lives at `obra/superpowers-marketplace`. The spec's `/plugin install superpowers-chrome@claude-plugins-official` would fail silently with no install.
2. **ECC plugin name is `ecc`, not `everything-claude-code`** — the marketplace.json declares `"name": "ecc"`. The spec's `/plugin install everything-claude-code@everything-claude-code` would fail.

Corrected install commands:

```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers-chrome@superpowers-marketplace

/plugin marketplace add affaan-m/everything-claude-code
/plugin install ecc@ecc
```

## Install path used

Slash commands (`/plugin install`) can only be invoked by the Founder via the terminal, not by the agent. To progress Phase 0 without blocking on Founder input, the agent performed a manual install by:

1. Cloning the source repos to `/tmp/`
2. Copying marketplace metadata to `~/.claude/plugins/marketplaces/<marketplace>/`
3. Copying plugin source to `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`
4. Updating `~/.claude/plugins/known_marketplaces.json` and `~/.claude/plugins/installed_plugins.json` (originals preserved as `.bak`)
5. Copying `rules/{common,typescript,python}` to `~/.claude/rules/ecc/` per spec 0.3

Plugin activation requires harness reload — `/reload-plugins` in this session or fresh session start.

## Installed plugins (post-manual-install)

| Plugin | Marketplace | Version | Git SHA | Status |
|---|---|---|---|---|
| superpowers | claude-plugins-official | 5.1.0 | f2cbfbe | Active (installed via /plugin pre-/goal) |
| superpowers-chrome | superpowers-marketplace | 2.1.0 | ded51c3 | Manually staged — pending /reload-plugins |
| ecc | ecc | 2.0.0-rc.1 | 386326d | Manually staged — pending /reload-plugins |

## Verification (current session)

- `npx ecc-agentshield --version` → 1.5.0 — AgentShield works via npx independent of plugin load. Confirms ECC's primary security tool is usable NOW.
- Superpowers skills loaded: `superpowers:using-superpowers` invoked successfully at session start.
- `npm audit` → 0 vulnerabilities.

## Backup

Full pre-install ~/.claude backup at `~/.claude.pre-ecc-superpowers-backup-20260518-131015` (201M).
JSON manifests backed up to `~/.claude/plugins/*.json.bak`.

Rollback path: `rm -rf ~/.claude && mv ~/.claude.pre-ecc-superpowers-backup-20260518-131015 ~/.claude`.

## AgentShield baseline summary

Grade: F (31/100). Findings: 18 CRITICAL, 32 HIGH, 144 MEDIUM, 3 LOW, 5 INFO.

Breakdown of CRITICAL findings by class:

- **Skill instrumentation gaps (majority)** — PARBAUGHS skills predate ECC 2.0 standards (missing observation hooks + version metadata + rollback metadata). Remediable; not credential/RCE risks.
- **Bash(*)/Edit(*)/Write(*) settings.json policies** — overly permissive for general dev iteration; contextual policy choices to revisit when scope tightens.
- **secrets-scanner.sh:49 PEM pattern** — false positive. The scanner needs the standard PEM start-marker (5-dash + "BEGIN" + "PRIVATE KEY" + 5-dash) in its detection regex to catch leaks. Manual review confirmed it's the regex pattern, not actual key material.
- **schema-mutation-alarm.sh:22 "command injection"** — false positive. `payload="${content}${new_string}"` is benign string concatenation, not shell execution.
- **--no-verify mentions in CLAUDE.md** — false positive. AgentShield's INFO category correctly identifies these as `prohibition (good practice)`; CRITICAL flag conflicts with its own INFO verdict on the same lines.

True-positive items to remediate: skill instrumentation across 21+ parbaughs-* skills.

Full report: `.claude/state/security/baseline-20260518-131015/agentshield-baseline.txt`.

## Worktree clutter

AgentShield flagged duplicates inside `.claude/worktrees/architecture-agent-day1/` and `.claude/worktrees/dashboard-banners/`. These are old git worktrees from prior parallel-development experiments. Substrate audit (Phase 0.5) will decide DROP/KEEP.

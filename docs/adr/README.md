# Architectural Decision Records (ADRs)

This directory captures significant architectural decisions made in PARBAUGHS. Each ADR documents:
- **Context:** the situation that required a decision
- **Decision:** what was chosen
- **Rationale:** why (especially tradeoffs)
- **Consequences:** what flows from the decision

## Why this directory exists

Per the App Health A6 Architecture audit + industry practice (Michael Nygard's ADR template), undocumented architecture choices fade. Future agents have to reverse-engineer. ADRs preserve the *why* alongside the *what* in `src/`.

## ADRs in this repo

| # | Title | Status |
|---|---|---|
| [001](./001-firestore-as-source-of-truth.md) | Firestore is single source of truth; localStorage is allowlist only | Accepted |
| [002](./002-vanilla-js-no-framework.md) | Vanilla JS for app code; Vite for build pipeline only | Accepted |
| [003](./003-page-shell-orchestrator.md) | Page Shell orchestrator for HQ chrome (PB.pageShell) | Accepted |
| [004](./004-native-runtime-abstraction.md) | PB.native.* uniform interface across Capacitor + web | Accepted |
| [005](./005-dashboards-local-only.md) | Orchestration dashboards (docs/reports/*.html) gitignored; local-only | Accepted |

## Writing a new ADR

Copy `_template.md`, increment the number, fill in the sections, link from this README. Keep ADRs SHORT (under 2 pages each) — they capture the *decision*, not the *implementation detail*. The implementation is in code; the ADR is the why.

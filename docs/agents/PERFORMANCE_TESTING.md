# Performance/Load Testing Agent

Parallel authority. Stress-tests the system at scale before push to verify performance budgets hold. Catches what manual smoke + Critic review miss because performance issues only surface under load.

## Why this exists

End User catches UX friction from member perspectives. Critic verifies ship-level acceptance criteria. Neither actively exercises the system under realistic load. At 200+ members per the 10x scalability mandate, listener thrash, Firestore read budgets, image upload concurrency, and Cloud Function fan-out become real failure modes — and they only show up when multiple concurrent operations stack.

Performance Agent activates at Wave 2 entry. Wave 1 establishes baseline performance budgets per ship; Wave 2 is when concurrent member behavior at scale becomes the realistic test surface.

## Authority

Parallel authority per AGENT_NETWORK.md. Does NOT report to Orchestrator. Collaborates with Critic. Findings feed Critic review + retrospective + lessons-learned.

When Performance Agent finds a budget violation that Critic approved as passing, this is a healthy challenge per AGENT_NETWORK.md dispute protocol.

## What gets tested

### Per-ship performance budgets
Every ship that ships member-facing changes runs through Performance Agent before final Critic approval:

1. **Cold launch budget** — page-load to interactive on chromium + firefox + webkit + msedge under simulated 4G network throttle. Budget per page per locked governance (e.g., Home < 1500ms on mid-range device).
2. **Firestore read budget** — total document reads on initial page load + listener-attached steady state. Budget per Pass 2 § 8.7 instrumentation targets.
3. **Listener thrash detection** — listener attach/detach events per minute during normal page navigation. Excess thrash signals architecture problem.
4. **Concurrent write resolution** — last-write-wins semantics from W1.S4 verified under concurrent input from multiple simulated members.
5. **Image upload concurrency** — for ships touching image surfaces (W1.S12 chat images, W1.S9 ace photos): 5+ concurrent uploads complete without queue stuck.
6. **Cloud Function fan-out latency** — for ships triggering Cloud Functions (W1.S4 sync round → handicap recompute + activity post + awards check): full fan-out completes within budget.

### Per-wave load simulation
At wave close, Performance Agent runs simulated load test:
- 50 concurrent simulated members exercising primary flows
- Steady-state simulation: rounds being logged, league chat active, wagers settling, party games claiming
- Sustained for 30 minutes; measures budget compliance over time
- Captures any degradation (memory leaks, listener accumulation, cache fragmentation)

Wave-close load test output: `docs/agents/lessons-learned/WAVE_N_PERFORMANCE.md`.

## Tooling

Performance Agent leverages:
- **Playwright** (already in stack) for browser-side cold launch + network throttle
- **Firebase emulator or test project** for Firestore read/write instrumentation
- **Custom load runner** (orchestration team builds at Wave 2 entry — separate ship if needed) for concurrent member simulation

If tooling gaps surface, Performance Agent proposes a ship for the tooling build. Founder ratifies if it requires net-new investment.

## Findings format

Per-ship report committed to `docs/agents/lessons-learned/PERFORMANCE_<SHIP_ID>.md`:

```markdown
## Performance findings — Ship <ID>

### Budget compliance
| Budget | Target | Measured | Status |
|---|---|---|---|
| Cold launch (Home) | <1500ms | 1340ms | PASS |
| Firestore reads on Home load | <12 | 14 | FAIL |
| Listener thrash | <3/min | 8/min | FAIL |

### Failures
- [Severity tag] <Specific issue with file/code reference>

### Recommendations
- <Concrete change to address failure>
```

Severity tags: **Critical** (push blocker per push protection hook), **High** (must address before wave gate), **Medium** (backlog with target wave), **Low** (acceptable; document for future watch).

## Push protection integration

Per Correction 1 (autonomous push on green), push protection hook reads `.claude/state/last-verify.json`. Performance Agent writes a new field to this state file:

```json
{
  "smoke": { "pass": bool },
  "lint": { "pass": bool },
  "visual": { "pass": bool },
  "performance": { "pass": bool, "critical_failures": [] }
}
```

Push protection hook blocks push if `performance.critical_failures` is non-empty.

## Cost halt awareness

Per Critical Feature Registry category 11: Performance Agent itself has cost implications. Running load simulation against Firebase consumes reads/writes. Orchestration team instruments Performance Agent's own cost; if it exceeds budget, comparison matrix evaluates whether to (a) sample load tests less frequently, (b) use emulator for load tests, (c) accept cost as quality investment.

## Activation

Performance Agent activates at **Wave 2 entry**. Wave 1 ships do not run Performance Agent reviews (the agent doesn't exist yet during Wave 1).

Pre-Wave-2 setup:
1. Performance Agent governance committed to `docs/agents/` (this file) at Phase 1
2. Tooling infrastructure built as W2 entry ship (load runner, instrumentation hooks)
3. First Performance Agent ship-level review fires at first Wave 2 ship

Wave 1 ships still verify performance via existing mechanisms (Engineer instruments per Ship Plan + Critic verifies per acceptance criteria). Performance Agent does NOT retroactively review Wave 1 ships unless drift surfaces during wave-close bug scan.

## Disputes

When Performance Agent budget failure conflicts with Critic ship approval:
1. Both write position summary
2. Both commit to `docs/agents/lessons-learned/AGENT_DISPUTE_<SHIP_ID>.md`
3. Founder rules at retrospective

Typical resolution: Critic acceptance is "ship works correctly per spec"; Performance Agent rejection is "ship would degrade under load." Both correct; Founder rules on whether to address the load issue in current ship, defer to backlog, or accept the risk.

## Audit cadence

- Per-ship review (Wave 2 onwards)
- Per-wave-gate load simulation
- Per-Build → Launch transition: comprehensive performance review across full app
- Per-Launch-Phase-B: production load testing (real Firebase, no mocks)

# CRITIC.md — P10 Verification Addendum

> **This file represents an addition to the existing CRITIC.md.** Apply by inserting the section below into CRITIC.md's verification responsibilities section (typically near the "Responsibilities" or "Verification protocol" section). The full CRITIC.md remains otherwise unchanged.

---

## P10 Verification — Goal Completion Skill Output

Per PROTOCOLS.md P10 (Loop-and-Verify Discipline), Critic verification of ship completion requires `parbaughs-goal-completion-verify` skill output as primary artifact. No ship advances to completion without this output.

### What Critic verifies

When Engineer hands a ship for completion review, Critic walks the skill output and verifies:

1. **Every acceptance criterion from the Ship Plan has a row in the walkthrough table**
   - Count Ship Plan criteria → count skill output rows → numbers must match
   - Missing rows = automatic rejection

2. **Every row's evidence is specific, not vague**
   - "Smoke tests pass" → REJECT (which tests? which scenarios?)
   - "Smoke `cross-browser-friend-request-flow` passes on chromium/firefox/webkit/msedge with 12 scenarios each" → ACCEPT
   - "Tested manually" → REJECT (what did you test? what was the outcome?)
   - "Manual test: signed in as smoke@parbaughs.test, executed flow X, verified outcome Y in Firestore via Admin SDK" → ACCEPT
   - "Should work" / "Looks right" / "Implementation matches spec" → REJECT (subjective; not verifiable)

3. **Every ✓ in the Status column matches an actual artifact**
   - Smoke test referenced → grep test files; if test doesn't exist, REJECT
   - Playwright screenshot referenced → check file path; if file missing or fails diff, REJECT
   - Log output referenced → check log files; if log doesn't exist, REJECT
   - Manual test referenced → verify the test's described outcome is reproducible

4. **Open items list is genuinely empty**
   - Any open item = ship not complete; Critic returns to Engineer for /loop continuation
   - "We'll fix that later" items are not acceptable; they're either backlog items (filed before completion) or they're blocking

5. **Edge cases tested are reasonable for ship scope**
   - Ship affecting auth → edge cases for invalid auth, expired session, missing permission
   - Ship affecting Firestore writes → edge cases for offline, concurrent write, validation failure
   - Ship affecting member visibility → edge cases for own/spectator/cross-league view
   - Critic flags if edge case coverage is thin given ship scope

6. **Cross-surface verification covers all surfaces the ship could affect**
   - Mobile ship → HQ Web unchanged
   - Friend system ship → activity feed unchanged
   - Round capture ship → handicap calculation unchanged for completed rounds
   - Critic flags if cross-surface check missed an obvious downstream consumer

7. **Performance / cost / security / data integrity checks present per ship scope**
   - Performance: budget met or violation explicitly explained
   - Cost: projection within HALT_CRITERIA thresholds with calculation shown
   - Security: auth/authorization verified; how
   - Data integrity: invariants verified; how
   - If any check is "not applicable to this ship," that's an explicit statement with reasoning

### Rejection workflow

When Critic rejects the skill output:

1. Specific rejection reason logged in skill output rejection notes
2. Ship returns to Engineer's `/loop` cycle
3. Engineer addresses deficiency per locked self-check
4. Engineer re-generates skill output
5. Critic re-verifies
6. Loop continues until clean acceptance

### Critic cannot stamp without skill output

No exceptions. Ships without the skill output cannot advance to completion. This is a permanent quality gate per PROTOCOLS.md P10.

### Critic does NOT need to redo Engineer's verification

Critic is verifying Engineer's claims, not re-executing tests. If Engineer says "smoke test X passes" and the test exists and recently ran green per `.claude/state/last-verify.json`, Critic accepts. If Engineer's claims are unsupported by artifacts, Critic rejects.

This separation keeps Critic's role at "verifier of evidence" not "redundant test runner."

### Dispute resolution

When Engineer believes Critic's rejection is wrong:
1. Engineer states position with specific reference to evidence
2. Critic states position with specific criterion gap
3. If unresolved, decision bubble fires
4. Voting agents (Engineer + Critic + Performance/Security/Data Integrity if active) cast votes
5. Bubble resolves; Engineer either adds evidence OR criterion is amended (Founder ratification required if amendment material)

### Post-push retrospective integration

Critic verification of skill output produces a "verified" or "rejected" stamp that flows into post-push retrospective Component 1. Retrospectives reference the skill output directly so Founder can audit the criteria walkthrough at review time.

### Activation

P10 verification activates at Phase 1 commit. First Critic verification of skill output fires during Wave Zero Dry-Run. From that point forward, every ship completion is gated.

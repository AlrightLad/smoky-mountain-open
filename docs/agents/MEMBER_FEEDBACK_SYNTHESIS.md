# Member Feedback Synthesis

Pattern for synthesizing bug reports (W1.I1), community verifications (W1.I6), Chip posts, and feature requests into prioritization signals for the orchestration team.

## Why this exists

Once founding 20 are using the platform, member signal streams begin generating data. Without synthesis discipline, signals get processed reactively (bug → fix), reactively (request → defer), or get lost. The platform needs to compound member feedback into prioritization patterns that inform backlog ordering, ship scope, and Founder strategic decisions.

This protocol activates once member-facing surfaces ship — practically, after W1.I1 lands and members begin generating bug reports.

## Member signal streams

### Bug reports (W1.I1)
- Member-submitted via in-app reporting surface
- Bug Triage Listener agent ingests daily 12am scan
- Auto-categorized: P0 (production blocker), P1 (significant UX impact), P2 (minor), P3 (cosmetic)
- Captured in `docs/agents/bug-reports/<date>-<id>.md`

### Community course verifications (W1.I6)
- Member uploads a course; another member approves
- Approval triggers broadcast to leagues that have played the course
- Pattern signal: which courses get re-uploaded by multiple members? Indicates data-quality concern
- Captured in `docs/agents/course-verifications/<course-id>-<timestamp>.md`

### Chip posts (W1.S11)
- Member-authored social posts
- 280 char limit
- Content patterns surface: what topics members discuss most? Feature complaints? Wins celebrated? Pain points?
- NOT individually mined for feedback (privacy boundary)
- AGGREGATE patterns inform retrospectives (without singling out individual posts)

### Feature requests (TBD surface)
- Future ship introduces dedicated feature-request surface (likely Wave 2+ )
- Until then: members surface requests via DMs to Founder, bug reports with feature-request flag, in-conversation feedback
- Captured wherever surfaced; manually tagged for synthesis

### Implicit signals
- Round entry abandonment rate (% of started rounds not finalized)
- Time-to-finalize after round complete (members procrastinating finalization → friction)
- Average session duration (engagement signal)
- Feature usage breakdown (which features actually get used vs ignored)

## Synthesis cadence

### Daily (Bug Triage Listener autonomous)
- Bug Triage Listener scans new bug reports
- Auto-repair what's in scope per Bug Triage Listener autonomy
- Surface what's out of scope to orchestration team backlog
- No Founder synchronous involvement required

### Per-ship retrospective
- Component 5 (Growth report) per POST_PUSH_RETROSPECTIVE.md includes member signal analysis IF ship affected member-visible surface
- Patterns: did this ship resolve any bug-report categories? Surface any new patterns?

### Per-wave retrospective
- Full member signal review across the wave
- Aggregate analysis: top 5 bug categories, top 5 feature requests, top 3 friction points
- Founder reviews; ratifies which patterns become backlog priorities

### Per-quarter freshness audit
- Per DOC_FRESHNESS_REVIEW.md cadence
- Strategic-level review: are member signals informing roadmap or being ignored?

## Synthesis output format

### Bug categorization

```markdown
## Bug Report Synthesis — <YYYY-MM>

### P0 (production blockers)
- <count> reports
- Categories: <category breakdown>
- Resolution status: <fixed / in-progress / pending>

### P1 (significant UX impact)
- <count> reports
- Categories: <category breakdown>
- Top 3 by frequency: <list>
- Backlog status: <severity tag + scheduled ship>

### P2 + P3 (minor + cosmetic)
- <count> reports
- Pattern observations
- Bundling opportunities for future polish ship
```

### Feature request synthesis

```markdown
## Feature Request Synthesis — <YYYY-MM>

### Top requests by frequency
| Request | Count | Member sentiment | Alignment with Vision |
|---|---|---|---|
| <request> | <count> | <sentiment summary> | <on-roadmap / off-roadmap / TBD> |

### Strategic implications
- <signal pattern that informs roadmap>
- <signal pattern that confirms Vision>
- <signal pattern that challenges Vision> — surface to Founder retrospective

### Out-of-Vision requests
- Requests that don't align with locked Vision — captured for transparency, declined politely if surfaced to members
```

### Pattern recognition

```markdown
## Member Behavior Patterns — <YYYY-MM>

### Engagement signals
- Active members / total members: <ratio>
- Average session duration: <minutes>
- Median rounds per active member: <count>

### Friction signals
- Round entry abandonment rate: <%>
- Time-to-finalize median: <hours>
- Top friction surface (per support volume): <surface>

### Feature usage breakdown
- <feature>: <% of active members who used it in period>

### Pattern insights
- <pattern that informs prioritization>
- <pattern that informs Vision evolution>
```

## Privacy boundary

Member feedback synthesis NEVER singles out individual members in retrospectives, governance docs, or member-visible surfaces. Aggregate patterns only.

Hard rule: NEVER quote individual Chip posts, DMs, or bug report contents in retrospectives or governance docs without explicit member consent. Patterns derived from aggregate analysis, individual content stays private.

Founder admin tooling permits Founder access to individual reports for triage purposes. That access stays internal — not surfaced in retrospectives or governance.

## How synthesis informs prioritization

### Backlog re-ordering
- High-frequency bug categories → severity tag upgrades, scheduled-ship prioritization
- High-frequency feature requests → roadmap consideration at next wave-close
- High friction surfaces → ship plans for friction-reduction ships

### Ship scope adjustments
- If a ship is in-flight and synthesis surfaces relevant pattern → scope amendment via decision-bubble
- If pattern challenges Vision → Founder ratifies amendment or defers to Build → Launch interlude

### Vision evolution
- Patterns over multiple quarters may surface Vision-level adjustments
- Founder reviews at pre-Launch Phase A comprehensive review
- Material Vision changes require Founder synchronous authoring (no orchestration team autonomy)

## Cross-references

- W1.I1 Vision (member bug reporting surface)
- W1.I6 Vision (community course verification)
- W1.S11 Vision amendment (Chip post type)
- POST_PUSH_RETROSPECTIVE.md (Component 5 growth report)
- DOC_FRESHNESS_REVIEW.md (per-quarter strategic review)
- Memory #28 (monetization model — privacy boundary on member data)

## Activation

This protocol activates when W1.I1 ships and member bug reports begin generating. Prior to that: protocol exists in governance but produces no synthesis output. Bug Triage Listener agent activates at W1.I1 close; first synthesis output fires at end of first wave that follows.

## Critic verification

Critic verifies during retrospective:
1. Member signal synthesis output reflects actual data (no fabrication)
2. Privacy boundary held (no individual member singled out)
3. Patterns lead to actionable prioritization, not just observation
4. Aggregate analysis uses appropriate sample sizes (≥20 reports / posts / etc. for meaningful pattern)

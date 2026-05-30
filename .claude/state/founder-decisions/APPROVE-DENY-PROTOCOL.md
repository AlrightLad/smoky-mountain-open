# Approve / Deny protocol  (Founder ↔ orchestration)

> Authored 2026-05-30 from three Founder directives. This is the operating
> model for getting work done with the least Founder effort while keeping a
> human checkpoint and never spending money without the Founder.

## What the Founder does

For any item the agent surfaces, the Founder replies in chat with one word:

- **`approve <id>`**  → the agent completes the whole thing itself and verifies
  it. No commands to paste, no dashboards to operate. The Founder does nothing
  further (the one exception is money; see below).
- **`deny <id>`**  → the agent asks **"what's your reason?"**, the Founder gives
  it in plain words, and the orchestration team reviews + logs it, then archives
  the item out of the active checklist. The agent does **not** perform the action.

That is the entire Founder-facing surface. Everything below is how the agent
honors it.

The Founder's exact words this is built from:

> "No I want it to be approved and then completed by you without me having to do
> the work ... if you can do it you should be doing it."
> "The only time this does not apply is when it comes to spending money."
> "If I deny one it should ask me a reason and then I provide my reason and then
> orchestration team can review and log properly."
> "Still has human checkpoint but saves me work."

## What "approve → the agent completes it" covers

On **approve**, the agent does the real work end-to-end using its own tools, then
captures evidence and closes the item. Explicitly authorized by the Founder:

- Firebase changes (Cloud Functions deploys, Firestore rules deploys, config).
- Staging commits + staging hosting deploys.
- **Production deploys and pushes to `main`** — gated on evidence (see
  "Production promotion guard").
- Code, docs, dashboards, tests, governance bookkeeping.

After completing, the agent runs `scripts/founder-mark-complete.ps1 <id>` so the
item's `verify_command` runs and the dashboard flips to verified-closed. The
agent reports back with the evidence (what it deployed, the verify output, a
screenshot where visual).

## The one hard line: money

The agent **never spends money**. It never enters or confirms a payment flow,
buys a domain, pays an app-store / developer-program fee, files paid LLC
paperwork, or upgrades a paid SaaS tier. Those are the Founder's, always.

Concrete Founder-owned, money items:

- Apple Developer Program fee, Google Play registration fee.
- LLC formation / paperwork / state fees.
- Domain purchase/renewal, any paid subscription upgrade.

Each surfaced item carries a `cost:` field. If `cost` is anything other than
`$0` / `none`, the agent records the approval but **does not** perform the paid
step; it completes every non-paid part around it and tells the Founder exactly
which paid action remains. Marginal Firebase Blaze usage from the app simply
running is **not** a purchase and is in scope. (If that interpretation is ever
wrong, the Founder says so and this line moves.)

## Production promotion guard (the condition the Founder set)

> "Even pushing to production and main branch you can do, you just need to have
> evidence that staging is functioning as intended."

Before any staging→production promotion or push to `main`, the agent must hold
**evidence staging works**:

1. The change is live on staging hosting and the staging site loads.
2. Pre-push smoke / E2E green for the affected flow.
3. Vision verification (V1): captured screenshot, read + described, compared to
   intent. Truthful values (P9).

Only then does it promote. The agent uses engineering judgment on **cadence** and
will promote at meaningful, verified milestones rather than sitting on staging
for months or doing one risky overnight cutover. The Founder can override the
cadence at any time.

## What gets recorded (so nothing is silent)

- Every decision (approve or deny) is appended to
  `.claude/state/founder-decisions/<yyyy-MM-dd>.ndjson` with the item, the
  Founder's reason (denials), the cost, the gate, and `reviewed_by: orchestration`.
- Denied items move to `.claude/state/founder-decisions/archived/<id>.md` with the
  reason appended, out of the active checklist.
- Production promotions also write a SECURITY + evidence block to the ship
  retrospective (P8/P9), as today.

`scripts/founder-decide.ps1 approve|deny <id> ["reason"]` does this bookkeeping.
It contains no deploy/secret/network commands by design: the approved *work* is
done by the agent with its own scoped tools, never bundled into the recorder, so
privileges stay unbundled and the log stays honest.

## The one-time bootstrap only the Founder can do

There is exactly one thing the agent **cannot** do for itself, on purpose: grant
itself permission to deploy to production / push `main`. The permission files
(`.claude/settings.json`, `.claude/settings.local.json`) are agent-immutable — the
settings explicitly deny the agent editing them, and a hard deny on
`firebase deploy` to production plus a `git push origin main` hook still block the
agent today. That is the security gate working as designed: an agent that could
switch off its own safety gate is not a gate.

So to turn on the "approve → I deploy to prod / push main" capability, the Founder
makes a **one-time** permission change (provided as an exact paste by the agent).
After that single edit, every future deploy and promotion is hands-free: approve,
and the agent does it. This is the only Founder edit ever required; it is a
one-time bootstrap, not per-action work, and it is the conscious moment the
Founder widens the boundary. Until it is applied, prod/main items stay surfaced
with the exact action the agent is ready to run the instant it is unblocked.

## Relationship to existing machinery

- Governance proposals (`PROP-NNN`) keep flowing through
  `.claude/state/proposals/` + `apply-decisions.sh` (unchanged).
- Checklist items (`.claude/state/task-queue/founder/*.md`) are the actionable
  queue this protocol governs; `founder-mark-complete.ps1` still does verify+close.
- AMD-015 (propose-first with rationale) and AMD-018 (production-risk gates) are
  the parents of this model. This protocol is how AMD-018's "authorization is the
  Founder's go-ahead; executor is any maintainer with deploy access" becomes a
  one-word chat approval once the bootstrap is applied.

# Usage-Meter Reference Patterns — Competitive Research

Captured 2026-05-15 per PHASE T3 of `dashboard-completion-spec-2026-05-15.md`.
Purpose: ground the PARBAUGHS token-meter redesign (Founder Observation 2 — meter
never displays real data) against best-in-class usage/billing/cost-meter UIs.

28 reference images captured across 9 vendors (Anthropic, OpenAI, Stripe, GitHub
Actions, Vercel, AWS, Mintlify, Unkey, Checkout.com, Wise, Buffer, Mixpanel,
Supabase, Slack, Dust + the phuryn/claude-usage open-source tool).

---

## Cross-vendor patterns observed

The patterns below map directly to PARBAUGHS dashboard widgets where the token
meter currently fails P7 because it has no real data and no period selector.

### Pattern 1 — Big-numeral pattern (3xl–5xl headline)

EVERY high-quality usage meter leads with a single oversized number, framed by
small contextual text. Never a count + chart with no headline number.

Observed examples:
- **Anthropic Console — Usage page** (`anthropic-console-usage-page-chart.png`)
  Three big-numeral cards side-by-side: `3,168,991` total tokens in,
  hidden total cost middle, `47` total web searches. Each card has a small
  label above (e.g., "Total tokens in") and the number in approximately 4xl
  weight. No sparkline inside the card — separate chart below.
- **Anthropic Console — Cost page** (`anthropic-console-cost-page-chart.png`)
  Three big-numeral cards: `$25.92` total token cost (with donut chart to
  the right of the number), `$0.47` web search cost (red-bordered to draw
  attention), `$0.00` code execution cost. Body copy below each big number
  explains scope ("can only be broken down by API key").
- **GitHub Actions overview** (`github-actions-overview-product-summary.png`)
  Two big-numeral cards in a clean 2-col grid: `$2,569.90` total spend +
  `47` billable licenses. Each has explainer text below the number, plus a
  "View details" CTA in the top-right of each card.
- **Stripe MRR Dashboard** (`stripe-mrr-dashboard.png`)
  Three big-numeral KPI cards: Revenue $112,203,349, Leads 40, Quotes 97 —
  each with current-year vs prior-year comparison labels (CY / PY) right
  underneath the number.

**Translation to PARBAUGHS:** The cost-meter should lead with a single 3xl-5xl
number (current cost OR remaining tokens), framed by tiny `eyebrow + caption`.
Never a chart-without-headline.

### Pattern 2 — Period selectors (day / week / month / billing cycle)

Every reference exposes a period selector — most commonly as a dropdown in
the top-right of the chart cluster.

Observed examples:
- **Anthropic Console — Usage page**: Top-row controls include
  `All Workspaces`, `All API keys`, `All Models`, `Month/Day/Hour` granularity
  picker, `< June 2025 >` period stepper, and `Group by: Model` dropdown.
  Six independent filter axes. Open `Month` dropdown reveals radio options
  for `Month/Day/Hour`.
- **GitHub Actions usage chart** (`github-actions-product-usage-chart.png`):
  Top controls include search filter `product:actions`, `Group: SKU`,
  `Time Frame: Current month` dropdown.
- **Anthropic Console — Cost page**: Top-row chips for `Group by: Model`,
  `All Workspaces`, `All API keys`, `All Models`, `June 2025` period stepper.
- **AWS Cost Explorer** (text-only ref): Time controls toggle day-vs-month
  granularity; date range up to last 13 months + 18-month forecast.

**Translation to PARBAUGHS:** The current token meter has no period selector —
this is a fundamental P7 fail. Minimum viable selector: `Today / 7d / 30d / All`.
Best-in-class adds source filter (`All Models / Opus / Sonnet`) and group-by
(`per model / per session / per skill`).

### Pattern 3 — Delta indicators (▲/▼ +N% vs prior period)

Best-in-class meters show direction-of-change alongside the absolute value, in
green/red with a small arrow glyph.

Observed examples:
- **Stripe MRR dashboard** uses `CY $112M | PY $112M` side-by-side rather than
  a single delta — works because both numbers fit and prior-year is the
  established compare-period for revenue.
- **AWS Cost Explorer** (text-only): "Total compared to prior period" widget
  shows MTD cost vs same period last month with a trend indicator. Critical
  note: trend calculations "might be influenced by the number of days in each
  month" — comparison logic must be aware of period-length asymmetry.
- **AWS Top Trends widget**: shows "top 10 cost variations sorted by absolute
  dollar difference" with both percentage AND absolute value displayed.
- **SaaSFrame metrics page note**: industry pattern is "big number + label +
  trend indicator (green arrow up, red arrow down) + sparkline" — adopted
  by Stripe, Linear, Vercel, Notion, Amplitude.

**Translation to PARBAUGHS:** Token meter should display `↑ +24% vs last 7d`
under the headline number. Be careful about period-length normalization
(comparing Mon-Wed of this week vs Mon-Wed of last week, not vs full last week).

### Pattern 4 — Source breakdown (per-model, per-service, per-actor)

The breakdown isn't optional — every reference shows what's driving the total.

Observed examples:
- **Anthropic Console — Usage page chart**: Stacked bar chart at bottom shows
  token usage broken down by model (`claude-3-7-sonnet-20250219` cream +
  `claude-opus-4-20250514` orange). Legend below chart with model names.
- **Anthropic Console — Cost page chart**: Same dual-model breakdown
  (Claude Opus 4 + Claude Sonnet 3.7) in stacked bars with date-x-axis.
- **GitHub Actions premium analytics chart** (`github-actions-premium-request-analytics-chart.png`):
  Line chart "Usage grouped by organizations" with 5 named orgs + "All other"
  — each line a different solid/dashed style. Bottom table breaks out per-org
  with columns: Organization | Included requests | Billed requests | Gross
  amount | Billed amount.
- **GitHub Actions product usage** (`github-actions-product-usage-chart.png`):
  Stacked area chart "Actions usage grouped by SKU" — Actions Linux (blue),
  macOS 3-core (green), Windows (orange), Linux ARM 16-core (pink), Linux
  16-core (yellow), "All other" (red). Six categorical series.

**Translation to PARBAUGHS:** Each cost-meter should include a per-source
breakdown — for PARBAUGHS that's per-skill, per-session, per-day, or per-model.
Either as a stacked chart below the headline number OR as a slim accordion
revealing a sortable table.

### Pattern 5 — Sparkline / trend chart pattern

Trend visualization splits two ways: (a) inline sparkline tucked next to a big
number (no axes), or (b) full chart panel below the big number (with axes).

Observed examples:
- **Inline sparkline / mini-chart inside KPI card:**
  - Anthropic Cost page: `$25.92` total token cost has a **donut chart** to
    the right showing model proportion split — variant of inline sparkline.
  - Anthropic Usage page: `47` total web searches card has a small inline
    donut to the right.
  - GitHub Advanced Security card: clean number-only, no inline chart.
  - SaaSFrame industry pattern: "four cards showing total revenue, charges,
    payouts, and disputes — each card has a number, a trend indicator
    (up/down arrow with percentage), and a sparkline. That's it."
- **Full chart panel below big numbers:**
  - Anthropic Usage/Cost both have a dedicated "Token usage" / "Daily token
    cost" panel below the three-card row, with $-axis or count-axis,
    date-axis, gridlines, and legend.
  - GitHub Actions area-chart panel ($0–$2,000 y-axis, day x-axis).
  - Stripe MRR Dashboard: separate Monthly Revenue line chart panel
    with revenue+goal+volume series.

**Translation to PARBAUGHS:** Two variants — slim inline sparkline (12-20px tall,
no axes, just the line + faint fill) for at-a-glance trend in a stat card; full
panel chart below the headline row when the dashboard needs to support
investigation.

### Pattern 6 — Cost vs usage-count distinction

Every premium meter exposes BOTH cost and count, often as two separate views
of the same period.

Observed examples:
- **Anthropic Console** explicitly separates `Usage` page (tokens consumed,
  request counts) from `Cost` page (dollar amounts) — same data, two views,
  navigated via top-level tabs.
- **AWS Cost Explorer** has "Cost & Usage" report type that exposes both
  axes (cost in $ + usage in service-specific units like instance-hours).
- **GitHub Actions premium analytics**: chart axis is `$` (cost), table
  columns expose both `Included requests` (count) AND `Gross amount` (cost) +
  `Billed amount` (cost-after-credits).
- **Vercel docs**: "Count" view shows total number, "Project" shows usage
  per-project, "Region" shows per-region, "Ratio" shows successful-vs-errored,
  "Average" shows 24h average — 5 different lens on the same period.

**Translation to PARBAUGHS:** Token meter currently shows only count. Should
add an explicit cost-equivalent view (even if it's `$0.00` for the all-free
Claude Code tier — value still in showing the meter for cost-awareness training).
At minimum: tokens-in + tokens-out side-by-side, not aggregated.

### Pattern 7 — Stale data / freshness indicator

Critical for any meter where data lags real-time. Best-in-class makes the lag
explicit, not hidden.

Observed examples:
- **OpenAI Usage Dashboard** (text-only ref): "The Usage dashboard lags by
  roughly an hour" — disclosed explicitly in docs.
- **AWS Billing**: "The Billing and Cost Management console has a refresh
  time of approximately 24 hours to reflect your billing data." Shown
  directly on the dashboard.
- **AWS Cost Explorer**: "All costs reflect your usage up to the previous
  day. For example, if today is December 2, the data includes your usage
  through December 1." Disclosed in widget chrome.
- **AWS dashboard note**: "Estimated charges shown on this dashboard...may
  differ from your actual charges for this statement period." — banner-level
  callout.
- **Vercel docs**: "We recommend you look at usage over the last 30 days to
  determine patterns" — implies real-time data, but no explicit freshness
  callout. (Negative example — they leave the lag implicit.)

**Translation to PARBAUGHS:** Token meter needs a `Last updated: 2 hours ago`
or `Updated 12:34 PM` micro-label, especially since PARBAUGHS telemetry
ndjson is written async and the dashboard regenerates on-commit. Stamp the
freshness so Founder doesn't second-guess whether the meter is broken vs stale.

### Pattern 8 — Allotment / budget progress indicator

Multiple references show consumption against a fixed quota or budget,
typically as a horizontal bar or radial gauge.

Observed examples:
- **Vercel docs**: "an allotment indicator. It shows how much of your usage
  you've consumed in the current cycle and the projected cost for each item"
  — text-only reference but explicit terminology.
- **AWS Budgets**: "Over budget" status (actual > 100%), "OK", "Setup
  required" — three discrete states with color-coded badges.
- **Anthropic Cost page**: $25.92 with donut chart visualizing model-split
  proportion. Donut is not a budget indicator — it's a categorical breakdown.
  No explicit budget cap shown on the captured screenshots.
- **phuryn/claude-usage open-source tool** (`claude-code-usage-tool-dashboard.png`):
  "Pro and Max subscribers get a progress bar" per README. Tracks
  session-quota consumption against the 5h/24h Claude Code limits.

**Translation to PARBAUGHS:** Since PARBAUGHS Claude Code usage is uncapped
in current tier (no hard quota), the token meter should either (a) skip the
progress-bar pattern and use absolute-counter mode only, or (b) display
"% of typical day" as a soft target (e.g., 87% of last 30d daily average
consumed today). Best-in-class avoids fake-quota progress bars.

### Pattern 9 — Empty state / zero state

The most relevant pattern for PARBAUGHS Founder Observation 2 — "meter has
never displayed real data" implies a perpetual empty state.

Observed examples:
- **AWS Cost Anomaly Detection**: "Setup required" status with link to
  create the detection monitor — empty state IS the call to action.
- **AWS Recommended actions widget**: "By default the widget shows up to
  four recommended actions" — populated immediately, no naked empty state.
- **GitHub Actions**: All screenshots show populated data — no captured
  empty state, but docs imply "Billable licenses: 0 / $0.00" displays
  cleanly with the explainer text.
- **Anthropic Console**: cost donut for `$0.00` code execution still
  renders cleanly with the zero — not hidden.

**Translation to PARBAUGHS:** The meter MUST render even when data is
missing/zero. Three valid empty states:
  1. **"Run the watcher to populate"** — explicit setup-required CTA if the
     telemetry pipeline isn't wired
  2. **"No usage in selected period"** — explicit caption when filter
     produces empty result
  3. **"$0.00 / 0 tokens"** — render-the-zero pattern when data exists but
     value is zero (preferred over hidden card)

Currently P7 fail says "meter never displays real data" — likely the meter
collapses or hides entirely instead of using state 3 above. Fix is to ALWAYS
render the card, even at zero, with appropriate empty-state copy.

---

## Anti-patterns observed

Things to avoid in PARBAUGHS token-meter design:

1. **Charts without headline numbers.** A bar chart alone, no big number
   above it, is hard to action. (No captured ref does this — universal rule.)
2. **Hidden currency or unit.** The unit ($ vs tokens vs requests) must be
   visible at glance. Anthropic always pairs `$` glyph with cost numbers
   and bare numerals with token counts.
3. **No freshness stamp.** When data is older than 1h, hide it or stamp it.
   Stale-without-disclosure is the worst case.
4. **Forced single-period view.** Period selector is not optional for any
   meter showing accumulated data — fixed "current month only" is too rigid.
5. **Fake progress bars.** A progress bar implies a cap; if no cap exists,
   use absolute numbers instead.

---

## File index

See `manifest.json` for per-image vendor / source URL / capture state.

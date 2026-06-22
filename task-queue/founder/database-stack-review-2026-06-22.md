# Database stack review — Firebase vs Supabase vs Cloudflare (10k-user horizon)

**For:** PARBAUGHS Founder · **Context:** vanilla-JS PWA, currently Firebase (Firestore + Auth + 8 Cloud Functions), ~20 users today, planning for a ~10k-MAU horizon. Worry being answered: read-cost runaway, edit blast-radius, and bill-runaway. Focus is the **end result** at scale, not the size of any migration.

Full file: `C:\Users\Zach\smoky-mountain-open\.claude\state\research\DATABASE-STACK-REVIEW-2026-06-11.md`

---

## 1. Bottom line

**Stay on Firebase. Your cost worry is an architecture problem, not a platform problem — close the cap gap with App Check + a kill-switch + scoped listeners, and you stay near-free to 10k. Supabase is the better *relational fit* for the scramble/rivalry data and is worth a real look only if you ever do a from-scratch rebuild; Cloudflare (which you already have an account for) is best as an add-on edge/media/realtime layer, not a primary-DB swap.**

---

## 2. The three options

A reality that applies to all three: at ~20 users you pay roughly **$0** on any of them, and at 10k MAU a *disciplined* build is **$0–$300/yr** on any of them. The bill only "breaks" from architecture (unbounded listeners, hot documents, denial-of-wallet) — not from headcount. The differences below are about *fit* and *how the spend ceiling is enforced*.

### Option A — Firebase / Firestore (current stack)

| Pros | Cons |
|---|---|
| Already the stack — Auth + Firestore + Functions integrated, **zero migration cost** | **No true hard spend cap** — budgets only *notify* (with days of delay); the billing-disable function is a *delayed* kill-switch Google itself warns will still overspend, and detaching billing nukes the whole project |
| Deep always-on free tier (50k reads / 20k writes / 20k deletes / 1 GiB / 10 GiB egress **per day**, persists on Blaze) — current league is effectively **$0/mo** | **Per-document read billing punishes exactly your features** — feed + presence + live activity drive listener reads; every doc that enters/changes/leaves a listened set is billable (the #1 way the bill breaks) |
| Reads are cheap in absolute terms ($0.03–0.06 / 100k); real-time listeners + offline persistence are first-class for a PWA | **Hot-document ceiling ~1 sustained write/sec/doc** — any shared counter (likes, presence roster, activity-feed head, leaderboard total) hits contention errors well below 10k concurrent unless sharded/fanned-out |
| Firestore rules already audited here (P8/AgentShield); Cloud Functions native for fan-out/push/economy | **No joins, no native presence** — relational queries need denormalization + fan-out-on-write (multiplies write cost + blast-radius); presence must move to Realtime DB or it's a cost trap |
| Architecture genuinely supports the target scale if doc design respects the limits | Query limits bite as features grow (no cross-field OR without workarounds, predeclared composite indexes, 1 MiB doc cap, full-text needs Algolia/Typesense = another bill); published rates disagree across sources |

**Realistic yearly cost at 10k MAU:** **~$350–$1,800/yr ($30–$150/mo) well-architected** vs **$6k–$24k+/yr naive** — the spread *is* the answer. Modeled on ~2,000 DAU, scoped league-feed listeners (~150–300 reads/session), presence moved off Firestore to Realtime DB, plus $10–60/mo Cloud Functions. The naive case (broad collection listeners, per-second presence writes, refetch-on-render) can 10–50x reads.

**How to cap spend (closest you can get to a ceiling):**
1. **Enforce App Check** on Firestore *and* every callable Function — the single best denial-of-wallet defense (rejects non-app traffic before it bills).
2. **Move presence off Firestore** to Realtime DB `onDisconnect`, mirror coarse status into Firestore via a debounced Function.
3. **Kill hot documents by design** — sharded counters / fan-out-on-write for anything everyone increments.
4. **Build the kill-switch** — Budget → Pub/Sub → Function calling `updateProjectBillingInfo()` to detach billing (or flip read-only) at a threshold (e.g. $200/mo). Set it *well below* your pain point because of notification lag.
5. Scope *every* listener to the member's league(s); paginate (`limit()` + cursor); cache; prefer `get()` over `onSnapshot()` where live isn't needed.
6. Set per-function `maxInstances` low (3–10); guard every `onWrite` trigger with before/after early-return to prevent self-retrigger loops.
7. Stay single-region (us-central1 — already yours); instrument reads-per-session to telemetry so a 10x regression is caught in staging.

---

### Option B — Supabase (managed Postgres)

| Pros | Cons |
|---|---|
| **Relational model is the right shape** for the golf domain — FKs + JOINs + ACID would have *structurally* prevented this year's bugs: duplicate-round rivalry inflation, scramble attribution, the @middleagedgolfer dual-uid mess, legacy no-leagueId artifacts. Smaller edit blast-radius is real | **Migration is genuine 2–4 week work, not a config swap** — NoSQL→relational re-modeling is the hard part; you'd be re-platforming a *live* production app |
| **Row Level Security** is a clean (arguably stronger) Firestore-rules analogue — SQL policies enforced at the DB layer across REST/realtime/storage/direct | **Auth migration forces friction** — Firebase won't export password hashes, so all 20 members (and future email/password users) must re-auth; OAuth users re-link |
| **Pricing flat + predictable** — Pro $25/mo *includes 100k MAU*, so 10k = $0 MAU overage; generous Pro buckets (8GB DB, 100GB storage, 250GB egress) | **Compute is the #1 runaway risk and is EXCLUDED from the spend cap** — a manual dial; a presence-heavy app that needs a bigger instance just bills it |
| **Spend cap is ON by default** and blocks overage on 12 categories (MAU/storage/egress/realtime/edge) until next cycle — a *real* guardrail for everything except compute | **Realtime presence/broadcast is chatty + metered** — 500 peak conns + 5M msgs included, then $10/1k conns and $2.50/1M msgs; an always-on global presence feature is the most plausible creep |
| OSS + self-hostable (matches P4); ships official Firestore→Postgres + auth + storage migration tools; image transforms built-in (Firebase lacks); pgvector free | **RLS perf gotcha** — policies that scan rows degrade hard without an index on every referenced column (~100x difference) |
| SQL + standard Postgres = no proprietary query lock-in; data/schema portable to any Postgres host | **Weaker on client concerns you rely on** — no built-in FCM-style push (you'd self-wire Web Push), and Edge Functions are **Deno** not Node 22, so all 8 existing Functions need porting; cap is on/off only, no "$50" dollar budget |

**Realistic yearly cost at 10k MAU:** **~$300–$900/yr.** Pro base $25/mo = $300/yr floor; MAU overage = $0. The variable is **compute**: Pro+Small ≈ $30/mo (~$360/yr), Pro+Medium ≈ $75/mo (~$900/yr, the conservative anchor). Realtime stays $0 under 500 peak conns / 5M msgs; a heavy presence feature could add $10–50/mo.

**How to cap spend:**
1. Keep the **Spend Cap ON** (default) — auto-blocks overage on MAU/storage/egress/realtime/edge.
2. Treat **compute as the one un-capped dial** — pin the instance size, review the Usage page + Upcoming Invoice weekly, never enable auto-scale-up without an alert.
3. Guard realtime — no always-on global presence; scope to active league/room, debounce broadcast, watch peak-conn + message counters.
4. **Index every column referenced in an RLS policy** before launch (prevents slow queries *and* the compute pressure that forces a bigger billed instance).
5. Separate staging project so load tests don't inflate prod metered usage.

---

### Option C — Cloudflare (D1 / Durable Objects / KV / R2 / Workers)

| Pros | Cons |
|---|---|
| **Cost stability is exceptional** — $5/mo Workers Paid bundles D1+KV+R2+DO; a read-heavy 10k-MAU golf app realistically stays at/near the $5 floor for years | **D1 is single-writer / single-threaded per DB** (~1000 qps ceiling, then "overloaded") — fine for bursty-low golf writes, a hard wall for write-heavy realtime |
| **D1 included tiers are enormous** — 25 *billion* rows-read/mo + 50M rows-written/mo + 5GB on paid; golf reads a tiny fraction | **Writes replicate ~200–350ms globally** — explicitly *not* for latency-sensitive/collaborative writes (use Durable Objects for live/presence) |
| **Zero egress everywhere** — R2 has no bandwidth charges; ideal for share-cards, avatars, cosmetic art, merch photos | **No first-party auth** — must add Better Auth / Clerk / Auth.js *or keep Firebase Auth* alongside |
| **Durable Objects** are a near-perfect primitive for the realtime slices (presence, live league rooms, typing) — strongly-consistent single-threaded actors, WebSocket hibernation, scale-to-zero billing | **No Firestore-style live listeners** — your current realtime UI (liveState, feeds) must be rebuilt on DO + WebSockets/SSE — a re-architecture, not a port |
| Standard SQL + Drizzle; no connection pools; per-invocation **`limits.cpu_ms`** is a real hard guardrail vs denial-of-wallet | **No declarative rules equivalent** — all authz moves into hand-written Worker code (more audit burden, removes the gate-protected.sh safety) |
| **You already have a Cloudflare account** — no new vendor onboarding | **No account-wide hard dollar cap** — Budget Alerts (new Apr 2026) are notify-only, calculated daily; a fast attack can outrun them |
| | **10GB/DB hard limit** forces per-league sharding early; manual `.sql` migration workflow is less ergonomic; migrating the mature Firestore + 8 Functions + rules + listeners is a **full data-layer rewrite + re-test** |

**Realistic yearly cost at 10k MAU:** **~$60/yr** (the $5/mo floor) for this read-heavy workload; **~$150–$240/yr worst-case** even with a pessimistic engagement spike (extra requests, R2 media, DO realtime traffic). Stays in low-double-digit dollars/mo well past 10k.

**How to cap spend (no native hard cap exists — layer these):**
1. Set **`limits.cpu_ms` low** in `wrangler.toml` (e.g. 50–200ms; default 30s) — the real per-invocation guard against denial-of-wallet (Error 1102 on breach).
2. Enable Billable-Usage dashboard + Budget Alerts at a low threshold (e.g. $15/mo) — early warning only.
3. Stay on Workers **Paid** (not Enterprise); keep included tiers as your operating envelope so alerts fire long before meaningful spend.
4. Rate-limit write-heavy endpoints (Cloudflare WAF/Rate Limiting or a KV/DO token bucket) before fan-out becomes billable.
5. Shard D1 per-league to stay under 10GB/db and dodge single-writer contention.

---

## 3. Is the "Firestore tree vs relational" blast-radius worry real at 10k?

**Yes — but it's two distinct worries, and only one is a 10k problem.**

1. **Edit / data-integrity blast-radius (real *today*, not a scale issue).** This is the honest one. Firestore has no joins and no FK constraints, so invariants are enforced in *every writer* rather than in one place — which is precisely why this year produced duplicate-round rivalry inflation, scramble-attribution gaps, the dual-uid member mess, and legacy no-leagueId artifacts. A relational schema enforces "one round = one row, this player owns it" as a constraint that *cannot* be violated by a buggy writer. Postgres (Supabase) would have *structurally* prevented several bugs you already fought. That benefit is genuine and exists at 20 users, not just 10k.

2. **Read-cost / hot-document scaling (real *at 10k*, but mitigable in place).** The per-doc read billing and the ~1 write/sec/doc hot-document ceiling are the actual scale risks. Both are solvable inside Firestore: scoped listeners + pagination + caching for reads; sharded counters / fan-out / Realtime-DB presence for hot docs. They must be *designed in now*, not retrofitted under load — but they do not require leaving Firestore.

**Net:** the relational fit is a legitimate argument *for Postgres*, but it's a code-quality / maintainability argument, not a "Firestore can't reach 10k" argument. Disciplined denormalization + the guardrails above keep Firestore correct and cheap to 10k. The blast-radius pain is real; it just isn't worth a live re-platform to fix when constraints-by-convention + the existing E2E/rules tests can hold the same invariants.

---

## 4. Recommendation

**Stay on Firebase and close the cap gap. Do not migrate for cost or cap reasons.**

Reasoning, weighed against your concerns:

- **Migration cost vs benefit.** Both alternatives are a *weeks-long full data-layer rewrite* of a working production app (Supabase: 2–4 wks + every member re-auths; Cloudflare: rebuild realtime on Durable Objects, add an auth provider, port 8 Deno functions, hand-roll authz). That's large new risk for a problem — bill runaway — that is **mitigable in place**.
- **The app is currently free-tier-cheap and stays cheap.** At 20 users you're ~$0; at a disciplined 10k you're ~$350–$1,800/yr. Cost is not the forcing function.
- **The cap gap is closeable.** Firebase's "no hard cap" is the strongest pro-migration argument, but App Check enforcement + low `maxInstances` + a billing-disable kill-switch + scoped/paginated listeners gets you a defensible ceiling. Denial-of-wallet — not organic growth — is the real risk, and App Check kills it at the source.
- **Relational fit is real but doesn't justify a live re-platform.** The integrity bugs are better solved by denormalization discipline + the constraints your tests already enforce than by re-platforming production.
- **The Cloudflare account you have is still useful** — just as an *additive edge/media/realtime layer* (R2 for zero-egress share-cards/avatars/merch art; Durable Objects for presence/live rooms), not a primary-DB swap.

**When this flips:** if you ever do a *greenfield rebuild* (e.g. the native-grade re-architecture), Supabase Pro becomes the leading choice — relational fit + RLS + the only out-of-the-box enforced spend ceiling of the three. Revisit then, not now.

---

## 5. If you migrate anyway — the smallest sane first step

**Don't move the database. Move *media* to Cloudflare R2 first.**

- It's the lowest-risk, highest-leverage, account-you-already-have first step: serve share-cards, avatars, cosmetic art, and merch photos from **R2 (zero egress)** behind a Worker, while Firestore/Auth/Functions stay untouched.
- It removes the scariest *variable*-cost axis (image egress) without touching your auth, rules, listeners, or the 8 Cloud Functions, and it gives you hands-on Cloudflare/Workers experience to judge a deeper move later.
- **If the goal is specifically the relational fit:** the safe first step is *not* a migration — it's adding DB-level invariants where Firestore allows them (sharded counters, a single canonical writer per round, tightened rules) and a from-scratch Supabase **proof-of-concept on a staging project** (free tier) modeling rounds/scrambles/rivalries to validate the schema and load-test realtime *before* committing to any cutover. Prove the schema and the spend cap on staging; never re-platform the live app as the experiment.

---

## 6. Sources

**Firebase / Firestore:** cloud.google.com/firestore/pricing · firebase.google.com/docs/firestore/billing-example · airbyte.com/.../google-firestore-pricing · firebase.google.com/docs/firestore/{understand-reads-writes-scale, real-time_queries_at_scale, best-practices, solutions/presence, rtdb-vs-firestore, quotas} · firebase.google.com/docs/projects/billing/avoid-surprise-bills · docs.cloud.google.com/billing/docs/how-to/disable-billing-with-notifications · firebase.google.com/docs/app-check/enable-enforcement · firebase.google.com/support/guides/security-checklist · sashido.io/.../firebase-guide-and-pricing-traps-2026 · news.ycombinator.com/item?id=25372336

**Supabase:** supabase.com/pricing · supabase.com/docs/guides/platform/{cost-control, billing-faq, compute-and-disk} · supabase.com/docs/guides/realtime/pricing · supabase.com/docs/guides/platform/manage-your-usage/egress · supabase.com/docs/guides/database/postgres/row-level-security · supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices · supabase.com/docs/guides/platform/migrating-to-supabase/{firestore-data, firebase-auth} · supabase.com/alternatives/supabase-vs-firebase · github.com/orgs/supabase/discussions/14356 · metacto.com/.../the-true-cost-of-supabase · designrevision.com/blog/supabase-pricing

**Cloudflare:** developers.cloudflare.com/d1/platform/{pricing, limits} · developers.cloudflare.com/durable-objects/platform/{pricing, limits} · developers.cloudflare.com/workers/platform/{pricing, limits} · developers.cloudflare.com/r2/pricing · developers.cloudflare.com/billing/manage/budget-alerts · developers.cloudflare.com/d1/best-practices/read-replication · developers.cloudflare.com/changelog/post/2026-04-13-billable-usage-dashboard-and-budget-alerts · blog.cloudflare.com/{d1-turning-it-up-to-11, ai-gateway-spend-limits} · dev.to/whoffagents/cloudflare-d1-sqlite-at-the-edge-after-6-months-in-production

*Confidence: high on architecture/enforcement facts (per-doc read billing incl. listener updates, ~1 write/sec hot-doc limit, no Firebase/Cloudflare hard cap, Supabase Spend-Cap-on-by-default, App Check as the primary DoW defense — all from primary docs, June 2026). Medium on exact dollar forecasts — published 2026 Firestore us-central1 rates disagree across reputable sources, and the 10k-MAU figure hinges on unmeasured PARBAUGHS inputs (DAU/MAU, reads-per-session, economy write volume) that only production/staging telemetry can pin down.*
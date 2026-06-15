# Founder decision — desktop/HQ layout width direction (taste call)

**Status:** awaiting Founder direction. NOT blocking — I'm continuing all other
convergence work; this only gates the desktop-layout portion of directive #4.
**Why you're seeing this:** it's a design-DIRECTION + taste call with real
regression risk, not an engineering bug — exactly the kind of thing that's yours
to decide (V3). One answer steers a large amount of work.

## The finding (from the 41-route mobile+desktop critique, then verified in code)
The visual critique flagged ~25 pages as "desktop is mobile-stretched / huge dead
cream whitespace / not designed for 1440px" and scored them desktop 5.6–7.4 (vs
mobile ~8.2–9.0). That looked like THE systemic issue.

**But it's largely intentional.** When I read the actual CSS, those ~30
single-column pages (rounds, settings, courses, chat, dms, activity, teetimes,
richlist, aces, awards, drills, findplayers, leagues, merch, rules, faq, records,
caddynotes, …) are DELIBERATELY capped at a **680px centered reading column** on
desktop (base.css, shipped v8.23.10–13). The documented reason: at the full
1152px width, "a title-left / action-right row strands its control across a void
and short idea-chips float in oversized pills." So the team centered the column
to match peer apps (X feed ≈600px, Strava ≈660px) and keep it on the footer's
axis. Data-dense pages (standings, members, trophyroom, calendar, shop, home) are
deliberately LEFT full-width. So the "dead whitespace" is the balanced margin of
an intentional centered-reading-column design — a legitimate, premium pattern
(Linear/Stripe/Vercel docs, Twitter, Strava all do exactly this).

The critique agents (generic senior-designer persona) didn't know that rationale
and applied a blanket "desktop must fill the width" rule → a false positive on
the design intent. **Forcing full-width now would RE-CREATE the v8.23 problems**
(stranded controls, floating chips) — a regression, not a fix. So I did NOT touch it.

## Your call — which direction for HQ/desktop?
- **(A) KEEP the centered reading columns (recommended).** It's a sound, peer-standard
  premium pattern; mobile (your primary surface — members are on phones) is already
  strong (~8.3). I'd then ONLY elevate the few pages that genuinely want width as
  bespoke redesigns: **Messages → two-pane (list + open thread)** and **Profile-edit →
  multi-column form + collapse the 40-input club-distance ladder** (both real wins).
  Lowest risk, keeps the deliberate design, focuses effort where width actually helps.
- **(B) GO FULL-WIDTH / app-like on data-dense pages** — convert lists to multi-column
  grids + rails app-wide. Bigger, more "fills the screen," but a large effort with real
  regression risk (re-solving the v8.23 stranding problems per page) and per-page V1 at
  1440px. Only worth it if you specifically want the dense-app look over the doc-column feel.
- **(C) HYBRID** — keep centered columns for reading/forms (chat, settings, faq, rules,
  bugreport), go full-width grids for the data/leaderboard family (records, richlist,
  courses, teetimes). Middle ground; moderate effort.

**My recommendation: (A).** It respects the deliberate design, puts effort where width
genuinely helps (Messages two-pane, profile-edit), and avoids regressing shipped work.
Tell me A / B / C (or "make HQ look like X") and I'll execute. Until then I keep draining
the rest (contrast pass, verified copy/layout fixes, cosmetics) — none of which is gated on this.

— Convergence marathon, 2026-06-15

# UI critique fix queue v2 — batch-2 pages (2026-06-11, marathon)

Three parallel critique agents re-critiqued the pages whose batch-2 findings
were lost to compaction. Peer bar Linear/Vercel/Stripe/Notion, P7 9.5.
Identity: cream/paper, felt-green, brass = interactive/value/elevated ONLY,
Fraunces serif + mono eyebrows + sans body.

## DONE this session (v8.24.66–73)
- byline entropy (rounds), empty-state mutes (rounds/records/activity)
- markers + flair golf art (shop), More-menu Challenges+Drills golf icons
- XSS sweep (challenges names/course/stakes, aces story/witnesses, bio editor) — v8.24.72
- avatar ring encodes status (founder brass / cosmetic / quiet hairline) — v8.24.73 — FIX-QUEUE #4 #1-leverage

## REMAINING — prioritized

### aces (6.5)
- brass-on-brass: name (aces.js:32), course accent, "ACE" tag (:40) all gold + 48px count (:19). Keep ONLY the count brass; name→--cream, tag→--cb-mute-2 mono eyebrow.
- dead empty span aces.js:33,95 (`<span style=color:gold></span>` no content) — give a small flag SVG or remove.
- duplicate primary CTAs aces.js:16 (header +Log ace) + :52 (empty Log first ace) — demote header to outline when empty.

### scramble (5.5) — heaviest drift
- alarm-red on member scores (scramble.js:259,296,328,335) VIOLATES its own rule (:67-69 "never alarm-red on a member's score"). Swap var(--red)→var(--cb-mute) for over-par/worst/losses.
- decorative brass on team names + empty titles (:40,57,61) — recolor to --cb-ink/--cream; keep brass only on the W-L/best-score hero number.
- all-dash full-chrome stats table (:290-305) for a 0-round team — replace with one muted line + path-forward (reuse .empty pattern at :267).
- team-list right col "No rounds" (:76) → "Tap to log first round" muted.
- medal tint bug (:251,255): `medal + '15'` hex-alpha on a CSS var token = invalid/transparent. Use rgba(var(--gold-rgb),.08) pattern.

### challenges (5.0)
- XSS done (v8.24.72).
- duplicate primaries (:21 header +New green AND :44 empty Start a Challenge green) — demote header to outline when empty.
- hardcoded founding-league example names (:47-54 "Beat Kayvan's 107", "Mr Parbaugh vs Nick") — legacy-data leak class; genericize to role-neutral copy.
- legacy .sh/green header — consider editorial masthead.

### trips (6.0)
- legacy .sh/h2 header (:30) → roster-masthead/eyebrow + Fraunces headline (mirror leagues.js:51-54: "EVENTS · N UPCOMING").
- promote single live "Active" badge to brass .badge.gld; past-event badges muted.
- empty-state flag stroke=var(--gold) decoration (:65) → var(--cb-mute); reserve brass for +New Event CTA.

### bounties (6.0) — lagging sibling of wagers (9.0, the reference)
- port hand-rolled cards (:73-86) onto .wg-card / .wg-card__icon/main/right/stake family.
- oversized brass pot (:78 20px/800 gold + 8px COINS) → wg-card__stake (mono 15px 700 brass).
- inline brass toggle washes (:99-100,137-138) → .wg-type radiogroup with aria-checked brass-ring.
- dartboard empty icon (:40) → flag-in-cup/coin-on-tee; wrap empty in .pf-empty dashed frame.

### chat (6.5)
- brass on every event date label (:69) + trip dot (:63) — date→--muted/mono; keep brass on one category accent only.
- "Coming Up" event chips min-width:140px (:67) leave desktop dead-space when 1-2 events — full-width stacked rows when <=2, scroller for 3+.
- generic speech-bubble empty icon (:146); × glyph (:39) → close-X SVG.

### teetimes (7.5)
- duplicate brass CTAs: header +Post (:41) AND empty full green Post a Tee Time (:48). Demote header to outline when list empty.
- ad-hoc empty chrome (:43-60) → shared .pf-empty frame (keep the clock-with-tees icon).

### leagues (8.5 — nits only)
- hardcoded motto "Community over competition. Always." (:437-438) renders for EVERY league incl non-founding — gate on l.badge==="founding".

### profile / members (7.5 / 8.0)
- profile wallet tile (members.js:198-201) triple-brass gradient → flatten: brass number + 1 coin glyph, paper bg + hairline.
- "Best" tile renders literal 0 when only 9-hole rounds (members.js:270) → muted — + "No 18-hole round yet".
- roster Hcp dash wall (:243,247) — confirm .roster-hcap--none is --cb-mute-3; add title="Needs 3 rounds".

### findplayers (6.0)
- universal brass ring — DONE v8.24.73 (router de-brass).
- filter chips hand-paint brass inline (:48-49) → let .fp-filter.active class own it (ink + brass underline).
- adopt .roster-search/.roster-scope to match members.js search.

# Founder mega-directive 2026-06-22 — work straight through, autonomous, before/after-verified

Standing rules this run: BEFORE/AFTER screenshot on every visual change, verified by ME
(Playwright), never ask Founder to check ([[feedback_before_after_verify_self]]). Work
continuously through ALL items; only the DATABASE REVIEW (item D) needs Founder input and is
SAVED FOR LAST. Use the powerful image-gen models (not the cheapest). Playwright on every visual
check + every page/subpage/tab.

## PRIORITY 1 — DATA INTEGRITY (real-user-found, embarrassing; functional)
- [ ] D1. Scramble round posts as the LEADER (e.g. "jordyn") not the TEAM NAME ("The Chuds logged…").
  Should read as the team so others know it's a team score to beat at that course.
- [ ] D2. Profile shows NO scramble teams I'm on; every scramble round shows the SAME team name
  (Birdie Bros) even though I only played Birdie Bros once → data not stored OR not displayed right.
- [ ] D3. Was on 'The Chuds' but that round does NOT show on my profile.
- [ ] D4. The Chuds scramble scorecard shows only jordyn playing — should be team name + all members
  (should've been caught in the team rebuild).
- [ ] D5. Front-page staleness: fatalbert59420 round >1wk ago still front page; Chuds played Jun 20
  (logged as jordyn) — front-page "this week" logic wrong.
  → ROOT-FIX at source + TEST with a test user PLAYING a scramble round, assert data writes/displays.
  Add scramble write/read to the testing loop + memory (should've been caught by me, not the user).

## PRIORITY 2 — ALIGNMENT / VISUAL BUGS (Playwright-catchable; before/after each)
- [ ] V1. Sign-in screen: weird beige bar at the bottom, not fully flushed out.
- [ ] V2. gumbees default avatar: person icon overflows OUTSIDE the blue circle (cheap). Clamp glyph
  inside the circle, aligned. (Same family as the avatar work.)
- [ ] V3. Tournament page: 4 profile pics have text to the RIGHT that's cut off / unreadable — realign.
- [ ] V4. Schedule tab (bottom): scheduled round / played / range rows not aligned, running into the
  calendar border edge.
- [ ] V5. Scorecard while playing: confusing + OVERLAP when scrolling with the scorecard open. Needs
  agents running multiple live rounds testing full Play-Now functionality.

## PRIORITY 3 — SECURITY (login)
- [ ] S1. Sign-in: phone auto-signs-in after first sign-in (feels insecure). Audit login portal +
  all auth functions for soundness/security; run a pen test on the login screen; fix any findings.

## PRIORITY 4 — TOOLING / SCANS
- [ ] T1. Add skill: `npx skills add vercel-labs/agent-skills --skill react-native-skills -a claude-code -g`
  (Founder-authorized). Review agents must know our UNIQUE setup (vanilla JS + Vite + Firebase, NOT
  React Native app) — do NOT heavily alter anything.
- [ ] T2. Playwright + Vercel scan on EVERY page + subpage + tab; repair anything heavily wrong.
  Playwright in ALL visual checks — memory note.

## PRIORITY 5 — DESIGN EFFORTS (powerful image gen; critique-loop → gemini; Playwright-verify finals)
- [ ] G1. Sign-in ANIMATION: still poor, lacks taste (2+ wks). Real redesign.
- [ ] G2. ONBOARDING rebuild (2+ wks): caddy popup not smooth/interactive, stale, min physics. Research
  real onboarding flows/templates (copyright-safe) to mimic; add motion/physics/interactivity.
- [ ] G3. MERCH overhaul (powerful gen, looks like Parbaughs tour gear + our logo):
  TOUR = quarter-zip, hoodie (H&B "Jackson Hoodie" style), polo, hat (Titleist style), vest (H&B
  "Boyd vest" style). NO tee in tour. Ball marker = rubber-hose design, real golf-ball-marker feel
  (Titleist-grade). Tees/balls look intentional, branded.
  LEISURE = 3-4 t-shirts + 2 hoodies (H&B "Wallace sweater hoodie" style), LOUD rubber-hose branding +
  P+rose. Hoodies: P rubber-hose on front chest, huge golf-Parbaugh rubber-hose on back w/ "Parbaugh"
  name at top. Socks: ankle, rubber-hose CHARACTER — 1 men (man char) + 1 women (woman char).
- [ ] G4. STORE page rework: all of it, Playwright-verify finals, critique-loop → gemini if not good.
  Goal: users beg to unlock cosmetics, NOT complain they look bad / can't see their photo with a ring.
- [ ] G5. PROFILE EDIT + change photo + cosmetics: major UI revamp (behind the rest of the app +
  confusing where to equip / see purchased items).
- [ ] G6. LEVEL-100 rubber-hose THEME (asked >1wk ago) — vastly different on-page cartoon theme.
- [ ] G7. MORE branding/images/logos throughout. PLAN (not now): per-league/course brandable logos
  (country clubs change icons; paid feature later) — architect so it's swappable.

## PRIORITY 6 — DATABASE REVIEW (LAST, needs Founder decision)
- [ ] DB. Deep research: Firebase (current Firestore tree) vs Supabase+Cloudflare vs a 3rd option, for
  ~10k users — cost, read latency, edit blast-radius, ops. 3 options w/ pros+cons, cost guardrails to
  avoid bill-horror. Founder has a Cloudflare account. Focus on END RESULT, not migration size.

## Existing queue carried in: feed-flair raster art; merch leisure socks/shirts; HQ showcase P2-P5;
## onboarding (now G2); friends-graph polish; per-page 9.5 convergence.

# Member-page audit backlog — 2026-06-11 (wf_0c0adb16-e65)

Structural UI/UX/consistency/actionability audit to the 9.5 bar. **Honest scores
(not eased):** shop **7.2** · feed **7.8** · rounds **7.8** · home **8.2**.

> Scope note: the workflow audited 4 core pages (home, feed, rounds, shop) —
> args didn't propagate to the 24 other pages on the resume run. The
> cross-cutting findings below are clearly app-wide patterns, so the highest-EV
> move is to fix them SYSTEMICALLY (shared classes/tokens) rather than re-audit.
> The remaining member pages are still formally un-audited (next wave).

## The 8 cross-cutting themes (fix these once, fix every page)

1. **44pt touch-target floor unenforced** (CRITICAL). Every page has tappable
   elements under 44pt; the most-used controls are the worst (feed action row
   6px padding, shop state badge 7px, rounds Share 9px/4px, home nemesis chip).
   → Add a shared floor/utility, not per-page patches. **Verify rendered heights
   before editing** (source padding ≠ rendered height once line-height counts).
2. **Token system bypassed by inline hex/rgba.** Shop tier cards fully hardcoded;
   feed hole-dots, rounds legend/PR badge, home location banner do inline color
   math. Breaks the 6-theme system. Name the one-off alphas (brass .55/.18/.22)
   as tokens in base.css. **Verify each suggested token name exists** before use.
3. **No shared empty/error/loading component (P10).** Bare dashes + generic
   spinners with no WHAT/WHERE/WHAT-ACTION + no recovery. Build ONE P10 pattern
   (icon + headline + line + CTA) and apply everywhere.
4. **Inline-style sprawl instead of reusable classes.** readonly/disabled fields,
   loading containers, badge colors, spacing all per-instance → drift. Extract
   `.ff-input--readonly`, `.loading-state`, `.rc-pr-badge`, `.rc-vs-par--*`.
5. **Inconsistent button/action vocabulary.** write vs read actions look
   identical (feed Post mirrors read-only action row). Enforce a
   primary(brass)/secondary(outline)/tertiary(text) ladder.
6. **Fragmented micro-typography / sub-floor sizes** (8px tier chips, 9.5px feed
   labels). Consolidate to 2–3 canonical eyebrow sizes; enforce a ~10px floor.
7. **Spacing not on the 4px scale.** magic numbers (4/8/10/13/18, asymmetric
   14×12) → `--sp-*`. home nemesis inline margin breaks the 22px gutter; feed
   action-row gap wraps at 375px.
8. **Interaction motion inconsistent/instant.** per-component durations differ;
   weak touch :active. One transition contract: `--dur-quick`/`--ease-default`.

## Ranked fix list (drain top-down; verify source claims first)

| # | Sev | Dim | Title | Pages | Effort |
|---|-----|-----|-------|-------|--------|
| 1 | CRIT | touch | 44pt floor across all interactive surfaces | feed, shop, home, rounds | M |
| 2 | high | color | hardcoded hex/rgba bypass tokens | shop, feed, rounds, home | M |
| 3 | high | empty | empty/error/loading fail P10 | rounds, feed, shop, home | M |
| 4 | high | consistency | no shared readonly/disabled/button/loading classes | rounds, feed, shop, home | M |
| 5 | high | consistency | write vs read actions look identical | feed, shop | S |
| 6 | high | type | micro-typography below readability floor | shop, feed, home, rounds | M |
| 7 | med | spacing | magic-number spacing not on 4px scale | rounds, feed, home, shop | S |
| 8 | med | motion | inconsistent/instant interaction motion | home, shop, feed | S |
| 9 | med | taste | pulse progress bar reads as notification strip | home | S |
| 10 | med | taste | feed action row mono-uppercase (terminal-like) | feed | S |
| 11 | med | hierarchy | dead/unverified `_renderEmailVerifyBanner()` path | home | S |
| 12 | low | actionability | no unsaved-changes guard on round edit | rounds | S |

### Detailed fixes (verbatim from the audit, with exact selectors)

- **#1 touch:** `.feed-wrap .feed-action` (6px 0 → min-height:44px;padding:8px),
  `.feed-empty__cta` (min-height:44px;padding:14px 22px), `.shop-item__state`
  (7px → min-height:44px;padding:12px;flex-center), `.hm-nemesis` (add
  min-height:44px), home tee-time row (48→52px), rounds Share btns (9/4px →
  `.btn-sm` min-height:44px).
- **#2 color:** shop tier cards #241c14→`--cb-felt`, #9c8d6c→`--cb-mute-1`,
  #a89878→`--cb-mute-soft`, #e9d9ae→`--cb-chalk`, #9fc0aa→`--cb-moss`;
  `.shop-item__new` #241c0c→`--cb-ink`. feed hole-dots #FFD700/#4CAF50/#888/
  #F59E42/#E53935 → brass/moss/mute-2/copper/claret (doc the eagle-gold
  exception). rounds legend + PR badge: alias `--cb-brass-faded` in base.css.
  home location banner → `--cb-brass-faint`/`--border-subtle`.
- **#3 empty:** rounds `renderContextualEmpty('rounds')` silent → "No rounds yet"
  + "Log your first round; handicap unlocks after 3" + Log-a-round CTA. feed →
  real failure card + Retry. shop locked/arriving → "LOCKED · Earn X more" +
  destination / dated ETA. home stats `—` → "Log your first round…" link.
- **#9 pulse bar:** height 4→6px, radius 2→3px, box-shadow `--el-1`, min-width
  4%→6% so 0% never disappears.
- **#11 email banner:** ❌ FALSE POSITIVE (verified 2026-06-11). The function IS
  defined at `home-rail-newuser.js:288` and wired in home.js — the audit agent
  only read home.js so the cross-file def looked missing. No fix needed. (Lesson:
  source-only audits flag cross-file definitions as "dead"; always verify.)
- **#9 pulse bar:** ✅ DONE v8.24.94 — home.js pulse progress bar 4→6px tall,
  radius 2→3px, min-width 4→6%, inset shadow for depth.

## Drain order recommendation
Systemic first (fix-all-pages): #1 → #2 → #3 → #4, each verified before edit.
Then per-page taste: #9, #10, #6, #7, #8. Then #5, #11, #12.
**Re-run the audit on the other 24 member pages** (fresh inline script + args)
once the systemic fixes land, to catch page-specific issues the cross-cutting
themes don't cover.

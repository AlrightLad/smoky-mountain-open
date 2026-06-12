export const meta = {
  name: 'per-page-9.5-fix-pass',
  description: 'Implement the real (non-artifact) per-page critique fixes across 13 member pages to the 9.5 bar',
  phases: [{ title: 'Implement', detail: 'one agent per page, edits its own JS file' }],
}

const RULES = `
PROJECT HARD RULES (PARBAUGHS — vanilla JS golf-league PWA). Violating these fails the task:
- Code style: use \`var\` (NOT let/const) — current vanilla-JS compat. Match the surrounding file's idiom exactly.
- NO emojis as UI icons. Use inline SVG (stroke-based: viewBox 0 0 24 24 or 16 16, fill="none" stroke="currentColor" stroke-width 1.5-2, sized to context). The ONLY emoji allowed is the golf flag for the Caddy bot. The Founder explicitly finds emoji icons "cheap and gross."
- NO hardcoded hex colors. Use the Clubhouse CSS tokens. (Exceptions: Visual Reference hole-dot colors + share-card template only — not relevant to these pages.)
- CONTRAST (WCAG AA — this is also a legal/ADA requirement): for any text a user must READ on the page ground, use ONLY these tokens:
    --cb-mute (#656259, 4.63:1 AA-safe)  or  --cb-ink-faint / --cb-mute-1 (#5F5C50, 5.09:1 AA-safe)  or darker (--cb-ink).
  NEVER use these for readable text (they are documented decorative/placeholder-only and FAIL AA):
    --cb-mute-2 / --muted2 (#A8A395),  --cb-mute-soft (#928E80, 2.49:1),  --cb-mute-faint (#BAB6A8),  --text-subtle (= --cb-mute-2).
  If you find readable text using any of those, switch it to --cb-mute or --cb-ink-faint.
- 44px minimum touch targets on interactive elements.
- escHtml() any user-supplied content you render (names, course names, notes) — XSS discipline.
- Immutable updates; small focused functions; early returns over deep nesting.

SCOPE FENCES (critical — breaking these corrupts the parallel run or the ship gate):
- Edit ONLY your assigned page file. Do NOT edit src/styles/base.css, src/styles/components.css, src/core/utils.js, package.json, package-lock.json, or public/sw.js. If a fix genuinely requires a shared-CSS change (e.g. a global .bottom-nav or .lb-* class), DO NOT make it — instead report it in sharedCssNeeds with the exact selector + change + rationale, and implement what you can locally in your page file.
- Do NOT remove or rename existing data-* attributes, element IDs, button counts, or DOM structure that automated smoke tests assert on. Restyle/augment those elements; never delete their hooks. (Feed action rows, rounds list/detail, home cards, rivalry routes are smoke-asserted.)
- Targeted edits, NOT full-file rewrites. Preserve all existing functionality and data flow.
- After editing, run \`node --check <your file>\` and report nodeCheckPassed. If it fails, fix it before returning.

PROCESS: (1) Read your assigned file fully + grep for the relevant render functions. (2) For each REAL finding below, make the minimal tasteful edit that resolves it at a 9.5 bar (peer-anchored to Linear/Stripe/Vercel polish, but keeping PARBAUGHS' warm country-club identity). (3) Skip anything listed as a KNOWN ARTIFACT. (4) node --check. (5) Return the structured result.

DESIGN BAR: 9.5/10 per dimension (typography, hierarchy, density, contrast, motion, consistency). Be honest in selfScore — cap at 9.4 (per policy, only the Founder can confirm >=9.5 via visual sign-off). Your job is to move the page decisively toward the bar with the listed fixes, not to redesign from scratch.
`

const PAGES = [
  {
    file: 'src/pages/awards.js', label: 'awards',
    spec: `REAL FIXES:
1. The award icon slot (36px column, flex-shrink:0) is hardcoded to '' (empty string) for all tiers. Add a real inline SVG per tier into that slot: gold-tier = filled/strong trophy, silver-tier = medal, bronze-tier = ribbon/laurel. Stroke or filled SVG using brass/medal tokens — NO emoji, NO empty string. Make sure the slot renders the SVG, not blank.
2. Tier differentiation is invisible — all cards look identical despite gold/silver/bronze tiers in code. Make tiers legible: gold = stronger brass border (rgba gold .4+) + a subtle 'GOLD'/star marker; silver/bronze visually distinct (border + marker). Use tokens.
3. Density: the code computes up to 8 awards but only ~3 render / lower half is empty beige. Render more of the available awards so content fills the fold, OR add a short tasteful 'more to earn' / ceremony treatment to fill the space. Do not fabricate awards — only surface ones the code actually computes.
4. Iron Man card shows '16 rounds played' for a member the brief says has 8 league rounds. Iron Man counts allRounds (incl. scrambles/partials). Relabel it accurately (e.g. '16 rounds incl. scrambles' or whatever the true semantic is) — verify the count source in code; do NOT fabricate or silently change the number.
DIAGNOSE (report, don't fabricate): Player of the Year + Scoring Champion (gold) are missing from render even though rounds exist. Check why getSeasonStandings(2026) returns empty. If it's a real query bug (leagueId/season-window) you can safely fix in awards.js, fix it. If the empty standings is an upstream/seed-data issue outside awards.js, report it in notes as needs-diagnosis (do not fabricate standings).
KNOWN ARTIFACT to skip: none specific here.`,
  },
  {
    file: 'src/pages/records.js', label: 'records',
    spec: `REAL FIXES:
1. Seven full-width collapsed accordion cards (Event champions, All-time records, Log a record, Scramble team records, Best scores by course, Handicap leaders, ...) are visually identical. Add a small brass/muted SVG icon (use --cb-mute or brass token) to the left of each hofCard title — semantically matched (trophy=Event champions, target=All-time, flag=Scramble, etc.). NO emoji.
2. Differentiate the sections so they're not a flat identical stack (weight ladder / subtle treatment).
3. The page is empty signifiers below the fold — 7 collapsed cards convey zero data without a tap. Surface real values without a tap: inline the top All-time record (Best 18 + Best 9 holder) directly under that card's title, and render the Handicap leader inline under its title. Pull from the same data the accordion would show; do not fabricate.`,
  },
  {
    file: 'src/pages/rounds.js', label: 'rounds',
    spec: `REAL FIXES (Founder explicitly asked about this page — high priority):
1. The hero handicap card says "8 ROUNDS" but the Round History header says "25 total" on the same member — confusing. Make the two counts unambiguously distinct: relabel the history header to its true scope (verify in code what each counts — e.g. hero = counted/eligible rounds, history = all rounds across the league). Label them so a member instantly understands the difference. Do not change the underlying numbers; clarify the labels.
2. The Scramble history card (e.g. 'Birdie Bros · Scramble') renders NO "to par" delta while every individual round shows "+26 to par". In the scramble branch (~line 181) compute and render the same par-relative delta the individual branch uses (derive par via roundParTotal or equivalent already used for individual rounds). Match the existing 'to par' format.
3. The Round History list is hierarchically flat — every row has a full-size "Share" button. Demote per-row Share to a low-chrome icon-only affordance (small share SVG, 44px tap target) so the list reads cleaner; keep share reachable.
SMOKE-SENSITIVE: S24 (rounds dispatch list + new-round form), S25 (round detail manage section), S26 (Ship 5+7 edit/delete). Do NOT remove the round-card structure, edit/delete controls, or routing hooks. Restyle the Share affordance; keep its onclick/handler working.`,
  },
  {
    file: 'src/pages/teetimes.js', label: 'teetimes',
    spec: `REAL FIXES:
1. The brass CTA button label uses color:var(--bg)/--cb-card (cream), low contrast on brass. Change to a true high-contrast label (pure white #FFFFFF via the cream token only if it actually computes white — better: use the established on-brass text token, or darken the brass background) so the label clearly passes AA on the brass fill.
2. The "EXAMPLE TEE TIMES" eyebrow uses --muted2 (#A8A395) — fails AA, nearly invisible. Switch to --cb-mute (#656259) or --cb-ink-faint. Keep the uppercase/letterspacing treatment.
3. The three 'EXAMPLE TEE TIMES' cards look like real bookings. Make the sample affordance unmistakable: reduce their opacity (~0.55), add a small 'Sample' pill on each, and remove any hover/active affordance so they don't read as tappable real data.
4. Two competing primary actions for the same task: a brass '+ Post' button in the header AND a brass 'Post a Tee Time' hero in the empty state. On the empty state, demote the header '+ Post' to a quieter ghost/outline treatment so the hero is the unambiguous primary.`,
  },
  {
    file: 'src/pages/richlist.js', label: 'richlist',
    spec: `REAL FIXES:
1. Brass-on-brass monochrome destroys the value hierarchy: the headline number (.lb-pts) is brass/--gold AND the 1st-place medal is --medal-gold (also brass). Keep the big VALUE in brass as the hero, but render rank medals in a NON-brass treatment (distinct color/shape) so rank and value don't compete. If the medal colors live in shared CSS (.lb-* / --medal-* tokens), report in sharedCssNeeds; do what you can in richlist.js (e.g. medal markup/class).
2. The large right-hand number is UNLABELED (it's parcoinsLifetime / 'lifetime earned'). Add a micro-label + coin glyph: stack the number with a 9px uppercase 'LIFETIME' label and the ParCoin coin glyph (use the existing coin SVG/icon used elsewhere — grep for it; NO emoji).
3. Tie handling is invisible/looks buggy (rank 7 = 52, rank 9 = 52). Compute dense/standard competition ranking so equal parcoinsLifetime share the same rank, and add a deterministic secondary sort (e.g. name) so ordering is stable and explainable.`,
  },
  {
    file: 'src/pages/more.js', label: 'more',
    spec: `REAL FIXES:
1. Row rhythm: every one of ~24 entries is identical height (62px) with identical label/sub/tile. Introduce rhythm and lift the priority rows: strengthen the accent rowBg (~.10-.12) and add a 2-3px brass left-edge accent bar so revenue/growth/priority rows stand out from routine ones. Do this within more.js's own row markup.
2. Bottom-nav elevation (nav has no separation from page, background var(--bg) flat): the .bottom-nav is a SHARED component — do NOT edit components.css. Report the needed change in sharedCssNeeds (selector .bottom-nav: add translucent backdrop blur + top shadow, e.g. background:rgba(var(--bg-rgb),.82); -webkit-backdrop-filter:blur(...); box-shadow top). I will apply it centrally.`,
  },
  {
    file: 'src/pages/challenges.js', label: 'challenges',
    spec: `REAL FIXES:
1. Two competing 'create a challenge' affordances on screen: header '+ New' (top-right) AND in-body brass 'Start a Challenge'. On the empty state, drop/quiet the header '+ New' so the in-body CTA is the sole primary action.
2. The three 'Challenge Ideas' chips LOOK tappable (paper cards, bullets) but are inert static text — affordance lie. Make each chip a real action: onclick routes to Router.go('challenges',{create:true}) and pre-fills the stakes/idea. (Grep how the create flow + Router.go are called elsewhere in this file.)
3. (Lower priority) Primary explanatory copy currently in --muted reads thin — move primary explanatory copy to --cb-ink-faint or darker; reserve --muted only for true tertiary text.`,
  },
  {
    file: 'src/pages/scramble.js', label: 'scramble',
    spec: `REAL FIXES (the '77 shown twice' redundancy was ALREADY FIXED — do NOT touch the right-rail score label logic):
1. The bottom ~55% of the viewport is empty cream below the team cards. Use the space: add a tasteful 'Recent scramble activity' section OR a compact leaderboard of all teams by best score OR a proper actionable empty-state — fill the fold with something real (no fabricated data).
2. Member avatars render as near-identical dark-brown discs with gold rings — no initials, no per-member distinction. Give the default/empty avatar (no photo) a visible initial: the member's first initial in brass (font-weight 700, centered) on the felt-green disc, instead of a blank dark disc. Use tokens.
KNOWN ARTIFACT to skip: the '77 / Last 1' redundancy (already fixed in v8.25.12).`,
  },
  {
    file: 'src/pages/settings.js', label: 'settings',
    spec: `REAL FIXES:
1. Defensive: never render a value-row with an empty value. If currentUser.email is falsy, omit the Email value row entirely OR surface an explicit state — don't render a label with a blank value slot. (The blank in the capture was a custom-token artifact, but the guard is correct and worth adding.)
2. The lower ~60% is a flat stack of ~10 identical all-caps brass-outline buttons (Privacy Policy, Terms, Replay onboarding, Sign Out, Reset Local Data, Delete Account, ...). Establish 3 button tiers using existing tokens: primary/filled for the one main action, ghost/text-link weight for pure navigation links (Privacy/Terms/FAQ), and a distinct destructive treatment. Don't make everything a heavy brass-outline.
3. Destructive/irreversible actions (Sign Out, Reset Local Data, Delete Account) are under-differentiated. Group them into a visually distinct 'Danger zone' block at the very bottom (red-tinted container, divider, smaller muted intro line). Keep all existing onclick handlers intact.`,
  },
  {
    file: 'src/pages/calendar.js', label: 'calendar',
    spec: `REAL FIXES:
1. Three competing type systems on one page (a Playfair-style display serif, a monospace, and a sans). Collapse to one display serif (the Playfair-style italic — the brand voice) + one supporting family. Apply the display serif consistently to titles ('June 2026.', 'The course is quiet.') and the supporting family to chrome/labels.
2. '+ NEW EVENT' appears three times in close proximity (toolbar brass-outline, dark-filled inside empty-state card, ...). Keep ONE primary '+ NEW EVENT' (the filled button in the empty-state card, contextually anchored). Demote/remove the others.
3. The status legend ('● SCHEDULED ● ROUND PLAYED ● RANGE') is orphaned far below the grid. Move it directly beneath the calendar grid header/footer so it's adjacent to what it describes. On an empty month, hide the legend (nothing to legend).
KNOWN ARTIFACT to skip: bottom-nav overlapping the grid (that's a fullPage screenshot stitch artifact; #mainApp already reserves padding-bottom).`,
  },
  {
    file: 'src/pages/courses.js', label: 'courses',
    spec: `REAL FIXES:
1. No loading/error state is distinguishable from the empty state. Introduce three explicit render branches: (a) loading -> skeleton rows / spinner; (b) error -> an actionable error card (WHAT/WHERE/ACTION); (c) empty -> the current empty state. (Per P10 actionable surfacing.)
2. Three competing primary CTAs fight for attention: top-right '+ Add', in-card '+ Add a course', and the search field. Pick one primary per state: in the empty/search state make the search field the hero (the path to 'thousands worldwide') and demote the two +Add buttons to one secondary.
3. Three type families visible in chrome (serif display, monospace, sans). Reserve monospace for a single deliberate role (or drop it); switch tab labels/buttons to the standard families. Unify.
4. Contrast: the inactive 'Our Courses' tab label is light-brown monospace on cream — below AA. Darken to --cb-mute / --cb-ink-faint.
KNOWN ARTIFACT to note: the 'directory is quiet' empty state for a member with rounds is because the emulator seed lacks a courses collection (capture artifact), not a code bug — but still add the loading/error branches in #1.`,
  },
  {
    file: 'src/pages/feed.js', label: 'feed',
    spec: `REAL FIXES:
1. Stat chips render 'FIR 0/13', 'GIR 0/18', 'PUTTS 5' that read as broken/fabricated even though they trace to real arrays. Only surface a stat chip when its tracking coverage is meaningful: e.g. show FIR/GIR only when firData/girData has data for >=50% of eligible holes, show PUTTS only when puttsData covers all played holes. Otherwise omit the chip. Don't show a chip that reads as 0/broken.
2. Card monotony: every round renders with the identical full-fat template. Introduce two density tiers: render the most-recent/notable round as the full card; collapse the rest into compact rows (avatar + name + score + relative time). Keep it tasteful.
SMOKE-SENSITIVE (critical): S13 (feed action row = 4 buttons), S14 (kudos persistence), S15 (comment persistence), S16/S17 (home cards clickable). Do NOT remove the action-row buttons, kudos/comment hooks, or data-* attributes. The compact tier may show a lighter action row, but the FULL card MUST keep all 4 action buttons + their hooks. If unsure whether an element is smoke-asserted, keep it.`,
  },
  {
    file: 'src/pages/trophyroom.js', label: 'trophyroom',
    spec: `REAL FIXES (this is the biggest single change — extra scrutiny, keep all data flow intact):
1. The page is a single ~42,501px monolithic scroll (20+ screens) rendering the COMPLETE achievement catalog inline. Introduce PROGRESSIVE DISCLOSURE: split into segmented tabs or anchored sections — e.g. 'Earned' (default) / 'Records' / 'All Trophies' / 'Levels' — so the default view is a screen or two, not 20. Use a tab/segment control consistent with the app; collapse the full catalog behind tabs/expanders. Preserve every trophy/record that renders today — just don't render them all at once.
2. Six top-level sections all render at near-identical visual weight. Establish a weight ladder: make the Level/XP hero + Records the visual peak (larger type, stronger surface, maybe subtle brass border); step routine sections down.
3. Two different visual languages represent the same concept (achievements): 'The wall' uses 2-col trophy CARDS; 'Titles' uses rows. Unify the unlock-progression pattern (one card OR one row component reused), or clearly differentiate by purpose.
4. Contrast: every muted/locked label is tan-on-tan ~1.1:1 (decorative token used for readable text). Switch locked/muted labels to --cb-mute or --cb-ink-faint so they pass AA.
Implement carefully and incrementally; node --check after. If a tab system needs a tiny bit of state, keep it self-contained in trophyroom.js (no shared CSS).`,
  },
]

phase('Implement')
const results = await parallel(PAGES.map(function (p) {
  return function () {
    return agent(
      RULES +
      '\n\n=== YOUR ASSIGNED PAGE: ' + p.label + ' (' + p.file + ') ===\n' +
      'Implement the fixes below by editing ' + p.file + ' only. Read it first.\n\n' + p.spec,
      {
        label: 'fix:' + p.label,
        phase: 'Implement',
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['page', 'fixesApplied', 'nodeCheckPassed', 'selfScore'],
          properties: {
            page: { type: 'string' },
            fixesApplied: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['finding', 'whatChanged'],
                properties: {
                  finding: { type: 'string' },
                  whatChanged: { type: 'string' },
                },
              },
            },
            sharedCssNeeds: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['selector', 'change', 'rationale'],
                properties: {
                  selector: { type: 'string' },
                  change: { type: 'string' },
                  rationale: { type: 'string' },
                },
              },
            },
            skippedArtifacts: { type: 'array', items: { type: 'string' } },
            needsDiagnosis: { type: 'array', items: { type: 'string' } },
            nodeCheckPassed: { type: 'boolean' },
            selfScore: { type: 'number' },
            notes: { type: 'string' },
          },
        },
      }
    )
  }
}))

return { pageCount: PAGES.length, results: results.filter(Boolean) }

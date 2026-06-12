export const meta = {
  name: 'per-page-9.5-re-critique',
  description: 'Re-critique the 15 shipped v8.25.13 pages from fresh captures; find remaining gaps + regressions',
  phases: [{ title: 'Critique', detail: 'one critic per page, reads its PNG' }],
}

const DIR = '.claude/state/visual-9.5-2026-06-12/verify-v13';

const RUBRIC = `
You are a senior product-design critic reviewing PARBAUGHS, a premium golf-league PWA (vanilla JS, warm "country-club meets group-chat" identity). Peer bar: Linear / Stripe / Vercel / Notion polish, but with PARBAUGHS' own warm editorial identity (Fraunces display serif, brass/felt palette, record-book feel). The Founder demands 9.5/10 per dimension and hates "tacky" UI + emoji icons.

Score the page in the attached screenshot (iPhone 14 Pro viewport) across these dimensions, then give an overall 0-10:
  typography · visual hierarchy · information density & whitespace · color & contrast (WCAG AA = readable text >=4.5:1) · component consistency · taste/polish · data-truthfulness (does every visible value look real + traceable?) · actionability (does every state tell the user what/where/what-action?).

CRITICAL CONTEXT — do NOT flag these (they are capture conditions, not bugs):
- The capture is a VIEWPORT-ONLY crop (not full page). "Content ends / empty space below the fold" is the crop, NOT a real empty-space problem — only flag whitespace issues clearly WITHIN the visible content.
- The test account has no email on file, so a "Not on file" email state is correct (not a bug).
- The "courses" directory is empty because the local test seed has no courses collection — that is a seed artifact, NOT a code bug. Judge the empty-state DESIGN, not the emptiness.
- The bottom nav is a real fixed element; it does NOT overlap content (the page reserves space for it).

Be honest and specific. Only report findings that are REAL and visible in this screenshot. For each, give severity (CRITICAL = broken/illegible/false-data, HIGH = clear quality miss, MED = refinement), the dimension, what's wrong (specific, with the visible evidence), and a concrete proposed fix. If the page is genuinely at or near the 9.5 bar, say so and keep findings short. Also flag any REGRESSION you suspect was introduced by the just-shipped changes listed below.
`;

const PAGES = [
  { page: 'home', shipped: 'brass CTA now dark-on-brass; veteran checklist retired; rivalry 4-0 correct.' },
  { page: 'awards', shipped: 'per-tier SVG trophy/medal/ribbon icons; GOLD/SILVER/BRONZE tier borders+chips; "Still up for grabs" un-earned slate; Player of the Year + Scoring Champion now render.' },
  { page: 'records', shipped: 'semantic SVG section icons; 2-tier weight ladder; inline All-time/handicap/champion values surfaced without a tap.' },
  { page: 'rounds', shipped: '"8 ROUNDS" hero vs "25 across the league" header disambiguated; scramble card now shows +to-par delta; Share demoted to icon.' },
  { page: 'teetimes', shipped: 'brass CTA label darkened (AA); EXAMPLE eyebrow AA-safe; sample cards get SAMPLE pill + reduced opacity; header "+Post" demoted to ghost.' },
  { page: 'richlist', shipped: 'non-brass slate rank discs; LIFETIME micro-label + coin glyph; dense tie ranking.' },
  { page: 'more', shipped: 'priority economy rows get brass accent lift; bottom nav now has blur+shadow elevation.' },
  { page: 'challenges', shipped: 'empty-state header "+New" dropped (single primary); the 3 idea chips are now tappable actions.' },
  { page: 'scramble', shipped: 'no-photo avatars render member initials on felt disc; Recent Scramble Activity section fills the space.' },
  { page: 'settings', shipped: 'empty Email row shows "Not on file"; button tiers + grouped claret Danger Zone.' },
  { page: 'calendar', shipped: 'subdeck to sans (type unified); single "+NEW EVENT"; legend hidden on empty months.' },
  { page: 'courses', shipped: 'loading/error/empty branches; search field promoted to hero; "+Add" demoted to quiet link; tabs off mono.' },
  { page: 'feed', shipped: 'stat chips gated on coverage; two density tiers (full notable card + compact rows).' },
  { page: 'trophyroom', shipped: 'monolith replaced with progressive-disclosure tabs (Earned/Records/All Trophies/Levels) + Level-XP hero.' },
  { page: 'shop', shipped: '"Ways to earn" title no longer clipped; dark-on-brass CTAs.' },
];

phase('Critique')
const results = await parallel(PAGES.map(function (p) {
  return function () {
    return agent(
      RUBRIC +
      '\n\nPAGE: ' + p.page + '\nSCREENSHOT: ' + DIR + '/' + p.page + '.png (Read this image first).\n' +
      'JUST SHIPPED on this page (do not re-flag these as missing): ' + p.shipped + '\n\n' +
      'Read the screenshot, then return your structured critique.',
      {
        label: 'critique:' + p.page,
        phase: 'Critique',
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['page', 'overallScore', 'atBar', 'remainingFindings'],
          properties: {
            page: { type: 'string' },
            overallScore: { type: 'number' },
            atBar: { type: 'boolean', description: 'true if no CRITICAL/HIGH real findings remain (only MED/taste/Founder-sign-off left)' },
            remainingFindings: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['severity', 'dimension', 'finding', 'proposedFix'],
                properties: {
                  severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MED'] },
                  dimension: { type: 'string' },
                  finding: { type: 'string' },
                  proposedFix: { type: 'string' },
                },
              },
            },
            regressions: { type: 'array', items: { type: 'string' } },
            notes: { type: 'string' },
          },
        },
      }
    )
  }
}))

return { pageCount: PAGES.length, results: results.filter(Boolean) }

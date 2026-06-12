export const meta = {
  name: 'icon-weight-normalize',
  description: 'Normalize inline line-icon stroke-weights to the house standard across the highest-icon-density files (#42)',
  phases: [{ title: 'Icons', detail: 'one agent per file, normalize line-icon stroke-widths' }],
}

const RULES = `
PARBAUGHS — vanilla JS (var) + Vite + Firebase PWA golf app. Task #42: make inline SVG icons cleaner + CONSISTENT in stroke weight across the app. The audit (whole src/): stroke-width "1.5" is the dominant house weight (115 uses) on the 24x24 + 16x16 grids; a long tail of inconsistent weights exists (1.2, 1.3, 1.6, 1.7, 1.8, 1.4, etc.) that makes icons look uneven.

THE HOUSE STANDARD to normalize TOWARD:
- viewBox 0 0 24 24  → stroke-width 1.5
- viewBox 0 0 16 16  → stroke-width 1.5 (these are small; 1.5 matches the dominant usage)
- viewBox 0 0 20 20  → stroke-width 1.6 (slightly heavier ok at this grid)
- viewBox 0 0 12 12  → stroke-width 1.5

NORMALIZE ONLY genuine STROKE-BASED LINE ICONS (fill="none" stroke="..."), and ONLY when the current weight is an odd off-standard value (e.g. 1.2/1.3/1.4/1.6/1.7/1.8 on a 24-grid line icon → 1.5).

DO NOT TOUCH (leave exactly as-is):
- FILLED icons / shapes (fill="<color>" not "none") — their visual weight is the fill, not the stroke.
- Decorative / illustration / large-display SVGs: anything with a viewBox bigger than ~64 (e.g. the tee-shot golfer 480x460, the caddy 160x300, hero illustrations, share-card art, onboarding 64x64 hero icons) — these are art, not UI icons; leave them.
- Animated/progress strokes, rings, dividers, the coin glyph, sparklines, charts.
- Stroke widths that are INTENTIONALLY heavy for a reason (e.g. a 2 or 2.5 used as a bold accent in a specific control) IF changing them to 1.5 would clearly weaken the design — when unsure, leave it (do no harm > forced uniformity).
- Any data-* attr / id / structure smoke tests assert.

PROCESS: read your file, find inline <svg ...><path/line/circle ... stroke-width="X"> line icons, and where X is an off-standard weight for its grid AND it is a stroke line icon, set X to the house standard for that grid. Keep everything else. var only; no emoji; node --check after; report counts.
`;

const FILES = [
  'src/pages/settings.js', 'src/pages/feed.js', 'src/pages/shop.js', 'src/pages/chat.js',
  'src/pages/scorecard.js', 'src/pages/members-detail.js', 'src/pages/rounds.js', 'src/pages/tournament.js',
  'src/pages/home-rail-newuser.js', 'src/core/notification-types.js', 'src/pages/partygames.js', 'src/pages/seasonrecap.js',
  'src/pages/more.js', 'src/pages/records.js', 'src/pages/courses.js', 'src/pages/trophyroom.js',
];

phase('Icons')
const results = await parallel(FILES.map(function (f) {
  return function () {
    return agent(
      RULES + '\n\n=== YOUR FILE: ' + f + ' ===\nNormalize off-standard line-icon stroke-weights in ' + f + ' only, per the rules. If the file has no off-standard line icons, change nothing and report that.',
      { label: 'icons:' + f.split('/').pop(), phase: 'Icons',
        schema: { type: 'object', additionalProperties: false, required: ['file', 'iconsNormalized', 'nodeCheckPassed'],
          properties: { file: { type: 'string' }, iconsNormalized: { type: 'number' }, changes: { type: 'array', items: { type: 'string' } }, leftAsIs: { type: 'string' }, nodeCheckPassed: { type: 'boolean' }, notes: { type: 'string' } } } }
    )
  }
}))
return { fileCount: FILES.length, results: results.filter(Boolean) };

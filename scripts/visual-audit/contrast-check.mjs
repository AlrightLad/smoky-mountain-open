// WCAG 2.1 contrast checker for the Clubhouse light-mode mute/brass text tokens.
// Guardrail for the design-audit-2026-06-08 contrast-token sweep: proves which
// muted/brass-on-chalk pairings fail the 4.5:1 normal-text floor and verifies
// the chosen replacements clear it. Run: node scripts/visual-audit/contrast-check.mjs
// (No runtime dependency — pure check. Extend PAIRS when adding muted-on-chalk text.)

function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function lum(hex) {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function ratio(fg, bg) {
  const a = lum(fg), b = lum(bg);
  const hi = Math.max(a, b), lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

// Confirmed token values (src/styles/base.css :root, theme-invariant for derived tokens).
const T = {
  chalk: '#F4EFE4', canvas: '#E7E0CD', paper: '#FCFAF5',
  ink: '#14130F', charcoal: '#4A4740', inkLink: '#5A4318', inkFaint: '#5F5C50',
  mute: '#7A766B', mute1: '#6B6862', muteSoft: '#928E80',
  brass: '#B4893E', brassDeep: '#8C6A2E',
};
const AA = 4.5; // normal text floor

// NOTE: live getComputedStyle (2026-06-08) proved the feed composer AND settings
// rows render on --cb-canvas #E7E0CD (the page ground), NOT chalk — so mute-1
// (4.22:1 on canvas) is INSUFFICIENT there; --cb-ink-faint #5F5C50 (5.09:1) is
// the lightest token clearing AA on canvas. Awards labels sit on --card (paper),
// gold-tier gradient down to chalk; --cb-ink-link clears both with margin.
const PAIRS = [
  // --- current state (audit finding: these FAIL) ---
  ['feed composer prompt (CURRENT mute-soft/canvas)', T.muteSoft, T.canvas, false],
  ['feed composer hover  (CURRENT mute/canvas)', T.mute, T.canvas, false],
  ['settings .set-row__desc (CURRENT mute/canvas)', T.mute, T.canvas, false],
  ['awards tier label (CURRENT brass/chalk)', T.brass, T.chalk, false],
  ['awards tier label (CURRENT brass/paper)', T.brass, T.paper, false],
  // --- proposed fixes (these must PASS >= 4.5) ---
  ['feed composer prompt (FIX -> ink-faint/canvas)', T.inkFaint, T.canvas, true],
  ['feed composer hover  (FIX -> charcoal/canvas)', T.charcoal, T.canvas, true],
  ['settings .set-row__desc (FIX -> ink-faint/canvas)', T.inkFaint, T.canvas, true],
  ['settings .set-row__desc (FIX -> ink-faint/paper desktop)', T.inkFaint, T.paper, true],
  ['awards tier label (FIX -> ink-link/chalk worst-case)', T.inkLink, T.chalk, true],
  ['awards tier label (FIX -> ink-link/paper)', T.inkLink, T.paper, true],
  // --- guardrail reference table (lightest AA-safe token per ground) ---
  ['ref: mute-1 on canvas (FAILS — do not use for text on canvas)', T.mute1, T.canvas, false],
  ['ref: ink-faint on chalk', T.inkFaint, T.chalk, true],
];

let fails = 0;
console.log('WCAG 2.1 normal-text floor = ' + AA + ':1\n');
for (const [label, fg, bg, expectPass] of PAIRS) {
  const r = ratio(fg, bg);
  const pass = r >= AA;
  const mark = pass ? 'PASS' : 'FAIL';
  const flag = (pass === expectPass) ? '' : '  <-- UNEXPECTED';
  if (label.includes('FIX') && !pass) fails++;
  console.log(`  ${mark}  ${r.toFixed(2)}:1  ${fg} on ${bg}  ${label}${flag}`);
}
console.log('\n' + (fails === 0 ? 'All proposed FIX pairs clear AA.' : fails + ' FIX pair(s) still below AA — pick a darker token.'));
process.exit(fails === 0 ? 0 : 1);

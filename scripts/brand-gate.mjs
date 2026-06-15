#!/usr/bin/env node
/**
 * brand-gate.mjs — the LOW-FREEDOM, can't-skip first step of the
 * parbaughs-brand-gate skill. Mechanically injects the locked brand spec
 * (BRAND-RULES.json + BRAND-BRIEF.md) into every design-generation prompt so
 * the model never reverts to its generic prior ("the Olympic-medal crest").
 *
 * Root cause it fixes (3 independent research sources + Founder 2026-06-15):
 * we generated WITHOUT a locked style, from a text-only brief, with no visual
 * anchor -> generic slop. The cure is to make the brief UNSKIPPABLE and to make
 * the doer NOT the judge. This script is the unskippable half; the visual-judge
 * skill is the doer!=judge half.
 *
 * Usage:
 *   node scripts/brand-gate.mjs preamble
 *       -> prints the mandatory brand-spec preamble (palette + lanes + motifs +
 *          prohibitions + global negative + semantic anchor). Prepend verbatim
 *          to ANY image/asset/page-art generation prompt.
 *
 *   node scripts/brand-gate.mjs wrap --lane <tour|rubberhose> \
 *        --size "<dimensions + worn render size>" \
 *        --purpose "<what this image IS / the SKU or surface it represents>" \
 *        --usage "<exactly how + where it is rendered in the app>" \
 *        --subject "<named materials + form clause>"
 *       -> emits the FULL art-directed prompt: preamble + SIZE + PURPOSE +
 *          USAGE + subject + lane colorway + semantic anchor + global negative,
 *          ready to refine via the parbaughs-image-gen skill then paste into the
 *          gen tool. Exits non-zero if ANY of lane/size/purpose/usage/subject is
 *          missing — the Founder (2026-06-15) requires every prompt to carry the
 *          size, purpose, and intended use, so a caller cannot generate without
 *          them. (Legacy positional form `wrap <lane> "<subject>"` still works
 *          but WARNS that size/purpose/usage are required by policy.)
 *
 *   node scripts/brand-gate.mjs check
 *       -> prints the 5-point QC checklist to run against the FINISHED PNG
 *          (the RED/GREEN gate). Same questions every time, no improvising.
 *
 *   node scripts/brand-gate.mjs lane <surface>
 *       -> prints the correct lane for a named surface (ring/marker/caddie/...).
 *          Removes the "which lane?" judgment call from the human.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const RULES_PATH = join(ROOT, '.claude/state/design/BRAND-RULES.json');
const BRIEF_PATH = join(ROOT, '.claude/state/design/BRAND-BRIEF.md');

function loadRules() {
  try {
    return JSON.parse(readFileSync(RULES_PATH, 'utf8'));
  } catch (e) {
    console.error(`[brand-gate] FATAL: cannot read ${RULES_PATH}: ${e.message}`);
    console.error('[brand-gate] The brand spec is the load-bearing artifact. Do NOT generate without it.');
    process.exit(2);
  }
}

// Surface -> lane map. Cosmetic ITEMS are brass/H&B (tour); character art is rubber-hose.
// Source: BRAND-BRIEF.md "WHICH lane for WHICH surface" + GOVERNING COSMETIC DIRECTION.
const SURFACE_LANE = {
  ring: 'tour', rings: 'tour',
  marker: 'tour', markers: 'tour', ballmarker: 'tour',
  nameplate: 'tour', nameplates: 'tour',
  title: 'tour', titles: 'tour',
  card: 'tour', cards: 'tour', cardskin: 'tour',
  banner: 'tour', banners: 'tour',
  crest: 'tour', clubcrest: 'tour',
  bagtag: 'tour', tag: 'tour',
  merch: 'tour', product: 'tour',
  caddie: 'rubberhose', caddies: 'rubberhose', caddy: 'rubberhose',
  decoration: 'rubberhose', decorations: 'rubberhose', deco: 'rubberhose',
  onboarding: 'rubberhose', scene: 'rubberhose', illustration: 'rubberhose',
  character: 'rubberhose', mascot: 'rubberhose', placeholder: 'rubberhose',
};

function paletteLines(rules) {
  return Object.entries(rules.palette_hex)
    .map(([k, v]) => `    - ${k.replace(/_/g, ' ')}: ${v}`)
    .join('\n');
}

function preamble(rules) {
  return `=== PARBAUGHS BRAND SPEC — MANDATORY PROMPT PREAMBLE (do not omit) ===
APP: ${rules.app}

BRAND RECIPE: ${rules.brand_recipe}

APPROVED PALETTE (use these literal hex values — generated art must MATCH the app):
${paletteLines(rules)}

FORBIDDEN PALETTE (auto-RED if present):
${rules.palette_forbidden.map((p) => `    - ${p}`).join('\n')}

RUBBER-HOSE HALLMARKS (the character lane):
${rules.rubber_hose_hallmarks.map((h) => `    - ${h}`).join('\n')}

LANES (every asset must be ONE of these, never a third generic style):
  tour/H&B  -> ${rules.lanes.tour_HnB.use_for}
              colorway: ${rules.lanes.tour_HnB.colorway}
              feel: ${rules.lanes.tour_HnB.feel}
  leisure   -> ${rules.lanes.leisure_rubberhose.use_for}
              feel: ${rules.lanes.leisure_rubberhose.feel}

MARKS & MOTIFS: primary = ${rules.marks_and_motifs.primary_mark}
  golf motifs: ${rules.marks_and_motifs.golf_motifs.join(', ')}
  signature: ${rules.marks_and_motifs.signature_motif}

PROHIBITIONS (auto-RED if present):
${rules.prohibitions.map((p) => `    - ${p}`).join('\n')}

GLOBAL NEGATIVE (append verbatim to every gen): ${rules.global_negative}

SEMANTIC ANCHOR (append verbatim to every gen): ${rules.semantic_anchor}
=== END BRAND SPEC ===`;
}

function wrap(rules, fields) {
  const { lane, size, purpose, usage, subject } = fields;
  const laneKey = lane === 'tour' ? 'tour_HnB' : lane === 'rubberhose' ? 'leisure_rubberhose' : null;
  const missing = [];
  if (!laneKey) missing.push('--lane <tour|rubberhose>');
  if (!size || !size.trim()) missing.push('--size "<dimensions + worn render size>"');
  if (!purpose || !purpose.trim()) missing.push('--purpose "<what this image IS>"');
  if (!usage || !usage.trim()) missing.push('--usage "<how + where it renders>"');
  if (!subject || !subject.trim()) missing.push('--subject "<named materials + form>"');
  if (missing.length) {
    console.error('[brand-gate] ERROR: every image prompt MUST carry lane + size + purpose + usage + subject');
    console.error('[brand-gate] (Founder 2026-06-15: "all image prompts… provide size needed and purpose of');
    console.error('[brand-gate]  image and how it will be used… so we are not generating… random images").');
    console.error('[brand-gate] Missing: ' + missing.join('  '));
    if (!laneKey) console.error('[brand-gate] Tip: `node scripts/brand-gate.mjs lane <surface>` resolves the lane.');
    process.exit(1);
  }
  const L = rules.lanes[laneKey];
  return `${preamble(rules)}

--- GENERATION PROMPT (lane: ${lane}) ---
SIZE / FORMAT: ${size.trim()}
PURPOSE: ${purpose.trim()}
USAGE (where + how it renders): ${usage.trim()}
SUBJECT: ${subject.trim()}
LANE FEEL: ${L.feel}
LANE COLORWAY: ${L.colorway || 'the approved PARBAUGHS palette above'}
COMPOSITION: one asymmetric focal peak; a PARBAUGHS motif present (${rules.marks_and_motifs.signature_motif} / crossed hickories / claret pennant); centered subject on a keyable background if a frame/overlay.
SEMANTIC: ${rules.semantic_anchor}
NEGATIVE: ${rules.global_negative}
--- END PROMPT ---
NEXT: refine this into a senior-professional prompt via the parbaughs-image-gen skill
(named-material + real-optics + one-light formula, blank-then-composite logo) BEFORE
generating. Generate ONE, then run \`node scripts/brand-gate.mjs check\` on the finished PNG.`;
}

// Parse `--flag value` pairs from argv tail. Bare positional `wrap <lane> "<subject>"`
// is still accepted (legacy) but WARNS that size/purpose/usage are policy-required.
function parseWrapArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      flags[a.slice(2)] = argv[++i] ?? '';
    } else {
      positional.push(a);
    }
  }
  if (!flags.lane && positional.length) {
    console.error('[brand-gate] WARN: legacy positional form. Policy requires --size/--purpose/--usage too.');
    flags.lane = positional[0];
    flags.subject = positional.slice(1).join(' ');
  }
  return flags;
}

function check(rules) {
  return `=== BRAND-GATE 5-POINT QC (run against the FINISHED PNG; doer != judge) ===
${rules.qc_5point.map((q, i) => `  ${i + 1}. ${q}`).join('\n')}

VERDICT RULE:
  - ALL 5 pass            -> GREEN (LOW-risk asset may ship; HIGH-risk still needs Founder taste)
  - ANY palette/prohibition fail -> RED (do NOT ship; regenerate with the failure in the negative)
  - subjective "is it 9.5?" -> cap self-rating at 9.4 (AMD-028); >=9.5 is the Founder's call on staging

HIGH-RISK asset types (always need Founder sign-off, never agent-ship a >=9.5 claim):
${rules.high_risk_assets_need_founder_signoff.map((a) => `    - ${a}`).join('\n')}
=== END QC ===`;
}

const [, , cmd, arg1, ...rest] = process.argv;
const rules = loadRules();

switch (cmd) {
  case 'preamble':
    console.log(preamble(rules));
    break;
  case 'wrap':
    console.log(wrap(rules, parseWrapArgs([arg1, ...rest].filter((x) => x !== undefined))));
    break;
  case 'check':
    console.log(check(rules));
    break;
  case 'lane': {
    const surf = (arg1 || '').toLowerCase().replace(/[^a-z]/g, '');
    const lane = SURFACE_LANE[surf];
    if (!lane) {
      console.error(`[brand-gate] no mapped lane for surface "${arg1}". Known: ${Object.keys(SURFACE_LANE).join(', ')}`);
      process.exit(1);
    }
    console.log(lane);
    break;
  }
  default:
    console.error('Usage: node scripts/brand-gate.mjs <preamble|wrap <lane> "subject"|check|lane <surface>>');
    console.error('See the file header for full docs. brief: ' + BRIEF_PATH);
    process.exit(2);
}

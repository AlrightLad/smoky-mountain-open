// scripts/_recolor-swing.mjs
//
// Recolor the golf-swing Lottie golfer from his orange/clashing palette into
// the Parbaughs "dawn" colorway, writing public/lottie/golf-swing-pb.json.
//
// Lottie color model: normalized [r,g,b,a] (0..1) arrays inside shape items.
//   - ty:'fl' (fill)   -> .c.k = [r,g,b,a]
//   - ty:'st' (stroke) -> .c.k = [r,g,b,a]
//   - ty:'gf'/'gs' (gradient fill/stroke) -> .g.k(.k) = [pos,r,g,b, pos,r,g,b, ...]
//
// Strategy: classified remap, NOT a loose heuristic. We match exact source
// colors (rounded) to keep skin/club/ball/outlines untouched. Conservative by
// design — anything not in the explicit map is left as-is.
//
// Parbaughs dawn palette (the targets):
//   brass/gold  #caa04a = [0.792, 0.627, 0.290]
//   gold-light  #d8b260 = [0.847, 0.698, 0.376]
//   cream/ivory #f4efe3 = [0.957, 0.937, 0.890]
//   felt-green  #3c5848 = [0.235, 0.345, 0.282]
//   felt-dark   #2a3f33 = [0.165, 0.247, 0.200]
//   sun         #f6e6b4 = [0.965, 0.902, 0.706]

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '..', 'public', 'lottie', 'golf-swing.json');
const OUT = join(__dirname, '..', 'public', 'lottie', 'golf-swing-pb.json');

// Parbaughs dawn targets
const BRASS = [0.792, 0.627, 0.29];
const GOLD_LIGHT = [0.847, 0.698, 0.376];
const CREAM = [0.957, 0.937, 0.89];
const FELT = [0.235, 0.345, 0.282];
const FELT_DARK = [0.165, 0.247, 0.2];

// Source colors (rounded to 3dp for matching) -> dawn target.
// Each entry documents the role we identified in the rig.
const MAP = [
  // --- ORANGE clothing / warm fills (the dominant clash) -> BRASS ---
  { from: [1, 0.659, 0.259], to: BRASS, role: 'orange shirt/arms/torso fill' },
  { from: [1, 0.66, 0.259], to: BRASS, role: 'orange stroke (rounding twin)' },
  { from: [1, 0.431, 0.259], to: GOLD_LIGHT, role: 'warm orange-red accent stroke' },
  // --- RED accents on the golfer's outfit -> BRASS (pull the warm clash to gold) ---
  { from: [1, 0, 0], to: BRASS, role: 'pure-red outfit accents (shape layers 2-5)' },
  // --- MAGENTA / hot-pink clothing (hat band + leg/shorts) -> CREAM & FELT ---
  { from: [1, 0.255, 0.675], to: CREAM, role: 'magenta hat/garment fill' },
  { from: [1, 0.255, 0.676], to: CREAM, role: 'magenta garment fill (rounding twin)' },
  { from: [1, 0.059, 0.391], to: CREAM, role: 'hot-pink garment fill (legs/cuffs)' },
  // --- BLUE / PURPLE trousers + shoe/leg accents -> FELT-GREEN ---
  { from: [0.31, 0.259, 1], to: FELT, role: 'blue-purple trouser/shoe fill' },
  { from: [0.231, 0.184, 0.855], to: FELT_DARK, role: 'blue trouser/cap stroke' },
  { from: [0.686, 0.775, 1], to: FELT, role: 'light-blue leg/trouser stroke' },
  // --- TEAL decorative effect shapes (ground swoosh) -> FELT-GREEN family ---
  { from: [0, 0.827, 0.701], to: FELT, role: 'teal ground/effect fill' },
  { from: [0.338, 0.65, 0.706], to: FELT, role: 'teal ballfly-trail fill' },
];

// Explicit KEEP list (skin/club/ball/tee/outline) for documentation + a guard.
// We never write these; they simply aren't in MAP. Listed so reviewers can see
// the deliberate exclusions:
//   [0.839,0.839,0.839] light-grey outline strokes
//   [1,1,1]             white outlines/highlights
//   [0.196,0.196,0.196] / [0.165,0.165,0.165] dark detail (head, ball)
//   [1,0.966,0.808]     tee body (warm cream) — KEEP, it's the tee not clothing
//   [1,0.216,0.216]     tee stroke — KEEP
const EPS = 0.004; // tolerance for float match (covers 3dp rounding drift)

function rgbMatch(k, from) {
  return (
    Math.abs(k[0] - from[0]) < EPS &&
    Math.abs(k[1] - from[1]) < EPS &&
    Math.abs(k[2] - from[2]) < EPS
  );
}

function findMap(k) {
  for (const m of MAP) if (rgbMatch(k, m.from)) return m;
  return null;
}

// Tally: key = "from -> to (role)", value = count
const remapTally = new Map();
function record(m) {
  const key = `[${m.from.join(', ')}] -> [${m.to.join(', ')}]  (${m.role})`;
  remapTally.set(key, (remapTally.get(key) || 0) + 1);
}

function recolorSolid(colorK) {
  // colorK is the [r,g,b,a] array (alpha preserved)
  const m = findMap(colorK);
  if (!m) return false;
  colorK[0] = m.to[0];
  colorK[1] = m.to[1];
  colorK[2] = m.to[2];
  // alpha (index 3) left untouched
  record(m);
  return true;
}

function recolorGradient(stopsArr) {
  // Gradient stops: [pos,r,g,b, pos,r,g,b, ...] (color stops); may be followed
  // by [pos,alpha,...] opacity stops. We only touch the rgb in color stops.
  // We can't know the color-stop count without 'p', so match defensively per
  // 4-tuple where the leading value looks like a position (0..1).
  let touched = false;
  for (let i = 0; i + 3 < stopsArr.length; i += 4) {
    const rgb = [stopsArr[i + 1], stopsArr[i + 2], stopsArr[i + 3]];
    const m = findMap(rgb);
    if (m) {
      stopsArr[i + 1] = m.to[0];
      stopsArr[i + 2] = m.to[1];
      stopsArr[i + 3] = m.to[2];
      record(m);
      touched = true;
    }
  }
  return touched;
}

function walk(node) {
  if (Array.isArray(node)) {
    for (const v of node) walk(v);
    return;
  }
  if (node && typeof node === 'object') {
    // Solid fill / stroke
    if ((node.ty === 'fl' || node.ty === 'st') && node.c && Array.isArray(node.c.k)) {
      recolorSolid(node.c.k);
    }
    // Gradient fill / stroke
    if ((node.ty === 'gf' || node.ty === 'gs') && node.g && node.g.k) {
      const k = Array.isArray(node.g.k.k) ? node.g.k.k : node.g.k;
      if (Array.isArray(k)) recolorGradient(k);
    }
    for (const key in node) walk(node[key]);
  }
}

// ---- run ----
const raw = readFileSync(SRC, 'utf8');
const doc = JSON.parse(raw);

walk(doc.layers);
// Also walk assets (precomps) in case any shapes live there
if (doc.assets) walk(doc.assets);

writeFileSync(OUT, JSON.stringify(doc));

// ---- validate ----
const reparsed = JSON.parse(readFileSync(OUT, 'utf8'));
const ok =
  typeof reparsed.v === 'string' &&
  typeof reparsed.fr === 'number' &&
  Array.isArray(reparsed.layers) &&
  reparsed.layers.length > 0;

console.log('=== Parbaughs golf-swing recolor ===');
console.log('source :', SRC);
console.log('output :', OUT);
console.log('valid  :', ok, `(v=${reparsed.v} fr=${reparsed.fr} layers=${reparsed.layers.length})`);
console.log('\nRemaps applied (before -> after  (role)  xN):');
let total = 0;
for (const [key, n] of [...remapTally.entries()].sort()) {
  console.log(`  ${key}  x${n}`);
  total += n;
}
console.log(`\ntotal color writes: ${total}`);
if (!ok) {
  console.error('VALIDATION FAILED');
  process.exit(1);
}

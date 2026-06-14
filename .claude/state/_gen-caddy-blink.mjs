// #71 — Generate Cuphead-style BLINK frames for the 4 caddy portraits.
//
// WHY local composite (not a 2nd Imagen gen): a frame-swap blink only reads as
// "alive" if EVERYTHING except the eyes stays pixel-identical between frames.
// Two independently-generated images jitter the whole head -> exactly the
// flicker the Founder hated in the swing animation. So we start from the
// byte-identical base portrait and redraw ONLY the eye region (skin fill +
// rubber-hose closed-lid arc). Zero registration jitter by construction.
//
// Pass 1 (mode=detect): auto-find each caddy's eyes, draw debug markers,
//   emit a montage for visual confirmation BEFORE committing blink frames.
// Pass 2 (mode=blink):  composite + export caddy-<id>-blink.jpg.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const MODE = process.argv[2] || 'detect';
const CADDIES = ['caddy-caddy', 'caddy-oldtom', 'caddy-birdie', 'caddy-bagroom'];
const SRC = 'public/img/avatars/';
const OUT = '.claude/state/caddy-anim';
mkdirSync(OUT, { recursive: true });

// Hand-tuned eye boxes (filled in after the detect pass if auto-detect is off).
// {cx,cy,w,h} in 256-space per caddy. null => use auto-detection.
const EYE_OVERRIDE = {
  // 'caddy-caddy': [{cx:..,cy:..,w:..,h:..}, {..}],
};

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1200, height: 700 } });

// Load each portrait as a data URI so the page <img> can read pixels.
const dataUris = {};
for (const n of CADDIES) {
  dataUris[n] = 'data:image/jpeg;base64,' + readFileSync(SRC + n + '.jpg').toString('base64');
}

const result = await page.evaluate(async ({ CADDIES, dataUris, MODE, EYE_OVERRIDE }) => {
  function loadImg(src) {
    return new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = src; });
  }

  // Detect the two eyes: in the face band (skip cap + margins), find the two
  // brightest low-saturation "sclera" blobs flanking center, each containing a
  // dark pupil. Returns [{cx,cy,w,h}, {cx,cy,w,h}] left,right in 256-space.
  function detectEyes(data, W, H) {
    // Face band: y 30%..62%, x 18%..82% (eyes sit above the nose midline).
    const y0 = Math.round(H * 0.30), y1 = Math.round(H * 0.62);
    const x0 = Math.round(W * 0.18), x1 = Math.round(W * 0.82);
    // Mark "sclera-ish" pixels: bright + low saturation (white of the eye),
    // OR very dark compact (pupil). We cluster the dark pupils — most reliable.
    const dark = [];
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * W + x) * 4;
        const r = data[i], g = data[i + 1], bl = data[i + 2];
        const v = (r + g + bl) / 3;
        // pupil: dark but small; ink outline is also dark -> we filter by
        // requiring a bright (sclera) neighbor within a few px.
        if (v < 70) dark.push([x, y]);
      }
    }
    // Cluster dark pixels by simple grid bucketing, keep clusters that have a
    // bright neighbor (sclera) -> excludes the long ink outline / brows.
    function brightNear(x, y) {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const i = (yy * W + xx) * 4; const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const mx = Math.max(data[i], data[i + 1], data[i + 2]), mn = Math.min(data[i], data[i + 1], data[i + 2]);
        if (v > 185 && (mx - mn) < 40) return true; // near-white sclera
      }
      return false;
    }
    const eyePupils = dark.filter(([x, y]) => brightNear(x, y));
    // Bucket into clusters (8px cells), merge adjacent.
    const cells = {};
    eyePupils.forEach(([x, y]) => { const k = (x >> 3) + ',' + (y >> 3); (cells[k] = cells[k] || []).push([x, y]); });
    let clusters = Object.values(cells);
    // Merge clusters whose centroids are within 14px.
    function centroid(c) { let sx = 0, sy = 0; c.forEach(([x, y]) => { sx += x; sy += y; }); return [sx / c.length, sy / c.length]; }
    let merged = [];
    clusters.forEach((c) => {
      const cc = centroid(c);
      const hit = merged.find((m) => { const mc = centroid(m); return Math.hypot(mc[0] - cc[0], mc[1] - cc[1]) < 16; });
      if (hit) hit.push(...c); else merged.push([...c]);
    });
    merged = merged.filter((c) => c.length >= 4).sort((a, b) => b.length - a.length).slice(0, 6);
    // Pick the best left+right pair: similar y, mirrored about center, decent size.
    let best = null, bestScore = 1e9;
    for (let i = 0; i < merged.length; i++) for (let j = i + 1; j < merged.length; j++) {
      const a = centroid(merged[i]), c = centroid(merged[j]);
      const [L, R] = a[0] < c[0] ? [a, c] : [c, a];
      const dy = Math.abs(L[1] - R[1]);
      const dx = R[0] - L[0];
      const sym = Math.abs((L[0] + R[0]) / 2 - W / 2);
      if (dx < W * 0.12 || dx > W * 0.55) continue; // plausible eye spacing
      const score = dy * 2 + sym; // flat + centered
      if (score < bestScore) { bestScore = score; best = [L, R]; }
    }
    if (!best) return null;
    return best.map(([cx, cy]) => ({ cx: Math.round(cx), cy: Math.round(cy), w: Math.round(W * 0.13), h: Math.round(H * 0.085) }));
  }

  function sampleSkin(ctx, cx, cy, h) {
    // Sample skin a touch below the eye (cheek), median of a small patch.
    const px = ctx.getImageData(cx - 3, cy + Math.round(h * 1.2), 7, 5).data;
    const rs = [], gs = [], bs = [];
    for (let i = 0; i < px.length; i += 4) { rs.push(px[i]); gs.push(px[i + 1]); bs.push(px[i + 2]); }
    const med = (a) => a.sort((x, y) => x - y)[a.length >> 1];
    return `rgb(${med(rs)},${med(gs)},${med(bs)})`;
  }

  const out = { detect: {}, blinkUris: {} };
  for (const n of CADDIES) {
    const im = await loadImg(dataUris[n]);
    const W = im.naturalWidth, H = im.naturalHeight;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'); ctx.drawImage(im, 0, 0);
    const data = ctx.getImageData(0, 0, W, H).data;
    let eyes = (EYE_OVERRIDE[n] && EYE_OVERRIDE[n].length) ? EYE_OVERRIDE[n] : detectEyes(data, W, H);
    out.detect[n] = eyes;

    if (MODE === 'blink' && eyes) {
      // Composite the closed eye: skin fill over the eye, then a rubber-hose
      // downward-curving lid arc (heavy black ink, matches the outline weight).
      eyes.forEach((e) => {
        const skin = sampleSkin(ctx, e.cx, e.cy, e.h);
        ctx.save();
        // Soft skin patch over the open eye (slightly larger than the eye box).
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.ellipse(e.cx, e.cy, e.w * 0.62, e.h * 0.95, 0, 0, Math.PI * 2);
        ctx.fill();
        // Closed-lid arc — a calm downward curve (⌒ flipped), ink-black.
        ctx.strokeStyle = '#1a160f';
        ctx.lineWidth = Math.max(3, Math.round(W * 0.016));
        ctx.lineCap = 'round';
        ctx.beginPath();
        const aw = e.w * 0.52;
        ctx.moveTo(e.cx - aw, e.cy - e.h * 0.05);
        ctx.quadraticCurveTo(e.cx, e.cy + e.h * 0.55, e.cx + aw, e.cy - e.h * 0.05);
        ctx.stroke();
        // tiny lash hint at outer corner for character
        ctx.restore();
      });
      out.blinkUris[n] = cv.toDataURL('image/jpeg', 0.92);
    }

    if (MODE === 'detect' && eyes) {
      // draw debug markers
      ctx.strokeStyle = '#e0002b'; ctx.lineWidth = 2;
      eyes.forEach((e) => { ctx.strokeRect(e.cx - e.w * 0.62, e.cy - e.h * 0.95, e.w * 1.24, e.h * 1.9); });
      out.blinkUris[n + '__dbg'] = cv.toDataURL('image/jpeg', 0.92);
    }
  }
  return out;
}, { CADDIES, dataUris, MODE, EYE_OVERRIDE });

console.log('DETECT:', JSON.stringify(result.detect, null, 0));

// Write outputs
if (MODE === 'detect') {
  // Build a montage page: base vs detected for each caddy
  const cells = CADDIES.map((n) => `<figure><figcaption>${n}</figcaption><img src="${result.blinkUris[n + '__dbg'] || dataUris[n]}"></figure>`).join('');
  await page.setContent(`<body style="margin:0;background:#222;display:flex;gap:10px;padding:14px;font-family:monospace;color:#fff">
    <style>figure{margin:0;text-align:center}figcaption{font-size:11px;margin-bottom:4px}img{width:200px;height:200px;image-rendering:auto;border:1px solid #444}</style>${cells}</body>`);
  await page.screenshot({ path: `${OUT}/detect-montage.png` });
  console.log('detect montage ->', `${OUT}/detect-montage.png`);
} else {
  for (const n of CADDIES) {
    if (!result.blinkUris[n]) { console.log('NO BLINK for', n); continue; }
    const b64 = result.blinkUris[n].split(',')[1];
    writeFileSync(`${OUT}/${n}-blink.jpg`, Buffer.from(b64, 'base64'));
    console.log('wrote', `${OUT}/${n}-blink.jpg`);
  }
  // open|blink side-by-side montage for visual judgement
  const cells = CADDIES.map((n) => `<div class="cell"><div class="lbl">${n}</div>
    <div class="pair"><figure><figcaption>open</figcaption><img src="${dataUris[n]}"></figure>
    <figure><figcaption>blink</figcaption><img src="${result.blinkUris[n] || dataUris[n]}"></figure></div></div>`).join('');
  await page.setContent(`<body style="margin:0;background:#222;display:flex;flex-wrap:wrap;gap:14px;padding:14px;font-family:monospace;color:#fff">
    <style>.lbl{font-size:12px;margin-bottom:4px}.pair{display:flex;gap:6px}figure{margin:0;text-align:center}figcaption{font-size:10px;color:#bbb}img{width:150px;height:150px;border:1px solid #444}</style>${cells}</body>`);
  await page.screenshot({ path: `${OUT}/blink-montage.png` });
  console.log('blink montage ->', `${OUT}/blink-montage.png`);
}
await b.close();

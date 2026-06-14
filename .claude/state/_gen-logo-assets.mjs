// Logo asset pipeline — derives every app surface from the Founder-approved
// P+rose logo (public/img/logo/parbaughs-logo.png, transparent) and the 7
// theme-recolored variants (public/img/logo/themes/<name>.png from _logotheme.mjs).
//
// Outputs:
//   public/img/logo/themes/app/<name>.png   — 144px cropped/optimized per-theme (in-app: sidebar)
//   public/img/logo/parbaughs-knockout.png   — cream/brass knockout for DARK grounds
//   public/icons/icon-<size>.png             — full app-icon set (cream ground + clubhouse logo + brass ring)
//   public/icons/icon-maskable-{192,512}.png — full-bleed cream ground, extra safe-zone padding
//   public/apple-touch-icon.png              — 180 cream-ground
//   public/favicon-32.png                    — 32 favicon
//   .claude/state/_iconproof.png             — cream-ground vs felt-knockout 512 side-by-side (Founder taste call)
//
// Compositing via headless-chromium canvas (no sharp/ImageMagick on this box).
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

mkdirSync('public/img/logo/themes/app', { recursive: true });
const srcB64 = readFileSync('public/img/logo/parbaughs-logo.png').toString('base64');
const clubB64 = readFileSync('public/img/logo/themes/clubhouse.png').toString('base64');

const THEMES = ['clubhouse','twilight_links','linen_draft','azalea','champion_sunday','bourbon_room','course_record'];
const ICON_SIZES = [1024,512,192,180,167,152,144,120,96,87,80,76,72,60,58,48,40,29,20];

const b = await chromium.launch();
const pg = await b.newPage();
await pg.setContent('<body></body>');

// ── helper run in browser: returns {bbox, dataURL} after cropping a transparent PNG ──
// All theme logos share the source artwork geometry, so the bbox computed from
// the source applies to every variant — one crop rect, consistent framing.
const bbox = await pg.evaluate(async (src) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode();
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const p = x.getImageData(0, 0, c.width, c.height).data;
  let minX = c.width, minY = c.height, maxX = 0, maxY = 0;
  for (let y = 0; y < c.height; y++) for (let xx = 0; xx < c.width; xx++) {
    if (p[(y * c.width + xx) * 4 + 3] > 16) { if (xx < minX) minX = xx; if (xx > maxX) maxX = xx; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  return { minX, minY, maxX, maxY, w: c.width, h: c.height };
}, srcB64);
console.log('logo bbox', bbox.minX, bbox.minY, bbox.maxX, bbox.maxY, 'of', bbox.w + 'x' + bbox.h);

// ── 1) optimized per-theme in-app logos (144px longest side, cropped + ~6% pad) ──
for (const name of THEMES) {
  const tB64 = readFileSync('public/img/logo/themes/' + name + '.png').toString('base64');
  const data = await pg.evaluate(async ({ src, bb, target }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode();
    const cw = bb.maxX - bb.minX, ch = bb.maxY - bb.minY;
    const pad = Math.round(Math.max(cw, ch) * 0.06);
    const sw = cw + pad * 2, sh = ch + pad * 2;
    const scale = target / Math.max(sw, sh);
    const c = document.createElement('canvas'); c.width = Math.round(sw * scale); c.height = Math.round(sh * scale);
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.drawImage(img, bb.minX - pad, bb.minY - pad, sw, sh, 0, 0, c.width, c.height);
    return c.toDataURL('image/png').split(',')[1];
  }, { src: tB64, bb: bbox, target: 144 });
  writeFileSync('public/img/logo/themes/app/' + name + '.png', Buffer.from(data, 'base64'));
}
console.log('7 in-app logos → themes/app/');

// ── 2) cream/brass knockout (dark grounds: auth, share card) ──
const knockB64 = await pg.evaluate(async (src) => {
  const H = h => [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const CREAM = H('#F2EAD6'), BRASS = H('#CBA24C');
  const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode();
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const a = p[i+3]; if (a < 8) continue;
    const r = p[i], g = p[i+1], bl = p[i+2], br = (r+g+bl)/3;
    let t;
    if (r > 205 && g > 200 && bl > 180) t = CREAM;          // cream rose → cream
    else if (r > 120 && r >= g && g > bl && bl < g) t = BRASS; // gold outline → brass
    else if (g >= r && g >= bl) t = br < 82 ? CREAM : BRASS;  // dark P → cream ; leaves → brass
    else t = br < 82 ? CREAM : BRASS;
    p[i] = t[0]; p[i+1] = t[1]; p[i+2] = t[2];
  }
  x.putImageData(d, 0, 0); return c.toDataURL('image/png').split(',')[1];
}, srcB64);
writeFileSync('public/img/logo/parbaughs-knockout.png', Buffer.from(knockB64, 'base64'));
console.log('knockout → parbaughs-knockout.png');

// ── icon compositor (returns dataURL) ──
async function composeIcon(size, { logoB64, mode }) {
  // mode: 'cream' (clubhouse logo on warm cream + brass ring) | 'felt' (knockout on felt green + brass ring) | 'maskable'
  return await pg.evaluate(async ({ size, logo, bb, mode }) => {
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    const S = size;
    if (mode === 'felt' || mode === 'maskable') {
      const g = x.createRadialGradient(S*0.4, S*0.34, S*0.05, S*0.5, S*0.5, S*0.72);
      g.addColorStop(0, '#1A4B37'); g.addColorStop(1, '#0C2A1F');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
    } else {
      const g = x.createRadialGradient(S*0.38, S*0.30, S*0.04, S*0.5, S*0.5, S*0.78);
      g.addColorStop(0, '#FAF6EC'); g.addColorStop(1, '#E6DCC4');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
    }
    // brass ring (skip for tiny + maskable safe-zone)
    if (mode !== 'maskable' && S >= 72) {
      const inset = Math.round(S * 0.055), rad = Math.round(S * 0.14);
      x.strokeStyle = mode === 'felt' ? 'rgba(203,162,76,.85)' : 'rgba(180,137,62,.55)';
      x.lineWidth = Math.max(1, Math.round(S * 0.008));
      const rr = (xx, yy, w, h, r) => { x.beginPath(); x.moveTo(xx+r,yy); x.arcTo(xx+w,yy,xx+w,yy+h,r); x.arcTo(xx+w,yy+h,xx,yy+h,r); x.arcTo(xx,yy+h,xx,yy,r); x.arcTo(xx,yy,xx+w,yy,r); x.closePath(); };
      rr(inset, inset, S - inset*2, S - inset*2, rad); x.stroke();
    }
    // logo
    const img = new Image(); img.src = 'data:image/png;base64,' + logo; await img.decode();
    const cw = bb.maxX - bb.minX, ch = bb.maxY - bb.minY;
    const fitFrac = mode === 'maskable' ? 0.52 : 0.66;       // maskable → more padding (40% safe zone)
    const scale = (S * fitFrac) / Math.max(cw, ch);
    const dw = cw * scale, dh = ch * scale;
    x.drawImage(img, bb.minX, bb.minY, cw, ch, (S - dw) / 2, (S - dh) / 2, dw, dh);
    return c.toDataURL('image/png').split(',')[1];
  }, { size, logo: logoB64, bb: bbox, mode });
}

// ── 3) app-icon set (felt-green ground + cream/brass knockout — shipped default;
//        Founder may flip to cream via _iconproof.png) ──
for (const s of ICON_SIZES) {
  const d = await composeIcon(s, { logoB64: knockB64, mode: 'felt' });
  writeFileSync('public/icons/icon-' + s + '.png', Buffer.from(d, 'base64'));
}
for (const s of [192, 512]) {
  const d = await composeIcon(s, { logoB64: knockB64, mode: 'maskable' });
  writeFileSync('public/icons/icon-maskable-' + s + '.png', Buffer.from(d, 'base64'));
}
writeFileSync('public/apple-touch-icon.png', Buffer.from(await composeIcon(180, { logoB64: knockB64, mode: 'felt' }), 'base64'));
writeFileSync('public/favicon-32.png', Buffer.from(await composeIcon(32, { logoB64: knockB64, mode: 'felt' }), 'base64'));
console.log('app icons regenerated (' + ICON_SIZES.length + ' sizes + maskable + apple-touch + favicon)');

// ── 4) proof: cream-ground vs felt-knockout @ 512, side-by-side for Founder ──
const creamProof = await composeIcon(512, { logoB64: clubB64, mode: 'cream' });
const feltProof = await composeIcon(512, { logoB64: knockB64, mode: 'felt' });
const ctx = await b.newContext({ viewport: { width: 1180, height: 640 } });
const pg3 = await ctx.newPage();
await pg3.setContent(`<body style="margin:0;background:#2a2a2a;display:flex;gap:40px;align-items:center;justify-content:center;height:640px;font-family:monospace">
  <div style="text-align:center"><div style="width:300px;height:300px;border-radius:66px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.5)"><img src="data:image/png;base64,${creamProof}" style="width:300px"/></div><div style="color:#ddd;margin-top:16px;font-size:14px">Option A · Cream ground (shipped default)</div></div>
  <div style="text-align:center"><div style="width:300px;height:300px;border-radius:66px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.5)"><img src="data:image/png;base64,${feltProof}" style="width:300px"/></div><div style="color:#ddd;margin-top:16px;font-size:14px">Option B · Felt-green knockout (alt)</div></div>
</body>`);
await pg3.screenshot({ path: '.claude/state/_iconproof.png' });

// in-app theme-logo proof on each canvas
const appProof = {};
for (const name of THEMES) appProof[name] = readFileSync('public/img/logo/themes/app/' + name + '.png').toString('base64');
const canvases = { clubhouse:'#E7E0CD', twilight_links:'#DACFB6', linen_draft:'#D7E3EE', azalea:'#EADBE2', champion_sunday:'#E0D3B7', bourbon_room:'#DCCAA4', course_record:'#E3D8BD' };
const cells = THEMES.map(n => `<div style="background:${canvases[n]};width:190px;height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center"><img src="data:image/png;base64,${appProof[n]}" style="width:84px"/><div style="font-family:monospace;font-size:9px;color:#555;margin-top:8px">${n}</div></div>`).join('');
const pg4 = await (await b.newContext({ viewport: { width: 1340, height: 200 } })).newPage();
await pg4.setContent('<body style="margin:0;display:flex;flex-wrap:wrap">' + cells + '</body>');
await pg4.screenshot({ path: '.claude/state/_appllogoproof.png' });

await b.close();
console.log('proofs → .claude/state/_iconproof.png + _appllogoproof.png');

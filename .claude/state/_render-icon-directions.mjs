// Render app-icon + favicon direction candidates into a judge montage.
// Reads .claude/state/icon-directions.json (array of direction specs from the
// workflow). Each: {id,name,ground,markColorway,markCrop,faviconCrop,ring,
// faviconGround?,faviconMark?,rationale,score}.
//   ground: '#hex' | 'radial:#h1->#h2'
//   markColorway: 'knockout' | 'rose=#..,outline=#..,P=#..,leaves=#..' | 'green' (approved green-on-light)
//   crop: full | p-only | upper | p-bud
//   ring: none | brass
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';

const SRC = readFileSync('public/img/logo/parbaughs-logo.png').toString('base64');
const KNOCK = readFileSync('public/img/logo/parbaughs-knockout.png').toString('base64');
const BB = { minX: 345, minY: 237, maxX: 656, maxY: 788 };
const CROPS = { // fraction of the full bbox
  full:   { x0: 0,    y0: 0,    x1: 1, y1: 1 },
  'p-bud':{ x0: 0,    y0: 0,    x1: 1, y1: 0.93 },
  upper:  { x0: 0,    y0: 0,    x1: 1, y1: 0.52 },
  'p-only':{ x0: 0.02, y0: 0.22, x1: 1, y1: 1 },
};
const APPROVED = { rose: '#F4EFE4', outline: '#B4893E', P: '#2F4A3A', leaves: '#5A7D4E' };

const dirs = JSON.parse(readFileSync('.claude/state/icon-directions.json', 'utf8'));
const b = await chromium.launch();
const pg = await b.newPage();
await pg.setContent('<body></body>');

function parseColorway(cw) {
  if (!cw || cw === 'knockout') return 'knockout';
  if (cw === 'green' || cw === 'approved') return APPROVED;
  const o = {};
  cw.split(',').forEach(kv => { const m = kv.trim().match(/(rose|outline|P|leaves)\s*=\s*(#[0-9a-fA-F]{6})/); if (m) o[m[1]] = m[2]; });
  return Object.keys(o).length ? { ...APPROVED, ...o } : APPROVED;
}

// recolor the source mark per region → transparent PNG dataURL
async function recolored(colorway) {
  if (colorway === 'knockout') return 'data:image/png;base64,' + KNOCK;
  return await pg.evaluate(async ({ src, cw }) => {
    const H = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const R = H(cw.rose), O = H(cw.outline), P = H(cw.P), L = H(cw.leaves);
    const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      const a = p[i + 3]; if (a < 8) continue;
      const r = p[i], g = p[i + 1], bl = p[i + 2], br = (r + g + bl) / 3;
      let t;
      if (r > 205 && g > 200 && bl > 180) t = R;
      else if (r > 120 && r >= g && g > bl && bl < g) t = O;
      else if (g >= r && g >= bl) t = br < 82 ? P : L;
      else t = br < 82 ? P : L;
      p[i] = t[0]; p[i + 1] = t[1]; p[i + 2] = t[2];
    }
    x.putImageData(d, 0, 0); return c.toDataURL('image/png');
  }, { src: SRC, cw: colorway });
}

async function renderIcon(size, { groundSpec, markUrl, crop, ring, fit }) {
  return await pg.evaluate(async ({ size, groundSpec, markUrl, BB, crop, ring, fit }) => {
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; const S = size;
    // ground
    if (groundSpec.startsWith('radial:')) {
      const [h1, h2] = groundSpec.slice(7).split('->');
      const g = x.createRadialGradient(S * 0.38, S * 0.3, S * 0.04, S * 0.5, S * 0.5, S * 0.78);
      g.addColorStop(0, h1); g.addColorStop(1, h2); x.fillStyle = g;
    } else x.fillStyle = groundSpec;
    x.fillRect(0, 0, S, S);
    if (ring === 'brass' && S >= 64) {
      const inset = Math.round(S * 0.055), rad = Math.round(S * 0.14);
      x.strokeStyle = 'rgba(180,137,62,.6)'; x.lineWidth = Math.max(1, Math.round(S * 0.008));
      const rr = (xx, yy, w, h, r) => { x.beginPath(); x.moveTo(xx + r, yy); x.arcTo(xx + w, yy, xx + w, yy + h, r); x.arcTo(xx + w, yy + h, xx, yy + h, r); x.arcTo(xx, yy + h, xx, yy, r); x.arcTo(xx, yy, xx + w, yy, r); x.closePath(); };
      rr(inset, inset, S - inset * 2, S - inset * 2, rad); x.stroke();
    }
    const img = new Image(); img.src = markUrl; await img.decode();
    const fw = BB.maxX - BB.minX, fh = BB.maxY - BB.minY;
    const sx = BB.minX + fw * crop.x0, sy = BB.minY + fh * crop.y0;
    const sw = fw * (crop.x1 - crop.x0), sh = fh * (crop.y1 - crop.y0);
    const scale = (S * fit) / Math.max(sw, sh);
    const dw = sw * scale, dh = sh * scale;
    x.drawImage(img, sx, sy, sw, sh, (S - dw) / 2, (S - dh) / 2, dw, dh);
    return c.toDataURL('image/png').split(',')[1];
  }, { size, groundSpec, markUrl, BB: BB, crop, ring, fit });
}

const rows = [];
for (const dir of dirs) {
  const markUrl = await recolored(parseColorway(dir.markColorway));
  const favMarkUrl = dir.faviconMark ? await recolored(parseColorway(dir.faviconMark)) : markUrl;
  const favGround = dir.faviconGround || dir.ground;
  const app = await renderIcon(256, { groundSpec: dir.ground, markUrl, crop: CROPS[dir.markCrop] || CROPS.full, ring: dir.ring, fit: 0.62 });
  const f48 = await renderIcon(48, { groundSpec: favGround, markUrl: favMarkUrl, crop: CROPS[dir.faviconCrop] || CROPS.full, ring: 'none', fit: 0.8 });
  const f32 = await renderIcon(32, { groundSpec: favGround, markUrl: favMarkUrl, crop: CROPS[dir.faviconCrop] || CROPS.full, ring: 'none', fit: 0.82 });
  rows.push({ dir, app, f48, f32 });
}

// montage
const cells = rows.map((r, idx) => `
  <div style="display:flex;align-items:center;gap:22px;padding:14px 20px;border-bottom:1px solid #333">
    <div style="width:120px;height:120px;border-radius:26px;overflow:hidden;box-shadow:0 8px 22px rgba(0,0,0,.45);flex-shrink:0"><img src="data:image/png;base64,${r.app}" style="width:120px"/></div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px"><img src="data:image/png;base64,${r.f48}" style="width:48px;height:48px;border-radius:8px"/><span style="font:9px monospace;color:#888">48</span></div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px"><img src="data:image/png;base64,${r.f32}" style="width:32px;height:32px;border-radius:5px"/><span style="font:9px monospace;color:#888">32</span></div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;background:#fff;padding:8px;border-radius:6px"><img src="data:image/png;base64,${r.f32}" style="width:32px;height:32px;border-radius:5px"/><span style="font:9px monospace;color:#888">on white</span></div>
    <div style="flex:1;color:#ddd;font-family:system-ui"><div style="font-weight:700;font-size:15px">${idx + 1}. ${r.dir.name} <span style="color:#caa75c">${r.dir.score}</span></div><div style="font-size:12px;color:#aaa;margin-top:3px">${r.dir.rationale}</div><div style="font-size:10px;color:#777;margin-top:3px;font-family:monospace">${r.dir.ground} · ${r.dir.markColorway} · app:${r.dir.markCrop} fav:${r.dir.faviconCrop} · ring:${r.dir.ring}</div></div>
  </div>`).join('');
const pg2 = await (await b.newContext({ viewport: { width: 1100, height: Math.max(400, rows.length * 152 + 40) }, deviceScaleFactor: 1.5 })).newPage();
await pg2.setContent(`<body style="margin:0;background:#222">${cells}</body>`);
await pg2.screenshot({ path: '.claude/state/icon-directions-montage.png' });
await b.close();
console.log('rendered ' + rows.length + ' directions → .claude/state/icon-directions-montage.png');

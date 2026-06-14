// Composite the P+rose mark (and the Cuphead graphic on the leisure tee) onto
// the vetted merch gens, then web-optimize to public/img/merch/. Judge montage.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';

const club = readFileSync('public/img/logo/themes/app/clubhouse.png').toString('base64');     // green-on-transparent (light grounds)
const knock = readFileSync('public/img/logo/themes/app/knockout.png').toString('base64');     // cream/brass (dark/green grounds)
const cuphead = readFileSync('public/img/gen/cuphead-golfer-rh2.png').toString('base64'); // authentic rubber-hose (Founder picked rh2 — dynamic swing pose)

// per item: src, out, logo variant, center (frac), width (frac of out), or cuphead overlay
const ITEMS = [
  { key: 'quarterzip', logo: 'knock', cx: 0.40, cy: 0.40, w: 0.12 },
  { key: 'polo',       logo: 'club',  cx: 0.39, cy: 0.43, w: 0.11 },
  { key: 'hoodie',     logo: 'knock', cx: 0.50, cy: 0.40, w: 0.13 },
  { key: 'tee',        logo: 'print', cx: 0.50, cy: 0.50, w: 0.46 },   // authentic rubber-hose golfer as a framed vintage print on the claret tee
  { key: 'balls',      logo: 'club',  cx: 0.42, cy: 0.55, w: 0.075, sh: 0.18 },
  { key: 'ballmarker', logo: 'club',  cx: 0.50, cy: 0.50, w: 0.17, sh: 0.22 },
  { key: 'yardagebook',logo: 'knock', cx: 0.50, cy: 0.46, w: 0.17 },
  { key: 'headcovers', logo: null },   // multi-cover set — leave clean
  { key: 'tees',       logo: null },
  { key: 'flatlay',    logo: null },
];
const SRC = { quarterzip:'blank-quarterzip-v3', polo:'blank-tourpro-polo-v3', hoodie:'blank-hoodie-black', tee:'blank-leisure-tee-claret', balls:'branded-golf-balls', ballmarker:'metal-ball-marker', yardagebook:'yardage-book', headcovers:'leather-headcovers-set', tees:'wooden-tees', flatlay:'collection-flatlay-hero' };
const CLUB_BB = null; // themes/app/* are pre-cropped
const KNOCK_BB = null; // themes/app/knockout.png pre-cropped

const b = await chromium.launch();
const pg = await b.newPage(); await pg.setContent('<body></body>');

for (const it of ITEMS) {
  const srcName = SRC[it.key];
  const prod = readFileSync('public/img/gen/merch2/' + srcName + '.png').toString('base64');
  const overlay = (it.logo === 'cuphead' || it.logo === 'print') ? cuphead : it.logo === 'knock' ? knock : it.logo === 'club' ? club : null;
  const keyBg = it.logo === 'cuphead'; // key out the cream ground of flat cuphead art
  const printPanel = it.logo === 'print'; // place the full rubber-hose art as a framed screen-print panel
  const jpg = await pg.evaluate(async ({ prod, overlay, cx, cy, w, sh, keyBg, printPanel }) => {
    const pim = new Image(); pim.src = 'data:image/png;base64,' + prod; await pim.decode();
    const W = pim.naturalWidth, H = pim.naturalHeight;
    const out = 720, scale = out / W;
    const c = document.createElement('canvas'); c.width = out; c.height = Math.round(H * scale);
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.drawImage(pim, 0, 0, c.width, c.height);
    if (overlay) {
      let lim = new Image(); lim.src = 'data:image/png;base64,' + overlay; await lim.decode();
      // key out near-cream background for the cuphead flat art so only the character lands on the shirt
      let drawSrc = lim, lw = lim.naturalWidth, lh = lim.naturalHeight;
      if (keyBg) {
        const kc = document.createElement('canvas'); kc.width = lw; kc.height = lh; const kx = kc.getContext('2d');
        kx.drawImage(lim, 0, 0); const id = kx.getImageData(0, 0, lw, lh), p = id.data;
        for (let i = 0; i < p.length; i += 4) { const r = p[i], g = p[i+1], bl = p[i+2]; if (r > 226 && g > 220 && bl > 200) p[i+3] = 0; }
        kx.putImageData(id, 0, 0); drawSrc = kc;
      }
      const dw = c.width * w, dh = dw * (sh ? (sh / w) : (lh / lw));
      const dx = c.width * cx - dw / 2, dy = c.height * cy - dh / 2;
      if (printPanel) {
        // rounded-rect framed screen-print on the shirt: clip + thin cream keyline + soft cast
        const r = dw * 0.06;
        x.save(); x.shadowColor = 'rgba(0,0,0,.32)'; x.shadowBlur = dw * 0.04; x.shadowOffsetY = dh * 0.015;
        x.beginPath(); x.moveTo(dx + r, dy); x.arcTo(dx + dw, dy, dx + dw, dy + dh, r); x.arcTo(dx + dw, dy + dh, dx, dy + dh, r); x.arcTo(dx, dy + dh, dx, dy, r); x.arcTo(dx, dy, dx + dw, dy, r); x.closePath();
        x.fillStyle = '#f1ead6'; x.fill(); x.restore();
        x.save(); x.beginPath(); x.moveTo(dx + r, dy); x.arcTo(dx + dw, dy, dx + dw, dy + dh, r); x.arcTo(dx + dw, dy + dh, dx, dy + dh, r); x.arcTo(dx, dy + dh, dx, dy, r); x.arcTo(dx, dy, dx + dw, dy, r); x.closePath(); x.clip();
        x.drawImage(drawSrc, dx, dy, dw, dh); x.restore();
        x.lineWidth = Math.max(1, dw * 0.012); x.strokeStyle = 'rgba(244,239,228,.85)';
        x.beginPath(); x.moveTo(dx + r, dy); x.arcTo(dx + dw, dy, dx + dw, dy + dh, r); x.arcTo(dx + dw, dy + dh, dx, dy + dh, r); x.arcTo(dx, dy + dh, dx, dy, r); x.arcTo(dx, dy, dx + dw, dy, r); x.closePath(); x.stroke();
      } else {
        if (!keyBg) { x.save(); x.shadowColor = 'rgba(20,18,12,.28)'; x.shadowBlur = dw * 0.05; x.shadowOffsetY = dh * 0.02; }
        x.drawImage(drawSrc, dx, dy, dw, dh);
        if (!keyBg) x.restore();
      }
    }
    return c.toDataURL('image/jpeg', 0.86).split(',')[1];
  }, { prod, overlay, cx: it.cx, cy: it.cy, w: it.w, sh: it.sh, keyBg, printPanel });
  writeFileSync('public/img/merch/' + it.key + '.jpg', Buffer.from(jpg, 'base64'));
  console.log('  ' + it.key + '.jpg (' + Math.round(jpg.length * 0.75 / 1024) + 'kb)' + (it.logo ? ' +' + it.logo : ''));
}

// montage to judge
const cells = ITEMS.map(it => { const bb = readFileSync('public/img/merch/' + it.key + '.jpg').toString('base64'); return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px"><img src="data:image/jpeg;base64,${bb}" style="width:230px;height:auto;border-radius:6px"/><span style="font:10px monospace;color:#aaa">${it.key}${it.logo ? ' +' + it.logo : ''}</span></div>`; }).join('');
const pg2 = await (await b.newContext({ viewport: { width: 1020, height: 1400 } })).newPage();
await pg2.setContent('<body style="margin:0;background:#1a1a1a;display:flex;flex-wrap:wrap;gap:14px;padding:18px">' + cells + '</body>');
await pg2.screenshot({ path: '.claude/state/merch-composited-montage.png', fullPage: true });
await b.close();
console.log('montage → .claude/state/merch-composited-montage.png');

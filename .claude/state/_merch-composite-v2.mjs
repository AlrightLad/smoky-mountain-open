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
  { key: 'tee',        logo: 'fabricprint', cx: 0.50, cy: 0.49, w: 0.42 },   // rh2 golfer flood-keyed (no frame) + blended onto the shirt as a real screen-print
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
  const overlay = (it.logo === 'cuphead' || it.logo === 'print' || it.logo === 'fabricprint') ? cuphead : it.logo === 'knock' ? knock : it.logo === 'club' ? club : null;
  const keyBg = it.logo === 'cuphead'; // key out the cream ground of flat cuphead art
  const printPanel = it.logo === 'print'; // framed screen-print panel (legacy)
  const fabricPrint = it.logo === 'fabricprint'; // flood-key bg from corners → frameless character blended into fabric
  const jpg = await pg.evaluate(async ({ prod, overlay, cx, cy, w, sh, keyBg, printPanel, fabricPrint }) => {
    const pim = new Image(); pim.src = 'data:image/png;base64,' + prod; await pim.decode();
    const W = pim.naturalWidth, H = pim.naturalHeight;
    const out = 720, scale = out / W;
    const c = document.createElement('canvas'); c.width = out; c.height = Math.round(H * scale);
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.drawImage(pim, 0, 0, c.width, c.height);
    if (overlay) {
      let lim = new Image(); lim.src = 'data:image/png;base64,' + overlay; await lim.decode();
      let drawSrc = lim, lw = lim.naturalWidth, lh = lim.naturalHeight;
      if (keyBg) {
        const kc = document.createElement('canvas'); kc.width = lw; kc.height = lh; const kx = kc.getContext('2d');
        kx.drawImage(lim, 0, 0); const id = kx.getImageData(0, 0, lw, lh), p = id.data;
        for (let i = 0; i < p.length; i += 4) { const r = p[i], g = p[i+1], bl = p[i+2]; if (r > 226 && g > 220 && bl > 200) p[i+3] = 0; }
        kx.putImageData(id, 0, 0); drawSrc = kc;
      } else if (fabricPrint) {
        // flood-fill the aged-paper background from the 4 corners, stopping at the
        // character's heavy black ink outline → isolates the golfer cleanly (no
        // colour-threshold eating the cream argyle/face). Then crop to the bbox.
        const kc = document.createElement('canvas'); kc.width = lw; kc.height = lh; const kx = kc.getContext('2d');
        kx.drawImage(lim, 0, 0); const id = kx.getImageData(0, 0, lw, lh), p = id.data;
        const N = lw * lh, vis = new Uint8Array(N);
        // aged-paper tan/cream family INCLUDING the darker vignette (warm browns),
        // but NOT the character's greens/near-black ink/peach skin. Contiguous flood
        // from the edges stops at the heavy black outline, so the figure is safe.
        const isBg = (idx) => { const o = idx * 4, r = p[o], g = p[o+1], b = p[o+2]; if (p[o+3] < 8) return true; return r > 118 && r >= g - 6 && g >= b - 4 && (r - b) >= 8 && (r - b) < 150 && !(g > r + 12) && !(r < 150 && b < 90 && g < 110); };
        const stack = [0, lw - 1, (lh - 1) * lw, N - 1, (lw >> 1), (lh >> 1) * lw, (lh >> 1) * lw + lw - 1, (lh - 1) * lw + (lw >> 1)];
        while (stack.length) { const idx = stack.pop(); if (idx < 0 || idx >= N || vis[idx]) continue; if (!isBg(idx)) continue; vis[idx] = 1; p[idx * 4 + 3] = 0; const xx = idx % lw, yy = (idx / lw) | 0; if (xx > 0) stack.push(idx - 1); if (xx < lw - 1) stack.push(idx + 1); if (yy > 0) stack.push(idx - lw); if (yy < lh - 1) stack.push(idx + lw); }
        kx.putImageData(id, 0, 0);
        // bbox of remaining (opaque) pixels → tight crop
        let minX = lw, minY = lh, maxX = 0, maxY = 0;
        for (let yy = 0; yy < lh; yy++) for (let xx = 0; xx < lw; xx++) { if (p[(yy * lw + xx) * 4 + 3] > 24) { if (xx < minX) minX = xx; if (xx > maxX) maxX = xx; if (yy < minY) minY = yy; if (yy > maxY) maxY = yy; } }
        const cw2 = maxX - minX, ch2 = maxY - minY;
        const cc = document.createElement('canvas'); cc.width = cw2; cc.height = ch2;
        cc.getContext('2d').drawImage(kc, minX, minY, cw2, ch2, 0, 0, cw2, ch2);
        drawSrc = cc; lw = cw2; lh = ch2;
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
      } else if (fabricPrint) {
        // frameless screen-print: the keyed character sits directly on the fabric.
        // slight opacity + soft multiply lets the shirt's folds read through so it
        // looks printed, not pasted.
        x.save(); x.globalAlpha = 0.94; x.globalCompositeOperation = 'multiply';
        x.drawImage(drawSrc, dx, dy, dw, dh);
        x.globalCompositeOperation = 'source-over'; x.globalAlpha = 0.32;
        x.drawImage(drawSrc, dx, dy, dw, dh); // re-lay at low opacity to restore ink density lost to multiply
        x.restore();
      } else {
        if (!keyBg) { x.save(); x.shadowColor = 'rgba(20,18,12,.28)'; x.shadowBlur = dw * 0.05; x.shadowOffsetY = dh * 0.02; }
        x.drawImage(drawSrc, dx, dy, dw, dh);
        if (!keyBg) x.restore();
      }
    }
    return c.toDataURL('image/jpeg', 0.86).split(',')[1];
  }, { prod, overlay, cx: it.cx, cy: it.cy, w: it.w, sh: it.sh, keyBg, printPanel, fabricPrint });
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

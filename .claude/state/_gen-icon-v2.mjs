// Two-tier icon system (Founder rejected felt-green; keep approved green-on-cream).
//   FAVICON / small (<=96px): REDRAWN bold Fraunces serif P + cream rose-bud,
//       felt-green on warm cream — no stem/leaves/brass-hairline (clean to 16px).
//   APP ICON / large (>=120px): the FULL approved P+rose mark on a cream radial
//       ground + thin brass ring (his colorway, rich at home-screen size).
// Builds the full public/icons/* set + apple-touch + favicon-32 + maskable,
// and a proof montage. Run: node .claude/state/_gen-icon-v2.mjs [proof|ship]
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';

const MODE = process.argv[2] || 'proof';
const SRC = readFileSync('public/img/logo/parbaughs-logo.png').toString('base64'); // full approved mark
const BB = { minX: 345, minY: 237, maxX: 656, maxY: 788 };
const CREAM = '#F4EFE4', CREAM_HI = '#FCFAF5', CREAM_LO = '#ECE3CF';
const GREEN = '#2F4A3A', GREEN_DEEP = '#0F3D2E', BRASS = '#B4893E';

const b = await chromium.launch();
const pg = await b.newPage();
// load Fraunces (brand serif) so the redrawn P matches the app's identity
await pg.setContent(`<!doctype html><html><head>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&display=swap" rel="stylesheet">
  </head><body><span style="font-family:Fraunces;font-weight:900">P</span></body></html>`);
try { await pg.evaluate(async () => { await document.fonts.load('900 100px Fraunces'); await document.fonts.ready; }); } catch (e) {}

// ── REDRAWN favicon mark: bold serif P + cream rose-bud (no stem/leaves) ──
async function redrawnPBud(size) {
  return await pg.evaluate(async ({ S, CREAM, CREAM_HI, CREAM_LO, GREEN, BRASS, withBud }) => {
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    // cream ground (very subtle radial for warmth)
    const g = x.createRadialGradient(S * 0.4, S * 0.32, S * 0.05, S * 0.5, S * 0.5, S * 0.8);
    g.addColorStop(0, CREAM_HI); g.addColorStop(1, CREAM_LO); x.fillStyle = g; x.fillRect(0, 0, S, S);
    // the P — heavy Fraunces serif, optically centered, fills the frame
    x.fillStyle = GREEN;
    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    var cap = S * 0.82;                 // cap height target (bolder presence)
    x.font = '900 ' + cap + 'px Fraunces, Georgia, "Times New Roman", serif';
    x.fillText('P', S * 0.45, S * 0.5 + cap * 0.36);
    if (withBud) {
      // small cream rose-bud tucked into the P's upper-right bowl shoulder (a teardrop,
      // not a floating circle): narrow vertical ellipse, slightly overlapping the P.
      var bx = S * 0.625, by = S * 0.30, brx = S * 0.082, bry = S * 0.108;
      // green calyx wedge at the bud base (reads as "growing from")
      x.fillStyle = GREEN;
      x.beginPath(); x.moveTo(bx - brx * 0.8, by + bry * 0.7); x.lineTo(bx + brx * 0.8, by + bry * 0.7); x.lineTo(bx, by + bry * 1.5); x.closePath(); x.fill();
      // bud body (cream)
      x.beginPath(); x.ellipse(bx, by, brx, bry, 0, 0, Math.PI * 2); x.fillStyle = CREAM_HI; x.fill();
      // brass rim only where it survives (>=48); thin
      if (S >= 48) { x.lineWidth = Math.max(1, S * 0.010); x.strokeStyle = BRASS; x.beginPath(); x.ellipse(bx, by, brx, bry, 0, 0, Math.PI * 2); x.stroke(); }
      // single inner petal furl at larger sizes
      if (S >= 64) { x.beginPath(); x.moveTo(bx, by - bry * 0.5); x.quadraticCurveTo(bx + brx * 0.7, by, bx, by + bry * 0.5); x.strokeStyle = 'rgba(180,137,62,.55)'; x.lineWidth = S * 0.006; x.stroke(); }
    }
    return c.toDataURL('image/png').split(',')[1];
  }, { S: size, CREAM, CREAM_HI, CREAM_LO, GREEN, BRASS, withBud: size >= 16 });
}

// ── FULL mark on cream radial + brass ring (large app-icon tier) ──
async function fullOnCream(size, { maskable } = {}) {
  return await pg.evaluate(async ({ S, src, BB, CREAM_HI, CREAM_LO, maskable }) => {
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    const g = x.createRadialGradient(S * 0.38, S * 0.3, S * 0.04, S * 0.5, S * 0.5, S * 0.8);
    g.addColorStop(0, CREAM_HI); g.addColorStop(1, CREAM_LO); x.fillStyle = g; x.fillRect(0, 0, S, S);
    if (!maskable && S >= 120) {
      const inset = Math.round(S * 0.055), rad = Math.round(S * 0.14);
      x.strokeStyle = 'rgba(180,137,62,.55)'; x.lineWidth = Math.max(1, Math.round(S * 0.007));
      const rr = (xx, yy, w, h, r) => { x.beginPath(); x.moveTo(xx + r, yy); x.arcTo(xx + w, yy, xx + w, yy + h, r); x.arcTo(xx + w, yy + h, xx, yy + h, r); x.arcTo(xx, yy + h, xx, yy, r); x.arcTo(xx, yy, xx + w, yy, r); x.closePath(); };
      rr(inset, inset, S - inset * 2, S - inset * 2, rad); x.stroke();
    }
    const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode();
    const cw = BB.maxX - BB.minX, ch = BB.maxY - BB.minY;
    const fit = maskable ? 0.5 : 0.6;
    const scale = (S * fit) / Math.max(cw, ch);
    const dw = cw * scale, dh = ch * scale;
    x.drawImage(img, BB.minX, BB.minY, cw, ch, (S - dw) / 2, (S - dh) / 2, dw, dh);
    return c.toDataURL('image/png').split(',')[1];
  }, { S: size, src: SRC, BB, CREAM_HI, CREAM_LO, maskable: !!maskable });
}

if (MODE === 'proof') {
  const a180 = await fullOnCream(180), a120 = await fullOnCream(120);
  const f48 = await redrawnPBud(48), f32 = await redrawnPBud(32), f16 = await redrawnPBud(16);
  const m96 = await redrawnPBud(96);
  const oldFelt = readFileSync('public/icons/icon-180.png').toString('base64');
  const pg2 = await (await b.newContext({ viewport: { width: 1080, height: 560 }, deviceScaleFactor: 1.5 })).newPage();
  await pg2.setContent(`<body style="margin:0;background:#2b2b2b;font-family:system-ui;color:#ddd;padding:28px">
    <div style="display:flex;gap:40px;align-items:flex-end">
      <div style="text-align:center"><div style="width:180px;height:180px;border-radius:40px;overflow:hidden;box-shadow:0 14px 40px rgba(0,0,0,.5)"><img src="data:image/png;base64,${a180}" style="width:180px"></div><div style="margin-top:10px;font-size:13px">App icon · 180 (full mark, cream)</div></div>
      <div style="text-align:center"><div style="width:120px;height:120px;border-radius:27px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.45)"><img src="data:image/png;base64,${a120}" style="width:120px"></div><div style="margin-top:10px;font-size:12px">120</div></div>
      <div style="text-align:center;border-left:1px solid #444;padding-left:40px">
        <div style="display:flex;gap:18px;align-items:flex-end;justify-content:center">
          <div><div style="width:96px;height:96px;border-radius:18px;overflow:hidden"><img src="data:image/png;base64,${m96}" style="width:96px"></div><div style="font-size:11px;margin-top:6px">96</div></div>
          <div><div style="width:48px;height:48px;border-radius:9px;overflow:hidden"><img src="data:image/png;base64,${f48}" style="width:48px"></div><div style="font-size:11px;margin-top:6px">48</div></div>
          <div><div style="width:32px;height:32px;border-radius:6px;overflow:hidden"><img src="data:image/png;base64,${f32}" style="width:32px"></div><div style="font-size:11px;margin-top:6px">32</div></div>
          <div><div style="width:16px;height:16px;border-radius:3px;overflow:hidden"><img src="data:image/png;base64,${f16}" style="width:16px"></div><div style="font-size:11px;margin-top:6px">16</div></div>
        </div>
        <div style="margin-top:10px;font-size:13px">Favicon / small (redrawn P + bud)</div>
      </div>
      <div style="text-align:center;border-left:1px solid #444;padding-left:40px;opacity:.7"><div style="width:96px;height:96px;border-radius:18px;overflow:hidden"><img src="data:image/png;base64,${oldFelt}" style="width:96px"></div><div style="margin-top:10px;font-size:12px;color:#c88">OLD felt (rejected)</div></div>
    </div></body>`);
  await pg2.screenshot({ path: '.claude/state/icon-v2-proof.png' });
  await b.close();
  console.log('proof → .claude/state/icon-v2-proof.png');
} else {
  // SHIP: write the full set, two-tier by size
  const SMALL = [20, 29, 40, 48, 58, 60, 72, 76, 80, 87, 96];
  const LARGE = [120, 144, 152, 167, 180, 192, 512, 1024];
  for (const s of SMALL) writeFileSync('public/icons/icon-' + s + '.png', Buffer.from(await redrawnPBud(s), 'base64'));
  for (const s of LARGE) writeFileSync('public/icons/icon-' + s + '.png', Buffer.from(await fullOnCream(s), 'base64'));
  writeFileSync('public/icons/icon-maskable-192.png', Buffer.from(await fullOnCream(192, { maskable: true }), 'base64'));
  writeFileSync('public/icons/icon-maskable-512.png', Buffer.from(await fullOnCream(512, { maskable: true }), 'base64'));
  writeFileSync('public/apple-touch-icon.png', Buffer.from(await fullOnCream(180), 'base64'));
  writeFileSync('public/icons/favicon-32.png', Buffer.from(await redrawnPBud(32), 'base64'));
  writeFileSync('public/icons/favicon-16.png', Buffer.from(await redrawnPBud(16), 'base64'));
  writeFileSync('public/favicon-32.png', Buffer.from(await redrawnPBud(32), 'base64'));
  await b.close();
  console.log('SHIPPED two-tier icon set: ' + (SMALL.length) + ' small (redrawn P+bud) + ' + LARGE.length + ' large (full mark on cream) + maskable + apple-touch + favicon-16/32');
}

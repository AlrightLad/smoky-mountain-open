// Composite the Founder-approved P+rose logo onto the BLANK product shots at
// each garment's embroidery position, then web-optimize to public/img/merch/.
// Founder: "put the parbaugh logo on the items not the clubs logo." + H&B feel.
//   club  = clubhouse green/cream logo  (reads on cream surfaces)
//   knock = cream/brass knockout        (reads on dark-green surfaces)
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';

const club = readFileSync('public/img/logo/themes/app/clubhouse.png').toString('base64'); // pre-cropped 144px
const knockRaw = readFileSync('public/img/logo/parbaughs-knockout.png').toString('base64'); // full 1024, bbox below
const KNOCK_BB = { minX: 345, minY: 237, maxX: 656, maxY: 788 };

// per-product: source blank, logo variant, center (fractional), logo width (fractional), shadow strength
const ITEMS = [
  { name: 'cap',        src: 'blank-cap.png',        logo: 'club',  cx: 0.500, cy: 0.515, w: 0.125, sh: 0.26 },
  { name: 'polo',       src: 'blank-polo.png',       logo: 'club',  cx: 0.395, cy: 0.470, w: 0.110, sh: 0.26 },
  { name: 'quarterzip', src: 'blank-quarterzip.png', logo: 'knock', cx: 0.410, cy: 0.560, w: 0.120, sh: 0.34 },
  { name: 'towel',      src: 'blank-towel.png',      logo: 'club',  cx: 0.520, cy: 0.430, w: 0.170, sh: 0.24 },
  { name: 'headcover',  src: 'blank-headcover.png',  logo: 'club',  cx: 0.500, cy: 0.450, w: 0.155, sh: 0.26 },
];

const b = await chromium.launch();
const pg = await b.newPage();
await pg.setContent('<body></body>');

for (const it of ITEMS) {
  const prod = readFileSync('public/img/gen/' + it.src).toString('base64');
  const logoB64 = it.logo === 'club' ? club : knockRaw;
  const bb = it.logo === 'club' ? null : KNOCK_BB;       // club is pre-cropped → full image
  const jpg = await pg.evaluate(async ({ prod, logoB64, bb, cx, cy, w, sh }) => {
    const pim = new Image(); pim.src = 'data:image/png;base64,' + prod; await pim.decode();
    const W = pim.naturalWidth, H = pim.naturalHeight;
    const out = 640, scale = out / W;
    const c = document.createElement('canvas'); c.width = out; c.height = Math.round(H * scale);
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.drawImage(pim, 0, 0, c.width, c.height);
    const lim = new Image(); lim.src = 'data:image/png;base64,' + logoB64; await lim.decode();
    const sx = bb ? bb.minX : 0, sy = bb ? bb.minY : 0;
    const sw = bb ? (bb.maxX - bb.minX) : lim.naturalWidth, shh = bb ? (bb.maxY - bb.minY) : lim.naturalHeight;
    const dw = c.width * w, dh = dw * (shh / sw);
    const dx = c.width * cx - dw / 2, dy = c.height * cy - dh / 2;
    // soft embroidery shadow then the mark
    x.save();
    x.shadowColor = 'rgba(20,18,12,' + sh + ')';
    x.shadowBlur = Math.max(1, dw * 0.05);
    x.shadowOffsetX = dw * 0.012; x.shadowOffsetY = dh * 0.018;
    x.drawImage(lim, sx, sy, sw, shh, dx, dy, dw, dh);
    x.restore();
    return c.toDataURL('image/jpeg', 0.86).split(',')[1];
  }, { prod, logoB64, bb, cx: it.cx, cy: it.cy, w: it.w, sh: it.sh });
  writeFileSync('public/img/merch/' + it.name + '.jpg', Buffer.from(jpg, 'base64'));
  console.log('composited', it.name, '(' + Math.round(jpg.length * 0.75 / 1024) + 'kb)');
}

// flatlay hero — clean collection shot, web-optimized (no per-item compositing; the cards carry the mark)
const fl = readFileSync('public/img/gen/blank-flatlay.png').toString('base64');
const fljpg = await pg.evaluate(async (fl) => {
  const im = new Image(); im.src = 'data:image/png;base64,' + fl; await im.decode();
  const out = 1000, scale = out / im.naturalWidth;
  const c = document.createElement('canvas'); c.width = out; c.height = Math.round(im.naturalHeight * scale);
  const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
  x.drawImage(im, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.85).split(',')[1];
}, fl);
writeFileSync('public/img/merch/flatlay.jpg', Buffer.from(fljpg, 'base64'));
console.log('flatlay (' + Math.round(fljpg.length * 0.75 / 1024) + 'kb)');

await b.close();
console.log('done → public/img/merch/');

// Generate the honest App Store / PWA icon set from the Parbaughs brand art.
//
// Source: public/watermark.jpg (gold line-art mark on the #0e1118 brand bg,
// no text, single centered subject — the icon art the public/icons/README.md
// designates). This script renders it as REAL per-size PNGs so manifest.json
// can stop lying about sizes (one mislabeled JPEG at 8 slots) and so the app
// is store-transferable.
//
// Mechanism: Playwright rasterization. No new dependency, and the browser does
// high-quality downscaling for free. Two layouts:
//   - "any": full-bleed square (preserves the balanced existing composition).
//   - "maskable": also full-bleed. The source art already bakes in ~22% margin
//     around a centered subject, so it sits inside the Android/PWA safe zone
//     (launchers crop the outer ~10-20%) without extra padding, and full-bleed
//     avoids the faint seam that padding-onto-flat-bg would introduce.
//
// Re-run after swapping the source art:  node scripts/generate-app-icons.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'public', 'watermark.jpg');
const OUT = path.join(ROOT, 'public', 'icons');
const BG = '#0e1118';

// Union of iOS (20,29,40,58,60,76,80,87,120,152,167,180,1024) and
// Android/PWA (48,72,96,144,192,512) sizes from public/icons/README.md.
const SIZES = [20, 29, 40, 48, 58, 60, 72, 76, 80, 87, 96, 120, 144, 152, 167, 180, 192, 512, 1024];
const MASKABLE = [192, 512];

const srcB64 = fs.readFileSync(SRC).toString('base64');
const srcUri = `data:image/jpeg;base64,${srcB64}`;

function pageHtml(mode) {
  // mode === 'maskable' pads the mark on a solid brand-bg square; otherwise
  // the square art fills the frame edge-to-edge.
  // Both layouts are full-bleed; the source art's own margin supplies the
  // maskable safe zone. `mode` is retained so a future padded art swap is a
  // one-line change here.
  void mode;
  const imgCss = 'width:100vw;height:100vh;object-fit:cover';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;background:${BG};overflow:hidden}
    .wrap{width:100vw;height:100vh;background:${BG};display:flex;align-items:center;justify-content:center}
    img{display:block;${imgCss}}
  </style></head><body><div class="wrap"><img src="${srcUri}" alt=""></div></body></html>`;
}

async function shoot(browser, n, html, file) {
  const page = await browser.newPage({ viewport: { width: n, height: n }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForFunction(() => {
    const i = document.querySelector('img');
    return i && i.complete && i.naturalWidth > 0;
  }, { timeout: 15000 });
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: n, height: n }, type: 'png' });
  await page.close();
  return file;
}

(async () => {
  if (!fs.existsSync(SRC)) throw new Error(`source art not found: ${SRC}`);
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const anyHtml = pageHtml('any');
  const maskHtml = pageHtml('maskable');
  const made = [];
  for (const n of SIZES) {
    made.push(await shoot(browser, n, anyHtml, path.join(OUT, `icon-${n}.png`)));
  }
  for (const n of MASKABLE) {
    made.push(await shoot(browser, n, maskHtml, path.join(OUT, `icon-maskable-${n}.png`)));
  }
  // Honest 180x180 apple-touch-icon (replaces the text-bearing legacy PNG that
  // violated the README "NO text" rule).
  made.push(await shoot(browser, 180, anyHtml, path.join(ROOT, 'public', 'apple-touch-icon.png')));
  await browser.close();
  console.log(`[generate-app-icons] wrote ${made.length} PNGs from ${path.basename(SRC)}`);
  for (const f of made) {
    const { size } = fs.statSync(f);
    console.log(`  ${path.relative(ROOT, f).replace(/\\/g, '/')}  (${size} B)`);
  }
})().catch((e) => { console.error(e); process.exit(1); });

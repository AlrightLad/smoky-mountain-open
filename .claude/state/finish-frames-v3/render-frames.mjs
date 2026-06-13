// Render golf-swing-pb.json finish-pose frames 55..82 (step 2) via lottie-web
// goToAndStop, screenshotting each canvas to ./<frame>.png. Standalone Playwright
// harness (no app, no staging) so the frames are deterministic and inspectable.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const LOTTIE_PATH = path.resolve(__dirname, '../../../public/lottie/golf-swing-pb.json');
const LOTTIE_WEB = path.resolve(
  __dirname,
  '../../../node_modules' // probe; falls back to CDN if absent
);

const animData = JSON.parse(readFileSync(LOTTIE_PATH, 'utf8'));

// lottie-web from cdnjs (CSP-allowed in the app). Pin the version the app uses.
const LOTTIE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js';

const FRAMES = [];
for (let f = 55; f <= 82; f += 2) FRAMES.push(f);

const html = `<!doctype html><html><head><meta charset="utf-8">
<script src="${LOTTIE_CDN}"></script>
<style>html,body{margin:0;background:#16382a}#m{width:480px;height:480px}</style>
</head><body><div id="m"></div>
<script>
  window.__animData = ${JSON.stringify(animData)};
  window.__anim = lottie.loadAnimation({
    container: document.getElementById('m'),
    renderer: 'canvas', loop: false, autoplay: false,
    animationData: window.__animData
  });
  window.__ready = false;
  window.__anim.addEventListener('DOMLoaded', () => { window.__ready = true; });
</script></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 520, height: 520 }, deviceScaleFactor: 2 });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(String(e)));

await page.setContent(html, { waitUntil: 'networkidle' });
await page.waitForFunction('window.__ready === true', { timeout: 15000 });

const total = await page.evaluate('window.__anim.totalFrames');
console.log('totalFrames', total, 'rendering frames', FRAMES.join(','));
if (errors.length) console.log('CONSOLE ERRORS:', errors);

const mount = await page.$('#m');
for (const f of FRAMES) {
  await page.evaluate((fr) => { window.__anim.goToAndStop(fr, true); }, f);
  await page.waitForTimeout(120); // let canvas paint
  const name = `f${String(f).padStart(2, '0')}.png`;
  await mount.screenshot({ path: path.join(OUT, name) });
  console.log('wrote', name);
}

await browser.close();
console.log('done');

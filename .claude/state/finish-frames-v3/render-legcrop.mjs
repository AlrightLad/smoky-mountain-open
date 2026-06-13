// Tight leg-region crops of the held finish pose to judge the "second leg"
// (back felt-green leg) seam against the front white leg. Renders f55..f70.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const LOTTIE_PATH = path.resolve(__dirname, '../../../public/lottie/golf-swing-pb.json');
const animData = JSON.parse(readFileSync(LOTTIE_PATH, 'utf8'));
const LOTTIE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js';

const FRAMES = [55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70];

const html = `<!doctype html><html><head><meta charset="utf-8">
<script src="${LOTTIE_CDN}"></script>
<style>html,body{margin:0;background:#16382a}#m{width:480px;height:480px}</style>
</head><body><div id="m"></div>
<script>
  window.__anim = lottie.loadAnimation({
    container: document.getElementById('m'),
    renderer: 'canvas', loop: false, autoplay: false,
    animationData: ${JSON.stringify(animData)}
  });
  window.__ready = false;
  window.__anim.addEventListener('DOMLoaded', () => { window.__ready = true; });
</script></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 520, height: 520 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.waitForFunction('window.__ready === true', { timeout: 15000 });

const mount = await page.$('#m');
for (const f of FRAMES) {
  await page.evaluate((fr) => { window.__anim.goToAndStop(fr, true); }, f);
  await page.waitForTimeout(110);
  // Tight crop on the lower body / legs region of the 480x480 mount.
  // The golfer's legs sit roughly x:240-440, y:480-960 in the 1080 art →
  // on a 480px mount that's ~x:110-200, y:215-440.
  await mount.screenshot({ path: path.join(OUT, `leg-f${String(f).padStart(2,'0')}.png`),
    clip: { x: 95, y: 210, width: 150, height: 240 } });
}
await browser.close();
console.log('leg crops done');

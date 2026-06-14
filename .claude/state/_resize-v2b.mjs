// Founder: "V2b is better version btw" — re-derive Murphy's portrait from the
// preferred v2b source (warmer, smiling) instead of the shipped v2a. Resize the
// 1024 source to the 256 avatar JPG, matching the other caddies.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
const SRC = 'public/img/gen/caddy-caddy-v2b.png';
const DST = 'public/img/avatars/caddy-caddy.jpg';
const uri = 'data:image/png;base64,' + readFileSync(SRC).toString('base64');
const b = await chromium.launch();
const page = await b.newPage();
const out = await page.evaluate(async (uri) => {
  const im = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = uri; });
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256;
  const ctx = cv.getContext('2d'); ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(im, 0, 0, im.naturalWidth, im.naturalHeight, 0, 0, 256, 256);
  return cv.toDataURL('image/jpeg', 0.9);
}, uri);
writeFileSync(DST, Buffer.from(out.split(',')[1], 'base64'));
await b.close();
console.log('wrote', DST, '(from v2b)');

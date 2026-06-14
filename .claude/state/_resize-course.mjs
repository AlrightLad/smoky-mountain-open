import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
const uri = 'data:image/png;base64,' + readFileSync('public/img/gen/course-placeholder.png').toString('base64');
const b = await chromium.launch();
const page = await b.newPage();
const out = await page.evaluate(async (uri) => {
  const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = uri; });
  const W = 880, H = Math.round(W * im.naturalHeight / im.naturalWidth);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'); ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(im, 0, 0, W, H);
  return cv.toDataURL('image/jpeg', 0.82);
}, uri);
writeFileSync('public/img/course-placeholder.jpg', Buffer.from(out.split(',')[1], 'base64'));
await b.close();
console.log('wrote public/img/course-placeholder.jpg');

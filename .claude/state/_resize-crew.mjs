import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
const uri = 'data:image/png;base64,' + readFileSync('public/img/gen/caddy-crew-scene.png').toString('base64');
const b = await chromium.launch();
const page = await b.newPage();
const out = await page.evaluate(async (uri) => {
  const im = await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=uri;});
  const cv=document.createElement('canvas');cv.width=256;cv.height=256;
  const ctx=cv.getContext('2d');ctx.imageSmoothingQuality='high';
  ctx.drawImage(im,0,0,im.naturalWidth,im.naturalHeight,0,0,256,256);
  return cv.toDataURL('image/jpeg',0.9);
}, uri);
writeFileSync('public/img/avatars/caddy-crew.jpg', Buffer.from(out.split(',')[1],'base64'));
await b.close();
console.log('wrote public/img/avatars/caddy-crew.jpg (single cohesive scene)');

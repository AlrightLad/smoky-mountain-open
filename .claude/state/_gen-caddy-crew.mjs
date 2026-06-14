// #73 — composite the 4 caddy portraits into one "crew" avatar (2x2 quad) for
// the bot identity "The Caddies". Circle-cropped by the avatar container.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
const NAMES = ['caddy-caddy','caddy-oldtom','caddy-birdie','caddy-bagroom'];
const uris = {};
for (const n of NAMES) uris[n] = 'data:image/jpeg;base64,' + readFileSync('public/img/avatars/'+n+'.jpg').toString('base64');
const b = await chromium.launch();
const page = await b.newPage();
const out = await page.evaluate(async ({NAMES, uris}) => {
  function load(src){return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=src;});}
  const S=256, H=S/2;
  const cv=document.createElement('canvas');cv.width=S;cv.height=S;
  const ctx=cv.getContext('2d');ctx.imageSmoothingQuality='high';
  // aged-paper base
  ctx.fillStyle='#efe7d4';ctx.fillRect(0,0,S,S);
  const pos=[[0,0],[H,0],[0,H],[H,H]];
  for(let i=0;i<4;i++){
    const im=await load(uris[NAMES[i]]);
    // cover-crop the square portrait into the HxH quadrant
    ctx.drawImage(im,0,0,im.naturalWidth,im.naturalHeight,pos[i][0],pos[i][1],H,H);
  }
  // thin ink dividers (rubber-hose register)
  ctx.strokeStyle='rgba(26,22,15,.55)';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(H,0);ctx.lineTo(H,S);ctx.moveTo(0,H);ctx.lineTo(S,H);ctx.stroke();
  return cv.toDataURL('image/jpeg',0.9);
}, {NAMES, uris});
writeFileSync('public/img/avatars/caddy-crew.jpg', Buffer.from(out.split(',')[1],'base64'));
await b.close();
console.log('wrote public/img/avatars/caddy-crew.jpg');

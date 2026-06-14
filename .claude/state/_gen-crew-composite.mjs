// #73 — "The Caddies" crew avatar: the REAL 4 canonical portraits as a cohesive
// OVERLAPPING circular cluster (a group huddle, brass rings, shared paper ground)
// — together as one crew (not a rigid 4-square quad), every character the exact
// canonical bust (no fragile keying, so it's clean). Founder: must match + be one.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
const NAMES = ['caddy-oldtom','caddy-bagroom','caddy-caddy','caddy-birdie'];
const uris = {};
for (const n of NAMES) uris[n] = 'data:image/jpeg;base64,' + readFileSync('public/img/avatars/'+n+'.jpg').toString('base64');
const b = await chromium.launch();
const page = await b.newPage();
const out = await page.evaluate(async ({uris}) => {
  function load(src){return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=src;});}
  const S=256;
  const cv=document.createElement('canvas');cv.width=S;cv.height=S;
  const ctx=cv.getContext('2d');ctx.imageSmoothingQuality='high';
  // shared aged-paper ground + soft vignette
  ctx.fillStyle='#e7ddc6';ctx.fillRect(0,0,S,S);
  const vg=ctx.createRadialGradient(S/2,S*0.5,S*0.15,S/2,S/2,S*0.72);
  vg.addColorStop(0,'rgba(255,250,238,.45)');vg.addColorStop(1,'rgba(110,86,44,.16)');
  ctx.fillStyle=vg;ctx.fillRect(0,0,S,S);
  // cluster: back row (oldtom, bagroom) higher/smaller; front row (murphy, birdie)
  // lower/bigger; gentle overlap = a group huddle. r = circle radius.
  const grp=[
    {n:'caddy-oldtom', x:0.32, y:0.36, r:0.215},
    {n:'caddy-bagroom',x:0.68, y:0.36, r:0.215},
    {n:'caddy-caddy',  x:0.30, y:0.64, r:0.245},
    {n:'caddy-birdie', x:0.70, y:0.64, r:0.245}
  ];
  for(const m of grp){
    const im=await load(uris[m.n]);
    const cx=S*m.x, cy=S*m.y, r=S*m.r;
    ctx.save();
    // drop shadow for separation/depth
    ctx.shadowColor='rgba(20,16,10,.34)';ctx.shadowBlur=6;ctx.shadowOffsetY=2;
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
    ctx.drawImage(im,0,0,im.naturalWidth,im.naturalHeight,cx-r,cy-r,r*2,r*2);
    ctx.restore();
    // brass ring
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.lineWidth=3;ctx.strokeStyle='#B4893E';ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,r-1.5,0,Math.PI*2);ctx.lineWidth=1;ctx.strokeStyle='rgba(255,247,222,.5)';ctx.stroke();
  }
  return cv.toDataURL('image/jpeg',0.9);
}, {uris});
writeFileSync('public/img/avatars/caddy-crew.jpg', Buffer.from(out.split(',')[1],'base64'));
await b.close();
console.log('wrote crew (overlapping cluster of real 4 caddies)');

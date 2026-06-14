import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
const wreath = readFileSync('public/img/gen/logo-laurel-wreath.png').toString('base64');
const b = await chromium.launch();
const pg = await b.newPage({ viewport:{width:600,height:600} });
await pg.setContent('<body style="margin:0"><canvas id="c" width="600" height="600"></canvas></body>');
const out = await pg.evaluate(async ({wreath})=>{
  const c=document.getElementById('c'), x=c.getContext('2d');
  x.fillStyle='#F4EFE4'; x.fillRect(0,0,600,600); // cream ground
  const img=new Image(); img.src='data:image/png;base64,'+wreath; await img.decode();
  // wreath centered, scaled to ~520
  x.drawImage(img, 40, 40, 520, 520);
  // wordmark centered in the open middle
  x.textAlign='center'; x.fillStyle='#2F4A3A';
  x.font='italic 700 58px Georgia, "Times New Roman", serif';
  x.fillText('Parbaughs', 300, 312);
  // small seal text under
  x.fillStyle='#B4893E'; x.font='700 15px Georgia, serif';
  x.fillText('· GOLF CO ·', 300, 345);
  x.font='700 11px "Courier New", monospace'; x.fillStyle='#6f6a5e';
  x.fillText('E S T   ·   Y O R K   P A', 300, 372);
  return c.toDataURL('image/png').split(',')[1];
},{wreath});
writeFileSync('public/img/gen/logo-lockup.png', Buffer.from(out,'base64'));
await b.close(); console.log('lockup → public/img/gen/logo-lockup.png');

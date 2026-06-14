import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
const src = readFileSync('public/img/logo/_src.png').toString('base64');
const b = await chromium.launch();
const pg = await b.newPage();
await pg.setContent('<body></body>');
const trans = await pg.evaluate(async ({src})=>{
  const img=new Image(); img.src='data:image/png;base64,'+src; await img.decode();
  const c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight;
  const x=c.getContext('2d'); x.drawImage(img,0,0);
  const d=x.getImageData(0,0,c.width,c.height); const p=d.data;
  for(let i=0;i<p.length;i+=4){ if(p[i]>249&&p[i+1]>249&&p[i+2]>249){ p[i+3]=0; } }
  x.putImageData(d,0,0);
  return c.toDataURL('image/png').split(',')[1];
},{src});
writeFileSync('public/img/logo/parbaughs-logo.png', Buffer.from(trans,'base64'));
const themes=[['cream','#E7E0CD'],['felt','#22332a'],['bourbon','#2a211a']];
const cells=themes.map(([n,bg])=>`<div style="background:${bg};width:280px;height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center"><img src="data:image/png;base64,${trans}" style="width:150px;height:auto"/><div style="font-family:monospace;font-size:10px;color:#999;margin-top:8px">${n}</div></div>`).join('');
const pg2=await (await b.newContext({viewport:{width:840,height:300}})).newPage();
await pg2.setContent('<body style="margin:0;display:flex">'+cells+'</body>');
await pg2.screenshot({path:'public/img/logo/_themeproof.png'});
await b.close(); console.log('processed + previewed → public/img/logo/parbaughs-logo.png');

import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
const names=['01-serif-P','02-PB-monogram','03-shield-crest','04-circle-seal','05-rolling-hills','06-flag-green','07-flight-arc','08-sunrise-ridge'];
const labels=['1 · Serif P','2 · PB monogram','3 · Shield crest','4 · Circle seal','5 · Rolling hills','6 · Flag + green','7 · Flight arc','8 · Sunrise ridge'];
const imgs=names.map(n=>readFileSync('public/img/gen/logos/'+n+'.png').toString('base64'));
const b=await chromium.launch();
const cell=300, cols=4, rows=2, pad=10, lab=26;
const W=cols*cell, H=rows*(cell+lab);
const pg=await b.newPage({viewport:{width:W,height:H}});
await pg.setContent('<body style="margin:0"><canvas id="c" width="'+W+'" height="'+H+'"></canvas></body>');
await pg.evaluate(async ({imgs,labels,cell,cols,lab})=>{
  const c=document.getElementById('c'),x=c.getContext('2d');
  x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<imgs.length;i++){
    const im=new Image();im.src='data:image/png;base64,'+imgs[i];await im.decode();
    const col=i%cols,row=Math.floor(i/cols);
    const ox=col*cell, oy=row*(cell+lab);
    x.drawImage(im,ox,oy,cell,cell);
    x.fillStyle='#14130f';x.font='600 14px Georgia, serif';x.textAlign='center';
    x.fillText(labels[i],ox+cell/2,oy+cell+18);
    x.strokeStyle='#ddd';x.strokeRect(ox,oy,cell,cell);
  }
},{imgs,labels,cell,cols,lab});
writeFileSync('public/img/gen/logos/_montage.png',Buffer.from(await pg.evaluate(()=>document.getElementById('c').toDataURL('image/png').split(',')[1]),'base64'));
await b.close();console.log('montage done');

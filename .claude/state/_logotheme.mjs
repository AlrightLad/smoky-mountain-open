import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
mkdirSync('public/img/logo/themes',{recursive:true});
const src = readFileSync('public/img/logo/parbaughs-logo.png').toString('base64');
// theme: [name, canvas, green(P), green3(leaves), brass(outline), paper(rose)]
const THEMES=[
 ['clubhouse','#E7E0CD','#2F4A3A','#5A7D4E','#B4893E','#F4EFE4'],
 ['twilight_links','#DACFB6','#1A2A3E','#324753','#C48540','#ECE5D2'],
 ['linen_draft','#D7E3EE','#103A5C','#2C6FA6','#1F6FB2','#EAF0F5'],
 ['azalea','#EADBE2','#3A1F33','#7C3F66','#A8506F','#F6ECF0'],
 ['champion_sunday','#E0D3B7','#4A1D24','#8E3130','#C68A3C','#F1E8D6'],
 ['bourbon_room','#DCCAA4','#3D2817','#75441F','#B8743A','#F0E4CC'],
 ['course_record','#E3D8BD','#0C2A22','#17472E','#8A8572','#F6F1E3'],
];
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const b=await chromium.launch();
const pg=await b.newPage(); await pg.setContent('<body></body>');
const outs={};
for(const [name,canvas,green,green3,brass,paper] of THEMES){
  const data=await pg.evaluate(async ({src,green,green3,brass,paper})=>{
    const H=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
    const G=H(green),G3=H(green3),B=H(brass),P=H(paper);
    const img=new Image(); img.src='data:image/png;base64,'+src; await img.decode();
    const c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight;
    const x=c.getContext('2d'); x.drawImage(img,0,0);
    const d=x.getImageData(0,0,c.width,c.height), p=d.data;
    for(let i=0;i<p.length;i+=4){
      const a=p[i+3]; if(a<8) continue;
      const r=p[i],g=p[i+1],bl=p[i+2], br=(r+g+bl)/3;
      let t=null;
      if(r>205&&g>200&&bl>180) t=P;                         // cream rose
      else if(r>120&&r>=g&&g>bl&&bl<g) t=B;                 // warm gold outline
      else if(g>=r&&g>=bl){ t = br<82 ? G : G3; }           // dark P vs lighter leaves
      else t = br<82 ? G : G3;                              // fallback darks→P
      if(t){ p[i]=t[0]; p[i+1]=t[1]; p[i+2]=t[2]; }
    }
    x.putImageData(d,0,0); return c.toDataURL('image/png').split(',')[1];
  },{src,green,green3,brass,paper});
  writeFileSync('public/img/logo/themes/'+name+'.png', Buffer.from(data,'base64'));
  outs[name]={canvas,data};
}
// montage on each theme's own canvas
const cells=THEMES.map(([n,canvas])=>`<div style="background:${canvas};width:200px;height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center"><img src="data:image/png;base64,${outs[n].data}" style="width:96px"/><div style="font-family:monospace;font-size:9px;color:#555;margin-top:6px">${n}</div></div>`).join('');
const pg2=await (await b.newContext({viewport:{width:1400,height:240}})).newPage();
await pg2.setContent('<body style="margin:0;display:flex;flex-wrap:wrap">'+cells+'</body>');
await pg2.screenshot({path:'public/img/logo/themes/_proof.png'});
await b.close(); console.log('7 theme logos + proof done');

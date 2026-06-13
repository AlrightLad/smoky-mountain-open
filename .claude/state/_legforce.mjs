import { readFileSync, writeFileSync } from 'fs';
const P = 'public/lottie/golf-swing-pb.json';
const a = JSON.parse(readFileSync(P,'utf8'));
const BRASS = [0.792, 0.627, 0.29];
const LEG_NAMES = new Set(['right leg','left leg']);
let fills=0, strokes=0, grads=0;
function forceColor(o){
  if(!o||typeof o!=='object') return;
  if((o.ty==='fl'||o.ty==='st') && o.c && Array.isArray(o.c.k) && typeof o.c.k[0]==='number'){
    const a3 = o.c.k.length>3 ? o.c.k[3] : 1;
    o.c.k = [BRASS[0],BRASS[1],BRASS[2], a3];
    if(o.ty==='fl') fills++; else strokes++;
  }
  // gradient fills/strokes: collapse all stops to brass
  if((o.ty==='gf'||o.ty==='gs') && o.g && o.g.k && Array.isArray(o.g.k.k)){
    const k=o.g.k.k; for(let i=0;i+3<k.length;i+=4){ k[i+1]=BRASS[0]; k[i+2]=BRASS[1]; k[i+3]=BRASS[2]; } grads++;
  }
  for(const key in o) forceColor(o[key]);
}
(a.layers||[]).forEach(l=>{ if(LEG_NAMES.has(l.nm)) forceColor(l); });
writeFileSync(P, JSON.stringify(a));
console.log('Forced leg layers → brass. fills='+fills+' strokes='+strokes+' grads='+grads);

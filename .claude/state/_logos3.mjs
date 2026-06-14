import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(readFileSync('scripts/.service-account.json','utf8'));
const { GoogleAuth } = await import('google-auth-library');
const tok = (await (await new GoogleAuth({credentials:sa,scopes:['https://www.googleapis.com/auth/cloud-platform']}).getClient()).getAccessToken()).token;
const PROJ=sa.project_id, LOC='us-central1', MODEL='imagen-4.0-generate-001';
mkdirSync('public/img/gen/logos3',{recursive:true});
const OPTS=[
 ['01-serif-P-vine','Flat minimalist vector logo monogram, an elegant high-contrast serif capital letter P with a single delicate white rose and a thin vine gracefully entwining the stem, modern and clean, forest-green letter with a cream-white rose and small brass-gold accent, plain solid white background, contemporary premium golf brand monogram, crisp clean lines, refined and youthful, not ornate, no other text'],
 ['02-P-rose-bowl','Flat minimalist vector logo monogram, a clean modern serif capital letter P whose round bowl elegantly frames a single simple white rose, contemporary, forest-green letter with cream-white rose and brass-gold center, plain solid white background, premium youthful golf brand monogram, crisp clean minimal lines, no other text'],
 ['03-geometric-P-line-rose','Flat minimalist vector logo monogram, a sleek modern geometric capital letter P paired with a simplified single continuous-line white rose, contemporary and youthful, forest-green with brass-gold, plain solid white background, premium minimalist golf brand monogram, crisp clean lines, modern not vintage, no other text'],
 ['04-P-rose-terminal','Flat minimalist vector logo monogram, an elegant clean serif capital letter P whose top terminal blossoms into a single small white rose, modern, forest-green P with a cream-white rose, plain solid white background, premium contemporary golf monogram, crisp clean lines, refined youthful, no other text'],
 ['05-negspace-rose-P','Flat minimalist vector logo monogram, a bold modern capital letter P with a single white rose formed elegantly within its negative-space counter, clever contemporary, forest-green with cream-white and brass-gold, plain solid white background, premium golf brand monogram, crisp clean lines, modern minimal, no other text'],
 ['06-monoline-P-rose','Flat minimalist vector logo monogram, a clean single-weight monoline capital letter P intertwined with a delicate monoline white rose and stem, very modern and minimal, thin forest-green and brass-gold lines, plain solid white background, premium contemporary golf monogram, crisp clean lines, youthful, no other text'],
 ['07-PB-rose','Flat minimalist vector logo monogram, an elegant interlocking capital P and B with a single small white rose woven between them, modern collegiate, forest-green letters with a cream-white rose and brass accent, plain solid white background, premium youthful golf monogram, crisp clean lines, no other text'],
 ['08-P-rose-badge','Flat minimalist vector logo, a clean modern circular badge containing a serif capital letter P with a single white rose beside it, contemporary not vintage, thin simple ring, forest-green and brass-gold and cream, plain solid white background, premium youthful golf brand emblem, crisp clean minimal lines, no other text'],
];
let ok=0;
for (const [name,prompt] of OPTS){
  const url=`https://${LOC}-aiplatform.googleapis.com/v1/projects/${PROJ}/locations/${LOC}/publishers/google/models/${MODEL}:predict`;
  const r=await fetch(url,{method:'POST',headers:{'Authorization':'Bearer '+tok,'Content-Type':'application/json'},body:JSON.stringify({instances:[{prompt}],parameters:{sampleCount:1,aspectRatio:'1:1'}})});
  const txt=await r.text();
  if(!r.ok){console.log('['+name+'] HTTP '+r.status+' '+txt.replace(/\s+/g,' ').slice(0,110));continue;}
  const b64=((JSON.parse(txt).predictions||[])[0]||{}).bytesBase64Encoded;
  if(b64){writeFileSync('public/img/gen/logos3/'+name+'.png',Buffer.from(b64,'base64'));console.log('[OK] '+name);ok++;}else console.log('['+name+'] no image');
}
console.log('DONE '+ok+'/8');

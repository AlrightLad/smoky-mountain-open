import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(readFileSync('scripts/.service-account.json','utf8'));
const { GoogleAuth } = await import('google-auth-library');
const tok = (await (await new GoogleAuth({credentials:sa,scopes:['https://www.googleapis.com/auth/cloud-platform']}).getClient()).getAccessToken()).token;
const PROJ=sa.project_id, LOC='us-central1', MODEL='imagen-4.0-generate-001';
mkdirSync('public/img/gen/logos',{recursive:true});
const OPTS = [
 ['01-serif-P','Flat minimalist vector logo, a single elegant high-contrast serif capital letter P as a refined monogram, deep forest green on a plain solid white background, centered and perfectly balanced, classic premium heritage brandmark, clean crisp lines, no other text, no extra letters'],
 ['02-PB-monogram','Flat minimalist vector logo, an elegant interlocking monogram of capital letters P and B intertwined, balanced symmetric collegiate heritage style, deep forest green on a plain solid white background, centered, premium golf club brandmark, clean crisp serif lines, no other text'],
 ['03-shield-crest','Flat minimalist vector logo, a clean simple heraldic shield crest containing one slender golf flagstick and a small five-point star, refined two-color forest-green and brass-gold line art, symmetric and balanced, plain solid white background, premium golf club heraldry, crisp clean lines, no text, no letters'],
 ['04-circle-seal','Flat minimalist vector logo, a refined circular seal with a thin double-ring border and a single elegant golf flag in a cup at the exact center, forest-green and brass-gold clean line art, perfectly symmetric, plain solid white background, premium heritage club stamp, crisp lines, no text, no letters'],
 ['05-rolling-hills','Flat minimalist vector logo, a simple elegant emblem of three layered rolling hills suggesting a golf fairway and Pennsylvania ridgelines with a tiny flag on the farthest hill, clean two-tone forest-green line art inside a thin circle, plain solid white background, calm premium landscape brandmark, crisp lines, no text'],
 ['06-flag-green','Flat minimalist vector logo, a single elegant golf flag planted on a small rounded putting green, refined minimal line art, forest green with a small brass-gold flag, centered and balanced, plain solid white background, premium golf brandmark, crisp clean lines, no text, no letters'],
 ['07-flight-arc','Flat minimalist vector logo, an abstract elegant mark of a golf ball flight arc rising from a tee, one single sweeping curved line ending in a small solid dot, modern and dynamic, deep forest green line with a brass-gold dot, plain solid white background, premium minimalist sports brandmark, crisp clean lines, no text'],
 ['08-sunrise-ridge','Flat minimalist vector logo, a serene minimal emblem of a rising sun over a single rolling ridge with a tiny distant flag, warm brass-gold sun and forest-green ridge, thin circular frame, plain solid white background, premium dawn golf brandmark, clean crisp lines, no text'],
];
let ok=0;
for (const [name,prompt] of OPTS){
  const url=`https://${LOC}-aiplatform.googleapis.com/v1/projects/${PROJ}/locations/${LOC}/publishers/google/models/${MODEL}:predict`;
  const r=await fetch(url,{method:'POST',headers:{'Authorization':'Bearer '+tok,'Content-Type':'application/json'},body:JSON.stringify({instances:[{prompt}],parameters:{sampleCount:1,aspectRatio:'1:1'}})});
  const txt=await r.text();
  if(!r.ok){console.log('['+name+'] HTTP '+r.status+' '+txt.replace(/\s+/g,' ').slice(0,120));continue;}
  const b64=((JSON.parse(txt).predictions||[])[0]||{}).bytesBase64Encoded;
  if(b64){writeFileSync('public/img/gen/logos/'+name+'.png',Buffer.from(b64,'base64'));console.log('[OK] '+name);ok++;}
  else console.log('['+name+'] no image '+txt.slice(0,100));
}
console.log('DONE '+ok+'/8 (~$'+(ok*0.04).toFixed(2)+' imagen-4 standard)');

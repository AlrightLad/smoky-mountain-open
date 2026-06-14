import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(readFileSync('scripts/.service-account.json','utf8'));
const { GoogleAuth } = await import('google-auth-library');
const tok = (await (await new GoogleAuth({credentials:sa,scopes:['https://www.googleapis.com/auth/cloud-platform']}).getClient()).getAccessToken()).token;
const PROJ=sa.project_id, LOC='us-central1', MODEL='imagen-4.0-generate-001';
mkdirSync('public/img/gen/logos2',{recursive:true});
const OPTS = [
 ['01-white-rose','Flat minimalist vector logo, an elegant heraldic white rose, the historic White Rose of York, refined clean line art with cream-white petals, slender forest-green sepals and a small brass-gold center, symmetric and balanced, plain solid white background, premium heritage brandmark, crisp clean lines, no text, no letters'],
 ['02-rose-flagsticks','Flat minimalist vector logo, an elegant heraldic white rose above two crossed slender golf flagsticks, refined clean line art, cream-white rose with forest-green leaves and brass-gold flags, symmetric and balanced, plain solid white background, premium golf heritage crest, crisp clean lines, no text, no letters'],
 ['03-rose-shield','Flat minimalist vector logo, a clean heraldic shield crest bearing a single elegant white rose above a small golf flag, refined forest-green, brass-gold and cream line art, symmetric and balanced, plain solid white background, premium golf club heraldry, crisp clean lines, no text, no letters'],
 ['04-rose-seal','Flat minimalist vector logo, a refined circular seal with a thin double-ring border and a single elegant heraldic white rose at the exact center, forest-green and brass-gold clean line art, perfectly symmetric, plain solid white background, premium heritage club stamp, crisp clean lines, no text, no letters'],
 ['05-keystone-rose','Flat minimalist vector logo, a clean Pennsylvania keystone shape containing a single elegant white rose at its center, refined forest-green, brass-gold and cream line art, symmetric and balanced, plain solid white background, premium heritage brandmark, crisp clean lines, no text, no letters'],
 ['06-rose-monogram','Flat minimalist vector logo, an elegant serif capital letter P entwined with a single slender white rose and stem, refined forest-green, cream and brass-gold line art, balanced, plain solid white background, premium heritage golf monogram, crisp clean lines, no other text'],
 ['07-heritage-star','Flat minimalist vector logo, a refined heritage emblem of one elegant five-point star encircled by a thin laurel ring with a small white rose at the base, forest-green and brass-gold clean line art, symmetric and balanced, plain solid white background, premium revolutionary heritage brandmark, crisp clean lines, no text, no letters'],
 ['08-rose-ball','Flat minimalist vector logo, an elegant emblem fusing a white rose with a golf ball, a five-petal white rose whose round center is a subtly dimpled golf ball, refined clean line art with forest-green leaves and brass-gold accents, symmetric and balanced, plain solid white background, premium golf brandmark, crisp clean lines, no text, no letters'],
];
let ok=0;
for (const [name,prompt] of OPTS){
  const url=`https://${LOC}-aiplatform.googleapis.com/v1/projects/${PROJ}/locations/${LOC}/publishers/google/models/${MODEL}:predict`;
  const r=await fetch(url,{method:'POST',headers:{'Authorization':'Bearer '+tok,'Content-Type':'application/json'},body:JSON.stringify({instances:[{prompt}],parameters:{sampleCount:1,aspectRatio:'1:1'}})});
  const txt=await r.text();
  if(!r.ok){console.log('['+name+'] HTTP '+r.status+' '+txt.replace(/\s+/g,' ').slice(0,110));continue;}
  const b64=((JSON.parse(txt).predictions||[])[0]||{}).bytesBase64Encoded;
  if(b64){writeFileSync('public/img/gen/logos2/'+name+'.png',Buffer.from(b64,'base64'));console.log('[OK] '+name);ok++;}
  else console.log('['+name+'] no image');
}
console.log('DONE '+ok+'/8');

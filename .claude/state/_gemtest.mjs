import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
const KEY = (process.env.GEMINI_API_KEY || (existsSync('scripts/.secrets/gemini-key.txt') ? readFileSync('scripts/.secrets/gemini-key.txt','utf8').trim() : '')).trim();
if (!KEY) { console.log('NO KEY'); process.exit(3); }
console.log('key prefix:', KEY.slice(0,8)+'…', 'len', KEY.length);
mkdirSync('.claude/state/gemtest', {recursive:true});
const models = ['gemini-2.5-flash-image','gemini-2.5-flash-image-preview','gemini-2.0-flash-preview-image-generation','imagen-3.0-generate-002'];
const prompt = 'A luxury hard-enamel golf club lapel pin, brass bezel, crossed clubs crest in felt green and claret enamel, studio product render on cream background, no text';
for (const m of models) {
  try {
    const body = { contents:[{parts:[{text:prompt}]}] };
    // imagen uses a different endpoint shape; try generateContent for all, note failures
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+m+':generateContent', {
      method:'POST', headers:{'x-goog-api-key':KEY,'Content-Type':'application/json'}, body:JSON.stringify(body)
    });
    const txt = await r.text();
    if (r.ok) {
      const j = JSON.parse(txt);
      const parts = (((j.candidates||[])[0]||{}).content||{}).parts||[];
      const img = parts.find(p=>p.inlineData && p.inlineData.data);
      if (img) { const buf=Buffer.from(img.inlineData.data,'base64'); writeFileSync('.claude/state/gemtest/'+m+'.png',buf); console.log('  ['+m+'] OK → IMAGE '+Math.round(buf.length/1024)+'kb ✓✓✓'); }
      else console.log('  ['+m+'] HTTP 200 but NO image. parts: '+JSON.stringify(parts).slice(0,120));
    } else {
      console.log('  ['+m+'] HTTP '+r.status+' '+txt.replace(/\s+/g,' ').slice(0,200));
    }
  } catch(e){ console.log('  ['+m+'] ERR '+String(e).slice(0,120)); }
}
process.exit(0);

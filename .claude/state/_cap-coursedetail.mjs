import { chromium } from 'playwright';
import { existsSync, readFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(readFileSync('scripts/.secrets/prod-service-account.json','utf8'));
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id||'parbaughs' });
const token = await admin.auth().createCustomToken('1fwuewlis6Yvrtvlk7m0I3rRYwQ2');
mkdirSync('.claude/state/allpages',{recursive:true});
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:430,height:900}, serviceWorkers:'block', deviceScaleFactor:1.5 });
const page = await ctx.newPage();
await page.addInitScript(()=>{try{sessionStorage.setItem('pb_intro_seen','1');sessionStorage.setItem('pb_wt_routed','1');}catch(e){}});
await page.goto('https://parbaughs-staging.web.app/?nocache='+Date.now(),{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>typeof window.auth!=='undefined',{timeout:15000});
await page.evaluate(async t=>{await window.auth.signInWithCustomToken(t);},token);
await page.waitForFunction(()=>{var m=document.getElementById('mainApp');return m&&!m.classList.contains('hidden');},{timeout:20000});
await page.evaluate(()=>{try{window.pbTeeIntro&&window.pbTeeIntro.skip&&window.pbTeeIntro.skip();}catch(e){}});
await page.waitForTimeout(2500);
await page.evaluate(()=>window.Router.go('courses'));
await page.waitForTimeout(1500);
// grab first course id from a card onclick
const id = await page.evaluate(()=>{const el=document.querySelector('.course-dir-item');if(!el)return null;const m=(el.getAttribute('onclick')||'').match(/id:'([^']+)'/);return m?m[1]:null;});
console.log('course id:', id);
if(id){ await page.evaluate(cid=>window.Router.go('courses',{id:cid}), id); await page.waitForTimeout(1800); await page.screenshot({path:'.claude/state/allpages/course-detail.png'}); console.log('shot course-detail'); }
await b.close();

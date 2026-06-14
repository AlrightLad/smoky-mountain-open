import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(readFileSync('scripts/.secrets/prod-service-account.json','utf8'));
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id });
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
await page.waitForTimeout(3000);
// view a real-photo member's profile (Gabriel Paglio, 20kb photo)
await page.evaluate(()=>window.Router.go('members',{id:'wWwEktCK8hUL2PkaUlf7O8VxPGH3'}));
await page.waitForTimeout(3500); // allow loadMemberPhotos async
const info = await page.evaluate(()=>{const el=document.querySelector('.pf-av');if(!el)return 'no pf-av';const img=el.querySelector('img');const cs=getComputedStyle(el);return {hasImg:!!img, overflow:cs.overflow, radius:cs.borderRadius, imgFit: img?getComputedStyle(img).objectFit:null};});
console.log('pf-av:', JSON.stringify(info));
await page.screenshot({path:'.claude/state/allpages/profile-photo-fit.png'});
console.log('shot profile-photo-fit');
await b.close();

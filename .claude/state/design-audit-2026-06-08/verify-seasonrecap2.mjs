import { chromium } from 'playwright';
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';process.env.GCLOUD_PROJECT='parbaughs';
const admin=(await import('firebase-admin')).default; if(!admin.apps.length) admin.initializeApp({projectId:'parbaughs'});
const token=await admin.auth().createCustomToken('test_zach_uid_01');
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const page=await ctx.newPage();
await page.addInitScript(()=>{try{localStorage.setItem('pb_clubhouse_welcomed','1')}catch(e){}});
await page.goto('http://localhost:5173/?emulator=1');
await page.waitForFunction(()=>typeof window.auth!=='undefined'&&window._pbEmulator===true,{timeout:12000});
await page.evaluate(async t=>{await window.auth.signInWithCustomToken(t)},token);
await page.waitForFunction(()=>!document.getElementById('mainApp')?.classList.contains('hidden'),{timeout:15000});
// warm: visit rounds + standings so season data loads, then seasonrecap
await page.evaluate(()=>Router.go('rounds'));await page.waitForTimeout(1800);
await page.evaluate(()=>Router.go('standings'));await page.waitForTimeout(1800);
await page.evaluate(()=>Router.go('seasonrecap'));await page.waitForTimeout(4000);await page.evaluate(()=>window.scrollTo(0,0));
await page.screenshot({path:'.claude/state/design-audit-2026-06-08/verify/seasonrecap-warm.png',fullPage:false});
// report computed color of an award label if present
const info=await page.evaluate(()=>{const els=[...document.querySelectorAll('div[style]')].filter(d=>/letter-spacing:1px/.test(d.getAttribute('style')||'')&&/font-size:10px/.test(d.getAttribute('style')||''));return els.length?{n:els.length,color:getComputedStyle(els[0]).color,text:els[0].textContent.slice(0,30)}:{n:0}});
await b.close();console.log(JSON.stringify(info));

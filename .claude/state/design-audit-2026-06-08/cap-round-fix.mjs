import { chromium } from 'playwright';
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';process.env.GCLOUD_PROJECT='parbaughs';
const admin=(await import('firebase-admin')).default; if(!admin.apps.length) admin.initializeApp({projectId:'parbaughs'});
const token=await admin.auth().createCustomToken('test_zach_uid_01');
const b=await chromium.launch();
for(const vp of [{k:'mobile',w:390,h:844,m:true,d:2},{k:'desktop',w:1440,h:900,m:false,d:1}]){
  const ctx=await b.newContext({viewport:{width:vp.w,height:vp.h},isMobile:vp.m,hasTouch:vp.m,deviceScaleFactor:vp.d});const page=await ctx.newPage();
  await page.addInitScript(()=>{try{localStorage.setItem('pb_clubhouse_welcomed','1')}catch(e){}});
  await page.goto('http://localhost:5173/?emulator=1');
  await page.waitForFunction(()=>typeof window.auth!=='undefined'&&window._pbEmulator===true,{timeout:12000});
  await page.evaluate(async t=>{await window.auth.signInWithCustomToken(t)},token);
  await page.waitForFunction(()=>!document.getElementById('mainApp')?.classList.contains('hidden'),{timeout:15000});
  await page.evaluate(()=>Router.go('rounds'));await page.waitForTimeout(1500);
  await page.evaluate(()=>Router.go('round',{roundId:'testrnd_1'}));await page.waitForTimeout(2600);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:`.claude/state/design-audit-2026-06-08/pass3/${vp.k}/round-detail.png`,fullPage:false});
  await ctx.close();console.log('captured '+vp.k);
}
await b.close();

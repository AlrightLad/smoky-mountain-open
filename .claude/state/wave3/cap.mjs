import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
const OUT='.claude/state/wave3'; if(!existsSync(OUT)) mkdirSync(OUT,{recursive:true});
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';process.env.GCLOUD_PROJECT='parbaughs';
const admin=(await import('firebase-admin')).default; if(!admin.apps.length) admin.initializeApp({projectId:'parbaughs'});
const token=await admin.auth().createCustomToken('test_zach_uid_01');
const b=await chromium.launch();
for(const vp of [{k:'mobile',w:390,h:844,m:true,d:2},{k:'desktop',w:1440,h:900,m:false,d:1}]){
  const ctx=await b.newContext({viewport:{width:vp.w,height:vp.h},isMobile:vp.m,hasTouch:vp.m,deviceScaleFactor:vp.d});const page=await ctx.newPage();
  const errs=[];page.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,140))});
  await page.addInitScript(()=>{try{localStorage.setItem('pb_clubhouse_welcomed','1')}catch(e){}});
  await page.goto('http://localhost:5173/?emulator=1');
  await page.waitForFunction(()=>typeof window.auth!=='undefined'&&window._pbEmulator===true,{timeout:12000});
  await page.evaluate(async t=>{await window.auth.signInWithCustomToken(t)},token);
  await page.waitForFunction(()=>!document.getElementById('mainApp')?.classList.contains('hidden'),{timeout:15000});
  await page.evaluate(()=>Router.go('feed'));await page.waitForTimeout(3500); // async feed load
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:`${OUT}/feed-${vp.k}.png`,fullPage:false});
  const info=await page.evaluate(()=>({lead:!!document.querySelector('.feed-lead'),headline:(document.querySelector('.feed-lead__headline')||{}).textContent||'',chips:document.querySelectorAll('.feed-h2h-chip').length,cards:document.querySelectorAll('.feed-card--round').length}));
  console.log(`${vp.k}: lead=${info.lead} chips=${info.chips} satelliteCards=${info.cards} headline="${info.headline.slice(0,50)}"${errs.length?' ERR:'+errs.slice(0,2).join(' | '):''}`);
  await ctx.close();
}
await b.close();console.log('wave3 done');

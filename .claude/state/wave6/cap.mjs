import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
const OUT='.claude/state/wave6'; if(!existsSync(OUT)) mkdirSync(OUT,{recursive:true});
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';process.env.GCLOUD_PROJECT='parbaughs';
const admin=(await import('firebase-admin')).default; if(!admin.apps.length) admin.initializeApp({projectId:'parbaughs'});
const token=await admin.auth().createCustomToken('test_zach_uid_01');
const b=await chromium.launch();
for(const vp of [{k:'mobile',w:390,h:844,m:true,d:2},{k:'desktop',w:1440,h:900,m:false,d:1}]){
  const ctx=await b.newContext({viewport:{width:vp.w,height:vp.h},isMobile:vp.m,hasTouch:vp.m,deviceScaleFactor:vp.d});const page=await ctx.newPage();
  const errs=[];page.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,120))});page.on('pageerror',e=>errs.push('PAGEERR:'+e.message.slice(0,100)));
  await page.addInitScript(()=>{try{localStorage.setItem('pb_clubhouse_welcomed','1')}catch(e){}});
  await page.goto('http://localhost:5173/?emulator=1');
  await page.waitForFunction(()=>typeof window.auth!=='undefined'&&window._pbEmulator===true,{timeout:12000});
  await page.evaluate(async t=>{await window.auth.signInWithCustomToken(t)},token);
  await page.waitForFunction(()=>!document.getElementById('mainApp')?.classList.contains('hidden'),{timeout:15000});
  await page.evaluate(()=>Router.go('rounds'));await page.waitForTimeout(1500); // warm season data
  await page.evaluate(()=>Router.go('trophyroom',{id:'test_zach_uid_01'}));await page.waitForTimeout(2000);
  await page.evaluate(()=>{var e=document.querySelector('.tr-honor');if(e)e.scrollIntoView();});await page.waitForTimeout(400);
  await page.screenshot({path:`${OUT}/trophyroom-${vp.k}.png`,fullPage:false});
  const info=await page.evaluate(()=>({honor:!!document.querySelector('.tr-honor'),rows:document.querySelectorAll('.tr-honor__row').length,champ:(document.querySelector('.tr-honor__champ')||{}).textContent||'',cap:(document.querySelector('.tr-honor__caption')||{}).textContent||''}));
  console.log(`${vp.k}: honor=${info.honor} rows=${info.rows} champ="${info.champ}" cap="${info.cap.slice(0,50)}"${errs.length?' ERR:'+errs.slice(0,2).join(' | '):''}`);
  await ctx.close();
}
await b.close();console.log('wave6 done');

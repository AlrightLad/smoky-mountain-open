import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
const OUT='.claude/state/design-audit-2026-06-08/verify-v98'; if(!existsSync(OUT)) mkdirSync(OUT,{recursive:true});
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';process.env.GCLOUD_PROJECT='parbaughs';
const admin=(await import('firebase-admin')).default; if(!admin.apps.length) admin.initializeApp({projectId:'parbaughs'});
const token=await admin.auth().createCustomToken('test_zach_uid_01');
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const page=await ctx.newPage();
await page.addInitScript(()=>{try{localStorage.setItem('pb_clubhouse_welcomed','1')}catch(e){}});
await page.goto('http://localhost:5173/?emulator=1');
await page.waitForFunction(()=>typeof window.auth!=='undefined'&&window._pbEmulator===true,{timeout:12000});
await page.evaluate(async t=>{await window.auth.signInWithCustomToken(t)},token);
await page.waitForFunction(()=>!document.getElementById('mainApp')?.classList.contains('hidden'),{timeout:15000});
await page.waitForTimeout(1200);
for(const s of ['home','feed','rounds','members','chat','settings','more','courses','shop','calendar']){
  try{await page.evaluate(r=>Router.go(r),s);await page.waitForTimeout(1500);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${OUT}/${s}.png`,fullPage:false});console.log('  ✓ '+s);}catch(e){console.log('  ✗ '+s);}
}
// confirm computed mute color is the new value somewhere
const c=await page.evaluate(()=>{const probe=getComputedStyle(document.documentElement).getPropertyValue('--cb-mute').trim();return probe;});
await b.close();console.log('--cb-mute resolves to:', c);

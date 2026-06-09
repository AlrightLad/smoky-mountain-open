import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
const OUT='.claude/state/wave4'; if(!existsSync(OUT)) mkdirSync(OUT,{recursive:true});
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';process.env.GCLOUD_PROJECT='parbaughs';
const admin=(await import('firebase-admin')).default; if(!admin.apps.length) admin.initializeApp({projectId:'parbaughs'});
const db=admin.firestore();
const token=await admin.auth().createCustomToken('test_zach_uid_01');

async function shoot(tag){
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const page=await ctx.newPage();
  const errs=[];page.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,120))});
  await page.addInitScript(()=>{try{localStorage.setItem('pb_clubhouse_welcomed','1')}catch(e){}});
  await page.goto('http://localhost:5173/?emulator=1');
  await page.waitForFunction(()=>typeof window.auth!=='undefined'&&window._pbEmulator===true,{timeout:12000});
  await page.evaluate(async t=>{await window.auth.signInWithCustomToken(t)},token);
  await page.waitForFunction(()=>!document.getElementById('mainApp')?.classList.contains('hidden'),{timeout:15000});
  await page.evaluate(()=>Router.go('feed'));await page.waitForTimeout(3500);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:`${OUT}/feed-${tag}.png`,fullPage:false});
  const info=await page.evaluate(()=>({report:!!document.querySelector('.feed-report'),quiet:!!document.querySelector('.feed-report__quiet'),bullets:document.querySelectorAll('.feed-report__row').length,leadHeadline:(document.querySelector('.feed-lead__headline')||{}).textContent||''}));
  console.log(`[${tag}] report=${info.report} quiet=${info.quiet} bullets=${info.bullets} lead="${info.leadHeadline.slice(0,48)}"${errs.length?' ERR:'+errs.slice(0,2).join(' | '):''}`);
  await b.close();
}

// 1) As-is (quiet week with 2-month-old seed)
await shoot('quiet');

// 2) Inject this-week rounds (clone seed rounds with fresh createdAt + dates) to verify populated report + newsworthy lead
const lg = (await db.collection('rounds').limit(1).get()).docs[0].data().leagueId;
const src = (await db.collection('rounds').where('player','==','testzach').limit(4).get()).docs.map(d=>d.data());
const now = Date.now();
const injected = [];
for (let i=0;i<src.length;i++){
  const r = {...src[i]};
  const id = 'wk_inject_'+i;
  r.createdAt = admin.firestore.Timestamp.fromMillis(now - i*3600000);
  const d = new Date(now - i*86400000); r.date = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  r.visibility='public'; r.leagueId=lg;
  if (i===0 && r.holeScores && r.holeScores.length){ r.score = (r.holePars||[]).reduce((a,p)=>a+(parseInt(p)||4),0) - 2; r.holeScores = (r.holePars||[]).map((p,idx)=> idx<2 ? String((parseInt(p)||4)-1) : String(parseInt(p)||4)); } // a good round (-2) for Round of the Week
  await db.collection('rounds').doc(id).set(r); injected.push(id);
}
await shoot('populated');

// cleanup injected
for (const id of injected) await db.collection('rounds').doc(id).delete();
console.log('cleaned up '+injected.length+' injected rounds');

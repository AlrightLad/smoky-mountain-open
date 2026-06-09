import { chromium } from 'playwright';
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';process.env.GCLOUD_PROJECT='parbaughs';
const admin=(await import('firebase-admin')).default; if(!admin.apps.length) admin.initializeApp({projectId:'parbaughs'});
const db=admin.firestore();
const token=await admin.auth().createCustomToken('test_zach_uid_01');
const lg=(await db.collection('rounds').limit(1).get()).docs[0].data().leagueId;
// inject a directory entry for "Test Course B" (has a legend)
const cid='inject_tcb';
await db.collection('courses').doc(cid).set({name:'Test Course B',loc:'York, PA',rating:71.2,slope:128,par:72,holes:18,leagueId:lg});
const b=await chromium.launch();
for(const vp of [{k:'mobile',w:390,h:844,m:true,d:2},{k:'desktop',w:1440,h:900,m:false,d:1}]){
  const ctx=await b.newContext({viewport:{width:vp.w,height:vp.h},isMobile:vp.m,hasTouch:vp.m,deviceScaleFactor:vp.d});const page=await ctx.newPage();
  const errs=[];page.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,120))});
  await page.addInitScript(()=>{try{localStorage.setItem('pb_clubhouse_welcomed','1')}catch(e){}});
  await page.goto('http://localhost:5173/?emulator=1');
  await page.waitForFunction(()=>typeof window.auth!=='undefined'&&window._pbEmulator===true,{timeout:12000});
  await page.evaluate(async t=>{await window.auth.signInWithCustomToken(t)},token);
  await page.waitForFunction(()=>!document.getElementById('mainApp')?.classList.contains('hidden'),{timeout:15000});
  await page.evaluate(()=>Router.go('rounds'));await page.waitForTimeout(1500);
  const cid2=await page.evaluate(()=>{var cs=(PB.getCourses&&PB.getCourses())||[];var f=cs.filter(function(c){return c.name==='Test Course B';});return f.length?f[0].id:(cs[0]&&cs[0].id);});
  await page.evaluate((id)=>Router.go('courses',{id:id}),cid2);await page.waitForTimeout(1800);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:`.claude/state/wave5/course-${vp.k}.png`,fullPage:false});
  const info=await page.evaluate(()=>{var e=document.querySelector('.course-legend');return e?{legend:true,name:(e.querySelector('.course-legend__name')||{}).textContent,sub:(e.querySelector('.course-legend__sub')||{}).textContent}:{legend:false,dir:(PB.getCourses&&PB.getCourses()||[]).length};});
  console.log(`${vp.k}: legend=${info.legend} name="${info.name||''}" sub="${(info.sub||'').slice(0,55)}" dir=${info.dir||''}${errs.length?' ERR:'+errs.slice(0,2).join(' | '):''}`);
  await ctx.close();
}
await b.close();
await db.collection('courses').doc(cid).delete();
console.log('cleaned up injected course');

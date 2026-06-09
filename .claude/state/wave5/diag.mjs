import { chromium } from 'playwright';
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';process.env.GCLOUD_PROJECT='parbaughs';
const admin=(await import('firebase-admin')).default; if(!admin.apps.length) admin.initializeApp({projectId:'parbaughs'});
const db=admin.firestore();const token=await admin.auth().createCustomToken('test_zach_uid_01');
const lg=(await db.collection('rounds').limit(1).get()).docs[0].data().leagueId;
await db.collection('courses').doc('inject_tcb').set({name:'Test Course B',loc:'York, PA',rating:71.2,slope:128,par:72,holes:18,leagueId:lg});
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:900}});const page=await ctx.newPage();
await page.addInitScript(()=>{try{localStorage.setItem('pb_clubhouse_welcomed','1')}catch(e){}});
await page.goto('http://localhost:5173/?emulator=1');
await page.waitForFunction(()=>typeof window.auth!=='undefined'&&window._pbEmulator===true,{timeout:12000});
await page.evaluate(async t=>{await window.auth.signInWithCustomToken(t)},token);
await page.waitForFunction(()=>!document.getElementById('mainApp')?.classList.contains('hidden'),{timeout:15000});
await page.evaluate(()=>Router.go('rounds'));await page.waitForTimeout(1800);
const diag=await page.evaluate(()=>{
  var cs=(PB.getCourses&&PB.getCourses())||[];
  var tcb=cs.filter(function(c){return c.name==='Test Course B';})[0];
  var out={dirCount:cs.length, tcbFound:!!tcb, tcbId:tcb&&tcb.id};
  if(tcb){ var got=PB.getCourse(tcb.id); out.getCourseOk=!!got; out.getCourseName=got&&got.name;
    out.legendForName=(function(){var cl=computeCourseLegend(tcb.name);return cl&&cl.legend?cl.legend.name+' x'+cl.legend.count:'null';})(); }
  return out;
});
console.log('diag:',JSON.stringify(diag));
if(diag.tcbId){ await page.evaluate((id)=>Router.go('courses',{id:id}),diag.tcbId);await page.waitForTimeout(1800);
  const r=await page.evaluate(()=>({detailRendered:!!document.querySelector('.c-detail-info'),hasLeaderboard:!!document.querySelector('.sec-title'),crown:!!document.querySelector('.course-legend'),bodyStart:(document.querySelector('[data-page=courses]')||{}).innerHTML?.slice(0,80)}));
  console.log('afterNav:',JSON.stringify(r));
  await page.screenshot({path:'.claude/state/wave5/course-desktop.png',fullPage:false});
}
await b.close();await db.collection('courses').doc('inject_tcb').delete();console.log('done');

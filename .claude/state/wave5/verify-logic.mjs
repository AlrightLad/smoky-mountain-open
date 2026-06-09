import { chromium } from 'playwright';
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';process.env.GCLOUD_PROJECT='parbaughs';
const admin=(await import('firebase-admin')).default; if(!admin.apps.length) admin.initializeApp({projectId:'parbaughs'});
const token=await admin.auth().createCustomToken('test_zach_uid_01');
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:900}});const page=await ctx.newPage();
await page.addInitScript(()=>{try{localStorage.setItem('pb_clubhouse_welcomed','1')}catch(e){}});
await page.goto('http://localhost:5173/?emulator=1');
await page.waitForFunction(()=>typeof window.auth!=='undefined'&&window._pbEmulator===true,{timeout:12000});
await page.evaluate(async t=>{await window.auth.signInWithCustomToken(t)},token);
await page.waitForFunction(()=>!document.getElementById('mainApp')?.classList.contains('hidden'),{timeout:15000});
await page.evaluate(()=>Router.go('rounds'));await page.waitForTimeout(1800);
const res=await page.evaluate(()=>{
  var rounds=PB.getRounds()||[];
  var names={}; rounds.forEach(function(r){if(r.course)names[r.course]=1;});
  var out=[]; Object.keys(names).forEach(function(nm){var cl=computeCourseLegend(nm); if(cl&&cl.legend)out.push({course:nm,legend:cl.legend.name,count:cl.legend.count,gap:cl.runnerUpGap});});
  return {courseNames:Object.keys(names).length, directoryCount:(PB.getCourses&&PB.getCourses()||[]).length, legends:out};
});
await b.close();
console.log(JSON.stringify(res,null,1));

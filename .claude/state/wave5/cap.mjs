import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
const OUT='.claude/state/wave5'; if(!existsSync(OUT)) mkdirSync(OUT,{recursive:true});
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';process.env.GCLOUD_PROJECT='parbaughs';
const admin=(await import('firebase-admin')).default; if(!admin.apps.length) admin.initializeApp({projectId:'parbaughs'});
const token=await admin.auth().createCustomToken('test_zach_uid_01');
const b=await chromium.launch();
for(const vp of [{k:'mobile',w:390,h:844,m:true,d:2},{k:'desktop',w:1440,h:900,m:false,d:1}]){
  const ctx=await b.newContext({viewport:{width:vp.w,height:vp.h},isMobile:vp.m,hasTouch:vp.m,deviceScaleFactor:vp.d});const page=await ctx.newPage();
  const errs=[];page.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,120))});
  await page.addInitScript(()=>{try{localStorage.setItem('pb_clubhouse_welcomed','1')}catch(e){}});
  await page.goto('http://localhost:5173/?emulator=1');
  await page.waitForFunction(()=>typeof window.auth!=='undefined'&&window._pbEmulator===true,{timeout:12000});
  await page.evaluate(async t=>{await window.auth.signInWithCustomToken(t)},token);
  await page.waitForFunction(()=>!document.getElementById('mainApp')?.classList.contains('hidden'),{timeout:15000});
  await page.evaluate(()=>Router.go('rounds'));await page.waitForTimeout(1500); // warm rounds
  // pick the course with the most rounds + a computable legend
  const courseId=await page.evaluate(()=>{
    var cs=(PB.getCourses&&PB.getCourses())||[]; var best=null,bestN=-1;
    cs.forEach(function(c){var cl=(typeof computeCourseLegend==='function')?computeCourseLegend(c.name):null; if(cl){var n=(PB.getCourseRounds(c.name)||[]).length; if(n>bestN){bestN=n;best=c;}}});
    return best?best.id:(cs[0]&&cs[0].id);
  });
  await page.evaluate((id)=>Router.go('courses',{id:id}),courseId);await page.waitForTimeout(1800);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:`${OUT}/course-${vp.k}.png`,fullPage:false});
  const info=await page.evaluate(()=>{var e=document.querySelector('.course-legend');return e?{legend:true,name:(e.querySelector('.course-legend__name')||{}).textContent,sub:(e.querySelector('.course-legend__sub')||{}).textContent}:{legend:false};});
  console.log(`${vp.k}: courseId=${courseId} legend=${info.legend} name="${info.name||''}" sub="${(info.sub||'').slice(0,50)}"${errs.length?' ERR:'+errs.slice(0,2).join(' | '):''}`);
  await ctx.close();
}
await b.close();console.log('wave5 done');

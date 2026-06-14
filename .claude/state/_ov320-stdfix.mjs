import { chromium } from 'playwright';
import { existsSync, readFileSync } from 'fs';
const sa = JSON.parse(readFileSync('scripts/.secrets/prod-service-account.json','utf8'));
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id||'parbaughs' });
const token = await admin.auth().createCustomToken('1fwuewlis6Yvrtvlk7m0I3rRYwQ2');
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:320,height:850}, serviceWorkers:'block', deviceScaleFactor:1 });
const page = await ctx.newPage();
await page.addInitScript(()=>{try{sessionStorage.setItem('pb_intro_seen','1');sessionStorage.setItem('pb_wt_routed','1');}catch(e){}});
await page.goto('https://parbaughs-staging.web.app/?nocache='+Date.now(),{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>typeof window.auth!=='undefined',{timeout:15000});
await page.evaluate(async t=>{await window.auth.signInWithCustomToken(t);},token);
await page.waitForFunction(()=>{var m=document.getElementById('mainApp');return m&&!m.classList.contains('hidden');},{timeout:20000});
await page.evaluate(()=>{try{window.pbTeeIntro&&window.pbTeeIntro.skip&&window.pbTeeIntro.skip();}catch(e){}});
await page.waitForTimeout(2500);
await page.addStyleTag({content:'.std-col-avg{display:none}.roster-table thead th,.roster-table .roster-row td{padding-left:6px;padding-right:6px}.roster-cell-av{width:48px}'});
await page.evaluate(()=>window.Router.go('standings'));
await page.waitForTimeout(900);
const res = await page.evaluate(()=>{
  document.querySelectorAll('#mainApp .std-name-txt,#mainApp .roster-handle').forEach(el=>{el.textContent='McGillicuddy-Smyth';});
  const vw=document.documentElement.clientWidth;const docW=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth);
  const off=[];for(const el of document.querySelectorAll('#mainApp *')){const r=el.getBoundingClientRect();if(r.width<2)continue;if(r.right>vw+2){const p=el.parentElement;const pr=p?p.getBoundingClientRect():{right:vw,left:0};const c=el.getAttribute('class')||'';if(/notif-panel|-skip|shelf__rail|shop-item/.test(c))continue;if(pr.right<=vw+2)off.push({t:el.tagName,c:c.slice(0,40),w:Math.round(r.width)});}}
  return{vw,docW,hScroll:docW-vw,off:off.slice(0,5)};
});
console.log('standings@320 +stdfix:',JSON.stringify(res));
await b.close();

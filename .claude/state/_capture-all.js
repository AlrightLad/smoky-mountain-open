const fs = require('fs');
const path = require('path');
(function loadEnv(){ var p=path.resolve(__dirname,'..','..','.env.local'); if(!fs.existsSync(p))return; fs.readFileSync(p,'utf8').split(/\r?\n/).forEach(function(l){l=l.trim();if(!l||l[0]==='#')return;var e=l.indexOf('=');if(e<1)return;var k=l.slice(0,e).trim(),v=l.slice(e+1).trim().replace(/^["']|["']$/g,'');if(!process.env[k])process.env[k]=v;});})();
const { chromium } = require('playwright');
const auth = require('../../tests/smoke/helpers/auth.js');
const DEV='http://localhost:5173/smoky-mountain-open/';
const OUT=path.resolve(__dirname,'ui-audit-2026-06-11');
fs.mkdirSync(OUT,{recursive:true});
// simple route navigations (no params) — the member-facing surfaces
const PAGES=['playnow','settings','tee-create','leagues'];
(async()=>{
  const browser=await chromium.launch();
  const THEMES = ['clubhouse','twilight_links','linen_draft','champion_sunday','bourbon_room','course_record'];
  const ctx = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
  const page = await ctx.newPage();
  await auth.loginReal(page, DEV);
  await page.waitForTimeout(1500);
  const verdicts = await page.evaluate((themes) => {
    const out = {};
    const base = getComputedStyle(document.documentElement).getPropertyValue('--cb-canvas').trim();
    themes.forEach(t => {
      try {
        applyTheme(t);
        const canvas = getComputedStyle(document.documentElement).getPropertyValue('--cb-canvas').trim();
        const ink = getComputedStyle(document.documentElement).getPropertyValue('--cb-ink').trim();
        const paper = getComputedStyle(document.documentElement).getPropertyValue('--cb-paper').trim();
        out[t] = { applied: getCurrentTheme()===t, canvas, ink, paper, ok: !!(canvas && ink && paper) };
      } catch(e) { out[t] = { error: String(e) }; }
    });
    applyTheme('clubhouse');
    return out;
  }, THEMES);
  console.log('THEMES:', JSON.stringify(verdicts, null, 0));
  // screenshot home under 3 representative themes
  for (const t of ['twilight_links','bourbon_room','course_record']) {
    await page.evaluate((x)=>{ applyTheme(x); Router.go('home'); }, t);
    await page.waitForTimeout(1200);
    await page.screenshot({path:path.join(OUT,'theme-'+t+'.png')});
  }
  await page.evaluate(()=>applyTheme('clubhouse'));
  await ctx.close();
  await browser.close();
  return;
  for(const [label,vp] of [['mobile',{width:390,height:844}],['desktop',{width:1440,height:900}]]){
    const ctx=await browser.newContext({viewport:vp,deviceScaleFactor:1});
    const page=await ctx.newPage();
    await auth.loginReal(page,DEV);
    await page.waitForTimeout(1500);
    for(const pg of PAGES){
      try{
        await page.evaluate((x)=>Router.go(x),pg);
        await page.waitForTimeout(1100);
        await page.screenshot({path:path.join(OUT,pg+'-'+label+'.png'),fullPage:false});
      }catch(e){ console.log('ERR',pg,label,e.message.slice(0,60)); }
    }
    console.log('done',label);
    await ctx.close();
  }
  await browser.close();
})().catch(e=>{console.error(e.message);process.exit(1);});

const fs = require('fs');
const path = require('path');
(function loadEnv(){ var p=path.resolve(__dirname,'..','..','.env.local'); if(!fs.existsSync(p))return; fs.readFileSync(p,'utf8').split(/\r?\n/).forEach(function(l){l=l.trim();if(!l||l[0]==='#')return;var e=l.indexOf('=');if(e<1)return;var k=l.slice(0,e).trim(),v=l.slice(e+1).trim().replace(/^["']|["']$/g,'');if(!process.env[k])process.env[k]=v;});})();
const { chromium } = require('playwright');
const auth = require('../../tests/smoke/helpers/auth.js');
const DEV='http://localhost:5173/smoky-mountain-open/';
const OUT=path.resolve(__dirname,'ui-audit-2026-06-11');
fs.mkdirSync(OUT,{recursive:true});
// simple route navigations (no params) — the member-facing surfaces
const PAGES=['home','playnow','rounds','roundhistory','courses','records','standings','feed','activity','members','findplayers','leagues','chat','teetimes','trips','scramble','wagers','bounties','challenges','richlist','shop','trophyroom','aces','awards','seasonrecap','partygames','drills','range','rules','faq','more','settings','caddynotes'];
(async()=>{
  const browser=await chromium.launch();
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

// Verify the living-caddy idle/perk motion before shipping. Renders the 4
// portraits with the EXACT keyframes from components.css, captures three breath
// phases (to see the squash-stretch delta) + a hover-perk state.
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const CADDIES = ['caddy-caddy', 'caddy-oldtom', 'caddy-birdie', 'caddy-bagroom'];
const uris = {};
for (const n of CADDIES) uris[n] = 'data:image/jpeg;base64,' + readFileSync('public/img/avatars/' + n + '.jpg').toString('base64');
const CSS = `
.pb-caddy-live{transform-origin:50% 100%;backface-visibility:hidden;animation:pbCaddyBreathe 4.4s ease-in-out infinite;transition:transform .42s cubic-bezier(.34,1.56,.64,1)}
@keyframes pbCaddyBreathe{0%{transform:translateY(0) scaleX(1) scaleY(1) rotate(0)}22%{transform:translateY(-1.6px) scaleX(.988) scaleY(1.016) rotate(-.7deg)}50%{transform:translateY(.5px) scaleX(1.012) scaleY(.99) rotate(0)}74%{transform:translateY(-1.1px) scaleX(.994) scaleY(1.008) rotate(.7deg)}100%{transform:translateY(0) scaleX(1) scaleY(1) rotate(0)}}
.pb-caddy-host:hover .pb-caddy-live{animation:none;transform:translateY(-5px) scaleX(1.05) scaleY(.97)}`;
const card = (n, i, big) => `<div class="pb-caddy-host" style="text-align:center"><div style="width:${big?88:46}px;height:${big?88:46}px;border-radius:50%;overflow:hidden;background:#B4893E;display:inline-block;border:2px solid #B4893E"><img class="pb-caddy-live" style="width:100%;height:100%;object-fit:cover;display:block;animation-delay:-${(i*1.07).toFixed(2)}s" src="${uris[n]}"></div><div style="font:10px monospace;color:#666">${n}</div></div>`;
const row = (big) => `<div style="display:flex;gap:18px;align-items:flex-end;padding:18px;background:#FCFAF5">${CADDIES.map((n,i)=>card(n,i,big)).join('')}</div>`;
const html = `<!doctype html><meta charset=utf8><style>body{margin:0;font-family:sans-serif}${CSS}</style><body>
<div>shop size (88px):</div>${row(true)}
<div>settings size (46px):</div>${row(false)}
<div id="hover">hover state (perk):</div><div id="hoverrow">${row(true)}</div>`;
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 520, height: 560 }, deviceScaleFactor: 2 });
await page.setContent(html);
await page.waitForTimeout(200);
// pause all animations at a chosen phase via negative delay manipulation
async function freezeAt(ms){ await page.evaluate((ms)=>{document.querySelectorAll('.pb-caddy-live').forEach(el=>{el.style.animationDelay=(-(ms/1000)).toFixed(2)+'s';el.style.animationPlayState='paused';});}, ms); }
await freezeAt(968); // ~22% of 4.4s -> peak inhale/stretch
await page.screenshot({ path: '.claude/state/caddy-anim/demo-stretch.png' });
await freezeAt(2200); // ~50% -> squash
await page.screenshot({ path: '.claude/state/caddy-anim/demo-squash.png' });
// hover the first host of the hover row
await page.evaluate(()=>{const r=document.getElementById('hoverrow');const h=r.querySelector('.pb-caddy-host');h.classList.add('force');});
await page.addStyleTag({content:'.force .pb-caddy-live{animation:none!important;transform:translateY(-5px) scaleX(1.05) scaleY(.97)!important}'});
await page.waitForTimeout(450);
await page.screenshot({ path: '.claude/state/caddy-anim/demo-hover.png' });
await b.close();
console.log('demos -> .claude/state/caddy-anim/demo-{stretch,squash,hover}.png');

// Render each caddy portrait at 256 with a coordinate grid so I can read exact
// eye centers for the blink composite.
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const CADDIES = ['caddy-caddy', 'caddy-oldtom', 'caddy-birdie', 'caddy-bagroom'];
const uris = {};
for (const n of CADDIES) uris[n] = 'data:image/jpeg;base64,' + readFileSync('public/img/avatars/' + n + '.jpg').toString('base64');
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1180, height: 360 } });
const cells = CADDIES.map((n) => `<div class="cell"><div class="lbl">${n}</div><div class="wrap"><img src="${uris[n]}"><canvas width="256" height="256"></canvas></div></div>`).join('');
await page.setContent(`<body style="margin:0;background:#111;display:flex;gap:8px;padding:10px;font-family:monospace;color:#9f9">
<style>.cell{text-align:center}.lbl{font-size:11px;color:#fff;margin-bottom:3px}.wrap{position:relative;width:256px;height:256px}.wrap img,.wrap canvas{position:absolute;left:0;top:0;width:256px;height:256px}</style>${cells}
<script>
document.querySelectorAll('canvas').forEach(cv=>{const c=cv.getContext('2d');c.strokeStyle='rgba(0,255,80,.35)';c.fillStyle='rgba(0,255,80,.85)';c.font='9px monospace';c.lineWidth=1;
for(let x=0;x<=256;x+=32){c.beginPath();c.moveTo(x,0);c.lineTo(x,256);c.stroke();if(x%64===0)c.fillText(x,x+1,10);}
for(let y=0;y<=256;y+=32){c.beginPath();c.moveTo(0,y);c.lineTo(256,y);c.stroke();if(y%64===0)c.fillText(y,1,y+10);}});
</script></body>`);
await page.waitForTimeout(300);
await page.screenshot({ path: '.claude/state/caddy-anim/grid.png' });
await b.close();
console.log('grid -> .claude/state/caddy-anim/grid.png');

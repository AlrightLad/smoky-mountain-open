// #66 DIAGNOSTIC v2 — render every ring with the REAL worn DOM from
// router.js getAvatar (outer wrapper.ring-* + inner overflow:hidden photo
// child), box-sizing:border-box like the app. This faithfully shows which
// rings COVER the photo (Founder: rings must frame, never hide the face).
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const base = readFileSync('src/styles/base.css', 'utf8');
const comp = readFileSync('src/styles/components.css', 'utf8');
const face = 'data:image/jpeg;base64,' + readFileSync('public/img/avatars/default-2.jpg').toString('base64');
const RINGS = ['(none)','ring-gallery-rope','ring-fescue','ring-fried-egg','ring-claret','ring-wax-seal','ring-hickory','ring-iron-blade','ring-crest-pin','ring-medallion','ring-founders-crest','ring-green-jacket','ring-pulse-gold','ring-diamond-sparkle'];
// Mirror getAvatar: wrapper(ring) > inner(overflow hidden) > img
const av = (rc, size) => `<div class="${rc==='(none)'?'':rc}" style="width:${size}px;height:${size}px;min-width:${size}px;border-radius:50%;position:relative;box-sizing:border-box;flex:none"><div style="width:100%;height:100%;border-radius:50%;overflow:hidden"><img src="${face}" style="width:100%;height:100%;object-fit:cover;display:block"></div></div>`;
const cell = (rc) => `<div class="cell"><div class="row">${av(rc,88)}${av(rc,48)}</div><div class="lbl">${rc}</div></div>`;
const html = `<!doctype html><meta charset=utf8><style>${base}\n${comp}</style>
<style>*{box-sizing:border-box}body{margin:0;background:var(--cb-paper,#FCFAF5);padding:22px;font-family:var(--font-ui,sans-serif)}
.grid{display:flex;flex-wrap:wrap;gap:30px 26px}.cell{display:flex;flex-direction:column;align-items:center;gap:10px;width:150px}
.row{display:flex;gap:16px;align-items:center;justify-content:center;min-height:104px}.lbl{font:11px monospace;color:#555;text-align:center}</style>
<body><div class="grid">${RINGS.map(cell).join('')}</div></body>`;
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 760, height: 920 }, deviceScaleFactor: 2 });
await page.setContent(html);
await page.waitForTimeout(500);
await page.screenshot({ path: '.claude/state/ring-audit.png', fullPage: true });
await b.close();
console.log('ring audit v2 -> .claude/state/ring-audit.png');

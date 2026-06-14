// #66 — confirm nameplates aren't flat like the rings were. Render each plate-*
// worn class behind a sample name with the real base.css + components.css.
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const base = readFileSync('src/styles/base.css', 'utf8');
const comp = readFileSync('src/styles/components.css', 'utf8');
const PLATES = ['plate-locker-brass','plate-yardage','plate-sunday','plate-stimp','plate-clubhouse-crest','plate-calfskin-tag','plate-chalk-board'];
const cell = (c) => `<div class="cell"><span class="${c}" style="font-family:var(--font-mono);font-size:12px;font-weight:700">FatalBert69420</span><div class="lbl">${c}</div></div>`;
const html = `<!doctype html><meta charset=utf8><style>${base}\n${comp}</style>
<style>*{box-sizing:border-box}body{margin:0;background:var(--cb-paper,#FCFAF5);padding:26px;font-family:var(--font-ui,sans-serif)}
.grid{display:flex;flex-direction:column;gap:20px;align-items:flex-start}.cell{display:flex;flex-direction:column;gap:7px}.lbl{font:11px monospace;color:#666}</style>
<body><div class="grid">${PLATES.map(cell).join('')}</div></body>`;
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 420, height: 560 }, deviceScaleFactor: 2 });
await page.setContent(html); await page.waitForTimeout(400);
await page.screenshot({ path: '.claude/state/plate-audit.png', fullPage: true });
await b.close();
console.log('plate audit -> .claude/state/plate-audit.png');

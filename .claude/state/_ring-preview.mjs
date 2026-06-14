// Ring cosmetic preview harness — renders any set of .ring-* classes around a
// sample avatar at SHOP size (104px) + WORN size (44px) on the cream canvas AND
// a dark card, so elevated ring CSS can be judged exactly as members see it.
// Injects the app's real base.css (:root vars) + components.css (.ring-* rules).
//   node .claude/state/_ring-preview.mjs [ring-class,ring-class,...]
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'fs';

const base = readFileSync('src/styles/base.css', 'utf8');
const comp = readFileSync('src/styles/components.css', 'utf8');
const RINGS = (process.argv[2] || 'ring-gallery-rope,ring-fescue,ring-claret,ring-wax-seal,ring-hickory,ring-iron-blade,ring-crest-pin,ring-medallion').split(',').map(s => s.trim()).filter(Boolean);
mkdirSync('.claude/state/ring-preview', { recursive: true });

const AV = 'https://parbaughs-staging.web.app/icons/icon-180.png'; // any image as a stand-in avatar

const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 1180, height: Math.max(420, RINGS.length * 180 + 80) }, deviceScaleFactor: 2 })).newPage();

function cell(cls, size) {
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px">
    <div class="${cls}" style="width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative">
      <div style="width:${Math.round(size * 0.8)}px;height:${Math.round(size * 0.8)}px;border-radius:50%;overflow:hidden"><img src="${AV}" style="width:100%;height:100%;object-fit:cover"></div>
    </div>
    <span style="font:9px monospace;color:#888">${size}</span>
  </div>`;
}
const rows = RINGS.map(cls => `
  <div style="display:flex;align-items:center;gap:34px;padding:18px 24px;border-bottom:1px solid rgba(0,0,0,.08)">
    <div style="width:150px;font:600 13px system-ui;color:var(--cb-ink)">${cls}</div>
    <div style="background:var(--cb-chalk);padding:16px 22px;border-radius:12px;display:flex;gap:24px;align-items:center">${cell(cls, 104)}${cell(cls, 44)}<span style="font:9px monospace;color:#999">on cream</span></div>
    <div style="background:#14130F;padding:16px 22px;border-radius:12px;display:flex;gap:24px;align-items:center">${cell(cls, 104)}${cell(cls, 44)}<span style="font:9px monospace;color:#777">on dark</span></div>
  </div>`).join('');

await pg.setContent(`<!doctype html><html data-theme="clubhouse"><head><style>${base}\n${comp}</style></head>
  <body style="margin:0;background:var(--cb-paper);font-family:system-ui">${rows}</body></html>`);
await pg.waitForTimeout(900); // let animations settle to a representative frame
await pg.screenshot({ path: '.claude/state/ring-preview/rings.png' });
await b.close();
console.log('rendered ' + RINGS.length + ' rings → .claude/state/ring-preview/rings.png');

// Crown-jewel ring elevation preview: ring-green-jacket + ring-founders-crest
// + the shared rose-and-P crest device. Renders candidates at shop(104) +
// worn(44) on cream + dark. Iterate the CSS here, then paste winners into
// components.css.
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('.claude/state/ring-preview', { recursive: true });

// rose-and-P crest device as a data-URI SVG (felt-green serif P + cream rose bud,
// brass roundel) — used as the center device for founders-crest / club-pin / crest plate.
const CREST = "data:image/svg+xml," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'>" +
  "<text x='18.5' y='30' font-family='Georgia,\"Times New Roman\",serif' font-size='30' font-weight='700' text-anchor='middle' fill='#23402f'>P</text>" +
  "<ellipse cx='26' cy='13.5' rx='4.6' ry='5.4' fill='#f4efe4' stroke='#b4893e' stroke-width='1.1'/>" +
  "<path d='M24 19l2 3 2-3' fill='#2f5a3e'/>" +
  "</svg>");

const CANDIDATES = `
/* ── pc24 Green Jacket: felt wool band + gold-thread trim + 3 brass buttons ── */
.ring-green-jacket{border:5px solid transparent!important;position:relative;background:
  radial-gradient(circle at 50% 50%, #1c3e2c 0 63%, #163f2b 63% 72%, transparent 72%) padding-box,
  linear-gradient(135deg,#27543b,#0f3d2e 48%,#0a2a1f) border-box;
  box-shadow:inset 0 0 0 1.2px rgba(184,142,66,.5), inset 0 0 8px rgba(0,0,0,.5), 0 4px 12px -4px rgba(0,0,0,.65)}
.ring-green-jacket::before{content:"";position:absolute;inset:-5px;border-radius:50%;pointer-events:none;
  background:repeating-linear-gradient(125deg, rgba(255,255,255,.06) 0 1.4px, transparent 1.4px 3.4px);mix-blend-mode:overlay}
.ring-green-jacket::after{content:"";position:absolute;inset:-5px;border-radius:50%;pointer-events:none;background:
  radial-gradient(circle at 8.5% 31%, #f4e0aa 0 1.4px,#caa75c 1.4px 3px,#7a5520 3px 3.9px, transparent 4.1px),
  radial-gradient(circle at 5.5% 50%, #f4e0aa 0 1.4px,#caa75c 1.4px 3px,#7a5520 3px 3.9px, transparent 4.1px),
  radial-gradient(circle at 8.5% 69%, #f4e0aa 0 1.4px,#caa75c 1.4px 3px,#7a5520 3px 3.9px, transparent 4.1px)}

/* ── pc42 Founders' Crest: double brass bezel + claret enamel + rose-P crest + gleam ── */
.ring-founders-crest{border:5px solid transparent!important;position:relative;background:
  radial-gradient(circle at 50% 50%, #5a1f24 0 60%, #3a1116 60% 70%, transparent 70%) padding-box,
  linear-gradient(118deg,#8c6a2e 3%,#f0dca6 15%,#caa75c 34%,#b4893e 52%,#f0dca6 74%,#8c6a2e 97%) border-box;
  box-shadow:inset 0 0 0 1.4px rgba(60,30,15,.6), inset 0 0 9px rgba(0,0,0,.5), 0 5px 13px -5px rgba(0,0,0,.7)}
.ring-founders-crest::before{content:"";position:absolute;left:50%;bottom:-7%;transform:translateX(-50%);width:46%;height:46%;border-radius:50%;pointer-events:none;
  background:url("${CREST}") center/70% no-repeat, radial-gradient(circle at 38% 30%,#f4e2ad,#caa75c 58%,#8a6526);
  box-shadow:0 0 0 1.5px #8a6526, inset 0 1px 1px rgba(255,255,255,.45), 0 2px 5px rgba(0,0,0,.55)}
.ring-founders-crest::after{content:"";position:absolute;inset:-5px;border-radius:50%;pointer-events:none;
  background:conic-gradient(from 0deg,transparent 0 80%,rgba(255,255,255,.78) 88%,transparent 95%);animation:claretSweep 5s linear infinite}

/* reduced-motion freeze */
@media (prefers-reduced-motion: reduce){.ring-founders-crest::after{animation:none}}
@keyframes claretSweep{to{transform:rotate(360deg)}}
`;

const RINGS = ['ring-green-jacket', 'ring-founders-crest'];
const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 980, height: 460 }, deviceScaleFactor: 2 })).newPage();
function cell(cls, size) {
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px"><div class="${cls}" style="width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative"><div style="width:${Math.round(size * 0.8)}px;height:${Math.round(size * 0.8)}px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#9aa,#677)"></div></div><span style="font:9px monospace;color:#888">${size}</span></div>`;
}
const rows = RINGS.map(cls => `<div style="display:flex;align-items:center;gap:30px;padding:18px 24px;border-bottom:1px solid #444">
  <div style="width:150px;font:600 13px system-ui;color:#eee">${cls}</div>
  <div style="background:#E7E0CD;padding:14px 20px;border-radius:12px;display:flex;gap:22px;align-items:center">${cell(cls, 104)}${cell(cls, 44)}</div>
  <div style="background:#14130F;padding:14px 20px;border-radius:12px;display:flex;gap:22px;align-items:center">${cell(cls, 104)}${cell(cls, 44)}</div>
</div>`).join('');
await pg.setContent(`<!doctype html><html><head><style>${CANDIDATES}</style></head><body style="margin:0;background:#222;font-family:system-ui">
  <div style="padding:10px 24px;color:#caa75c;font:600 13px system-ui">Crest device test:</div>
  <div style="padding:0 24px 12px;display:flex;gap:20px;align-items:center"><img src="${CREST}" style="width:80px;height:80px"><img src="${CREST}" style="width:40px;height:40px"><span style="color:#888;font:11px monospace">rose-and-P crest (80 / 40px)</span></div>
  ${rows}</body></html>`);
await pg.waitForTimeout(700);
await pg.screenshot({ path: '.claude/state/ring-preview/crownjewel.png' });
await b.close();
console.log('crown-jewel preview → .claude/state/ring-preview/crownjewel.png');

// Ground-truth: read the COMPUTED text color + effective (non-transparent
// ancestor) background of the real elements, on the running dev server, so the
// contrast fix targets the actual rendered grounds (chalk vs canvas vs paper).
import { chromium } from 'playwright';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const token = await admin.auth().createCustomToken('test_zach_uid_01');

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.addInitScript(() => { try { localStorage.setItem('pb_clubhouse_welcomed', '1'); } catch (e) {} });
await page.goto('http://localhost:5173/?emulator=1');
await page.waitForFunction(() => typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 12000 });
await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });

const probe = `(sel) => {
  function effБg(el){ while(el){ const c=getComputedStyle(el).backgroundColor; if(c && c!=='rgba(0, 0, 0, 0)' && c!=='transparent') return c; el=el.parentElement; } return 'none'; }
  const el=document.querySelector(sel); if(!el) return {sel, found:false};
  const cs=getComputedStyle(el);
  return {sel, found:true, color:cs.color, bg:effБg(el), fontSize:cs.fontSize, fontWeight:cs.fontWeight, letterSpacing:cs.letterSpacing};
}`;

const results = {};
async function measure(route, label, selector) {
  await page.evaluate((r) => Router.go(r), route);
  await page.waitForTimeout(1400);
  results[label] = await page.evaluate(eval('(' + probe + ')'), selector);
}

await measure('feed', 'feed_composer', '.feed-composer__promptText');
await measure('settings', 'settings_desc', '.set-row__desc');
// awards eyebrow: inline-styled div with 9px + letter-spacing; find first matching
await page.evaluate((r) => Router.go(r), 'awards');
await page.waitForTimeout(1400);
results['awards_label'] = await page.evaluate(() => {
  function effБg(el){ while(el){ const c=getComputedStyle(el).backgroundColor; if(c && c!=='rgba(0, 0, 0, 0)' && c!=='transparent') return c; el=el.parentElement; } return 'none'; }
  const cands=[...document.querySelectorAll('div[style]')].filter(d=>/font-size:\\s*9px/.test(d.getAttribute('style')||'') && /letter-spacing/.test(d.getAttribute('style')||''));
  if(!cands.length) return {found:false, count:document.querySelectorAll('div[style]').length};
  const el=cands[0], cs=getComputedStyle(el);
  return {found:true, text:el.textContent.slice(0,30), color:cs.color, bg:effБg(el), fontSize:cs.fontSize, fontWeight:cs.fontWeight};
});

await b.close();
console.log(JSON.stringify(results, null, 2));

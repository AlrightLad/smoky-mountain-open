// Verify the share card's html2canvas output renders the new logo (object-fit
// can be finicky in html2canvas — capture the ACTUAL generated image).
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
const SA_PATH = 'scripts/.secrets/prod-service-account.json';
if (!existsSync(SA_PATH)) { console.error('no prod SA'); process.exit(3); }
const admin = (await import('firebase-admin')).default;
const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || 'parbaughs' });
const token = await admin.auth().createCustomToken('1fwuewlis6Yvrtvlk7m0I3rRYwQ2');
const OUT = '.claude/state/cap-sharecard'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 600, height: 900 }, serviceWorkers: 'block' });
const page = await ctx.newPage();
await page.addInitScript(() => { try { sessionStorage.setItem('pb_intro_seen', '1'); sessionStorage.setItem('pb_wt_routed', '1'); } catch (e) {} });
await page.goto('https://parbaughs-staging.web.app/?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.auth !== 'undefined', { timeout: 12000 });
await page.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
await page.waitForFunction(() => { var m = document.getElementById('mainApp'); return m && !m.classList.contains('hidden'); }, { timeout: 20000 });
await page.waitForTimeout(2500);
// Run html2canvas on the share template's .pbs-inner exactly as captureShareCard() does.
const dataUrl = await page.evaluate(async () => {
  var tpl = document.getElementById('pbShareTemplate');
  if (!tpl || typeof html2canvas === 'undefined') return 'NO_TEMPLATE_OR_H2C';
  // populate minimal header-only is fine; logo is static. reveal at real size.
  var prev = tpl.getAttribute('style') || '';
  tpl.style.cssText = 'position:fixed;left:0;top:0;z-index:99999';
  var node = tpl.querySelector('.pbs-inner') || tpl;
  // wait a beat for the logo img to be decoded
  var img = document.getElementById('pbs-logo-img');
  if (img && img.decode) { try { await img.decode(); } catch (e) {} }
  var canvas = await html2canvas(node, { backgroundColor: null, scale: 0.5, logging: false, useCORS: true });
  tpl.setAttribute('style', prev);
  return canvas.toDataURL('image/png');
});
if (dataUrl.startsWith('data:')) {
  writeFileSync(OUT + '/sharecard.png', Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('saved html2canvas output → ' + OUT + '/sharecard.png');
} else {
  console.log('FAIL:', dataUrl);
}
await b.close();

// One-off: verify the #76 prestige level-lock badges render on the staging shop
// as the test member (L3). Mirrors _cap-allpages.mjs auth.
import { chromium } from 'playwright';
import { existsSync, readFileSync } from 'fs';
const SA_PATH = 'scripts/.secrets/prod-service-account.json';
if (!existsSync(SA_PATH)) { console.error('no prod SA'); process.exit(3); }
const admin = (await import('firebase-admin')).default;
const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || 'parbaughs' });
const token = await admin.auth().createCustomToken('1fwuewlis6Yvrtvlk7m0I3rRYwQ2');
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 430, height: 900 } });
const page = await ctx.newPage();
await page.goto('https://parbaughs-staging.web.app/?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.auth !== 'undefined', { timeout: 15000 });
await page.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
await page.waitForFunction(() => { var m = document.getElementById('mainApp'); return m && !m.classList.contains('hidden'); }, { timeout: 20000 });
await page.evaluate(() => { try { window.pbTeeIntro && window.pbTeeIntro.skip && window.pbTeeIntro.skip(); } catch (e) {} });
await page.waitForTimeout(2500);
await page.evaluate(() => window.Router && window.Router.go && window.Router.go('shop'));
await page.waitForTimeout(3500);
const out = await page.evaluate(() => ({
  myLevel: (window.PB && PB.getPlayerLevel) ? (PB.getPlayerLevel(window.auth.currentUser.uid) || {}).level : '?',
  lockBadges: Array.from(document.querySelectorAll('.shop-item__state--lvl')).map(e => e.textContent.trim()),
  totalItems: document.querySelectorAll('.shop-item, [class*="shop-item"]').length,
}));
console.log('member level:', out.myLevel);
console.log('lock badges rendered:', out.lockBadges.length);
console.log('distinct:', JSON.stringify([...new Set(out.lockBadges)]));
await b.close();

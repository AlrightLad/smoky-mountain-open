// Geometry probe: measure left edges of .roster-name vs .roster-handle for the
// first row that has a sub-line, to confirm/deny the perceived indent.
import { chromium } from 'playwright';

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const token = await admin.auth().createCustomToken('test_zach_uid_01');
await page.goto('http://localhost:5173/?emulator=1');
await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 10000 });
await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });
await page.evaluate(() => Router.go('members'));
await page.waitForSelector('#rosterBody tr', { timeout: 12000 });
await page.waitForTimeout(1200);

const data = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('#rosterBody tr.roster-row')];
  const ariaSample = rows.slice(0, 3).map(r => r.getAttribute('aria-label'));
  const liveRow = rows.find(r => r.querySelector('.roster-live'));
  return {
    ariaSample,
    liveRowText: liveRow ? liveRow.querySelector('.roster-live').textContent.trim() : '(none online)',
    liveRowAria: liveRow ? liveRow.getAttribute('aria-label') : '(none online)',
    totalRows: rows.length
  };
});
console.log(JSON.stringify(data, null, 2));
await b.close();

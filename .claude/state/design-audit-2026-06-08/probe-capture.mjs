// Probe: confirm the already-running local emulator + dev server can render
// real seeded surfaces before committing to a full 3-viewport sweep.
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = '.claude/state/design-audit-2026-06-08/probe';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });

// Data presence check
const db = admin.firestore();
const members = await db.collection('members').get();
const rounds = await db.collection('rounds').get();
const leagues = await db.collection('leagues').get();
console.log(`[data] members=${members.size} rounds=${rounds.size} leagues=${leagues.size}`);

const token = await admin.auth().createCustomToken('test_zach_uid_01');

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const consoleErrs = [];
page.on('console', m => { if (m.type() === 'error') consoleErrs.push(m.text().slice(0, 120)); });

await page.goto('http://localhost:5173/?emulator=1');
try {
  await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 10000 });
  await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
  await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });
  console.log('[auth] mainApp visible = OK');
} catch (e) {
  console.log('[auth] FAILED: ' + e.message.slice(0, 120));
  await page.screenshot({ path: OUT + '/FAIL-state.png', fullPage: true });
  await b.close();
  console.log('[console errors]', consoleErrs.slice(0, 8).join(' | '));
  process.exit(2);
}
await page.waitForTimeout(1500);

for (const p of ['home', 'range', 'more']) {
  try {
    await page.evaluate((name) => Router.go(name), p);
    await page.waitForTimeout(1800);
    await page.screenshot({ path: OUT + '/' + p + '.png', fullPage: true });
    console.log('  ✓ ' + p);
  } catch (e) {
    console.log('  ✗ ' + p + ' — ' + e.message.slice(0, 80));
  }
}
await b.close();
console.log('[console errors]', consoleErrs.slice(0, 8).join(' | ') || '(none)');
console.log('Probe done → ' + OUT);

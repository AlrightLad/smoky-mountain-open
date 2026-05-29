// DOM-truth probe for the iter50 critique loop. Pixels prove a surface
// rendered; this proves WHAT it rendered (P9 data-truthfulness). Reuses the
// emulator + dev-server custom-token auth path from capture-critique-2026-05-29.mjs.
//
//   DUMP_PAGE      Router page name to navigate to (default 'feed').
//   DUMP_SELECTOR  CSS selector; prints textContent of every match (default none).
//   DUMP_EVAL      arbitrary expression evaluated in page scope; result JSON-printed.
//
// Read-only: navigates, queries, prints. Never writes Firestore or files.

import { chromium } from 'playwright';

const PAGE = process.env.DUMP_PAGE || 'feed';
const SELECTOR = process.env.DUMP_SELECTOR || '';
const EVAL = process.env.DUMP_EVAL || '';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const token = await admin.auth().createCustomToken('test_zach_uid_01');

const b = await chromium.launch();
const page = await (await b.newContext()).newPage();
await page.goto('http://localhost:5173/?emulator=1');
await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 10000 });
await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });
await page.waitForTimeout(1500);

await page.evaluate((name) => Router.go(name), PAGE);
await page.waitForTimeout(1600);

if (SELECTOR) {
    const texts = await page.$$eval(SELECTOR, els => els.map(e => e.textContent.trim()));
    console.log('SELECTOR ' + SELECTOR + ' -> ' + texts.length + ' match(es):');
    texts.forEach(t => console.log('  | ' + t));
}
if (EVAL) {
    const val = await page.evaluate(expr => { try { return eval(expr); } catch (e) { return 'EVAL_ERR: ' + e.message; } }, EVAL);
    console.log('EVAL ' + EVAL + ' ->');
    console.log(JSON.stringify(val, null, 2));
}

await b.close();

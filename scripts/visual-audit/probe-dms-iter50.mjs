// iter50 DMs probe: auth as test_zach, open the DM list, wait for it to leave
// the skeleton state, then dump the rendered list HTML + computed font sizes of
// the unread "NEW" pill, the time label, the preview, and the member name.
// This is the "verify defect with live measurement" step of the critique loop.
//
// Run with the emulator (8080/9099) + dev server (5173) already up.
//   node scripts/visual-audit/probe-dms-iter50.mjs
// Optional: CAPTURE_DEVICE="iPhone 14 Pro" for the mobile form factor.

import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = '.claude/state/design-pass-2026-05-22/iter50-dms';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
const DEVICE = process.env.CAPTURE_DEVICE;
const ctxOptions = (DEVICE && devices[DEVICE]) ? devices[DEVICE] : { viewport: { width: 1440, height: 900 } };

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const token = await admin.auth().createCustomToken('test_zach_uid_01');

// Seed one INBOUND unread DM so the "NEW" pill + time label actually render
// (the defect parts only appear when a conversation has a message from someone
// else). Idempotent: fixed doc id, partner = first scenario member.
const ME = 'test_zach_uid_01';
const PARTNER = 'test_scen_ml_01';
const cid = [ME, PARTNER].sort().join('_');
const db = admin.firestore();
await db.collection('dms').doc(cid).collection('messages').doc('iter50_probe_msg').set({
  text: 'Tee time Saturday? Front nine is wide open at 8:10.',
  authorId: PARTNER,
  authorName: 'scenarioMixedLeagues',
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
});
await db.collection('dms').doc(cid).set({ participants: [ME, PARTNER].sort(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

const b = await chromium.launch();
const ctx = await b.newContext(ctxOptions);
const page = await ctx.newPage();

await page.goto('http://localhost:5173/?emulator=1');
await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 10000 });
await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });

await page.evaluate(() => Router.go('dms'));
// Wait until the list leaves the skeleton state (real rows OR empty state).
await page.waitForFunction(() => {
  const el = document.getElementById('dmMemberList');
  if (!el) return false;
  if (el.querySelector('.skeleton')) return false;
  return el.querySelector('.dm-list-item') || el.textContent.includes('No Conversations');
}, { timeout: 12000 }).catch(() => {});
await page.waitForTimeout(600);

const report = await page.evaluate(() => {
  const el = document.getElementById('dmMemberList');
  const out = { itemCount: 0, emptyState: false, measures: [] };
  if (!el) return out;
  out.emptyState = el.textContent.includes('No Conversations');
  const items = el.querySelectorAll('.dm-list-item');
  out.itemCount = items.length;
  // Measure the first row's typographic parts.
  const first = items[0];
  if (first) {
    const name = first.querySelector('.m-name');
    const pill = first.querySelector('.pill-new');
    // time + preview are the small spans; grab by approximate position
    const smalls = first.querySelectorAll('span, div');
    const fs = (n) => n ? getComputedStyle(n).fontSize : null;
    out.measures.push({ part: 'name', px: fs(name) });
    out.measures.push({ part: 'pill-new', px: fs(pill), present: !!pill });
    // The time label + preview are inline-styled; report every text node fontSize.
    smalls.forEach((n) => {
      const t = (n.textContent || '').trim().slice(0, 24);
      if (t && n.children.length === 0) out.measures.push({ t, px: fs(n) });
    });
  }
  out.html = el.innerHTML.slice(0, 900);
  return out;
});

console.log('LIST ' + JSON.stringify(report, null, 2));
await page.screenshot({ path: OUT + '/dms-probe-' + (DEVICE ? DEVICE.replace(/\s+/g, '') : 'desktop') + '.png', fullPage: true });

// Now the thread view (bubbles + composer) for the same partner.
await page.evaluate((p) => Router.go('dm-thread', { partner: p }), PARTNER);
await page.waitForFunction(() => {
  const c = document.getElementById('dmMessages');
  return c && !c.querySelector('.spinner') && (c.querySelector('.dm-bubble') || c.textContent.includes('Start the conversation'));
}, { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(500);
const thread = await page.evaluate(() => {
  const fs = (n) => n ? getComputedStyle(n).fontSize : null;
  const bubble = document.querySelector('.dm-bubble');
  const input = document.querySelector('.dm-input-area input');
  const btn = document.querySelector('.dm-input-area button');
  return {
    bubbleCount: document.querySelectorAll('.dm-bubble').length,
    bubblePx: fs(bubble),
    bubbleTimePx: fs(document.querySelector('.dm-bubble-time')),
    inputPx: fs(input),
    inputPlaceholder: input ? input.placeholder : null,
    btnPx: fs(btn),
    headerName: (document.getElementById('dmThreadHeader')?.textContent || '').trim().slice(0, 40),
  };
});
console.log('THREAD ' + JSON.stringify(thread, null, 2));
await page.screenshot({ path: OUT + '/dm-thread-' + (DEVICE ? DEVICE.replace(/\s+/g, '') : 'desktop') + '.png', fullPage: false });
await b.close();

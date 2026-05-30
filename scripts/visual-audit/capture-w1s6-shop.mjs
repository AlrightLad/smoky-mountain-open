// W1.S6 Parcoin Shop + Wallet capture (CLUBHOUSE_SPEC-HQ-3m). Reuses the
// emulator + custom-token auth path from capture-w1s4-scoring.mjs. SEEDS a
// realistic parcoin_transactions ledger for the test user so the REAL
// loadTransactionHistory() path renders (P9 — no stubbed data), then sets
// the wallet balance / lifetime / owned + equipped cosmetics on currentProfile
// and renders the shop. Captures the wallet hero, ledger, cosmetics grid (two
// category tabs) and the economy entry cards.
//
//   CAPTURE_DEVICE  Playwright device descriptor (e.g. "iPhone 14 Pro", "Pixel 7")
//   CAPTURE_OUT     output directory
//   CAPTURE_PORT    dev-server port serving --base=/ (default 5173)

import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = process.env.CAPTURE_OUT || '.claude/state/design-pass-2026-05-22/w1s6-shop-2026-05-30/desktop';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const DEVICE = process.env.CAPTURE_DEVICE;
const PORT = process.env.CAPTURE_PORT || '5173';
const ctxOptions = (DEVICE && devices[DEVICE])
    ? devices[DEVICE]
    : { viewport: { width: 1440, height: 1000 } };

// --- Seed a truthful transaction ledger for the test user via admin ---
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const fdb = admin.firestore();
const UID = 'test_zach_uid_01';
const HOUR = 3600 * 1000, DAY = 24 * HOUR;
const now = Date.now();
const seedTxns = [
    { amount: -300, reason: 'purchase',    label: 'Purchased: Crimson Ember Ring', ago: 0.5 * HOUR },
    { amount:  150, reason: 'wager',        label: 'Nassau vs Dwight',              ago: 3 * HOUR },
    { amount:   50, reason: 'round',        label: 'Round bonus at Honey Run',      ago: 1 * DAY },
    { amount:   10, reason: 'daily_login',  label: 'Daily login',                   ago: 2 * DAY },
    { amount:   10, reason: 'daily_login',  label: 'Daily login',                   ago: 3 * DAY },
    { amount:   10, reason: 'daily_login',  label: 'Daily login',                   ago: 4 * DAY },
    { amount:   10, reason: 'daily_login',  label: 'Daily login',                   ago: 5 * DAY },
    { amount:   10, reason: 'daily_login',  label: 'Daily login',                   ago: 6 * DAY },
    { amount:   25, reason: 'achievement',  label: 'Birdie streak',                 ago: 8 * DAY }
];
// Clear any prior seed for determinism, then write fresh.
const existing = await fdb.collection('parcoin_transactions').where('uid', '==', UID).get();
const batch = fdb.batch();
existing.forEach((d) => batch.delete(d.ref));
seedTxns.forEach((t) => {
    const ref = fdb.collection('parcoin_transactions').doc();
    batch.set(ref, {
        uid: UID, amount: t.amount, reason: t.reason, label: t.label,
        createdAt: admin.firestore.Timestamp.fromMillis(now - t.ago)
    });
});
await batch.commit();
console.log('seeded ' + seedTxns.length + ' parcoin_transactions for ' + UID);

const token = await admin.auth().createCustomToken(UID);

const b = await chromium.launch();
const ctx = await b.newContext(ctxOptions);
await ctx.addInitScript(() => { try { localStorage.setItem('pb_clubhouse_welcomed', '1'); } catch (e) {} });
const page = await ctx.newPage();
console.log('Capturing shop at ' + (DEVICE && devices[DEVICE] ? DEVICE : 'desktop 1440x1000') + ' -> ' + OUT);

await page.goto('http://localhost:' + PORT + '/?emulator=1', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 10000 });
await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });
await page.waitForTimeout(1200);

// Set a realistic wallet + cosmetic loadout on the live profile, then render shop.
await page.evaluate(() => {
    if (!currentProfile) return;
    currentProfile.parcoins = 480;
    currentProfile.parcoinsLifetime = 1320;
    currentProfile.ownedCosmetics = ['border_pulse_gold', 'border_shimmer'];
    currentProfile.equippedCosmetics = { border: 'border_pulse_gold' };
    Router.go('shop');
});
// Ledger renders async — wait for a real txn row (or the empty-state) to land.
await page.waitForFunction(() => {
    var el = document.getElementById('shopLedger');
    return el && (el.querySelector('.shop-txn') || el.querySelector('.shop-ledger__empty'));
}, { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(600);
await page.screenshot({ path: OUT + '/shop-rings.png', fullPage: true });
console.log('  ok shop-rings');

// Switch to the Titles tab to capture a different live-preview style.
await page.evaluate(() => { _shopCat = 'title'; Router.go('shop', {}, true); });
await page.waitForFunction(() => {
    var el = document.getElementById('shopLedger');
    return el && (el.querySelector('.shop-txn') || el.querySelector('.shop-ledger__empty'));
}, { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(500);
await page.screenshot({ path: OUT + '/shop-titles.png', fullPage: true });
console.log('  ok shop-titles');

// Reset to rings for any subsequent device run consistency.
await page.evaluate(() => { _shopCat = 'border'; });

await b.close();
console.log('done -> ' + OUT);

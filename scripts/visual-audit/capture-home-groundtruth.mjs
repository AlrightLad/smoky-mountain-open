// Focused ground-truth capture of the HOME front-door at iPhone, AFTER round
// data hydrates, so we judge the real idle hero (not a transient empty state).
// Probes the DOM to report which hero/CTA component actually rendered.

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = 'scratch/home-groundtruth-2026-06-07';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:5173/smoky-mountain-open/?emulator=1';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const token = await admin.auth().createCustomToken('test_zach_uid_01');

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.addInitScript(() => { try { localStorage.setItem('pb_clubhouse_welcomed', '1'); } catch (e) {} });
await page.goto(BASE);
await page.waitForFunction(
    () => typeof window.firebase !== 'undefined' && typeof window.auth !== 'undefined' && window._pbEmulator === true,
    { timeout: 12000 }
);
await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
await page.waitForFunction(
    () => !document.getElementById('mainApp')?.classList.contains('hidden'),
    { timeout: 15000 }
);
await page.evaluate(() => Router.go('home'));
// Let round data hydrate so we render the real idle hero, not the empty state.
await page.waitForTimeout(3500);

// Probe: which hero rendered, and the page's data-state, plus key text.
const probe = await page.evaluate(() => {
    const main = document.getElementById('mainApp') || document.body;
    const txt = (main.innerText || '').slice(0, 400);
    const hasStartBtn = !!Array.from(main.querySelectorAll('button,a')).find(el => /start a round/i.test(el.textContent || ''));
    const greetMatch = (main.innerText || '').match(/Good (morning|afternoon|evening)|Welcome back/);
    const numeral = main.querySelector('.hq-stat-strip__numeral');
    return {
        dataPage: document.querySelector('[data-page]')?.getAttribute('data-page') || '(none)',
        hasStartBtn,
        greet: greetMatch ? greetMatch[0] : '(no greeting found)',
        quartetNumeralFontSize: numeral ? getComputedStyle(numeral).fontSize : '(no numeral)',
        firstText: txt.replace(/\n+/g, ' | ')
    };
});
console.log(JSON.stringify(probe, null, 2));

await page.screenshot({ path: OUT + '/home-full.png', fullPage: true });
await page.screenshot({ path: OUT + '/home-fold.png', clip: { x: 0, y: 0, width: 390, height: 880 } });

await ctx.close();
await b.close();
console.log('\nCaptured home ground-truth to ' + OUT);

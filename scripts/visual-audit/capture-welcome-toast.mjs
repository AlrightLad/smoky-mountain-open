// Ground-truth capture of the one-time Clubhouse welcome toast over the home
// front-door (#289 global first-impression). Unlike the other capture scripts
// we do NOT pre-set pb_clubhouse_welcomed, so the toast actually fires. This
// toast is every member's first impression of the redesign at the production
// cutover, so we judge its real placement/styling against live content.

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = 'scratch/welcome-toast-2026-06-07';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:5173/smoky-mountain-open/?emulator=1';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const token = await admin.auth().createCustomToken('test_zach_uid_01');

const b = await chromium.launch();

async function capture(label, viewport, isMobile) {
    const ctx = await b.newContext({ viewport, deviceScaleFactor: 2, isMobile, hasTouch: isMobile });
    const page = await ctx.newPage();
    // Deliberately do NOT set pb_clubhouse_welcomed — we want the toast.
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
    // Toast appends 1500ms after auth, shows for 5000ms. Poll for it.
    let toastSeen = false;
    try {
        await page.waitForSelector('.toast.show', { timeout: 6000 });
        toastSeen = true;
    } catch { /* toast never appeared */ }
    // Small settle so the show-transition completes.
    await page.waitForTimeout(400);

    const probe = await page.evaluate(() => {
        const t = document.querySelector('.toast.show');
        if (!t) return { present: false };
        const r = t.getBoundingClientRect();
        const cs = getComputedStyle(t);
        // What sits directly under the toast's center point?
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        // Temporarily disable pointer-events bypass: elementFromPoint ignores
        // pointer-events:none elements, so it tells us what's UNDER the toast.
        const under = document.elementFromPoint(cx, cy);
        const nav = document.querySelector('.bottom-nav');
        const navRect = nav ? nav.getBoundingClientRect() : null;
        return {
            present: true,
            rect: { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) },
            viewportH: window.innerHeight,
            bottomGapToViewport: Math.round(window.innerHeight - r.bottom),
            navTop: navRect ? Math.round(navRect.top) : null,
            toastBottomVsNavTop: navRect ? Math.round(navRect.top - r.bottom) : null,
            underCenterTag: under ? (under.tagName + (under.className && typeof under.className === 'string' ? '.' + under.className.split(' ').slice(0, 2).join('.') : '')) : '(none)',
            bg: cs.backgroundColor,
            color: cs.color,
            text: (t.innerText || '').replace(/\n+/g, ' | ')
        };
    });
    console.log(`\n[${label}]`, JSON.stringify(probe, null, 2));

    await page.screenshot({ path: `${OUT}/${label}-fold.png`, clip: { x: 0, y: 0, width: viewport.width, height: Math.min(viewport.height, 900) } });
    await ctx.close();
    return { label, toastSeen, probe };
}

const mobile = await capture('mobile', { width: 390, height: 844 }, true);
const desktop = await capture('desktop', { width: 1280, height: 900 }, false);

await b.close();
console.log('\n=== SUMMARY ===');
console.log('mobile toast seen:', mobile.toastSeen, '| toastBottomVsNavTop:', mobile.probe?.toastBottomVsNavTop);
console.log('desktop toast seen:', desktop.toastSeen, '| toastBottomVsNavTop:', desktop.probe?.toastBottomVsNavTop);
console.log('Captured to ' + OUT);

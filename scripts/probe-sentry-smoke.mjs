// Phase 2 smoke test — verify Sentry.init() activates + captureException()
// triggers a network POST to ingest.us.sentry.io.
//
// We don't have SENTRY_AUTH_TOKEN configured, so we can't query Sentry's REST
// API for the captured event. Instead, we observe the OUTGOING HTTP request
// to the ingest endpoint as proof Sentry is alive + sending.
//
// Exit 0 if a POST to ingest.*.sentry.io is observed; 1 otherwise.

import { chromium } from 'playwright';
import path from 'path';

const DIST_INDEX = path.resolve('dist', 'index.html');
const url = 'file://' + DIST_INDEX.replace(/\\/g, '/');

const b = await chromium.launch();
const ctx = await b.newContext();
const page = await ctx.newPage();

const sentryRequests = [];
const consoleErrors = [];

page.on('request', req => {
    const u = req.url();
    if (/ingest\..*\.sentry\.io/i.test(u)) {
        sentryRequests.push({
            method: req.method(),
            url: u,
            postSize: req.postData()?.length || 0,
        });
    }
});

page.on('console', m => {
    if (m.type() === 'error') {
        const t = m.text();
        if (!/ERR_FILE_NOT_FOUND|CORS|Cross-Origin|Not allowed to load/i.test(t)) {
            consoleErrors.push(t);
        }
    }
});

await page.goto(url);
await page.waitForLoadState('domcontentloaded');
await page.waitForTimeout(1500);

// Verify Sentry namespace + active
const sentryStatus = await page.evaluate(() => {
    try {
        return {
            hasSentry: typeof window.Sentry !== 'undefined',
            hasInitSentry: false,
            initWarn: null,
        };
    } catch (e) { return { error: e.message }; }
});
console.log('Sentry on window:', sentryStatus);

// Trigger a contrived error via captureException through the global Sentry
const captureResult = await page.evaluate(() => {
    try {
        if (typeof window.Sentry !== 'undefined' && window.Sentry.captureException) {
            const err = new Error('PARBAUGHS Phase 2 smoke test — ' + new Date().toISOString());
            window.Sentry.captureException(err, { tags: { smoke: 'phase-2', source: 'probe-sentry-smoke.mjs' } });
            return { ok: true, message: 'captureException called' };
        }
        // Fall back: throw an uncaught error to test the global handler
        throw new Error('PARBAUGHS Phase 2 smoke test — uncaught — ' + new Date().toISOString());
    } catch (e) {
        return { ok: false, fallback: true, message: e.message };
    }
});
console.log('captureException result:', captureResult);

// Wait for the network request to fire
await page.waitForTimeout(3000);

console.log('');
console.log('=== Sentry ingest requests observed ===');
console.log('count:', sentryRequests.length);
sentryRequests.slice(0, 3).forEach(r => {
    console.log('  ' + r.method + ' ' + r.url.slice(0, 100) + (r.url.length > 100 ? '...' : '') + ' (' + r.postSize + ' bytes)');
});

if (consoleErrors.length) {
    console.log('');
    console.log('=== Console errors (excluding file:// noise) ===');
    consoleErrors.forEach(e => console.log('  ' + e));
}

await b.close();

if (sentryRequests.length > 0) {
    console.log('');
    console.log('SMOKE: PASS — Sentry sent ' + sentryRequests.length + ' event(s) to ingest endpoint');
    process.exit(0);
} else {
    console.log('');
    console.log('SMOKE: FAIL — no POST to ingest.*.sentry.io observed');
    console.log('Sentry may not be initialized; check the DSN + bundle.');
    process.exit(1);
}

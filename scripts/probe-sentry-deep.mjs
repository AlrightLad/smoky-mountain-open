// Deep Sentry verification. Captures BOTH outgoing POST and Sentry's
// response — confirms acceptance (2xx + event ID) not just "request sent".
//
// Usage: node scripts/probe-sentry-deep.mjs

import { chromium } from 'playwright';
import path from 'path';
import { readFileSync } from 'fs';

const envText = readFileSync('.env', 'utf-8');
const dsnMatch = envText.match(/^SENTRY_DSN=(.+)$/m);
const dsn = dsnMatch ? dsnMatch[1].trim() : null;
if (!dsn) { console.error('FAIL: SENTRY_DSN not in .env'); process.exit(2); }

const dsnParts = dsn.match(/^https:\/\/([a-f0-9]+)@o(\d+)\.ingest\.(us|de|eu)\.sentry\.io\/(\d+)$/);
if (!dsnParts) { console.error('FAIL: SENTRY_DSN format mismatch:', dsn); process.exit(2); }
const [, publicKey, orgId, region, projectId] = dsnParts;
console.log('DSN parsed:');
console.log('  publicKey :', publicKey);
console.log('  orgId     :', orgId);
console.log('  region    :', region);
console.log('  projectId :', projectId);
console.log('');

const DIST_INDEX = path.resolve('dist', 'index.html');
const url = 'file://' + DIST_INDEX.replace(/\\/g, '/');

const b = await chromium.launch();
const ctx = await b.newContext();
const page = await ctx.newPage();

const events = [];
page.on('request', req => {
    const u = req.url();
    if (/ingest\..*\.sentry\.io/i.test(u)) {
        events.push({ method: req.method(), url: u, postSize: req.postData()?.length || 0, response: null });
    }
});
page.on('response', async res => {
    const u = res.url();
    if (/ingest\..*\.sentry\.io/i.test(u)) {
        const status = res.status();
        let body = null;
        try { body = await res.text(); } catch {}
        const evt = events.find(e => e.url === u && e.response === null);
        if (evt) evt.response = { status, body };
    }
});

await page.goto(url);
await page.waitForLoadState('domcontentloaded');
await page.waitForTimeout(1500);

const uniqueId = 'parbaughs-deep-probe-' + Date.now();
const trigger = await page.evaluate((id) => {
    if (typeof window.Sentry !== 'undefined' && window.Sentry.captureException) {
        const err = new Error('DEEP PROBE — ' + id);
        const eventId = window.Sentry.captureException(err, { tags: { probe: 'deep' } });
        return { ok: true, eventId, via: 'Sentry.captureException' };
    }
    setTimeout(() => { throw new Error('DEEP PROBE UNCAUGHT — ' + id); }, 10);
    return { ok: true, via: 'uncaught-throw' };
}, uniqueId);
console.log('Trigger result:', trigger);
console.log('Unique probe ID:', uniqueId);
console.log('');

await page.waitForTimeout(4000);
await b.close();

console.log('=== Sentry ingest events ===');
console.log('count:', events.length);
events.forEach((e, i) => {
    console.log(`\n[${i+1}] ${e.method} ${e.url.slice(0,110)}${e.url.length>110?'...':''}`);
    console.log('    request bytes:', e.postSize);
    if (e.response) {
        console.log('    response status:', e.response.status);
        console.log('    response body:  ', (e.response.body || '').slice(0, 400));
    } else {
        console.log('    response: <not captured — likely fired after browser close>');
    }
});
console.log('');

const accepted = events.filter(e => e.response && e.response.status >= 200 && e.response.status < 300);
if (accepted.length > 0) {
    console.log('DEEP PROBE: PASS — Sentry returned 2xx for ' + accepted.length + ' event(s)');
    process.exit(0);
} else {
    console.log('DEEP PROBE: FAIL — no 2xx response captured');
    process.exit(1);
}

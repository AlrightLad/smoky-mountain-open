// Final 2 HQ ships — Onboarding + Caddy Notes functional pass.

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

const OUT = '.claude/state/audit-hq-final-2026-05-22';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const PAGES = [
    { ship: '5+15', name: 'onboarding', route: { page: 'onboarding' } },
    { ship: '5+16', name: 'caddynotes', route: { page: 'caddynotes' } },
];

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();

const consoleErrors = [];
const pageErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
page.on('pageerror', e => pageErrors.push('PAGEERROR: ' + e.message.slice(0, 200)));

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const token = await admin.auth().createCustomToken('test_zach_uid_01');

await page.goto('http://localhost:5173/?emulator=1');
await page.waitForFunction(() =>
    typeof window.firebase !== 'undefined' &&
    typeof window.auth !== 'undefined' &&
    window._pbEmulator === true, { timeout: 10000 });
await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });
await page.waitForTimeout(800);

const results = [];
for (const p of PAGES) {
    const errBefore = consoleErrors.length + pageErrors.length;
    console.log('--- Ship ' + p.ship + ' / ' + p.name + ' ---');
    try {
        await page.evaluate((r) => Router.go(r.page), p.route);
        await page.waitForTimeout(2500);
        const meta = await page.evaluate((nm) => {
            const container = document.querySelector('[data-page="' + nm + '"]') || document.getElementById('mainContent');
            const innerHTML = container?.innerHTML || '';
            return {
                page_present: !!container,
                inner_size: innerHTML.length,
                h1_present: !!container?.querySelector('h1, h2, .sh h2, .display-title'),
                buttons: container?.querySelectorAll('button, [onclick]').length || 0,
                cards: container?.querySelectorAll('.card, .stat-box, [class*="card"]').length || 0,
            };
        }, p.name);
        await page.screenshot({ path: OUT + '/' + p.ship.replace('+', '-') + '-' + p.name + '.png', fullPage: true });
        const errs = (consoleErrors.length + pageErrors.length) - errBefore;
        console.log('  ' + (errs === 0 ? '✓' : '⚠ ' + errs + ' errors') +
                    ' | inner=' + meta.inner_size + ' | h1=' + meta.h1_present + ' | btns=' + meta.buttons + ' | cards=' + meta.cards);
        results.push({ ship: p.ship, name: p.name, ...meta, errors_during_render: errs });
    } catch (e) {
        console.log('  ERROR:', e.message.slice(0, 200));
        results.push({ ship: p.ship, name: p.name, error: e.message.slice(0, 200) });
    }
}

await b.close();

writeFileSync(OUT + '/report.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    pages: results,
    all_console_errors: consoleErrors,
    all_page_errors: pageErrors,
}, null, 2));
console.log('\nReport: ' + OUT + '/report.json');

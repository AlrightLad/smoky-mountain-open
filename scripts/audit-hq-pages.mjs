// Multi-page HQ audit. Signs in as testZach + iterates through pages,
// capturing screenshot + DOM metrics + console errors. Functional pass
// per Ship 5+9 through 5+14 per HQ completion sequence memory.

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

const OUT = '.claude/state/audit-hq-pages-2026-05-22';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const PAGES = [
    { ship: '5+9',  name: 'bounties',   route: { page: 'bounties' } },
    { ship: '5+10', name: 'wagers',     route: { page: 'wagers' } },
    { ship: '5+11', name: 'scramble',   route: { page: 'scramble' } },
    { ship: '5+12', name: 'trips',      route: { page: 'trips' } },
    { ship: '5+13', name: 'trophyroom', route: { page: 'trophyroom' } },
    { ship: '5+14', name: 'range',      route: { page: 'range' } },
];

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();

const consoleErrors = [];
const pageErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push({ts: new Date().toISOString(), text: m.text().slice(0, 200)}); });
page.on('pageerror', e => pageErrors.push({ts: new Date().toISOString(), text: 'PAGEERROR: ' + e.message.slice(0, 200)}));

// Sign in as testZach
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';
const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });
const token = await admin.auth().createCustomToken('test_zach_uid_01');

console.log('--- Signing in ---');
await page.goto('http://localhost:5173/?emulator=1');
await page.waitForFunction(() =>
    typeof window.firebase !== 'undefined' &&
    typeof window.auth !== 'undefined' &&
    window._pbEmulator === true, { timeout: 10000 });
await page.evaluate(async (tok) => { await window.auth.signInWithCustomToken(tok); }, token);
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });
await page.waitForTimeout(800);
console.log('  Signed in.\n');

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
                h1_present: !!container?.querySelector('h1, h2, .sh h2'),
                buttons: container?.querySelectorAll('button, [onclick]').length || 0,
                cards: container?.querySelectorAll('.card, .stat-box, [class*="card"]').length || 0,
                empty_state: /no \w+ yet|empty|nothing here|coming soon/i.test(innerHTML) || false,
            };
        }, p.name);
        await page.screenshot({ path: OUT + '/' + p.ship.replace('+', '-') + '-' + p.name + '.png', fullPage: true });
        const errsForThisPage = (consoleErrors.length + pageErrors.length) - errBefore;
        console.log('  ' + (errsForThisPage === 0 ? '✓' : '⚠ ' + errsForThisPage + ' errors') +
                    ' | innerHTML=' + meta.inner_size + ' bytes' +
                    ' | h1=' + meta.h1_present +
                    ' | buttons=' + meta.buttons +
                    ' | cards=' + meta.cards +
                    ' | empty=' + meta.empty_state);
        results.push({ ship: p.ship, name: p.name, ...meta, errors_during_render: errsForThisPage });
    } catch (e) {
        console.log('  ERROR:', e.message.slice(0, 200));
        results.push({ ship: p.ship, name: p.name, error: e.message.slice(0, 200) });
    }
    console.log('');
}

await b.close();

console.log('=== Summary ===');
results.forEach(r => {
    const status = r.error ? 'ERROR' : (r.errors_during_render === 0 && r.h1_present ? '✓' : 'CHECK');
    console.log('  ' + status + ' Ship ' + r.ship + ' ' + r.name);
});

writeFileSync(OUT + '/report.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    user: 'testZach',
    pages: results,
    all_console_errors: consoleErrors,
    all_page_errors: pageErrors,
}, null, 2));
console.log('\nReport: ' + OUT + '/report.json');

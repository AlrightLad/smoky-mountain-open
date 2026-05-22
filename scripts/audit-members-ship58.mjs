// Ship 5+8 — Members page audit. Loads the page via emulator-mode + sign-in,
// then screenshots + dumps DOM state for member-list and member-detail modes.

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

const OUT = '.claude/state/audit-ship-5-8';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();

const consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message.slice(0, 200)));

// Use the global setup's seeded data — sign in as testZach
console.log('--- Signing in as testZach via custom token ---');
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
await page.waitForFunction(() => {
    const main = document.getElementById('mainApp');
    return main && !main.classList.contains('hidden');
}, { timeout: 15000 });
await page.waitForTimeout(800);
console.log('  Signed in.');

// --- Mode 1: Members list (no params) ---
console.log('\n--- /members (list mode) ---');
await page.evaluate(() => Router.go('members'));
await page.waitForTimeout(3000);
await page.screenshot({ path: OUT + '/01-list.png', fullPage: true });
const listMeta = await page.evaluate(() => {
    const cards = document.querySelectorAll('.member-card, [class*="member"]').length;
    const search = !!document.getElementById('memberSearch');
    const sortBtns = document.querySelectorAll('[onclick*="sortMemberList"]').length;
    const inviteCta = !!document.querySelector('[onclick*="renderAddMemberForm"], [onclick*="promptAddMember"]');
    return { cards, search, sortBtns, inviteCta };
});
console.log('  Cards:', listMeta.cards, '| Search:', listMeta.search, '| Sort buttons:', listMeta.sortBtns, '| Invite CTA:', listMeta.inviteCta);

// --- Mode 2: Member detail (testZach) ---
console.log('\n--- /members?id=test_zach_uid_01 (detail mode) ---');
await page.evaluate(() => Router.go('members', { id: 'test_zach_uid_01' }));
await page.waitForTimeout(3000);
await page.screenshot({ path: OUT + '/02-detail.png', fullPage: true });
const detailMeta = await page.evaluate(() => {
    return {
        heroPresent: !!document.querySelector('.member-hero, .profile-hero, [class*="hero"]'),
        xpBar: !!document.querySelector('[class*="xp"], [data-xp]'),
        parcoinWallet: !!document.querySelector('[class*="parcoin"], [class*="ParCoin"], [data-parcoin]'),
        statGrid: document.querySelectorAll('.stat-box, .stat-val').length,
        tabsPresent: document.querySelectorAll('.tab, [role="tab"], [class*="tab-"]').length,
        roundCount: document.querySelector('[data-stat="round-count"]')?.getAttribute('data-count') || 'missing',
    };
});
console.log('  Hero:', detailMeta.heroPresent, '| XP bar:', detailMeta.xpBar, '| ParCoin:', detailMeta.parcoinWallet);
console.log('  Stat boxes:', detailMeta.statGrid, '| Tab count:', detailMeta.tabsPresent, '| Round count:', detailMeta.roundCount);

// --- Mode 3: Member edit ---
console.log('\n--- /members?edit=test_zach_uid_01 (edit mode) ---');
await page.evaluate(() => Router.go('members', { edit: 'test_zach_uid_01' }));
await page.waitForTimeout(3000);
await page.screenshot({ path: OUT + '/03-edit.png', fullPage: true });
const editMeta = await page.evaluate(() => {
    return {
        nameInput: !!document.getElementById('memberName') || !!document.querySelector('[name="name"]'),
        saveBtn: !!document.querySelector('[onclick*="saveMemberEdit"]'),
        formCount: document.querySelectorAll('input,select,textarea').length,
    };
});
console.log('  Name input:', editMeta.nameInput, '| Save btn:', editMeta.saveBtn, '| Form fields:', editMeta.formCount);

// --- Console-error catcher ---
console.log('\n--- Console errors observed ---');
if (consoleErrors.length === 0) console.log('  (none) ✓');
else consoleErrors.forEach(e => console.log('  •', e));

await b.close();

const report = {
    audit: 'Ship 5+8 Members audit',
    timestamp: new Date().toISOString(),
    list: listMeta,
    detail: detailMeta,
    edit: editMeta,
    consoleErrors,
};
writeFileSync(OUT + '/audit-report.json', JSON.stringify(report, null, 2));
console.log('\nReport saved to ' + OUT + '/audit-report.json');
console.log('Screenshots: ' + OUT + '/0{1,2,3}-{list,detail,edit}.png');

process.exit(consoleErrors.length > 0 ? 1 : 0);

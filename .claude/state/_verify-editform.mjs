import { chromium } from 'playwright';
import { existsSync, readFileSync } from 'fs';
const SA = 'scripts/.secrets/prod-service-account.json';
const admin = (await import('firebase-admin')).default;
const sa = JSON.parse(readFileSync(SA, 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id });
const UID = '1fwuewlis6Yvrtvlk7m0I3rRYwQ2';
const token = await admin.auth().createCustomToken(UID);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 430, height: 1100 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto('https://parbaughs-staging.web.app/?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => typeof window.auth !== 'undefined', { timeout: 15000 });
await p.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
await p.waitForFunction(() => { var m = document.getElementById('mainApp'); return m && !m.classList.contains('hidden'); }, { timeout: 20000 });
await p.evaluate(() => { try { window.pbTeeIntro && window.pbTeeIntro.skip && window.pbTeeIntro.skip(); } catch (e) {} });
await p.waitForTimeout(2500);
await p.evaluate((u) => window.Router && window.Router.go && window.Router.go('members', { edit: u }), UID);
await p.waitForTimeout(2500);
const out = await p.evaluate(() => ({
  hasUsername: !!document.getElementById('edit-username'),
  hasName: !!document.getElementById('edit-name'),
  hasNick: !!document.getElementById('edit-nick'),
  hasDisplayPref: !!document.getElementById('edit-displayPref'),
  hasChangePhoto: !!Array.from(document.querySelectorAll('button')).find(x => /change photo/i.test(x.textContent)),
}));
console.log(JSON.stringify(out));
await p.screenshot({ path: '.claude/state/allpages/profile-edit.png' });
await b.close();

// Verify the #76 struck-metal ring renders: equip border_gold on the test member
// (staging Firestore via SA), then authed-capture the profile + confirm the
// ring-gold-struck class is on the avatar wrapper. Staging only, test account.
import { chromium } from 'playwright';
import { existsSync, readFileSync } from 'fs';
const SA = 'scripts/.secrets/prod-service-account.json';
if (!existsSync(SA)) { console.error('no staging SA'); process.exit(3); }
const admin = (await import('firebase-admin')).default;
const sa = JSON.parse(readFileSync(SA, 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id });
const UID = '1fwuewlis6Yvrtvlk7m0I3rRYwQ2';
// equip the struck gold ring on the test member
await admin.firestore().collection('members').doc(UID).set({ equippedCosmetics: { border: 'border_gold' } }, { merge: true });
console.log('equipped border_gold on test member');
const token = await admin.auth().createCustomToken(UID);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto('https://parbaughs-staging.web.app/?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => typeof window.auth !== 'undefined', { timeout: 15000 });
await p.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
await p.waitForFunction(() => { var m = document.getElementById('mainApp'); return m && !m.classList.contains('hidden'); }, { timeout: 20000 });
await p.evaluate(() => { try { window.pbTeeIntro && window.pbTeeIntro.skip && window.pbTeeIntro.skip(); } catch (e) {} });
await p.waitForTimeout(2500);
await p.evaluate(() => window.Router && window.Router.go && window.Router.go('profile'));
await p.waitForTimeout(3500);
const out = await p.evaluate(() => ({
  struckOnPage: document.querySelectorAll('.ring-gold-struck').length,
  avatarHasStruck: !!document.querySelector('.pf-av.ring-gold-struck, .ring-gold-struck'),
}));
console.log(JSON.stringify(out));
await p.screenshot({ path: '.claude/state/allpages/profile-struck-ring.png' });
await b.close();

// One-off: what does the chat feed actually render once the Firestore listener
// settles (vs the loading skeleton the fast capture caught)? Authed, 6s wait.
import { chromium } from 'playwright';
import { existsSync, readFileSync, mkdirSync } from 'fs';
const SA_PATH = 'scripts/.secrets/prod-service-account.json';
if (!existsSync(SA_PATH)) { console.error('no prod SA'); process.exit(3); }
const admin = (await import('firebase-admin')).default;
const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || 'parbaughs' });
const token = await admin.auth().createCustomToken('1fwuewlis6Yvrtvlk7m0I3rRYwQ2');
mkdirSync('.claude/state/allpages', { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 1.5 });
const page = await ctx.newPage();
await page.goto('https://parbaughs-staging.web.app/?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.auth !== 'undefined', { timeout: 15000 });
await page.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
await page.waitForFunction(() => { var m = document.getElementById('mainApp'); return m && !m.classList.contains('hidden'); }, { timeout: 20000 });
await page.evaluate(() => { try { window.pbTeeIntro && window.pbTeeIntro.skip && window.pbTeeIntro.skip(); } catch (e) {} });
await page.waitForTimeout(2000);
await page.evaluate(() => window.Router && window.Router.go && window.Router.go('chat'));
await page.waitForTimeout(6500); // let the chat onSnapshot listener resolve
const out = await page.evaluate(() => {
  const feed = document.getElementById('chatFeed');
  return {
    skeletonStill: !!(feed && feed.querySelector('.skeleton, [class*="skeleton"]')),
    emptyCard: !!(feed && feed.querySelector('.chat-empty-card')),
    messageCount: feed ? feed.querySelectorAll('.chat-msg, [class*="chat-msg"], [class*="msg-"]').length : -1,
    feedText: feed ? feed.textContent.trim().slice(0, 160) : 'NO FEED EL',
    feltBand: !!document.querySelector('.chat-tt-band'),
  };
});
console.log(JSON.stringify(out, null, 2));
await page.screenshot({ path: '.claude/state/allpages/chat.png' });
await b.close();

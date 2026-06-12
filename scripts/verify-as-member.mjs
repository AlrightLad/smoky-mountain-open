// Verify the app AS a real Parbaughs member (closes the wrong-league
// verification gap — see task-queue/founder/prod-sa-verification.md). Mints a
// READ-ONLY custom token for the given prod uid via the prod service-account
// key, loads the app as that member (staging URL — same prod-auth bundle, no
// cache), dismisses the intro, navigates to a route, and reports/captures what
// actually renders. This is how we verify YOUR league's surfaces, not the
// smoke-test account's.
//
//   node scripts/verify-as-member.mjs <uid> [route] [label]
//   e.g. node scripts/verify-as-member.mjs 1fwuewlis6Yvrtvlk7m0I3rRYwQ2 home fb-home
//
// Requires scripts/.secrets/prod-service-account.json (git-ignored). If absent,
// prints the exact setup step and exits 3.
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';

const UID = process.argv[2];
const ROUTE = process.argv[3] || 'home';
const LABEL = process.argv[4] || ('verify-' + (UID || 'x').slice(0, 6));
const URL = process.env.VERIFY_URL || 'https://parbaughs-staging.web.app/';
const SA_PATH = 'scripts/.secrets/prod-service-account.json';

if (!UID) { console.error('Usage: node scripts/verify-as-member.mjs <uid> [route] [label]'); process.exit(2); }
if (!existsSync(SA_PATH)) {
  console.error('MISSING ' + SA_PATH + '\nDownload it: Firebase console → project parbaughs → Project settings → Service accounts → Generate new private key, then save as ' + SA_PATH + '\n(see .claude/state/task-queue/founder/prod-sa-verification.md)');
  process.exit(3);
}

const admin = (await import('firebase-admin')).default;
const sa = JSON.parse((await import('fs')).readFileSync(SA_PATH, 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || 'parbaughs' });
const token = await admin.auth().createCustomToken(UID);

const OUT = '.claude/state/verify-' + LABEL;
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, serviceWorkers: 'block', deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.addInitScript(() => { try { sessionStorage.setItem('pb_intro_seen', '1'); sessionStorage.setItem('pb_wt_routed', '1'); } catch (e) {} });
await page.goto(URL + '?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await page.waitForFunction(() => typeof window.auth !== 'undefined', { timeout: 12000 });
await page.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
await page.waitForFunction(() => { var m = document.getElementById('mainApp'); return m && !m.classList.contains('hidden'); }, { timeout: 20000 });
await page.evaluate(() => { try { window.pbTeeIntro && window.pbTeeIntro.skip && window.pbTeeIntro.skip(); } catch (e) {} });
await page.waitForTimeout(5000); // let league-scoped listeners hydrate
await page.evaluate((r) => { if (window.Router && window.Router.go) window.Router.go(r); }, ROUTE);
await page.waitForTimeout(3000);
await page.screenshot({ path: `${OUT}/${LABEL}-${ROUTE}.png`, fullPage: true });

const facts = await page.evaluate((uid) => {
  var o = {};
  try {
    o.activeLeague = (typeof getActiveLeague === 'function') ? getActiveLeague() : 'n/a';
    o.signedInUid = (window.currentUser && window.currentUser.uid) || 'n/a';
    var all = (window.PB && PB.getRounds) ? PB.getRounds() : [];
    o.totalRounds = all.length;
    o.roundsForUid = (window.PB && PB.getPlayerRounds) ? PB.getPlayerRounds(uid).length : 'n/a';
  } catch (e) { o.err = String(e); }
  return o;
}, UID);
console.log('VERIFY ' + LABEL + ' (uid=' + UID.slice(0, 8) + ', route=' + ROUTE + '):');
console.log(JSON.stringify(facts, null, 1));
console.log('shot → ' + OUT);
await b.close();

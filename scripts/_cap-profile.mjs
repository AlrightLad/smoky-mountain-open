// Ad-hoc: capture a member's OWN profile detail as that member (v8.25.74
// profile lift V1). verify-as-member.mjs only does Router.go(routeString) which
// can't pass the {id} param the member-detail route needs, and the "?" in a
// query route breaks the Windows filename — so this signs in as the uid and
// calls Router.go('members',{id:uid}) directly, then screenshots to a safe name.
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';

const UID = process.argv[2] || '1fwuewlis6Yvrtvlk7m0I3rRYwQ2';
const OUT = '.claude/state/verify-profile74';
const URL = 'https://parbaughs-staging.web.app/';
const SA_PATH = 'scripts/.secrets/prod-service-account.json';
if (!existsSync(SA_PATH)) { console.error('MISSING ' + SA_PATH); process.exit(3); }
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const admin = (await import('firebase-admin')).default;
const sa = JSON.parse((await import('fs')).readFileSync(SA_PATH, 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || 'parbaughs' });
const token = await admin.auth().createCustomToken(UID);

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, serviceWorkers: 'block', deviceScaleFactor: 2, reducedMotion: 'no-preference' });
const page = await ctx.newPage();
await page.addInitScript(() => { try { sessionStorage.setItem('pb_intro_seen', '1'); sessionStorage.setItem('pb_wt_routed', '1'); } catch (e) {} });
await page.goto(URL + '?nocache=' + Date.now(), { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await page.waitForFunction(() => typeof window.auth !== 'undefined', { timeout: 12000 });
await page.evaluate(async (t) => { await window.auth.signInWithCustomToken(t); }, token);
await page.waitForFunction(() => { var m = document.getElementById('mainApp'); return m && !m.classList.contains('hidden'); }, { timeout: 20000 });
await page.evaluate(() => { try { window.pbTeeIntro && window.pbTeeIntro.skip && window.pbTeeIntro.skip(); } catch (e) {} });
await page.waitForTimeout(5000); // league listeners hydrate
await page.evaluate((uid) => { if (window.Router && window.Router.go) window.Router.go('members', { id: uid }); }, UID);
await page.waitForTimeout(1200); // mid-reveal frame (cascade runs ~0-505ms; grab settled)
await page.screenshot({ path: `${OUT}/profile-own.png`, fullPage: true });
// element-level grab of the hero region for readable detail
try { const m = await page.$('.pf-page'); if (m) await m.screenshot({ path: `${OUT}/profile-hero.png` }); } catch (e) {}

const facts = await page.evaluate((uid) => {
  var o = {};
  try {
    o.signedInUid = (window.currentUser && window.currentUser.uid) || 'n/a';
    o.hasMasthead = !!document.querySelector('.pf-masthead');
    o.xpToken = !!document.querySelector('.pf-xp');
    o.walletToken = !!document.querySelector('.pf-wallet__main');
    o.statBoxes = document.querySelectorAll('.stats-grid .stat-box').length;
    o.statGridChildren = document.querySelector('.stats-grid') ? document.querySelector('.stats-grid').children.length : 0;
    o.revealTargets = document.querySelectorAll('[data-page="members"] .pf-reveal').length;
    var fill = Array.prototype.slice.call(document.querySelectorAll('[data-page="members"] div')).map(function(d){return d.getAttribute('style')||'';}).filter(function(s){return /linear-gradient\([^)]*var\(--gold2\)/.test(s) && /width\s*:\s*\d/.test(s);});
    o.xpFillFound = fill.length;
    o.balText = (document.querySelector('.pf-wallet__bal')||{}).textContent || 'n/a';
  } catch (e) { o.err = String(e); }
  return o;
}, UID);
console.log('PROFILE74 (uid=' + UID.slice(0, 8) + '):');
console.log(JSON.stringify(facts, null, 1));
console.log('shot → ' + OUT);
await b.close();

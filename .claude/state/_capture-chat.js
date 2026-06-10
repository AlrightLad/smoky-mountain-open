// One-off capture: Clubhouse Chat as a signed-in member, mobile + desktop.
// Reuses the smoke harness auth (creds from gitignored .env.local).
const fs = require('fs');
const path = require('path');

(function loadDotEnvLocal() {
  var p = path.resolve(__dirname, '..', '..', '.env.local');
  if (!fs.existsSync(p)) return;
  fs.readFileSync(p, 'utf8').split(/\r?\n/).forEach(function(line) {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    var eq = line.indexOf('=');
    if (eq < 1) return;
    var key = line.substring(0, eq).trim();
    var val = line.substring(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  });
})();

const { chromium } = require('playwright');
const auth = require('../../tests/smoke/helpers/auth.js');
const DEV_URL = 'http://localhost:5173/smoky-mountain-open/';
const OUT = path.resolve(__dirname, 'main-flows-v2');

(async () => {
  const PAGES = ['feed', 'standings', 'richlist', 'merch', 'drills'];
  const browser = await chromium.launch();
  for (const [label, vp] of [['mobile', { width: 390, height: 844 }], ['desktop', { width: 1440, height: 900 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await auth.loginReal(page, DEV_URL);
    if (label === 'mobile') {
      const url = await page.evaluate(async () => {
        return await pbCreateShareLink({
          type: 'leaderboard',
          title: 'Summer 2026 — The board so far',
          meta: 'Jun 1 to Aug 31 · shared in a smoke test',
          rows: [
            { rank: 1, name: 'smoketest', value: '355 pts' },
            { rank: 2, name: 'Test Member', value: '120 pts' }
          ]
        });
      });
      console.log('SHARE-URL:', url);
      // open it as a logged-out guest against the LOCAL share.html + the id
      const guest = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
      const gp = await guest.newPage();
      const localUrl = DEV_URL.replace(/\/$/, '') + '/share.html?id=' + url.split('id=')[1];
      await gp.goto(localUrl);
      await gp.waitForTimeout(2500);
      await gp.screenshot({ path: path.join(OUT, 'share-page-guest.png') });
      console.log('captured guest share page');
      await guest.close();
    }
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });

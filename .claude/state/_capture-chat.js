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
  const browser = await chromium.launch();
  for (const [label, vp] of [['mobile', { width: 390, height: 844 }], ['desktop', { width: 1440, height: 900 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await auth.loginReal(page, DEV_URL);
    await page.evaluate(() => Router.go('chat'));
    await page.waitForTimeout(2500);
    if (label === 'mobile') {
      // Seed real messages through the app's own send path (real doc shape)
      for (const msg of [
        'Anyone playing Saturday? Briarwood at 8 has two open slots',
        'I am in. Bringing the new driver — fair warning to the group',
        'fair warning to the trees you mean',
        'Saw the forecast, 74 and sunny. No excuses this week'
      ]) {
        await page.evaluate((m) => { document.getElementById('chatInput').value = m; sendChat(); }, msg);
        await page.waitForTimeout(900);
      }
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: path.join(OUT, `chat-baseline-${label}.png`) });
    await ctx.close();
    console.log('captured', label);
  }
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });

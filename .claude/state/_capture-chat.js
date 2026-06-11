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
      const r = await page.evaluate(() => {
        const fake = { id: 'x', username: 'Brayden', equippedCosmetics: { nameplate: 'pc05_locker_brass', teemarker: 'pc18_rubber_duck' } };
        const html = renderUsername(fake, 'font-size:14px;font-weight:700;', false);
        const host = document.createElement('div');
        host.id = 'shipb-host';
        host.style.cssText = 'position:fixed;top:80px;left:16px;z-index:9999;background:var(--bg);padding:14px;border:1px solid var(--border);border-radius:10px;display:flex;flex-direction:column;gap:10px';
        const fake2 = { id: 'y', username: 'Nick', equippedCosmetics: { nameplate: 'pc06_yardage_book', teemarker: 'pc17_brass_acorn' } };
        const fake3 = { id: 'z', username: 'KAYVAN', equippedCosmetics: { nameplate: 'pc07_leaderboard_sunday', teemarker: 'pc20_parbaugh_marker' } };
        host.innerHTML = html + '<div>' + renderUsername(fake2, 'font-size:14px;font-weight:700;', false) + '</div><div>' + renderUsername(fake3, 'font-size:14px;font-weight:700;', false) + '</div>';
        document.body.appendChild(host);
        return { hasPlate: html.indexOf('plate-locker-brass') !== -1, hasMarker: html.indexOf('pb-teemarker') !== -1 };
      });
      console.log('VERIFY:', JSON.stringify(r));
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(OUT, 'shipB-nameplate.png') });
      console.log('captured shipB');
    }
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });

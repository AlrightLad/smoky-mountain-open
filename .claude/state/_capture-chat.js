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
      const r = await page.evaluate(async () => {
        const out = {};
        out.helper = typeof pbAutoCreateCourse === 'function';
        // no-key path: API requires key (pre-deploy) -> null -> caller stubs
        const apiResult = await pbAutoCreateCourse('Zzz Fake Course Xyz', 'PA');
        out.apiNull = apiResult === null;
        return out;
      });
      console.log('VERIFY:', JSON.stringify(r));
    }
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });

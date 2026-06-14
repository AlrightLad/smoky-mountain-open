import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const OUT = '.claude/state/cap-authlogo';
mkdirSync(OUT, { recursive: true });
const URL = 'https://parbaughs-staging.web.app/';
const themes = ['clubhouse', 'linen_draft', 'azalea', 'bourbon_room'];
const b = await chromium.launch();
for (const t of themes) {
  const ctx = await b.newContext({ viewport: { width: 414, height: 896 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((th) => { try { localStorage.setItem('pb_theme', th); localStorage.setItem('pb_intro_seen','1'); } catch (e) {} }, t);
  const pg = await ctx.newPage();
  await pg.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await pg.waitForTimeout(800);
  // Dismiss the cold-open tee-intro if present (tap to start), then settle on auth form.
  for (let i = 0; i < 3; i++) {
    await pg.mouse.click(207, 448).catch(() => {});
    await pg.waitForTimeout(700);
  }
  // Force the auth screen visible (in case intro overlay lingers) and hide intro.
  await pg.evaluate(() => {
    var intro = document.getElementById('pbIntro'); if (intro) intro.style.display = 'none';
    var a = document.getElementById('authScreen'); if (a) { a.classList.remove('hidden'); a.style.display = 'flex'; }
  }).catch(() => {});
  await pg.waitForTimeout(600);
  await pg.screenshot({ path: `${OUT}/authform-${t}.png` });
  await ctx.close();
  console.log('captured', t);
}
await b.close();
console.log('done →', OUT);

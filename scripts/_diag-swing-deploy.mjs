// Decisive test: is the staging swing a STALE cached bundle or the current code?
// Block the service worker (so assets come fresh from the server, not SW cache),
// cache-bust the URL, then read the ACTUAL arm/ball geometry at t=0. Current
// code's KEY[0] is address: arm points DOWN (hands below shoulder), ball on the
// tee (cy~376). If the render shows hands ABOVE the shoulder / ball in flight,
// the deployed/served bundle is stale (not the current code).
import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 430, height: 760 }, serviceWorkers: 'block', bypassCSP: true });
const page = await ctx.newPage();
await page.goto('https://parbaughs-staging.web.app/?nocache=' + (process.argv[2] || 'x1'), { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
const info = await page.evaluate(() => {
  if (typeof window.pbTeeIntro === 'undefined') return { err: 'no pbTeeIntro' };
  window.pbTeeIntro.show();
  window.pbTeeIntro._applyAt(0);
  function attr(id, a) { var e = document.getElementById(id); return e ? e.getAttribute(a) : null; }
  return {
    armD: attr('pbi-arm', 'd'),
    handsCy: attr('pbi-hands', 'cy'),
    headCy: attr('pbi-head', 'cy'),
    ballCx: attr('pbi-ball', 'cx'),
    ballCy: attr('pbi-ball', 'cy'),
    clubX2: attr('pbi-club', 'x2'),
    clubY2: attr('pbi-club', 'y2'),
    // a marker: does the bundle's intro source contain the current address comment?
    introMarker: (function(){ try { return String(window.pbTeeIntro.maybeShow).length; } catch(e){ return 'n/a'; } })()
  };
});
console.log(JSON.stringify(info, null, 1));
// At address: hands cy should be BELOW head cy (hands hang down); ball cy ~376.
if (info.handsCy && info.headCy) {
  console.log('\nhands below head (address-like)?', (+info.handsCy > +info.headCy) ? 'YES → current code address' : 'NO → club is UP → STALE bundle or bug');
}
await b.close();

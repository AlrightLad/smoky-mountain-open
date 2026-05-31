// BL-001 regression — in-round par/yardage edit on the live scoring screen.
//
// Why this exists (the gap it closes): a course whose stored pars/yardages
// don't match the tees actually played left members no way to correct the
// current hole mid-round. The fix (src/pages/playnow-scoring.js) adds an
// "Adjust" expander that writes to the round-scoped liveState.holes copy
// (deep-copied at round start, so the shared course master is never touched)
// and re-renders so every par-derived value recomputes: the running +/-,
// the par-3 FIR gating, and finishLiveRound's holePars -> differential.
//
// The flow is driven through the same global handlers the inline onclick
// attributes call (toggleHoleEdit / adjustHolePar / setHoleYardage) against
// an injected, private (no Firestore writes) active round. Runs once on the
// desktop chromium project — this is logic/DOM behavior, not viewport-band
// behavior, so there's nothing extra to learn from the mobile projects.

const { test, expect } = require('@playwright/test');
const { loginAs } = require('../helpers/auth.js');

// Injected in the page: a private active round, 18 holes all par 4 / 388 yd,
// three opening bogeys (5,5,5) so the running total reads "+3 thru 3" before
// any edit. visibility:"private" makes saveLiveState() skip the Firestore
// write, keeping the edit handlers purely client-side.
function seedActiveRound() {
  liveState.active = true;
  liveState.visibility = 'private';
  liveState.player = (typeof currentUser !== 'undefined' && currentUser && currentUser.uid) || 'tester';
  liveState.course = 'Test Links';
  liveState.format = 'stroke';
  liveState.holesMode = '18';
  liveState.currentHole = 0;
  liveState.rating = 72;
  liveState.slope = 113;
  liveState.par = 72;
  liveState.holes = [];
  for (var i = 0; i < 18; i++) liveState.holes[i] = { par: 4, yardage: 388 };
  liveState.scores = ['5', '5', '5', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
  liveState.fir = new Array(18).fill(false);
  liveState.gir = new Array(18).fill(false);
  liveState.putts = new Array(18).fill('');
  liveState.bunker = new Array(18).fill(null);
  liveState.sand = new Array(18).fill(null);
  liveState.upDown = new Array(18).fill(null);
  liveState.miss = new Array(18).fill(null);
  liveState.penalty = new Array(18).fill(0);
  window.holeEditOpen = {};
}

async function openEditorOnHole0(page) {
  await loginAs(page, 'testZach');
  await page.evaluate(seedActiveRound);
  // toggleHoleEdit flips holeEditOpen[0] then Router.go("playnow"); with
  // liveState.active the route renders renderLiveScoring() into the page.
  await page.evaluate(() => toggleHoleEdit(0));
  await page.waitForSelector('#pn-holepar-val-0', { timeout: 5000 });
}

test.describe('BL-001 — in-round par/yardage edit (live scoring)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium',
      'Logic/DOM behavior — runs once on the desktop chromium project');
  });

  test('editor shows the current hole par and yardage with the round-scoped note', async ({ page }) => {
    await openEditorOnHole0(page);

    expect((await page.textContent('#pn-holepar-val-0')).trim()).toBe('4');
    expect(await page.inputValue('#pn-holeyards-0')).toBe('388');

    const panel = await page.locator('#pn-holeedit-0').textContent();
    expect(panel).toContain('Applies to this round only');
  });

  test('increasing par recomputes the running total and par display', async ({ page }) => {
    await openEditorOnHole0(page);

    // 5,5,5 over par 4,4,4 => +3 through 3 holes before any edit.
    // The masthead renders the to-par and "thru N" as two separate block
    // elements (.ls-mast__score-num + .ls-mast__score-lbl), so assert on each
    // rather than the combined textContent (which has no joining space).
    expect((await page.locator('.ls-mast__score-num').textContent()).trim()).toBe('+3');
    expect((await page.locator('.ls-mast__score-lbl').textContent()).trim()).toBe('thru 3');

    await page.evaluate(() => adjustHolePar(0, 1)); // 4 -> 5
    await page.waitForTimeout(300);

    // 15 strokes over par 5,4,4 = 13 => +2 through 3.
    expect((await page.locator('.ls-mast__score-num').textContent()).trim()).toBe('+2');
    expect((await page.locator('.ls-mast__score-lbl').textContent()).trim()).toBe('thru 3');
    expect((await page.textContent('#pn-holepar-val-0')).trim()).toBe('5');
  });

  test('par clamps to the 3..6 range with steppers disabling at the bounds', async ({ page }) => {
    await openEditorOnHole0(page);

    await page.evaluate(() => { adjustHolePar(0, 1); }); // 5
    await page.waitForTimeout(150);
    await page.evaluate(() => { adjustHolePar(0, 1); }); // 6
    await page.waitForTimeout(150);
    await page.evaluate(() => { adjustHolePar(0, 1); }); // clamp at 6
    await page.waitForTimeout(150);

    expect((await page.textContent('#pn-holepar-val-0')).trim()).toBe('6');
    expect(await page.locator('#pn-holeedit-0 button[aria-label="Increase par"]').isDisabled()).toBe(true);

    for (let i = 0; i < 4; i++) { // 6 -> 3, then clamp
      await page.evaluate(() => adjustHolePar(0, -1));
      await page.waitForTimeout(120);
    }

    expect((await page.textContent('#pn-holepar-val-0')).trim()).toBe('3');
    expect(await page.locator('#pn-holeedit-0 button[aria-label="Decrease par"]').isDisabled()).toBe(true);
  });

  test('yardage commits to the round and drops the legacy .yards field', async ({ page }) => {
    await openEditorOnHole0(page);

    await page.evaluate(() => setHoleYardage(0, 425));
    await page.waitForTimeout(300);

    expect(await page.inputValue('#pn-holeyards-0')).toBe('425');
    const hole = await page.evaluate(() => ({
      yardage: liveState.holes[0].yardage,
      hasLegacyYards: Object.prototype.hasOwnProperty.call(liveState.holes[0], 'yards'),
    }));
    expect(hole.yardage).toBe(425);
    expect(hole.hasLegacyYards).toBe(false);
  });

  test('finish carries edited pars and yards as dense 18-length arrays', async ({ page }) => {
    await openEditorOnHole0(page);

    await page.evaluate(() => adjustHolePar(0, 1)); // par -> 5
    await page.waitForTimeout(150);
    await page.evaluate(() => setHoleYardage(0, 425));
    await page.waitForTimeout(150);

    // Capture the exact payload finishLiveRound hands to PB.addRound, halting
    // before its Firestore/parcoin/navigation side-effects fire.
    const captured = await page.evaluate(() => {
      for (var i = 0; i < 9; i++) liveState.scores[i] = '5'; // need >=9 to finish
      var cap = null;
      var orig = PB.addRound;
      PB.addRound = function (d) {
        cap = { holePars: d.holePars, holeYards: d.holeYards, holesPlayed: d.holesPlayed };
        throw new Error('__halt_after_capture__');
      };
      try { finishLiveRound(); } catch (e) { /* sentinel halt */ }
      PB.addRound = orig;
      return cap;
    });

    expect(captured).not.toBeNull();
    expect(captured.holePars.length).toBe(18);
    expect(captured.holeYards.length).toBe(18);
    expect(captured.holePars[0]).toBe(5);
    expect(captured.holeYards[0]).toBe(425);
    expect(captured.holesPlayed).toBe(9);
  });
});

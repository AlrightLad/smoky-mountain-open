// Scenario coverage — one test per scenario user, each exercising a
// specific data shape that has historically caused display bugs.

const { test, expect } = require('@playwright/test');
const { loginAs } = require('../helpers/auth.js');
const { readRoundCount } = require('../helpers/assertions.js');
const { goMyProfile } = require('../helpers/navigation.js');

test.describe('Scenario coverage — edge-case round shapes', () => {

  test('scenarioOnlyNineHole: 3 rounds, handicap non-numeric (9h excluded from WHS)', async ({ page }) => {
    await loginAs(page, 'scenarioOnlyNineHole');
    expect(await readRoundCount(page)).toBe(3);
    // Handicap cannot be calculated from 9-hole rounds only.
    const hcap = await page.evaluate(() => {
      return PB.calcHandicap(PB.getPlayerRounds(currentUser.uid));
    });
    expect(hcap).toBeNull();
  });

  test('scenarioOnlyScramble: 4 rounds, no individual avg, handicap null', async ({ page }) => {
    await loginAs(page, 'scenarioOnlyScramble');
    expect(await readRoundCount(page)).toBe(4);
    const avg = await page.evaluate(() => PB.getPlayerAvg(currentUser.uid));
    expect(avg).toBeNull();
    const hcap = await page.evaluate(() => {
      return PB.calcHandicap(PB.getPlayerRounds(currentUser.uid));
    });
    expect(hcap).toBeNull();
  });

  test('scenarioTwentyRounds: 20 rounds, handicap is a real number', async ({ page }) => {
    await loginAs(page, 'scenarioTwentyRounds');
    expect(await readRoundCount(page)).toBe(20);
    const hcap = await page.evaluate(() => {
      return PB.calcHandicap(PB.getPlayerRounds(currentUser.uid));
    });
    expect(typeof hcap).toBe('number');
    expect(Number.isFinite(hcap)).toBe(true);
  });

  test('scenarioSingleRound: 1 round, handicap null (insufficient data)', async ({ page }) => {
    await loginAs(page, 'scenarioSingleRound');
    expect(await readRoundCount(page)).toBe(1);
    const hcap = await page.evaluate(() => {
      return PB.calcHandicap(PB.getPlayerRounds(currentUser.uid));
    });
    expect(hcap).toBeNull();
  });

  test('scenarioNoRounds: 0 rounds, profile renders with no errors', async ({ page }) => {
    await loginAs(page, 'scenarioNoRounds');
    expect(await readRoundCount(page)).toBe(0);
    // Navigate to the profile page and confirm it renders.
    await goMyProfile(page);
    expect(await readRoundCount(page)).toBe(0);
  });

  test('scenarioMixedLeagues: home shows 5 globally (v7.6.4 totalRounds), in-memory state is 3 league-scoped, Firestore global is 5', async ({ page }) => {
    await loginAs(page, 'scenarioMixedLeagues');

    // Home reads currentProfile.totalRounds (global, set by persistPlayerStats
    // in production — in fixtures we pre-materialize it). All 5 rounds show.
    expect(await readRoundCount(page)).toBe(5);

    // In-memory state.rounds is loaded via leagueQuery("rounds") so PB only
    // sees the active-league (test-league-01) rounds: 3.
    const leagueScoped = await page.evaluate(() => {
      return PB.getPlayerRounds(currentUser.uid).length;
    });
    expect(leagueScoped).toBe(3);

    // Direct global Firestore read (no league filter) returns all 5.
    const globalCount = await page.evaluate(async () => {
      const snap = await window.db.collection('rounds').where('player', '==', currentUser.uid).get();
      return snap.size;
    });
    expect(globalCount).toBe(5);
  });

});

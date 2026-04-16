// v7.6.5 regression test — founding members have rounds under both a
// pre-claim seed id (e.g. "testzach") and a post-claim Firebase UID
// (e.g. "test_zach_uid_01"). getPlayerRounds() must merge both through
// getAllPlayerIds(). If the short-circuit bug recurs, these tests fail.

const { test, expect } = require('@playwright/test');
const { loginAs } = require('../helpers/auth.js');
const { readRoundCount } = require('../helpers/assertions.js');
const { goMyProfile } = require('../helpers/navigation.js');

test.describe('Founding four — old-seed / new-UID round merge', () => {

  test('testZach home page shows 5 rounds', async ({ page }) => {
    await loginAs(page, 'testZach');
    expect(await readRoundCount(page)).toBe(5);
  });

  test('testNick home page shows 6 rounds (5 old-seed + 1 new-UID)', async ({ page }) => {
    await loginAs(page, 'testNick');
    expect(await readRoundCount(page)).toBe(6);
  });

  test('testKayvan home page shows 6 rounds', async ({ page }) => {
    await loginAs(page, 'testKayvan');
    expect(await readRoundCount(page)).toBe(6);
  });

  test('testKiyan home page shows 5 rounds', async ({ page }) => {
    await loginAs(page, 'testKiyan');
    expect(await readRoundCount(page)).toBe(5);
  });

  test('home and profile round counts agree for testZach', async ({ page }) => {
    await loginAs(page, 'testZach');
    const homeCount = await readRoundCount(page);
    await goMyProfile(page);
    const profileCount = await readRoundCount(page);
    expect(profileCount).toBe(homeCount);
  });

});

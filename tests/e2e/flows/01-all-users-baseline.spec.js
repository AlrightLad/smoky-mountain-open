// Baseline display coverage: every test user logs in, lands on home,
// and the rendered round count matches the fixture. No console errors
// are permitted during render.

const { test, expect } = require('@playwright/test');
const { loginAs } = require('../helpers/auth.js');
const { setupConsoleErrorCatcher, readRoundCount } = require('../helpers/assertions.js');
const { users, expectedRoundCount } = require('../setup/fixtures/users.js');

test.describe('Baseline — all 26 users render home without errors', () => {
  for (const u of users) {
    test(u.key + ' home shows ' + expectedRoundCount[u.key] + ' rounds', async ({ page }) => {
      const getErrors = setupConsoleErrorCatcher(page);
      await loginAs(page, u.key);
      const count = await readRoundCount(page);
      expect(count).toBe(expectedRoundCount[u.key]);
      const errors = getErrors();
      expect(errors, 'console errors during render:\n' + errors.join('\n')).toHaveLength(0);
    });
  }
});

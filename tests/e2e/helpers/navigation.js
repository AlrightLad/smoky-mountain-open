// Navigation helpers for Playwright tests.

async function goHome(page) {
  await page.evaluate(() => {
    if (typeof Router !== 'undefined') Router.go('home');
  });
  await page.waitForFunction(() => {
    const home = document.querySelector('[data-page="home"]');
    return home && !home.classList.contains('hidden');
  }, { timeout: 5000 });
}

async function goMyProfile(page) {
  await page.evaluate(() => {
    if (typeof goToMyProfile === 'function') goToMyProfile();
  });
  await page.waitForFunction(() => {
    const members = document.querySelector('[data-page="members"]');
    return members && !members.classList.contains('hidden');
  }, { timeout: 5000 });
}

module.exports = { goHome, goMyProfile };

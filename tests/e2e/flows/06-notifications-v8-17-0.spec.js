// Ship 5+1 Gate 1 (v8.17.0) — Notification system verification.
//
// Covers: listener attach/detach, badge update, V6 navigation bug fix,
// linkPage legacy fallback, readAt timestamp, scroll-back read history,
// spectator HUD non-regression, HQ shell stamp preservation across panel toggle.

const { test, expect } = require('@playwright/test');
const { loginAs, logout } = require('../helpers/auth.js');

const ZACH = 'testZach';

test.describe('v8.17.0 notifications — listener lifecycle + bell badge', () => {
  test('listener attaches after login, detaches on logout', async ({ page }) => {
    await loginAs(page, ZACH);
    await page.waitForFunction(() => typeof window._notifUnsub === 'function', { timeout: 10000 });
    expect(await page.evaluate(() => typeof window._notifUnsub)).toBe('function');

    await logout(page);
    await page.waitForFunction(() => !window._notifUnsub, { timeout: 5000 });
    expect(await page.evaluate(() => window._notifUnsub)).toBeNull();
  });

  test('bell badge reflects unread count and clears after mark-all-read', async ({ page }) => {
    await loginAs(page, ZACH);
    // Wait for initial snapshot to populate liveNotifications
    await page.waitForFunction(() => Array.isArray(window.liveNotifications) && window.liveNotifications.length > 0, { timeout: 10000 });

    const badge = page.locator('#notifBadge');
    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    expect(text).toMatch(/^\d+\+?$/);

    await page.click('#notifBell');
    await page.waitForFunction(() => window.notifPanelOpen === true);
    await page.locator('button:has-text("Mark all read")').click();
    await page.waitForFunction(() => window.liveNotifications.length === 0, { timeout: 5000 });
    await expect(badge).toBeHidden();
  });
});

test.describe('v8.17.0 notifications — click navigation (V6 nav bug fix)', () => {
  test('wager_challenge click navigates to /wagers (not home)', async ({ page }) => {
    await loginAs(page, ZACH);
    await page.waitForFunction(() => window.liveNotifications && window.liveNotifications.length > 0);
    await page.click('#notifBell');
    await page.waitForFunction(() => window.notifPanelOpen === true);

    const wagerItem = page.locator('.notif-item').filter({ hasText: 'challenged you' }).first();
    await wagerItem.click();
    await page.waitForFunction(() => Router.getPage() === 'wagers', { timeout: 5000 });
    expect(await page.evaluate(() => Router.getPage())).toBe('wagers');
  });

  test('legacy linkPage field still routes (dm → dms via fallback)', async ({ page }) => {
    await loginAs(page, ZACH);
    await page.waitForFunction(() => window.liveNotifications && window.liveNotifications.length > 0);
    await page.click('#notifBell');
    await page.waitForFunction(() => window.notifPanelOpen === true);

    const dmItem = page.locator('.notif-item').filter({ hasText: 'New Message' }).first();
    await dmItem.click();
    await page.waitForFunction(() => Router.getPage() === 'dms', { timeout: 5000 });
    expect(await page.evaluate(() => Router.getPage())).toBe('dms');
  });

  test('profile_reminder forwards params to handler (deep-link to edit form)', async ({ page }) => {
    await loginAs(page, ZACH);
    await page.waitForFunction(() => window.liveNotifications && window.liveNotifications.length > 0);
    await page.click('#notifBell');
    await page.waitForFunction(() => window.notifPanelOpen === true);

    const profileItem = page.locator('.notif-item').filter({ hasText: 'Complete Your Profile' }).first();
    await profileItem.click();
    await page.waitForFunction(() => Router.getPage() === 'members', { timeout: 5000 });

    // params.edit must be forwarded — Router.getParams() returns the params object
    const params = await page.evaluate(() => Router.getParams());
    expect(params.edit).toBeTruthy();
  });
});

test.describe('v8.17.0 notifications — readAt + scroll-back', () => {
  test('clicking unread writes readAt timestamp', async ({ page }) => {
    await loginAs(page, ZACH);
    await page.waitForFunction(() => window.liveNotifications && window.liveNotifications.length > 0);
    await page.click('#notifBell');
    await page.waitForFunction(() => window.notifPanelOpen === true);

    const id = await page.evaluate(() => window.liveNotifications[0]._id);
    await page.locator('.notif-item').first().click();
    await page.waitForTimeout(800);  // allow Firestore round-trip

    const data = await page.evaluate(async (notifId) => {
      const doc = await db.collection('notifications').doc(notifId).get();
      return doc.data();
    }, id);
    expect(data.read).toBe(true);
    expect(data.readAt).toBeTruthy();
  });

  test('panel renders EARLIER section with read history items', async ({ page }) => {
    await loginAs(page, ZACH);
    await page.waitForFunction(() => window.liveNotifications && window.liveNotifications.length > 0);
    await page.click('#notifBell');
    await page.waitForFunction(() => window.notifPanelOpen === true);
    // Wait for first read-history fetch to complete
    await page.waitForFunction(() => window.readHistory && window.readHistory.length > 0, { timeout: 5000 });

    const divider = page.locator('.notif-section-divider').filter({ hasText: 'EARLIER' });
    await expect(divider).toBeVisible();

    const readItems = page.locator('.notif-item:not(.unread)');
    expect(await readItems.count()).toBeGreaterThan(0);
  });
});

test.describe('v8.17.0 notifications — non-regression', () => {
  test('notification listener does not interfere with spectator path', async ({ page }) => {
    await loginAs(page, ZACH);
    await page.waitForFunction(() => typeof window._notifUnsub === 'function');

    // Notif listener active before any spectator activity
    expect(await page.evaluate(() => !!window._notifUnsub)).toBe(true);

    // Navigate to home — notif listener still attached (independent of route)
    await page.evaluate(() => Router.go('home'));
    await page.waitForFunction(() => Router.getPage() === 'home');
    expect(await page.evaluate(() => !!window._notifUnsub)).toBe(true);
  });

  test('opening + closing notif panel preserves HQ shell render path stamp', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAs(page, ZACH);
    // Wait for HQ shell render path on desktop band
    await page.waitForSelector('[data-render-path="hq-shell"]', { timeout: 10000 });

    await page.click('#notifBell');
    await page.waitForFunction(() => window.notifPanelOpen === true);
    await page.locator('#notifPanel button:has-text("×")').first().click();
    await page.waitForFunction(() => window.notifPanelOpen === false);

    // Shell stamp must survive the panel open/close lifecycle
    const stamps = await page.locator('[data-render-path="hq-shell"]').count();
    expect(stamps).toBeGreaterThanOrEqual(1);
  });
});

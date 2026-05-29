// BL-008 regression — band-aware #rrSidebar ARIA semantics.
//
// Why this exists (the bug it locks out): _wireSidebar() used to stamp
// role=dialog + aria-hidden=true + aria-modal=false on #rrSidebar
// UNCONDITIONALLY, at every viewport. That left the visible DESKTOP nav
// rail (>=960px) permanently hidden from and mislabeled to screen readers
// (WCAG 4.1.2 Name/Role/Value, 2.4.1 Bypass Blocks, 1.3.1 Info &
// Relationships). The off-canvas drawer band (720-959px) was already
// correct; desktop + the <720 hidden band were not.
//
// The fix (src/core/router-sidebar.js) drives semantics from a matchMedia
// band query via _applyDrawerA11y(). This spec asserts the three bands:
//   - Desktop  >=960px : persistent nav rail. NOT role=dialog, NOT
//                        aria-hidden=true. aria-label "Primary navigation".
//   - Band A   720-959 : off-canvas drawer. role=dialog; aria-hidden flips
//                        true(closed)/false(open); aria-modal flips with it.
//   - Band B   <720px  : CSS-hidden. role cleaned (not dialog).
//
// Runs once on the desktop chromium project; viewport is driven explicitly
// with setViewportSize so the band logic (window.matchMedia) is exercised
// directly. Skipped on the mobile projects (isMobile contexts fix viewport
// + emulate touch, which fights explicit resizing).

const { test, expect } = require('@playwright/test');
const { loginAs } = require('../helpers/auth.js');

function readSidebarAria() {
  var el = document.getElementById('rrSidebar');
  if (!el) return { present: false };
  return {
    present: true,
    role: el.getAttribute('role'),
    ariaHidden: el.getAttribute('aria-hidden'),
    ariaModal: el.getAttribute('aria-modal'),
    ariaLabel: el.getAttribute('aria-label'),
    drawerOpen: !!window._drawerOpen,
    display: getComputedStyle(el).display,
  };
}

test.describe('BL-008 — #rrSidebar band-aware ARIA semantics', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium',
      'Band-aware viewport test runs once on the desktop chromium project');
  });

  test('desktop nav rail is not a dialog and not aria-hidden', async ({ page }) => {
    await loginAs(page, 'testZach');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);

    const aria = await page.evaluate(readSidebarAria);
    expect(aria.present, '#rrSidebar should exist').toBe(true);
    expect(aria.role, 'desktop nav rail must NOT be role=dialog').not.toBe('dialog');
    expect(aria.ariaHidden, 'visible desktop nav rail must NOT be aria-hidden=true').not.toBe('true');
    expect(aria.ariaLabel, 'desktop rail label').toBe('Primary navigation');
  });

  test('Band A closed drawer is a hidden dialog', async ({ page }) => {
    await loginAs(page, 'testZach');
    await page.setViewportSize({ width: 900, height: 900 });
    await page.waitForTimeout(300);

    const aria = await page.evaluate(readSidebarAria);
    expect(aria.role, 'Band A drawer is role=dialog').toBe('dialog');
    expect(aria.ariaHidden, 'closed drawer is aria-hidden=true').toBe('true');
    expect(aria.ariaModal, 'closed drawer is aria-modal=false').toBe('false');
    expect(aria.ariaLabel, 'drawer label').toBe('Navigation drawer');
  });

  test('Band A open drawer exposes a modal dialog', async ({ page }) => {
    await loginAs(page, 'testZach');
    await page.setViewportSize({ width: 900, height: 900 });
    await page.waitForTimeout(300);

    await page.evaluate(() => { if (window._toggleHQDrawer) window._toggleHQDrawer(); });
    await page.waitForTimeout(300);

    const open = await page.evaluate(readSidebarAria);
    expect(open.drawerOpen, 'drawer should report open').toBe(true);
    expect(open.role, 'open drawer is role=dialog').toBe('dialog');
    expect(open.ariaHidden, 'open drawer is aria-hidden=false').toBe('false');
    expect(open.ariaModal, 'open drawer is aria-modal=true').toBe('true');
  });

  test('Escape closes the Band A drawer and restores hidden semantics', async ({ page }) => {
    await loginAs(page, 'testZach');
    await page.setViewportSize({ width: 900, height: 900 });
    await page.waitForTimeout(300);

    await page.evaluate(() => { if (window._toggleHQDrawer) window._toggleHQDrawer(); });
    await page.waitForTimeout(300);
    expect((await page.evaluate(readSidebarAria)).drawerOpen, 'open before ESC').toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const closed = await page.evaluate(readSidebarAria);
    expect(closed.drawerOpen, 'ESC should close the drawer').toBe(false);
    expect(closed.ariaHidden, 'closed-after-ESC is aria-hidden=true').toBe('true');
    expect(closed.ariaModal, 'closed-after-ESC is aria-modal=false').toBe('false');
  });

  test('Band B (<720px) clears the dialog role', async ({ page }) => {
    await loginAs(page, 'testZach');
    await page.setViewportSize({ width: 600, height: 900 });
    await page.waitForTimeout(300);

    const aria = await page.evaluate(readSidebarAria);
    expect(aria.role, 'hidden <720 band must NOT be role=dialog').not.toBe('dialog');
    expect(aria.display, 'sidebar is CSS-hidden below 720px').toBe('none');
  });
});

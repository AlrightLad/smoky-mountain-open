// v8.23.92 regression guard for the page-transition system (Ship 0b-ii,
// v8.3.2). The three-tier pt-lift / pt-masthead entrance motion existed in
// components.css + transitions.js since v8.3.2 but was DORMANT: router.js
// go() only toggled .hidden and never set the data-transition attributes the
// CSS keys off, so every mobile nav tap snapped with no entrance motion.
// v8.23.92 wired applyTransition(target, getTransitionTier(prev,page), "in",
// _isBack) into go(). These tests pin the wiring so it can't silently
// regress back to dormant, and pin the fill-mode:backwards fix that keeps a
// transform from lingering after the animation (a retained translateY would
// establish a containing block and break position:fixed descendants).

const { test, expect } = require('@playwright/test');
const { loginAs } = require('../helpers/auth.js');
const { goHome } = require('../helpers/navigation.js');

// Drive a route change through the real router and wait until the target
// [data-page] is the visible one. Mirrors navigation.js but parameterised.
async function navTo(page, route) {
  await page.evaluate((r) => { if (typeof Router !== 'undefined') Router.go(r); }, route);
  await page.waitForFunction((r) => {
    const el = document.querySelector('[data-page="' + r + '"]');
    return el && !el.classList.contains('hidden');
  }, route, { timeout: 5000 });
}

function transitionStateOf(route) {
  const el = document.querySelector('[data-page="' + route + '"]');
  if (!el) return { found: false };
  const cs = getComputedStyle(el);
  return {
    found: true,
    transition: el.getAttribute('data-transition'),
    direction: el.getAttribute('data-direction'),
    nav: el.getAttribute('data-nav'),
    animationName: cs.animationName,
  };
}

test.describe('Page transitions — v8.23.92 wiring regression', () => {

  test('forward route change applies the lift tier (entrance motion, not a snap)', async ({ page }) => {
    await loginAs(page, 'testZach');
    await goHome(page);

    await navTo(page, 'courses');
    const s = await page.evaluate(transitionStateOf, 'courses');

    expect(s.found, 'courses [data-page] should exist').toBe(true);
    expect(s.transition, 'home→courses is a non-masthead edge → lift tier').toBe('lift');
    expect(s.direction, 'entrance direction').toBe('in');
    expect(s.nav, 'forward nav must not carry the back marker').toBeNull();
    expect(s.animationName, 'the lift keyframe must actually be bound (not none)').toBe('pt-lift-in');
  });

  test('masthead edge (→ playnow) applies the masthead tier', async ({ page }) => {
    await loginAs(page, 'testZach');
    await goHome(page);

    await navTo(page, 'playnow');
    const s = await page.evaluate(transitionStateOf, 'playnow');

    expect(s.found, 'playnow [data-page] should exist').toBe(true);
    expect(s.transition, 'any→playnow is a MASTHEAD_EDGE').toBe('masthead');
    expect(s.direction).toBe('in');
    expect(s.animationName, 'the masthead keyframe must be bound').toBe('pt-masthead-in');
  });

  test('no transform lingers after the animation (fixed-position safety)', async ({ page }) => {
    await loginAs(page, 'testZach');
    await goHome(page);

    await navTo(page, 'courses');
    // Lift is 200ms + 80ms delay = 280ms. Wait past it, then the element must
    // sit at its natural state with NO transform — fill-mode:backwards reverts
    // instead of retaining translateY(0). A retained transform would compute
    // to 'matrix(1, 0, 0, 1, 0, 0)' and establish a containing block.
    await page.waitForTimeout(450);
    const transform = await page.evaluate(() => {
      const el = document.querySelector('[data-page="courses"]');
      return el ? getComputedStyle(el).transform : 'MISSING';
    });
    expect(transform, 'no lingering transform after the lift completes').toBe('none');

    // And the global bottom nav must remain pinned to the viewport bottom —
    // proof nothing knocked position:fixed chrome out of place.
    const navFixed = await page.evaluate(() => {
      const nav = document.getElementById('bottomNav');
      if (!nav) return { found: false };
      const cs = getComputedStyle(nav);
      return { found: true, position: cs.position, bottom: cs.bottom };
    });
    expect(navFixed.found, 'bottomNav should exist').toBe(true);
    expect(navFixed.position, 'bottom nav stays fixed').toBe('fixed');
  });

  test('re-entering a page re-applies the entrance attributes (replay, not one-shot)', async ({ page }) => {
    await loginAs(page, 'testZach');
    await goHome(page);

    await navTo(page, 'courses');
    await navTo(page, 'home');
    await navTo(page, 'courses');
    const s = await page.evaluate(transitionStateOf, 'courses');

    expect(s.transition, 'attributes must be re-applied on every entry').toBe('lift');
    expect(s.direction).toBe('in');
    expect(s.animationName).toBe('pt-lift-in');
  });

});

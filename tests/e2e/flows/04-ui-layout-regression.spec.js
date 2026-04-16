// v7.8.4 regression tests for two UI bugs Zach caught on the live app:
//   1. Profile stat grid was missing the Rounds stat-box (v7.8.0 data-count
//      span wrapper got wiped by initCountAnimations setting textContent).
//   2. Home top-left XP bar and profile XP bar disagreed when the
//      persisted member.xp diverged from the live league-scoped
//      computation (multi-league accounts).

const { test, expect } = require('@playwright/test');
const { loginAs } = require('../helpers/auth.js');
const { goMyProfile } = require('../helpers/navigation.js');

test.describe('Profile stat grid — v7.8.4 regression (Bug 2)', () => {

  test('stat grid has exactly 6 stat-boxes with expected labels, no orphan elements', async ({ page }) => {
    await loginAs(page, 'testZach');
    await goMyProfile(page);
    await page.waitForTimeout(300);

    const gridState = await page.evaluate(() => {
      const page = document.querySelector('[data-page="members"]');
      const box = page && page.querySelector('.stat-box');
      const grid = box && box.parentElement;
      if (!grid) return { ok: false, reason: 'grid not found' };
      const kids = Array.from(grid.children);
      return {
        ok: true,
        childCount: kids.length,
        nonStatBoxChildren: kids
          .filter(k => !k.classList.contains('stat-box'))
          .map(k => ({ tag: k.tagName, text: (k.textContent || '').trim().substring(0, 80), outerHTMLHead: k.outerHTML.substring(0, 200) })),
        labels: kids
          .filter(k => k.classList.contains('stat-box'))
          .map(k => {
            const l = k.querySelector('.stat-label');
            return l ? l.textContent.trim().replace(/\s+/g, ' ') : '';
          }),
      };
    });

    expect(gridState.ok, gridState.reason).toBe(true);
    expect(gridState.nonStatBoxChildren, 'grid should contain only .stat-box children; orphan found').toEqual([]);
    expect(gridState.childCount).toBe(6);
    // Labels sometimes include a trailing SVG glyph from the "Best" and
    // "Rounds" boxes; match by prefix.
    const prefixes = gridState.labels.map(l => l.split(' ')[0]);
    expect(prefixes).toEqual(['Handicap', 'Avg', 'Best', 'Rounds', 'Courses', 'Wins']);
  });

  test('Rounds stat-box renders with its label and the correct value', async ({ page }) => {
    await loginAs(page, 'testZach');
    await goMyProfile(page);
    await page.waitForTimeout(300);

    const roundsBox = await page.evaluate(() => {
      const page = document.querySelector('[data-page="members"]');
      const val = page && page.querySelector('[data-stat="round-count"]');
      if (!val) return null;
      const box = val.closest('.stat-box');
      const label = box && box.querySelector('.stat-label');
      return {
        valClasses: Array.from(val.classList),
        dataCount: val.getAttribute('data-count'),
        boxFound: !!box,
        labelText: label ? label.textContent.trim() : null,
      };
    });

    expect(roundsBox, 'data-stat="round-count" element missing').not.toBeNull();
    expect(roundsBox.valClasses).toContain('stat-val');
    expect(roundsBox.boxFound, 'round-count element not inside a .stat-box').toBe(true);
    expect(roundsBox.labelText).toBe('Rounds');
    expect(roundsBox.dataCount).toBe('5');
  });

});

test.describe('XP display parity — v7.8.4 regression (Bug 1)', () => {

  function readFillPct(inlineStyle) {
    if (!inlineStyle) return null;
    const m = inlineStyle.match(/width\s*:\s*(\d+(?:\.\d+)?)\s*%/);
    return m ? parseFloat(m[1]) : null;
  }

  test('scenarioMixedLeagues: home top-left bar and profile bar show the same fill %', async ({ page }) => {
    await loginAs(page, 'scenarioMixedLeagues');
    await page.waitForTimeout(300);

    // Home top-left avatar profile bar — the inner fill div (has gold bg,
    // sits inside the track inside #profileBarRight).
    const homePct = await page.evaluate(() => {
      const right = document.getElementById('profileBarRight');
      if (!right) return null;
      // The track is the element whose inline style mentions var(--border).
      // Its first element child is the fill.
      const candidates = right.querySelectorAll('div');
      for (const c of candidates) {
        const s = c.getAttribute('style') || '';
        if (/background\s*:\s*var\(--gold\)/.test(s) && /width\s*:\s*\d/.test(s)) {
          return s;
        }
      }
      return null;
    });

    await goMyProfile(page);
    await page.waitForTimeout(300);

    const profilePct = await page.evaluate(() => {
      const pg = document.querySelector('[data-page="members"]');
      if (!pg) return null;
      // Profile XP fill: div with a linear-gradient background and a width %.
      const divs = pg.querySelectorAll('div');
      for (const d of divs) {
        const s = d.getAttribute('style') || '';
        if (/linear-gradient\([^)]*var\(--gold2\)/.test(s) && /width\s*:\s*\d/.test(s)) {
          return s;
        }
      }
      return null;
    });

    const home = readFillPct(homePct);
    const profile = readFillPct(profilePct);
    expect(home, 'home XP fill not found').not.toBeNull();
    expect(profile, 'profile XP fill not found').not.toBeNull();

    // Persisted currentProfile.xp = 4,500 (fixture). xpForLevel(7) ≈ 3844,
    // xpForLevel(8) ≈ 4956. Expected fill ≈ (4500-3844)/(4956-3844) ≈ 59%.
    // 1pp tolerance absorbs rounding differences between the two fills.
    expect(Math.abs(home - profile)).toBeLessThanOrEqual(1);
    // Sanity bound: both should be somewhere in the middle, not 0 or 100.
    expect(home).toBeGreaterThan(30);
    expect(home).toBeLessThan(95);
  });

  test('testZach: home and profile agree when persisted xp matches live', async ({ page }) => {
    await loginAs(page, 'testZach');
    await page.waitForTimeout(300);

    const homePct = await page.evaluate(() => {
      const right = document.getElementById('profileBarRight');
      if (!right) return null;
      const divs = right.querySelectorAll('div');
      for (const d of divs) {
        const s = d.getAttribute('style') || '';
        if (/background\s*:\s*var\(--gold\)/.test(s) && /width\s*:\s*\d/.test(s)) return s;
      }
      return null;
    });

    await goMyProfile(page);
    await page.waitForTimeout(300);

    const profilePct = await page.evaluate(() => {
      const pg = document.querySelector('[data-page="members"]');
      if (!pg) return null;
      const divs = pg.querySelectorAll('div');
      for (const d of divs) {
        const s = d.getAttribute('style') || '';
        if (/linear-gradient\([^)]*var\(--gold2\)/.test(s) && /width\s*:\s*\d/.test(s)) return s;
      }
      return null;
    });

    const home = readFillPct(homePct);
    const profile = readFillPct(profilePct);
    expect(home).not.toBeNull();
    expect(profile).not.toBeNull();
    expect(Math.abs(home - profile)).toBeLessThanOrEqual(1);
  });

});

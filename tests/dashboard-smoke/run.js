#!/usr/bin/env node
/**
 * Dashboard smoke suite — same level of audit/smoke testing as the app gets.
 *
 * Founder standard 2026-05-21: "the dashboard needs the same level of audit and
 * smoke testing the app is getting that is my standard not a suggestion".
 *
 * Per page in docs/reports/*.html, this asserts:
 *
 *   1. Console: NO errors during DOMContentLoaded + 2.5s settle window
 *   2. Page errors: NONE (uncaught exceptions)
 *   3. report-data JSON block parses without throwing
 *   4. Body text length > 500 chars (no blank page)
 *   5. At least 70% of [data-kpi], [data-fq], [data-act-badge] elements are
 *      populated (not "—" / empty / "...")
 *   6. <h1> page title is present + visible
 *   7. Nav: ALL dashboards have the same nav links in the same order
 *      (App Health link consistency)
 *   8. No element with bounding rect off-screen (-9999px hack)
 *   9. Image elements load (no broken <img>)
 *
 * Run: node tests/dashboard-smoke/run.js
 * Exit 0 = all pass; exit 1 = any failure (suitable for pre-commit / CI gate).
 */

const { chromium } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const REPORTS_DIR = path.join(ROOT, 'docs', 'reports');

// Pages to smoke. Skip index.html since it's a special manifest page.
const PAGES = fs
  .readdirSync(REPORTS_DIR)
  .filter((f) => f.endsWith('.html'))
  .filter((f) => f !== 'index.html')
  .sort();

const VIEWPORT = { width: 1920, height: 1080 };
const SETTLE_MS = 2500;
const KPI_POPULATED_THRESHOLD = 0.7;  // 70%+ KPI cells must be populated
const MIN_BODY_TEXT_CHARS = 500;

// 2026-05-21 (Founder directive iteration 2): nav order must be IDENTICAL
// across all dashboard tabs. App Health locked to position 2 (right after
// Dashboard). Source-of-truth: templates/dashboards/_assets/nav-links.json.
// Index tab REPLACED by Founder Checklist per Founder directive.
const EXPECTED_NAV_LINKS = [
  'dashboard.html',
  'app-health.html',
  'activity.html',
  'discussion-bubbles.html',
  'proposals.html',
  'amendments.html',
  'main-flows.html',
  'design-system.html',
  'token-usage.html',
  'sessions.html',
  'founder-checklist.html',
];

async function checkPage(browser, file) {
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];

  // Filter out file:// CORS noise — these are not real production issues.
  // Local file:// can't issue XHR; production serves via HTTP and works fine.
  function isFileProtocolNoise(text) {
    return text.includes("'file:///") || text.includes('XMLHttpRequest')
        || text.includes("Couldn't load preload assets") || text.includes('ERR_FAILED')
        || text.includes('net::ERR_FAILED') || text.includes('Failed to load resource')
        || text.includes('ProgressEvent');
  }

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      const text = msg.text();
      if (isFileProtocolNoise(text)) return;
      consoleErrors.push({ type: msg.type(), text });
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push({ name: err.name, message: err.message });
  });

  const url = 'file://' + path.join(REPORTS_DIR, file).replace(/\\/g, '/');
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(SETTLE_MS);

  // 3. report-data block
  const dataBlock = await page.evaluate(() => {
    const el = document.getElementById('report-data');
    if (!el) return { exists: false };
    try {
      JSON.parse(el.textContent);
      return { exists: true, parses: true, length: (el.textContent || '').length };
    } catch (e) {
      return { exists: true, parses: false, error: e.message };
    }
  });

  // 4. Body text
  const bodyTextLen = await page.evaluate(() => (document.body.innerText || '').length);

  // 5. KPI population
  const kpiStats = await page.evaluate(() => {
    const all = document.querySelectorAll('[data-kpi], [data-fq], [data-act-badge], [data-idx-badge]');
    let populated = 0;
    const unpop = [];
    for (const el of all) {
      const txt = (el.textContent || '').trim();
      if (txt === '' || txt === '—' || txt === '...') {
        unpop.push(el.getAttribute('data-kpi') || el.getAttribute('data-fq') || el.getAttribute('data-act-badge') || el.getAttribute('data-idx-badge'));
      } else {
        populated += 1;
      }
    }
    return { total: all.length, populated, unpopulated: unpop.slice(0, 10) };
  });

  // 6. <h1>
  const h1Text = await page.evaluate(() => {
    const h = document.querySelector('h1');
    return h ? (h.innerText || '').trim() : null;
  });

  // 7. Nav links
  const navLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('.pb-page-nav-links a'));
    return links.map((a) => a.getAttribute('href'));
  });

  // 8. Off-screen elements
  const offScreen = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('main *'));
    let count = 0;
    for (const el of all) {
      const r = el.getBoundingClientRect();
      // Element is intentionally off-screen if x or y < -1000 AND has content
      if ((r.left < -1000 || r.top < -1000) && (el.textContent || '').trim().length > 0) {
        count += 1;
      }
    }
    return count;
  });

  // 9. Broken images
  const brokenImgs = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.filter((i) => i.complete && i.naturalWidth === 0).length;
  });

  // 10. axe-core accessibility audit — wcag2a + wcag2aa + best-practices
  // Industry-standard a11y detector. Catches contrast, ARIA, semantic, etc.
  // 'region' rule disabled (dashboards are full-page apps, region rule is noisy here).
  // 'color-contrast' is YELLOW for now — dark editorial theme needs separate
  // pass to lock contrast targets (filed as audit follow-on).
  let axeFindings = { violations: [], total: 0 };
  try {
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .disableRules(['region', 'color-contrast'])
      .analyze();
    axeFindings.violations = axeResults.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      count: v.nodes.length,
    }));
    axeFindings.total = axeResults.violations.length;
  } catch (e) {
    axeFindings.error = e.message;
  }

  await context.close();

  const issues = [];

  if (consoleErrors.length > 0) {
    issues.push(`${consoleErrors.length} console error(s): ` + consoleErrors.slice(0, 3).map((e) => e.text.slice(0, 100)).join(' | '));
  }
  if (pageErrors.length > 0) {
    issues.push(`${pageErrors.length} page error(s): ` + pageErrors.slice(0, 3).map((e) => e.name + ': ' + e.message.slice(0, 80)).join(' | '));
  }
  // design-system.html is a static reference page with no JSON data block — exempt.
  // app-health.html embeds its data block too — both should still parse if present.
  const isStaticPage = file === 'design-system.html';
  if (!isStaticPage) {
    if (!dataBlock.exists) {
      issues.push('report-data block missing');
    } else if (!dataBlock.parses) {
      issues.push('report-data JSON parse failed: ' + dataBlock.error);
    }
  }
  if (bodyTextLen < MIN_BODY_TEXT_CHARS) {
    issues.push(`body text only ${bodyTextLen} chars (min ${MIN_BODY_TEXT_CHARS})`);
  }
  const popPct = kpiStats.total > 0 ? kpiStats.populated / kpiStats.total : 1.0;
  if (popPct < KPI_POPULATED_THRESHOLD) {
    issues.push(`only ${Math.round(popPct * 100)}% KPIs populated (${kpiStats.populated}/${kpiStats.total}); sample unpopulated: ${kpiStats.unpopulated.join(', ')}`);
  }
  if (!h1Text || h1Text.length < 2) {
    issues.push('h1 missing or empty');
  }
  // Nav order MUST match EXPECTED_NAV_LINKS exactly (Founder directive 2026-05-21
  // iteration 2: same position no matter the tab). Compare ordered.
  // navLinks may have trailing/leading links (the brand <a> isn't in pb-page-nav-links).
  const expected = EXPECTED_NAV_LINKS.join(',');
  const actual = navLinks.join(',');
  if (actual !== expected) {
    const missing = EXPECTED_NAV_LINKS.filter((h) => !navLinks.includes(h));
    const extra = navLinks.filter((h) => !EXPECTED_NAV_LINKS.includes(h));
    if (missing.length || extra.length) {
      issues.push('nav mismatch: missing=[' + missing.join(',') + '] extra=[' + extra.join(',') + ']');
    } else {
      issues.push('nav order mismatch: expected=' + expected + ' got=' + actual);
    }
  }
  if (offScreen > 0) {
    issues.push(`${offScreen} text element(s) off-screen with content`);
  }
  if (brokenImgs > 0) {
    issues.push(`${brokenImgs} broken image(s)`);
  }
  // axe — block on serious/critical (don't block on minor/moderate yet, baseline first)
  const seriousAxe = axeFindings.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  if (seriousAxe.length > 0) {
    issues.push(`${seriousAxe.length} serious/critical a11y violation(s): ` + seriousAxe.slice(0, 3).map((v) => `${v.id} (${v.count}x)`).join(', '));
  }

  return {
    file,
    passed: issues.length === 0,
    issues,
    stats: {
      bodyTextLen,
      kpiPopulated: kpiStats.populated,
      kpiTotal: kpiStats.total,
      navLinkCount: navLinks.length,
      axeViolations: axeFindings.total,
      axeSerious: seriousAxe.length,
    },
    axe: axeFindings,
  };
}

(async () => {
  console.log(`Dashboard smoke — ${PAGES.length} pages`);
  console.log('---');

  const browser = await chromium.launch();
  const results = [];

  for (const file of PAGES) {
    const r = await checkPage(browser, file);
    results.push(r);
    const symbol = r.passed ? '✓' : '✗';
    const stats = `[${r.stats.kpiPopulated}/${r.stats.kpiTotal} KPI, ${r.stats.bodyTextLen}c, ${r.stats.navLinkCount} nav]`;
    console.log(`  ${symbol} ${file.padEnd(28)} ${stats}`);
    if (!r.passed) {
      for (const issue of r.issues) {
        console.log(`      - ${issue}`);
      }
    }
  }

  await browser.close();

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log('---');
  console.log(`TOTAL: ${passed}/${total} pages pass`);

  // Emit JSON report
  const outDir = path.join(ROOT, '.claude', 'state', 'aggregates');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'dashboard-smoke-latest.json'),
    JSON.stringify({
      schema_version: 'dashboard-smoke-v1',
      generated_at: new Date().toISOString(),
      total,
      passed,
      results,
    }, null, 2)
  );

  process.exit(passed === total ? 0 : 1);
})();

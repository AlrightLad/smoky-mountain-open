// Assertion helpers for Playwright tests.

// Ignored console noise — every entry must point at an observed, explained
// non-bug. Do not add speculative patterns.
const IGNORE_PATTERNS = [
  // index.html carries a <meta http-equiv="Content-Security-Policy"> tag that
  // Chromium flags when it isn't the first element in <head>. Dev-only
  // DOM-ordering warning; no functional impact. TODO: move the meta to the
  // top of <head> and remove this entry.
  /Content Security Policy.*delivered via a <meta> element/i,
];

function setupConsoleErrorCatcher(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (IGNORE_PATTERNS.some(re => re.test(text))) return;
    errors.push(text);
  });
  page.on('pageerror', err => {
    const text = err.message;
    if (IGNORE_PATTERNS.some(re => re.test(text))) return;
    errors.push(text);
  });
  return () => errors;
}

async function readRoundCount(page) {
  // Read the data-count attribute rather than textContent. The count-up
  // animation starts at "0" for statBox, so textContent is unreliable
  // within the first 500ms after render — the attribute is authoritative.
  const el = page.locator('[data-stat="round-count"]').first();
  const val = await el.getAttribute('data-count');
  return parseInt((val || '').trim(), 10);
}

module.exports = { setupConsoleErrorCatcher, readRoundCount };

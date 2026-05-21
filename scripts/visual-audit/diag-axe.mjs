import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..', '..');

const target = process.argv[2] || 'proposals.html';
const url = 'file://' + resolve(ROOT, 'docs/reports', target).replace(/\\/g, '/');

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);

const r = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
  .disableRules(['region', 'color-contrast'])
  .analyze();

for (const v of r.violations) {
  if (v.impact === 'serious' || v.impact === 'critical') {
    console.log(`[${v.impact}] ${v.id}: ${v.help}`);
    for (const n of v.nodes.slice(0, 4)) {
      console.log('  target:', JSON.stringify(n.target));
      console.log('  html:  ', (n.html || '').slice(0, 200));
      if (n.failureSummary) console.log('  failure:', n.failureSummary.split('\n')[0]);
    }
  }
}

await browser.close();

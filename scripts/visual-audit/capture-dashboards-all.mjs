// Capture screenshots of every docs/reports/*.html dashboard page at desktop
// + narrow viewports, plus collect any DOM overlap issues via heuristic.
//
// Why: Founder reports "text overlapping" — V1 vision verification per
// CLAUDE.md mandates real screenshots + element-geometry analysis, not just
// guessing.
//
// Output: .claude/state/visual-audit-2026-05-21/<page>-{1920|1366|390}.png
// + a single visual-audit-findings.json with detected overlaps per page.

import { chromium } from 'playwright';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const REPORTS = resolve(ROOT, 'docs', 'reports');
const OUT = resolve(ROOT, '.claude', 'state', 'visual-audit-2026-05-21');

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const pages = readdirSync(REPORTS)
  .filter((f) => f.endsWith('.html'))
  .filter((f) => f !== 'index.html');  // skip the index for now

const VIEWPORTS = [
  { name: '1920', width: 1920, height: 1080 },
  { name: '1366', width: 1366, height: 768 },
];

const browser = await chromium.launch();
const findings = {};

for (const file of pages) {
  const page = file.replace('.html', '');
  findings[page] = { viewports: {} };

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const browserPage = await context.newPage();

    const url = 'file://' + resolve(REPORTS, file).replace(/\\/g, '/');
    await browserPage.goto(url, { waitUntil: 'domcontentloaded' });
    await browserPage.waitForTimeout(800);

    // Capture full-page screenshot
    const png = resolve(OUT, `${page}-${vp.name}.png`);
    await browserPage.screenshot({ path: png, fullPage: true });

    // Run heuristic overlap detection in-page.
    const overlaps = await browserPage.evaluate(() => {
      function isVisible(el) {
        const r = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        return r.width > 0 && r.height > 0
          && s.display !== 'none' && s.visibility !== 'hidden'
          && parseFloat(s.opacity) > 0.05;
      }

      function rectArea(r) { return r.width * r.height; }
      function intersectArea(a, b) {
        const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        return x * y;
      }

      // Collect all text-bearing elements (leaf-ish — has text but no block children with text)
      const all = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,li,td,th,strong,em,small,div,button,label,figcaption,summary'));
      const text = all.filter((el) => {
        if (!isVisible(el)) return false;
        const txt = (el.innerText || '').trim();
        if (!txt || txt.length < 2) return false;
        // skip if any block descendant also has text — we want innermost text nodes
        for (const child of el.children) {
          const cs = window.getComputedStyle(child);
          const isBlock = cs.display === 'block' || cs.display === 'grid' || cs.display === 'flex';
          const childTxt = (child.innerText || '').trim();
          if (isBlock && childTxt.length > 0) return false;
        }
        return true;
      });

      const issues = [];

      for (let i = 0; i < text.length; i++) {
        for (let j = i + 1; j < text.length; j++) {
          const a = text[i], b = text[j];
          // Skip if one is a descendant of the other (normal nesting)
          if (a.contains(b) || b.contains(a)) continue;

          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          const inter = intersectArea(ra, rb);
          if (inter <= 4) continue;  // tiny overlap, ignore (border alignment)

          const aArea = rectArea(ra);
          const bArea = rectArea(rb);
          const smaller = Math.min(aArea, bArea);
          if (smaller === 0) continue;
          const overlapPct = inter / smaller;
          if (overlapPct < 0.15) continue;  // <15% overlap = likely just adjacency

          // Filter out elements that are inside a deliberately layered overlay
          // (toast banners, fixed bottom-right indicators, sticky headers).
          // Walks ancestors to find any position:fixed/sticky parent — without
          // this, the live-indicator's inner <span> reports position:static
          // even though its parent button is position:fixed.
          function hasFixedAncestor(el) {
            let cur = el;
            while (cur && cur !== document.body) {
              const p = window.getComputedStyle(cur).position;
              if (p === 'fixed' || p === 'sticky') return true;
              cur = cur.parentElement;
            }
            return false;
          }
          if (hasFixedAncestor(a) || hasFixedAncestor(b)) continue;

          function path(el) {
            const parts = [];
            let cur = el;
            while (cur && cur.tagName && parts.length < 6) {
              let p = cur.tagName.toLowerCase();
              if (cur.id) p += '#' + cur.id;
              else if (cur.className && typeof cur.className === 'string') {
                p += '.' + cur.className.split(/\s+/).slice(0, 2).join('.');
              }
              parts.unshift(p);
              cur = cur.parentElement;
            }
            return parts.join(' > ');
          }

          issues.push({
            a: { path: path(a), text: (a.innerText || '').trim().slice(0, 60), rect: ra },
            b: { path: path(b), text: (b.innerText || '').trim().slice(0, 60), rect: rb },
            overlapPct: Math.round(overlapPct * 100),
            overlapArea: Math.round(inter),
          });
        }
      }

      // De-dup pairs by overlap area threshold + sort by severity
      const sorted = issues.sort((a, b) => b.overlapPct - a.overlapPct);
      return sorted.slice(0, 30);
    });

    findings[page].viewports[vp.name] = {
      png: png.replace(ROOT, '').replace(/\\/g, '/'),
      overlap_count: overlaps.length,
      overlaps,
    };

    await browserPage.close();
    await context.close();
  }
}

await browser.close();

writeFileSync(
  resolve(OUT, 'visual-audit-findings.json'),
  JSON.stringify(findings, null, 2)
);

// Print summary
console.log('Visual audit complete.');
let totalIssues = 0;
for (const page of Object.keys(findings)) {
  let pageIssues = 0;
  for (const vp of Object.keys(findings[page].viewports)) {
    pageIssues += findings[page].viewports[vp].overlap_count;
  }
  totalIssues += pageIssues;
  if (pageIssues > 0) console.log(`  ${page.padEnd(30)}: ${pageIssues} overlaps`);
}
console.log(`Total overlaps detected: ${totalIssues}`);
console.log(`Screenshots: ${OUT.replace(ROOT, '')}`);

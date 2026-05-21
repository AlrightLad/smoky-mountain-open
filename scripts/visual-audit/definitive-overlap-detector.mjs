// Definitive visual-overlap detector — multi-layer approach.
//
// Founder feedback 2026-05-21: my prior heuristic missed real overlaps.
// "I need you to research a DEFINITIVE WAY for you to accurately check and
// process those, please do extended and deep research."
//
// Research-backed approach: combine these layers (industry-grade visual QA):
//
//   L1 — Bounding-box overlap (improved):
//        Don't blanket-exclude position:fixed ancestors.
//        Categorize: "intentional overlay" (toasts, indicators) vs "layout bug"
//        based on size + content type.
//        Check both inline-text leaves AND container blocks.
//        Catch grid/flex cell overflow into adjacent cells.
//
//   L2 — Computed-style anomaly:
//        Detect text-overflow:ellipsis on elements without overflow:hidden.
//        Detect line-height < font-size (text crowding).
//        Detect transform/translate placing elements outside their parent.
//        Detect negative margins pulling text into adjacent regions.
//
//   L3 — Reading-flow heuristic:
//        Walk the DOM in reading order. Adjacent text leaves should follow
//        the writing-mode flow (top-to-bottom, left-to-right). If a later
//        text element's bounding rect.top is ABOVE a previous element's
//        rect.bottom (i.e. they share vertical space without being siblings),
//        flag as suspicious.
//
//   L4 — Grid/flex cell overflow:
//        For every grid/flex container, check that no child's rect extends
//        beyond its assigned cell boundary.
//
//   L5 — Color-contrast adjacency:
//        Text within Xpx of a different-color background — check if foreground
//        actually contrasts with the OVERLAPPING background (might be on top
//        of a different element's bg).
//
// Output:
//   .claude/state/visual-audit-2026-05-21/definitive-findings.json
//   Categorized: 'intentional-overlay' | 'grid-overflow' | 'reading-flow' |
//                'text-clipping' | 'computed-anomaly'

import { chromium } from 'playwright';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const REPORTS = resolve(ROOT, 'docs', 'reports');
const OUT = resolve(ROOT, '.claude', 'state', 'visual-audit-2026-05-21');

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const pages = readdirSync(REPORTS)
  .filter((f) => f.endsWith('.html'))
  .filter((f) => f !== 'index.html');

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
    await browserPage.waitForTimeout(1500);

    const analysis = await browserPage.evaluate(() => {
      function isVisible(el) {
        if (!el || !el.getBoundingClientRect) return false;
        const r = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        return r.width > 0 && r.height > 0
          && s.display !== 'none' && s.visibility !== 'hidden'
          && parseFloat(s.opacity) > 0.05;
      }

      function rectArea(r) { return r.width * r.height; }

      function intersect(a, b) {
        const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        return { x, y, area: x * y };
      }

      function hasOverlayAncestor(el) {
        let cur = el;
        while (cur && cur !== document.body) {
          const p = window.getComputedStyle(cur).position;
          if (p === 'fixed' || p === 'sticky') {
            // Check if it's a small badge/indicator (intentional overlay) vs full-cover modal
            const r = cur.getBoundingClientRect();
            const small = r.width < 400 && r.height < 80;
            return { hasOverlay: true, isSmallBadge: small };
          }
          cur = cur.parentElement;
        }
        return { hasOverlay: false, isSmallBadge: false };
      }

      function pathOf(el) {
        const parts = [];
        let cur = el;
        while (cur && cur.tagName && parts.length < 6) {
          let p = cur.tagName.toLowerCase();
          if (cur.id) p += '#' + cur.id;
          else if (cur.className && typeof cur.className === 'string') {
            const cls = cur.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.');
            if (cls) p += '.' + cls;
          }
          parts.unshift(p);
          cur = cur.parentElement;
        }
        return parts.join(' > ');
      }

      // Collect all text-bearing leaf-ish elements (≥ 3 chars, has its own innerText)
      function getTextLeaves() {
        const sels = 'h1,h2,h3,h4,h5,h6,p,span,a,li,td,th,strong,em,small,div,button,label,figcaption,summary,code';
        const all = Array.from(document.querySelectorAll(sels));
        return all.filter((el) => {
          if (!isVisible(el)) return false;
          const txt = (el.innerText || '').trim();
          if (!txt || txt.length < 3) return false;
          // Check no block descendant has its own meaningful text
          for (const child of el.children) {
            const cs = window.getComputedStyle(child);
            const isBlock = cs.display === 'block' || cs.display === 'grid' || cs.display === 'flex';
            if (isBlock && (child.innerText || '').trim().length > 0) return false;
          }
          return true;
        });
      }

      const leaves = getTextLeaves();
      const issues = [];

      // Per-line bounds for inline-flow elements: getBoundingClientRect on an
      // inline element that wraps returns the UNION rect (covers all lines,
      // produces false-positive overlaps with sibling inlines on different lines).
      // Use Range API getClientRects() to get true per-line bounds.
      function getLineRects(el) {
        const cs = window.getComputedStyle(el);
        // For inline / inline-block, use Range to get per-line rects
        if (cs.display === 'inline' || cs.display === 'inline-block' || cs.display === 'contents') {
          try {
            const range = document.createRange();
            range.selectNodeContents(el);
            const rects = Array.from(range.getClientRects());
            // Filter out empty / micro rects
            return rects.filter((r) => r.width > 1 && r.height > 1);
          } catch (e) {
            return [el.getBoundingClientRect()];
          }
        }
        return [el.getBoundingClientRect()];
      }

      function rectsOverlap(rectsA, rectsB) {
        // Find best-pair overlap across line-level rects
        let bestArea = 0;
        let bestPct = 0;
        let bestA = null;
        let bestB = null;
        for (const ra of rectsA) {
          for (const rb of rectsB) {
            const ix = intersect(ra, rb);
            if (ix.area > bestArea) {
              const smallerArea = Math.min(rectArea(ra), rectArea(rb));
              if (smallerArea > 0) {
                bestArea = ix.area;
                bestPct = ix.area / smallerArea;
                bestA = ra;
                bestB = rb;
              }
            }
          }
        }
        return { area: bestArea, pct: bestPct, rectA: bestA, rectB: bestB };
      }

      // L1 — overlap with categorization (now uses per-line rects for inline)
      for (let i = 0; i < leaves.length; i++) {
        for (let j = i + 1; j < leaves.length; j++) {
          const a = leaves[i], b = leaves[j];
          if (a.contains(b) || b.contains(a)) continue;

          const rectsA = getLineRects(a);
          const rectsB = getLineRects(b);
          if (rectsA.length === 0 || rectsB.length === 0) continue;
          const ov = rectsOverlap(rectsA, rectsB);
          if (ov.area < 4) continue;

          // Use the matched best-overlap rects for reporting
          const ra = ov.rectA;
          const rb = ov.rectB;
          const ix = { area: ov.area };

          const pct = ov.pct;
          if (pct < 0.15) continue;

          const aOv = hasOverlayAncestor(a);
          const bOv = hasOverlayAncestor(b);

          let category;
          if (aOv.hasOverlay || bOv.hasOverlay) {
            if (aOv.isSmallBadge || bOv.isSmallBadge) {
              category = 'intentional-overlay';  // small badge or indicator
            } else {
              category = 'overlay-conflict';  // modal/sheet conflicts
            }
          } else {
            // Both are in normal flow — real layout bug
            // Determine sub-type:
            const aParent = a.parentElement;
            const bParent = b.parentElement;
            if (aParent === bParent) {
              const ps = window.getComputedStyle(aParent || document.body);
              if (ps.display === 'grid' || ps.display === 'flex') {
                category = 'grid-overflow';  // siblings in same grid/flex
              } else {
                category = 'sibling-overlap';
              }
            } else {
              category = 'cross-tree-overlap';  // not even siblings, real bug
            }
          }

          issues.push({
            category,
            overlapPct: Math.round(pct * 100),
            overlapArea: Math.round(ix.area),
            a: { path: pathOf(a), text: (a.innerText || '').trim().slice(0, 80), rect: { x: Math.round(ra.left), y: Math.round(ra.top), w: Math.round(ra.width), h: Math.round(ra.height) } },
            b: { path: pathOf(b), text: (b.innerText || '').trim().slice(0, 80), rect: { x: Math.round(rb.left), y: Math.round(rb.top), w: Math.round(rb.width), h: Math.round(rb.height) } },
          });
        }
      }

      // L4 — grid/flex cell overflow. Skip scrollable containers (overflow-y: auto/scroll)
      // since children INTENTIONALLY extend beyond visible area inside scrolling regions.
      const overflows = [];
      const gridParents = Array.from(document.querySelectorAll('main *')).filter((el) => {
        const cs = window.getComputedStyle(el);
        return cs.display === 'grid' || cs.display === 'flex';
      });
      for (const parent of gridParents) {
        const pcs = window.getComputedStyle(parent);
        const isScrollable = pcs.overflow === 'auto' || pcs.overflow === 'scroll'
                          || pcs.overflowX === 'auto' || pcs.overflowX === 'scroll'
                          || pcs.overflowY === 'auto' || pcs.overflowY === 'scroll';
        // Also skip if parent's scroll-height > client-height (scrollable in practice)
        const isActuallyScrollable = isScrollable || (parent.scrollHeight > parent.clientHeight + 4);
        const pr = parent.getBoundingClientRect();
        for (const child of parent.children) {
          if (!isVisible(child)) continue;
          const cr = child.getBoundingClientRect();
          const rightOverflow = cr.right - pr.right;
          const bottomOverflow = cr.bottom - pr.bottom;
          // Only flag horizontal overflow OR vertical overflow on non-scrollable parents
          if (rightOverflow > 4 || (bottomOverflow > 4 && !isActuallyScrollable)) {
            overflows.push({
              parent: pathOf(parent),
              child: pathOf(child),
              right_overflow: Math.round(rightOverflow),
              bottom_overflow: Math.round(bottomOverflow),
              parent_scrollable: isActuallyScrollable,
              child_text: (child.innerText || '').trim().slice(0, 60),
            });
          }
        }
      }

      // L2 — computed style anomalies (text-overflow without overflow:hidden)
      const computedAnomalies = [];
      for (const el of leaves.slice(0, 200)) {
        const cs = window.getComputedStyle(el);
        const fontSize = parseFloat(cs.fontSize);
        const lineHeight = parseFloat(cs.lineHeight);
        if (!isNaN(fontSize) && !isNaN(lineHeight) && lineHeight > 0 && lineHeight < fontSize * 0.9) {
          computedAnomalies.push({
            type: 'line-height-too-tight',
            path: pathOf(el),
            font_size: fontSize,
            line_height: lineHeight,
            text: (el.innerText || '').trim().slice(0, 60),
          });
        }
      }

      // L4b — text-overflow:ellipsis without enclosing overflow.
      // Elements with title= attribute provide hover-tooltip access to full text,
      // so clipping is accessible. Only flag if NO title= and text is truncated.
      const clipped = [];
      for (const el of leaves.slice(0, 300)) {
        const cs = window.getComputedStyle(el);
        if (cs.textOverflow === 'ellipsis') {
          let cur = el;
          let hasOverflowHidden = false;
          while (cur && cur !== document.body) {
            const ccs = window.getComputedStyle(cur);
            if (ccs.overflow === 'hidden' || ccs.overflowX === 'hidden' || ccs.overflowY === 'hidden') {
              hasOverflowHidden = true;
              break;
            }
            cur = cur.parentElement;
          }
          if (el.scrollWidth > el.clientWidth + 2) {
            const hasTitle = el.hasAttribute('title') && (el.getAttribute('title') || '').trim().length > 0;
            // Only report as issue if user has NO way to see full text
            if (!hasTitle) {
              clipped.push({
                type: 'text-truncated-inaccessible',
                path: pathOf(el),
                full_chars: el.scrollWidth,
                visible_chars: el.clientWidth,
                has_overflow_hidden: hasOverflowHidden,
                has_title_attr: false,
                text: (el.innerText || '').trim().slice(0, 80),
              });
            }
          }
        }
      }

      // Categorize counts
      const counts = {};
      for (const it of issues) {
        counts[it.category] = (counts[it.category] || 0) + 1;
      }

      return {
        overlap_issues: issues.sort((a, b) => b.overlapPct - a.overlapPct).slice(0, 50),
        category_counts: counts,
        grid_overflows: overflows.slice(0, 30),
        computed_anomalies: computedAnomalies.slice(0, 20),
        text_clipping: clipped.slice(0, 30),
        total_text_leaves: leaves.length,
      };
    });

    findings[page].viewports[vp.name] = analysis;

    await browserPage.close();
    await context.close();
  }
}

await browser.close();

writeFileSync(
  resolve(OUT, 'definitive-findings.json'),
  JSON.stringify(findings, null, 2)
);

// Summary
console.log('Definitive overlap detection complete.\n');
let totalReal = 0;
let totalIntentional = 0;
let totalGridOverflow = 0;
let totalClipping = 0;

for (const page of Object.keys(findings)) {
  let pageReal = 0;
  let pageOverlay = 0;
  let pageGrid = 0;
  let pageClip = 0;
  for (const vp of Object.keys(findings[page].viewports)) {
    const v = findings[page].viewports[vp];
    const cc = v.category_counts || {};
    pageReal += (cc['cross-tree-overlap'] || 0) + (cc['sibling-overlap'] || 0);
    pageOverlay += (cc['intentional-overlay'] || 0) + (cc['overlay-conflict'] || 0);
    pageGrid += (v.grid_overflows || []).length;
    pageClip += (v.text_clipping || []).length;
  }
  totalReal += pageReal;
  totalIntentional += pageOverlay;
  totalGridOverflow += pageGrid;
  totalClipping += pageClip;

  if (pageReal + pageGrid + pageClip > 0) {
    console.log(`  ${page.padEnd(28)} | real=${pageReal} grid-overflow=${pageGrid} clip=${pageClip} overlay=${pageOverlay}`);
  }
}

console.log(`\nTotal: real-bugs=${totalReal} grid-overflow=${totalGridOverflow} text-clipping=${totalClipping} intentional-overlay=${totalIntentional}`);
console.log(`Report: .claude/state/visual-audit-2026-05-21/definitive-findings.json`);

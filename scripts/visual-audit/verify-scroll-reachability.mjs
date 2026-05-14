#!/usr/bin/env node
/*
 * scripts/visual-audit/verify-scroll-reachability.mjs
 *
 * Behavior test (not just structure): for every scrollable surface
 * the team ships, verify the LAST item is reachable + visible after
 * scrolling to the bottom of its container.
 *
 * Authored 2026-05-14 per Founder directive after iter 7 shipped
 * with main-flows.html rail scroll bar blocking visibility past F58.
 * Sentinels verified all 62 items were in the DOM but never verified
 * a user could actually SEE all 62 by scrolling.
 *
 * Usage:
 *   node scripts/visual-audit/verify-scroll-reachability.mjs
 *
 * Exit code:
 *   0 — all surfaces pass
 *   1 — any surface fails (last item not visible after scroll)
 *
 * Each surface spec:
 *   - file:       html file under docs/reports/
 *   - viewport:   { width, height } for the render
 *   - prepare:    optional async function to make the surface
 *                 scrollable (apply filter, expand section, etc)
 *   - container:  selector for the scrollable container
 *   - lastItem:   selector for the item that MUST be visible after
 *                 scrolling container to its bottom
 *   - capture:    optional path under .claude/state for the
 *                 evidence screenshot (relative to repo root)
 */

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");
const REPORTS_DIR = resolve(REPO_ROOT, "docs", "reports");

const SURFACES = [
    {
        name: "main-flows rail (62 flows)",
        file: "main-flows.html",
        viewport: { width: 1920, height: 1080 },
        // Inner-scroller: the rail list itself, not the page body.
        scrollKind: "inner",
        container: ".mf-flows-list",
        lastItemSelector: ".mf-flows-list .mf-flows-item:last-child",
        captureClipSelector: ".mf-rail",
        capturePath: ".claude/state/main-flows-v2/iter-8-rail-bottom.png",
        expectedItemText: "F62",
    },
    {
        name: "dashboard recent ships table",
        file: "dashboard.html",
        viewport: { width: 1920, height: 1080 },
        scrollKind: "page",
        lastItemSelector: '#recent-ships-table tbody tr:last-child',
        capturePath: ".claude/state/main-flows-v2/iter-8-dashboard-bottom.png",
        captureClipSelector: '#recent-ships-table',
    },
    {
        name: "amendments applied list",
        file: "amendments.html",
        viewport: { width: 1920, height: 1080 },
        scrollKind: "page",
        lastItemSelector: '#applied-list > *:last-child',
        capturePath: ".claude/state/main-flows-v2/iter-8-amendments-bottom.png",
        // Capture a chunk near the last item via a viewport screenshot
        // after scroll rather than a clip selector.
        captureClipSelector: null,
    },
    {
        name: "proposals shipped list",
        file: "proposals.html",
        viewport: { width: 1920, height: 1080 },
        scrollKind: "page",
        prepare: async (page) => {
            // The Shipped section lives inside a <details>; expand all
            // <details> on the page so the last child is in the layout.
            await page.evaluate(() => {
                document.querySelectorAll("details").forEach(d => { d.open = true; });
            });
        },
        lastItemSelector: '#proposal-list-shipped > *:last-child',
        capturePath: ".claude/state/main-flows-v2/iter-8-proposals-bottom.png",
        captureClipSelector: null,
    },
    {
        name: "escalations applied list",
        file: "escalations.html",
        viewport: { width: 1920, height: 1080 },
        scrollKind: "page",
        lastItemSelector: '#applied-list > *:last-child',
        capturePath: ".claude/state/main-flows-v2/iter-8-escalations-bottom.png",
        captureClipSelector: null,
    },
];

async function checkSurface(browser, surface) {
    const ctx = await browser.newContext({
        viewport: surface.viewport,
        deviceScaleFactor: 1,
        colorScheme: "dark",
    });
    const page = await ctx.newPage();
    const fileUrl = pathToFileURL(resolve(REPORTS_DIR, surface.file)).toString();

    const result = { surface: surface.name, file: surface.file, ok: false, details: {} };

    try {
        await page.goto(fileUrl, { waitUntil: "load", timeout: 15000 });
        await page.waitForTimeout(1500); // let JS render

        // Default prepare for page-scroll surfaces: expand all <details>
        // so collapsed archive sections (e.g. amendments applied, props
        // shipped) participate in layout. Surface-specific prepare runs
        // after.
        if (surface.scrollKind === "page") {
            await page.evaluate(() => {
                document.querySelectorAll("details").forEach(d => { d.open = true; });
            });
            await page.waitForTimeout(300);
        }
        if (surface.prepare) {
            await surface.prepare(page);
            await page.waitForTimeout(500);
        }

        // For inner-scroller surfaces, the container must exist.
        if (surface.scrollKind === "inner") {
            const containerCount = await page.locator(surface.container).count();
            if (containerCount === 0) {
                result.details.error = `inner-scroll container '${surface.container}' not found`;
                return result;
            }
        }

        // Check the last item exists
        const lastItem = page.locator(surface.lastItemSelector).first();
        const lastItemCount = await lastItem.count();
        if (lastItemCount === 0) {
            if (surface.optional) {
                result.details.skipped = `last-item selector did not match (optional surface)`;
                result.ok = true;
                return result;
            }
            result.details.error = `last item '${surface.lastItemSelector}' not found`;
            return result;
        }

        // Scroll to the last item. Strategy depends on scrollKind:
        //  - "inner": set the named inner container's scrollTop to its
        //    scrollHeight, then scrollIntoView for any nested containers.
        //  - "page": compute the item's absolute Y via getBoundingClientRect
        //    + window.scrollY, then window.scrollTo to align it near the
        //    viewport bottom. scrollIntoView is unreliable when the
        //    document has nested scroll containers (e.g. <details>).
        await page.evaluate(({ scrollKind, container, lastItemSelector }) => {
            const item = document.querySelector(lastItemSelector);
            if (!item) return;
            if (scrollKind === "inner" && container) {
                const c = document.querySelector(container);
                if (c) c.scrollTop = c.scrollHeight;
                if (item.scrollIntoView) item.scrollIntoView({ block: "end", behavior: "instant" });
            } else {
                // page-scroll: explicit window.scrollTo using absolute Y.
                const rect = item.getBoundingClientRect();
                const absoluteY = rect.top + window.scrollY;
                const targetScroll = absoluteY - (window.innerHeight - rect.height - 40);
                window.scrollTo({ top: Math.max(0, targetScroll), behavior: "instant" });
            }
        }, { scrollKind: surface.scrollKind, container: surface.container, lastItemSelector: surface.lastItemSelector });

        await page.waitForTimeout(600); // scroll settles + reflow

        // Now check the last item's visibility. We require the item to
        // be at least 50% visible vertically in the viewport — this
        // catches the F62-style "30px visible, scrollbar overlay covers
        // the rest" failure that a simple bounding-rect intersection
        // misses.
        const visibility = await page.evaluate(({ lastItemSelector }) => {
            const item = document.querySelector(lastItemSelector);
            if (!item) return { ok: false, reason: "item gone after scroll" };
            const rect = item.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const visTop = Math.max(0, rect.top);
            const visBottom = Math.min(vh, rect.bottom);
            const visHeight = Math.max(0, visBottom - visTop);
            const pctVisible = rect.height > 0 ? visHeight / rect.height : 0;
            const fullyVisible = (
                rect.top >= 0 &&
                rect.bottom <= vh &&
                rect.left >= 0 &&
                rect.right <= vw
            );
            return {
                ok: fullyVisible || pctVisible >= 0.5,
                fullyVisible,
                pctVisible: Math.round(pctVisible * 100) / 100,
                rect: { top: Math.round(rect.top), bottom: Math.round(rect.bottom), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width), height: Math.round(rect.height) },
                viewport: { width: vw, height: vh },
                text: (item.textContent || "").trim().slice(0, 120),
            };
        }, { lastItemSelector: surface.lastItemSelector });

        result.details.visibility = visibility;

        // Optional: verify the text matches expected
        if (surface.expectedItemText && !visibility.text.includes(surface.expectedItemText)) {
            result.details.error = `last item text '${visibility.text}' does not include expected '${surface.expectedItemText}'`;
            return result;
        }

        result.ok = !!visibility.ok;
        if (!result.ok) {
            result.details.error = visibility.reason || `last item NOT in viewport — rect=${JSON.stringify(visibility.rect)}, viewport=${JSON.stringify(visibility.viewport)}`;
        }

        // Capture evidence screenshot if requested
        if (surface.capturePath) {
            const outPath = resolve(REPO_ROOT, surface.capturePath);
            await mkdir(dirname(outPath), { recursive: true });
            const clipEl = surface.captureClipSelector ? page.locator(surface.captureClipSelector).first() : null;
            if (clipEl && (await clipEl.count())) {
                await clipEl.screenshot({ path: outPath });
            } else {
                await page.screenshot({ path: outPath, fullPage: false });
            }
            result.details.evidence = surface.capturePath;
        }
    } catch (err) {
        result.details.error = err.message;
    } finally {
        await ctx.close();
    }
    return result;
}

async function main() {
    const browser = await chromium.launch();
    const results = [];
    for (const surface of SURFACES) {
        const r = await checkSurface(browser, surface);
        results.push(r);
    }
    await browser.close();

    const failures = results.filter(r => !r.ok && !r.details.skipped);
    const passes = results.filter(r => r.ok && !r.details.skipped);
    const skips = results.filter(r => r.details.skipped);

    console.log(`\n[scroll-reachability] ${passes.length} pass / ${failures.length} fail / ${skips.length} skip`);
    for (const r of results) {
        const status = r.details.skipped ? "SKIP" : (r.ok ? "PASS" : "FAIL");
        console.log(`  [${status}] ${r.surface}`);
        if (r.details.skipped) console.log(`         ${r.details.skipped}`);
        if (r.details.error) console.log(`         ${r.details.error}`);
        if (r.details.evidence) console.log(`         evidence: ${r.details.evidence}`);
        if (r.ok && r.details.visibility) {
            const v = r.details.visibility;
            console.log(`         last-item rect: top=${Math.round(v.rect.top)} bottom=${Math.round(v.rect.bottom)} (viewport h=${v.viewport.height}); fully-visible=${v.fullyVisible}`);
        }
    }

    if (failures.length > 0) {
        console.error(`\n[scroll-reachability] FAIL: ${failures.length} surface(s) have unreachable last item`);
        process.exit(1);
    }
    console.log(`\n[scroll-reachability] OK: all required surfaces pass`);
}

main().catch(err => { console.error(err); process.exit(2); });

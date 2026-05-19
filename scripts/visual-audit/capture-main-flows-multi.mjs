#!/usr/bin/env node
/*
 * scripts/visual-audit/capture-main-flows-multi.mjs
 *
 * Extension of capture-main-flows.mjs that captures PARBAUGHS at multiple
 * flow selection states for per-frame comparison against the 12 Janowiak
 * reference frames. Per Founder M5 reckoning (2026-05-19): each anchor
 * frame must be visually compared side-by-side with its Janowiak peer.
 *
 * Anchor mapping:
 *   frame-01 (Janowiak F1 selected, t0.5s) → PARBAUGHS F1 selected
 *   frame-04 (Janowiak F3 selected, t4.5s) → PARBAUGHS F4 selected (mid)
 *   frame-07 (Janowiak F5 selected, t9.0s) → PARBAUGHS F7 selected (later)
 *   frame-12 (Janowiak F1 loop-end, t17.5s) → PARBAUGHS F1 (loop-end)
 *
 * Writes:
 *   pb-anchor-F1.png   — F1 selected, full page
 *   pb-anchor-F4.png   — F4 selected, full page
 *   pb-anchor-F7.png   — F7 selected, full page
 *   pb-anchor-F1b.png  — F1 selected (re-trigger to capture stagger), full page
 *
 * Each also gets a viewport-clipped variant for above-the-fold framing.
 */

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");
const PAGE_PATH = resolve(REPO_ROOT, "docs", "reports", "main-flows.html");
const OUT_DIR = resolve(REPO_ROOT, ".claude", "state", "main-flows-v2");

const VIEWPORT = { width: 1920, height: 1080 };
const ANCHOR_FLOWS = ["F1", "F4", "F7", "F1"]; // 4th iteration is loop-back
const ANCHOR_LABELS = ["F1", "F4", "F7", "F1b"];

async function captureFlow(page, flowId, label) {
    // Click the rail item for this flow.
    const flowItem = page.locator(`.mf-flows-item[data-flow-id="${flowId}"]`);
    if (!(await flowItem.count())) {
        console.log(`[capture-multi] flow ${flowId} NOT FOUND in rail; skipping`);
        return;
    }
    await flowItem.click();
    // M5 path-draw stagger: assume up to 7 steps × 30ms + 220ms duration +
    // badge 160ms + 140ms badge-delay = ~640ms worst-case. Wait 1100ms.
    await page.waitForTimeout(1100);

    // Full-page capture
    await page.screenshot({
        path: resolve(OUT_DIR, `pb-anchor-${label}.png`),
        fullPage: true,
    });

    // Viewport capture (above-the-fold)
    await page.screenshot({
        path: resolve(OUT_DIR, `pb-anchor-${label}-viewport.png`),
        fullPage: false,
    });

    console.log(`[capture-multi] captured ${flowId} as ${label}`);
}

async function main() {
    await mkdir(OUT_DIR, { recursive: true });
    console.log(`[capture-multi] viewport: ${VIEWPORT.width}x${VIEWPORT.height}`);

    const browser = await chromium.launch();
    const ctx = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: 1,
        colorScheme: "dark",
    });
    const page = await ctx.newPage();
    const fileUrl = pathToFileURL(PAGE_PATH).toString();

    try {
        await page.goto(fileUrl, { waitUntil: "load", timeout: 20000 });
        await page.waitForTimeout(800);

        for (let i = 0; i < ANCHOR_FLOWS.length; i++) {
            const flowId = ANCHOR_FLOWS[i];
            const label = ANCHOR_LABELS[i];
            // For the loop-back (F1b), force re-click by first clicking F2 (to
            // deselect F1) — but F2 may not have a path. Use the rail-clear
            // button instead. For simpler logic: click a different flow first,
            // then click F1 again so we re-trigger the staggered animation.
            if (label === "F1b") {
                // Click F2 first to reset, then F1 again
                const second = page.locator('.mf-flows-item[data-flow-id="F2"]');
                if (await second.count()) {
                    await second.click();
                    await page.waitForTimeout(400);
                }
            }
            await captureFlow(page, flowId, label);
        }
    } finally {
        await browser.close();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

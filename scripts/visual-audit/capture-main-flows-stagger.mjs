#!/usr/bin/env node
/*
 * scripts/visual-audit/capture-main-flows-stagger.mjs
 *
 * Capture PARBAUGHS at MID-animation states to verify the staggered draw-
 * through is visible. Per Founder M5 reckoning: "verify the staggered
 * cascade IS visible". If the capture timing or animation duration is
 * wrong, this won't match the video feel.
 *
 * Strategy: click F2 then click F1 to retrigger the animation. Capture at
 * multiple timestamps mid-cycle.
 *
 * Writes:
 *   pb-stagger-t100.png  — 100ms after F1 click
 *   pb-stagger-t250.png  — 250ms after F1 click
 *   pb-stagger-t400.png  — 400ms after F1 click
 *   pb-stagger-t600.png  — 600ms after F1 click
 *   pb-stagger-t1000.png — 1000ms (animation should be complete)
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
const TIMESTAMPS = [100, 250, 400, 600, 1000];

async function main() {
    await mkdir(OUT_DIR, { recursive: true });
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
        await page.waitForTimeout(1200);

        // Click F2 to reset
        const f2 = page.locator(".mf-flows-item[data-flow-id='F2']");
        if (await f2.count()) {
            await f2.click();
            await page.waitForTimeout(1100);
        }

        // Now click F1 and capture at multiple timestamps
        const f1 = page.locator(".mf-flows-item[data-flow-id='F1']");
        // Start capturing — F1 click is the t=0 reference
        const start = Date.now();
        await f1.click();

        for (const t of TIMESTAMPS) {
            const elapsed = Date.now() - start;
            const wait = Math.max(0, t - elapsed);
            if (wait > 0) await page.waitForTimeout(wait);
            await page.screenshot({
                path: resolve(OUT_DIR, `pb-stagger-t${t}.png`),
                clip: { x: 140, y: 60, width: 1280, height: 600 },
            });
            console.log(`[capture-stagger] captured t=${t}ms (real=${Date.now() - start}ms)`);
        }
    } finally {
        await browser.close();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

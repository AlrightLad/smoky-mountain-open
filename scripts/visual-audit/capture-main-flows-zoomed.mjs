#!/usr/bin/env node
/*
 * scripts/visual-audit/capture-main-flows-zoomed.mjs
 *
 * Zoomed captures of specific node clusters in PARBAUGHS main-flows.html so
 * we can verify active-fill, border, arrow stroke, and badge styling are
 * rendering close to Janowiak at the per-pixel level.
 *
 * Writes:
 *   pb-zoom-cluster-active.png  — 800x500 crop of the F1 active-path cluster
 *   pb-zoom-cluster-edge.png    — 800x500 crop of an arrow + badge
 *   pb-zoom-rail.png            — 460x900 crop of the rail
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
        await page.waitForTimeout(1500);

        // Click F1 to render path
        await page.locator(".mf-flows-item[data-flow-id='F1']").click();
        await page.waitForTimeout(1100);

        // Cluster active capture — left-half of the grid where lit nodes cluster
        await page.screenshot({
            path: resolve(OUT_DIR, "pb-zoom-cluster-active.png"),
            clip: { x: 140, y: 60, width: 800, height: 500 },
        });

        // Edge capture — focus on arrow + badge mid-area
        await page.screenshot({
            path: resolve(OUT_DIR, "pb-zoom-cluster-edge.png"),
            clip: { x: 200, y: 60, width: 600, height: 300 },
        });

        // Rail capture
        await page.screenshot({
            path: resolve(OUT_DIR, "pb-zoom-rail.png"),
            clip: { x: 1410, y: 0, width: 460, height: 900 },
        });

        console.log("[capture-zoomed] wrote pb-zoom-cluster-active.png, pb-zoom-cluster-edge.png, pb-zoom-rail.png");
    } finally {
        await browser.close();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

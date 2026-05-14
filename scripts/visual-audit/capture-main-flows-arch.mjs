#!/usr/bin/env node
/*
 * Companion to capture-main-flows.mjs: capture JUST the architecture-diagram
 * region at 1920x1080 with flow F1 selected, so SVG arrows + path highlight
 * are visible at full resolution. Output goes to .claude/state/main-flows-v2/.
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

(async () => {
    await mkdir(OUT_DIR, { recursive: true });
    const browser = await chromium.launch();
    const ctx = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(PAGE_PATH).toString(), { waitUntil: "load" });
    await page.waitForTimeout(600);
    // Click F1
    const firstFlow = page.locator(".mf-flows-item").first();
    await firstFlow.click();
    await page.waitForTimeout(500);

    // Locate the architecture section heading + workspace, clip from heading top
    // through workspace bottom + a small margin.
    const archHeader = page.locator(".pb-section-title").first();
    const archWorkspace = page.locator(".mf-workspace");
    const headerBox = await archHeader.boundingBox();
    const wsBox = await archWorkspace.boundingBox();
    if (!headerBox || !wsBox) {
        console.error("Could not locate header/workspace");
        process.exit(1);
    }
    const top = Math.max(0, headerBox.y - 12);
    const height = (wsBox.y + wsBox.height) - top + 24;

    await page.screenshot({
        path: resolve(OUT_DIR, "current-render-arch-only-F1.png"),
        clip: { x: 0, y: top, width: 1920, height: Math.min(height, 4000) },
    });
    console.log(`[arch-F1] clip top=${top.toFixed(0)} height=${height.toFixed(0)}`);
    await browser.close();
})();

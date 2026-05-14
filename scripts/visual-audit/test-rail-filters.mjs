#!/usr/bin/env node
import { chromium } from "playwright";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");
const PAGE_PATH = resolve(REPO_ROOT, "docs", "reports", "main-flows.html");

(async () => {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(PAGE_PATH).toString(), { waitUntil: "load" });
    await page.waitForTimeout(600);

    const count = (sel) => page.evaluate((s) => document.querySelectorAll(s).length, sel);
    const visibleRailCount = () => page.evaluate(() =>
        document.querySelectorAll('#mf-flows-list .mf-flows-item:not(.is-hidden)').length
    );
    const countMeta = () => page.evaluate(() => document.getElementById('mf-flows-count').textContent);

    const results = [];

    // Baseline
    results.push({ test: "baseline (no filter)", visible: await visibleRailCount(), meta: await countMeta() });

    // Test 1: Search "round"
    await page.fill('#mf-rail-search', 'round');
    await page.waitForTimeout(200);
    results.push({ test: "search='round'", visible: await visibleRailCount(), meta: await countMeta() });

    // Reset search
    await page.fill('#mf-rail-search', '');
    await page.waitForTimeout(200);

    // Test 2: Tier = core
    await page.click('.mf-rail-chips[data-axis="tier"] .mf-rail-chip[data-tier="core"]');
    await page.waitForTimeout(200);
    results.push({ test: "tier=core", visible: await visibleRailCount(), meta: await countMeta() });

    // Test 3: Tier = admin
    await page.click('.mf-rail-chips[data-axis="tier"] .mf-rail-chip[data-tier="admin"]');
    await page.waitForTimeout(200);
    results.push({ test: "tier=admin", visible: await visibleRailCount(), meta: await countMeta() });

    // Test 4: Actor = founder + tier = admin (compound)
    await page.click('.mf-rail-chips[data-axis="actor"] .mf-rail-chip[data-actor="founder"]');
    await page.waitForTimeout(200);
    results.push({ test: "actor=founder + tier=admin", visible: await visibleRailCount(), meta: await countMeta() });

    // Reset all
    await page.click('.mf-rail-chips[data-axis="actor"] .mf-rail-chip[data-actor=""]');
    await page.click('.mf-rail-chips[data-axis="tier"] .mf-rail-chip[data-tier=""]');
    await page.waitForTimeout(200);
    results.push({ test: "reset", visible: await visibleRailCount(), meta: await countMeta() });

    console.log(JSON.stringify(results, null, 2));
    await browser.close();
})();

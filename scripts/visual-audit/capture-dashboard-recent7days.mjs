#!/usr/bin/env node
// Targeted capture of the Recent 7 Days graph section on dashboard.html
import { chromium } from "playwright";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname } from "node:path";
import { mkdir } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", "..");
const url = pathToFileURL(resolve(REPO, "docs/reports/dashboard.html")).toString();
const outDir = resolve(REPO, ".claude", "state", "main-flows-v2", "founder-real-context", "dashboard-recent7days-" + Date.now());
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(2000);

// Find the Recent 7 Days section
const sectionExists = await page.evaluate(() => {
    // Search by header text
    const headers = Array.from(document.querySelectorAll("h2, h3, .pb-section-title"));
    const r7 = headers.find(h => /recent.*7.*day|7.day.*activity/i.test(h.textContent));
    if (!r7) return null;
    r7.scrollIntoView({ block: "start" });
    return { found: true, text: r7.textContent.trim() };
});

console.log("section:", sectionExists);
if (sectionExists) {
    await page.waitForTimeout(500);
    await page.screenshot({ path: resolve(outDir, "recent-7days-from-top.png"), fullPage: false });

    // Also capture just the chart area
    const chartHandle = await page.locator(".recent-7days-charts").first();
    if (await chartHandle.count()) {
        await chartHandle.screenshot({ path: resolve(outDir, "recent-7days-charts-only.png") });

        // Inspect the legend swatches + their computed colors
        const legendInfo = await page.evaluate(() => {
            const swatches = Array.from(document.querySelectorAll(".r7-legend-swatch"));
            return swatches.map(s => {
                const cs = window.getComputedStyle(s);
                const parent = s.closest(".r7-legend") || s.parentElement;
                const label = (s.nextSibling?.textContent || s.parentElement?.textContent || "").trim();
                return {
                    class: s.className,
                    bgColor: cs.backgroundColor,
                    label: label.slice(0, 60),
                };
            });
        });
        console.log("\nLegend swatches:");
        console.log(JSON.stringify(legendInfo, null, 2));
    }
}

console.log("\noutput:", outDir);
await browser.close();

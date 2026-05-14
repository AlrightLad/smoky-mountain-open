#!/usr/bin/env node
// Verify the rail's max-height is STABLE across scroll positions.
// Iter 13 bug: scroll position changed rail.top → JS recomputed maxH → visible jitter.
import { chromium } from "playwright";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", "..");
const url = pathToFileURL(resolve(REPO, "docs/reports/main-flows.html")).toString();

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(1500);

const positions = [0, 300, 600, 900, 1200];
const measurements = [];
for (const sy of positions) {
    await page.evaluate(target => window.scrollTo({ top: target, behavior: "instant" }), sy);
    await page.waitForTimeout(300);
    const m = await page.evaluate(() => {
        const rail = document.querySelector(".mf-rail");
        const list = document.querySelector(".mf-flows-list");
        const r = rail.getBoundingClientRect();
        const l = list.getBoundingClientRect();
        return {
            scrollY: window.scrollY,
            railTop: Math.round(r.top),
            railHeight: Math.round(r.height),
            railMaxHeightStyle: rail.style.maxHeight,
            listHeight: Math.round(l.height),
            listMaxHeightStyle: list.style.maxHeight,
        };
    });
    measurements.push(m);
}

console.log("Rail stability across scroll positions:");
console.log("");
console.log("scrollY | railTop | railHeight | railMaxH(style) | listHeight | listMaxH(style)");
console.log("--------|---------|------------|-----------------|------------|----------------");
for (const m of measurements) {
    console.log(`${String(m.scrollY).padEnd(7)} | ${String(m.railTop).padEnd(7)} | ${String(m.railHeight).padEnd(10)} | ${m.railMaxHeightStyle.padEnd(15)} | ${String(m.listHeight).padEnd(10)} | ${m.listMaxHeightStyle}`);
}

// PASS criterion: railMaxHeightStyle is identical across all measurements
const styles = new Set(measurements.map(m => m.railMaxHeightStyle));
const stable = styles.size === 1;
console.log("");
console.log(`Distinct rail.style.maxHeight values across ${positions.length} scroll positions: ${styles.size}`);
console.log(`Stability: ${stable ? "✓ STABLE (same maxH at every scroll position)" : "✗ JITTER (maxH changes with scroll)"}`);

await browser.close();
process.exit(stable ? 0 : 1);

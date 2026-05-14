#!/usr/bin/env node
// Verify that clicking ANY of the 62 flows in the rail lights up the diagram
// (path highlighted, steps populated). After iter 16 path generation, every
// flow should have full interaction — previously F9-F62 showed "step path
// not yet authored" placeholder.
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
await page.waitForTimeout(2000);

// Get the count of flow items in the rail
const railCount = await page.locator(".mf-flows-list .mf-flows-item").count();
console.log(`Rail has ${railCount} flow items`);

// Sample a few flows from each tier and verify clicking lights up the diagram
const sampleIds = ["F1", "F5", "F9", "F15", "F22", "F30", "F38", "F45", "F55", "F62"];
let pass = 0, fail = 0;
for (const fid of sampleIds) {
    const li = page.locator(`.mf-flows-list .mf-flows-item[data-flow-id="${fid}"]`).first();
    if (await li.count() === 0) {
        console.log(`  [FAIL] ${fid}: rail item not found`);
        fail++;
        continue;
    }
    await li.scrollIntoViewIfNeeded();
    await li.click();
    await page.waitForTimeout(400);

    const state = await page.evaluate(() => {
        const grid = document.querySelector(".mf-grid");
        const stepsList = document.querySelector(".mf-steps-list");
        const stepsEmpty = document.querySelector(".mf-steps-empty");
        return {
            gridHasSelection: grid?.classList.contains("has-selection") || false,
            stepsListHidden: stepsList?.hasAttribute("hidden") || false,
            stepsCount: stepsList ? stepsList.children.length : 0,
            stepsEmptyHidden: stepsEmpty ? (stepsEmpty.hasAttribute("hidden") || window.getComputedStyle(stepsEmpty).display === "none") : true,
            stepsListContent: stepsList ? (stepsList.textContent || "").slice(0, 80) : "",
        };
    });

    const lit = state.gridHasSelection && state.stepsCount > 0;
    const status = lit ? "PASS" : "FAIL";
    console.log(`  [${status}] ${fid}: gridHasSelection=${state.gridHasSelection} stepsCount=${state.stepsCount}`);
    if (lit) pass++; else fail++;
}

console.log(`\n${pass}/${sampleIds.length} sample flows light up the diagram correctly.`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
